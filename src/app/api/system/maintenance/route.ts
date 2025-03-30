import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET handler to retrieve maintenance mode status
export async function GET() {
  try {
    // Fetch all maintenance settings at once
    const maintenanceSettings = await prisma.securitySetting.findMany({
      where: {
        key: {
          in: ['maintenance_mode', 'maintenance_message', 'maintenance_end_time']
        }
      }
    });

    // Convert array to object for easier access
    const settings: Record<string, string> = {};
    maintenanceSettings.forEach(setting => {
      settings[setting.key] = setting.value;
    });

    return NextResponse.json({
      maintenanceMode: settings['maintenance_mode'] === 'true',
      maintenanceMessage: settings['maintenance_message'] || 'System is currently undergoing maintenance.',
      maintenanceEndTime: settings['maintenance_end_time'] || null,
    });
  } catch (error) {
    console.error('Error fetching maintenance settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance settings' },
      { status: 500 }
    );
  }
}

// PATCH handler to update maintenance mode settings
export async function PATCH(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await req.json();
    
    // Validate input
    const updates = [];
    
    // Update maintenance mode if provided
    if (typeof data.maintenanceMode === 'boolean') {
      updates.push(
        prisma.securitySetting.upsert({
          where: { key: 'maintenance_mode' },
          update: { value: data.maintenanceMode.toString() },
          create: {
            id: crypto.randomUUID(),
            key: 'maintenance_mode',
            value: data.maintenanceMode.toString(),
            description: 'Toggle maintenance mode for the entire application',
            type: 'boolean',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      );
    }
    
    // Update maintenance message if provided
    if (typeof data.maintenanceMessage === 'string') {
      updates.push(
        prisma.securitySetting.upsert({
          where: { key: 'maintenance_message' },
          update: { value: data.maintenanceMessage },
          create: {
            id: crypto.randomUUID(),
            key: 'maintenance_message',
            value: data.maintenanceMessage,
            description: 'Message to display during maintenance mode',
            type: 'string',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      );
    }
    
    // Update maintenance end time if provided or clear it if null
    if (data.maintenanceEndTime !== undefined) {
      updates.push(
        prisma.securitySetting.upsert({
          where: { key: 'maintenance_end_time' },
          update: { value: data.maintenanceEndTime || '' },
          create: {
            id: crypto.randomUUID(),
            key: 'maintenance_end_time',
            value: data.maintenanceEndTime || '',
            description: 'Expected end time of maintenance (ISO format)',
            type: 'datetime',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      );
    }
    
    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates);
    }
    
    // Return updated settings
    const updatedSettings = await prisma.securitySetting.findMany({
      where: {
        key: {
          in: ['maintenance_mode', 'maintenance_message', 'maintenance_end_time']
        }
      }
    });
    
    const settings: Record<string, string> = {};
    updatedSettings.forEach(setting => {
      settings[setting.key] = setting.value;
    });
    
    return NextResponse.json({
      maintenanceMode: settings['maintenance_mode'] === 'true',
      maintenanceMessage: settings['maintenance_message'] || 'System is currently undergoing maintenance.',
      maintenanceEndTime: settings['maintenance_end_time'] || null,
    });
    
  } catch (error) {
    console.error('Error updating maintenance settings:', error);
    return NextResponse.json(
      { error: 'Failed to update maintenance settings' },
      { status: 500 }
    );
  }
} 