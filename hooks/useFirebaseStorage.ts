import { useState, useEffect, useCallback } from 'react';
import { 
  ref, 
  push, 
  set, 
  remove, 
  onValue, 
  off,
  update,
  DatabaseReference 
} from 'firebase/database';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { database, auth } from '../lib/firebase';
import type { Shortcut, Category } from '../types';
import toast from 'react-hot-toast';

interface FirebaseStorageHook {
  shortcuts: Shortcut[];
  categories: Category[];
  isLoading: boolean;
  isSignedIn: boolean;
  user: User | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  addShortcut: (shortcut: Omit<Shortcut, 'id'>) => Promise<void>;
  updateShortcut: (shortcut: Shortcut) => Promise<void>;
  deleteShortcut: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export default function useFirebaseStorage(): FirebaseStorageHook {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // 인증 상태 모니터링
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsSignedIn(!!user);
      
      if (user) {
        console.log('✅ User signed in:', user.email);
        // 사용자 로그인 시 데이터 로딩 시작
        setupDataListeners(user.uid);
      } else {
        console.log('❌ User signed out');
        // 로그아웃 시 리스너 정리 및 데이터 초기화
        cleanupListeners();
        setShortcuts([]);
        setCategories([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Firebase 실시간 데이터 리스너 설정
  const setupDataListeners = useCallback((userId: string) => {
    setIsLoading(true);

    // 바로가기 데이터 리스너
    const shortcutsRef = ref(database, `users/${userId}/shortcuts`);
    const shortcutsListener = onValue(shortcutsRef, (snapshot) => {
      const data = snapshot.val();
      const shortcutsList: Shortcut[] = data 
        ? Object.entries(data).map(([id, value]: [string, any]) => ({
            id,
            ...value
          }))
        : [];
      
      setShortcuts(shortcutsList);
      console.log(`📊 Loaded ${shortcutsList.length} shortcuts`);
    });

    // 카테고리 데이터 리스너
    const categoriesRef = ref(database, `users/${userId}/categories`);
    const categoriesListener = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      const categoriesList: Category[] = data
        ? Object.entries(data).map(([id, value]: [string, any]) => ({
            id,
            ...value
          }))
        : [];
      
      setCategories(categoriesList);
      setIsLoading(false);
      console.log(`📁 Loaded ${categoriesList.length} categories`);
    });

    // 에러 처리
    shortcutsRef.catch?.((error: any) => {
      console.error('❌ Error loading shortcuts:', error);
      toast.error('바로가기 로딩 중 오류가 발생했습니다.');
      setIsLoading(false);
    });

    categoriesRef.catch?.((error: any) => {
      console.error('❌ Error loading categories:', error);
      toast.error('카테고리 로딩 중 오류가 발생했습니다.');
    });

  }, []);

  // 리스너 정리
  const cleanupListeners = useCallback(() => {
    if (user) {
      const shortcutsRef = ref(database, `users/${user.uid}/shortcuts`);
      const categoriesRef = ref(database, `users/${user.uid}/categories`);
      off(shortcutsRef);
      off(categoriesRef);
    }
  }, [user]);

  // Google 로그인
  const signIn = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('로그인되었습니다!');
    } catch (error) {
      console.error('❌ Sign in error:', error);
      toast.error('로그인 중 오류가 발생했습니다.');
    }
  }, []);

  // 로그아웃
  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('로그아웃되었습니다!');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  }, []);

  // 바로가기 추가
  const addShortcut = useCallback(async (shortcutData: Omit<Shortcut, 'id'>) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      const shortcutsRef = ref(database, `users/${user.uid}/shortcuts`);
      await push(shortcutsRef, shortcutData);
      toast.success('바로가기가 추가되었습니다!');
    } catch (error) {
      console.error('❌ Error adding shortcut:', error);
      toast.error('바로가기 추가 중 오류가 발생했습니다.');
    }
  }, [user]);

  // 바로가기 업데이트
  const updateShortcut = useCallback(async (shortcut: Shortcut) => {
    if (!user) return;

    try {
      const shortcutRef = ref(database, `users/${user.uid}/shortcuts/${shortcut.id}`);
      const { id, ...updateData } = shortcut;
      await set(shortcutRef, updateData);
      toast.success('바로가기가 업데이트되었습니다!');
    } catch (error) {
      console.error('❌ Error updating shortcut:', error);
      toast.error('바로가기 업데이트 중 오류가 발생했습니다.');
    }
  }, [user]);

  // 바로가기 삭제
  const deleteShortcut = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const shortcutRef = ref(database, `users/${user.uid}/shortcuts/${id}`);
      await remove(shortcutRef);
      toast.success('바로가기가 삭제되었습니다!');
    } catch (error) {
      console.error('❌ Error deleting shortcut:', error);
      toast.error('바로가기 삭제 중 오류가 발생했습니다.');
    }
  }, [user]);

  // 카테고리 추가
  const addCategory = useCallback(async (categoryData: Omit<Category, 'id'>) => {
    if (!user) return;

    try {
      const categoriesRef = ref(database, `users/${user.uid}/categories`);
      await push(categoriesRef, categoryData);
      toast.success('카테고리가 추가되었습니다!');
    } catch (error) {
      console.error('❌ Error adding category:', error);
      toast.error('카테고리 추가 중 오류가 발생했습니다.');
    }
  }, [user]);

  // 카테고리 업데이트
  const updateCategory = useCallback(async (category: Category) => {
    if (!user) return;

    try {
      const categoryRef = ref(database, `users/${user.uid}/categories/${category.id}`);
      const { id, ...updateData } = category;
      await set(categoryRef, updateData);
      toast.success('카테고리가 업데이트되었습니다!');
    } catch (error) {
      console.error('❌ Error updating category:', error);
      toast.error('카테고리 업데이트 중 오류가 발생했습니다.');
    }
  }, [user]);

  // 카테고리 삭제
  const deleteCategory = useCallback(async (id: string) => {
    if (!user) return;

    try {
      // 카테고리 삭제
      const categoryRef = ref(database, `users/${user.uid}/categories/${id}`);
      await remove(categoryRef);

      // 해당 카테고리를 사용하는 바로가기들의 categoryId 제거
      const updates: { [key: string]: any } = {};
      shortcuts.forEach(shortcut => {
        if (shortcut.categoryId === id) {
          updates[`users/${user.uid}/shortcuts/${shortcut.id}/categoryId`] = null;
        }
      });

      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
      }

      toast.success('카테고리가 삭제되었습니다!');
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      toast.error('카테고리 삭제 중 오류가 발생했습니다.');
    }
  }, [user, shortcuts]);

  return {
    shortcuts,
    categories,
    isLoading,
    isSignedIn,
    user,
    signIn,
    signOut,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    addCategory,
    updateCategory,
    deleteCategory
  };
}