import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Navigation } from 'lucide-react';

type PlaceType = 'restaurant' | 'activity';

export function PlaceForm({ type, onClose }: { type: PlaceType; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [place, setPlace] = useState({
    name: '',
    address: '',
    distance: '',  // Changed from 0 to empty string to handle initial state better
    notes: '',
    rating: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase.from('places').insert([
        {
          ...place,
          type,
          distance: parseFloat(place.distance) || 0, // Convert to number before saving
          user_id: user.id, // Add user_id to satisfy RLS policy
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={place.name}
          onChange={(e) => setPlace({ ...place, name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            required
            className="block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            value={place.address}
            onChange={(e) => setPlace({ ...place, address: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Distance from Airbnb (miles)
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Navigation className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            step="0.1"
            required
            className="block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            value={place.distance}
            onChange={(e) => setPlace({ ...place, distance: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
          value={place.notes}
          onChange={(e) => setPlace({ ...place, notes: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Rating</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={place.rating}
          onChange={(e) => setPlace({ ...place, rating: parseInt(e.target.value) })}
        >
          {[1, 2, 3, 4, 5].map((rating) => (
            <option key={rating} value={rating}>
              {rating} Star{rating !== 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save
        </button>
      </div>
    </form>
  );
}