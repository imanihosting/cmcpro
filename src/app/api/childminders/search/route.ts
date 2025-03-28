import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Default number of items per page
const DEFAULT_PAGE_SIZE = 10;

// Allowed sort fields
const ALLOWED_SORT_FIELDS = [
  'name',
  'rate',
  'yearsOfExperience',
  'createdAt',
  'location'
];

export async function GET(request: Request) {
  try {
    // Get current user session for authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a parent
    if (session.user.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can search for childminders' },
        { status: 403 }
      );
    }

    // Parse search parameters from URL
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE));
    
    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page parameter' },
        { status: 400 }
      );
    }
    
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 50) {
      return NextResponse.json(
        { error: 'Invalid pageSize parameter (must be between 1 and 50)' },
        { status: 400 }
      );
    }

    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Validate sorting parameters
    if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
      return NextResponse.json(
        { error: `Invalid sortBy parameter. Allowed values: ${ALLOWED_SORT_FIELDS.join(', ')}` },
        { status: 400 }
      );
    }
    
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      return NextResponse.json(
        { error: 'Invalid sortOrder parameter. Allowed values: asc, desc' },
        { status: 400 }
      );
    }

    // Build the where clause for filtering
    const where: Prisma.UserWhereInput = {
      role: 'childminder',
    };

    // Location filter (postcode / area)
    const location = searchParams.get('location');
    if (location) {
      where.location = {
        contains: location,
      };
    }

    // Rating filter (minimum rating)
    const minRating = searchParams.get('minRating');
    if (minRating && !isNaN(parseFloat(minRating))) {
      // We need to join with the Review model to filter by average rating
      // This is a complex query that requires raw SQL or additional processing
      // For simplicity, we'll fetch all childminders and filter by rating later
    }

    // Age group filter
    const ageGroup = searchParams.get('ageGroup');
    if (ageGroup) {
      where.ageGroupsServed = {
        path: '$[*]',
        array_contains: ageGroup,
      };
    }

    // Availability filters (day of week)
    const dayOfWeek = searchParams.get('dayOfWeek');
    if (dayOfWeek && !isNaN(parseInt(dayOfWeek))) {
      where.RecurringAvailability = {
        some: {
          dayOfWeek: parseInt(dayOfWeek),
        },
      };
    }

    // Certification filters
    if (searchParams.get('firstAidCert') === 'true') {
      where.firstAidCert = true;
    }

    if (searchParams.get('childrenFirstCert') === 'true') {
      where.childrenFirstCert = true;
    }

    if (searchParams.get('gardaVetted') === 'true') {
      where.gardaVetted = true;
    }

    if (searchParams.get('tuslaRegistered') === 'true') {
      where.tuslaRegistered = true;
    }

    // Special needs experience filter
    if (searchParams.get('specialNeedsExp') === 'true') {
      where.specialNeedsExp = true;
    }

    // Price range filter
    const minRate = searchParams.get('minRate');
    const maxRate = searchParams.get('maxRate');

    // Build the rate filter object
    let rateFilter: any = {};
    
    if (minRate && !isNaN(parseFloat(minRate))) {
      rateFilter.gte = parseFloat(minRate);
    }

    if (maxRate && !isNaN(parseFloat(maxRate))) {
      rateFilter.lte = parseFloat(maxRate);
    }

    // Only add the rate filter if we have at least one condition
    if (Object.keys(rateFilter).length > 0) {
      where.rate = rateFilter;
    }

    // Experience filter (years)
    const minExperience = searchParams.get('minExperience');
    if (minExperience && !isNaN(parseInt(minExperience))) {
      where.yearsOfExperience = {
        gte: parseInt(minExperience),
      };
    }

    // Languages filter
    const language = searchParams.get('language');
    if (language) {
      where.languagesSpoken = {
        path: '$[*]',
        array_contains: language,
      };
    }

    // Meals provided filter
    if (searchParams.get('mealsProvided') === 'true') {
      where.mealsProvided = true;
    }

    // Pickup/dropoff filter
    if (searchParams.get('pickupDropoff') === 'true') {
      where.pickupDropoff = true;
    }

    // Calculate pagination offsets
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Get total count of childminders matching the criteria
    const totalCount = await prisma.user.count({ where });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);

    // Prepare the order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get childminders matching the criteria with pagination
    const childminders = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        bio: true,
        image: true,
        location: true,
        rate: true,
        yearsOfExperience: true,
        ageGroupsServed: true,
        languagesSpoken: true,
        firstAidCert: true,
        childrenFirstCert: true,
        gardaVetted: true,
        tuslaRegistered: true,
        specialNeedsExp: true,
        mealsProvided: true,
        pickupDropoff: true,
        RecurringAvailability: {
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
        Review_Review_revieweeIdToUser: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            User_Review_reviewerIdToUser: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          take: 3,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy,
      skip,
      take,
    });

    // Calculate average rating for each childminder
    const childmindersWithRating = childminders.map(childminder => {
      const reviews = childminder.Review_Review_revieweeIdToUser;
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
      const reviewCount = reviews.length;

      // Convert reviews to a more user-friendly format
      const formattedReviews = reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        reviewer: {
          id: review.User_Review_reviewerIdToUser.id,
          name: review.User_Review_reviewerIdToUser.name,
          image: review.User_Review_reviewerIdToUser.image,
        },
      }));

      return {
        id: childminder.id,
        name: childminder.name,
        bio: childminder.bio,
        image: childminder.image,
        location: childminder.location,
        rate: childminder.rate,
        yearsOfExperience: childminder.yearsOfExperience,
        ageGroupsServed: childminder.ageGroupsServed,
        languagesSpoken: childminder.languagesSpoken,
        certifications: {
          firstAidCert: childminder.firstAidCert,
          childrenFirstCert: childminder.childrenFirstCert,
          gardaVetted: childminder.gardaVetted,
          tuslaRegistered: childminder.tuslaRegistered,
        },
        specialNeedsExp: childminder.specialNeedsExp,
        mealsProvided: childminder.mealsProvided,
        pickupDropoff: childminder.pickupDropoff,
        availability: childminder.RecurringAvailability,
        reviews: formattedReviews,
        averageRating,
        reviewCount,
      };
    });

    // Filter by minimum rating if specified
    let filteredChildminders = childmindersWithRating;
    if (minRating && !isNaN(parseFloat(minRating))) {
      filteredChildminders = childmindersWithRating.filter(
        childminder => childminder.averageRating >= parseFloat(minRating)
      );
    }

    // Prepare pagination metadata
    const pagination = {
      page,
      pageSize,
      totalItems: minRating ? filteredChildminders.length : totalCount,
      totalPages: minRating ? Math.ceil(filteredChildminders.length / pageSize) : totalPages,
      hasNextPage: page < (minRating ? Math.ceil(filteredChildminders.length / pageSize) : totalPages),
      hasPreviousPage: page > 1,
    };

    // Return the response
    return NextResponse.json({
      data: filteredChildminders,
      pagination,
    });
  } catch (error) {
    console.error('Error searching childminders:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching for childminders' },
      { status: 500 }
    );
  }
} 