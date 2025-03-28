import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfToday, endOfToday, startOfWeek, endOfWeek } from 'date-fns';

export async function GET() {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the user is a childminder
    if (session.user.role !== 'childminder') {
      return NextResponse.json({ error: 'Forbidden - Childminder role required' }, { status: 403 });
    }
    
    const childminderId = session.user.id;
    
    // Get pending bookings count
    const pendingBookingsCount = await prisma.booking.count({
      where: {
        childminderId,
        status: 'PENDING'
      }
    });
    
    // Get unread messages count
    const unreadMessagesCount = await prisma.message.count({
      where: {
        receiverId: childminderId,
        read: false
      }
    });
    
    // Get bookings for today
    const today = new Date();
    const todayBookingsCount = await prisma.booking.count({
      where: {
        childminderId,
        status: 'CONFIRMED',
        startTime: {
          gte: startOfToday(),
          lte: endOfToday()
        }
      }
    });
    
    // Get bookings for this week
    const thisWeekBookingsCount = await prisma.booking.count({
      where: {
        childminderId,
        status: 'CONFIRMED',
        startTime: {
          gte: startOfWeek(today),
          lte: endOfWeek(today)
        }
      }
    });
    
    // Get user profile data to calculate profile completeness
    const user = await prisma.user.findUnique({
      where: { id: childminderId },
      select: {
        name: true,
        bio: true,
        image: true,
        phoneNumber: true,
        location: true,
        rate: true,
        qualifications: true,
        yearsOfExperience: true,
        firstAidCert: true,
        gardaVetted: true,
        tuslaRegistered: true,
        ageGroupsServed: true,
        languagesSpoken: true,
        maxChildrenCapacity: true,
        careTypes: true,
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
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Calculate profile completeness percentage
    const profileFields = [
      !!user.name,
      !!user.bio,
      !!user.image,
      !!user.phoneNumber,
      !!user.location,
      !!user.rate,
      !!user.qualifications,
      !!user.yearsOfExperience,
      !!user.firstAidCert,
      !!user.gardaVetted,
      !!user.tuslaRegistered,
      !!user.ageGroupsServed,
      !!user.languagesSpoken,
      !!user.maxChildrenCapacity,
      !!user.careTypes
    ];
    
    const completedFields = profileFields.filter(Boolean).length;
    const totalFields = profileFields.length;
    const profileCompleteness = Math.round((completedFields / totalFields) * 100);
    
    return NextResponse.json({
      pendingBookings: pendingBookingsCount,
      unreadMessages: unreadMessagesCount,
      upcomingBookings: {
        today: todayBookingsCount,
        thisWeek: thisWeekBookingsCount
      },
      profileCompleteness,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndDate: user.Subscription?.stripeCurrentPeriodEnd || null
    });
    
  } catch (error) {
    console.error('[CHILDMINDER_STATS_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 