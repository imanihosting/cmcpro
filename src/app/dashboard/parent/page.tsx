"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  FaChild, 
  FaSearch, 
  FaCalendarAlt, 
  FaComments, 
  FaCreditCard,
  FaArrowRight 
} from "react-icons/fa";

export default function ParentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated and has the parent role
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      // Check subscription status first
      if (session.user.subscriptionStatus === "FREE") {
        router.push("/subscription?required=true");
        return;
      }
      
      // Then check role
      if (session.user.role !== "parent") {
        // Redirect to appropriate dashboard based on role
        if (session.user.role === "admin") {
          router.push("/dashboard/admin");
        } else if (session.user.role === "childminder") {
          router.push("/dashboard/childminder");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [status, session, router]);

  // Show loading state while checking authentication
  if (status === "loading" || !session) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  // Parent dashboard content
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Welcome, {session.user.name}</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your childcare arrangements and bookings</p>
      </header>
      
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaChild className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">My Children</h2>
          <p className="mb-4 text-sm text-gray-600">Add and manage your children's profiles, preferences, and special requirements.</p>
          <button className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Manage Children <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaSearch className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Find Childminders</h2>
          <p className="mb-4 text-sm text-gray-600">Search for qualified childminders in your area based on your specific needs.</p>
          <button className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Find Now <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaCalendarAlt className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Bookings</h2>
          <p className="mb-4 text-sm text-gray-600">View upcoming appointments, manage schedules, and make new bookings.</p>
          <button className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View Bookings <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaComments className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Messages</h2>
          <p className="mb-4 text-sm text-gray-600">Communicate with childminders, receive updates, and manage conversations.</p>
          <button className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View Messages <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FaCreditCard className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Subscription</h2>
          <p className="mb-4 text-sm text-gray-600">Manage your subscription plan, billing details, and payment methods.</p>
          <button 
            onClick={() => router.push('/subscription')} 
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Manage Subscription <FaArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
} 