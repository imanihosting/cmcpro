"use client";

import { useState } from "react";
import { 
  FaArrowLeft, 
  FaCheck,
  FaCreditCard,
  FaSearch,
  FaComments,
  FaStar,
  FaUserPlus,
  FaUserEdit,
  FaIdCard
} from "react-icons/fa";
import Link from "next/link";

export default function ParentOnboardingGuidePage() {
  return (
    <div>
      <header className="mb-6 flex items-center">
        <Link href="/dashboard/parent/help" className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
          <FaArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Parent Onboarding Guide</h1>
          <p className="mt-1 text-sm text-gray-600">Step-by-step guide to get started with ChildminderConnect</p>
        </div>
      </header>

      <div className="mb-10 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-violet-100 flex items-center justify-center">
            <FaUserPlus className="h-10 w-10 text-violet-600" />
          </div>
        </div>
        
        <h2 className="mb-4 text-center text-xl font-semibold text-gray-900">Getting Started as a Parent</h2>
        <p className="mb-8 text-center text-gray-600">Follow these steps to start finding childminders on our platform</p>
        
        <div className="space-y-8">
          {/* Step 1 */}
          <div className="border-l-4 border-green-500 pl-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 mr-3">
                <FaCheck className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Step 1: Create Your Account</h3>
            </div>
            <div className="mt-3 ml-11">
              <p className="text-gray-600 mb-2">Visit the ChildminderConnect homepage.</p>
              <p className="text-gray-600 mb-2">Sign up using your email or social login.</p>
              <p className="text-gray-600">Select "Parent" as your user type.</p>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-3">
                <FaUserEdit className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Step 2: Set Up Your Profile</h3>
            </div>
            <div className="mt-3 ml-11">
              <p className="text-gray-600 mb-2">Enter your name, contact details, and address.</p>
              <p className="text-gray-600">Add your child(ren)'s info: name, age, allergies, needs, etc.</p>
            </div>
          </div>
          
          {/* Step 3 */}
          <div className="border-l-4 border-purple-500 pl-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 mr-3">
                <FaCreditCard className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Step 3: Subscribe</h3>
            </div>
            <div className="mt-3 ml-11">
              <p className="text-gray-600 mb-2">Unlock full access to smart search and messaging with a subscription:</p>
              <p className="text-gray-600 mb-2">€9.99/month or €99.99/year</p>
              <p className="text-gray-600">Payment is powered by Stripe — secure and easy.</p>
            </div>
          </div>
          
          {/* Step 4 */}
          <div className="border-l-4 border-amber-500 pl-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 mr-3">
                <FaSearch className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Step 4: Smart Search for a Childminder</h3>
            </div>
            <div className="mt-3 ml-11">
              <p className="text-gray-600 mb-2">Use the intelligent search engine to filter by:</p>
              <p className="text-gray-600 mb-2">Location, availability, services, experience, and more.</p>
              <p className="text-gray-600">Browse profiles with qualifications, vetting, and parent reviews.</p>
            </div>
          </div>
          
          {/* Step 5 */}
          <div className="border-l-4 border-indigo-500 pl-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mr-3">
                <FaComments className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Step 5: Message & Book</h3>
            </div>
            <div className="mt-3 ml-11">
              <p className="text-gray-600 mb-2">Start a conversation with potential childminders.</p>
              <p className="text-gray-600">Finalize care and make payment directly to the childminder.</p>
            </div>
          </div>
          
          {/* Step 6 */}
          <div className="border-l-4 border-pink-500 pl-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-600 mr-3">
                <FaStar className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Step 6: Leave a Review</h3>
            </div>
            <div className="mt-3 ml-11">
              <p className="text-gray-600">Help other parents by leaving honest feedback after your experience.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-10 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">Parent User Agreement</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900">1. Introduction</h3>
            <p className="mt-1 text-gray-600">Welcome to ChildminderConnect. By registering as a parent, you agree to the following terms designed to support a safe, respectful, and efficient platform for finding childcare providers.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">2. Eligibility</h3>
            <p className="mt-1 text-gray-600">You must be at least 18 years old and legally able to enter into a contract.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">3. Account Responsibilities</h3>
            <p className="mt-1 text-gray-600">Ensure your account information and child details are accurate and kept up to date.</p>
            <p className="mt-1 text-gray-600">Keep your login credentials secure and confidential.</p>
            <p className="mt-1 text-gray-600">Report any unauthorized access to your account immediately.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">4. Bookings and Payments</h3>
            <p className="mt-1 text-gray-600">All childminder bookings must be arranged through the platform, but payments are made directly to the childminder, outside the platform.</p>
            <p className="mt-1 text-gray-600">ChildminderConnect does not process payments or act as an intermediary for any financial transactions between parents and childminders.</p>
            <p className="mt-1 text-gray-600">You are responsible for agreeing to rates, payment terms, and cancellation policies directly with the childminder.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">5. Subscription Fees</h3>
            <p className="mt-1 text-gray-600">Parents may access additional features and functionality through a paid subscription.</p>
            <p className="mt-1 text-gray-600">Subscription fees are non-refundable unless otherwise stated.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">6. Child Safety and Conduct</h3>
            <p className="mt-1 text-gray-600">You agree to provide childminders with all necessary health, behavioral, and care-related information about your child(ren).</p>
            <p className="mt-1 text-gray-600">You agree to treat all childminders with respect and professionalism at all times.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">7. Communication</h3>
            <p className="mt-1 text-gray-600">Use the platform's secure messaging system to initiate and manage communications with childminders.</p>
            <p className="mt-1 text-gray-600">Offensive or inappropriate behavior will result in account suspension or termination.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">8. Reviews</h3>
            <p className="mt-1 text-gray-600">You may leave fair, respectful reviews based on your experience with a childminder.</p>
            <p className="mt-1 text-gray-600">Reviews must not be false, defamatory, or malicious.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">9. Account Suspension</h3>
            <p className="mt-1 text-gray-600">ChildminderConnect reserves the right to suspend or terminate any account that violates these terms or compromises user safety.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">10. Privacy & Data</h3>
            <p className="mt-1 text-gray-600">Your data is handled securely and in accordance with our Privacy Policy and GDPR compliance standards.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <Link 
          href="/dashboard/parent/help" 
          className="flex items-center text-gray-600 hover:text-violet-600"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Help Center
        </Link>
      </div>
    </div>
  );
} 