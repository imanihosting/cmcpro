import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Create loading context
const LoadingContext = createContext({
  isLoading: false,
  setIsLoading: (loading: boolean) => {}
});

export const useLoading = () => useContext(LoadingContext);

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Effect for navigation changes
  useEffect(() => {
    // When the path or search params change, show loading
    setIsLoading(true);
    
    // Then hide loading after a short delay
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname, searchParams]);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-gradient-to-br from-violet-900/90 via-violet-800/90 to-purple-800/90 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
          <div className="relative flex flex-col items-center">
            {/* App logo - optional */}
            <div className="mb-6 text-center">
              <div className="text-2xl font-bold text-white">
                Childminder<span className="text-violet-300">Connect</span>
              </div>
            </div>
            
            {/* Spinner */}
            <div className="relative">
              <div className="h-24 w-24 animate-spinSlow rounded-full border-b-2 border-t-2 border-violet-300"></div>
              <div className="absolute inset-0 h-16 w-16 m-auto animate-spinReverse rounded-full border-b-2 border-t-2 border-violet-100"></div>
              <div className="absolute inset-0 h-8 w-8 m-auto animate-spin rounded-full border-b-2 border-t-2 border-white" style={{ animationDuration: '0.5s' }}></div>
            </div>
            
            <div className="mt-6 text-center animate-pulse">
              <p className="text-lg font-medium text-white">Loading</p>
              <p className="text-sm text-white/70">Please wait a moment...</p>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
} 