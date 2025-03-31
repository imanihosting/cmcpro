import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get specific chat session
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const sessionId = params.id;
    
    // Get the chat session
    // @ts-ignore - Using raw property names until prisma generate completes successfully
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
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
        }
      }
    });
    
    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }
    
    // Only allow access if user is the session user, the assigned agent, or an admin
    if (chatSession.userId !== user.id && chatSession.agentId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json(chatSession);
    
  } catch (error) {
    console.error("Error fetching chat session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update chat session (claim, close, transfer)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const sessionId = params.id;
    const body = await req.json();
    const { status, agentId } = body;
    
    // Check if chat session exists
    // @ts-ignore - Using raw property names until prisma generate completes successfully
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { status: true, userId: true }
    });
    
    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }
    
    // Check permissions:
    // 1. Admins can do anything
    // 2. Regular users can only reopen their own closed chats
    if (user.role !== "admin") {
      // Non-admin users can only reopen their own chats
      if (!(status === "ACTIVE" && chatSession.status === "CLOSED" && chatSession.userId === user.id)) {
        return NextResponse.json({ error: "Unauthorized. Only admins can perform this action or users can only reopen their own chats." }, { status: 401 });
      }
    }
    
    // Update the chat session
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      if (status === "CLOSED") {
        updateData.endedAt = new Date();
      } else if (status === "ACTIVE" && chatSession.status === "CLOSED") {
        // If reopening a chat, clear the endedAt field
        updateData.endedAt = null;
      }
    }
    
    if (agentId) {
      updateData.agentId = agentId;
    }
    
    // Always update lastActivity when chat status changes
    updateData.lastActivity = new Date();
    
    // @ts-ignore - Using raw property names until prisma generate completes successfully
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: updateData
    });
    
    // If status changed, add a system message
    if (status && status !== chatSession.status) {
      let message = "";
      
      if (status === "CLOSED") {
        message = "This chat session has been closed.";
      } else if (status === "TRANSFERRED") {
        message = "This chat is being transferred to another agent.";
      } else if (status === "ACTIVE" && chatSession.status === "CLOSED") {
        message = "This chat session has been reopened.";
      }
      
      if (message) {
        // @ts-ignore - Using raw property names until prisma generate completes successfully
        await prisma.chatMessage.create({
          data: {
            sessionId,
            senderType: "SYSTEM",
            content: message
          }
        });
      }
    }
    
    return NextResponse.json(updatedSession);
    
  } catch (error) {
    console.error("Error updating chat session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 