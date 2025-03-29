"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaUserCog, FaChartBar, FaCreditCard, FaFileAlt, FaUsers, FaTicketAlt, FaCalendarCheck, FaExclamationTriangle, FaComment } from "react-icons/fa";
import { format } from "date-fns";

// Define types for the dashboard data
interface DashboardData {
  users: {
    total: number;
    byRole: {
      total: number;
      parent: number;
      childminder: number;
      admin: number;
      user: number;
    };
    newRegistrations: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
  };
  subscriptions: {
    active: number;
    byStatus: {
      FREE: number;
      BASIC: number;
      PREMIUM: number;
      TRIAL: number;
    };
    recentChanges: Array<{
      id: string;
      plan: string | null;
      status: string | null;
      cancelAtPeriodEnd: boolean;
      user: {
        name: string | null;
        email: string | null;
      } | null;
      updatedAt: string;
    }>;
  };
  bookings: {
    total: number;
    byStatus: {
      PENDING: number;
      CONFIRMED: number;
      CANCELLED: number;
      LATE_CANCELLED: number;
      COMPLETED: number;
    };
  };
  supportTickets: {
    open: number;
    byPriority: Record<string, number>;
  };
  documents: {
    pendingReview: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    details: string | null;
    timestamp: string;
    user: {
      name: string | null;
      email: string | null;
      role: string;
    } | null;
  }>;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        
        if (!response.ok) {
          throw new Error(`Error fetching dashboard data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if user is authenticated and has admin role
    if (status === "authenticated" && session?.user.role === "admin") {
      fetchDashboardData();
    }
  }, [status, session]);

  // Authentication check
  useEffect(() => {
    // Check if the user is authenticated and has the admin role
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && session.user.role !== "admin") {
      // Redirect to appropriate dashboard based on role
      if (session.user.role === "parent") {
        router.push("/dashboard/parent");
      } else if (session.user.role === "childminder") {
        router.push("/dashboard/childminder");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);

  // Show loading state while checking authentication or loading data
  if (status === "loading" || (isLoading && !error)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Admin Dashboard</h1>
        </div>
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <p>Failed to load dashboard data: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard content
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Admin Dashboard</h1>
        <div className="mt-2 flex items-center sm:mt-0">
          <span className="mr-2 inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-green-500"></span>
          <span className="text-sm text-gray-700">Admin Access</span>
        </div>
      </div>
      
      {/* Key Metrics Summary */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {/* Users Metric */}
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-blue-600">
              <FaUsers className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Users</h2>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-blue-800">{dashboardData?.users.total || 0}</p>
            <p className="text-xs text-gray-700">Total registered users</p>
          </div>
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-gray-800">Parents:</span>
              <span className="font-medium text-gray-900">{dashboardData?.users.byRole.parent || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-800">Childminders:</span>
              <span className="font-medium text-gray-900">{dashboardData?.users.byRole.childminder || 0}</span>
            </div>
            <div className="mt-2 text-xs font-medium text-green-800">
              +{dashboardData?.users.newRegistrations.today || 0} today
            </div>
          </div>
        </div>
        
        {/* Subscriptions Metric */}
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
              <FaCreditCard className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Subscriptions</h2>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-indigo-800">{dashboardData?.subscriptions.active || 0}</p>
            <p className="text-xs text-gray-700">Active subscriptions</p>
          </div>
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-gray-800">Basic:</span>
              <span className="font-medium text-gray-900">{dashboardData?.subscriptions.byStatus.BASIC || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-800">Premium:</span>
              <span className="font-medium text-gray-900">{dashboardData?.subscriptions.byStatus.PREMIUM || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-800">Trial:</span>
              <span className="font-medium text-gray-900">{dashboardData?.subscriptions.byStatus.TRIAL || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Bookings Metric */}
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-green-100 text-green-600">
              <FaCalendarCheck className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Bookings</h2>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-green-800">{dashboardData?.bookings.total || 0}</p>
            <p className="text-xs text-gray-700">Total bookings</p>
          </div>
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-gray-800">Confirmed:</span>
              <span className="font-medium text-gray-900">{dashboardData?.bookings.byStatus.CONFIRMED || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-800">Pending:</span>
              <span className="font-medium text-gray-900">{dashboardData?.bookings.byStatus.PENDING || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-800">Completed:</span>
              <span className="font-medium text-gray-900">{dashboardData?.bookings.byStatus.COMPLETED || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Support Tickets Metric */}
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 text-amber-600">
              <FaTicketAlt className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Support</h2>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-amber-800">{dashboardData?.supportTickets.open || 0}</p>
            <p className="text-xs text-gray-700">Open tickets</p>
          </div>
          <div className="text-sm">
            {dashboardData?.supportTickets.byPriority && Object.entries(dashboardData.supportTickets.byPriority).map(([priority, count]) => (
              <div key={priority} className="flex justify-between">
                <span className="text-gray-800">{priority.toLowerCase()}:</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
            {dashboardData?.documents.pendingReview ? (
              <div className="mt-2 flex items-center text-xs font-medium text-orange-800">
                <FaFileAlt className="mr-1 h-3 w-3" />
                <span>{dashboardData.documents.pendingReview} documents need review</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Management Quick Links */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Management</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                <FaUserCog className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">User Management</h2>
            </div>
            <p className="mb-4 text-sm text-gray-800">Manage users, roles, and permissions</p>
            <button 
              onClick={() => router.push('/dashboard/admin/users')}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto">
              Manage Users
            </button>
          </div>
          
          <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                <FaComment className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Messages</h2>
            </div>
            <p className="mb-4 text-sm text-gray-800">Monitor conversations between platform users</p>
            <button 
              onClick={() => router.push('/dashboard/admin/messages')}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto">
              View Messages
            </button>
          </div>
          
          <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                <FaChartBar className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Analytics</h2>
            </div>
            <p className="mb-4 text-sm text-gray-800">Detailed platform analytics and reports</p>
            <button className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto">
              View Reports
            </button>
          </div>
          
          <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                <FaCreditCard className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Subscriptions</h2>
            </div>
            <p className="mb-4 text-sm text-gray-800">Manage user subscriptions and payments</p>
            <button className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto">
              Manage Plans
            </button>
          </div>
          
          <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                <FaFileAlt className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Verification</h2>
            </div>
            <p className="mb-4 text-sm text-gray-800">Review and approve verification documents</p>
            <button className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto">
              Review Documents
            </button>
          </div>
        </div>
      </div>
      
      {/* Split layout for Recent Activity and Recent Subscriptions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity section */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-gray-900">Recent Activity</h2>
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <div className="max-h-80 overflow-y-auto">
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {dashboardData.recentActivity.map((activity) => (
                    <div key={activity.id} className="py-3">
                      <div className="flex items-start">
                        <div className="mr-2 mt-0.5 h-2 w-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          {activity.details && <p className="text-xs text-gray-800">{activity.details}</p>}
                          <div className="mt-1 flex items-center text-xs text-gray-800">
                            <span className="font-medium">{activity.user?.name || activity.user?.email || "Unknown user"}</span>
                            <span className="mx-1">•</span>
                            <span>{format(new Date(activity.timestamp), 'MMM d, h:mm a')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-gray-800">No recent activity found</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Recent Subscription Changes */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-gray-900">Recent Subscription Changes</h2>
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <div className="max-h-80 overflow-y-auto">
              {dashboardData?.subscriptions.recentChanges && dashboardData.subscriptions.recentChanges.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {dashboardData.subscriptions.recentChanges.map((sub) => (
                    <div key={sub.id} className="py-3">
                      <div className="flex items-start">
                        <div 
                          className={`mr-2 mt-0.5 h-2 w-2 rounded-full ${
                            sub.cancelAtPeriodEnd ? 'bg-orange-500' : 
                            sub.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                          }`}
                        ></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {sub.cancelAtPeriodEnd ? 'Cancellation Scheduled' : 
                             sub.status === 'active' ? 'Subscription Activated' : 
                             sub.status || 'Status Update'}
                            {sub.plan ? ` - ${sub.plan}` : ''}
                          </p>
                          <div className="mt-1 flex items-center text-xs text-gray-800">
                            <span className="font-medium">{sub.user?.name || sub.user?.email || "Unknown user"}</span>
                            <span className="mx-1">•</span>
                            <span>{format(new Date(sub.updatedAt), 'MMM d, h:mm a')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-gray-800">No recent subscription changes</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 