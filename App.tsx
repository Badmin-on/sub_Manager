import React, { useState } from 'react';
import Header from './components/Header';
import ShortcutGrid from './components/ShortcutGrid';
import AddShortcutModal from './components/AddShortcutModal';
import EditShortcutModal from './components/EditShortcutModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import type { Shortcut, Category } from './types';
import { useLanguage } from './context/LanguageContext';

const App: React.FC = () => {
  // Sample data for testing
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([
    {
      id: '1',
      name: 'Netflix',
      url: 'https://netflix.com',
      categoryId: 'entertainment',
      paymentAmount: 15.99,
      paymentDate: '2024-01-15',
      paymentFrequency: 'monthly'
    },
    {
      id: '2', 
      name: 'GitHub',
      url: 'https://github.com',
      categoryId: 'dev'
    }
  ]);

  const [categories, setCategories] = useState<Category[]>([
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'dev', name: 'Development' },
    { id: 'work', name: 'Work' }
  ]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);

  const { t } = useLanguage();

  const handleAddShortcut = (newShortcut: Omit<Shortcut, 'id'>) => {
    const shortcutWithId: Shortcut = { ...newShortcut, id: crypto.randomUUID() };
    setShortcuts(prevShortcuts => [...prevShortcuts, shortcutWithId]);
    setIsAddModalOpen(false);
  };

  const handleUpdateShortcut = (updatedShortcut: Shortcut) => {
    setShortcuts(shortcuts.map(s => s.id === updatedShortcut.id ? updatedShortcut : s));
    setEditingShortcut(null);
  };

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
        isSignedIn={true}
        onSignIn={() => {}}
        onSignOut={() => {}}
        canManageData={true}
        isConfigured={true}
        onConfigureClick={() => {}}
        storageMode="local"
        onStorageModeClick={() => {}}
      />
      <main className="max-w-7xl mx-auto px-4">
        <div className="py-8">
          <h2 className="text-2xl font-bold mb-6">{t('shortcutGrid.uncategorized')}</h2>
          <ShortcutGrid 
            shortcuts={shortcuts} 
            categories={categories}
            onDelete={handleDeleteShortcut}
            onEdit={(shortcut) => setEditingShortcut(shortcut)}
            isSignedIn={true}
            isLoading={false}
            isConfigured={true}
          />
        </div>
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