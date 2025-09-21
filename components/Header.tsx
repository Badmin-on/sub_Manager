import React from 'react';
import type { Shortcut } from '../types';
import type { User } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { Plus, Settings, LogIn, LogOut, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  onAddClick: () => void;
  onManageCategoriesClick: () => void;
  shortcuts: Shortcut[];
  isSignedIn: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  user?: User | null;
}

const Header: React.FC<HeaderProps> = ({ 
  onAddClick, 
  onManageCategoriesClick, 
  shortcuts, 
  isSignedIn, 
  onSignIn, 
  onSignOut, 
  user 
}) => {
  const { t } = useLanguage();

  // Calculate total monthly cost
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
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('header.title')}
          </h1>
        </div>

        <div className="flex items-center space-x-6">
          {/* Monthly Cost Display */}
          {totalCost > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-500">{t('header.totalThisMonth')}</p>
              <p className="text-lg font-bold text-indigo-600">
                ${totalCost.toFixed(2)}
              </p>
            </div>
          )}

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <>
                {/* User Info */}
                {user && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || user.email || 'User'} 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <UserIcon className="w-8 h-8 text-gray-400" />
                    )}
                    <span className="hidden md:block">
                      {user.displayName || user.email}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onManageCategoriesClick}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {t('header.manageCategories')}
                  </button>
                  
                  <button
                    onClick={onAddClick}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {t('header.addSite')}
                  </button>

                  <button
                    onClick={onSignOut}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:block ml-2">{t('auth.signOutButton')}</span>
                  </button>
                </div>
              </>
            ) : (
              /* Sign In Button */
              <button
                onClick={onSignIn}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <LogIn className="h-5 w-5 mr-2" />
                {t('auth.signInButton')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;