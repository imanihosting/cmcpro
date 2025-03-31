"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { User, MessageCircle, Clock, Send, X, Check, Loader } from "lucide-react";

interface ChatSession {
  id: string;
  userId: string | null;
  visitorId: string | null;
  status: string;
  agentId: string | null;
  startedAt: string;
  endedAt: string | null;
  lastActivity: string;
  User: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  Agent: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  chatMessages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string | null;
  senderType: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  Sender?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  } | null;
}

export default function AdminChatDashboard() {
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [filter, setFilter] = useState("ACTIVE");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch active chat sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(`/api/chat/sessions?status=${filter}`);
        setActiveSessions(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chat sessions:", error);
        setLoading(false);
      }
    };

    fetchSessions();
    // Refresh sessions every 10 seconds
    const intervalId = setInterval(fetchSessions, 10000);
    
    return () => clearInterval(intervalId);
  }, [filter]);

  // Fetch messages when a session is selected
  useEffect(() => {
    if (selectedSession) {
      const fetchMessages = async () => {
        try {
          const response = await axios.get(`/api/chat/messages?sessionId=${selectedSession}`);
          setMessages(response.data);
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };

      fetchMessages();
      // Refresh messages every 5 seconds
      const intervalId = setInterval(fetchMessages, 5000);
      
      return () => clearInterval(intervalId);
    }
  }, [selectedSession]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedSession || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      await axios.post("/api/chat/messages", {
        sessionId: selectedSession,
        content: newMessage
      });
      setNewMessage("");
      // Refresh messages immediately
      const response = await axios.get(`/api/chat/messages?sessionId=${selectedSession}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    try {
      await axios.patch(`/api/chat/sessions/${sessionId}`, {
        status: "CLOSED"
      });
      // Refresh the sessions list
      const response = await axios.get(`/api/chat/sessions?status=${filter}`);
      setActiveSessions(response.data);
      if (selectedSession === sessionId) {
        // Refresh messages if we closed the current session
        const messagesResponse = await axios.get(`/api/chat/messages?sessionId=${selectedSession}`);
        setMessages(messagesResponse.data);
      }
    } catch (error) {
      console.error("Error closing chat session:", error);
    }
  };

  const getSessionName = (session: ChatSession) => {
    if (session.User?.name) return session.User.name;
    if (session.User?.email) return session.User.email;
    return `Visitor ${session.visitorId?.substring(0, 8) || "Unknown"}`;
  };

  const getLastMessagePreview = (session: ChatSession) => {
    if (session.chatMessages && session.chatMessages.length > 0) {
      const lastMessage = session.chatMessages[0];
      return lastMessage.content.length > 40 
        ? `${lastMessage.content.substring(0, 40)}...` 
        : lastMessage.content;
    }
    return "No messages yet";
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Live Chat Support</h1>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex">
          {/* Sessions List */}
          <div className="w-1/3 border-r">
            <div className="p-4 border-b">
              <div className="flex space-x-2 mb-4">
                <button 
                  onClick={() => setFilter("ACTIVE")}
                  className={`px-3 py-1 rounded text-sm ${filter === "ACTIVE" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700"}`}
                >
                  Active
                </button>
                <button 
                  onClick={() => setFilter("CLOSED")}
                  className={`px-3 py-1 rounded text-sm ${filter === "CLOSED" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700"}`}
                >
                  Closed
                </button>
              </div>
              <h2 className="font-medium text-gray-700">
                {filter === "ACTIVE" ? "Active Sessions" : "Closed Sessions"}
              </h2>
            </div>
            
            <div className="overflow-y-auto h-[calc(100vh-280px)]">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : activeSessions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No {filter.toLowerCase()} chat sessions
                </div>
              ) : (
                activeSessions.map((session) => (
                  <div 
                    key={session.id}
                    onClick={() => setSelectedSession(session.id)}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedSession === session.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{getSessionName(session)}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {getLastMessagePreview(session)}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                      </div>
                    </div>
                    {session.status === "ACTIVE" && !session.Agent && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          Waiting for agent
                        </span>
                      </div>
                    )}
                    {session.Agent && (
                      <div className="mt-2 text-xs text-gray-500">
                        Agent: {session.Agent.name || session.Agent.email}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="w-2/3 flex flex-col">
            {!selectedSession ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a chat session to start messaging
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex justify-between items-center">
                  <div>
                    <h2 className="font-medium">
                      {activeSessions.find(s => s.id === selectedSession)
                        ? getSessionName(activeSessions.find(s => s.id === selectedSession)!)
                        : "Chat"
                      }
                    </h2>
                  </div>
                  <div>
                    <button 
                      onClick={() => handleCloseSession(selectedSession)}
                      className="text-sm px-3 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      Close Chat
                    </button>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto h-[calc(100vh-380px)]">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`mb-4 ${
                        message.senderType === "AGENT" 
                          ? "flex flex-row-reverse" 
                          : "flex"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.senderType === "AGENT"
                            ? "bg-blue-600 text-white"
                            : message.senderType === "SYSTEM"
                            ? "bg-gray-200 text-gray-700 italic mx-auto max-w-[90%]"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {message.senderType !== "SYSTEM" && (
                          <div className="font-medium text-sm mb-1">
                            {message.senderType === "AGENT" 
                              ? "Agent" 
                              : message.Sender?.name || "User"}
                          </div>
                        )}
                        <div>{message.content}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={activeSessions.find(s => s.id === selectedSession)?.status === "CLOSED"}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !newMessage.trim() || activeSessions.find(s => s.id === selectedSession)?.status === "CLOSED"}
                      className={`px-4 py-2 rounded-r-lg flex items-center justify-center ${
                        sendingMessage || !newMessage.trim() || activeSessions.find(s => s.id === selectedSession)?.status === "CLOSED"
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
                  {activeSessions.find(s => s.id === selectedSession)?.status === "CLOSED" && (
                    <div className="mt-2 text-sm text-red-500">
                      This chat session is closed
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 