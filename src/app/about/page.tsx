import Image from "next/image";
import Link from "next/link";
import { 
  FaShieldAlt, 
  FaSearch, 
  FaUserFriends, 
  FaLock,
  FaArrowRight,
  FaEye,
  FaBullseye
} from "react-icons/fa";

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Hero section */}
      <div className="relative bg-violet-600 px-4 py-12 text-white md:py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src="/images/pattern.svg" 
            alt="Background Pattern"
            fill
            className="object-cover"
          />
        </div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">About ChildMinderConnect</h1>
          <p className="mx-auto max-w-2xl text-base text-violet-100 md:text-lg">
            Your trusted partner in finding the perfect childminder
          </p>
        </div>
      </div>

      {/* Who We Are section */}
      <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 md:items-center">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">Who We Are</h2>
            <p className="mb-4 text-gray-600">
              ChildMinderConnect is an innovative platform designed to match parents with trusted childminders based on their unique needs and preferences. Think of us as a matchmaking service, but instead of finding a date, we're here to help you find the ideal caregiver for your child.
            </p>
            <p className="mb-4 text-gray-600">
              We combine advanced technology with a personal touch to create a seamless experience for parents and childminders alike. Our mission is to connect families with compassionate, skilled, and dependable childminders who will provide the care and support every child deserves.
            </p>
          </div>
          <div className="relative h-64 overflow-hidden rounded-lg md:h-80 lg:h-96">
            <Image
              src="/images/full-shot-woman-kid-playing.jpg"
              alt="Childminder playing with a child"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* What We Do section */}
      <div className="bg-white px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">What We Do</h2>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <FaShieldAlt className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Prioritize Safety</h3>
              <p className="text-gray-600">
                We encourage thorough vetting, including interviews and reference checks, to ensure every child is cared for by someone trustworthy and qualified.
              </p>
            </div>
            
            <div className="rounded-lg bg-gray-50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <FaSearch className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Simplify the Search</h3>
              <p className="text-gray-600">
                Using the information provided during registration, our system intelligently matches parents with childminders who meet their specific requirements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us section */}
      <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="md:grid md:grid-cols-5 md:gap-12 items-center">
          <div className="md:col-span-2 mb-8 md:mb-0">
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
              <Image
                src="/images/side-view-teacher-watching-kids-playing.jpg"
                alt="Childminder supervising children playing"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <h2 className="mb-8 text-2xl font-bold text-gray-900 sm:text-3xl">Why Choose ChildMinderConnect?</h2>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-6 h-full">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <FaUserFriends className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Personalized Matching</h3>
                <p className="text-gray-600">
                  Tailored recommendations that consider your family's unique needs.
                </p>
              </div>
              
              <div className="rounded-lg bg-gray-50 p-6 h-full">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <FaUserFriends className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Community-Focused</h3>
                <p className="text-gray-600">
                  We're passionate about building strong, supportive relationships between families and caregivers.
                </p>
              </div>
              
              <div className="rounded-lg bg-gray-50 p-6 h-full">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <FaLock className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Secure and Reliable</h3>
                <p className="text-gray-600">
                  Our platform is designed with your privacy and security in mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vision & Mission section */}
      <div className="bg-white px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Our Vision & Mission</h2>
          
          <div className="md:grid md:grid-cols-7 md:gap-12 items-center">
            <div className="md:col-span-3 md:order-last mb-8 md:mb-0">
              <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
                <Image
                  src="/images/full-shot-kids-drawing-together-table.jpg"
                  alt="Children drawing together at a table"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          
            <div className="md:col-span-4 md:order-first">
              <div className="grid gap-8 md:gap-12">
                <div className="rounded-lg bg-gray-50 p-6 h-full">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <FaEye className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">Vision</h3>
                  <p className="text-gray-600">
                    To be the most trusted childminding connection service, fostering safe and happy environments for children while empowering parents with peace of mind.
                  </p>
                </div>
                
                <div className="rounded-lg bg-gray-50 p-6 h-full">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <FaBullseye className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">Mission</h3>
                  <p className="text-gray-600">
                    To build meaningful connections between families and childminders, making quality childcare accessible to everyone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="relative bg-violet-600 px-4 py-12 text-white md:py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image 
            src="/images/full-shot-kids-sitting-together-table.jpg" 
            alt="Children sitting together at a table"
            fill
            className="object-cover"
          />
        </div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Join Our Community</h2>
          <p className="mx-auto mb-8 max-w-2xl text-base text-violet-100 md:text-lg">
            Whether you're a parent looking for childcare or a childminder looking to grow your business, we're here to help.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="inline-flex items-center rounded-md bg-white px-5 py-3 text-base font-medium text-violet-600 shadow-md hover:bg-gray-100 sm:px-6"
            >
              Get Started
              <FaArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-md border border-white bg-transparent px-5 py-3 text-base font-medium text-white hover:bg-white hover:bg-opacity-10 sm:px-6"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 