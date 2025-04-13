import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/msGraph";

export const dynamic = 'force-dynamic';

// Get all active chat sessions (for admin view)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "ACTIVE";
    
    // Get sessions with latest message
    // @ts-ignore - Using raw property names until prisma generate completes successfully
    const sessions = await prisma.chatSession.findMany({
      where: { 
        status: status
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        Agent: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        chatMessages: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });
    
    return NextResponse.json(sessions);
    
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create a new chat session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    const body = await req.json();
    
    // Create a session with either user ID or visitor ID
    // @ts-ignore - Using raw property names until prisma generate completes successfully
    const newSession = await prisma.chatSession.create({
      data: {
        userId: user?.id, // Will be null for unauthenticated users
        visitorId: user ? undefined : body.visitorId,
        metadata: body.metadata || {},
        // Don't assign an agent immediately - will be claimed by an available agent
      }
    });
    
    // Create initial system message
    // @ts-ignore - Using raw property names until prisma generate completes successfully
    await prisma.chatMessage.create({
      data: {
        sessionId: newSession.id,
        senderType: "SYSTEM",
        content: "Chat session started. An agent will be with you shortly."
      }
    });
    
    // Send email notification to admins
    await sendAdminNotificationEmail(newSession, user);
    
    return NextResponse.json(newSession);
    
  } catch (error) {
    console.error("Error creating chat session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Function to send email notification to admins when a new chat is initiated
async function sendAdminNotificationEmail(chatSession: any, user: any) {
  try {
    // Create notification in the database
    await prisma.notification.create({
      data: {
        id: `chat-${chatSession.id}-${Date.now()}`,
        type: "CHAT_STARTED",
        title: "New Live Chat Session",
        message: `A new chat session has been initiated${user ? ` by ${user.name || user.email}` : ` by a visitor`}.`,
        status: "UNREAD",
        updatedAt: new Date(),
        metadata: {
          chatSessionId: chatSession.id,
          timestamp: new Date().toISOString(),
          userName: user?.name || "Anonymous Visitor",
          userEmail: user?.email || "N/A",
          pageUrl: chatSession.metadata?.pageUrl || "",
        }
      }
    });

    // Set support email
    const supportEmail = "support@childminderconnect.com";
    
    // Create HTML email content
    const htmlBody = `
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
        .button {
          display: inline-block;
          background-color: #7c3aed;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 15px;
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
          <h2>New Live Chat Request</h2>
          <p>A new chat session has been initiated${user ? ` by ${user.name || user.email}` : ` by a visitor`}.</p>
          
          <div class="info">
            <p><strong>Session ID:</strong> ${chatSession.id}</p>
            <p><strong>User:</strong> ${user ? `${user.name || 'Unnamed'} (${user.email})` : 'Anonymous Visitor'}</p>
            <p><strong>Page:</strong> ${chatSession.metadata?.pageUrl || 'N/A'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/chat" class="button">Respond to Chat</a>
          
          <p>Thank you,<br>The Childminder Connect Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Childminder Connect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Send email to support
    try {
      await sendEmail({
        to: supportEmail,
        subject: "New Live Chat Session Started",
        body: htmlBody,
        isHtml: true
      });
      console.log("Email notification for new chat session sent to support:", supportEmail);
    } catch (emailError) {
      console.error(`Failed to send email to support ${supportEmail}:`, emailError);
    }
  } catch (error) {
    console.error("Failed to send support notification email:", error);
    // Don't throw - we don't want to fail the chat creation if email fails
  }
} 