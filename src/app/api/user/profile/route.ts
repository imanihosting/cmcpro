import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/user/profile - Get current user profile
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
    const userRole = session.user.role;

    // Define common fields to select
    const commonFields = {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      phoneNumber: true,
      location: true,
      bio: true,
      role: true,
      createdAt: true,
    };

    // Add childminder-specific fields if user is a childminder
    const childminderFields = userRole === 'childminder' ? {
      ageGroupsServed: true,
      availability: true,
      careTypes: true,
      childrenFirstCert: true,
      educationLevel: true,
      firstAidCert: true,
      firstAidCertExpiry: true,
      gardaVetted: true,
      languagesSpoken: true,
      maxChildrenCapacity: true,
      mealsProvided: true,
      otherQualifications: true,
      pickupDropoff: true,
      qualifications: true,
      rate: true,
      rateDetails: true,
      specialNeedsExp: true,
      specialNeedsDetails: true,
      specialties: true,
      tuslaRegistered: true,
      tuslaRegistrationNumber: true,
      yearsOfExperience: true
    } : {};

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...commonFields,
        ...childminderFields
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in GET /api/user/profile:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const data = await req.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Email can't be changed, so we don't update it
    const { email, ...updatableData } = data;

    // Define select fields based on role
    const commonSelectFields = {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      phoneNumber: true,
      location: true,
      role: true,
    };

    // Add childminder-specific fields to select if user is a childminder
    const childminderSelectFields = userRole === 'childminder' ? {
      bio: true,
      ageGroupsServed: true,
      availability: true,
      careTypes: true,
      childrenFirstCert: true,
      educationLevel: true,
      firstAidCert: true,
      firstAidCertExpiry: true,
      gardaVetted: true,
      languagesSpoken: true,
      maxChildrenCapacity: true,
      mealsProvided: true,
      otherQualifications: true,
      pickupDropoff: true,
      qualifications: true,
      rate: true,
      rateDetails: true,
      specialNeedsExp: true,
      specialNeedsDetails: true,
      specialties: true,
      tuslaRegistered: true,
      tuslaRegistrationNumber: true,
      yearsOfExperience: true
    } : {};

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updatableData,
        updatedAt: new Date(),
      },
      select: {
        ...commonSelectFields,
        ...childminderSelectFields
      },
    });

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: 'PROFILE_UPDATE',
        details: 'User profile updated',
        timestamp: new Date(),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error in PUT /api/user/profile:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 