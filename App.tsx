
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ShortcutGrid from './components/ShortcutGrid';
import AddShortcutModal from './components/AddShortcutModal';
import EditShortcutModal from './components/EditShortcutModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import type { Shortcut, Category } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { sampleShortcuts, sampleCategories } from './data/sampleData';
import toast from 'react-hot-toast';

const App: React.FC = () => {
  const [shortcuts, setShortcuts] = useLocalStorage<Shortcut[]>('shortcuts', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', []);
  
  // Initialize with sample data if no data exists
  useEffect(() => {
    if (shortcuts.length === 0 && categories.length === 0) {
      setCategories(sampleCategories);
      setShortcuts(sampleShortcuts);
      toast.success('Welcome! Sample data has been loaded for you to explore.');
    }
  }, []);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddShortcut = (newShortcut: Omit<Shortcut, 'id'>) => {
    const shortcutWithId: Shortcut = { ...newShortcut, id: crypto.randomUUID() };
    setShortcuts(prevShortcuts => [...prevShortcuts, shortcutWithId]);
    toast.success('Shortcut added successfully!');
  };

  const handleUpdateShortcut = (updatedShortcut: Shortcut) => {
    setShortcuts(shortcuts.map(s => s.id === updatedShortcut.id ? updatedShortcut : s));
    setEditingShortcut(null);
    toast.success('Shortcut updated successfully!');
  }

  const handleDeleteShortcut = (id: string) => {
    const shortcut = shortcuts.find(s => s.id === id);
    setShortcuts(shortcuts.filter(shortcut => shortcut.id !== id));
    toast.success(`"${shortcut?.name}" deleted successfully!`);
  };
  
  const handleAddCategory = (name: string) => {
    const newCategory: Category = { id: crypto.randomUUID(), name };
    setCategories(prev => [...prev, newCategory]);
  };

  const handleUpdateCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(cat => (cat.id === id ? { ...cat, name } : cat)));
  };

  const handleDeleteCategory = (id: string) => {
    const category = categories.find(c => c.id === id);
    setCategories(prev => prev.filter(cat => cat.id !== id));
    // Uncategorize shortcuts that belonged to the deleted category
    setShortcuts(prev => prev.map(sc => {
      if (sc.categoryId === id) {
        return { ...sc, categoryId: undefined };
      }
      return sc;
    }));
    toast.success(`Category "${category?.name}" deleted successfully!`);
  };
  
  const handleImportData = (importedShortcuts: Shortcut[]) => {
    setShortcuts(prev => [...prev, ...importedShortcuts]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onAddClick={() => setIsAddModalOpen(true)} 
        onManageCategoriesClick={() => setIsCategoryModalOpen(true)}
        shortcuts={shortcuts}
        onSearch={setSearchQuery}
        onImportData={handleImportData}
      />
      <main className="max-w-7xl mx-auto">
        <ShortcutGrid 
          shortcuts={shortcuts} 
          categories={categories}
          onDelete={handleDeleteShortcut}
          onEdit={(shortcut) => setEditingShortcut(shortcut)}
          searchQuery={searchQuery}
          onAddClick={() => setIsAddModalOpen(true)}
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
