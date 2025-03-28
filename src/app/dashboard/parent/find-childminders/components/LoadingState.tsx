export default function LoadingState() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="p-4">
            <div className="flex items-start space-x-4">
              {/* Image placeholder */}
              <div className="h-20 w-20 flex-shrink-0 animate-pulse rounded-full bg-gray-200"></div>
              
              <div className="flex-1">
                {/* Title placeholder */}
                <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200"></div>
                
                {/* Location placeholder */}
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
                
                {/* Rating placeholder */}
                <div className="mt-2 h-4 w-2/5 animate-pulse rounded bg-gray-200"></div>
                
                {/* Rate placeholder */}
                <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-gray-200"></div>
                
                {/* Availability placeholder */}
                <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>
            
            {/* Bio placeholder */}
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-gray-200"></div>
            <div className="mt-1 h-4 w-11/12 animate-pulse rounded bg-gray-200"></div>
            <div className="mt-1 h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
            
            {/* Additional info placeholder */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
            </div>
            
            {/* Certifications placeholder */}
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200"></div>
              <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200"></div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200"></div>
            </div>
          </div>
          
          {/* Action section placeholder */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex justify-between">
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
              <div className="h-8 w-20 animate-pulse rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 