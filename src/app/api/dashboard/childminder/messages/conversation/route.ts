import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
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
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50; // Messages per page
    
    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }
    
    // Verify the partner is a parent
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        image: true,
        role: true
      }
    });
    
    if (!partner || partner.role !== 'parent') {
      return NextResponse.json(
        { error: 'Invalid partner ID' },
        { status: 400 }
      );
    }
    
    // Get total message count for pagination
    const totalMessages = await prisma.message.count({
      where: {
        OR: [
          { AND: [{ senderId: session.user.id }, { receiverId: partnerId }] },
          { AND: [{ senderId: partnerId }, { receiverId: session.user.id }] }
        ]
      }
    });
    
    // Calculate pagination values
    const totalPages = Math.ceil(totalMessages / limit);
    const skip = (page - 1) * limit;
    
    // Get messages for the conversation
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { AND: [{ senderId: session.user.id }, { receiverId: partnerId }] },
          { AND: [{ senderId: partnerId }, { receiverId: session.user.id }] }
        ]
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
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
    
    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: session.user.id,
        read: false
      },
      data: { read: true }
    });
    
    // Format messages for the response
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      read: message.read,
      sender: {
        id: message.User_Message_senderIdToUser.id,
        name: message.User_Message_senderIdToUser.name,
        image: message.User_Message_senderIdToUser.image,
        isCurrentUser: message.senderId === session.user.id
      }
    }));
    
    return NextResponse.json({
      messages: formattedMessages,
      partner: {
        id: partner.id,
        name: partner.name,
        image: partner.image
      },
      pagination: {
        total: totalMessages,
        page,
        limit,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 