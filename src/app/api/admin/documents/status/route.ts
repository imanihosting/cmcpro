import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { Document_status } from '@prisma/client';
import * as crypto from 'crypto';

// Schema for request body validation
const UpdateStatusSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  status: z.nativeEnum(Document_status, {
    errorMap: () => ({ message: "Status must be PENDING, APPROVED, or REJECTED" })
  }),
  adminNotes: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    // Get the session to authenticate the request
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized access. Admin privileges required.' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const { documentId, status, adminNotes } = UpdateStatusSchema.parse(body);
    
    // Find the document in the database
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        User_Document_userIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // If status is not changing, return early
    if (document.status === status) {
      return NextResponse.json({
        message: `Document status is already ${status}`,
        document: {
          id: document.id,
          status: document.status
        }
      });
    }
    
    // Update the document status
    const updatedDocument = await db.document.update({
      where: { id: documentId },
      data: {
        status,
        reviewerId: session.user.id,
        reviewDate: new Date(),
        description: adminNotes ? 
          `${document.description || ''}\n\nAdmin Notes (${new Date().toISOString()}): ${adminNotes}` : 
          document.description,
        updatedAt: new Date()
      }
    });
    
    // Log the status change
    const changeDetails = {
      previousStatus: document.status,
      newStatus: status,
      documentId: document.id,
      documentName: document.name,
      adminId: session.user.id,
      adminEmail: session.user.email,
      timestamp: new Date().toISOString(),
      notes: adminNotes || 'No additional notes provided'
    };
    
    // Create a detailed log entry
    await db.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: 'DOCUMENT_STATUS_UPDATED',
        details: JSON.stringify(changeDetails),
        timestamp: new Date(),
      }
    });
    
    // Also create a notification for the document owner
    if (document.User_Document_userIdToUser) {
      await db.notification.create({
        data: {
          id: crypto.randomUUID(),
          type: 'DOCUMENT_STATUS_CHANGE',
          title: `Document ${status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'Status Updated'}`,
          message: `Your document "${document.name}" has been ${status.toLowerCase()} by an administrator.${adminNotes ? ` Notes: ${adminNotes}` : ''}`,
          status: 'UNREAD',
          userId: document.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            documentId: document.id,
            documentName: document.name,
            status: status,
            reviewedAt: new Date().toISOString()
          }
        }
      });
    }
    
    return NextResponse.json({
      message: `Document status updated to ${status}`,
      document: {
        id: updatedDocument.id,
        status: updatedDocument.status,
        reviewerId: updatedDocument.reviewerId,
        reviewDate: updatedDocument.reviewDate
      }
    });
    
  } catch (error: any) {
    console.error('Error updating document status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 