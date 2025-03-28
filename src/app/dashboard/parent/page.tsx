"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { 
  FaChild, 
  FaSearch, 
  FaCalendarAlt, 
  FaComments, 
  FaCreditCard,
  FaQuestionCircle,
  FaBell,
  FaChartLine,
  FaBookOpen
} from "react-icons/fa";
import { ReactNode } from "react";

// Define types for the components
interface DashboardCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  linkText: string;
  linkHref?: string;
  onClick?: (() => void) | null;
  color?: 'violet' | 'indigo' | 'purple';
}

interface StatsCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  trend?: { positive: boolean; value: number } | null;
  color?: 'violet' | 'indigo' | 'purple';
}

// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="flex h-[calc(100vh-64px)] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
  </div>
);

// Card component for dashboard items
const DashboardCard: React.FC<DashboardCardProps> = ({ 
  icon, 
  title, 
  description, 
  linkText, 
  linkHref = '', 
  onClick = null,
  color = "violet" 
}) => {
  const colorClasses = {
    violet: {
      bgLight: "bg-violet-100",
      text: "text-violet-600",
      hover: "hover:text-violet-700"
    },
    indigo: {
      bgLight: "bg-indigo-100",
      text: "text-indigo-600",
      hover: "hover:text-indigo-700"
    },
    purple: {
      bgLight: "bg-purple-100",
      text: "text-purple-600",
      hover: "hover:text-purple-700"
    }
  };

  const colors = colorClasses[color];

  return (
    <div className="rounded-lg bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${colors.bgLight} ${colors.text}`}>
        {icon}
      </div>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mb-4 text-sm text-gray-600">{description}</p>
      {onClick ? (
        <button 
          onClick={onClick}
          className={`flex items-center text-sm font-medium ${colors.text} ${colors.hover}`}
        >
          {linkText}
          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <Link 
          href={linkHref} 
          className={`flex items-center text-sm font-medium ${colors.text} ${colors.hover}`}
        >
          {linkText}
          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
};

// Stats Card component
const StatsCard: React.FC<StatsCardProps> = ({ icon, title, value, trend = null, color = "violet" }) => {
  const colorClasses = {
    violet: {
      bgLight: "bg-violet-100",
      text: "text-violet-600"
    },
    indigo: {
      bgLight: "bg-indigo-100",
      text: "text-indigo-600"
    },
    purple: {
      bgLight: "bg-purple-100",
      text: "text-purple-600"
    }
  };

  const colors = colorClasses[color];
  
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">{title}</p>
          <h3 className="mt-1 text-xl font-semibold text-gray-900">{value}</h3>
          {trend && (
            <span className={`mt-1 text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}%
            </span>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.bgLight} ${colors.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Component with client-side data fetching that needs to be wrapped in Suspense
function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    // Check if the user is authenticated and has the parent role
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      // Check subscription status first
      if (session.user.subscriptionStatus === "FREE") {
        router.push("/subscription?required=true");
        return;
      }
      
      // Then check role
      if (session.user.role !== "parent") {
        // Redirect to appropriate dashboard based on role
        if (session.user.role === "admin") {
          router.push("/dashboard/admin");
        } else if (session.user.role === "childminder") {
          router.push("/dashboard/childminder");
        } else {
          router.push("/dashboard");
        }
      }
    }

    // Set greeting based on time of day
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      setGreeting("Good morning");
    } else if (currentHour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, [status, session, router, searchParams]);

  // Show loading state while checking authentication
  if (status === "loading" || !session) {
    return <LoadingSpinner />;
  }

  // Parent dashboard content
  return (
    <div>
      {/* Welcome section with stats */}
      <section className="mb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {greeting}, {session.user.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here's what's happening with your childcare services
          </p>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            icon={<FaCalendarAlt className="h-5 w-5" />}
            title="Upcoming Bookings" 
            value="3" 
            color="violet"
          />
          <StatsCard 
            icon={<FaComments className="h-5 w-5" />}
            title="New Messages" 
            value="5" 
            trend={{ positive: true, value: 12 }}
            color="indigo"
          />
          <StatsCard 
            icon={<FaChild className="h-5 w-5" />}
            title="Children Registered" 
            value="2" 
            color="purple"
          />
          <StatsCard 
            icon={<FaChartLine className="h-5 w-5" />}
            title="Subscription Status" 
            value="Premium" 
            color="violet"
          />
        </div>
      </section>
      
      {/* Quick actions section */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <Link 
            href="/dashboard/parent/bookings/new"
            className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <FaCalendarAlt className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-900">New Booking</span>
          </Link>
          
          <Link 
            href="/dashboard/parent/find-childminders"
            className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <FaSearch className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-900">Find Childminders</span>
          </Link>
          
          <Link 
            href="/dashboard/parent/messages"
            className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <FaComments className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-900">Messages</span>
          </Link>

          <Link 
            href="/dashboard/parent/children"
            className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <FaChild className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-900">My Children</span>
          </Link>

          <Link 
            href="/subscription"
            className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <FaCreditCard className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-900">Subscription</span>
          </Link>

          <Link 
            href="/dashboard/parent/help"
            className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <FaQuestionCircle className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-900">Help & Support</span>
          </Link>
        </div>
      </section>
      
      {/* Main services section */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Manage Your Services</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            icon={<FaChild className="h-5 w-5" />}
            title="My Children"
            description="Add and manage your children's profiles, preferences, and special requirements."
            linkText="Manage Children"
            linkHref="/dashboard/parent/children"
            color="violet"
          />
          
          <DashboardCard
            icon={<FaSearch className="h-5 w-5" />}
            title="Find Childminders"
            description="Search for qualified childminders in your area based on your specific needs."
            linkText="Find Now"
            linkHref="/dashboard/parent/find-childminders"
            color="indigo"
          />
          
          <DashboardCard
            icon={<FaCalendarAlt className="h-5 w-5" />}
            title="Bookings"
            description="View upcoming appointments, manage schedules, and make new bookings."
            linkText="View Bookings"
            linkHref="/dashboard/parent/bookings"
            color="purple"
          />
          
          <DashboardCard
            icon={<FaComments className="h-5 w-5" />}
            title="Messages"
            description="Communicate with childminders, receive updates, and manage conversations."
            linkText="View Messages"
            linkHref="/dashboard/parent/messages"
            color="violet"
          />
          
          <DashboardCard
            icon={<FaBookOpen className="h-5 w-5" />}
            title="Activity Log"
            description="Track your booking history, payment records, and service usage."
            linkText="View Activity"
            linkHref="/dashboard/parent/activity"
            color="indigo"
          />
          
          <DashboardCard
            icon={<FaCreditCard className="h-5 w-5" />}
            title="Subscription"
            description="Manage your subscription plan, billing details, and payment methods."
            linkText="Manage Subscription"
            onClick={() => router.push('/subscription')}
            color="purple"
          />
        </div>
      </section>
    </div>
  );
}

export default function ParentDashboard() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardContent />
    </Suspense>
  );
} 