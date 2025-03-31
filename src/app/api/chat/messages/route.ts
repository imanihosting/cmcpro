import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get messages for a specific chat session
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the session ID from query parameters
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }
    
    // Check if user has access to this session (as admin or as the user in the session)
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, agentId: true }
    });
    
    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }
    
    // Only allow access if user is the session user, the assigned agent, or an admin
    if (chatSession.userId !== user.id && chatSession.agentId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get messages for the session
    const messages = await prisma.chatMessage.findMany({
      where: { 
        sessionId: sessionId 
      },
      orderBy: {
        timestamp: 'asc'
      },
      include: {
        Sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      }
    });
    
    return NextResponse.json(messages);
    
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Send a new message in a chat session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { sessionId, content } = body;
    
    if (!sessionId || !content) {
      return NextResponse.json({ error: "Session ID and content are required" }, { status: 400 });
    }
    
    // Check if user has access to this session
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, agentId: true, status: true }
    });
    
    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }
    
    // Only allow sending if user is the session user, the assigned agent, or an admin
    if (chatSession.userId !== user.id && chatSession.agentId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Don't allow messages if the session is closed
    if (chatSession.status === "CLOSED") {
      return NextResponse.json({ error: "This chat session is closed" }, { status: 400 });
    }
    
    // Determine sender type (AGENT or USER)
    const senderType = user.role === "admin" || user.id === chatSession.agentId ? "AGENT" : "USER";
    
    // Create the message
    const newMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        senderId: user.id,
        senderType,
        content
      }
    });
    
    // Update the session's lastActivity timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { 
        lastActivity: new Date(),
        // If agent is sending first message, assign them to the chat
        agentId: (senderType === "AGENT" && !chatSession.agentId) ? user.id : undefined
      }
    });
    
    return NextResponse.json(newMessage);
    
  } catch (error) {
    console.error("Error sending chat message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 