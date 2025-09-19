import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface SyncStatusProps {
  isConfigured: boolean;
  isSignedIn: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onConfigureClick: () => void;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ isConfigured, isSignedIn, onSignIn, onSignOut, onConfigureClick }) => {
  const { t } = useLanguage();

  if (!isConfigured) {
    return (
      <button
        onClick={onConfigureClick}
        className="inline-flex items-center px-4 py-2 border border-dashed border-gray-400 text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
        {t('configModal.connect')}
      </button>
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 text-sm text-gray-700" title={t('syncStatus.syncedTooltip')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
            </svg>
            <span className="font-medium">{t('syncStatus.googleSheets')}</span>
        </div>
        <button
          onClick={onSignOut}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t('header.signOut')}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onSignIn}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21.933 10.152H12.2v4.44h5.454c-.234 1.44-1.63 3.69-5.454 3.69-3.28 0-5.95-2.71-5.95-6.04s2.67-6.04 5.95-6.04c1.86 0 3.12.78 3.82 1.45l3.53-3.35C17.65.952 15.22 0 12.2 0 5.48 0 0 5.42 0 12.1s5.48 12.1 12.2 12.1c6.94 0 11.72-4.83 11.72-11.85 0-.7-.06-1.33-.187-1.9z"/></svg>
      {t('header.signIn')}
    </button>
  );
};

export default SyncStatus;