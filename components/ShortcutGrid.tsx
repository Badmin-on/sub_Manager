
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
          <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="bg-gradient-to-br from-primary-50 to-purple-50 p-8 rounded-2xl">
                  <FolderOpen className="mx-auto h-16 w-16 text-primary-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">{t('shortcutGrid.noShortcuts')}</h3>
                  <p className="text-gray-600 text-center mb-6 max-w-sm">{t('shortcutGrid.getStarted')}</p>
                  <button 
                    onClick={onAddClick}
                    className="btn-primary flex items-center space-x-2 mx-auto"
                  >
                    <Plus size={16} />
                    <span>Add Your First Link</span>
                  </button>
              </div>
          </div>
      )
  }
  
  if (filteredShortcuts.length === 0) {
      return (
          <div className="text-center py-20">
              <div className="bg-gray-50 p-8 rounded-2xl max-w-md mx-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No shortcuts found</h3>
                  <p className="text-gray-600">Try adjusting your search query or add a new shortcut.</p>
              </div>
          </div>
      )
  }
  
  const categoryOrder = [
    ...categories,
    { id: 'uncategorized', name: t('shortcutGrid.uncategorized') }
  ];
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {searchQuery && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="category-title flex items-center space-x-2">
                <span>{category.name}</span>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {categoryShortcuts.length}
                </span>
              </h2>
            </div>
            <div className="shortcut-grid">
                {categoryShortcuts.map(shortcut => (
                    <ShortcutItem 
                      key={shortcut.id} 
                      shortcut={shortcut} 
                      onDelete={onDelete} 
                      onEdit={onEdit} 
                    />
                ))}
            </div>
          </div>
        )
      })}
    </div>
  );
};

export default ShortcutGrid;