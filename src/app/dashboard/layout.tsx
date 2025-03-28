"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if the user is authenticated
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // Redirect based on user role if they're at the dashboard root
    if (status === "authenticated" && pathname === "/dashboard") {
      if (session?.user?.role === "admin") {
        router.push("/dashboard/admin");
      } else if (session?.user?.role === "parent") {
        router.push("/dashboard/parent");
      } else if (session?.user?.role === "childminder") {
        router.push("/dashboard/childminder");
      }
    }
  }, [status, session, router, pathname]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar will be added here */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
} 