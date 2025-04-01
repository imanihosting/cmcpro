import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';

// This endpoint is designed to be called by a cron service like Vercel Cron Jobs
// It will check for document expirations and send notifications

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cronKey = searchParams.get('key');
    
    // Validate that the request has the correct key
    if (cronKey !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Log the cron job execution
    await prisma.systemLog.create({
      data: {
        id: uuidv4(),
        type: 'CRON_JOB',
        level: 'INFO',
        message: 'Automated document compliance check started',
        metadata: {
          timestamp: new Date(),
          jobType: 'compliance-check'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Trigger the compliance check endpoint
    const complianceCheckUrl = new URL('/api/compliance/check-expirations', request.url);
    complianceCheckUrl.searchParams.set('apiKey', process.env.COMPLIANCE_API_KEY || '');
    
    const response = await fetch(complianceCheckUrl.toString());
    const result = await response.json();
    
    // Log the results
    await prisma.systemLog.create({
      data: {
        id: uuidv4(),
        type: 'CRON_JOB',
        level: 'INFO',
        message: 'Automated document compliance check completed',
        metadata: {
          timestamp: new Date(),
          jobType: 'compliance-check',
          result: {
            totalDocuments: result.totalDocuments,
            notificationsSent: result.notificationsSent,
            expiredDocuments: result.expiredDocuments,
            expiringDocuments: result.expiringDocuments
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Compliance check executed successfully',
      result
    });
    
  } catch (error) {
    console.error('Error in cron job:', error);
    
    // Log the error
    await prisma.systemLog.create({
      data: {
        id: uuidv4(),
        type: 'CRON_JOB',
        level: 'ERROR',
        message: 'Automated document compliance check failed',
        metadata: {
          timestamp: new Date(),
          jobType: 'compliance-check',
          error: error instanceof Error ? error.message : String(error)
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(
      { error: 'Failed to execute compliance check' },
      { status: 500 }
    );
  }
} 