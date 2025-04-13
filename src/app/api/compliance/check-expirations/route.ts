import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '@/lib/email';

// Number of days before expiration to send reminders
const REMINDER_DAYS = [30, 14, 7, 3, 1];

export const dynamic = 'force-dynamic';

// GET /api/compliance/check-expirations - Check for expiring documents and send reminders
export async function GET(req: NextRequest) {
  try {
    // This endpoint should only be accessible to admins or via cron job with a secret token
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get('apiKey');
    
    // Check if the request is from an admin or has a valid API key
    const isAdmin = session?.user?.role === 'admin';
    const hasValidApiKey = apiKey === process.env.COMPLIANCE_API_KEY;
    
    if (!isAdmin && !hasValidApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Set the current date
    const today = new Date();
    
    // Find all documents with expiration dates
    const expiringDocuments = await prisma.document.findMany({
      where: {
        status: 'APPROVED',
        expirationDate: {
          not: null,
        },
      },
      include: {
        User_Document_userIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          }
        }
      }
    }) as any[]; // Using type assertion for now to bypass TypeScript errors

    const results = {
      totalDocuments: expiringDocuments.length,
      expiredDocuments: 0,
      expiringDocuments: 0,
      notificationsSent: 0,
      details: [] as any[]
    };

    // Process each document
    for (const doc of expiringDocuments) {
      const expirationDate = doc.expirationDate as Date;
      const user = doc.User_Document_userIdToUser;
      
      // Skip if user is not available
      if (!user) continue;
      
      const daysUntilExpiration = Math.floor((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check if document is expired
      if (daysUntilExpiration < 0) {
        results.expiredDocuments++;
        
        // If document just expired today and no reminder was sent yet
        if (daysUntilExpiration >= -1 && (!doc.lastReminderDate || doc.lastReminderDate < today)) {
          await sendExpirationNotification(doc, user, 'EXPIRED');
          results.notificationsSent++;
          
          // Update document status to mark as reminded
          await prisma.document.update({
            where: { id: doc.id },
            data: {
              reminderSent: true,
              lastReminderDate: today
            }
          });
          
          results.details.push({
            documentId: doc.id,
            documentName: doc.name,
            userId: user.id,
            userName: user.name,
            status: 'EXPIRED',
            daysUntilExpiration
          });
        }
        continue;
      }
      
      // Check if document is about to expire and needs a reminder
      for (const reminderDay of REMINDER_DAYS) {
        if (daysUntilExpiration === reminderDay) {
          results.expiringDocuments++;
          
          // Send notification
          await sendExpirationNotification(doc, user, 'EXPIRING', daysUntilExpiration);
          results.notificationsSent++;
          
          // Update document to mark as reminded
          await prisma.document.update({
            where: { id: doc.id },
            data: {
              reminderSent: true,
              lastReminderDate: today
            }
          });
          
          results.details.push({
            documentId: doc.id,
            documentName: doc.name, 
            userId: user.id,
            userName: user.name,
            status: 'EXPIRING',
            daysUntilExpiration
          });
          
          break; // Only send one reminder for the most imminent threshold
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error checking document expirations:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while checking document expirations' },
      { status: 500 }
    );
  }
}

// Helper function to send expiration notifications
async function sendExpirationNotification(
  document: any,
  user: { id: string; name: string | null; email: string; phoneNumber: string | null },
  type: 'EXPIRING' | 'EXPIRED',
  daysRemaining?: number
) {
  try {
    const title = type === 'EXPIRED' 
      ? `Document Expired: ${document.name}`
      : `Document Expiring Soon: ${document.name}`;
    
    const message = type === 'EXPIRED'
      ? `Your document "${document.name}" has expired. Please upload a renewed version as soon as possible.`
      : `Your document "${document.name}" will expire in ${daysRemaining} days. Please upload a renewed version before it expires.`;
    
    // Create in-app notification
    await prisma.notification.create({
      data: {
        id: uuidv4(),
        type: type === 'EXPIRED' ? 'DOCUMENT_EXPIRED' : 'DOCUMENT_EXPIRING',
        title,
        message,
        status: 'UNREAD',
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          documentId: document.id,
          documentName: document.name,
          expirationDate: document.expirationDate,
          daysRemaining: daysRemaining || 0
        }
      }
    });

    // Send email notification if user has email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: title,
        text: message,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
              }
              .header {
                background-color: #7c3aed;
                color: white;
                padding: 15px 20px;
                border-radius: 5px 5px 0 0;
              }
              .logo {
                display: flex;
                align-items: center;
              }
              .logo-icon {
                width: 32px;
                height: 32px;
                margin-right: 10px;
              }
              .logo-text {
                color: white;
                font-weight: bold;
                font-size: 20px;
              }
              .content {
                padding: 20px;
              }
              .info {
                background-color: #f3f4f6;
                padding: 15px;
                border-radius: 5px;
                margin-top: 15px;
              }
              .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #666;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">
                  <img class="logo-icon" src="${process.env.NEXT_PUBLIC_APP_URL}/images/logo.svg" alt="ChildminderConnect Logo" />
                  <span class="logo-text">ChildminderConnect</span>
                </div>
              </div>
              <div class="content">
                <h2>${title}</h2>
                <p>${message}</p>
                <div class="info">
                  <p><strong>Document Details:</strong></p>
                  <ul>
                    <li><strong>Name:</strong> ${document.name}</li>
                    <li><strong>Type:</strong> ${document.type}</li>
                    <li><strong>Expiration Date:</strong> ${document.expirationDate.toLocaleDateString()}</li>
                  </ul>
                </div>
                <p>Please log in to your account to upload a renewed document.</p>
                <p>Thank you,<br>The Childminder Connect Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} Childminder Connect. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });
    }
    
    // Log activity
    await prisma.userActivityLog.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        action: type === 'EXPIRED' ? 'DOCUMENT_EXPIRED_NOTIFICATION' : 'DOCUMENT_EXPIRING_NOTIFICATION',
        details: JSON.stringify({
          documentId: document.id,
          documentName: document.name,
          notificationType: type,
          daysRemaining: daysRemaining || 0,
          sentAt: new Date()
        }),
        timestamp: new Date()
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
} 