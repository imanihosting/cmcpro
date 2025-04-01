"use client";

import { SessionProvider } from "@/components/providers/SessionProvider";
import LoadingProvider from "@/components/providers/LoadingProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Dynamically import the chat widget to reduce initial bundle size
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  ssr: false,
  loading: () => null,
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Check if the page is in admin dashboard
  const isAdminDashboard = pathname?.startsWith('/dashboard/admin');
  
  // Check if we should show the chat widget
  // Don't show it for admins or on admin dashboard pages
  const showChatWidget = session && 
    session.user?.role !== 'admin' && 
    !isAdminDashboard && 
    !pathname?.includes('/auth/');
    
  // Add debug logging
  console.log('Chat Widget Debug:', {
    hasSession: !!session,
    userRole: session?.user?.role,
    isAdminDashboard,
    pathname,
    shouldShow: showChatWidget
  });

  return (
    <SessionProvider>
      <LoadingProvider>
        <Header />
        <main className="flex-grow pt-16">{children}</main>
        <Footer />
        {showChatWidget && <ChatWidget />}
      </LoadingProvider>
    </SessionProvider>
  );
} 