-- LinkHub Manager Database Schema for Supabase
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 카테고리 테이블 생성
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 바로가기/링크 테이블 생성
CREATE TABLE IF NOT EXISTS shortcuts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    payment_date DATE,
    payment_amount DECIMAL(10,2),
    payment_frequency VARCHAR(10) CHECK (payment_frequency IN ('monthly', 'yearly')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_shortcuts_user_id ON shortcuts(user_id);
CREATE INDEX IF NOT EXISTS idx_shortcuts_category_id ON shortcuts(category_id);
CREATE INDEX IF NOT EXISTS idx_shortcuts_payment_date ON shortcuts(payment_date);

-- 4. RLS (Row Level Security) 정책 활성화
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcuts ENABLE ROW LEVEL SECURITY;

-- 5. 사용자별 데이터 접근 정책 설정
-- 카테고리 정책
CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- 바로가기 정책
CREATE POLICY "Users can view own shortcuts" ON shortcuts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shortcuts" ON shortcuts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shortcuts" ON shortcuts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shortcuts" ON shortcuts
    FOR DELETE USING (auth.uid() = user_id);

-- 6. 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 트리거 생성 (updated_at 자동 갱신)
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shortcuts_updated_at 
    BEFORE UPDATE ON shortcuts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE shortcuts;