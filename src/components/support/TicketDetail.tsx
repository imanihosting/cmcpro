import React, { useState } from 'react';
import { SupportTicket, TICKET_STATUS_COLORS, TICKET_PRIORITY_COLORS } from '@/types/supportTicket';
import { formatDateTime, formatRelativeTime } from '@/lib/dateUtils';
import { FaClock, FaTag, FaArrowLeft, FaPaperPlane } from 'react-icons/fa';

interface TicketDetailProps {
  ticket: SupportTicket;
  onBack: () => void;
  onRefresh: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, onBack, onRefresh }) => {
  const [userReply, setUserReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Format messages for display
  // Ensure messages is always an array
  const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
  
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userReply.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(`/api/dashboard/parent/support/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userReply,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit reply');
      }
      
      setUserReply('');
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your reply');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b border-gray-200 p-4 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-violet-600 hover:text-violet-800 flex items-center text-sm font-medium"
          >
            <FaArrowLeft className="mr-1" />
            Back to tickets
          </button>
          <div className="flex space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${TICKET_STATUS_COLORS[ticket.status]}`}>
              {ticket.status}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${TICKET_PRIORITY_COLORS[ticket.priority]}`}>
              {ticket.priority}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900">{ticket.subject}</h2>
        
        <div className="mt-2 flex flex-wrap items-center text-sm text-gray-500">
          <div className="flex items-center mr-4">
            <FaTag className="flex-shrink-0 mr-1.5 h-3 w-3 text-gray-400" aria-hidden="true" />
            {ticket.category}
          </div>
          <div className="flex items-center mr-4">
            <FaClock className="flex-shrink-0 mr-1.5 h-3 w-3 text-gray-400" aria-hidden="true" />
            Created {formatRelativeTime(ticket.createdAt)}
          </div>
          <div className="text-sm text-gray-500">
            Ticket ID: {ticket.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
          <p className="whitespace-pre-wrap">{ticket.description}</p>
        </div>
        
        {messages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900">Conversation</h3>
            <ul className="mt-2 space-y-4">
              {messages.map((message, index) => (
                <li 
                  key={index}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`p-3 rounded-lg max-w-3/4 ${
                      message.sender === 'user' 
                        ? 'bg-violet-100 text-violet-900' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDateTime(message.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {ticket.status !== 'CLOSED' && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900">Add Reply</h3>
            
            {error && (
              <div className="mt-2 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmitReply} className="mt-2">
              <textarea
                value={userReply}
                onChange={(e) => setUserReply(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                rows={4}
                placeholder="Type your reply here..."
                required
              />
              
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !userReply.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-violet-300 flex items-center"
                >
                  <FaPaperPlane className="mr-1.5" />
                  {isSubmitting ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetail; 