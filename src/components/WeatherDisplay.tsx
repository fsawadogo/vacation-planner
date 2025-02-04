import React from 'react';
import { Droplets, Wind } from 'lucide-react';
import { WeatherData } from '../utils/weather';
import { Language } from '../i18n/translations';
import { useTranslation } from '../hooks/useTranslation';

interface WeatherDisplayProps {
  weather: WeatherData;
  darkMode: boolean;
  language: Language;
}

export function WeatherDisplay({ weather, darkMode, language }: WeatherDisplayProps) {
  const { t } = useTranslation(language);

  return (
    <div className={`${darkMode ? 'text-white' : 'text-gray-800'}`}>
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description}
            className="w-8 h-8"
          />
          <span className="text-lg">
            {weather.temp}°C
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm" title={t('weather.humidity')}>
            <Droplets className="w-4 h-4" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center space-x-2 text-sm" title={t('weather.windSpeed')}>
            <Wind className="w-4 h-4" />
            <span>{weather.windSpeed} {t('weather.metersPerSecond')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}