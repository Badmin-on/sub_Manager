
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale, t } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(e.target.value as 'en' | 'ko');
  };

  return (
    <div className="flex items-center">
      <label htmlFor="language-select" className="sr-only">
        {t('languageSwitcher.label')}
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={handleLanguageChange}
        className="block w-full pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        aria-label={t('languageSwitcher.label')}
      >
        <option value="en">English</option>
        <option value="ko">한국어</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;