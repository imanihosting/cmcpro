import Image from "next/image";
import { FaQuoteLeft, FaStar } from "react-icons/fa";

const testimonials = [
  {
    text: "Found our perfect childminder within a week. The platform made the entire process seamless and gave us complete peace of mind.",
    name: "Emma B.",
    role: "Parent of two",
    location: "Dublin",
    rating: 5
  },
  {
    text: "The verification process gave us confidence. Our childminder is now like family to us and our children adore her.",
    name: "James O.",
    role: "Parent",
    location: "Cork",
    rating: 5
  },
  {
    text: "As working parents with irregular schedules, the flexible booking system has been an absolute lifesaver for our family.",
    name: "Sophie M.",
    role: "Healthcare professional",
    location: "Galway",
    rating: 5
  }
];

export default function TestimonialsSection() {
  return (
    <section className="bg-white px-4 py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-violet-50 rounded-full -translate-y-1/3 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-50 rounded-full translate-y-1/3 -translate-x-1/3"></div>
      
      <div className="container mx-auto relative z-10">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="inline-block px-4 py-1.5 mb-4 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
            Testimonials
          </span>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Trusted by <span className="text-violet-600">Families</span> Across Ireland
          </h2>
          <p className="text-lg text-gray-600 mt-4">
            Don't just take our word for it - hear what parents say about our service
          </p>
        </div>
        
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="group rounded-xl bg-white p-8 shadow-md transition-all duration-300 hover:shadow-xl relative">
              {/* Quote icon */}
              <div className="absolute -top-4 -left-4 bg-violet-600 rounded-full w-10 h-10 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <FaQuoteLeft className="text-white text-base" />
              </div>
              
              {/* Rating */}
              <div className="flex mb-6">
                {[...Array(5)].map((_, i) => (
                  <FaStar 
                    key={i} 
                    className={i < testimonial.rating ? "text-yellow-400 mr-1" : "text-gray-300 mr-1"} 
                  />
                ))}
              </div>
              
              {/* Testimonial text */}
              <p className="mb-6 text-gray-700 leading-relaxed">"{testimonial.text}"</p>
              
              {/* Divider */}
              <div className="w-16 h-1 bg-violet-200 mb-6 group-hover:bg-violet-400 transition-colors duration-300"></div>
              
              {/* Author info */}
              <div className="flex items-center">
                <div className="mr-4 h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                  <div className="flex h-full w-full items-center justify-center text-white text-lg font-medium">
                    {testimonial.name[0]}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Trust badges */}
        <div className="mt-20 rounded-2xl bg-gray-50 px-8 py-10">
          <h3 className="text-center text-lg font-medium text-gray-700 mb-8">
            Trusted by families and childcare professionals
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-gray-400 font-semibold text-xl">Tusla</div>
              <p className="text-xs text-gray-500 mt-1">Registered</p>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-semibold text-xl">Garda</div>
              <p className="text-xs text-gray-500 mt-1">Vetted</p>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-semibold text-xl">Irish Childcare</div>
              <p className="text-xs text-gray-500 mt-1">Association</p>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-semibold text-xl">Safe Ireland</div>
              <p className="text-xs text-gray-500 mt-1">Member</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 