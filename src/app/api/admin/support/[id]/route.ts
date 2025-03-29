import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { SupportTicket_status, SupportTicket_priority } from '@prisma/client';

// GET handler to retrieve a specific support ticket by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the user has admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Get ticket ID from URL params
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch the support ticket with user details
    const ticket = await prisma.supportTicket.findUnique({
      where: {
        id: id
      }
    });
    
    // Check if ticket exists
    if (!ticket) {
      return NextResponse.json(
        { error: 'Support ticket not found' },
        { status: 404 }
      );
    }
    
    // Get user details if respondedBy is set
    let assignedAdmin = null;
    if (ticket.respondedBy) {
      assignedAdmin = await prisma.user.findUnique({
        where: { id: ticket.respondedBy },
        select: { 
          id: true, 
          name: true, 
          email: true, 
          profileImage: true
        }
      });
    }
    
    // Get submitter details if this is a real user
    let submitter = null;
    if (ticket.userId && ticket.userId !== '00000000-0000-0000-0000-000000000000') {
      submitter = await prisma.user.findUnique({
        where: { id: ticket.userId },
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true, 
          profileImage: true
        }
      });
    }
    
    // Return ticket with user details
    return NextResponse.json({
      ...ticket,
      assignedAdmin,
      submitter: submitter || {
        name: ticket.userName,
        email: ticket.userEmail,
      }
    });
    
  } catch (error) {
    console.error('[ADMIN_SUPPORT_GET_ID]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH handler to update a support ticket status, priority, or add a response
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the user has admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Get ticket ID from URL params
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Find the ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: {
        id: id
      }
    });
    
    // Check if ticket exists
    if (!ticket) {
      return NextResponse.json(
        { error: 'Support ticket not found' },
        { status: 404 }
      );
    }
    
    // Prepare data for update
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Update status if provided and valid
    if (body.status && Object.values(SupportTicket_status).includes(body.status)) {
      updateData.status = body.status;
    }
    
    // Update priority if provided and valid
    if (body.priority && Object.values(SupportTicket_priority).includes(body.priority)) {
      updateData.priority = body.priority;
    }
    
    // Assign to admin (could be re-assignment)
    if (body.assignTo) {
      // Validate the assignee is a real admin
      const assignee = await prisma.user.findUnique({
        where: { id: body.assignTo },
        select: { id: true, role: true }
      });
      
      if (!assignee || assignee.role !== 'admin') {
        return NextResponse.json(
          { error: 'Invalid assignee - must be an admin user' },
          { status: 400 }
        );
      }
      
      updateData.respondedBy = body.assignTo;
    }
    
    // Handle new admin message
    if (body.message) {
      // Parse existing messages or create a new array
      let messages = [];
      if (ticket.messages) {
        try {
          // If it's already an array, use it
          if (Array.isArray(ticket.messages)) {
            messages = [...ticket.messages];
          } 
          // If it's a string (JSON), parse it
          else if (typeof ticket.messages === 'string') {
            messages = JSON.parse(ticket.messages);
          } 
          // If it's an object but not an array (Prisma JSON field)
          else {
            messages = JSON.parse(JSON.stringify(ticket.messages));
          }
          
          // Final check to ensure messages is an array
          if (!Array.isArray(messages)) {
            messages = [];
          }
        } catch (err) {
          // If parsing fails, start with an empty array
          console.error('Error parsing messages:', err);
          messages = [];
        }
      }
      
      // Add new message from admin
      messages.push({
        sender: 'admin',
        senderRole: 'admin',
        senderId: session.user.id,
        senderEmail: session.user.email || '',
        senderName: session.user.name || 'Admin',
        content: body.message,
        timestamp: new Date().toISOString()
      });
      
      // Update data with new messages
      updateData.messages = messages;
      
      // Update response field for compatibility
      updateData.response = body.message;
    }
    
    // Update the ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: {
        id: id
      },
      data: updateData
    });
    
    return NextResponse.json(updatedTicket);
    
  } catch (error) {
    console.error('[ADMIN_SUPPORT_PATCH_ID]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 