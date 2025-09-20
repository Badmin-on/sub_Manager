import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface StorageModeSelectorProps {
  currentMode: 'local' | 'firebase' | 'google-sheets';
  onModeChange: (mode: 'local' | 'firebase' | 'google-sheets') => void;
  isOpen: boolean;
  onClose: () => void;
}

const StorageModeSelector: React.FC<StorageModeSelectorProps> = ({
  currentMode,
  onModeChange,
  isOpen,
  onClose
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleModeSelect = (mode: 'local' | 'firebase' | 'google-sheets') => {
    onModeChange(mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t('storageMode.title') || '저장 방식 선택'}
        </h2>
        
        <div className="space-y-4">
          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              currentMode === 'local' 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleModeSelect('local')}
          >
            <h3 className="font-semibold text-gray-900">
              {t('storageMode.local') || '로컬 저장소'}
            </h3>
            <p className="text-sm text-gray-600">
              {t('storageMode.localDescription') || '데이터가 이 기기에만 저장됩니다. 가장 간단하고 빠른 방법입니다.'}
            </p>
          </div>

          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              currentMode === 'firebase' 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleModeSelect('firebase')}
          >
            <h3 className="font-semibold text-gray-900">
              {t('storageMode.firebase') || 'Firebase 실시간 DB'}
            </h3>
            <p className="text-sm text-gray-600">
              {t('storageMode.firebaseDescription') || '실시간 동기화가 가능한 클라우드 데이터베이스입니다. 여러 기기에서 사용 가능합니다.'}
            </p>
          </div>

          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              currentMode === 'google-sheets' 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleModeSelect('google-sheets')}
          >
            <h3 className="font-semibold text-gray-900">
              {t('storageMode.googleSheets') || 'Google Sheets'}
            </h3>
            <p className="text-sm text-gray-600">
              {t('storageMode.googleSheetsDescription') || 'Google Sheets에 데이터를 저장합니다. 스프레드시트로 데이터를 관리할 수 있습니다.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {t('common.cancel') || '취소'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorageModeSelector;