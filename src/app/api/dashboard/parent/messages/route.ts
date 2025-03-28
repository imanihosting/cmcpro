import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const userRole = session.user.role;
    
    // Only allow parents to access this endpoint
    if (userRole !== 'parent') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    // Get unread messages
    const unreadMessages = await prisma.message.findMany({
      where: {
        receiverId: userId,
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        User_Message_senderIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      }
    });
    
    // Format messages for response
    const formattedMessages = unreadMessages.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      read: message.read,
      sender: {
        id: message.User_Message_senderIdToUser.id,
        name: message.User_Message_senderIdToUser.name,
        email: message.User_Message_senderIdToUser.email,
        image: message.User_Message_senderIdToUser.image,
        role: message.User_Message_senderIdToUser.role
      }
    }));
    
    // Return the messages
    return NextResponse.json({
      messages: formattedMessages,
      count: formattedMessages.length,
      total: await prisma.message.count({
        where: {
          receiverId: userId,
          read: false
        }
      })
    });
    
  } catch (error) {
    console.error('Error fetching parent messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
} 