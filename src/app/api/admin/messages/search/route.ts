import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;
    
    if (!query || query.trim().length < 3) {
      return NextResponse.json({ 
        error: 'Search query is required and must be at least 3 characters long' 
      }, { status: 400 });
    }
    
    // Search for messages containing the query term
    const messages = await prisma.message.findMany({
      where: {
        content: {
          contains: query
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
      include: {
        User_Message_senderIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true
          }
        },
        User_Message_receiverIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true
          }
        }
      }
    });
    
    // Count total matching messages for pagination
    const totalMessages = await prisma.message.count({
      where: {
        content: {
          contains: query
        }
      }
    });
    
    // Format the messages for response
    const formattedMessages = messages.map(message => {
      // Create a unique conversation ID
      const conversationId = [message.senderId, message.receiverId].sort().join('-');
      
      // Highlight the search term in content (basic implementation)
      let highlightedContent = message.content;
      const lowerQuery = query.toLowerCase();
      const lowerContent = message.content.toLowerCase();
      
      if (lowerContent.includes(lowerQuery)) {
        const startIndex = lowerContent.indexOf(lowerQuery);
        const endIndex = startIndex + query.length;
        
        highlightedContent = message.content.substring(0, startIndex) +
          `<mark>${message.content.substring(startIndex, endIndex)}</mark>` +
          message.content.substring(endIndex);
      }
      
      // Type assertion to ensure TypeScript knows these properties exist
      const sender = message.User_Message_senderIdToUser;
      const receiver = message.User_Message_receiverIdToUser;
      
      return {
        id: message.id,
        content: message.content,
        highlightedContent,
        createdAt: message.createdAt,
        read: message.read,
        conversationId,
        sender: {
          id: sender.id,
          name: sender.name || sender.email,
          image: sender.profileImage || null,
          role: sender.role
        },
        receiver: {
          id: receiver.id,
          name: receiver.name || receiver.email,
          image: receiver.profileImage || null,
          role: receiver.role
        }
      };
    });
    
    return NextResponse.json({
      query,
      messages: formattedMessages,
      pagination: {
        total: totalMessages,
        page,
        limit,
        pages: Math.ceil(totalMessages / limit)
      }
    });
    
  } catch (error) {
    console.error('[ADMIN_MESSAGES_SEARCH_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 