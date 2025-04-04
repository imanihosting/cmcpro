'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// Component that safely uses the hook inside Suspense
function SearchParamsWatcher({ onParamsChange }: { 
  onParamsChange: (params: ReturnType<typeof useSearchParams>) => void 
}) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    onParamsChange(searchParams);
  }, [searchParams, onParamsChange]);
  
  return null;
}

/**
 * A hook that safely wraps useSearchParams in a Suspense boundary
 * to prevent "useSearchParams() should be wrapped in a suspense boundary" errors
 * when used during static generation.
 * 
 * @returns The search params or null if not available yet
 */
export function useSafeSearchParams() {
  const [params, setParams] = useState<ReturnType<typeof useSearchParams> | null>(null);

  const handleSearchParamsChange = (newParams: ReturnType<typeof useSearchParams>) => {
    setParams(newParams);
  };

  return {
    searchParams: params,
    SearchParamsListener: () => (
      <Suspense fallback={null}>
        <SearchParamsWatcher onParamsChange={handleSearchParamsChange} />
      </Suspense>
    )
  };
}

/**
 * A component that wraps children with a Suspense boundary for search params
 * and passes the search params to the children as a prop
 */
export function WithSearchParams<T extends object>({
  children,
}: {
  children: (props: { searchParams: ReturnType<typeof useSearchParams> | null }) => React.ReactNode;
}) {
  const { searchParams, SearchParamsListener } = useSafeSearchParams();
  
  return (
    <>
      <SearchParamsListener />
      {children({ searchParams })}
    </>
  );
} 