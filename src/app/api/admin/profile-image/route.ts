import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";
import { logger } from "@/lib/logger";

// POST /api/admin/profile-image - Upload an admin profile image
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Ensure the user is an admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    
    const formData = await req.formData();
    logger.info("Admin profile image upload - received form data");
    
    const file = formData.get("profileImage") as File;
    
    if (!file) {
      logger.error("Admin profile image upload - No file provided");
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }
    
    logger.info(`Admin profile image upload - File details: name=${file.name}, type=${file.type}, size=${file.size}`);

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      logger.error(`Admin profile image upload - Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed" },
        { status: 400 }
      );
    }

    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      logger.error(`Admin profile image upload - File too large: ${file.size} bytes`);
      return NextResponse.json(
        { error: "File is too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public/uploads/profiles");
    logger.info(`Admin profile image upload - Upload directory: ${uploadDir}`);
    
    try {
      await mkdir(uploadDir, { recursive: true });
      logger.info("Admin profile image upload - Created upload directory if needed");
    } catch (err) {
      logger.error("Error creating directory:", err);
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = join(uploadDir, fileName);
    logger.info(`Admin profile image upload - File will be saved to: ${filePath}`);

    try {
      // Convert file to buffer and save
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      logger.info(`Admin profile image upload - File buffer size: ${fileBuffer.length} bytes`);
      
      await writeFile(filePath, fileBuffer);
      logger.info("Admin profile image upload - File saved successfully");
    } catch (error) {
      logger.error("Error writing file to disk:", error);
      return NextResponse.json(
        { error: "Failed to save image file" },
        { status: 500 }
      );
    }

    // The URL path that will be accessible from the frontend
    const fileUrl = `/uploads/profiles/${fileName}`;
    logger.info(`Admin profile image upload - File URL: ${fileUrl}`);

    // Update user profile in database
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          profileImage: fileUrl,
          image: fileUrl, // Also update the image field for NextAuth
          updatedAt: new Date(),
        },
      });
      logger.info(`Admin profile image upload - Updated user in database: ${userId}`);
    } catch (error) {
      logger.error("Error updating user profile in database:", error);
      return NextResponse.json(
        { error: "Failed to update profile in database" },
        { status: 500 }
      );
    }

    // Log activity
    try {
      await prisma.userActivityLog.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          action: 'ADMIN_PROFILE_IMAGE_UPDATE',
          details: 'Admin profile image updated',
          timestamp: new Date(),
        },
      });
      logger.info(`Admin profile image upload - Created activity log`);
    } catch (error) {
      logger.error("Error creating activity log:", error);
      // Continue even if logging fails
    }

    // Log system event
    try {
      await prisma.systemLog.create({
        data: {
          id: crypto.randomUUID(),
          type: 'AUDIT',
          level: 'INFO',
          message: 'Admin profile image updated',
          details: `Admin user ${userId} updated their profile image`,
          source: 'admin-profile-image-api',
          userId: userId,
          timestamp: new Date(),
        }
      });
      logger.info(`Admin profile image upload - Created system log`);
    } catch (error) {
      logger.error("Error creating system log:", error);
      // Continue even if logging fails
    }

    logger.info(`Admin profile image upload - Successfully completed for user ${userId}`);
    return NextResponse.json({ 
      message: "✅ Profile picture updated successfully! Your photo has been saved.",
      imageUrl: fileUrl
    });
  } catch (error) {
    logger.error("Error in POST /api/admin/profile-image:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while uploading image" },
      { status: 500 }
    );
  }
} 