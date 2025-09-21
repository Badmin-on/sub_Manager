import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

// Import translations statically - this ensures they're bundled
import koTranslations from '../translations/ko';
import enTranslations from '../translations/en';

type Locale = 'en' | 'ko';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: { [key: string]: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Static translation bundles for guaranteed loading
const TRANSLATIONS = {
  ko: koTranslations,
  en: enTranslations
} as const;

const getNestedValue = (obj: any, path: string): string | undefined => {
    if (!obj) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useLocalStorage<Locale>('language', 'ko');
  const [isReady, setIsReady] = useState(false);

  // Initialize immediately with static imports
  useEffect(() => {
    console.log(`Initializing translations for locale: ${locale}`);
    console.log('Available translations:', Object.keys(TRANSLATIONS));
    console.log('Current locale translations:', TRANSLATIONS[locale]);
    setIsReady(true);
  }, [locale]);

  const t = useCallback((key: string, replacements?: { [key: string]: string }): string => {
    if (!isReady) {
      return key; // Show key while initializing
    }

    // Get translation from static bundle
    const currentTranslations = TRANSLATIONS[locale];
    const fallbackTranslations = locale !== 'en' ? TRANSLATIONS.en : null;

    let translation = getNestedValue(currentTranslations, key);

    // Try fallback if not found
    if (translation === undefined && fallbackTranslations) {
        translation = getNestedValue(fallbackTranslations, key);
    }
    
    // If still not found, provide Korean fallbacks for common keys
    if (translation === undefined) {
      console.warn(`Translation key not found: ${key}`);
      
      const keyParts = key.split('.');
      const lastPart = keyParts[keyParts.length - 1];
      
      // Comprehensive Korean fallbacks
      const koreanFallbacks: { [key: string]: string } = {
        'title': '내 바로가기',
        'manageCategories': '카테고리 관리', 
        'addSite': '사이트 추가',
        'signIn': '로그인',
        'signOut': '로그아웃',
        'totalThisMonth': '이번 달 총액',
        'noShortcuts': '바로가기가 아직 없습니다',
        'getStarted': '새 사이트를 추가하여 시작하세요.',
        'uncategorized': '미분류',
        'signInPrompt': '로그인 해주세요',
        'localModeTitle': '시작할 준비가 되셨나요?',
        'localModeMessage': '바로가기를 추가하여 시작하세요. 데이터는 이 기기에 로컬로 저장됩니다.',
        'label': '언어',
        'local': '로컬 저장소',
        'firebase': 'Firebase',
        'googleSheets': 'Google Sheets',
        'connect': '동기화 연결',
        'copy': '복사',
        'cancel': '취소',
        'save': '저장'
      };
      
      return koreanFallbacks[lastPart] || key;
    }

    let strResult = String(translation);

    // Apply replacements if provided
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        strResult = strResult.replace(`{${placeholder}}`, replacements[placeholder]);
      });
    }

    return strResult;
  }, [isReady, locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
  }), [locale, setLocale, t]);

  // No loading screen - static imports are immediate
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