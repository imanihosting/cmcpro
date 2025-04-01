import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/recommendations/click
 * 
 * Track when a user clicks on a recommendation
 */
export async function POST(request: Request) {
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
        { error: 'Only parents can track recommendation clicks' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { recommendationId } = body;

    if (!recommendationId) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      );
    }

    // Update the recommendation as clicked
    const updatedRecommendation = await prisma.recommendation.update({
      where: {
        id: recommendationId,
      },
      data: {
        isClicked: true,
      },
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Recommendation click tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking recommendation click:', error);
    return NextResponse.json(
      { error: 'Failed to track recommendation click' },
      { status: 500 }
    );
  }
} 