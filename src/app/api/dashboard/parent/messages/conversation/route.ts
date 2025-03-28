import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;
    
    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }
    
    // First verify that the conversation exists (there are messages between these users)
    const conversationExists = await prisma.message.findFirst({
      where: {
        OR: [
          { AND: [{ senderId: userId }, { receiverId: partnerId }] },
          { AND: [{ senderId: partnerId }, { receiverId: userId }] }
        ]
      }
    });
    
    if (!conversationExists) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Get partner info
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        profileImage: true,
        role: true
      }
    });
    
    if (!partner) {
      return NextResponse.json({ error: 'Conversation partner not found' }, { status: 404 });
    }
    
    // Get messages between these users with pagination
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { AND: [{ senderId: userId }, { receiverId: partnerId }] },
          { AND: [{ senderId: partnerId }, { receiverId: userId }] }
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
            image: true,
            profileImage: true
          }
        }
      }
    });
    
    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        read: false
      },
      data: {
        read: true,
        updatedAt: new Date()
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
        image: message.User_Message_senderIdToUser.profileImage || message.User_Message_senderIdToUser.image,
        isCurrentUser: message.senderId === userId
      }
    }));
    
    // Count total messages for pagination
    const totalMessages = await prisma.message.count({
      where: {
        OR: [
          { AND: [{ senderId: userId }, { receiverId: partnerId }] },
          { AND: [{ senderId: partnerId }, { receiverId: userId }] }
        ]
      }
    });
    
    return NextResponse.json({
      conversationId: partnerId,
      partner: {
        id: partner.id,
        name: partner.name || partner.email,
        image: partner.profileImage || partner.image
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
    console.error('[CONVERSATION_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// API to mark a message as read
export async function PATCH(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get request body
    const body = await request.json();
    const { messageId } = body;
    
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the message exists and belongs to the user
    const message = await prisma.message.findUnique({
      where: {
        id: messageId,
        receiverId: userId
      }
    });
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found or you do not have permission to access it' },
        { status: 404 }
      );
    }
    
    // Update the message to mark it as read
    await prisma.message.update({
      where: {
        id: messageId
      },
      data: {
        read: true,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Message marked as read'
    });
    
  } catch (error) {
    console.error('[MESSAGE_PATCH]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 