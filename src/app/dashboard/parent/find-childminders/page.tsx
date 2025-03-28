"use client";

import { useState } from "react";
import { FaSearch, FaMapMarkerAlt, FaStar, FaFilter } from "react-icons/fa";

export default function FindChildminders() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Find Childminders</h1>
        <p className="mt-1 text-sm text-gray-600">Search for qualified childminders in your area</p>
      </header>

      {/* Search filters */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <form className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">Location</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="location"
                  className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="Enter your postcode"
                />
              </div>
            </div>

            <div>
              <label htmlFor="availability" className="mb-1 block text-sm font-medium text-gray-700">Availability</label>
              <select
                id="availability"
                className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option>Any day</option>
                <option>Weekdays</option>
                <option>Weekends</option>
                <option>Evenings</option>
              </select>
            </div>

            <div>
              <label htmlFor="rating" className="mb-1 block text-sm font-medium text-gray-700">Minimum Rating</label>
              <select
                id="rating"
                className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option>Any rating</option>
                <option>4+ stars</option>
                <option>4.5+ stars</option>
                <option>5 stars only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-violet-600"
            >
              <FaFilter className="h-4 w-4" /> More filters
            </button>
            <button
              type="submit"
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              <FaSearch className="mr-2 inline h-4 w-4" /> Search
            </button>
          </div>
        </form>
      </div>

      {/* Results placeholder */}
      <div className="space-y-4">
        <p className="text-center text-gray-500 py-8">
          Enter your search criteria and click Search to find childminders
        </p>
      </div>
    </div>
  );
} 