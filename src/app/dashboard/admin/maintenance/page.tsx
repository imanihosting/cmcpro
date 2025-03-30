'use client';

import { useState, useEffect } from 'react';
import { 
  FaTools, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaSpinner,
  FaSave,
  FaCalendarAlt,
  FaToggleOn,
  FaToggleOff
} from 'react-icons/fa';
import { useToast } from '@/hooks/useToast';

interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceEndTime: string | null;
}

export default function MaintenanceControlPage() {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    maintenanceMode: false,
    maintenanceMessage: 'System is currently undergoing maintenance. We apologize for the inconvenience.',
    maintenanceEndTime: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dateInputValue, setDateInputValue] = useState('');
  const toast = useToast();
  
  // Format the date for the datetime-local input
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Make sure the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return '';
      }
      
      // Format: YYYY-MM-DDThh:mm
      return date.toISOString().slice(0, 16);
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  // Load current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/system/maintenance');
        if (!response.ok) {
          throw new Error('Failed to fetch maintenance settings');
        }
        
        const data = await response.json();
        console.log('Fetched settings:', data);
        
        const newSettings = {
          maintenanceMode: !!data.maintenanceMode,
          maintenanceMessage: data.maintenanceMessage || 'System is currently undergoing maintenance. We apologize for the inconvenience.',
          maintenanceEndTime: data.maintenanceEndTime || null
        };
        
        setSettings(newSettings);
        
        // Set the date input value
        if (newSettings.maintenanceEndTime) {
          const formattedDate = formatDateForInput(newSettings.maintenanceEndTime);
          setDateInputValue(formattedDate);
          console.log('Setting date input to:', formattedDate);
        }
      } catch (error) {
        console.error('Error loading maintenance settings:', error);
        toast.error('Failed to load maintenance settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
    // Empty dependency array to ensure this only runs once on component mount
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    console.log('Submitting settings:', settings);
    
    try {
      const response = await fetch('/api/system/maintenance', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update maintenance settings');
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      // Update settings with server response
      setSettings({
        maintenanceMode: !!data.maintenanceMode,
        maintenanceMessage: data.maintenanceMessage || 'System is currently undergoing maintenance. We apologize for the inconvenience.',
        maintenanceEndTime: data.maintenanceEndTime || null
      });
      
      // Update date input if needed
      if (data.maintenanceEndTime) {
        setDateInputValue(formatDateForInput(data.maintenanceEndTime));
      }
      
      toast.success(settings.maintenanceMode ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
    } catch (error) {
      console.error('Error updating maintenance settings:', error);
      toast.error('Failed to update maintenance settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle maintenance mode
  const toggleMaintenanceMode = () => {
    setSettings({
      ...settings,
      maintenanceMode: !settings.maintenanceMode
    });
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Date input changed to:', value);
    
    setDateInputValue(value);
    
    if (value) {
      try {
        // Create a date object and convert to ISO string
        const date = new Date(value);
        console.log('Parsed date:', date);
        
        if (!isNaN(date.getTime())) {
          const isoString = date.toISOString();
          console.log('Setting maintenance end time to:', isoString);
          
          setSettings({
            ...settings,
            maintenanceEndTime: isoString
          });
        } else {
          console.error('Invalid date input');
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    } else {
      // If empty, set to null
      setSettings({
        ...settings,
        maintenanceEndTime: null
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[50vh]">
        <FaSpinner className="animate-spin h-8 w-8 text-violet-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Mode Control</h1>
        <p className="text-gray-600">Enable or disable maintenance mode for the entire site.</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          {/* Maintenance Mode Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-lg font-medium text-gray-900">
                Maintenance Mode
              </label>
              <button
                type="button"
                onClick={toggleMaintenanceMode}
                className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
              >
                {settings.maintenanceMode ? (
                  <>
                    <FaToggleOn className="text-violet-600 text-2xl mr-2" />
                    <span>Enabled</span>
                  </>
                ) : (
                  <>
                    <FaToggleOff className="text-gray-400 text-2xl mr-2" />
                    <span>Disabled</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-600">
              When enabled, all non-admin users will be redirected to the maintenance page.
            </p>
            
            {settings.maintenanceMode && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
                <FaExclamationTriangle className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  <strong>Warning:</strong> Enabling maintenance mode will prevent all non-admin users from accessing the site.
                </p>
              </div>
            )}
          </div>
          
          {/* Maintenance Message */}
          <div className="mb-6">
            <label htmlFor="maintenanceMessage" className="block text-sm font-medium text-gray-700 mb-1">
              Maintenance Message
            </label>
            <textarea
              id="maintenanceMessage"
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
              value={settings.maintenanceMessage}
              onChange={(e) => setSettings({...settings, maintenanceMessage: e.target.value})}
              placeholder="Enter message to display to users during maintenance"
            />
            <p className="mt-1 text-sm text-gray-500">
              This message will be displayed to users on the maintenance page.
            </p>
          </div>
          
          {/* Expected End Time */}
          <div className="mb-6">
            <label htmlFor="maintenanceEndTime" className="block text-sm font-medium text-gray-700 mb-1">
              Expected End Time (Optional)
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                id="maintenanceEndTime"
                className="block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm text-gray-900 bg-white"
                value={dateInputValue}
                onChange={handleDateChange}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              If set, this time will be displayed on the maintenance page.
            </p>
          </div>
          
          {/* Preview section */}
          <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Preview:</h3>
            <div className="p-4 bg-white rounded border border-gray-200">
              <h4 className="font-bold text-lg mb-2">Site Maintenance</h4>
              <p className="text-gray-600 mb-2">{settings.maintenanceMessage}</p>
              {settings.maintenanceEndTime && (
                <p className="text-sm text-gray-500">
                  Expected to be back: {new Date(settings.maintenanceEndTime).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-violet-300"
            >
              {isSaving ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 