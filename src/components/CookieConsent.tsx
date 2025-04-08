"use client";

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cmcpro-cookie-consent';

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = Cookies.get(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show the banner if no consent has been given
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    // Set cookie for 1 year (365 days)
    Cookies.set(COOKIE_CONSENT_KEY, 'accepted', { expires: 365 });
    setShowConsent(false);
  };

  const declineCookies = () => {
    // Set cookie to remember that user declined, but with shorter expiration (30 days)
    Cookies.set(COOKIE_CONSENT_KEY, 'declined', { expires: 30 });
    setShowConsent(false);
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md z-50 p-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            We use cookies to enhance your experience on our website. By continuing to use our site, you agree to our{' '}
            <Link href="/cookie-policy" className="text-blue-600 hover:underline">
              Cookie Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={declineCookies}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Decline
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={declineCookies} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close cookie consent"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;