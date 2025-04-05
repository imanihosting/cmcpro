import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { Document_status } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Schema for query parameters validation
const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  userId: z.string().optional(),
  userEmail: z.string().optional(),
  userName: z.string().optional(),
  documentType: z.string().optional(),
  status: z.nativeEnum(Document_status).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.enum(['name', 'type', 'createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

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
    
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    
    const params = QuerySchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
      userId: searchParams.get('userId') || undefined,
      userEmail: searchParams.get('userEmail') || undefined,
      userName: searchParams.get('userName') || undefined,
      documentType: searchParams.get('documentType') || undefined,
      status: searchParams.get('status') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });
    
    // Build the where clause for filtering
    const where: any = {};
    
    // User ID filter
    if (params.userId) {
      where.userId = params.userId;
    }
    
    // User email or name filter (requires join with User)
    if (params.userEmail || params.userName) {
      where.User_Document_userIdToUser = {};
      
      if (params.userEmail) {
        where.User_Document_userIdToUser.email = {
          contains: params.userEmail,
          mode: 'insensitive'
        };
      }
      
      if (params.userName) {
        where.User_Document_userIdToUser.name = {
          contains: params.userName,
          mode: 'insensitive'
        };
      }
    }
    
    // Document type filter
    if (params.documentType) {
      where.type = {
        contains: params.documentType,
        mode: 'insensitive'
      };
    }
    
    // Status filter
    if (params.status) {
      where.status = params.status;
    }
    
    // Date range filters
    if (params.fromDate) {
      where.createdAt = {
        ...(where.createdAt || {}),
        gte: new Date(params.fromDate)
      };
    }
    
    if (params.toDate) {
      where.createdAt = {
        ...(where.createdAt || {}),
        lte: new Date(params.toDate)
      };
    }
    
    // Calculate pagination
    const skip = (params.page - 1) * params.limit;
    
    // Build the orderBy clause for sorting
    const orderBy: any = {};
    orderBy[params.sortBy] = params.sortOrder;
    
    // Get total count for pagination
    const totalCount = await db.document.count({ where });
    
    // Query documents with user information
    const documents = await db.document.findMany({
      where,
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
      },
      orderBy,
      skip,
      take: params.limit,
    });
    
    // Format the response data
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      category: doc.category,
      description: doc.description,
      status: doc.status,
      createdAt: doc.createdAt,
      reviewDate: doc.reviewDate,
      fileSize: doc.fileSize,
      user: doc.User_Document_userIdToUser ? {
        id: doc.User_Document_userIdToUser.id,
        name: doc.User_Document_userIdToUser.name || 'Unknown',
        email: doc.User_Document_userIdToUser.email,
        role: doc.User_Document_userIdToUser.role,
      } : null,
      reviewer: doc.User_Document_reviewerIdToUser ? {
        id: doc.User_Document_reviewerIdToUser.id,
        name: doc.User_Document_reviewerIdToUser.name || 'Unknown',
        email: doc.User_Document_reviewerIdToUser.email,
      } : null,
    }));
    
    // Return paginated results
    return NextResponse.json({
      documents: formattedDocuments,
      pagination: {
        total: totalCount,
        page: params.page,
        limit: params.limit,
        pages: Math.ceil(totalCount / params.limit),
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 