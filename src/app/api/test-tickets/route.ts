import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        User: true
      }
    });
    
    return NextResponse.json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (error) {
    console.error('Error getting tickets:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get tickets', error: String(error) },
      { status: 500 }
    );
  }
} 