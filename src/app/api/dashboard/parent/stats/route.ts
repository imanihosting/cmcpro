import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const userRole = session.user.role;
    
    // Only allow parents to access this endpoint
    if (userRole !== 'parent') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    // Get upcoming bookings (future bookings that haven't been completed)
    const upcomingBookings = await prisma.booking.count({
      where: {
        parentId: userId,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        startTime: {
          gte: new Date()
        }
      }
    });
    
    // Get unread messages count
    const unreadMessages = await prisma.message.count({
      where: {
        receiverId: userId,
        read: false
      }
    });
    
    // Calculate message trend (percentage increase/decrease from last week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const messagesLastWeek = await prisma.message.count({
      where: {
        receiverId: userId,
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });
    
    const messagesPreviousWeek = await prisma.message.count({
      where: {
        receiverId: userId,
        createdAt: {
          gte: twoWeeksAgo,
          lt: oneWeekAgo
        }
      }
    });
    
    let messageTrend = null;
    if (messagesPreviousWeek > 0) {
      const percentageChange = ((messagesLastWeek - messagesPreviousWeek) / messagesPreviousWeek) * 100;
      messageTrend = {
        positive: percentageChange >= 0,
        value: Math.abs(Math.round(percentageChange))
      };
    }
    
    // Get count of children registered
    const childrenRegistered = await prisma.child.count({
      where: {
        parentId: userId
      }
    });
    
    // Get subscription status
    const subscription = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        subscriptionStatus: true,
        Subscription: {
          select: {
            stripeCurrentPeriodEnd: true,
            status: true,
            plan: true
          }
        }
      }
    });
    
    const subscriptionStatus = subscription?.subscriptionStatus || 'FREE';
    
    // Return all stats in a single response
    return NextResponse.json({
      upcomingBookings,
      unreadMessages: {
        count: unreadMessages,
        trend: messageTrend
      },
      childrenRegistered,
      subscriptionStatus,
      subscriptionEndDate: subscription?.Subscription?.stripeCurrentPeriodEnd || null
    });
    
  } catch (error) {
    console.error('Error fetching parent dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
} 