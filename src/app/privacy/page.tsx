import { Metadata } from 'next';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Privacy Policy | ChildMinderConnect',
  description: 'ChildMinderConnect privacy policy and data protection information.'
};

export default function PrivacyPolicy() {
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
      
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-violet-800">Privacy Policy</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">Contents</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li><a href="#information-we-collect" className="hover:text-violet-600">Information We Collect</a></li>
          <li><a href="#how-we-use" className="hover:text-violet-600">How We Use Your Information</a></li>
          <li><a href="#information-sharing" className="hover:text-violet-600">Information Sharing</a></li>
          <li><a href="#data-security" className="hover:text-violet-600">Data Security</a></li>
          <li><a href="#your-rights" className="hover:text-violet-600">Your Rights</a></li>
          <li><a href="#cookies-policy" className="hover:text-violet-600">Cookies Policy</a></li>
          <li><a href="#changes" className="hover:text-violet-600">Changes to This Policy</a></li>
        </ul>
      </div>
      
      <section id="information-we-collect" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">1. Information We Collect</h2>
        
        <h3 className="text-lg font-medium mb-2 text-violet-600">Personal Information</h3>
        <p className="mb-4 text-gray-700">
          We collect information you provide during registration and profile creation, including name, contact details, and location.
        </p>
        
        <h3 className="text-lg font-medium mb-2 text-violet-600">Verification Information</h3>
        <p className="text-gray-700">
          For childminders, we collect professional qualifications and verification status.
        </p>
      </section>
      
      <section id="how-we-use" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">2. How We Use Your Information</h2>
        <p className="text-gray-700">
          We use your information to provide our matching service, improve user experience, and ensure platform safety.
        </p>
      </section>
      
      <section id="information-sharing" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">3. Information Sharing</h2>
        <p className="text-gray-700">
          We share information only as necessary to provide our services and comply with legal obligations. We never sell your personal data.
        </p>
      </section>
      
      <section id="data-security" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">4. Data Security</h2>
        <p className="text-gray-700">
          We implement appropriate security measures to protect your personal information from unauthorized access or disclosure.
        </p>
      </section>
      
      <section id="your-rights" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">5. Your Rights</h2>
        <p className="text-gray-700">
          You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.
        </p>
      </section>
      
      <section id="cookies-policy" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">6. Cookies Policy</h2>
        <p className="text-gray-700">
          We use cookies to improve your browsing experience and analyze site traffic. You can control cookie settings in your browser.
        </p>
      </section>
      
      <section id="changes" className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-violet-700">7. Changes to This Policy</h2>
        <p className="text-gray-700">
          We may update this policy periodically. We will notify you of any significant changes.
        </p>
      </section>
      
      <div className="bg-gray-50 rounded-lg p-4 md:p-6 mb-6">
        <p className="text-gray-700 mb-4">Last updated: 12/9/2024</p>
        
        <p className="text-gray-700">
          Questions about our Privacy Policy? Contact us at{' '}
          <a href="mailto:support@childminderconnect.com" className="text-violet-600 hover:underline">
            support@childminderconnect.com
          </a>
        </p>
      </div>
    </div>
  );
} 