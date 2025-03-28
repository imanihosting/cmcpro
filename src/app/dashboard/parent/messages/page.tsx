"use client";

import { useState } from "react";
import { FaUserCircle, FaSearch, FaEllipsisH, FaPaperPlane } from "react-icons/fa";

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  isUnread: boolean;
}

interface Conversation {
  id: number;
  participant: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const [activeConversation, setActiveConversation] = useState<number | null>(1);
  
  // Placeholder conversations data
  const conversations: Conversation[] = [
    {
      id: 1,
      participant: "Sarah Johnson",
      lastMessage: "Is tomorrow at 3 PM still good for you?",
      timestamp: "10:23 AM",
      unreadCount: 2
    },
    {
      id: 2,
      participant: "David Williams",
      lastMessage: "I've updated my availability for next week.",
      timestamp: "Yesterday",
      unreadCount: 0
    },
    {
      id: 3,
      participant: "Emma Thompson",
      lastMessage: "Thank you for booking with me!",
      timestamp: "Mar 25",
      unreadCount: 0
    }
  ];

  // Placeholder messages for the active conversation
  const messages: Message[] = [
    {
      id: 1,
      sender: "Sarah Johnson",
      content: "Hello! I wanted to confirm our booking for tomorrow.",
      timestamp: "10:15 AM",
      isUnread: false
    },
    {
      id: 2,
      sender: "You",
      content: "Hi Sarah, yes I'm looking forward to it!",
      timestamp: "10:18 AM",
      isUnread: false
    },
    {
      id: 3,
      sender: "Sarah Johnson",
      content: "Great! Just to confirm, it's for 2 children, right?",
      timestamp: "10:20 AM",
      isUnread: true
    },
    {
      id: 4,
      sender: "Sarah Johnson",
      content: "Is tomorrow at 3 PM still good for you?",
      timestamp: "10:23 AM",
      isUnread: true
    }
  ];

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col md:flex-row">
      {/* Conversations sidebar */}
      <div className="w-full border-r border-gray-200 md:w-80">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          
          <div className="mt-3 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search messages"
              className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
        
        <div className="h-[calc(100%-5rem)] overflow-y-auto">
          {conversations.map((conversation) => (
            <div 
              key={conversation.id}
              onClick={() => setActiveConversation(conversation.id)}
              className={`p-4 border-b border-gray-200 cursor-pointer ${
                activeConversation === conversation.id ? 'bg-violet-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start">
                <div className="relative flex-shrink-0">
                  <FaUserCircle className="h-10 w-10 text-gray-400" />
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
          ))}
        </div>
      </div>

      {/* Active conversation */}
      <div className="flex-1 flex flex-col">
        {activeConversation !== null ? (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div className="flex items-center">
                <FaUserCircle className="h-8 w-8 text-gray-400" />
                <h2 className="ml-3 text-lg font-medium text-gray-900">
                  {conversations.find(c => c.id === activeConversation)?.participant}
                </h2>
              </div>
              <button className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <FaEllipsisH className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.sender === 'You' ? 'justify-end' : ''}`}
                >
                  <div className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    message.sender === 'You' 
                      ? 'bg-violet-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`mt-1 text-right text-xs ${
                      message.sender === 'You' ? 'text-violet-200' : 'text-gray-500'
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button className="absolute right-6 rounded-full p-1 text-violet-600 hover:text-violet-700">
                  <FaPaperPlane className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
} 