import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// Get specific chat session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = params.id;
    
    // Get the chat session
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    // Check if requester is authenticated
    if (session?.user) {
      // Admins can access any session
      if (session.user.role === "admin") {
        return NextResponse.json(chatSession);
      }
      
      // User can access their own sessions
      if (chatSession.userId === session.user.id) {
        return NextResponse.json(chatSession);
      }
      
      // Agent can access sessions assigned to them
      if (chatSession.agentId === session.user.id) {
        return NextResponse.json(chatSession);
      }
    }
    
    // For visitor access, get visitor ID from authorization header or cookie
    const visitorId = request.headers.get('x-visitor-id') || 
                    request.cookies.get('visitor_id')?.value;
    
    // If this is a visitor session and visitor ID matches
    if (!chatSession.userId && chatSession.visitorId && chatSession.visitorId === visitorId) {
      return NextResponse.json(chatSession);
    }

    // Otherwise, unauthorized
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    console.error("Error fetching chat session:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Update chat session (claim, close, transfer)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = params.id;
    const body = await request.json();

    // Get the chat session
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    // For visitor access, get visitor ID from request or cookie
    const visitorId = request.headers.get('x-visitor-id') || 
                    request.cookies.get('visitor_id')?.value;
    
    let isAuthorized = false;
    
    // Check authorization
    if (session?.user) {
      // Admins can update any session
      if (session.user.role === "admin") {
        isAuthorized = true;
      }
      
      // Users can update their own sessions (but only the status)
      if (chatSession.userId === session.user.id && 
          Object.keys(body).length === 1 && 
          body.status === "ACTIVE") {
        isAuthorized = true;
      }
      
      // Agents can update sessions assigned to them
      if (chatSession.agentId === session.user.id) {
        isAuthorized = true;
      }
    } else if (!chatSession.userId && 
               chatSession.visitorId && 
               chatSession.visitorId === visitorId &&
               Object.keys(body).length === 1 && 
               body.status === "ACTIVE") {
      // Visitors can reopen their own sessions
      isAuthorized = true;
    }
    
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the chat session
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: body.status,
        agentId: body.agentId,
        lastActivity: new Date(),
      },
    });

    // If status changed to ACTIVE, add a system message
    if (body.status === "ACTIVE" && chatSession.status === "CLOSED") {
      await prisma.chatMessage.create({
        data: {
          sessionId,
          senderType: "SYSTEM",
          content: "Chat session reopened",
        },
      });
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error updating chat session:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 