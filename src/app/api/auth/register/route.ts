import { hash } from "bcrypt";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { User_role, User_subscriptionStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 400 }
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
    const hashedPassword = await hash(password, 10);
    const now = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(now.getDate() + 30); // 30 days trial

    // Create the user
    const userId = uuidv4();
    const user = await db.user.create({
      data: {
        id: userId,
        name,
        email,
        role: role as User_role,
        hashed_password: hashedPassword,
        trialActivated: true,
        trialStartDate: now,
        trialEndDate: trialEndDate,
        // @ts-ignore: Using updated subscription status enums
        subscriptionStatus: User_subscriptionStatus.FREE,
        createdAt: now,
        updatedAt: now,
      },
    });

    // We'll handle creation of specific role-based profiles through the dashboard
    // after login, as this requires understanding the exact schema requirements

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
} 