# 구독 서비스 바로가기 매니저

웹사이트와 구독 서비스들을 효율적으로 관리할 수 있는 React 애플리케이션입니다.

## 주요 기능

- 🌐 **웹사이트 바로가기 관리**: 자주 사용하는 웹사이트들을 카테고리별로 정리
- 💰 **구독 서비스 추적**: 결제일과 금액을 관리하여 월별 비용 추적
- 🏪 **다중 저장소 지원**: 로컬 저장소, Firebase, Google Sheets 중 선택 가능
- 🌍 **다국어 지원**: 한국어, 영어 지원
- 📱 **반응형 디자인**: 모바일과 데스크톱 환경 모두 지원

## 로컬 실행

**필요 조건:** Node.js

1. **의존성 설치:**
   ```bash
   npm install
   ```

2. **환경 변수 설정 (선택사항):**
   
   Firebase나 다른 서비스를 사용하려면 `.env.local` 파일을 생성하세요:
   ```bash
   cp .env.example .env.local
   ```
   
   **주의**: 환경변수 없이도 앱이 정상 작동합니다 (로컬 저장소 사용)

3. **개발 서버 실행:**
   ```bash
   npm run dev
   ```

4. 브라우저에서 `http://localhost:5173`으로 접속

## Vercel 배포

이 앱은 Vercel에 최적화되어 있습니다:

### 간편 배포
1. GitHub 저장소를 Vercel에 연결
2. 자동 배포 (환경변수 설정 없이도 작동)

### 환경변수 설정 (선택사항)
고급 기능(Firebase, Supabase)을 사용하려면 Vercel 대시보드에서 환경변수를 설정하세요:
- `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, 등
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`

## 저장소 옵션

### 1. 로컬 저장소 (기본값)
- 브라우저 로컬 스토리지에 데이터 저장
- 별도 설정 불필요
- 가장 빠르고 간단

### 2. Firebase Realtime Database
- 실시간 클라우드 데이터베이스
- 여러 기기 간 동기화 지원
- Firebase 프로젝트 설정 필요

### 3. Google Sheets
- Google 스프레드시트에 데이터 저장
- 스프레드시트로 직접 데이터 관리 가능
- Google Cloud Console 설정 필요

## 기술 스택

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Backend**: Firebase Realtime Database (선택사항)
- **Storage**: 로컬 스토리지, Firebase, Google Sheets API
- **Deployment**: Vercel

## 라이선스

MIT License