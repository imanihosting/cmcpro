"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FaExclamationTriangle,
  FaChartLine,
  FaExclamationCircle,
  FaClock,
  FaCalendarAlt,
  FaFilter,
  FaExternalLinkAlt
} from "react-icons/fa";
import { format, parseISO } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

// Define types for API response data
interface MonitoringData {
  summary: {
    totalRequests: number;
    totalResponses: number;
    totalErrors: number;
    totalPerformanceLogs: number;
    errorRate: number;
  };
  byType: Record<string, number>;
  byLevel: Record<string, number>;
  recentErrors: Array<{
    id: string;
    message: string;
    details: string | null;
    level: string;
    timestamp: string;
    path: string | null;
    source: string | null;
  }>;
  performance: {
    avgResponseTimes: Array<{
      path: string;
      avgDuration: number;
      requestCount: number;
    }>;
  };
  timeSeriesData: Array<{
    timestamp: string;
    requests: number;
    errors: number;
    avgDuration: number;
  }>;
}

export default function APIMonitoringPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(7); // Default to 7 days
  
  // Fetch monitoring data
  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/monitoring?timeRange=${timeRange}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching API monitoring data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setMonitoringData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch API monitoring data');
        console.error('Error fetching API monitoring data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if user is authenticated and has admin role
    if (status === "authenticated" && session?.user.role === "admin") {
      fetchMonitoringData();
    }
  }, [status, session, timeRange]);

  // Authentication check
  useEffect(() => {
    // Check if the user is authenticated and has the admin role
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
    if (timestamp.includes(' ')) {
      // Format hourly timestamp (YYYY-MM-DD HH:00)
      return format(parseISO(timestamp.replace(' ', 'T')), 'MMM d, HH:00');
    } else {
      // Format daily timestamp (YYYY-MM-DD)
      return format(parseISO(timestamp), 'MMM d');
    }
  };
  
  // Format date/time for display in error list
  const formatErrorTimestamp = (timestamp: string) => {
    return format(parseISO(timestamp), 'MMM d, yyyy HH:mm:ss');
  };
  
  // Handle time range change
  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days);
  };

  // Show loading state
  if (status === "loading" || (isLoading && !error)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">API Monitoring</h1>
        </div>
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <p>Failed to load API monitoring data: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">API Monitoring</h1>
        <div className="mt-4 flex items-center space-x-2 sm:mt-0">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => handleTimeRangeChange(1)}
              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium ${
                timeRange === 1
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-gray-300 rounded-l-md`}
            >
              24h
            </button>
            <button
              onClick={() => handleTimeRangeChange(7)}
              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium ${
                timeRange === 7
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border-t border-b border-gray-300`}
            >
              7d
            </button>
            <button
              onClick={() => handleTimeRangeChange(30)}
              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium ${
                timeRange === 30
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-gray-300 rounded-r-md`}
            >
              30d
            </button>
          </div>
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {/* Requests Card */}
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-blue-600">
              <FaChartLine className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">API Requests</h2>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-blue-800">{monitoringData?.summary.totalRequests.toLocaleString() || 0}</p>
            <p className="text-xs text-gray-700">Total in selected period</p>
          </div>
        </div>
        
        {/* Error Rate Card */}
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-red-100 text-red-600">
              <FaExclamationCircle className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Error Rate</h2>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-red-800">
              {monitoringData ? monitoringData.summary.errorRate.toFixed(2) + '%' : '0%'}
            </p>
            <p className="text-xs text-gray-700">Errors / Total Requests</p>
          </div>
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-gray-800">Total Errors:</span>
              <span className="font-medium text-gray-900">{monitoringData?.summary.totalErrors || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Response Time Card */}
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-green-100 text-green-600">
              <FaClock className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Avg Response Time</h2>
          </div>
          <div className="mb-2">
            {monitoringData?.timeSeriesData && monitoringData.timeSeriesData.length > 0 ? (
              <p className="text-2xl font-bold text-green-800">
                {(monitoringData.timeSeriesData.reduce((sum, item) => sum + (item.avgDuration || 0), 0) / 
                  monitoringData.timeSeriesData.filter(item => item.avgDuration !== undefined).length || 1).toFixed(2)} ms
              </p>
            ) : (
              <p className="text-2xl font-bold text-green-800">— ms</p>
            )}
            <p className="text-xs text-gray-700">Average across all endpoints</p>
          </div>
        </div>
        
        {/* Performance Logs Card */}
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-purple-100 text-purple-600">
              <FaFilter className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Performance Logs</h2>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-purple-800">{monitoringData?.summary.totalPerformanceLogs || 0}</p>
            <p className="text-xs text-gray-700">Total in selected period</p>
          </div>
        </div>
      </div>
      
      {/* API Metrics Charts */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Request Volume & Errors Chart */}
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Request Volume & Errors</h3>
          <div className="h-80 w-full">
            {monitoringData?.timeSeriesData && monitoringData.timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monitoringData.timeSeriesData.map(item => ({
                    ...item,
                    timestamp: formatTimestamp(item.timestamp)
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="requests"
                    name="Requests"
                    stroke="#3B82F6"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="errors"
                    name="Errors"
                    stroke="#EF4444"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-500">No data available for the selected time range</p>
              </div>
            )}
          </div>
        </div>
        
        {/* API Response Times Chart */}
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Response Times by Endpoint (ms)</h3>
          <div className="h-80 w-full">
            {monitoringData?.performance.avgResponseTimes && 
             monitoringData.performance.avgResponseTimes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monitoringData.performance.avgResponseTimes.map(item => ({
                    path: item.path || 'Unknown',
                    avgDuration: Math.round(item.avgDuration || 0),
                    requestCount: item.requestCount
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="path" 
                    tick={{ fontSize: 12 }} 
                    width={150}
                    tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                  />
                  <Tooltip 
                    formatter={(value: number | string, name: string) => [
                      name === 'avgDuration' ? `${value} ms` : value,
                      name === 'avgDuration' ? 'Average Duration' : 'Request Count'
                    ]}
                    labelFormatter={(label: string) => `Endpoint: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="avgDuration" 
                    name="Avg. Response Time" 
                    fill="#10B981" 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-500">No response time data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Recent Errors Section */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Recent Errors</h3>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
            {monitoringData?.recentErrors.length || 0} errors
          </span>
        </div>
        
        <div className="rounded-lg bg-white shadow-sm">
          {monitoringData?.recentErrors && monitoringData.recentErrors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Timestamp
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Level
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Message
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Path
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {monitoringData.recentErrors.map((error) => (
                    <tr key={error.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatErrorTimestamp(error.timestamp)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            error.level === "CRITICAL"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {error.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{error.message}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {error.path || '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {error.source || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-gray-500">No errors in the selected time range</p>
            </div>
          )}
        </div>
      </div>
      
      {/* External Links Section */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-bold text-gray-900">External Monitoring Tools</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* These would link to your actual monitoring tools */}
          <a
            href="#" // Add actual URL to your monitoring tool
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
          >
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 text-blue-600">
              <FaExternalLinkAlt className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">Logs Dashboard</h4>
              <p className="text-sm text-gray-600">View detailed log entries</p>
            </div>
          </a>
          
          <a
            href="#" // Add actual URL to your monitoring tool
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
          >
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-md bg-green-100 text-green-600">
              <FaExternalLinkAlt className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">Performance Dashboard</h4>
              <p className="text-sm text-gray-600">Advanced performance metrics</p>
            </div>
          </a>
          
          <a
            href="#" // Add actual URL to your monitoring tool
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
          >
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-md bg-purple-100 text-purple-600">
              <FaExternalLinkAlt className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">Infrastructure Monitor</h4>
              <p className="text-sm text-gray-600">View system performance metrics</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
} 