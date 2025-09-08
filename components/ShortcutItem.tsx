
import React, { useMemo, useState } from 'react';
import type { Shortcut } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Edit, Trash2, ExternalLink, DollarSign, Calendar, AlertCircle } from 'lucide-react';

interface ShortcutItemProps {
  shortcut: Shortcut;
  onDelete: (id: string) => void;
  onEdit: (shortcut: Shortcut) => void;
}

const isPaymentDueSoon = (paymentDateStr?: string): boolean => {
  if (!paymentDateStr) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date

  const paymentDate = new Date(paymentDateStr);
  // The input type="date" value is timezone-agnostic (YYYY-MM-DD), but new Date() may interpret it in UTC.
  // Adjust for timezone offset to get the correct local date.
  const userTimezoneOffset = paymentDate.getTimezoneOffset() * 60000;
  const paymentDateLocal = new Date(paymentDate.getTime() + userTimezoneOffset);
  paymentDateLocal.setHours(0, 0, 0, 0); // Normalize payment date

  const diffTime = paymentDateLocal.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 && diffDays <= 7;
};

const ShortcutItem: React.FC<ShortcutItemProps> = ({ shortcut, onDelete, onEdit }) => {
  const { t } = useLanguage();
  const dueSoon = useMemo(() => isPaymentDueSoon(shortcut.paymentDate), [shortcut.paymentDate]);

  const ringClass = dueSoon 
    ? 'ring-4 ring-offset-2 ring-yellow-400 dark:ring-yellow-500' 
    : 'ring-1 ring-gray-900/5';
    
  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length > 1 && words[0] && words[1]) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${shortcut.url}&sz=64`;

  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="shortcut-item relative">
      {/* Action buttons - top right */}
      <div className="absolute top-2 right-2 z-10 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button 
          onClick={(e) => {
            e.preventDefault();
            onEdit(shortcut);
          }}
          className="p-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg shadow-sm hover:bg-gray-50 hover:text-primary-600 transition-colors"
          aria-label={t('shortcutItem.edit', { name: shortcut.name })}
        >
          <Edit size={14} />
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            onDelete(shortcut.id);
          }}
          className="p-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
          aria-label={t('shortcutItem.delete', { name: shortcut.name })}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Payment due indicator */}
      {dueSoon && (
        <div className="absolute -top-2 -left-2 z-10">
          <div className="bg-yellow-400 text-yellow-900 rounded-full p-1.5 shadow-md animate-pulse">
            <AlertCircle size={16} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <a 
        href={shortcut.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block w-full h-full p-4 text-decoration-none"
      >
        {/* Icon/Logo section */}
        <div className="flex justify-center mb-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50 shadow-sm transition-all duration-200 group-hover:shadow-md ${dueSoon ? 'ring-2 ring-yellow-400' : ''}`}>
            {!imageError ? (
              <img 
                src={faviconUrl} 
                alt={`${shortcut.name} favicon`} 
                className="w-8 h-8 object-cover rounded-lg"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600">
                  {getInitials(shortcut.name)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 text-center mb-2 line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
          {shortcut.name}
        </h3>

        {/* URL preview */}
        <p className="text-xs text-gray-500 text-center truncate mb-3" title={shortcut.url}>
          {new URL(shortcut.url).hostname}
        </p>

        {/* Payment info */}
        {(shortcut.paymentAmount || shortcut.paymentDate) && (
          <div className="border-t border-gray-100 pt-3 space-y-1">
            {shortcut.paymentAmount && (
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-600">
                <DollarSign size={12} />
                <span>${shortcut.paymentAmount}</span>
                {shortcut.paymentFrequency && (
                  <span className="text-gray-400">/{shortcut.paymentFrequency}</span>
                )}
              </div>
            )}
            {shortcut.paymentDate && (
              <div className={`flex items-center justify-center space-x-1 text-xs ${
                dueSoon ? 'text-yellow-700 font-medium' : 'text-gray-600'
              }`}>
                <Calendar size={12} />
                <span>{new Date(shortcut.paymentDate + 'T00:00:00').toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}

        {/* External link indicator */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink size={14} className="text-gray-400" />
        </div>
      </a>
    </div>
  );
};

export default ShortcutItem;