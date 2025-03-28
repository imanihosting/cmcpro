"use client";

import { useState } from "react";
import { 
  FaCalendarAlt, 
  FaClock, 
  FaMoneyBillWave, 
  FaUser, 
  FaEye, 
  FaDownload,
  FaFilter,
  FaSort,
  FaSearch
} from "react-icons/fa";

interface ActivityItem {
  id: number;
  type: "booking" | "payment" | "message" | "profile";
  title: string;
  description: string;
  date: string;
  time: string;
  amount?: number;
  status?: "completed" | "pending" | "cancelled";
  childminder?: string;
}

export default function ActivityPage() {
  const [filter, setFilter] = useState("all");
  
  // Placeholder activity data
  const activities: ActivityItem[] = [
    {
      id: 1,
      type: "booking",
      title: "Booking Confirmed",
      description: "Childcare booking with Sarah Johnson has been confirmed",
      date: "April 15, 2024",
      time: "14:32",
      childminder: "Sarah Johnson",
      status: "completed"
    },
    {
      id: 2,
      type: "payment",
      title: "Payment Processed",
      description: "Payment for childcare services with Sarah Johnson",
      date: "April 15, 2024",
      time: "14:33",
      amount: 85.50,
      status: "completed"
    },
    {
      id: 3,
      type: "message",
      title: "New Message",
      description: "You received a message from David Williams",
      date: "April 12, 2024",
      time: "09:15",
      childminder: "David Williams"
    },
    {
      id: 4,
      type: "booking",
      title: "Booking Requested",
      description: "You requested a booking with Emma Thompson",
      date: "April 10, 2024",
      time: "16:45",
      childminder: "Emma Thompson",
      status: "pending"
    },
    {
      id: 5,
      type: "profile",
      title: "Profile Updated",
      description: "You updated your children's profiles",
      date: "April 8, 2024",
      time: "11:20"
    },
    {
      id: 6,
      type: "booking",
      title: "Booking Cancelled",
      description: "Childcare booking with Michael Brown was cancelled",
      date: "April 5, 2024",
      time: "13:10",
      childminder: "Michael Brown",
      status: "cancelled"
    },
    {
      id: 7,
      type: "payment",
      title: "Subscription Renewed",
      description: "Your monthly subscription was renewed automatically",
      date: "April 1, 2024",
      time: "00:05",
      amount: 19.99,
      status: "completed"
    }
  ];

  // Filter activities based on selected filter
  const filteredActivities = filter === "all" 
    ? activities 
    : activities.filter(activity => activity.type === filter);

  // Render activity icon based on type
  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <FaCalendarAlt className="h-5 w-5 text-violet-600" />;
      case "payment":
        return <FaMoneyBillWave className="h-5 w-5 text-green-600" />;
      case "message":
        return <FaUser className="h-5 w-5 text-blue-600" />;
      case "profile":
        return <FaUser className="h-5 w-5 text-orange-600" />;
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
            </div>
          </div>
          <div className="relative w-full sm:w-auto">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search activities..."
              className="block w-full rounded-md border border-gray-300 py-1.5 pl-10 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:w-64"
            />
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
        <div className="divide-y divide-gray-200">
          {filteredActivities.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No activities found for the selected filter.
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
        <div className="border-t border-gray-200 px-4 py-3 text-right">
          <button className="text-sm font-medium text-violet-600 hover:text-violet-700">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
} 