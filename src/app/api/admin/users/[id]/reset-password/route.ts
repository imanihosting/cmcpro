import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize the request
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Fetch the user to get their email
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true,
        name: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Send password reset email
    const result = await sendPasswordResetEmail(user.email);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send password reset email' },
        { status: 500 }
      );
    }
    
    // Log the activity
    await db.userActivityLog.create({
      data: {
        id: uuidv4(),
        userId: userId,
        action: 'PASSWORD_RESET_REQUESTED',
        details: `Admin ${session.user.name || session.user.email} initiated password reset for user.`,
        timestamp: new Date()
      }
    });
    
    return NextResponse.json({
      message: 'Password reset email sent successfully'
    });
    
  } catch (error: any) {
    console.error('Error triggering password reset:', error);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 