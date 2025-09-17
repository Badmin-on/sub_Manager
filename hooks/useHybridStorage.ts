import { useState, useEffect, useCallback } from 'react';
import { supabase, getConnectionStatus } from '../lib/supabase';
import { supabaseConnectionManager } from '../lib/supabase-connection-manager';
import type { Shortcut, Category } from '../types';
import type { Database } from '../lib/supabase';
import toast from 'react-hot-toast';

interface HybridStorageState {
  mode: 'local' | 'cloud' | 'syncing';
  isOnline: boolean;
  lastSync?: Date;
  pendingChanges: number;
}

interface SyncQueueItem {
  id: string;
  type: 'shortcut' | 'category';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
}

// 로컬 스토리지 키
const STORAGE_KEYS = {
  shortcuts: 'quicklink-shortcuts',
  categories: 'quicklink-categories',
  syncQueue: 'quicklink-sync-queue',
  lastSync: 'quicklink-last-sync',
  mode: 'quicklink-storage-mode'
};

// 데이터 변환 함수들
const mapDbShortcutToApp = (dbShortcut: Database['public']['Tables']['shortcuts']['Row']): Shortcut => ({
  id: dbShortcut.id,
  name: dbShortcut.name,
  url: dbShortcut.url,
  categoryId: dbShortcut.category_id || undefined,
  paymentDate: dbShortcut.payment_date || undefined,
  paymentAmount: dbShortcut.payment_amount || undefined,
  paymentFrequency: dbShortcut.payment_frequency || undefined,
});

const mapDbCategoryToApp = (dbCategory: Database['public']['Tables']['categories']['Row']): Category => ({
  id: dbCategory.id,
  name: dbCategory.name,
});

const mapAppShortcutToDb = (shortcut: Omit<Shortcut, 'id'>, userId: string): Database['public']['Tables']['shortcuts']['Insert'] => ({
  name: shortcut.name,
  url: shortcut.url,
  category_id: shortcut.categoryId || null,
  payment_date: shortcut.paymentDate || null,
  payment_amount: shortcut.paymentAmount || null,
  payment_frequency: shortcut.paymentFrequency || null,
  user_id: userId,
});

const mapAppCategoryToDb = (category: Omit<Category, 'id'>, userId: string): Database['public']['Tables']['categories']['Insert'] => ({
  name: category.name,
  user_id: userId,
});

export function useHybridStorage() {
  const [state, setState] = useState<HybridStorageState>({
    mode: 'local',
    isOnline: false,
    pendingChanges: 0
  });
  
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);

  const userId = 'fixed-user-12345'; // 고정 사용자 ID

  // 로컬 스토리지에서 데이터 로드
  const loadFromLocal = useCallback(() => {
    try {
      const localShortcuts = localStorage.getItem(STORAGE_KEYS.shortcuts);
      const localCategories = localStorage.getItem(STORAGE_KEYS.categories);
      const localQueue = localStorage.getItem(STORAGE_KEYS.syncQueue);

      setShortcuts(localShortcuts ? JSON.parse(localShortcuts) : []);
      setCategories(localCategories ? JSON.parse(localCategories) : []);
      setSyncQueue(localQueue ? JSON.parse(localQueue) : []);
      
      const lastSync = localStorage.getItem(STORAGE_KEYS.lastSync);
      if (lastSync) {
        setState(prev => ({ ...prev, lastSync: new Date(lastSync) }));
      }
    } catch (error) {
      console.error('로컬 데이터 로드 실패:', error);
      toast.error('로컬 데이터 로드에 실패했습니다.');
    }
  }, []);

  // 로컬 스토리지에 데이터 저장
  const saveToLocal = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.shortcuts, JSON.stringify(shortcuts));
      localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
      localStorage.setItem(STORAGE_KEYS.syncQueue, JSON.stringify(syncQueue));
      localStorage.setItem(STORAGE_KEYS.mode, state.mode);
      
      if (state.lastSync) {
        localStorage.setItem(STORAGE_KEYS.lastSync, state.lastSync.toISOString());
      }
    } catch (error) {
      console.error('로컬 데이터 저장 실패:', error);
      toast.error('로컬 데이터 저장에 실패했습니다.');
    }
  }, [shortcuts, categories, syncQueue, state.mode, state.lastSync]);

  // 클라우드에서 데이터 로드
  const loadFromCloud = useCallback(async () => {
    if (!state.isOnline) return false;

    try {
      const client = supabaseConnectionManager.getClient();
      if (!client) throw new Error('Supabase 클라이언트를 사용할 수 없습니다.');

      // 카테고리 먼저 로드
      const { data: categoriesData, error: categoriesError } = await client
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (categoriesError) throw categoriesError;

      // 바로가기 로드
      const { data: shortcutsData, error: shortcutsError } = await client
        .from('shortcuts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (shortcutsError) throw shortcutsError;

      const cloudCategories = categoriesData.map(mapDbCategoryToApp);
      const cloudShortcuts = shortcutsData.map(mapDbShortcutToApp);

      setCategories(cloudCategories);
      setShortcuts(cloudShortcuts);
      
      setState(prev => ({ ...prev, lastSync: new Date() }));
      
      console.log(`✅ 클라우드 데이터 로드 완료: 카테고리 ${cloudCategories.length}개, 바로가기 ${cloudShortcuts.length}개`);
      return true;
    } catch (error) {
      console.error('클라우드 데이터 로드 실패:', error);
      return false;
    }
  }, [state.isOnline, userId]);

  // 동기화 큐에 작업 추가
  const addToSyncQueue = useCallback((item: Omit<SyncQueueItem, 'timestamp'>) => {
    const queueItem: SyncQueueItem = {
      ...item,
      timestamp: new Date()
    };
    
    setSyncQueue(prev => [...prev, queueItem]);
    setState(prev => ({ ...prev, pendingChanges: prev.pendingChanges + 1 }));
  }, []);

  // 동기화 실행
  const syncToCloud = useCallback(async () => {
    if (!state.isOnline || syncQueue.length === 0) return;

    setState(prev => ({ ...prev, mode: 'syncing' }));
    
    try {
      const client = supabaseConnectionManager.getClient();
      if (!client) throw new Error('Supabase 클라이언트를 사용할 수 없습니다.');

      let successCount = 0;
      const remainingQueue: SyncQueueItem[] = [];

      for (const item of syncQueue) {
        try {
          if (item.type === 'shortcut') {
            if (item.action === 'create') {
              const { error } = await client
                .from('shortcuts')
                .insert(mapAppShortcutToDb(item.data, userId));
              if (error) throw error;
            } else if (item.action === 'update') {
              const { error } = await client
                .from('shortcuts')
                .update({
                  name: item.data.name,
                  url: item.data.url,
                  category_id: item.data.categoryId || null,
                  payment_date: item.data.paymentDate || null,
                  payment_amount: item.data.paymentAmount || null,
                  payment_frequency: item.data.paymentFrequency || null,
                })
                .eq('id', item.data.id)
                .eq('user_id', userId);
              if (error) throw error;
            } else if (item.action === 'delete') {
              const { error } = await client
                .from('shortcuts')
                .delete()
                .eq('id', item.data.id)
                .eq('user_id', userId);
              if (error) throw error;
            }
          } else if (item.type === 'category') {
            if (item.action === 'create') {
              const { error } = await client
                .from('categories')
                .insert(mapAppCategoryToDb(item.data, userId));
              if (error) throw error;
            } else if (item.action === 'update') {
              const { error } = await client
                .from('categories')
                .update({ name: item.data.name })
                .eq('id', item.data.id)
                .eq('user_id', userId);
              if (error) throw error;
            } else if (item.action === 'delete') {
              const { error } = await client
                .from('categories')
                .delete()
                .eq('id', item.data.id)
                .eq('user_id', userId);
              if (error) throw error;
            }
          }
          
          successCount++;
        } catch (itemError) {
          console.error(`동기화 실패 - ${item.type} ${item.action}:`, itemError);
          remainingQueue.push(item); // 실패한 항목은 큐에 남겨둠
        }
      }

      setSyncQueue(remainingQueue);
      setState(prev => ({
        ...prev,
        mode: state.isOnline ? 'cloud' : 'local',
        pendingChanges: remainingQueue.length,
        lastSync: new Date()
      }));

      if (successCount > 0) {
        toast.success(`${successCount}개 항목이 클라우드에 동기화되었습니다.`);
      }
      
      if (remainingQueue.length > 0) {
        toast.warning(`${remainingQueue.length}개 항목의 동기화가 실패했습니다.`);
      }

    } catch (error) {
      console.error('동기화 실행 실패:', error);
      toast.error('동기화에 실패했습니다.');
      setState(prev => ({ ...prev, mode: 'local' }));
    }
  }, [state.isOnline, syncQueue, userId]);

  // 연결 상태 모니터링
  useEffect(() => {
    const checkConnection = async () => {
      const status = await supabaseConnectionManager.checkConnection(5000);
      const wasOnline = state.isOnline;
      
      setState(prev => ({
        ...prev,
        isOnline: status.isConnected,
        mode: status.isConnected ? 'cloud' : 'local'
      }));

      // 온라인 상태로 전환된 경우 자동 동기화
      if (status.isConnected && !wasOnline && syncQueue.length > 0) {
        console.log('🔄 온라인 복구됨, 자동 동기화 시작...');
        setTimeout(syncToCloud, 1000);
      }
    };

    checkConnection();
    
    // 주기적으로 연결 상태 확인
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, [state.isOnline, syncQueue.length, syncToCloud]);

  // 초기 데이터 로드
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      
      // 로컬 데이터 먼저 로드
      loadFromLocal();
      
      // 온라인인 경우 클라우드 데이터 로드 시도
      if (state.isOnline) {
        const cloudSuccess = await loadFromCloud();
        if (!cloudSuccess) {
          toast.info('클라우드 연결 실패, 로컬 모드로 동작합니다.');
        }
      }
      
      setLoading(false);
    };

    initialize();
  }, [loadFromLocal, loadFromCloud, state.isOnline]);

  // 로컬 데이터 자동 저장
  useEffect(() => {
    if (!loading) {
      saveToLocal();
    }
  }, [shortcuts, categories, syncQueue, saveToLocal, loading]);

  return {
    // 상태
    shortcuts,
    categories,
    loading,
    state,
    
    // 액션
    setShortcuts,
    setCategories,
    addToSyncQueue,
    syncToCloud,
    loadFromCloud,
    
    // 유틸리티
    forceLocalMode: () => {
      setState(prev => ({ ...prev, mode: 'local', isOnline: false }));
      supabaseConnectionManager.forceLocalMode();
    },
    
    clearSyncQueue: () => {
      setSyncQueue([]);
      setState(prev => ({ ...prev, pendingChanges: 0 }));
    }
  };
}