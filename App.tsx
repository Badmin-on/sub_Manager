
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ShortcutGrid from './components/ShortcutGrid';
import AddShortcutModal from './components/AddShortcutModal';
import EditShortcutModal from './components/EditShortcutModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import SupabaseApp from './SupabaseApp';
import type { Shortcut, Category } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { sampleShortcuts, sampleCategories } from './data/sampleData';
import toast from 'react-hot-toast';
import { Cloud, HardDrive, ToggleLeft, ToggleRight } from 'lucide-react';

const App: React.FC = () => {
  const [useSupabase, setUseSupabase] = useLocalStorage<boolean>('useSupabase', false);
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

  // Supabase 모드 렌더링
  if (useSupabase) {
    return <SupabaseApp />;
  }

  // 로컬 스토리지 모드 렌더링
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모드 스위치 */}
      <div className="bg-gray-100 border-b border-gray-200 py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">저장 모드:</span>
            <div className="flex items-center space-x-2">
              <HardDrive size={16} className="text-gray-600" />
              <span className="text-sm text-gray-600">로컬</span>
              <button
                onClick={() => setUseSupabase(!useSupabase)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {useSupabase ? (
                  <ToggleRight className="text-blue-500" size={24} />
                ) : (
                  <ToggleLeft className="text-gray-400" size={24} />
                )}
              </button>
              <span className="text-sm text-gray-600">클라우드</span>
              <Cloud size={16} className="text-gray-600" />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            💡 클라우드 모드: 실시간 동기화 + 인증 기능
          </div>
        </div>
      </div>
      
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
