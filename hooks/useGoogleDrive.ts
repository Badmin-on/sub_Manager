import { useState, useEffect, useCallback, useRef } from 'react';
import type { Shortcut, Category } from '../types';
import useLocalStorage from './useLocalStorage';

declare global {
  interface Window {
    gapi: any;
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

// Helper to map sheet header names (and aliases) to their column index
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

// Helper to convert sheet data (array of arrays) to array of objects
const sheetDataToObjects = <T extends {id: string}>(data: any[][], headers: string[], aliases: { [key: string]: string[] }): T[] => {
    if (!data || data.length === 0) return [];
    
    const headerRow = data[0];
    const headerMap = mapHeaderToIndex(headerRow, headers, aliases);
    
    // Check if the first row was a valid header row by seeing if 'id' was found.
    const hasHeader = headerMap.hasOwnProperty('id');
    const dataRows = hasHeader ? data.slice(1) : data;

    if (!hasHeader) {
        // No header found, which is expected for a completely empty sheet.
        return [];
    }

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
    }).filter(obj => obj && obj.id); // Filter out any empty rows or rows without an ID
};


// Helper to convert array of objects to sheet data (array of arrays)
const objectsToSheetData = (items: any[], headers: string[]): any[][] => {
  const data = items.map(item => headers.map(header => item[header] ?? ''));
  return [headers, ...data];
};

const isConfigured = !!(process.env.CLIENT_ID && process.env.API_KEY && process.env.SPREADSHEET_ID);

function useGoogleSheets() {
  // --- Local Mode Fallback State ---
  const [localShortcuts, setLocalShortcuts] = useLocalStorage<Shortcut[]>('shortcuts', []);
  const [localCategories, setLocalCategories] = useLocalStorage<Category[]>('categories', []);

  // --- Google Sheets State ---
  const [shortcuts, setShortcutsState] = useState<Shortcut[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(isConfigured); // Only loading if configured
  const [error, setError] = useState<Error | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const initialDataLoaded = useRef(false);
  const isSaving = useRef(false);

  // --- Local Mode Handling ---
  if (!isConfigured) {
    // If not configured, the app runs in local mode using data from localStorage.
    // It starts with an empty state, allowing users to add their own data.
    return {
      shortcuts: localShortcuts,
      setShortcuts: setLocalShortcuts,
      categories: localCategories,
      setCategories: setLocalCategories,
      isLoading: false,
      error: null, // No error, just operate locally.
      isSignedIn: false,
      signIn: () => { console.warn("Google Sign-In is not configured."); },
      signOut: () => {},
      isConfigured: false,
    };
  }

  const updateSigninStatus = (signedIn: boolean) => {
    setIsSignedIn(signedIn);
    if (signedIn) {
      loadData();
    } else {
      setShortcutsState([]);
      setCategoriesState([]);
      setIsLoading(false);
      initialDataLoaded.current = false;
    }
  };

  useEffect(() => {
    // This function encapsulates the entire GAPI client initialization process.
    const initializeGapiClient = async () => {
      try {
        // 1. Load the required 'client' and 'auth2' libraries.
        // We wrap this in a Promise to handle success and failure with async/await.
        await new Promise<void>((resolve, reject) => {
          window.gapi.load('client:auth2', {
            callback: resolve,
            onerror: reject,
            timeout: 5000, // 5 seconds
            ontimeout: () => reject(new Error('Google API client load timed out.')),
          });
        });

        // 2. Initialize the client with API key and OAuth client ID.
        await window.gapi.client.init({
          apiKey: process.env.API_KEY,
          clientId: process.env.CLIENT_ID,
          scope: SCOPES,
          discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });
        
        // 3. Get the authentication instance to manage user sign-in state.
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (!authInstance) {
          throw new Error("Google Auth instance could not be initialized.");
        }
        
        // 4. Listen for changes in the user's sign-in status.
        authInstance.isSignedIn.listen(updateSigninStatus);
        
        // 5. Check the initial sign-in status when the app loads.
        updateSigninStatus(authInstance.isSignedIn.get());

      } catch (e: any) {
        // If any part of the initialization fails, update the state to show an error.
        setError(e);
        setIsLoading(false);
        console.error('Error initializing Google API client', e);
      }
    };
    
    // The Google API script is loaded synchronously in the <head> of index.html.
    // This means that by the time this React component mounts and this effect runs,
    // the `window.gapi` object should be available.
    if (window.gapi) {
      initializeGapiClient();
    } else {
      // If window.gapi is not available, it indicates a critical failure in loading the
      // external script, likely due to network issues or an ad-blocker.
      // We set an error state and stop loading.
      const criticalError = new Error("Google API script failed to load. Please check your network connection and refresh the page.");
      setError(criticalError);
      setIsLoading(false);
    }
  }, []); // The empty dependency array ensures this effect runs only once on mount.


  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!process.env.SPREADSHEET_ID) return;

    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.batchGet({
        spreadsheetId: process.env.SPREADSHEET_ID,
        ranges: [SHORTCUTS_SHEET_NAME, CATEGORIES_SHEET_NAME],
      });

      const shortcutsData = response.result.valueRanges?.[0]?.values || [];
      const categoriesData = response.result.valueRanges?.[1]?.values || [];
      
      const shortcutAliases = {
          'id': ['id'],
          'name': ['name', 'title'],
          'url': ['url'],
          'paymentDate': ['paymentdate', 'payment date'],
          'paymentAmount': ['paymentamount', 'payment amount'],
          'paymentFrequency': ['paymentfrequency', 'payment frequency'],
          'categoryId': ['categoryid', 'category id']
      };
      const categoryAliases = {
          'id': ['id'],
          'name': ['name']
      };
      
      setShortcutsState(sheetDataToObjects(shortcutsData, SHORTCUT_HEADERS, shortcutAliases));
      setCategoriesState(sheetDataToObjects(categoriesData, CATEGORY_HEADERS, categoryAliases));
      
    } catch (e: any) {
      setError(e);
      console.error('Error loading data from Google Sheets', e);
    } finally {
      setIsLoading(false);
      initialDataLoaded.current = true;
    }
  }, []);

  const saveData = useCallback(async (data: AppData) => {
    if (!process.env.SPREADSHEET_ID || isSaving.current) return;
    isSaving.current = true;

    const shortcutsData = objectsToSheetData(data.shortcuts, SHORTCUT_HEADERS);
    const categoriesData = objectsToSheetData(data.categories, CATEGORY_HEADERS);

    try {
        await window.gapi.client.sheets.spreadsheets.values.batchClear({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                ranges: [SHORTCUTS_SHEET_NAME, CATEGORIES_SHEET_NAME]
            }
        });

        if (data.shortcuts.length > 0 || data.categories.length > 0) {
            await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: process.env.SPREADSHEET_ID,
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
      setError(e);
      console.error('Error saving data to Google Sheets', e);
    } finally {
        isSaving.current = false;
    }
  }, []);
  
  const debouncedSave = useCallback((data: AppData) => {
    if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
        saveData(data);
    }, 1500);
  }, [saveData]);

  useEffect(() => {
    if (initialDataLoaded.current && isSignedIn) {
        debouncedSave({ shortcuts, categories });
    }
  }, [shortcuts, categories, isSignedIn, debouncedSave]);
  
  const signIn = () => window.gapi.auth2.getAuthInstance().signIn();
  const signOut = () => window.gapi.auth2.getAuthInstance().signOut();

  return { 
    shortcuts, 
    setShortcuts: setShortcutsState, 
    categories, 
    setCategories: setCategoriesState, 
    isLoading, 
    error, 
    isSignedIn, 
    signIn, 
    signOut,
    isConfigured: true,
  };
}

export default useGoogleSheets;