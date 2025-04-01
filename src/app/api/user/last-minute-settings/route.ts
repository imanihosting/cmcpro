import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET endpoint to retrieve the last-minute availability settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user is a childminder
    if (session.user.role !== 'childminder') {
      return NextResponse.json({ error: "Only childminders can access this resource" }, { status: 403 });
    }

    // Use raw query to get the user's last-minute availability settings
    const user = await prisma.$queryRaw`
      SELECT lastMinuteAvailable, lastMinuteRadius 
      FROM User 
      WHERE id = ${userId}
    `;

    if (!user || !Array.isArray(user) || user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = user[0] as any;

    return NextResponse.json({
      lastMinuteAvailable: userData.lastMinuteAvailable === 1, // Convert from 0/1 to boolean
      lastMinuteRadius: userData.lastMinuteRadius || 5, // Default to 5km if not set
    });
  } catch (error) {
    console.error("Error fetching last-minute settings:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching last-minute settings" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update the last-minute availability settings
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user is a childminder
    if (session.user.role !== 'childminder') {
      return NextResponse.json({ error: "Only childminders can access this resource" }, { status: 403 });
    }

    // Get request body
    const { lastMinuteAvailable, lastMinuteRadius } = await request.json();

    // Validate inputs
    if (typeof lastMinuteAvailable !== 'boolean') {
      return NextResponse.json(
        { error: "lastMinuteAvailable must be a boolean" },
        { status: 400 }
      );
    }

    if (lastMinuteRadius !== undefined && (
      typeof lastMinuteRadius !== 'number' || 
      lastMinuteRadius < 1 || 
      lastMinuteRadius > 50
    )) {
      return NextResponse.json(
        { error: "lastMinuteRadius must be a number between 1 and 50" },
        { status: 400 }
      );
    }

    // Update the user's last-minute availability settings using raw query
    const now = new Date();
    await prisma.$executeRaw`
      UPDATE User
      SET 
        lastMinuteAvailable = ${lastMinuteAvailable ? 1 : 0},
        lastMinuteRadius = ${lastMinuteRadius || 5},
        updatedAt = ${now}
      WHERE id = ${userId}
    `;

    // Fetch the updated user data
    const user = await prisma.$queryRaw`
      SELECT lastMinuteAvailable, lastMinuteRadius 
      FROM User 
      WHERE id = ${userId}
    `;

    if (!user || !Array.isArray(user) || user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = user[0] as any;

    return NextResponse.json({
      message: "Last-minute availability settings updated successfully",
      data: {
        lastMinuteAvailable: userData.lastMinuteAvailable === 1,
        lastMinuteRadius: userData.lastMinuteRadius
      },
    });
  } catch (error) {
    console.error("Error updating last-minute settings:", error);
    return NextResponse.json(
      { error: "An error occurred while updating last-minute settings" },
      { status: 500 }
    );
  }
} 