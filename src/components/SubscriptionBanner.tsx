"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSubscriptionDetails } from "@/lib/subscription";
import { FaInfoCircle, FaExclamationTriangle, FaClock, FaTimes } from "react-icons/fa";
import { useState } from "react";

export default function SubscriptionBanner() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (!session?.user || dismissed) {
    return null;
  }

  const { status, daysRemaining, needsSubscription, statusText } = getSubscriptionDetails(session.user);

  // Only show banner for trial or expired states
  if (status !== 'trial' && status !== 'expired' && status !== 'pending') {
    return null;
  }

  // Determine banner style based on status
  let bannerStyle = "";
  let icon = null;
  
  if (status === 'trial') {
    if (daysRemaining <= 5) {
      // Warning for trial ending soon
      bannerStyle = "bg-yellow-50 border-yellow-200 text-yellow-800";
      icon = <FaExclamationTriangle className="h-5 w-5 text-yellow-500" />;
    } else {
      // Info for active trial
      bannerStyle = "bg-blue-50 border-blue-200 text-blue-800";
      icon = <FaInfoCircle className="h-5 w-5 text-blue-500" />;
    }
  } else if (status === 'expired' || status === 'pending') {
    // Error for expired trial
    bannerStyle = "bg-red-50 border-red-200 text-red-800";
    icon = <FaExclamationTriangle className="h-5 w-5 text-red-500" />;
  }

  return (
    <div className={`relative border-t border-b py-3 px-4 ${bannerStyle}`}>
      <button 
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <FaTimes className="h-4 w-4" />
      </button>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon}
          <div className="ml-3">
            <p className="font-medium">
              {status === 'trial' ? (
                <>
                  {daysRemaining <= 5 ? (
                    <>Your free trial ends in <span className="font-bold">{daysRemaining} days</span></>
                  ) : (
                    <>{statusText}</>
                  )}
                </>
              ) : (
                <>{statusText}</>
              )}
            </p>
            <p className="mt-1 text-sm">
              {status === 'trial' ? (
                <>Subscribe now to continue accessing premium features after your trial.</>
              ) : (
                <>Subscribe now to regain access to premium features.</>
              )}
            </p>
          </div>
        </div>
        
        <Link
          href="/subscription"
          className="ml-4 whitespace-nowrap rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-violet-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          Subscribe Now
        </Link>
      </div>
    </div>
  );
} 