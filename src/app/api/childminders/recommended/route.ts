import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/childminders/recommended
 * 
 * Returns recommended childminders based on parent's preferences and matching criteria
 * Such as location, children age groups, and availability
 */
export async function GET(request: Request) {
  try {
    // Get current user session for authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a parent
    if (session.user.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can view recommended childminders' },
        { status: 403 }
      );
    }

    // Get parent ID from session
    const parentId = session.user.id;

    // Get parent profile
    const parent = await prisma.user.findUnique({
      where: {
        id: parentId,
      },
      select: {
        id: true,
        location: true,
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent profile not found' },
        { status: 404 }
      );
    }

    // Get parent's children to determine age groups
    const parentChildren = await prisma.child.findMany({
      where: {
        parentId,
      },
      select: {
        id: true,
        age: true,
      }
    });

    // Build the where clause for filtering childminders
    const where: Prisma.UserWhereInput = {
      role: 'childminder',
    };

    // If parent has location, prioritize childminders in same area
    if (parent.location) {
      // Extract first part of location (usually postal code or area)
      const locationParts = parent.location.split(',')[0].trim();
      where.location = {
        contains: locationParts,
      };
    }

    // Extract age groups based on children's ages
    let ageGroups: string[] = [];
    if (parentChildren.length > 0) {
      parentChildren.forEach(child => {
        if (child.age <= 1) ageGroups.push('infant');
        else if (child.age <= 4) ageGroups.push('toddler');
        else if (child.age <= 8) ageGroups.push('preschool');
        else if (child.age <= 12) ageGroups.push('schoolAge');
        else ageGroups.push('teenager');
      });

      // Remove duplicates
      ageGroups = [...new Set(ageGroups)];
    }

    // Get highly rated childminders who match criteria
    const childminders = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        bio: true,
        image: true,
        location: true,
        rate: true,
        yearsOfExperience: true,
        ageGroupsServed: true,
        languagesSpoken: true,
        firstAidCert: true,
        childrenFirstCert: true,
        gardaVetted: true,
        tuslaRegistered: true,
        specialNeedsExp: true,
        mealsProvided: true,
        pickupDropoff: true,
        RecurringAvailability: {
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
        Review_Review_revieweeIdToUser: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: [
        { yearsOfExperience: 'desc' },  // Prioritize experienced childminders
        { createdAt: 'desc' },          // Then newer profiles
      ],
      take: 10, // Get more than we need so we can filter and rank them
    });

    // Calculate average rating and format data
    const formattedChildminders = childminders.map(childminder => {
      // Calculate average rating
      const ratings = childminder.Review_Review_revieweeIdToUser.map(review => review.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      // Calculate a match score based on criteria
      let matchScore = 0;
      
      // Certifications increase match score
      if (childminder.firstAidCert) matchScore += 2;
      if (childminder.gardaVetted) matchScore += 3;
      if (childminder.tuslaRegistered) matchScore += 3;
      if (childminder.childrenFirstCert) matchScore += 2;
      
      // Experience increases match score
      if (childminder.yearsOfExperience) {
        matchScore += Math.min(childminder.yearsOfExperience, 10) / 2; // Up to 5 points for experience
      }

      // Higher rating increases match score
      matchScore += averageRating;

      // Age group matching increases score
      if (ageGroups.length > 0 && childminder.ageGroupsServed) {
        // Check if childminder's ageGroupsServed is not null and is an array
        const childminderAgeGroups = Array.isArray(childminder.ageGroupsServed) 
          ? childminder.ageGroupsServed as string[]
          : typeof childminder.ageGroupsServed === 'object' && childminder.ageGroupsServed !== null
            ? Object.values(childminder.ageGroupsServed as Record<string, string>)
            : [];
            
        const matchingAgeGroups = ageGroups.filter(age => 
          childminderAgeGroups.includes(age)
        );
        
        matchScore += matchingAgeGroups.length * 2; // 2 points per matching age group
      }

      return {
        id: childminder.id,
        name: childminder.name,
        bio: childminder.bio,
        image: childminder.image,
        location: childminder.location,
        rate: childminder.rate,
        yearsOfExperience: childminder.yearsOfExperience,
        ageGroupsServed: childminder.ageGroupsServed,
        languagesSpoken: childminder.languagesSpoken,
        certifications: {
          firstAidCert: childminder.firstAidCert,
          childrenFirstCert: childminder.childrenFirstCert,
          gardaVetted: childminder.gardaVetted,
          tuslaRegistered: childminder.tuslaRegistered,
        },
        specialNeedsExp: childminder.specialNeedsExp,
        mealsProvided: childminder.mealsProvided,
        pickupDropoff: childminder.pickupDropoff,
        availability: childminder.RecurringAvailability,
        averageRating,
        reviewCount: ratings.length,
        matchScore, // Include the match score for debugging
      };
    });

    // Sort by match score and get top recommendations
    const recommendedChildminders = formattedChildminders
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3); // Return only top 3 recommendations

    // Return the recommended childminders
    return NextResponse.json({
      data: recommendedChildminders,
    });
  } catch (error) {
    console.error('Error in childminder recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommended childminders' },
      { status: 500 }
    );
  }
} 