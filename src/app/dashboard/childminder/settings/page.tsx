"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function ChildminderSettingsPage() {
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

    // Redirect if not a childminder
    if (status === "authenticated" && session?.user?.role !== "childminder") {
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
          secret: twoFactorSecret
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify 2FA token');
      }

      setTwoFactorEnabled(true);
      setTwoFactorSetupStep("initial");
      setRecoveryCodes(data.recoveryCodes || []);
      showNotification(true, "✅ Two-factor authentication enabled successfully! Your account is now more secure.");
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to verify 2FA token. Please check the code and try again.");
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
      showNotification(true, "✅ Two-factor authentication disabled successfully! You can re-enable it any time.");
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success notification */}
      {successMessage && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaCheck className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-green-500 hover:bg-green-100 hover:text-green-600"
                onClick={() => setSuccessMessage(null)}
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaTimes className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-100 hover:text-red-600"
                onClick={() => setErrorMessage(null)}
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="mb-8 text-3xl font-bold text-gray-800">Account Settings</h1>

      <div className="space-y-8">
        {/* Password Change Section */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center">
            <FaLock className="mr-2 h-5 w-5 text-violet-600" />
            <h2 className="text-xl font-semibold text-gray-800">Password</h2>
          </div>
          
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="mt-1 block w-full rounded-md border-gray-300 pr-10 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <FaEyeSlash className="h-4 w-4 text-gray-400" />
                  ) : (
                    <FaEye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="mt-1 block w-full rounded-md border-gray-300 pr-10 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <FaEyeSlash className="h-4 w-4 text-gray-400" />
                  ) : (
                    <FaEye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="mt-1 block w-full rounded-md border-gray-300 pr-10 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="h-4 w-4 text-gray-400" />
                  ) : (
                    <FaEye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoadingPassword}
              className="flex w-full items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:bg-violet-300 sm:w-auto"
            >
              {isLoadingPassword ? (
                <>
                  <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <FaSave className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center">
            <FaShieldAlt className="mr-2 h-5 w-5 text-violet-600" />
            <h2 className="text-xl font-semibold text-gray-800">Two-Factor Authentication (2FA)</h2>
          </div>
          
          <p className="mb-4 text-gray-600">
            Add an extra layer of security to your account by enabling two-factor authentication. When 2FA is enabled, you'll be required to enter both your password and a verification code from your phone when signing in.
          </p>
          
          {twoFactorEnabled ? (
            <div>
              <div className="mb-4 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Two-factor authentication is enabled
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={disable2FA}
                disabled={isLoading2FA}
                className="flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300"
              >
                {isLoading2FA ? (
                  <>
                    <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                    Disabling 2FA...
                  </>
                ) : (
                  "Disable 2FA"
                )}
              </button>
            </div>
          ) : (
            <div>
              {twoFactorSetupStep === "initial" && (
                <button
                  onClick={setup2FA}
                  disabled={isLoading2FA}
                  className="flex items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:bg-violet-300"
                >
                  {isLoading2FA ? (
                    <>
                      <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                      Setting up 2FA...
                    </>
                  ) : (
                    "Set Up Two-Factor Authentication"
                  )}
                </button>
              )}
              
              {twoFactorSetupStep === "qrcode" && twoFactorQrCode && (
                <div className="space-y-4">
                  <p className="font-medium text-gray-700">
                    1. Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy)
                  </p>
                  
                  <div className="mx-auto max-w-xs">
                    <img 
                      src={twoFactorQrCode} 
                      alt="2FA QR Code" 
                      className="mx-auto h-64 w-64 rounded-md border border-gray-300"
                    />
                  </div>
                  
                  {twoFactorSecret && (
                    <div>
                      <p className="font-medium text-gray-700">
                        Or manually enter this code:
                      </p>
                      <p className="mt-1 font-mono text-sm">
                        {twoFactorSecret}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="verificationCode" className="mb-1 block text-sm font-medium text-gray-700">
                      2. Enter the 6-digit verification code from your app
                    </label>
                    <input
                      type="text"
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                      placeholder="e.g. 123456"
                      maxLength={6}
                      pattern="[0-9]{6}"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={verify2FA}
                      disabled={isLoading2FA}
                      className="flex-1 rounded-md bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:bg-violet-300"
                    >
                      {isLoading2FA ? (
                        <>
                          <span className="flex items-center justify-center">
                            <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </span>
                        </>
                      ) : (
                        "Verify and Enable"
                      )}
                    </button>
                    
                    <button
                      onClick={() => setTwoFactorSetupStep("initial")}
                      disabled={isLoading2FA}
                      className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {recoveryCodes.length > 0 && (
                <div className="mt-6 rounded-md bg-yellow-50 p-4">
                  <h3 className="mb-2 text-base font-medium text-yellow-800">
                    Save your recovery codes
                  </h3>
                  <p className="mb-2 text-sm text-yellow-700">
                    Keep these recovery codes in a safe place. You can use them to sign in if you lose access to your authenticator app.
                  </p>
                  <div className="mt-2 rounded-md bg-gray-100 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {recoveryCodes.map((code, index) => (
                        <div key={index} className="font-mono text-sm">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification Preferences Section */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center">
            <FaBell className="mr-2 h-5 w-5 text-violet-600" />
            <h2 className="text-xl font-semibold text-gray-800">Notification Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-gray-800">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive notifications about new bookings and messages</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('emailNotifications')}
                className="text-violet-600 focus:outline-none"
                aria-label={notificationPreferences.emailNotifications ? "Disable email notifications" : "Enable email notifications"}
              >
                {notificationPreferences.emailNotifications ? (
                  <FaToggleOn className="h-6 w-6" />
                ) : (
                  <FaToggleOff className="h-6 w-6" />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-gray-800">Booking Reminders</h3>
                <p className="text-sm text-gray-500">Receive reminders about upcoming bookings</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('bookingReminders')}
                className="text-violet-600 focus:outline-none"
                aria-label={notificationPreferences.bookingReminders ? "Disable booking reminders" : "Enable booking reminders"}
              >
                {notificationPreferences.bookingReminders ? (
                  <FaToggleOn className="h-6 w-6" />
                ) : (
                  <FaToggleOff className="h-6 w-6" />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-gray-800">Marketing Emails</h3>
                <p className="text-sm text-gray-500">Receive promotional and marketing materials</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('marketingEmails')}
                className="text-violet-600 focus:outline-none"
                aria-label={notificationPreferences.marketingEmails ? "Disable marketing emails" : "Enable marketing emails"}
              >
                {notificationPreferences.marketingEmails ? (
                  <FaToggleOn className="h-6 w-6" />
                ) : (
                  <FaToggleOff className="h-6 w-6" />
                )}
              </button>
            </div>
            
            <button
              onClick={handleSaveNotificationPreferences}
              disabled={isLoading2FA}
              className="mt-2 flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:bg-violet-300"
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
  );
} 