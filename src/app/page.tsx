import Link from "next/link";
import { FaSearch, FaCalendarAlt, FaShieldAlt, FaUserCheck, FaClock, FaArrowRight, FaCheck, FaHome, FaMapMarkerAlt, FaStar, FaQuoteLeft, FaChild, FaHeart, FaUserFriends, FaGraduationCap, FaSmile, FaMedal } from "react-icons/fa";
import Image from "next/image";

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-br from-violet-900 via-violet-800 to-purple-800">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-purple-600 opacity-20 blur-3xl"></div>
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-600 opacity-20 blur-3xl"></div>
        
        <div className="container relative mx-auto flex min-h-[90vh] flex-col items-center justify-center px-4 py-12 md:py-20 lg:flex-row lg:justify-between lg:py-0">
          <div className="mb-8 max-w-2xl text-center lg:mb-0 lg:text-left">
            <div className="mb-6 inline-flex items-center rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="mr-2 rounded-full bg-gradient-to-r from-violet-400 to-purple-400 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white">New</span>
              <span className="text-sm text-white/90">Ireland's Premium Childminder Platform</span>
            </div>
            
            <h1 className="mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl">
              Where Families Find <br/>
              <span className="bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text">Exceptional Childcare</span>
            </h1>
            
            <p className="mb-8 text-lg text-white/80 sm:text-xl">
              Connect with verified, trusted childminders across Ireland. 
              Skip the long waiting lists and find the perfect care for your children.
            </p>
            
            <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/register"
                className="group relative overflow-hidden rounded-lg bg-white px-8 py-4 text-center text-base font-semibold text-violet-900 shadow-lg transition-all duration-300 hover:shadow-violet-400/20 sm:text-lg"
              >
                <span className="relative z-10">Get Started Today</span>
                <span className="absolute inset-0 -translate-y-full bg-gradient-to-r from-violet-400 to-purple-400 transition-transform duration-300 group-hover:translate-y-0"></span>
                <span className="absolute inset-0 translate-y-full bg-gradient-to-r from-purple-400 to-violet-400 transition-transform duration-300 group-hover:translate-y-0"></span>
              </Link>
              
              <Link
                href="/auth/login"
                className="rounded-lg border-2 border-white/30 bg-transparent px-8 py-4 text-center text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/10 sm:text-lg"
              >
                Sign In
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 lg:justify-start">
              <div className="flex -space-x-4">
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-violet-200">
                  <Image src="https://i.pravatar.cc/40?img=1" alt="User" width={40} height={40} className="h-full w-full object-cover" />
                </div>
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-violet-200">
                  <Image src="https://i.pravatar.cc/40?img=2" alt="User" width={40} height={40} className="h-full w-full object-cover" />
                </div>
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-violet-200">
                  <Image src="https://i.pravatar.cc/40?img=3" alt="User" width={40} height={40} className="h-full w-full object-cover" />
                </div>
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-violet-300 text-center">
                  <span className="flex h-full items-center justify-center text-xs font-medium text-violet-800">+2k</span>
                </div>
              </div>
              <div className="text-sm text-white/80">
                <span className="font-bold text-white">2,000+ families</span> trust us with their childcare needs
              </div>
            </div>
          </div>
          
          <div className="relative mt-8 lg:mt-0">
            <div className="relative h-auto w-auto max-w-lg overflow-hidden rounded-2xl shadow-2xl">
              <Image 
                src="https://placehold.co/500x400/9333ea/9333ea/png" 
                alt="Childminder with children" 
                width={500} 
                height={400}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-violet-900/80 to-violet-900/30"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                <div className="mb-4 flex items-center">
                  <div className="mr-2 h-10 w-10 overflow-hidden rounded-full border-2 border-white">
                    <Image 
                      src="https://i.pravatar.cc/40?img=4" 
                      alt="Profile" 
                      width={40} 
                      height={40}
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <div>
                    <p className="font-medium">Michelle K.</p>
                    <p className="text-sm text-white/80">Verified Childminder</p>
                  </div>
                </div>
                <div className="flex items-center mb-1">
                  <div className="flex text-amber-400">
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                  </div>
                  <span className="ml-2 text-sm text-white/90">Exceptional Rating</span>
                </div>
              </div>
            </div>
            
            {/* Floating badge */}
            <div className="absolute -right-4 -top-14 rounded-lg bg-white p-4 shadow-lg md:-right-10 md:-top-16 z-20">
              <div className="flex items-center">
                <div className="mr-3 rounded-full bg-violet-100 p-3 text-violet-600">
                  <FaShieldAlt className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Garda Vetted</p>
                  <p className="text-sm text-gray-600">Verified Providers</p>
                </div>
              </div>
            </div>
            
            {/* Floating info cards */}
            <div className="absolute -bottom-14 -left-6 max-w-[200px] rounded-lg bg-white p-4 shadow-lg md:-bottom-16 md:-left-10 z-20">
              <p className="mb-2 text-sm font-medium text-gray-900">Trusted by <span className="text-violet-600">97%</span> of parents</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full w-[97%] rounded-full bg-gradient-to-r from-violet-500 to-purple-500"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
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
                <FaGraduationCap className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Qualified Care</h3>
              <p className="mt-2 text-sm text-gray-600">Experienced and trained providers</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <FaMedal className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Quality Standards</h3>
              <p className="mt-2 text-sm text-gray-600">Exceeding industry benchmarks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="relative bg-gray-50 px-4 py-20">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#4c1d95 2px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        <div className="container relative mx-auto">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <span className="mb-2 inline-block rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-800">Premium Experience</span>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
              A <span className="text-violet-600">Better Way</span> to Find Childcare
            </h2>
            <p className="text-lg text-gray-600">
              ChildminderConnect provides a seamless experience for families seeking exceptional care for their children
            </p>
          </div>
          
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="space-y-10">
                <div className="group flex">
                  <div className="mr-5 flex-shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 shadow-sm transition-all group-hover:bg-violet-600 group-hover:text-white">
                      <FaSearch className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-xl font-bold text-gray-900">Smart Matching</h3>
                    <p className="text-gray-600">
                      Our intelligent system connects you with childminders who match your specific needs, preferences, and location.
                    </p>
                  </div>
                </div>
                
                <div className="group flex">
                  <div className="mr-5 flex-shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 shadow-sm transition-all group-hover:bg-violet-600 group-hover:text-white">
                      <FaChild className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-xl font-bold text-gray-900">Child-Centered Approach</h3>
                    <p className="text-gray-600">
                      All our childminders prioritize children's development, well-being, and happiness in a nurturing environment.
                    </p>
                  </div>
                </div>
                
                <div className="group flex">
                  <div className="mr-5 flex-shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 shadow-sm transition-all group-hover:bg-violet-600 group-hover:text-white">
                      <FaCalendarAlt className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-xl font-bold text-gray-900">Flexible Scheduling</h3>
                    <p className="text-gray-600">
                      Book regular care, occasional sessions, or emergency childcare with our easy-to-use scheduling system.
                    </p>
                  </div>
                </div>
                
                <div className="group flex">
                  <div className="mr-5 flex-shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 shadow-sm transition-all group-hover:bg-violet-600 group-hover:text-white">
                      <FaUserFriends className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-xl font-bold text-gray-900">Transparent Reviews</h3>
                    <p className="text-gray-600">
                      Read honest feedback from other parents to help you make informed decisions about your child's care.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12">
                <Link 
                  href="/auth/register" 
                  className="inline-flex items-center rounded-lg bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-violet-700 hover:shadow-lg"
                >
                  Start Your Search
                  <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="relative ml-auto w-full max-w-md">
                <div className="relative z-10 overflow-hidden rounded-2xl bg-white shadow-xl">
                  <div className="aspect-w-4 aspect-h-3">
                    <Image 
                      src="https://placehold.co/600x450/8b5cf6/FFFFFF/png?text=Activities+with+children" 
                      alt="Childminder with children doing activities" 
                      width={600} 
                      height={450}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  
                  <div className="p-8">
                    <h3 className="mb-3 text-2xl font-bold text-gray-900">Quality Care, Peace of Mind</h3>
                    <p className="mb-6 text-gray-600">
                      Our platform connects families with exceptional childminders who provide nurturing, educational care in a safe environment.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="mr-3 rounded-full bg-green-100 p-1 text-green-600">
                          <FaCheck className="h-4 w-4" />
                        </div>
                        <p className="text-gray-700">Verified background checks</p>
                      </div>
                      <div className="flex items-start">
                        <div className="mr-3 rounded-full bg-green-100 p-1 text-green-600">
                          <FaCheck className="h-4 w-4" />
                        </div>
                        <p className="text-gray-700">Educational activities provided</p>
                      </div>
                      <div className="flex items-start">
                        <div className="mr-3 rounded-full bg-green-100 p-1 text-green-600">
                          <FaCheck className="h-4 w-4" />
                        </div>
                        <p className="text-gray-700">Regular progress updates</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -bottom-6 -left-6 z-0 h-64 w-64 rounded-full bg-violet-100"></div>
                <div className="absolute -right-6 -top-6 z-0 h-40 w-40 rounded-full bg-purple-100"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative bg-white px-4 py-20">
        <div className="container mx-auto">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <span className="mb-2 inline-block rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-800">Success Stories</span>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Trusted by <span className="text-violet-600">Families</span> Across Ireland
            </h2>
            <p className="text-lg text-gray-600">
              Hear what parents and guardians have to say about our service
            </p>
          </div>
          
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-6 flex">
                <div className="text-amber-400">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>
              </div>
              <p className="mb-8 text-gray-700">
                "After months on waiting lists, we found our perfect childminder within a week. She is amazing with our daughter and the platform made the entire process seamless."
              </p>
              <div className="flex items-center">
                <div className="mr-4 h-12 w-12 overflow-hidden rounded-full bg-violet-100">
                  <Image src="https://i.pravatar.cc/48?img=5" alt="Parent" width={48} height={48} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Emma Byrne</p>
                  <p className="text-sm text-gray-600">Dublin, Mother of one</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl bg-gray-50 p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-6 flex">
                <div className="text-amber-400">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>
              </div>
              <p className="mb-8 text-gray-700">
                "The detailed profiles and verification process gave us confidence in our choice. Our childminder has become like family, and our son looks forward to the days she cares for him."
              </p>
              <div className="flex items-center">
                <div className="mr-4 h-12 w-12 overflow-hidden rounded-full bg-violet-100">
                  <Image src="https://i.pravatar.cc/48?img=7" alt="Parent" width={48} height={48} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">James O'Connor</p>
                  <p className="text-sm text-gray-600">Cork, Father of two</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl bg-gray-50 p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-6 flex">
                <div className="text-amber-400">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>
              </div>
              <p className="mb-8 text-gray-700">
                "As working parents, finding flexible childcare was a challenge until we discovered ChildminderConnect. The booking system is brilliant and we've found reliable care every time."
              </p>
              <div className="flex items-center">
                <div className="mr-4 h-12 w-12 overflow-hidden rounded-full bg-violet-100">
                  <Image src="https://i.pravatar.cc/48?img=9" alt="Parent" width={48} height={48} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Sophie Murphy</p>
                  <p className="text-sm text-gray-600">Galway, Mother of three</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-20 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 2px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        <div className="container relative mx-auto">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl">
              Ready to Find Your Perfect Childminder?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-white/80">
              Join thousands of families who've found exceptional childcare through our platform. Registration is free and only takes a minute.
            </p>
            
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/register"
                className="group relative overflow-hidden rounded-lg bg-white px-8 py-4 text-center text-base font-semibold text-violet-600 shadow-lg transition-all hover:shadow-white/20 sm:text-lg"
              >
                Create Your Account
              </Link>
              
              <Link
                href="/how-it-works"
                className="rounded-lg border-2 border-white/50 bg-transparent px-8 py-4 text-center text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white hover:bg-white/10 sm:text-lg"
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
