import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    // Get the session to authenticate the request
    const session = await getServerSession(authOptions);
    
    // Only allow authenticated users
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to access this endpoint' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`Checking subscription for user ${userId}`);

    // Check if user is admin - admins are always considered to have valid subscriptions
    const userRole = String(session.user.role).toLowerCase();
    if (userRole === 'admin') {
      console.log(`User ${userId} is admin, subscription check bypassed`);
      return NextResponse.json({
        userId,
        currentStatus: 'ADMIN',
        hasActiveSubscription: true,
        hasMismatch: false,
        needsFix: false,
        isAdmin: true
      });
    }

    // Check current subscription status of user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, subscriptionStatus: true },
    });

    console.log(`User ${userId} current status: ${user?.subscriptionStatus}`);

    // Check if user has an active subscription record
    const subscription = await db.subscription.findFirst({
      where: {
        userId: userId,
        status: 'active',
      },
    });

    const hasActiveSubscription = !!subscription;
    console.log(`User ${userId} has active subscription: ${hasActiveSubscription}`);

    // Check if there's a mismatch between subscription record and status
    const hasMismatch = hasActiveSubscription && String(user?.subscriptionStatus).toUpperCase() !== 'PREMIUM';
    console.log(`User ${userId} has subscription status mismatch: ${hasMismatch}`);

    return NextResponse.json({
      userId,
      currentStatus: user?.subscriptionStatus,
      hasActiveSubscription,
      hasMismatch,
      needsFix: hasMismatch,
      isAdmin: false
    });
  } catch (error: any) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 