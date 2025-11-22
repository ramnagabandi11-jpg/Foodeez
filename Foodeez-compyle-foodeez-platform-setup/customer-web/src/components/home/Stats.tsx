import { Users, Restaurant, MapPin, TrendingUp } from 'lucide-react';

export function Stats() {
  const stats = [
    {
      icon: Users,
      value: '5M+',
      label: 'Happy Customers',
      description: 'Across 50+ cities in India',
    },
    {
      icon: Restaurant,
      value: '25K+',
      label: 'Partner Restaurants',
      description: 'From local favorites to chains',
    },
    {
      icon: MapPin,
      value: '200+',
      label: 'Cities Covered',
      description: 'And expanding rapidly',
    },
    {
      icon: TrendingUp,
      value: '99.9%',
      label: 'On-Time Delivery',
      description: 'Average 30-minute delivery',
    },
  ];

  return (
    <section className="bg-primary-600 py-16">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Trusted by Millions</h2>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            Join millions of satisfied customers who trust Foodeez for their daily food delivery needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-xl font-semibold text-white mb-1">{stat.label}</div>
                <div className="text-primary-100 text-sm">{stat.description}</div>
              </div>
            );
          })}
        </div>

        {/* Additional Trust Indicators */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-6 h-6 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <p className="text-white font-semibold">4.8/5 Rating</p>
            <p className="text-primary-100 text-sm">Based on 100K+ reviews</p>
          </div>

          <div className="text-center">
            <div className="text-white font-semibold mb-2">24/7 Support</div>
            <p className="text-primary-100 text-sm">We're here to help anytime</p>
          </div>

          <div className="text-center">
            <div className="text-white font-semibold mb-2">Secure Payments</div>
            <p className="text-primary-100 text-sm">Multiple payment options</p>
          </div>
        </div>
      </div>
    </section>
  );
}