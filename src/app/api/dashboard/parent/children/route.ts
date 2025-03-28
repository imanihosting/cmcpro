import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const userRole = session.user.role;
    
    // Only allow parents to access this endpoint
    if (userRole !== 'parent') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    // Get the parent's children
    const children = await prisma.child.findMany({
      where: {
        parentId: userId
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Get total count of bookings for each child
    const childrenWithBookingCount = await Promise.all(
      children.map(async (child) => {
        const bookingCount = await prisma.bookingChildren.count({
          where: {
            childId: child.id
          }
        });
        
        return {
          ...child,
          bookingCount
        };
      })
    );
    
    // Return the children
    return NextResponse.json({
      children: childrenWithBookingCount,
      count: children.length
    });
    
  } catch (error) {
    console.error('Error fetching parent children:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const userRole = session.user.role;
    
    // Only allow parents to access this endpoint
    if (userRole !== 'parent') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const { name, age, allergies, specialNeeds } = await request.json();
    
    // Validate required fields
    if (!name || typeof age !== 'number') {
      return NextResponse.json(
        { error: 'Name and age are required fields' },
        { status: 400 }
      );
    }
    
    // Create the child
    const child = await prisma.child.create({
      data: {
        id: `child_${Date.now()}`, // Simple ID generation, consider using a more robust solution in production
        parentId: userId,
        name,
        age,
        allergies: allergies || null,
        specialNeeds: specialNeeds || null,
        updatedAt: new Date()
      }
    });
    
    // Return the created child
    return NextResponse.json({
      success: true,
      child
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating child:', error);
    return NextResponse.json(
      { error: 'Failed to create child' },
      { status: 500 }
    );
  }
} 