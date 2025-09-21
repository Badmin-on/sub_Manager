import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import ShortcutGrid from './components/ShortcutGrid';
import AddShortcutModal from './components/AddShortcutModal';
import EditShortcutModal from './components/EditShortcutModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import useFirebaseStorage from './hooks/useFirebaseStorage';
import type { Shortcut } from './types';

const App: React.FC = () => {
  const {
    shortcuts,
    categories,
    isLoading,
    isSignedIn,
    user,
    signIn,
    signOut,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    addCategory,
    updateCategory,
    deleteCategory
  } = useFirebaseStorage();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);

  const handleAddShortcut = async (shortcutData: Omit<Shortcut, 'id'>) => {
    await addShortcut(shortcutData);
    setIsAddModalOpen(false);
  };

  const handleUpdateShortcut = async (shortcut: Shortcut) => {
    await updateShortcut(shortcut);
    setEditingShortcut(null);
  };

  const handleDeleteShortcut = async (id: string) => {
    await deleteShortcut(id);
  };

  const handleAddCategory = async (name: string) => {
    await addCategory({ name });
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    await updateCategory({ id, name });
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
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
        user={user}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <ShortcutGrid 
          shortcuts={shortcuts} 
          categories={categories}
          onDelete={handleDeleteShortcut}
          onEdit={(shortcut) => setEditingShortcut(shortcut)}
          isSignedIn={isSignedIn}
          isLoading={isLoading}
        />
      </main>

      {/* Modals */}
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

      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default App;