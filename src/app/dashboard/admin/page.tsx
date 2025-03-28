"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaUserCog, FaChartBar, FaCreditCard, FaFileAlt } from "react-icons/fa";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated and has the admin role
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && session.user.role !== "admin") {
      // Redirect to appropriate dashboard based on role
      if (session.user.role === "parent") {
        router.push("/dashboard/parent");
      } else if (session.user.role === "childminder") {
        router.push("/dashboard/childminder");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);

  // Show loading state while checking authentication
  if (status === "loading" || !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Admin dashboard content
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Admin Dashboard</h1>
        <div className="mt-2 flex items-center sm:mt-0">
          <span className="mr-2 inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-green-500"></span>
          <span className="text-sm text-gray-600">Admin Access</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
              <FaUserCog className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">User Management</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">Manage users, roles, and permissions</p>
          <button className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto">
            Manage Users
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
              <FaChartBar className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">Statistics</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">View platform statistics and analytics</p>
          <button className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto">
            View Stats
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
              <FaCreditCard className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">Subscriptions</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">Manage user subscriptions and payments</p>
          <button className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto">
            Manage Subscriptions
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
              <FaFileAlt className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">Compliance</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">Review and approve verification documents</p>
          <button className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto">
            Review Documents
          </button>
        </div>
      </div>
      
      {/* Recent activity section */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold">Recent Activity</h2>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hidden md:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">New Registration</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">john.doe@example.com</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm sm:table-cell">10 min ago</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm hidden md:table-cell">
                    <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">Completed</span>
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">Document Upload</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">jane.smith@example.com</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm sm:table-cell">25 min ago</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm hidden md:table-cell">
                    <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">Pending</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 