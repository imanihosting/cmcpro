import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const sessions = await prisma.ChatSession.findMany({
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
    const newSession = await prisma.ChatSession.create({
      data: {
        userId: user?.id, // Will be null for unauthenticated users
        visitorId: user ? undefined : body.visitorId,
        metadata: body.metadata || {},
        // Don't assign an agent immediately - will be claimed by an available agent
      }
    });
    
    // Create initial system message
    await prisma.ChatMessage.create({
      data: {
        sessionId: newSession.id,
        senderType: "SYSTEM",
        content: "Chat session started. An agent will be with you shortly."
      }
    });
    
    return NextResponse.json(newSession);
    
  } catch (error) {
    console.error("Error creating chat session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 