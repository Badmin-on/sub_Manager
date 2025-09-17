
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
    <div className="relative bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-105 group w-16">
      {/* Payment due indicator */}
      {dueSoon && (
        <div className="absolute -top-1 -left-1 z-20">
          <div className="bg-yellow-400 text-yellow-900 rounded-full p-1 shadow-md animate-pulse">
            <AlertCircle size={10} />
          </div>
        </div>
      )}

      {/* Action buttons - top right */}
      <div className="absolute top-1 right-1 z-20 flex space-x-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(shortcut);
          }}
          className="p-1 bg-white/90 backdrop-blur-sm border border-gray-200/50 text-gray-600 rounded-md shadow-sm hover:bg-white hover:text-primary-600 transition-all duration-200"
          aria-label={t('shortcutItem.edit', { name: shortcut.name })}
        >
          <Edit size={10} />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(shortcut.id);
          }}
          className="p-1 bg-white/90 backdrop-blur-sm border border-gray-200/50 text-gray-600 rounded-md shadow-sm hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          aria-label={t('shortcutItem.delete', { name: shortcut.name })}
        >
          <Trash2 size={10} />
        </button>
      </div>

      {/* Main clickable area - vertical compact layout */}
      <a
        href={shortcut.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center px-1 py-2 text-decoration-none h-16"
      >
        {/* Icon/Logo section */}
        <div className="flex-shrink-0 mb-1">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-md ${dueSoon ? 'ring-1 ring-yellow-400/60' : ''}`}>
            {!imageError ? (
              <img
                src={faviconUrl}
                alt={`${shortcut.name} favicon`}
                className="w-5 h-5 object-cover rounded-sm"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-5 h-5 bg-gradient-to-br from-primary-100 to-purple-100 rounded-sm flex items-center justify-center">
                <span className="text-xs font-bold text-primary-600">
                  {getInitials(shortcut.name)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-grow min-w-0 text-center w-full px-0.5">
          {/* Title */}
          <h3 className="text-xs font-medium text-gray-900 truncate leading-tight" title={shortcut.name}>
            {shortcut.name.length > 8 ? shortcut.name.substring(0, 8) + '...' : shortcut.name}
          </h3>

          {/* Payment indicator - only if has payment info */}
          {(shortcut.paymentAmount || shortcut.paymentDate) && (
            <div className="flex justify-center mt-0.5">
              <div className={`w-1 h-1 rounded-full ${
                dueSoon ? 'bg-yellow-400' : 'bg-green-400'
              }`} title={shortcut.paymentAmount ? `$${shortcut.paymentAmount}` : '구독 서비스'}></div>
            </div>
          )}
        </div>
      </a>
    </div>
  );
};

export default ShortcutItem;