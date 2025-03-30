import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { cookies } from 'next/headers';

// POST /api/auth/logout - Logout a user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: true, message: "Already logged out" },
        { status: 200 }
      );
    }

    const userId = session.user.id;

    // Log user activity
    await prisma.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: 'USER_LOGOUT',
        details: 'User logged out',
        timestamp: new Date(),
      },
    });

    // Log system event for admins
    if (session.user.role === 'admin') {
      await prisma.systemLog.create({
        data: {
          id: crypto.randomUUID(),
          type: 'SECURITY',
          level: 'INFO',
          message: 'Admin logout',
          details: `Admin user ${userId} logged out`,
          source: 'auth-api',
          userId: userId,
          timestamp: new Date(),
        }
      });
    }

    // For NextAuth, actual session invalidation happens client-side
    // through signOut() which calls the built-in /api/auth/signout endpoint
    
    // Clear the session cookie
    const cookieStore = cookies();
    cookieStore.delete('next-auth.session-token');
    cookieStore.delete('__Secure-next-auth.session-token');
    
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Error in POST /api/auth/logout:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during logout" },
      { status: 500 }
    );
  }
} 