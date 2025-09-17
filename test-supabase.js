// Supabase 연결 테스트
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mevtbqtqfaczvwbyrzlx.supabase.co'
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzAzMjgzOCwiZXhwIjoyMDUyNjA4ODM4LCJhdWQiOiJzdXBhYmFzZSIsImlzcyI6InN1cGFiYXNlIn0.APP_Pp2jfOmdT1p1MEfjOLozvWhUOYjbZdR_Lx8hH3U'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 연결 테스트
async function testConnection() {
  try {
    console.log('🔗 Supabase 연결 테스트 시작...')

    // 1. 테이블 존재 확인
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('count', { count: 'exact' })

    if (categoriesError) {
      console.error('❌ Categories 테이블 접근 실패:', categoriesError.message)
      return
    }

    const { data: shortcuts, error: shortcutsError } = await supabase
      .from('shortcuts')
      .select('count', { count: 'exact' })

    if (shortcutsError) {
      console.error('❌ Shortcuts 테이블 접근 실패:', shortcutsError.message)
      return
    }

    console.log('✅ DB 연결 성공!')
    console.log(`📊 Categories: ${categories.length || 0}개`)
    console.log(`🔗 Shortcuts: ${shortcuts.length || 0}개`)

    // 2. 실시간 구독 테스트
    console.log('🎯 실시간 구독 테스트...')
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'shortcuts' },
        (payload) => {
          console.log('📡 실시간 이벤트 수신:', payload)
        }
      )
      .subscribe((status) => {
        console.log('📡 구독 상태:', status)
      })

  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error)
  }
}

testConnection()