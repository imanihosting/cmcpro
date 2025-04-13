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
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
              }
              .header {
                background-color: #7c3aed;
                color: white;
                padding: 15px 20px;
                border-radius: 5px 5px 0 0;
              }
              .logo {
                display: flex;
                align-items: center;
              }
              .logo-icon {
                width: 32px;
                height: 32px;
                margin-right: 10px;
              }
              .logo-text {
                color: white;
                font-weight: bold;
                font-size: 20px;
              }
              .content {
                padding: 20px;
              }
              .button {
                display: inline-block;
                background-color: #7c3aed;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin-top: 15px;
              }
              .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #666;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">
                  <img class="logo-icon" src="${process.env.NEXT_PUBLIC_APP_URL}/images/logo.svg" alt="ChildminderConnect Logo" />
                  <span class="logo-text">ChildminderConnect</span>
                </div>
              </div>
              <div class="content">
                <h1>Reset Your Password</h1>
                <p>Hello ${user.name || 'there'},</p>
                <p>You recently requested to reset your password for your Childminder Connect account. Click the button below to reset it:</p>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${resetLink}" class="button">Reset Password</a>
                </div>
                <p>If the button above doesn't work, you can also copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;"><a href="${resetLink}">${resetLink}</a></p>
                <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                <p>This link will expire in 24 hours.</p>
                <p>Best regards,<br>The Childminder Connect Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} Childminder Connect. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        isHtml: true
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