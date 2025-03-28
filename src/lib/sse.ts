// Map to store active SSE connections
const activeConnections = new Map<string, {
  controller: ReadableStreamDefaultController;
  partnerId?: string;
}>();

// Add a new SSE connection
export function addConnection(
  userId: string,
  controller: ReadableStreamDefaultController,
  partnerId?: string
) {
  activeConnections.set(userId, { controller, partnerId });
}

// Remove an SSE connection
export function removeConnection(userId: string) {
  activeConnections.delete(userId);
}

// Send a message to a specific user's SSE connection
export function sendMessageToUser(userId: string, eventName: string, data: any) {
  const connection = activeConnections.get(userId);
  if (!connection) return;

  try {
    const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    connection.controller.enqueue(new TextEncoder().encode(message));
  } catch (error) {
    console.error(`Error sending message to user ${userId}:`, error);
    removeConnection(userId);
  }
}

// Send a message to all connected users or filtered by partnerId
export function broadcastMessage(
  eventName: string,
  data: any,
  excludeUserId?: string,
  targetPartnerId?: string
) {
  for (const [userId, connection] of activeConnections.entries()) {
    // Skip excluded user
    if (excludeUserId === userId) continue;

    // Filter by partnerId if specified
    if (targetPartnerId && connection.partnerId !== targetPartnerId) continue;

    try {
      const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
      connection.controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      console.error(`Error broadcasting to user ${userId}:`, error);
      removeConnection(userId);
    }
  }
}

// Get all active connection user IDs
export function getActiveConnectionIds(): string[] {
  return Array.from(activeConnections.keys());
}

// Check if a user has an active connection
export function hasActiveConnection(userId: string): boolean {
  return activeConnections.has(userId);
}

// Get the number of active connections
export function getActiveConnectionCount(): number {
  return activeConnections.size;
} 