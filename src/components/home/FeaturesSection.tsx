import Link from "next/link";
import { FaSearch, FaChild, FaCalendarAlt, FaUserFriends } from "react-icons/fa";

export default function FeaturesSection() {
  return (
    <section className="bg-gray-50 px-4 py-16">
      <div className="container mx-auto">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            A <span className="text-violet-600">Better Way</span> to Find Childcare
          </h2>
          <p className="text-lg text-gray-600">
            ChildminderConnect provides a seamless experience for families
          </p>
        </div>
        
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex items-start">
            <div className="mr-4 flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <FaSearch className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Smart Matching</h3>
              <p className="text-gray-600">
                Our system connects you with childminders who match your needs and location
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <FaChild className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Child-Centered</h3>
              <p className="text-gray-600">
                Prioritizing children's development and well-being
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <FaCalendarAlt className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Flexible Booking</h3>
              <p className="text-gray-600">
                Book regular care or occasional sessions easily
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <FaUserFriends className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Verified Reviews</h3>
              <p className="text-gray-600">
                Read honest feedback from other parents
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 