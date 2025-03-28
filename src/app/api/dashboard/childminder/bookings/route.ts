import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Booking_status } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

// Define types for our database results
type BookingChild = {
  id: string;
  name: string;
  age: number;
  allergies: string | null;
  specialNeeds: string | null;
};

type BookingParent = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phoneNumber: string | null;
};

type BookingWithRelations = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: Booking_status;
  bookingType: any;
  isEmergency: boolean;
  isRecurring: boolean;
  recurrencePattern: any;
  createdAt: Date;
  updatedAt: Date;
  cancellationNote: string | null;
  parentId: string;
  childminderId: string;
  User_Booking_parentIdToUser: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    phoneNumber: string | null;
  };
  BookingChildren: Array<{
    Child: {
      id: string;
      name: string;
      age: number;
      allergies: string | null;
      specialNeeds: string | null;
    }
  }>;
};

export async function GET(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure the user is a childminder
    if (session.user.role !== 'childminder') {
      return NextResponse.json({ error: 'Forbidden - Childminder role required' }, { status: 403 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const timeframe = searchParams.get('timeframe') || 'upcoming';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const parentId = searchParams.get('parentId');
    const sortBy = searchParams.get('sortBy') || 'startTime';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build the query
    const whereClause: any = {
      childminderId: session.user.id
    };
    
    // Handle status filters
    if (statusParam === 'ALL') {
      // Don't apply any status filter when 'ALL' is selected
    } else if (statusParam && Object.values(Booking_status).includes(statusParam as Booking_status)) {
      // Apply specific status filter if it's a valid Booking_status
      whereClause.status = statusParam;
    } else {
      // Default filter for different timeframes when no status is specified
      if (timeframe === 'upcoming') {
        whereClause.startTime = { gte: new Date() };
        whereClause.status = { in: ['PENDING', 'CONFIRMED'] };
      } else if (timeframe === 'past') {
        whereClause.OR = [
          { endTime: { lt: new Date() } },
          { status: { in: ['CANCELLED', 'LATE_CANCELLED', 'COMPLETED'] } }
        ];
      } else if (timeframe === 'all') {
        // Don't apply any timeframe filter for 'all'
      }
    }
    
    // Filter by date range if provided
    if (startDateParam) {
      const startDate = new Date(startDateParam);
      whereClause.startTime = { 
        ...(whereClause.startTime || {}),
        gte: startOfDay(startDate)
      };
    }
    
    if (endDateParam) {
      const endDate = new Date(endDateParam);
      whereClause.endTime = {
        ...(whereClause.endTime || {}),
        lte: endOfDay(endDate)
      };
    }
    
    // Filter by parent if provided
    if (parentId) {
      whereClause.parentId = parentId;
    }
    
    // Count total bookings for pagination
    const totalBookings = await prisma.booking.count({
      where: whereClause
    });
    
    // Fetch bookings with pagination
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit,
      include: {
        User_Booking_parentIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phoneNumber: true
          }
        },
        BookingChildren: {
          include: {
            Child: {
              select: {
                id: true,
                name: true,
                age: true,
                allergies: true,
                specialNeeds: true
              }
            }
          }
        }
      }
    });
    
    // Transform bookings to match the expected format
    const transformedBookings = bookings.map(booking => {
      // Format children data
      const formattedChildren = booking.BookingChildren.map(bookingChild => {
        return {
          id: bookingChild.Child.id,
          name: bookingChild.Child.name,
          age: bookingChild.Child.age,
          allergies: bookingChild.Child.allergies,
          specialNeeds: bookingChild.Child.specialNeeds
        };
      });
      
      // Calculate booking duration
      const startTime = new Date(booking.startTime);
      const endTime = new Date(booking.endTime);
      const durationMs = endTime.getTime() - startTime.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      // Format parent data
      const formattedParent = {
        id: booking.User_Booking_parentIdToUser.id,
        name: booking.User_Booking_parentIdToUser.name || null,
        email: booking.User_Booking_parentIdToUser.email,
        image: booking.User_Booking_parentIdToUser.image,
        phoneNumber: booking.User_Booking_parentIdToUser.phoneNumber
      };
      
      return {
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        bookingType: booking.bookingType,
        isEmergency: booking.isEmergency,
        isRecurring: booking.isRecurring,
        recurrencePattern: booking.recurrencePattern,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        cancellationNote: booking.cancellationNote,
        duration: {
          hours,
          minutes
        },
        children: formattedChildren,
        parent: formattedParent
      };
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalBookings / limit);
    
    return NextResponse.json({
      bookings: transformedBookings,
      pagination: {
        total: totalBookings,
        page,
        limit,
        pages: totalPages
      }
    });
    
  } catch (error) {
    console.error('[CHILDMINDER_BOOKINGS_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 