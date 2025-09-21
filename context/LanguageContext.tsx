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
        console.log(`Loading translations for locale: ${locale}`);
        
        const currentLangResponse = await fetch(`/locales/${locale}.json`);
        console.log(`Response status for ${locale}.json:`, currentLangResponse.status);
        
        if (!currentLangResponse.ok) {
          throw new Error(`Failed to fetch ${locale}.json: ${currentLangResponse.status}`);
        }
        
        const currentLangData = await currentLangResponse.json();
        console.log(`Loaded ${locale} translations:`, currentLangData);
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
        // Set fallback translations for development
        const fallbackTranslations = {
          header: {
            title: "내 바로가기",
            totalThisMonth: "이번 달 총액",
            manageCategories: "카테고리 관리",
            addSite: "사이트 추가"
          }
        };
        setTranslations(fallbackTranslations);
        setFallbackTranslations({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [locale]);

  const t = useCallback((key: string, replacements?: { [key: string]: string }): string => {
    if (isLoading) {
      return key; // Show key instead of empty string while loading
    }

    let translation = getNestedValue(translations, key);

    if (translation === undefined) {
        translation = getNestedValue(fallbackTranslations, key);
    }
    
    if (translation === undefined) {
      console.warn(`Translation key not found: ${key}`);
      // Return a meaningful fallback based on the key
      const keyParts = key.split('.');
      const lastPart = keyParts[keyParts.length - 1];
      
      // Provide Korean fallbacks for common keys
      const koreanFallbacks: { [key: string]: string } = {
        'title': '내 바로가기',
        'manageCategories': '카테고리 관리',
        'addSite': '사이트 추가',
        'signIn': '로그인',
        'signOut': '로그아웃',
        'totalThisMonth': '이번 달 총액'
      };
      
      return koreanFallbacks[lastPart] || key;
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">번역 파일 로딩 중...</p>
        </div>
      </div>
    ); // Show loading spinner while translations are being loaded
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