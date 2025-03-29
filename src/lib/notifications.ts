import { User, Booking } from '@prisma/client';
import { sendNotificationEmail } from './msGraph';
import { v4 as uuidv4 } from 'uuid';
import prisma from './prisma';
import { format } from 'date-fns';

interface BookingWithUsers extends Booking {
  User_Booking_parentIdToUser: User;
  User_Booking_childminderIdToUser: User;
}

/**
 * Send a notification to both parent and childminder about a booking status change
 */
export async function sendBookingStatusNotification(
  booking: BookingWithUsers,
  previousStatus: string,
  newStatus: string
) {
  try {
    const parent = booking.User_Booking_parentIdToUser;
    const childminder = booking.User_Booking_childminderIdToUser;
    
    if (!parent || !childminder) {
      console.error('Missing users for booking notification', booking.id);
      return;
    }
    
    // Format booking details
    const bookingDate = booking.startTime ? format(booking.startTime, 'MMMM d, yyyy') : 'N/A';
    const startTime = booking.startTime ? format(booking.startTime, 'h:mm a') : 'N/A';
    const endTime = booking.endTime ? format(booking.endTime, 'h:mm a') : 'N/A';
    
    // Create status message based on new status
    let statusMessage = '';
    let statusTitle = '';
    
    switch (newStatus) {
      case 'CONFIRMED':
        statusTitle = 'Booking Confirmed';
        statusMessage = 'Your booking has been confirmed.';
        break;
      case 'PENDING':
        statusTitle = 'Booking Requested';
        statusMessage = 'A new booking request has been made.';
        break;
      case 'CANCELLED':
      case 'LATE_CANCELLED':
        statusTitle = 'Booking Cancelled';
        statusMessage = 'Your booking has been cancelled.';
        break;
      case 'COMPLETED':
        statusTitle = 'Booking Completed';
        statusMessage = 'Your booking has been marked as completed.';
        break;
      default:
        statusTitle = 'Booking Updated';
        statusMessage = `Your booking status has been changed from ${previousStatus} to ${newStatus}.`;
    }
    
    // Personalized messages for parent and childminder
    const parentContent = `
      <p>${statusMessage}</p>
      <p><strong>Booking Details:</strong></p>
      <ul>
        <li><strong>Childminder:</strong> ${childminder.name || 'N/A'}</li>
        <li><strong>Date:</strong> ${bookingDate}</li>
        <li><strong>Time:</strong> ${startTime} - ${endTime}</li>
      </ul>
      <p>You can view and manage your bookings in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/parent/bookings">dashboard</a>.</p>
    `;
    
    const childminderContent = `
      <p>${statusMessage}</p>
      <p><strong>Booking Details:</strong></p>
      <ul>
        <li><strong>Parent:</strong> ${parent.name || 'N/A'}</li>
        <li><strong>Date:</strong> ${bookingDate}</li>
        <li><strong>Time:</strong> ${startTime} - ${endTime}</li>
      </ul>
      <p>You can view and manage your bookings in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/childminder/bookings">dashboard</a>.</p>
    `;
    
    // Send emails in parallel
    const emailPromises = [];
    
    if (parent.email) {
      emailPromises.push(
        sendNotificationEmail(parent, statusTitle, parentContent)
          .then(() => logNotification(parent.id, 'BOOKING_STATUS_EMAIL_SENT', `Booking status update: ${statusTitle}`))
      );
    }
    
    if (childminder.email) {
      emailPromises.push(
        sendNotificationEmail(childminder, statusTitle, childminderContent)
          .then(() => logNotification(childminder.id, 'BOOKING_STATUS_EMAIL_SENT', `Booking status update: ${statusTitle}`))
      );
    }
    
    await Promise.all(emailPromises);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending booking status notification:', error);
    return { success: false, error };
  }
}

/**
 * Log a notification in the user activity log
 */
async function logNotification(userId: string, action: string, details: string) {
  try {
    await prisma.userActivityLog.create({
      data: {
        id: uuidv4(),
        userId,
        action,
        details,
        timestamp: new Date()
      }
    });
    return true;
  } catch (error) {
    console.error('Error logging notification:', error);
    return false;
  }
}

/**
 * Send a notification to a user about a new message
 */
export async function sendNewMessageNotification(
  recipient: User,
  senderName: string,
  conversationId: string
) {
  try {
    if (!recipient.email) {
      return { success: false, error: 'User has no email address' };
    }
    
    const content = `
      <p>You have received a new message from ${senderName}.</p>
      <p>Click below to view and respond to the message:</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${recipient.role}/messages/${conversationId}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Message</a></p>
    `;
    
    await sendNotificationEmail(recipient, 'New Message Received', content);
    
    await logNotification(
      recipient.id,
      'MESSAGE_NOTIFICATION_SENT',
      `New message notification from ${senderName}`
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error sending message notification:', error);
    return { success: false, error };
  }
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(user: User) {
  try {
    if (!user.email) {
      return { success: false, error: 'User has no email address' };
    }
    
    let content = '';
    
    if (user.role === 'parent') {
      content = `
        <p>Welcome to Childminder Connect!</p>
        <p>Thank you for joining our platform. We're excited to help you find the perfect childminder for your family.</p>
        <p>To get started:</p>
        <ol>
          <li>Complete your profile and add your children's information</li>
          <li>Search for childminders in your area</li>
          <li>Connect with childminders and schedule care</li>
        </ol>
      `;
    } else if (user.role === 'childminder') {
      content = `
        <p>Welcome to Childminder Connect!</p>
        <p>Thank you for joining our platform as a childminder. We're excited to help you connect with families seeking quality childcare.</p>
        <p>To get started:</p>
        <ol>
          <li>Complete your profile with your qualifications and experience</li>
          <li>Set up your availability calendar</li>
          <li>Wait for booking requests or browse families seeking care</li>
        </ol>
      `;
    } else {
      content = `
        <p>Welcome to Childminder Connect!</p>
        <p>Thank you for joining our platform. We're excited to have you with us.</p>
        <p>Please complete your profile to get the most out of our services.</p>
      `;
    }
    
    await sendNotificationEmail(user, 'Welcome to Childminder Connect', content);
    
    await logNotification(
      user.id,
      'WELCOME_EMAIL_SENT',
      'Welcome email sent to new user'
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

/**
 * Send a notification to a user about their profile updates
 */
export async function sendProfileUpdateNotification(
  user: User,
  updateType: 'PROFILE' | 'PROFILE_IMAGE'
) {
  try {
    if (!user.email) {
      return { success: false, error: 'User has no email address' };
    }
    
    const roleSpecificPath = user.role === 'childminder' 
      ? '/dashboard/childminder/profile' 
      : '/dashboard/parent/profile';
    
    let title = '';
    let content = '';
    
    if (updateType === 'PROFILE') {
      title = 'Profile Updated Successfully';
      content = `
        <p>Your profile has been successfully updated on Childminder Connect.</p>
        <p>Keeping your profile up to date helps create better connections on our platform.</p>
        <p>You can view and make additional changes to your profile anytime:</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}${roleSpecificPath}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Profile</a></p>
      `;
    } else if (updateType === 'PROFILE_IMAGE') {
      title = 'Profile Picture Updated Successfully';
      content = `
        <p>Your profile picture has been successfully updated on Childminder Connect.</p>
        <p>A clear profile picture helps build trust and recognition on our platform.</p>
        <p>You can view and make additional changes to your profile anytime:</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}${roleSpecificPath}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Profile</a></p>
      `;
    }
    
    await sendNotificationEmail(user, title, content);
    
    await logNotification(
      user.id,
      `${updateType}_UPDATE_NOTIFICATION_SENT`,
      `${updateType === 'PROFILE' ? 'Profile' : 'Profile picture'} update notification sent`
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error sending profile update notification:', error);
    return { success: false, error };
  }
} 