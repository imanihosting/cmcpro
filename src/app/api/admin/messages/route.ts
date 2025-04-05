import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    
    // Ensure the user is authenticated and has admin role
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;
    
    // Filter options
    const userFilter = searchParams.get('user') || '';
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate') as string) : null;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate') as string) : null;
    
    // Sort options
    const sortBy = searchParams.get('sortBy') || 'lastMessageTime';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    // First, find all unique conversation pairs between users
    // We're using raw SQL for this query as it's complex to express in Prisma
    
    // Build the WHERE clause for the user filter
    let userFilterClause = '';
    let userFilterParams: any[] = [];
    
    if (userFilter) {
      userFilterClause = `AND (
        EXISTS (
          SELECT 1 FROM User sender 
          WHERE (sender.id = m.senderId AND (sender.name LIKE ? OR sender.email LIKE ?))
        )
        OR EXISTS (
          SELECT 1 FROM User receiver
          WHERE (receiver.id = m.receiverId AND (receiver.name LIKE ? OR receiver.email LIKE ?))
        )
      )`;
      
      const likeParam = `%${userFilter}%`;
      userFilterParams = [likeParam, likeParam, likeParam, likeParam];
    }
    
    // Build the WHERE clause for date range filtering
    let dateFilterClause = '';
    let dateFilterParams: any[] = [];
    
    if (startDate && endDate) {
      dateFilterClause = 'AND m.createdAt BETWEEN ? AND ?';
      dateFilterParams = [startDate, endDate];
    } else if (startDate) {
      dateFilterClause = 'AND m.createdAt >= ?';
      dateFilterParams = [startDate];
    } else if (endDate) {
      dateFilterClause = 'AND m.createdAt <= ?';
      dateFilterParams = [endDate];
    }
    
    // Combine all filter parameters
    const allParams = [...userFilterParams, ...dateFilterParams];
    
    // Build the query with dynamic parameters
    const countQuery = `
      SELECT COUNT(DISTINCT CONCAT(
        LEAST(m.senderId, m.receiverId),
        '-',
        GREATEST(m.senderId, m.receiverId)
      )) as count
      FROM Message m
      WHERE 1=1 ${userFilterClause} ${dateFilterClause}
    `;
    
    // Execute the count query
    const countResult = await prisma.$queryRawUnsafe(countQuery, ...allParams);
    const totalCount = Number((countResult as any)[0].count);
    
    // Define sort column mapping
    const sortColumnMap: Record<string, string> = {
      'lastMessageTime': 'lastMessageTime',
      'creationDate': 'firstMessageTime',
    };
    
    const sortColumn = sortColumnMap[sortBy] || 'lastMessageTime';
    
    // Main query to get conversations with sorting and pagination
    const mainQuery = `
      SELECT 
        LEAST(m.senderId, m.receiverId) as user1Id,
        GREATEST(m.senderId, m.receiverId) as user2Id,
        MAX(m.createdAt) as lastMessageTime,
        MIN(m.createdAt) as firstMessageTime
      FROM Message m
      WHERE 1=1 ${userFilterClause} ${dateFilterClause}
      GROUP BY LEAST(m.senderId, m.receiverId), GREATEST(m.senderId, m.receiverId)
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    
    // Execute the main query
    const conversations = await prisma.$queryRawUnsafe(
      mainQuery,
      ...allParams,
      limit,
      skip
    );
    
    // Get user details and last message for each conversation
    const conversationsWithDetails = await Promise.all(
      (conversations as any[]).map(async (conv) => {
        // Get user1 details
        const user1 = await prisma.user.findUnique({
          where: { id: conv.user1Id },
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true
          }
        });
        
        // Get user2 details
        const user2 = await prisma.user.findUnique({
          where: { id: conv.user2Id },
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true
          }
        });
        
        if (!user1 || !user2) return null;
        
        // Get the last message between these users
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { AND: [{ senderId: conv.user1Id }, { receiverId: conv.user2Id }] },
              { AND: [{ senderId: conv.user2Id }, { receiverId: conv.user1Id }] }
            ]
          },
          orderBy: { createdAt: 'desc' }
        });
        
        // Count total messages in the conversation
        const messageCount = await prisma.message.count({
          where: {
            OR: [
              { AND: [{ senderId: conv.user1Id }, { receiverId: conv.user2Id }] },
              { AND: [{ senderId: conv.user2Id }, { receiverId: conv.user1Id }] }
            ]
          }
        });
        
        // Generate a unique conversation ID using both user IDs
        const conversationId = `${conv.user1Id}-${conv.user2Id}`;
        
        return {
          id: conversationId,
          participants: [
            {
              id: user1.id,
              name: user1.name || user1.email,
              email: user1.email,
              role: user1.role,
              avatar: user1.profileImage || null
            },
            {
              id: user2.id,
              name: user2.name || user2.email,
              email: user2.email,
              role: user2.role,
              avatar: user2.profileImage || null
            }
          ],
          lastMessage: lastMessage?.content || '',
          previewText: lastMessage?.content ? (lastMessage.content.length > 50 ? lastMessage.content.substring(0, 50) + '...' : lastMessage.content) : '',
          lastMessageTime: lastMessage?.createdAt || new Date(),
          formattedTime: lastMessage ? formatTimestamp(lastMessage.createdAt) : '',
          messageCount,
          createdAt: conv.firstMessageTime
        };
      })
    );
    
    // Filter out any null values
    const validConversations = conversationsWithDetails.filter(Boolean);
    
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
    console.error('[ADMIN_MESSAGES_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 