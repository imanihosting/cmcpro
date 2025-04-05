"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Loader, ChevronDown, RefreshCw } from "lucide-react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";
import { IoMdSend } from "react-icons/io";
import { FiX } from "react-icons/fi";
import { RiChat3Line } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from 'js-cookie';

interface ChatMessage {
  id: string;
  content: string;
  senderType: "SYSTEM" | "USER" | "AGENT";
  timestamp: string;
}

interface ChatSession {
  id: string;
  status: "ACTIVE" | "CLOSED" | "TRANSFERRED";
  lastActivity: string;
}

export default function ChatWidget() {
  const { data: session, status: authStatus } = useSession();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [reopeningChat, setReopeningChat] = useState(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Only execute client-side code after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize visitor ID
  useEffect(() => {
    if (!mounted) return;
    
    // Initialize visitor ID from cookie or create new one
    let vid = Cookies.get('visitor_id');
    if (!vid && authStatus === 'unauthenticated') {
      vid = uuidv4();
      Cookies.set('visitor_id', vid, { expires: 365 }); // Store for 1 year
    }
    setVisitorId(vid || null);

    // Check for existing session
    const existingSessionId = localStorage.getItem("chat_session_id");
    if (existingSessionId) {
      setSessionId(existingSessionId);
    }
  }, [mounted, authStatus]);

  // Determine if we should show the widget - only runs on client side
  useEffect(() => {
    if (!mounted) return;
    
    // Check if user is admin - don't show widget to admins
    if (authStatus === "authenticated") {
      if (session?.user?.role !== "admin") {
        setShowWidget(true);
      } else {
        setShowWidget(false);
      }
    } else if (authStatus === "unauthenticated") {
      // Show to unauthenticated users too
      setShowWidget(true);
    }
  }, [mounted, authStatus, session]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!mounted) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mounted, messages]);

  // Poll for new messages when chat is open
  useEffect(() => {
    if (!mounted) return;
    if (isOpen && sessionId) {
      fetchSessionDetails();
      fetchMessages();
      
      // Set up polling every 5 seconds
      const interval = setInterval(() => {
        fetchSessionDetails();
        fetchMessages();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [mounted, isOpen, sessionId]);

  // Fetch session details
  const fetchSessionDetails = async () => {
    if (!sessionId) return;
    
    setError(null);
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionStatus(data.status);
      } else if (response.status === 401) {
        console.error("Unauthorized access to chat session");
        setError("You are not authorized to access this chat session");
      } else {
        console.error("Failed to fetch session details");
        setError("Failed to load chat session details");
      }
    } catch (error) {
      console.error("Error fetching session details:", error);
      setError("Error loading chat session");
    }
  };

  // Fetch messages for the current session
  const fetchMessages = async () => {
    if (!sessionId) return;
    
    setError(null);
    try {
      const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else if (response.status === 401) {
        console.error("Unauthorized access to chat messages");
        setError("You are not authorized to view these messages");
      } else {
        console.error("Failed to fetch messages");
        setError("Failed to load chat messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Error loading chat messages");
    }
  };

  // Start a new chat
  const startChat = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const payload: Record<string, any> = {
        status: "ACTIVE",
        topic: "Support Request",
      };
      
      // Add user ID for authenticated users
      if (authStatus === 'authenticated' && session?.user?.id) {
        payload.userId = session.user.id;
      } 
      // Add visitor ID for unauthenticated users
      else if (authStatus === 'unauthenticated' && visitorId) {
        payload.visitorId = visitorId;
      }
      
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.id);
        setSessionStatus(data.status);
        localStorage.setItem("chat_session_id", data.id);
        setIsOpen(true);
        
        // Fetch initial messages
        fetchMessages();
      } else {
        console.error("Failed to start chat");
        setError("Failed to start chat session");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      setError("Error starting chat");
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !newMessage.trim() || sessionStatus === "CLOSED") return;

    try {
      setSendingMessage(true);
      setError(null);
      
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionId,
          content: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        // Fetch updated messages
        fetchMessages();
      } else if (response.status === 401) {
        console.error("Unauthorized to send message");
        setError("You are not authorized to send messages");
      } else {
        console.error("Failed to send message");
        setError("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Error sending message");
    } finally {
      setSendingMessage(false);
    }
  };

  // Reopen a closed chat
  const reopenChat = async () => {
    if (!sessionId) return;

    try {
      setReopeningChat(true);
      setError(null);
      
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: "ACTIVE",
        }),
      });

      if (response.ok) {
        setSessionStatus("ACTIVE");
        // Refresh messages
        fetchMessages();
      } else if (response.status === 401) {
        console.error("Unauthorized to reopen chat");
        setError("You are not authorized to reopen this chat");
      } else {
        console.error("Failed to reopen chat");
        setError("Failed to reopen chat");
      }
    } catch (error) {
      console.error("Error reopening chat:", error);
      setError("Error reopening chat");
    } finally {
      setReopeningChat(false);
    }
  };

  // Helper function to get authentication headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add visitor ID header for unauthenticated users
    if (authStatus === 'unauthenticated' && visitorId) {
      headers['x-visitor-id'] = visitorId;
    }
    
    return headers;
  };

  // Handle authentication errors
  const handleAuthError = () => {
    setError("Your session has expired. Please refresh the page to continue.");
    // Clear session ID as it's no longer valid
    localStorage.removeItem("chat_session_id");
    setSessionId(null);
  };

  // Don't render anything during SSR or if widget shouldn't be shown
  if (!mounted || !showWidget) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-2xl flex flex-col w-80 h-96 border border-gray-200">
          {/* Chat header */}
          <div className="bg-indigo-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-medium">Chat Support</h3>
            <div className="flex space-x-1">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-indigo-700 rounded"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded mb-2 text-sm">
                {error}
                {error.includes("expired") && (
                  <button 
                    onClick={startChat}
                    className="ml-2 underline hover:text-red-800"
                  >
                    Start new chat
                  </button>
                )}
              </div>
            )}
            {messages.map(message => (
              <div
                key={message.id}
                className={`mb-2 ${
                  message.senderType === "USER" 
                    ? "flex justify-end" 
                    : "flex justify-start"
                }`}
              >
                <div className={`max-w-xs p-2 rounded-lg ${
                  message.senderType === "USER" 
                    ? "bg-indigo-600 text-white"
                    : message.senderType === "SYSTEM"
                    ? "bg-gray-200 text-gray-700 italic"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}>
                  <div>{message.content}</div>
                  <div className="text-xs mt-1 opacity-75">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message input or closed chat notice */}
          <div className="p-3 border-t">
            {sessionStatus === "CLOSED" ? (
              <div className="flex flex-col space-y-2">
                <div className="text-center text-gray-600 py-1">
                  This chat session is closed
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={reopenChat}
                    disabled={reopeningChat}
                    className={`flex-1 py-2 px-3 rounded flex items-center justify-center space-x-1 ${
                      reopeningChat 
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {reopeningChat ? (
                      <Loader className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    <span>Reopen Chat</span>
                  </button>
                  <button
                    onClick={startChat}
                    className="flex-1 py-2 px-3 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    Start New Chat
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    sendMessage(e);
                  }}
                  disabled={sendingMessage || !newMessage.trim()}
                  className={`px-3 py-2 rounded-r-lg flex items-center justify-center ${
                    sendingMessage || !newMessage.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {sendingMessage ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setIsOpen(true);
            if (!sessionId) {
              startChat();
            }
          }}
          disabled={loading}
          className={`rounded-full w-14 h-14 flex items-center justify-center shadow-lg ${
            loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
          } text-white`}
          aria-label="Open chat"
        >
          {loading ? <Loader className="w-6 h-6 animate-spin" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      )}
    </div>
  );
} 