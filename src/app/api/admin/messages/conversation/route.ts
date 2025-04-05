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
    const conversationId = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;
    
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    
    // Parse the conversation ID to get participant IDs
    const participantIds = conversationId.split('-');
    if (participantIds.length !== 2) {
      return NextResponse.json({ error: 'Invalid conversation ID format' }, { status: 400 });
    }
    
    const [user1Id, user2Id] = participantIds;
    
    // Get participant details
    const user1 = await prisma.user.findUnique({
      where: { id: user1Id },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        role: true
      }
    });
    
    const user2 = await prisma.user.findUnique({
      where: { id: user2Id },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        role: true
      }
    });
    
    if (!user1 || !user2) {
      return NextResponse.json({ error: 'One or more conversation participants not found' }, { status: 404 });
    }
    
    // Get messages between these users with pagination
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { AND: [{ senderId: user1Id }, { receiverId: user2Id }] },
          { AND: [{ senderId: user2Id }, { receiverId: user1Id }] }
        ]
      },
      orderBy: { createdAt: 'asc' },
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
        }
      }
    });
    
    // Format messages for response
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      read: message.read,
      sender: {
        id: message.User_Message_senderIdToUser.id,
        name: message.User_Message_senderIdToUser.name || message.User_Message_senderIdToUser.email,
        email: message.User_Message_senderIdToUser.email,
        image: message.User_Message_senderIdToUser.profileImage || null,
        role: message.User_Message_senderIdToUser.role
      }
    }));
    
    // Count total messages for pagination
    const totalMessages = await prisma.message.count({
      where: {
        OR: [
          { AND: [{ senderId: user1Id }, { receiverId: user2Id }] },
          { AND: [{ senderId: user2Id }, { receiverId: user1Id }] }
        ]
      }
    });
    
    // Get the first message time for conversation metadata
    const firstMessage = await prisma.message.findFirst({
      where: {
        OR: [
          { AND: [{ senderId: user1Id }, { receiverId: user2Id }] },
          { AND: [{ senderId: user2Id }, { receiverId: user1Id }] }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
    
    return NextResponse.json({
      conversationId,
      participants: [
        {
          id: user1.id,
          name: user1.name || user1.email,
          email: user1.email,
          avatar: user1.profileImage || null,
          role: user1.role
        },
        {
          id: user2.id,
          name: user2.name || user2.email,
          email: user2.email,
          avatar: user2.profileImage || null,
          role: user2.role
        }
      ],
      metadata: {
        createdAt: firstMessage?.createdAt || null,
        messageCount: totalMessages
      },
      messages: formattedMessages,
      pagination: {
        total: totalMessages,
        page,
        limit,
        pages: Math.ceil(totalMessages / limit)
      }
    });
    
  } catch (error) {
    console.error('[ADMIN_CONVERSATION_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 