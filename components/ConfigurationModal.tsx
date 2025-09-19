import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface GoogleConfig {
  apiKey: string;
  clientId: string;
  spreadsheetId: string;
}

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: GoogleConfig) => void;
  onDisconnect: () => void;
  initialConfig: GoogleConfig | null;
}

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({ isOpen, onClose, onSave, onDisconnect, initialConfig }) => {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [error, setError] = useState('');
  const [copyText, setCopyText] = useState(t('configModal.copy'));

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (initialConfig) {
      setApiKey(initialConfig.apiKey || '');
      setClientId(initialConfig.clientId || '');
      setSpreadsheetId(initialConfig.spreadsheetId || '');
    } else {
      setApiKey('');
      setClientId('');
      setSpreadsheetId('');
    }
    setError('');
    setCopyText(t('configModal.copy'));
  }, [initialConfig, isOpen, t]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !clientId.trim() || !spreadsheetId.trim()) {
      setError(t('configModal.errorRequired'));
      return;
    }
    onSave({ apiKey, clientId, spreadsheetId });
    onClose();
  };

  const handleDisconnect = () => {
    if (window.confirm(t('configModal.disconnectConfirm'))) {
      onDisconnect();
      onClose();
    }
  }

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(origin).then(() => {
      setCopyText(t('configModal.copied'));
      setTimeout(() => setCopyText(t('configModal.copy')), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('configModal.title')}</h2>
          <p className="text-sm text-gray-600 mb-6">{t('configModal.description')}</p>
          
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
             <label className="block text-sm font-medium text-gray-700">{t('configModal.originLabel')}</label>
              <p className="mt-1 text-xs text-gray-500">{t('configModal.originDescription')}</p>
              <div className="mt-2 flex items-center space-x-2">
                <input
                    type="text"
                    value={origin}
                    readOnly
                    className="flex-grow block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 focus:outline-none sm:text-sm"
                />
                <button
                    type="button"
                    onClick={handleCopyOrigin}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {copyText}
                </button>
              </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">{t('configModal.apiKeyLabel')}</label>
                <input
                  type="text"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('configModal.apiKeyPlaceholder')}
                  required
                />
              </div>
              <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">{t('configModal.clientIdLabel')}</label>
                <input
                  type="text"
                  id="clientId"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('configModal.clientIdPlaceholder')}
                  required
                />
              </div>
              <div>
                <label htmlFor="spreadsheetId" className="block text-sm font-medium text-gray-700">{t('configModal.spreadsheetIdLabel')}</label>
                <input
                  type="text"
                  id="spreadsheetId"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('configModal.spreadsheetIdPlaceholder')}
                  required
                />
                 <p className="mt-1 text-xs text-gray-500">{t('configModal.spreadsheetIdHelp')}</p>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            <div className="mt-6 flex justify-between items-center">
              <div>
                {initialConfig && (
                    <button
                        type="button"
                        onClick={handleDisconnect}
                        className="px-4 py-2 bg-red-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        {t('configModal.disconnect')}
                    </button>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {t('addModal.cancel')}
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {t('addModal.save')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationModal;