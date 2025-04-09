"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle, FaSearch, FaEllipsisH, FaPaperPlane, FaArrowLeft, FaTrash, FaTimes, FaEdit, FaHeart, FaFilePdf } from "react-icons/fa";
import { IoMdNotificationsOutline } from "react-icons/io";
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';

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

function ChildminderMessagesPageContent() {
  const { searchParams, SearchParamsListener } = useSafeSearchParams();
  const initialConversationId = searchParams ? searchParams.get('conversation') : null;
  
  const [activeConversation, setActiveConversation] = useState<string | null>(initialConversationId);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesPagination, setMessagesPagination] = useState<PaginationInfo | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConversations, setShowConversations] = useState(!initialConversationId);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  
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
      const response = await fetch('/api/dashboard/childminder/messages');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      
      const data = await response.json();
      
      // Normalize image paths to ensure they work with Next.js unoptimized images
      const normalizedConversations = (data.conversations || []).map((conv: any) => {
        if (conv.avatar && !conv.avatar.startsWith('http')) {
          // Make sure we have a fully qualified URL for relative paths
          conv.avatar = conv.avatar.startsWith('/') 
            ? `${window.location.origin}${conv.avatar}`
            : `${window.location.origin}/${conv.avatar}`;
        }
        return conv;
      });
      
      setConversations(normalizedConversations);
      
      if (normalizedConversations.length > 0) {
        if (initialConversationId && !activeConversation) {
          setActiveConversation(initialConversationId);
        } else if (!activeConversation) {
          setActiveConversation(normalizedConversations[0].partnerId);
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
      const response = await fetch(`/api/dashboard/childminder/messages/conversation?id=${partnerId}&page=${page}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      
      // Normalize message sender images
      const normalizedMessages = (data.messages || []).map((msg: any) => {
        if (msg.sender?.image && !msg.sender.image.startsWith('http')) {
          // Make sure we have a fully qualified URL for relative paths
          msg.sender.image = msg.sender.image.startsWith('/') 
            ? `${window.location.origin}${msg.sender.image}`
            : `${window.location.origin}/${msg.sender.image}`;
        }
        return msg;
      });
      
      setMessages(normalizedMessages);
      
      // Normalize partner image if present
      let normalizedPartner = data.partner;
      if (normalizedPartner?.image && !normalizedPartner.image.startsWith('http')) {
        normalizedPartner.image = normalizedPartner.image.startsWith('/') 
          ? `${window.location.origin}${normalizedPartner.image}`
          : `${window.location.origin}/${normalizedPartner.image}`;
      }
      
      setPartner(normalizedPartner || null);
      setMessagesPagination(data.pagination || null);
      
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
    
    const optimisticId = uuidv4();
    
    try {
      setSendingMessage(true);
      
      // Optimistic UI update
      const optimisticMessage: Message = {
        id: optimisticId,
        content: newMessage,
        createdAt: new Date(),
        read: true,
        sender: {
          id: 'currentUser',
          name: 'You',
          isCurrentUser: true
        }
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      
      scrollToBottom();
      
      const response = await fetch('/api/dashboard/childminder/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activeConversation,
          content: newMessage.trim()
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticId ? data.message : msg
        )
      );
      
      await fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Handle message deletion
  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    
    try {
      // Optimistic UI update
      setMessages(prev => prev.filter(msg => msg.id !== selectedMessage));
      
      // Only send delete request for real messages (not temporary ones)
      if (!selectedMessage.toString().startsWith('temp-')) {
        const response = await fetch('/api/dashboard/childminder/messages/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: selectedMessage
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete message');
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      // We could restore the message here if the delete fails
    } finally {
      setDeleteModalOpen(false);
      setSelectedMessage(null);
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
    
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    
    setActiveConversation(partnerId);
    setShowConversations(false);
    
    const newUrl = `/dashboard/childminder/messages?conversation=${partnerId}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    fetchMessages(partnerId);
  };
  
  // Handle back button on mobile
  const handleBack = () => {
    setShowConversations(true);
  };
  
  // Scroll to the bottom of the messages
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Setup SSE for real-time updates
  const setupSSE = useCallback((partnerId?: string) => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    
    const url = partnerId 
      ? `/api/messages/sse?partnerId=${partnerId}` 
      : '/api/messages/sse';
      
    const eventSource = new EventSource(url);
    sseRef.current = eventSource;
    
    eventSource.addEventListener('connected', (e) => {
      console.log('SSE Connected');
    });
    
    eventSource.addEventListener('new-message', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.conversationId === activeConversation) {
          setMessages(prev => [...prev, data.message]);
          scrollToBottom();
        }
        fetchConversations();
      } catch (error) {
        console.error('Error handling new message:', error);
      }
    });
    
    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, [activeConversation, fetchConversations]);
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Initial setup
  useEffect(() => {
    fetchConversations();
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [fetchConversations]);
  
  // Setup SSE when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
      setupSSE(activeConversation);
    }
  }, [activeConversation, fetchMessages, setupSSE]);
  
  return (
    <div>
      <SearchParamsListener />
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] bg-gray-100">
        {/* Left Column: Conversations List */}
        <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col bg-white ${
          showConversations || !activeConversation ? 'flex' : 'hidden md:flex'
        }`}>
          {/* User Profile Section */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <FaUserCircle className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Childminder</p>
                <p className="text-xs text-gray-500">Available</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <FaEdit className="h-4 w-4" />
            </button>
          </div>

          {/* Search box */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                placeholder="Search Here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-100 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="h-5 w-5 border-t-2 border-b-2 border-violet-500 rounded-full animate-spin"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.partnerId}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 focus:outline-none transition-colors ${
                    activeConversation === conversation.partnerId
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectConversation(conversation.partnerId)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 relative">
                      {conversation.avatar ? (
                        <div className="relative h-10 w-10">
                          <Image 
                            src={conversation.avatar}
                            alt={conversation.participant}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              // Hide the image on error
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // Show the fallback icon
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = parent.querySelector('.fallback-icon') as HTMLDivElement;
                                if (fallback) fallback.style.display = 'flex';
                              }
                            }}
                            unoptimized
                          />
                          {/* Hidden fallback icon */}
                          <div className="fallback-icon h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center absolute top-0 left-0" style={{display: 'none'}}>
                            <FaUserCircle className="h-6 w-6 text-gray-500" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <FaUserCircle className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {conversation.participant}
                        </p>
                        <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatMessageTime(conversation.timestamp)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-xs font-medium text-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Middle Column: Active Chat */}
        <div className={`flex-1 flex flex-col bg-gray-50 ${showConversations ? 'hidden md:flex' : 'flex'}`}>
          {/* Mobile back button */}
          <div className="flex md:hidden items-center p-4 border-b border-gray-200 bg-white">
            <button
              type="button"
              className="mr-4 text-gray-400 hover:text-gray-500"
              onClick={handleBack}
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-lg font-medium text-gray-900 truncate">
                {partner?.name || 'Messages'}
              </h2>
            </div>
          </div>

          {/* Message content */}
          {activeConversation && partner ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                {/* Partner Info */}
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {partner.image ? (
                      <Image 
                        src={partner.image}
                        alt={partner.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => {
                          // Hide the image and show fallback
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          // Show the fallback icon
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.fallback-icon') as HTMLDivElement;
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                        unoptimized
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <FaUserCircle className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                    {/* Add a hidden fallback icon that becomes visible if image fails */}
                    <div className="fallback-icon h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center absolute top-0 left-0" 
                         style={{display: 'none'}}>
                      <FaUserCircle className="h-6 w-6 text-gray-500" />
                    </div>
                    {/* Online Status Indicator */}
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">{partner.name}</h2>
                </div>
                {/* Action Icons */}
                <div className="flex items-center space-x-4 text-gray-500">
                  <button className="hover:text-gray-700">
                    <FaSearch className="h-5 w-5" />
                  </button>
                  <button className="hover:text-gray-700">
                    <FaHeart className="h-5 w-5" />
                  </button>
                  <button className="hover:text-gray-700">
                    <IoMdNotificationsOutline className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="h-5 w-5 border-t-2 border-b-2 border-violet-500 rounded-full animate-spin"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <FaUserCircle className="h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start a conversation below</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-end space-x-2 ${
                          message.sender.isCurrentUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {/* Avatar for received messages */}
                        {!message.sender.isCurrentUser && (
                          <div className="flex-shrink-0 relative">
                            {message.sender.image ? (
                              <Image 
                                src={message.sender.image} 
                                alt={message.sender.name}
                                width={24}
                                height={24}
                                className="h-6 w-6 rounded-full object-cover"
                                onError={(e) => {
                                  // Hide the image on error
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  // Show the fallback icon
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = parent.querySelector('.fallback-icon') as HTMLDivElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }
                                }}
                                unoptimized
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                                <FaUserCircle className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                            {/* Hidden fallback icon */}
                            <div className="fallback-icon h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center absolute top-0 left-0" style={{display: 'none'}}>
                              <FaUserCircle className="h-4 w-4 text-gray-500" />
                            </div>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`inline-block rounded-xl px-4 py-2 max-w-[70%] ${
                            message.sender.isCurrentUser
                              ? 'bg-blue-500 text-white rounded-br-none'
                              : 'bg-white text-gray-800 rounded-bl-none'
                          } relative group shadow-sm`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 text-right ${
                              message.sender.isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                            }`}
                          >
                            {formatMessageTime(message.createdAt)}
                          </p>
                        
                          {/* Delete button for own messages - only visible on hover */}
                          {message.sender.isCurrentUser && (
                            <button
                              onClick={() => {
                                setSelectedMessage(message.id);
                                setDeleteModalOpen(true);
                              }}
                              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-opacity text-xs"
                              aria-label="Delete message"
                            >
                              <FaTrash className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>

                        {/* Avatar for sent messages */}
                        {message.sender.isCurrentUser && (
                          <div className="flex-shrink-0 relative">
                            {message.sender.image ? (
                              <Image 
                                src={message.sender.image} 
                                alt={message.sender.name}
                                width={24}
                                height={24}
                                className="h-6 w-6 rounded-full object-cover"
                                onError={(e) => {
                                  // Hide the image on error
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  // Show the fallback icon
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = parent.querySelector('.fallback-icon') as HTMLDivElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }
                                }}
                                unoptimized
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                                <FaUserCircle className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                            {/* Hidden fallback icon */}
                            <div className="fallback-icon h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center absolute top-0 left-0" style={{display: 'none'}}>
                              <FaUserCircle className="h-4 w-4 text-gray-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messageEndRef} />
                  </>
                )}
              </div>

              {/* Message Input Area */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-3 shadow-sm hover:shadow transition-shadow duration-200 border border-gray-200">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-gray-700 placeholder-gray-400"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="p-2.5 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:bg-blue-400 shadow-sm transition-all duration-200 flex items-center justify-center"
                  >
                    <FaPaperPlane className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-100">
              <FaUserCircle className="h-20 w-20 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Select a conversation</h3>
              <p className="text-gray-500 max-w-sm">
                Choose someone from the left panel to start chatting.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Details Panel */}
        <div className="hidden md:flex md:w-80 border-l border-gray-200 flex-col bg-white p-6 space-y-6 overflow-y-auto">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-100 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search Here..."
            />
          </div>

          {/* Partner Profile */}
          {partner ? (
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                {partner.image ? (
                  <div className="relative h-20 w-20">
                    <Image 
                      src={partner.image}
                      alt={partner.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-full object-cover"
                      onError={(e) => {
                        // Hide the image on error
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Show the fallback icon
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = "h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center absolute top-0 left-0";
                          const icon = document.createElement('i');
                          parent.appendChild(fallback);
                          
                          // Add the user icon
                          const userIcon = document.createElement('span');
                          userIcon.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 496 512" height="3em" width="3em" xmlns="http://www.w3.org/2000/svg"><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"></path></svg>';
                          userIcon.className = "text-gray-400";
                          
                          fallback.appendChild(userIcon);
                          
                          // Remove the original image
                          target.remove();
                        }
                      }}
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <FaUserCircle className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {/* Online Status */}
                <span className="absolute bottom-1 right-1 block h-4 w-4 rounded-full bg-green-400 ring-2 ring-white"></span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{partner.name}</h3>
              {/* Action Buttons */}
              <div className="flex space-x-4 pt-2">
                <button className="flex flex-col items-center text-blue-500 hover:text-blue-700">
                  <div className="p-3 rounded-full bg-blue-100">
                    <FaPaperPlane className="h-5 w-5" />
                  </div>
                  <span className="text-xs mt-1">Chat</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">Select a conversation to see details.</div>
          )}

          {/* Divider */}
          {partner && <hr className="border-gray-200" />}
        </div>
      </div>

      {/* Message deletion confirmation modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Message</h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMessage}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChildminderMessagesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
    </div>}>
      <ChildminderMessagesPageContent />
    </Suspense>
  );
} 