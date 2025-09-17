/**
 * Hybrid Storage Manager
 * Supabase와 localStorage 간의 자동 전환을 관리
 * 
 * 전략:
 * 1. Supabase 연결 시도
 * 2. 실패 시 localStorage로 자동 전환
 * 3. 연결 복구 시 자동으로 다시 Supabase 사용
 * 4. 데이터 동기화 관리
 */

import { supabase, checkSupabaseConnection } from './supabase';
import type { Shortcut, Category } from '../types';
import toast from 'react-hot-toast';

export type StorageMode = 'supabase' | 'local';

export interface HybridStorage {
  mode: StorageMode;
  isConnected: boolean;
  lastChecked: Date;
}

class HybridStorageManager {
  private currentMode: StorageMode = 'local';
  private isConnected: boolean = false;
  private lastChecked: Date = new Date();
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(storage: HybridStorage) => void> = [];

  // 사용자 ID (고정 또는 동적)
  private userId: string = 'fixed-user-12345';

  constructor() {
    this.initializeStorage();
  }

  /**
   * 스토리지 초기화 및 연결 확인
   */
  async initializeStorage(): Promise<void> {
    console.log('🔄 Hybrid Storage 초기화 시작...');
    
    try {
      // Supabase 연결 테스트
      const connected = await checkSupabaseConnection();
      
      if (connected) {
        this.currentMode = 'supabase';
        this.isConnected = true;
        console.log('✅ Supabase 모드로 초기화 완료');
        toast.success('클라우드 동기화 활성화');
      } else {
        this.currentMode = 'local';
        this.isConnected = false;
        console.log('📱 로컬 스토리지 모드로 초기화');
        toast('로컬 모드로 시작 (오프라인 지원)', {
          icon: '📱',
          duration: 3000
        });
      }
      
      this.lastChecked = new Date();
      this.notifyListeners();
      
      // 정기적인 연결 상태 확인 (30초마다)
      this.startConnectionMonitoring();
      
    } catch (error) {
      console.error('❌ 스토리지 초기화 실패:', error);
      this.fallbackToLocal();
    }
  }

  /**
   * 연결 상태 모니터링 시작
   */
  private startConnectionMonitoring(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    this.connectionCheckInterval = setInterval(async () => {
      await this.checkAndSwitchMode();
    }, 30000); // 30초마다 확인
  }

  /**
   * 모드 확인 및 자동 전환
   */
  async checkAndSwitchMode(): Promise<void> {
    try {
      const connected = await checkSupabaseConnection();
      const previousMode = this.currentMode;
      
      if (connected && this.currentMode === 'local') {
        // 로컬에서 Supabase로 전환
        this.currentMode = 'supabase';
        this.isConnected = true;
        console.log('🔄 로컬 → Supabase 자동 전환');
        toast.success('클라우드 동기화 복구됨!');
        
        // TODO: 로컬 데이터를 Supabase로 동기화
        await this.syncLocalToSupabase();
        
      } else if (!connected && this.currentMode === 'supabase') {
        // Supabase에서 로컬로 전환
        this.currentMode = 'local';
        this.isConnected = false;
        console.log('🔄 Supabase → 로컬 자동 전환');
        toast('클라우드 연결 실패: 로컬 모드로 전환', {
          icon: '📱',
          duration: 4000
        });
      }
      
      if (previousMode !== this.currentMode) {
        this.notifyListeners();
      }
      
      this.lastChecked = new Date();
      
    } catch (error) {
      console.error('❌ 연결 상태 확인 실패:', error);
    }
  }

  /**
   * 로컬 모드로 강제 전환
   */
  private fallbackToLocal(): void {
    this.currentMode = 'local';
    this.isConnected = false;
    this.lastChecked = new Date();
    this.notifyListeners();
  }

  /**
   * 로컬 데이터를 Supabase로 동기화
   */
  private async syncLocalToSupabase(): Promise<void> {
    if (this.currentMode !== 'supabase') return;

    try {
      console.log('🔄 로컬 → Supabase 데이터 동기화 시작...');

      // 로컬 저장된 카테고리 가져오기
      const localCategories = this.getLocalCategories();
      const localShortcuts = this.getLocalShortcuts();

      if (localCategories.length > 0 || localShortcuts.length > 0) {
        // Supabase의 기존 데이터 확인
        const { data: existingCategories } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', this.userId);

        const { data: existingShortcuts } = await supabase
          .from('shortcuts')
          .select('*')
          .eq('user_id', this.userId);

        // 중복 제거 후 새 데이터만 업로드
        const categoriesToSync = localCategories.filter(local => 
          !existingCategories?.some(existing => existing.name === local.name)
        );

        const shortcutsToSync = localShortcuts.filter(local => 
          !existingShortcuts?.some(existing => existing.name === local.name && existing.url === local.url)
        );

        // 카테고리 동기화
        if (categoriesToSync.length > 0) {
          for (const category of categoriesToSync) {
            await supabase
              .from('categories')
              .insert({
                name: category.name,
                user_id: this.userId
              });
          }
          console.log(`✅ ${categoriesToSync.length}개 카테고리 동기화 완료`);
        }

        // 바로가기 동기화
        if (shortcutsToSync.length > 0) {
          // 카테고리 매핑을 위해 최신 카테고리 목록 가져오기
          const { data: updatedCategories } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', this.userId);

          for (const shortcut of shortcutsToSync) {
            // 카테고리 ID 매핑
            let categoryId = null;
            if (shortcut.categoryId) {
              const localCategory = localCategories.find(c => c.id === shortcut.categoryId);
              if (localCategory) {
                const supabaseCategory = updatedCategories?.find(c => c.name === localCategory.name);
                categoryId = supabaseCategory?.id || null;
              }
            }

            await supabase
              .from('shortcuts')
              .insert({
                name: shortcut.name,
                url: shortcut.url,
                category_id: categoryId,
                payment_date: shortcut.paymentDate || null,
                payment_amount: shortcut.paymentAmount || null,
                payment_frequency: shortcut.paymentFrequency || null,
                user_id: this.userId
              });
          }
          console.log(`✅ ${shortcutsToSync.length}개 바로가기 동기화 완료`);
        }

        if (categoriesToSync.length > 0 || shortcutsToSync.length > 0) {
          toast.success(`로컬 데이터 동기화 완료! (카테고리: ${categoriesToSync.length}, 바로가기: ${shortcutsToSync.length})`);
        }
      }

    } catch (error) {
      console.error('❌ 데이터 동기화 실패:', error);
      toast.error('데이터 동기화 중 오류가 발생했습니다.');
    }
  }

  // ===== 공용 인터페이스 =====

  /**
   * 현재 스토리지 정보 반환
   */
  getStorageInfo(): HybridStorage {
    return {
      mode: this.currentMode,
      isConnected: this.isConnected,
      lastChecked: this.lastChecked
    };
  }

  /**
   * 상태 변화 리스너 등록
   */
  addListener(callback: (storage: HybridStorage) => void): void {
    this.listeners.push(callback);
  }

  /**
   * 리스너 제거
   */
  removeListener(callback: (storage: HybridStorage) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * 리스너들에게 상태 변화 알림
   */
  private notifyListeners(): void {
    const info = this.getStorageInfo();
    this.listeners.forEach(callback => callback(info));
  }

  // ===== 로컬 스토리지 메서드 =====

  private getLocalCategories(): Category[] {
    try {
      const stored = localStorage.getItem('quicklink_categories');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getLocalShortcuts(): Shortcut[] {
    try {
      const stored = localStorage.getItem('quicklink_shortcuts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setLocalCategories(categories: Category[]): void {
    localStorage.setItem('quicklink_categories', JSON.stringify(categories));
  }

  private setLocalShortcuts(shortcuts: Shortcut[]): void {
    localStorage.setItem('quicklink_shortcuts', JSON.stringify(shortcuts));
  }

  // ===== 통합 CRUD 메서드 =====

  /**
   * 카테고리 목록 가져오기
   */
  async getCategories(): Promise<Category[]> {
    if (this.currentMode === 'supabase' && this.isConnected) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', this.userId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        return data.map(item => ({
          id: item.id,
          name: item.name
        }));
      } catch (error) {
        console.error('❌ Supabase 카테고리 조회 실패:', error);
        this.fallbackToLocal();
        return this.getLocalCategories();
      }
    }
    
    return this.getLocalCategories();
  }

  /**
   * 바로가기 목록 가져오기
   */
  async getShortcuts(): Promise<Shortcut[]> {
    if (this.currentMode === 'supabase' && this.isConnected) {
      try {
        const { data, error } = await supabase
          .from('shortcuts')
          .select('*')
          .eq('user_id', this.userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data.map(item => ({
          id: item.id,
          name: item.name,
          url: item.url,
          categoryId: item.category_id || undefined,
          paymentDate: item.payment_date || undefined,
          paymentAmount: item.payment_amount || undefined,
          paymentFrequency: item.payment_frequency || undefined
        }));
      } catch (error) {
        console.error('❌ Supabase 바로가기 조회 실패:', error);
        this.fallbackToLocal();
        return this.getLocalShortcuts();
      }
    }
    
    return this.getLocalShortcuts();
  }

  /**
   * 카테고리 추가
   */
  async addCategory(name: string): Promise<{ success: boolean; category?: Category }> {
    const newCategory: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name
    };

    if (this.currentMode === 'supabase' && this.isConnected) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            name,
            user_id: this.userId
          })
          .select()
          .single();

        if (error) throw error;
        
        const category: Category = {
          id: data.id,
          name: data.name
        };
        
        toast.success('카테고리가 추가되었습니다! (클라우드 동기화)');
        return { success: true, category };
      } catch (error) {
        console.error('❌ Supabase 카테고리 추가 실패:', error);
        this.fallbackToLocal();
        // 로컬로 fallback
      }
    }

    // 로컬 저장
    const categories = this.getLocalCategories();
    categories.push(newCategory);
    this.setLocalCategories(categories);
    
    toast.success('카테고리가 추가되었습니다! (로컬 저장)');
    return { success: true, category: newCategory };
  }

  /**
   * 바로가기 추가
   */
  async addShortcut(shortcut: Omit<Shortcut, 'id'>): Promise<{ success: boolean; shortcut?: Shortcut }> {
    const newShortcut: Shortcut = {
      id: `shortcut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...shortcut
    };

    if (this.currentMode === 'supabase' && this.isConnected) {
      try {
        const { data, error } = await supabase
          .from('shortcuts')
          .insert({
            name: shortcut.name,
            url: shortcut.url,
            category_id: shortcut.categoryId || null,
            payment_date: shortcut.paymentDate || null,
            payment_amount: shortcut.paymentAmount || null,
            payment_frequency: shortcut.paymentFrequency || null,
            user_id: this.userId
          })
          .select()
          .single();

        if (error) throw error;
        
        const createdShortcut: Shortcut = {
          id: data.id,
          name: data.name,
          url: data.url,
          categoryId: data.category_id || undefined,
          paymentDate: data.payment_date || undefined,
          paymentAmount: data.payment_amount || undefined,
          paymentFrequency: data.payment_frequency || undefined
        };
        
        toast.success('바로가기가 추가되었습니다! (클라우드 동기화)');
        return { success: true, shortcut: createdShortcut };
      } catch (error) {
        console.error('❌ Supabase 바로가기 추가 실패:', error);
        this.fallbackToLocal();
        // 로컬로 fallback
      }
    }

    // 로컬 저장
    const shortcuts = this.getLocalShortcuts();
    shortcuts.unshift(newShortcut); // 최신 항목을 맨 앞에
    this.setLocalShortcuts(shortcuts);
    
    toast.success('바로가기가 추가되었습니다! (로컬 저장)');
    return { success: true, shortcut: newShortcut };
  }

  /**
   * 바로가기 수정
   */
  async updateShortcut(shortcut: Shortcut): Promise<{ success: boolean }> {
    if (this.currentMode === 'supabase' && this.isConnected) {
      try {
        const { error } = await supabase
          .from('shortcuts')
          .update({
            name: shortcut.name,
            url: shortcut.url,
            category_id: shortcut.categoryId || null,
            payment_date: shortcut.paymentDate || null,
            payment_amount: shortcut.paymentAmount || null,
            payment_frequency: shortcut.paymentFrequency || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', shortcut.id)
          .eq('user_id', this.userId);

        if (error) throw error;
        
        toast.success('바로가기가 수정되었습니다! (클라우드 동기화)');
        return { success: true };
      } catch (error) {
        console.error('❌ Supabase 바로가기 수정 실패:', error);
        this.fallbackToLocal();
        // 로컬로 fallback
      }
    }

    // 로컬 저장
    const shortcuts = this.getLocalShortcuts();
    const index = shortcuts.findIndex(s => s.id === shortcut.id);
    if (index !== -1) {
      shortcuts[index] = shortcut;
      this.setLocalShortcuts(shortcuts);
      toast.success('바로가기가 수정되었습니다! (로컬 저장)');
      return { success: true };
    }
    
    toast.error('수정할 바로가기를 찾을 수 없습니다.');
    return { success: false };
  }

  /**
   * 바로가기 삭제
   */
  async deleteShortcut(id: string): Promise<{ success: boolean }> {
    if (this.currentMode === 'supabase' && this.isConnected) {
      try {
        const { error } = await supabase
          .from('shortcuts')
          .delete()
          .eq('id', id)
          .eq('user_id', this.userId);

        if (error) throw error;
        
        toast.success('바로가기가 삭제되었습니다! (클라우드 동기화)');
        return { success: true };
      } catch (error) {
        console.error('❌ Supabase 바로가기 삭제 실패:', error);
        this.fallbackToLocal();
        // 로컬로 fallback
      }
    }

    // 로컬 저장
    const shortcuts = this.getLocalShortcuts();
    const filteredShortcuts = shortcuts.filter(s => s.id !== id);
    
    if (filteredShortcuts.length < shortcuts.length) {
      this.setLocalShortcuts(filteredShortcuts);
      toast.success('바로가기가 삭제되었습니다! (로컬 저장)');
      return { success: true };
    }
    
    toast.error('삭제할 바로가기를 찾을 수 없습니다.');
    return { success: false };
  }

  /**
   * 카테고리 수정
   */
  async updateCategory(id: string, name: string): Promise<{ success: boolean }> {
    if (this.currentMode === 'supabase' && this.isConnected) {
      try {
        const { error } = await supabase
          .from('categories')
          .update({
            name,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', this.userId);

        if (error) throw error;
        
        toast.success('카테고리가 수정되었습니다! (클라우드 동기화)');
        return { success: true };
      } catch (error) {
        console.error('❌ Supabase 카테고리 수정 실패:', error);
        this.fallbackToLocal();
        // 로컬로 fallback
      }
    }

    // 로컬 저장
    const categories = this.getLocalCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
      categories[index].name = name;
      this.setLocalCategories(categories);
      toast.success('카테고리가 수정되었습니다! (로컬 저장)');
      return { success: true };
    }
    
    toast.error('수정할 카테고리를 찾을 수 없습니다.');
    return { success: false };
  }

  /**
   * 카테고리 삭제
   */
  async deleteCategory(id: string): Promise<{ success: boolean }> {
    if (this.currentMode === 'supabase' && this.isConnected) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)
          .eq('user_id', this.userId);

        if (error) throw error;
        
        toast.success('카테고리가 삭제되었습니다! (클라우드 동기화)');
        return { success: true };
      } catch (error) {
        console.error('❌ Supabase 카테고리 삭제 실패:', error);
        this.fallbackToLocal();
        // 로컬로 fallback
      }
    }

    // 로컬 저장
    const categories = this.getLocalCategories();
    const filteredCategories = categories.filter(c => c.id !== id);
    
    if (filteredCategories.length < categories.length) {
      this.setLocalCategories(filteredCategories);
      
      // 해당 카테고리를 사용하는 바로가기들의 카테고리 ID 제거
      const shortcuts = this.getLocalShortcuts();
      const updatedShortcuts = shortcuts.map(s => 
        s.categoryId === id ? { ...s, categoryId: undefined } : s
      );
      this.setLocalShortcuts(updatedShortcuts);
      
      toast.success('카테고리가 삭제되었습니다! (로컬 저장)');
      return { success: true };
    }
    
    toast.error('삭제할 카테고리를 찾을 수 없습니다.');
    return { success: false };
  }

  /**
   * 리소스 정리
   */
  cleanup(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
    this.listeners = [];
  }
}

// 싱글톤 인스턴스
export const hybridStorage = new HybridStorageManager();

export default hybridStorage;