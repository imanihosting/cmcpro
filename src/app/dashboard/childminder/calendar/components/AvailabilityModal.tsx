import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import { FaTimes } from 'react-icons/fa';
import { AvailabilityData } from '../types';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AvailabilityData) => Promise<void>;
  onDelete?: () => Promise<void>;
  startDate?: Date;
  endDate?: Date;
  type?: 'AVAILABLE' | 'UNAVAILABLE';
  title?: string;
  description?: string;
  recurrenceRule?: string;
  isEditing?: boolean;
}

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  startDate = new Date(),
  endDate = new Date(new Date().setHours(startDate.getHours() + 1)),
  type = 'AVAILABLE',
  title = '',
  description = '',
  recurrenceRule = '',
  isEditing = false
}) => {
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({
    start: startDate,
    end: endDate,
    type,
    title,
    description,
    recurrenceRule
  });
  
  const [isRecurring, setIsRecurring] = useState<boolean>(!!recurrenceRule);
  const [recurrenceType, setRecurrenceType] = useState<string>(recurrenceRule ? 'weekly' : 'none');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      setAvailabilityData({
        start: startDate,
        end: endDate,
        type,
        title,
        description,
        recurrenceRule
      });
      setIsRecurring(!!recurrenceRule);
      setRecurrenceType(recurrenceRule ? 'weekly' : 'none');
      setError(null);
    }
  }, [isOpen, startDate, endDate, type, title, description, recurrenceRule]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAvailabilityData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAvailabilityData(prev => ({ ...prev, type: e.target.value as 'AVAILABLE' | 'UNAVAILABLE' }));
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      const newDate = new Date(value);
      const newStart = new Date(availabilityData.start);
      newStart.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      setAvailabilityData(prev => ({ ...prev, start: newStart }));
    } else if (name === 'endDate') {
      const newDate = new Date(value);
      const newEnd = new Date(availabilityData.end);
      newEnd.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      setAvailabilityData(prev => ({ ...prev, end: newEnd }));
    }
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [hours, minutes] = value.split(':').map(Number);
    
    if (name === 'startTime') {
      const newStart = new Date(availabilityData.start);
      newStart.setHours(hours, minutes);
      setAvailabilityData(prev => ({ ...prev, start: newStart }));
    } else if (name === 'endTime') {
      const newEnd = new Date(availabilityData.end);
      newEnd.setHours(hours, minutes);
      setAvailabilityData(prev => ({ ...prev, end: newEnd }));
    }
  };
  
  const handleRecurrenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsRecurring(e.target.checked);
    if (!e.target.checked) {
      setAvailabilityData(prev => ({ ...prev, recurrenceRule: '' }));
    } else {
      handleRecurrenceTypeChange({ target: { value: 'weekly' } } as React.ChangeEvent<HTMLSelectElement>);
    }
  };
  
  const handleRecurrenceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setRecurrenceType(value);
    
    let rule = '';
    if (value === 'daily') {
      rule = 'FREQ=DAILY';
    } else if (value === 'weekly') {
      rule = 'FREQ=WEEKLY';
    } else if (value === 'biweekly') {
      rule = 'FREQ=WEEKLY;INTERVAL=2';
    } else if (value === 'monthly') {
      rule = 'FREQ=MONTHLY';
    }
    
    setAvailabilityData(prev => ({ ...prev, recurrenceRule: rule }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await onSave(availabilityData);
      onClose();
    } catch (err) {
      console.error('Error saving availability:', err);
      setError('Failed to save availability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this availability block?')) {
      setIsLoading(true);
      setError(null);
      
      try {
        await onDelete();
        onClose();
      } catch (err) {
        console.error('Error deleting availability:', err);
        setError('Failed to delete availability. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 px-6 py-5 relative">
              <Dialog.Title className="text-2xl font-bold text-white pr-8">
                {isEditing ? 'Edit Availability' : 'Add Availability'}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="absolute right-4 top-5 text-white hover:text-blue-100"
                aria-label="Close"
              >
                <FaTimes size={24} />
              </button>
            </div>
            
            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              {/* Type Selection */}
              <div className="mb-5">
                <label htmlFor="type" className="block text-base font-semibold text-gray-700 mb-2">
                  Availability Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={availabilityData.type}
                  onChange={handleTypeChange}
                  className="block w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                  required
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </select>
              </div>
              
              {/* Date Inputs */}
              <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-base font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={format(availabilityData.start, 'yyyy-MM-dd')}
                    onChange={handleDateChange}
                    className="block w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="startTime" className="block text-base font-semibold text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={format(availabilityData.start, 'HH:mm')}
                    onChange={handleTimeChange}
                    className="block w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="endDate" className="block text-base font-semibold text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={format(availabilityData.end, 'yyyy-MM-dd')}
                    onChange={handleDateChange}
                    className="block w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-base font-semibold text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={format(availabilityData.end, 'HH:mm')}
                    onChange={handleTimeChange}
                    className="block w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                    required
                  />
                </div>
              </div>
              
              {/* Title and Description */}
              <div className="mb-5">
                <label htmlFor="title" className="block text-base font-semibold text-gray-700 mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={availabilityData.title || ''}
                  onChange={handleChange}
                  className="block w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="E.g., Morning availability"
                />
              </div>
              
              <div className="mb-5">
                <label htmlFor="description" className="block text-base font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={availabilityData.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="Any additional notes"
                />
              </div>
              
              {/* Recurring Options */}
              <div className="mb-5">
                <div className="flex items-center mb-4">
                  <input
                    id="recurring"
                    name="recurring"
                    type="checkbox"
                    checked={isRecurring}
                    onChange={handleRecurrenceChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="recurring" className="ml-3 block text-base font-semibold text-gray-700">
                    Recurring Availability
                  </label>
                </div>
                
                {isRecurring && (
                  <div className="ml-8">
                    <label htmlFor="recurrenceType" className="block text-base font-semibold text-gray-700 mb-2">
                      Repeat Pattern
                    </label>
                    <select
                      id="recurrenceType"
                      value={recurrenceType}
                      onChange={handleRecurrenceTypeChange}
                      className="block w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                {isEditing && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-5 py-3 border border-red-300 text-red-700 bg-white hover:bg-red-50 rounded font-bold text-base"
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded font-bold text-base"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default AvailabilityModal; 