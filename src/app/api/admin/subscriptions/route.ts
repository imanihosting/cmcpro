import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';
import { User_role } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Schema for query parameters validation
const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  userId: z.string().optional(),
  email: z.string().optional(),
  name: z.string().optional(),
  status: z.string().optional(),
  role: z.nativeEnum(User_role).optional(),
  sortBy: z.enum(['name', 'email', 'status', 'plan', 'createdAt']).default('createdAt'),
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
    const rawParams = Object.fromEntries(searchParams.entries());
    
    const params = QuerySchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
      userId: searchParams.get('userId') || undefined,
      email: searchParams.get('email') || undefined,
      name: searchParams.get('name') || undefined,
      status: searchParams.get('status') || undefined,
      role: searchParams.get('role') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });
    
    // Build the where clause for filtering
    const where: any = {};
    
    if (params.userId) {
      where.id = params.userId;
    }
    
    if (params.email) {
      where.email = {
        contains: params.email,
      };
    }
    
    if (params.name) {
      where.name = {
        contains: params.name,
      };
    }
    
    if (params.role) {
      where.role = params.role;
    }
    
    // Add subscription status filter
    if (params.status) {
      where.Subscription = {
        status: params.status,
      };
    }
    
    // Calculate pagination
    const skip = (params.page - 1) * params.limit;
    
    // Build the orderBy clause for sorting
    const orderBy: any = {};
    
    // Handle different sort fields
    switch (params.sortBy) {
      case 'name':
        orderBy.name = params.sortOrder;
        break;
      case 'email':
        orderBy.email = params.sortOrder;
        break;
      case 'status':
        orderBy.Subscription = { status: params.sortOrder };
        break;
      case 'plan':
        orderBy.Subscription = { plan: params.sortOrder };
        break;
      default:
        orderBy.createdAt = params.sortOrder;
    }
    
    // Get total count for pagination
    const totalCount = await db.user.count({ where });
    
    // Query users with subscription information
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionStatus: true,
        createdAt: true,
        updatedAt: true,
        Subscription: {
          select: {
            id: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            status: true,
            plan: true,
            createdAt: true,
            updatedAt: true,
            stripeCurrentPeriodEnd: true,
            stripePriceId: true,
            cancelAtPeriodEnd: true,
          }
        }
      },
      orderBy,
      skip,
      take: params.limit,
    });
    
    // Format the response data
    const subscriptions = users.map(user => ({
      userId: user.id,
      userName: user.name || 'Unknown',
      userEmail: user.email,
      userRole: user.role,
      subscriptionId: user.Subscription?.stripeSubscriptionId || null,
      customerId: user.Subscription?.stripeCustomerId || null,
      status: user.Subscription?.status || 'inactive',
      plan: user.Subscription?.plan || 'Free',
      createdAt: user.Subscription?.createdAt || user.createdAt,
      currentPeriodEnd: user.Subscription?.stripeCurrentPeriodEnd || null,
      cancelAtPeriodEnd: user.Subscription?.cancelAtPeriodEnd || false,
    }));
    
    // Return paginated results
    return NextResponse.json({
      subscriptions,
      pagination: {
        total: totalCount,
        page: params.page,
        limit: params.limit,
        pages: Math.ceil(totalCount / params.limit),
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    
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