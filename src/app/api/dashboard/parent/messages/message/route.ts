import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// API to get or mark a specific message as read
export async function GET(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get message ID from query parameter
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');
    
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    // Get the message
    const message = await prisma.message.findUnique({
      where: {
        id: messageId,
        OR: [
          { receiverId: userId },
          { senderId: userId }
        ]
      },
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
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found or you do not have permission to access it' },
        { status: 404 }
      );
    }
    
    // Format the message for the response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      read: message.read,
      sender: {
        id: message.User_Message_senderIdToUser.id,
        name: message.User_Message_senderIdToUser.name || message.User_Message_senderIdToUser.email,
        image: message.User_Message_senderIdToUser.profileImage || null,
        role: message.User_Message_senderIdToUser.role,
        isCurrentUser: message.senderId === userId
      }
    };
    
    // Automatically mark the message as read if it's not already and user is the receiver
    if (!message.read && message.receiverId === userId) {
      await prisma.message.update({
        where: {
          id: messageId
        },
        data: {
          read: true,
          updatedAt: new Date()
        }
      });
    }
    
    return NextResponse.json({
      message: formattedMessage
    });
    
  } catch (error) {
    console.error('[MESSAGE_GET]', error);
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