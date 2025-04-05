'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

// Component that safely uses the hook inside Suspense
function SearchParamsWatcher({ onParamsChange }: { 
  onParamsChange: (params: ReturnType<typeof useSearchParams>) => void 
}) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (searchParams) {
      onParamsChange(searchParams);
    }
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

  // Memoize the callback to prevent it from changing on each render
  const handleSearchParamsChange = useCallback((newParams: ReturnType<typeof useSearchParams>) => {
    setParams(prevParams => {
      // Only update if the params have actually changed and are not null
      if (!prevParams || (newParams && newParams.toString() !== prevParams.toString())) {
        return newParams;
      }
      return prevParams;
    });
  }, []);

  // Memoize the component to prevent unnecessary re-renders
  const SearchParamsListener = useCallback(() => (
    <Suspense fallback={null}>
      <SearchParamsWatcher onParamsChange={handleSearchParamsChange} />
    </Suspense>
  ), [handleSearchParamsChange]);

  return {
    searchParams: params,
    SearchParamsListener
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