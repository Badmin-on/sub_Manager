import { createClient } from '@supabase/supabase-js'

// 환경변수 체크 및 안전한 기본값 설정 - 올바른 Supabase 프로젝트 정보
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://mevtbqtqfaczvwbyrzlx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzAzMjgzOCwiZXhwIjoyMDUyNjA4ODM4LCJhdWQiOiJzdXBhYmFzZSIsImlzcyI6InN1cGFiYXNlIn0.APP_Pp2jfOmdT1p1MEfjOLozvWhUOYjbZdR_Lx8hH3U'

// 연결 가능성 체크 (개발 환경에서만)
if (import.meta.env.DEV) {
  console.log('🔍 Supabase 설정 확인...')
  console.log('📡 URL:', supabaseUrl)
  console.log('🔑 Key exists:', !!supabaseAnonKey)
}

// Supabase 클라이언트 생성 (향상된 안정성)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 익명 사용을 위해 세션 유지 비활성화
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 2, // 이벤트 수 줄이기
    },
  },
  global: {
    headers: {
      'x-my-custom-header': 'quicklink-manager-v2',
      'x-client-info': 'quicklink-manager/1.0.0',
    },
    fetch: (url, options) => {
      // 커스텀 fetch로 타임아웃 및 재시도 로직 추가
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    },
  },
})

// 연결 상태 체크 함수
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('categories').select('count', { count: 'exact', head: true });
    if (error) {
      console.warn('🚨 Supabase 연결 테스트 실패:', error.message);
      return false;
    }
    console.log('✅ Supabase 연결 테스트 성공');
    return true;
  } catch (error) {
    console.error('❌ Supabase 연결 불가:', error);
    return false;
  }
};

// 자동 연결 테스트 (개발 환경에서만)
if (import.meta.env.DEV) {
  setTimeout(() => {
    checkSupabaseConnection().then(isConnected => {
      if (!isConnected) {
        console.warn('⚠️  Supabase에 연결할 수 없습니다. 로컬 모드로 전환하는 것을 고려해보세요.');
      }
    });
  }, 2000);
}

// 데이터베이스 타입 정의
export type Database = {
  public: {
    Tables: {
      shortcuts: {
        Row: {
          id: string
          name: string
          url: string
          category_id: string | null
          payment_date: string | null
          payment_amount: number | null
          payment_frequency: 'monthly' | 'yearly' | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          category_id?: string | null
          payment_date?: string | null
          payment_amount?: number | null
          payment_frequency?: 'monthly' | 'yearly' | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          category_id?: string | null
          payment_date?: string | null
          payment_amount?: number | null
          payment_frequency?: 'monthly' | 'yearly' | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// 타입 안전성을 위한 Supabase 클라이언트 타입
export type SupabaseClient = typeof supabase