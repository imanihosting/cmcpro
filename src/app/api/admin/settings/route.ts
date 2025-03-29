import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/admin/settings - Get admin settings
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

    // Define fields to select for admin settings
    const selectFields = {
      id: true,
      twoFactorEnabled: true,
      twoFactorVerified: true,
      preferences: true,
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

    // Retrieve notification settings
    const notificationSettings = user.preferences ? 
      (typeof user.preferences === 'string' ? 
        JSON.parse(user.preferences) : 
        user.preferences
      ) : 
      {
        emailNotifications: true,
        pushNotifications: true,
        emailSummary: 'daily',
        notifyOnNewUsers: true,
        notifyOnSupportTickets: true,
        notifyOnErrors: true,
      };

    return NextResponse.json({
      ...user,
      notificationSettings,
    });
  } catch (error) {
    logger.error("Error in GET /api/admin/settings:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update admin settings
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

    // Validate and extract notification settings
    const { 
      notificationSettings,
      twoFactorEnabled,
      ...otherSettings 
    } = data;

    // Prepare data for update
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Include notification settings if provided
    if (notificationSettings) {
      updateData.preferences = notificationSettings;
    }

    // Include other valid settings
    if (twoFactorEnabled !== undefined) {
      updateData.twoFactorEnabled = twoFactorEnabled;
      
      // If disabling 2FA, also reset verification
      if (twoFactorEnabled === false) {
        updateData.twoFactorVerified = false;
        updateData.twoFactorSecret = null;
      }
    }

    // Update user settings
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorVerified: true,
        preferences: true,
      },
    });

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: 'ADMIN_SETTINGS_UPDATE',
        details: 'Admin settings updated',
        timestamp: new Date(),
      },
    });

    // Log system event
    await prisma.systemLog.create({
      data: {
        id: crypto.randomUUID(),
        type: 'AUDIT',
        level: 'INFO',
        message: 'Admin settings updated',
        details: `Admin user ${userId} updated their settings`,
        source: 'admin-settings-api',
        userId: userId,
        timestamp: new Date(),
      }
    });

    // Format notification settings for response
    const responseNotificationSettings = updatedUser.preferences ? 
      (typeof updatedUser.preferences === 'string' ? 
        JSON.parse(updatedUser.preferences) : 
        updatedUser.preferences
      ) : 
      {};

    return NextResponse.json({
      ...updatedUser,
      notificationSettings: responseNotificationSettings,
      message: "✅ Settings updated successfully! Your preferences have been saved."
    });
  } catch (error) {
    logger.error("Error in PUT /api/admin/settings:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 