import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { User_role, User_subscriptionStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { sendWelcomeEmail } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // Validate role
    if (!Object.values(User_role).includes(role as User_role)) {
      return NextResponse.json(
        { message: "Invalid role selected" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();
    
    // Check if free trial feature is enabled
    const trialSetting = await db.securitySetting.findUnique({
      where: { key: 'enable_free_trial' }
    });
    
    const isTrialEnabled = trialSetting?.value === 'true';
    
    // Determine trial duration based on role
    let trialDuration = 0;
    if (isTrialEnabled) {
      trialDuration = role === User_role.parent ? 30 : 60; // 30 days for parents, 60 for childminders
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(now.getDate() + trialDuration);

    // Set initial subscription status based on trial settings
    const subscriptionStatus = isTrialEnabled 
      ? "TRIALING" as User_subscriptionStatus 
      : "PENDING_SUBSCRIPTION" as User_subscriptionStatus;

    // Create the user
    const userId = uuidv4();
    const user = await db.user.create({
      data: {
        id: userId,
        name,
        email,
        role: role as User_role,
        hashed_password: hashedPassword,
        trialActivated: isTrialEnabled,
        trialStartDate: isTrialEnabled ? now : null,
        trialEndDate: isTrialEnabled ? trialEndDate : null,
        subscriptionStatus,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Send welcome email
    await sendWelcomeEmail(user);

    // Log the registration
    await db.userActivityLog.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        action: "USER_REGISTERED",
        details: `User registration completed with ${isTrialEnabled ? `${trialDuration}-day trial` : 'no trial'}`,
        timestamp: new Date()
      }
    });

    // Determine redirect URL based on trial status
    const redirectUrl = isTrialEnabled ? "/dashboard" : "/subscription";

    return NextResponse.json({
      success: true,
      message: "Registration successful! You can now log in.",
      redirectUrl
    });
  } catch (error) {
    console.error("Error in user registration:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
} 