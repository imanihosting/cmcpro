"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NewMessagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  
  const receiverId = searchParams?.get('receiverId') || null;
  const receiverName = searchParams?.get('receiverName') || null;

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/dashboard/parent/messages/new");
      return;
    }
    
    if (receiverId) {
      // Redirect to the main messages page with both conversation parameter and receiverId/receiverName
      router.push(`/dashboard/parent/messages?conversation=${receiverId}&receiverId=${receiverId}${receiverName ? `&receiverName=${receiverName}` : ''}`);
    } else {
      // If no receiverId, redirect to the main messages page
      router.push("/dashboard/parent/messages");
    }
  }, [router, receiverId, receiverName, status]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
        <p className="mt-2 text-sm text-gray-600">Redirecting to messages...</p>
      </div>
    </div>
  );
} 