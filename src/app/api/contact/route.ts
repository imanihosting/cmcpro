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

    // Try multiple environment variables for support email
    const supportEmail = process.env.MICROSOFT_GRAPH_SUPPORT_EMAIL || 
                         process.env.CONTACT_EMAIL || 
                         process.env.MICROSOFT_GRAPH_FROM_EMAIL || 
                         process.env.SMTP_FROM_EMAIL ||
                         process.env.OFFICE365_USER_ID;

    console.log("Available support email options:");
    console.log("MICROSOFT_GRAPH_SUPPORT_EMAIL:", process.env.MICROSOFT_GRAPH_SUPPORT_EMAIL);
    console.log("CONTACT_EMAIL:", process.env.CONTACT_EMAIL);
    console.log("MICROSOFT_GRAPH_FROM_EMAIL:", process.env.MICROSOFT_GRAPH_FROM_EMAIL);
    console.log("SMTP_FROM_EMAIL:", process.env.SMTP_FROM_EMAIL);
    console.log("OFFICE365_USER_ID:", process.env.OFFICE365_USER_ID);
    console.log("Selected support email:", supportEmail);
    
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
            <div style="display: flex; align-items: center; justify-content: center;">
              <img style="width: 28px; height: 28px; margin-right: 10px;" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tIUZvbnQgQXdlc29tZSBGcmVlIDYuNS4xIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlL2ZyZWUgQ29weXJpZ2h0IDIwMjQgRm9udGljb25zLCBJbmMuLS0+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0zMjAgMzUwLjZjLTYuNCA1LjEtMTUuMiA2LjY1LTIzLjIgNC4xMUMyODQgMzUwLjEgMjY3LjcgMzQ0LjkgMjU2IDMzNC43djE3LjMzYzAgNC40NDgtMy41ODQgOC4wMy04IDguMDNoLTY0Yy00LjQxNiAwLTgtMy41ODItOC04VjE2MGMwLTQuNDE4IDMuNTg0LTggOC04aDY0YzQuNDE2IDAgOCAzLjU4MiA4IDh2MTIxLjVjLjI4MTMtLjYyNTIgLjUzMTMtMS4yNSAuODQzOC0xLjg3NUM2My45OSAxOTAuNCAxOTYuOCAzOC4wNCAxODcuNSAzNy41OWM1OS4zLTExLjMgMTIwLjggMi45OTQgMTc1LjQgNTAuNDdsMTIuNzUgMTEuMWM0LjM0OSAzLjc2OSA0LjgyNSAxMC40MiAxLjA1NSAxNC43NmMtMy43NSA0LjM5OS0xMC4zOSA0Ljg3NC0xNC43NiAxLjA1NkwzNDkuMyAxMDQuMWMtMTEuNTgtOS41MzEtMjMuNjMtMTcuMjEtMzYtMjMuMTVjLTQzLjkyIDE0LjkyLTgzLjg2IDQyLjk0LTExNy4xIDgyLjM5Yy0yOC29tLTM0LjA1IDM1LjEyQTM0MS4zNSAzNDEuMzUgMCA1ms3Ni40MzhjNzguOTdzMjg1LjEtODUuMDQgMzAzLjItMTI1LjFjLTYuMDA2LTQ5LjgtMzAuNTktOTUuMzEtNzEuMjgtMTI3LjkDLTEuOTQtMS41ODQtMi43MjUtNC4zNzUtMS4yMzItNi4yMDNjMTIuMTYtMTQuODggMzUuNTktMTEuNzQgNDMuODEgNC42NTZDNDc0LjgxIDE2My4xIDQ5MCAyMTEuMiA0OTAgMjYwLjAxYzAgODguMzgtNzEuNjkgMTYzLjM5LTE2NC4yIDE2My4zOWMtMzAuMjYgMC01OC4zMS04LjU2Mi04My43NC0yMi44M0MyMjUuMSA0MDcuMyAyMDggNDExLjggMTk0LjkgNDAzLjJjLTEzLTguMzQ0LTE1LjM3LTI4LjMxLTcuODQ0LTQzLjFDMjAzLjggMzM1LjUgMjM2LjYgMzMzLjEgMjU2IDM0MS43djY0LjZjLTQxLjg3LTExLjI1LTc2LjMxLTQxLjA0LTkzLjQ2LTgxLjJDMTE3LjggMjgwLjggOTIuMzcgMjQxLjcgODAuNjggMTk2LjVjLTEuMjUtNC44MTIgMS43MTktOS43MTkgNi41MzEtMTEgNC44MTktMS4yMTkgOS43NSAxLjc4MSAxMSA2LjU5NEM5Ni43NCAyMDMuNCAxMDMuOSAyMTQuNiAxMTIuMiAyMjQuNmMuODEyNSAzLjA5NCAxLjYwMyA2LjIwMyAyLjUzMSA5LjI2NmMuMTk5MiAuNjc1OCAuNTExNyAxLjI2NiAuNzQ5OCAxLjkzOGMxLjAyIDMuMDk0IDIuOSA1LjgxMiA0LjEwOSA4LjgyOGEyMjguMDQgMjI4LjA0IDAgMCAwIDUuODEzIDE0LjAzYzEuMTggMi41NjMgMi41NzQgNC45ODggMy44NzMgNy40NjlhMS4wMSAxLjAxIDAgMCAxIC4xNDg0IC4yNDIyYy4xNzk3IC4zMzk4IC4yNjE3IC42OTkyIC40NjA5IDEuMDM5YTI0MC40MiAyNDAuNDIgMCAwIDAgNzkuNzMgOTMuMDZjMS4yOTMgLjgyMDMgMi44MTYgMS4xNjggNC4zMjQgMS40MThjLjI0MjIgLjAzOTEgLjQ4ODMgLjEwOTQgLjcwMzEgLjE0ODRjMS4yMiAuMTc5NyAyLjQzICjE5NyAzLjYzMyAuMzM5OGExMzYuMzYgMTM2LjM2IDAgMCAwinQwNy4yIDF2LTM3LjI3Yy01LjYwOSAzLjcwMy0xMS4yNSA3LjM0NC0xNi4xOCAxMS40MUMzMjguOSAzMzkgMzI1LjcgMzQ2LjEgMzIwIDM1MC42eiIvPjwvc3ZnPg==" alt="Baby Icon" />
              <span style="color: white; font-weight: bold; font-size: 20px;">ChildminderConnect</span>
            </div>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px;">
            <p>Dear ${name},</p>
            <p>Thank you for contacting Childminder Connect. We have received your message and will get back to you as soon as possible.</p>
            <p>For your reference, here's a copy of your message:</p>
            <div style="padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9; margin-top: 10px; margin-bottom: 10px;">
              <strong>Subject:</strong> ${subject}<br><br>
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p>If you have any urgent concerns, please call our support line at +353 061 511 044.</p>
            <p>Best regards,<br>The Childminder Connect Team</p>
          </div>
          <div style="text-align: center; padding: 10px; font-size: 12px; color: #666;">
            <p>This is an automated response, please do not reply directly to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Childminder Connect. All rights reserved.</p>
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