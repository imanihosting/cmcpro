import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  // Function to check maintenance mode status
  const checkMaintenanceMode = async (): Promise<boolean> => {
    try {
      console.log('Checking maintenance mode status...');
      const response = await fetch('/api/system/maintenance');
      if (!response.ok) {
        console.error('Maintenance API error:', response.status, response.statusText);
        throw new Error('Failed to fetch maintenance status');
      }

      const data = await response.json();
      console.log('Maintenance mode data:', data);
      
      const isInMaintenance = data.maintenanceMode === true;
      
      setMaintenanceState({
        isInMaintenance,
        maintenanceMessage: data.maintenanceMessage || 'System is currently undergoing maintenance.',
        maintenanceEndTime: data.maintenanceEndTime,
        isLoading: false,
      });

      console.log('Maintenance mode active:', isInMaintenance);
      console.log('Current user is admin:', isAdmin);
      console.log('Current path:', pathname);

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
          console.log('Redirecting non-admin user to maintenance page from:', currentPath);
          router.push('/maintenance');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      setMaintenanceState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  // Check maintenance mode on initial load and when pathname changes
  useEffect(() => {
    // Only check maintenance mode if session loading is complete
    if (sessionStatus !== 'loading') {
      console.log('Session status changed to:', sessionStatus);
      checkMaintenanceMode();
    }
  }, [sessionStatus, pathname, isAdmin]); // Re-run if session status, pathname, or admin status changes
  
  // Also check periodically (every 1 minute)
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('Periodic maintenance check');
      checkMaintenanceMode();
    }, 60 * 1000);
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