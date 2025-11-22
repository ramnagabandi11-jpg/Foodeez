import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AppBanner() {
  return (
    <section className="bg-gradient-to-r from-primary-600 to-secondary-600 py-16">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Order on the Go with Our Mobile App
            </h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Exclusive app-only deals and offers</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Faster checkout and saved preferences</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Real-time order tracking</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Personalized recommendations</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-black text-white hover:bg-gray-800"
              >
                Download for iOS
              </Button>
              <Button
                size="lg"
                className="bg-black text-white hover:bg-gray-800"
              >
                Download for Android
              </Button>
            </div>
          </div>

          {/* Right Content - App Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Phone Frame */}
              <div className="w-72 h-96 lg:h-[500px] bg-gray-900 rounded-[3rem] p-4 relative">
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-black rounded-full"></div>
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-black rounded-full"></div>

                {/* Screen */}
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                  {/* App Interface Mock */}
                  <div className="bg-gradient-to-b from-primary-600 to-primary-700 h-32 relative">
                    <div className="flex items-center justify-between p-4 text-white">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-white/20 rounded"></div>
                        <div className="w-20 h-4 bg-white/20 rounded"></div>
                      </div>
                      <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                    </div>

                    {/* Search Bar */}
                    <div className="px-4 mt-4">
                      <div className="bg-white/20 rounded-lg h-10 flex items-center px-3">
                        <div className="w-4 h-4 bg-white/40 rounded mr-2"></div>
                        <div className="w-24 h-3 bg-white/30 rounded"></div>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                        <div className="flex-1 space-y-1">
                          <div className="w-24 h-3 bg-gray-300 rounded"></div>
                          <div className="w-16 h-2 bg-gray-200 rounded"></div>
                        </div>
                        <div className="w-8 h-4 bg-primary-600 rounded"></div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Navigation */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3">
                    <div className="flex justify-around">
                      {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="w-6 h-6 bg-gray-300 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold animate-pulse-slow">
                4.8 ⭐
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="mt-16 text-center">
          <p className="text-white mb-4">Or scan this QR code to download the app</p>
          <div className="inline-flex justify-center">
            <div className="bg-white p-4 rounded-lg">
              <div className="w-32 h-32 bg-gray-200 rounded"></div>
              <p className="text-center text-sm text-gray-600 mt-2">Scan Me</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}