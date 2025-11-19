import { Search, Smartphone, UtensilsCrossed, Truck } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: 'Find Restaurants',
      description: 'Search from thousands of restaurants in your area. Filter by cuisine, rating, or delivery time.',
    },
    {
      icon: UtensilsCrossed,
      title: 'Choose Your Food',
      description: 'Browse menus, read reviews, and select your favorite dishes. Customize your order as needed.',
    },
    {
      icon: Smartphone,
      title: 'Pay Securely',
      description: 'Complete your order with secure payment options. Cash on delivery and online payments available.',
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Track your order in real-time and enjoy fresh food delivered to your doorstep in 30 minutes or less.',
    },
  ];

  return (
    <section className="bg-gray-50 py-16">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How Foodeez Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get your favorite food delivered in four simple steps. It's quick, easy, and reliable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="text-center group">
                <div className="relative mb-6">
                  {/* Step Number */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-600 text-white rounded-full text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 bg-white rounded-full shadow-soft flex items-center justify-center mx-auto group-hover:shadow-medium group-hover:scale-105 transition-all duration-300">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                </div>

                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* App Download Section */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl shadow-soft p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Get the Foodeez App
            </h3>
            <p className="text-gray-600 mb-6">
              Order on the go with our mobile app. Available for iOS and Android devices.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 17.62.22 12.1.85 9.29c.58-2.48 2.12-3.73 3.52-3.81 1.23-.07 2.32.5 3.26.5.91 0 2.19-.69 3.53-.5 1.31.12 2.53.84 3.13 1.99-2.38 1.46-1.82 4.57.16 6.25-.93.91-2.03 1.69-3.4 1.56zm-2.76-11.5c.02-1.71.8-2.8 2.12-2.9-.13 2.06-.87 3.1-2.12 3.2z"/>
                </svg>
                Download for iOS
              </button>

              <button className="flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                Download for Android
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}