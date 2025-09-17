
import React, { useState } from 'react';
import type { Shortcut } from '../types';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { Search, Plus, Settings, Download, Upload, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

interface HeaderProps {
  onAddClick: () => void;
  onManageCategoriesClick: () => void;
  shortcuts: Shortcut[];
  onSearch?: (query: string) => void;
  onImportData?: (shortcuts: Shortcut[]) => void;
}

const Header: React.FC<HeaderProps> = ({ onAddClick, onManageCategoriesClick, shortcuts, onSearch, onImportData }) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(shortcuts.map(shortcut => ({
      Name: shortcut.name,
      URL: shortcut.url,
      Category: shortcut.categoryId || 'Uncategorized',
      'Payment Date': shortcut.paymentDate || '',
      'Payment Amount': shortcut.paymentAmount || '',
      'Payment Frequency': shortcut.paymentFrequency || ''
    })));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Links');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `linkhub-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Data exported successfully!');
  };

  const importFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        const importedShortcuts: Shortcut[] = jsonData.map(row => ({
          id: crypto.randomUUID(),
          name: row.Name || row.name || '',
          url: row.URL || row.url || row.Link || '',
          categoryId: row.Category || row.category || undefined,
          paymentDate: row['Payment Date'] || row.paymentDate || undefined,
          paymentAmount: row['Payment Amount'] || row.paymentAmount || undefined,
          paymentFrequency: row['Payment Frequency'] || row.paymentFrequency || undefined
        })).filter(shortcut => shortcut.name && shortcut.url);

        if (importedShortcuts.length > 0) {
          onImportData?.(importedShortcuts);
          toast.success(`Imported ${importedShortcuts.length} shortcuts successfully!`);
        } else {
          toast.error('No valid shortcuts found in the file.');
        }
      } catch (error) {
        toast.error('Failed to import file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const calculateTotalMonthlyCost = () => {
    const now = new Date();
    const currentMonth = now.getMonth();

    return shortcuts.reduce((total, shortcut) => {
        if (!shortcut.paymentDate || !shortcut.paymentAmount) {
            return total;
        }

        if (shortcut.paymentFrequency === 'monthly') {
            return total + shortcut.paymentAmount;
        }

        if (shortcut.paymentFrequency === 'yearly') {
            const paymentDate = new Date(shortcut.paymentDate);
            // Adjust for timezone offset to get the correct local date.
            const userTimezoneOffset = paymentDate.getTimezoneOffset() * 60000;
            const paymentDateLocal = new Date(paymentDate.getTime() + userTimezoneOffset);
            
            if (paymentDateLocal.getMonth() === currentMonth) {
                return total + shortcut.paymentAmount;
            }
        }
        return total;
    }, 0);
  };

  const totalCost = calculateTotalMonthlyCost();

  const clearLocalStorage = () => {
    if (confirm('로컬 데이터를 모두 삭제하시겠습니까?')) {
      localStorage.removeItem('shortcuts');
      localStorage.removeItem('categories');
      localStorage.removeItem('useSupabase');
      toast.success('로컬 데이터가 삭제되었습니다. 페이지를 새로고침해주세요.');
      window.location.reload();
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* Top row with title and main actions */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              {t('header.title')} 🚀
            </h1>
            {totalCost > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-2 rounded-lg border border-green-200">
                <p className="text-xs text-gray-600">{t('header.totalThisMonth')}</p>
                <p className="text-lg font-bold text-green-600">
                  ${totalCost.toFixed(2)}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <LanguageSwitcher />
            
            {/* Export button */}
            <button
              onClick={exportToExcel}
              className="btn-secondary flex items-center space-x-2"
              title="Export to Excel"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
            
            {/* Import button */}
            <label className="btn-secondary flex items-center space-x-2 cursor-pointer" title="Import from Excel">
              <Upload size={16} />
              <span className="hidden sm:inline">Import</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={importFromExcel}
                className="hidden"
              />
            </label>

            {/* Clear data button */}
            <button
              onClick={clearLocalStorage}
              className="btn-danger flex items-center space-x-2"
              title="Clear local data"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Clear</span>
            </button>
            
            {/* Categories button */}
            <button
              onClick={onManageCategoriesClick}
              className="btn-secondary flex items-center space-x-2"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">{t('header.manageCategories')}</span>
            </button>
            
            {/* Add button */}
            <button
              onClick={onAddClick}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>{t('header.addSite')}</span>
            </button>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;