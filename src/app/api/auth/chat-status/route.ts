import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Return authenticated status with role if logged in
    if (session && session.user) {
      return NextResponse.json({
        authenticated: true,
        role: session.user.role,
        userId: session.user.id,
        name: session.user.name || 'User',
      });
    }
    
    // Return unauthenticated status for non-logged in users
    return NextResponse.json({
      authenticated: false,
      visitorMode: true,
    });
    
  } catch (error) {
    console.error("Error checking auth status:", error);
    return NextResponse.json(
      { error: "Failed to check authentication status" },
      { status: 500 }
    );
  }
} 