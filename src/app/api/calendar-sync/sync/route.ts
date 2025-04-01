import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { google } from 'googleapis';

// Setup OAuth2 client
const getOAuth2Client = async (userId: string) => {
  const calendarSync = await prisma.calendarSync.findFirst({
    where: {
      userId,
      provider: 'google'
    }
  });
  
  if (!calendarSync) {
    return null;
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_APP_URL + '/api/calendar-sync/callback'
  );
  
  // Set credentials
  oauth2Client.setCredentials({
    access_token: calendarSync.accessToken,
    refresh_token: calendarSync.refreshToken,
    expiry_date: calendarSync.expiresAt.getTime()
  });
  
  return {
    oauth2Client,
    calendarSync
  };
};

export async function POST(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get OAuth client for this user
    const auth = await getOAuth2Client(session.user.id);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      );
    }
    
    const { oauth2Client, calendarSync } = auth;
    
    // Initialize Google Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Fetch all availability blocks without Google event IDs
    const availabilityBlocks = await prisma.availability.findMany({
      where: {
        userId: session.user.id,
        googleEventId: null
      }
    });
    
    // Sync each availability block to Google Calendar
    const results = await Promise.allSettled(
      availabilityBlocks.map(async (block) => {
        // Parse the time slot
        const [startHours, startMinutes, endHours, endMinutes] = block.timeSlot.split(':').map(Number);
        
        // Create date objects for start and end times
        const startDate = new Date(block.date);
        startDate.setHours(startHours, startMinutes, 0, 0);
        
        const endDate = new Date(block.date);
        endDate.setHours(endHours, endMinutes, 0, 0);
        
        // Create event object for Google Calendar
        const event = {
          summary: block.title || `${block.type === 'AVAILABLE' ? 'Available' : 'Unavailable'}`,
          description: block.description || `Childminder ${block.type === 'AVAILABLE' ? 'available' : 'unavailable'} time slot`,
          start: {
            dateTime: startDate.toISOString(),
            timeZone: 'Europe/Dublin'
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: 'Europe/Dublin'
          },
          colorId: block.type === 'AVAILABLE' ? '10' : '11', // Blue for available, red for unavailable
        };
        
        // Insert event to Google Calendar
        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event
        });
        
        // Update local record with Google event ID
        if (response.data.id) {
          await prisma.availability.update({
            where: {
              id: block.id
            },
            data: {
              googleEventId: response.data.id,
              updatedAt: new Date()
            }
          });
        }
        
        return {
          availabilityId: block.id,
          googleEventId: response.data.id,
          success: true
        };
      })
    );
    
    // Update last synced time
    await prisma.calendarSync.update({
      where: {
        id: calendarSync.id
      },
      data: {
        updatedAt: new Date()
      }
    });
    
    // Count successes and failures
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return NextResponse.json({
      success: true,
      synced: succeeded,
      failed,
      total: availabilityBlocks.length
    });
    
  } catch (error) {
    console.error('[CALENDAR_SYNC_SYNC]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 