import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { User_role, User_subscriptionStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { sendWelcomeEmail } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    // Extract all needed fields from the request
    const { 
      name, 
      email, 
      password, 
      role, 
      phone, 
      rate, 
      address 
    } = await req.json();

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

    // For childminders, validate additional required fields
    if (role === User_role.childminder) {
      if (!phone || !rate) {
        return NextResponse.json(
          { error: "Missing required childminder fields" },
          { status: 400 }
        );
      }
      
      // Validate address fields
      if (!address || !address.streetAddress || !address.city || !address.county) {
        return NextResponse.json(
          { error: "Missing required address fields" },
          { status: 400 }
        );
      }
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

    // Set up user data
    const userData: any = {
      id: uuidv4(),
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
    };
    
    // Add childminder-specific fields
    if (role === User_role.childminder) {
      userData.phoneNumber = phone;
      userData.rate = rate;
      
      // Store address in location field (as a JSON string)
      // This provides backward compatibility until the Address model is fully deployed
      userData.location = JSON.stringify({
        streetAddress: address.streetAddress,
        city: address.city,
        county: address.county,
        eircode: address.eircode || null
      });
    }

    // Create the user 
    const user = await db.user.create({
      data: userData
    });

    // If childminder, try to create address record
    // This will work once the Address model is deployed
    if (role === User_role.childminder && address) {
      try {
        // @ts-ignore - Ignore TypeScript error until Prisma client is regenerated
        const addressModel = db.address;
        if (addressModel) {
          await addressModel.create({
            data: {
              id: uuidv4(),
              userId: user.id,
              streetAddress: address.streetAddress,
              city: address.city,
              county: address.county,
              eircode: address.eircode || null,
              createdAt: now,
              updatedAt: now
            }
          });
        }
      } catch (error) {
        console.error("Error creating address entry, the Address model may not exist yet:", error);
        // If the Address model doesn't exist yet, we'll just log the error
        // but still allow the user registration to succeed
      }
    }

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