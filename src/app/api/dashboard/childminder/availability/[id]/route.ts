import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { parseISO } from 'date-fns';

// GET: Retrieve a specific availability
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Retrieve the availability
    const availability = await prisma.availability.findUnique({
      where: {
        id: params.id
      }
    });
    
    // Check if availability exists
    if (!availability) {
      return NextResponse.json({ error: 'Availability not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (availability.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden - You can only access your own availabilities' }, { status: 403 });
    }
    
    return NextResponse.json({ availability });
    
  } catch (error) {
    console.error('[CHILDMINDER_AVAILABILITY_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update a specific availability
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify ownership of the availability
    const existingAvailability = await prisma.availability.findUnique({
      where: {
        id: params.id
      }
    });
    
    // Check if availability exists
    if (!existingAvailability) {
      return NextResponse.json({ error: 'Availability not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (existingAvailability.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden - You can only update your own availabilities' }, { status: 403 });
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
    
    // Format time slot
    const timeSlot = `${startDate.getHours()}:${startDate.getMinutes()}:${endDate.getHours()}:${endDate.getMinutes()}`;
    
    // Check for existing bookings if changing to UNAVAILABLE
    if (body.type === 'UNAVAILABLE') {
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
      
      if (existingBookings.length > 0) {
        return NextResponse.json(
          { 
            error: 'Cannot mark this time slot as unavailable as there are existing bookings',
            bookings: existingBookings
          },
          { status: 409 }
        );
      }
    }
    
    // Update the availability
    const updatedAvailability = await prisma.availability.update({
      where: {
        id: params.id
      },
      data: {
        date: new Date(startDate.setHours(0, 0, 0, 0)), // Just the date portion
        timeSlot,
        type: body.type,
        title: body.title,
        description: body.description,
        recurrenceRule: body.recurrenceRule,
        updatedAt: new Date()
      }
    });
    
    // If Google Calendar is connected and sync is enabled, sync this event
    if (body.syncToGoogle && existingAvailability.googleEventId) {
      try {
        // Call Google Calendar sync function (implementation varies)
        // This would be a call to update the existing Google Calendar event
        // For now, we'll just acknowledge the sync request
        console.log(`[GOOGLE_CALENDAR_SYNC] Updating event ${existingAvailability.googleEventId}`);
      } catch (syncError) {
        console.error('[GOOGLE_CALENDAR_SYNC_ERROR]', syncError);
        // We don't fail the request if sync fails
      }
    }
    
    return NextResponse.json({ success: true, availability: updatedAvailability });
    
  } catch (error) {
    console.error('[CHILDMINDER_AVAILABILITY_PUT]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a specific availability
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify ownership of the availability
    const existingAvailability = await prisma.availability.findUnique({
      where: {
        id: params.id
      }
    });
    
    // Check if availability exists
    if (!existingAvailability) {
      return NextResponse.json({ error: 'Availability not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (existingAvailability.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden - You can only delete your own availabilities' }, { status: 403 });
    }
    
    // Check if this availability is associated with any active bookings
    if (existingAvailability.type === 'AVAILABLE') {
      // Check the date and time range to see if there are any bookings
      const startHours = parseInt(existingAvailability.timeSlot.split(':')[0]);
      const startMinutes = parseInt(existingAvailability.timeSlot.split(':')[1]);
      const endHours = parseInt(existingAvailability.timeSlot.split(':')[2]);
      const endMinutes = parseInt(existingAvailability.timeSlot.split(':')[3]);
      
      const startDate = new Date(existingAvailability.date);
      startDate.setHours(startHours, startMinutes, 0, 0);
      
      const endDate = new Date(existingAvailability.date);
      endDate.setHours(endHours, endMinutes, 0, 0);
      
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
      
      if (existingBookings.length > 0) {
        return NextResponse.json(
          { 
            error: 'Cannot delete availability as there are active bookings in this time slot',
            bookings: existingBookings
          },
          { status: 409 }
        );
      }
    }
    
    // If Google Calendar is connected, delete the event there too
    if (existingAvailability.googleEventId) {
      try {
        // Call Google Calendar sync function (implementation varies)
        // This would be a call to delete the Google Calendar event
        // For now, we'll just acknowledge the deletion request
        console.log(`[GOOGLE_CALENDAR_SYNC] Deleting event ${existingAvailability.googleEventId}`);
      } catch (syncError) {
        console.error('[GOOGLE_CALENDAR_SYNC_ERROR]', syncError);
        // We don't fail the request if sync fails
      }
    }
    
    // Delete the availability
    await prisma.availability.delete({
      where: {
        id: params.id
      }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[CHILDMINDER_AVAILABILITY_DELETE]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 