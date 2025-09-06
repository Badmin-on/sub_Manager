
import React, { useMemo } from 'react';
import type { Shortcut, Category } from '../types';
import ShortcutItem from './ShortcutItem';
import { useLanguage } from '../context/LanguageContext';

interface ShortcutGridProps {
  shortcuts: Shortcut[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (shortcut: Shortcut) => void;
}

const ShortcutGrid: React.FC<ShortcutGridProps> = ({ shortcuts, categories, onDelete, onEdit }) => {
  const { t } = useLanguage();
  
  const groupedShortcuts = useMemo(() => {
    const grouped: { [key: string]: Shortcut[] } = {
      uncategorized: []
    };
    
    categories.forEach(cat => {
      grouped[cat.id] = [];
    });

    shortcuts.forEach(shortcut => {
      if (shortcut.categoryId && grouped[shortcut.categoryId]) {
        grouped[shortcut.categoryId].push(shortcut);
      } else {
        grouped.uncategorized.push(shortcut);
      }
    });

    return grouped;
  }, [shortcuts, categories]);


  if (shortcuts.length === 0) {
      return (
          <div className="text-center py-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('shortcutGrid.noShortcuts')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('shortcutGrid.getStarted')}</p>
          </div>
      )
  }
  
  const categoryOrder = [
    ...categories,
    { id: 'uncategorized', name: t('shortcutGrid.uncategorized') }
  ];
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {categoryOrder.map(category => {
        const categoryShortcuts = groupedShortcuts[category.id];
        if (!categoryShortcuts || categoryShortcuts.length === 0) {
          return null;
        }
        return (
          <div key={category.id}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">{category.name}</h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-4 gap-y-8">
                {categoryShortcuts.map(shortcut => (
                    <ShortcutItem key={shortcut.id} shortcut={shortcut} onDelete={onDelete} onEdit={onEdit} />
                ))}
            </div>
          </div>
        )
      })}
    </div>
  );
};

export default ShortcutGrid;