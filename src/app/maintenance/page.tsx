'use client';

import { useEffect, useState } from 'react';
import { FaTools, FaExclamationTriangle, FaHome, FaBaby } from 'react-icons/fa';
import Link from 'next/link';
import { useMaintenanceMode } from '@/lib/MaintenanceContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function MaintenancePage() {
  const { isInMaintenance, maintenanceMessage, maintenanceEndTime, isLoading } = useMaintenanceMode();
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === 'admin';
  
  // Format the maintenance end time for display
  const formattedEndTime = maintenanceEndTime 
    ? new Date(maintenanceEndTime).toLocaleString() 
    : null;
  
  // If user is admin, show option to continue to dashboard or disable maintenance
  useEffect(() => {
    // If maintenance mode is not active or user is not authenticated yet, do nothing
    if (isLoading || !session) return;
    
    // If maintenance mode is off, redirect to home
    if (!isInMaintenance) {
      router.push('/');
      return;
    }
    
    // If user is admin, they can bypass
    if (isAdmin) {
      // Don't automatically redirect admins, let them choose
    }
  }, [isInMaintenance, isAdmin, isLoading, session, router]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin h-10 w-10 text-violet-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-violet-600 p-4 flex justify-center">
          <FaBaby className="h-12 w-12 text-white" />
        </div>
        
        <div className="p-6 text-center">
          <div className="mb-6 flex flex-col items-center">
            <FaTools className="h-14 w-14 text-violet-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">System Maintenance</h1>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                Our site is currently undergoing scheduled maintenance.
              </p>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">
            {maintenanceMessage || 'We are performing scheduled maintenance to improve your experience.'}
          </p>
          
          {formattedEndTime && (
            <p className="text-sm text-gray-500 mb-6">
              Expected to be back online: <strong>{formattedEndTime}</strong>
            </p>
          )}
          
          {isAdmin && (
            <div className="mt-6 flex flex-col space-y-3">
              <Link
                href="/dashboard/admin/maintenance"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700"
              >
                Go to Maintenance Controls
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Continue to Dashboard
              </Link>
            </div>
          )}
          
          {!isAdmin && (
            <Link
              href="/"
              className="inline-flex items-center mt-6 justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700"
            >
              <FaHome className="mr-2" />
              Return to Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 