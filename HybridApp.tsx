import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ShortcutGrid from './components/ShortcutGrid';
import AddShortcutModal from './components/AddShortcutModal';
import EditShortcutModal from './components/EditShortcutModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import { useHybridStorage } from './hooks/useHybridStorage';
import type { Shortcut, Category } from './types';
import { sampleShortcuts, sampleCategories } from './data/sampleData';
import { Loader2, Wifi, WifiOff, Cloud, HardDrive, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const HybridApp: React.FC = () => {
  const {
    shortcuts,
    categories,
    loading,
    state,
    setShortcuts,
    setCategories,
    addToSyncQueue,
    syncToCloud,
    forceLocalMode,
    clearSyncQueue
  } = useHybridStorage();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기 샘플 데이터 로딩
  useEffect(() => {
    if (!isInitialized && shortcuts.length === 0 && categories.length === 0 && !loading) {
      const initializeData = () => {
        console.log('📊 초기 샘플 데이터 로딩...');
        
        // 카테고리 먼저 추가
        const categoriesWithIds = sampleCategories.map(cat => ({
          ...cat,
          id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
        
        setCategories(categoriesWithIds);
        
        // 바로가기 추가 (카테고리 ID 매핑)
        const shortcutsWithIds = sampleShortcuts.map(shortcut => {
          const matchingCategory = categoriesWithIds.find(cat => 
            cat.name === shortcut.categoryId
          );
          
          return {
            ...shortcut,
            id: `shortcut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            categoryId: matchingCategory?.id
          };
        });
        
        setShortcuts(shortcutsWithIds);
        
        // 클라우드 모드인 경우 동기화 큐에 추가
        if (state.isOnline) {
          categoriesWithIds.forEach(cat => {
            addToSyncQueue({
              id: cat.id,
              type: 'category',
              action: 'create',
              data: cat
            });
          });
          
          shortcutsWithIds.forEach(shortcut => {
            addToSyncQueue({
              id: shortcut.id,
              type: 'shortcut',
              action: 'create',
              data: shortcut
            });
          });
          
          toast.success('초기 데이터가 추가되었습니다. 클라우드 동기화를 시작합니다.');
          setTimeout(syncToCloud, 1000);
        } else {
          toast.success('초기 데이터가 로컬에 저장되었습니다.');
        }
        
        setIsInitialized(true);
      };

      setTimeout(initializeData, 500);
    }
  }, [isInitialized, shortcuts.length, categories.length, loading, state.isOnline, setShortcuts, setCategories, addToSyncQueue, syncToCloud]);

  // 바로가기 관리 함수들
  const handleAddShortcut = async (newShortcut: Omit<Shortcut, 'id'>) => {
    const shortcutWithId: Shortcut = {
      ...newShortcut,
      id: `shortcut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setShortcuts(prev => [shortcutWithId, ...prev]);
    
    if (state.isOnline) {
      addToSyncQueue({
        id: shortcutWithId.id,
        type: 'shortcut',
        action: 'create',
        data: shortcutWithId
      });
    }
    
    setIsAddModalOpen(false);
    toast.success('바로가기가 추가되었습니다!');
  };

  const handleUpdateShortcut = async (updatedShortcut: Shortcut) => {
    setShortcuts(prev => 
      prev.map(s => s.id === updatedShortcut.id ? updatedShortcut : s)
    );
    
    if (state.isOnline) {
      addToSyncQueue({
        id: updatedShortcut.id,
        type: 'shortcut',
        action: 'update',
        data: updatedShortcut
      });
    }
    
    setEditingShortcut(null);
    toast.success('바로가기가 수정되었습니다!');
  };

  const handleDeleteShortcut = async (id: string) => {
    const shortcutToDelete = shortcuts.find(s => s.id === id);
    if (!shortcutToDelete) return;

    setShortcuts(prev => prev.filter(s => s.id !== id));
    
    if (state.isOnline) {
      addToSyncQueue({
        id: id,
        type: 'shortcut',
        action: 'delete',
        data: { id }
      });
    }
    
    toast.success('바로가기가 삭제되었습니다!');
  };

  // 카테고리 관리 함수들
  const handleAddCategory = async (name: string) => {
    const categoryWithId: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name
    };

    setCategories(prev => [...prev, categoryWithId]);
    
    if (state.isOnline) {
      addToSyncQueue({
        id: categoryWithId.id,
        type: 'category',
        action: 'create',
        data: categoryWithId
      });
    }
    
    toast.success('카테고리가 추가되었습니다!');
    return true;
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    const updatedCategory = { id, name };
    
    setCategories(prev => 
      prev.map(c => c.id === id ? updatedCategory : c)
    );
    
    if (state.isOnline) {
      addToSyncQueue({
        id: id,
        type: 'category',
        action: 'update',
        data: updatedCategory
      });
    }
    
    toast.success('카테고리가 수정되었습니다!');
    return true;
  };

  const handleDeleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    
    if (state.isOnline) {
      addToSyncQueue({
        id: id,
        type: 'category',
        action: 'delete',
        data: { id }
      });
    }
    
    toast.success('카테고리가 삭제되었습니다!');
    return true;
  };

  const handleImportData = async (importedShortcuts: Shortcut[]) => {
    const shortcutsWithIds = importedShortcuts.map(shortcut => ({
      ...shortcut,
      id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    setShortcuts(prev => [...shortcutsWithIds, ...prev]);
    
    if (state.isOnline) {
      shortcutsWithIds.forEach(shortcut => {
        addToSyncQueue({
          id: shortcut.id,
          type: 'shortcut',
          action: 'create',
          data: shortcut
        });
      });
    }

    toast.success(`${shortcutsWithIds.length}개의 바로가기를 가져왔습니다!`);
  };

  // 연결 상태 표시 컴포넌트
  const ConnectionStatus = () => {
    const getStatusColor = () => {
      switch (state.mode) {
        case 'cloud': return 'bg-gradient-to-r from-green-500 via-blue-500 to-purple-500';
        case 'syncing': return 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 animate-pulse';
        case 'local': return 'bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700';
        default: return 'bg-gradient-to-r from-red-500 via-pink-500 to-red-600';
      }
    };

    const getStatusIcon = () => {
      switch (state.mode) {
        case 'cloud': return <Cloud size={18} className="animate-pulse" />;
        case 'syncing': return <RefreshCw size={18} className="animate-spin" />;
        case 'local': return <HardDrive size={18} />;
        default: return <WifiOff size={18} />;
      }
    };

    const getStatusText = () => {
      switch (state.mode) {
        case 'cloud': return '클라우드 동기화 활성';
        case 'syncing': return '동기화 중...';
        case 'local': return '로컬 모드';
        default: return '오프라인';
      }
    };

    return (
      <div className={`text-white text-center py-3 shadow-sm transition-all duration-300 ${getStatusColor()}`}>
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          
          {state.pendingChanges > 0 && (
            <>
              <span className="text-white/80">|</span>
              <div className="flex items-center space-x-2">
                <AlertCircle size={16} />
                <span className="text-white/90">대기 중: {state.pendingChanges}개</span>
              </div>
            </>
          )}
          
          {state.lastSync && (
            <>
              <span className="text-white/80">|</span>
              <div className="flex items-center space-x-1">
                <CheckCircle2 size={16} />
                <span className="text-white/80 text-sm">
                  마지막 동기화: {state.lastSync.toLocaleTimeString()}
                </span>
              </div>
            </>
          )}
          
          {/* 수동 동기화 버튼 */}
          {state.isOnline && state.pendingChanges > 0 && (
            <button
              onClick={syncToCloud}
              disabled={state.mode === 'syncing'}
              className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
            >
              동기화
            </button>
          )}
          
          {/* 로컬 모드 전환 버튼 */}
          {state.mode !== 'local' && (
            <button
              onClick={forceLocalMode}
              className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors"
            >
              로컬 모드
            </button>
          )}
        </div>
      </div>
    );
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">데이터를 불러오고 있습니다...</p>
          <p className="text-gray-500 text-sm mt-2">하이브리드 스토리지 초기화 중</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* 연결 상태 표시 */}
      <ConnectionStatus />

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

export default HybridApp;