import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { SupportTicket_status } from '@prisma/client';

// GET handler to retrieve support ticket statistics for admin dashboard
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
    
    // Parse query parameters for time range
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    // Setup date range for queries - default to last 30 days if not specified
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
    
    // Base where clause for time range
    const dateRangeWhere = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };
    
    // Get total tickets
    const totalTickets = await prisma.supportTicket.count({
      where: dateRangeWhere
    });
    
    // Get ticket counts by status
    const ticketsByStatus = await Promise.all(
      Object.values(SupportTicket_status).map(async (status) => {
        const count = await prisma.supportTicket.count({
          where: {
            ...dateRangeWhere,
            status
          }
        });
        
        return { status, count };
      })
    );
    
    // Get ticket counts by category
    const categoriesResult = await prisma.supportTicket.groupBy({
      by: ['category'],
      where: dateRangeWhere,
      _count: true
    });
    
    const ticketsByCategory = categoriesResult.map(result => ({
      category: result.category,
      count: result._count
    }));
    
    // Get ticket counts for each day in the date range
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const dailyTicketCounts = [];
    
    for (let i = 0; i < days; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const count = await prisma.supportTicket.count({
        where: {
          createdAt: {
            gte: day,
            lt: nextDay
          }
        }
      });
      
      dailyTicketCounts.push({
        date: day.toISOString().split('T')[0],
        count
      });
    }
    
    // Get average response time (only for tickets with messages from admins)
    const tickets = await prisma.supportTicket.findMany({
      where: {
        ...dateRangeWhere,
        // Only look at tickets that have admin responses
        respondedBy: {
          not: null
        }
      },
      select: {
        id: true,
        createdAt: true,
        messages: true
      }
    });
    
    // Calculate average response time
    let totalResponseTime = 0;
    let ticketsWithResponses = 0;
    
    tickets.forEach(ticket => {
      if (!ticket.messages) return;
      
      let messages;
      try {
        if (Array.isArray(ticket.messages)) {
          messages = ticket.messages;
        } else if (typeof ticket.messages === 'string') {
          messages = JSON.parse(ticket.messages);
        } else {
          messages = JSON.parse(JSON.stringify(ticket.messages));
        }
        
        if (!Array.isArray(messages) || messages.length === 0) return;
        
        // Find first admin response
        const firstAdminResponse = messages.find(m => m.sender === 'admin' || m.senderRole === 'admin');
        
        if (!firstAdminResponse) return;
        
        const createdAt = new Date(ticket.createdAt).getTime();
        const firstResponseTime = new Date(firstAdminResponse.timestamp).getTime();
        
        if (firstResponseTime > createdAt) {
          const responseTimeHours = (firstResponseTime - createdAt) / (1000 * 60 * 60);
          totalResponseTime += responseTimeHours;
          ticketsWithResponses++;
        }
      } catch (error) {
        console.error('Error parsing messages:', error);
        return;
      }
    });
    
    const averageResponseTimeHours = ticketsWithResponses > 0 
      ? (totalResponseTime / ticketsWithResponses).toFixed(2) 
      : null;
    
    // Return compiled statistics
    return NextResponse.json({
      totalTickets,
      ticketsByStatus,
      ticketsByCategory,
      dailyTicketCounts,
      averageResponseTimeHours,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    
  } catch (error) {
    console.error('[ADMIN_SUPPORT_STATS]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 