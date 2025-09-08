import { createClient } from '@supabase/supabase-js'

// 환경변수 또는 기본값 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

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