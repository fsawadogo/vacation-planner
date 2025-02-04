import React from 'react';
import { Cloud, Droplets, Wind } from 'lucide-react';
import { WeatherData } from '../utils/weather';

interface WeatherDisplayProps {
  weather: WeatherData;
  darkMode: boolean;
}

export function WeatherDisplay({ weather, darkMode }: WeatherDisplayProps) {
  return (
    <div className={`flex items-center justify-center space-x-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      <img
        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
        alt={weather.description}
        className="w-8 h-8"
      />
      <div className="flex items-center space-x-4">
        <span className="text-lg">
          {weather.temp}°C
        </span>
        <div className="flex items-center space-x-2 text-sm">
          <Droplets className="w-4 h-4" />
          <span>{weather.humidity}%</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Wind className="w-4 h-4" />
          <span>{weather.windSpeed} m/s</span>
        </div>
      </div>
    </div>
  );
}