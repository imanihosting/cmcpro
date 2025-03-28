'use client';

import React from 'react';
import Calendar from './components/Calendar';
import { FaRegCalendarAlt } from 'react-icons/fa';

const CalendarPage = () => {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3 text-gray-800">
          <FaRegCalendarAlt className="text-blue-600 text-3xl sm:text-4xl" />
          <span>Calendar</span>
        </h1>
        <p className="text-gray-700 text-lg sm:text-xl mt-2 font-bold">
          View and manage your bookings in calendar format
        </p>
      </div>
      
      <Calendar />
    </div>
  );
};

export default CalendarPage; 