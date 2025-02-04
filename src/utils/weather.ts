import { useState, useEffect } from 'react';

const API_KEY = 'ec3622d261a10e6fa291fcf2c7ea52cb';

export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export const fetchWeather = async (city: string): Promise<WeatherData | null> => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Weather data not available');
    }

    const data = await response.json();
    
    return {
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
};

export const useWeather = (city: string) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getWeather = async () => {
      if (!city) {
        setWeather(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await fetchWeather(city);
      
      if (mounted) {
        setWeather(data);
        setLoading(false);
      }
    };

    getWeather();

    // Update weather every 30 minutes
    const interval = setInterval(getWeather, 30 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [city]);

  return { weather, loading };
};