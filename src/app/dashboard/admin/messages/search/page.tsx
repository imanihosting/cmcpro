'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import debounce from 'lodash/debounce';
import { FaSearch, FaTimes, FaChevronLeft, FaChevronRight, FaSpinner, FaArrowLeft } from 'react-icons/fa';

// Define types
interface SearchResult {
  id: string;
  content: string;
  highlightedContent: string;
  createdAt: string;
  read: boolean;
  conversationId: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  receiver: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface SearchResponse {
  query: string;
  messages: SearchResult[];
  pagination: Pagination;
}

// Main component
export default function AdminMessagesSearch() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get search query from URL
  const initialQuery = searchParams ? searchParams.get('q') || '' : '';
  
  // State for search results
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [inputQuery, setInputQuery] = useState<string>(initialQuery);
  
  // State for pagination
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  });
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search debounce
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim().length >= 3) {
        setSearchQuery(query);
        // Update URL with search query
        const url = new URL(window.location.href);
        url.searchParams.set('q', query);
        window.history.pushState({}, '', url);
        fetchSearchResults(query);
      }
    }, 500),
    []
  );
  
  // Fetch search results
  const fetchSearchResults = async (query: string, page = 1) => {
    if (status !== 'authenticated' || session?.user.role !== 'admin') return;
    if (query.trim().length < 3) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      
      const response = await fetch(`/api/admin/messages/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error searching messages: ${response.statusText}`);
      }
      
      const data: SearchResponse = await response.json();
      setSearchResults(data.messages);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search messages');
      console.error('Error searching messages:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputQuery(value);
    debouncedSearch(value);
  };
  
  // Handle search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim().length >= 3) {
      setSearchQuery(inputQuery);
      fetchSearchResults(inputQuery);
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      fetchSearchResults(searchQuery, newPage);
    }
  };
  
  // Initial fetch on mount
  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'admin' && initialQuery.trim().length >= 3) {
      fetchSearchResults(initialQuery);
    }
  }, [status, session, initialQuery]);
  
  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    
    if (status === 'authenticated' && session.user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);
  
  // Format date for display
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  };
  
  // Handle view conversation click
  const handleViewConversation = (conversationId: string) => {
    router.push(`/dashboard/admin/messages?conversation=${conversationId}`);
  };
  
  // Render loading state
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }
  
  // Render main content
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/dashboard/admin/messages')}
            className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100"
          >
            <FaArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Search Messages</h1>
        </div>
      </div>
      
      {/* Search form */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit}>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search message content..."
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4"
                value={inputQuery}
                onChange={handleSearchChange}
                minLength={3}
                required
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FaSearch className="h-5 w-5" />
              </div>
              {inputQuery && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                  onClick={() => setInputQuery('')}
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              disabled={inputQuery.trim().length < 3}
            >
              Search
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Enter at least 3 characters to search through message content
          </p>
        </form>
      </div>
      
      {/* Search Results */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Results {searchQuery ? `for "${searchQuery}"` : ''} {pagination.total > 0 ? `(${pagination.total})` : ''}
          </h2>
        </div>
        
        {error && (
          <div className="p-4 text-center text-red-600">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <FaSpinner className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchQuery ? 'No results found for your search.' : 'Enter a search term to find messages.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {searchResults.map((result) => (
              <div key={result.id} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200">
                        {result.sender.avatar ? (
                          <img
                            src={result.sender.avatar}
                            alt={result.sender.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-600">
                            {result.sender.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="ml-2 font-medium text-gray-900">
                        {result.sender.name}
                      </span>
                      <span className="ml-1 text-xs text-gray-500">
                        ({result.sender.role})
                      </span>
                    </div>
                    <span className="mx-2 text-gray-400">→</span>
                    <div className="flex items-center">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200">
                        {result.receiver.avatar ? (
                          <img
                            src={result.receiver.avatar}
                            alt={result.receiver.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-600">
                            {result.receiver.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="ml-2 font-medium text-gray-900">
                        {result.receiver.name}
                      </span>
                      <span className="ml-1 text-xs text-gray-500">
                        ({result.receiver.role})
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatMessageDate(result.createdAt)}
                  </div>
                </div>
                <div 
                  className="mb-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-800"
                  dangerouslySetInnerHTML={{ __html: result.highlightedContent }}
                />
                <div className="text-right">
                  <button
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    onClick={() => handleViewConversation(result.conversationId)}
                  >
                    View Conversation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center border-t border-gray-200 px-4 py-3">
            <nav className="flex items-center justify-between space-x-2">
              <button
                className="rounded-md p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <FaChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="rounded-md p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                <FaChevronRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
} 