"use client";

import { useState } from "react";
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaPaperPlane, FaSpinner } from "react-icons/fa";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Send form data to the API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
      
      setSuccessMessage(data.message || "Your message has been sent successfully. We'll get back to you soon!");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      console.error("Error sending contact form:", error);
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : "Failed to send your message. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Hero section */}
      <div className="bg-indigo-600 px-4 py-12 text-white md:py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">Contact Us</h1>
          <p className="mx-auto max-w-2xl text-base text-indigo-100 md:text-lg">
            We're here to help with any questions about our childminding services. 
            Reach out to our team and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      {/* Contact information and form */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {(successMessage || errorMessage) && (
          <div className={`mb-8 rounded-lg ${successMessage ? "bg-green-50" : "bg-red-50"} p-4`}>
            <p className={`text-base ${successMessage ? "text-green-800" : "text-red-800"}`}>
              {successMessage || errorMessage}
            </p>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* Contact information */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Get in Touch</h2>
            
            <div className="mb-8 space-y-4">
              <div className="flex items-start">
                <div className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <FaEnvelope className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Email</h3>
                  <p className="mt-1 text-gray-600">
                    <a href="mailto:info@childminderconnect.com" className="hover:text-indigo-600">
                      info@childminderconnect.com
                    </a>
                  </p>
                  <p className="text-sm text-gray-500">We aim to respond within 24 hours</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <FaPhone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Phone</h3>
                  <p className="mt-1 text-gray-600">
                    <a href="tel:061511044" className="hover:text-indigo-600">
                      061 511 044
                    </a>
                  </p>
                  <p className="text-sm text-gray-500">Monday to Friday, 9am to 5pm</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <FaMapMarkerAlt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Office</h3>
                  <p className="mt-1 text-gray-600">
                    123 Business Park, Dublin 15, D15 A123
                  </p>
                  <p className="text-sm text-gray-500">By appointment only</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-medium text-gray-900">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">How do I find a childminder?</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    You can register as a parent and use our search feature to find childminders in your area.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">How do I register as a childminder?</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Register on our platform and select "Childminder" as your role. You'll need to provide your qualifications and complete our verification process.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Is there a fee to use the service?</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    We offer free basic accounts with premium subscription options for enhanced features.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact form */}
          <div className="rounded-lg bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Send a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select a subject</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Childminder Registration">Childminder Registration</option>
                  <option value="Parent Support">Parent Support</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                ></textarea>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 