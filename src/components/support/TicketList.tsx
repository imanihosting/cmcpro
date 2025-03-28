import React from 'react';
import { SupportTicket, TICKET_STATUS_COLORS, TICKET_PRIORITY_COLORS } from '@/types/supportTicket';
import { formatDate, formatRelativeTime } from '@/lib/dateUtils';
import { FaClock, FaTag } from 'react-icons/fa';

interface TicketListProps {
  tickets: SupportTicket[];
  onSelectTicket: (ticket: SupportTicket) => void;
  isLoading: boolean;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, onSelectTicket, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">You haven't created any support tickets yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="hover:bg-gray-50">
            <button
              onClick={() => onSelectTicket(ticket)}
              className="w-full text-left px-3 py-3 sm:px-6 sm:py-4 focus:outline-none"
            >
              <div className="flex items-center justify-between flex-wrap">
                <p className="text-sm font-medium text-violet-600 truncate mb-1 sm:mb-0 max-w-full sm:max-w-[65%]">
                  {ticket.subject}
                </p>
                <div className="flex-shrink-0 flex">
                  <p className={`px-2 py-1 text-xs rounded-full ${TICKET_STATUS_COLORS[ticket.status]}`}>
                    {ticket.status}
                  </p>
                </div>
              </div>
              
              <div className="mt-2 flex flex-wrap justify-between items-center">
                <div className="flex flex-wrap items-center mb-1 sm:mb-0">
                  <p className="flex items-center text-xs sm:text-sm text-gray-500 mr-3 mb-1 sm:mb-0">
                    <FaTag className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" aria-hidden="true" />
                    {ticket.category}
                  </p>
                  <p className="flex items-center text-xs sm:text-sm text-gray-500">
                    <FaClock className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" aria-hidden="true" />
                    {formatRelativeTime(ticket.createdAt)}
                  </p>
                </div>
                <div>
                  <span className={`px-2 py-1 text-xs rounded-full ${TICKET_PRIORITY_COLORS[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TicketList; 