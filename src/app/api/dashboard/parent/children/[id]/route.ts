import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Get a single child by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const childId = params.id;
    
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
    
    // Get the child and verify ownership
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: userId
      }
    });
    
    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }
    
    // Calculate booking count for the child
    const bookingCount = await prisma.bookingChildren.count({
      where: {
        childId: child.id
      }
    });
    
    // Return the child with booking count
    return NextResponse.json({
      ...child,
      bookingCount
    });
    
  } catch (error) {
    console.error('Error fetching child:', error);
    return NextResponse.json(
      { error: 'Failed to fetch child' },
      { status: 500 }
    );
  }
}

// Update a child by ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const childId = params.id;
    
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
    
    // Verify child ownership
    const existingChild = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: userId
      }
    });
    
    if (!existingChild) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const { name, age, allergies, specialNeeds } = await request.json();
    
    // Validate required fields
    if (!name || typeof age !== 'number') {
      return NextResponse.json(
        { error: 'Name and age are required fields' },
        { status: 400 }
      );
    }
    
    // Update the child
    const updatedChild = await prisma.child.update({
      where: {
        id: childId
      },
      data: {
        name,
        age,
        allergies: allergies || null,
        specialNeeds: specialNeeds || null,
        updatedAt: new Date()
      }
    });
    
    // Return the updated child
    return NextResponse.json({
      success: true,
      child: updatedChild
    });
    
  } catch (error) {
    console.error('Error updating child:', error);
    return NextResponse.json(
      { error: 'Failed to update child' },
      { status: 500 }
    );
  }
}

// Delete a child by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const childId = params.id;
    
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
    
    // Verify child ownership
    const existingChild = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: userId
      }
    });
    
    if (!existingChild) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }
    
    // Check if the child is used in any bookings
    const bookings = await prisma.bookingChildren.findFirst({
      where: {
        childId: childId
      }
    });
    
    // Delete the child
    await prisma.child.delete({
      where: {
        id: childId
      }
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Child deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting child:', error);
    
    // Handle foreign key constraint errors
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { error: 'Cannot delete this child as they are associated with bookings' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete child' },
      { status: 500 }
    );
  }
} 