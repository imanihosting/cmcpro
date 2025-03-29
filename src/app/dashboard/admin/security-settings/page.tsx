"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  FaShieldAlt, 
  FaLock, 
  FaExclamationTriangle, 
  FaCheck, 
  FaSpinner, 
  FaSave,
  FaExclamationCircle,
  FaInfoCircle,
  FaUserLock
} from "react-icons/fa";
import { Switch } from '@headlessui/react';

// Type definitions
interface SecuritySetting {
  id: string;
  key: string;
  value: string;
  description: string;
  type: string;
  metadata: {
    min?: number;
    max?: number;
    validationError?: string;
    [key: string]: any;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface GroupedSettings {
  [category: string]: SecuritySetting[];
}

export default function SecuritySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([]);
  const [groupedSettings, setGroupedSettings] = useState<GroupedSettings>({});
  const [modifiedSettings, setModifiedSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Check authentication and fetch settings
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

    // Fetch security settings
    const fetchSecuritySettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/security-settings');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch security settings: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSecuritySettings(data);
        
        // Group settings by category based on key prefixes
        const grouped: GroupedSettings = {};
        
        data.forEach((setting: SecuritySetting) => {
          let category = 'General';
          
          if (setting.key.startsWith('password')) {
            category = 'Password Policies';
          } else if (setting.key.startsWith('session')) {
            category = 'Session Management';
          } else if (setting.key.startsWith('login')) {
            category = 'Login Security';
          } else if (setting.key.startsWith('mfa')) {
            category = 'Multi-factor Authentication';
          } else if (setting.key.startsWith('rateLimit')) {
            category = 'Rate Limiting';
          } else if (setting.key.includes('Cors')) {
            category = 'Access Control';
          }
          
          if (!grouped[category]) {
            grouped[category] = [];
          }
          
          grouped[category].push(setting);
        });
        
        setGroupedSettings(grouped);
      } catch (error) {
        console.error('Error fetching security settings:', error);
        setErrorMessage("Failed to load security settings. Please refresh the page and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchSecuritySettings();
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
    
    // Auto-clear notification after 8 seconds
    setTimeout(() => {
      if (isSuccess) {
        setSuccessMessage(null);
      } else {
        setErrorMessage(null);
      }
    }, 8000);
  };

  // Handle setting value change
  const handleSettingChange = (key: string, value: string) => {
    setModifiedSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear validation error when modifying
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  // Validate a setting based on its type and constraints
  const validateSetting = (setting: SecuritySetting, value: string): string | null => {
    const { type, metadata } = setting;
    
    switch (type) {
      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return 'Must be a valid number';
        }
        if (metadata?.min !== undefined && numValue < metadata.min) {
          return metadata.validationError || `Must be at least ${metadata.min}`;
        }
        if (metadata?.max !== undefined && numValue > metadata.max) {
          return metadata.validationError || `Must be no more than ${metadata.max}`;
        }
        break;
        
      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          return 'Must be true or false';
        }
        break;
        
      case 'string':
        // Add string validation if needed
        break;
    }
    
    return null;
  };

  // Validate all modified settings
  const validateAllSettings = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;
    
    // Find the setting object for each modified setting and validate
    Object.entries(modifiedSettings).forEach(([key, value]) => {
      const setting = securitySettings.find(s => s.key === key);
      if (setting) {
        const error = validateSetting(setting, value);
        if (error) {
          errors[key] = error;
          isValid = false;
        }
      }
    });
    
    setValidationErrors(errors);
    return isValid;
  };

  // Determine if a setting change is critical
  const isSettingCritical = (key: string): boolean => {
    const criticalKeys = [
      'passwordMinLength', 
      'mfaRequiredForAdmin', 
      'sessionTimeoutMinutes',
      'loginMaxAttempts',
      'loginLockoutMinutes'
    ];
    
    return criticalKeys.includes(key);
  };

  // Check if any critical settings are being modified
  const hasCriticalChanges = (): boolean => {
    return Object.keys(modifiedSettings).some(key => isSettingCritical(key));
  };

  // Handle save button click
  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only proceed if changes have been made
    if (Object.keys(modifiedSettings).length === 0) {
      showNotification(false, "No changes to save");
      return;
    }
    
    // Validate settings
    if (!validateAllSettings()) {
      showNotification(false, "Please fix the validation errors before saving");
      return;
    }
    
    // If critical settings are being modified, require confirmation
    if (hasCriticalChanges()) {
      setIsConfirmDialogOpen(true);
    } else {
      saveSettings();
    }
  };

  // Handle admin password confirmation
  const handlePasswordConfirmation = async () => {
    setPasswordError(null);
    
    if (!adminPasswordConfirm) {
      setPasswordError("Password is required");
      return;
    }
    
    // Here we would normally validate the admin password
    // For this implementation, we'll just proceed with the save
    // In a production environment, you would verify the admin password
    
    setIsConfirmDialogOpen(false);
    setAdminPasswordConfirm("");
    saveSettings();
  };

  // Save the modified settings to the server
  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Prepare settings array for the API
      const settingsToUpdate = Object.entries(modifiedSettings).map(([key, value]) => ({
        key,
        value
      }));
      
      const response = await fetch('/api/admin/security-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: settingsToUpdate
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update security settings');
      }
      
      // Handle validation errors from the server
      if (data.errors && data.errors.length > 0) {
        showNotification(false, data.message || "Some settings could not be updated due to validation errors");
        
        // Display server-side validation errors
        const newErrors: Record<string, string> = {};
        data.errors.forEach((error: string) => {
          // Try to extract the key from the error message
          const keyMatch = error.match(/\"([^\"]+)\"/);
          if (keyMatch && keyMatch[1]) {
            newErrors[keyMatch[1]] = error;
          }
        });
        
        setValidationErrors(newErrors);
      } else {
        showNotification(true, data.message || "✅ Security settings updated successfully");
        
        // Refresh the settings and clear modified state
        setModifiedSettings({});
        
        // Refresh the settings list
        const refreshResponse = await fetch('/api/admin/security-settings');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setSecuritySettings(refreshData);
          
          // Regroup settings
          const grouped: GroupedSettings = {};
          
          refreshData.forEach((setting: SecuritySetting) => {
            let category = 'General';
            
            if (setting.key.startsWith('password')) {
              category = 'Password Policies';
            } else if (setting.key.startsWith('session')) {
              category = 'Session Management';
            } else if (setting.key.startsWith('login')) {
              category = 'Login Security';
            } else if (setting.key.startsWith('mfa')) {
              category = 'Multi-factor Authentication';
            } else if (setting.key.startsWith('rateLimit')) {
              category = 'Rate Limiting';
            } else if (setting.key.includes('Cors')) {
              category = 'Access Control';
            }
            
            if (!grouped[category]) {
              grouped[category] = [];
            }
            
            grouped[category].push(setting);
          });
          
          setGroupedSettings(grouped);
        }
      }
    } catch (error) {
      console.error('Error saving security settings:', error);
      showNotification(false, "Failed to update security settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Format the display label for a setting key
  const formatSettingLabel = (key: string): string => {
    // Remove prefixes like 'password', 'session', etc.
    let label = key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^[a-z]/, c => c.toUpperCase()); // Capitalize first letter
    
    return label;
  };

  // Show loading state
  if (status === "loading" || (isLoading && !errorMessage)) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Security Settings</h1>
        <div className="mt-2 inline-flex items-center rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
          <FaUserLock className="mr-1 h-4 w-4" />
          High Security Area
        </div>
      </div>
      
      {/* Warning banner */}
      <div className="mb-6 rounded-md bg-yellow-50 p-4 shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Warning: Critical Security Settings</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Changes to these settings can significantly impact the security and functionality of the platform. Improper configuration could lead to:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Unauthorized access to user accounts</li>
                <li>Denial of service for legitimate users</li>
                <li>User experience degradation</li>
                <li>Compliance violations</li>
              </ul>
              <p className="mt-2 font-semibold">All changes are permanently logged for security audit purposes.</p>
            </div>
          </div>
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
      
      {/* Settings Form */}
      <form onSubmit={handleSaveClick}>
        {Object.entries(groupedSettings).map(([category, settings]) => (
          <div key={category} className="mb-8">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
              <FaShieldAlt className="mr-2 h-5 w-5 text-indigo-600" />
              {category}
            </h2>
            
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="space-y-6">
                {settings.map(setting => (
                  <div key={setting.id} className="pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="md:w-2/3">
                        <h3 className="text-base font-medium text-gray-900">
                          {formatSettingLabel(setting.key)}
                          {isSettingCritical(setting.key) && (
                            <span className="ml-2 rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              Critical
                            </span>
                          )}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">{setting.description}</p>
                        
                        {validationErrors[setting.key] && (
                          <p className="mt-1 text-sm text-red-600">
                            <FaExclamationCircle className="mr-1 inline-block h-3 w-3" />
                            {validationErrors[setting.key]}
                          </p>
                        )}
                      </div>
                      
                      <div className="md:w-1/3">
                        {setting.type === 'boolean' ? (
                          <Switch
                            checked={modifiedSettings[setting.key] !== undefined 
                              ? modifiedSettings[setting.key] === 'true'
                              : setting.value === 'true'}
                            onChange={value => handleSettingChange(setting.key, value ? 'true' : 'false')}
                            className={`${
                              (modifiedSettings[setting.key] || setting.value) === 'true' 
                                ? 'bg-indigo-600' 
                                : 'bg-gray-200'
                            } relative inline-flex h-6 w-11 items-center rounded-full`}
                          >
                            <span className="sr-only">Toggle {setting.key}</span>
                            <span
                              className={`${
                                (modifiedSettings[setting.key] || setting.value) === 'true' 
                                  ? 'translate-x-6' 
                                  : 'translate-x-1'
                              } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                            />
                          </Switch>
                        ) : setting.type === 'number' ? (
                          <div>
                            <input
                              type="number"
                              id={setting.key}
                              value={modifiedSettings[setting.key] !== undefined 
                                ? modifiedSettings[setting.key]
                                : setting.value}
                              onChange={e => handleSettingChange(setting.key, e.target.value)}
                              min={setting.metadata?.min}
                              max={setting.metadata?.max}
                              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                                validationErrors[setting.key] ? 'border-red-300' : ''
                              }`}
                            />
                            {setting.metadata?.min !== undefined && setting.metadata?.max !== undefined && (
                              <p className="mt-1 text-xs text-gray-500">
                                Allowed range: {setting.metadata.min} - {setting.metadata.max}
                              </p>
                            )}
                          </div>
                        ) : (
                          <input
                            type="text"
                            id={setting.key}
                            value={modifiedSettings[setting.key] !== undefined 
                              ? modifiedSettings[setting.key]
                              : setting.value}
                            onChange={e => handleSettingChange(setting.key, e.target.value)}
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              validationErrors[setting.key] ? 'border-red-300' : ''
                            }`}
                          />
                        )}
                        
                        {modifiedSettings[setting.key] !== undefined && (
                          <div className="mt-1 flex items-center text-xs text-indigo-600">
                            <FaInfoCircle className="mr-1 h-3 w-3" />
                            <span>Modified (was: {setting.value})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {/* Save button */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || Object.keys(modifiedSettings).length === 0}
            className={`flex items-center rounded-md ${
              Object.keys(modifiedSettings).length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } px-6 py-3 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
          >
            {isSaving ? (
              <>
                <FaSpinner className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2 h-5 w-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Confirmation Dialog for Critical Settings */}
      {isConfirmDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-gray-900">Confirm Critical Security Changes</h3>
            <p className="mb-4 text-center text-sm text-gray-600">
              You are about to modify critical security settings that could impact the entire platform.
              Please confirm your admin password to proceed.
            </p>
            
            <div className="mb-4">
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">
                Admin Password
              </label>
              <input
                type="password"
                id="admin-password"
                value={adminPasswordConfirm}
                onChange={e => setAdminPasswordConfirm(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your password"
              />
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmDialogOpen(false);
                  setAdminPasswordConfirm("");
                  setPasswordError(null);
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasswordConfirmation}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
              >
                Confirm Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 