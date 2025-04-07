"use client";

import { useState, useEffect, ReactNode, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import dynamic from 'next/dynamic';
import { useMaintenanceMode } from "@/lib/MaintenanceContext";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import { 
  FaBaby, 
  FaTachometerAlt, 
  FaSearch, 
  FaCalendarAlt, 
  FaComments, 
  FaCreditCard,
  FaQuestionCircle,
  FaSignOutAlt,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaRegBell,
  FaCog,
  FaHistory,
  FaFileAlt,
  FaChartLine,
  FaShieldAlt,
  FaTools
} from "react-icons/fa";
import Header from "@/components/Header";

// Dynamically import the chat widget to reduce initial bundle size
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  ssr: false,
  loading: () => null,
});

// Define type for sidebar link
interface SidebarLink {
  href: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
}

// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
  </div>
);

// Sidebar component with dynamic import
const Sidebar = dynamic(
  () => import('../components/Sidebar').then((mod) => mod.default),
  {
    loading: () => (
      <aside className="fixed inset-y-0 left-0 z-30 w-64 transform bg-white pt-16 shadow-lg md:pt-16 md:translate-x-0 md:static md:z-0 -translate-x-full">
        <div className="h-full flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
        </div>
      </aside>
    ),
    ssr: false,
  }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const { isInMaintenance, isLoading: maintenanceLoading, checkMaintenanceMode } = useMaintenanceMode();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Maintenance mode check - prevent all dashboard access for non-admins
  useEffect(() => {
    const checkAccess = async () => {
      if (status === "authenticated") {
        const isAdmin = session?.user?.role === "admin";
        
        // Force re-check maintenance status to ensure we have the latest
        await checkMaintenanceMode();
        
        // If maintenance mode is on and user is not admin, redirect to maintenance page
        if (isInMaintenance && !isAdmin) {
          router.push("/maintenance");
          return;
        }
      }
      setIsChecking(false);
    };

    if (status !== "loading" && !maintenanceLoading) {
      checkAccess();
    }
  }, [status, session, isInMaintenance, maintenanceLoading, router, checkMaintenanceMode]);

  useEffect(() => {
    // Check if the user is authenticated
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // Redirect based on user role if they're at the dashboard root
    if (status === "authenticated" && pathname === "/dashboard") {
      if (session?.user?.role === "admin") {
        router.push("/dashboard/admin");
      } else if (session?.user?.role === "parent") {
        router.push("/dashboard/parent");
      } else if (session?.user?.role === "childminder") {
        router.push("/dashboard/childminder");
      }
    }
  }, [status, session, router, pathname]);

  // Close sidebar when route changes (for mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('overflow-hidden', 'md:overflow-auto');
    } else {
      document.body.classList.remove('overflow-hidden', 'md:overflow-auto');
    }
    
    return () => {
      document.body.classList.remove('overflow-hidden', 'md:overflow-auto');
    };
  }, [sidebarOpen]);

  // Show loading state while checking authentication or maintenance status
  if (status === "loading" || isChecking) {
    return <LoadingSpinner />;
  }

  // Get sidebar links based on user role
  const getSidebarLinks = (): SidebarLink[] => {
    if (!session?.user?.role) return [];

    const links: SidebarLink[] = [
      { href: `/dashboard/${session.user.role}`, label: "Dashboard", icon: <FaTachometerAlt className="h-5 w-5" /> }
    ];

    // Add role-specific links
    if (session.user.role === "parent") {
      links.push(
        { href: "/dashboard/parent/profile", label: "Profile", icon: <FaUserCircle className="h-5 w-5" /> },
        { href: "/dashboard/parent/find-childminders", label: "Find Childminders", icon: <FaSearch className="h-5 w-5" /> },
        { href: "/dashboard/parent/bookings", label: "Bookings", icon: <FaCalendarAlt className="h-5 w-5" /> },
        { href: "/dashboard/parent/messages", label: "Messages", icon: <FaComments className="h-5 w-5" /> },
        { href: "/dashboard/parent/calendar", label: "Calendar", icon: <FaCalendarAlt className="h-5 w-5" /> },
        { href: "/dashboard/parent/activity", label: "Activity", icon: <FaHistory className="h-5 w-5" /> },
        { href: "/dashboard/parent/subscription", label: "Subscription", icon: <FaCreditCard className="h-5 w-5" /> },
        { href: "/dashboard/parent/help", label: "Help & Support", icon: <FaQuestionCircle className="h-5 w-5" /> },
        { href: "/dashboard/parent/settings", label: "Settings", icon: <FaCog className="h-5 w-5" /> }
      );
    }
    // Add childminder and admin links as needed
    // ...
    
    // Add childminder links
    if (session.user.role === "childminder") {
      links.push(
        { href: "/dashboard/childminder/profile", label: "Profile", icon: <FaUserCircle className="h-5 w-5" /> },
        { href: "/dashboard/childminder/bookings", label: "Bookings", icon: <FaCalendarAlt className="h-5 w-5" /> },
        { href: "/dashboard/childminder/messages", label: "Messages", icon: <FaComments className="h-5 w-5" /> },
        { href: "/dashboard/childminder/documents", label: "Documents", icon: <FaFileAlt className="h-5 w-5" /> },
        { href: "/dashboard/childminder/calendar", label: "Calendar", icon: <FaCalendarAlt className="h-5 w-5" /> },
        { href: "/dashboard/childminder/activity", label: "Activity", icon: <FaHistory className="h-5 w-5" /> },
        { href: "/dashboard/childminder/settings", label: "Settings", icon: <FaCog className="h-5 w-5" /> },
        { href: "/dashboard/childminder/subscription", label: "Subscription", icon: <FaCreditCard className="h-5 w-5" /> },
        { href: "/dashboard/childminder/help", label: "Help & Support", icon: <FaQuestionCircle className="h-5 w-5" /> }
      );
    }
    
    // Add admin links
    if (session.user.role === "admin") {
      links.push(
        { href: "/dashboard/admin/users", label: "User Management", icon: <FaUserCircle className="h-5 w-5" /> },
        { href: "/dashboard/admin/bookings", label: "Bookings", icon: <FaCalendarAlt className="h-5 w-5" /> },
        { href: "/dashboard/admin/messages", label: "Messages", icon: <FaComments className="h-5 w-5" /> },
        { href: "/dashboard/admin/chat", label: "Live Chat", icon: <FaComments className="h-5 w-5" /> },
        { href: "/dashboard/admin/subscriptions", label: "Subscriptions", icon: <FaCreditCard className="h-5 w-5" /> },
        { href: "/dashboard/admin/documents", label: "Documents", icon: <FaFileAlt className="h-5 w-5" /> },
        { href: "/dashboard/admin/support", label: "Support Tickets", icon: <FaQuestionCircle className="h-5 w-5" /> },
        { href: "/dashboard/admin/monitoring", label: "API Monitoring", icon: <FaChartLine className="h-5 w-5" /> },
        { href: "/dashboard/admin/logs", label: "System Logs", icon: <FaFileAlt className="h-5 w-5" /> },
        { href: "/dashboard/admin/maintenance", label: "Maintenance Mode", icon: <FaTools className="h-5 w-5" /> },
        { href: "/dashboard/admin/security-settings", label: "Security Settings", icon: <FaShieldAlt className="h-5 w-5" /> },
        { href: "/dashboard/admin/settings", label: "Settings", icon: <FaCog className="h-5 w-5" /> }
      );
    }

    // Add common links at the end
    links.push({ 
      href: "#", 
      label: "Logout", 
      icon: <FaSignOutAlt className="h-5 w-5" />, 
      onClick: () => signOut({ callbackUrl: "/" })
    });

    return links;
  };

  const sidebarLinks = getSidebarLinks();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Use the unified Header component, passing sidebar state and toggle function */}
      <Header sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Subscription Banner */}
      <SubscriptionBanner />

      <div className="pt-16 md:flex">
        {/* Mobile sidebar backdrop overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 md:hidden" 
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar - using dynamic import to reduce initial load size */}
        <Suspense fallback={<div className="w-64 md:block hidden" />}>
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white pt-16 shadow-lg transition-transform duration-300 md:pt-16 md:translate-x-0 md:static md:z-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Instead of using Sidebar component, render menu items directly for faster loading and reliability */}
            <nav className="h-full overflow-y-auto">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {sidebarLinks.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    className="flex items-center px-4 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition-colors duration-150"
                    onClick={link.onClick || (() => setSidebarOpen(false))}
                  >
                    <span className="mr-3">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          </aside>
        </Suspense>

        {/* Main content with improved performance */}
        <main className="w-full flex-1 px-4 py-6 md:px-6">
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </main>
      </div>
      
      {/* Add Chat Widget for parent and childminder users */}
      {session?.user?.role && 
       session.user.role !== 'admin' && 
       <ChatWidget />}
    </div>
  );
} 