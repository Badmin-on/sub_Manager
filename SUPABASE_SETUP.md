# Supabase 설정 가이드

## 현재 연결된 프로젝트 정보

올바른 Supabase 프로젝트:
- **URL**: https://mevtbqtqfaczvwbyrzlx.supabase.co
- **Project ID**: mevtbqtqfaczvwbyrzlx

## 필수 환경 변수 설정 (자동 완료됨)

`.env.local` 파일이 올바른 정보로 자동 생성되었습니다:

```env
# Supabase Configuration - 올바른 프로젝트 정보
VITE_SUPABASE_URL=https://mevtbqtqfaczvwbyrzlx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Legacy support
SUPABASE_URL=https://mevtbqtqfaczvwbyrzlx.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## 개선된 기능들

### 1. 연결 상태 모니터링
- 자동 연결 테스트
- 연결 실패 시 로컬 모드로 자동 전환 안내
- 향상된 에러 메시지

### 2. 성능 개선
- 10초 타임아웃 설정
- 더 안정적인 fetch 설정
- 이벤트 수 제한 (eventsPerSecond: 2)

### 3. 개발자 친화적 기능
- 상세한 디버그 로그
- 연결 상태 실시간 체크
- 환경별 설정 분리
