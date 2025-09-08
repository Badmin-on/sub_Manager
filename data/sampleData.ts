import type { Shortcut, Category } from '../types';

export const sampleCategories: Category[] = [
  { id: 'search', name: 'Search Engines' },
  { id: 'ai', name: 'AI Tools' },
  { id: 'social', name: 'Social Media' },
  { id: 'productivity', name: 'Productivity' },
  { id: 'development', name: 'Development' },
  { id: 'entertainment', name: 'Entertainment' },
];

export const sampleShortcuts: Shortcut[] = [
  // Search Engines
  {
    id: 'google',
    name: 'Google',
    url: 'https://google.com',
    categoryId: 'search',
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://bing.com',
    categoryId: 'search',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com',
    categoryId: 'search',
  },

  // AI Tools
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    categoryId: 'ai',
    paymentAmount: 20,
    paymentFrequency: 'monthly',
    paymentDate: '2024-01-15',
  },
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai',
    categoryId: 'ai',
    paymentAmount: 20,
    paymentFrequency: 'monthly',
    paymentDate: '2024-01-20',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com',
    categoryId: 'ai',
  },

  // Social Media
  {
    id: 'twitter',
    name: 'X (Twitter)',
    url: 'https://x.com',
    categoryId: 'social',
    paymentAmount: 8,
    paymentFrequency: 'monthly',
    paymentDate: '2024-01-10',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    url: 'https://linkedin.com',
    categoryId: 'social',
    paymentAmount: 59.99,
    paymentFrequency: 'monthly',
    paymentDate: '2024-01-05',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://instagram.com',
    categoryId: 'social',
  },

  // Productivity
  {
    id: 'notion',
    name: 'Notion',
    url: 'https://notion.so',
    categoryId: 'productivity',
    paymentAmount: 10,
    paymentFrequency: 'monthly',
    paymentDate: '2024-01-12',
  },
  {
    id: 'todoist',
    name: 'Todoist',
    url: 'https://todoist.com',
    categoryId: 'productivity',
    paymentAmount: 4,
    paymentFrequency: 'monthly',
    paymentDate: '2024-01-08',
  },
  {
    id: 'calendly',
    name: 'Calendly',
    url: 'https://calendly.com',
    categoryId: 'productivity',
    paymentAmount: 8,
    paymentFrequency: 'monthly',
    paymentDate: '2024-01-18',
  },

  // Development
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com',
    categoryId: 'development',
    paymentAmount: 4,
    paymentFrequency: 'monthly',
    paymentDate: '2024-01-25',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    url: 'https://vercel.com',
    categoryId: 'development',
    paymentAmount: 20,
    paymentFrequency: 'monthly',
    paymentDate: '2024-01-30',
  },
  {
    id: 'netlify',
    name: 'Netlify',
    url: 'https://netlify.com',
    categoryId: 'development',
  },

  // Entertainment
  {
    id: 'netflix',
    name: 'Netflix',
    url: 'https://netflix.com',
    categoryId: 'entertainment',
    paymentAmount: 15.49,
    paymentFrequency: 'monthly',
    paymentDate: '2024-01-22',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    url: 'https://spotify.com',
    categoryId: 'entertainment',
    paymentAmount: 9.99,
    paymentFrequency: 'monthly',
    paymentDate: '2024-01-14',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://youtube.com',
    categoryId: 'entertainment',
    paymentAmount: 11.99,
    paymentFrequency: 'monthly',
    paymentDate: '2024-01-17',
  },

  // Uncategorized
  {
    id: 'amazon',
    name: 'Amazon',
    url: 'https://amazon.com',
    paymentAmount: 139,
    paymentFrequency: 'yearly',
    paymentDate: '2024-03-15',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    url: 'https://dropbox.com',
    paymentAmount: 120,
    paymentFrequency: 'yearly',
    paymentDate: '2024-06-01',
  },
];