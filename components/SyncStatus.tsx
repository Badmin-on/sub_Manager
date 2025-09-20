import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface SyncStatusProps {
  isConfigured: boolean;
  isSignedIn: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onConfigureClick: () => void;
  storageMode: 'local' | 'firebase' | 'google-sheets';
  onStorageModeClick: () => void;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ isConfigured, isSignedIn, onSignIn, onSignOut, onConfigureClick, storageMode, onStorageModeClick }) => {
  const { t } = useLanguage();

  const getStorageIcon = () => {
    switch (storageMode) {
      case 'firebase':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
          </svg>
        );
      case 'google-sheets':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
          </svg>
        );
      default: // local
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getStorageLabel = () => {
    switch (storageMode) {
      case 'firebase':
        return t('syncStatus.firebase');
      case 'google-sheets':
        return t('syncStatus.googleSheets');
      default: // local
        return t('syncStatus.local');
    }
  };

  const getTooltipText = () => {
    switch (storageMode) {
      case 'firebase':
        return t('syncStatus.firebaseTooltip');
      case 'google-sheets':
        return t('syncStatus.syncedTooltip');
      default: // local
        return t('syncStatus.localTooltip');
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={onStorageModeClick}
        className="flex items-center space-x-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
        title={getTooltipText()}
      >
        {getStorageIcon()}
        <span className="font-medium">{getStorageLabel()}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {storageMode === 'google-sheets' && !isConfigured && (
        <button
          onClick={onConfigureClick}
          className="inline-flex items-center px-3 py-1.5 border border-dashed border-gray-400 text-xs font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100"
        >
          {t('configModal.connect')}
        </button>
      )}
      
      {storageMode === 'google-sheets' && isConfigured && !isSignedIn && (
        <button
          onClick={onSignIn}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.933 10.152H12.2v4.44h5.454c-.234 1.44-1.63 3.69-5.454 3.69-3.28 0-5.95-2.71-5.95-6.04s2.67-6.04 5.95-6.04c1.86 0 3.12.78 3.82 1.45l3.53-3.35C17.65.952 15.22 0 12.2 0 5.48 0 0 5.42 0 12.1s5.48 12.1 12.2 12.1c6.94 0 11.72-4.83 11.72-11.85 0-.7-.06-1.33-.187-1.9z"/>
          </svg>
          {t('header.signIn')}
        </button>
      )}
      
      {storageMode === 'google-sheets' && isSignedIn && (
        <button
          onClick={onSignOut}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          {t('header.signOut')}
        </button>
      )}
    </div>
  );
};

export default SyncStatus;