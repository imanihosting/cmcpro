import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/msGraph";
import { v4 as uuidv4 } from "uuid";

const requestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedFields = requestSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = validatedFields.data;
    
    // Check if the user exists
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Still return success for security reasons
      return NextResponse.json(
        { message: "If your email is in our system, you will receive password reset instructions." },
        { status: 200 }
      );
    }

    // Create a reset token in the database
    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Token valid for 24 hours

    await db.passwordResetToken.create({
      data: {
        email,
        userId: user.id,
        token,
        expires,
      },
    });

    // Generate reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    try {
      await sendEmail({
        to: email,
        subject: "Reset Your Password - Childminder Connect",
        body: `
          <h1>Reset Your Password</h1>
          <p>Hello ${user.name || 'there'},</p>
          <p>You recently requested to reset your password for your Childminder Connect account. Click the button below to reset it:</p>
          <p style="text-align: center; margin: 25px 0;">
            <a href="${resetLink}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The Childminder Connect Team</p>
        `,
      });
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      // Don't expose email sending errors to the client
      // but still create the token so they can try again
    }
    
    return NextResponse.json(
      { message: "If your email is in our system, you will receive password reset instructions." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in forgot password route:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
} 