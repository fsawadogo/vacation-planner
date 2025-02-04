import React, { useEffect, useState } from 'react';
import { Palmtree, Plus, LogOut, Settings, FileDown, Link, Upload, ChevronDown, ChevronUp, Calendar, Archive, History, Sun, Moon, Clock, CloudRain, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { PlaceForm } from './components/PlaceForm';
import { PlaceList } from './components/PlaceList';
import { PlaceDetails } from './components/PlaceDetails';
import { WeatherDisplay } from './components/WeatherDisplay';
import { LanguageToggle } from './components/LanguageToggle';
import { exportToPDF } from './utils/pdfExport';
import { getUnsplashImage } from './utils/unsplash';
import { convertDistance } from './utils/distance';
import { useWeather } from './utils/weather';
import { useTranslation } from './hooks/useTranslation';
import { Language } from './i18n/translations';

interface Place {
  id: string;
  name: string;
  type: 'restaurant' | 'activity';
  address: string;
  distance: number;
  notes: string;
  visited: boolean;
  rating: number;
  archived: boolean;
  created_at: string;
}

interface UserSettings {
  destination: string;
  baseLocation: string;
  startDate: string | null;
  endDate: string | null;
  distanceUnit: 'km' | 'mi';
  darkMode: boolean;
  language: Language;
  restaurantsCollapsed: boolean;
  activitiesCollapsed: boolean;
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [archivedPlaces, setArchivedPlaces] = useState<Place[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'restaurant' | 'activity'>('restaurant');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');

  const [destination, setDestination] = useState('');
  const [baseLocation, setBaseLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('mi');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'en');
  const [restaurantsCollapsed, setRestaurantsCollapsed] = useState(false);
  const [activitiesCollapsed, setActivitiesCollapsed] = useState(false);

  const { t } = useTranslation(language);
  const { weather, forecast, loading: weatherLoading } = useWeather(destination, startDate, endDate);

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const saveSettings = async () => {
      if (!session) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const formattedStartDate = startDate || null;
        const formattedEndDate = endDate || null;

        const settings = {
          user_id: user.id,
          destination: destination || '',
          base_location: baseLocation || '',
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          distance_unit: distanceUnit,
          dark_mode: darkMode,
          language,
          restaurants_collapsed: restaurantsCollapsed,
          activities_collapsed: activitiesCollapsed,
        };

        const { error } = await supabase
          .from('user_settings')
          .upsert(settings, { 
            onConflict: 'user_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('Error saving settings:', error);
        }
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

    const timeoutId = setTimeout(() => {
      if (session) {
        saveSettings();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [session, destination, baseLocation, startDate, endDate, distanceUnit, darkMode, language, restaurantsCollapsed, activitiesCollapsed]);

  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading settings:', error);
          return;
        }

        if (data) {
          setDestination(data.destination || '');
          setBaseLocation(data.base_location || '');
          setStartDate(data.start_date || '');
          setEndDate(data.end_date || '');
          setDistanceUnit(data.distance_unit || 'mi');
          setDarkMode(data.dark_mode ?? false);
          setLanguage(data.language || 'en');
          setRestaurantsCollapsed(data.restaurants_collapsed ?? false);
          setActivitiesCollapsed(data.activities_collapsed ?? false);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    if (session) {
      loadUserSettings();
    }
  }, [session]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
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

  useEffect(() => {
    if (destination) {
      getUnsplashImage(destination).then(setBackgroundImage);
    }
  }, [destination]);

  useEffect(() => {
    if (session && showArchived) {
      fetchArchivedPlaces();
    }
  }, [session, showArchived]);

  const fetchPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPlaces(data || []);
    } catch (error) {
      console.error('Error fetching places:', error);
      alert(t('errors.loadingPlaces'));
    }
  };

  const fetchArchivedPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('archived', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArchivedPlaces(data || []);
    } catch (error) {
      console.error('Error fetching archived places:', error);
      alert(t('errors.loadingPlaces'));
    }
  };

  const handleArchiveTrip = async () => {
    try {
      const { error } = await supabase
        .from('places')
        .update({ archived: true })
        .in('id', places.map(p => p.id));

      if (error) throw error;
      await fetchPlaces();
    } catch (error) {
      console.error('Error archiving trip:', error);
      alert(t('errors.generic'));
    }
  };

  const handleUnarchiveTrip = async (places: Place[]) => {
    try {
      const { error } = await supabase
        .from('places')
        .update({ archived: false })
        .in('id', places.map(p => p.id));

      if (error) throw error;
      await Promise.all([fetchPlaces(), fetchArchivedPlaces()]);
    } catch (error) {
      console.error('Error unarchiving trip:', error);
      alert(t('errors.generic'));
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const groupedArchivedPlaces = archivedPlaces.reduce((groups, place) => {
    const date = formatDate(place.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(place);
    return groups;
  }, {} as Record<string, Place[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
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
                {destination ? `${t('trip.tripTo')} ${destination}` : t('trip.planYourNext')}
              </h1>
              {weather && !weatherLoading && (
                <>
                  <WeatherDisplay 
                    weather={weather}
                    darkMode={darkMode}
                    language={language}
                  />
                  {startDate && endDate && (
                    <div className="mt-2 text-sm text-white/80">
                      <Calendar className="inline-block w-4 h-4 mr-1" />
                      {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Left buttons */}
          <div className="absolute top-4 left-4 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <LanguageToggle 
              language={language}
              setLanguage={setLanguage}
              darkMode={darkMode}
            />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
              title={darkMode ? t('trip.lightMode') : t('trip.darkMode')}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span className="hidden sm:inline ml-2">{darkMode ? t('trip.lightMode') : t('trip.darkMode')}</span>
            </button>

            {places.length > 0 && startDate && endDate && (
              <button
                onClick={handleArchiveTrip}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-purple-500/80 backdrop-blur-sm text-white hover:bg-purple-600/80 transition-colors"
                title={t('trip.archiveTrip')}
              >
                <Archive size={18} />
                <span className="hidden sm:inline ml-2">{t('trip.archiveTrip')}</span>
              </button>
            )}
          </div>

          {/* Right buttons */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
              title={t('trip.settings')}
            >
              <Settings size={18} />
              <span className="hidden sm:inline ml-2">{t('trip.settings')}</span>
            </button>

            {places.length > 0 && (
              <button
                onClick={() => exportToPDF(places, destination, distanceUnit)}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
                title={t('trip.exportPDF')}
              >
                <FileDown size={18} />
                <span className="hidden sm:inline ml-2">{t('trip.exportPDF')}</span>
              </button>
            )}

            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-red-500/80 backdrop-blur-sm text-white hover:bg-red-600/80 transition-colors"
              title={t('trip.signOut')}
            >
              <LogOut size={18} />
              <span className="hidden sm:inline ml-2">{t('trip.signOut')}</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <History className="h-5 w-5" />
              <span className="text-lg font-semibold">{t('trip.archivedTrips')}</span>
              {showArchived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showArchived && (
              <div className="mt-4 space-y-6">
                {Object.entries(groupedArchivedPlaces).map(([date, places]) => (
                  <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{date}</span>
                      </div>
                      <button
                        onClick={() => handleUnarchiveTrip(places)}
                        className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{t('trip.unarchiveTrip')}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          {t('trip.restaurants')}
                        </h4>
                        <div className="space-y-2">
                          {places.filter(p => p.type === 'restaurant').map(place => (
                            <div
                              key={place.id}
                              className="p-2 bg-gray-50 dark:bg-gray-700 rounded"
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                {place.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {place.address}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          {t('trip.activities')}
                        </h4>
                        <div className="space-y-2">
                          {places.filter(p => p.type === 'activity').map(place => (
                            <div
                              key={place.id}
                              className="p-2 bg-gray-50 dark:bg-gray-700 rounded"
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                {place.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {place.address}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {Object.keys(groupedArchivedPlaces).length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Archive className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t('trip.noArchivedTrips')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {!destination || !baseLocation ? (
            <div className="text-center">
              <button
                onClick={() => setShowSettings(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Settings className="h-5 w-5 mr-2" />
                {t('settings.setup')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setRestaurantsCollapsed(!restaurantsCollapsed)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      {restaurantsCollapsed ? (
                        <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {t('trip.restaurants')}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setFormType('restaurant');
                      setShowForm(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus size={18} />
                    <span>{t('trip.addRestaurant')}</span>
                  </button>
                </div>
                {!restaurantsCollapsed && (
                  <PlaceList
                    places={places.filter(p => p.type === 'restaurant')}
                    onSelect={setSelectedPlace}
                    distanceUnit={distanceUnit}
                    darkMode={darkMode}
                  />
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setActivitiesCollapsed(!activitiesCollapsed)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      {activitiesCollapsed ? (
                        <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {t('trip.activities')}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setFormType('activity');
                      setShowForm(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus size={18} />
                    <span>{t('trip.addActivity')}</span>
                  </button>
                </div>
                {!activitiesCollapsed && (
                  <PlaceList
                    places={places.filter(p => p.type === 'activity')}
                    onSelect={setSelectedPlace}
                    distanceUnit={distanceUnit}
                    darkMode={darkMode}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('settings.tripSettings')}
                  </h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('settings.destinationName')}
                    </label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('settings.hotelAddress')}
                    </label>
                    <input
                      type="text"
                      value={baseLocation}
                      onChange={(e) => setBaseLocation(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('settings.startDate')}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('settings.endDate')}
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('settings.distanceUnit')}
                    </label>
                    <select
                      value={distanceUnit}
                      onChange={(e) => setDistanceUnit(e.target.value as 'km' | 'mi')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="km">Kilometers (km)</option>
                      <option value="mi">Miles (mi)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {formType === 'restaurant' ? t('trip.addRestaurant') : t('trip.addActivity')}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <PlaceForm
                  type={formType}
                  baseLocation={baseLocation}
                  distanceUnit={distanceUnit}
                  onClose={() => {
                    setShowForm(false);
                    fetchPlaces();
                  }}
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
          />
        )}
      </div>
    </div>
  );
}

export default App;