import React, { useState } from 'react';
import Header from './components/Header';
import ShortcutGrid from './components/ShortcutGrid';
import AddShortcutModal from './components/AddShortcutModal';
import EditShortcutModal from './components/EditShortcutModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import AuthModal from './components/AuthModal';
import type { Shortcut, Category } from './types';
import { useSupabaseAuth, useSupabaseShortcuts, useSupabaseCategories } from './hooks/useSupabase';
import { LogIn, LogOut, User, Loader2, Cloud, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      toast.error('로그인이 필요합니다.');
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

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              LinkHub Manager 🚀
            </h1>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <LogIn size={16} />
              <span>로그인</span>
            </button>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="max-w-4xl mx-auto py-16 px-4 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Cloud className="text-white" size={48} />
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              실시간 동기화 LinkHub Manager
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Supabase 기반 실시간 동기화로 모든 기기에서 <br />
              링크와 구독 정보를 안전하게 관리하세요
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="p-6 bg-blue-50 rounded-xl">
                <Wifi className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">실시간 동기화</h3>
                <p className="text-gray-600 text-sm">
                  여러 기기에서 실시간으로 데이터가 동기화됩니다
                </p>
              </div>
              
              <div className="p-6 bg-green-50 rounded-xl">
                <User className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">개인 계정</h3>
                <p className="text-gray-600 text-sm">
                  안전한 개인 계정으로 데이터를 보호합니다
                </p>
              </div>
              
              <div className="p-6 bg-purple-50 rounded-xl">
                <Cloud className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">클라우드 저장</h3>
                <p className="text-gray-600 text-sm">
                  Supabase 클라우드에 안전하게 데이터 저장
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="btn-primary text-lg px-8 py-4 flex items-center space-x-3 mx-auto"
            >
              <LogIn size={20} />
              <span>시작하기 - 로그인/회원가입</span>
            </button>

            <p className="text-sm text-gray-500 mt-6">
              💡 Supabase 프로젝트가 설정되지 않은 경우 데모 모드로 작동합니다
            </p>
          </div>
        </main>

        {/* 인증 모달 */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSignIn={signIn}
          onSignUp={signUp}
        />
      </div>
    );
  }

  // 로그인된 사용자 화면
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 실시간 상태 표시 */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-center py-2 text-sm">
        <div className="flex items-center justify-center space-x-2">
          <Wifi size={16} className="animate-pulse" />
          <span>실시간 동기화 활성화됨 | {user.email}</span>
          <button 
            onClick={signOut}
            className="ml-4 hover:bg-white/20 px-2 py-1 rounded text-xs flex items-center space-x-1"
          >
            <LogOut size={12} />
            <span>로그아웃</span>
          </button>
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
        {shortcutsLoading || categoriesLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-gray-600">데이터를 불러오고 있습니다...</p>
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