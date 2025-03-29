import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/msGraph";
import { v4 as uuidv4 } from 'uuid';

/**
 * API endpoint to send a test email notification
 * POST /api/notifications/email
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }
    
    // Only admins can send test emails
    if (session.user.role !== "admin" && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: "You must be an admin to send test emails in production" },
        { status: 403 }
      );
    }
    
    // Get request body
    const { recipientId, subject, content } = await req.json();
    
    if (!recipientId || !subject || !content) {
      return NextResponse.json(
        { error: "Missing required fields: recipientId, subject, content" },
        { status: 400 }
      );
    }
    
    // Get recipient user
    const user = await prisma.user.findUnique({
      where: { id: recipientId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "Recipient user not found" },
        { status: 404 }
      );
    }
    
    if (!user.email) {
      return NextResponse.json(
        { error: "Recipient user does not have an email address" },
        { status: 400 }
      );
    }
    
    // Send the email
    await sendNotificationEmail(user, subject, content);
    
    // Log the notification
    await prisma.userActivityLog.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        action: "EMAIL_NOTIFICATION_SENT",
        details: `Email notification sent: ${subject}`,
        timestamp: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Email sent to ${user.email}`
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
    return NextResponse.json(
      { error: "Failed to send email notification" },
      { status: 500 }
    );
  }
} 