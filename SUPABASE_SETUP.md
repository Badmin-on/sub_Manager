# Supabase 설정 가이드

## 새로운 프로젝트 설정

제공된 PostgreSQL 연결 문자열에 기반한 설정:
```
postgresql://postgres:[YOUR-PASSWORD]@db.mpvtbptqfozxwbyeyzix.supabase.co:5432/postgres
```

## 필수 환경 변수 설정

`.env.local` 파일을 업데이트하세요:

```env
# Supabase Configuration - Updated
SUPABASE_URL=https://mpvtbptqfozxwbyeyzix.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE

# Database Connection (PostgreSQL)
SUPABASE_DB_PASSWORD=YOUR_DATABASE_PASSWORD_HERE
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
