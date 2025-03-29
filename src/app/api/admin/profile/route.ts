import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/admin/profile - Get admin profile
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Ensure the user is an admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Define fields to select for admin
    const selectFields = {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      phoneNumber: true,
      location: true,
      bio: true,
      role: true,
      createdAt: true,
      twoFactorEnabled: true,
      gender: true,
      dateOfBirth: true,
    };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: selectFields,
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    logger.error("Error in GET /api/admin/profile:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/profile - Update admin profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Ensure the user is an admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const data = await req.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Email can't be changed, so remove it from the request
    const { email, role, ...updatableData } = data;

    // Process date of birth if provided
    if (updatableData.dateOfBirth) {
      // Check if dateOfBirth is already in ISO format
      if (!updatableData.dateOfBirth.includes('T')) {
        // Convert YYYY-MM-DD to YYYY-MM-DDT00:00:00.000Z format
        try {
          updatableData.dateOfBirth = new Date(`${updatableData.dateOfBirth}T00:00:00.000Z`).toISOString();
        } catch (error) {
          logger.error("Error formatting dateOfBirth:", error);
          return NextResponse.json(
            { error: "Invalid date format for Date of Birth" },
            { status: 400 }
          );
        }
      }
    }

    // Define select fields for admin
    const selectFields = {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      phoneNumber: true,
      location: true,
      bio: true,
      role: true,
      gender: true,
      dateOfBirth: true,
    };

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updatableData,
        updatedAt: new Date(),
      },
      select: selectFields,
    });

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: 'ADMIN_PROFILE_UPDATE',
        details: 'Admin profile updated',
        timestamp: new Date(),
      },
    });

    // Log system event
    await prisma.systemLog.create({
      data: {
        id: crypto.randomUUID(),
        type: 'AUDIT',
        level: 'INFO',
        message: 'Admin profile updated',
        details: `Admin user ${userId} updated their profile`,
        source: 'admin-profile-api',
        userId: userId,
        timestamp: new Date(),
      }
    });

    // Update session if name was changed
    if (session.user.name !== updatedUser.name) {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedUser.name,
        }),
      });
    }

    return NextResponse.json({
      ...updatedUser,
      message: "✅ Profile updated successfully! Your changes have been saved."
    });
  } catch (error) {
    logger.error("Error in PUT /api/admin/profile:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 