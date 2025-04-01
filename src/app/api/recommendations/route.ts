import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import * as ml from '@/lib/ml';

/**
 * GET /api/recommendations
 * 
 * Returns AI-powered childminder recommendations for the current parent
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
        { error: 'Only parents can view recommendations' },
        { status: 403 }
      );
    }

    const parentId = session.user.id;

    // Check for existing recommendations that are less than 24 hours old
    const recentRecommendations = await prisma.recommendation.findMany({
      where: {
        parentId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        childminder: {
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
          }
        }
      },
      orderBy: {
        score: 'desc'
      },
      take: 5
    });

    // If we have recent recommendations, return them
    if (recentRecommendations.length > 0) {
      // Mark recommendations as viewed
      await prisma.recommendation.updateMany({
        where: {
          parentId,
          isViewed: false
        },
        data: {
          isViewed: true
        }
      });

      // Format the response
      const formattedRecommendations = recentRecommendations.map(rec => {
        // Calculate average rating
        const ratings = rec.childminder.Review_Review_revieweeIdToUser.map(review => review.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;

        return {
          id: rec.id,
          childminder: {
            id: rec.childminder.id,
            name: rec.childminder.name,
            bio: rec.childminder.bio,
            image: rec.childminder.profileImage,
            location: rec.childminder.location,
            rate: rec.childminder.rate,
            yearsOfExperience: rec.childminder.yearsOfExperience,
            ageGroupsServed: rec.childminder.ageGroupsServed,
            certifications: {
              firstAidCert: rec.childminder.firstAidCert,
              childrenFirstCert: rec.childminder.childrenFirstCert,
              gardaVetted: rec.childminder.gardaVetted,
              tuslaRegistered: rec.childminder.tuslaRegistered,
            },
            specialNeedsExp: rec.childminder.specialNeedsExp,
            availability: rec.childminder.RecurringAvailability,
            averageRating,
            reviewCount: ratings.length,
          },
          score: rec.score,
          reasons: rec.reasons as string[],
          isCollaborative: rec.isCollaborative
        };
      });

      return NextResponse.json({
        data: formattedRecommendations,
        fresh: false
      });
    }

    // If no recent recommendations, generate new ones

    // Get parent profile
    const parent = await prisma.user.findUnique({
      where: {
        id: parentId,
      },
      select: {
        id: true,
        location: true,
        Child: {
          select: {
            id: true,
            age: true,
          }
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent profile not found' },
        { status: 404 }
      );
    }

    // Get parent's booking history
    const bookingHistory = await prisma.booking.findMany({
      where: {
        parentId,
        status: {
          in: ['COMPLETED', 'CONFIRMED']
        }
      },
      select: {
        id: true,
        childminderId: true,
        startTime: true,
        endTime: true,
        status: true,
      }
    });

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
    });

    // Convert to ML-compatible format
    const parentProfile: ml.ParentProfile = {
      id: parent.id,
      location: parent.location,
      children: parent.Child.map(child => ({ age: child.age })),
    };

    const formattedBookings: ml.BookingHistory[] = bookingHistory.map(booking => ({
      childminderId: booking.childminderId,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
    }));

    const childminderProfiles: ml.ChildminderProfile[] = childminders.map(cm => ({
      id: cm.id,
      name: cm.name,
      bio: cm.bio,
      location: cm.location,
      rate: cm.rate,
      yearsOfExperience: cm.yearsOfExperience,
      ageGroupsServed: cm.ageGroupsServed as string[] | null,
      languagesSpoken: cm.languagesSpoken as string[] | null,
      specialNeedsExp: cm.specialNeedsExp,
      firstAidCert: cm.firstAidCert,
      gardaVetted: cm.gardaVetted,
      tuslaRegistered: cm.tuslaRegistered,
      reviewRatings: cm.Review_Review_revieweeIdToUser.map(review => review.rating),
    }));

    // Generate content-based recommendations
    const contentBasedRecommendations = ml.filterChildmindersByPreferences(
      parentProfile,
      childminderProfiles,
      formattedBookings
    ).slice(0, 5); // Get top 5 recommendations

    // Create new recommendation records
    const now = new Date();
    const recommendationRecords = await Promise.all(
      contentBasedRecommendations.map(async (rec, index) => {
        // Generate explanation for this recommendation
        const reasons = ml.generateRecommendationExplanation(
          parentProfile,
          rec,
          formattedBookings
        );

        // Calculate score (higher score = better match, normalize to 0-100)
        const score = ml.calculateSimilarityScore(parentProfile, rec, formattedBookings);
        const normalizedScore = Math.min(100, Math.max(0, score));

        // Create recommendation record
        return prisma.recommendation.create({
          data: {
            id: uuidv4(),
            parentId: parentId,
            childminderId: rec.id,
            score: normalizedScore,
            reasons: reasons as any,
            isViewed: true,
            createdAt: now,
            updatedAt: now,
          },
          include: {
            childminder: {
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
              }
            }
          }
        });
      })
    );

    // Format recommendations for response
    const formattedRecommendations = recommendationRecords.map(rec => {
      // Calculate average rating
      const ratings = rec.childminder.Review_Review_revieweeIdToUser.map(review => review.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        id: rec.id,
        childminder: {
          id: rec.childminder.id,
          name: rec.childminder.name,
          bio: rec.childminder.bio,
          image: rec.childminder.profileImage,
          location: rec.childminder.location,
          rate: rec.childminder.rate,
          yearsOfExperience: rec.childminder.yearsOfExperience,
          ageGroupsServed: rec.childminder.ageGroupsServed,
          certifications: {
            firstAidCert: rec.childminder.firstAidCert,
            childrenFirstCert: rec.childminder.childrenFirstCert,
            gardaVetted: rec.childminder.gardaVetted,
            tuslaRegistered: rec.childminder.tuslaRegistered,
          },
          specialNeedsExp: rec.childminder.specialNeedsExp,
          availability: rec.childminder.RecurringAvailability,
          averageRating,
          reviewCount: ratings.length,
        },
        score: rec.score,
        reasons: rec.reasons as string[],
        isCollaborative: rec.isCollaborative
      };
    });

    // Return the recommendations
    return NextResponse.json({
      data: formattedRecommendations,
      fresh: true
    });
  } catch (error) {
    console.error('Error in childminder AI recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI recommendations' },
      { status: 500 }
    );
  }
} 