import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addConnection, removeConnection } from '@/lib/sse';

// Storage for active SSE connections
const activeConnections = new Map<string, {
  controller: ReadableStreamDefaultController;
  partnerId?: string; // Optional filter for a specific conversation
}>();

// Helper to send a message to a specific user
// This is an internal function, not exported as part of the route handlers
function sendMessageToUser(
  userId: string, 
  data: any, 
  eventType: string = 'message',
  partnerId?: string
) {
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
}

// Create a separate file for exporting this functionality if needed externally
// e.g., create src/lib/message-helpers.ts for this purpose

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    
    // Set up SSE headers
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'text/event-stream');
    responseHeaders.set('Cache-Control', 'no-cache');
    responseHeaders.set('Connection', 'keep-alive');
    
    let controller: ReadableStreamDefaultController;
    
    const stream = new ReadableStream({
      start(c) {
        controller = c;
        addConnection(session.user.id, controller, partnerId || undefined);
        
        // Send initial connection event
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'));
      },
      cancel() {
        removeConnection(session.user.id);
      }
    });
    
    return new NextResponse(stream, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('SSE Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 