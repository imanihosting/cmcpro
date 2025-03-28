"use client";

import Link from "next/link";
import { FaExclamationTriangle, FaHome, FaArrowLeft } from "react-icons/fa";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100">
        <FaExclamationTriangle className="h-12 w-12 text-indigo-600" />
      </div>
      
      <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">Page Not Found</h1>
      
      <p className="mb-8 max-w-md text-gray-600">
        We couldn't find the page you're looking for. It might have been moved, 
        deleted, or perhaps never existed.
      </p>
      
      <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
        <Link
          href="/"
          className="flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <FaHome className="mr-2 h-4 w-4" />
          Go to Homepage
        </Link>
        
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </button>
      </div>
    </div>
  );
} 