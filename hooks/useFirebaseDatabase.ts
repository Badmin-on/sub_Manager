import { useState, useEffect } from 'react';
import { ref, set, get, child, onValue, off, push } from 'firebase/database';
import { database } from '../firebase/config';
import type { Shortcut, Category } from '../types';

interface FirebaseData {
  shortcuts: { [key: string]: Shortcut };
  categories: { [key: string]: Category };
}

const useFirebaseDatabase = () => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Check if Firebase is configured
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, '.info/connected'));
        setIsConnected(snapshot.val());
      } catch (error) {
        console.error('Firebase connection check failed:', error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  // Load data from Firebase
  useEffect(() => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }

    const shortcutsRef = ref(database, 'shortcuts');
    const categoriesRef = ref(database, 'categories');

    const unsubscribeShortcuts = onValue(shortcutsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const shortcutsList = Object.entries(data).map(([id, shortcut]: [string, any]) => ({
          ...shortcut,
          id
        }));
        setShortcuts(shortcutsList);
      } else {
        setShortcuts([]);
      }
    });

    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoriesList = Object.entries(data).map(([id, category]: [string, any]) => ({
          ...category,
          id
        }));
        setCategories(categoriesList);
      } else {
        setCategories([]);
      }
      setIsLoading(false);
    });

    return () => {
      off(shortcutsRef);
      off(categoriesRef);
    };
  }, [isConnected]);

  // Add shortcut
  const addShortcut = async (shortcut: Omit<Shortcut, 'id'>): Promise<void> => {
    if (!isConnected) return;

    try {
      const shortcutsRef = ref(database, 'shortcuts');
      const newShortcutRef = push(shortcutsRef);
      await set(newShortcutRef, shortcut);
    } catch (error) {
      console.error('Failed to add shortcut:', error);
      throw error;
    }
  };

  // Update shortcut
  const updateShortcut = async (shortcut: Shortcut): Promise<void> => {
    if (!isConnected) return;

    try {
      const shortcutRef = ref(database, `shortcuts/${shortcut.id}`);
      const { id, ...shortcutData } = shortcut;
      await set(shortcutRef, shortcutData);
    } catch (error) {
      console.error('Failed to update shortcut:', error);
      throw error;
    }
  };

  // Delete shortcut
  const deleteShortcut = async (id: string): Promise<void> => {
    if (!isConnected) return;

    try {
      const shortcutRef = ref(database, `shortcuts/${id}`);
      await set(shortcutRef, null);
    } catch (error) {
      console.error('Failed to delete shortcut:', error);
      throw error;
    }
  };

  // Add category
  const addCategory = async (category: Omit<Category, 'id'>): Promise<void> => {
    if (!isConnected) return;

    try {
      const categoriesRef = ref(database, 'categories');
      const newCategoryRef = push(categoriesRef);
      await set(newCategoryRef, category);
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  };

  // Update category
  const updateCategory = async (category: Category): Promise<void> => {
    if (!isConnected) return;

    try {
      const categoryRef = ref(database, `categories/${category.id}`);
      const { id, ...categoryData } = category;
      await set(categoryRef, categoryData);
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  };

  // Delete category
  const deleteCategory = async (id: string): Promise<void> => {
    if (!isConnected) return;

    try {
      const categoryRef = ref(database, `categories/${id}`);
      await set(categoryRef, null);
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  };

  return {
    shortcuts,
    categories,
    isLoading,
    isConnected,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    addCategory,
    updateCategory,
    deleteCategory
  };
};

export default useFirebaseDatabase;