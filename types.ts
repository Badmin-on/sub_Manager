
export interface Shortcut {
  id: string;
  name: string;
  url: string;
  paymentDate?: string; // Stored as YYYY-MM-DD
  paymentAmount?: number;
  paymentFrequency?: 'monthly' | 'yearly';
  categoryId?: string;
}

export interface Category {
  id: string;
  name: string;
}
