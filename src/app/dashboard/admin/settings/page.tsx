"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  FaCog, 
  FaBell, 
  FaCheck, 
  FaExclamationCircle, 
  FaSpinner, 
  FaSave,
  FaShieldAlt,
  FaEnvelope
} from "react-icons/fa";
import { Switch } from '@headlessui/react';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  emailSummary: string;
  notifyOnNewUsers: boolean;
  notifyOnSupportTickets: boolean;
  notifyOnErrors: boolean;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Settings state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    emailSummary: 'daily',
    notifyOnNewUsers: true,
    notifyOnSupportTickets: true,
    notifyOnErrors: true,
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // Redirect if not an admin
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    // Load user settings
    const loadUserSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (!response.ok) throw new Error('Failed to load settings');
        
        const data = await response.json();
        
        // Set two-factor auth settings
        setTwoFactorEnabled(data.twoFactorEnabled || false);
        
        // Set notification settings
        if (data.notificationSettings) {
          setNotificationSettings({
            ...notificationSettings, // Keep defaults
            ...data.notificationSettings, // Override with user settings
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        showNotification(false, "Failed to load settings. Please refresh the page.");
      }
    };

    if (status === "authenticated") {
      loadUserSettings();
    }
  }, [status, session, router]);

  // Function to show notifications
  const showNotification = (isSuccess: boolean, message: string) => {
    if (isSuccess) {
      setSuccessMessage(message);
      setErrorMessage(null);
    } else {
      setErrorMessage(message);
      setSuccessMessage(null);
    }
    
    // Auto-clear notification after 5 seconds
    setTimeout(() => {
      if (isSuccess) {
        setSuccessMessage(null);
      } else {
        setErrorMessage(null);
      }
    }, 5000);
  };

  // Handle updating settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          twoFactorEnabled,
          notificationSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      showNotification(true, data.message || "✅ Settings updated successfully!");
      
      // Scroll to top to ensure notification is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      showNotification(false, "Failed to update settings. Please try again.");
      console.error('Error updating settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification settings changes
  const handleNotificationSettingChange = (
    field: keyof NotificationSettings,
    value: boolean | string
  ) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Admin Settings</h1>
        <div className="mt-2 inline-flex items-center rounded-md bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
          <FaCog className="mr-1 h-4 w-4" />
          Admin Account
        </div>
      </div>

      {/* Show notification messages */}
      {successMessage && (
        <div className="mb-6 flex items-center rounded-md bg-green-50 p-4 text-green-800">
          <FaCheck className="mr-3 h-5 w-5 flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-center rounded-md bg-red-50 p-4 text-red-800">
          <FaExclamationCircle className="mr-3 h-5 w-5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleUpdateSettings}>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Security Settings */}
          <div className="md:col-span-12">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-6 flex items-center text-xl font-semibold text-gray-900">
                <FaShieldAlt className="mr-2 h-5 w-5 text-indigo-600" />
                Security Settings
              </h2>
              
              <div className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onChange={setTwoFactorEnabled}
                    className={`${
                      twoFactorEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full`}
                  >
                    <span className="sr-only">Enable Two-Factor Authentication</span>
                    <span
                      className={`${
                        twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                    />
                  </Switch>
                </div>
                
                {/* More security settings can be added here in the future */}
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="md:col-span-12">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-6 flex items-center text-xl font-semibold text-gray-900">
                <FaBell className="mr-2 h-5 w-5 text-indigo-600" />
                Notification Settings
              </h2>
              
              <div className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-500">
                      Receive important notifications via email.
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onChange={(value) => handleNotificationSettingChange('emailNotifications', value)}
                    className={`${
                      notificationSettings.emailNotifications ? 'bg-indigo-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full`}
                  >
                    <span className="sr-only">Enable Email Notifications</span>
                    <span
                      className={`${
                        notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                    />
                  </Switch>
                </div>
                
                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Push Notifications</h3>
                    <p className="text-sm text-gray-500">
                      Receive push notifications in your browser.
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onChange={(value) => handleNotificationSettingChange('pushNotifications', value)}
                    className={`${
                      notificationSettings.pushNotifications ? 'bg-indigo-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full`}
                  >
                    <span className="sr-only">Enable Push Notifications</span>
                    <span
                      className={`${
                        notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                    />
                  </Switch>
                </div>
                
                {/* Email Summary Frequency */}
                <div>
                  <h3 className="text-base font-medium text-gray-900">Email Summary Frequency</h3>
                  <p className="mb-2 text-sm text-gray-500">
                    How often would you like to receive summary emails?
                  </p>
                  <div className="flex flex-wrap items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        id="summary-daily"
                        name="emailSummary"
                        type="radio"
                        value="daily"
                        checked={notificationSettings.emailSummary === 'daily'}
                        onChange={() => handleNotificationSettingChange('emailSummary', 'daily')}
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="summary-daily" className="ml-2 block text-sm text-gray-700">
                        Daily
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="summary-weekly"
                        name="emailSummary"
                        type="radio"
                        value="weekly"
                        checked={notificationSettings.emailSummary === 'weekly'}
                        onChange={() => handleNotificationSettingChange('emailSummary', 'weekly')}
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="summary-weekly" className="ml-2 block text-sm text-gray-700">
                        Weekly
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="summary-monthly"
                        name="emailSummary"
                        type="radio"
                        value="monthly"
                        checked={notificationSettings.emailSummary === 'monthly'}
                        onChange={() => handleNotificationSettingChange('emailSummary', 'monthly')}
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="summary-monthly" className="ml-2 block text-sm text-gray-700">
                        Monthly
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="summary-never"
                        name="emailSummary"
                        type="radio"
                        value="never"
                        checked={notificationSettings.emailSummary === 'never'}
                        onChange={() => handleNotificationSettingChange('emailSummary', 'never')}
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="summary-never" className="ml-2 block text-sm text-gray-700">
                        Never
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Notification Types */}
                <div>
                  <h3 className="text-base font-medium text-gray-900">Notification Types</h3>
                  <p className="mb-2 text-sm text-gray-500">
                    Choose which types of events you want to be notified about.
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="notifications-new-users"
                          name="notifyOnNewUsers"
                          type="checkbox"
                          checked={notificationSettings.notifyOnNewUsers}
                          onChange={(e) => handleNotificationSettingChange('notifyOnNewUsers', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="notifications-new-users" className="font-medium text-gray-700">
                          New User Registrations
                        </label>
                        <p className="text-gray-500">Receive notifications when new users register on the platform.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="notifications-support-tickets"
                          name="notifyOnSupportTickets"
                          type="checkbox"
                          checked={notificationSettings.notifyOnSupportTickets}
                          onChange={(e) => handleNotificationSettingChange('notifyOnSupportTickets', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="notifications-support-tickets" className="font-medium text-gray-700">
                          Support Tickets
                        </label>
                        <p className="text-gray-500">Receive notifications for new and updated support tickets.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="notifications-system-errors"
                          name="notifyOnErrors"
                          type="checkbox"
                          checked={notificationSettings.notifyOnErrors}
                          onChange={(e) => handleNotificationSettingChange('notifyOnErrors', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="notifications-system-errors" className="font-medium text-gray-700">
                          System Errors
                        </label>
                        <p className="text-gray-500">Receive notifications about critical system errors.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <>
                <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 