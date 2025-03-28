"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { 
  FaBaby, 
  FaUserCircle, 
  FaChevronDown, 
  FaChevronUp,
  FaSignOutAlt,
  FaCog,
  FaUser,
  FaTachometerAlt,
  FaRegBell,
  FaShieldAlt,
  FaCreditCard,
  FaQuestionCircle
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

  // Generate the appropriate profile path based on user role
  const getProfilePath = () => {
    if (!session?.user?.role) return "/dashboard/profile";
    return `/dashboard/${session.user.role}/profile`;
  };

  // Generate the appropriate settings path based on user role
  const getSettingsPath = () => {
    if (!session?.user?.role) return "/dashboard/settings";
    return `/dashboard/${session.user.role}/settings`;
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

          {/* Right side navigation and profile section */}
          <div className="flex items-center space-x-4">
            {/* Desktop navigation - different links for dashboard vs public pages */}
            <nav className="hidden md:block">
              <ul className="flex items-center space-x-6">
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
                    {session && (
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
                    )}
                  </>
                )}
              </ul>
            </nav>

            {/* Profile section */}
            <div className="flex items-center space-x-4">
              {session ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2"
                  >
                    <div className="relative h-8 w-8 rounded-full bg-violet-100">
                      {session.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt="Profile"
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <FaUserCircle className="h-8 w-8 text-violet-600" />
                      )}
                    </div>
                    <span className="hidden md:inline-block text-sm font-medium text-gray-700">
                      {session.user?.name || 'User'}
                    </span>
                    {profileMenuOpen ? (
                      <FaChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <FaChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  {/* Profile dropdown menu */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                      <Link
                        href={getProfilePath()}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FaUser className="mr-3 h-4 w-4 text-gray-500" />
                        Profile
                      </Link>
                      <Link
                        href={getSettingsPath()}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FaCog className="mr-3 h-4 w-4 text-gray-500" />
                        Settings
                      </Link>
                      <div className="border-t border-gray-100"></div>
                      {session.user.role === "parent" && (
                        <Link
                          href="/dashboard/parent"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FaTachometerAlt className="mr-3 h-4 w-4 text-gray-500" />
                          Dashboard
                        </Link>
                      )}
                      {session.user.role === "childminder" && (
                        <Link
                          href="/dashboard/childminder"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FaTachometerAlt className="mr-3 h-4 w-4 text-gray-500" />
                          Dashboard
                        </Link>
                      )}
                      <Link
                        href="/dashboard/subscription"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FaCreditCard className="mr-3 h-4 w-4 text-gray-500" />
                        Subscription
                      </Link>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FaSignOutAlt className="mr-3 h-4 w-4 text-gray-500" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="hidden md:inline-block rounded-md border border-violet-600 px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isDashboardPage && mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50"
        >
          <div className="h-16 flex items-center justify-between px-4 border-b">
            <span className="font-semibold text-gray-900">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md text-gray-500 hover:text-violet-600 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="px-4 py-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-violet-50 hover:text-violet-600"
                >
                  <FaTachometerAlt className="mr-3 h-4 w-4" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href={getProfilePath()}
                  className="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-violet-50 hover:text-violet-600"
                >
                  <FaUser className="mr-3 h-4 w-4" />
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  href={getSettingsPath()}
                  className="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-violet-50 hover:text-violet-600"
                >
                  <FaCog className="mr-3 h-4 w-4" />
                  Settings
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/notifications"
                  className="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-violet-50 hover:text-violet-600"
                >
                  <FaRegBell className="mr-3 h-4 w-4" />
                  Notifications
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/security"
                  className="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-violet-50 hover:text-violet-600"
                >
                  <FaShieldAlt className="mr-3 h-4 w-4" />
                  Security
                </Link>
              </li>
              {session?.user?.role === "childminder" && (
                <li>
                  <Link
                    href="/dashboard/childminder/help"
                    className="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-violet-50 hover:text-violet-600"
                  >
                    <FaQuestionCircle className="mr-3 h-4 w-4" />
                    Help & Support
                  </Link>
                </li>
              )}
              {session?.user?.role === "parent" && (
                <li>
                  <Link
                    href="/dashboard/parent/help"
                    className="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-violet-50 hover:text-violet-600"
                  >
                    <FaQuestionCircle className="mr-3 h-4 w-4" />
                    Help & Support
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/dashboard/subscription"
                  className="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-violet-50 hover:text-violet-600"
                >
                  <FaCreditCard className="mr-3 h-4 w-4" />
                  Subscription
                </Link>
              </li>
              <li>
                <button
                  onClick={() => signOut()}
                  className="flex w-full items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-violet-50 hover:text-violet-600"
                >
                  <FaSignOutAlt className="mr-3 h-4 w-4" />
                  Sign out
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
} 