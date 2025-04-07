import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET - Get current trial setting
export async function GET() {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const setting = await db.securitySetting.findUnique({
      where: { key: 'enable_free_trial' }
    });

    if (!setting) {
      return NextResponse.json({ enabled: false }, { status: 200 });
    }

    return NextResponse.json({ 
      enabled: setting.value === 'true',
      description: setting.description
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching trial setting:", error);
    return NextResponse.json({ error: "Failed to fetch trial setting" }, { status: 500 });
  }
}

// POST - Update trial setting
export async function POST(req: NextRequest) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enabled } = await req.json();
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const setting = await db.securitySetting.findUnique({
      where: { key: 'enable_free_trial' }
    });

    if (!setting) {
      // Create the setting if it doesn't exist
      await db.securitySetting.create({
        data: {
          id: Date.now().toString(),
          key: 'enable_free_trial',
          value: enabled.toString(),
          description: 'When enabled, new users will receive a free trial based on their role (Parent: 30 days, Childminder: 60 days)',
          type: 'boolean',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      // Update existing setting
      await db.securitySetting.update({
        where: { key: 'enable_free_trial' },
        data: {
          value: enabled.toString(),
          updatedAt: new Date()
        }
      });
    }

    // Log the change
    await db.userActivityLog.create({
      data: {
        id: Date.now().toString(),
        userId: session.user.id,
        action: "ADMIN_UPDATE_TRIAL_SETTING",
        details: `Free trial feature ${enabled ? 'enabled' : 'disabled'}`,
        timestamp: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Free trial feature has been ${enabled ? 'enabled' : 'disabled'}` 
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating trial setting:", error);
    return NextResponse.json({ error: "Failed to update trial setting" }, { status: 500 });
  }
} 