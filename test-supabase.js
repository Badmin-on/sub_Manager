// Supabase 연결 테스트
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mpvtbptqfozxwbyeyizx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnRicHRxZm96eHdieWV5eml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTk3NTEsImV4cCI6MjA3MzU5NTc1MX0.RlnBL9tiJl3dQ07NRo0nrMWjD4BwarJhkKlwsGCrrBE'

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