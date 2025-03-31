"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaComment } from "react-icons/fa";
import axios from "axios";

interface ChatNotificationBadgeProps {
  className?: string;
}

export default function ChatNotificationBadge({ className = "" }: ChatNotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch unread chat sessions
  useEffect(() => {
    const fetchUnreadChats = async () => {
      try {
        const response = await axios.get('/api/chat/notifications');
        if (response.data && typeof response.data.unreadCount === 'number') {
          setUnreadCount(response.data.unreadCount);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching chat notifications:", error);
        setIsLoading(false);
      }
    };

    fetchUnreadChats();
    
    // Poll for new chats every 30 seconds
    const intervalId = setInterval(fetchUnreadChats, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleClick = () => {
    router.push("/dashboard/admin/chat");
  };

  if (isLoading) {
    return null;
  }

  if (unreadCount === 0) {
    return (
      <button
        onClick={handleClick}
        className={`relative flex items-center rounded-md p-2 hover:bg-gray-100 ${className}`}
        title="No unread chat messages"
      >
        <FaComment className="h-5 w-5 text-gray-500" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`relative flex items-center rounded-md p-2 hover:bg-gray-100 ${className}`}
      title={`${unreadCount} unread chat ${unreadCount === 1 ? 'message' : 'messages'}`}
    >
      <FaComment className="h-5 w-5 text-indigo-600" />
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    </button>
  );
} 