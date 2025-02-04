import { useState, useEffect } from 'react';

const API_KEY = 'ec3622d261a10e6fa291fcf2c7ea52cb';

export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export interface ForecastData extends WeatherData {
  date: string;
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

export const fetchForecast = async (city: string): Promise<ForecastData[]> => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Forecast data not available');
    }

    const data = await response.json();
    
    // Group forecasts by day and get the middle of day forecast (around noon)
    const dailyForecasts = new Map<string, any>();
    
    data.list.forEach((forecast: any) => {
      const date = new Date(forecast.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const hour = date.getHours();
      
      // Prefer forecasts around noon (12:00) for each day
      if (!dailyForecasts.has(dateKey) || Math.abs(hour - 12) < Math.abs(new Date(dailyForecasts.get(dateKey).dt * 1000).getHours() - 12)) {
        dailyForecasts.set(dateKey, forecast);
      }
    });

    return Array.from(dailyForecasts.values()).map(forecast => ({
      date: new Date(forecast.dt * 1000).toISOString().split('T')[0],
      temp: Math.round(forecast.main.temp),
      description: forecast.weather[0].description,
      icon: forecast.weather[0].icon,
      humidity: forecast.main.humidity,
      windSpeed: Math.round(forecast.wind.speed),
    }));
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return [];
  }
};

export const useWeather = (city: string, startDate?: string, endDate?: string) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getWeatherData = async () => {
      if (!city) {
        setWeather(null);
        setForecast([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      const [currentWeather, forecastData] = await Promise.all([
        fetchWeather(city),
        fetchForecast(city)
      ]);
      
      if (mounted) {
        setWeather(currentWeather);
        
        if (startDate && endDate) {
          // Filter forecast for trip duration
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          const tripForecast = forecastData.filter(day => {
            const date = new Date(day.date);
            return date >= start && date <= end;
          });
          
          setForecast(tripForecast);
        } else {
          setForecast(forecastData.slice(0, 5)); // Show next 5 days if no dates selected
        }
        
        setLoading(false);
      }
    };

    getWeatherData();

    // Update weather every 30 minutes
    const interval = setInterval(getWeatherData, 30 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [city, startDate, endDate]);

  return { weather, forecast, loading };
};