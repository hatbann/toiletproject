-- 화장실 정보 테이블
CREATE TABLE toilets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    description TEXT,
    has_password BOOLEAN DEFAULT FALSE,
    password_hint TEXT,
    type VARCHAR(20) DEFAULT 'user', -- 'public' or 'user'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    rating DECIMAL(2, 1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_by VARCHAR(100)
);

-- 화장실 사진 테이블
CREATE TABLE toilet_photos (
    id SERIAL PRIMARY KEY,
    toilet_id INTEGER REFERENCES toilets(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 리뷰 테이블
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    toilet_id INTEGER REFERENCES toilets(id) ON DELETE CASCADE,
    user_id VARCHAR(100),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_toilets_location ON toilets(latitude, longitude);
CREATE INDEX idx_toilets_status ON toilets(status);
CREATE INDEX idx_toilets_type ON toilets(type);
