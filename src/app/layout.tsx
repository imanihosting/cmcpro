"use client";

import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import LoadingProvider from "@/components/providers/LoadingProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#4f46e5" />
        <title>ChildminderConnect</title>
        <meta name="description" content="Connect with trusted childminders in your area" />
        <link rel="icon" href="/next.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased flex min-h-screen flex-col`}
      >
        <SessionProvider>
          <LoadingProvider>
            <Toaster />
            <Header />
            <main className="flex-grow pt-16">{children}</main>
            <Footer />
          </LoadingProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
