import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { google } from 'googleapis';
import { nanoid } from 'nanoid';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Setup OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_APP_URL + '/api/calendar-sync/callback'
);

export async function GET(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=unauthorized&redirect=/dashboard/childminder/calendar`
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Check for errors from Google
    if (error) {
      console.error('[CALENDAR_SYNC_CALLBACK] Google auth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/childminder/calendar?error=google_${error}`
      );
    }
    
    // Verify required parameters
    if (!code || !state) {
      console.error('[CALENDAR_SYNC_CALLBACK] Missing code or state');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/childminder/calendar?error=invalid_request`
      );
    }
    
    // Get the stored state from cookie for verification
    const cookies = request.headers.get('cookie');
    const cookieState = cookies
      ?.split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('calendar_auth_state='))
      ?.split('=')[1];
    
    // Verify the state to prevent CSRF attacks
    if (state !== cookieState) {
      console.error('[CALENDAR_SYNC_CALLBACK] State mismatch');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/childminder/calendar?error=invalid_state`
      );
    }
    
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Check if we have the required tokens
    if (!tokens.access_token) {
      console.error('[CALENDAR_SYNC_CALLBACK] No access token received');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/childminder/calendar?error=no_access_token`
      );
    }
    
    // Calculate token expiry
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600));
    
    // Check if user already has a Google Calendar sync record
    const existingSync = await prisma.calendarSync.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google'
      }
    });
    
    if (existingSync) {
      // Update existing record
      await prisma.calendarSync.update({
        where: {
          id: existingSync.id
        },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingSync.refreshToken,
          expiresAt,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new record
      await prisma.calendarSync.create({
        data: {
          id: nanoid(),
          userId: session.user.id,
          provider: 'google',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
          userType: session.user.role,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    // Clear the state cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/childminder/calendar?sync=success`
    );
    
    response.cookies.set('calendar_auth_state', '', {
      expires: new Date(0),
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('[CALENDAR_SYNC_CALLBACK]', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/childminder/calendar?error=sync_failed`
    );
  }
} 