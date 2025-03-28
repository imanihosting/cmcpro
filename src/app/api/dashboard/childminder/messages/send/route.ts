import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { broadcastMessage } from '@/lib/sse';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify user is a childminder
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    
    if (!user || user.role !== 'childminder') {
      return NextResponse.json(
        { error: 'Unauthorized - Childminder access only' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { receiverId, content } = body;
    
    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }
    
    // Verify the receiver is a parent
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { role: true }
    });
    
    if (!receiver || receiver.role !== 'parent') {
      return NextResponse.json(
        { error: 'Invalid receiver ID' },
        { status: 400 }
      );
    }
    
    // Create the message
    const message = await prisma.message.create({
      data: {
        id: uuidv4(),
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        User_Message_senderIdToUser: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
    
    // Format the message for the response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      read: message.read,
      sender: {
        id: message.User_Message_senderIdToUser.id,
        name: message.User_Message_senderIdToUser.name,
        image: message.User_Message_senderIdToUser.image,
        isCurrentUser: true
      }
    };
    
    // Broadcast the new message to both sender and receiver
    broadcastMessage('new-message', {
      message: {
        ...formattedMessage,
        sender: {
          ...formattedMessage.sender,
          isCurrentUser: false
        }
      },
      conversationId: receiverId
    }, session.user.id, receiverId);
    
    return NextResponse.json({ message: formattedMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 