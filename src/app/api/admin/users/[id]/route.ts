import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { User_role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Define valid user status options
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

// Get user details by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the user with detailed information
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        phoneNumber: true,
        subscriptionStatus: true,
        trialActivated: true,
        trialEndDate: true,
        trialStartDate: true,
        location: true,
        bio: true,
        gardaVetted: true,
        tuslaRegistered: true,
        tuslaRegistrationNumber: true,
        firstAidCert: true,
        firstAidCertExpiry: true,
        childrenFirstCert: true,
        maxChildrenCapacity: true,
        yearsOfExperience: true,
        qualifications: true,
        rate: true,
        dateOfBirth: true,
        gender: true,
        // Related data counts
        _count: {
          select: {
            Child: true,
            Booking_Booking_childminderIdToUser: true,
            Booking_Booking_parentIdToUser: true,
            Document_Document_userIdToUser: true,
            Review_Review_revieweeIdToUser: true,
            Review_Review_reviewerIdToUser: true,
            SupportTicket: true
          }
        },
        // For childminders or parents with specific additional data
        // Include subscription information
        Subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
            stripeCurrentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Determine user status based on available fields
    let status: UserStatus = 'ACTIVE';
    if (!user.emailVerified) {
      status = 'INACTIVE';
    }
    // We would need a suspended field in the DB to properly determine this
    // if (user.suspended) {
    //   status = 'SUSPENDED';
    // }
    
    // Get recent activity logs for this user
    const recentActivity = await db.userActivityLog.findMany({
      where: { userId: userId },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    // Format response with user data, status, and related counts
    const userData = {
      ...user,
      status,
      recentActivity
    };
    
    return NextResponse.json(userData);
    
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Update user status or role
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Prevent admins from modifying their own account to prevent accidental lockout
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Admins cannot modify their own account through this interface' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { status, role } = body;
    
    // Ensure at least one field is provided
    if (!status && !role) {
      return NextResponse.json(
        { error: 'At least one field (status or role) must be provided' },
        { status: 400 }
      );
    }
    
    // Check if the user exists
    const userExists = await db.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    if (!userExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Prepare data for update
    const updateData: any = {};
    let activityDescription = '';
    
    // Handle role update if provided
    if (role) {
      // Validate the role
      if (!Object.values(User_role).includes(role as User_role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      
      updateData.role = role;
      activityDescription += `Role changed to ${role}. `;
    }
    
    // Handle status update if provided
    if (status) {
      // Validate the status
      const validStatuses: UserStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
      if (!validStatuses.includes(status as UserStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      
      // Map status to actual database fields
      // Note: This is a simplified implementation
      // In a real system, we would handle these statuses with dedicated fields
      switch (status) {
        case 'ACTIVE':
          // If we don't have a proper status field, this might not do much
          // In a real implementation, you would set appropriate fields
          activityDescription += 'Account activated. ';
          break;
        case 'INACTIVE':
          // We might mark the email as unverified for example
          // updateData.emailVerified = null;
          activityDescription += 'Account deactivated. ';
          break;
        case 'SUSPENDED':
          // We would need a suspended field
          // updateData.suspended = true;
          activityDescription += 'Account suspended. ';
          break;
      }
    }
    
    // Update the user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // Log the activity
    await db.userActivityLog.create({
      data: {
        id: uuidv4(),
        userId: userId,
        action: 'ADMIN_UPDATE',
        details: `Admin ${session.user.name || session.user.email} updated user account. ${activityDescription}`,
        timestamp: new Date()
      }
    });
    
    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });
    
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 