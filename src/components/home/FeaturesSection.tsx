import Link from "next/link";
import { FaSearch, FaChild, FaCalendarAlt, FaUserFriends, FaShieldAlt, FaMoneyBillWave, FaCertificate, FaHeart, FaComments } from "react-icons/fa";
import Image from "next/image";

export default function FeaturesSection() {
  return (
    <section className="bg-gray-50 px-4 py-20 relative">
      <div className="container mx-auto">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            A <span className="text-violet-600 relative">
              Better Way 
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 12" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,3 Q50,10 100,3" stroke="#8b5cf6" fill="none" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span> to Find Childcare
          </h2>
          <p className="text-lg text-gray-600 mt-6">
            ChildminderConnect provides a seamless experience for families seeking quality childcare
          </p>
        </div>
        
        {/* Main features with illustrations */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
          <div className="relative">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-xl border-8 border-white">
              <Image 
                src="/images/side-view-teacher-watching-kids-playing.jpg" 
                alt="Childminder with children" 
                width={600} 
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-violet-200 rounded-full z-0"></div>
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-violet-100 rounded-full z-0"></div>
          </div>
          
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <FaSearch className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Smart Matching</h3>
                <p className="text-gray-600">
                  Our intelligent algorithm connects you with childminders who match your specific requirements, location, and schedule preferences, saving you time and ensuring quality care.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <FaShieldAlt className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Verified Providers</h3>
                <p className="text-gray-600">
                  Every childminder undergoes rigorous background checks, qualification verification, and in-person interviews before joining our platform. Your child's safety is our priority.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <FaCalendarAlt className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Flexible Scheduling</h3>
                <p className="text-gray-600">
                  Book regular care, occasional sessions, or emergency childcare with ease. Our flexible system adapts to your family's changing needs and lifestyle.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group rounded-xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-violet-50">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600 group-hover:bg-violet-200 transition-colors duration-300">
              <FaUserFriends className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-lg font-bold text-gray-900 group-hover:text-violet-700 transition-colors duration-300">Verified Reviews</h3>
            <p className="text-gray-600">
              Read honest feedback from other parents who have used our services to make informed decisions about your child's care.
            </p>
          </div>
          
          <div className="group rounded-xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-violet-50">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600 group-hover:bg-violet-200 transition-colors duration-300">
              <FaComments className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-lg font-bold text-gray-900 group-hover:text-violet-700 transition-colors duration-300">Secure Messaging</h3>
            <p className="text-gray-600">
              Communicate directly with childminders through our secure platform, discussing your requirements and building relationships.
            </p>
          </div>
          
          <div className="group rounded-xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-violet-50">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600 group-hover:bg-violet-200 transition-colors duration-300">
              <FaMoneyBillWave className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-lg font-bold text-gray-900 group-hover:text-violet-700 transition-colors duration-300">Transparent Pricing</h3>
            <p className="text-gray-600">
              Clear, upfront pricing with no hidden fees. Easily compare rates across different childminders in your area.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
} 