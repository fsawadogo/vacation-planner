import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Navigation, Star as StarIcon } from 'lucide-react';
import { calculateDistance } from '../utils/distance';

type PlaceType = 'restaurant' | 'activity';

interface PlaceFormProps {
  type: PlaceType;
  baseLocation: string;
  distanceUnit: 'km' | 'mi';
  onClose: () => void;
}

export function PlaceForm({ type, baseLocation, distanceUnit, onClose }: PlaceFormProps) {
  const [loading, setLoading] = useState(false);
  const [place, setPlace] = useState({
    name: '',
    address: '',
    distance: 0,
    notes: '',
    rating: 5,
  });

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setPlace({ ...place, address: newAddress });
    
    if (newAddress && baseLocation) {
      try {
        const distance = await calculateDistance(baseLocation, newAddress, distanceUnit);
        setPlace(prev => ({ ...prev, address: newAddress, distance }));
      } catch (error) {
        console.error('Error calculating distance:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase.from('places').insert([
        {
          ...place,
          type,
          user_id: user.id,
        },
      ]);
      if (error) throw error;
      onClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!baseLocation) {
    return (
      <div className="text-center py-3">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-2">
          <div className="flex">
            <div className="flex-shrink-0">
              <MapPin className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="ml-2">
              <p className="text-sm text-yellow-700">
                Please set your hotel/Airbnb address in settings first.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-0.5">
          {type === 'restaurant' ? 'Restaurant Name' : 'Activity Name'}
        </label>
        <input
          type="text"
          required
          placeholder={type === 'restaurant' ? 'Enter restaurant name' : 'Enter activity name'}
          className="mt-0.5 block w-full text-sm px-2.5 py-1.5 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 placeholder-gray-400"
          value={place.name}
          onChange={(e) => setPlace({ ...place, name: e.target.value })}
        />
      </div>

      {/* Address Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-0.5">Address</label>
        <div className="relative rounded-md">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            required
            className="block w-full text-sm pl-8 pr-2.5 py-1.5 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 placeholder-gray-400"
            value={place.address}
            onChange={handleAddressChange}
            placeholder="Enter the full address"
          />
        </div>
      </div>

      {/* Distance Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-0.5">
          Distance from Hotel/Airbnb
        </label>
        <div className="relative rounded-md">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Navigation className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="number"
            step="0.1"
            readOnly
            className="block w-full text-sm pl-8 pr-10 py-1.5 rounded-md border border-gray-200 bg-gray-50 cursor-not-allowed"
            value={place.distance}
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{distanceUnit}</span>
          </div>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          Distance is calculated automatically based on the address
        </p>
      </div>

      {/* Rating Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-0.5">Rating</label>
        <div className="flex items-center space-x-1.5">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setPlace({ ...place, rating })}
              className="focus:outline-none transform hover:scale-110 transition-transform duration-200"
            >
              <StarIcon
                className={`h-6 w-6 ${
                  rating <= place.rating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                } transition-colors hover:text-yellow-400`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Notes Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-0.5">Notes</label>
        <textarea
          className="mt-0.5 block w-full text-sm px-2.5 py-1.5 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 placeholder-gray-400"
          rows={2}
          placeholder="Add any additional notes, recommendations, or things to remember..."
          value={place.notes}
          onChange={(e) => setPlace({ ...place, notes: e.target.value })}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 text-sm border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
              Saving...
            </div>
          ) : (
            'Save Place'
          )}
        </button>
      </div>
    </form>
  );
}