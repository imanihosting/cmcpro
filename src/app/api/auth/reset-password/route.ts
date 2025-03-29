import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { sendNotificationEmail } from "@/lib/msGraph";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Find token
    const passwordResetToken = await db.passwordResetToken.findUnique({
      where: { token }
    });

    if (!passwordResetToken) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    // Check if token has expired
    const hasExpired = new Date(passwordResetToken.expires) < new Date();

    if (hasExpired) {
      await db.passwordResetToken.delete({
        where: { id: passwordResetToken.id }
      });
      
      return NextResponse.json(
        { error: "Token has expired" },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: passwordResetToken.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: { hashed_password: hashedPassword }
    });

    // Delete used token
    await db.passwordResetToken.delete({
      where: { id: passwordResetToken.id }
    });

    // Log the password reset
    await db.userActivityLog.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        action: "PASSWORD_RESET_COMPLETED",
        details: "Password reset completed successfully",
        timestamp: new Date()
      }
    });

    // Send confirmation email
    const content = `
      <p>Your password has been reset successfully.</p>
      <p>If you did not reset your password, please contact our support team immediately.</p>
    `;

    await sendNotificationEmail(user, "Your Password Has Been Reset", content);

    return NextResponse.json({
      success: true,
      message: "Password reset successful. You can now log in with your new password."
    });
  } catch (error) {
    console.error("Error in reset password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
} 