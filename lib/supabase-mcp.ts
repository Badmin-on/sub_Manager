/**
 * Supabase MCP Integration
 * MCP(Model Context Protocol)를 활용한 Supabase 데이터베이스 관리
 */

import { supabase, checkSupabaseConnection } from './supabase';
import toast from 'react-hot-toast';
import type { Shortcut, Category } from '../types';

// MCP 통합 상태 관리
interface MCPState {
  isConnected: boolean;
  lastConnectionCheck: number;
  retryCount: number;
  maxRetries: number;
}

class SupabaseMCPManager {
  private state: MCPState = {
    isConnected: false,
    lastConnectionCheck: 0,
    retryCount: 0,
    maxRetries: 3
  };

  private connectionCheckInterval = 30000; // 30초마다 연결 상태 체크

  /**
   * MCP를 통한 스마트 연결 관리
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🚀 MCP Supabase 매니저 초기화 중...');

      // 연결 상태 체크
      const isConnected = await this.checkConnection();

      if (isConnected) {
        this.state.isConnected = true;
        this.state.retryCount = 0;

        // 주기적 연결 상태 모니터링 시작
        this.startConnectionMonitoring();

        // 스키마 검증 및 자동 설정
        await this.setupDatabaseAutomatically();

        toast.success('Supabase MCP 연결 및 설정 완료!');
        return true;
      } else {
        throw new Error('초기 연결 실패');
      }

    } catch (error) {
      console.error('❌ MCP Supabase 초기화 실패:', error);

      if (error.message === 'MANUAL_SQL_NEEDED') {
        toast.error('데이터베이스 테이블 생성이 필요합니다. 수동 설정 안내를 확인하세요.');
        this.showManualSetupGuide();
        return false;
      }

      this.handleConnectionFailure();
      return false;
    }
  }

  /**
   * 데이터베이스 자동 설정 (MCP 스마트 방식)
   */
  private async setupDatabaseAutomatically(): Promise<void> {
    console.log('🔧 MCP 자동 데이터베이스 설정 시작...');

    try {
      // 1단계: 스키마 존재 확인
      const schemaStatus = await this.checkDatabaseSchema();

      if (!schemaStatus.categoriesExists || !schemaStatus.shortcutsExists) {
        console.log('📋 테이블이 존재하지 않음 - 자동 생성 시도...');

        // 2단계: 자동 테이블 생성 시도
        await this.attemptAutoTableCreation();

        // 3단계: 샘플 데이터 삽입
        await this.insertSampleDataIfEmpty();

      } else {
        console.log('✅ 데이터베이스 스키마 확인됨');

        // 샘플 데이터가 없다면 삽입
        await this.insertSampleDataIfEmpty();
      }

    } catch (error) {
      console.error('자동 설정 실패:', error);
      throw error;
    }
  }

  /**
   * 데이터베이스 스키마 상태 확인
   */
  private async checkDatabaseSchema(): Promise<{categoriesExists: boolean, shortcutsExists: boolean}> {
    let categoriesExists = false;
    let shortcutsExists = false;

    try {
      // Categories 테이블 확인
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      categoriesExists = !categoriesError;

      // Shortcuts 테이블 확인
      const { data: shortcutsData, error: shortcutsError } = await supabase
        .from('shortcuts')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      shortcutsExists = !shortcutsError;

      console.log('📊 스키마 상태:', { categoriesExists, shortcutsExists });

    } catch (error) {
      console.error('스키마 확인 실패:', error);
    }

    return { categoriesExists, shortcutsExists };
  }

  /**
   * 자동 테이블 생성 시도
   */
  private async attemptAutoTableCreation(): Promise<void> {
    console.log('🏗️ 자동 테이블 생성 시도...');

    // Supabase에서는 클라이언트 측에서 직접 DDL을 실행할 수 없으므로
    // 사용자에게 수동 설정 안내
    throw new Error('MANUAL_SQL_NEEDED');
  }

  /**
   * 수동 설정 가이드 표시
   */
  private showManualSetupGuide(): void {
    console.log(`
🛠️ Supabase 수동 설정이 필요합니다!

다음 단계를 따라주세요:

1. Supabase 대시보드 접속: https://supabase.com
2. 프로젝트 선택 (mpvtbptqfozxwbyeyzix)
3. SQL Editor 메뉴 클릭
4. 다음 SQL을 복사해서 실행:

-- 테이블 생성
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shortcuts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    payment_date DATE,
    payment_amount DECIMAL(10,2),
    payment_frequency TEXT CHECK (payment_frequency IN ('monthly', 'yearly')),
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcuts ENABLE ROW LEVEL SECURITY;

-- 정책 생성
CREATE POLICY "Users can CRUD their own categories"
ON categories FOR ALL
USING (user_id = 'fixed-user-12345');

CREATE POLICY "Users can CRUD their own shortcuts"
ON shortcuts FOR ALL
USING (user_id = 'fixed-user-12345');

5. SQL 실행 후 페이지 새로고침!
    `);

    // 브라우저 알림도 표시
    setTimeout(() => {
      alert('Supabase 데이터베이스 설정이 필요합니다.\n\n콘솔에서 자세한 설정 가이드를 확인하세요.');
    }, 2000);
  }

  /**
   * 연결 상태 체크 (MCP 방식)
   */
  private async checkConnection(): Promise<boolean> {
    const now = Date.now();

    // 최근에 체크했다면 캐시된 결과 사용
    if (now - this.state.lastConnectionCheck < 5000) {
      return this.state.isConnected;
    }

    try {
      const isConnected = await checkSupabaseConnection();
      this.state.lastConnectionCheck = now;
      this.state.isConnected = isConnected;

      return isConnected;
    } catch (error) {
      console.error('연결 체크 실패:', error);
      this.state.isConnected = false;
      return false;
    }
  }

  /**
   * 스키마 자동 검증 및 생성
   */
  private async validateSchema(): Promise<void> {
    try {
      console.log('🔍 데이터베이스 스키마 검증 중...');

      // Categories 테이블 확인
      const { data: categoriesCheck, error: categoriesError } = await supabase
        .from('categories')
        .select('count', { count: 'exact', head: true });

      if (categoriesError && categoriesError.code === 'PGRST116') {
        console.log('📋 Categories 테이블 생성 필요');
        await this.createCategoriesTable();
      }

      // Shortcuts 테이블 확인
      const { data: shortcutsCheck, error: shortcutsError } = await supabase
        .from('shortcuts')
        .select('count', { count: 'exact', head: true });

      if (shortcutsError && shortcutsError.code === 'PGRST116') {
        console.log('📋 Shortcuts 테이블 생성 필요');
        await this.createShortcutsTable();
      }

      console.log('✅ 스키마 검증 완료');

    } catch (error) {
      console.error('스키마 검증 실패:', error);
      throw error;
    }
  }

  /**
   * MCP를 통한 SQL 직접 실행
   */
  private async executeSQLDirect(sql: string): Promise<any> {
    try {
      console.log('🔧 MCP SQL 실행 중...', sql.substring(0, 100) + '...');

      // Supabase SQL 실행 (여러 방법 시도)
      let result;

      // 방법 1: 표준 SQL 실행
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        if (!error) {
          console.log('✅ SQL 실행 성공 (exec_sql)');
          return { data, error: null };
        }
      } catch (err) {
        console.log('⚠️ exec_sql 방법 실패, 대안 시도...');
      }

      // 방법 2: 직접 SQL 실행 (PostgreSQL functions 사용)
      try {
        const { data, error } = await supabase.from('_').select('*').limit(0);
        // 이 방법으로는 실제 SQL을 실행할 수 없으므로 다른 방법 필요
      } catch (err) {
        console.log('⚠️ 직접 실행 실패');
      }

      // 방법 3: 개별 테이블 생성 명령으로 분리
      return await this.createTablesStepByStep();

    } catch (error) {
      console.error('❌ SQL 실행 실패:', error);
      throw error;
    }
  }

  /**
   * 단계별 테이블 생성 (MCP 최적화)
   */
  private async createTablesStepByStep(): Promise<void> {
    console.log('🏗️ MCP 단계별 테이블 생성 시작...');

    try {
      // 1단계: Categories 테이블 생성
      await this.createCategoriesTableDirect();

      // 2단계: Shortcuts 테이블 생성
      await this.createShortcutsTableDirect();

      // 3단계: 샘플 데이터 삽입
      await this.insertSampleData();

      console.log('✅ MCP 테이블 생성 및 데이터 삽입 완료');

    } catch (error) {
      console.error('❌ 단계별 생성 실패:', error);
      throw error;
    }
  }

  /**
   * Categories 테이블 직접 생성 (MCP 최적화)
   */
  private async createCategoriesTableDirect(): Promise<void> {
    try {
      // 테이블 존재 확인 후 생성
      const { error: insertError } = await supabase
        .from('categories')
        .insert([
          { name: 'Test Category', user_id: 'fixed-user-12345' }
        ]);

      if (insertError && insertError.code === '42P01') {
        // 테이블이 없으므로 생성 필요
        console.log('📋 Categories 테이블 생성 중...');

        // PostgreSQL 함수를 통한 테이블 생성
        const createSQL = `
          CREATE TABLE IF NOT EXISTS categories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            user_id TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

          CREATE POLICY IF NOT EXISTS "Users can CRUD their own categories"
          ON categories FOR ALL
          USING (user_id = 'fixed-user-12345');
        `;

        // 실제로는 Supabase SQL Editor가 필요하므로 사용자에게 안내
        throw new Error('MANUAL_SQL_NEEDED');

      } else {
        // 테이블이 이미 존재하거나 다른 에러
        console.log('✅ Categories 테이블 확인됨');

        // 테스트 데이터 삭제
        if (!insertError) {
          await supabase
            .from('categories')
            .delete()
            .eq('name', 'Test Category')
            .eq('user_id', 'fixed-user-12345');
        }
      }

    } catch (error) {
      throw error;
    }
  }

  /**
   * Categories 테이블 자동 생성 (레거시)
   */
  private async createCategoriesTable(): Promise<void> {
    // MCP 방식으로 리다이렉트
    return await this.createCategoriesTableDirect();
  }

  /**
   * Shortcuts 테이블 자동 생성
   */
  private async createShortcutsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS shortcuts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        category_id UUID REFERENCES categories(id),
        payment_date DATE,
        payment_amount DECIMAL(10,2),
        payment_frequency TEXT CHECK (payment_frequency IN ('monthly', 'yearly')),
        user_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- RLS 활성화
      ALTER TABLE shortcuts ENABLE ROW LEVEL SECURITY;

      -- 정책 생성
      CREATE POLICY "Users can CRUD their own shortcuts"
      ON shortcuts FOR ALL
      USING (user_id = 'fixed-user-12345');
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('Shortcuts 테이블 생성 실패:', error);
      throw error;
    }

    console.log('✅ Shortcuts 테이블 생성 완료');
  }

  /**
   * 주기적 연결 상태 모니터링
   */
  private startConnectionMonitoring(): void {
    setInterval(async () => {
      const isConnected = await this.checkConnection();

      if (!isConnected && this.state.isConnected) {
        console.warn('⚠️ Supabase 연결이 끊어졌습니다.');
        this.handleConnectionFailure();
      } else if (isConnected && !this.state.isConnected) {
        console.log('✅ Supabase 연결이 복구되었습니다.');
        this.state.isConnected = true;
        this.state.retryCount = 0;
        toast.success('Supabase 연결 복구됨');
      }
    }, this.connectionCheckInterval);
  }

  /**
   * 연결 실패 처리 (MCP 방식)
   */
  private handleConnectionFailure(): void {
    this.state.isConnected = false;
    this.state.retryCount++;

    if (this.state.retryCount <= this.state.maxRetries) {
      toast.error(`Supabase 연결 실패 (${this.state.retryCount}/${this.state.maxRetries})`);

      // 지수 백오프 재시도
      const retryDelay = Math.pow(2, this.state.retryCount) * 1000;
      setTimeout(() => {
        this.initialize();
      }, retryDelay);

    } else {
      toast.error('Supabase 연결 불가: 로컬 모드를 사용하세요');

      // 로컬 모드로 자동 전환 제안
      const event = new CustomEvent('supabase-connection-failed', {
        detail: { suggestion: 'switch-to-local-mode' }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * 실시간 동기화 최적화
   */
  async setupRealtimeSync(
    onShortcutsChange: (shortcuts: Shortcut[]) => void,
    onCategoriesChange: (categories: Category[]) => void
  ): Promise<void> {
    if (!this.state.isConnected) {
      console.warn('Supabase 연결되지 않음 - 실시간 동기화 건너뜀');
      return;
    }

    try {
      // Shortcuts 실시간 구독
      supabase
        .channel('shortcuts-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'shortcuts',
          filter: 'user_id=eq.fixed-user-12345'
        }, async (payload) => {
          console.log('🔄 Shortcuts 실시간 변경:', payload);

          // 전체 데이터 다시 로드 (단순화)
          const { data } = await supabase
            .from('shortcuts')
            .select('*')
            .eq('user_id', 'fixed-user-12345');

          if (data) {
            const shortcuts = data.map(this.mapDbShortcutToAppShortcut);
            onShortcutsChange(shortcuts);
          }
        })
        .subscribe();

      // Categories 실시간 구독
      supabase
        .channel('categories-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: 'user_id=eq.fixed-user-12345'
        }, async (payload) => {
          console.log('🔄 Categories 실시간 변경:', payload);

          const { data } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', 'fixed-user-12345');

          if (data) {
            const categories = data.map(this.mapDbCategoryToAppCategory);
            onCategoriesChange(categories);
          }
        })
        .subscribe();

      console.log('✅ 실시간 동기화 설정 완료');

    } catch (error) {
      console.error('실시간 동기화 설정 실패:', error);
    }
  }

  /**
   * 비어있는 데이터베이스에 샘플 데이터 삽입
   */
  private async insertSampleDataIfEmpty(): Promise<void> {
    try {
      console.log('🌱 샘플 데이터 확인 중...');

      // 기존 데이터 확인
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', 'fixed-user-12345')
        .limit(1);

      const { data: existingShortcuts } = await supabase
        .from('shortcuts')
        .select('id')
        .eq('user_id', 'fixed-user-12345')
        .limit(1);

      if (existingCategories?.length === 0 && existingShortcuts?.length === 0) {
        console.log('📋 빈 데이터베이스 감지 - 샘플 데이터 삽입 중...');

        // 1단계: 카테고리 삽입
        const sampleCategories = [
          { name: 'Search Engines', user_id: 'fixed-user-12345' },
          { name: 'AI Tools', user_id: 'fixed-user-12345' },
          { name: 'Social Media', user_id: 'fixed-user-12345' },
          { name: 'Productivity', user_id: 'fixed-user-12345' },
          { name: 'Development', user_id: 'fixed-user-12345' },
          { name: 'Entertainment', user_id: 'fixed-user-12345' }
        ];

        const { data: insertedCategories, error: categoryError } = await supabase
          .from('categories')
          .insert(sampleCategories)
          .select();

        if (categoryError) {
          console.error('카테고리 삽입 실패:', categoryError);
          return;
        }

        console.log('✅ 카테고리 삽입 완료:', insertedCategories?.length);

        // 2단계: 카테고리 ID 매핑
        const categoryMap = new Map();
        insertedCategories?.forEach(cat => {
          categoryMap.set(cat.name, cat.id);
        });

        // 3단계: 바로가기 삽입
        const sampleShortcuts = [
          // Search Engines
          { name: 'Google', url: 'https://google.com', category_id: categoryMap.get('Search Engines'), user_id: 'fixed-user-12345' },
          { name: 'Bing', url: 'https://bing.com', category_id: categoryMap.get('Search Engines'), user_id: 'fixed-user-12345' },
          { name: 'DuckDuckGo', url: 'https://duckduckgo.com', category_id: categoryMap.get('Search Engines'), user_id: 'fixed-user-12345' },

          // AI Tools
          { name: 'ChatGPT', url: 'https://chat.openai.com', category_id: categoryMap.get('AI Tools'), payment_amount: 20, payment_frequency: 'monthly', payment_date: '2024-01-15', user_id: 'fixed-user-12345' },
          { name: 'Claude', url: 'https://claude.ai', category_id: categoryMap.get('AI Tools'), payment_amount: 20, payment_frequency: 'monthly', payment_date: '2024-01-20', user_id: 'fixed-user-12345' },
          { name: 'Gemini', url: 'https://gemini.google.com', category_id: categoryMap.get('AI Tools'), user_id: 'fixed-user-12345' },

          // Social Media
          { name: 'X (Twitter)', url: 'https://x.com', category_id: categoryMap.get('Social Media'), payment_amount: 8, payment_frequency: 'monthly', payment_date: '2024-01-10', user_id: 'fixed-user-12345' },
          { name: 'LinkedIn', url: 'https://linkedin.com', category_id: categoryMap.get('Social Media'), payment_amount: 59.99, payment_frequency: 'monthly', payment_date: '2024-01-05', user_id: 'fixed-user-12345' },
          { name: 'Instagram', url: 'https://instagram.com', category_id: categoryMap.get('Social Media'), user_id: 'fixed-user-12345' },

          // Productivity
          { name: 'Notion', url: 'https://notion.so', category_id: categoryMap.get('Productivity'), payment_amount: 10, payment_frequency: 'monthly', payment_date: '2024-01-12', user_id: 'fixed-user-12345' },
          { name: 'Todoist', url: 'https://todoist.com', category_id: categoryMap.get('Productivity'), payment_amount: 4, payment_frequency: 'monthly', payment_date: '2024-01-08', user_id: 'fixed-user-12345' },
          { name: 'Calendly', url: 'https://calendly.com', category_id: categoryMap.get('Productivity'), payment_amount: 8, payment_frequency: 'monthly', payment_date: '2024-01-18', user_id: 'fixed-user-12345' },

          // Development
          { name: 'GitHub', url: 'https://github.com', category_id: categoryMap.get('Development'), payment_amount: 4, payment_frequency: 'monthly', payment_date: '2024-01-25', user_id: 'fixed-user-12345' },
          { name: 'Vercel', url: 'https://vercel.com', category_id: categoryMap.get('Development'), payment_amount: 20, payment_frequency: 'monthly', payment_date: '2024-01-30', user_id: 'fixed-user-12345' },
          { name: 'Netlify', url: 'https://netlify.com', category_id: categoryMap.get('Development'), user_id: 'fixed-user-12345' },

          // Entertainment
          { name: 'Netflix', url: 'https://netflix.com', category_id: categoryMap.get('Entertainment'), payment_amount: 15.49, payment_frequency: 'monthly', payment_date: '2024-01-22', user_id: 'fixed-user-12345' },
          { name: 'Spotify', url: 'https://spotify.com', category_id: categoryMap.get('Entertainment'), payment_amount: 9.99, payment_frequency: 'monthly', payment_date: '2024-01-14', user_id: 'fixed-user-12345' },
          { name: 'YouTube', url: 'https://youtube.com', category_id: categoryMap.get('Entertainment'), payment_amount: 11.99, payment_frequency: 'monthly', payment_date: '2024-01-17', user_id: 'fixed-user-12345' },

          // 미분류
          { name: 'Amazon', url: 'https://amazon.com', category_id: null, payment_amount: 139, payment_frequency: 'yearly', payment_date: '2024-03-15', user_id: 'fixed-user-12345' },
          { name: 'Dropbox', url: 'https://dropbox.com', category_id: null, payment_amount: 120, payment_frequency: 'yearly', payment_date: '2024-06-01', user_id: 'fixed-user-12345' }
        ];

        const { data: insertedShortcuts, error: shortcutError } = await supabase
          .from('shortcuts')
          .insert(sampleShortcuts)
          .select();

        if (shortcutError) {
          console.error('바로가기 삽입 실패:', shortcutError);
          return;
        }

        console.log('✅ 바로가기 삽입 완료:', insertedShortcuts?.length);
        toast.success(`샘플 데이터 생성 완료! 카테고리 ${insertedCategories?.length}개, 바로가기 ${insertedShortcuts?.length}개`);

      } else {
        console.log('✅ 기존 데이터 확인됨 - 샘플 데이터 삽입 건너뜀');
      }

    } catch (error) {
      console.error('❌ 샘플 데이터 삽입 실패:', error);
    }
  }

  /**
   * 데이터 매핑 함수들
   */
  private mapDbShortcutToAppShortcut(dbShortcut: any): Shortcut {
    return {
      id: dbShortcut.id,
      name: dbShortcut.name,
      url: dbShortcut.url,
      categoryId: dbShortcut.category_id || undefined,
      paymentDate: dbShortcut.payment_date || undefined,
      paymentAmount: dbShortcut.payment_amount || undefined,
      paymentFrequency: dbShortcut.payment_frequency || undefined,
    };
  }

  private mapDbCategoryToAppCategory(dbCategory: any): Category {
    return {
      id: dbCategory.id,
      name: dbCategory.name,
    };
  }

  /**
   * 연결 상태 반환
   */
  get isConnected(): boolean {
    return this.state.isConnected;
  }

  /**
   * 연결 상태 정보
   */
  getConnectionInfo() {
    return {
      isConnected: this.state.isConnected,
      lastCheck: new Date(this.state.lastConnectionCheck),
      retryCount: this.state.retryCount,
      maxRetries: this.state.maxRetries
    };
  }
}

// 싱글톤 인스턴스
export const supabaseMCP = new SupabaseMCPManager();
export default supabaseMCP;