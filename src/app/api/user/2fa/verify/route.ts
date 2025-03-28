import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyToken, generateRecoveryCodes } from "@/lib/twoFactor";

// POST /api/user/2fa/verify - Verify token and enable 2FA
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
    const { token, secret } = await req.json();

    // Validate input
    if (!token || !secret) {
      return NextResponse.json(
        { error: "Token and secret are required" },
        { status: 400 }
      );
    }

    // Get user data to verify they have a temp secret
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is already enabled" },
        { status: 400 }
      );
    }

    // Verify that the provided token matches the secret
    const isValid = verifyToken(token, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes();

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorVerified: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: recoveryCodes,
        updatedAt: new Date(),
      },
    });

    // Log security event
    await prisma.securityEvent.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        type: "2FA_ENABLED",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        description: "Two-factor authentication enabled",
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
        action: '2FA_ENABLED',
        details: 'Two-factor authentication enabled',
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication enabled successfully",
      recoveryCodes,
    });
  } catch (error) {
    console.error("Error in POST /api/user/2fa/verify:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 