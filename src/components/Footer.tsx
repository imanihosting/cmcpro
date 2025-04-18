"use client";

import Link from "next/link";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            <Link href="/" className="mb-3 flex justify-center">
              <Image 
                src="/images/footer-logo.png" 
                alt="ChildminderConnect Footer Logo"
                width={200}
                height={35}
              />
            </Link>
            <p className="mb-4 text-sm sm:text-base">
              Connecting parents with trusted childminders in your local area.
            </p>
            <div className="flex justify-center space-x-4">
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
          
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-semibold text-white sm:text-base">Quick Links</h4>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm sm:text-base">
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
                <Link href="/terms" className="inline-block transition-colors duration-200 hover:text-white">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="inline-block transition-colors duration-200 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 border-t border-gray-800 pt-6 text-center text-sm sm:pt-8 sm:text-base">
          <p>
            &copy; {new Date().getFullYear()} ChildminderConnect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 