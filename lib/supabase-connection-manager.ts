// Enhanced Supabase Connection Manager
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  error?: string;
  latency?: number;
  mode: 'cloud' | 'local' | 'offline';
}

export interface SupabaseConfig {
  url: string;
  key: string;
  isValid: boolean;
  error?: string;
}

export class SupabaseConnectionManager {
  private client: SupabaseClient | null = null;
  private status: ConnectionStatus = {
    isConnected: false,
    lastChecked: new Date(),
    mode: 'offline'
  };
  private config: SupabaseConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.validateEnvironment();
  }

  /**
   * 환경 변수 검증 및 설정
   */
  private validateEnvironment(): void {
    const url = import.meta.env.VITE_SUPABASE_URL || '';
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    // URL 형식 검증
    const urlPattern = /^https:\/\/[a-z0-9]+\.supabase\.co$/;
    const isValidUrl = urlPattern.test(url);
    
    // Key 형식 검증 (JWT 토큰)
    const keyPattern = /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/;
    const isValidKey = keyPattern.test(key);

    if (!url || !key) {
      this.config = {
        url: '',
        key: '',
        isValid: false,
        error: 'Supabase 환경 변수가 설정되지 않았습니다.'
      };
      return;
    }

    if (!isValidUrl) {
      this.config = {
        url,
        key,
        isValid: false,
        error: `유효하지 않은 Supabase URL 형식: ${url}`
      };
      return;
    }

    if (!isValidKey) {
      this.config = {
        url,
        key,
        isValid: false,
        error: '유효하지 않은 Supabase API 키 형식'
      };
      return;
    }

    this.config = {
      url,
      key,
      isValid: true
    };

    // 클라이언트 초기화
    try {
      this.client = createClient<Database>(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 2
          }
        }
      });
    } catch (error) {
      this.config.isValid = false;
      this.config.error = `Supabase 클라이언트 초기화 실패: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * 연결 상태 확인 (향상된 진단)
   */
  async checkConnection(timeout = 10000): Promise<ConnectionStatus> {
    const startTime = Date.now();
    
    this.status = {
      isConnected: false,
      lastChecked: new Date(),
      mode: 'offline'
    };

    // 환경 변수 검증 실패
    if (!this.config?.isValid) {
      this.status.error = this.config?.error || '환경 설정 오류';
      this.status.mode = 'local';
      return this.status;
    }

    if (!this.client) {
      this.status.error = 'Supabase 클라이언트가 초기화되지 않았습니다.';
      this.status.mode = 'local';
      return this.status;
    }

    try {
      // 1단계: 기본 연결 테스트
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Health check 엔드포인트 테스트
      const healthUrl = this.config.url.replace('/rest/v1', '/health');
      
      let healthResponse: Response;
      try {
        healthResponse = await fetch(healthUrl, {
          signal: controller.signal,
          headers: {
            'apikey': this.config.key,
          }
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            this.status.error = `연결 시간 초과 (${timeout}ms)`;
          } else if (fetchError.message.includes('ENOTFOUND')) {
            this.status.error = `도메인을 찾을 수 없습니다: ${this.config.url}`;
          } else if (fetchError.message.includes('fetch failed')) {
            this.status.error = '네트워크 연결 실패 - 인터넷 연결을 확인하세요';
          } else {
            this.status.error = `네트워크 오류: ${fetchError.message}`;
          }
        } else {
          this.status.error = '알 수 없는 네트워크 오류';
        }
        
        this.status.mode = 'local';
        return this.status;
      }

      // 2단계: API 응답 확인
      if (!healthResponse.ok) {
        if (healthResponse.status === 401) {
          this.status.error = 'API 키가 유효하지 않습니다';
        } else if (healthResponse.status === 403) {
          this.status.error = 'API 접근 권한이 없습니다';
        } else {
          this.status.error = `API 오류: ${healthResponse.status} ${healthResponse.statusText}`;
        }
        this.status.mode = 'local';
        return this.status;
      }

      // 3단계: 데이터베이스 테이블 접근 테스트
      try {
        const { error: dbError } = await this.client
          .from('categories')
          .select('count', { count: 'exact', head: true });

        if (dbError) {
          // 테이블이 존재하지 않는 경우
          if (dbError.message.includes('relation "categories" does not exist')) {
            this.status.error = '데이터베이스 테이블이 생성되지 않았습니다. 설정 SQL을 실행하세요.';
          } else {
            this.status.error = `데이터베이스 오류: ${dbError.message}`;
          }
          this.status.mode = 'local';
          return this.status;
        }
      } catch (dbError) {
        this.status.error = `데이터베이스 연결 실패: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`;
        this.status.mode = 'local';
        return this.status;
      }

      // 연결 성공
      const endTime = Date.now();
      this.status = {
        isConnected: true,
        lastChecked: new Date(),
        latency: endTime - startTime,
        mode: 'cloud'
      };

      this.reconnectAttempts = 0; // 성공 시 재연결 시도 횟수 리셋
      
      return this.status;

    } catch (error) {
      this.status.error = `예상치 못한 오류: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.status.mode = 'local';
      return this.status;
    }
  }

  /**
   * 자동 재연결 시도
   */
  async attemptReconnection(): Promise<boolean> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('🔄 최대 재연결 시도 횟수 도달, 로컬 모드로 전환');
      return false;
    }

    this.reconnectAttempts++;
    console.log(`🔄 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    const status = await this.checkConnection();
    
    if (status.isConnected) {
      console.log('✅ 재연결 성공');
      return true;
    }

    // 지수 백오프로 재시도
    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    console.log(`⏳ ${delay}ms 후 재시도...`);
    
    return new Promise((resolve) => {
      this.reconnectTimeout = setTimeout(async () => {
        const success = await this.attemptReconnection();
        resolve(success);
      }, delay);
    });
  }

  /**
   * 연결 모니터링 시작
   */
  startMonitoring(intervalMs = 30000): void {
    setInterval(async () => {
      if (this.status.isConnected) {
        await this.checkConnection(5000); // 빠른 체크
      }
    }, intervalMs);
  }

  /**
   * 현재 상태 반환
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * 현재 설정 반환
   */
  getConfig(): SupabaseConfig | null {
    return this.config ? { ...this.config } : null;
  }

  /**
   * Supabase 클라이언트 반환 (연결된 경우에만)
   */
  getClient(): SupabaseClient<Database> | null {
    return this.status.isConnected ? this.client : null;
  }

  /**
   * 강제 로컬 모드 전환
   */
  forceLocalMode(): void {
    this.status = {
      isConnected: false,
      lastChecked: new Date(),
      mode: 'local',
      error: '사용자가 로컬 모드로 전환'
    };

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * 리소스 정리
   */
  cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// 싱글톤 인스턴스
export const supabaseConnectionManager = new SupabaseConnectionManager();