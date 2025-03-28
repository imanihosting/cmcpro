import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/user/notification-preferences - Get user notification preferences
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If no preferences are set, return defaults
    const defaultPreferences = {
      emailNotifications: true,
      bookingReminders: true,
      marketingEmails: false,
    };

    // Parse preferences if they exist, otherwise use defaults
    let preferences;
    if (user.preferences) {
      if (typeof user.preferences === 'string') {
        try {
          preferences = JSON.parse(user.preferences);
        } catch (e) {
          preferences = defaultPreferences;
        }
      } else {
        preferences = user.preferences;
      }
    } else {
      preferences = defaultPreferences;
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error in GET /api/user/notification-preferences:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// PUT /api/user/notification-preferences - Update user notification preferences
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const newPreferences = await req.json();

    // Validate input
    const validKeys = ['emailNotifications', 'bookingReminders', 'marketingEmails'];
    const hasInvalidKeys = Object.keys(newPreferences).some(key => !validKeys.includes(key));
    
    if (hasInvalidKeys) {
      return NextResponse.json(
        { error: "Invalid preferences provided" },
        { status: 400 }
      );
    }

    // Get current preferences to merge with new ones
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse current preferences if they exist
    let currentPreferences = {};
    if (user.preferences) {
      if (typeof user.preferences === 'string') {
        try {
          currentPreferences = JSON.parse(user.preferences);
        } catch (e) {
          // If parsing fails, use empty object
        }
      } else {
        currentPreferences = user.preferences;
      }
    }

    // Merge existing preferences with new ones
    const updatedPreferences = {
      ...currentPreferences,
      ...newPreferences,
    };

    // Update user preferences
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: updatedPreferences,
        updatedAt: new Date(),
      },
    });

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: 'PREFERENCES_UPDATE',
        details: 'Notification preferences updated',
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully",
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error("Error in PUT /api/user/notification-preferences:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 