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
        
        // Try to fetch JSON first, fallback to hardcoded translations if fails
        try {
          const currentLangResponse = await fetch(`/locales/${locale}.json`);
          console.log(`Response status for ${locale}.json:`, currentLangResponse.status);
          
          if (currentLangResponse.ok) {
            const currentLangData = await currentLangResponse.json();
            console.log(`Loaded ${locale} translations from JSON:`, currentLangData);
            setTranslations(currentLangData);

            if (locale !== 'en') {
              try {
                const fallbackLangResponse = await fetch(`/locales/en.json`);
                if (fallbackLangResponse.ok) {
                  const fallbackLangData = await fallbackLangResponse.json();
                  setFallbackTranslations(fallbackLangData);
                }
              } catch (fallbackError) {
                console.warn("Failed to load fallback translations:", fallbackError);
              }
            }
            return; // Successfully loaded from JSON
          }
        } catch (fetchError) {
          console.warn("JSON fetch failed, using fallback:", fetchError);
        }
        
        // If JSON loading fails, use hardcoded translations
        console.log("Using hardcoded fallback translations");
        const fallbackTranslations = {
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
            signInToSync: "Google 계정으로 로그인하여 바로가기를 동기화하세요.",
            loading: "바로가기를 불러오는 중...",
            localModeTitle: "시작할 준비가 되셨나요?",
            localModeMessage: "바로가기를 추가하여 시작하세요. 데이터는 이 기기에 로컬로 저장됩니다."
          },
          shortcutItem: {
            edit: "{name} 수정",
            delete: "{name} 삭제",
            paymentDue: "결제일 임박!"
          },
          addModal: {
            title: "새 사이트 추가",
            siteName: "사이트 이름",
            siteNamePlaceholder: "예: 넷플릭스",
            siteUrl: "사이트 URL",
            siteUrlPlaceholder: "예: netflix.com",
            categoryLabel: "카테고리 (선택 사항)",
            uncategorized: "미분류",
            cancel: "취소",
            save: "저장"
          },
          editModal: {
            title: "사이트 수정",
            update: "업데이트"
          },
          categoryModal: {
            title: "카테고리 관리",
            noCategories: "카테고리가 아직 없습니다.",
            addNew: "새 카테고리 추가",
            add: "추가",
            save: "저장",
            cancel: "취소"
          },
          languageSwitcher: {
            label: "언어"
          },
          syncStatus: {
            local: "로컬 저장소",
            localTooltip: "데이터가 이 기기에만 저장됩니다.",
            firebase: "Firebase",
            firebaseTooltip: "실시간 클라우드 데이터베이스와 동기화됩니다.",
            googleSheets: "Google Sheets",
            syncedTooltip: "데이터가 Google Sheets와 동기화됩니다."
          },
          configModal: {
            connect: "동기화 연결",
            copy: "복사",
            copied: "복사됨!"
          },
          storageMode: {
            title: "저장 방식 선택",
            local: "로컬 저장소",
            localDescription: "데이터가 이 기기에만 저장됩니다. 가장 간단하고 빠른 방법입니다.",
            firebase: "Firebase 실시간 DB",
            firebaseDescription: "실시간 동기화가 가능한 클라우드 데이터베이스입니다. 여러 기기에서 사용 가능합니다.",
            googleSheets: "Google Sheets",
            googleSheetsDescription: "Google Sheets에 데이터를 저장합니다. 스프레드시트로 데이터를 관리할 수 있습니다."
          },
          common: {
            cancel: "취소",
            save: "저장",
            confirm: "확인",
            loading: "로딩 중..."
          }
        };
        setTranslations(fallbackTranslations);
        setFallbackTranslations({});
        
      } catch (error) {
        console.error("Critical translation loading error:", error);
        // Last resort fallback
        setTranslations({
          header: { title: "내 바로가기" }
        });
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