"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { FaBaby } from "react-icons/fa";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ease-in-out ${
        isScrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 font-bold hover:opacity-90 transition-opacity" aria-label="ChildminderConnect Home">
              <FaBaby className="h-7 w-7 text-violet-600" />
              <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent text-xl">
                ChildminderConnect
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-6">
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
              {session ? (
                <>
                  <li>
                    <Link
                      href="/dashboard"
                      className={`text-sm font-medium ${
                        pathname.includes("/dashboard")
                          ? "text-violet-600"
                          : "text-gray-700 hover:text-violet-600"
                      }`}
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/profile"
                      className={`text-sm font-medium ${
                        pathname === "/dashboard/profile"
                          ? "text-violet-600"
                          : "text-gray-700 hover:text-violet-600"
                      }`}
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="text-sm font-medium text-gray-700 hover:text-violet-600"
                    >
                      Sign Out
                    </button>
                  </li>
                </>
              ) : (
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
              )}
            </ul>
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
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
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="absolute top-full left-0 right-0 z-50 w-full animate-fadeIn bg-white shadow-lg md:hidden" 
          id="mobile-menu"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-1 pb-3 pt-2">
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
                <Link
                  href="/dashboard"
                  className={`block w-full px-4 py-3 text-base font-medium ${
                    pathname.includes("/dashboard")
                      ? "bg-violet-50 text-violet-600"
                      : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
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
            )}
          </div>
        </div>
      )}
    </header>
  );
} 