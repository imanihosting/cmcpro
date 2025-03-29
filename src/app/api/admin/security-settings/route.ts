import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { PrismaClient } from "@prisma/client";

interface SecuritySettingMetadata {
  min?: number;
  max?: number;
  validationError?: string;
  [key: string]: any;
}

interface SecuritySettingData {
  id: string;
  key: string;
  value: string;
  description: string;
  type: string;
  metadata: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Default security settings if none exist in the database
const DEFAULT_SECURITY_SETTINGS: SecuritySettingData[] = [
  {
    id: crypto.randomUUID(),
    key: "passwordMinLength",
    value: "8",
    description: "Minimum password length required for all users",
    type: "number",
    metadata: JSON.stringify({
      min: 8,
      max: 32,
      validationError: "Password length must be between 8 and 32 characters"
    }),
  },
  {
    id: crypto.randomUUID(),
    key: "passwordRequireSpecialChar",
    value: "true",
    description: "Require at least one special character in passwords",
    type: "boolean",
    metadata: JSON.stringify({
      validationError: "Password must contain at least one special character"
    }),
  },
  {
    id: crypto.randomUUID(),
    key: "passwordRequireNumber",
    value: "true",
    description: "Require at least one number in passwords",
    type: "boolean",
    metadata: JSON.stringify({
      validationError: "Password must contain at least one number"
    }),
  },
  {
    id: crypto.randomUUID(),
    key: "passwordRequireUppercase",
    value: "true",
    description: "Require at least one uppercase letter in passwords",
    type: "boolean",
    metadata: JSON.stringify({
      validationError: "Password must contain at least one uppercase letter"
    }),
  },
  {
    id: crypto.randomUUID(),
    key: "passwordHistoryCount",
    value: "3",
    description: "Number of previous passwords that cannot be reused",
    type: "number",
    metadata: JSON.stringify({
      min: 0,
      max: 10,
      validationError: "Password history count must be between 0 and 10"
    }),
  },
  {
    id: crypto.randomUUID(),
    key: "sessionTimeoutMinutes",
    value: "60",
    description: "Session timeout in minutes (after which users are automatically logged out)",
    type: "number",
    metadata: JSON.stringify({
      min: 15,
      max: 1440, // 24 hours
      validationError: "Session timeout must be between 15 minutes and 24 hours"
    }),
  },
  {
    id: crypto.randomUUID(),
    key: "loginMaxAttempts",
    value: "5",
    description: "Maximum number of failed login attempts before account lockout",
    type: "number",
    metadata: JSON.stringify({
      min: 3,
      max: 10,
      validationError: "Max login attempts must be between 3 and 10"
    }),
  },
  {
    id: crypto.randomUUID(),
    key: "loginLockoutMinutes",
    value: "15",
    description: "Account lockout duration in minutes after exceeding max failed attempts",
    type: "number",
    metadata: JSON.stringify({
      min: 5,
      max: 60,
      validationError: "Lockout duration must be between 5 and 60 minutes"
    }),
  },
  {
    id: crypto.randomUUID(),
    key: "mfaRequiredForAdmin",
    value: "true",
    description: "Require multi-factor authentication for admin users",
    type: "boolean",
    metadata: null,
  },
  {
    id: crypto.randomUUID(),
    key: "rateLimitPerMinute",
    value: "100",
    description: "Maximum number of API requests allowed per user per minute",
    type: "number",
    metadata: JSON.stringify({
      min: 10,
      max: 1000,
      validationError: "Rate limit must be between 10 and 1000 requests per minute"
    }),
  },
  {
    id: crypto.randomUUID(),
    key: "allowedCorsOrigins",
    value: "*",
    description: "Comma-separated list of allowed origins for CORS (or * for all)",
    type: "string",
    metadata: null,
  }
];

// Use the global settings store as a fallback until the SecuritySetting model is available
async function fetchSecuritySettings(): Promise<SecuritySettingData[]> {
  try {
    // Try to use the SecuritySetting model if it's available
    // @ts-ignore - The table may not exist yet if migrations haven't been run
    const count = await prisma.securitySetting.count().catch(() => 0);
    
    if (count > 0) {
      // If we have security settings in the database, use them
      // @ts-ignore - The table may not exist yet if migrations haven't been run
      return await prisma.securitySetting.findMany({
        orderBy: { key: 'asc' }
      });
    }
    
    // If there are no settings in the database or the model is not available yet,
    // try to store them in the global settings table
    const globalSettings = await prisma.settings.findFirst({
      where: { id: 'security-settings' }
    });
    
    if (globalSettings) {
      // Parse the settings from the global settings store
      return JSON.parse(globalSettings.data as string);
    }
    
    // If no settings exist anywhere, create them in the global settings table
    await prisma.settings.create({
      data: {
        id: 'security-settings',
        data: JSON.stringify(DEFAULT_SECURITY_SETTINGS),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return DEFAULT_SECURITY_SETTINGS;
  } catch (error) {
    logger.error("Error fetching security settings:", error);
    // Return default settings as a fallback
    return DEFAULT_SECURITY_SETTINGS;
  }
}

// Save security settings to the global settings store
async function saveSecuritySettings(updatedSettings: SecuritySettingData[]): Promise<void> {
  try {
    // Try to use the SecuritySetting model if it's available
    const securitySettingExists = await prisma.$queryRaw`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = database() 
      AND table_name = 'SecuritySetting'
    `.catch(() => []);
    
    if (Array.isArray(securitySettingExists) && securitySettingExists.length > 0) {
      // Table exists, we can use the model
      for (const setting of updatedSettings) {
        // @ts-ignore - The table may not exist yet if migrations haven't been run
        await prisma.securitySetting.upsert({
          where: { key: setting.key },
          update: { 
            value: setting.value,
            updatedAt: new Date()
          },
          create: setting
        });
      }
    } else {
      // Otherwise, use the global settings table
      const allSettings = await fetchSecuritySettings();
      
      // Update the settings that were changed
      const updatedMap = new Map(updatedSettings.map(s => [s.key, s]));
      const newSettings = allSettings.map(setting => {
        if (updatedMap.has(setting.key)) {
          return {
            ...setting,
            value: updatedMap.get(setting.key)!.value,
            updatedAt: new Date()
          };
        }
        return setting;
      });
      
      // Save back to the global settings table
      await prisma.settings.update({
        where: { id: 'security-settings' },
        data: {
          data: JSON.stringify(newSettings),
          updatedAt: new Date()
        }
      });
    }
  } catch (error) {
    logger.error("Error saving security settings:", error);
    throw error;
  }
}

// GET /api/admin/security-settings - Get all security settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Ensure the user is an admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Fetch security settings
    const securitySettings = await fetchSecuritySettings();

    // Process metadata for client
    const formattedSettings = securitySettings.map((setting: SecuritySettingData) => ({
      ...setting,
      metadata: setting.metadata ? 
        (typeof setting.metadata === 'string' ? 
          JSON.parse(setting.metadata) : 
          setting.metadata
        ) : 
        null
    }));

    return NextResponse.json(formattedSettings);
  } catch (error) {
    logger.error("Error in GET /api/admin/security-settings:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/security-settings - Update security settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Ensure the user is an admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const data = await req.json();
    
    // Validation
    if (!data || !Array.isArray(data.settings)) {
      return NextResponse.json(
        { error: "Invalid request - settings array required" },
        { status: 400 }
      );
    }
    
    const { settings } = data;
    const updateResults: any[] = [];
    const errors: string[] = [];
    
    // Get existing settings for validation and comparison
    const existingSettings = await fetchSecuritySettings();
    const existingSettingsMap = new Map(
      existingSettings.map((setting: SecuritySettingData) => [setting.key, setting])
    );
    
    // Prepare settings to update
    const settingsToUpdate: SecuritySettingData[] = [];
    
    // Process each setting update
    for (const update of settings) {
      try {
        const { key, value } = update;
        
        if (!key || value === undefined) {
          errors.push(`Invalid setting update: missing key or value for ${JSON.stringify(update)}`);
          continue;
        }
        
        // Find the existing setting
        const existingSetting = existingSettingsMap.get(key);
        
        if (!existingSetting) {
          errors.push(`Setting with key "${key}" not found`);
          continue;
        }
        
        // Validate the new value based on type and constraints
        const metadata: SecuritySettingMetadata | null = existingSetting.metadata ? 
          (typeof existingSetting.metadata === 'string' ? 
            JSON.parse(existingSetting.metadata) : 
            existingSetting.metadata
          ) : 
          null;
        
        let validationError = null;
        
        switch (existingSetting.type) {
          case 'number':
            const numValue = Number(value);
            if (isNaN(numValue)) {
              validationError = `Value for "${key}" must be a number`;
            } else if (metadata && metadata.min !== undefined && numValue < metadata.min) {
              validationError = metadata.validationError || `Value must be at least ${metadata.min}`;
            } else if (metadata && metadata.max !== undefined && numValue > metadata.max) {
              validationError = metadata.validationError || `Value must be no more than ${metadata.max}`;
            }
            break;
            
          case 'boolean':
            if (value !== 'true' && value !== 'false') {
              validationError = `Value for "${key}" must be true or false`;
            }
            break;
        }
        
        if (validationError) {
          errors.push(validationError);
          continue;
        }
        
        // Add to the list of settings to update
        settingsToUpdate.push({
          ...existingSetting,
          value
        });
        
        updateResults.push({
          key,
          oldValue: existingSetting.value,
          newValue: value,
          updated: true
        });
        
        // Log the change for audit purposes
        await prisma.systemLog.create({
          data: {
            id: crypto.randomUUID(),
            type: 'SECURITY',
            level: 'INFO',
            message: `Security setting "${key}" updated`,
            details: `Changed from "${existingSetting.value}" to "${value}"`,
            source: 'security-settings-api',
            userId,
            timestamp: new Date(),
          }
        });
        
        // Create security event
        await prisma.securityEvent.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            type: "SECURITY_SETTING_CHANGE",
            ipAddress: req.headers.get("x-forwarded-for") || "unknown",
            description: `Security setting "${key}" changed from "${existingSetting.value}" to "${value}"`,
            severity: "HIGH",
            status: "COMPLETED",
            timestamp: new Date(),
            updatedAt: new Date(),
          },
        });
        
      } catch (updateError: any) {
        logger.error(`Error updating setting:`, updateError);
        errors.push(`Failed to update setting "${update.key}": ${updateError.message}`);
      }
    }
    
    // Save all the valid settings
    if (settingsToUpdate.length > 0) {
      await saveSecuritySettings(settingsToUpdate);
    }
    
    // Log activity
    await prisma.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: 'SECURITY_SETTINGS_UPDATE',
        details: `Updated ${updateResults.length} security settings`,
        timestamp: new Date(),
      },
    });
    
    return NextResponse.json({
      updated: updateResults,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0 
        ? "⚠️ Some settings were updated but there were validation errors" 
        : "✅ Security settings updated successfully"
    });
    
  } catch (error) {
    logger.error("Error in PUT /api/admin/security-settings:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 