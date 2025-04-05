import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Booking_status, User_role, SupportTicket_status, User_subscriptionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Helper function to get date range for different time periods
const getDateRange = (period: 'today' | 'week' | 'month') => {
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
  }
  
  return { startDate, endDate: now };
};

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize the request
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    // Get date ranges for different periods
    const todayRange = getDateRange('today');
    const weekRange = getDateRange('week');
    const monthRange = getDateRange('month');
    
    // Execute all database queries in parallel for better performance
    const [
      totalUsers,
      usersByRole,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeSubscriptions,
      subscriptionsByStatus,
      recentSubscriptionChanges,
      bookingCounts,
      openSupportTickets,
      supportTicketsByPriority,
      recentActivityLogs,
      documentsPendingReview
    ] = await Promise.all([
      // Total users
      db.user.count(),
      
      // Users by role
      db.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      }),
      
      // New users registered today
      db.user.count({
        where: {
          createdAt: {
            gte: todayRange.startDate,
            lte: todayRange.endDate
          }
        }
      }),
      
      // New users registered this week
      db.user.count({
        where: {
          createdAt: {
            gte: weekRange.startDate,
            lte: weekRange.endDate
          }
        }
      }),
      
      // New users registered this month
      db.user.count({
        where: {
          createdAt: {
            gte: monthRange.startDate,
            lte: monthRange.endDate
          }
        }
      }),
      
      // Total active subscriptions
      db.subscription.count({
        where: {
          OR: [
            { status: 'active' },
            { status: 'trialing' }
          ]
        }
      }),
      
      // Subscriptions by status
      db.user.groupBy({
        by: ['subscriptionStatus'],
        _count: {
          id: true
        }
      }),
      
      // Recent subscription changes (new or canceled in the last week)
      db.subscription.findMany({
        where: {
          OR: [
            {
              createdAt: {
                gte: weekRange.startDate
              }
            },
            {
              cancelAtPeriodEnd: true,
              updatedAt: {
                gte: weekRange.startDate
              }
            }
          ]
        },
        include: {
          User: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 10
      }),
      
      // Booking statistics
      db.booking.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),
      
      // Count of open support tickets
      db.supportTicket.count({
        where: {
          status: SupportTicket_status.OPEN
        }
      }),
      
      // Support tickets by priority
      db.supportTicket.groupBy({
        by: ['priority'],
        _count: {
          id: true
        },
        where: {
          status: SupportTicket_status.OPEN
        }
      }),
      
      // Recent user activity
      db.userActivityLog.findMany({
        include: {
          User: {
            select: {
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 10
      }),
      
      // Documents pending review
      db.document.count({
        where: {
          status: 'PENDING'
        }
      })
    ]);
    
    // Process user counts by role
    const userCountsByRole = {
      total: totalUsers,
      parent: 0,
      childminder: 0,
      admin: 0,
      user: 0
    };
    
    usersByRole.forEach(item => {
      const role = item.role as keyof typeof userCountsByRole;
      userCountsByRole[role] = item._count.id;
    });
    
    // Process subscription counts by status
    const subscriptionCountsByStatus = {
      FREE: 0,
      BASIC: 0,
      PREMIUM: 0,
      TRIAL: 0
    };
    
    subscriptionsByStatus.forEach(item => {
      const status = item.subscriptionStatus as keyof typeof subscriptionCountsByStatus;
      subscriptionCountsByStatus[status] = item._count.id;
    });
    
    // Process booking counts by status
    const bookingCountsByStatus = {
      PENDING: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
      LATE_CANCELLED: 0,
      COMPLETED: 0
    };
    
    bookingCounts.forEach(item => {
      const status = item.status as keyof typeof bookingCountsByStatus;
      bookingCountsByStatus[status] = item._count.id;
    });

    // Format activity logs for easier consumption
    const formattedActivityLogs = recentActivityLogs.map(log => ({
      id: log.id,
      action: log.action,
      details: log.details,
      timestamp: log.timestamp,
      user: log.User ? {
        name: log.User.name,
        email: log.User.email,
        role: log.User.role
      } : null
    }));
    
    // Calculate total bookings
    const totalBookings = Object.values(bookingCountsByStatus).reduce((sum, count) => sum + count, 0);
    
    // Build and return the response
    return NextResponse.json({
      users: {
        total: totalUsers,
        byRole: userCountsByRole,
        newRegistrations: {
          today: newUsersToday,
          thisWeek: newUsersThisWeek,
          thisMonth: newUsersThisMonth
        }
      },
      subscriptions: {
        active: activeSubscriptions,
        byStatus: subscriptionCountsByStatus,
        recentChanges: recentSubscriptionChanges.map(sub => ({
          id: sub.id,
          plan: sub.plan,
          status: sub.status,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          user: sub.User ? {
            name: sub.User.name,
            email: sub.User.email
          } : null,
          updatedAt: sub.updatedAt
        }))
      },
      bookings: {
        total: totalBookings,
        byStatus: bookingCountsByStatus
      },
      supportTickets: {
        open: openSupportTickets,
        byPriority: supportTicketsByPriority.reduce((acc, item) => {
          acc[item.priority] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      documents: {
        pendingReview: documentsPendingReview
      },
      recentActivity: formattedActivityLogs
    });

  } catch (error: any) {
    console.error('Error fetching admin dashboard data:', error);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 