import React from 'react';

export default function LoadingState() {
  // Generate multiple loading skeletons
  const renderSkeletons = () => {
    return Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="rounded-lg bg-white p-4 shadow-sm animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          <div className="mb-2 sm:mb-0 flex-grow">
            <div className="flex items-center gap-2 mb-2">
              {/* Avatar skeleton */}
              <div className="h-8 w-8 rounded-full bg-gray-300"></div>
              {/* Name skeleton */}
              <div className="h-5 w-40 rounded bg-gray-300"></div>
            </div>
            
            {/* Status badge skeleton */}
            <div className="h-5 w-20 rounded-full bg-gray-300"></div>
            
            <div className="mt-3 space-y-2">
              {/* Line 1 skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-gray-300"></div>
                <div className="h-4 w-32 rounded bg-gray-300"></div>
              </div>
              
              {/* Line 2 skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-gray-300"></div>
                <div className="h-4 w-24 rounded bg-gray-300"></div>
              </div>
              
              {/* Line 3 skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-gray-300"></div>
                <div className="h-4 w-48 rounded bg-gray-300"></div>
              </div>
            </div>
          </div>
          
          {/* Action button skeleton */}
          <div className="hidden sm:flex sm:items-center sm:self-center">
            <div className="rounded-full bg-gray-300 p-2 h-9 w-9"></div>
          </div>
        </div>
      </div>
    ));
  };
  
  return (
    <div className="space-y-4">
      {renderSkeletons()}
    </div>
  );
} 