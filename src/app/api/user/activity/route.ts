import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { format } from "date-fns";

// Define types for activity items
interface BaseActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  time: string;
  timestamp: Date;
}

interface BookingActivityItem extends BaseActivityItem {
  type: 'booking';
  status?: 'completed' | 'pending' | 'cancelled';
  childminder?: string;
}

interface ChildminderBookingActivityItem extends BaseActivityItem {
  type: 'booking';
  status?: 'completed' | 'pending' | 'cancelled';
  parent?: string;
}

interface PaymentActivityItem extends BaseActivityItem {
  type: 'payment';
  amount?: number;
  status?: 'completed' | 'pending' | 'cancelled';
}

interface MessageActivityItem extends BaseActivityItem {
  type: 'message';
  childminder?: string;
  parent?: string;
}

interface ProfileActivityItem extends BaseActivityItem {
  type: 'profile';
}

interface SecurityActivityItem extends BaseActivityItem {
  type: 'security';
}

interface OtherActivityItem extends BaseActivityItem {
  type: 'other';
}

type ActivityItem = BookingActivityItem | ChildminderBookingActivityItem | PaymentActivityItem | MessageActivityItem | 
                   ProfileActivityItem | SecurityActivityItem | OtherActivityItem;

// Helper function to map database action to UI friendly type
const mapActionToType = (action: string): string => {
  // Map common actions to UI types
  switch (action) {
    case 'PROFILE_UPDATE':
    case 'PROFILE_IMAGE_UPDATE':
      return 'profile';
    case 'BOOKING_CREATED':
    case 'BOOKING_CANCELLED':
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_COMPLETED':
      return 'booking';
    case 'PAYMENT_PROCESSED':
    case 'SUBSCRIPTION_RENEWED':
    case 'SUBSCRIPTION_CREATED':
    case 'SUBSCRIPTION_CANCELLED':
      return 'payment';
    case 'MESSAGE_SENT':
    case 'MESSAGE_RECEIVED':
      return 'message';
    case '2FA_ENABLED':
    case '2FA_DISABLED':
    case '2FA_SETUP_INITIATED':
    case 'PASSWORD_CHANGE':
    case 'PREFERENCES_UPDATE':
      return 'security';
    default:
      return 'other';
  }
};

// Helper function to get friendly title from action
const getActivityTitle = (action: string): string => {
  switch (action) {
    case 'PROFILE_UPDATE':
      return 'Profile Updated';
    case 'PROFILE_IMAGE_UPDATE':
      return 'Profile Picture Updated';
    case 'BOOKING_CREATED':
      return 'Booking Requested';
    case 'BOOKING_CANCELLED':
      return 'Booking Cancelled';
    case 'BOOKING_CONFIRMED':
      return 'Booking Confirmed';
    case 'BOOKING_COMPLETED':
      return 'Booking Completed';
    case 'PAYMENT_PROCESSED':
      return 'Payment Processed';
    case 'SUBSCRIPTION_RENEWED':
      return 'Subscription Renewed';
    case 'SUBSCRIPTION_CREATED':
      return 'Subscription Started';
    case 'SUBSCRIPTION_CANCELLED':
      return 'Subscription Cancelled';
    case 'MESSAGE_SENT':
      return 'Message Sent';
    case 'MESSAGE_RECEIVED':
      return 'New Message Received';
    case '2FA_ENABLED':
      return 'Two-Factor Authentication Enabled';
    case '2FA_DISABLED':
      return 'Two-Factor Authentication Disabled';
    case '2FA_SETUP_INITIATED':
      return 'Two-Factor Authentication Setup';
    case 'PASSWORD_CHANGE':
      return 'Password Changed';
    case 'PREFERENCES_UPDATE':
      return 'Notification Preferences Updated';
    default:
      return action.split('_').map(word => 
        word.charAt(0) + word.slice(1).toLowerCase()
      ).join(' ');
  }
};

// GET /api/user/activity - Get user activity logs
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const filterParam = url.searchParams.get('filter') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const userRole = url.searchParams.get('role') || session.user.role;
    const isChildminder = userRole === 'childminder';

    // Get user activity logs
    let activityLogs = await prisma.userActivityLog.findMany({
      where: { 
        userId 
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get recent bookings based on user role
    const bookings = isChildminder
      ? await prisma.booking.findMany({
          where: {
            childminderId: userId,
          },
          select: {
            id: true,
            status: true,
            startTime: true,
            endTime: true,
            createdAt: true,
            User_Booking_parentIdToUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        })
      : await prisma.booking.findMany({
          where: {
            parentId: userId,
          },
          select: {
            id: true,
            status: true,
            startTime: true,
            endTime: true,
            createdAt: true,
            User_Booking_childminderIdToUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        });

    // Get subscription events
    const subscription = await prisma.subscription.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
        stripeCurrentPeriodEnd: true,
      },
    });

    // Transform activity logs to UI format
    let activities: ActivityItem[] = activityLogs.map(log => {
      const formattedDate = format(log.timestamp, "MMMM d, yyyy");
      const formattedTime = format(log.timestamp, "HH:mm");
      const type = mapActionToType(log.action);

      const baseActivity: BaseActivityItem = {
        id: log.id,
        type,
        title: getActivityTitle(log.action),
        description: log.details || `Activity: ${log.action}`,
        date: formattedDate,
        time: formattedTime,
        timestamp: log.timestamp,
      };

      // Cast to appropriate type based on the action
      switch (type) {
        case 'profile':
          return baseActivity as ProfileActivityItem;
        case 'security':
          return baseActivity as SecurityActivityItem;
        case 'message':
          return baseActivity as MessageActivityItem;
        case 'booking':
          return baseActivity as BookingActivityItem;
        case 'payment':
          return baseActivity as PaymentActivityItem;
        default:
          return baseActivity as OtherActivityItem;
      }
    });

    // Add booking activities
    bookings.forEach(booking => {
      const formattedDate = format(booking.createdAt, "MMMM d, yyyy");
      const formattedTime = format(booking.createdAt, "HH:mm");
      
      let title: string, description: string, status: 'completed' | 'pending' | 'cancelled';
      
      // Type guard to check if we're dealing with a childminder booking or parent booking
      const personName = isChildminder 
        ? 'User_Booking_parentIdToUser' in booking 
          ? booking.User_Booking_parentIdToUser.name || 'Unknown Parent'
          : 'Unknown Parent'
        : 'User_Booking_childminderIdToUser' in booking 
          ? booking.User_Booking_childminderIdToUser.name || 'Unknown Childminder'
          : 'Unknown Childminder';
      
      switch (booking.status) {
        case 'CONFIRMED':
          title = "Booking Confirmed";
          description = isChildminder
            ? `Childcare booking with ${personName} has been confirmed`
            : `Childcare booking with ${personName} has been confirmed`;
          status = "completed";
          break;
        case 'PENDING':
          title = "Booking Requested";
          description = isChildminder
            ? `You received a booking request from ${personName}`
            : `You requested a booking with ${personName}`;
          status = "pending";
          break;
        case 'CANCELLED':
        case 'LATE_CANCELLED':
          title = "Booking Cancelled";
          description = isChildminder
            ? `Childcare booking with ${personName} was cancelled`
            : `Childcare booking with ${personName} was cancelled`;
          status = "cancelled";
          break;
        case 'COMPLETED':
          title = "Booking Completed";
          description = isChildminder
            ? `Childcare booking with ${personName} has been completed`
            : `Childcare booking with ${personName} has been completed`;
          status = "completed";
          break;
        default:
          title = "Booking Updated";
          description = isChildminder
            ? `Childcare booking with ${personName} was updated`
            : `Childcare booking with ${personName} was updated`;
          status = "pending";
      }
      
      if (isChildminder) {
        const childminderBookingActivity: ChildminderBookingActivityItem = {
          id: `booking-${booking.id}`,
          type: 'booking',
          title,
          description,
          date: formattedDate,
          time: formattedTime,
          status,
          parent: personName, // Use parent for childminder view
          timestamp: booking.createdAt,
        };
        activities.push(childminderBookingActivity);
      } else {
        const parentBookingActivity: BookingActivityItem = {
          id: `booking-${booking.id}`,
          type: 'booking',
          title,
          description,
          date: formattedDate,
          time: formattedTime,
          status,
          childminder: personName, // Use childminder for parent view
          timestamp: booking.createdAt,
        };
        activities.push(parentBookingActivity);
      }
    });

    // Add subscription activities
    if (subscription) {
      const formattedDate = format(subscription.createdAt, "MMMM d, yyyy");
      const formattedTime = format(subscription.createdAt, "HH:mm");
      
      // Get plan name safely
      const planName = typeof subscription.plan === 'string' ? subscription.plan : 'subscription';
      
      const subscriptionCreatedActivity: PaymentActivityItem = {
        id: `subscription-${subscription.id}`,
        type: 'payment',
        title: "Subscription Created",
        description: `Your ${planName} was created`,
        date: formattedDate,
        time: formattedTime,
        amount: 0, // This would need to be updated with actual amount if available
        status: 'completed',
        timestamp: subscription.createdAt,
      };
      
      activities.push(subscriptionCreatedActivity);
      
      // If there's a renewal date
      if (subscription.stripeCurrentPeriodEnd) {
        const renewalDate = format(subscription.stripeCurrentPeriodEnd, "MMMM d, yyyy");
        const renewalTime = format(subscription.stripeCurrentPeriodEnd, "HH:mm");
        
        const subscriptionRenewalActivity: PaymentActivityItem = {
          id: `subscription-renewal-${subscription.id}`,
          type: 'payment',
          title: "Subscription Renewal",
          description: `Your ${planName} will renew on ${renewalDate}`,
          date: renewalDate,
          time: renewalTime,
          amount: 0, // This would need to be updated with actual amount if available
          status: 'pending',
          timestamp: subscription.stripeCurrentPeriodEnd,
        };
        
        activities.push(subscriptionRenewalActivity);
      }
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Filter activities based on request
    if (filterParam !== 'all') {
      activities = activities.filter(activity => activity.type === filterParam);
    }

    // Return simplified versions of the activities without TypeScript errors
    const simplifiedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      date: activity.date,
      time: activity.time,
      status: 'status' in activity ? activity.status : undefined,
      amount: 'amount' in activity ? activity.amount : undefined,
      childminder: 'childminder' in activity ? activity.childminder : undefined,
      parent: 'parent' in activity ? activity.parent : undefined,
    }));

    return NextResponse.json({
      activities: simplifiedActivities.slice(0, limit),
      total: activities.length,
    });
  } catch (error) {
    console.error("Error in GET /api/user/activity:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 