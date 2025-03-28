import Link from "next/link";
import { FaSearch, FaCalendarAlt, FaShieldAlt, FaUserCheck, FaClock, FaArrowRight, FaCheck, FaHome, FaMapMarkerAlt, FaStar, FaQuoteLeft, FaChild, FaHeart, FaUserFriends, FaGraduationCap, FaSmile, FaMedal } from "react-icons/fa";
import Image from "next/image";
import dynamic from 'next/dynamic';

// Dynamically import heavy sections
const TestimonialsSection = dynamic(() => import('@/components/home/TestimonialsSection'), {
  loading: () => <div className="min-h-[200px] bg-white"></div>,
  ssr: false
});

const FeaturesSection = dynamic(() => import('@/components/home/FeaturesSection'), {
  loading: () => <div className="min-h-[200px] bg-gray-50"></div>,
  ssr: false
});

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      {/* Hero Section - Optimized */}
      <section className="relative min-h-[90vh] bg-gradient-to-br from-violet-900 via-violet-800 to-purple-800">
        <div className="container relative mx-auto flex min-h-[90vh] flex-col items-center justify-center px-4 py-12 md:py-20 lg:flex-row lg:justify-between lg:py-0">
          <div className="mb-8 max-w-2xl text-center lg:mb-0 lg:text-left">
            <div className="mb-6 inline-flex items-center rounded-full bg-white/10 px-4 py-2">
              <span className="text-sm text-white/90">Ireland's Premium Childminder Platform</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              Where Families Find <br/>
              <span className="text-violet-300">Exceptional Childcare</span>
            </h1>
            
            <p className="mb-8 text-lg text-white/80 sm:text-xl">
              Connect with verified, trusted childminders across Ireland. 
              Skip the long waiting lists and find the perfect care for your children.
            </p>
            
            <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/register"
                className="rounded-lg bg-white px-8 py-4 text-center text-base font-semibold text-violet-900 shadow-lg hover:bg-violet-50 sm:text-lg"
              >
                Get Started Today
              </Link>
              
              <Link
                href="/auth/login"
                className="rounded-lg border-2 border-white/30 bg-transparent px-8 py-4 text-center text-base font-semibold text-white hover:bg-white/10 sm:text-lg"
              >
                Sign In
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-4 lg:justify-start">
              <div className="flex items-center rounded-full bg-white/10 px-4 py-2">
                <span className="text-sm font-medium text-white">2,000+ families trust us</span>
              </div>
            </div>
          </div>
          
          <div className="relative mt-8 lg:mt-0">
            <div className="relative h-auto w-auto max-w-lg overflow-hidden rounded-2xl shadow-2xl">
              <Image 
                src="/images/hero.jpg" 
                alt="Childminder with children" 
                width={500} 
                height={400}
                className="h-full w-full object-cover"
                priority
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-violet-900/80 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center">
                  <div>
                    <p className="font-medium">Trusted Childcare</p>
                    <p className="text-sm text-white/80">Verified Providers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Simplified */}
      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <FaUserCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Verified Childminders</h3>
              <p className="mt-2 text-sm text-gray-600">Every provider is thoroughly vetted</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <FaShieldAlt className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Garda Vetted</h3>
              <p className="mt-2 text-sm text-gray-600">Security and peace of mind</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <FaCalendarAlt className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Flexible Scheduling</h3>
              <p className="mt-2 text-sm text-gray-600">Find care when you need it</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <FaClock className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Quick Response</h3>
              <p className="mt-2 text-sm text-gray-600">Fast and reliable service</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamically loaded sections */}
      <FeaturesSection />
      <TestimonialsSection />

      {/* CTA Section - Simplified */}
      <section className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-20 text-white">
        <div className="container mx-auto">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
              Ready to Find Your Perfect Childminder?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-white/80">
              Join thousands of families who've found exceptional childcare through our platform.
            </p>
            
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/register"
                className="rounded-lg bg-white px-8 py-4 text-center text-base font-semibold text-violet-600 shadow-lg hover:bg-violet-50 sm:text-lg"
              >
                Create Your Account
              </Link>
              
              <Link
                href="/how-it-works"
                className="rounded-lg border-2 border-white/50 bg-transparent px-8 py-4 text-center text-base font-semibold text-white hover:bg-white/10 sm:text-lg"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
