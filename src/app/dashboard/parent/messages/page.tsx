"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaUserCircle, FaSearch, FaEllipsisH, FaPaperPlane, FaArrowLeft, FaTrash, FaTimes, FaEdit, FaMicrophone, FaPaperclip, FaCamera, FaSmile, FaVideo, FaHeart, FaUserFriends, FaFilePdf, FaFileVideo, FaFileAudio, FaFileImage } from "react-icons/fa";
import { IoMdNotificationsOutline } from "react-icons/io"; // Added notification icon
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
  const receiverId = searchParams?.get('receiverId');
  const receiverName = searchParams?.get('receiverName');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(conversationId || receiverId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<{id: string, name: string, image?: string} | null>(
    receiverId && receiverName ? { id: receiverId, name: decodeURIComponent(receiverName), image: undefined } : null
  );
  const [newMessage, setNewMessage] = useState("");
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showListMobile, setShowListMobile] = useState(!(conversationId || receiverId));
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
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
          
          // The correct API endpoint structure
          const response = await fetch(`/api/dashboard/parent/messages/conversation?id=${activeConversation}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch messages');
          }
          
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
      
      // Only update URL if it's different than current state - prevents excessive history updates
      const currentUrl = new URL(window.location.href);
      const currentConversation = currentUrl.searchParams.get('conversation');
      const currentReceiverId = currentUrl.searchParams.get('receiverId');
      const currentReceiverName = currentUrl.searchParams.get('receiverName');
      
      // Check if any search param needs to be updated
      const needsUpdate = 
        currentConversation !== activeConversation ||
        (receiverId && currentReceiverId !== receiverId) ||
        (receiverName && currentReceiverName !== receiverName) ||
        (!receiverId && currentReceiverId);
      
      if (needsUpdate) {
        const url = new URL(window.location.href);
        url.searchParams.set('conversation', activeConversation);
        
        if (receiverId) {
          url.searchParams.set('receiverId', receiverId);
          if (receiverName) {
            url.searchParams.set('receiverName', receiverName);
          }
        } else {
          url.searchParams.delete('receiverId');
          url.searchParams.delete('receiverName');
        }
        
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeConversation, receiverId, receiverName]); // Removed 'conversations' dependency
  
  // Scroll to bottom when messages change
  useEffect(() => {
    // Use a small timeout to ensure the DOM has updated
    const timeoutId = setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);
  
  // Handle selecting a conversation
  const handleSelectConversation = (partnerId: string) => {
    setActiveConversation(partnerId);
    setShowListMobile(false);
  };
  
  // Handle back button click on mobile
  const handleBackToList = () => {
    setShowListMobile(true);
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
      
      // Get the real message from the response and replace the temp message
      const data = await response.json();
      if (data.message) {
        setMessages(prev => 
          prev.map(msg => msg.id === tempId ? data.message : msg)
        );
      }
      
      // Refresh conversations to update latest message
      const convoResponse = await fetch('/api/dashboard/parent/messages');
      if (convoResponse.ok) {
        const data = await convoResponse.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.toString().startsWith('temp-')));
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
  
  // Update state when query parameters change
  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId);
      setShowListMobile(false);
    }
    
    if (receiverId && receiverName) {
      setPartner({
        id: receiverId,
        name: decodeURIComponent(receiverName),
        image: undefined
      });
      setActiveConversation(receiverId);
      setShowListMobile(false);
    }
  }, [conversationId, receiverId, receiverName]);
  
  // Delete message handler
  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    
    try {
      // Check if it's a temporary message
      if (selectedMessage.toString().startsWith('temp-')) {
        // For temporary messages, just remove from UI
        setMessages(prev => prev.filter(message => message.id !== selectedMessage));
        setDeleteModalOpen(false);
        setSelectedMessage(null);
        return;
      }
      
      const response = await fetch(`/api/dashboard/parent/messages/message?id=${selectedMessage}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        console.error('Failed to delete message:', await response.text());
        throw new Error('Failed to delete message');
      }
      
      // Remove the message from the UI
      setMessages(prev => prev.filter(message => message.id !== selectedMessage));
      
      // Reset state
      setDeleteModalOpen(false);
      setSelectedMessage(null);
      
      // Refresh conversations to ensure state is in sync
      const convoResponse = await fetch('/api/dashboard/parent/messages');
      if (convoResponse.ok) {
        const data = await convoResponse.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      setDeleteModalOpen(false);
    }
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
      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] bg-gray-100">

        {/* Left Column: Conversations List */}
        <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col bg-white ${
          showListMobile ? 'flex' : 'hidden md:flex' // Keep mobile logic for now
        }`}>
          {/* User Profile Section */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {session?.user?.image ? (
                <img src={session.user.image} alt="User" className="h-10 w-10 rounded-full" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <FaUserCircle className="h-6 w-6 text-gray-500" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{session?.user?.name || 'Current User'}</p>
                <p className="text-xs text-gray-500">{'Senior Developer' /* Placeholder */}</p>
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
                placeholder="Search Here..." // Updated placeholder
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-100 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" // Updated styling: rounded-full, bg-gray-100
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
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 focus:outline-none transition-colors ${ // Adjusted border color
                    activeConversation === conversation.partnerId
                      ? 'bg-blue-50' // Updated active color
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectConversation(conversation.partnerId)}
                >
                  <div className="flex items-center"> {/* Changed items-start to items-center */}
                    <div className="flex-shrink-0 relative"> {/* Added relative for potential status indicator */}
                      {conversation.avatar ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={conversation.avatar}
                          alt={conversation.participant}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <FaUserCircle className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      {/* Optional: Add online status indicator here */}
                    </div>
                    <div className="ml-3 flex-1 min-w-0"> {/* Added min-w-0 for truncation */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800 truncate"> {/* Adjusted font weight */}
                          {conversation.participant}
                        </p>
                        <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{conversation.timestamp}</p> {/* Adjusted color and spacing */}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-xs font-medium text-white"> {/* Updated color */}
                            {conversation.unreadCount}
                          </span>
                        )}
                        {/* Add checkmark for read status if needed */}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div> {/* Added back the closing div for the Left Column */}

        {/* Middle Column: Active Chat */}
        <div className={`flex-1 flex flex-col bg-gray-50 ${showListMobile ? 'hidden md:flex' : 'flex'}`}>
          {/* Mobile back button - Keep for now */}
          <div className="flex md:hidden items-center p-4 border-b border-gray-200 bg-white">
            <button
              type="button"
              className="mr-4 text-gray-400 hover:text-gray-500"
              onClick={handleBackToList}
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-lg font-medium text-gray-900 truncate">
                {partner?.name || 'Messages'}
              </h2>
            </div>
            {/* Add placeholder for right column toggle on mobile? */}
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
                      <img
                        className="h-10 w-10 rounded-full" // Increased size
                        src={partner.image}
                        alt={partner.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <FaUserCircle className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                    {/* Online Status Indicator */}
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">{partner.name}</h2> {/* Adjusted font size/weight */}
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
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100"> {/* Adjusted padding and background */}
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
                        className={`flex items-end space-x-2 ${ // Added items-end and space-x
                          message.sender.isCurrentUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {/* Avatar for received messages */}
                        {!message.sender.isCurrentUser && (
                          <div className="flex-shrink-0">
                            {message.sender.image ? (
                              <img src={message.sender.image} alt={message.sender.name} className="h-6 w-6 rounded-full" />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                                <FaUserCircle className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`inline-block rounded-xl px-4 py-2 max-w-[70%] ${ // Adjusted rounding and max-width
                            message.sender.isCurrentUser
                              ? 'bg-blue-500 text-white rounded-br-none' // Updated color and shape for sender
                              : 'bg-white text-gray-800 rounded-bl-none' // Updated color and shape for receiver
                          } relative group shadow-sm`} // Added shadow
                        >
                          {/* Handle PDF preview - Requires specific logic */}
                          {message.content.toLowerCase().includes('.pdf') ? (
                            <div className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md bg-gray-50">
                              <FaFilePdf className="h-8 w-8 text-red-500" />
                              <span className="text-sm text-gray-700 font-medium">{message.content}</span>
                              {/* Add download/view button? */}
                            </div>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          {/* Timestamp - Consider moving outside bubble or showing on hover */}
                          <p
                            className={`text-xs mt-1 text-right ${ // Adjusted alignment
                              message.sender.isCurrentUser ? 'text-blue-100' : 'text-gray-400' // Adjusted colors
                            }`}
                          >
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>

                          {/* Avatar for sent messages */}
                          {message.sender.isCurrentUser && (
                            <div className="flex-shrink-0">
                              {message.sender.image ? (
                                <img src={message.sender.image} alt={message.sender.name} className="h-6 w-6 rounded-full" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                                  <FaUserCircle className="h-4 w-4 text-gray-500" />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Delete button - only visible on hover and for user's own messages */}
                          {message.sender.isCurrentUser && !message.id.toString().startsWith('temp-') && (
                            <button
                              onClick={() => {
                                setSelectedMessage(message.id);
                                setDeleteModalOpen(true);
                              }}
                              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-opacity text-xs" // Adjusted position and style
                              aria-label="Delete message"
                            >
                              <FaTrash className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <div ref={messageEndRef} /> {/* Keep scroll ref */}
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
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2.5 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:bg-blue-400 shadow-sm transition-all duration-200 flex items-center justify-center"
                  >
                    <FaPaperPlane className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-100"> {/* Adjusted background */}
              <FaUserCircle className="h-20 w-20 text-gray-300 mb-4" /> {/* Increased size */}
              <h3 className="text-xl font-medium text-gray-700 mb-2">Select a conversation</h3> {/* Adjusted text */}
              <p className="text-gray-500 max-w-sm"> {/* Adjusted text */}
                Choose someone from the left panel to start chatting or view details on the right.
              </p>
            </div>
          )}
        </div> {/* End Middle Column */}

        {/* Right Column: Details Panel */}
        <div className="hidden md:flex md:w-80 border-l border-gray-200 flex-col bg-white p-6 space-y-6 overflow-y-auto"> {/* Added overflow-y-auto */}
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
           {partner ? (() => {
             // Define partner image element conditionally
             const partnerImageElement = partner.image ? (
               <img src={partner.image} alt={partner.name} className="h-20 w-20 rounded-full" />
             ) : (
               <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                 <FaUserCircle className="h-12 w-12 text-gray-400" />
               </div>
             );

             return (
               <div className="flex flex-col items-center text-center space-y-3">
                 <div className="relative">
                   {partnerImageElement} {/* Use the variable here */}
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
             );
           })() : ( // End of IIFE for partner profile
             <div className="text-center text-gray-500 py-10">Select a conversation to see details.</div>
           )}

           {/* Divider */}
           {partner && <hr className="border-gray-200" />}
        </div> {/* End Right Column */}
      </div> {/* End Main 3-column layout */}

      {/* Message deletion confirmation modal (Keep as is) */}
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

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
    </div>}>
      <MessagesContent />
    </Suspense>
  );
}
