"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { 
  FaBaby, 
  FaUserCircle, 
  FaChevronDown, 
  FaChevronUp,
  FaSignOutAlt,
  FaCog,
  FaUser,
  FaTachometerAlt,
  FaRegBell
} from "react-icons/fa";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // Refs for menu components
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Determine if we're on a dashboard page
  const isDashboardPage = pathname?.includes('/dashboard');

  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle clicking outside of menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMobileMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleProfileMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setProfileMenuOpen(!profileMenuOpen);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ease-in-out ${
        isScrolled || isDashboardPage ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className={`${isDashboardPage ? "px-4" : "container mx-auto px-4"}`}>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            {/* Mobile menu button - only show on mobile and dashboard pages */}
            {isDashboardPage && (
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="md:hidden mr-3 p-2 rounded-md text-gray-600 hover:text-violet-600 focus:outline-none"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            )}
            
            <Link href="/" className="flex items-center space-x-2 font-bold hover:opacity-90 transition-opacity" aria-label="ChildminderConnect Home">
              <FaBaby className="h-7 w-7 text-violet-600" />
              <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent text-xl">
                ChildminderConnect
              </span>
            </Link>
          </div>

          {/* Desktop navigation - different links for dashboard vs public pages */}
          <nav className="hidden md:block">
            <ul className="flex space-x-6">
              {isDashboardPage ? (
                // Dashboard nav links
                <>
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
                </>
              ) : (
                // Public site nav links
                <>
                  <li>
                    <Link
                      href="/"
                      className={`text-sm font-medium ${
                        pathname === "/"
                          ? "text-violet-600"
                          : "text-gray-700 hover:text-violet-600"
                      }`}
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className={`text-sm font-medium ${
                        pathname === "/about"
                          ? "text-violet-600"
                          : "text-gray-700 hover:text-violet-600"
                      }`}
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className={`text-sm font-medium ${
                        pathname === "/contact"
                          ? "text-violet-600"
                          : "text-gray-700 hover:text-violet-600"
                      }`}
                    >
                      Contact
                    </Link>
                  </li>
                </>
              )}

              {session ? (
                // Show these links when logged in - but not on dashboard pages as these links are in sidebar
                !isDashboardPage && (
                  <li>
                    <Link
                      href="/dashboard"
                      className={`text-sm font-medium ${
                        pathname?.includes("/dashboard")
                          ? "text-violet-600"
                          : "text-gray-700 hover:text-violet-600"
                      }`}
                    >
                      Dashboard
                    </Link>
                  </li>
                )
              ) : (
                // Show these links when not logged in
                !isDashboardPage && (
                  <>
                    <li>
                      <Link
                        href="/auth/login"
                        className={`text-sm font-medium ${
                          pathname === "/auth/login"
                            ? "text-violet-600"
                            : "text-gray-700 hover:text-violet-600"
                        }`}
                      >
                        Sign In
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/auth/register"
                        className={`rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 ${
                          pathname === "/auth/register" ? "bg-violet-700" : ""
                        }`}
                      >
                        Sign Up
                      </Link>
                    </li>
                  </>
                )
              )}
            </ul>
          </nav>

          {/* Right side items for logged in users */}
          {session ? (
            <div className="flex items-center space-x-4">
              {/* Notification bell - only show on dashboard */}
              {isDashboardPage && (
                <button className="relative p-1 text-gray-600 hover:text-violet-600 focus:outline-none">
                  <FaRegBell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                </button>
              )}
              
              {/* Profile dropdown - show for all logged in users */}
              <div ref={profileMenuRef} className="relative ml-3">
                <button
                  type="button"
                  className="flex items-center space-x-2 text-sm focus:outline-none"
                  onClick={toggleProfileMenu}
                  aria-label="Open profile menu"
                >
                  <span className="hidden md:block font-medium text-gray-700">
                    {session?.user?.name || "User"}
                  </span>
                  {/* Profile image */}
                  <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-violet-200 bg-gray-100">
                    {session?.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session?.user?.name || "User"} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-violet-100 text-violet-600">
                        <FaUserCircle className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  {profileMenuOpen ? (
                    <FaChevronUp className="h-3 w-3 text-gray-500" />
                  ) : (
                    <FaChevronDown className="h-3 w-3 text-gray-500" />
                  )}
                </button>
                
                {/* Dropdown menu */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session?.user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session?.user?.email || ""}
                      </p>
                    </div>
                    
                    {!isDashboardPage && (
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <span className="mr-2 text-gray-500">
                          <FaTachometerAlt className="h-4 w-4" />
                        </span>
                        Dashboard
                      </Link>
                    )}
                    
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <span className="mr-2 text-gray-500">
                        <FaUser className="h-4 w-4" />
                      </span>
                      Profile
                    </Link>
                    
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <span className="mr-2 text-gray-500">
                        <FaCog className="h-4 w-4" />
                      </span>
                      Settings
                    </Link>
                    
                    <div className="border-t border-gray-100 mt-1"></div>
                    
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className="mr-2 text-gray-500">
                        <FaSignOutAlt className="h-4 w-4" />
                      </span>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Mobile menu button - only show on non-dashboard pages when logged out */
            !isDashboardPage && (
              <div className="flex md:hidden">
                <button
                  type="button"
                  onClick={toggleMobileMenu}
                  className="inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-violet-50 hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 active:bg-violet-100"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                  <svg
                    className="h-7 w-7"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                    />
                  </svg>
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="absolute top-full left-0 right-0 z-50 w-full animate-fadeIn bg-white shadow-lg md:hidden" 
          id="mobile-menu"
        >
          <div className="space-y-1 pb-3 pt-2">
            {!isDashboardPage && (
              <Link
                href="/"
                className={`block w-full px-4 py-3 text-base font-medium ${
                  pathname === "/"
                    ? "bg-violet-50 text-violet-600"
                    : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
            )}
            
            <Link
              href="/about"
              className={`block w-full px-4 py-3 text-base font-medium ${
                pathname === "/about"
                  ? "bg-violet-50 text-violet-600"
                  : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            
            <Link
              href="/contact"
              className={`block w-full px-4 py-3 text-base font-medium ${
                pathname === "/contact"
                  ? "bg-violet-50 text-violet-600"
                  : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            
            {session ? (
              <>
                {!isDashboardPage && (
                  <Link
                    href="/dashboard"
                    className={`block w-full px-4 py-3 text-base font-medium ${
                      pathname?.includes("/dashboard")
                        ? "bg-violet-50 text-violet-600"
                        : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                
                <Link
                  href="/dashboard/profile"
                  className={`block w-full px-4 py-3 text-base font-medium ${
                    pathname === "/dashboard/profile"
                      ? "bg-violet-50 text-violet-600"
                      : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                
                <Link
                  href="/dashboard/settings"
                  className={`block w-full px-4 py-3 text-base font-medium ${
                    pathname === "/dashboard/settings"
                      ? "bg-violet-50 text-violet-600"
                      : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="block w-full px-4 py-3 text-left text-base font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              !isDashboardPage && (
                <>
                  <Link
                    href="/auth/login"
                    className={`block w-full px-4 py-3 text-base font-medium ${
                      pathname === "/auth/login"
                        ? "bg-violet-50 text-violet-600"
                        : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  
                  <Link
                    href="/auth/register"
                    className={`block w-full px-4 py-3 text-base font-medium ${
                      pathname === "/auth/register"
                        ? "bg-violet-50 text-violet-600"
                        : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
} 