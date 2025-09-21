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
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        console.log(`Loading translations for locale: ${locale}`);
        
        // Load translations from bundled modules (no network requests)
        let currentLangData;
        let fallbackLangData = null;
        
        try {
          if (locale === 'ko') {
            // Dynamic import for Korean translations
            const koModule = await import('../src/translations/ko');
            currentLangData = koModule.default;
            
            // Load English as fallback
            const enModule = await import('../src/translations/en'); 
            fallbackLangData = enModule.default;
          } else {
            // Dynamic import for English translations
            const enModule = await import('../src/translations/en');
            currentLangData = enModule.default;
          }
          
          console.log(`Successfully loaded ${locale} translations from bundle:`, currentLangData);
          setTranslations(currentLangData);
          setFallbackTranslations(fallbackLangData);
          
        } catch (bundleError) {
          console.error("Failed to load translation modules:", bundleError);
          
          // Ultimate fallback - inline Korean translations
          const inlineTranslations = {
            header: {
              title: "내 바로가기",
              totalThisMonth: "이번 달 총액", 
              manageCategories: "카테고리 관리",
              addSite: "사이트 추가",
              signIn: "로그인",
              signOut: "로그아웃"
            },
            shortcutGrid: {
              noShortcuts: "바로가기가 아직 없습니다",
              getStarted: "새 사이트를 추가하여 시작하세요.",
              uncategorized: "미분류",
              signInPrompt: "로그인 해주세요", 
              localModeTitle: "시작할 준비가 되셨나요?",
              localModeMessage: "바로가기를 추가하여 시작하세요. 데이터는 이 기기에 로컬로 저장됩니다."
            },
            languageSwitcher: {
              label: "언어"
            },
            syncStatus: {
              local: "로컬 저장소",
              firebase: "Firebase",
              googleSheets: "Google Sheets"
            },
            configModal: {
              connect: "동기화 연결",
              copy: "복사"
            },
            addModal: {
              cancel: "취소",
              save: "저장"
            },
            common: {
              cancel: "취소",
              save: "저장"
            }
          };
          
          setTranslations(inlineTranslations);
          setFallbackTranslations({});
        }
        
      } catch (error) {
        console.error("Critical translation loading error:", error);
        // Last resort
        setTranslations({
          header: { title: "내 바로가기" },
          languageSwitcher: { label: "언어" }
        });
        setFallbackTranslations({});
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
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