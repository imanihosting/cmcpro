import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    
    // Get ticket ID from URL params
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch the ticket
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
    
    // Check if the user is authorized to access this ticket
    if (ticket.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this ticket' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error fetching support ticket details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support ticket details' },
      { status: 500 }
    );
  }
}

// PATCH handler to add a comment to an existing support ticket
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
    
    // Validate required fields
    if (!body.userReply) {
      return NextResponse.json(
        { error: 'Missing required field: userReply' },
        { status: 400 }
      );
    }
    
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
    
    // Check if the user is authorized to update this ticket
    if (ticket.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this ticket' },
        { status: 403 }
      );
    }
    
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
    
    // Add new message
    messages.push({
      sender: 'user',
      content: body.userReply,
      timestamp: new Date().toISOString()
    });
    
    // Update the ticket with the new message
    const updatedTicket = await prisma.supportTicket.update({
      where: {
        id: id
      },
      data: {
        userReply: body.userReply,
        messages: messages,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update support ticket' },
      { status: 500 }
    );
  }
} 