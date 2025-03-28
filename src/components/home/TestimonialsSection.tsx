import Image from "next/image";

const testimonials = [
  {
    text: "Found our perfect childminder within a week. The platform made everything seamless.",
    name: "Emma B.",
    role: "Parent",
    location: "Dublin"
  },
  {
    text: "The verification process gave us confidence. Our childminder is now like family.",
    name: "James O.",
    role: "Parent",
    location: "Cork"
  },
  {
    text: "As working parents, the flexible booking system has been a lifesaver.",
    name: "Sophie M.",
    role: "Parent",
    location: "Galway"
  }
];

export default function TestimonialsSection() {
  return (
    <section className="bg-white px-4 py-16">
      <div className="container mx-auto">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Trusted by <span className="text-violet-600">Families</span> Across Ireland
          </h2>
          <p className="text-lg text-gray-600">
            Hear what parents say about our service
          </p>
        </div>
        
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="rounded-lg bg-gray-50 p-6">
              <p className="mb-4 text-gray-700">{testimonial.text}</p>
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 overflow-hidden rounded-full bg-violet-100">
                  <div className="flex h-full w-full items-center justify-center text-violet-600 text-sm font-medium">
                    {testimonial.name[0]}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 