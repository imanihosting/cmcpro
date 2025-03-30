import { SupportTicket, User } from '@prisma/client';
import { sendNotificationEmail } from './msGraph';
import prisma from './prisma';

// Define a simpler interface that focuses on what we need
interface TicketWithUser extends SupportTicket {
  User?: {
    id?: string;
    name?: string | null;
    email?: string;
    role?: string;
  } | null;
}

/**
 * Send an email notification when a new ticket is created
 */
export async function sendTicketCreationNotification(ticket: TicketWithUser) {
  try {
    // Get admin users to notify
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'admin',
      },
    });

    // Prepare email content for admin
    const adminContent = `
      <p>A new support ticket has been created.</p>
      <p><strong>Ticket Details:</strong></p>
      <ul>
        <li><strong>Ticket ID:</strong> ${ticket.id}</li>
        <li><strong>User:</strong> ${ticket.userName} (${ticket.userEmail})</li>
        <li><strong>Subject:</strong> ${ticket.subject}</li>
        <li><strong>Category:</strong> ${ticket.category}</li>
        <li><strong>Priority:</strong> ${ticket.priority}</li>
      </ul>
      <p><strong>Description:</strong><br>${ticket.description}</p>
      <p>Please review and respond to this ticket through the admin dashboard.</p>
      <p>You can view and manage tickets in the <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/support">admin support dashboard</a>.</p>
    `;

    // Prepare email content for the user who created the ticket
    const userContent = `
      <p>Your support ticket has been received. Our support team will review and respond to your inquiry as soon as possible.</p>
      <p><strong>Ticket Details:</strong></p>
      <ul>
        <li><strong>Ticket ID:</strong> ${ticket.id}</li>
        <li><strong>Subject:</strong> ${ticket.subject}</li>
        <li><strong>Category:</strong> ${ticket.category}</li>
        <li><strong>Priority:</strong> ${ticket.priority}</li>
      </ul>
      <p>We'll notify you by email when there's an update to your ticket.</p>
      <p>You can view your ticket status in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">dashboard</a>.</p>
    `;

    // Send notifications to all admin users
    const adminEmailPromises = adminUsers.map(admin => {
      return sendNotificationEmail(
        admin,
        `New Support Ticket: ${ticket.subject}`,
        adminContent
      ).catch(err => {
        console.error(`Failed to send notification email to admin ${admin.email}:`, err);
      });
    });

    // Send notification to the user who created the ticket
    let userEmailPromise;
    if (ticket.User && ticket.User.email) {
      // If the ticket is associated with a user in the system
      userEmailPromise = sendNotificationEmail(
        ticket.User as User,
        'Your Support Ticket Has Been Received',
        userContent
      ).catch(err => {
        console.error(`Failed to send notification email to user ${ticket.userEmail}:`, err);
      });
    } else if (ticket.userEmail) {
      // If there's just an email (no user account)
      const userWithEmail = {
        email: ticket.userEmail,
        name: ticket.userName || ticket.userEmail.split('@')[0]
      } as User;
      
      userEmailPromise = sendNotificationEmail(
        userWithEmail,
        'Your Support Ticket Has Been Received',
        userContent
      ).catch(err => {
        console.error(`Failed to send notification email to user ${ticket.userEmail}:`, err);
      });
    }

    // Wait for all emails to be sent
    if (userEmailPromise) {
      await Promise.all([...adminEmailPromises, userEmailPromise]);
    } else {
      await Promise.all(adminEmailPromises);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending ticket creation notification:', error);
    return { success: false, error };
  }
}

/**
 * Send an email notification when a ticket receives a new message
 */
export async function sendTicketMessageNotification(
  ticket: TicketWithUser, 
  message: { sender: string; content: string; senderName?: string; }
) {
  try {
    const senderRole = message.sender.toLowerCase() === 'admin' ? 'admin' : 'user';
    
    // Get the target user to notify (if admin sent message, notify user; if user sent message, notify admins)
    if (senderRole === 'admin') {
      // Admin replied - notify the user
      if (ticket.userEmail) {
        const userContent = `
          <p>There is a new response to your support ticket.</p>
          <p><strong>Ticket Details:</strong></p>
          <ul>
            <li><strong>Ticket ID:</strong> ${ticket.id}</li>
            <li><strong>Subject:</strong> ${ticket.subject}</li>
          </ul>
          <p><strong>Response:</strong><br>${message.content}</p>
          <p>You can view the full conversation and reply in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">dashboard</a>.</p>
        `;

        // Create a user object with email and name
        const userToNotify = {
          email: ticket.userEmail,
          name: ticket.userName || ticket.userEmail.split('@')[0]
        } as User;
        
        await sendNotificationEmail(
          userToNotify,
          `New Response to Your Support Ticket: ${ticket.subject}`,
          userContent
        );
      }
    } else {
      // User replied - notify admins
      const adminUsers = await prisma.user.findMany({
        where: {
          role: 'admin',
        },
      });

      const adminContent = `
        <p>A user has replied to a support ticket.</p>
        <p><strong>Ticket Details:</strong></p>
        <ul>
          <li><strong>Ticket ID:</strong> ${ticket.id}</li>
          <li><strong>User:</strong> ${ticket.userName} (${ticket.userEmail})</li>
          <li><strong>Subject:</strong> ${ticket.subject}</li>
        </ul>
        <p><strong>User's Message:</strong><br>${message.content}</p>
        <p>Please review and respond to this ticket through the admin dashboard.</p>
        <p>You can view and manage tickets in the <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/support">admin support dashboard</a>.</p>
      `;

      // If there's a specific assigned admin, prioritize notifying them
      if (ticket.respondedBy) {
        const assignedAdmin = await prisma.user.findUnique({
          where: { id: ticket.respondedBy },
        });
        
        if (assignedAdmin) {
          await sendNotificationEmail(
            assignedAdmin,
            `User Reply to Support Ticket: ${ticket.subject}`,
            adminContent
          );
          // Don't need to notify other admins if there's an assigned admin
          return { success: true };
        }
      }

      // Notify all admins if no specific admin is assigned or if we couldn't find the assigned admin
      const adminEmailPromises = adminUsers.map(admin => {
        return sendNotificationEmail(
          admin,
          `User Reply to Support Ticket: ${ticket.subject}`,
          adminContent
        ).catch(err => {
          console.error(`Failed to send notification email to admin ${admin.email}:`, err);
        });
      });

      await Promise.all(adminEmailPromises);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending ticket message notification:', error);
    return { success: false, error };
  }
} 