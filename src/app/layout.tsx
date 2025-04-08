import "@/app/globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import ClientLayout from "@/components/ClientLayout";
import dynamic from "next/dynamic";

// Dynamically import the CookieConsent component with no SSR to avoid hydration issues
const CookieConsent = dynamic(() => import("@/components/CookieConsent"), { ssr: false });

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

export const metadata: Metadata = {
  title: "CMC",
  description: "Childminder Connection - Connecting parents with childminders",
  applicationName: "CMC",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#4f46e5" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/baby-icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/baby-icon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased flex min-h-screen flex-col`}
      >
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
