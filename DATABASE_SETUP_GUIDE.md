# 🗄️ Supabase 데이터베이스 설정 가이드

## 1. SQL 스크립트 실행

Supabase Dashboard > SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- 1. Categories 테이블 생성
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Shortcuts 테이블 생성
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

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcuts ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성 (Categories)
CREATE POLICY "Users can manage their own categories"
ON categories FOR ALL
USING (user_id = 'fixed-user-12345');

-- 5. RLS 정책 생성 (Shortcuts)
CREATE POLICY "Users can manage their own shortcuts"
ON shortcuts FOR ALL
USING (user_id = 'fixed-user-12345');

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_shortcuts_user_id ON shortcuts(user_id);
CREATE INDEX IF NOT EXISTS idx_shortcuts_category_id ON shortcuts(category_id);

-- 완료 확인
SELECT 
    'Database setup completed successfully!' as message,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('categories', 'shortcuts')) as tables_created;
```

## 2. 환경 변수 업데이트

### 현재 .env.local 파일 수정 필요:

```env
# Supabase Configuration - 새 프로젝트 정보로 업데이트
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...YOUR_NEW_KEY

# Legacy support
SUPABASE_URL=https://YOUR_NEW_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...YOUR_NEW_KEY

# Optional: Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

### API 키를 찾는 방법:
1. Supabase Dashboard 접속
2. 프로젝트 선택
3. Settings > API 이동
4. "URL"과 "anon public" 키 복사

## 3. 연결 테스트

설정 완료 후 다음 방법으로 테스트:

### 앱에서 자동 테스트:
- 앱을 새로고침하면 자동으로 연결 상태 확인
- 상단 상태바에서 연결 상태 확인:
  - 🔴 **로컬 모드**: Supabase 연결 실패
  - 🟢 **클라우드 동기화 활성**: 연결 성공

### 수동 테스트 (터미널):
```bash
cd /home/user/webapp
node test-supabase.js
```

## 4. 문제 해결

### 일반적인 문제들:

#### 연결 실패 (ENOTFOUND):
- URL이 올바른지 확인
- 프로젝트가 활성 상태인지 확인
- 인터넷 연결 상태 확인

#### 권한 오류 (401/403):
- anon 키가 올바른지 확인
- RLS 정책이 올바르게 설정되었는지 확인

#### 테이블 없음 오류:
- SQL 스크립트가 성공적으로 실행되었는지 확인
- Supabase Dashboard > Table Editor에서 테이블 존재 확인

## 5. 설정 완료 후 기능

✅ **설정 완료 시 사용 가능한 기능:**
- 실시간 클라우드 동기화
- 다중 디바이스 데이터 공유
- 자동 백업 및 복원
- 오프라인 작업 후 자동 동기화
- 실시간 연결 상태 모니터링

📱 **현재도 사용 가능한 기능 (로컬 모드):**
- 바로가기 추가/편집/삭제
- 카테고리 관리
- 검색 및 필터링
- 데이터 가져오기/내보내기
- 모든 UI 기능

---

## 📞 설정 지원

Supabase 프로젝트 생성 및 설정이 완료되면:
1. 새로운 URL과 API 키를 알려주세요
2. 환경 변수 업데이트를 도와드리겠습니다
3. 연결 테스트 및 최종 확인을 진행하겠습니다