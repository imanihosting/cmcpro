"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaSearch, FaStar, FaThumbsUp } from "react-icons/fa";
import SearchFiltersComponent from "./components/SearchFilters";
import ChildminderCard from "./components/ChildminderCard";
import Pagination from "./components/Pagination";
import EmptyState from "./components/EmptyState";
import LoadingState from "./components/LoadingState";
import { SearchFilters, SearchResponse, Childminder, Pagination as PaginationType } from "./types";

export default function FindChildminders() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for recommended childminders
  const [recommendedChildminders, setRecommendedChildminders] = useState<Childminder[]>([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(true);
  
  // State for search filters
  const [filters, setFilters] = useState<SearchFilters>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // State for search results
  const [searchResults, setSearchResults] = useState<Childminder[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearched, setIsSearched] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent("/dashboard/parent/find-childminders")}`);
    }
    
    // Redirect if not a parent
    if (status === "authenticated" && session?.user?.role !== "parent") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Initialize filters from URL query parameters
  useEffect(() => {
    if (searchParams) {
      const newFilters: SearchFilters = { ...filters };
      
      // Parse string parameters
      ['location', 'ageGroup', 'language', 'sortBy', 'sortOrder'].forEach(param => {
        const value = searchParams.get(param);
        if (value) {
          (newFilters as any)[param] = value;
        }
      });
      
      // Parse number parameters
      ['page', 'pageSize', 'dayOfWeek', 'minRating', 'minRate', 'maxRate', 'minExperience'].forEach(param => {
        const value = searchParams.get(param);
        if (value && !isNaN(Number(value))) {
          (newFilters as any)[param] = Number(value);
        }
      });
      
      // Parse boolean parameters
      ['firstAidCert', 'childrenFirstCert', 'gardaVetted', 'tuslaRegistered', 'specialNeedsExp', 'mealsProvided', 'pickupDropoff'].forEach(param => {
        const value = searchParams.get(param);
        if (value === 'true') {
          (newFilters as any)[param] = true;
        }
      });
      
      setFilters(newFilters);
      
      // If any filter is set (excluding page, pageSize, sortBy, sortOrder), trigger a search
      const hasFilters = Object.keys(newFilters).some(key => {
        return !['page', 'pageSize', 'sortBy', 'sortOrder'].includes(key) && newFilters[key as keyof SearchFilters] !== undefined;
      });
      
      if (hasFilters) {
        searchChildminders(newFilters);
      }
    }
  }, [searchParams]);

  // Fetch recommended childminders when component mounts
  useEffect(() => {
    const fetchRecommendedChildminders = async () => {
      if (status !== "authenticated") return;
      
      try {
        setIsLoadingRecommended(true);
        const response = await fetch('/api/childminders/recommended');
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommended childminders');
        }
        
        const data = await response.json();
        setRecommendedChildminders(data.data || []);
      } catch (err) {
        console.error('Error fetching recommended childminders:', err);
        // Don't set an error state for recommendations as it's not critical
      } finally {
        setIsLoadingRecommended(false);
      }
    };

    fetchRecommendedChildminders();
  }, [status]);

  // Update URL with current filters
  const updateUrl = useCallback((currentFilters: SearchFilters) => {
    const params = new URLSearchParams();
    
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, String(value));
      }
    });
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
  }, []);

  // Handle filter changes
  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  // Handle search submission
  const handleSearch = () => {
    // Reset to first page when performing a new search
    const searchFilters = { ...filters, page: 1 };
    setFilters(searchFilters);
    searchChildminders(searchFilters);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    searchChildminders(newFilters);
  };

  // Reset all filters
  const handleResetFilters = () => {
    const defaultFilters: SearchFilters = {
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    setFilters(defaultFilters);
    updateUrl(defaultFilters);
    setSearchResults([]);
    setIsSearched(false);
  };

  // Function to search childminders
  const searchChildminders = async (searchFilters: SearchFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query string
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      });
      
      // Update URL
      updateUrl(searchFilters);
      
      // Fetch search results
      const response = await fetch(`/api/childminders/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to search childminders');
      }
      
      const data: SearchResponse = await response.json();
      
      setSearchResults(data.data);
      setPagination(data.pagination);
      setIsSearched(true);
    } catch (err) {
      console.error('Error searching childminders:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Find Childminders</h1>
        <p className="mt-1 text-sm text-gray-600">Search for qualified childminders in your area</p>
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Recommended Childminders Section */}
      {!isSearched && (
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FaThumbsUp className="mr-2 text-violet-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recommended for You</h2>
          </div>
          
          {isLoadingRecommended ? (
            <div className="py-10 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
            </div>
          ) : recommendedChildminders.length > 0 ? (
            <div className="space-y-6">
              {recommendedChildminders.map(childminder => (
                <ChildminderCard 
                  key={childminder.id} 
                  childminder={childminder} 
                  isRecommended={true}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-600">
                We don't have enough information to make personalized recommendations yet.
                Try searching for childminders or complete your profile to get better matches.
              </p>
              <button
                onClick={() => router.push('/dashboard/parent/profile')}
                className="mt-4 inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-800"
              >
                Complete Your Profile
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search filters */}
      <SearchFiltersComponent 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onSearch={handleSearch} 
      />

      {/* Results section */}
      <div>
        {isLoading ? (
          <LoadingState />
        ) : searchResults.length > 0 ? (
          <>
            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600">
              Found {pagination.totalItems} childminder{pagination.totalItems !== 1 ? 's' : ''}
            </div>
            
            {/* Results grid */}
            <div className="space-y-6">
              {searchResults.map(childminder => (
                <ChildminderCard key={childminder.id} childminder={childminder} />
              ))}
            </div>
            
            {/* Pagination */}
            <div className="mt-8">
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            </div>
          </>
        ) : (
          <EmptyState
            isSearched={isSearched}
            message="No childminders found matching your criteria"
            suggestion="Try adjusting your filters or searching for a different location"
            onReset={handleResetFilters}
          />
        )}
      </div>
    </div>
  );
} 