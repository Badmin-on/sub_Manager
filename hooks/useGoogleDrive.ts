import { useState, useEffect, useCallback, useRef } from 'react';
import type { Shortcut, Category } from '../types';
import useLocalStorage from './useLocalStorage';

export interface GoogleConfig {
  apiKey: string;
  clientId: string;
  spreadsheetId: string;
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const SHORTCUTS_SHEET_NAME = 'Shortcuts';
const CATEGORIES_SHEET_NAME = 'Categories';
const SHORTCUT_HEADERS = ['id', 'name', 'url', 'paymentDate', 'paymentAmount', 'paymentFrequency', 'categoryId'];
const CATEGORY_HEADERS = ['id', 'name'];

interface AppData {
  shortcuts: Shortcut[];
  categories: Category[];
}

const mapHeaderToIndex = (headerRow: any[], expectedHeaders: string[], aliases: { [key: string]: string[] }): { [key: string]: number } => {
    const mapping: { [key: string]: number } = {};
    if (!headerRow) return mapping;
    const lowerCaseHeaderRow = headerRow.map(h => String(h || '').toLowerCase().trim());
    expectedHeaders.forEach(headerKey => {
        const possibleNames = aliases[headerKey] || [headerKey];
        for (const name of possibleNames) {
            const index = lowerCaseHeaderRow.indexOf(name.toLowerCase());
            if (index !== -1) {
                mapping[headerKey] = index;
                break;
            }
        }
    });
    return mapping;
};

const sheetDataToObjects = <T extends {id: string}>(data: any[][], headers: string[], aliases: { [key: string]: string[] }): T[] => {
    if (!data || data.length === 0) return [];
    const headerRow = data[0];
    const headerMap = mapHeaderToIndex(headerRow, headers, aliases);
    const hasHeader = headerMap.hasOwnProperty('id');
    const dataRows = hasHeader ? data.slice(1) : data;
    if (!hasHeader) return [];
    return dataRows.map(row => {
        const obj: any = {};
        headers.forEach(header => {
            const index = headerMap[header];
            if (index !== undefined) {
                const value = row[index];
                if (header === 'paymentAmount') {
                    obj[header] = (value !== '' && value !== null && !isNaN(Number(value))) ? parseFloat(value) : undefined;
                } else {
                    obj[header] = (value === '' || value === null) ? undefined : value;
                }
            }
        });
        return obj as T;
    }).filter(obj => obj && obj.id);
};

const objectsToSheetData = (items: any[], headers: string[]): any[][] => {
  const data = items.map(item => headers.map(header => item[header] ?? ''));
  return [headers, ...data];
};


function useGoogleSheets() {
  const [config, setConfig] = useLocalStorage<GoogleConfig | null>('google-config', null);
  const isConfigured = !!(config?.apiKey && config?.clientId && config?.spreadsheetId);

  const [localShortcuts, setLocalShortcuts] = useLocalStorage<Shortcut[]>('shortcuts', []);
  const [localCategories, setLocalCategories] = useLocalStorage<Category[]>('categories', []);

  const [shortcuts, setShortcutsState] = useState<Shortcut[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(isConfigured);
  const [error, setError] = useState<Error | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const initialDataLoaded = useRef(false);
  const isSaving = useRef(false);
  const tokenClient = useRef<any>(null);
  const gapiInited = useRef(false);
  const gisInited = useRef(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!config?.spreadsheetId) return;

    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.batchGet({
        spreadsheetId: config.spreadsheetId,
        ranges: [SHORTCUTS_SHEET_NAME, CATEGORIES_SHEET_NAME],
      });

      const shortcutsData = response.result.valueRanges?.[0]?.values || [];
      const categoriesData = response.result.valueRanges?.[1]?.values || [];
      const shortcutAliases = { 'id': ['id'], 'name': ['name', 'title'], 'url': ['url'], 'paymentDate': ['paymentdate', 'payment date'], 'paymentAmount': ['paymentamount', 'payment amount'], 'paymentFrequency': ['paymentfrequency', 'payment frequency'], 'categoryId': ['categoryid', 'category id'] };
      const categoryAliases = { 'id': ['id'], 'name': ['name'] };
      
      setShortcutsState(sheetDataToObjects(shortcutsData, SHORTCUT_HEADERS, shortcutAliases));
      setCategoriesState(sheetDataToObjects(categoriesData, CATEGORY_HEADERS, categoryAliases));
    } catch (e: any) {
      setError(new Error("Failed to load data. Check Spreadsheet ID and permissions."));
      console.error('Error loading data', e);
    } finally {
      setIsLoading(false);
      initialDataLoaded.current = true;
    }
  }, [config]);

  useEffect(() => {
    const initializeGapiClient = async () => {
      if (gapiInited.current || !config) return;
      await window.gapi.client.init({
        apiKey: config.apiKey,
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
      });
      gapiInited.current = true;
    };

    const initializeGisClient = () => {
      if (gisInited.current || !config) return;
      tokenClient.current = window.google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: SCOPES,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setError(new Error(tokenResponse.error));
            setIsSignedIn(false);
            return;
          }
          window.gapi.client.setToken(tokenResponse);
          setIsSignedIn(true);
          await loadData();
        },
      });
      gisInited.current = true;
    };
    
    const loadClients = () => {
        if (window.gapi) {
            window.gapi.load('client', initializeGapiClient);
        }
        if (window.google) {
            initializeGisClient();
        }
    };
    
    if (isConfigured) {
        setIsLoading(true);
        loadClients();
        setIsLoading(false);
    } else {
        gapiInited.current = false;
        gisInited.current = false;
        tokenClient.current = null;
        setIsSignedIn(false);
    }

  }, [config, isConfigured, loadData]);

  const saveData = useCallback(async (data: AppData) => {
    if (!config?.spreadsheetId || isSaving.current || !isSignedIn) return;
    isSaving.current = true;
    const shortcutsData = objectsToSheetData(data.shortcuts, SHORTCUT_HEADERS);
    const categoriesData = objectsToSheetData(data.categories, CATEGORY_HEADERS);
    try {
      await window.gapi.client.sheets.spreadsheets.values.batchClear({ spreadsheetId: config.spreadsheetId, resource: { ranges: [SHORTCUTS_SHEET_NAME, CATEGORIES_SHEET_NAME] } });
      if (data.shortcuts.length > 0 || data.categories.length > 0) {
        await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: config.spreadsheetId,
          resource: {
            valueInputOption: 'USER_ENTERED',
            data: [
              { range: `${SHORTCUTS_SHEET_NAME}!A1`, values: shortcutsData },
              { range: `${CATEGORIES_SHEET_NAME}!A1`, values: categoriesData },
            ]
          }
        });
      }
    } catch (e: any) {
      setError(new Error("Failed to save data."));
      console.error('Error saving data', e);
    } finally {
      isSaving.current = false;
    }
  }, [config, isSignedIn]);
  
  const debouncedSave = useCallback((data: AppData) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => saveData(data), 1500);
  }, [saveData]);

  useEffect(() => {
    if (initialDataLoaded.current && isSignedIn && isConfigured) {
      debouncedSave({ shortcuts, categories });
    }
  }, [shortcuts, categories, isSignedIn, isConfigured, debouncedSave]);
  
  const signIn = () => {
    if (tokenClient.current && gapiInited.current) {
      tokenClient.current.requestAccessToken({ prompt: '' });
    } else {
      setError(new Error("Google Auth is not ready. Please wait a moment and try again."));
    }
  };

  const signOut = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {
        window.gapi.client.setToken(null);
        setIsSignedIn(false);
        setShortcutsState([]);
        setCategoriesState([]);
        initialDataLoaded.current = false;
      });
    }
  };
  
  if (!isConfigured) {
    return {
      shortcuts: localShortcuts, setShortcuts: setLocalShortcuts,
      categories: localCategories, setCategories: setLocalCategories,
      isLoading: false, error: null, isSignedIn: false,
      signIn: () => {}, signOut: () => {},
      isConfigured: false, config, setConfig,
    };
  }

  return { 
    shortcuts, setShortcuts: setShortcutsState, 
    categories, setCategories: setCategoriesState, 
    isLoading, error, isSignedIn, 
    signIn, signOut,
    isConfigured: true, config, setConfig,
  };
}

export default useGoogleSheets;