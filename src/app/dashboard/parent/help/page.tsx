"use client";

import { useState, useEffect } from "react";
import { 
  FaQuestionCircle,
  FaBook,
  FaHeadset,
  FaComment,
  FaVideo,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaTicketAlt,
  FaPlus
} from "react-icons/fa";
import CreateTicketForm from "@/components/support/CreateTicketForm";
import TicketList from "@/components/support/TicketList";
import TicketDetail from "@/components/support/TicketDetail";
import { SupportTicket, SupportTicket_status } from "@/types/supportTicket";

// FAQ Item component
interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200">
      <button
        className="flex w-full items-center justify-between py-4 px-2 text-left hover:bg-gray-50 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-medium text-gray-900">{question}</span>
        {isOpen ? (
          <FaChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <FaChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-2 pb-4">
          <p className="text-sm text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
};

export default function HelpSupportPage() {
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<'help' | 'tickets'>('help');
  const [statusFilter, setStatusFilter] = useState<SupportTicket_status | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Fetch tickets
  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        queryParams.append('status', statusFilter);
      }
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', '10');
      
      const response = await fetch(`/api/dashboard/parent/support?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      
      const data = await response.json();
      setTickets(data.tickets);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch ticket details
  const fetchTicketDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dashboard/parent/support/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch ticket details');
      }
      
      const data = await response.json();
      setSelectedTicket(data);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load tickets when view changes or filter changes
  useEffect(() => {
    if (activeView === 'tickets') {
      fetchTickets();
    }
  }, [activeView, statusFilter, currentPage]);
  
  // Handle ticket creation success
  const handleTicketCreated = () => {
    setActiveView('tickets');
    setCurrentPage(1);
    fetchTickets();
  };
  
  // Handle ticket selection
  const handleSelectTicket = (ticket: SupportTicket) => {
    fetchTicketDetails(ticket.id);
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Placeholder FAQs
  const faqs: FAQItemProps[] = [
    {
      question: "How do I book a childminder?",
      answer: "You can book a childminder by going to the 'Find Childminders' section, searching for available childminders in your area, and selecting the 'Book Now' option on their profile. Follow the steps to complete your booking based on your specific needs and schedule."
    },
    {
      question: "Can I cancel a booking?",
      answer: "Yes, you can cancel a booking by going to the 'Bookings' section, finding the booking you want to cancel, and clicking the 'Cancel' button. Please note that cancellation policies may vary depending on the childminder and how close to the scheduled time you are cancelling."
    },
    {
      question: "How do I update my children's information?",
      answer: "You can update your children's information by navigating to the 'My Children' section in your dashboard. From there, select the child whose information you want to update, and click the 'Edit' button to modify their details such as age, medical requirements, or special needs."
    },
    {
      question: "How do payments work?",
      answer: "Payments are processed securely through our platform. You can add your payment methods in the 'Subscription' section. When you book a childminder, the payment will be processed based on the rates agreed upon. You can view your payment history and receipts in the 'Activity' section."
    },
    {
      question: "What should I do if I have a problem with a childminder?",
      answer: "If you experience any issues with a childminder, we recommend first trying to resolve it directly through our messaging system. If the issue persists, you can contact our support team through the 'Help & Support' section, and we will assist you in resolving the matter appropriately."
    }
  ];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Help & Support</h1>
        <p className="mt-1 text-sm text-gray-600">Find answers to common questions and get support</p>
      </header>

      {/* Tab navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveView('help')}
            className={`pb-4 text-sm font-medium ${
              activeView === 'help'
                ? 'border-b-2 border-violet-500 text-violet-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Help Center
          </button>
          <button
            onClick={() => setActiveView('tickets')}
            className={`pb-4 text-sm font-medium flex items-center ${
              activeView === 'tickets'
                ? 'border-b-2 border-violet-500 text-violet-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaTicketAlt className="mr-2" />
            My Support Tickets
          </button>
        </div>
      </div>

      {/* Help Center View */}
      {activeView === 'help' && (
        <>
          {/* Search and support options */}
          <div className="mb-8">
            <div className="relative mb-6">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for help topics..."
                className="block w-full rounded-md border border-gray-300 py-3 pl-10 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-lg bg-white p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <FaBook className="h-6 w-6" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">User Guides</h3>
                <p className="text-xs text-gray-600">Step-by-step guides on using the platform</p>
              </div>
              
              <div className="rounded-lg bg-white p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <FaVideo className="h-6 w-6" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">Video Tutorials</h3>
                <p className="text-xs text-gray-600">Watch tutorials on key features</p>
              </div>
              
              <div className="rounded-lg bg-white p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <FaComment className="h-6 w-6" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">Live Chat</h3>
                <p className="text-xs text-gray-600">Chat with our support team in real-time</p>
              </div>
              
              <div 
                className="rounded-lg bg-white p-4 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setActiveView('tickets');
                  setShowCreateTicket(true);
                }}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <FaHeadset className="h-6 w-6" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">Contact Support</h3>
                <p className="text-xs text-gray-600">Submit a support ticket for assistance</p>
              </div>
            </div>
          </div>

          {/* FAQs section */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Frequently Asked Questions</h2>
            <div className="rounded-lg bg-white shadow-sm">
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
            <div className="mt-4 text-center">
              <button className="text-sm font-medium text-violet-600 hover:text-violet-700">
                View All FAQs
              </button>
            </div>
          </div>

          {/* Contact information */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Contact Information</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700">Customer Support</h3>
                <p className="text-sm text-gray-600">support@childminderconnect.com</p>
                <p className="text-sm text-gray-600">+44 (0) 123 456 7890</p>
                <p className="mt-1 text-xs text-gray-500">Available Mon-Fri, 9am-5pm GMT</p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700">Technical Support</h3>
                <p className="text-sm text-gray-600">tech@childminderconnect.com</p>
                <p className="text-sm text-gray-600">+44 (0) 123 456 7891</p>
                <p className="mt-1 text-xs text-gray-500">Available Mon-Fri, 9am-8pm GMT</p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700">Mailing Address</h3>
                <p className="text-sm text-gray-600">ChildminderConnect Ltd.</p>
                <p className="text-sm text-gray-600">123 High Street</p>
                <p className="text-sm text-gray-600">London, EC1V 9BT</p>
                <p className="text-sm text-gray-600">United Kingdom</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Support Tickets View */}
      {activeView === 'tickets' && !selectedTicket && !showCreateTicket && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SupportTicket_status | 'ALL')}
                className="rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="ALL">All Tickets</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <button
              onClick={() => setShowCreateTicket(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 flex items-center"
            >
              <FaPlus className="mr-1.5" />
              New Ticket
            </button>
          </div>
          
          <TicketList 
            tickets={tickets} 
            onSelectTicket={handleSelectTicket} 
            isLoading={isLoading} 
          />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded border border-gray-300 px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`rounded px-3 py-1 text-sm font-medium ${
                      currentPage === page
                        ? 'bg-violet-600 text-white'
                        : 'border border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded border border-gray-300 px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      )}
      
      {/* Create Ticket Form */}
      {showCreateTicket && (
        <CreateTicketForm 
          onClose={() => setShowCreateTicket(false)} 
          onSuccess={handleTicketCreated} 
        />
      )}
      
      {/* Ticket Detail View */}
      {selectedTicket && (
        <TicketDetail 
          ticket={selectedTicket} 
          onBack={() => setSelectedTicket(null)} 
          onRefresh={() => fetchTicketDetails(selectedTicket.id)} 
        />
      )}
    </div>
  );
} 