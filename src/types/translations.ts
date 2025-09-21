import koTranslations from '../translations/ko';

// 한국어 번역을 기준으로 타입 추론
export type TranslationKey = keyof typeof koTranslations;
export type NestedTranslationKey<T> = T extends object 
  ? { [K in keyof T]: K extends string 
      ? T[K] extends object 
        ? `${K}.${NestedTranslationKey<T[K]>}`
        : K
      : never 
    }[keyof T]
  : never;

// 전체 번역 키 타입
export type AllTranslationKeys = NestedTranslationKey<typeof koTranslations>;

// 번역 함수 타입
export interface TranslationFunction {
  (key: AllTranslationKeys, replacements?: Record<string, string>): string;
}

// 언어 타입
export type Locale = 'en' | 'ko';

// 번역 데이터 타입
export type TranslationData = typeof koTranslations;

// 언어 컨텍스트 타입
export interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationFunction;
  isLoading: boolean;
}