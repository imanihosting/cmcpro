"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FaExclamationCircle, FaHome, FaRedo } from "react-icons/fa";

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 flex items-center justify-center rounded-full bg-red-100 text-red-600">
            <FaExclamationCircle className="h-10 w-10" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-6">
          We apologize for the inconvenience. Please try again or return to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center px-5 py-2 bg-violet-600 text-white font-medium rounded-md hover:bg-violet-700 transition-colors"
          >
            <FaRedo className="mr-2" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center px-5 py-2 border border-gray-300 bg-white text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            <FaHome className="mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 