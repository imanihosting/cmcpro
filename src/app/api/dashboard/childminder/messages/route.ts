import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
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
    
    // Get all conversations where the user is either sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        User_Message_senderIdToUser: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true
          }
        },
        User_Message_receiverIdToUser: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true
          }
        }
      }
    });
    
    // Group messages by conversation partner and get latest message
    const conversationsMap = new Map();
    
    messages.forEach(message => {
      const isUserSender = message.senderId === session.user.id;
      const partner = isUserSender 
        ? message.User_Message_receiverIdToUser 
        : message.User_Message_senderIdToUser;
      
      // Only include conversations with parents
      if (partner.role !== 'parent') return;
      
      if (!conversationsMap.has(partner.id)) {
        conversationsMap.set(partner.id, {
          id: message.id,
          partnerId: partner.id,
          participant: partner.name,
          avatar: partner.image || null,
          lastMessage: message.content,
          timestamp: message.createdAt,
          unreadCount: !isUserSender && !message.read ? 1 : 0,
          createdAt: message.createdAt
        });
      } else if (!message.read && !isUserSender) {
        const conv = conversationsMap.get(partner.id);
        conv.unreadCount += 1;
      }
    });
    
    // Convert map to array and sort by latest message
    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 