"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  FaTimes,
  FaSpinner,
  FaUserCircle,
  FaCommentAlt,
  FaPaperPlane,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

// TicketDetailModal props type definition
interface TicketDetailModalProps {
  ticket: any; // The ticket to display
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdated: () => void;
  adminUsers: any[]; // List of admin users for assignment
}

export default function TicketDetailModal({
  ticket,
  isOpen,
  onClose,
  onTicketUpdated,
  adminUsers,
}: TicketDetailModalProps) {
  // State for form values
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [assignTo, setAssignTo] = useState(ticket.respondedBy || "");
  const [responseMessage, setResponseMessage] = useState("");
  
  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (err) {
      return "Invalid date";
    }
  };

  // Parse messages from ticket on load
  useEffect(() => {
    if (ticket.messages) {
      try {
        // Handle different formats of messages
        let parsedMessages;
        if (Array.isArray(ticket.messages)) {
          parsedMessages = ticket.messages;
        } else if (typeof ticket.messages === "string") {
          parsedMessages = JSON.parse(ticket.messages);
        } else {
          parsedMessages = JSON.parse(JSON.stringify(ticket.messages));
        }
        
        // Ensure it's an array
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages);
        } else {
          // Create a single message from description if no messages
          setMessages([
            {
              sender: "user",
              senderName: ticket.userName,
              content: ticket.description,
              timestamp: ticket.createdAt,
            },
          ]);
        }
      } catch (err) {
        console.error("Error parsing messages:", err);
        // Create a single message from description if parsing fails
        setMessages([
          {
            sender: "user",
            senderName: ticket.userName,
            content: ticket.description,
            timestamp: ticket.createdAt,
          },
        ]);
      }
    } else {
      // Create a single message from description if no messages
      setMessages([
        {
          sender: "user",
          senderName: ticket.userName,
          content: ticket.description,
          timestamp: ticket.createdAt,
        },
      ]);
    }
  }, [ticket]);

  // Handle sending a response
  const handleSendResponse = async () => {
    if (!responseMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Prepare data for update
      const updateData: any = {
        message: responseMessage,
      };

      // Only include these fields if they've changed
      if (status !== ticket.status) {
        updateData.status = status;
      }

      if (priority !== ticket.priority) {
        updateData.priority = priority;
      }

      if (assignTo !== ticket.respondedBy) {
        updateData.assignTo = assignTo;
      }

      // Send the update request
      const response = await axios.patch(
        `/api/admin/support/${ticket.id}`,
        updateData
      );

      // Update local state with the new message
      const newMessage = {
        sender: "admin",
        senderRole: "admin",
        senderName: "Admin", // This would be better if it used the current admin's name
        content: responseMessage,
        timestamp: new Date().toISOString(),
      };

      setMessages([...messages, newMessage]);
      setResponseMessage(""); // Clear input
      toast.success("Response sent successfully");
      onTicketUpdated(); // Refresh the ticket list
    } catch (err) {
      console.error("Error updating ticket:", err);
      setError("Failed to send response. Please try again.");
      toast.error("Failed to send response");
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === status) return;

    setLoading(true);
    setError("");

    try {
      // Send the update request
      await axios.patch(`/api/admin/support/${ticket.id}`, {
        status: newStatus,
      });

      setStatus(newStatus);
      toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}`);
      onTicketUpdated(); // Refresh the ticket list
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status. Please try again.");
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  // Handle priority update
  const handlePriorityUpdate = async (newPriority: string) => {
    if (newPriority === priority) return;

    setLoading(true);
    setError("");

    try {
      // Send the update request
      await axios.patch(`/api/admin/support/${ticket.id}`, {
        priority: newPriority,
      });

      setPriority(newPriority);
      toast.success(`Priority updated to ${newPriority}`);
      onTicketUpdated(); // Refresh the ticket list
    } catch (err) {
      console.error("Error updating priority:", err);
      setError("Failed to update priority. Please try again.");
      toast.error("Failed to update priority");
    } finally {
      setLoading(false);
    }
  };

  // Handle assignment update
  const handleAssignmentUpdate = async (newAssigneeId: string) => {
    if (newAssigneeId === assignTo) return;

    setLoading(true);
    setError("");

    try {
      // Send the update request
      await axios.patch(`/api/admin/support/${ticket.id}`, {
        assignTo: newAssigneeId || null, // Allow unassigning
      });

      setAssignTo(newAssigneeId);
      
      // Find assignee name for the toast message
      const assigneeName = newAssigneeId 
        ? adminUsers.find(admin => admin.id === newAssigneeId)?.name || "an admin" 
        : "nobody";
      
      toast.success(`Ticket assigned to ${assigneeName}`);
      onTicketUpdated(); // Refresh the ticket list
    } catch (err) {
      console.error("Error updating assignment:", err);
      setError("Failed to update assignment. Please try again.");
      toast.error("Failed to update assignment");
    } finally {
      setLoading(false);
    }
  };

  // Status badge colors
  const statusColors = {
    OPEN: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    RESOLVED: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800",
  };

  // Priority badge colors
  const priorityColors = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  };

  // If not open, don't render
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Support Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Ticket details */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {ticket.subject}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">ID:</span> {ticket.id}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Created:</span>{" "}
                  {formatDate(ticket.createdAt)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Category:</span> {ticket.category}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Submitted by:</span>{" "}
                  {ticket.userName} ({ticket.userEmail})
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Last updated:</span>{" "}
                  {formatDate(ticket.updatedAt)}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
              {/* Status controls */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Status:</span>
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate("OPEN")}
                    className={`px-3 py-1 text-xs font-semibold rounded-l-md ${
                      status === "OPEN"
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    }`}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate("IN_PROGRESS")}
                    className={`px-3 py-1 text-xs font-semibold ${
                      status === "IN_PROGRESS"
                        ? "bg-yellow-600 text-white"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate("RESOLVED")}
                    className={`px-3 py-1 text-xs font-semibold ${
                      status === "RESOLVED"
                        ? "bg-green-600 text-white"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                  >
                    Resolved
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate("CLOSED")}
                    className={`px-3 py-1 text-xs font-semibold rounded-r-md ${
                      status === "CLOSED"
                        ? "bg-gray-600 text-white"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    Closed
                  </button>
                </div>
              </div>

              {/* Priority controls */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Priority:</span>
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => handlePriorityUpdate("LOW")}
                    className={`px-3 py-1 text-xs font-semibold rounded-l-md ${
                      priority === "LOW"
                        ? "bg-gray-600 text-white"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriorityUpdate("MEDIUM")}
                    className={`px-3 py-1 text-xs font-semibold ${
                      priority === "MEDIUM"
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriorityUpdate("HIGH")}
                    className={`px-3 py-1 text-xs font-semibold ${
                      priority === "HIGH"
                        ? "bg-orange-600 text-white"
                        : "bg-orange-100 text-orange-800 hover:bg-orange-200"
                    }`}
                  >
                    High
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriorityUpdate("URGENT")}
                    className={`px-3 py-1 text-xs font-semibold rounded-r-md ${
                      priority === "URGENT"
                        ? "bg-red-600 text-white"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }`}
                  >
                    Urgent
                  </button>
                </div>
              </div>

              {/* Assign to dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Assign to:</span>
                <select
                  value={assignTo}
                  onChange={(e) => handleAssignmentUpdate(e.target.value)}
                  className="border border-gray-300 rounded-md p-1 text-sm"
                >
                  <option value="">Unassigned</option>
                  {adminUsers.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.name || admin.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Message History
            </h4>
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === "admin" || message.senderRole === "admin"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      message.sender === "admin" || message.senderRole === "admin"
                        ? "bg-violet-100 text-violet-900"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <FaUserCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {message.senderName || message.sender || "Unknown"}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content || message.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply form */}
            <div className="mt-4">
              <label htmlFor="response" className="sr-only">
                Response
              </label>
              <div className="relative">
                <textarea
                  id="response"
                  rows={3}
                  placeholder="Type your response..."
                  className="block w-full rounded-lg border border-gray-300 py-2 px-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  disabled={loading}
                ></textarea>
                {error && (
                  <div className="mt-2 text-sm text-red-600">
                    <FaExclamationTriangle className="inline-block mr-1" /> {error}
                  </div>
                )}
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {status === "RESOLVED" || status === "CLOSED" ? (
                      <span className="text-yellow-600">
                        Note: This ticket is {status.toLowerCase()}. Sending a response will not reopen it.
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50"
                    onClick={handleSendResponse}
                    disabled={loading || !responseMessage.trim()}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="-ml-1 mr-2 h-4 w-4" />
                        Send Response
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 