
import React, { useMemo } from 'react';
import type { Shortcut } from '../types';
import { useLanguage } from '../context/LanguageContext';

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

  return (
    <div className="relative group flex flex-col items-center text-center">
       <div className="absolute top-0 right-0 z-10 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
              onClick={() => onEdit(shortcut)}
              className="p-1 bg-gray-600 text-white rounded-full focus:opacity-100 focus:outline-none"
              aria-label={t('shortcutItem.edit', { name: shortcut.name })}
            >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            </svg>
            </button>
           <button 
              onClick={() => onDelete(shortcut.id)}
              className="p-1 bg-gray-600 text-white rounded-full focus:opacity-100 focus:outline-none"
              aria-label={t('shortcutItem.delete', { name: shortcut.name })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
       </div>
      <a href={shortcut.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center w-full">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-gray-200 shadow-md transition-all duration-300 ease-in-out transform group-hover:scale-110 ${ringClass}`}>
          <img 
            src={faviconUrl} 
            alt={`${shortcut.name} favicon`} 
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentNode as HTMLDivElement;
                if (parent) {
                    const textFallback = document.createElement('span');
                    textFallback.className = 'text-xl font-bold text-gray-600';
                    textFallback.textContent = getInitials(shortcut.name);
                    parent.appendChild(textFallback);
                }
            }}
          />
        </div>
        <span className="mt-2 text-sm font-medium text-gray-800 break-all w-24 truncate">{shortcut.name}</span>
      </a>
      {dueSoon && <span className="mt-1 text-xs text-yellow-600 font-semibold">{t('shortcutItem.paymentDue')}</span>}
    </div>
  );
};

export default ShortcutItem;