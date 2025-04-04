"use client";

import { Suspense,  useState, useEffect, useCallback  } from 'react';
import { useRouter,  } from 'next/navigation';
import axios from "axios";
import { format } from "date-fns";
import {
  FaFilter,
  FaSearch,
  FaArrowUp,
  FaArrowDown,
  FaSpinner,
  FaExclamationTriangle,
  FaCheck,
  FaEye,
  FaPlus,
  FaSort,
  FaSync,
  FaEllipsisV,
} from "react-icons/fa";
import debounce from "lodash/debounce";
import Link from "next/link";
import { toast } from "react-hot-toast";
import TicketDetailModal from "./components/TicketDetailModal";
import CreateTicketModal from "./components/CreateTicketModal";
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';

// Define ticket status and priority colors
const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

// Interface for a support ticket
interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  respondedBy: string | null;
  description?: string;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

// Interface for admin user
interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

function AdminSupportPageContent() {
  // State for tickets and pagination
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalTickets, setTotalTickets] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // State for filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: "",
    endDate: "",
  });

  // State for sorting
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // State for modals
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // State for admin users (for assignment)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  
  // Debug state to see API response
  const [apiResponseDebug, setApiResponseDebug] = useState<any>(null);

  const router = useRouter();
  const { searchParams, SearchParamsListener } = useSafeSearchParams();

  // Initialize state from URL params on page load
  useEffect(() => {
    if (!searchParams) return;
    
    const urlPage = searchParams.get("page");
    const urlStatus = searchParams.get("status");
    const urlPriority = searchParams.get("priority");
    const urlAssignee = searchParams.get("assignee");
    const urlQuery = searchParams.get("q");
    const urlSortBy = searchParams.get("sortBy");
    const urlSortOrder = searchParams.get("sortOrder");

    if (urlPage) setPage(parseInt(urlPage));
    if (urlStatus) setStatusFilter(urlStatus);
    if (urlPriority) setPriorityFilter(urlPriority);
    if (urlAssignee) setAssigneeFilter(urlAssignee);
    if (urlQuery) setSearchQuery(urlQuery);
    if (urlSortBy) setSortBy(urlSortBy);
    if (urlSortOrder) setSortOrder(urlSortOrder);

    // Load admin users for assignee dropdown
    fetchAdminUsers();
    
    // Initial tickets fetch
    fetchTickets();
  }, [searchParams]);

  // Update URL params when filters change
  useEffect(() => {
    updateUrlParams();
  }, [page, statusFilter, priorityFilter, assigneeFilter, searchQuery, sortBy, sortOrder]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setPage(1); // Reset to first page on new search
    }, 500),
    []
  );

  // Fetch admin users for assignment dropdown
  const fetchAdminUsers = async () => {
    try {
      const response = await axios.get("/api/admin/users?role=admin");
      setAdminUsers(response.data.users || []);
    } catch (err) {
      console.error("Error fetching admin users:", err);
      toast.error("Failed to load admin users.");
    }
  };

  // Update URL with current filters
  const updateUrlParams = () => {
    const params = new URLSearchParams();
    
    if (page > 1) params.set("page", page.toString());
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (assigneeFilter) params.set("assignee", assigneeFilter);
    if (searchQuery) params.set("q", searchQuery);
    if (sortBy !== "createdAt") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
    
    const url = `${window.location.pathname}?${params.toString()}`;
    router.replace(url, { scroll: false });
  };

  // Fetch tickets with current filters
  const fetchTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      let url: string;
      let params: Record<string, any> = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      // Add filters if they exist
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (assigneeFilter) params.assignee = assigneeFilter;
      if (dateRangeFilter.startDate) params.startDate = dateRangeFilter.startDate;
      if (dateRangeFilter.endDate) params.endDate = dateRangeFilter.endDate;

      // If search query exists, use search endpoint
      if (searchQuery) {
        url = `/api/admin/support/search`;
        params.q = searchQuery;
      } else {
        url = `/api/admin/support`;
      }

      const response = await axios.get(url, { params });
      
      // Debug: Log the API response
      console.log('API Response:', response.data);
      setApiResponseDebug(response.data);
      
      setTickets(response.data.tickets || []);
      setTotalTickets(response.data.pagination?.total || 0);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError("Failed to load support tickets. Please try again.");
      toast.error("Failed to load support tickets.");
    } finally {
      setLoading(false);
    }
  };

  // Handle ticket selection for detail view
  const handleSelectTicket = async (ticketId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/support/${ticketId}`);
      console.log('Ticket details response:', response.data);
      setSelectedTicket(response.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error("Error fetching ticket details:", err);
      toast.error("Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh tickets after an action
  const refreshTickets = () => {
    fetchTickets();
  };

  // Handle creating a new ticket
  const handleCreateTicket = (ticketData: any) => {
    console.log('Created ticket:', ticketData);
    setIsCreateModalOpen(false);
    refreshTickets();
  };

  // Handle column sort toggle
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (err) {
      return "Invalid date";
    }
  };

  return (
    <div>
      <SearchParamsListener />
      <div className="container mx-auto px-2 py-2 md:px-4 md:py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Support Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage user support tickets and inquiries
          </p>
        </div>
        
        {/* Debug info */}
        {apiResponseDebug && (
          <div className="mb-4 p-4 bg-gray-100 rounded overflow-auto max-h-60">
            <h3 className="font-medium text-gray-900 mb-2">API Response Debug:</h3>
            <pre className="text-xs">{JSON.stringify(apiResponseDebug, null, 2)}</pre>
          </div>
        )}

        {/* Controls row */}
        <div className="mb-6 space-y-4">
          {/* Search and Create button */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search tickets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                onChange={(e) => debouncedSearch(e.target.value)}
                defaultValue={searchQuery}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              <FaPlus className="h-4 w-4" />
              <span>Create Ticket</span>
            </button>
            <button
              onClick={refreshTickets}
              className="flex items-center justify-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              <FaSync className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              {/* Priority filter */}
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              {/* Assignee filter */}
              <select
                value={assigneeFilter}
                onChange={(e) => {
                  setAssigneeFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500 col-span-2 md:col-span-1"
              >
                <option value="">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {adminUsers.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name || admin.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tickets table/list */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          {loading && !tickets.length ? (
            <div className="p-6 text-center">
              <FaSpinner className="animate-spin h-8 w-8 mx-auto text-violet-600 mb-4" />
              <p className="text-gray-500">Loading tickets...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <FaExclamationTriangle className="h-8 w-8 mx-auto text-red-500 mb-4" />
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchTickets}
                className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              >
                Try Again
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">No tickets found.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              >
                Create New Ticket
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("id")}
                      >
                        <div className="flex items-center gap-1">
                          ID
                          {sortBy === "id" ? (
                            sortOrder === "asc" ? (
                              <FaArrowUp className="h-3 w-3" />
                            ) : (
                              <FaArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <FaSort className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("subject")}
                      >
                        <div className="flex items-center gap-1">
                          Subject
                          {sortBy === "subject" ? (
                            sortOrder === "asc" ? (
                              <FaArrowUp className="h-3 w-3" />
                            ) : (
                              <FaArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <FaSort className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Submitter
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortBy === "status" ? (
                            sortOrder === "asc" ? (
                              <FaArrowUp className="h-3 w-3" />
                            ) : (
                              <FaArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <FaSort className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("priority")}
                      >
                        <div className="flex items-center gap-1">
                          Priority
                          {sortBy === "priority" ? (
                            sortOrder === "asc" ? (
                              <FaArrowUp className="h-3 w-3" />
                            ) : (
                              <FaArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <FaSort className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center gap-1">
                          Created
                          {sortBy === "createdAt" ? (
                            sortOrder === "asc" ? (
                              <FaArrowUp className="h-3 w-3" />
                            ) : (
                              <FaArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <FaSort className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSelectTicket(ticket.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.id.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 line-clamp-1">
                            {ticket.subject}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {ticket.userName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {ticket.userEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              statusColors[ticket.status] || "bg-gray-100"
                            }`}
                          >
                            {ticket.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              priorityColors[ticket.priority] || "bg-gray-100"
                            }`}
                          >
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(ticket.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTicket(ticket.id);
                            }}
                            className="text-violet-600 hover:text-violet-900 px-2 py-1 rounded hover:bg-violet-50"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="px-4 py-3 hover:bg-gray-50"
                    onClick={() => handleSelectTicket(ticket.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                        {ticket.subject}
                      </h3>
                      <div className="flex">
                        <span
                          className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                            priorityColors[ticket.priority] || "bg-gray-100"
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2 flex justify-between">
                      <span>ID: {ticket.id.substring(0, 8)}...</span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          statusColors[ticket.status] || "bg-gray-100"
                        }`}
                      >
                        {ticket.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <div>From: {ticket.userName}</div>
                      <div>{formatDate(ticket.createdAt).split(' ')[0]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {tickets.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 mb-4">
            <div className="text-sm text-gray-700 mb-4 md:mb-0">
              Showing{" "}
              <span className="font-medium">
                {Math.min((page - 1) * limit + 1, totalTickets)}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(page * limit, totalTickets)}
              </span>{" "}
              of <span className="font-medium">{totalTickets}</span> tickets
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(page - 1, 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md ${
                  page === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 rounded-md ${
                      page === pageNum
                        ? "bg-violet-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(page + 1, totalPages))}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-md ${
                  page === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Ticket Detail Modal */}
        {isDetailModalOpen && selectedTicket && (
          <TicketDetailModal
            ticket={selectedTicket}
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedTicket(null);
            }}
            onTicketUpdated={refreshTickets}
            adminUsers={adminUsers}
          />
        )}

        {/* Create Ticket Modal */}
        {isCreateModalOpen && (
          <CreateTicketModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onTicketCreated={handleCreateTicket}
          />
        )}
      </div>
    </div>
  );
} 
export default function AdminSupportPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
    </div>}>
      <AdminSupportPageContent />
    </Suspense>
  );
}