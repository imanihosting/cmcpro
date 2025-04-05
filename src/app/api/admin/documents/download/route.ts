import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { join } from 'path';
import * as crypto from 'crypto';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('id');
    const expiresTimestamp = searchParams.get('expires');
    const signature = searchParams.get('signature');
    
    if (!documentId || !expiresTimestamp || !signature) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Validate that the URL hasn't expired
    const now = Math.floor(Date.now() / 1000);
    if (now > parseInt(expiresTimestamp)) {
      return NextResponse.json(
        { error: 'Download link has expired. Please request a new one.' },
        { status: 403 }
      );
    }
    
    // Verify the signature to ensure the URL wasn't tampered with
    const hmac = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback-secret');
    const data = `${documentId}:${expiresTimestamp}`;
    const expectedSignature = hmac.update(data).digest('hex');
    
    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }
    
    // Find the document in the database
    const document = await db.document.findUnique({
      where: { id: documentId }
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
    
    if (!existsSync(absoluteFilePath)) {
      return NextResponse.json(
        { error: 'Document file not found on server' },
        { status: 404 }
      );
    }
    
    // Read the file
    const fileBuffer = await readFile(absoluteFilePath);
    
    // Determine MIME type based on file extension
    const fileExt = absoluteFilePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream'; // Default
    
    if (fileExt) {
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'txt': 'text/plain',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
      
      contentType = mimeTypes[fileExt] || contentType;
    }
    
    // Create a filename for the download
    const filename = document.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Log the download
    await db.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: 'DOCUMENT_DOWNLOADED_BY_ADMIN',
        details: `Document downloaded: ${document.name} (ID: ${document.id})`,
        timestamp: new Date(),
      }
    });
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });
    
  } catch (error: any) {
    console.error('Error downloading document:', error);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 