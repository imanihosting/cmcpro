import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET handler to search through support tickets
export async function GET(request: Request) {
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
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Return empty results if query is too short
    if (query.length < 2) {
      return NextResponse.json({
        tickets: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0
        }
      });
    }
    
    // Build search query
    const searchWhere = {
      OR: [
        { subject: { contains: query } },
        { description: { contains: query } },
        { userEmail: { contains: query } },
        { userName: { contains: query } },
        { category: { contains: query } }
      ]
    };
    
    // Count total matching tickets
    const totalTickets = await prisma.supportTicket.count({
      where: searchWhere
    });
    
    // Fetch matching tickets with pagination
    const tickets = await prisma.supportTicket.findMany({
      where: searchWhere,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
      select: {
        id: true,
        userId: true,
        userEmail: true,
        userName: true,
        subject: true,
        category: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        respondedBy: true,
        // Include a snippet of the description that matches the search query
        description: true
      }
    });
    
    // Get respondedBy user details
    const assigneeIds = tickets
      .map(ticket => ticket.respondedBy)
      .filter(id => id !== null && id !== undefined) as string[];
    
    const uniqueAssigneeIds = [...new Set(assigneeIds)];
    const assignees = uniqueAssigneeIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: uniqueAssigneeIds } },
          select: { id: true, name: true, email: true }
        })
      : [];
    
    // Process tickets to add assignee details and truncate description to relevant snippets
    const processedTickets = tickets.map(ticket => {
      // Find assignee details
      const assignee = ticket.respondedBy
        ? assignees.find(user => user.id === ticket.respondedBy)
        : null;
      
      // Create a snippet of the description that contains the search query
      let descriptionSnippet = ticket.description;
      if (ticket.description && ticket.description.length > 200) {
        const matchIndex = ticket.description.toLowerCase().indexOf(query.toLowerCase());
        
        if (matchIndex >= 0) {
          // Extract a snippet around the match
          const startPos = Math.max(0, matchIndex - 75);
          const endPos = Math.min(ticket.description.length, matchIndex + query.length + 75);
          
          descriptionSnippet = (startPos > 0 ? '...' : '') +
            ticket.description.substring(startPos, endPos) +
            (endPos < ticket.description.length ? '...' : '');
        } else {
          // If no direct match found (might be matching other fields), take first 150 chars
          descriptionSnippet = ticket.description.substring(0, 150) + '...';
        }
      }
      
      return {
        ...ticket,
        description: descriptionSnippet,
        assignee: assignee || null
      };
    });
    
    return NextResponse.json({
      tickets: processedTickets,
      pagination: {
        total: totalTickets,
        page,
        limit,
        pages: Math.ceil(totalTickets / limit)
      },
      query
    });
    
  } catch (error) {
    console.error('[ADMIN_SUPPORT_SEARCH]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 