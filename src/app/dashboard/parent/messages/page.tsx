"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaUserCircle, FaSearch, FaEllipsisH, FaPaperPlane, FaArrowLeft } from "react-icons/fa";
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  name: string;
  image?: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string | Date;
  read: boolean;
  sender: {
    id: string;
    name: string;
    image?: string;
    isCurrentUser: boolean;
  };
}

interface Conversation {
  id: string;
  partnerId: string;
  participant: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  createdAt: Date;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const initialConversationId = searchParams ? searchParams.get('conversation') : null;
  
  const [activeConversation, setActiveConversation] = useState<string | null>(initialConversationId);
  const [showListMobile, setShowListMobile] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesPagination, setMessagesPagination] = useState<PaginationInfo | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);
  const router = useRouter();
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => 
    searchQuery === '' || 
    conversation.participant.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setConversationsLoading(true);
      const response = await fetch('/api/dashboard/parent/messages');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      
      const data = await response.json();
      setConversations(data.conversations || []);
      
      // If we have an initial conversation ID from URL and no active conversation,
      // set it as active
      if (data.conversations.length > 0) {
        if (initialConversationId && !activeConversation) {
          setActiveConversation(initialConversationId);
        } else if (!activeConversation) {
          // Otherwise select the first conversation if none is active
          setActiveConversation(data.conversations[0].partnerId);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setConversationsLoading(false);
    }
  }, [activeConversation, initialConversationId]);
  
  // Fetch messages for the active conversation
  const fetchMessages = useCallback(async (partnerId: string, page = 1) => {
    if (!partnerId) return;
    
    try {
      setMessagesLoading(true);
      const response = await fetch(`/api/dashboard/parent/messages/conversation?id=${partnerId}&page=${page}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data.messages || []);
      setPartner(data.partner || null);
      setMessagesPagination(data.pagination || null);
      
      // Update unread count in conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.partnerId === partnerId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  }, []);
  
  // Send a new message
  const sendMessage = async () => {
    if (!activeConversation || !newMessage.trim() || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      
      // Optimistic UI update
      const optimisticId = uuidv4();
      const optimisticMessage: Message = {
        id: optimisticId,
        content: newMessage,
        createdAt: new Date(),
        read: true,
        sender: {
          id: 'currentUser', // Will be replaced with actual ID from response
          name: 'You',
          isCurrentUser: true
        }
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      
      // Scroll to bottom immediately
      scrollToBottom();
      
      // Send the actual request
      const response = await fetch('/api/dashboard/parent/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activeConversation,
          content: newMessage.trim()
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      // Replace optimistic message with actual response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticId ? data.message : msg
        )
      );
      
      // Update conversation list
      await fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== 'temp'));
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Format timestamp for display
  const formatMessageTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date >= today) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date >= yesterday) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  // Handle selecting a conversation
  const handleSelectConversation = (partnerId: string) => {
    if (partnerId === activeConversation) return;
    
    // Close existing SSE connection
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    
    setActiveConversation(partnerId);
    setShowListMobile(false);
    
    // Update the URL with the conversation ID without reloading the page
    const newUrl = `/dashboard/parent/messages?conversation=${partnerId}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    fetchMessages(partnerId);
  };
  
  // Handle back button on mobile
  const handleBackToList = () => {
    setShowListMobile(true);
  };
  
  // Scroll to the bottom of the messages
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Setup SSE for real-time updates
  const setupSSE = useCallback((partnerId?: string) => {
    // Close any existing connection
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    
    // Create new SSE connection
    const url = partnerId 
      ? `/api/messages/sse?partnerId=${partnerId}` 
      : '/api/messages/sse';
      
    const eventSource = new EventSource(url);
    sseRef.current = eventSource;
    
    // Connected event
    eventSource.addEventListener('connected', (e) => {
      console.log('SSE Connected');
    });
    
    // New message event
    eventSource.addEventListener('new-message', (e) => {
      try {
        const data = JSON.parse(e.data);
        
        // If we're viewing the conversation this message belongs to, add it
        if (data.sender.id === activeConversation || data.sender.isCurrentUser) {
          setMessages(prev => {
            // Check if we already have this message (avoid duplicates)
            const exists = prev.some(msg => msg.id === data.id);
            if (exists) return prev;
            return [...prev, data];
          });
          
          // Scroll to bottom on new message
          setTimeout(scrollToBottom, 100);
        }
        
        // Refresh conversations to update the latest message
        fetchConversations();
      } catch (error) {
        console.error('Error processing SSE message event:', error);
      }
    });
    
    // Error handling
    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      sseRef.current = null;
      
      // Try to reconnect after a delay
      setTimeout(() => {
        if (activeConversation) {
          setupSSE(activeConversation);
        }
      }, 5000);
    };
    
    return eventSource;
  }, [activeConversation, fetchConversations]);
  
  // Initial load
  useEffect(() => {
    fetchConversations();
    
    // Setup SSE for general updates
    const eventSource = setupSSE();
    
    // Cleanup
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [setupSSE, fetchConversations]);
  
  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
      
      // Setup focused SSE for this conversation
      setupSSE(activeConversation);
    }
  }, [activeConversation, fetchMessages, setupSSE]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col bg-white ${ 
        showListMobile ? 'flex' : 'hidden md:flex' 
      }`}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          
          <div className="mt-3 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search messages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="flex items-center justify-center h-20">
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4">
              <p className="text-gray-500 mb-2">No conversations found</p>
              {searchQuery ? (
                <p className="text-sm text-gray-400">Try a different search term</p>
              ) : (
                <p className="text-sm text-gray-400">Start a conversation with a childminder</p>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div 
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation.partnerId)}
                className={`p-4 border-b border-gray-200 cursor-pointer ${
                  activeConversation === conversation.partnerId ? 'bg-violet-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start">
                  <div className="relative flex-shrink-0">
                    {conversation.avatar ? (
                      <img 
                        src={conversation.avatar} 
                        alt={conversation.participant}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <FaUserCircle className="h-10 w-10 text-gray-400" />
                    )}
                    {conversation.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-xs text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="truncate text-sm font-medium text-gray-900">
                        {conversation.participant}
                      </h3>
                      <p className="text-xs text-gray-500">{conversation.timestamp}</p>
                    </div>
                    <p className={`mt-1 truncate text-sm ${
                      conversation.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-500'
                    }`}>
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-white ${ 
        showListMobile ? 'hidden md:flex' : 'flex' 
      }`}>
        {activeConversation !== null && partner !== null ? (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
               <div className="flex items-center flex-1 min-w-0">
                 <button
                  onClick={handleBackToList}
                  className="md:hidden p-2 -ml-2 mr-2 rounded-full hover:bg-gray-100"
                  aria-label="Back to conversations"
                >
                  <FaArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                {partner.image ? (
                  <img 
                    src={partner.image} 
                    alt={partner.name}
                    className="h-8 w-8 rounded-full flex-shrink-0"
                  />
                ) : (
                  <FaUserCircle className="h-8 w-8 text-gray-400 flex-shrink-0" />
                )}
                <h2 className="ml-3 text-lg font-medium text-gray-900 truncate">
                  {partner.name}
                </h2>
              </div>
              <button className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex-shrink-0">
                <FaEllipsisH className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-20">
                  <p className="text-gray-500">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start the conversation</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.sender.isCurrentUser ? 'justify-end' : ''}`}
                  >
                    <div className={`max-w-[75%] rounded-lg px-4 py-2 ${
                      message.sender.isCurrentUser 
                        ? 'bg-violet-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`mt-1 text-right text-xs ${
                        message.sender.isCurrentUser ? 'text-violet-200' : 'text-gray-500'
                      }`}>
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messageEndRef} />
            </div>
            
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center relative">
                <textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 max-h-32"
                  rows={1}
                />
                <button 
                  className="absolute right-3 rounded-full p-1 text-violet-600 hover:text-violet-700"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  <FaPaperPlane className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center"> 
            <p className="text-gray-500"> 
              {conversationsLoading 
                ? "Loading conversations..." 
                : conversations.length === 0 
                  ? "You have no messages yet" 
                  : "Select a conversation to start messaging"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 