import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// Helper function to format date/time
function formatTimestamp(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date >= today) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (date >= yesterday) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;
    
    // Find all conversations where the user is either sender or receiver
    // We use a subquery approach to find unique conversations and get the latest message
    
    // First, find all unique conversation partners
    const uniqueConversations = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN m.senderId = ${userId} THEN m.receiverId 
          ELSE m.senderId 
        END as partnerId,
        MAX(m.createdAt) as lastMessageTime
      FROM Message m
      WHERE m.senderId = ${userId} OR m.receiverId = ${userId}
      GROUP BY partnerId
      ORDER BY lastMessageTime DESC
      LIMIT ${limit} OFFSET ${skip}
    `;
    
    // Get the conversations with user info and last message
    const conversationsWithDetails = await Promise.all(
      (uniqueConversations as { partnerId: string, lastMessageTime: Date }[]).map(async (conv) => {
        // Get the partner user info
        const partner = await prisma.user.findUnique({
          where: { id: conv.partnerId },
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true
          }
        });
        
        if (!partner) return null;
        
        // Get the last message between these users
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { AND: [{ senderId: userId }, { receiverId: conv.partnerId }] },
              { AND: [{ senderId: conv.partnerId }, { receiverId: userId }] }
            ]
          },
          orderBy: { createdAt: 'desc' }
        });
        
        // Count unread messages
        const unreadCount = await prisma.message.count({
          where: {
            senderId: conv.partnerId,
            receiverId: userId,
            read: false
          }
        });
        
        return {
          id: uuidv4(), // Generate a unique conversation ID (in a production app, you might want to store this)
          partnerId: partner.id,
          participant: partner.name || partner.email,
          avatar: partner.profileImage || null,
          role: partner.role,
          lastMessage: lastMessage?.content || '',
          timestamp: lastMessage ? formatTimestamp(lastMessage.createdAt) : '',
          createdAt: lastMessage?.createdAt || new Date(),
          unreadCount
        };
      })
    );
    
    // Filter out any null values and sort by most recent
    const validConversations = conversationsWithDetails
      .filter(Boolean)
      .sort((a, b) => b!.createdAt.getTime() - a!.createdAt.getTime());
    
    // Count total conversations for pagination
    const totalConversations = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT 
        CASE 
          WHEN m.senderId = ${userId} THEN m.receiverId 
          ELSE m.senderId 
        END) as count
      FROM Message m
      WHERE m.senderId = ${userId} OR m.receiverId = ${userId}
    `;
    
    const totalCount = Number((totalConversations as any)[0].count);
    
    return NextResponse.json({
      conversations: validConversations,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('[MESSAGES_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 