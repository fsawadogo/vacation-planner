import { useCallback } from 'react';
import { translations, Language } from '../i18n/translations';

export function useTranslation(language: Language) {
  const t = useCallback((key: string) => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return value || key;
  }, [language]);

  return { t };
}