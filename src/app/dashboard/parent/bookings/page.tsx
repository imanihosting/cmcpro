"use client";

import { FaCalendarAlt, FaClock, FaUserCircle, FaMapMarkerAlt, FaTrash, FaEdit } from "react-icons/fa";

// Define types
type BookingStatus = 'confirmed' | 'pending' | 'cancelled';

interface Booking {
  id: number;
  childminder: string;
  date: string;
  time: string;
  address: string;
  status: BookingStatus;
}

interface StatusBadgeProps {
  status: BookingStatus;
}

export default function ParentBookings() {
  // Placeholder bookings data
  const bookings: Booking[] = [
    {
      id: 1,
      childminder: "Sarah Johnson",
      date: "March 30, 2024",
      time: "9:00 AM - 5:00 PM",
      address: "123 Maple Street, London",
      status: "confirmed"
    },
    {
      id: 2,
      childminder: "David Williams",
      date: "April 2, 2024",
      time: "8:30 AM - 3:30 PM",
      address: "45 Oak Avenue, Manchester",
      status: "pending"
    },
    {
      id: 3,
      childminder: "Emma Thompson",
      date: "April 5, 2024",
      time: "2:00 PM - 6:00 PM",
      address: "78 Pine Road, Birmingham",
      status: "confirmed"
    }
  ];

  // Status badge component
  const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const statusClasses = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800"
    };
    
    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Bookings</h1>
        <p className="mt-1 text-sm text-gray-600">View and manage your childcare bookings</p>
      </header>

      {/* Booking actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">
            New Booking
          </button>
          <button className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">
            View Calendar
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter:</span>
          <select className="rounded-md border border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500">
            <option>All bookings</option>
            <option>Confirmed</option>
            <option>Pending</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings list */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <div className="flex items-center gap-2">
                  <FaUserCircle className="h-5 w-5 text-violet-600" />
                  <h3 className="text-lg font-medium text-gray-900">{booking.childminder}</h3>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                    <span>{booking.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaClock className="h-4 w-4 text-gray-400" />
                    <span>{booking.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
                    <span>{booking.address}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 sm:mt-0">
                <button className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">
                  <FaEdit className="mr-1 inline h-4 w-4" /> Edit
                </button>
                <button className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                  <FaTrash className="mr-1 inline h-4 w-4" /> Cancel
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 