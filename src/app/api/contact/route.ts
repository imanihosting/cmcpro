import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/msGraph";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Send email to admin or support
    const supportEmail = process.env.MICROSOFT_GRAPH_SUPPORT_EMAIL || process.env.MICROSOFT_GRAPH_FROM_EMAIL;
    
    if (!supportEmail) {
      return NextResponse.json(
        { error: "Support email not configured" },
        { status: 500 }
      );
    }
    
    // Send the contact form to support
    await sendEmail({
      to: supportEmail,
      subject: `Contact Form: ${subject}`,
      body: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      `,
    });
    
    // Send auto-reply to the user
    await sendEmail({
      to: email,
      subject: `Thank you for contacting Childminder Connect`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #7c3aed; padding: 20px; color: white; text-align: center;">
            <h2>Childminder Connect</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px;">
            <p>Dear ${name},</p>
            <p>Thank you for contacting Childminder Connect. We have received your message and will get back to you as soon as possible.</p>
            <p>For your reference, here's a copy of your message:</p>
            <div style="padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9; margin-top: 10px; margin-bottom: 10px;">
              <strong>Subject:</strong> ${subject}<br><br>
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p>If you have any urgent concerns, please call our support line at +353 (1) 234 5678.</p>
            <p>Best regards,<br>The Childminder Connect Team</p>
          </div>
          <div style="text-align: center; padding: 10px; font-size: 12px; color: #666;">
            <p>This is an automated response, please do not reply directly to this email.</p>
          </div>
        </div>
      `,
    });
    
    // Store the contact message in the database if user is logged in
    const user = await db.user.findUnique({
      where: { email }
    });
    
    if (user) {
      // Log the contact form submission
      await db.userActivityLog.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          action: "CONTACT_FORM_SUBMITTED",
          details: `Contact form submitted: ${subject}`,
          timestamp: new Date()
        }
      });
    }
    
    // Create a support ticket
    await db.supportTicket.create({
      data: {
        id: uuidv4(),
        userId: user?.id || "00000000-0000-0000-0000-000000000000",
        userEmail: email,
        userName: name,
        category: "CONTACT",
        subject: subject,
        description: message,
        status: "OPEN",
        priority: "MEDIUM",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Your message has been sent. We'll get back to you soon!"
    });
  } catch (error) {
    console.error("Error sending contact form:", error);
    return NextResponse.json(
      { error: "Failed to send your message. Please try again later." },
      { status: 500 }
    );
  }
} 