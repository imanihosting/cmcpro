import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// GET /api/user/documents - Get all documents for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error in GET /api/user/documents:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST /api/user/documents - Upload a new document
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Only childminders can upload documents for verification
    if (session.user.role !== 'childminder') {
      return NextResponse.json(
        { error: "Only childminders can upload verification documents" },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const category = formData.get("category") as string | null;
    const description = formData.get("description") as string | null;

    if (!file || !name || !type) {
      return NextResponse.json(
        { error: "Missing required fields: file, name, and type are required" },
        { status: 400 }
      );
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public/uploads/documents");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error("Error creating directory:", err);
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = join(uploadDir, fileName);

    // Convert file to buffer and save
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    // The URL path that will be accessible from the frontend
    const fileUrl = `/uploads/documents/${fileName}`;

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        id: uuidv4(),
        userId,
        name,
        type,
        url: fileUrl,
        category,
        description,
        fileSize: file.size,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date()
      },
    });

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        id: uuidv4(),
        userId,
        action: 'DOCUMENT_UPLOADED',
        details: `Document uploaded: ${name}`,
        timestamp: new Date()
      },
    });

    return NextResponse.json({ 
      message: "Document uploaded successfully and pending review",
      document
    });
  } catch (error) {
    console.error("Error in POST /api/user/documents:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while uploading document" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/documents?id={documentId} - Delete a document
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Find the document to ensure it belongs to the user
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (document.userId !== userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "You don't have permission to delete this document" },
        { status: 403 }
      );
    }

    // Delete document from database
    await prisma.document.delete({
      where: { id: documentId },
    });

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        id: uuidv4(),
        userId,
        action: 'DOCUMENT_DELETED',
        details: `Document deleted: ${document.name}`,
        timestamp: new Date()
      },
    });

    return NextResponse.json({ 
      message: "Document deleted successfully" 
    });
  } catch (error) {
    console.error("Error in DELETE /api/user/documents:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting document" },
      { status: 500 }
    );
  }
} 