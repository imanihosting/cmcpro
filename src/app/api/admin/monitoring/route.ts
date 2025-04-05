import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SystemLog_type, SystemLog_level } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Helper function to get date range
const getDateRange = (days = 7) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  return { startDate, endDate };
};

// Define interfaces for data structures
interface LogTypeCount {
  [key: string]: number;
}

interface LogLevelCount {
  [key: string]: number;
}

interface TimeSeriesDataPoint {
  timestamp: string;
  requests: number;
  errors: number;
  performance?: number[];
  avgDuration?: number;
}

interface HourlyData {
  [key: string]: TimeSeriesDataPoint;
}

interface DailyData {
  [key: string]: TimeSeriesDataPoint;
}

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
    const logType = searchParams.get('type') || undefined;
    
    // Get date range for the specified time period
    const { startDate, endDate } = getDateRange(timeRangeInDays);
    
    // Execute all database queries in parallel for better performance
    const [
      apiRequestLogs,
      apiResponseLogs,
      apiErrorLogs,
      apiPerformanceLogs,
      countByLogType,
      countByLogLevel,
      recentErrors,
      avgResponseTimes
    ] = await Promise.all([
      // API Request logs count
      db.systemLog.count({
        where: {
          type: SystemLog_type.API_REQUEST,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // API Response logs count
      db.systemLog.count({
        where: {
          type: SystemLog_type.API_RESPONSE,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // API Error logs count
      db.systemLog.count({
        where: {
          type: SystemLog_type.ERROR,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // API Performance logs count
      db.systemLog.count({
        where: {
          type: SystemLog_type.PERFORMANCE,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Logs grouped by type
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
      }),
      
      // Logs grouped by level
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
      
      // Recent errors (last 20)
      db.systemLog.findMany({
        where: {
          level: {
            in: [SystemLog_level.ERROR, SystemLog_level.CRITICAL]
          },
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 20
      }),
      
      // Average response times by endpoint (based on duration field)
      db.systemLog.groupBy({
        by: ['path'],
        _avg: {
          duration: true
        },
        _count: {
          id: true
        },
        where: {
          type: SystemLog_type.API_RESPONSE,
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          duration: {
            not: null
          }
        },
        having: {
          path: {
            not: null
          }
        },
        orderBy: {
          _avg: {
            duration: 'desc'
          }
        },
        take: 10
      })
    ]);
    
    // Process log counts by type
    const logCountsByType: LogTypeCount = {};
    countByLogType.forEach(item => {
      logCountsByType[item.type] = item._count.id;
    });
    
    // Process log counts by level
    const logCountsByLevel: LogLevelCount = {};
    countByLogLevel.forEach(item => {
      logCountsByLevel[item.level] = item._count.id;
    });
    
    // Get time series data for the specified period
    const timeSeriesData = await getTimeSeriesData(startDate, endDate, logType);
    
    // Format and return the response
    return NextResponse.json({
      summary: {
        totalRequests: apiRequestLogs,
        totalResponses: apiResponseLogs,
        totalErrors: apiErrorLogs,
        totalPerformanceLogs: apiPerformanceLogs,
        errorRate: apiRequestLogs > 0 ? (apiErrorLogs / apiRequestLogs) * 100 : 0
      },
      byType: logCountsByType,
      byLevel: logCountsByLevel,
      recentErrors: recentErrors.map(error => ({
        id: error.id,
        message: error.message,
        details: error.details,
        level: error.level,
        timestamp: error.timestamp,
        path: error.path,
        source: error.source
      })),
      performance: {
        avgResponseTimes: avgResponseTimes.map(item => ({
          path: item.path,
          avgDuration: item._avg.duration,
          requestCount: item._count.id
        }))
      },
      timeSeriesData
    });
  } catch (error) {
    console.error('Error fetching API monitoring data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Helper function to get time series data
async function getTimeSeriesData(startDate: Date, endDate: Date, type?: string) {
  // Calculate the number of days in the range
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  
  // Determine the appropriate interval based on the date range
  let interval: 'hour' | 'day';
  if (daysDiff <= 2) {
    interval = 'hour';
  } else {
    interval = 'day';
  }
  
  // Build the query for time series data
  const timeSeriesQuery = {
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate
      },
      ...(type && { type: type as SystemLog_type })
    },
    orderBy: {
      timestamp: 'asc' as const
    }
  };
  
  // Get all logs in the date range
  const logs = await db.systemLog.findMany(timeSeriesQuery);
  
  // Format the time series data based on the interval
  if (interval === 'hour') {
    // Group by hour
    const hourlyData: HourlyData = {};
    
    logs.forEach(log => {
      const timestamp = new Date(log.timestamp);
      const hourKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')} ${String(timestamp.getHours()).padStart(2, '0')}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          timestamp: hourKey,
          requests: 0,
          errors: 0,
          performance: []
        };
      }
      
      if (log.type === SystemLog_type.API_REQUEST) {
        hourlyData[hourKey].requests++;
      } else if (log.level === SystemLog_level.ERROR || log.level === SystemLog_level.CRITICAL) {
        hourlyData[hourKey].errors++;
      }
      
      if (log.type === SystemLog_type.PERFORMANCE && log.duration) {
        // Ensure performance array exists before pushing
        if (!hourlyData[hourKey].performance) {
          hourlyData[hourKey].performance = [];
        }
        hourlyData[hourKey].performance.push(log.duration);
      }
    });
    
    // Calculate averages for performance data
    Object.values(hourlyData).forEach((data) => {
      if (data.performance && data.performance.length > 0) {
        data.avgDuration = data.performance.reduce((sum: number, val: number) => sum + val, 0) / data.performance.length;
      } else {
        data.avgDuration = 0;
      }
      delete data.performance;
    });
    
    return Object.values(hourlyData);
  } else {
    // Group by day
    const dailyData: DailyData = {};
    
    logs.forEach(log => {
      const timestamp = new Date(log.timestamp);
      const dayKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}`;
      
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = {
          timestamp: dayKey,
          requests: 0,
          errors: 0,
          performance: []
        };
      }
      
      if (log.type === SystemLog_type.API_REQUEST) {
        dailyData[dayKey].requests++;
      } else if (log.level === SystemLog_level.ERROR || log.level === SystemLog_level.CRITICAL) {
        dailyData[dayKey].errors++;
      }
      
      if (log.type === SystemLog_type.PERFORMANCE && log.duration) {
        // Ensure performance array exists before pushing
        if (!dailyData[dayKey].performance) {
          dailyData[dayKey].performance = [];
        }
        dailyData[dayKey].performance.push(log.duration);
      }
    });
    
    // Calculate averages for performance data
    Object.values(dailyData).forEach((data) => {
      if (data.performance && data.performance.length > 0) {
        data.avgDuration = data.performance.reduce((sum: number, val: number) => sum + val, 0) / data.performance.length;
      } else {
        data.avgDuration = 0;
      }
      delete data.performance;
    });
    
    return Object.values(dailyData);
  }
} 