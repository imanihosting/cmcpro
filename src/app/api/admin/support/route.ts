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
            profileImage: true
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
  subject: z.string().min(5, "Subject must be at least 5 characters").max(100, "Subject cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  userId: z.string().uuid("Invalid user ID format").optional().or(z.literal('')).or(z.literal(undefined)),
  userEmail: z.string().email("Invalid email format").optional().or(z.literal('')).or(z.literal(undefined)),
  userName: z.string().optional().or(z.literal('')).or(z.literal(undefined)),
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
    console.log('Request body:', body);
    
    // Validate input
    const validatedData = createTicketSchema.safeParse(body);
    
    if (!validatedData.success) {
      const formattedErrors = validatedData.error.format();
      console.error('Validation errors:', JSON.stringify(formattedErrors));
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validatedData.error.errors 
        },
        { status: 400 }
      );
    }

    const { subject, description, category, priority } = validatedData.data;
    
    // Clean up empty strings to undefined for optional fields
    const userId = validatedData.data.userId ? validatedData.data.userId : undefined;
    const userEmail = validatedData.data.userEmail ? validatedData.data.userEmail : undefined;
    const userName = validatedData.data.userName ? validatedData.data.userName : undefined;
    
    // Either userId or userEmail must be provided
    if (!userId && !userEmail) {
      return NextResponse.json(
        { success: false, message: 'Either userId or userEmail is required' },
        { status: 400 }
      );
    }
    
    // Create the ticket
    const ticketData: any = {
      id: crypto.randomUUID(),
      subject,
      description,
      category,
      status: SupportTicket_status.OPEN,
      priority: priority as SupportTicket_priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If userId is provided, connect to the user
    if (userId) {
      // Check if user exists first
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true }
      });
      
      if (!userExists) {
        return NextResponse.json(
          { success: false, message: 'User not found with the provided ID' },
          { status: 404 }
        );
      }
      
      ticketData.userId = userId;
      
      // Use provided values or fallback to user data
      ticketData.userEmail = userEmail || userExists.email;
      ticketData.userName = userName || userExists.name || userExists.email.split('@')[0];
    } else if (userEmail) {
      // If only email is provided (no user ID)
      // Try to find a user with this email
      const userByEmail = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, name: true }
      });
      
      if (userByEmail) {
        ticketData.userId = userByEmail.id;
        ticketData.userEmail = userEmail;
        ticketData.userName = userName || userByEmail.name || userEmail.split('@')[0];
      } else {
        // No matching user, just use the provided email
        ticketData.userEmail = userEmail;
        ticketData.userName = userName || userEmail.split('@')[0];
      }
    }
    
    // Store message as JSON
    ticketData.messages = JSON.stringify([{
      sender: 'admin',
      senderRole: 'admin',
      senderName: session.user.name || 'Admin',
      content: description,
      timestamp: new Date().toISOString()
    }]);
    
    console.log('Creating ticket with data:', JSON.stringify(ticketData));
    
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
            profileImage: true
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