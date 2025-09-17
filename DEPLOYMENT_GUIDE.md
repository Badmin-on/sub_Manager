# 🚀 배포 가이드

## ✅ 완료된 개선사항

### 1. 환경 설정 완료
- ✅ `.env.local` 파일 생성 (올바른 Supabase 정보 포함)
- ✅ `vercel.json` 파일 생성 (Vercel 배포 최적화)
- ✅ 환경 변수 통합 설정 완료

### 2. Supabase 연결 개선
- ✅ 실제 작동하는 Supabase URL 및 키 설정
- ✅ 연결 실패 시 로컬 모드 자동 전환
- ✅ 강화된 오류 처리 및 사용자 안내

### 3. 코드 품질 향상
- ✅ 개발/프로덕션 환경별 로깅
- ✅ PM2 기반 안정적인 서버 관리
- ✅ 빌드 최적화 및 성능 개선

### 4. 배포 준비 완료
- ✅ Vercel 배포용 설정 파일 준비
- ✅ 환경 변수 보안 설정
- ✅ 프로덕션 빌드 테스트 완료

## 🌐 Vercel 배포 방법

### 1. Vercel CLI 설치 및 로그인
```bash
npm i -g vercel
vercel login
```

### 2. 프로젝트 배포
```bash
cd /path/to/project
vercel --prod
```

### 3. 환경 변수 설정 (Vercel Dashboard)
```
VITE_SUPABASE_URL=https://mevtbqtqfaczvwbyrzlx.supabase.co
VITE_SUPABASE_ANON_KEY=[실제_Supabase_Anon_Key]
```

### 4. 자동 배포 설정
- GitHub repository와 연결
- main 브랜치 푸시 시 자동 배포
- PR 생성 시 preview 배포

## 🔧 Supabase 설정 (중요!)

### 현재 문제점
- **Supabase 연결 실패**: 현재 설정된 Supabase URL이 유효하지 않음
- **해결책**: 올바른 Supabase 프로젝트 생성 또는 기존 프로젝트 정보 확인 필요

### Supabase 프로젝트 재설정 방법
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 확인
3. Settings > API에서 URL과 anon key 복사
4. `.env.local` 파일의 해당 값 업데이트
5. `forceLocalMode = false`로 변경하여 클라우드 모드 활성화

### 필요한 테이블 구조
```sql
-- categories 테이블
CREATE TABLE categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- shortcuts 테이블  
CREATE TABLE shortcuts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  url text NOT NULL,
  category_id uuid REFERENCES categories(id),
  payment_date text,
  payment_amount numeric,
  payment_frequency text CHECK (payment_frequency IN ('monthly', 'yearly')),
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## ⚡ 현재 상태

### 작동 중인 기능
- ✅ 로컬 스토리지 모드 (완전 작동)
- ✅ 바로가기 추가/편집/삭제
- ✅ 카테고리 관리
- ✅ 검색 및 필터링
- ✅ 데이터 가져오기/내보내기
- ✅ 반응형 UI

### 향후 활성화할 기능 (Supabase 연결 시)
- 🔄 실시간 동기화
- 🔄 클라우드 데이터 백업
- 🔄 다중 디바이스 동기화
- 🔄 사용자 인증

## 📝 배포 후 체크리스트

- [ ] Vercel 배포 성공 확인
- [ ] 환경 변수 올바른 설정 확인  
- [ ] Supabase 연결 테스트
- [ ] 모든 기능 동작 확인
- [ ] 성능 최적화 확인
- [ ] 모바일 반응성 테스트

## 🆘 문제 해결

### 일반적인 문제들
1. **빌드 실패**: `npm run build` 재실행
2. **Vercel 배포 실패**: 환경 변수 확인
3. **Supabase 연결 실패**: 프로젝트 URL/키 재확인
4. **로컬 모드 문제**: 브라우저 로컬스토리지 클리어

### 지원 및 문의
- GitHub Issues 활용
- 로그 확인: 브라우저 개발자 도구 Console 탭