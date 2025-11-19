import { useState } from 'react';
import { Quote, Star } from 'lucide-react';

export function Testimonials() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: 'Priya Sharma',
      location: 'Mumbai',
      rating: 5,
      text: 'Foodeez has been a game-changer for our busy lifestyle. The food always arrives hot and fresh, and the delivery time is amazing. Highly recommended!',
      avatar: '/testimonials/priya.jpg',
      orderType: 'Regular customer',
    },
    {
      id: 2,
      name: 'Rahul Verma',
      location: 'Delhi',
      rating: 5,
      text: 'The variety of restaurants is impressive, and the app is so user-friendly. I love the real-time tracking feature. It makes ordering food so convenient.',
      avatar: '/testimonials/rahul.jpg',
      orderType: 'Daily user',
    },
    {
      id: 3,
      name: 'Anjali Nair',
      location: 'Bangalore',
      rating: 4,
      text: 'Great service and amazing customer support. Had an issue with an order once, and they resolved it immediately. That\'s what keeps me coming back.',
      avatar: '/testimonials/anjali.jpg',
      orderType: 'Weekend user',
    },
    {
      id: 4,
      name: 'Karan Patel',
      location: 'Pune',
      rating: 5,
      text: 'As a foodie, I appreciate the quality and variety. The ratings are accurate, and I\'ve discovered so many amazing local restaurants through Foodeez.',
      avatar: '/testimonials/karan.jpg',
      orderType: 'Food enthusiast',
    },
    {
      id: 5,
      name: 'Sneha Reddy',
      location: 'Hyderabad',
      rating: 5,
      text: 'The payment options and wallet feature make it so easy to manage orders. Plus, the exclusive deals and offers save me money every time!',
      avatar: '/testimonials/sneha.jpg',
      orderType: 'Smart saver',
    },
  ];

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="bg-gray-50 py-16">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real stories from real customers who love ordering with Foodeez
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Main Testimonial */}
            <div className="bg-white rounded-xl shadow-soft p-8 md:p-12">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                    <img
                      src={testimonials[activeTestimonial].avatar}
                      alt={testimonials[activeTestimonial].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {testimonials[activeTestimonial].name}
                    </h3>
                    <p className="text-gray-600">{testimonials[activeTestimonial].location}</p>
                    <p className="text-sm text-primary-600 font-medium">
                      {testimonials[activeTestimonial].orderType}
                    </p>
                  </div>
                </div>

                <Quote className="w-8 h-8 text-primary-200 flex-shrink-0" />
              </div>

              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
                {[...Array(5 - testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-gray-300 fill-current" />
                ))}
              </div>

              <blockquote className="text-gray-700 text-lg leading-relaxed italic">
                "{testimonials[activeTestimonial].text}"
              </blockquote>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevTestimonial}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-medium flex items-center justify-center hover:shadow-lg transition-shadow"
              aria-label="Previous testimonial"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextTestimonial}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-medium flex items-center justify-center hover:shadow-lg transition-shadow"
              aria-label="Next testimonial"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === activeTestimonial ? 'bg-primary-600' : 'bg-gray-300'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Trust Badge */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-2 bg-green-50 text-green-800 px-4 py-2 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Verified Customer Reviews</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}