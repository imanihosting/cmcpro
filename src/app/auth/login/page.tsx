"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEnvelope, FaLock, FaSpinner, FaBaby, FaTools } from "react-icons/fa";
import { inputWithIconClass, checkboxClass } from '@/components/ui/InputStyles';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isCheckingMaintenance, setIsCheckingMaintenance] = useState(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState("The system is currently undergoing maintenance.");

  // Check if the system is in maintenance mode
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/system/maintenance');
        if (response.ok) {
          const data = await response.json();
          
          if (data.maintenanceMode === true) {
            setIsMaintenance(true);
            if (data.maintenanceMessage) {
              setMaintenanceMessage(data.maintenanceMessage);
            }
          }
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      } finally {
        setIsCheckingMaintenance(false);
      }
    };
    
    checkMaintenanceMode();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Always attempt to sign in - whether in maintenance mode or not
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      // If we're in maintenance mode, verify admin access
      if (isMaintenance) {
        try {
          const userResponse = await fetch('/api/users/me');
          if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
          }
          
          const userData = await userResponse.json();
          
          if (userData.role !== 'admin') {
            // Not an admin, sign them out and show maintenance message
            console.log("Non-admin attempted login during maintenance mode");
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/maintenance');
            return;
          }
          
          // Is admin, allow them through to dashboard
          console.log("Admin login during maintenance mode successful");
          redirectToDashboard('admin');
          return;
        } catch (error) {
          console.error("Error verifying admin role:", error);
          setError("Authentication error. Please try again.");
          setIsLoading(false);
          return;
        }
      }

      // Normal flow (not in maintenance mode)
      // Get user role to redirect to the correct dashboard
      try {
        const userResponse = await fetch('/api/users/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          redirectToDashboard(userData.role);
        } else {
          // Fallback to generic dashboard redirect
          redirectToDashboard();
        }
      } catch (error) {
        // Fallback to generic dashboard redirect
        console.error("Error fetching user role:", error);
        redirectToDashboard();
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Helper function to handle redirects
  const redirectToDashboard = (role?: string) => {
    console.log(`Redirecting to dashboard for role: ${role || 'unknown'}`);
    
    // Force a hard navigation to ensure the page fully refreshes
    if (role) {
      // Redirect to role-specific dashboard
      window.location.href = `/dashboard/${role}`;
    } else {
      // Generic redirect (Next.js will handle role-based routing)
      window.location.href = '/dashboard';
    }
  };

  // Show maintenance notice if in maintenance mode
  if (isMaintenance && !isCheckingMaintenance) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <FaTools className="h-16 w-16 text-violet-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">Maintenance Mode</h2>
            <p className="mt-2 text-gray-600">
              {maintenanceMessage}
            </p>
          </div>
          
          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500 text-center mb-6">
              If you are an administrator, you can still log in.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                  <div className="text-sm font-medium text-red-700">{error}</div>
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <FaEnvelope className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputWithIconClass}
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <FaLock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputWithIconClass}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-lg bg-violet-600 py-3 px-4 font-medium text-white shadow-md transition-all hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Admin Sign In"
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <Link href="/maintenance" className="text-sm font-medium text-violet-600 hover:text-violet-500">
                View Maintenance Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCheckingMaintenance) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <FaSpinner className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - login form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex items-center space-x-2">
                <FaBaby className="h-8 w-8 text-violet-600" />
                <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
                  ChildminderConnect
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200 shadow-sm">
              <div className="text-sm font-medium text-red-700">{error}</div>
            </div>
          )}

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <FaEnvelope className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputWithIconClass}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="text-sm">
                    <Link
                      href="/forgot-password"
                      className="font-medium text-violet-600 hover:text-violet-500"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <FaLock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputWithIconClass}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className={checkboxClass}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 py-3 px-4 font-medium text-white shadow-md transition-all hover:from-violet-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account?</span>{" "}
            <Link 
              href="/auth/register" 
              className="font-medium text-violet-600 hover:text-violet-500"
            >
              Register now
            </Link>
          </div>
        </div>
      </div>
      
      {/* Right side - decorative gradient */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-r from-violet-600 to-purple-700">
        <div className="flex h-full flex-col items-center justify-center px-12 text-white">
          <h2 className="mb-6 text-4xl font-bold">Quality Childcare at Your Fingertips</h2>
          <p className="mb-8 text-xl opacity-90">
            Connect with trusted childminders across Ireland for exceptional care
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-center">
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold">2,000+</p>
              <p className="text-sm">Families served</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm">Verified childminders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 