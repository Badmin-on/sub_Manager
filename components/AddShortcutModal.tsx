
import React, { useState } from 'react';
import type { Shortcut, Category } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AddShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (shortcut: Omit<Shortcut, 'id'>) => void;
  categories: Category[];
}

const AddShortcutModal: React.FC<AddShortcutModalProps> = ({ isOpen, onClose, onAdd, categories }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setError(t('addModal.errorRequired'));
      return;
    }
    
    let validUrl = url;
    if (!/^https?:\/\//i.test(validUrl)) {
        validUrl = `https://${validUrl}`;
    }

    try {
        new URL(validUrl);
    } catch (_) {
        setError(t('addModal.errorInvalidUrl'));
        return;
    }

    const isSubscription = paymentDate && paymentAmount;

    onAdd({ 
      name, 
      url: validUrl, 
      paymentDate: paymentDate || undefined,
      paymentAmount: isSubscription ? parseFloat(paymentAmount) : undefined,
      paymentFrequency: isSubscription ? paymentFrequency : undefined,
      categoryId: categoryId || undefined,
    });
    setName('');
    setUrl('');
    setPaymentDate('');
    setPaymentAmount('');
    setPaymentFrequency('monthly');
    setCategoryId('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('addModal.title')}</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('addModal.siteName')}</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('addModal.siteNamePlaceholder')}
                  required
                />
              </div>
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">{t('addModal.siteUrl')}</label>
                <input
                  type="text"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('addModal.siteUrlPlaceholder')}
                  required
                />
              </div>
               <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  {t('addModal.categoryLabel')}
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">{t('addModal.uncategorized')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700">
                  {t('addModal.paymentDateLabel')}
                </label>
                <input
                  type="date"
                  id="paymentDate"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                 <p className="mt-1 text-xs text-gray-500">{t('addModal.paymentDateHelp')}</p>
              </div>

              {paymentDate && (
                <>
                  <div>
                    <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">
                      {t('addModal.paymentAmountLabel')}
                    </label>
                    <input
                      type="number"
                      id="paymentAmount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder={t('addModal.paymentAmountPlaceholder')}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="paymentFrequency" className="block text-sm font-medium text-gray-700">
                      {t('addModal.paymentFrequencyLabel')}
                    </label>
                    <select
                      id="paymentFrequency"
                      value={paymentFrequency}
                      onChange={(e) => setPaymentFrequency(e.target.value as 'monthly' | 'yearly')}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="monthly">{t('addModal.monthly')}</option>
                      <option value="yearly">{t('addModal.yearly')}</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {t('addModal.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {t('addModal.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddShortcutModal;