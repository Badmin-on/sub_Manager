import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Locale, TranslationData, LanguageContextType, AllTranslationKeys } from '../src/types/translations';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 안전한 중첩 값 가져오기 함수 (타입 안전성 개선)
const getNestedValue = (obj: TranslationData | null, path: string): string | undefined => {
    if (!obj) return undefined;
    
    try {
      return path.split('.').reduce((acc: any, part: string) => {
        return acc && typeof acc === 'object' && part in acc ? acc[part] : undefined;
      }, obj);
    } catch (error) {
      console.warn(`Error accessing translation path "${path}":`, error);
      return undefined;
    }
};

// 강화된 폴백 번역 제공
const getEmergencyFallback = (key: string): string => {
  const emergencyTranslations: Record<string, string> = {
    'header.title': '내 바로가기',
    'header.manageCategories': '카테고리 관리', 
    'header.addSite': '사이트 추가',
    'shortcutGrid.noShortcuts': '바로가기가 없습니다',
    'shortcutGrid.getStarted': '새 사이트를 추가하여 시작하세요',
    'shortcutGrid.uncategorized': '미분류',
    'common.loading': '로딩 중...',
    'common.error': '오류 발생',
    'common.cancel': '취소',
    'common.save': '저장'
  };
  
  return emergencyTranslations[key] || key;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useLocalStorage<Locale>('language', 'ko');
  const [translations, setTranslations] = useState<TranslationData | null>(null);
  const [fallbackTranslations, setFallbackTranslations] = useState<TranslationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadTranslationsStatically = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        console.log(`🔄 Loading translations for locale: ${locale}`);
        
        // 정적 import로 번역 파일 로딩 (Vercel 배포에 최적화)
        let currentTranslations: TranslationData;
        let fallbackTranslations: TranslationData | null = null;
        
        if (locale === 'ko') {
          // 한국어와 영어 폴백 동시 로딩
          const [koModule, enModule] = await Promise.all([
            import('../src/translations/ko'),
            import('../src/translations/en')
          ]);
          
          currentTranslations = koModule.default;
          fallbackTranslations = enModule.default;
        } else {
          // 영어만 로딩 (영어는 자체가 폴백)
          const enModule = await import('../src/translations/en');
          currentTranslations = enModule.default;
        }
        
        console.log(`✅ Successfully loaded ${locale} translations:`, Object.keys(currentTranslations));
        
        setTranslations(currentTranslations);
        setFallbackTranslations(fallbackTranslations);
        
      } catch (error) {
        console.error('❌ Critical error loading translations:', error);
        setLoadError(error instanceof Error ? error.message : 'Unknown translation loading error');
        
        // 비상 폴백 - 최소한의 하드코딩된 번역
        const emergencyKorean = {
          header: { title: "내 바로가기", manageCategories: "카테고리 관리", addSite: "사이트 추가" },
          shortcutGrid: { noShortcuts: "바로가기가 없습니다", getStarted: "시작하세요", uncategorized: "미분류" },
          common: { loading: "로딩 중...", error: "오류", cancel: "취소", save: "저장" }
        } as TranslationData;
        
        setTranslations(emergencyKorean);
        setFallbackTranslations(emergencyKorean);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslationsStatically();
  }, [locale]);

  const t = useCallback((key: AllTranslationKeys, replacements?: Record<string, string>): string => {
    // 로딩 중일 때는 키 반환 (빈 문자열보다 나음)
    if (isLoading) {
      return getEmergencyFallback(key);
    }

    // 1차: 현재 언어에서 번역 찾기
    let translation = getNestedValue(translations, key);

    // 2차: 폴백 언어에서 번역 찾기
    if (translation === undefined && fallbackTranslations) {
      translation = getNestedValue(fallbackTranslations, key);
    }
    
    // 3차: 비상 폴백 사용
    if (translation === undefined) {
      console.warn(`🚨 Translation missing for key: "${key}" in locale: ${locale}`);
      translation = getEmergencyFallback(key);
    }

    let result = String(translation);

    // 플레이스홀더 교체 (안전한 방식)
    if (replacements && typeof replacements === 'object') {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        if (typeof value === 'string') {
          result = result.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
        }
      });
    }

    return result;
  }, [isLoading, translations, fallbackTranslations, locale]);

  const contextValue = useMemo((): LanguageContextType => ({
    locale,
    setLocale,
    t,
    isLoading
  }), [locale, setLocale, t, isLoading]);

  // 로딩 중 UI (개선된 디자인)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 border-2 border-transparent border-t-indigo-400 animate-ping"></div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700">번역 로딩 중...</p>
          <p className="mt-2 text-sm text-gray-500">Translation system initializing...</p>
          {loadError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-red-800 text-sm">⚠️ {loadError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={contextValue}>
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