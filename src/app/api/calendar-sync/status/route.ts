import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has Google Calendar connected
    const calendarSync = await prisma.calendarSync.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google'
      }
    });
    
    if (!calendarSync) {
      return NextResponse.json({ connected: false });
    }
    
    // Check if token is expired
    const now = new Date();
    const isExpired = calendarSync.expiresAt < now;
    
    // For a proper implementation, we would refresh the token here if it's expired
    // This is just a simplified version
    
    return NextResponse.json({
      connected: !isExpired,
      provider: 'google',
      lastSynced: calendarSync.updatedAt
    });
    
  } catch (error) {
    console.error('[CALENDAR_SYNC_STATUS]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 