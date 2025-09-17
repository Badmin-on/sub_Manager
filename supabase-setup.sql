-- Supabase 데이터베이스 테이블 생성 스크립트
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요

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
CREATE POLICY "Users can CRUD their own categories"
ON categories FOR ALL
USING (user_id = 'fixed-user-12345');

-- 5. RLS 정책 생성 (Shortcuts)
CREATE POLICY "Users can CRUD their own shortcuts"
ON shortcuts FOR ALL
USING (user_id = 'fixed-user-12345');

-- 6. 초기 샘플 카테고리 데이터 삽입
INSERT INTO categories (name, user_id) VALUES
('Search Engines', 'fixed-user-12345'),
('AI Tools', 'fixed-user-12345'),
('Social Media', 'fixed-user-12345'),
('Productivity', 'fixed-user-12345'),
('Development', 'fixed-user-12345'),
('Entertainment', 'fixed-user-12345')
ON CONFLICT DO NOTHING;

-- 7. 초기 샘플 바로가기 데이터 삽입
WITH category_mapping AS (
    SELECT id, name FROM categories WHERE user_id = 'fixed-user-12345'
)
INSERT INTO shortcuts (name, url, category_id, payment_amount, payment_frequency, payment_date, user_id)
SELECT
    s.name,
    s.url,
    cm.id,
    s.payment_amount,
    s.payment_frequency,
    s.payment_date,
    'fixed-user-12345'
FROM (
    VALUES
    ('Google', 'https://google.com', 'Search Engines', NULL, NULL, NULL),
    ('Bing', 'https://bing.com', 'Search Engines', NULL, NULL, NULL),
    ('DuckDuckGo', 'https://duckduckgo.com', 'Search Engines', NULL, NULL, NULL),
    ('ChatGPT', 'https://chat.openai.com', 'AI Tools', 20, 'monthly', '2024-01-15'),
    ('Claude', 'https://claude.ai', 'AI Tools', 20, 'monthly', '2024-01-20'),
    ('Gemini', 'https://gemini.google.com', 'AI Tools', NULL, NULL, NULL),
    ('X (Twitter)', 'https://x.com', 'Social Media', 8, 'monthly', '2024-01-10'),
    ('LinkedIn', 'https://linkedin.com', 'Social Media', 59.99, 'monthly', '2024-01-05'),
    ('Instagram', 'https://instagram.com', 'Social Media', NULL, NULL, NULL),
    ('Notion', 'https://notion.so', 'Productivity', 10, 'monthly', '2024-01-12'),
    ('Todoist', 'https://todoist.com', 'Productivity', 4, 'monthly', '2024-01-08'),
    ('Calendly', 'https://calendly.com', 'Productivity', 8, 'monthly', '2024-01-18'),
    ('GitHub', 'https://github.com', 'Development', 4, 'monthly', '2024-01-25'),
    ('Vercel', 'https://vercel.com', 'Development', 20, 'monthly', '2024-01-30'),
    ('Netlify', 'https://netlify.com', 'Development', NULL, NULL, NULL),
    ('Netflix', 'https://netflix.com', 'Entertainment', 15.49, 'monthly', '2024-01-22'),
    ('Spotify', 'https://spotify.com', 'Entertainment', 9.99, 'monthly', '2024-01-14'),
    ('YouTube', 'https://youtube.com', 'Entertainment', 11.99, 'monthly', '2024-01-17')
) AS s(name, url, category_name, payment_amount, payment_frequency, payment_date)
LEFT JOIN category_mapping cm ON cm.name = s.category_name
ON CONFLICT DO NOTHING;

-- 8. 미분류 바로가기 추가
INSERT INTO shortcuts (name, url, category_id, payment_amount, payment_frequency, payment_date, user_id) VALUES
('Amazon', 'https://amazon.com', NULL, 139, 'yearly', '2024-03-15', 'fixed-user-12345'),
('Dropbox', 'https://dropbox.com', NULL, 120, 'yearly', '2024-06-01', 'fixed-user-12345')
ON CONFLICT DO NOTHING;

-- 완료 메시지
SELECT
    'Setup completed!' as message,
    (SELECT COUNT(*) FROM categories WHERE user_id = 'fixed-user-12345') as categories_count,
    (SELECT COUNT(*) FROM shortcuts WHERE user_id = 'fixed-user-12345') as shortcuts_count;