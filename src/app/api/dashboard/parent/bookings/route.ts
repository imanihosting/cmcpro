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
    
    // Get upcoming bookings (future bookings that haven't been completed)
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        parentId: userId,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        startTime: {
          gte: new Date()
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 5,
      select: {
        id: true,
        childminderId: true,
        startTime: true,
        endTime: true,
        status: true,
        bookingType: true,
        isEmergency: true,
        isRecurring: true
      }
    });
    
    // For each booking, get the childminder and child information
    const bookingsWithDetails = await Promise.all(
      upcomingBookings.map(async (booking) => {
        const childminder = await prisma.user.findUnique({
          where: { id: booking.childminderId },
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        });
        
        // Get children for this booking using BookingChildren
        const bookingChildren = await prisma.bookingChildren.findMany({
          where: { 
            bookingId: booking.id 
          },
          include: {
            Child: true
          }
        });
        
        return {
          ...booking,
          childminder: childminder || {
            id: booking.childminderId,
            name: "Unknown Childminder",
            email: "",
            image: null
          },
          children: bookingChildren.map(bc => bc.Child) || []
        };
      })
    );
    
    // Return the bookings
    return NextResponse.json({
      bookings: bookingsWithDetails
    });
    
  } catch (error) {
    console.error('Error fetching parent bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
} 