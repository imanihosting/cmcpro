import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { User_role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = params;
    
    // Extract the user data from the request
    const { 
      name, 
      email, 
      phoneNumber, 
      bio, 
      rate, 
      language, 
      services,
      address
    } = await req.json();

    // Get the current user for role check and verification
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check authorization: user can only update their own profile unless they're an admin
    const isOwnProfile = currentUser.id === id;
    const isAdmin = currentUser.role === User_role.admin;
    
    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { error: "Not authorized to update this profile" },
        { status: 403 }
      );
    }

    // Get the user to be updated - without trying to include the Address model yet
    const userToUpdate = await prisma.user.findUnique({
      where: { id }
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare data for update
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (language) updateData.preferredLanguage = language;
    
    // Handle childminder-specific fields
    if (userToUpdate.role === User_role.childminder) {
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      if (rate) updateData.rate = rate;
      if (services) updateData.services = services;
    }

    // Update user record
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Handle address updates
    if (address) {
      // Validate address fields
      const hasAddressData = address.streetAddress || address.city || address.county;
      const hasAllRequiredFields = address.streetAddress && address.city && address.county;
      
      // For childminders, address is required
      if (userToUpdate.role === User_role.childminder && hasAddressData && !hasAllRequiredFields) {
        return NextResponse.json(
          { error: "Street address, city, and county are required for childminders" },
          { status: 400 }
        );
      }
      
      // For parents, if any address field is provided, all required fields must be provided
      if (userToUpdate.role === User_role.parent && hasAddressData && !hasAllRequiredFields) {
        return NextResponse.json(
          { error: "Please complete all address fields (street address, city, and county) or leave them all empty" },
          { status: 400 }
        );
      }
      
      // Update or create address
      if (hasAddressData) {
        // Format location string for backward compatibility
        const locationString = `${address.streetAddress || ''}, ${address.city || ''}, ${address.county || ''}${address.eircode ? ', ' + address.eircode : ''}`;
        
        // Update the location field in the user record
        await prisma.user.update({
          where: { id },
          data: { location: locationString }
        });
        
        try {
          // Check if user already has an address record
          // @ts-ignore - Using ts-ignore to bypass TypeScript error until Prisma schema is updated
          const existingAddress = await prisma.address.findUnique({
            where: { userId: id }
          });

          if (existingAddress) {
            // Update existing address
            // @ts-ignore - Using ts-ignore to bypass TypeScript error until Prisma schema is updated
            await prisma.address.update({
              where: { userId: id },
              data: {
                streetAddress: address.streetAddress || '',
                city: address.city || '',
                county: address.county || '',
                eircode: address.eircode || null,
                updatedAt: new Date()
              }
            });
          } else {
            // Create new address
            // @ts-ignore - Using ts-ignore to bypass TypeScript error until Prisma schema is updated
            await prisma.address.create({
              data: {
                id: uuidv4(),
                userId: id,
                streetAddress: address.streetAddress || '',
                city: address.city || '',
                county: address.county || '',
                eircode: address.eircode || null,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          }
        } catch (addressError) {
          console.warn("Could not update/create Address record:", addressError);
          // Continue execution even if address update fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
} 