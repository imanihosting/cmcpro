import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, FileText, User, Database, Lock, Cookie, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | ChildminderConnect',
  description: 'ChildminderConnect privacy policy and data protection information.'
};

export default function PrivacyPolicy() {
  return (
    <div className="bg-white text-gray-900">
      {/* Header Section with gradient background */}
      <section className="relative bg-gradient-to-br from-violet-900 via-violet-800 to-purple-800 pt-16 pb-32 mb-8">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-center opacity-10"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white">Privacy Policy</h1>
          <p className="max-w-2xl mx-auto text-lg font-medium text-white">
            How we collect, use, and protect your personal information
          </p>
        </div>
        
        {/* Bottom wave decoration */}
        <div className="absolute -bottom-1 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto">
            <path 
              fill="#ffffff" 
              fillOpacity="1" 
              d="M0,96L60,80C120,64,240,32,360,21.3C480,11,600,21,720,42.7C840,64,960,96,1080,101.3C1200,107,1320,85,1380,74.7L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Introduction */}
         <p className="text-gray-700 mb-8">
            At ChildminderConnect, we take your privacy seriously. This Privacy Policy outlines how we collect, use, share, and protect your personal information in compliance with the General Data Protection Regulation (GDPR) and applicable Irish data protection laws.
        </p>
        <p className="text-gray-600 text-sm mb-8">Last updated: April 8, 2025</p>

        {/* Table of Contents */}
        <section className="mb-12 p-6 bg-violet-50 border border-violet-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-violet-800 flex items-center">
            <FileText className="mr-2 h-6 w-6" /> Contents
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><a href="#information-we-collect" className="text-violet-600 hover:text-violet-800 underline">Information We Collect</a></li>
            <li><a href="#how-we-use" className="text-violet-600 hover:text-violet-800 underline">How We Use Your Information</a></li>
            <li><a href="#information-sharing" className="text-violet-600 hover:text-violet-800 underline">Information Sharing</a></li>
            <li><a href="#data-security" className="text-violet-600 hover:text-violet-800 underline">Data Security</a></li>
            <li><a href="#your-rights" className="text-violet-600 hover:text-violet-800 underline">Your Rights</a></li>
            <li><a href="#cookies-policy" className="text-violet-600 hover:text-violet-800 underline">Cookies Policy</a></li>
            <li><a href="#changes" className="text-violet-600 hover:text-violet-800 underline">Changes to This Policy</a></li>
          </ul>
        </section>

        {/* Information We Collect Section */}
        <section id="information-we-collect" className="mb-12 p-6 bg-blue-50 border border-blue-200 rounded-lg shadow-sm space-y-4">
          <h2 className="text-2xl font-semibold mb-4 text-blue-800 flex items-center">
            <User className="mr-2 h-6 w-6" /> 1. Information We Collect
          </h2>

          <div>
            <h3 className="text-xl font-medium mb-3 text-gray-800">Personal Information</h3>
            <p className="text-gray-700 mb-2">
              We collect personal information that you provide when creating an account or using our services. This may include:
            </p>
            <ul className="list-disc list-inside pl-4 text-gray-700 space-y-1">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Address</li>
                <li>User role (Parent or Childminder)</li>
                <li>Child details (added by Parents)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-medium mb-3 text-gray-800">Verification and Compliance Information</h3>
            <p className="text-gray-700 mb-2">
              For childminders, we may also collect:
            </p>
             <ul className="list-disc list-inside pl-4 text-gray-700 space-y-1">
                <li>Professional qualifications</li>
                <li>Garda Vetting status</li>
                <li>Tusla registration details</li>
                <li>Other compliance documentation</li>
            </ul>
          </div>

           <div>
            <h3 className="text-xl font-medium mb-3 text-gray-800">Usage Information</h3>
            <p className="text-gray-700 mb-2">
             We collect data on how you use our platform, such as:
            </p>
             <ul className="list-disc list-inside pl-4 text-gray-700 space-y-1">
                <li>Login activity</li>
                <li>Messages sent</li>
                <li>Bookings made</li>
                <li>Search queries</li>
            </ul>
          </div>
        </section>
        
        {/* How We Use Section */}
        <section id="how-we-use" className="mb-12 p-6 bg-green-50 border border-green-200 rounded-lg shadow-sm space-y-4">
          <h2 className="text-2xl font-semibold mb-4 text-green-800 flex items-center">
            <FileText className="mr-2 h-6 w-6" /> 2. How We Use Your Information
          </h2>
          <p className="text-gray-700 mb-2">
            We process your personal information to:
          </p>
           <ul className="list-disc list-inside pl-4 text-gray-700 space-y-1">
                <li>Provide and manage our matching and booking services</li>
                <li>Facilitate secure communication between users</li>
                <li>Ensure safety, trust, and compliance across the platform</li>
                <li>Personalize your user experience</li>
                <li>Monitor and improve our services</li>
                <li>Fulfill legal and regulatory obligations</li>
           </ul>
           <p className="text-gray-700">
             All processing is based on a lawful basis under Article 6 of the GDPR, including the performance of a contract, legal obligation, or your consent (where required).
           </p>
        </section>
        
        {/* Information Sharing Section */}
        <section id="information-sharing" className="mb-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm space-y-4">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-800 flex items-center">
            <Database className="mr-2 h-6 w-6" /> 3. Information Sharing
          </h2>
           <p className="text-gray-700 mb-2">
            We only share your personal data when necessary:
          </p>
           <ul className="list-disc list-inside pl-4 text-gray-700 space-y-1">
                <li>With other users (e.g., name and relevant details when making bookings)</li>
                <li>With service providers who support our platform under strict data protection agreements</li>
                <li>To comply with legal requirements, law enforcement, or to protect our legal rights</li>
           </ul>
           <p className="text-gray-700">
            We never sell your personal data.
           </p>
        </section>
        
        {/* Data Security Section */}
        <section id="data-security" className="mb-12 p-6 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm space-y-4">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-800 flex items-center">
            <Lock className="mr-2 h-6 w-6" /> 4. Data Security
          </h2>
          <p className="text-gray-700 mb-2">
            We implement robust technical and organizational security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. This includes:
          </p>
           <ul className="list-disc list-inside pl-4 text-gray-700 space-y-1">
                <li>Encrypted storage</li>
                <li>Secure transmission protocols (HTTPS)</li>
                <li>Role-based access controls</li>
                <li>Regular security audits</li>
           </ul>
        </section>
        
        {/* Your Rights Section */}
        <section id="your-rights" className="mb-12 p-6 bg-pink-50 border border-pink-200 rounded-lg shadow-sm space-y-4">
          <h2 className="text-2xl font-semibold mb-4 text-pink-800 flex items-center">
            <Shield className="mr-2 h-6 w-6" /> 5. Your Rights
          </h2>
           <p className="text-gray-700 mb-2">
            Under GDPR, you have the right to:
          </p>
           <ul className="list-disc list-inside pl-4 text-gray-700 space-y-1">
                <li>Access the personal data we hold about you</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your data</li>
                <li>Restrict or object to processing in certain circumstances</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time (where processing is based on consent)</li>
           </ul>
            <p className="text-gray-700">
             To exercise your rights, contact us at support@childminderconnect.com. We will respond within one month in accordance with GDPR.
           </p>
        </section>
        
        {/* Cookies Policy Section */}
        <section id="cookies-policy" className="mb-12 p-6 bg-orange-50 border border-orange-200 rounded-lg shadow-sm space-y-4">
          <h2 className="text-2xl font-semibold mb-4 text-orange-800 flex items-center">
            <Cookie className="mr-2 h-6 w-6" /> 6. Cookies Policy
          </h2>
           <p className="text-gray-700 mb-2">
             We use cookies and similar technologies to:
           </p>
           <ul className="list-disc list-inside pl-4 text-gray-700 space-y-1">
                <li>Improve your browsing experience</li>
                <li>Remember your preferences</li>
                <li>Analyze traffic and usage patterns</li>
           </ul>
           <p className="text-gray-700">
             You can manage cookie preferences in your browser settings. For more detailed information, please see our Cookie Policy.
           </p>
          <div className="mt-4">
            <Link href="/cookie-policy" className="text-violet-600 hover:text-violet-800 underline">
              Read our full Cookie Policy →
            </Link>
          </div>
        </section>
        
        {/* Changes Section */}
        <section id="changes" className="mb-12 p-6 bg-teal-50 border border-teal-200 rounded-lg shadow-sm space-y-4">
          <h2 className="text-2xl font-semibold mb-4 text-teal-800 flex items-center">
            <RefreshCw className="mr-2 h-6 w-6" /> 7. Changes to This Policy
          </h2>
          <p className="text-gray-700">
            We may update this Privacy Policy from time to time. If we make significant changes, we will notify you through the platform or via email. We encourage you to review this policy periodically.
          </p>
        </section>
        
        {/* Contact Section */}
        <section className="mb-12 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
           <p className="text-gray-700 font-semibold mb-2">Questions or concerns?</p>
           <p className="text-gray-700 mb-2">Contact our Data Protection Officer at:</p>
          <p className="text-gray-700">
             📧{' '}
            <a href="mailto:support@childminderconnect.com" className="text-violet-600 hover:text-violet-800 underline">
              support@childminderconnect.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}