"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaTimes,
  FaSpinner,
  FaExclamationTriangle,
  FaUser,
  FaEnvelope,
  FaSearch,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

// User interface for search results
interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
}

// CreateTicketModal props type definition
interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: (ticket: any) => void;
}

export default function CreateTicketModal({
  isOpen,
  onClose,
  onTicketCreated,
}: CreateTicketModalProps) {
  // Form state
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState("MEDIUM");
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  
  // Categories for dropdown
  const categories = [
    { value: "GENERAL", label: "General Inquiry" },
    { value: "TECHNICAL", label: "Technical Issue" },
    { value: "BILLING", label: "Billing" },
    { value: "FEATURE", label: "Feature Request" },
    { value: "ACCOUNT", label: "Account" },
    { value: "OTHER", label: "Other" },
  ];

  // Priorities for dropdown
  const priorities = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
  ];

  // If not open, don't render
  if (!isOpen) return null;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    
    if (!category) {
      setError("Category is required");
      return;
    }
    
    // If not selecting a user, email is required
    if (!userId && !userEmail.trim()) {
      setError("Either select a user or enter a user email");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Prepare ticket data
      const ticketData = {
        subject,
        description,
        category,
        priority,
        userId: userId || undefined,
        userEmail: userEmail || undefined,
        userName: userName || undefined,
      };
      
      // Create ticket
      const response = await axios.post("/api/admin/support", ticketData);
      
      toast.success("Support ticket created successfully");
      
      // Reset form
      setSubject("");
      setDescription("");
      setCategory("GENERAL");
      setPriority("MEDIUM");
      setUserId("");
      setUserEmail("");
      setUserName("");
      
      // Close modal and notify parent
      onTicketCreated(response.data.data);
      onClose();
    } catch (err) {
      console.error("Error creating ticket:", err);
      setError("Failed to create ticket. Please try again.");
      toast.error("Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  // Handle user search
  const handleUserSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim() || query.length < 3) {
      setUserSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const response = await axios.get(`/api/admin/users/search?q=${query}`);
      setUserSearchResults(response.data.users || []);
    } catch (err) {
      console.error("Error searching users:", err);
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle user selection
  const handleSelectUser = (user: User) => {
    setUserId(user.id);
    setUserEmail(user.email);
    setUserName(user.name || user.email.split('@')[0]);
    setShowUserSearch(false);
    setSearchQuery("");
    setUserSearchResults([]);
  };

  // Toggle between manual entry and user search
  const toggleUserSearch = () => {
    setShowUserSearch(!showUserSearch);
    if (!showUserSearch) {
      // Switching to user search, clear manual fields
      setUserEmail("");
      setUserName("");
    } else {
      // Switching to manual entry, clear user ID
      setUserId("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Create Support Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-start">
              <FaExclamationTriangle className="h-5 w-5 mr-2 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Subject */}
          <div className="mb-4">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
              placeholder="Brief summary of the issue"
              required
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
              required
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="mb-4">
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
            >
              {priorities.map((pri) => (
                <option key={pri.value} value={pri.value}>
                  {pri.label}
                </option>
              ))}
            </select>
          </div>

          {/* User Information */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                User *
              </label>
              <button
                type="button"
                onClick={toggleUserSearch}
                className="text-xs text-violet-600 hover:text-violet-800"
              >
                {showUserSearch ? "Enter manually" : "Search for user"}
              </button>
            </div>

            {showUserSearch ? (
              // User search
              <div>
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                    placeholder="Search users by name or email"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Search results */}
                {isSearching ? (
                  <div className="text-center py-2 text-sm text-gray-500">
                    <FaSpinner className="animate-spin h-4 w-4 mx-auto mb-1" />
                    Searching...
                  </div>
                ) : userSearchResults.length > 0 ? (
                  <div className="border border-gray-300 rounded-md overflow-hidden max-h-40 overflow-y-auto">
                    {userSearchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 border-b border-gray-200 last:border-b-0 flex items-center"
                      >
                        <div className="rounded-full bg-gray-200 p-1 mr-2">
                          <FaUser className="h-3 w-3 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {user.name || "No name"}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user.email}
                          </div>
                        </div>
                        <div className="ml-2 text-xs bg-gray-100 py-0.5 px-2 rounded">
                          {user.role}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length >= 3 ? (
                  <div className="text-center py-2 text-sm text-gray-500">
                    No users found
                  </div>
                ) : null}

                {/* Selected user display */}
                {userId && (
                  <div className="mt-2 p-2 border border-gray-300 rounded-md bg-gray-50 flex items-center">
                    <div className="rounded-full bg-violet-100 p-1 mr-2">
                      <FaUser className="h-3 w-3 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {userName || "No name"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {userEmail}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserId("");
                        setUserEmail("");
                        setUserName("");
                      }}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      <FaTimes className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Manual user entry
              <div className="space-y-3">
                <div>
                  <label htmlFor="userEmail" className="block text-xs text-gray-500 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="userEmail"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                      placeholder="user@example.com"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="userName" className="block text-xs text-gray-500 mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="userName"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                      placeholder="User's name"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
              rows={5}
              placeholder="Detailed description of the issue or request"
              required
            ></textarea>
          </div>

          {/* Form controls */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 flex items-center disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                "Create Ticket"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 