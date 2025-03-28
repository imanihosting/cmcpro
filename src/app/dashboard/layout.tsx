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
  FaRegBell
} from "react-icons/fa";

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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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
        { href: "/subscription", label: "Subscription", icon: <FaCreditCard className="h-5 w-5" /> },
        { href: "/dashboard/parent/help", label: "Help & Support", icon: <FaQuestionCircle className="h-5 w-5" /> }
      );
    }
    // Add childminder and admin links as needed
    // ...

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

  // Handle logout
  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  // Mobile sidebar render function for performance
  const renderMobileSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return null; // Don't render on desktop
    }
    
    return (
      <>
        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden p-2 text-gray-600 hover:text-violet-600 focus:outline-none"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? (
            <FaTimes className="h-6 w-6" />
          ) : (
            <FaBars className="h-6 w-6" />
          )}
        </button>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm h-16">
        <div className="flex h-full items-center justify-between px-4">
          {renderMobileSidebar()}
          
          {/* Logo - visible on all screens */}
          <div className="flex items-center md:ml-0">
            <Link href="/" className="flex items-center space-x-2 font-bold">
              <FaBaby className="h-7 w-7 text-violet-600" />
              <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent text-xl hidden sm:inline-block">
                ChildminderConnect
              </span>
            </Link>
          </div>

          {/* Center nav links - only visible on desktop */}
          <nav className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
            <ul className="flex space-x-6">
              <li>
                <Link
                  href="/about"
                  className="text-sm font-medium text-gray-700 hover:text-violet-600"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm font-medium text-gray-700 hover:text-violet-600"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Notification bell */}
            <button className="relative p-1 text-gray-600 hover:text-violet-600 focus:outline-none">
              <FaRegBell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            
            {/* Profile dropdown */}
            <div className="relative ml-3">
              <div>
                <button
                  type="button"
                  className="flex items-center space-x-2 text-sm focus:outline-none"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  aria-label="Open profile menu"
                >
                  <span className="hidden md:block font-medium text-gray-700">
                    {session?.user?.name || "User"}
                  </span>
                  <FaUserCircle className="h-8 w-8 text-gray-600" />
                  {profileMenuOpen ? (
                    <FaChevronUp className="h-3 w-3 text-gray-500" />
                  ) : (
                    <FaChevronDown className="h-3 w-3 text-gray-500" />
                  )}
                </button>
              </div>
              {/* Dropdown menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                  <Link
                    href="/dashboard/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="pt-16 md:flex">
        {/* Sidebar - using dynamic import to reduce initial load size */}
        <Suspense fallback={<div className="w-64 md:block hidden" />}>
          <aside
            className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white pt-16 shadow-lg transition-transform duration-300 md:pt-16 md:translate-x-0 md:static md:z-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar links={sidebarLinks} isOpen={sidebarOpen} />
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