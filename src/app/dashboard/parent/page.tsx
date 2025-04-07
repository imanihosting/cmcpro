"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense, useRef } from "react";
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
  FaBookOpen,
  FaClock,
  FaCommentSlash,
  FaUser
} from "react-icons/fa";
import { ReactNode } from "react";
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import AIRecommendations from '@/components/dashboard/parent/AIRecommendations';
import { FiSearch, FiCalendar } from "react-icons/fi";
import { AlertTriangle } from "lucide-react";
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';

// Define types for the components
interface DashboardCardProps {
  icon: ReactNode;
  title: string;
  description: string | ReactNode;
  linkText?: string;
  linkHref?: string;
  onClick?: () => void;
  color?: "violet" | "indigo" | "purple";
}

interface StatsCardProps {
  icon: ReactNode;
  title: string;
  value: string | number | ReactNode;
  trend?: number;
  color?: "violet" | "indigo" | "purple";
}

// New interface for booking data
interface BookingChild {
  id: string;
  name: string;
  age: number;
}

interface Childminder {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  childminder: Childminder;
  children: BookingChild[];
  bookingType: string;
  isEmergency: boolean;
  isRecurring: boolean;
}

// New interface for message data
interface MessageSender {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender: MessageSender;
}

// Define types for dashboard stats
interface DashboardStats {
  upcomingBookings: number;
  unreadMessages: { 
    count: number; 
    trend: number;
  };
  childrenRegistered: number;
  subscriptionStatus: string;
  subscriptionEndDate?: string | null;
}

// Card component for dashboard items
function DashboardCard({ 
  icon, 
  title, 
  description, 
  linkText, 
  linkHref, 
  onClick,
  color = "violet" 
}: DashboardCardProps) {
  const colorClasses = {
    violet: "text-violet-600 bg-violet-50 hover:bg-violet-100",
    indigo: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100",
    purple: "text-purple-600 bg-purple-50 hover:bg-purple-100",
  };
  
  const Content = () => (
    <>
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
        color === "violet" ? "bg-violet-100 text-violet-600" : 
        color === "indigo" ? "bg-indigo-100 text-indigo-600" : 
        "bg-purple-100 text-purple-600"
      }`}>
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mb-4 text-sm text-gray-600">{description}</p>
      {linkText && (
        <div className="mt-auto">
          <span className={`font-medium ${
            color === "violet" ? "text-violet-600" : 
            color === "indigo" ? "text-indigo-600" : 
            "text-purple-600"
          }`}>
            {linkText} &rarr;
          </span>
        </div>
      )}
    </>
  );
  
  return (
    <div className="flex min-h-[12rem] flex-col rounded-lg bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
      {linkHref ? (
        <Link href={linkHref} className="flex h-full flex-col">
          <Content />
        </Link>
      ) : onClick ? (
        <button onClick={onClick} className="flex h-full flex-col text-left">
          <Content />
        </button>
      ) : (
        <Content />
      )}
    </div>
  );
}

// Stats card component for dashboard
function StatsCard({ 
  icon, 
  title, 
  value, 
  trend, 
  color = "violet" 
}: StatsCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-center">
        <div className={`mr-4 flex h-10 w-10 items-center justify-center rounded-full ${
          color === "violet" ? "bg-violet-100 text-violet-600" : 
          color === "indigo" ? "bg-indigo-100 text-indigo-600" : 
          "bg-purple-100 text-purple-600"
        }`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center">
            {typeof value === 'string' || typeof value === 'number' ? (
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            ) : (
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
            )}
            {trend !== undefined && (
              <span className={`ml-2 flex items-center text-sm font-medium ${
                trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-500"
              }`}>
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { searchParams, SearchParamsListener } = useSafeSearchParams();
  const [greeting, setGreeting] = useState<string>('');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    upcomingBookings: 0,
    unreadMessages: { count: 0, trend: 0 },
    childrenRegistered: 0,
    subscriptionStatus: 'INACTIVE',
    subscriptionEndDate: null
  });
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onboardingCheckedRef = useRef(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent("/dashboard/parent")}`);
      return;
    }

    if (status === "authenticated") {
      // Check subscription status first
      if (session.user.subscriptionStatus === "FREE") {
        router.push("/subscription?required=true");
        return;
      }

      // Handle redirect from onboarding - ONLY CHECK ONCE
      if (searchParams && searchParams.has("onboarding") && 
          session.user.role === "parent" && 
          !onboardingCheckedRef.current) {
        onboardingCheckedRef.current = true;
        // Show onboarding success message if needed
      }
    }
  }, [status, session, router, searchParams]);

  // Fetch dashboard data - only fetch when session changes
  useEffect(() => {
    if (session?.user) {
      const fetchDashboardStats = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/dashboard/parent/stats');
          
          if (!response.ok) {
            throw new Error('Failed to fetch dashboard statistics');
          }
          
          const data = await response.json();
          setDashboardStats(data);
        } catch (err: any) {
          setError(err.message || 'Error loading dashboard stats');
          console.error('Dashboard stats error:', err);
        } finally {
          setIsLoading(false);
        }
      };

      const fetchUpcomingBookings = async () => {
        try {
          setBookingsLoading(true);
          const response = await fetch('/api/dashboard/parent/bookings');
          
          if (!response.ok) {
            throw new Error('Failed to fetch upcoming bookings');
          }
          
          const data = await response.json();
          setUpcomingBookings(data.bookings || []);
        } catch (err) {
          console.error('Error loading bookings:', err);
        } finally {
          setBookingsLoading(false);
        }
      };

      const fetchMessages = async () => {
        try {
          setMessagesLoading(true);
          const response = await fetch('/api/dashboard/parent/messages');
          
          if (!response.ok) {
            throw new Error('Failed to fetch messages');
          }
          
          const data = await response.json();
          setMessages(data.messages || []);
        } catch (err) {
          console.error('Error loading messages:', err);
        } finally {
          setMessagesLoading(false);
        }
      };

      // Set a greeting based on time of day
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');
      
      if (session.user.role === 'parent') {
        fetchDashboardStats();
        fetchUpcomingBookings();
        fetchMessages();
      } else {
        // Redirect if not a parent
        router.push('/dashboard');
      }
    }
  }, [session, router]); // Removed searchParams from dependency array

  // Format subscription status for display
  const formatSubscriptionStatus = (status: string) => {
    if (!status) return '';
    
    // Convert from UPPER_CASE to Proper Case
    return status.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format message time
  const formatMessageTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Show loading state while checking authentication
  if (status === "loading" || !session) {
    return <LoadingSpinner fullPage />;
  }

  // Parent dashboard content
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Only render the SearchParamsListener once */}
      {status === "authenticated" && <SearchParamsListener />}
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
            {error && (
              <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard 
              icon={<FaCalendarAlt className="h-5 w-5" />}
              title="Upcoming Bookings" 
              value={isLoading ? "..." : dashboardStats.upcomingBookings}
              color="violet"
            />
            <StatsCard 
              icon={<FaComments className="h-5 w-5" />}
              title="New Messages" 
              value={isLoading ? "..." : dashboardStats.unreadMessages.count}
              trend={isLoading || dashboardStats.unreadMessages.trend === null ? undefined : Number(dashboardStats.unreadMessages.trend)}
              color="indigo"
            />
            <StatsCard 
              icon={<FaChild className="h-5 w-5" />}
              title="Children Registered" 
              value={isLoading ? "..." : dashboardStats.childrenRegistered}
              color="purple"
            />
            <StatsCard 
              icon={<FaChartLine className="h-5 w-5" />}
              title="Subscription Status" 
              value={isLoading ? "..." : (
                <div>
                  <span className="mr-1">{formatSubscriptionStatus(dashboardStats.subscriptionStatus)}</span>
                  {(dashboardStats.subscriptionStatus === 'PREMIUM' || dashboardStats.subscriptionStatus === 'ACTIVE') && dashboardStats.subscriptionEndDate && (
                    <span className="text-xs font-normal block">
                      Renews: {new Date(dashboardStats.subscriptionEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              )}
              color="violet"
            />
          </div>
        </section>
        
        {/* Quick actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashboardCard
              icon={<FiSearch className="h-5 w-5" />}
              title="Find Childminders"
              description="Search and browse our directory of trusted childminders"
              linkText="Find Now"
              linkHref="/dashboard/parent/find-childminders"
              color="violet"
            />
            
            <DashboardCard
              icon={<FiCalendar className="h-5 w-5" />}
              title="Book Childcare"
              description="Schedule regular childcare with your preferred childminders"
              linkText="Book Now"
              linkHref="/dashboard/parent/bookings/create"
              color="indigo"
            />
            
            <DashboardCard
              icon={<AlertTriangle className="h-5 w-5" />}
              title="Emergency Childcare"
              description="Need urgent childcare? Request immediate help from available childminders"
              linkText="Request Now"
              linkHref="/dashboard/parent/emergency-booking"
              color="purple"
            />
          </div>
        </div>
        
        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Upcoming bookings section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Bookings</h2>
              <Link 
                href="/dashboard/parent/bookings"
                className="text-sm font-medium text-violet-600 hover:text-violet-800"
              >
                View all
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {bookingsLoading ? (
                <div className="p-6 text-center">
                  <LoadingSpinner />
                  <p className="mt-2 text-sm text-gray-500">Loading your upcoming bookings...</p>
                </div>
              ) : upcomingBookings.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <FaCalendarAlt className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-gray-900">No upcoming bookings</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new booking.</p>
                  <div className="mt-6">
                    <Link
                      href="/dashboard/parent/bookings/new"
                      className="inline-flex items-center rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500"
                    >
                      <FaCalendarAlt className="-ml-0.5 mr-1.5 h-4 w-4" />
                      New Booking
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {upcomingBookings.map(booking => (
                    <div key={booking.id} className="p-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {booking.childminder.image ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={booking.childminder.image}
                                alt={booking.childminder.name}
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                                <FaChild className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{booking.childminder.name}</h3>
                            <div className="mt-1 flex items-center">
                              <FaClock className="mr-1.5 h-3 w-3 text-gray-500" />
                              <p className="text-xs text-gray-500">
                                {formatDate(booking.startTime)} - {formatDate(booking.endTime)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            booking.status === 'CONFIRMED' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                          </span>
                          {booking.isEmergency && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                              Emergency
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {booking.children.map(child => (
                            <span key={child.id} className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              {child.name}, {child.age}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Recent messages section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Messages</h2>
              <Link 
                href="/dashboard/parent/messages"
                className="text-sm font-medium text-violet-600 hover:text-violet-800"
              >
                View all
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {messagesLoading ? (
                <div className="p-6 text-center">
                  <LoadingSpinner />
                  <p className="mt-2 text-sm text-gray-500">Loading your messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <FaComments className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-gray-900">No new messages</h3>
                  <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {messages.map(message => (
                    <div key={message.id} className="p-4 sm:px-6">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {message.sender.image ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={message.sender.image}
                              alt={message.sender.name}
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                              <FaChild className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {message.sender.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {message.content}
                          </p>
                          <div className="mt-2">
                            <Link
                              href={`/dashboard/parent/messages?conversation=${message.sender.id}`}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                            >
                              Read message
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
        
        {/* AI Recommendations section */}
        <section className="mb-8">
          <AIRecommendations />
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
              description={
                dashboardStats.subscriptionStatus === 'PREMIUM' || dashboardStats.subscriptionStatus === 'ACTIVE'
                  ? <>
                      <span className="font-medium text-green-600">Your premium plan is active.</span>
                      {dashboardStats.subscriptionEndDate && 
                        <span className="block mt-1">
                          Renews on {new Date(dashboardStats.subscriptionEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
                        </span>
                      }
                    </>
                  : 'Upgrade to a premium plan to access all features and benefits.'
              }
              linkText="Manage Subscription"
              linkHref="/dashboard/parent/subscription"
              color="purple"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ParentDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <LoadingSpinner size="large" />
    </div>}>
      <DashboardContent />
    </Suspense>
  );
} 