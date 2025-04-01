import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET endpoint to retrieve the last-minute schedule
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

    // Fetch recurring slots
    const recurringSlots = await prisma.lastMinuteRecurringSlot.findMany({
      where: { 
        userId 
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
      },
    });

    // Fetch one-time slots
    const oneTimeSlots = await prisma.lastMinuteOneTimeSlot.findMany({
      where: { 
        userId,
        date: {
          gte: new Date() // Only return future slots
        }
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
      },
    });

    // Combine and format the slots for the frontend
    const timeSlots = [
      ...recurringSlots.map(slot => ({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        date: null,
      })),
      ...oneTimeSlots.map(slot => ({
        id: slot.id,
        dayOfWeek: null,
        startTime: slot.startTime,
        endTime: slot.endTime,
        date: slot.date.toISOString(),
      }))
    ];

    return NextResponse.json({ timeSlots });
  } catch (error) {
    console.error("Error fetching last-minute schedule:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching last-minute schedule" },
      { status: 500 }
    );
  }
}

// POST endpoint to update the last-minute schedule
export async function POST(request: Request) {
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

    const { timeSlots } = await request.json();

    if (!Array.isArray(timeSlots)) {
      return NextResponse.json(
        { error: "timeSlots must be an array" },
        { status: 400 }
      );
    }

    // Process in a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete all existing slots for this user
      await tx.lastMinuteRecurringSlot.deleteMany({ where: { userId } });
      await tx.lastMinuteOneTimeSlot.deleteMany({ 
        where: { 
          userId,
          date: {
            gte: new Date() // Only delete future slots
          }
        } 
      });

      // Separate recurring and one-time slots
      const recurringSlots = timeSlots.filter(slot => slot.dayOfWeek !== null);
      const oneTimeSlots = timeSlots.filter(slot => slot.date !== null);

      // Create new recurring slots
      if (recurringSlots.length > 0) {
        await tx.lastMinuteRecurringSlot.createMany({
          data: recurringSlots.map(slot => ({
            userId,
            dayOfWeek: slot.dayOfWeek as number,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        });
      }

      // Create new one-time slots
      if (oneTimeSlots.length > 0) {
        await tx.lastMinuteOneTimeSlot.createMany({
          data: oneTimeSlots.map(slot => ({
            userId,
            date: new Date(slot.date as string),
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        });
      }
    });

    return NextResponse.json({
      message: "Last-minute schedule updated successfully",
    });
  } catch (error) {
    console.error("Error updating last-minute schedule:", error);
    return NextResponse.json(
      { error: "An error occurred while updating last-minute schedule" },
      { status: 500 }
    );
  }
} 