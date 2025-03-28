"use client";

import { useState, ReactNode, Fragment } from "react";
import { 
  FaCalendarAlt, 
  FaChevronLeft, 
  FaChevronRight,
  FaClock,
  FaMapMarkerAlt,
  FaChild
} from "react-icons/fa";

interface Booking {
  id: number;
  day: number;
  title: string;
  time: string;
  location: string;
  children: number;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Helper function to get days in a month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Helper function to get the first day of the month
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  // Format date for display
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Placeholder bookings data
  const bookings: Booking[] = [
    { id: 1, day: 12, title: "Childcare with Sarah", time: "9:00 AM - 5:00 PM", location: "123 Maple Street", children: 2 },
    { id: 2, day: 15, title: "Childcare with David", time: "8:30 AM - 3:30 PM", location: "45 Oak Avenue", children: 1 },
    { id: 3, day: 20, title: "Childcare with Emma", time: "2:00 PM - 6:00 PM", location: "78 Pine Road", children: 2 }
  ];

  // Generate calendar grid
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Create blank cells for days before the first day of the month
    const blanks: ReactNode[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      blanks.push(
        <div key={`blank-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>
      );
    }
    
    // Create cells for days in the month
    const days: ReactNode[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayBookings = bookings.filter(booking => booking.day === d && currentMonth.getMonth() === new Date().getMonth());
      
      days.push(
        <div key={`day-${d}`} className="h-24 border border-gray-200 p-1 overflow-hidden">
          <div className="flex justify-between">
            <span className={`text-sm ${new Date().getDate() === d && new Date().getMonth() === month ? 'bg-violet-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
              {d}
            </span>
            {dayBookings.length > 0 && (
              <span className="text-xs bg-violet-100 text-violet-800 font-medium px-1.5 py-0.5 rounded-full">
                {dayBookings.length}
              </span>
            )}
          </div>
          <div className="mt-1 space-y-1">
            {dayBookings.map((booking) => (
              <div key={booking.id} className="text-xs truncate bg-violet-50 p-1 rounded border-l-2 border-violet-500">
                {booking.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Combine blanks and days
    const totalSlots = [...blanks, ...days];
    const rows: ReactNode[][] = [];
    let cells: ReactNode[] = [];
    
    totalSlots.forEach((slot, i) => {
      if (i % 7 !== 0) {
        cells.push(slot);
      } else {
        if (cells.length > 0) {
          rows.push(cells);
        }
        cells = [];
        cells.push(slot);
      }
      if (i === totalSlots.length - 1) {
        rows.push(cells);
      }
    });
    
    return (
      <div>
        <div className="grid grid-cols-7 gap-px">
          {weekdays.map(day => (
            <div key={day} className="py-2 text-center text-sm font-medium text-gray-500 bg-gray-100">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {rows.map((row, rowIndex) => (
            <Fragment key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <Fragment key={`cell-${rowIndex}-${cellIndex}`}>
                  {cell}
                </Fragment>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    );
  };
  
  // Upcoming bookings section
  const renderUpcomingBookings = () => {
    return (
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-3">Upcoming Bookings</h2>
        <div className="space-y-3">
          {bookings.map(booking => (
            <div key={booking.id} className="rounded-lg bg-white p-3 shadow-sm">
              <h3 className="font-medium text-gray-900">{booking.title}</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                  <span>April {booking.day}, 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaClock className="h-4 w-4 text-gray-400" />
                  <span>{booking.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
                  <span>{booking.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaChild className="h-4 w-4 text-gray-400" />
                  <span>{booking.children} {booking.children === 1 ? 'child' : 'children'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Calendar</h1>
        <p className="mt-1 text-sm text-gray-600">View and manage your childcare schedule</p>
      </header>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{formatMonth(currentMonth)}</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
          >
            <FaChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-lg bg-white shadow">
        {renderCalendar()}
      </div>

      {renderUpcomingBookings()}
    </div>
  );
} 