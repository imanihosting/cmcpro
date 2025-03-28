import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/user/password - Change user password
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Detailed logging for debugging
    console.log("Session in password endpoint:", !!session);

    if (!session?.user) {
      return NextResponse.json(
        { message: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    if (!userId) {
      return NextResponse.json(
        { message: "User ID not found in session" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        hashed_password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.hashed_password) {
      return NextResponse.json(
        { message: "User has no password set (social login user)" },
        { status: 400 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.hashed_password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        hashed_password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Log security event
    await prisma.securityEvent.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        type: "PASSWORD_CHANGE",
        description: "User changed their password",
        timestamp: new Date(),
        severity: "INFO",
        status: "RESOLVED",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        updatedAt: new Date(),
      },
    });

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: 'PASSWORD_CHANGE',
        details: 'User password changed',
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in POST /api/user/password:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 