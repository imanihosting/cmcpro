import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Storage for active SSE connections
const activeConnections = new Map<string, {
  controller: ReadableStreamDefaultController;
  partnerId?: string; // Optional filter for a specific conversation
}>();

// Helper to send a message to a specific user
export const sendMessageToUser = (
  userId: string, 
  data: any, 
  eventType: string = 'message',
  partnerId?: string
) => {
  const connection = activeConnections.get(userId);
  if (connection) {
    // If partnerId is specified and doesn't match the connection's filter, don't send
    if (partnerId && connection.partnerId && connection.partnerId !== partnerId) {
      return;
    }
    
    try {
      connection.controller.enqueue(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error sending SSE message:', error);
      // Remove the connection if it's broken
      activeConnections.delete(userId);
    }
  }
};

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get optional partnerId query param to filter for a specific conversation
    const partnerId = request.nextUrl.searchParams.get('partnerId') || undefined;
    
    // Clean up any existing connection for this user
    if (activeConnections.has(userId)) {
      const existing = activeConnections.get(userId);
      if (existing) {
        try {
          existing.controller.close();
        } catch (e) {
          console.error('Error closing existing SSE connection:', e);
        }
      }
      activeConnections.delete(userId);
    }
    
    // Create a response with appropriate headers for SSE
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();
    
    // Store connection for later use
    let controller: ReadableStreamDefaultController;
    
    const stream = new ReadableStream({
      start(c) {
        controller = c;
        activeConnections.set(userId, { controller, partnerId });
        
        // Send initial connection event
        controller.enqueue(encoder.encode('event: connected\ndata: {"connected": true}\n\n'));
      },
      cancel() {
        // Remove connection when client disconnects
        activeConnections.delete(userId);
      }
    });
    
    // Set up an automatic ping to keep the connection alive
    const pingInterval = setInterval(() => {
      try {
        if (activeConnections.has(userId)) {
          const connection = activeConnections.get(userId);
          if (connection) {
            connection.controller.enqueue('event: ping\ndata: {}\n\n');
          }
        } else {
          clearInterval(pingInterval);
        }
      } catch (error) {
        console.error('Error sending ping:', error);
        clearInterval(pingInterval);
        activeConnections.delete(userId);
      }
    }, 30000); // Send ping every 30 seconds
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
    
  } catch (error) {
    console.error('[SSE_CONNECT]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 