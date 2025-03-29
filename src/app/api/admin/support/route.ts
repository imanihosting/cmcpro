import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { SupportTicket_status, SupportTicket_priority } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate pagination
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Build filter conditions
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const totalCount = await prisma.supportTicket.count({ where });
    
    // Get paginated tickets
    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Format the response to match what the frontend expects
    return NextResponse.json({
      success: true,
      tickets: tickets.map(ticket => ({
        id: ticket.id,
        userId: ticket.userId,
        userEmail: ticket.userEmail,
        userName: ticket.userName,
        subject: ticket.subject,
        category: ticket.category,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        respondedBy: ticket.respondedBy,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        user: ticket.User
      })),
      pagination: {
        total: totalCount,
        pages: totalPages,
        currentPage: page,
        limit: limit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching admin support tickets:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

// Schema for ticket creation
const createTicketSchema = z.object({
  subject: z.string().min(5).max(100),
  description: z.string().min(10),
  category: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  userId: z.string().uuid().optional(),
  userEmail: z.string().email().optional(),
  userName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validatedData = createTicketSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validatedData.error.errors 
        },
        { status: 400 }
      );
    }

    const { subject, description, category, priority, userId, userEmail, userName } = validatedData.data;
    
    // Create the ticket
    const ticketData: any = {
      id: crypto.randomUUID(),
      subject,
      description,
      category,
      status: SupportTicket_status.OPEN,
      priority: priority as SupportTicket_priority || SupportTicket_priority.MEDIUM,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If userId is provided, connect to the user
    if (userId) {
      ticketData.userId = userId;
      // Get user details if not provided
      if (!userEmail || !userName) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true }
        });
        
        if (!user) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }
        
        ticketData.userEmail = userEmail || user.email;
        ticketData.userName = userName || user.name || user.email.split('@')[0];
      } else {
        ticketData.userEmail = userEmail;
        ticketData.userName = userName;
      }
    } else if (userEmail) {
      // If only email is provided (no user ID)
      ticketData.userId = session.user.id; // Use admin's ID as fallback
      ticketData.userEmail = userEmail;
      ticketData.userName = userName || userEmail.split('@')[0];
    } else {
      return NextResponse.json(
        { success: false, message: 'Either userId or userEmail is required' },
        { status: 400 }
      );
    }
    
    // Store message as JSON
    ticketData.messages = JSON.stringify([{
      sender: 'admin',
      senderRole: 'admin',
      senderName: session.user.name || 'Admin',
      content: description,
      timestamp: new Date().toISOString()
    }]);
    
    // Create the ticket
    const newTicket = await prisma.supportTicket.create({
      data: ticketData,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      data: {
        id: newTicket.id,
        userId: newTicket.userId,
        userEmail: newTicket.userEmail,
        userName: newTicket.userName,
        subject: newTicket.subject,
        category: newTicket.category,
        description: newTicket.description,
        status: newTicket.status,
        priority: newTicket.priority,
        respondedBy: newTicket.respondedBy,
        createdAt: newTicket.createdAt.toISOString(),
        updatedAt: newTicket.updatedAt.toISOString(),
        user: newTicket.User
      }
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
} 