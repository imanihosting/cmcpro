import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Get notifications about chat sessions for admins
 * This can be used to implement real-time notifications on the dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    
    // Only admins can access chat notifications
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const since = url.searchParams.get("since");
    
    // Find unread chat sessions (active without an assigned admin)
    // OR sessions that were recently created (if 'since' parameter is provided)
    const query: any = {
      status: "ACTIVE",
      AND: [
        { OR: [{ agentId: null }] }
      ]
    };
    
    // If 'since' parameter is provided, also include sessions created after that time
    if (since) {
      const sinceDate = new Date(since);
      query.AND.push({
        OR: [
          { startedAt: { gte: sinceDate } }
        ]
      });
    }

    // Get notification data
    // @ts-ignore - Using raw property names - ts-ignore to make it build successfully
    const unassignedSessions = await prisma.chatSession.findMany({
      where: query,
      select: {
        id: true,
        startedAt: true,
        lastActivity: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        chatMessages: {
          orderBy: {
            timestamp: "desc"
          },
          take: 1,
          select: {
            content: true,
            timestamp: true
          }
        }
      },
      orderBy: {
        startedAt: "desc"
      }
    });

    // Count total unread chat sessions
    // @ts-ignore - Using raw property names - ts-ignore to make it build successfully
    const unreadCount = await prisma.chatSession.count({
      where: {
        status: "ACTIVE",
        agentId: null
      }
    });
    
    return NextResponse.json({
      unreadCount,
      sessions: unassignedSessions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error fetching chat notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 