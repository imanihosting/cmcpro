import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import * as crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
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
    
    const documentId = params.documentId;
    
    // Find the document in the database
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        User_Document_userIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        User_Document_reviewerIdToUser: {
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
    
    // Format the response data
    const documentDetails = {
      id: document.id,
      name: document.name,
      type: document.type,
      category: document.category,
      description: document.description,
      fileSize: document.fileSize,
      status: document.status,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      reviewDate: document.reviewDate,
      reviewerId: document.reviewerId,
      user: document.User_Document_userIdToUser ? {
        id: document.User_Document_userIdToUser.id,
        name: document.User_Document_userIdToUser.name || 'Unknown',
        email: document.User_Document_userIdToUser.email,
        role: document.User_Document_userIdToUser.role,
      } : null,
      reviewer: document.User_Document_reviewerIdToUser ? {
        id: document.User_Document_reviewerIdToUser.id,
        name: document.User_Document_reviewerIdToUser.name || 'Unknown',
        email: document.User_Document_reviewerIdToUser.email,
      } : null,
      downloadUrl: document.url || null,
    };
    
    // Log document view activity
    await db.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: 'DOCUMENT_VIEWED_BY_ADMIN',
        details: `Document viewed: ${document.name} (ID: ${document.id})`,
        timestamp: new Date(),
      }
    });
    
    return NextResponse.json(documentDetails);
    
  } catch (error: any) {
    console.error('Error fetching document details:', error);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 