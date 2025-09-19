import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ShortcutGrid from './components/ShortcutGrid';
import AddShortcutModal from './components/AddShortcutModal';
import EditShortcutModal from './components/EditShortcutModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import type { Shortcut, Category } from './types';
import useGoogleSheets from './hooks/useGoogleDrive';

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
    isConfigured
  } = useGoogleSheets();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);

  const canManageData = isSignedIn || !isConfigured;

  const handleAddShortcut = (newShortcut: Omit<Shortcut, 'id'>) => {
    const shortcutWithId: Shortcut = { ...newShortcut, id: crypto.randomUUID() };
    setShortcuts(prevShortcuts => [...prevShortcuts, shortcutWithId]);
  };

  const handleUpdateShortcut = (updatedShortcut: Shortcut) => {
    setShortcuts(shortcuts.map(s => s.id === updatedShortcut.id ? updatedShortcut : s));
    setEditingShortcut(null);
  }

  const handleDeleteShortcut = (id: string) => {
    setShortcuts(shortcuts.filter(shortcut => shortcut.id !== id));
  };
  
  const handleAddCategory = (name: string) => {
    const newCategory: Category = { id: crypto.randomUUID(), name };
    setCategories(prev => [...prev, newCategory]);
  };

  const handleUpdateCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(cat => (cat.id === id ? { ...cat, name } : cat)));
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    // Uncategorize shortcuts that belonged to the deleted category
    setShortcuts(prev => prev.map(sc => {
      if (sc.categoryId === id) {
        return { ...sc, categoryId: undefined };
      }
      return sc;
    }));
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
    </div>
  );
};

export default App;
