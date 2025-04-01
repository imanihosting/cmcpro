import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Get messages for a specific chat session
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Find the chat session to check permissions
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    // Determine if requester is authorized
    let isAuthorized = false;
    
    // Check user authentication
    if (session?.user) {
      // Admin can access any messages
      if (session.user.role === "admin") {
        isAuthorized = true;
      }
      // User can access their own messages
      else if (chatSession.userId === session.user.id) {
        isAuthorized = true;
      }
      // Agent can access messages for sessions they're assigned to
      else if (chatSession.agentId === session.user.id) {
        isAuthorized = true;
      }
    } else {
      // For visitor access, get visitor ID
      const visitorId = request.headers.get('x-visitor-id') || 
                       request.cookies.get('visitor_id')?.value;
      
      // Visitor can access their own messages if they have correct visitor ID
      if (!chatSession.userId && chatSession.visitorId === visitorId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get messages for this session
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Send a new message in a chat session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { sessionId, content } = body;

    if (!sessionId || !content) {
      return NextResponse.json(
        { error: "Session ID and content are required" },
        { status: 400 }
      );
    }

    // Find the chat session to check permissions
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    // Determine if sender is authorized and set sender type
    let senderType = "USER";
    let isAuthorized = false;
    
    // For authenticated users
    if (session?.user) {
      // Admin users
      if (session.user.role === "admin") {
        senderType = "AGENT";
        isAuthorized = true;
      }
      // Regular users can only send messages to their own sessions
      else if (chatSession.userId === session.user.id) {
        senderType = "USER";
        isAuthorized = true;
      }
      // Agents can send messages to sessions they're assigned to
      else if (chatSession.agentId === session.user.id) {
        senderType = "AGENT";
        isAuthorized = true;
      }
    } else {
      // For visitor access
      const visitorId = request.headers.get('x-visitor-id') || 
                       request.cookies.get('visitor_id')?.value;
      
      // Visitor can send messages to their own session
      if (!chatSession.userId && chatSession.visitorId === visitorId) {
        senderType = "USER";
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        senderType,
        content,
        senderId: session?.user?.id || chatSession.visitorId || undefined,
      },
    });

    // Update the session's lastActivity timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating chat message:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 