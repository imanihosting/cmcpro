import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateSecret, generateOTPAuthURL, generateQRCode } from "@/lib/twoFactor";

// POST /api/user/2fa/setup - Generate 2FA setup information
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

    // Check if 2FA is already enabled
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
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

    // Generate secret
    const secret = generateSecret();
    
    // Generate OTP auth URL (for QR code)
    const otpAuthUrl = generateOTPAuthURL({
      accountName: user.email,
      issuer: "ChildminderConnect",
      secret,
    });
    
    // Generate QR code
    const qrCodeUrl = await generateQRCode(otpAuthUrl);

    // Store temporary secret for verification
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorVerified: false,
        updatedAt: new Date(),
      },
    });

    // Log security event
    await prisma.securityEvent.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        type: "2FA_SETUP_INITIATED",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        description: "Two-factor authentication setup initiated",
        severity: "INFO",
        status: "PENDING",
        timestamp: new Date(),
        updatedAt: new Date(),
      },
    });

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: '2FA_SETUP_INITIATED',
        details: 'Two-factor authentication setup initiated',
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      secret,
      qrCodeUrl,
      message: "Two-factor authentication setup initiated",
    });
  } catch (error) {
    console.error("Error in POST /api/user/2fa/setup:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 