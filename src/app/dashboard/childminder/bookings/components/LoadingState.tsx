export default function LoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row animate-pulse">
            {/* Status & Date */}
            <div className="mb-3 sm:mb-0 sm:w-1/4">
              <div className="h-5 w-20 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
            
            {/* Parent Info */}
            <div className="mb-3 sm:mb-0 sm:w-1/4">
              <div className="h-4 w-16 bg-gray-200 rounded mb-3"></div>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-200 mr-2"></div>
                <div>
                  <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
            
            {/* Children */}
            <div className="mb-3 sm:mb-0 sm:w-1/4">
              <div className="h-4 w-16 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
            
            {/* Duration */}
            <div className="sm:w-1/4">
              <div className="h-4 w-16 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 w-12 bg-gray-200 rounded mb-3"></div>
              <div className="h-5 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 