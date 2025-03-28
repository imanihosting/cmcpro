import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/user/2fa/disable - Disable 2FA
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is not enabled" },
        { status: 400 }
      );
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorVerified: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: {},
        updatedAt: new Date(),
      },
    });

    // Log security event
    await prisma.securityEvent.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        type: "2FA_DISABLED",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        description: "Two-factor authentication disabled",
        severity: "INFO",
        status: "RESOLVED",
        timestamp: new Date(),
        updatedAt: new Date(),
      },
    });

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: '2FA_DISABLED',
        details: 'Two-factor authentication disabled',
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication disabled successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/user/2fa/disable:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 