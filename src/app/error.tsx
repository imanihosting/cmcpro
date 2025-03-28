"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FaExclamationCircle, FaSync } from "react-icons/fa";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
        <FaExclamationCircle className="h-12 w-12 text-red-600" />
      </div>
      
      <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Something went wrong</h1>
      
      <p className="mb-8 max-w-md text-gray-600">
        We apologize for the inconvenience. An unexpected error has occurred.
      </p>
      
      <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <FaSync className="mr-2 h-4 w-4" />
          Try again
        </button>
        
        <Link
          href="/"
          className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Return to homepage
        </Link>
      </div>
    </div>
  );
} 