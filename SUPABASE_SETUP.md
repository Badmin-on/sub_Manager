# 🚀 Supabase 실시간 동기화 설정 가이드

LinkHub Manager에서 Supabase 기반 실시간 동기화 기능을 사용하는 방법을 설명합니다.

## 📋 1단계: Supabase 프로젝트 생성

### 1. Supabase 계정 생성
1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub/Google 계정으로 로그인

### 2. 새 프로젝트 생성
1. Dashboard에서 "New project" 클릭
2. 프로젝트 정보 입력:
   - **Name**: LinkHub Manager (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정
   - **Region**: 가장 가까운 지역 선택 (예: Northeast Asia)
3. "Create new project" 클릭 (2-3분 소요)

## 🔧 2단계: 데이터베이스 설정

### 1. SQL Editor에서 스키마 생성
1. Supabase Dashboard에서 **SQL Editor** 클릭
2. `database/schema.sql` 파일의 내용을 복사
3. SQL Editor에 붙여넣기
4. "RUN" 버튼 클릭하여 실행

### 2. 테이블 생성 확인
1. **Table Editor** 클릭
2. `categories`와 `shortcuts` 테이블이 생성되었는지 확인

## 🔑 3단계: API 키 설정

### 1. 프로젝트 설정에서 API 키 가져오기
1. **Settings** > **API** 클릭
2. 다음 정보 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (긴 JWT 토큰)

### 2. 환경변수 설정
`.env.local` 파일을 열고 다음과 같이 수정:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini API Key (기존)
GEMINI_API_KEY=your-gemini-key
```

**⚠️ 실제 값으로 교체하세요!**

## 🔐 4단계: 인증 설정

### 1. Authentication 활성화
1. **Authentication** > **Settings** 클릭
2. **Email Auth** 확인 (기본적으로 활성화됨)

### 2. 이메일 템플릿 설정 (선택사항)
1. **Authentication** > **Email Templates** 클릭
2. 회원가입 확인 이메일 템플릿 커스터마이징

## 🌐 5단계: 실시간 기능 활성화

### 1. Realtime 설정
1. **Settings** > **API** 클릭
2. **Realtime** 섹션에서 활성화 확인
3. 테이블별 실시간 구독이 활성화되어 있는지 확인

## 🚀 6단계: 애플리케이션 실행

### 1. 서버 재시작
```bash
cd /home/user/webapp
pm2 restart linkhub-manager
```

### 2. 클라우드 모드 활성화
1. 웹 애플리케이션 접속
2. 상단의 토글 스위치에서 "클라우드" 모드로 변경
3. 로그인/회원가입 화면이 나타남

### 3. 계정 생성 및 테스트
1. 새 계정으로 회원가입
2. 이메일 확인 (필요시)
3. 로그인 후 바로가기 추가/수정/삭제 테스트

## ✨ 실시간 동기화 테스트

### 1. 멀티 브라우저 테스트
1. 같은 계정으로 여러 브라우저에서 로그인
2. 한 브라우저에서 바로가기 추가
3. 다른 브라우저에서 실시간으로 업데이트 확인

### 2. 모바일 테스트
1. 모바일 브라우저에서 동일한 URL 접속
2. 같은 계정으로 로그인
3. 데스크톱과 실시간 동기화 확인

## 🛠️ 트러블슈팅

### 연결 오류
- `.env.local`의 URL과 키가 정확한지 확인
- 브라우저 콘솔에서 네트워크 오류 확인

### 인증 오류
- Supabase Authentication 설정 확인
- 이메일 확인 메일 체크

### 실시간 동기화 안됨
- Realtime 기능 활성화 확인
- 브라우저 네트워크 탭에서 WebSocket 연결 확인

## 💡 추가 기능

### RLS (Row Level Security)
- 사용자별 데이터 격리 자동 적용
- 본인 데이터만 접근 가능

### 백업 및 복원
- Supabase Dashboard에서 데이터 백업 가능
- Excel 내보내기/가져오기 기능 유지

### 성능 최적화
- 인덱스 자동 적용으로 빠른 검색
- 실시간 업데이트 최적화

---

## 🎉 완료!

이제 LinkHub Manager에서 실시간 동기화 기능을 사용할 수 있습니다!

- ✅ 여러 기기에서 실시간 동기화
- ✅ 안전한 사용자 인증
- ✅ 클라우드 기반 데이터 저장
- ✅ 자동 백업 및 복원
- ✅ 무제한 확장성