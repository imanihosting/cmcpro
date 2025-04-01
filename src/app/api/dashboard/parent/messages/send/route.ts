import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { sendMessageToUser } from '@/lib/sse';

interface SendMessageRequest {
  receiverId: string;
  content: string;
}

export async function POST(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const senderId = session.user.id;
    
    // Parse request body
    const body: SendMessageRequest = await request.json();
    const { receiverId, content } = body;
    
    // Validate required fields
    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Receiver ID and content are required' }, { status: 400 });
    }
    
    // Verify receiver exists and is a childminder
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, role: true }
    });
    
    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }
    
    // Check if they have a booking relationship or existing messages
    const hasBookingRelationship = await prisma.booking.findFirst({
      where: {
        parentId: senderId,
        childminderId: receiverId
      }
    });
    
    const hasExistingMessages = await prisma.message.findFirst({
      where: {
        OR: [
          { AND: [{ senderId: senderId }, { receiverId: receiverId }] },
          { AND: [{ senderId: receiverId }, { receiverId: senderId }] }
        ]
      }
    });
    
    const canMessage = hasBookingRelationship || hasExistingMessages;
    
    // Uncomment this check if you want to restrict messaging only to connected users
    /*
    if (!canMessage) {
      return NextResponse.json({ 
        error: 'You can only send messages to childminders you have booked with' 
      }, { status: 403 });
    }
    */
    
    // Create the message
    const message = await prisma.message.create({
      data: {
        id: uuidv4(),
        senderId,
        receiverId,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
        read: false
      },
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
    
    // Format the response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      read: message.read,
      sender: {
        id: message.User_Message_senderIdToUser.id,
        name: message.User_Message_senderIdToUser.name || message.User_Message_senderIdToUser.email,
        image: message.User_Message_senderIdToUser.profileImage || message.User_Message_senderIdToUser.image,
        isCurrentUser: true
      }
    };
    
    // Send real-time notification to the recipient
    const notificationForRecipient = {
      ...formattedMessage,
      sender: {
        ...formattedMessage.sender,
        isCurrentUser: false
      }
    };
    
    // Send to receiver
    sendMessageToUser(
      receiverId,
      'new-message',
      notificationForRecipient
    );
    
    // Also send to sender for multi-device sync
    sendMessageToUser(
      senderId,
      'new-message',
      formattedMessage
    );
    
    return NextResponse.json({ message: formattedMessage }, { status: 201 });
    
  } catch (error) {
    console.error('[SEND_MESSAGE_POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 