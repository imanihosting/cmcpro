"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  FaLock, 
  FaShieldAlt,
  FaSave,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaBell,
  FaToggleOn,
  FaToggleOff
} from "react-icons/fa";

export default function ParentSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetupStep, setTwoFactorSetupStep] = useState<"initial" | "qrcode" | "verify">("initial");
  const [twoFactorQrCode, setTwoFactorQrCode] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  
  // Form state
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isLoading2FA, setIsLoading2FA] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Notification preferences
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    bookingReminders: true,
    marketingEmails: false
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // Redirect if not a parent
    if (status === "authenticated" && session?.user?.role !== "parent") {
      router.push("/dashboard");
      return;
    }

    // Check if 2FA is already enabled
    const check2FAStatus = async () => {
      try {
        const response = await fetch('/api/user/2fa/status');
        if (response.ok) {
          const data = await response.json();
          setTwoFactorEnabled(data.enabled);
        }
      } catch (error) {
        console.error('Error checking 2FA status:', error);
      }
    };
    
    // Load notification preferences
    const loadNotificationPreferences = async () => {
      try {
        const response = await fetch('/api/user/notification-preferences');
        if (response.ok) {
          const data = await response.json();
          setNotificationPreferences({
            emailNotifications: data.emailNotifications ?? true,
            bookingReminders: data.bookingReminders ?? true,
            marketingEmails: data.marketingEmails ?? false
          });
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    };

    if (status === "authenticated") {
      check2FAStatus();
      loadNotificationPreferences();
    }
  }, [status, session, router]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleNotificationToggle = (setting: keyof typeof notificationPreferences) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Function to clear notifications after a delay
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

  const handleSaveNotificationPreferences = async () => {
    setIsLoading2FA(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPreferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }

      showNotification(true, "✅ Notification preferences updated successfully! Your communication settings have been saved.");
    } catch (error) {
      showNotification(false, "Failed to update notification preferences");
      console.error('Error updating notification preferences:', error);
    } finally {
      setIsLoading2FA(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingPassword(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    // Password validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification(false, "New passwords do not match");
      setIsLoadingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showNotification(false, "New password must be at least 8 characters long");
      setIsLoadingPassword(false);
      return;
    }

    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
        credentials: 'include' // Important: Include credentials for session cookies
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      showNotification(true, data.message || "✅ Password updated successfully! Your new password has been saved.");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      // Scroll to top to ensure notification is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      showNotification(false, error.message || "Failed to update password. Please check your current password.");
      console.error('Error updating password:', error);
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const setup2FA = async () => {
    setIsLoading2FA(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/user/2fa/setup', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to set up 2FA');
      }

      const data = await response.json();
      setTwoFactorQrCode(data.qrCodeUrl);
      setTwoFactorSecret(data.secret);
      setTwoFactorSetupStep("qrcode");
    } catch (error) {
      setErrorMessage("Failed to set up 2FA. Please try again.");
      console.error('Error setting up 2FA:', error);
    } finally {
      setIsLoading2FA(false);
    }
  };

  const verify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit verification code");
      return;
    }

    setIsLoading2FA(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/user/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationCode,
          secret: twoFactorSecret,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify 2FA code');
      }

      const data = await response.json();
      setTwoFactorEnabled(true);
      setRecoveryCodes(data.recoveryCodes || []);
      setTwoFactorSetupStep("verify");
      setSuccessMessage("✅ Two-factor authentication enabled successfully! Your account is now more secure.");
    } catch (error) {
      setErrorMessage("Invalid verification code. Please try again.");
      console.error('Error verifying 2FA:', error);
    } finally {
      setIsLoading2FA(false);
    }
  };

  const disable2FA = async () => {
    setIsLoading2FA(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/user/2fa/disable', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disable 2FA');
      }

      setTwoFactorEnabled(false);
      setTwoFactorSetupStep("initial");
      setTwoFactorQrCode(null);
      setTwoFactorSecret(null);
      setVerificationCode("");
      setSuccessMessage("✅ Two-factor authentication disabled successfully! You can re-enable it any time.");
    } catch (error) {
      setErrorMessage("Failed to disable 2FA. Please try again.");
      console.error('Error disabling 2FA:', error);
    } finally {
      setIsLoading2FA(false);
    }
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Floating Notifications */}
      {successMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <div className="rounded-md bg-green-50 p-4 border border-green-200 shadow-lg animate-fade-in-down">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-green-50 text-green-500 hover:text-green-700 focus:outline-none"
                  onClick={() => setSuccessMessage(null)}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <div className="rounded-md bg-red-50 p-4 border border-red-200 shadow-lg animate-fade-in-down">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-red-50 text-red-500 hover:text-red-700 focus:outline-none"
                  onClick={() => setErrorMessage(null)}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Account Settings</h1>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          {/* Security Section */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
              <FaShieldAlt className="mr-2 h-5 w-5 text-violet-600" />
              Security Settings
            </h2>
            
            {/* Password Change Form */}
            <div className="mb-8">
              <h3 className="mb-4 text-lg font-medium text-gray-800">Change Password</h3>
              
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="block w-full rounded-md border-gray-300 pl-3 pr-10 py-2 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="block w-full rounded-md border-gray-300 pl-3 pr-10 py-2 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="block w-full rounded-md border-gray-300 pl-3 pr-10 py-2 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoadingPassword}
                    className="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-70"
                  >
                    {isLoadingPassword ? (
                      <>
                        <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaLock className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Two-Factor Authentication */}
            <div>
              <h3 className="mb-4 text-lg font-medium text-gray-800">Two-Factor Authentication (2FA)</h3>
              
              <div className="mb-4 rounded-md bg-gray-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaShieldAlt className="h-5 w-5 text-violet-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password when you sign in.
                    </p>
                  </div>
                </div>
              </div>
              
              {twoFactorSetupStep === "initial" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`text-lg font-medium ${twoFactorEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                      {twoFactorEnabled ? '2FA is enabled' : '2FA is disabled'}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={twoFactorEnabled ? disable2FA : setup2FA}
                    disabled={isLoading2FA}
                    className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      twoFactorEnabled 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500' 
                        : 'bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500'
                    } disabled:opacity-70`}
                  >
                    {isLoading2FA ? (
                      <>
                        <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : twoFactorEnabled ? (
                      <>
                        <FaTimes className="mr-2 h-4 w-4" />
                        Disable 2FA
                      </>
                    ) : (
                      <>
                        <FaShieldAlt className="mr-2 h-4 w-4" />
                        Enable 2FA
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {twoFactorSetupStep === "qrcode" && twoFactorQrCode && (
                <div className="space-y-6">
                  <div className="rounded-md bg-gray-50 p-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Step 1: Scan QR Code</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Scan this QR code with your authentication app (such as Google Authenticator, Authy, or Microsoft Authenticator).
                    </p>
                    
                    <div className="flex justify-center mb-4">
                      <img 
                        src={twoFactorQrCode} 
                        alt="2FA QR Code" 
                        className="h-48 w-48 border border-gray-200 rounded-md"
                      />
                    </div>
                    
                    {twoFactorSecret && (
                      <div className="text-center mb-2">
                        <p className="text-sm text-gray-600 mb-1">
                          If you can't scan the QR code, enter this code manually:
                        </p>
                        <code className="text-sm px-2 py-1 bg-gray-100 rounded-md">
                          {twoFactorSecret}
                        </code>
                      </div>
                    )}
                  </div>
                  
                  <div className="rounded-md bg-gray-50 p-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Step 2: Enter Verification Code</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Enter the 6-digit code shown in your authentication app to verify setup.
                    </p>
                    
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                        className="block w-full max-w-[8rem] rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                        placeholder="123456"
                        maxLength={6}
                        pattern="[0-9]{6}"
                        required
                      />
                      
                      <button
                        type="button"
                        onClick={verify2FA}
                        disabled={isLoading2FA || verificationCode.length !== 6}
                        className="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-70"
                      >
                        {isLoading2FA ? (
                          <>
                            <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <FaCheck className="mr-2 h-4 w-4" />
                            Verify
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setTwoFactorSetupStep("initial")}
                        className="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {twoFactorSetupStep === "verify" && recoveryCodes.length > 0 && (
                <div className="rounded-md bg-gray-50 p-4 space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Recovery Codes</h4>
                  <p className="text-sm text-gray-600">
                    Save these recovery codes in a secure location. They can be used to recover access to your account if you lose your authentication device.
                  </p>
                  
                  <div className="bg-white rounded-md border border-gray-200 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {recoveryCodes.map((code, index) => (
                        <code key={index} className="text-sm font-mono">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setTwoFactorSetupStep("initial")}
                    className="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                  >
                    <FaCheck className="mr-2 h-4 w-4" />
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Notification Preferences */}
        <div className="rounded-lg bg-white p-6 shadow-sm md:col-span-1">
          <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
            <FaBell className="mr-2 h-5 w-5 text-violet-600" />
            Notification Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Email Notifications</h3>
                <p className="text-xs text-gray-500">Receive notifications via email</p>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationToggle('emailNotifications')}
                className="text-indigo-600 focus:outline-none"
              >
                {notificationPreferences.emailNotifications ? (
                  <FaToggleOn className="h-6 w-6 text-violet-600" />
                ) : (
                  <FaToggleOff className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Booking Reminders</h3>
                <p className="text-xs text-gray-500">Get reminded about upcoming bookings</p>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationToggle('bookingReminders')}
                className="text-indigo-600 focus:outline-none"
              >
                {notificationPreferences.bookingReminders ? (
                  <FaToggleOn className="h-6 w-6 text-violet-600" />
                ) : (
                  <FaToggleOff className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Marketing Emails</h3>
                <p className="text-xs text-gray-500">Receive promotional emails and offers</p>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationToggle('marketingEmails')}
                className="text-indigo-600 focus:outline-none"
              >
                {notificationPreferences.marketingEmails ? (
                  <FaToggleOn className="h-6 w-6 text-violet-600" />
                ) : (
                  <FaToggleOff className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>
            
            <div className="pt-4">
              <button
                type="button"
                onClick={handleSaveNotificationPreferences}
                disabled={isLoading2FA}
                className="inline-flex w-full items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-70"
              >
                {isLoading2FA ? (
                  <>
                    <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 