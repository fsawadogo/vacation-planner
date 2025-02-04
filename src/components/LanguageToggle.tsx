import React from 'react';
import { Languages } from 'lucide-react';
import { Language } from '../i18n/translations';

interface LanguageToggleProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
}

export function LanguageToggle({ language, setLanguage, darkMode }: LanguageToggleProps) {
  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
      className={`flex items-center justify-center space-x-2 ${
        darkMode 
          ? 'bg-gray-800 text-white hover:bg-gray-700' 
          : 'bg-white text-gray-800 hover:bg-gray-100'
      } px-3 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm transition-all duration-200 text-sm md:text-base`}
      title={language === 'en' ? 'Switch to French' : 'Passer en anglais'}
    >
      <Languages size={18} className="md:h-5 md:w-5" />
      <span className="hidden md:inline">{language === 'en' ? 'FR' : 'EN'}</span>
    </button>
  );
}