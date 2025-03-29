import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { User_role } from '@prisma/client';

// Convert string to role type safely
const parseRole = (role?: string): User_role | undefined => {
  if (!role) return undefined;
  
  if (Object.values(User_role).includes(role as User_role)) {
    return role as User_role;
  }
  
  return undefined;
};

// Status options for users
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

// Convert string to status type safely
const parseStatus = (status?: string): UserStatus | undefined => {
  const validStatuses: UserStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  
  if (!status) return undefined;
  
  if (validStatuses.includes(status as UserStatus)) {
    return status as UserStatus;
  }
  
  return undefined;
};

export async function GET(request: Request) {
  try {
    // Authenticate and authorize the request
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    // Get query parameters
    const url = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    
    // Filtering parameters
    const search = url.searchParams.get('search') || undefined;
    const role = parseRole(url.searchParams.get('role') || undefined);
    const status = parseStatus(url.searchParams.get('status') || undefined);
    
    // Sorting parameters
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Build the filter conditions
    const where: any = {};
    
    // Add search condition
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Add role condition
    if (role) {
      where.role = role;
    }
    
    // Add status condition based on different properties
    if (status) {
      switch (status) {
        case 'ACTIVE':
          // We can consider a user active if their account is not blocked
          where.emailVerified = { not: null };
          break;
        case 'INACTIVE':
          // We can consider a user inactive if they haven't verified their email
          where.emailVerified = null;
          break;
        case 'SUSPENDED':
          // Note: Would need to add a 'suspended' field to User model to properly implement
          // For now, approximating with an assumption
          // where.suspended = true;
          break;
      }
    }
    
    // Define valid sort fields and their corresponding Prisma field names
    const validSortFields: Record<string, string> = {
      'name': 'name',
      'email': 'email',
      'role': 'role',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt'
    };
    
    // Default to 'createdAt' if an invalid sort field is provided
    const orderBy: Record<string, string> = {};
    orderBy[validSortFields[sortBy] || 'createdAt'] = sortOrder === 'asc' ? 'asc' : 'desc';
    
    // Execute queries in parallel for better performance
    const [users, totalUsers] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          profileImage: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          subscriptionStatus: true
        },
        orderBy,
        skip,
        take: pageSize
      }),
      db.user.count({ where })
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalUsers / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    
    // Format the response
    return NextResponse.json({
      users,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage,
        hasPreviousPage
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching users:', error);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 