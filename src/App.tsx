import { useEffect, useState } from 'react';
import { Palmtree, Plus, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { PlaceForm } from './components/PlaceForm';
import { PlaceList } from './components/PlaceList';
import { PlaceDetails } from './components/PlaceDetails';
import { Session } from '@supabase/supabase-js';

interface Place {
  id: string;
  name: string;
  type: 'restaurant' | 'activity';
  created_at: string;
  address: string;
  distance: number;
  notes: string;
  visited: boolean;
  rating: number;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'restaurant' | 'activity' | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchPlaces();
    }
  }, [session]);

  const fetchPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPlaces(data);
    } catch (error) {
      if (error instanceof Error) {
        if (error instanceof Error) {
          alert((error as Error).message);
        } else {
          alert('An unknown error occurred');
        }
      } else {
        alert('An unknown error occurred');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An unknown error occurred');
      }
    }
  };

  if (!session) {
    return <Auth />;
  }

  const restaurants = places.filter((place) => place.type === 'restaurant');
  const activities = places.filter((place) => place.type === 'activity');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div
        className="relative h-[40vh] bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1535498730771-e735b998cd64?auto=format&fit=crop&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="flex items-center justify-center mb-4">
              <Palmtree size={48} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Sawadogo Family Florida Trip</h1>
            <p className="text-xl">Lets explore Miami</p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="absolute top-4 right-4 flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-200"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Restaurants Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Restaurants</h2>
              <button
                onClick={() => {
                  setFormType('restaurant');
                  setShowForm(true);
                }}
                className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                <Plus size={20} />
                <span>Add Restaurant</span>
              </button>
            </div>
            <PlaceList places={restaurants} onSelect={(place: Place) => setSelectedPlace(place)} />
          </div>

          {/* Activities Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Activities</h2>
              <button
                onClick={() => {
                  setFormType('activity');
                  setShowForm(true);
                }}
                className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                <Plus size={20} />
                <span>Add Activity</span>
              </button>
            </div>
            <PlaceList places={activities} onSelect={(place: Place) => setSelectedPlace(place)} />
          </div>
        </div>
      </div>

      {/* Modal for adding new place */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              Add New {formType === 'restaurant' ? 'Restaurant' : 'Activity'}
            </h2>
            <PlaceForm
              type={formType!}
              onClose={() => {
                setShowForm(false);
                fetchPlaces();
              }}
            />
          </div>
        </div>
      )}

      {/* Place Details Modal */}
      {selectedPlace && (
        <PlaceDetails
          place={selectedPlace}
          onClose={() => {
            setSelectedPlace(null);
            fetchPlaces();
          }}
        />
      )}
    </div>
  );
}

export default App;