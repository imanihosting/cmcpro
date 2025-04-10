import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Get current user session for authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Childminder ID is required' },
        { status: 400 }
      );
    }

    // Get the childminder details
    const childminder = await prisma.user.findUnique({
      where: {
        id,
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
        ageGroupsServed: true,
        languagesSpoken: true,
        firstAidCert: true,
        childrenFirstCert: true,
        gardaVetted: true,
        tuslaRegistered: true,
        specialNeedsExp: true,
        mealsProvided: true,
        pickupDropoff: true,
        availability: true,
        phoneNumber: true,
        email: true,
        careTypes: true,
        qualifications: true,
        otherQualifications: true,
        educationLevel: true,
        specialties: true,
        maxChildrenCapacity: true,
        createdAt: true,
        Address: {
          select: {
            streetAddress: true,
            city: true,
            county: true,
            eircode: true
          }
        },
        RecurringAvailability: {
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
        Review_Review_revieweeIdToUser: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            User_Review_reviewerIdToUser: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!childminder) {
      return NextResponse.json(
        { error: 'Childminder not found' },
        { status: 404 }
      );
    }

    // Calculate average rating
    const reviews = childminder.Review_Review_revieweeIdToUser;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Format the reviews for the response
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      reviewer: {
        id: review.User_Review_reviewerIdToUser.id,
        name: review.User_Review_reviewerIdToUser.name,
        image: review.User_Review_reviewerIdToUser.image,
      },
    }));

    // Check if the childminder is a favorite of the user
    const isFavorite = await prisma.favorite.findUnique({
      where: {
        userId_childminderId: {
          userId: session.user.id,
          childminderId: childminder.id,
        },
      },
    });

    // Format the response
    const formattedChildminder = {
      id: childminder.id,
      name: childminder.name,
      bio: childminder.bio,
      image: childminder.profileImage,
      location: childminder.location,
      address: childminder.Address ? {
        streetAddress: childminder.Address.streetAddress,
        city: childminder.Address.city,
        county: childminder.Address.county,
        eircode: childminder.Address.eircode,
        formatted: `${childminder.Address.streetAddress}, ${childminder.Address.city}, ${childminder.Address.county}${childminder.Address.eircode ? ', ' + childminder.Address.eircode : ''}`
      } : null,
      contact: {
        email: childminder.email,
        phoneNumber: childminder.phoneNumber,
      },
      rate: childminder.rate,
      yearsOfExperience: childminder.yearsOfExperience,
      ageGroupsServed: childminder.ageGroupsServed,
      languagesSpoken: childminder.languagesSpoken,
      careTypes: childminder.careTypes,
      qualifications: childminder.qualifications,
      otherQualifications: childminder.otherQualifications,
      educationLevel: childminder.educationLevel,
      specialties: childminder.specialties,
      maxChildrenCapacity: childminder.maxChildrenCapacity,
      memberSince: childminder.createdAt,
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
      reviews: formattedReviews,
      averageRating,
      reviewCount: reviews.length,
      isFavorite: !!isFavorite,
    };

    return NextResponse.json(formattedChildminder);
  } catch (error) {
    console.error('Error fetching childminder details:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching childminder details' },
      { status: 500 }
    );
  }
} 