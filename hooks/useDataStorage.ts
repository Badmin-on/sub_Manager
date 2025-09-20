import { useState, useEffect } from 'react';
import useGoogleSheets from './useGoogleDrive';
import useFirebaseDatabase from './useFirebaseDatabase';
import useLocalStorage from './useLocalStorage';
import type { Shortcut, Category } from '../types';

type StorageMode = 'local' | 'firebase' | 'google-sheets';

const useDataStorage = () => {
  const [storageMode, setStorageMode] = useLocalStorage<StorageMode>('storage-mode', 'local');
  
  const googleSheetsHook = useGoogleSheets();
  const firebaseHook = useFirebaseDatabase();
  
  // Local storage states
  const [localShortcuts, setLocalShortcuts] = useLocalStorage<Shortcut[]>('shortcuts', []);
  const [localCategories, setLocalCategories] = useLocalStorage<Category[]>('categories', []);

  // Return appropriate data based on storage mode
  const getStorageData = () => {
    switch (storageMode) {
      case 'firebase':
        return {
          ...firebaseHook,
          setShortcuts: (shortcuts: Shortcut[] | ((prev: Shortcut[]) => Shortcut[])) => {
            // Firebase hook handles updates automatically via real-time listeners
            console.log('Firebase shortcuts updated automatically');
          },
          setCategories: (categories: Category[] | ((prev: Category[]) => Category[])) => {
            // Firebase hook handles updates automatically via real-time listeners
            console.log('Firebase categories updated automatically');
          },
          isSignedIn: firebaseHook.isConnected,
          signIn: () => console.log('Firebase connection is automatic'),
          signOut: () => console.log('Firebase disconnection not implemented'),
          isConfigured: firebaseHook.isConnected,
          config: null,
          setConfig: () => console.log('Firebase config not editable'),
          storageMode
        };
      
      case 'google-sheets':
        return {
          ...googleSheetsHook,
          storageMode
        };
      
      default: // 'local'
        return {
          shortcuts: localShortcuts,
          categories: localCategories,
          setShortcuts: setLocalShortcuts,
          setCategories: setLocalCategories,
          isLoading: false,
          isSignedIn: false,
          signIn: () => console.log('Local storage mode - no sign in needed'),
          signOut: () => console.log('Local storage mode - no sign out needed'),
          isConfigured: false,
          config: null,
          setConfig: () => console.log('Local storage mode - no config needed'),
          storageMode,
          // Firebase-like methods for local storage
          addShortcut: async (shortcut: Omit<Shortcut, 'id'>) => {
            const newShortcut = { ...shortcut, id: crypto.randomUUID() };
            setLocalShortcuts(prev => [...prev, newShortcut]);
          },
          updateShortcut: async (shortcut: Shortcut) => {
            setLocalShortcuts(prev => prev.map(s => s.id === shortcut.id ? shortcut : s));
          },
          deleteShortcut: async (id: string) => {
            setLocalShortcuts(prev => prev.filter(s => s.id !== id));
          },
          addCategory: async (category: Omit<Category, 'id'>) => {
            const newCategory = { ...category, id: crypto.randomUUID() };
            setLocalCategories(prev => [...prev, newCategory]);
          },
          updateCategory: async (category: Category) => {
            setLocalCategories(prev => prev.map(c => c.id === category.id ? category : c));
          },
          deleteCategory: async (id: string) => {
            setLocalCategories(prev => prev.filter(c => c.id !== id));
            // Also uncategorize shortcuts
            setLocalShortcuts(prev => prev.map(s => 
              s.categoryId === id ? { ...s, categoryId: undefined } : s
            ));
          },
          isConnected: true
        };
    }
  };

  const switchStorageMode = (newMode: StorageMode) => {
    setStorageMode(newMode);
  };

  return {
    ...getStorageData(),
    storageMode,
    switchStorageMode
  };
};

export default useDataStorage;