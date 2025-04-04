"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaUserCircle, FaSearch, FaEllipsisH, FaPaperPlane, FaArrowLeft } from "react-icons/fa";
import { format } from 'date-fns';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';

// Define message type
interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender: {
    id: string;
    name: string;
    image?: string;
    isCurrentUser: boolean;
  };
}

// Define conversation type
interface Conversation {
  id: string;
  partnerId: string;
  participant: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

function MessagesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { searchParams, SearchParamsListener } = useSafeSearchParams();
  const conversationId = searchParams?.get('conversation');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(conversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<{id: string, name: string, image?: string} | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showListMobile, setShowListMobile] = useState(!conversationId);
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation =>
    conversation.participant.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/dashboard/parent/messages");
    }
  }, [status, router]);
  
  // Fetch conversations
  useEffect(() => {
    if (status === "authenticated") {
      const fetchConversations = async () => {
        try {
          setConversationsLoading(true);
          const response = await fetch('/api/dashboard/parent/messages');
          if (!response.ok) throw new Error('Failed to fetch conversations');
          
          const data = await response.json();
          setConversations(data.conversations || []);
          
          // Auto-select first conversation if none is active and no conversation ID in URL
          if (!activeConversation && !conversationId && data.conversations?.length > 0) {
            setActiveConversation(data.conversations[0].partnerId);
          }
        } catch (error) {
          console.error("Error fetching conversations:", error);
        } finally {
          setConversationsLoading(false);
        }
      };
      
      fetchConversations();
    }
  }, [status, activeConversation, conversationId]);
  
  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      const fetchMessages = async () => {
        try {
          setMessagesLoading(true);
          const response = await fetch(`/api/dashboard/parent/messages/${activeConversation}`);
          if (!response.ok) throw new Error('Failed to fetch messages');
          
          const data = await response.json();
          setMessages(data.messages || []);
          setPartner(data.partner || null);
          
          // Mark conversation as read in the UI
          setConversations(prev => 
            prev.map(conv => 
              conv.partnerId === activeConversation 
                ? { ...conv, unreadCount: 0 } 
                : conv
            )
          );
        } catch (error) {
          console.error("Error fetching messages:", error);
        } finally {
          setMessagesLoading(false);
        }
      };
      
      fetchMessages();
      
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('conversation', activeConversation);
      window.history.pushState({}, '', url.toString());
    }
  }, [activeConversation]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle selecting a conversation
  const handleSelectConversation = (partnerId: string) => {
    setActiveConversation(partnerId);
    setShowListMobile(false);
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    try {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        content: newMessage,
        createdAt: new Date().toISOString(),
        read: true,
        sender: {
          id: session?.user?.id || "",
          name: session?.user?.name || "You",
          image: session?.user?.image || undefined,
          isCurrentUser: true
        }
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage("");
      
      // Send to server
      const response = await fetch('/api/dashboard/parent/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activeConversation,
          content: newMessage
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      // Refresh conversations to update latest message
      const convoResponse = await fetch('/api/dashboard/parent/messages');
      if (convoResponse.ok) {
        const data = await convoResponse.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format message time
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If less than 24 hours ago, show time
    if (diff < 24 * 60 * 60 * 1000) {
      return format(date, 'h:mm a');
    }
    
    // If less than 7 days ago, show day
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return format(date, 'EEEE');
    }
    
    // Otherwise show date
    return format(date, 'MMM d');
  };
  
  // Handle back button on mobile
  const handleBackToList = () => {
    setShowListMobile(true);
  };
  
  // Loading state
  if (status === "loading") {
    return (
      <div>
        <SearchParamsListener />
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <SearchParamsListener />
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
        {/* Conversations sidebar */}
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
                  <p className="text-sm text-gray-400">Find childminders to start messaging</p>
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
        
        {/* Conversation area */}
        <div className={`w-full flex-1 flex flex-col bg-white ${
          showListMobile ? 'hidden md:flex' : 'flex'
        }`}>
          {activeConversation && partner ? (
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
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-violet-600 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <FaPaperPlane className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <FaUserCircle className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500 max-w-md">
                Choose a conversation from the list to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
    </div>}>
      <MessagesContent />
    </Suspense>
  );
} 