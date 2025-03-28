"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  FaCalendarAlt, 
  FaClock, 
  FaMoneyBillWave, 
  FaUser, 
  FaEye, 
  FaDownload,
  FaFilter,
  FaSort,
  FaSearch,
  FaTimes,
  FaEnvelope,
  FaShieldAlt,
  FaSpinner
} from "react-icons/fa";

interface ActivityItem {
  id: string;
  type: "booking" | "payment" | "message" | "profile" | "security" | "other";
  title: string;
  description: string;
  date: string;
  time: string;
  amount?: number;
  status?: "completed" | "pending" | "cancelled";
  childminder?: string;
  timestamp?: Date;
}

export default function ActivityPage() {
  const { data: session, status } = useSession();
  const [filter, setFilter] = useState("all");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (status === "authenticated") {
      fetchActivities();
    }
  }, [status, filter]);

  const fetchActivities = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/user/activity?filter=${filter}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity data');
      }
      
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Unable to load your activity history. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter activities based on search term
  const filteredActivities = searchTerm.trim() === '' 
    ? activities 
    : activities.filter(activity => 
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.childminder && activity.childminder.toLowerCase().includes(searchTerm.toLowerCase()))
      );

  // Render activity icon based on type
  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <FaCalendarAlt className="h-5 w-5 text-violet-600" />;
      case "payment":
        return <FaMoneyBillWave className="h-5 w-5 text-green-600" />;
      case "message":
        return <FaEnvelope className="h-5 w-5 text-blue-600" />;
      case "profile":
        return <FaUser className="h-5 w-5 text-orange-600" />;
      case "security":
        return <FaShieldAlt className="h-5 w-5 text-red-600" />;
      default:
        return <FaClock className="h-5 w-5 text-gray-600" />;
    }
  };

  // Render status badge
  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusClasses = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800"
    };
    
    return (
      <span className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Activity Log</h1>
        <p className="mt-1 text-sm text-gray-600">Track your booking history, payments, and account activity</p>
      </header>

      {/* Filters and search */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Filter:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-full px-3 py-1 text-sm ${
                  filter === "all"
                    ? "bg-violet-100 text-violet-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("booking")}
                className={`rounded-full px-3 py-1 text-sm ${
                  filter === "booking"
                    ? "bg-violet-100 text-violet-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Bookings
              </button>
              <button
                onClick={() => setFilter("payment")}
                className={`rounded-full px-3 py-1 text-sm ${
                  filter === "payment"
                    ? "bg-violet-100 text-violet-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Payments
              </button>
              <button
                onClick={() => setFilter("message")}
                className={`rounded-full px-3 py-1 text-sm ${
                  filter === "message"
                    ? "bg-violet-100 text-violet-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Messages
              </button>
              <button
                onClick={() => setFilter("profile")}
                className={`rounded-full px-3 py-1 text-sm ${
                  filter === "profile"
                    ? "bg-violet-100 text-violet-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setFilter("security")}
                className={`rounded-full px-3 py-1 text-sm ${
                  filter === "security"
                    ? "bg-violet-100 text-violet-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Security
              </button>
            </div>
          </div>
          <div className="relative w-full sm:w-auto">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border border-gray-300 py-1.5 pl-10 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:w-64"
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm('')}
              >
                <FaTimes className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activity list */}
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-medium text-gray-900">Recent Activity</h2>
          <div className="flex items-center">
            <button className="mr-2 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">
              <FaSort className="mr-1 inline h-4 w-4" /> Sort
            </button>
            <button className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">
              <FaDownload className="mr-1 inline h-4 w-4" /> Export
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="py-20 text-center">
            <FaSpinner className="mx-auto h-8 w-8 animate-spin text-violet-600" />
            <p className="mt-2 text-sm text-gray-500">Loading your activity history...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button 
              onClick={fetchActivities}
              className="mt-3 rounded-md bg-violet-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-violet-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredActivities.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                {searchTerm ? 'No activities matching your search.' : 'No activities found for the selected filter.'}
              </div>
            ) : (
              filteredActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                      {renderActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900">{activity.title}</h3>
                        {renderStatusBadge(activity.status)}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <FaCalendarAlt className="mr-1 h-3 w-3" />
                        <span>{activity.date}</span>
                        <span className="mx-1">•</span>
                        <FaClock className="mr-1 h-3 w-3" />
                        <span>{activity.time}</span>
                        {activity.amount && (
                          <>
                            <span className="mx-1">•</span>
                            <FaMoneyBillWave className="mr-1 h-3 w-3" />
                            <span>£{activity.amount.toFixed(2)}</span>
                          </>
                        )}
                        {activity.childminder && (
                          <>
                            <span className="mx-1">•</span>
                            <FaUser className="mr-1 h-3 w-3" />
                            <span>{activity.childminder}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                        <FaEye className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {activities.length > 10 && (
          <div className="border-t border-gray-200 px-4 py-3 text-right">
            <button className="text-sm font-medium text-violet-600 hover:text-violet-700">
              View All Activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 