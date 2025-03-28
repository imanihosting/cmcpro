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
      {/* Hero Section - Premium Redesign */}
      <section className="relative min-h-[95vh] bg-gradient-to-br from-violet-900 via-violet-800 to-purple-800 overflow-hidden">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-center opacity-10"></div>
        
        {/* Main hero content */}
        <div className="container relative mx-auto flex min-h-[95vh] flex-col items-center justify-center px-4 py-12 md:py-20 lg:flex-row lg:justify-between lg:py-0">
          {/* Text content */}
          <div className="mb-10 max-w-2xl text-center lg:mb-0 lg:text-left z-10">
            <div className="mb-6 inline-flex items-center rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <div className="mr-2 h-2 w-2 rounded-full bg-green-400"></div>
              <span className="text-sm font-medium text-white/90">Ireland's Premium Childminder Platform</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              Where Families Find <br/>
              <span className="bg-gradient-to-r from-violet-200 to-pink-200 bg-clip-text text-transparent">Exceptional Childcare</span>
            </h1>
            
            <p className="mb-8 text-lg text-white/80 sm:text-xl max-w-xl mx-auto lg:mx-0">
              Connect with verified, trusted childminders across Ireland. 
              Skip the long waiting lists and find the perfect care for your children.
            </p>
            
            <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/register"
                className="group relative overflow-hidden rounded-lg bg-white px-8 py-4 text-center text-base font-semibold text-violet-900 shadow-xl transition-all duration-300 hover:shadow-violet-500/30 sm:text-lg"
              >
                <span className="relative z-10">Get Started Today</span>
                <div className="absolute inset-0 h-full w-0 bg-gradient-to-r from-violet-100 to-violet-200 transition-all duration-300 group-hover:w-full"></div>
              </Link>
              
              <Link
                href="/auth/login"
                className="rounded-lg border-2 border-white/30 bg-transparent px-8 py-4 text-center text-base font-semibold text-white transition-colors duration-300 hover:bg-white/10 hover:border-white/50 sm:text-lg"
              >
                Sign In
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <div className="flex items-center rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                <FaStar className="mr-2 h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium text-white">2,000+ families trust us</span>
              </div>
              <div className="flex items-center rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                <FaShieldAlt className="mr-2 h-4 w-4 text-green-300" />
                <span className="text-sm font-medium text-white">Verified providers</span>
              </div>
            </div>
          </div>
          
          {/* Hero image with floating elements */}
          <div className="relative mt-8 lg:mt-0 z-10">
            <div className="relative h-auto w-auto max-w-lg">
              {/* Main image */}
              <div className="overflow-hidden rounded-2xl shadow-2xl ring-4 ring-white/20">
                <Image 
                  src="/images/full-shot-woman-kid-playing.jpg" 
                  alt="Childminder with child" 
                  width={540} 
                  height={400}
                  className="h-full w-full object-cover"
                  priority
                  loading="eager"
                />
              </div>
              
              {/* Floating badge - left */}
              <div className="absolute -left-10 top-1/4 animate-float">
                <div className="rounded-lg bg-white p-3 shadow-xl">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                      <FaUserCheck className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Qualified</p>
                      <p className="text-sm font-bold text-gray-900">Childminders</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating badge - right */}
              <div className="absolute -right-10 bottom-1/4 animate-float-delayed">
                <div className="rounded-lg bg-white p-3 shadow-xl">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                      <FaHeart className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Child</p>
                      <p className="text-sm font-bold text-gray-900">Safety First</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom info card */}
              <div className="absolute -bottom-5 left-10 right-10 rounded-xl bg-white/90 p-4 shadow-xl backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">Trusted Childcare</h3>
                    <div className="mt-1 flex items-center">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className="h-3 w-3 text-yellow-400" />
                        ))}
                      </div>
                      <span className="ml-1 text-xs text-gray-600">500+ Reviews</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto">
            <path 
              fill="#ffffff" 
              fillOpacity="1" 
              d="M0,96L60,80C120,64,240,32,360,21.3C480,11,600,21,720,42.7C840,64,960,96,1080,101.3C1200,107,1320,85,1380,74.7L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Premium Trust Indicators */}
      <section className="bg-white py-16 relative">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Why Parents <span className="text-violet-600">Trust Us</span>
            </h2>
            <p className="text-lg text-gray-600">
              We provide a safe, reliable platform connecting families with quality childcare
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="group rounded-xl bg-white p-6 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:bg-violet-50">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 group-hover:bg-violet-200 transition-colors duration-300">
                <FaUserCheck className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-gray-900 group-hover:text-violet-700 transition-colors duration-300">Verified Childminders</h3>
              <p className="mt-3 text-gray-600">Every provider is thoroughly vetted for your peace of mind</p>
            </div>
            
            <div className="group rounded-xl bg-white p-6 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:bg-violet-50">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 group-hover:bg-violet-200 transition-colors duration-300">
                <FaShieldAlt className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-gray-900 group-hover:text-violet-700 transition-colors duration-300">Garda Vetted</h3>
              <p className="mt-3 text-gray-600">All childminders undergo background checks for security</p>
            </div>
            
            <div className="group rounded-xl bg-white p-6 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:bg-violet-50">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 group-hover:bg-violet-200 transition-colors duration-300">
                <FaCalendarAlt className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-gray-900 group-hover:text-violet-700 transition-colors duration-300">Flexible Scheduling</h3>
              <p className="mt-3 text-gray-600">Book one-time sessions or recurring care based on your needs</p>
            </div>
            
            <div className="group rounded-xl bg-white p-6 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:bg-violet-50">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 group-hover:bg-violet-200 transition-colors duration-300">
                <FaClock className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-gray-900 group-hover:text-violet-700 transition-colors duration-300">Responsive Support</h3>
              <p className="mt-3 text-gray-600">Our team is here to help with any questions or concerns</p>
            </div>
          </div>
          
          {/* Stats counter */}
          <div className="mt-16 grid grid-cols-1 gap-8 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-8 md:grid-cols-3">
            <div className="text-center">
              <p className="text-4xl font-bold text-white">2,000+</p>
              <p className="mt-2 text-lg text-white/80">Happy Families</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white">500+</p>
              <p className="mt-2 text-lg text-white/80">Verified Childminders</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white">98%</p>
              <p className="mt-2 text-lg text-white/80">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamically loaded sections with section divider */}
      <div className="bg-gray-50 relative">
        <div className="absolute top-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 80" className="w-full h-auto">
            <path 
              fill="#ffffff" 
              fillOpacity="1" 
              d="M0,32L60,37.3C120,43,240,53,360,48C480,43,600,21,720,10.7C840,0,960,0,1080,5.3C1200,11,1320,21,1380,26.7L1440,32L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
            ></path>
          </svg>
        </div>
        <FeaturesSection />
      </div>
      
      <TestimonialsSection />

      {/* Premium CTA Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-700 to-purple-700"></div>
        
        {/* Background patterns */}
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-center opacity-10"></div>
        
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white/10 p-8 backdrop-blur-sm text-center md:p-12">
            <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
              Ready to Find Your Perfect Childminder?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-white/90">
              Join thousands of families who've found exceptional childcare through our platform.
            </p>
            
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/register"
                className="group relative overflow-hidden rounded-lg bg-white px-8 py-4 text-center text-base font-semibold text-violet-600 shadow-lg transition-all duration-300 hover:shadow-white/30 sm:text-lg"
              >
                <span className="relative z-10">Create Your Account</span>
                <div className="absolute inset-0 h-full w-0 bg-gradient-to-r from-violet-100 to-violet-200 transition-all duration-300 group-hover:w-full"></div>
              </Link>
              
              <Link
                href="/how-it-works"
                className="rounded-lg border-2 border-white/50 bg-transparent px-8 py-4 text-center text-base font-semibold text-white transition-colors duration-300 hover:bg-white/10 hover:border-white/80 sm:text-lg"
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
