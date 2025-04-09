"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  FaCalendarAlt, 
  FaClock, 
  FaComments, 
  FaUserEdit, 
  FaFileAlt,
  FaCreditCard,
  FaArrowRight,
  FaCalendarCheck,
  FaEnvelope,
  FaBell,
  FaQuestionCircle,
  FaHistory,
  FaFilePdf
} from "react-icons/fa";
import { format } from "date-fns";
import { getSubscriptionDetails, hasValidSubscription } from "@/lib/subscription";

// Types for dashboard stats
interface DashboardStats {
  pendingBookings: number;
  unreadMessages: number;
  upcomingBookings: {
    today: number;
    thisWeek: number;
  };
  profileCompleteness: number;
  subscriptionStatus: string;
  subscriptionEndDate?: Date;
}

export default function ChildminderDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if the user is authenticated and has the childminder role
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      // Check subscription status first
      if (!hasValidSubscription(session.user)) {
        router.push("/subscription?required=true");
        return;
      }
      
      // Then check role
      if (session.user.role !== "childminder") {
        // Redirect to appropriate dashboard based on role
        if (session.user.role === "admin") {
          router.push("/dashboard/admin");
        } else if (session.user.role === "parent") {
          router.push("/dashboard/parent");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [status, session, router]);

  // Fetch dashboard stats
  useEffect(() => {
    if (status === "authenticated" && session.user.role === "childminder") {
      fetchDashboardStats();
    }
  }, [status, session]);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/childminder/stats");
      
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError("Unable to load dashboard statistics. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (status === "loading" || !session) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  // Loading state for dashboard stats
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Welcome, {session.user.name}</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your childminding business and appointments</p>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
          <span className="ml-3 text-sm font-medium text-gray-700">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Welcome, {session.user.name}</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your childminding business and appointments</p>
        </header>
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaBell className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={fetchDashboardStats}
                  className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If stats haven't loaded yet, show sample data
  const dashboardStats = stats || {
    pendingBookings: 0,
    unreadMessages: 0,
    upcomingBookings: {
      today: 0,
      thisWeek: 0
    },
    profileCompleteness: 50,
    subscriptionStatus: session.user.subscriptionStatus,
    subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };

  // Childminder dashboard content
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Welcome, {session.user.name}</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your childminding business and appointments</p>
      </header>
      
      {/* Stats overview */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {/* Pending bookings */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Bookings</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{dashboardStats.pendingBookings}</p>
            </div>
            <div className="rounded-full bg-violet-100 p-3">
              <FaCalendarCheck className="h-6 w-6 text-violet-600" />
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/childminder/bookings?status=PENDING')}
            className="mt-4 flex items-center text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            View Pending <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>

        {/* Unread messages */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Unread Messages</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{dashboardStats.unreadMessages}</p>
            </div>
            <div className="rounded-full bg-violet-100 p-3">
              <FaEnvelope className="h-6 w-6 text-violet-600" />
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/childminder/messages')}
            className="mt-4 flex items-center text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            View Messages <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>

        {/* Today's bookings */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Bookings</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{dashboardStats.upcomingBookings.today}</p>
            </div>
            <div className="rounded-full bg-violet-100 p-3">
              <FaCalendarAlt className="h-6 w-6 text-violet-600" />
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/childminder/calendar')}
            className="mt-4 flex items-center text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            View Calendar <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>

        {/* Profile completeness */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Profile Completeness</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{dashboardStats.profileCompleteness}%</p>
            </div>
            <div className="rounded-full bg-violet-100 p-3">
              <FaUserEdit className="h-6 w-6 text-violet-600" />
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
            <div 
              className="h-2 rounded-full bg-violet-600" 
              style={{ width: `${dashboardStats.profileCompleteness}%` }}
            ></div>
          </div>
          <button
            onClick={() => router.push('/dashboard/childminder/profile')}
            className="mt-4 flex items-center text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            Complete Profile <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
      </div>
      
      {/* Main sections */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaCalendarAlt className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">My Bookings</h2>
          <p className="mb-4 text-sm text-gray-600">View upcoming appointments, manage schedules, and confirm new booking requests.</p>
          <button 
            onClick={() => router.push('/dashboard/childminder/bookings')}
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View Bookings <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaClock className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Calendar</h2>
          <p className="mb-4 text-sm text-gray-600">Check your availability, schedule appointments, and manage your time effectively.</p>
          <button 
            onClick={() => router.push('/dashboard/childminder/calendar')}
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View Calendar <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaComments className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Messages</h2>
          <p className="mb-4 text-sm text-gray-600">Communicate with parents, send updates about children, and manage conversations.</p>
          <button 
            onClick={() => router.push('/dashboard/childminder/messages')}
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View Messages <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaFilePdf className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Documents</h2>
          <p className="mb-4 text-sm text-gray-600">Upload and manage your verification documents, certifications, and qualifications.</p>
          <button 
            onClick={() => router.push('/dashboard/childminder/documents')}
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Manage Documents <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaUserEdit className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">My Profile</h2>
          <p className="mb-4 text-sm text-gray-600">Update your professional profile, showcase your skills, and highlight your experience.</p>
          <button 
            onClick={() => router.push('/dashboard/childminder/profile')}
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Edit Profile <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaFileAlt className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Settings</h2>
          <p className="mb-4 text-sm text-gray-600">Manage your account settings, update your password, and set up two-factor authentication.</p>
          <button 
            onClick={() => router.push('/dashboard/childminder/settings')}
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Manage Settings <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaHistory className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Activity Log</h2>
          <p className="mb-4 text-sm text-gray-600">Track your booking history, payments, and account activity in a comprehensive timeline.</p>
          <button 
            onClick={() => router.push('/dashboard/childminder/activity')}
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View Activity <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaCreditCard className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Subscription</h2>
          <p className="mb-4 text-sm text-gray-600">
            {dashboardStats.subscriptionStatus === 'PREMIUM' || dashboardStats.subscriptionStatus === 'ACTIVE' ? (
              <>
                <span className="font-medium text-green-600">Your premium plan is active.</span>
                {dashboardStats.subscriptionEndDate && (
                  <span className="block mt-1">
                    Renews on {format(new Date(dashboardStats.subscriptionEndDate), 'dd MMM yyyy')}.
                  </span>
                )}
              </>
            ) : (
              <>
                {dashboardStats.subscriptionStatus === 'TRIALING' ? (
                  <>
                    <span className="font-medium text-blue-600">
                      {getSubscriptionDetails({ subscriptionStatus: dashboardStats.subscriptionStatus, trialEndDate: dashboardStats.subscriptionEndDate }).statusText}
                    </span>
                  </>
                ) : (
                  'Upgrade to a premium plan to access all features and benefits.'
                )}
              </>
            )}
          </p>
          <button 
            onClick={() => router.push('/dashboard/childminder/subscription')} 
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Manage Subscription <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaQuestionCircle className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Help & Support</h2>
          <p className="mb-4 text-sm text-gray-600">Get help with your account, answer common questions, and contact support.</p>
          <button 
            onClick={() => router.push('/dashboard/childminder/help')} 
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Get Help <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
} 