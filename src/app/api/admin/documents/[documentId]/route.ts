import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { join } from 'path';
import { existsSync } from 'fs';
import * as crypto from 'crypto';

// Helper function to generate a secure, time-limited URL for document access
function generateSecureDocumentUrl(documentId: string, fileName: string, expiry = 300) { // Default 5 minutes
  const timestamp = Math.floor(Date.now() / 1000) + expiry;
  const hmac = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback-secret');
  const data = `${documentId}:${timestamp}`;
  const signature = hmac.update(data).digest('hex');
  
  // Return a URL that will be validated by the download endpoint
  return `/api/admin/documents/download?id=${documentId}&expires=${timestamp}&signature=${signature}`;
}

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
    
    // Verify the file actually exists in the filesystem
    const relativeFilePath = document.url;
    const absoluteFilePath = join(process.cwd(), 'public', relativeFilePath);
    
    const fileExists = existsSync(absoluteFilePath);
    
    // Generate a secure, time-limited download URL
    const secureDownloadUrl = generateSecureDocumentUrl(document.id, document.name);
    
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
      downloadUrl: fileExists ? secureDownloadUrl : null,
      fileExists: fileExists,
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