"use client";

import Link from "next/link";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
          <div className="mb-2 md:mb-0">
            <h3 className="mb-3 text-base font-bold text-white sm:text-lg">ChildminderConnect</h3>
            <p className="mb-4 text-sm sm:text-base">
              Connecting parents with trusted childminders in your local area.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Facebook">
                <FaFacebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Twitter">
                <FaTwitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Instagram">
                <FaInstagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="LinkedIn">
                <FaLinkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white sm:text-base">Quick Links</h4>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>
                <Link href="/" className="inline-block transition-colors duration-200 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="inline-block transition-colors duration-200 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="inline-block transition-colors duration-200 hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="inline-block transition-colors duration-200 hover:text-white">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="inline-block transition-colors duration-200 hover:text-white">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white sm:text-base">For Parents</h4>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>
                <Link href="/dashboard/parent" className="inline-block transition-colors duration-200 hover:text-white">
                  Parent Dashboard
                </Link>
              </li>
              <li>
                <Link href="#" className="inline-block transition-colors duration-200 hover:text-white">
                  Finding a Childminder
                </Link>
              </li>
              <li>
                <Link href="#" className="inline-block transition-colors duration-200 hover:text-white">
                  Book a Childminder
                </Link>
              </li>
              <li>
                <Link href="#" className="inline-block transition-colors duration-200 hover:text-white">
                  Safety Standards
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white sm:text-base">For Childminders</h4>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>
                <Link href="/dashboard/childminder" className="inline-block transition-colors duration-200 hover:text-white">
                  Childminder Dashboard
                </Link>
              </li>
              <li>
                <Link href="#" className="inline-block transition-colors duration-200 hover:text-white">
                  Join as Childminder
                </Link>
              </li>
              <li>
                <Link href="/dashboard/profile" className="inline-block transition-colors duration-200 hover:text-white">
                  Manage Profile
                </Link>
              </li>
              <li>
                <Link href="#" className="inline-block transition-colors duration-200 hover:text-white">
                  Resources
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-800 pt-6 text-center text-sm sm:pt-8 sm:text-base">
          <p>
            &copy; {new Date().getFullYear()} ChildminderConnect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 