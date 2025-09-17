import { useState, useEffect } from 'react';
import { supabase, type Database, checkSupabaseConnection } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import type { Shortcut, Category } from '../types';

// 데이터베이스 타입을 앱 타입으로 변환하는 유틸리티 함수
const mapDbShortcutToAppShortcut = (dbShortcut: Database['public']['Tables']['shortcuts']['Row']): Shortcut => ({
  id: dbShortcut.id,
  name: dbShortcut.name,
  url: dbShortcut.url,
  categoryId: dbShortcut.category_id || undefined,
  paymentDate: dbShortcut.payment_date || undefined,
  paymentAmount: dbShortcut.payment_amount || undefined,
  paymentFrequency: dbShortcut.payment_frequency || undefined,
});

const mapDbCategoryToAppCategory = (dbCategory: Database['public']['Tables']['categories']['Row']): Category => ({
  id: dbCategory.id,
  name: dbCategory.name,
});

const mapAppShortcutToDbShortcut = (appShortcut: Omit<Shortcut, 'id'>, userId: string): Database['public']['Tables']['shortcuts']['Insert'] => ({
  name: appShortcut.name,
  url: appShortcut.url,
  category_id: appShortcut.categoryId || null,
  payment_date: appShortcut.paymentDate || null,
  payment_amount: appShortcut.paymentAmount || null,
  payment_frequency: appShortcut.paymentFrequency || null,
  user_id: userId,
});

const mapAppCategoryToDbCategory = (appCategory: Omit<Category, 'id'>, userId: string): Database['public']['Tables']['categories']['Insert'] => ({
  name: appCategory.name,
  user_id: userId,
});

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 향상된 인증 방식 - 연결 체크 포함
    const initializeAuth = async () => {
      try {
        if (import.meta.env.DEV) {
          console.log('🔐 인증 초기화 시작...');
        }

        // 먼저 Supabase 연결 상태 체크
        const isConnected = await checkSupabaseConnection();

        if (!isConnected) {
          throw new Error('Supabase 연결 불가');
        }

        // 고정 사용자 ID 사용 (개인 사용을 위해)
        const fixedUser = {
          id: 'fixed-user-12345',
          email: 'user@quicklink.local',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          role: 'authenticated'
        } as User;

        setUser(fixedUser);
        setLoading(false);

        if (import.meta.env.DEV) {
          console.log('✅ 고정 사용자 인증 및 연결 완료');
        }

        toast.success('Supabase 연결 성공!');

      } catch (error) {
        console.error('❌ 인증 또는 연결 실패:', error);
        setLoading(false);
        // 인증 실패해도 로컬 모드로 자동 전환할 수 있도록 안내
        toast.error('Supabase 연결 실패: 로컬 모드로 자동 전환됩니다.');
      }
    };

    // 약간의 지연 후 실행 (앱 완전 로딩 후)
    setTimeout(initializeAuth, 1000);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast.error(error.message);
      return false;
    }
    return true;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
    return true;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
}

export function useSupabaseShortcuts(user: User | null) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setShortcuts([]);
      setLoading(false);
      return;
    }

    fetchShortcuts();

    // 실시간 구독 설정 - 연결 안정성 개선
    let channel: any = null;

    try {
      channel = supabase
        .channel(`shortcuts_changes_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shortcuts',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (import.meta.env.DEV) {
              console.log('📡 Shortcuts realtime update:', payload);
            }

            // 효율적인 상태 업데이트
            if (payload.eventType === 'INSERT' && payload.new) {
              const newShortcut = mapDbShortcutToAppShortcut(payload.new as any);
              setShortcuts(prev => [newShortcut, ...prev]);
              toast.success('바로가기가 추가되었습니다!');
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedShortcut = mapDbShortcutToAppShortcut(payload.new as any);
              setShortcuts(prev => prev.map(s => s.id === updatedShortcut.id ? updatedShortcut : s));
              toast.success('바로가기가 업데이트되었습니다!');
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setShortcuts(prev => prev.filter(s => s.id !== payload.old.id));
              toast.success('바로가기가 삭제되었습니다!');
            }
          }
        )
        .subscribe((status) => {
          if (import.meta.env.DEV) {
            console.log('📡 Shortcuts subscription status:', status);
          }
          if (status === 'SUBSCRIBED') {
            if (import.meta.env.DEV) {
              console.log('✅ Shortcuts realtime subscription active');
            }
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Shortcuts realtime subscription error');
            toast.error('실시간 동기화 오류: 로컬 모드를 사용하세요.');
            // 오류 시 데이터 다시 불러오기
            fetchShortcuts();
          }
        });
    } catch (error) {
      console.error('❌ 실시간 구독 설정 실패:', error);
      // 실시간 구독 실패해도 기본 기능은 작동하도록
      toast.error('실시간 동기화 설정 실패: 로컬 모드를 사용하세요.');
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchShortcuts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shortcuts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedShortcuts = data.map(mapDbShortcutToAppShortcut);
      setShortcuts(mappedShortcuts);
    } catch (error) {
      console.error('❌ 바로가기 데이터 로딩 실패:', error);

      // 네트워크 오류인 경우 로컬 모드 제안
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        toast.error('네트워크 연결 오류: 로컬 모드를 사용하세요.');
      } else {
        toast.error('바로가기를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const addShortcut = async (shortcut: Omit<Shortcut, 'id'>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('shortcuts')
        .insert(mapAppShortcutToDbShortcut(shortcut, user.id));

      if (error) throw error;
      
      toast.success('바로가기가 추가되었습니다!');
      return true;
    } catch (error) {
      console.error('Error adding shortcut:', error);
      toast.error('바로가기 추가 중 오류가 발생했습니다.');
      return false;
    }
  };

  const updateShortcut = async (shortcut: Shortcut) => {
    if (!user) return false;

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
        })
        .eq('id', shortcut.id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('바로가기가 수정되었습니다!');
      return true;
    } catch (error) {
      console.error('Error updating shortcut:', error);
      toast.error('바로가기 수정 중 오류가 발생했습니다.');
      return false;
    }
  };

  const deleteShortcut = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('shortcuts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('바로가기가 삭제되었습니다!');
      return true;
    } catch (error) {
      console.error('Error deleting shortcut:', error);
      toast.error('바로가기 삭제 중 오류가 발생했습니다.');
      return false;
    }
  };

  return {
    shortcuts,
    loading,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    refreshShortcuts: fetchShortcuts,
  };
}

export function useSupabaseCategories(user: User | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    fetchCategories();

    // 실시간 구독 설정 - 연결 안정성 개선
    let channel: any = null;

    try {
      channel = supabase
        .channel(`categories_changes_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'categories',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Categories realtime update:', payload);

            // 효율적인 상태 업데이트
            if (payload.eventType === 'INSERT' && payload.new) {
              const newCategory = mapDbCategoryToAppCategory(payload.new as any);
              setCategories(prev => [...prev, newCategory]);
              toast.success('카테고리가 추가되었습니다!');
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedCategory = mapDbCategoryToAppCategory(payload.new as any);
              setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
              toast.success('카테고리가 업데이트되었습니다!');
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setCategories(prev => prev.filter(c => c.id !== payload.old.id));
              toast.success('카테고리가 삭제되었습니다!');
            }
          }
        )
        .subscribe((status) => {
          console.log('Categories subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Categories realtime subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Categories realtime subscription error');
            // 오류 시 데이터 다시 불러오기
            fetchCategories();
          }
        });
    } catch (error) {
      console.error('실시간 구독 설정 실패:', error);
      // 실시간 구독 실패해도 기본 기능은 작동하도록
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedCategories = data.map(mapDbCategoryToAppCategory);
      setCategories(mappedCategories);
    } catch (error) {
      console.error('❌ 카테고리 데이터 로딩 실패:', error);

      // 네트워크 오류인 경우 로컬 모드 제안
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        toast.error('네트워크 연결 오류: 로컬 모드를 사용하세요.');
      } else {
        toast.error('카테고리를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (name: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('categories')
        .insert(mapAppCategoryToDbCategory({ name }, user.id));

      if (error) throw error;
      
      toast.success('카테고리가 추가되었습니다!');
      return true;
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('카테고리 추가 중 오류가 발생했습니다.');
      return false;
    }
  };

  const updateCategory = async (id: string, name: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('카테고리가 수정되었습니다!');
      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('카테고리 수정 중 오류가 발생했습니다.');
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('카테고리가 삭제되었습니다!');
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('카테고리 삭제 중 오류가 발생했습니다.');
      return false;
    }
  };

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: fetchCategories,
  };
}