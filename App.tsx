import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ShortcutGrid from './components/ShortcutGrid';
import AddShortcutModal from './components/AddShortcutModal';
import EditShortcutModal from './components/EditShortcutModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import ConfigurationModal from './components/ConfigurationModal';
import StorageModeSelector from './components/StorageModeSelector';
import type { Shortcut, Category } from './types';
import useDataStorage from './hooks/useDataStorage';

const App: React.FC = () => {
  const { 
    shortcuts, 
    setShortcuts, 
    categories, 
    setCategories, 
    isLoading, 
    isSignedIn, 
    signIn, 
    signOut,
    isConfigured,
    config,
    setConfig,
    storageMode,
    switchStorageMode,
    addShortcut: addShortcutToStorage,
    updateShortcut: updateShortcutInStorage,
    deleteShortcut: deleteShortcutFromStorage,
    addCategory: addCategoryToStorage,
    updateCategory: updateCategoryInStorage,
    deleteCategory: deleteCategoryFromStorage
  } = useDataStorage();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isStorageModeModalOpen, setIsStorageModeModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);

  const canManageData = isSignedIn || !isConfigured;

  const handleAddShortcut = async (newShortcut: Omit<Shortcut, 'id'>) => {
    try {
      if (addShortcutToStorage) {
        await addShortcutToStorage(newShortcut);
      } else {
        // Fallback for local storage mode
        const shortcutWithId: Shortcut = { ...newShortcut, id: crypto.randomUUID() };
        setShortcuts(prevShortcuts => [...prevShortcuts, shortcutWithId]);
      }
    } catch (error) {
      console.error('Failed to add shortcut:', error);
    }
  };

  const handleUpdateShortcut = async (updatedShortcut: Shortcut) => {
    try {
      if (updateShortcutInStorage) {
        await updateShortcutInStorage(updatedShortcut);
      } else {
        // Fallback for local storage mode
        setShortcuts(shortcuts.map(s => s.id === updatedShortcut.id ? updatedShortcut : s));
      }
      setEditingShortcut(null);
    } catch (error) {
      console.error('Failed to update shortcut:', error);
    }
  }

  const handleDeleteShortcut = async (id: string) => {
    try {
      if (deleteShortcutFromStorage) {
        await deleteShortcutFromStorage(id);
      } else {
        // Fallback for local storage mode
        setShortcuts(shortcuts.filter(shortcut => shortcut.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete shortcut:', error);
    }
  };
  
  const handleAddCategory = async (name: string) => {
    try {
      if (addCategoryToStorage) {
        await addCategoryToStorage({ name });
      } else {
        // Fallback for local storage mode
        const newCategory: Category = { id: crypto.randomUUID(), name };
        setCategories(prev => [...prev, newCategory]);
      }
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    try {
      if (updateCategoryInStorage) {
        await updateCategoryInStorage({ id, name });
      } else {
        // Fallback for local storage mode
        setCategories(prev => prev.map(cat => (cat.id === id ? { ...cat, name } : cat)));
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      if (deleteCategoryFromStorage) {
        await deleteCategoryFromStorage(id);
        // For storage modes other than local, also uncategorize shortcuts manually
        if (storageMode !== 'local') {
          shortcuts.forEach(shortcut => {
            if (shortcut.categoryId === id && updateShortcutInStorage) {
              updateShortcutInStorage({ ...shortcut, categoryId: undefined });
            }
          });
        }
      } else {
        // Fallback for local storage mode
        setCategories(prev => prev.filter(cat => cat.id !== id));
        // Uncategorize shortcuts that belonged to the deleted category
        setShortcuts(prev => prev.map(sc => {
          if (sc.categoryId === id) {
            return { ...sc, categoryId: undefined };
          }
          return sc;
        }));
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onAddClick={() => setIsAddModalOpen(true)} 
        onManageCategoriesClick={() => setIsCategoryModalOpen(true)}
        shortcuts={shortcuts}
        isSignedIn={isSignedIn}
        onSignIn={signIn}
        onSignOut={signOut}
        canManageData={canManageData}
        isConfigured={isConfigured}
        onConfigureClick={() => setIsConfigModalOpen(true)}
        storageMode={storageMode}
        onStorageModeClick={() => setIsStorageModeModalOpen(true)}
      />
      <main className="max-w-7xl mx-auto">
        <ShortcutGrid 
          shortcuts={shortcuts} 
          categories={categories}
          onDelete={handleDeleteShortcut}
          onEdit={(shortcut) => setEditingShortcut(shortcut)}
          isSignedIn={isSignedIn}
          isLoading={isLoading}
          isConfigured={isConfigured}
        />
      </main>
      <AddShortcutModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddShortcut}
        categories={categories}
      />
      <EditShortcutModal
        isOpen={!!editingShortcut}
        onClose={() => setEditingShortcut(null)}
        onUpdate={handleUpdateShortcut}
        shortcut={editingShortcut}
        categories={categories}
      />
      <CategoryManagerModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />
      <ConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={(newConfig) => setConfig(newConfig)}
        onDisconnect={() => setConfig(null)}
        initialConfig={config}
      />
      <StorageModeSelector
        currentMode={storageMode}
        onModeChange={switchStorageMode}
        isOpen={isStorageModeModalOpen}
        onClose={() => setIsStorageModeModalOpen(false)}
      />
    </div>
  );
};

export default App;