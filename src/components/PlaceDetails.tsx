import { MapPin, Navigation, Star, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

export function PlaceDetails({ place, onClose }: { place: Place; onClose: () => void }) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold">{place.name}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{place.address}</span>
            </div>

            <div className="flex items-center text-gray-600">
              <Navigation className="h-5 w-5 mr-2" />
              <span>{place.distance} miles from Airbnb</span>
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
          </div>
        </div>

        {/* <div className="p-6 bg-gray-50 mt-4">
          <div className="aspect-w-16 aspect-h-9">
            <iframe
              title="Location Map"
              className="w-full h-[300px] rounded-lg"
              frameBorder="0"
              src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${encodeURIComponent(
                place.address
              )}`}
              allowFullScreen
            />
          </div>
        </div> */}
      </div>
    </div>
  );
}