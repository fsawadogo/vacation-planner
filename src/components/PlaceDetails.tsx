import React, { useState } from 'react';
import { MapPin, Navigation, Star, X, Trash2, Edit2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateDistance } from '../utils/distance';

interface Place {
  id: string;
  name: string;
  type: 'restaurant' | 'activity';
  address: string;
  distance: number;
  notes: string;
  visited: boolean;
  rating: number;
}

interface PlaceDetailsProps {
  place: Place;
  distanceUnit: 'km' | 'mi';
  onClose: () => void;
}

export function PlaceDetails({ place, distanceUnit, onClose }: PlaceDetailsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlace, setEditedPlace] = useState(place);
  const [loading, setLoading] = useState(false);

  const handleToggleVisited = async () => {
    try {
      const { error } = await supabase
        .from('places')
        .update({ visited: !place.visited })
        .eq('id', place.id);
      if (error) throw error;
      onClose();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('places')
        .delete()
        .eq('id', place.id);
      if (error) throw error;
      onClose();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAddressChange = async (newAddress: string) => {
    setEditedPlace(prev => ({ ...prev, address: newAddress }));
    if (newAddress) {
      try {
        const distance = await calculateDistance(place.address, newAddress, distanceUnit);
        setEditedPlace(prev => ({ ...prev, distance }));
      } catch (error) {
        console.error('Error calculating distance:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('places')
        .update({
          name: editedPlace.name,
          address: editedPlace.address,
          distance: editedPlace.distance,
          notes: editedPlace.notes,
          rating: editedPlace.rating
        })
        .eq('id', place.id);
      if (error) throw error;
      onClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-auto my-8">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-start">
            {isEditing ? (
              <input
                type="text"
                value={editedPlace.name}
                onChange={(e) => setEditedPlace({ ...editedPlace, name: e.target.value })}
                className="text-xl md:text-2xl font-bold w-full border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1"
              />
            ) : (
              <h2 className="text-xl md:text-2xl font-bold">{place.name}</h2>
            )}
            <div className="flex items-center space-x-1 md:space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1.5 md:p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title={isEditing ? "Save changes" : "Edit place"}
              >
                {isEditing ? <Save className="h-4 w-4 md:h-5 md:w-5" /> : <Edit2 className="h-4 w-4 md:h-5 md:w-5" />}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 md:p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Delete place"
              >
                <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={editedPlace.address}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editedPlace.notes}
                    onChange={(e) => setEditedPlace({ ...editedPlace, notes: e.target.value })}
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <select
                    value={editedPlace.rating}
                    onChange={(e) => setEditedPlace({ ...editedPlace, rating: parseInt(e.target.value) })}
                    className="block w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} Star{rating !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{place.address}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Navigation className="h-5 w-5 mr-2" />
                  <span>{place.distance} {distanceUnit} from Location</span>
                </div>

                <div className="flex items-center">
                  {Array.from({ length: place.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                {place.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-2">Notes</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{place.notes}</p>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={handleToggleVisited}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                      place.visited
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {place.visited ? 'Mark as Not Visited' : 'Mark as Visited'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 md:p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete {place.name}?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {place.type}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}