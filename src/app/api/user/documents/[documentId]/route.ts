import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { User_role } from '@prisma/client';

// PUT /api/user/documents/[documentId] - Update document metadata
export async function PUT(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const documentId = params.documentId;

    // Validate input
    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const {
      name,
      type,
      category,
      description,
      expirationDate,
      documentIdentifier,
      issuingAuthority,
    } = body;

    // Basic validation for required fields sent from frontend
    if (!name || !type) {
      return NextResponse.json({ error: "Name and document type are required" }, { status: 400 });
    }

    // Find the document to ensure it exists and belongs to the user
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Authorization check: Only the owner can update
    if (document.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prepare data for update
    const updateData: any = {
      name,
      type,
      category: category || null,
      description: description || null,
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      documentIdentifier: documentIdentifier || null,
      issuingAuthority: issuingAuthority || null,
      updatedAt: new Date(),
      // Optionally update status if needed, e.g., back to PENDING?
      // status: 'PENDING', 
    };

    // Update the document metadata
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Document details updated successfully.",
      document: updatedDocument 
    });

  } catch (error) {
    console.error("Error updating document metadata:", error);
    // Check if the error is due to invalid date format
    if (error instanceof Error && error.message.includes('Invalid date')) {
      return NextResponse.json({ error: "Invalid expiration date format provided." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "An unexpected error occurred while updating document details" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/documents/[documentId] - Delete document
// Placeholder - Needs implementation including utapi.deleteFiles
export async function DELETE(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  console.warn("DELETE /api/user/documents/[documentId] not fully implemented yet.")
  // TODO: 
  // 1. Authenticate user
  // 2. Get documentId from params
  // 3. Find document in DB to get fileKey and check ownership
  // 4. Call utapi.deleteFiles(fileKey) - Needs import { UTApi } from "uploadthing/server"; const utapi = new UTApi();
  // 5. Delete document from DB: prisma.document.delete()
  // 6. Return response
  return NextResponse.json({ error: "Deletion not implemented" }, { status: 501 });
} 