"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Loader, ChevronDown } from "lucide-react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

interface ChatMessage {
  id: string;
  content: string;
  senderType: "SYSTEM" | "USER" | "AGENT";
  timestamp: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatPollInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize visitor ID
  useEffect(() => {
    // Check local storage for existing visitor ID
    const storedVisitorId = localStorage.getItem("chat_visitor_id");
    if (storedVisitorId) {
      setVisitorId(storedVisitorId);
    } else {
      // Generate a new visitor ID if none exists
      const newVisitorId = uuidv4();
      localStorage.setItem("chat_visitor_id", newVisitorId);
      setVisitorId(newVisitorId);
    }

    // Check for existing session
    const storedSessionId = localStorage.getItem("chat_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
      fetchMessages(storedSessionId);
    }
  }, []);

  // Poll for new messages when chat is open
  useEffect(() => {
    if (isOpen && sessionId) {
      fetchMessages(sessionId);
      
      // Set up polling every 5 seconds
      chatPollInterval.current = setInterval(() => {
        fetchMessages(sessionId);
      }, 5000);
    }

    return () => {
      if (chatPollInterval.current) {
        clearInterval(chatPollInterval.current);
      }
    };
  }, [isOpen, sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async (sid: string) => {
    try {
      const response = await axios.get(`/api/chat/messages?sessionId=${sid}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const startChat = async () => {
    if (sessionId) {
      // Already have a session, just open the chat
      setIsOpen(true);
      return;
    }

    setLoading(true);
    try {
      // Get current page URL to store in metadata
      const pageUrl = window.location.href;
      const pageTitle = document.title;

      const response = await axios.post("/api/chat/sessions", {
        visitorId,
        metadata: {
          pageUrl,
          pageTitle,
          userAgent: navigator.userAgent
        }
      });

      const newSessionId = response.data.id;
      setSessionId(newSessionId);
      localStorage.setItem("chat_session_id", newSessionId);
      
      // Fetch initial messages
      fetchMessages(newSessionId);
      setIsOpen(true);
    } catch (error) {
      console.error("Error starting chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!sessionId || !newMessage.trim()) return;

    setSendingMessage(true);
    
    // Optimistically add message to UI
    const tempId = "temp-" + Date.now();
    const tempMessage = {
      id: tempId,
      content: newMessage,
      senderType: "USER" as const,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");

    try {
      await axios.post("/api/chat/messages", {
        sessionId,
        content: tempMessage.content
      });
      
      // Fetch updated messages to get actual message ID and any responses
      fetchMessages(sessionId);
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the temp message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setSendingMessage(false);
    }
  };

  const minimizeChat = () => {
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-2xl flex flex-col w-80 h-96 border border-gray-200">
          {/* Chat header */}
          <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-medium">Chat Support</h3>
            <div className="flex space-x-1">
              <button 
                onClick={minimizeChat} 
                className="p-1 hover:bg-blue-700 rounded"
              >
                <ChevronDown size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-blue-700 rounded"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
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
                    ? "bg-blue-600 text-white"
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
            <div ref={chatEndRef} />
          </div>
          
          {/* Message input */}
          <div className="p-3 border-t">
            <div className="flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={sendingMessage || !newMessage.trim()}
                className={`px-3 py-2 rounded-r-lg flex items-center justify-center ${
                  sendingMessage || !newMessage.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {sendingMessage ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={startChat}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center w-14 h-14"
        >
          {loading ? (
            <Loader className="w-6 h-6 animate-spin" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}
        </button>
      )}
    </div>
  );
} 