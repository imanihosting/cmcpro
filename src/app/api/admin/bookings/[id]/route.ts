import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Booking_status } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    // Validate ID
    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }
    
    // Fetch booking with related data
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        User_Booking_parentIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true
          }
        },
        User_Booking_childminderIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            location: true,
            rate: true
          }
        },
        BookingChildren: {
          select: {
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
    
    // If booking not found
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    return NextResponse.json(booking);
    
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    // Validate ID
    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }
    
    // Parse the request body
    const body = await request.json();
    const { status, cancellationNote, adminReason } = body;
    
    // Validate required fields
    if (!status && !cancellationNote) {
      return NextResponse.json({ 
        error: 'At least one field to update is required (status or cancellationNote)' 
      }, { status: 400 });
    }
    
    // Require admin reason for audit purposes
    if (!adminReason) {
      return NextResponse.json({ 
        error: 'Admin reason for the change is required' 
      }, { status: 400 });
    }
    
    // Check if booking exists
    const existingBooking = await db.booking.findUnique({
      where: { id }
    });
    
    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
    }
    
    if (cancellationNote) {
      updateData.cancellationNote = cancellationNote;
    }
    
    // Update booking
    const updatedBooking = await db.booking.update({
      where: { id },
      data: updateData
    });
    
    // Log the admin action for audit purposes
    await db.systemLog.create({
      data: {
        id: crypto.randomUUID(),
        type: 'AUDIT',
        level: 'INFO',
        message: `Admin ${session.user.name || session.user.email} updated booking ${id}`,
        details: JSON.stringify({
          adminId: session.user.id,
          bookingId: id,
          previousStatus: existingBooking.status,
          newStatus: updateData.status,
          reason: adminReason,
          changes: updateData
        }),
        source: 'ADMIN_BOOKING_UPDATE',
        userId: session.user.id,
        timestamp: new Date()
      }
    });
    
    // Also create a user activity log entry
    await db.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: 'UPDATE_BOOKING',
        details: `Updated booking ${id} - Status: ${updateData.status || existingBooking.status}, Reason: ${adminReason}`,
        timestamp: new Date()
      }
    });
    
    return NextResponse.json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
    
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
} 