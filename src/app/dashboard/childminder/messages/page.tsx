"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaUserCircle, FaSearch, FaEllipsisH, FaPaperPlane, FaArrowLeft } from "react-icons/fa";
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

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

export default function ChildminderMessagesPage() {
  const searchParams = useSearchParams();
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
  const messageEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);
  const router = useRouter();
  const [showConversations, setShowConversations] = useState(!initialConversationId);
  
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
      setConversations(data.conversations || []);
      
      if (data.conversations.length > 0) {
        if (initialConversationId && !activeConversation) {
          setActiveConversation(initialConversationId);
        } else if (!activeConversation) {
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
      const response = await fetch(`/api/dashboard/childminder/messages/conversation?id=${partnerId}&page=${page}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data.messages || []);
      setPartner(data.partner || null);
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
    <div className="flex h-[calc(100vh-4rem)] bg-white relative">
      {/* Conversations List */}
      <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 flex flex-col absolute md:relative inset-0 bg-white transition-transform duration-300 ${
        showConversations || !activeConversation ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-4 text-gray-400" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.partnerId}
                onClick={() => handleSelectConversation(conversation.partnerId)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  activeConversation === conversation.partnerId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {conversation.avatar ? (
                    <Image
                      src={conversation.avatar}
                      alt={conversation.participant}
                      width={40}
                      height={40}
                      className="rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <FaUserCircle className="w-10 h-10 text-gray-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-semibold truncate text-gray-900">
                        {conversation.participant}
                      </h3>
                      <span className="text-sm text-gray-600 ml-2">
                        {formatMessageTime(conversation.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-sm font-medium rounded-full px-2.5 py-1 min-w-[1.5rem] text-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`w-full md:w-2/3 lg:w-3/4 flex flex-col absolute md:relative inset-0 bg-white transition-transform duration-300 ${
        !showConversations || !activeConversation ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      }`}>
        {activeConversation && partner ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleBack}
                  className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100"
                  aria-label="Back to conversations"
                >
                  <FaArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                {partner.image ? (
                  <Image
                    src={partner.image}
                    alt={partner.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <FaUserCircle className="w-10 h-10 text-gray-400" />
                )}
                <h2 className="text-xl font-semibold text-gray-900">{partner.name}</h2>
              </div>
              <button className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100">
                <FaEllipsisH className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex mb-4 ${
                      message.sender.isCurrentUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                        message.sender.isCurrentUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <span className={`text-xs mt-1 block ${
                        message.sender.isCurrentUser
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}>
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <textarea
                  placeholder="Type a message..."
                  className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-base text-gray-900 placeholder-gray-500"
                  rows={1}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className={`p-3 rounded-lg ${
                    !newMessage.trim() || sendingMessage
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  } text-white transition-colors`}
                >
                  <FaPaperPlane className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-lg">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
} 