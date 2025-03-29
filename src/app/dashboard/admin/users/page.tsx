"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { 
  FaUserCog, 
  FaSearch, 
  FaFilter, 
  FaSortAmountDown, 
  FaSortAmountUp,
  FaEye, 
  FaEdit, 
  FaKey,
  FaExclamationTriangle 
} from "react-icons/fa";
import { format } from "date-fns";
import { User_role } from "@prisma/client";
import { debounce } from "lodash";

// Import the modal components
import ViewUserModal from "./components/ViewUserModal";
import EditUserModal from "./components/EditUserModal";
import ResetPasswordModal from "./components/ResetPasswordModal";

// Types for user data
type User = {
  id: string;
  name: string | null;
  email: string;
  role: User_role;
  emailVerified: Date | null;
  createdAt: string;
  updatedAt: string;
  subscriptionStatus: string;
  image: string | null;
  profileImage: string | null;
};

// Types for pagination
type Pagination = {
  totalUsers: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type UserListResponse = {
  users: User[];
  pagination: Pagination;
};

// User status type
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export default function UserManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // States for user data and UI
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for filtering and sorting
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // States for modals
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailedUserData, setDetailedUserData] = useState<any | null>(null);
  
  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearch(query);
      setPage(1); // Reset to first page when search changes
    }, 500),
    []
  );
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };
  
  // Function to fetch users with filters
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Build the query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.statusText}`);
      }
      
      const data: UserListResponse = await response.json();
      
      setUsers(data.users);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching users');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, roleFilter, statusFilter, sortBy, sortOrder]);
  
  // Fetch detailed user info
  const fetchUserDetails = async (userId: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching user details: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setDetailedUserData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching user details');
      console.error('Error fetching user details:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Functions for pagination
  const goToPage = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };
  
  // Functions for sorting
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  
  // Modal control functions
  const openViewModal = (user: User) => {
    setSelectedUser(user);
    fetchUserDetails(user.id);
    setIsViewModalOpen(true);
  };
  
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    fetchUserDetails(user.id);
    setIsEditModalOpen(true);
  };
  
  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordModalOpen(true);
  };
  
  const closeModals = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsResetPasswordModalOpen(false);
    setSelectedUser(null);
    setDetailedUserData(null);
  };
  
  // Function to get user status based on emailVerified field
  const getUserStatus = (user: User): UserStatus => {
    if (!user.emailVerified) {
      return 'INACTIVE';
    }
    // We would need a suspended field in the User model
    // For now, just using active/inactive
    return 'ACTIVE';
  };
  
  // Fetch users when dependencies change
  useEffect(() => {
    if (status === "authenticated" && session?.user.role === "admin") {
      fetchUsers();
    }
  }, [status, session, fetchUsers]);
  
  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    
    if (status === "authenticated" && session.user.role !== "admin") {
      // Redirect based on role
      if (session.user.role === "parent") {
        router.push("/dashboard/parent");
      } else if (session.user.role === "childminder") {
        router.push("/dashboard/childminder");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);
  
  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">User Management</h1>
      </div>
      
      {/* Error message if needed */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Filters and Search */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Search by name or email"
              onChange={handleSearchChange}
            />
          </div>
          
          {/* Role Filter */}
          <div>
            <label htmlFor="role-filter" className="mb-1 block text-xs font-medium text-gray-700">
              Role
            </label>
            <select
              id="role-filter"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Roles</option>
              <option value="parent">Parent</option>
              <option value="childminder">Childminder</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="mb-1 block text-xs font-medium text-gray-700">
              Status
            </label>
            <select
              id="status-filter"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          
          {/* Page Size */}
          <div>
            <label htmlFor="page-size" className="mb-1 block text-xs font-medium text-gray-700">
              Show per page
            </label>
            <select
              id="page-size"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer"
                  onClick={() => toggleSort('email')}
                >
                  <div className="flex items-center">
                    Email
                    {sortBy === 'email' && (
                      sortOrder === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer"
                  onClick={() => toggleSort('role')}
                >
                  <div className="flex items-center">
                    Role
                    {sortBy === 'role' && (
                      sortOrder === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer"
                  onClick={() => toggleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Registered On
                    {sortBy === 'createdAt' && (
                      sortOrder === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading && !users.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {user.name || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'childminder' ? 'bg-green-100 text-green-800' :
                        user.role === 'parent' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                        getUserStatus(user) === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        getUserStatus(user) === 'INACTIVE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getUserStatus(user)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openViewModal(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit User"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => openResetPasswordModal(user)}
                          className="text-amber-600 hover:text-amber-900"
                          title="Reset Password"
                        >
                          <FaKey />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Controls */}
      {pagination && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.pageSize + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalUsers)}
            </span>{" "}
            of <span className="font-medium">{pagination.totalUsers}</span> users
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={() => goToPage(1)}
              disabled={!pagination.hasPreviousPage}
              className={`rounded-md px-2 py-1 text-sm ${
                pagination.hasPreviousPage
                  ? "text-gray-700 hover:bg-gray-100"
                  : "cursor-not-allowed text-gray-400"
              }`}
            >
              First
            </button>
            <button
              onClick={() => goToPage(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
              className={`rounded-md px-2 py-1 text-sm ${
                pagination.hasPreviousPage
                  ? "text-gray-700 hover:bg-gray-100"
                  : "cursor-not-allowed text-gray-400"
              }`}
            >
              Previous
            </button>
            
            {/* Page numbers */}
            <div className="flex">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => goToPage(pageNum)}
                    className={`rounded-md px-3 py-1 text-sm ${
                      pagination.currentPage === pageNum
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => goToPage(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className={`rounded-md px-2 py-1 text-sm ${
                pagination.hasNextPage
                  ? "text-gray-700 hover:bg-gray-100"
                  : "cursor-not-allowed text-gray-400"
              }`}
            >
              Next
            </button>
            <button
              onClick={() => goToPage(pagination.totalPages)}
              disabled={!pagination.hasNextPage}
              className={`rounded-md px-2 py-1 text-sm ${
                pagination.hasNextPage
                  ? "text-gray-700 hover:bg-gray-100"
                  : "cursor-not-allowed text-gray-400"
              }`}
            >
              Last
            </button>
          </div>
        </div>
      )}
      
      {/* View User Details Modal */}
      <ViewUserModal
        userData={detailedUserData}
        isOpen={isViewModalOpen}
        onClose={closeModals}
      />
      
      {/* Edit User Modal */}
      <EditUserModal
        userData={detailedUserData}
        isOpen={isEditModalOpen}
        onClose={closeModals}
        onSuccess={fetchUsers}
      />
      
      {/* Reset Password Modal */}
      <ResetPasswordModal
        userData={selectedUser}
        isOpen={isResetPasswordModalOpen}
        onClose={closeModals}
      />
    </div>
  );
} 