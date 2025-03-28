import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

// API to mark a message as read
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
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
    
    // Check if the message exists and belongs to the user
    const message = await prisma.message.findUnique({
      where: {
        id,
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
    const updatedMessage = await prisma.message.update({
      where: {
        id
      },
      data: {
        read: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Message marked as read'
    });
    
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}

// API to get a specific message
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
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
    
    // Get the message
    const message = await prisma.message.findUnique({
      where: {
        id,
        receiverId: userId
      },
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
      read: message.read,
      sender: {
        id: message.User_Message_senderIdToUser.id,
        name: message.User_Message_senderIdToUser.name,
        email: message.User_Message_senderIdToUser.email,
        image: message.User_Message_senderIdToUser.image,
        role: message.User_Message_senderIdToUser.role
      }
    };
    
    // Automatically mark the message as read if it's not already
    if (!message.read) {
      await prisma.message.update({
        where: {
          id
        },
        data: {
          read: true
        }
      });
    }
    
    return NextResponse.json({
      message: formattedMessage
    });
    
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    );
  }
} 