import React, { useEffect, useState } from 'react';
import { Palmtree, Plus, LogOut, Settings, FileDown, Link, Upload, ChevronDown, ChevronUp, Calendar, Archive, History, Sun, Moon, Clock, CloudRain } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { PlaceForm } from './components/PlaceForm';
import { PlaceList } from './components/PlaceList';
import { PlaceDetails } from './components/PlaceDetails';
import { WeatherDisplay } from './components/WeatherDisplay';
import { exportToPDF } from './utils/pdfExport';
import { getUnsplashImage } from './utils/unsplash';
import { convertDistance } from './utils/distance';
import { useWeather } from './utils/weather';

function App() {
  const [session, setSession] = useState(null);
  const [places, setPlaces] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [destination, setDestination] = useState(() => {
    return localStorage.getItem('tripDestination') || 'Miami';
  });
  const [baseLocation, setBaseLocation] = useState(() => {
    return localStorage.getItem('baseLocation') || '';
  });
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>(() => {
    return (localStorage.getItem('distanceUnit') as 'km' | 'mi') || 'mi';
  });
  const [startDate, setStartDate] = useState(() => {
    return localStorage.getItem('tripStartDate') || '';
  });
  const [endDate, setEndDate] = useState(() => {
    return localStorage.getItem('tripEndDate') || '';
  });
  const [backgroundImage, setBackgroundImage] = useState(() => {
    return localStorage.getItem('tripBackgroundImage') || 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?auto=format&fit=crop&q=80';
  });
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [showRestaurants, setShowRestaurants] = useState(true);
  const [showActivities, setShowActivities] = useState(true);
  const [isArchived, setIsArchived] = useState(() => {
    return localStorage.getItem('tripArchived') === 'true';
  });
  const [showArchivedTrips, setShowArchivedTrips] = useState(false);
  const [archivedPlaces, setArchivedPlaces] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        return savedMode === 'true';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const { weather, loading: weatherLoading } = useWeather(destination);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
      fetchArchivedPlaces();
    }
  }, [session]);

  const fetchArchivedPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('archived', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setArchivedPlaces(data);
    } catch (error) {
      console.error('Error fetching archived places:', error);
    }
  };

  const handleUnarchiveTrip = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to unarchive this trip? This will restore all archived places.'
    );

    if (!confirmed) return;

    try {
      const { error: updateError } = await supabase
        .from('places')
        .update({ archived: false })
        .eq('user_id', session.user.id)
        .eq('archived', true);

      if (updateError) throw updateError;

      fetchPlaces();
      fetchArchivedPlaces();
      
      alert('Trip unarchived successfully!');
    } catch (error) {
      console.error('Error unarchiving trip:', error);
      alert('Failed to unarchive trip. Please try again.');
    }
  };

  const handleArchiveTrip = async () => {
    if (!startDate || !endDate) {
      alert('Please set trip dates before archiving');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to archive this trip? This will mark all places as archived and create a new trip.'
    );

    if (!confirmed) return;

    try {
      const { error: updateError } = await supabase
        .from('places')
        .update({ archived: true })
        .eq('user_id', session.user.id)
        .eq('archived', false);

      if (updateError) throw updateError;

      setDestination('');
      setBaseLocation('');
      setStartDate('');
      setEndDate('');
      setIsArchived(false);
      
      localStorage.removeItem('tripDestination');
      localStorage.removeItem('baseLocation');
      localStorage.removeItem('tripStartDate');
      localStorage.removeItem('tripEndDate');
      localStorage.removeItem('tripArchived');
      
      fetchPlaces();
      
      alert('Trip archived successfully! You can now start planning a new trip.');
    } catch (error) {
      console.error('Error archiving trip:', error);
      alert('Failed to archive trip. Please try again.');
    }
  };

  const fetchPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPlaces(data);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      alert(error.message);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setBackgroundImage(result);
        localStorage.setItem('tripBackgroundImage', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsLoadingImage(true);
    try {
      const formData = new FormData(e.target);
      const newDestination = formData.get('destination') as string;
      const newBaseLocation = formData.get('baseLocation') as string;
      const newDistanceUnit = formData.get('distanceUnit') as 'km' | 'mi';
      const newStartDate = formData.get('startDate') as string;
      const newEndDate = formData.get('endDate') as string;
      
      if (!useCustomImage) {
        const newBackgroundImage = await getUnsplashImage(newDestination);
        setBackgroundImage(newBackgroundImage);
        localStorage.setItem('tripBackgroundImage', newBackgroundImage);
      }

      setDestination(newDestination);
      setBaseLocation(newBaseLocation);
      setDistanceUnit(newDistanceUnit);
      setStartDate(newStartDate);
      setEndDate(newEndDate);
      localStorage.setItem('tripDestination', newDestination);
      localStorage.setItem('baseLocation', newBaseLocation);
      localStorage.setItem('distanceUnit', newDistanceUnit);
      localStorage.setItem('tripStartDate', newStartDate);
      localStorage.setItem('tripEndDate', newEndDate);
      setShowSettings(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handleExportPDF = () => {
    exportToPDF(places, destination, distanceUnit);
  };

  if (!session) {
    return <Auth />;
  }

  const restaurants = places.filter((place) => place.type === 'restaurant');
  const activities = places.filter((place) => place.type === 'activity');

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-white dark:bg-gray-900 transition-colors duration-200`}>
      <div
        className="relative h-[30vh] md:h-[40vh] bg-cover bg-center"
        style={{
          backgroundImage: `url("${backgroundImage}")`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="text-center text-white">
            <div className="flex items-center justify-center mb-2 md:mb-4">
              <Palmtree size={32} className="text-white md:h-12 md:w-12" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4">
              {destination ? `Trip to ${destination}` : 'Plan Your Next Trip'}
            </h1>
            <div className="flex flex-col items-center space-y-2">
              {startDate && endDate && (
                <p className="text-lg md:text-xl flex items-center justify-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {formatDate(startDate)} - {formatDate(endDate)}
                  </span>
                </p>
              )}
              <div className="flex items-center space-x-4">
                <p className="text-lg md:text-xl flex items-center justify-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>{formatTime(currentTime)}</span>
                </p>
                {weather && !weatherLoading && (
                  <WeatherDisplay weather={weather} darkMode={darkMode} />
                )}
                {weatherLoading && destination && (
                  <div className="flex items-center space-x-2">
                    <CloudRain className="w-5 h-5 animate-pulse" />
                    <span className="text-sm">Loading weather...</span>
                  </div>
                )}
              </div>
            </div>
            {(!startDate || !endDate) && destination && (
              <p className="text-lg md:text-xl">Let's explore {destination}</p>
            )}
          </div>
        </div>

        <div className="absolute top-4 left-4 flex space-x-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center space-x-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm transition-all duration-200 text-sm md:text-base hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {darkMode ? (
              <Sun size={18} className="md:h-5 md:w-5" />
            ) : (
              <Moon size={18} className="md:h-5 md:w-5" />
            )}
            <span className="hidden md:inline">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {places.length > 0 && startDate && endDate && (
            <button
              onClick={handleArchiveTrip}
              className="flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm transition-all duration-200 text-sm md:text-base"
            >
              <Archive size={18} className="md:h-5 md:w-5" />
              <span className="hidden md:inline">Archive Trip</span>
            </button>
          )}
        </div>

        <div className="absolute top-4 right-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
          <button
            onClick={handleExportPDF}
            className="flex items-center justify-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm transition-all duration-200 text-sm md:text-base"
          >
            <FileDown size={18} className="md:h-5 md:w-5" />
            <span className="hidden md:inline">Export PDF</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm transition-all duration-200 text-sm md:text-base"
          >
            <Settings size={18} className="md:h-5 md:w-5" />
            <span className="hidden md:inline">Settings</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm transition-all duration-200 text-sm md:text-base"
          >
            <LogOut size={18} className="md:h-5 md:w-5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="mb-8">
          <button
            onClick={() => setShowArchivedTrips(!showArchivedTrips)}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <History className="w-5 h-5" />
            <span>Archived Trips</span>
            {showArchivedTrips ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {showArchivedTrips && (
          <div className="mb-12">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Archived Places</h2>
                <button
                  onClick={handleUnarchiveTrip}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  <Archive className="w-5 h-5" />
                  <span>Unarchive Trip</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Restaurants</h3>
                  <PlaceList
                    places={archivedPlaces.filter(place => place.type === 'restaurant')}
                    onSelect={setSelectedPlace}
                    distanceUnit={distanceUnit}
                    darkMode={darkMode}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Activities</h3>
                  <PlaceList
                    places={archivedPlaces.filter(place => place.type === 'activity')}
                    onSelect={setSelectedPlace}
                    distanceUnit={distanceUnit}
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-4 md:space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowRestaurants(!showRestaurants)}
                className="flex items-center space-x-2 text-xl md:text-2xl font-bold group text-gray-900 dark:text-white"
              >
                <h2>Restaurants</h2>
                {showRestaurants ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                )}
              </button>
              <button
                onClick={() => {
                  setFormType('restaurant');
                  setShowForm(true);
                }}
                className="flex items-center space-x-1 md:space-x-2 bg-blue-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-blue-600 transition text-sm md:text-base"
              >
                <Plus size={18} className="md:h-5 md:w-5" />
                <span>Add Restaurant</span>
              </button>
            </div>
            <div className={`transition-all duration-300 ease-in-out ${showRestaurants ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <PlaceList places={restaurants} onSelect={setSelectedPlace} distanceUnit={distanceUnit} darkMode={darkMode} />
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowActivities(!showActivities)}
                className="flex items-center space-x-2 text-xl md:text-2xl font-bold group text-gray-900 dark:text-white"
              >
                <h2>Activities</h2>
                {showActivities ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                )}
              </button>
              <button
                onClick={() => {
                  setFormType('activity');
                  setShowForm(true);
                }}
                className="flex items-center space-x-1 md:space-x-2 bg-green-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-green-600 transition text-sm md:text-base"
              >
                <Plus size={18} className="md:h-5 md:w-5" />
                <span>Add Activity</span>
              </button>
            </div>
            <div className={`transition-all duration-300 ease-in-out ${showActivities ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <PlaceList places={activities} onSelect={setSelectedPlace} distanceUnit={distanceUnit} darkMode={darkMode} />
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-auto my-8">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Trip Settings</h2>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Destination Name
                  </label>
                  <input
                    type="text"
                    name="destination"
                    defaultValue={destination}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hotel/Airbnb Address
                  </label>
                  <input
                    type="text"
                    name="baseLocation"
                    defaultValue={baseLocation}
                    placeholder="Enter your accommodation address"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      defaultValue={startDate}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={endDate}
                      min={startDate}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Distance Unit
                  </label>
                  <select
                    name="distanceUnit"
                    defaultValue={distanceUnit}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="mi">Miles</option>
                    <option value="km">Kilometers</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useCustomImage"
                      checked={useCustomImage}
                      onChange={(e) => setUseCustomImage(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
                    />
                    <label htmlFor="useCustomImage" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Use custom background image
                    </label>
                  </div>

                  {useCustomImage ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upload Image
                      </label>
                      <div className="mt-1 flex items-center">
                        <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600">
                          <Upload className="h-5 w-5 mr-2" />
                          <span>Choose Image</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                        {backgroundImage && (
                          <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">Image selected</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Maximum file size: 5MB. Recommended size: 1600x900 pixels.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      We'll automatically find a beautiful image for your destination
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoadingImage}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingImage ? 'Loading Image...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm mx-auto my-3">
            <div className="p-3">
              <h2 className="text-base font-bold mb-2 text-gray-900 dark:text-white">
                Add New {formType === 'restaurant' ? 'Restaurant' : 'Activity'}
              </h2>
              <PlaceForm
                type={formType}
                baseLocation={baseLocation}
                distanceUnit={distanceUnit}
                onClose={() => {
                  setShowForm(false);
                  fetchPlaces();
                }}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      )}

      {selectedPlace && (
        <PlaceDetails 
          place={selectedPlace}
          distanceUnit={distanceUnit}
          onClose={() => {
            setSelectedPlace(null);
            fetchPlaces();
          }}
          darkMode={darkMode}
        />
      )}
     ```jsx
    </div>
  );
}

export default App;