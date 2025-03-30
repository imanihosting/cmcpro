import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    // If no session, return unauthorized
    if (!session?.user) {
      console.log('No user session found in /api/users/me');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Log the successful user data retrieval
    console.log(`User data retrieved for ${session.user.email} with role ${session.user.role}`);
    
    // Return user info (excluding sensitive data)
    return NextResponse.json({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      image: session.user.image || null
    });
    
  } catch (error) {
    console.error('Error retrieving user information:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve user information' },
      { status: 500 }
    );
  }
} 