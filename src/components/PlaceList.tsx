import { MapPin, Navigation, Star } from 'lucide-react';

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

export function PlaceList({ places, onSelect }: { places: Place[]; onSelect: (place: Place) => void }) {
  return (
    <div className="space-y-4">
      {places.map((place) => (
        <div
          key={place.id}
          onClick={() => onSelect(place)}
          className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{place.name}</h3>
              <div className="flex items-center text-gray-600 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{place.address}</span>
              </div>
              <div className="flex items-center text-gray-600 mt-1">
                <Navigation className="h-4 w-4 mr-1" />
                <span className="text-sm">{place.distance} miles from Airbnb</span>
              </div>
            </div>
            <div className="flex items-center">
              {Array.from({ length: place.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
              ))}
            </div>
          </div>
          {place.notes && (
            <p className="mt-2 text-gray-600 text-sm line-clamp-2">{place.notes}</p>
          )}
          <div className="mt-2">
            {place.visited ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Visited
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                To Visit
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}