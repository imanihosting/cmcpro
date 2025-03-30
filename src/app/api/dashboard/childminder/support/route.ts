import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { SupportTicket_status, SupportTicket_priority, User_role } from '@prisma/client';
import { sendTicketCreationNotification } from "@/lib/ticketNotifications";

// GET handler to retrieve all support tickets for the authenticated childminder
export async function GET(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the user is a childminder
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    
    if (!user || user.role !== User_role.childminder) {
      return NextResponse.json({ error: 'Access denied. Childminder role required.' }, { status: 403 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build the query
    const whereClause: any = {
      userId: session.user.id
    };
    
    // Handle status filter
    if (statusParam && Object.values(SupportTicket_status).includes(statusParam as SupportTicket_status)) {
      whereClause.status = statusParam;
    }
    
    // Count total tickets for pagination
    const totalTickets = await prisma.supportTicket.count({
      where: whereClause
    });
    
    // Fetch tickets with pagination
    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    });
    
    return NextResponse.json({
      tickets,
      pagination: {
        total: totalTickets,
        page,
        limit,
        totalPages: Math.ceil(totalTickets / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

// POST handler to create a new support ticket
export async function POST(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the user has childminder role
    if (session.user.role !== 'childminder') {
      return NextResponse.json({ error: 'Childminder access required' }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.subject || !body.description || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, description, and category are required' },
        { status: 400 }
      );
    }
    
    // Create the support ticket
    const newTicket = await prisma.supportTicket.create({
      data: {
        id: uuidv4(),
        userId: session.user.id,
        userEmail: session.user.email || '',
        userName: session.user.name || 'Anonymous Childminder',
        subject: body.subject,
        description: body.description,
        category: body.category,
        status: SupportTicket_status.OPEN,
        priority: body.priority ? body.priority : SupportTicket_priority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: JSON.stringify([{
          sender: 'user',
          senderName: session.user.name || 'Childminder',
          content: body.description,
          timestamp: new Date().toISOString()
        }])
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    // Send email notification
    try {
      await sendTicketCreationNotification(newTicket);
    } catch (emailError) {
      console.error('Error sending ticket creation notification:', emailError);
      // Continue with the response even if email sending fails
    }
    
    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
} 