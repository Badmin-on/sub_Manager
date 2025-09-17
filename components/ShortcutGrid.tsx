
import React, { useMemo } from 'react';
import type { Shortcut, Category } from '../types';
import ShortcutItem from './ShortcutItem';
import { useLanguage } from '../context/LanguageContext';
import { FolderOpen, Plus } from 'lucide-react';

interface ShortcutGridProps {
  shortcuts: Shortcut[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (shortcut: Shortcut) => void;
  searchQuery?: string;
  onAddClick?: () => void;
}

const ShortcutGrid: React.FC<ShortcutGridProps> = ({ shortcuts, categories, onDelete, onEdit, searchQuery, onAddClick }) => {
  const { t } = useLanguage();
  
  const filteredShortcuts = useMemo(() => {
    if (!searchQuery) return shortcuts;
    
    const query = searchQuery.toLowerCase();
    return shortcuts.filter(shortcut => 
      shortcut.name.toLowerCase().includes(query) ||
      shortcut.url.toLowerCase().includes(query)
    );
  }, [shortcuts, searchQuery]);
  
  const groupedShortcuts = useMemo(() => {
    const grouped: { [key: string]: Shortcut[] } = {
      uncategorized: []
    };
    
    categories.forEach(cat => {
      grouped[cat.id] = [];
    });

    filteredShortcuts.forEach(shortcut => {
      if (shortcut.categoryId && grouped[shortcut.categoryId]) {
        grouped[shortcut.categoryId].push(shortcut);
      } else {
        grouped.uncategorized.push(shortcut);
      }
    });

    return grouped;
  }, [filteredShortcuts, categories]);


  if (shortcuts.length === 0) {
      return (
          <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center py-20 px-4">
              <div className="bg-white p-12 rounded-3xl shadow-lg border border-gray-100 max-w-lg w-full text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FolderOpen className="h-10 w-10 text-primary-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('shortcutGrid.noShortcuts')}</h3>
                  <p className="text-gray-600 mb-8 text-lg leading-relaxed">{t('shortcutGrid.getStarted')}</p>
                  <button
                    onClick={onAddClick}
                    className="bg-gradient-to-r from-primary-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-primary-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center space-x-3 mx-auto"
                  >
                    <Plus size={20} />
                    <span>Add Your First Link</span>
                  </button>
              </div>
          </div>
      )
  }

  if (filteredShortcuts.length === 0) {
      return (
          <div className="min-h-screen bg-gray-50/50 flex items-center justify-center py-20">
              <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 max-w-md mx-auto text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FolderOpen className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">No shortcuts found</h3>
                  <p className="text-gray-600 leading-relaxed">Try adjusting your search query or add a new shortcut.</p>
              </div>
          </div>
      )
  }
  
  const categoryOrder = [
    ...categories,
    { id: 'uncategorized', name: t('shortcutGrid.uncategorized') }
  ];
  
  return (
    <div className="p-2 sm:p-3 lg:p-4 space-y-4 bg-gray-50/50 min-h-screen">
      {searchQuery && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-blue-700 font-medium">
            Showing {filteredShortcuts.length} result{filteredShortcuts.length !== 1 ? 's' : ''} for "{searchQuery}"
          </p>
        </div>
      )}

      {categoryOrder.map(category => {
        const categoryShortcuts = groupedShortcuts[category.id];
        if (!categoryShortcuts || categoryShortcuts.length === 0) {
          return null;
        }
        return (
          <div key={category.id} className="category-section">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <span>{category.name}</span>
                <span className="text-sm font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                  {categoryShortcuts.length}
                </span>
              </h2>
            </div>

            {/* 컴팩트한 그리드 레이아웃 - 더 많은 카드 표시 */}
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 2xl:grid-cols-18 gap-0.5">
                {categoryShortcuts.map(shortcut => (
                    <div key={shortcut.id} className="w-full">
                      <ShortcutItem
                        shortcut={shortcut}
                        onDelete={onDelete}
                        onEdit={onEdit}
                      />
                    </div>
                ))}
            </div>
          </div>
        )
      })}
    </div>
  );
};

export default ShortcutGrid;