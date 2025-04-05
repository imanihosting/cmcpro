import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SystemLog_level, SystemLog_type } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Helper function to get date range
const getDateRange = (days = 7) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  return { startDate, endDate };
};

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize the request
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get URL parameters for filters
    const { searchParams } = new URL(request.url);
    const timeRangeInDays = parseInt(searchParams.get('timeRange') || '7', 10);
    const logLevel = searchParams.get('level') || undefined;
    const logType = searchParams.get('type') || undefined;
    const searchQuery = searchParams.get('query') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;
    
    // Get date range for the specified time period
    const { startDate, endDate } = getDateRange(timeRangeInDays);
    
    // Build the where clause for the database query
    const whereClause: any = {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    };
    
    // Add level filter if specified
    if (logLevel) {
      whereClause.level = logLevel as SystemLog_level;
    }
    
    // Add type filter if specified
    if (logType) {
      whereClause.type = logType as SystemLog_type;
    }
    
    // Add search filter if specified
    if (searchQuery) {
      whereClause.OR = [
        { message: { contains: searchQuery, mode: 'insensitive' } },
        { details: { contains: searchQuery, mode: 'insensitive' } },
        { source: { contains: searchQuery, mode: 'insensitive' } },
        { path: { contains: searchQuery, mode: 'insensitive' } }
      ];
    }
    
    // Execute database queries for logs and counts
    const [logs, totalCount, logLevelCounts, logTypeCounts] = await Promise.all([
      // Get logs with pagination
      db.systemLog.findMany({
        where: whereClause,
        orderBy: {
          timestamp: 'desc'
        },
        take: limit,
        skip: offset
      }),
      
      // Get total count of logs matching the filter
      db.systemLog.count({
        where: whereClause
      }),
      
      // Get counts by log level
      db.systemLog.groupBy({
        by: ['level'],
        _count: {
          id: true
        },
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Get counts by log type
      db.systemLog.groupBy({
        by: ['type'],
        _count: {
          id: true
        },
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ]);
    
    // Process log counts by level
    const logCountsByLevel: Record<string, number> = {};
    logLevelCounts.forEach(item => {
      logCountsByLevel[item.level] = item._count.id;
    });
    
    // Process log counts by type
    const logCountsByType: Record<string, number> = {};
    logTypeCounts.forEach(item => {
      logCountsByType[item.type] = item._count.id;
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Format and return the response
    return NextResponse.json({
      logs,
      meta: {
        totalCount,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      summary: {
        byLevel: logCountsByLevel,
        byType: logCountsByType
      }
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 