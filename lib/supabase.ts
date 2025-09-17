import { createClient } from '@supabase/supabase-js'
import { supabaseConnectionManager } from './supabase-connection-manager'

// 환경변수 체크 및 안전한 기본값 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

// 개발 환경에서 설정 확인
if (import.meta.env.DEV) {
  console.log('🔍 Supabase 설정 확인...')
  console.log('📡 URL:', supabaseUrl || '❌ 미설정')
  console.log('🔑 Key exists:', !!supabaseAnonKey)
  
  const config = supabaseConnectionManager.getConfig()
  if (config) {
    console.log('🔧 Connection Manager Config:', {
      isValid: config.isValid,
      error: config.error
    })
  }
}

// Supabase 클라이언트 생성 (Connection Manager 통합)
export const supabase = supabaseConnectionManager.getClient() || createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
    global: {
      headers: {
        'x-my-custom-header': 'subscription-shortcut-manager',
        'x-client-info': 'sub-manager/2.0.0',
      },
      fetch: (url, options) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
      },
    },
  }
)

// 향상된 연결 상태 체크 함수
export const checkSupabaseConnection = async (): Promise<boolean> => {
  const status = await supabaseConnectionManager.checkConnection()
  return status.isConnected
}

// 연결 상태 가져오기
export const getConnectionStatus = () => {
  return supabaseConnectionManager.getStatus()
}

// 자동 초기화 (개발 환경에서만)
if (import.meta.env.DEV) {
  setTimeout(async () => {
    const status = await supabaseConnectionManager.checkConnection()
    
    if (!status.isConnected) {
      console.warn('⚠️  Supabase 연결 실패:', status.error)
      console.info('💡 로컬 모드로 자동 전환됩니다.')
      
      // 사용자에게 연결 실패 알림
      window.dispatchEvent(new CustomEvent('supabase-connection-failed', {
        detail: {
          error: status.error,
          suggestion: 'switch-to-local-mode'
        }
      }))
    } else {
      console.log('✅ Supabase 연결 성공! 클라우드 모드 활성화')
      console.log(`📡 연결 지연시간: ${status.latency}ms`)
    }
  }, 1000)
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