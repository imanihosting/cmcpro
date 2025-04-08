import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Users, Shield, Scale, AlertTriangle, Briefcase, XCircle, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | ChildMinderConnect',
  description: 'ChildMinderConnect terms of service and user agreement.'
};

export default function TermsOfService() {
  return (
    <div className="bg-white text-gray-900">
      {/* Header Section with gradient background */}
      <section className="relative bg-gradient-to-br from-violet-900 via-violet-800 to-purple-800 pt-16 pb-32 mb-8">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-center opacity-10"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white">Terms of Service</h1>
          <p className="max-w-2xl mx-auto text-lg font-medium text-white">
            Our user agreement and the rules that govern your use of our platform
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
            <li><a href="#overview" className="text-violet-600 hover:text-violet-800 underline">Overview</a></li>
            <li><a href="#eligibility" className="text-violet-600 hover:text-violet-800 underline">Eligibility</a></li>
            <li><a href="#account-registration" className="text-violet-600 hover:text-violet-800 underline">Account Registration</a></li>
            <li><a href="#services" className="text-violet-600 hover:text-violet-800 underline">Services</a></li>
            <li><a href="#user-responsibilities" className="text-violet-600 hover:text-violet-800 underline">User Responsibilities</a></li>
            <li><a href="#safety-verification" className="text-violet-600 hover:text-violet-800 underline">Safety and Verification</a></li>
            <li><a href="#limitation-liability" className="text-violet-600 hover:text-violet-800 underline">Limitation of Liability</a></li>
            <li><a href="#termination" className="text-violet-600 hover:text-violet-800 underline">Termination</a></li>
          </ul>
        </section>

        {/* Overview Section */}
        <section id="overview" className="mb-12 p-6 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-blue-800 flex items-center">
            <FileText className="mr-2 h-6 w-6" /> 1. Overview
          </h2>
          <p className="text-gray-700">
            These Terms of Service govern your use of ChildMinderConnect's platform. By using our services, you agree to these terms in full.
          </p>
        </section>
        
        {/* Eligibility Section */}
        <section id="eligibility" className="mb-12 p-6 bg-green-50 border border-green-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-green-800 flex items-center">
            <Users className="mr-2 h-6 w-6" /> 2. Eligibility
          </h2>
          <p className="text-gray-700">
            Users must be at least 18 years old to use ChildMinderConnect. Childminders must meet all legal requirements for providing childcare services in Ireland.
          </p>
        </section>
        
        {/* Account Registration Section */}
        <section id="account-registration" className="mb-12 p-6 bg-purple-50 border border-purple-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-purple-800 flex items-center">
            <Settings className="mr-2 h-6 w-6" /> 3. Account Registration
          </h2>
          <p className="text-gray-700">
            Users must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials.
          </p>
        </section>
        
        {/* Services Section */}
        <section id="services" className="mb-12 p-6 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-800 flex items-center">
            <Briefcase className="mr-2 h-6 w-6" /> 4. Services
          </h2>
          <p className="text-gray-700">
            ChildMinderConnect provides a platform for connecting parents with childminders. We do not employ childminders and are not responsible for the childcare services provided.
          </p>
        </section>
        
        {/* User Responsibilities Section */}
        <section id="user-responsibilities" className="mb-12 p-6 bg-teal-50 border border-teal-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-teal-800 flex items-center">
            <Users className="mr-2 h-6 w-6" /> 5. User Responsibilities
          </h2>
          <p className="text-gray-700">
            Users must conduct their own due diligence when selecting childcare providers or accepting childcare work. All arrangements and agreements between parents and childminders are their sole responsibility.
          </p>
        </section>
        
        {/* Safety and Verification Section */}
        <section id="safety-verification" className="mb-12 p-6 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-amber-800 flex items-center">
            <Shield className="mr-2 h-6 w-6" /> 6. Safety and Verification
          </h2>
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 mb-4">
            <p className="font-bold text-yellow-700">Important Safety Notice</p>
            <p className="text-gray-700 mb-2">
              While we provide tools for verification, parents are responsible for verifying childminders' credentials, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Garda vetting status</li>
              <li>Tusla registration (where applicable)</li>
              <li>Professional qualifications</li>
              <li>References and experience</li>
            </ul>
            <p className="mt-2 text-gray-700">
              We strongly recommend conducting thorough verification of all credentials before making any childcare arrangements.
            </p>
          </div>
          <div className="mt-4">
            <Link href="/safety" className="text-violet-600 hover:text-violet-800 underline">
              Learn more about our safety policies →
            </Link>
          </div>
        </section>
        
        {/* Limitation of Liability Section */}
        <section id="limitation-liability" className="mb-12 p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-red-800 flex items-center">
            <Scale className="mr-2 h-6 w-6" /> 7. Limitation of Liability
          </h2>
          <p className="text-gray-700">
            ChildMinderConnect is not liable for any disputes, damages, or issues arising from the childcare arrangements made through our platform.
          </p>
        </section>
        
        {/* Termination Section */}
        <section id="termination" className="mb-12 p-6 bg-pink-50 border border-pink-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-pink-800 flex items-center">
            <XCircle className="mr-2 h-6 w-6" /> 8. Termination
          </h2>
          <p className="text-gray-700">
            We reserve the right to terminate or suspend accounts that violate these terms or engage in inappropriate behavior.
          </p>
        </section>
        
        {/* Last Updated & Contact Section */}
        <section className="mb-12 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <p className="text-gray-700 mb-4">Last updated: April 8, 2025</p>
          
          <p className="text-gray-700">
            Contact{' '}
            <a href="mailto:support@childminderconnect.com" className="text-violet-600 hover:text-violet-800 underline">
              Support
            </a>
            {' '}for Questions
          </p>
        </section>
      </div>
    </div>
  );
}