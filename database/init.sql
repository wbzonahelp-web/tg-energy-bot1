CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE TABLE IF NOT EXISTS mailings (
    id SERIAL PRIMARY KEY,
    message_text TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    status VARCHAR(50) DEFAULT 'draft',
    total_users INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_by BIGINT
);

CREATE TABLE IF NOT EXISTS mailing_logs (
    id SERIAL PRIMARY KEY,
    mailing_id INTEGER REFERENCES mailings(id),
    user_id BIGINT,
    status VARCHAR(50),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mailing_logs_mailing_id ON mailing_logs(mailing_id);
