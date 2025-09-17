
import React from 'react';
import HybridApp from './HybridApp';

/**
 * Main App Component - 새로운 Hybrid 시스템 사용
 * 
 * 개선사항:
 * 1. 자동 Supabase/localStorage 전환
 * 2. 연결 실패 시 끊김 없는 사용자 경험
 * 3. 실시간 연결 상태 모니터링
 * 4. 데이터 동기화 지원
 */

const App: React.FC = () => {
  return <HybridApp />;
};

export default App;
