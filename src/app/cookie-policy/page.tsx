import React from 'react';
import Link from 'next/link';
import { Cookie, FileText, Info, Globe, Settings, AlertTriangle, RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Cookie Policy | Childminder Connect',
  description: 'Learn about how Childminder Connect uses cookies on our website.',
};

const CookiePolicyPage = () => {
  return (
    <div className="bg-white text-gray-900">
      {/* Header Section with gradient background */}
      <section className="relative bg-gradient-to-br from-violet-900 via-violet-800 to-purple-800 pt-16 pb-32 mb-8">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-center opacity-10"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white">Cookie Policy</h1>
          <p className="max-w-2xl mx-auto text-lg font-medium text-white">
            How we use cookies to improve your experience on our platform
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
        {/* Table of Contents */}
        <section className="mb-12 p-6 bg-violet-50 border border-violet-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-violet-800 flex items-center">
            <FileText className="mr-2 h-6 w-6" /> Contents
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><a href="#introduction" className="text-violet-600 hover:text-violet-800 underline">Introduction</a></li>
            <li><a href="#what-are-cookies" className="text-violet-600 hover:text-violet-800 underline">What Are Cookies</a></li>
            <li><a href="#how-we-use" className="text-violet-600 hover:text-violet-800 underline">How Childminder Connect Uses Cookies</a></li>
            <li><a href="#third-party" className="text-violet-600 hover:text-violet-800 underline">Third-Party Cookies</a></li>
            <li><a href="#types" className="text-violet-600 hover:text-violet-800 underline">Types of Cookies We Use</a></li>
            <li><a href="#your-choices" className="text-violet-600 hover:text-violet-800 underline">Your Choices Regarding Cookies</a></li>
            <li><a href="#consent" className="text-violet-600 hover:text-violet-800 underline">Consent</a></li>
            <li><a href="#changes" className="text-violet-600 hover:text-violet-800 underline">Changes to Our Cookie Policy</a></li>
          </ul>
        </section>
        
        {/* Last Updated Section */}
        <section className="mb-12 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <p className="text-gray-700 mb-4">Last updated: April 8, 2025</p>
        </section>
        
        {/* Introduction Section */}
        <section id="introduction" className="mb-12 p-6 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-blue-800 flex items-center">
            <Info className="mr-2 h-6 w-6" /> Introduction
          </h2>
          <p className="text-gray-700 mb-4">
            Childminder Connect ("we" or "us" or "our") uses cookies on our website. By using the service, you consent to the use of cookies.
          </p>
          <p className="text-gray-700">
            Our Cookie Policy explains what cookies are, how we use them, how third parties we may partner with may use cookies on the service, your choices regarding cookies, and further information about cookies.
          </p>
        </section>
        
        {/* What Are Cookies Section */}
        <section id="what-are-cookies" className="mb-12 p-6 bg-green-50 border border-green-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-green-800 flex items-center">
            <Cookie className="mr-2 h-6 w-6" /> What Are Cookies
          </h2>
          <p className="text-gray-700">
            Cookies are small pieces of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows the service or a third party to recognize you and make your next visit easier and the service more useful to you.
          </p>
        </section>
        
        {/* How We Use Cookies Section */}
        <section id="how-we-use" className="mb-12 p-6 bg-purple-50 border border-purple-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-purple-800 flex items-center">
            <Settings className="mr-2 h-6 w-6" /> How Childminder Connect Uses Cookies
          </h2>
          <p className="text-gray-700 mb-4">
            When you use and access our service, we may place several cookies in your web browser. We use cookies for the following purposes:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li><strong>Essential cookies:</strong> Required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website.</li>
            <li><strong>Analytical/performance cookies:</strong> Allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it.</li>
            <li><strong>Functionality cookies:</strong> Used to recognize you when you return to our website. This enables us to personalize our content for you and remember your preferences.</li>
            <li><strong>Targeting cookies:</strong> Record your visit to our website, the pages you have visited, and the links you have followed.</li>
          </ul>
        </section>
        
        {/* Third-Party Cookies Section */}
        <section id="third-party" className="mb-12 p-6 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-800 flex items-center">
            <Globe className="mr-2 h-6 w-6" /> Third-Party Cookies
          </h2>
          <p className="text-gray-700">
            In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the service, deliver advertisements on and through the service, and so on.
          </p>
        </section>
        
        {/* Types of Cookies We Use Section */}
        <section id="types" className="mb-12 p-6 bg-teal-50 border border-teal-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-teal-800 flex items-center">
            <Cookie className="mr-2 h-6 w-6" /> Types of Cookies We Use
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-teal-100">
                  <th className="border p-3 text-left text-teal-800">Cookie Type</th>
                  <th className="border p-3 text-left text-teal-800">Purpose</th>
                  <th className="border p-3 text-left text-teal-800">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3 bg-white">Session Cookies</td>
                  <td className="border p-3 bg-white">Used to maintain your session while using our platform</td>
                  <td className="border p-3 bg-white">Session</td>
                </tr>
                <tr>
                  <td className="border p-3 bg-white">Authentication Cookies</td>
                  <td className="border p-3 bg-white">Used to remember your login status</td>
                  <td className="border p-3 bg-white">30 days</td>
                </tr>
                <tr>
                  <td className="border p-3 bg-white">Preference Cookies</td>
                  <td className="border p-3 bg-white">Used to remember your preferences, such as language</td>
                  <td className="border p-3 bg-white">1 year</td>
                </tr>
                <tr>
                  <td className="border p-3 bg-white">Analytics Cookies</td>
                  <td className="border p-3 bg-white">Used to collect information about how you use our website</td>
                  <td className="border p-3 bg-white">2 years</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        
        {/* Your Choices Section */}
        <section id="your-choices" className="mb-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-800 flex items-center">
            <Settings className="mr-2 h-6 w-6" /> Your Choices Regarding Cookies
          </h2>
          <p className="text-gray-700 mb-4">
            If you prefer to avoid the use of cookies on the website, first you must disable the use of cookies in your browser and then delete the cookies saved in your browser associated with this website.
          </p>
          <p className="text-gray-700">
            You can use the options in your web browser if you do not wish to receive a cookie or if you wish to set your browser to notify you when you receive a cookie. You can easily delete and manage any cookies that have been installed in the cookie folder of your browser by following the instructions provided by your browser manufacturer.
          </p>
        </section>
        
        {/* Consent Section */}
        <section id="consent" className="mb-12 p-6 bg-pink-50 border border-pink-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-pink-800 flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" /> Consent
          </h2>
          <p className="text-gray-700">
            By using our website, you consent to our cookie policy. You can change your cookie settings at any time by using the Cookie Settings option in the footer of our website.
          </p>
        </section>
        
        {/* Changes Section */}
        <section id="changes" className="mb-12 p-6 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-orange-800 flex items-center">
            <RefreshCw className="mr-2 h-6 w-6" /> Changes to Our Cookie Policy
          </h2>
          <p className="text-gray-700 mb-4">
            We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date at the top of this page.
          </p>
          <p className="text-gray-700">
            You are advised to review this Cookie Policy periodically for any changes. Changes to this Cookie Policy are effective when they are posted on this page.
          </p>
        </section>
        
        {/* Contact Section */}
        <section className="mb-12 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <p className="text-gray-700">
            If you have any questions about our Cookie Policy, please contact us at:{' '}
            <a href="mailto:support@childminderconnect.ie" className="text-violet-600 hover:text-violet-800 underline">
              support@childminderconnect.ie
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default CookiePolicyPage;