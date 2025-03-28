import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

// Add or remove childminder from favorites
export async function POST(request: Request, { params }: RouteParams) {
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
        { error: 'Only parents can add childminders to favorites' },
        { status: 403 }
      );
    }

    const { id: childminderId } = params;
    const userId = session.user.id;

    if (!childminderId) {
      return NextResponse.json(
        { error: 'Childminder ID is required' },
        { status: 400 }
      );
    }

    // Check if the childminder exists
    const childminder = await prisma.user.findUnique({
      where: {
        id: childminderId,
        role: 'childminder',
      },
      select: {
        id: true,
      },
    });

    if (!childminder) {
      return NextResponse.json(
        { error: 'Childminder not found' },
        { status: 404 }
      );
    }

    // Check if the favorite already exists
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_childminderId: {
          userId,
          childminderId,
        },
      },
    });

    let favorite;
    let isFavorite;

    if (existingFavorite) {
      // Remove from favorites
      await prisma.favorite.delete({
        where: {
          id: existingFavorite.id,
        },
      });
      
      isFavorite = false;
    } else {
      // Add to favorites
      favorite = await prisma.favorite.create({
        data: {
          id: `fav_${Date.now()}`,
          userId,
          childminderId,
          updatedAt: new Date(),
        },
      });
      
      isFavorite = true;
    }

    return NextResponse.json({
      success: true,
      isFavorite,
    });
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    return NextResponse.json(
      { error: 'An error occurred while toggling favorite status' },
      { status: 500 }
    );
  }
} 