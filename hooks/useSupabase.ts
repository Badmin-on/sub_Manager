import { useState, useEffect } from 'react';
import { supabase, type Database } from '../lib/supabase';
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
    // 현재 사용자 가져오기
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
      
      if (event === 'SIGNED_IN') {
        toast.success('로그인되었습니다!');
      } else if (event === 'SIGNED_OUT') {
        toast.success('로그아웃되었습니다.');
      }
    });

    return () => subscription.unsubscribe();
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

    // 실시간 구독 설정
    const channel = supabase
      .channel('shortcuts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shortcuts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Shortcuts realtime update:', payload);
          fetchShortcuts(); // 변경사항 발생시 다시 fetch
        }
      )
      .subscribe();

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
      console.error('Error fetching shortcuts:', error);
      toast.error('바로가기를 불러오는 중 오류가 발생했습니다.');
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

    // 실시간 구독 설정
    const channel = supabase
      .channel('categories_changes')
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
          fetchCategories(); // 변경사항 발생시 다시 fetch
        }
      )
      .subscribe();

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
      console.error('Error fetching categories:', error);
      toast.error('카테고리를 불러오는 중 오류가 발생했습니다.');
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