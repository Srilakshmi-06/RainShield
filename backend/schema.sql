-- RainShield Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    platform VARCHAR(50),
    vehicle_type VARCHAR(50),
    coverage_tier VARCHAR(20) DEFAULT 'basic',
    avg_daily_earnings DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Active Policies
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    premium_amount DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'active',
    last_payout_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payout History
CREATE TABLE IF NOT EXISTS payouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    trigger_reason TEXT,
    payout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'processed' -- processed, pending, flagged
);

-- Weather Tracking (Historical / Logs)
CREATE TABLE IF NOT EXISTS weather_logs (
    id SERIAL PRIMARY KEY,
    zone VARCHAR(100) NOT NULL,
    rainfall_mm DECIMAL(5, 2),
    aqi INTEGER,
    risk_level VARCHAR(20),
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
