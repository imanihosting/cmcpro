import { Metadata } from 'next';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Terms of Service | ChildMinderConnect',
  description: 'ChildMinderConnect terms of service and user agreement.'
};

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-violet-600 hover:text-violet-800"
        >
          <FaArrowLeft className="mr-2" /> Back to Home
        </Link>
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-violet-800">Terms of Service</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">Contents</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li><a href="#overview" className="hover:text-violet-600">Overview</a></li>
          <li><a href="#eligibility" className="hover:text-violet-600">Eligibility</a></li>
          <li><a href="#account-registration" className="hover:text-violet-600">Account Registration</a></li>
          <li><a href="#services" className="hover:text-violet-600">Services</a></li>
          <li><a href="#user-responsibilities" className="hover:text-violet-600">User Responsibilities</a></li>
          <li><a href="#safety-verification" className="hover:text-violet-600">Safety and Verification</a></li>
          <li><a href="#limitation-liability" className="hover:text-violet-600">Limitation of Liability</a></li>
          <li><a href="#termination" className="hover:text-violet-600">Termination</a></li>
        </ul>
      </div>
      
      <section id="overview" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">1. Overview</h2>
        <p className="text-gray-700">
          These Terms of Service govern your use of ChildMinderConnect's platform. By using our services, you agree to these terms in full.
        </p>
      </section>
      
      <section id="eligibility" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">2. Eligibility</h2>
        <p className="text-gray-700">
          Users must be at least 18 years old to use ChildMinderConnect. Childminders must meet all legal requirements for providing childcare services in Ireland.
        </p>
      </section>
      
      <section id="account-registration" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">3. Account Registration</h2>
        <p className="text-gray-700">
          Users must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials.
        </p>
      </section>
      
      <section id="services" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">4. Services</h2>
        <p className="text-gray-700">
          ChildMinderConnect provides a platform for connecting parents with childminders. We do not employ childminders and are not responsible for the childcare services provided.
        </p>
      </section>
      
      <section id="user-responsibilities" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">5. User Responsibilities</h2>
        <p className="text-gray-700">
          Users must conduct their own due diligence when selecting childcare providers or accepting childcare work. All arrangements and agreements between parents and childminders are their sole responsibility.
        </p>
      </section>
      
      <section id="safety-verification" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">6. Safety and Verification</h2>
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
          <p className="font-bold text-amber-700">Important Safety Notice</p>
          <p className="text-gray-700">
            While we provide tools for verification, parents are responsible for verifying childminders' credentials, including:
          </p>
          <ul className="list-disc pl-5 mt-2 text-gray-700">
            <li>Garda vetting status</li>
            <li>Tusla registration (where applicable)</li>
            <li>Professional qualifications</li>
            <li>References and experience</li>
          </ul>
          <p className="mt-2 text-gray-700">
            We strongly recommend conducting thorough verification of all credentials before making any childcare arrangements.
          </p>
        </div>
      </section>
      
      <section id="limitation-liability" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">7. Limitation of Liability</h2>
        <p className="text-gray-700">
          ChildMinderConnect is not liable for any disputes, damages, or issues arising from the childcare arrangements made through our platform.
        </p>
      </section>
      
      <section id="termination" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">8. Termination</h2>
        <p className="text-gray-700">
          We reserve the right to terminate or suspend accounts that violate these terms or engage in inappropriate behavior.
        </p>
      </section>
      
      <div className="bg-gray-50 rounded-lg p-4 md:p-6 mb-6">
        <p className="text-gray-700 mb-4">Last updated: 12/9/2024</p>
        
        <p className="text-gray-700">
          Contact{' '}
          <a href="mailto:support@childminderconnect.com" className="text-violet-600 hover:underline">
            Support
          </a>
          {' '}for Questions
        </p>
      </div>
    </div>
  );
} 