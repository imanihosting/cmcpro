import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Check for admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    // Get query parameter
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }
    
    // Search for users by name or email using direct Prisma client to avoid type issues
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { 
            name: {
              contains: query
            }
          },
          { 
            email: {
              contains: query
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      take: 10 // Limit to 10 results
    });
    
    return NextResponse.json({
      success: true,
      users
    });
    
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to search users' },
      { status: 500 }
    );
  }
} 