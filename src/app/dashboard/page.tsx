"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
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
    // Add debugging for session data
    console.log("Session status:", status);
    console.log("Session data:", session);
    
    if (status === "authenticated" && session?.user) {
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
    } else if (status === "unauthenticated") {
      console.log("User is unauthenticated, redirecting to login");
      router.push("/auth/login");
    }
  }, [status, session, router, subscriptionSuccess, isRedirecting, secondsLeft]);

  // Loading state while checking session
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent mb-4"></div>
        {subscriptionSuccess && (
          <div className="text-center">
            <p className="text-green-600 font-medium">Thank you for your subscription!</p>
            <p className="text-gray-600 mt-2">Updating your account status... {secondsLeft > 0 ? `(${secondsLeft}s)` : ""}</p>
          </div>
        )}
        {!subscriptionSuccess && (
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        )}
      </div>
    </div>
  );
} 