
import React from 'react';
import type { Shortcut } from '../types';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  onAddClick: () => void;
  onManageCategoriesClick: () => void;
  shortcuts: Shortcut[];
}

const Header: React.FC<HeaderProps> = ({ onAddClick, onManageCategoriesClick, shortcuts }) => {
  const { t } = useLanguage();

  const calculateTotalMonthlyCost = () => {
    const now = new Date();
    const currentMonth = now.getMonth();

    return shortcuts.reduce((total, shortcut) => {
        if (!shortcut.paymentDate || !shortcut.paymentAmount) {
            return total;
        }

        if (shortcut.paymentFrequency === 'monthly') {
            return total + shortcut.paymentAmount;
        }

        if (shortcut.paymentFrequency === 'yearly') {
            const paymentDate = new Date(shortcut.paymentDate);
            // Adjust for timezone offset to get the correct local date.
            const userTimezoneOffset = paymentDate.getTimezoneOffset() * 60000;
            const paymentDateLocal = new Date(paymentDate.getTime() + userTimezoneOffset);
            
            if (paymentDateLocal.getMonth() === currentMonth) {
                return total + shortcut.paymentAmount;
            }
        }
        return total;
    }, 0);
  };

  const totalCost = calculateTotalMonthlyCost();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('header.title')}
        </h1>
        <div className="flex items-center space-x-6">
           {totalCost > 0 && (
                <div className="text-right">
                    <p className="text-sm text-gray-500">{t('header.totalThisMonth')}</p>
                    <p className="text-lg font-bold text-indigo-600">
                        ${totalCost.toFixed(2)}
                    </p>
                </div>
            )}
            <div className="flex items-center space-x-2">
                <LanguageSwitcher />
                <button
                    onClick={onManageCategoriesClick}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {t('header.manageCategories')}
                </button>
                <button
                    onClick={onAddClick}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {t('header.addSite')}
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;