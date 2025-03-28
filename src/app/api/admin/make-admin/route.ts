import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// This endpoint should only be used for development/testing
// In production, use a more secure admin panel

// Simple security key - in production use a proper authentication system
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || 'dev_admin_key_for_testing';

export async function POST(req: Request) {
  try {
    // Verify admin key
    const { userId, adminKey } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Invalid admin key' }, { status: 403 });
    }
    
    // Try to get the current session to check if user is already admin
    const session = await getServerSession(authOptions);
    
    // Update user to admin role
    const user = await db.user.update({
      where: { id: userId },
      data: {
        role: 'admin'
      },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionStatus: true
      }
    });
    
    console.log(`User ${userId} has been upgraded to admin role`);
    
    return NextResponse.json({
      success: true,
      message: 'User has been granted admin role',
      user
    });
  } catch (error: any) {
    console.error('Error making user admin:', error);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 