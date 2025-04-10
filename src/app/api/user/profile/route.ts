import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendProfileUpdateNotification } from "@/lib/notifications";

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
      // Include the address relation
      Address: {
        select: {
          streetAddress: true,
          city: true,
          county: true,
          eircode: true
        }
      }
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

    // Extract and rename address for easier client-side consumption
    const responseData = {
      ...user,
      address: user.Address || null
    };

    return NextResponse.json(responseData);
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

    // Extract address data from the request
    const { email, address, ...updatableData } = data;

    // Format location string for backward compatibility
    if (address) {
      // Create a formatted location string from the address components
      updatableData.location = `${address.streetAddress || ''}, ${address.city || ''}, ${address.county || ''}${address.eircode ? ', ' + address.eircode : ''}`;
    }

    // Define select fields based on role
    const commonSelectFields = {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      phoneNumber: true,
      location: true,
      role: true,
      Address: {
        select: {
          streetAddress: true,
          city: true,
          county: true,
          eircode: true
        }
      }
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

    // Handle address update separately
    if (address && typeof address === 'object') {
      try {
        // Clean up address values to remove JSON artifacts
        const cleanAddress = {
          streetAddress: typeof address.streetAddress === 'string' 
            ? address.streetAddress.replace(/^{"|"}$/g, '').replace(/\\"/g, '"').replace(/^{"streetAddress":"|"}$/g, '')
            : address.streetAddress || '',
          city: typeof address.city === 'string'
            ? address.city.replace(/^{"|"}$/g, '').replace(/\\"/g, '"').replace(/^"city":"|"$/g, '')
            : address.city || '',
          county: address.county || '',
          eircode: typeof address.eircode === 'string'
            ? address.eircode.replace(/^{"|"}$/g, '').replace(/\\"/g, '"').replace(/^"eircode":"|"}$/g, '')
            : address.eircode || '',
        };

        // Store the formatted address in the location field as well (for backward compatibility)
        await prisma.user.update({
          where: { id: userId },
          data: {
            location: `${cleanAddress.streetAddress}, ${cleanAddress.city}, ${cleanAddress.county}${cleanAddress.eircode ? ', ' + cleanAddress.eircode : ''}`,
            updatedAt: new Date()
          }
        });

        // Try to handle Address model operations, but gracefully handle if the model isn't available
        try {
          // Check if the user already has an address
          // @ts-ignore - Use ts-ignore to bypass TypeScript check until Prisma client is regenerated
          const existingAddress = await prisma.address.findUnique({
            where: { userId }
          });

          if (existingAddress) {
            // Update existing address
            // @ts-ignore - Use ts-ignore to bypass TypeScript check until Prisma client is regenerated
            await prisma.address.update({
              where: { userId },
              data: {
                streetAddress: cleanAddress.streetAddress,
                city: cleanAddress.city,
                county: cleanAddress.county,
                eircode: cleanAddress.eircode,
                updatedAt: new Date()
              }
            });
          } else {
            // Create new address
            // @ts-ignore - Use ts-ignore to bypass TypeScript check until Prisma client is regenerated
            await prisma.address.create({
              data: {
                id: crypto.randomUUID(),
                userId,
                streetAddress: cleanAddress.streetAddress,
                city: cleanAddress.city,
                county: cleanAddress.county,
                eircode: cleanAddress.eircode,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          }
        } catch (addressError) {
          console.warn("Could not update Address model, it may not be fully set up:", addressError);
          // Continue execution even if Address model operations fail
        }
      } catch (error) {
        console.error("Error processing address data:", error);
        // Don't rethrow, allow the rest of the function to complete
      }
    }

    // Fetch the updated user with address
    const userWithAddress = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...commonSelectFields,
        ...childminderSelectFields
      }
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

    // Format the response to include address in more accessible way
    const responseData = {
      ...userWithAddress,
      address: userWithAddress?.Address || null
    };

    // Send profile update notification
    await sendProfileUpdateNotification(responseData as any, 'PROFILE');

    return NextResponse.json({
      ...responseData,
      message: "✅ Profile updated successfully! Your changes have been saved."
    });
  } catch (error) {
    console.error("Error in PUT /api/user/profile:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 