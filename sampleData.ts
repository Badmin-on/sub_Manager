import type { Shortcut, Category } from './types';

interface AppData {
  shortcuts: Shortcut[];
  categories: Category[];
}

const CATEGORIES: Category[] = [
  { id: 'c1', name: '스트리밍 서비스' },
  { id: 'c2', name: '업무 도구' },
  { id: 'c3', name: '뉴스 및 정보' },
];

const SHORTCUTS: Shortcut[] = [
  {
    id: 's1',
    name: 'Netflix',
    url: 'https://netflix.com',
    paymentDate: '2024-08-15',
    paymentAmount: 13.99,
    paymentFrequency: 'monthly',
    categoryId: 'c1',
  },
  {
    id: 's2',
    name: 'YouTube Premium',
    url: 'https://youtube.com',
    paymentDate: '2024-08-20',
    paymentAmount: 11.99,
    paymentFrequency: 'monthly',
    categoryId: 'c1',
  },
  {
    id: 's3',
    name: 'Notion',
    url: 'https://notion.so',
    categoryId: 'c2',
  },
  {
    id: 's4',
    name: 'Figma',
    url: 'https://figma.com',
    paymentDate: '2024-09-01',
    paymentAmount: 12.00,
    paymentFrequency: 'monthly',
    categoryId: 'c2',
  },
  {
    id: 's5',
    name: 'Github',
    url: 'https://github.com',
    categoryId: 'c2',
  },
  {
    id: 's6',
    name: 'The New York Times',
    url: 'https://nytimes.com',
    categoryId: 'c3',
  },
   {
    id: 's7',
    name: '네이버',
    url: 'https://naver.com',
  },
];

export const SAMPLE_APP_DATA: AppData = {
  shortcuts: SHORTCUTS,
  categories: CATEGORIES,
};
