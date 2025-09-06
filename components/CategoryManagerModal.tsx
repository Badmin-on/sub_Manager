
import React, { useState, useRef, useEffect } from 'react';
import type { Category } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (name: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose, categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
  const { t } = useLanguage();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCategory && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCategory]);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory && editingCategory.name.trim()) {
      onUpdateCategory(editingCategory.id, editingCategory.name.trim());
      setEditingCategory(null);
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategory({ ...category });
  };
  
  const cancelEditing = () => {
    setEditingCategory(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('categoryModal.deleteConfirm'))) {
        onDeleteCategory(id);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('categoryModal.title')}</h2>
             <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>
          
          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
            {categories.length > 0 ? categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                {editingCategory?.id === cat.id ? (
                  <form onSubmit={handleUpdateSubmit} className="flex-grow flex items-center space-x-2">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="flex-grow px-2 py-1 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <button type="submit" className="p-1 text-green-600 hover:text-green-800" aria-label={t('categoryModal.save')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </button>
                    <button type="button" onClick={cancelEditing} className="p-1 text-gray-500 hover:text-gray-700" aria-label={t('categoryModal.cancel')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.697a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="text-gray-800">{cat.name}</span>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => startEditing(cat)} className="p-1 text-gray-500 hover:text-indigo-600" aria-label={t('categoryModal.edit', {name: cat.name})}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1 text-gray-500 hover:text-red-600" aria-label={t('categoryModal.delete', {name: cat.name})}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )) : <p className="text-center text-gray-500">{t('categoryModal.noCategories')}</p>}
          </div>

          <form onSubmit={handleAddSubmit}>
            <label htmlFor="new-category-name" className="block text-sm font-medium text-gray-700">{t('categoryModal.addNew')}</label>
            <div className="mt-1 flex space-x-2">
                <input
                  type="text"
                  id="new-category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-grow block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('categoryModal.addNewPlaceholder')}
                />
                 <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {t('categoryModal.add')}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagerModal;