"use client";

import { SessionProvider } from "@/components/providers/SessionProvider";
import LoadingProvider from "@/components/providers/LoadingProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <LoadingProvider>
        <Header />
        <main className="flex-grow pt-16">{children}</main>
        <Footer />
      </LoadingProvider>
    </SessionProvider>
  );
} 