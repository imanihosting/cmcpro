import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarEvent } from '../types';
import { FaRegCalendarAlt, FaClock, FaTrash, FaSyncAlt } from 'react-icons/fa';

interface AvailabilityModalProps {
  onClose: () => void;
  onSave: (data: {
    title: string;
    description?: string;
    isRecurring: boolean;
    recurrenceRule?: string;
  }) => void;
  onDelete?: () => void;
  type: 'AVAILABLE' | 'UNAVAILABLE';
  timeRange: { start: Date; end: Date } | null;
  existingEvent?: CalendarEvent | null;
}

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  onClose,
  onSave,
  onDelete,
  type,
  timeRange,
  existingEvent
}) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrencePattern, setRecurrencePattern] = useState<string>('DAILY');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  
  // Populate form with existing event data if editing
  useEffect(() => {
    if (existingEvent) {
      setTitle(existingEvent.title || (type === 'AVAILABLE' ? 'Available' : 'Unavailable'));
      setDescription(existingEvent.description || '');
      
      // Check if event is recurring
      if (existingEvent.extendedProps?.recurrenceRule) {
        setIsRecurring(true);
        // Extract pattern from recurrence rule
        const rule = existingEvent.extendedProps.recurrenceRule;
        if (rule.includes('DAILY')) {
          setRecurrencePattern('DAILY');
        } else if (rule.includes('WEEKLY')) {
          setRecurrencePattern('WEEKLY');
        } else if (rule.includes('MONTHLY')) {
          setRecurrencePattern('MONTHLY');
        }
        
        // Extract end date if present
        const untilMatch = rule.match(/UNTIL=(\d{8})/);
        if (untilMatch && untilMatch[1]) {
          const year = untilMatch[1].substring(0, 4);
          const month = untilMatch[1].substring(4, 6);
          const day = untilMatch[1].substring(6, 8);
          setRecurrenceEndDate(`${year}-${month}-${day}`);
        }
      }
    }
    
    // Set time values from the selected range or existing event
    if (timeRange) {
      setStartDate(format(timeRange.start, 'yyyy-MM-dd'));
      setStartTime(format(timeRange.start, 'HH:mm'));
      setEndTime(format(timeRange.end, 'HH:mm'));
    } else if (existingEvent) {
      const start = new Date(existingEvent.start);
      const end = new Date(existingEvent.end);
      
      setStartDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      setEndTime(format(end, 'HH:mm'));
    }
  }, [existingEvent, timeRange, type]);
  
  // Default title based on type
  useEffect(() => {
    if (!title && !existingEvent) {
      setTitle(type === 'AVAILABLE' ? 'Available' : 'Unavailable');
    }
  }, [type, title, existingEvent]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let recurrenceRule;
    if (isRecurring) {
      // Build basic recurrence rule
      recurrenceRule = `FREQ=${recurrencePattern};`;
      
      // Add end date if specified
      if (recurrenceEndDate) {
        const date = new Date(recurrenceEndDate);
        const yyyymmdd = format(date, 'yyyyMMdd');
        recurrenceRule += `UNTIL=${yyyymmdd};`;
      }
    }
    
    onSave({
      title,
      description: description || undefined,
      isRecurring,
      recurrenceRule
    });
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 ${type === 'AVAILABLE' ? 'bg-blue-500' : 'bg-red-500'} text-white`}>
          <h3 className="text-xl font-bold">
            {existingEvent ? 'Edit' : 'Create'} {type === 'AVAILABLE' ? 'Available' : 'Unavailable'} Time
          </h3>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Date */}
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <FaRegCalendarAlt className="text-gray-500" /> Date
            </label>
            <input
              type="date"
              id="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FaClock className="text-gray-500" /> Start Time
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FaClock className="text-gray-500" /> End Time
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          {/* Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>
          
          {/* Recurring Options */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-2"
              />
              <label htmlFor="recurring" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <FaSyncAlt className="text-gray-500" /> Recurring
              </label>
            </div>
            
            {isRecurring && (
              <div className="pl-6 mt-3 space-y-3 border-l-2 border-gray-200">
                {/* Recurrence Pattern */}
                <div>
                  <label htmlFor="recurrencePattern" className="block text-sm font-medium text-gray-700 mb-1">
                    Repeats
                  </label>
                  <select
                    id="recurrencePattern"
                    value={recurrencePattern}
                    onChange={(e) => setRecurrencePattern(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
                
                {/* End Date */}
                <div>
                  <label htmlFor="recurrenceEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Ends On (Optional)
                  </label>
                  <input
                    type="date"
                    id="recurrenceEndDate"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <div>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center gap-1"
                >
                  <FaTrash size={14} />
                  <span>Delete</span>
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 ${type === 'AVAILABLE' ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500' : 'bg-red-500 hover:bg-red-600 focus:ring-red-500'} text-white rounded-md focus:outline-none focus:ring-2`}
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AvailabilityModal; 