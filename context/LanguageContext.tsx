import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

type Locale = 'en' | 'ko';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: { [key: string]: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getNestedValue = (obj: any, path: string): string | undefined => {
    if (!obj) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useLocalStorage<Locale>('language', 'ko');
  const [translations, setTranslations] = useState<any | null>(null);
  const [fallbackTranslations, setFallbackTranslations] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTranslations = async () => {
      setIsLoading(true);
      try {
        const currentLangResponse = await fetch(`/locales/${locale}.json`);
        if (!currentLangResponse.ok) throw new Error(`Failed to fetch ${locale}.json`);
        const currentLangData = await currentLangResponse.json();
        setTranslations(currentLangData);

        if (locale !== 'en') {
          const fallbackLangResponse = await fetch(`/locales/en.json`);
          if (!fallbackLangResponse.ok) throw new Error('Failed to fetch en.json');
          const fallbackLangData = await fallbackLangResponse.json();
          setFallbackTranslations(fallbackLangData);
        } else {
          setFallbackTranslations(null); // en is the fallback, no need to load it twice
        }
      } catch (error) {
        console.error("Failed to load translation files:", error);
        setTranslations({});
        setFallbackTranslations({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [locale]);

  const t = useCallback((key: string, replacements?: { [key: string]: string }): string => {
    if (isLoading) {
      return '';
    }

    let translation = getNestedValue(translations, key);

    if (translation === undefined) {
        translation = getNestedValue(fallbackTranslations, key);
    }
    
    if (translation === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    let strResult = String(translation);

    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        strResult = strResult.replace(`{${placeholder}}`, replacements[placeholder]);
      });
    }

    return strResult;
  }, [isLoading, translations, fallbackTranslations]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
  }), [locale, setLocale, t]);

  if (isLoading) {
    return null; // Don't render children until translations are loaded
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};