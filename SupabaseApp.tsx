import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ShortcutGrid from './components/ShortcutGrid';
import AddShortcutModal from './components/AddShortcutModal';
import EditShortcutModal from './components/EditShortcutModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import type { Shortcut, Category } from './types';
import { useSupabaseAuth, useSupabaseShortcuts, useSupabaseCategories } from './hooks/useSupabase';
import { sampleShortcuts, sampleCategories } from './data/sampleData';
import { Loader2, Wifi, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabaseMCP } from './lib/supabase-mcp';

const SupabaseApp: React.FC = () => {
  const { user, loading: authLoading, signIn, signUp, signOut } = useSupabaseAuth();
  const {
    shortcuts,
    loading: shortcutsLoading,
    addShortcut,
    updateShortcut,
    deleteShortcut
  } = useSupabaseShortcuts(user);
  const {
    categories,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory
  } = useSupabaseCategories(user);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mcpConnectionStatus, setMcpConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');

  // 초기 샘플 데이터 로딩 (한 번만 실행)
  const [isInitialized, setIsInitialized] = useState(false);

  // MCP Supabase 매니저 초기화
  useEffect(() => {
    const initializeMCP = async () => {
      if (user && mcpConnectionStatus === 'connecting') {
        try {
          console.log('🚀 MCP Supabase 초기화 시작...');
          setMcpConnectionStatus('connecting');

          const success = await supabaseMCP.initialize();

          if (success) {
            setMcpConnectionStatus('connected');

            // 실시간 동기화 설정
            await supabaseMCP.setupRealtimeSync(
              (newShortcuts) => {
                console.log('🔄 실시간 shortcuts 업데이트:', newShortcuts.length);
              },
              (newCategories) => {
                console.log('🔄 실시간 categories 업데이트:', newCategories.length);
              }
            );

          } else {
            setMcpConnectionStatus('failed');
          }

        } catch (error) {
          console.error('MCP 초기화 실패:', error);
          setMcpConnectionStatus('failed');
        }
      }
    };

    // 연결 실패 이벤트 리스너
    const handleConnectionFailure = (event: CustomEvent) => {
      if (event.detail.suggestion === 'switch-to-local-mode') {
        toast.error('Supabase 연결 불가: 로컬 모드로 전환하는 것을 권장합니다.');
      }
    };

    window.addEventListener('supabase-connection-failed', handleConnectionFailure as EventListener);

    initializeMCP();

    return () => {
      window.removeEventListener('supabase-connection-failed', handleConnectionFailure as EventListener);
    };
  }, [user, mcpConnectionStatus]);

  useEffect(() => {
    if (user && !isInitialized && shortcuts.length === 0 && categories.length === 0 && !shortcutsLoading && !categoriesLoading) {
      const initializeData = async () => {
        try {
          console.log('📡 Supabase 초기 데이터 로딩 시작...');
          setIsInitialized(true);

          // 카테고리 먼저 추가
          for (const category of sampleCategories) {
            try {
              await addCategory(category.name);
              console.log(`카테고리 추가: ${category.name}`);
            } catch (error) {
              console.error(`카테고리 추가 실패: ${category.name}`, error);
            }
          }

          // 잠시 대기 후 바로가기 추가
          setTimeout(async () => {
            for (const shortcut of sampleShortcuts) {
              try {
                await addShortcut(shortcut);
                console.log(`바로가기 추가: ${shortcut.name}`);
              } catch (error) {
                console.error(`바로가기 추가 실패: ${shortcut.name}`, error);
              }
            }
            toast.success('초기 샘플 데이터가 추가되었습니다!');
          }, 2000);

        } catch (error) {
          console.error('초기 데이터 로딩 실패:', error);
          toast.error('초기 데이터 로딩에 실패했습니다. 수동으로 추가해주세요.');
        }
      };

      initializeData();
    }
  }, [user, isInitialized, shortcuts.length, categories.length, shortcutsLoading, categoriesLoading]);

  // Supabase 핸들러들 (직접 DB 연동)
  const handleAddShortcut = async (newShortcut: Omit<Shortcut, 'id'>) => {
    const success = await addShortcut(newShortcut);
    if (success) {
      setIsAddModalOpen(false);
    }
  };

  const handleUpdateShortcut = async (updatedShortcut: Shortcut) => {
    const success = await updateShortcut(updatedShortcut);
    if (success) {
      setEditingShortcut(null);
    }
  };

  const handleDeleteShortcut = async (id: string) => {
    await deleteShortcut(id);
  };

  const handleAddCategory = async (name: string) => {
    return await addCategory(name);
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    return await updateCategory(id, name);
  };

  const handleDeleteCategory = async (id: string) => {
    return await deleteCategory(id);
  };

  const handleImportData = async (importedShortcuts: Shortcut[]) => {
    if (!user) {
      toast.error('사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    let successCount = 0;
    for (const shortcut of importedShortcuts) {
      const success = await addShortcut(shortcut);
      if (success) successCount++;
    }

    toast.success(`${successCount}개의 바로가기를 성공적으로 가져왔습니다!`);
  };

  // 로딩 상태
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4" />
          <p className="text-gray-600">인증 상태를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }


  // 메인 화면 (항상 DB 연동 모드)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* DB 연동 상태 표시 (MCP 통합) */}
      <div className={`text-white text-center py-3 shadow-sm transition-all duration-300 ${
        mcpConnectionStatus === 'connected'
          ? 'bg-gradient-to-r from-green-500 via-blue-500 to-purple-500'
          : mcpConnectionStatus === 'connecting'
          ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 animate-pulse'
          : 'bg-gradient-to-r from-red-500 via-pink-500 to-red-600'
      }`}>
        <div className="flex items-center justify-center space-x-3">
          <div className="flex items-center space-x-2">
            {mcpConnectionStatus === 'connected' && <Wifi size={18} className="animate-pulse" />}
            {mcpConnectionStatus === 'connecting' && <Loader2 size={18} className="animate-spin" />}
            {mcpConnectionStatus === 'failed' && <AlertCircle size={18} />}
            <span className="font-medium">
              {mcpConnectionStatus === 'connected' && 'Supabase MCP 실시간 동기화'}
              {mcpConnectionStatus === 'connecting' && 'MCP 연결 중...'}
              {mcpConnectionStatus === 'failed' && 'MCP 연결 실패 - 로컬 모드 권장'}
            </span>
          </div>
          <span className="text-white/80">|</span>
          <span className="text-white/90 font-medium">
            {user?.email || '자동 로그인 사용자'}
          </span>
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
        {(shortcutsLoading || categoriesLoading) ? (
          <div className="min-h-screen bg-gray-50/50 flex items-center justify-center py-20">
            <div className="text-center bg-white p-10 rounded-3xl shadow-lg border border-gray-100">
              <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-6" />
              <p className="text-gray-600 text-lg font-medium">데이터를 불러오고 있습니다...</p>
              <p className="text-gray-500 text-sm mt-2">Supabase DB와 실시간 동기화 중입니다</p>
            </div>
          </div>
        ) : (
          <ShortcutGrid
            shortcuts={shortcuts}
            categories={categories}
            onDelete={handleDeleteShortcut}
            onEdit={(shortcut) => setEditingShortcut(shortcut)}
            searchQuery={searchQuery}
            onAddClick={() => setIsAddModalOpen(true)}
          />
        )}
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

export default SupabaseApp;