import Image from "next/image";
import Link from "next/link";
import { 
  FaUsers, 
  FaShieldAlt, 
  FaHandshake, 
  FaRegLightbulb,
  FaArrowRight
} from "react-icons/fa";

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Hero section */}
      <div className="bg-indigo-600 px-4 py-12 text-white md:py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">About ChildminderConnect</h1>
          <p className="mx-auto max-w-2xl text-base text-indigo-100 md:text-lg">
            Connecting parents with trusted childminders since 2023. Learn more about our mission, 
            our values, and the team behind ChildminderConnect.
          </p>
        </div>
      </div>

      {/* Our story section */}
      <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 md:items-center">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">Our Story</h2>
            <p className="mb-4 text-gray-600">
              ChildminderConnect was founded in 2023 with a simple mission: to make finding trusted childcare easier for parents and to help childminders grow their businesses.
            </p>
            <p className="mb-4 text-gray-600">
              As parents ourselves, we understand the challenges of finding reliable childcare that matches your family's unique needs. That's why we built a platform that prioritizes safety, transparency, and ease of use.
            </p>
            <p className="text-gray-600">
              Today, ChildminderConnect is Ireland's fastest-growing childminding platform, connecting thousands of parents with verified childminders across the country.
            </p>
          </div>
          <div className="relative h-64 overflow-hidden rounded-lg md:h-80 lg:h-96">
            <div className="absolute inset-0 bg-indigo-100 flex items-center justify-center">
              {/* Placeholder for an actual image */}
              <span className="text-indigo-300 text-lg">Team Image</span>
            </div>
          </div>
        </div>
      </div>

      {/* Our values section */}
      <div className="bg-white px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Our Values</h2>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <FaShieldAlt className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Safety First</h3>
              <p className="text-gray-600">
                We rigorously verify all childminders on our platform to ensure the highest standards of safety.
              </p>
            </div>
            
            <div className="rounded-lg bg-gray-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <FaUsers className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Community</h3>
              <p className="text-gray-600">
                We're building a supportive community of parents and childminders who share knowledge and best practices.
              </p>
            </div>
            
            <div className="rounded-lg bg-gray-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <FaHandshake className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Trust</h3>
              <p className="text-gray-600">
                We believe in transparent communications and building trust between parents and childminders.
              </p>
            </div>
            
            <div className="rounded-lg bg-gray-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <FaRegLightbulb className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Innovation</h3>
              <p className="text-gray-600">
                We're constantly improving our platform to make finding and managing childcare simpler.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Our team section */}
      <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Meet Our Team</h2>
        
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Team member 1 */}
          <div className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 h-48 w-full overflow-hidden rounded-lg bg-gray-100">
              <div className="flex h-full w-full items-center justify-center bg-indigo-100">
                <span className="text-indigo-300 text-lg">Team Member</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Sarah Johnson</h3>
            <p className="mb-2 text-indigo-600">Founder & CEO</p>
            <p className="text-gray-600">
              Former early childhood educator with 15 years of experience in childcare management.
            </p>
          </div>
          
          {/* Team member 2 */}
          <div className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 h-48 w-full overflow-hidden rounded-lg bg-gray-100">
              <div className="flex h-full w-full items-center justify-center bg-indigo-100">
                <span className="text-indigo-300 text-lg">Team Member</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Michael O'Connor</h3>
            <p className="mb-2 text-indigo-600">CTO</p>
            <p className="text-gray-600">
              Tech expert with a passion for building solutions that make a difference in people's lives.
            </p>
          </div>
          
          {/* Team member 3 */}
          <div className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 h-48 w-full overflow-hidden rounded-lg bg-gray-100">
              <div className="flex h-full w-full items-center justify-center bg-indigo-100">
                <span className="text-indigo-300 text-lg">Team Member</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Emma Byrne</h3>
            <p className="mb-2 text-indigo-600">Head of Childminder Relations</p>
            <p className="text-gray-600">
              Former childminder who understands the challenges and rewards of providing quality childcare.
            </p>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-indigo-600 px-4 py-12 text-white md:py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Join Our Community</h2>
          <p className="mx-auto mb-8 max-w-2xl text-base text-indigo-100 md:text-lg">
            Whether you're a parent looking for childcare or a childminder looking to grow your business, we're here to help.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="inline-flex items-center rounded-md bg-white px-5 py-3 text-base font-medium text-indigo-600 shadow-md hover:bg-gray-100 sm:px-6"
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