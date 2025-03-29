"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FaExclamationTriangle,
  FaFileAlt,
  FaExclamationCircle,
  FaInfoCircle,
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaRedo,
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaBug,
  FaServer,
  FaLock,
  FaClock,
  FaUserCircle
} from "react-icons/fa";
import { format, parseISO } from "date-fns";
// import { motion } from "framer-motion"; // Remove or comment out this import

// Define types for API response data
interface SystemLog {
  id: string;
  type: string;
  level: string;
  message: string;
  details: string | null;
  source: string | null;
  timestamp: string;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  path: string | null;
  duration: number | null;
}

interface LogsResponse {
  logs: SystemLog[];
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    byLevel: Record<string, number>;
    byType: Record<string, number>;
  };
}

// Log type icon mapping
const logTypeIcons: Record<string, JSX.Element> = {
  API_REQUEST: <FaServer className="h-5 w-5" />,
  API_RESPONSE: <FaServer className="h-5 w-5" />,
  ERROR: <FaBug className="h-5 w-5" />,
  SECURITY: <FaLock className="h-5 w-5" />,
  PERFORMANCE: <FaClock className="h-5 w-5" />,
  AUDIT: <FaFileAlt className="h-5 w-5" />,
  SYSTEM: <FaServer className="h-5 w-5" />,
  USER: <FaUserCircle className="h-5 w-5" />
};

// Log level badge component
const LogLevelBadge = ({ level }: { level: string }) => {
  const badgeClasses = {
    DEBUG: "bg-gray-200 text-gray-800",
    INFO: "bg-blue-200 text-blue-800",
    WARNING: "bg-yellow-200 text-yellow-800",
    ERROR: "bg-red-200 text-red-800",
    CRITICAL: "bg-red-600 text-white"
  };

  const levelIcons = {
    DEBUG: <FaInfoCircle className="h-3 w-3 mr-1" />,
    INFO: <FaInfoCircle className="h-3 w-3 mr-1" />,
    WARNING: <FaExclamationTriangle className="h-3 w-3 mr-1" />,
    ERROR: <FaExclamationCircle className="h-3 w-3 mr-1" />,
    CRITICAL: <FaExclamationCircle className="h-3 w-3 mr-1" />
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClasses[level as keyof typeof badgeClasses] || "bg-gray-200 text-gray-800"}`}>
      {levelIcons[level as keyof typeof levelIcons]}
      {level}
    </span>
  );
};

export default function SystemLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logsData, setLogsData] = useState<LogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    timeRange: 7,
    level: "",
    type: "",
    query: "",
    page: 1
  });
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  
  // Fetch logs data
  useEffect(() => {
    const fetchLogsData = async () => {
      try {
        setIsLoading(true);
        
        // Build query string from filters
        const params = new URLSearchParams();
        params.append("timeRange", filters.timeRange.toString());
        if (filters.level) params.append("level", filters.level);
        if (filters.type) params.append("type", filters.type);
        if (filters.query) params.append("query", filters.query);
        params.append("page", filters.page.toString());
        
        const response = await fetch(`/api/admin/logs?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching logs: ${response.statusText}`);
        }
        
        const data = await response.json();
        setLogsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch logs');
        console.error('Error fetching logs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if user is authenticated and has admin role
    if (status === "authenticated" && session?.user.role === "admin") {
      fetchLogsData();
    }
  }, [status, session, filters]);

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && session.user.role !== "admin") {
      // Redirect to appropriate dashboard based on role
      if (session.user.role === "parent") {
        router.push("/dashboard/parent");
      } else if (session.user.role === "childminder") {
        router.push("/dashboard/childminder");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    return format(parseISO(timestamp), 'MMM d, yyyy HH:mm:ss');
  };
  
  // Handle filter changes
  const handleFilterChange = (key: keyof typeof filters, value: string | number) => {
    // Reset to page 1 when changing filters (except when changing page)
    if (key !== 'page') {
      setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value as number }));
    }
  };
  
  // Toggle log details expansion
  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prevState => {
      const newState = new Set(prevState);
      if (newState.has(logId)) {
        newState.delete(logId);
      } else {
        newState.add(logId);
      }
      return newState;
    });
  };
  
  // Handle reset filters
  const resetFilters = () => {
    setFilters({
      timeRange: 7,
      level: "",
      type: "",
      query: "",
      page: 1
    });
  };

  // Show loading state
  if (status === "loading" || (isLoading && !error)) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">System Logs</h1>
        </div>
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <p>Failed to load system logs: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">System Logs</h1>
        <div className="mt-4 flex items-center space-x-2 sm:mt-0">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => handleFilterChange('timeRange', 1)}
              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium ${
                filters.timeRange === 1
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-gray-300 rounded-l-md`}
            >
              24h
            </button>
            <button
              onClick={() => handleFilterChange('timeRange', 7)}
              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium ${
                filters.timeRange === 7
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border-t border-b border-gray-300`}
            >
              7d
            </button>
            <button
              onClick={() => handleFilterChange('timeRange', 30)}
              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium ${
                filters.timeRange === 30
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-gray-300 rounded-r-md`}
            >
              30d
            </button>
          </div>
        </div>
      </div>
      
      {/* Filter and search section */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-12">
          {/* Log Level Filter */}
          <div className="md:col-span-3">
            <label htmlFor="logLevel" className="mb-1 block text-sm font-medium text-gray-700">
              Log Level
            </label>
            <select
              id="logLevel"
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Levels</option>
              <option value="DEBUG">Debug</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          
          {/* Log Type Filter */}
          <div className="md:col-span-3">
            <label htmlFor="logType" className="mb-1 block text-sm font-medium text-gray-700">
              Log Type
            </label>
            <select
              id="logType"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="API_REQUEST">API Request</option>
              <option value="API_RESPONSE">API Response</option>
              <option value="ERROR">Error</option>
              <option value="SECURITY">Security</option>
              <option value="PERFORMANCE">Performance</option>
              <option value="AUDIT">Audit</option>
              <option value="SYSTEM">System</option>
              <option value="USER">User</option>
            </select>
          </div>
          
          {/* Search Query */}
          <div className="md:col-span-4">
            <label htmlFor="searchQuery" className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="searchQuery"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                placeholder="Search in messages, details..."
                className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-end space-x-2 md:col-span-2">
            <button
              onClick={resetFilters}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <FaFilter className="mr-2 h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {/* Logs Summary */}
      {logsData && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Logs Card */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                <FaFileAlt className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Logs</p>
                <p className="text-lg font-semibold text-gray-900">{logsData.meta.totalCount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Errors Card */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-red-100 text-red-600">
                <FaExclamationCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Errors</p>
                <p className="text-lg font-semibold text-gray-900">
                  {((logsData.summary.byLevel.ERROR || 0) + (logsData.summary.byLevel.CRITICAL || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Warnings Card */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-yellow-100 text-yellow-600">
                <FaExclamationTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Warnings</p>
                <p className="text-lg font-semibold text-gray-900">
                  {(logsData.summary.byLevel.WARNING || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Info/Debug Card */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-green-100 text-green-600">
                <FaInfoCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Info/Debug</p>
                <p className="text-lg font-semibold text-gray-900">
                  {((logsData.summary.byLevel.INFO || 0) + (logsData.summary.byLevel.DEBUG || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Logs Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        {logsData && logsData.logs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Level
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Timestamp
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Message
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Source
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Path
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {logsData.logs.map((log) => {
                    // Create the log row and details row if expanded
                    const logRow = (
                      <tr 
                        key={log.id}
                        onClick={() => toggleLogExpansion(log.id)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          <LogLevelBadge level={log.level} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="mr-2 text-gray-500">
                              {logTypeIcons[log.type] || <FaServer className="h-5 w-5" />}
                            </span>
                            <span>{log.type.replace(/_/g, ' ')}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-md truncate">{log.message}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {log.source || '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {log.path || '-'}
                        </td>
                      </tr>
                    );
                    
                    // Details row if expanded
                    const detailsRow = expandedLogs.has(log.id) ? (
                      <tr key={`${log.id}-details`}>
                        <td colSpan={6} className="px-6 py-4">
                          <div className="rounded-md bg-gray-50 p-4">
                            <div className="mb-2 flex flex-wrap gap-3 text-sm">
                              {log.userId && (
                                <div>
                                  <span className="font-medium">User ID:</span> {log.userId}
                                </div>
                              )}
                              {log.ipAddress && (
                                <div>
                                  <span className="font-medium">IP Address:</span> {log.ipAddress}
                                </div>
                              )}
                              {log.duration !== null && (
                                <div>
                                  <span className="font-medium">Duration:</span> {log.duration}ms
                                </div>
                              )}
                            </div>
                            {log.details && (
                              <div>
                                <h4 className="mb-1 text-sm font-medium">Details:</h4>
                                <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-gray-100 p-3 text-xs font-mono text-gray-800">
                                  {log.details}
                                </pre>
                              </div>
                            )}
                            {log.userAgent && (
                              <div className="mt-3">
                                <h4 className="mb-1 text-sm font-medium">User Agent:</h4>
                                <div className="text-xs text-gray-600">
                                  {log.userAgent}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null;
                    
                    // Return both rows
                    return [logRow, detailsRow];
                  }).flat().filter(Boolean)}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {logsData.meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                    disabled={!logsData.meta.hasPrevPage}
                    className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                      logsData.meta.hasPrevPage ? "text-gray-700 hover:bg-gray-50" : "text-gray-300"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleFilterChange('page', Math.min(logsData.meta.totalPages, filters.page + 1))}
                    disabled={!logsData.meta.hasNextPage}
                    className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                      logsData.meta.hasNextPage ? "text-gray-700 hover:bg-gray-50" : "text-gray-300"
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{logsData.logs.length > 0 ? (filters.page - 1) * logsData.meta.limit + 1 : 0}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(filters.page * logsData.meta.limit, logsData.meta.totalCount)}
                      </span>{" "}
                      of <span className="font-medium">{logsData.meta.totalCount}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => handleFilterChange('page', 1)}
                        disabled={!logsData.meta.hasPrevPage}
                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                          logsData.meta.hasPrevPage ? "bg-white text-gray-500 hover:bg-gray-50" : "bg-gray-100 text-gray-300"
                        } border border-gray-300 focus:z-20`}
                      >
                        <span className="sr-only">First</span>
                        <FaAngleDoubleLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                        disabled={!logsData.meta.hasPrevPage}
                        className={`relative inline-flex items-center px-2 py-2 ${
                          logsData.meta.hasPrevPage ? "bg-white text-gray-500 hover:bg-gray-50" : "bg-gray-100 text-gray-300"
                        } border border-gray-300 focus:z-20`}
                      >
                        <span className="sr-only">Previous</span>
                        <FaAngleLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Current Page Indicator */}
                      <span className="relative inline-flex items-center border border-gray-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600">
                        {filters.page}
                      </span>
                      
                      <button
                        onClick={() => handleFilterChange('page', Math.min(logsData.meta.totalPages, filters.page + 1))}
                        disabled={!logsData.meta.hasNextPage}
                        className={`relative inline-flex items-center px-2 py-2 ${
                          logsData.meta.hasNextPage ? "bg-white text-gray-500 hover:bg-gray-50" : "bg-gray-100 text-gray-300"
                        } border border-gray-300 focus:z-20`}
                      >
                        <span className="sr-only">Next</span>
                        <FaAngleRight className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleFilterChange('page', logsData.meta.totalPages)}
                        disabled={!logsData.meta.hasNextPage}
                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                          logsData.meta.hasNextPage ? "bg-white text-gray-500 hover:bg-gray-50" : "bg-gray-100 text-gray-300"
                        } border border-gray-300 focus:z-20`}
                      >
                        <span className="sr-only">Last</span>
                        <FaAngleDoubleRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FaFileAlt className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-1 text-lg font-medium text-gray-900">No logs found</h3>
            <p className="text-sm text-gray-500">
              {filters.query || filters.level || filters.type ? "Try changing your filters" : "No system logs are available for the selected time period"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 