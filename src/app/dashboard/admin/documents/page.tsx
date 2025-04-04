"use client";

import { Suspense,  useEffect, useState, useCallback  } from 'react';
import { useSession } from "next-auth/react";
import { useRouter,  } from 'next/navigation';
import { format } from "date-fns";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaFile,
  FaFilter,
  FaSearch,
  FaSpinner,
  FaEye,
  FaCheck,
  FaTimes,
  FaDownload,
  FaFileAlt,
  FaExclamationTriangle,
} from "react-icons/fa";

// Types
type Document = {
  id: string;
  name: string;
  type: string;
  category: string | null;
  description: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  reviewDate: Date | null;
  fileSize: number | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  reviewer: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

type Filters = {
  userId?: string;
  userEmail?: string;
  userName?: string;
  documentType?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  fromDate?: string;
  toDate?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

// Document Detail Modal component will be defined separately
import DocumentDetailModal from "./DocumentDetailModal";
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';

function AdminDocumentsPageContent() {
  // State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [filters, setFilters] = useState<Filters>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Hooks
  const { data: session, status } = useSession();
  const router = useRouter();
  const { searchParams, SearchParamsListener } = useSafeSearchParams();

  // Function to fetch documents with filtering and pagination
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters for API call
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      
      // Add filters if they exist
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.userEmail) params.append("userEmail", filters.userEmail);
      if (filters.userName) params.append("userName", filters.userName);
      if (filters.documentType) params.append("documentType", filters.documentType);
      if (filters.status) params.append("status", filters.status);
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      
      const response = await axios.get(`/api/admin/documents?${params.toString()}`);
      
      // Format dates
      const formattedDocuments = response.data.documents.map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        reviewDate: doc.reviewDate ? new Date(doc.reviewDate) : null,
      }));
      
      setDocuments(formattedDocuments);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error("Error fetching documents:", err);
      setError(err.response?.data?.error || "Failed to fetch documents");
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);
  
  // Effect to fetch documents when params change
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
  
  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && session.user.role !== "admin") {
      if (session.user.role === "parent") {
        router.push("/dashboard/parent");
      } else if (session.user.role === "childminder") {
        router.push("/dashboard/childminder");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);
  
  // Function to open document details modal
  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setIsDetailModalOpen(true);
  };
  
  // Function to handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };
  
  // Function to handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Function to handle search (applies to user name/email)
  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      userName: searchQuery || undefined,
    }));
    setPagination((prev) => ({
      ...prev,
      page: 1, // Reset to first page on new search
    }));
  };
  
  // Function to clear filters
  const handleClearFilters = () => {
    setFilters({
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setSearchQuery("");
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };
  
  // Function to format file size
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };
  
  // Show loading state while checking authentication or loading data
  if (status === "loading" || (loading && !error && documents.length === 0)) {
    return (
      <div>
        <SearchParamsListener />
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Documents Management</h1>
        <div className="mt-2 flex items-center sm:mt-0">
          <span className="mr-2 inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-green-500"></span>
          <span className="text-sm text-gray-700">Admin Access</span>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Search and Filter Controls */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
          {/* Search */}
          <div className="flex flex-1 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by user name..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 pl-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaSearch />
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="ml-2 flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              Search
            </button>
          </div>
          
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <FaFilter className="mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          
          {/* Refresh */}
          <button
            onClick={() => fetchDocuments()}
            className="flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? (
              <FaSpinner className="mr-2 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh
          </button>
        </div>
        
        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Status</label>
              <select
                name="status"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                value={filters.status || ""}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700">Document Type</label>
              <input
                type="text"
                name="documentType"
                placeholder="e.g. Certificate, ID"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                value={filters.documentType || ""}
                onChange={handleFilterChange}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700">From Date</label>
              <input
                type="date"
                name="fromDate"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                value={filters.fromDate || ""}
                onChange={handleFilterChange}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700">To Date</label>
              <input
                type="date"
                name="toDate"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                value={filters.toDate || ""}
                onChange={handleFilterChange}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700">Sort By</label>
              <select
                name="sortBy"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                value={filters.sortBy}
                onChange={handleFilterChange}
              >
                <option value="createdAt">Upload Date</option>
                <option value="name">Document Name</option>
                <option value="status">Status</option>
                <option value="type">Type</option>
                <option value="updatedAt">Last Updated</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700">Sort Order</label>
              <select
                name="sortOrder"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                value={filters.sortOrder}
                onChange={handleFilterChange}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            
            <div className="flex items-end md:col-span-2">
              <button
                onClick={handleClearFilters}
                className="flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Documents Table */}
      <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Document
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Uploaded
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Size
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {documents.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No documents found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                documents.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <FaFileAlt className="mr-2 text-gray-400" />
                        <span className="font-medium text-gray-900">{document.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {document.user ? (
                        <div>
                          <div className="font-medium text-gray-900">{document.user.name}</div>
                          <div className="text-xs text-gray-500">{document.user.email}</div>
                        </div>
                      ) : (
                        "Unknown User"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {document.type}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          document.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : document.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {document.status === "APPROVED"
                          ? "Approved"
                          : document.status === "REJECTED"
                          ? "Rejected"
                          : "Pending"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {format(document.createdAt, "MMM d, yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatFileSize(document.fileSize)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDocument(document)}
                        className="mr-2 text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Loading indicator for table */}
        {loading && documents.length > 0 && (
          <div className="flex justify-center p-4">
            <FaSpinner className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        )}
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium ${
                      pagination.page === 1
                        ? "cursor-not-allowed text-gray-300"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === pagination.pages ||
                        (page >= pagination.page - 1 && page <= pagination.page + 1)
                    )
                    .map((page, index, array) => {
                      const showEllipsis = index > 0 && page - array[index - 1] > 1;
                      
                      return (
                        <div key={page}>
                          {showEllipsis && (
                            <span className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium ${
                              page === pagination.page
                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                : "bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className={`relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium ${
                      pagination.page === pagination.pages
                        ? "cursor-not-allowed text-gray-300"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Document Detail Modal */}
      {isDetailModalOpen && selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedDocument(null);
          }}
          onStatusChange={() => fetchDocuments()}
        />
      )}
    </div>
  );
} 
export default function AdminDocumentsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
    </div>}>
      <AdminDocumentsPageContent />
    </Suspense>
  );
}