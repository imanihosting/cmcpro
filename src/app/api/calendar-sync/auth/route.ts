import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { google } from 'googleapis';
import { nanoid } from 'nanoid';

// Setup OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_APP_URL + '/api/calendar-sync/callback'
);

// Define scopes for Google Calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

export async function GET(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Generate a state parameter to prevent CSRF attacks
    const state = nanoid();
    
    // Store state in a cookie for verification during callback
    const stateExpiry = new Date();
    stateExpiry.setMinutes(stateExpiry.getMinutes() + 30); // Expire in 30 minutes
    
    // Generate the authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: state,
      prompt: 'consent' // Force to get refresh token
    });
    
    // Create the response with redirect
    const response = NextResponse.redirect(authUrl);
    
    // Set the state cookie for verification during callback
    response.cookies.set('calendar_auth_state', state, {
      expires: stateExpiry,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('[CALENDAR_SYNC_AUTH]', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/childminder/calendar?error=auth_failed`
    );
  }
} 