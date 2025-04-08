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
  FaIdCard,
  FaFileUpload,
  FaBell
} from "react-icons/fa";
import Link from "next/link";

export default function ChildminderOnboardingGuidePage() {
  return (
    <div>
      <header className="mb-6 flex items-center">
        <Link href="/dashboard/childminder/help" className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
          <FaArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Childminder Onboarding Guide</h1>
          <p className="mt-1 text-sm text-gray-600">Step-by-step guide to get started with ChildminderConnect</p>
        </div>
      </header>

      <div className="mb-10 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-violet-100 flex items-center justify-center">
            <FaUserPlus className="h-10 w-10 text-violet-600" />
          </div>
        </div>
        
        <h2 className="mb-4 text-center text-xl font-semibold text-gray-900">Getting Started as a Childminder</h2>
        <p className="mb-8 text-center text-gray-600">Follow these steps to start offering your childminding services on our platform</p>
        
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
              <p className="text-gray-600 mb-2">Head to ChildminderConnect homepage and sign up.</p>
              <p className="text-gray-600">Choose "Childminder" as your user type.</p>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-3">
                <FaUserEdit className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Step 2: Complete Your Profile</h3>
            </div>
            <div className="mt-3 ml-11">
              <p className="text-gray-600 mb-2">Add your name, qualifications, experience, and services offered.</p>
              <p className="text-gray-600 mb-2">Upload important documents like:</p>
              <ul className="list-disc list-inside mb-2 text-gray-600 ml-2">
                <li>Garda vetting</li>
                <li>Tusla registration</li>
                <li>First aid certifications</li>
              </ul>
              <p className="text-gray-600">Set your location and availability accurately — our smart search engine uses this info to match you with parents nearby.</p>
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
              <p className="text-gray-600 mb-2">Appear in search results and connect with parents by subscribing:</p>
              <p className="text-gray-600 mb-2">€9.99/month or €99.99/year</p>
              <p className="text-gray-600">Get full platform access and increased visibility.</p>
            </div>
          </div>
          
          {/* Step 4 */}
          <div className="border-l-4 border-amber-500 pl-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 mr-3">
                <FaBell className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Step 4: Get Matched via Smart Search</h3>
            </div>
            <div className="mt-3 ml-11">
              <p className="text-gray-600 mb-2">Parents will find you based on proximity, skills, and availability.</p>
              <p className="text-gray-600">Keep your profile up to date to ensure accurate matches.</p>
            </div>
          </div>
          
          {/* Step 5 */}
          <div className="border-l-4 border-indigo-500 pl-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mr-3">
                <FaComments className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Step 5: Message & Confirm Bookings</h3>
            </div>
            <div className="mt-3 ml-11">
              <p className="text-gray-600 mb-2">Communicate with parents using in-platform messaging.</p>
              <p className="text-gray-600 mb-2">Agree on rates and care details.</p>
              <p className="text-gray-600">Receive payment directly — the platform does not process transactions.</p>
            </div>
          </div>
          
          {/* Step 6 */}
          <div className="border-l-4 border-pink-500 pl-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-600 mr-3">
                <FaStar className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Step 6: Deliver Quality Care & Earn Reviews</h3>
            </div>
            <div className="mt-3 ml-11">
              <p className="text-gray-600 mb-2">Great care leads to positive reviews and more visibility in search.</p>
              <p className="text-gray-600">Your reputation helps build long-term trust.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-10 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">Childminder User Agreement</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900">1. Introduction</h3>
            <p className="mt-1 text-gray-600">Welcome to ChildminderConnect. By registering as a childminder, you agree to the following terms aimed at promoting trust, professionalism, and safety across our platform.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">2. Eligibility</h3>
            <p className="mt-1 text-gray-600">To register as a childminder, you must:</p>
            <ul className="list-disc list-inside mt-1 text-gray-600 ml-2">
              <li>Be at least 18 years old.</li>
              <li>Be legally permitted to provide childcare in Ireland.</li>
              <li>Provide accurate documentation (e.g. Garda vetting, Tusla registration, and qualifications).</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">3. Account & Profile</h3>
            <p className="mt-1 text-gray-600">Maintain an accurate profile with up-to-date availability, qualifications, and services offered.</p>
            <p className="mt-1 text-gray-600">Misrepresentation of information may lead to account suspension or removal.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">4. Bookings and Payments</h3>
            <p className="mt-1 text-gray-600">Bookings must be initiated via the ChildminderConnect platform.</p>
            <p className="mt-1 text-gray-600">You are responsible for setting your own rates, payment terms, and cancellation policy, and for collecting payments directly from parents.</p>
            <p className="mt-1 text-gray-600">ChildminderConnect does not handle or mediate financial transactions between you and parents.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">5. Subscription Fees</h3>
            <p className="mt-1 text-gray-600">Childminders may be required to pay a subscription fee to access premium features or appear in parent searches.</p>
            <p className="mt-1 text-gray-600">Subscription fees are billed as agreed and are non-refundable unless otherwise stated.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">6. Care Standards</h3>
            <p className="mt-1 text-gray-600">You agree to deliver high-quality care and maintain a safe, clean, and professional environment.</p>
            <p className="mt-1 text-gray-600">You must comply with all relevant Irish laws and childcare regulations.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">7. Communication</h3>
            <p className="mt-1 text-gray-600">Use the built-in messaging system for all communications with parents.</p>
            <p className="mt-1 text-gray-600">Maintain a professional tone in all interactions.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">8. Reviews</h3>
            <p className="mt-1 text-gray-600">Parents may leave public reviews after bookings.</p>
            <p className="mt-1 text-gray-600">You may report inappropriate reviews for moderation, but cannot remove reviews yourself.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">9. Account Suspension</h3>
            <p className="mt-1 text-gray-600">We may suspend or remove accounts due to:</p>
            <ul className="list-disc list-inside mt-1 text-gray-600 ml-2">
              <li>Non-compliance with platform standards</li>
              <li>Verified complaints</li>
              <li>Safety concerns or legal issues</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">10. Privacy & Data</h3>
            <p className="mt-1 text-gray-600">We collect and process your data in accordance with our Privacy Policy and GDPR guidelines.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <Link 
          href="/dashboard/childminder/help" 
          className="flex items-center text-gray-600 hover:text-violet-600"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Help Center
        </Link>
      </div>
    </div>
  );
} 