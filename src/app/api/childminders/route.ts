import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/childminders
 * 
 * Returns all available childminders
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

    // Get all childminders
    const childminders = await prisma.user.findMany({
      where: {
        role: 'childminder',
      },
      select: {
        id: true,
        name: true,
        bio: true,
        profileImage: true,
        location: true,
        rate: true,
        yearsOfExperience: true,
        availability: true,
        ageGroupsServed: true,
        languagesSpoken: true,
        careTypes: true,
        gardaVetted: true,
        firstAidCert: true,
        childrenFirstCert: true,
        tuslaRegistered: true,
        specialNeedsExp: true,
        mealsProvided: true,
        pickupDropoff: true,
        RecurringAvailability: {
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          }
        },
        Review_Review_revieweeIdToUser: {
          select: {
            rating: true,
            comment: true,
            createdAt: true,
            reviewerId: true,
            User_Review_reviewerIdToUser: {
              select: {
                name: true,
                profileImage: true,
              }
            }
          }
        }
      },
    }) as any; // Use type assertion to bypass TS errors for now

    // Format the response
    const formattedChildminders = childminders.map((childminder: any) => {
      // Calculate average rating
      const ratings = childminder.Review_Review_revieweeIdToUser.map((review: any) => review.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : 0;

      // Format reviews
      const reviews = childminder.Review_Review_revieweeIdToUser.map((review: any) => ({
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        reviewer: {
          name: review.User_Review_reviewerIdToUser?.name || 'Anonymous',
          image: review.User_Review_reviewerIdToUser?.profileImage,
        }
      }));

      return {
        id: childminder.id,
        name: childminder.name,
        bio: childminder.bio,
        image: childminder.profileImage,
        location: childminder.location,
        rate: childminder.rate,
        yearsOfExperience: childminder.yearsOfExperience,
        ageGroupsServed: childminder.ageGroupsServed,
        certifications: {
          firstAidCert: childminder.firstAidCert,
          childrenFirstCert: childminder.childrenFirstCert,
          gardaVetted: childminder.gardaVetted,
          tuslaRegistered: childminder.tuslaRegistered,
        },
        specialNeedsExp: childminder.specialNeedsExp,
        availability: childminder.RecurringAvailability,
        averageRating,
        reviewCount: ratings.length,
        reviews: reviews
      };
    });

    return NextResponse.json({
      data: formattedChildminders
    });
  } catch (error) {
    console.error('Error fetching childminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch childminders' },
      { status: 500 }
    );
  }
} 