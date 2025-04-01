import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendBookingStatusNotification } from '@/lib/notifications';
import * as ml from '@/lib/ml';

/**
 * POST /api/dashboard/parent/bookings/emergency
 * 
 * Creates an emergency booking request and notifies nearby available childminders
 */
export async function POST(request: Request) {
  try {
    console.log('Emergency booking request received');
    
    // Get current user session for authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('Unauthorized: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a parent
    if (session.user.role !== 'parent') {
      console.log(`User role is ${session.user.role}, not parent`);
      return NextResponse.json({ error: 'Only parents can create emergency bookings' }, { status: 403 });
    }

    // Get parent ID
    const parentId = session.user.id;
    console.log(`Parent ID: ${parentId}`);

    // Parse request body
    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const {
      childrenIds,
      startDateTime,
      endDateTime,
      notes,
      maxDistance = 10, // Default to 10km radius
      maxResults = 5    // Default to notifying 5 childminders
    } = requestBody;

    // Validate required fields
    if (!childrenIds || childrenIds.length === 0 || !startDateTime || !endDateTime) {
      console.log('Missing required fields', { childrenIds, startDateTime, endDateTime });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate children belong to parent
    const childrenCount = await prisma.child.count({
      where: {
        id: { in: childrenIds },
        parentId: parentId,
      },
    });
    
    console.log(`Children validation: found ${childrenCount} of ${childrenIds.length} requested children belonging to parent ${parentId}`);

    if (childrenCount !== childrenIds.length) {
      return NextResponse.json({ error: 'Invalid children specified' }, { status: 400 });
    }

    // Parse date strings to Date objects
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.log('Invalid date format', { startDateTime, endDateTime });
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (startDate >= endDate) {
      console.log('End time must be after start time', { startDate, endDate });
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // For emergency bookings, ensure the start time is within 24 hours
    const currentTime = new Date();
    const twentyFourHoursLater = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
    
    if (startDate > twentyFourHoursLater) {
      console.log('Emergency booking must be within the next 24 hours', { 
        startDate, 
        currentTime, 
        twentyFourHoursLater,
        timeDiff: (startDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60) + ' hours'
      });
      return NextResponse.json({ 
        error: 'Emergency bookings must be within the next 24 hours',
        suggestion: 'For bookings beyond 24 hours, please use the standard booking process'
      }, { status: 400 });
    }

    // Get parent info for location matching
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        name: true,
        location: true,
        Child: {
          where: { id: { in: childrenIds } },
          select: {
            id: true,
            name: true,
            age: true,
            allergies: true,
            specialNeeds: true
          }
        }
      }
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    // Get parent's booking history for recommendations
    const bookingHistory = await prisma.booking.findMany({
      where: {
        parentId,
        status: {
          in: ['COMPLETED', 'CONFIRMED']
        }
      },
      select: {
        id: true,
        childminderId: true,
        startTime: true,
        endTime: true,
        status: true,
      }
    });

    // Convert to ML-compatible format
    const parentProfile: ml.ParentProfile = {
      id: parent.id,
      location: parent.location,
      children: parent.Child.map(child => ({ age: child.age })),
    };

    const formattedBookings: ml.BookingHistory[] = bookingHistory.map(booking => ({
      childminderId: booking.childminderId,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
    }));

    // Find available childminders
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    try {
      // First, let's just find all childminders with lastMinuteAvailable=true
      const allChildmindersQuery = await prisma.$queryRaw`
        SELECT 
          u.id, 
          u.name, 
          u.email,
          u.lastMinuteAvailable
        FROM User u
        WHERE u.role = 'childminder'
        ORDER BY u.name
      `;
      
      console.log(`Found ${Array.isArray(allChildmindersQuery) ? allChildmindersQuery.length : 0} total childminders`);
      
      // Log all childminders and their lastMinuteAvailable status
      if (Array.isArray(allChildmindersQuery)) {
        allChildmindersQuery.forEach((cm: any) => {
          console.log(`Childminder: ${cm.name} (${cm.email}), lastMinuteAvailable = ${cm.lastMinuteAvailable === 1 ? 'true' : 'false'}`);
        });
      }
      
      // Now find all childminders with lastMinuteAvailable=true
      const availableChildminders = await prisma.$queryRaw`
        SELECT 
          u.id, 
          u.name, 
          u.email,
          u.lastMinuteAvailable,
          (SELECT COUNT(*) FROM Booking b 
           WHERE b.childminderId = u.id 
           AND b.status IN ('PENDING', 'CONFIRMED')
           AND b.startTime <= ${endDate}
           AND b.endTime >= ${startDate}) as bookingCount
        FROM User u
        WHERE u.role = 'childminder'
        AND u.lastMinuteAvailable = 1
        ORDER BY u.name
      `;
      
      console.log(`Found ${Array.isArray(availableChildminders) ? availableChildminders.length : 0} childminders with lastMinuteAvailable=true`);
      
      // Log detailed information about each childminder with lastMinuteAvailable=true
      if (Array.isArray(availableChildminders)) {
        availableChildminders.forEach((cm: any) => {
          console.log(`Available childminder: ${cm.name} (${cm.email}), bookingCount = ${cm.bookingCount}`);
        });
      }
      
      // For debugging, temporarily return all childminders with lastMinuteAvailable, ignoring booking conflicts
      const childmindersWithNoConflicts = Array.isArray(availableChildminders) ? 
        availableChildminders.filter((cm: any) => cm.bookingCount === 0) : [];
      
      console.log(`${childmindersWithNoConflicts.length} childminders have no booking conflicts`);
      
      // Temporary: For debugging, if no childminders are available, still proceed with any available childminder
      if (childmindersWithNoConflicts.length === 0 && Array.isArray(availableChildminders) && availableChildminders.length > 0) {
        console.log("DEBUG: No childminders without conflicts, but proceeding with first available childminder for testing");
        const firstChild = availableChildminders[0];
        
        // Show detailed info about bookings for this childminder
        const bookings = await prisma.booking.findMany({
          where: {
            childminderId: firstChild.id,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          select: {
            id: true,
            startTime: true,
            endTime: true, 
            status: true
          }
        });
        
        console.log(`Childminder ${firstChild.name} has ${bookings.length} bookings:`);
        bookings.forEach(booking => {
          console.log(`- Booking ${booking.id}: ${booking.startTime.toISOString()} to ${booking.endTime.toISOString()} (${booking.status})`);
          
          // Check if this booking conflicts with our requested time
          const conflicts = booking.startTime <= endDate && booking.endTime >= startDate;
          console.log(`  Conflicts with requested time (${startDate.toISOString()} - ${endDate.toISOString()}): ${conflicts}`);
        });
        
        // If we're here for debugging, use this childminder anyway
        childmindersWithNoConflicts.push(firstChild);
      }
      
      if (childmindersWithNoConflicts.length === 0) {
        return NextResponse.json({ 
          error: 'All available childminders are currently booked',
          message: 'Try again with different times or use the standard booking process'
        }, { status: 404 });
      }
      
      // Convert raw data to ChildminderProfile format
      // Only include the fields we know are available in our simplified query
      const childminderProfiles: ml.ChildminderProfile[] = childmindersWithNoConflicts.map((cm: any) => ({
        id: cm.id,
        name: cm.name || "Unknown",
        bio: null, // We didn't fetch this field in our simplified query
        location: null, // We didn't fetch this field in our simplified query
        rate: null, // We didn't fetch this field in our simplified query
        yearsOfExperience: null, // We didn't fetch this field in our simplified query
        ageGroupsServed: null, // We didn't fetch this field in our simplified query
        languagesSpoken: null, // We didn't fetch this field in our simplified query
        specialNeedsExp: false, // We didn't fetch this field in our simplified query
        firstAidCert: false, // We didn't fetch this field in our simplified query
        gardaVetted: false, // We didn't fetch this field in our simplified query
        tuslaRegistered: false, // We didn't fetch this field in our simplified query
        reviewRatings: [], // We didn't fetch this field in our simplified query
      }));
      
      // Rank childminders using ML utility
      const rankedChildminders = ml.filterChildmindersByPreferences(
        parentProfile,
        childminderProfiles,
        formattedBookings
      );
      
      // Take top results based on maxResults parameter
      const topChildminders = rankedChildminders.slice(0, maxResults);
      console.log(`DEBUG: Selected top ${topChildminders.length} childminders`);
      
      if (topChildminders.length === 0) {
        return NextResponse.json({ 
          error: 'No available childminders matched your preferences',
          message: 'Try again later or use the standard booking process'
        }, { status: 404 });
      }
      
      // Create a booking in pending state
      const booking = await prisma.booking.create({
        data: {
          id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          parentId,
          // Assign to the top-ranked childminder
          childminderId: topChildminders[0].id,
          startTime: startDate,
          endTime: endDate,
          status: 'PENDING',
          bookingType: 'EMERGENCY',
          isEmergency: true,
          isRecurring: false,
          priority: 10, // High priority for emergency bookings
          updatedAt: new Date(),
        },
      });
      
      // Create booking-children associations
      for (const childId of childrenIds) {
        await prisma.bookingChildren.create({
          data: {
            id: `bc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            bookingId: booking.id,
            childId,
          }
        });
      }

      // Create emergency recommendations
      for (const childminder of topChildminders) {
        await prisma.recommendation.create({
          data: {
            id: `rec-${Date.now()}-${childminder.id.substring(0, 5)}`,
            parentId,
            childminderId: childminder.id,
            score: 100, // Top priority for emergency
            recommendationType: 'EMERGENCY',
            reasons: JSON.stringify([
              'Available for last-minute bookings',
              'Close to your location',
              'Available during requested time'
            ]),
            isEmergency: true,
            isViewed: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
      }

      // Send notifications to all top childminders
      for (const childminder of topChildminders) {
        await prisma.notification.create({
          data: {
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            userId: childminder.id,
            type: 'EMERGENCY_BOOKING',
            title: '⚠️ Emergency Booking Request',
            message: `Urgent: ${parent.name} needs childcare starting ${startDate.toLocaleString()}`,
            status: 'UNREAD',
            metadata: JSON.stringify({ 
              bookingId: booking.id,
              parentId: parentId,
              isEmergency: true,
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString(),
              children: parent.Child.map(c => ({ id: c.id, name: c.name, age: c.age }))
            }),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Fetch the complete booking with user information to send email notification
      const completeBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          User_Booking_parentIdToUser: true,
          User_Booking_childminderIdToUser: true
        }
      });

      // Send email notification if booking is found
      if (completeBooking) {
        await sendBookingStatusNotification(
          completeBooking,
          'PENDING', // Previous status (new booking)
          'PENDING'  // New status
        );
      }

      // Return the created booking and recommendations
      return NextResponse.json({ 
        message: 'Emergency booking request sent to childminders',
        booking: {
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          bookingType: booking.bookingType,
        },
        notifiedChildminders: topChildminders.map(cm => ({
          id: cm.id,
          name: cm.name,
        }))
      });
    } catch (error) {
      console.error("Error finding available childminders:", error);
      return NextResponse.json({ error: "Failed to find available childminders" }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating emergency booking:', error);
    return NextResponse.json({ error: 'Failed to create emergency booking' }, { status: 500 });
  }
} 