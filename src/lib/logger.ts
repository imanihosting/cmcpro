import { SystemLog_level, SystemLog_type } from '@prisma/client';
import prisma from '@/lib/prisma';

/**
 * Simple logger that logs to console and optionally to database
 */
class Logger {
  // Console logging
  debug(message: string, details?: any) {
    console.debug(`[DEBUG] ${message}`, details || '');
    return this;
  }

  info(message: string, details?: any) {
    console.info(`[INFO] ${message}`, details || '');
    return this;
  }

  warning(message: string, details?: any) {
    console.warn(`[WARNING] ${message}`, details || '');
    return this;
  }

  error(message: string, details?: any) {
    console.error(`[ERROR] ${message}`, details);
    
    // If details is an Error, format it nicely
    let detailsStr = details;
    if (details instanceof Error) {
      detailsStr = `${details.message}\n${details.stack || ''}`;
    } else if (typeof details === 'object') {
      try {
        detailsStr = JSON.stringify(details, null, 2);
      } catch (e) {
        detailsStr = String(details);
      }
    }
    
    // Log to database if possible
    try {
      prisma.systemLog.create({
        data: {
          id: crypto.randomUUID(),
          level: SystemLog_level.ERROR,
          type: SystemLog_type.ERROR,
          message,
          details: detailsStr,
          timestamp: new Date(),
        }
      }).catch(e => console.error('Failed to write to system log:', e));
    } catch (e) {
      console.error('Failed to create system log:', e);
    }
    
    return this;
  }

  critical(message: string, details?: any) {
    console.error(`[CRITICAL] ${message}`, details || '');
    
    // Always try to log critical errors to database
    try {
      prisma.systemLog.create({
        data: {
          id: crypto.randomUUID(),
          level: SystemLog_level.CRITICAL,
          type: SystemLog_type.ERROR,
          message,
          details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
          timestamp: new Date(),
        }
      }).catch(e => console.error('Failed to write to system log:', e));
    } catch (e) {
      console.error('Failed to create system log:', e);
    }
    
    return this;
  }
}

export const logger = new Logger(); 