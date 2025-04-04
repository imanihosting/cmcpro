"use client";

import { useSession } from "next-auth/react";
import { useRouter,  } from 'next/navigation';
import { Suspense,  useEffect, useState  } from 'react';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';

function DashboardContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { searchParams, SearchParamsListener } = useSafeSearchParams();
  const subscriptionSuccess = searchParams?.get('subscription') === 'success';
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);

  // Add a session refresh effect when subscription success is true
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (subscriptionSuccess && !isRedirecting && status === "authenticated") {
      // Update the session to get fresh data from the server
      console.log("Subscription success detected, refreshing session data...");
      
      // Set up countdown for user feedback
      intervalId = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Refresh the session to get the latest data from the server
      const refreshSession = async () => {
        try {
          // Force update subscription status in database by hitting the check-subscription endpoint
          await fetch('/api/check-subscription', {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
          });
          
          // Force update the user's status in Prisma by hitting the fix-subscriptions endpoint
          await fetch('/api/fix-subscriptions', {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
          });
          
          // Then update the session with the latest information
          await update(); // Force refresh the session
          console.log("Session refreshed successfully");
        } catch (error) {
          console.error("Error refreshing session:", error);
        }
      };
      
      refreshSession();
      
      // Cleanup interval
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, [subscriptionSuccess, status, update, isRedirecting]);

  useEffect(() => {
    // Check for redirect from registration and if found,
    // ensure the user goes to the subscription page
    if (status === 'authenticated' && typeof window !== 'undefined') {
      const redirectFlag = localStorage.getItem('redirectToSubscription');
      if (redirectFlag === 'true') {
        // Clear the flag
        localStorage.removeItem('redirectToSubscription');
        console.log("Detected redirect from registration, redirecting to subscription page");
        router.push('/subscription');
        return;
      }
    }

    // Regular dashboard routing logic continues below
    if (status === "authenticated") {
      if (subscriptionSuccess && !isRedirecting) {
        // Add debugging for session data
        console.log("Session status:", status);
        console.log("Session data:", session);
        
        if (session?.user) {
          // Check if user is admin first - bypass all subscription checks
          const userRole = String(session.user.role).toLowerCase();
          if (userRole === "admin") {
            console.log("User is admin - bypassing subscription check");
            if (!isRedirecting) {
              setIsRedirecting(true);
              router.push("/dashboard/admin");
            }
            return;
          }
          
          // If subscription was just successful, don't check status yet
          // This gives time for the webhook to update the user's status in the database
          if (subscriptionSuccess && !isRedirecting && secondsLeft === 0) {
            setIsRedirecting(true);
            console.log("Subscription success, redirecting based on role");
            
            // Check user role and redirect accordingly
            if (session.user.role === "admin") {
              router.push("/dashboard/admin");
            } else if (session.user.role === "parent") {
              router.push("/dashboard/parent");
            } else if (session.user.role === "childminder") {
              router.push("/dashboard/childminder");
            } else {
              console.log("Unknown role:", session.user.role);
              // Default dashboard as fallback
              router.push("/dashboard/parent");
            }
            return;
          }
          
          // Coming from normal login flow
          if (!subscriptionSuccess && !isRedirecting) {
            console.log("Normal flow - checking subscription status");
            
            // Convert to string to handle different possible formats
            const subStatus = String(session.user.subscriptionStatus).toUpperCase();
            console.log("Subscription status:", subStatus);
            
            // Skip subscription check for admin users - use string comparison
            const userRole = String(session.user.role).toLowerCase();
            if (userRole === "admin") {
              console.log("User is admin - bypassing subscription check");
              setIsRedirecting(true);
              router.push("/dashboard/admin");
              return;
            }
            
            // Check if subscriptionStatus exists and is FREE
            if (subStatus === "FREE") {
              console.log("Subscription status is FREE, checking if user has active subscription...");
              
              // Check if user has an active subscription but wrong status - this could happen
              // if the webhook failed to update the user status
              const checkAndFixSubscription = async () => {
                try {
                  // First check if the user has an active subscription
                  const checkResponse = await fetch('/api/check-subscription');
                  const checkData = await checkResponse.json();
                  
                  // If user has an active subscription but FREE status, fix it
                  if (checkData.hasActiveSubscription && subStatus === "FREE") {
                    console.log("User has active subscription but FREE status, fixing...");
                    const fixResponse = await fetch('/api/fix-subscriptions');
                    const fixData = await fixResponse.json();
                    
                    if (fixData.success) {
                      console.log("Fixed subscription status, refreshing session");
                      await update(); // Refresh session data
                      router.push('/dashboard'); // Reload dashboard with updated session
                      return true;
                    }
                  } else if (checkData.hasMismatch) {
                    console.log("Subscription status mismatch detected, fixing...");
                    const fixResponse = await fetch('/api/fix-subscriptions');
                    const fixData = await fixResponse.json();
                    
                    if (fixData.success) {
                      console.log("Fixed subscription status, refreshing session");
                      await update(); // Refresh session data
                      router.push('/dashboard'); // Reload dashboard with updated session
                      return true;
                    }
                  }
                  
                  return false;
                } catch (error) {
                  console.error("Error checking/fixing subscription:", error);
                  return false;
                }
              };
              
              // Call the check and fix function
              checkAndFixSubscription().then(fixed => {
                // Only redirect to subscription page if we didn't fix anything
                if (!fixed) {
                  console.log("Couldn't fix subscription, redirecting to subscription page");
                  router.push("/subscription?required=true");
                }
              });
              
              return; // Wait for the check to complete before proceeding
            }
            
            console.log("Subscription is PREMIUM or not set, redirecting based on role");
            setIsRedirecting(true);
            
            // If subscription is PREMIUM or not explicitly set, redirect based on user role
            if (session.user.role === "admin") {
              router.push("/dashboard/admin");
            } else if (session.user.role === "parent") {
              router.push("/dashboard/parent");
            } else if (session.user.role === "childminder") {
              router.push("/dashboard/childminder");
            } else {
              console.log("Unknown role:", session.user.role);
              // Default dashboard as fallback
              router.push("/dashboard/parent");
            }
          }
        }
      }
    } else if (status === "unauthenticated") {
      console.log("User is unauthenticated, redirecting to login");
      router.push("/auth/login");
    }
  }, [status, session, router, subscriptionSuccess, isRedirecting, secondsLeft, update]);

  // Loading state while checking session
  return (
    <div>
      <SearchParamsListener />
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-solid border-violet-500 border-r-transparent"></div>
          <span className="mt-4 text-sm text-gray-500">Loading your dashboard...</span>
        </div>
      </div>
    </div>
  );
} 
export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
    </div>}>
      <DashboardContent />
    </Suspense>
  );
}