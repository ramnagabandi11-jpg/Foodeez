'use client';

import { useState } from 'react';
import { X, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Mumbai, Maharashtra');

  const popularLocations = [
    'Mumbai, Maharashtra',
    'Delhi, NCR',
    'Bangalore, Karnataka',
    'Hyderabad, Telangana',
    'Chennai, Tamil Nadu',
    'Kolkata, West Bengal',
    'Pune, Maharashtra',
    'Ahmedabad, Gujarat',
    'Jaipur, Rajasthan',
    'Lucknow, Uttar Pradesh',
  ];

  const recentLocations = [
    'Andheri, Mumbai',
    'Bandra, Mumbai',
    'Koramangala, Bangalore',
    'Indiranagar, Bangalore',
  ];

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    // In a real app, this would update the user's location in the store
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleUseCurrentLocation = () => {
    // In a real app, this would use the browser's geolocation API
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location:', position);
          setSelectedLocation('Current Location');
          setTimeout(() => onClose(), 500);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please enable location services.');
        }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Select Location</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6 overflow-y-auto max-h-[60vh]">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for area, street name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Current Location Button */}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleUseCurrentLocation}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Use Current Location
            </Button>

            {/* Recent Locations */}
            {recentLocations.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Recent Locations</h3>
                <div className="space-y-2">
                  {recentLocations.map((location) => (
                    <button
                      key={location}
                      onClick={() => handleLocationSelect(location)}
                      className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900">{location}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Locations */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Popular Cities</h3>
              <div className="space-y-2">
                {popularLocations.map((location) => (
                  <button
                    key={location}
                    onClick={() => handleLocationSelect(location)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-900">{location}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <p className="text-sm text-primary-800">
                <span className="font-medium">Delivery available in:</span> We're expanding rapidly! If your location isn't listed, we'll be there soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}