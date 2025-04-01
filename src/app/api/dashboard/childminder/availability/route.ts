import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { parseISO, format } from 'date-fns';
import { nanoid } from 'nanoid';

// POST: Create a new availability
export async function POST(request: Request) {
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
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.start || !body.end || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: start, end, and type are required' },
        { status: 400 }
      );
    }
    
    // Parse dates
    const startDate = parseISO(body.start);
    const endDate = parseISO(body.end);
    
    // Validate dates
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Invalid time range: start time must be before end time' },
        { status: 400 }
      );
    }
    
    // Format time slot
    const timeSlot = `${startDate.getHours()}:${startDate.getMinutes()}:${endDate.getHours()}:${endDate.getMinutes()}`;
    
    // Check for existing bookings in this time slot
    const existingBookings = await prisma.booking.findMany({
      where: {
        childminderId: session.user.id,
        startTime: {
          lte: endDate
        },
        endTime: {
          gte: startDate
        },
        status: {
          in: ['CONFIRMED', 'PENDING']
        }
      }
    });
    
    // If there are existing bookings and this is an UNAVAILABLE slot, return error
    if (existingBookings.length > 0 && body.type === 'UNAVAILABLE') {
      return NextResponse.json(
        { 
          error: 'Cannot block this time slot as there are existing bookings',
          bookings: existingBookings
        },
        { status: 409 }
      );
    }
    
    // Check for existing availability blocks in this time slot
    const existingAvailability = await prisma.availability.findMany({
      where: {
        userId: session.user.id,
        date: {
          equals: new Date(startDate.setHours(0, 0, 0, 0))
        },
        OR: [
          {
            timeSlot: {
              contains: timeSlot
            }
          },
          {
            timeSlot: {
              startsWith: `${startDate.getHours()}:${startDate.getMinutes()}`
            }
          },
          {
            timeSlot: {
              endsWith: `${endDate.getHours()}:${endDate.getMinutes()}`
            }
          }
        ]
      }
    });
    
    // If there are overlapping availability blocks, return error
    if (existingAvailability.length > 0) {
      return NextResponse.json(
        { 
          error: 'Overlapping availability blocks found',
          availabilities: existingAvailability
        },
        { status: 409 }
      );
    }
    
    // Create the availability block
    const availability = await prisma.availability.create({
      data: {
        id: nanoid(),
        userId: session.user.id,
        date: new Date(startDate.setHours(0, 0, 0, 0)), // Just the date portion
        timeSlot,
        type: body.type,
        title: body.title,
        description: body.description,
        recurrenceRule: body.recurrenceRule,
        googleEventId: null,
        updatedAt: new Date()
      }
    });
    
    // If Google Calendar is connected and sync is enabled, sync this event
    if (body.syncToGoogle) {
      try {
        // Check if user has Google Calendar connected
        const calendarSync = await prisma.calendarSync.findFirst({
          where: {
            userId: session.user.id,
            provider: 'google'
          }
        });
        
        if (calendarSync) {
          // Call Google Calendar sync function (implementation varies)
          // This would typically be handled by a separate service/function
          // For now, we'll just update the record with a placeholder
          await prisma.availability.update({
            where: { id: availability.id },
            data: {
              googleEventId: `placeholder-${availability.id}`
            }
          });
        }
      } catch (syncError) {
        console.error('[GOOGLE_CALENDAR_SYNC_ERROR]', syncError);
        // We don't fail the request if sync fails
      }
    }
    
    return NextResponse.json({ success: true, availability });
    
  } catch (error) {
    console.error('[CHILDMINDER_AVAILABILITY_POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 