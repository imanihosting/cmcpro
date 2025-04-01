import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface MaintenanceContextType {
  isInMaintenance: boolean;
  maintenanceMessage: string;
  maintenanceEndTime: string | null;
  isLoading: boolean;
  checkMaintenanceMode: () => Promise<boolean>;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  isInMaintenance: false,
  maintenanceMessage: '',
  maintenanceEndTime: null,
  isLoading: true,
  checkMaintenanceMode: async () => false,
});

export const useMaintenanceMode = () => useContext(MaintenanceContext);

interface MaintenanceProviderProps {
  children: ReactNode;
}

// Environment check - only log in development
const isDev = process.env.NODE_ENV === 'development';

// Safer console log that only runs in development
const safeConsoleLog = (message: string, ...args: any[]) => {
  if (isDev && false) { // Set to false to disable all logs
    console.log(message, ...args);
  }
};

export const MaintenanceProvider: React.FC<MaintenanceProviderProps> = ({ children }) => {
  const [maintenanceState, setMaintenanceState] = useState<Omit<MaintenanceContextType, 'checkMaintenanceMode'>>({
    isInMaintenance: false,
    maintenanceMessage: '',
    maintenanceEndTime: null,
    isLoading: true,
  });
  
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  
  // Add a ref to track if maintenance has been checked
  const maintenanceChecked = useRef(false);
  // Track last check time
  const lastCheckTime = useRef(0);

  // Function to check maintenance mode status
  const checkMaintenanceMode = async (): Promise<boolean> => {
    // Throttle checks to prevent excessive API calls
    const now = Date.now();
    if (now - lastCheckTime.current < 15000) { // 15 second throttle
      safeConsoleLog('Maintenance check throttled');
      return false;
    }
    lastCheckTime.current = now;
    
    try {
      safeConsoleLog('Checking maintenance mode status...');
      const response = await fetch('/api/system/maintenance');
      if (!response.ok) {
        console.error('Maintenance API error:', response.status, response.statusText);
        throw new Error('Failed to fetch maintenance status');
      }

      const data = await response.json();
      safeConsoleLog('Maintenance mode data:', data);
      
      const isInMaintenance = data.maintenanceMode === true;
      
      setMaintenanceState({
        isInMaintenance,
        maintenanceMessage: data.maintenanceMessage || 'System is currently undergoing maintenance.',
        maintenanceEndTime: data.maintenanceEndTime,
        isLoading: false,
      });

      safeConsoleLog('Maintenance mode active:', isInMaintenance);
      safeConsoleLog('Current user is admin:', isAdmin);
      safeConsoleLog('Current path:', pathname);

      // Handle redirects if in maintenance mode and not admin
      if (
        isInMaintenance && 
        sessionStatus === 'authenticated' && 
        !isAdmin && 
        typeof window !== 'undefined'
      ) {
        // Always allow the maintenance and authentication pages
        const currentPath = pathname || '';
        if (currentPath !== '/maintenance' && 
            !currentPath.startsWith('/auth/') && 
            !currentPath.startsWith('/api/')) {
          safeConsoleLog('Redirecting non-admin user to maintenance page from:', currentPath);
          router.push('/maintenance');
          return true;
        }
      }
      
      maintenanceChecked.current = true;
      return false;
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      setMaintenanceState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  // Check maintenance mode only once on initial load
  useEffect(() => {
    // Only check maintenance mode if session loading is complete and we haven't checked yet
    if (sessionStatus !== 'loading' && !maintenanceChecked.current) {
      safeConsoleLog('Initial maintenance check');
      checkMaintenanceMode();
    }
  }, [sessionStatus]); // Only depend on sessionStatus
  
  // Check periodically but very infrequently (10 minutes)
  useEffect(() => {
    const intervalId = setInterval(() => {
      safeConsoleLog('Periodic maintenance check');
      checkMaintenanceMode();
    }, 10 * 60 * 1000); // Check every 10 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <MaintenanceContext.Provider value={{
      ...maintenanceState,
      checkMaintenanceMode
    }}>
      {children}
    </MaintenanceContext.Provider>
  );
}; 