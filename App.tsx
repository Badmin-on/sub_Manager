
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

  // 강제 로컬 모드 (Supabase 연결 문제로 인해 임시 활성화)
  const forceLocalMode = true; // Supabase 연결 문제 해결 시 false로 변경

  // MCP 연결 실패 시 자동 로컬 모드 전환
  useEffect(() => {
    const handleConnectionFailure = (event: CustomEvent) => {
      if (event.detail.suggestion === 'switch-to-local-mode' && useSupabase) {
        console.log('🔄 MCP 연결 실패로 로컬 모드로 자동 전환');
        setUseSupabase(false);
        toast.success('로컬 모드로 전환되었습니다');
      }
    };

    window.addEventListener('supabase-connection-failed', handleConnectionFailure as EventListener);

    return () => {
      window.removeEventListener('supabase-connection-failed', handleConnectionFailure as EventListener);
    };
  }, [useSupabase, setUseSupabase]);
  const [shortcuts, setShortcuts] = useLocalStorage<Shortcut[]>('shortcuts', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', []);

  const [isInitialized, setIsInitialized] = useState(false);

  // 디버그 로그 (개발 모드에서만)
  if (import.meta.env.DEV) {
    console.log('🔍 App 상태:', {
      useSupabase,
      shortcutsCount: shortcuts.length,
      categoriesCount: categories.length,
      isInitialized,
      shortcuts: shortcuts.slice(0, 3) // 처음 3개만 출력
    });
  }

  // Initialize with sample data if no data exists (LOCAL MODE ONLY)
  useEffect(() => {
    const initializeLocalData = () => {
      console.log('🚀 초기 샘플 데이터 로딩 중... (로컬 모드)');

      // 강제로 데이터 초기화
      setCategories([...sampleCategories]);
      setShortcuts([...sampleShortcuts]);
      setIsInitialized(true);

      // 로컬스토리지에 직접 저장도 시도
      try {
        localStorage.setItem('categories', JSON.stringify(sampleCategories));
        localStorage.setItem('shortcuts', JSON.stringify(sampleShortcuts));
        console.log('📁 로컬스토리지에 직접 저장 완료');
      } catch (error) {
        console.error('❌ 로컬스토리지 저장 실패:', error);
      }

      toast.success('샘플 데이터가 로드되었습니다!');
      console.log('✅ 초기 데이터 로딩 완료:', {
        shortcuts: sampleShortcuts.length,
        categories: sampleCategories.length
      });
    };

    // Only initialize sample data when in local mode, no data exists, and not yet initialized
    if ((forceLocalMode || !useSupabase) && !isInitialized) {
      // Check both state and localStorage to ensure no data exists
      const hasLocalShortcuts = shortcuts.length > 0;
      const hasLocalCategories = categories.length > 0;
      const hasStoredShortcuts = localStorage.getItem('shortcuts');
      const hasStoredCategories = localStorage.getItem('categories');

      console.log('🔍 로컬 모드 데이터 체크:', {
        hasLocalShortcuts,
        hasLocalCategories,
        hasStoredShortcuts: !!hasStoredShortcuts,
        hasStoredCategories: !!hasStoredCategories
      });

      if (!hasLocalShortcuts && !hasLocalCategories && !hasStoredShortcuts && !hasStoredCategories) {
        // Use a small delay to ensure the component is fully mounted
        setTimeout(initializeLocalData, 100);
      } else if (forceLocalMode && !hasLocalShortcuts && !hasLocalCategories) {
        // 강제 로컬 모드에서 상태는 비어있지만 스토리지에는 데이터가 있는 경우
        console.log('🔄 강제 로컬 모드: 저장된 데이터 복원 중...');
        try {
          if (hasStoredShortcuts) {
            const storedShortcuts = JSON.parse(hasStoredShortcuts);
            setShortcuts(storedShortcuts);
          }
          if (hasStoredCategories) {
            const storedCategories = JSON.parse(hasStoredCategories);
            setCategories(storedCategories);
          }
          if (!hasStoredShortcuts && !hasStoredCategories) {
            // 스토리지도 비어있으면 샘플 데이터 로드
            setTimeout(initializeLocalData, 100);
          } else {
            setIsInitialized(true);
          }
        } catch (error) {
          console.error('저장된 데이터 복원 실패:', error);
          setTimeout(initializeLocalData, 100);
        }
      } else {
        setIsInitialized(true);
      }
    }

    // Reset initialization flag when switching modes
    if (!forceLocalMode && useSupabase && isInitialized) {
      setIsInitialized(false);
    }
  }, [useSupabase, isInitialized, shortcuts.length, categories.length, forceLocalMode]);
  
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

  // Supabase 모드 렌더링 (향상된 폴백 처리)
  if (useSupabase && !forceLocalMode) {
    return <SupabaseApp />;
  }

  // 로컬 스토리지 모드 렌더링
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* 모드 스위치 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-gray-700">저장 모드:</span>
            <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2">
              <HardDrive size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-600">로컬</span>
              <button
                onClick={() => setUseSupabase(!useSupabase)}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all duration-200"
              >
                {useSupabase ? (
                  <ToggleRight className="text-blue-500" size={24} />
                ) : (
                  <ToggleLeft className="text-gray-400 hover:text-blue-400" size={24} />
                )}
              </button>
              <span className="text-sm font-medium text-gray-600">클라우드</span>
              <Cloud size={16} className="text-gray-600" />
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
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
