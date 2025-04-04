'use client';

import { useSession } from 'next-auth/react';
import { useRouter,  } from 'next/navigation';
import { Suspense,  useEffect, useState, useCallback, useMemo  } from 'react';
import { format } from 'date-fns';
import debounce from 'lodash/debounce';
import { FaSearch, FaFilter, FaSort, FaTimes, FaChevronLeft, FaChevronRight, FaDownload, FaSpinner } from 'react-icons/fa';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';

// Define types
interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage: string;
  previewText: string;
  lastMessageTime: string;
  formattedTime: string;
  messageCount: number;
  createdAt: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  read: boolean;
  sender: {
    id: string;
    name: string;
    email?: string;
    image?: string;
    role: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface ConversationResponse {
  conversationId: string;
  participants: Participant[];
  metadata: {
    createdAt: string | null;
    messageCount: number;
  };
  messages: Message[];
  pagination: Pagination;
}

interface ConversationsResponse {
  conversations: Conversation[];
  pagination: Pagination;
}

// Main component
function AdminMessagesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { searchParams, SearchParamsListener } = useSafeSearchParams();
  
  // State for conversations list
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    searchParams ? searchParams.get('conversation') : null
  );
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [conversationDetails, setConversationDetails] = useState<{
    id: string;
    participants: Participant[];
    metadata: { createdAt: string | null; messageCount: number };
  } | null>(null);
  
  // State for pagination
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  });
  const [messagePagination, setMessagePagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 50,
    pages: 0
  });
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'lastMessageTime' | 'creationDate'>('lastMessageTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Handle search debounce
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      fetchConversations(1, value);
    }, 500),
    []
  );
  
  // Fetch conversations with filters
  const fetchConversations = async (page = 1, userSearch = searchTerm) => {
    if (status !== 'authenticated' || session?.user.role !== 'admin') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      
      if (userSearch) params.append('user', userSearch);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const response = await fetch(`/api/admin/messages?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching conversations: ${response.statusText}`);
      }
      
      const data: ConversationsResponse = await response.json();
      setConversations(data.conversations);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch messages for a conversation
  const fetchConversationMessages = async (conversationId: string, page = 1) => {
    if (status !== 'authenticated' || session?.user.role !== 'admin') return;
    
    setIsMessageLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('id', conversationId);
      params.append('page', page.toString());
      params.append('limit', messagePagination.limit.toString());
      
      const response = await fetch(`/api/admin/messages/conversation?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching messages: ${response.statusText}`);
      }
      
      const data: ConversationResponse = await response.json();
      setConversationMessages(data.messages);
      setConversationDetails({
        id: data.conversationId,
        participants: data.participants,
        metadata: data.metadata
      });
      setMessagePagination(data.pagination);
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
    } finally {
      setIsMessageLoading(false);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };
  
  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    fetchConversationMessages(conversationId);
  };
  
  // Handle conversation pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      fetchConversations(newPage);
    }
  };
  
  // Handle message pagination
  const handleMessagePageChange = (newPage: number) => {
    if (selectedConversation && newPage > 0 && newPage <= messagePagination.pages) {
      fetchConversationMessages(selectedConversation, newPage);
    }
  };
  
  // Handle filter and sort changes
  const handleFilterChange = () => {
    fetchConversations(1);
  };
  
  // Initial fetch on mount
  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'admin') {
      fetchConversations();
      
      // If there's a conversation ID in the URL, load its messages
      const conversationId = searchParams?.get('conversation');
      if (conversationId) {
        fetchConversationMessages(conversationId);
      }
    }
  }, [status, session, searchParams]);
  
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
  
  // Generate conversation title
  const getConversationTitle = useCallback((conversation: Conversation) => {
    return conversation.participants.map(p => p.name).join(' & ');
  }, []);
  
  // Render loading state
  if (status === 'loading') {
    return (
      <div>
        <SearchParamsListener />
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  // Render main content
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Message Monitoring</h1>
        <button
          onClick={() => router.push('/dashboard/admin/messages/search')}
          className="mt-2 flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:mt-0"
        >
          <FaSearch className="mr-2 h-4 w-4" />
          Advanced Search
        </button>
      </div>
      
      {/* Main content wrapper - mobile responsive layout */}
      <div className="flex flex-col lg:flex-row lg:space-x-6">
        {/* Left side - Conversation List */}
        <div className={`mb-6 w-full ${selectedConversation ? 'lg:block' : ''} lg:mb-0 lg:w-1/3`}>
          {/* Filters and Search */}
          <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by user name or email..."
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <FaSearch className="h-4 w-4" />
                </div>
                {searchTerm && (
                  <button
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                    onClick={() => {
                      setSearchTerm('');
                      fetchConversations(1, '');
                    }}
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Sort By
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'lastMessageTime' | 'creationDate')}
                >
                  <option value="lastMessageTime">Last Message Time</option>
                  <option value="creationDate">Creation Date</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Order
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
            
            <button
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              onClick={handleFilterChange}
            >
              Apply Filters
            </button>
          </div>
          
          {/* Conversation List */}
          <div className="rounded-lg bg-white shadow-sm">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Conversations ({pagination.total})
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
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No conversations found
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      className={`w-full p-4 text-left transition-colors hover:bg-gray-50 ${
                        selectedConversation === conversation.id ? 'bg-indigo-50' : ''
                      }`}
                      onClick={() => handleSelectConversation(conversation.id)}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {getConversationTitle(conversation)}
                          </h3>
                          <p className="mt-1 text-xs text-gray-600">
                            {conversation.participants.map(p => `${p.name} (${p.role})`).join(' & ')}
                          </p>
                          <p className="mt-1 text-sm text-gray-800 line-clamp-1">
                            {conversation.previewText}
                          </p>
                        </div>
                        <div className="ml-2 text-right">
                          <span className="text-xs text-gray-500">
                            {conversation.formattedTime}
                          </span>
                          <div className="mt-1 text-xs text-gray-500">
                            {conversation.messageCount} messages
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            
            {/* Pagination for conversation list */}
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
        
        {/* Right side - Message Viewer */}
        <div className={`w-full ${!selectedConversation ? 'hidden lg:block' : ''} lg:w-2/3`}>
          {selectedConversation ? (
            <div className="rounded-lg bg-white shadow-sm">
              {/* Conversation header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <div className="flex items-center">
                  <button
                    className="mr-3 rounded-full p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <FaChevronLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {conversationDetails?.participants.map(p => p.name).join(' & ')}
                    </h2>
                    <div className="text-xs text-gray-600">
                      Started: {conversationDetails?.metadata.createdAt 
                        ? formatMessageDate(conversationDetails.metadata.createdAt) 
                        : 'Unknown'}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  {conversationDetails?.metadata.messageCount} messages
                </div>
              </div>
              
              {/* Messages container */}
              <div className="h-[500px] overflow-y-auto p-4">
                {isMessageLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <FaSpinner className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : conversationMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No messages found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationMessages.map((message) => {
                      const participant = conversationDetails?.participants.find(
                        (p) => p.id === message.sender.id
                      );
                      
                      return (
                        <div key={message.id} className="flex flex-col">
                          <div className="flex items-start">
                            <div className="mr-2 h-8 w-8 overflow-hidden rounded-full bg-gray-200">
                              {participant?.avatar ? (
                                <img
                                  src={participant.avatar}
                                  alt={participant.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-600">
                                  {participant?.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900">
                                  {message.sender.name}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  ({message.sender.role})
                                </span>
                              </div>
                              <div className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
                                {message.content}
                              </div>
                            </div>
                          </div>
                          <div className="ml-10 mt-1 text-xs text-gray-500">
                            {formatMessageDate(message.createdAt)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Pagination for messages */}
              {messagePagination.pages > 1 && (
                <div className="flex items-center justify-center border-t border-gray-200 px-4 py-3">
                  <nav className="flex items-center justify-between space-x-2">
                    <button
                      className="rounded-md p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      onClick={() => handleMessagePageChange(messagePagination.page - 1)}
                      disabled={messagePagination.page === 1}
                    >
                      <FaChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {messagePagination.page} of {messagePagination.pages}
                    </span>
                    <button
                      className="rounded-md p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      onClick={() => handleMessagePageChange(messagePagination.page + 1)}
                      disabled={messagePagination.page === messagePagination.pages}
                    >
                      <FaChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-white p-10 text-center shadow-sm">
              <div>
                <p className="mb-2 text-xl font-semibold text-gray-700">Select a conversation</p>
                <p className="text-gray-500">
                  Choose a conversation from the list to view its messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
export default function AdminMessages() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
    </div>}>
      <AdminMessagesContent />
    </Suspense>
  );
}