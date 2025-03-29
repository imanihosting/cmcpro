"use client";

import { useState, useEffect, ReactNode, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import dynamic from 'next/dynamic';
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
  FaFileAlt
} from "react-icons/fa";
import Header from "@/components/Header";

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
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Show loading state while checking authentication
  if (status === "loading") {
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
        { href: "/dashboard/parent/find-childminders", label: "Find Childminders", icon: <FaSearch className="h-5 w-5" /> },
        { href: "/dashboard/parent/bookings", label: "Bookings", icon: <FaCalendarAlt className="h-5 w-5" /> },
        { href: "/dashboard/parent/messages", label: "Messages", icon: <FaComments className="h-5 w-5" /> },
        { href: "/dashboard/parent/calendar", label: "Calendar", icon: <FaCalendarAlt className="h-5 w-5" /> },
        { href: "/dashboard/parent/subscription", label: "Subscription", icon: <FaCreditCard className="h-5 w-5" /> },
        { href: "/dashboard/parent/help", label: "Help & Support", icon: <FaQuestionCircle className="h-5 w-5" /> }
      );
    }
    // Add childminder and admin links as needed
    // ...
    
    // Add childminder links
    if (session.user.role === "childminder") {
      links.push(
        { href: "/dashboard/childminder/bookings", label: "Bookings", icon: <FaCalendarAlt className="h-5 w-5" /> },
        { href: "/dashboard/childminder/messages", label: "Messages", icon: <FaComments className="h-5 w-5" /> },
        { href: "/dashboard/childminder/documents", label: "Documents", icon: <FaFileAlt className="h-5 w-5" /> },
        { href: "/dashboard/childminder/calendar", label: "Calendar", icon: <FaCalendarAlt className="h-5 w-5" /> },
        { href: "/dashboard/childminder/activity", label: "Activity", icon: <FaHistory className="h-5 w-5" /> },
        { href: "/dashboard/childminder/profile", label: "Profile", icon: <FaUserCircle className="h-5 w-5" /> },
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
        { href: "/dashboard/admin/subscriptions", label: "Subscriptions", icon: <FaCreditCard className="h-5 w-5" /> },
        { href: "/dashboard/admin/documents", label: "Documents", icon: <FaFileAlt className="h-5 w-5" /> },
        { href: "/dashboard/admin/support", label: "Support Tickets", icon: <FaQuestionCircle className="h-5 w-5" /> },
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
      {/* Use the unified Header component */}
      <Header />

      <div className="pt-16 md:flex">
        {/* Mobile sidebar toggle for small screens */}
        <button
          type="button"
          className="fixed bottom-4 right-4 z-40 md:hidden flex items-center justify-center h-12 w-12 rounded-full bg-violet-600 text-white shadow-lg focus:outline-none"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <FaTimes className="h-5 w-5" />
          ) : (
            <FaBars className="h-5 w-5" />
          )}
        </button>

        {/* Sidebar - using dynamic import to reduce initial load size */}
        <Suspense fallback={<div className="w-64 md:block hidden" />}>
          <aside
            className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white pt-16 shadow-lg transition-transform duration-300 md:pt-16 md:translate-x-0 md:static md:z-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar 
              links={sidebarLinks} 
              isOpen={sidebarOpen} 
              toggleSidebar={() => setSidebarOpen(false)} 
            />
          </aside>
        </Suspense>

        {/* Main content with improved performance */}
        <main className="w-full flex-1 px-4 py-6 md:px-6">
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
} 