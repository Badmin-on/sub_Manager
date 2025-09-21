# Firebase 구독 서비스 관리자

Firebase 실시간 데이터베이스를 사용하여 구독 서비스들을 효율적으로 관리하는 React 애플리케이션입니다.

## 주요 기능

- 🌐 **웹사이트 바로가기 관리**: 자주 사용하는 웹사이트들을 카테고리별로 정리
- 💰 **구독 서비스 추적**: 결제일과 금액을 관리하여 월별 비용 추적  
- 🔄 **실시간 동기화**: Firebase를 통한 모든 기기 간 실시간 데이터 동기화
- 🔐 **Google 인증**: 안전한 Google 계정 로그인
- 🌍 **다국어 지원**: 한국어, 영어 지원
- 📱 **반응형 디자인**: 모바일과 데스크톱 환경 모두 지원

## Firebase 설정

### 1. Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. **Authentication** > **Sign-in method** > **Google** 활성화
3. **Realtime Database** 생성 및 활성화
4. **웹앱** 등록하고 설정 정보 복사

### 2. 보안 규칙 설정
Realtime Database 규칙을 다음과 같이 설정하세요:
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## 로컬 개발

**필요 조건:** Node.js, Firebase 프로젝트

1. **의존성 설치:**
   ```bash
   npm install
   ```

2. **환경 변수 설정:**
   ```bash
   cp .env.example .env.local
   ```
   
   `.env.local` 파일에 Firebase 설정 정보를 입력하세요.

3. **개발 서버 실행:**
   ```bash
   npm run dev
   ```

4. 브라우저에서 `http://localhost:5173`으로 접속

## Vercel 배포

### 자동 배포 설정
1. GitHub 저장소를 Vercel에 연결
2. Vercel 대시보드에서 환경변수 설정:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN` 
   - `FIREBASE_DATABASE_URL`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`

### 수동 배포
```bash
npm run build
```

## 사용 방법

1. **로그인**: Google 계정으로 로그인
2. **바로가기 추가**: 즐겨 사용하는 웹사이트 추가
3. **카테고리 관리**: 바로가기를 카테고리별로 정리
4. **구독 관리**: 결제일과 금액을 설정하여 구독 서비스 추적
5. **실시간 동기화**: 모든 기기에서 동일한 데이터 확인

## 기술 스택

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth (Google)
- **Hosting**: Vercel
- **State Management**: React Hooks

## 프로젝트 구조

```
src/
├── components/           # React 컴포넌트
├── hooks/               # 커스텀 훅 (Firebase 연동)
├── lib/                 # Firebase 설정
├── src/
│   ├── translations/    # 다국어 번역 파일
│   └── types/          # TypeScript 타입 정의
├── context/            # React Context (언어 설정)
└── types.ts            # 공통 타입 정의
```

## 라이선스

MIT License