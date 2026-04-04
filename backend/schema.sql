-- RainShield Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INTEGER,
    city VARCHAR(100),
    platform VARCHAR(50),
    vehicle_type VARCHAR(50),
    working_hours INTEGER,
    preferred_zones TEXT,
    risk_score DECIMAL(5, 2) DEFAULT 0.00,
    coverage_tier VARCHAR(20) DEFAULT 'basic',
    avg_daily_earnings DECIMAL(10, 2) DEFAULT 800.00,
    verification_status VARCHAR(20) DEFAULT 'unverified',
    documents_linked BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'worker',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Active & Past Policies
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    coverage_tier VARCHAR(20) DEFAULT 'standard', -- basic, standard, premium
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    premium_amount DECIMAL(10, 2),
    current_premium DECIMAL(10, 2), -- Dynamic premium scaling
    payout_limit DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'active', -- active, expiring_soon, expired, pending_renewal
    auto_renew BOOLEAN DEFAULT TRUE,
    grace_period_end DATE,
    risk_level VARCHAR(20) DEFAULT 'Low', -- Current risk factor
    risk_insights JSONB, -- { breakdown: {}, factors: [], payout_scenarios: {} }
    last_payout_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Trigger Events / Risk Alerts
CREATE TABLE IF NOT EXISTS risk_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    city VARCHAR(100),
    risk_type VARCHAR(50), -- Flood, Health, Accident
    risk_level VARCHAR(20), -- Low, Medium, High
    message TEXT,
    suggested_claim BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    policy_id INTEGER REFERENCES policies(id),
    risk_alert_id INTEGER REFERENCES risk_alerts(id),
    claim_type VARCHAR(50),
    description TEXT,
    amount DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weather Risk Predictions
CREATE TABLE IF NOT EXISTS weather_risk_predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    rainfall DECIMAL(5, 2),
    temperature DECIMAL(5, 2),
    predicted_earnings DECIMAL(10, 2),
    risk_level VARCHAR(20),
    payout_amount DECIMAL(10, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
