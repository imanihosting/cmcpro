import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, AlertTriangle, FileText, ShieldCheck } from 'lucide-react'; // Assuming lucide-react for icons

export const metadata: Metadata = {
    title: 'Safety & Verification | ChildMinderConnect',
    description: 'Learn about our safety procedures, verification processes, and emergency contacts.',
};

export default function SafetyPage() {
    return (
        <div className="bg-white text-gray-900">
            {/* Header Section with gradient background */}
            <section className="relative bg-gradient-to-br from-violet-900 via-violet-800 to-purple-800 pt-16 pb-32 mb-8">
                {/* Background pattern overlay */}
                <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-center opacity-10"></div>
                
                <div className="container mx-auto px-4 text-center relative z-10 mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white">Safety & Verification</h1>
                    <p className="max-w-2xl mx-auto text-lg font-medium text-white">
                        Your safety is our top priority. We ensure all childminders are properly vetted and verified.
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
                {/* Emergency Contacts Section */}
                <section className="mb-12 p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4 text-red-800 flex items-center">
                        <AlertTriangle className="mr-2 h-6 w-6" /> Emergency Contacts
                    </h2>
                    <div className="space-y-4">
                        {/* Emergency Services */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white rounded border border-gray-200">
                            <div className="mb-2 sm:mb-0">
                                <h3 className="font-medium text-gray-800">Emergency Services</h3>
                                <p className="text-gray-600">112 or 999</p>
                            </div>
                            <a
                                href="tel:112"
                                className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 ease-in-out text-sm font-medium"
                            >
                                <Phone className="mr-2 h-4 w-4" /> Call Now
                            </a>
                        </div>
                        {/* Tusla Child Protection */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white rounded border border-gray-200">
                            <div className="mb-2 sm:mb-0">
                                <h3 className="font-medium text-gray-800">Tusla Child Protection</h3>
                                <p className="text-gray-600">01 771 8500</p>
                            </div>
                            <a
                                href="tel:017718500"
                                className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 ease-in-out text-sm font-medium"
                            >
                                <Phone className="mr-2 h-4 w-4" /> Call Now
                            </a>
                        </div>
                        {/* ChildMinderConnect Support */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white rounded border border-gray-200">
                            <div className="mb-2 sm:mb-0">
                                <h3 className="font-medium text-gray-800">ChildMinderConnect Support</h3>
                                <p className="text-gray-600">061 511 044</p>
                            </div>
                            <a
                                href="tel:061511044"
                                className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 ease-in-out text-sm font-medium"
                            >
                                <Phone className="mr-2 h-4 w-4" /> Call Now
                            </a>
                        </div>
                    </div>
                </section>

                {/* Report Safety Concerns Section */}
                <section className="mb-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4 text-yellow-800 flex items-center">
                        <AlertTriangle className="mr-2 h-6 w-6" /> Report Safety Concerns
                    </h2>
                    <p className="mb-4 text-gray-700">
                        If you notice any safety concerns, please report them immediately. All reports are handled in accordance with Irish child protection guidelines.
                    </p>
                    {/* TODO: Link this button to an actual reporting form/page */}
                    <Link
                        href="/contact?subject=Safety+Concern" // Pre-fill subject on contact page
                        className="inline-flex items-center justify-center px-6 py-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition duration-150 ease-in-out font-medium"
                    >
                        Report a Safety Concern
                    </Link>
                </section>

                {/* Irish Regulatory Compliance Section */}
                <section className="mb-12 p-6 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4 text-blue-800 flex items-center">
                        <ShieldCheck className="mr-2 h-6 w-6" /> Irish Regulatory Compliance
                    </h2>
                    <div className="mb-6">
                        <h3 className="text-xl font-medium mb-3 text-gray-800">Key Regulations</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            <li>Child Care Act 1991 (Early Years Services) Regulations 2016</li>
                            <li>Children First Act 2015</li>
                            <li>National Vetting Bureau Acts 2012-2016</li>
                            <li>GDPR and Data Protection Act 2018</li>
                        </ul>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-xl font-medium mb-3 text-gray-800">Compliance & Standards</h3>
                        <p className="text-gray-700">
                            We maintain strict compliance with Irish and EU regulations to ensure the highest standards of safety and protection for all users.
                        </p>
                    </div>
                    {/* TODO: Update this link to a relevant external or internal page */}
                    <a
                        href="https://www.tusla.ie/" // Example link to Tusla
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 ease-in-out font-medium"
                    >
                        <FileText className="mr-2 h-5 w-5" /> Learn More
                    </a>
                </section>
            </div>
        </div>
    );
} 