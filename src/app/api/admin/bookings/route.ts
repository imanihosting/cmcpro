import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Booking_status } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Default pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Admin role check
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const page = parseInt(searchParams.get('page') || `${DEFAULT_PAGE}`);
    const limit = parseInt(searchParams.get('limit') || `${DEFAULT_LIMIT}`);
    const skip = (page - 1) * limit;
    
    // Filtering
    const parentId = searchParams.get('parentId');
    const childminderId = searchParams.get('childminderId');
    const status = searchParams.get('status') as Booking_status | null;
    const searchTerm = searchParams.get('search');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    
    // Sorting
    const sortField = searchParams.get('sortField') || 'startTime';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build where clause
    const where: any = {};
    
    if (parentId) {
      where.parentId = parentId;
    }
    
    if (childminderId) {
      where.childminderId = childminderId;
    }
    
    if (status) {
      where.status = status;
    }
    
    // Date range filter
    if (startDateStr) {
      const startDate = new Date(startDateStr);
      where.startTime = {
        ...(where.startTime || {}),
        gte: startDate
      };
    }
    
    if (endDateStr) {
      const endDate = new Date(endDateStr);
      where.endTime = {
        ...(where.endTime || {}),
        lte: endDate
      };
    }
    
    // Search by parent or childminder name/email
    if (searchTerm) {
      where.OR = [
        {
          User_Booking_parentIdToUser: {
            OR: [
              { name: { contains: searchTerm } },
              { email: { contains: searchTerm } }
            ]
          }
        },
        {
          User_Booking_childminderIdToUser: {
            OR: [
              { name: { contains: searchTerm } },
              { email: { contains: searchTerm } }
            ]
          }
        }
      ];
    }
    
    // Execute count query for total records (for pagination)
    const totalCount = await db.booking.count({ where });
    
    // Execute main query with filters, sorting, and pagination
    const bookings = await db.booking.findMany({
      where,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        bookingType: true,
        isEmergency: true,
        isRecurring: true,
        cancellationNote: true,
        User_Booking_parentIdToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        User_Booking_childminderIdToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        BookingChildren: {
          select: {
            Child: {
              select: {
                id: true,
                name: true,
                age: true
              }
            }
          }
        }
      },
      orderBy: {
        [sortField]: sortOrder
      },
      skip,
      take: limit
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    
    // Return formatted response
    return NextResponse.json({
      data: bookings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });
    
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
} 