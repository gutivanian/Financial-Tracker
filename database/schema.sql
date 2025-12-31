-- Personal Finance Management Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table (bank accounts, e-wallets, cash, credit cards)
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'bank', 'cash', 'e-wallet', 'credit_card'
    balance DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'IDR',
    icon VARCHAR(50),
    color VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'income', 'expense'
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    icon VARCHAR(50),
    color VARCHAR(50),
    budget_type VARCHAR(20), -- 'needs', 'wants', 'savings'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL, -- 'income', 'expense', 'transfer'
    amount DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    notes TEXT,
    merchant VARCHAR(255),
    tags TEXT[], -- array of tags
    is_recurring BOOLEAN DEFAULT false,
    recurring_id INTEGER,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recurring transactions table
CREATE TABLE recurring_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    start_date DATE NOT NULL,
    end_date DATE,
    next_date DATE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    rollover BOOLEAN DEFAULT false,
    alert_threshold DECIMAL(5, 2) DEFAULT 80, -- percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial goals table
CREATE TABLE financial_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    target_date DATE,
    priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    goal_type VARCHAR(50), -- 'emergency_fund', 'vacation', 'home', 'retirement', etc.
    auto_save_amount DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goal contributions table
CREATE TABLE goal_contributions (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER REFERENCES financial_goals(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investments table
CREATE TABLE investments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL, -- 'stocks', 'mutual_funds', 'crypto', 'bonds', 'gold', 'property'
    name VARCHAR(255) NOT NULL,
    ticker VARCHAR(50),
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(15, 2) NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL,
    current_price DECIMAL(15, 2),
    platform VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assets table (physical assets)
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- 'property', 'vehicle', 'electronics', 'jewelry', 'collectibles'
    purchase_date DATE,
    purchase_price DECIMAL(15, 2),
    current_value DECIMAL(15, 2),
    depreciation_rate DECIMAL(5, 2), -- annual percentage
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Debts table
CREATE TABLE debts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    debt_type VARCHAR(50) NOT NULL, -- 'credit_card', 'mortgage', 'personal_loan', 'auto_loan', 'paylater', 'personal'
    creditor VARCHAR(255) NOT NULL,
    original_amount DECIMAL(15, 2) NOT NULL,
    current_balance DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2),
    minimum_payment DECIMAL(15, 2),
    payment_due_date INTEGER, -- day of month
    start_date DATE,
    maturity_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'paid_off'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Debt payments table
CREATE TABLE debt_payments (
    id SERIAL PRIMARY KEY,
    debt_id INTEGER REFERENCES debts(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    principal_amount DECIMAL(15, 2),
    interest_amount DECIMAL(15, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit cards table
CREATE TABLE credit_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    card_name VARCHAR(255) NOT NULL,
    bank VARCHAR(100),
    credit_limit DECIMAL(15, 2) NOT NULL,
    current_balance DECIMAL(15, 2) DEFAULT 0,
    statement_date INTEGER, -- day of month
    due_date INTEGER, -- day of month
    interest_rate DECIMAL(5, 2),
    rewards_program VARCHAR(100),
    points_earned DECIMAL(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_budgets_user_period ON budgets(user_id, period_start, period_end);
CREATE INDEX idx_goals_user ON financial_goals(user_id);
CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_debts_user ON debts(user_id);

-- Insert sample data for development
INSERT INTO users (email, name) VALUES 
('demo@finance.com', 'Demo User');

-- Sample accounts
INSERT INTO accounts (user_id, name, type, balance, icon, color) VALUES
(1, 'BCA Tahapan', 'bank', 15000000, 'Building2', '#1a80b0'),
(1, 'Mandiri Tabungan', 'bank', 8500000, 'Building2', '#f59e0b'),
(1, 'Dompet', 'cash', 500000, 'Wallet', '#10b981'),
(1, 'GoPay', 'e-wallet', 250000, 'Smartphone', '#00aa13'),
(1, 'OVO', 'e-wallet', 150000, 'Smartphone', '#4c3494'),
(1, 'BCA Credit Card', 'credit_card', -2500000, 'CreditCard', '#ef4444');

-- Sample categories - Income
INSERT INTO categories (user_id, name, type, icon, color, budget_type) VALUES
(1, 'Gaji', 'income', 'Briefcase', '#10b981', NULL),
(1, 'Freelance', 'income', 'Code', '#3b82f6', NULL),
(1, 'Bonus', 'income', 'Gift', '#8b5cf6', NULL),
(1, 'Investment Returns', 'income', 'TrendingUp', '#06b6d4', NULL);

-- Sample categories - Expenses (Needs)
INSERT INTO categories (user_id, name, type, icon, color, budget_type) VALUES
(1, 'Makanan & Groceries', 'expense', 'ShoppingCart', '#f59e0b', 'needs'),
(1, 'Transport', 'expense', 'Car', '#ef4444', 'needs'),
(1, 'Utilitas', 'expense', 'Zap', '#06b6d4', 'needs'),
(1, 'Sewa/KPR', 'expense', 'Home', '#8b5cf6', 'needs'),
(1, 'Asuransi', 'expense', 'Shield', '#10b981', 'needs'),
(1, 'Healthcare', 'expense', 'Heart', '#ec4899', 'needs');

-- Sample categories - Expenses (Wants)
INSERT INTO categories (user_id, name, type, icon, color, budget_type) VALUES
(1, 'Entertainment', 'expense', 'Film', '#a855f7', 'wants'),
(1, 'Makan di Luar', 'expense', 'UtensilsCrossed', '#f97316', 'wants'),
(1, 'Shopping', 'expense', 'ShoppingBag', '#ec4899', 'wants'),
(1, 'Subscription', 'expense', 'Repeat', '#06b6d4', 'wants'),
(1, 'Travel', 'expense', 'Plane', '#3b82f6', 'wants');

-- Sample categories - Savings
INSERT INTO categories (user_id, name, type, icon, color, budget_type) VALUES
(1, 'Emergency Fund', 'expense', 'AlertCircle', '#10b981', 'savings'),
(1, 'Investasi', 'expense', 'TrendingUp', '#3b82f6', 'savings'),
(1, 'Tabungan', 'expense', 'PiggyBank', '#8b5cf6', 'savings');

-- Sample transactions for current month
INSERT INTO transactions (user_id, account_id, category_id, type, amount, date, description, merchant) VALUES
-- Income
(1, 1, 1, 'income', 12000000, CURRENT_DATE - INTERVAL '25 days', 'Gaji Bulan November', 'PT Example Company'),
(1, 1, 2, 'income', 3500000, CURRENT_DATE - INTERVAL '15 days', 'Project Web Development', 'Client XYZ'),

-- Expenses - Needs
(1, 1, 5, 'expense', 500000, CURRENT_DATE - INTERVAL '23 days', 'Belanja bulanan', 'Superindo'),
(1, 3, 5, 'expense', 150000, CURRENT_DATE - INTERVAL '20 days', 'Sayur dan buah', 'Pasar'),
(1, 4, 6, 'expense', 200000, CURRENT_DATE - INTERVAL '22 days', 'Bensin', 'Shell'),
(1, 4, 6, 'expense', 50000, CURRENT_DATE - INTERVAL '18 days', 'Parkir dan tol', NULL),
(1, 1, 7, 'expense', 350000, CURRENT_DATE - INTERVAL '20 days', 'Listrik bulan November', 'PLN'),
(1, 1, 7, 'expense', 300000, CURRENT_DATE - INTERVAL '19 days', 'Internet Indihome', 'Telkom'),
(1, 1, 8, 'expense', 3000000, CURRENT_DATE - INTERVAL '1 days', 'Sewa kost', 'Ibu Kost'),
(1, 1, 9, 'expense', 500000, CURRENT_DATE - INTERVAL '15 days', 'Asuransi kesehatan', 'Allianz'),
(1, 3, 10, 'expense', 250000, CURRENT_DATE - INTERVAL '10 days', 'Periksa dokter', 'RS Siloam'),

-- Expenses - Wants
(1, 4, 11, 'expense', 150000, CURRENT_DATE - INTERVAL '12 days', 'Nonton film', 'CGV'),
(1, 5, 12, 'expense', 85000, CURRENT_DATE - INTERVAL '8 days', 'Makan siang', 'Resto Padang'),
(1, 4, 12, 'expense', 120000, CURRENT_DATE - INTERVAL '5 days', 'Dinner', 'Starbucks'),
(1, 6, 13, 'expense', 450000, CURRENT_DATE - INTERVAL '14 days', 'Beli baju', 'Uniqlo'),
(1, 1, 14, 'expense', 49000, CURRENT_DATE - INTERVAL '1 days', 'Netflix', 'Netflix'),
(1, 1, 14, 'expense', 54900, CURRENT_DATE - INTERVAL '3 days', 'Spotify Premium', 'Spotify'),

-- Savings
(1, 1, 16, 'expense', 2000000, CURRENT_DATE - INTERVAL '24 days', 'Transfer ke emergency fund', NULL),
(1, 1, 17, 'expense', 1500000, CURRENT_DATE - INTERVAL '24 days', 'Beli reksadana', 'Bibit'),

-- More recent transactions
(1, 3, 5, 'expense', 75000, CURRENT_DATE - INTERVAL '3 days', 'Groceries', 'Indomaret'),
(1, 4, 6, 'expense', 180000, CURRENT_DATE - INTERVAL '2 days', 'Bensin', 'Pertamina'),
(1, 5, 12, 'expense', 95000, CURRENT_DATE - INTERVAL '1 days', 'Makan siang', 'Bakmi GM'),
(1, 4, 11, 'expense', 200000, CURRENT_DATE, 'Main ke timezone', 'Mall');

-- Sample budgets for current month
INSERT INTO budgets (user_id, category_id, amount, period_start, period_end) VALUES
(1, 5, 2000000, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
(1, 6, 1000000, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
(1, 7, 800000, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
(1, 8, 3000000, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
(1, 11, 500000, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
(1, 12, 1000000, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
(1, 13, 1500000, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
(1, 14, 300000, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day');

-- Sample financial goals
INSERT INTO financial_goals (user_id, account_id, name, description, target_amount, current_amount, target_date, priority, goal_type, auto_save_amount) VALUES
(1, 2, 'Emergency Fund', 'Dana darurat 6x pengeluaran bulanan', 36000000, 12000000, CURRENT_DATE + INTERVAL '12 months', 'high', 'emergency_fund', 2000000),
(1, 1, 'Liburan ke Jepang', 'Liburan keluarga 2025', 25000000, 5000000, CURRENT_DATE + INTERVAL '6 months', 'medium', 'vacation', 1000000),
(1, 1, 'DP Rumah', 'Down payment rumah', 150000000, 30000000, CURRENT_DATE + INTERVAL '24 months', 'high', 'home', 3000000),
(1, 2, 'Gadget Fund', 'Beli iPhone baru', 15000000, 8000000, CURRENT_DATE + INTERVAL '4 months', 'low', 'shopping', 500000);

-- Sample goal contributions
INSERT INTO goal_contributions (goal_id, amount, date, notes) VALUES
(1, 2000000, CURRENT_DATE - INTERVAL '25 days', 'Monthly contribution'),
(2, 1000000, CURRENT_DATE - INTERVAL '25 days', 'Monthly contribution'),
(3, 3000000, CURRENT_DATE - INTERVAL '25 days', 'Monthly contribution'),
(4, 500000, CURRENT_DATE - INTERVAL '25 days', 'Monthly contribution');

-- Sample investments
INSERT INTO investments (user_id, asset_type, name, ticker, purchase_date, purchase_price, quantity, current_price, platform) VALUES
(1, 'stocks', 'Bank BCA', 'BBCA.JK', '2024-01-15', 9500, 100, 10200, 'Ajaib'),
(1, 'stocks', 'Bank Mandiri', 'BMRI.JK', '2024-02-20', 6200, 150, 6450, 'Ajaib'),
(1, 'mutual_funds', 'Sucorinvest Equity Fund', 'SEF', '2023-06-10', 2500, 400, 2850, 'Bibit'),
(1, 'crypto', 'Bitcoin', 'BTC', '2023-08-15', 450000000, 0.05, 680000000, 'Indodax'),
(1, 'gold', 'Emas Antam', 'GOLD', '2024-03-01', 1050000, 20, 1120000, 'Pegadaian Digital');

-- Sample assets
INSERT INTO assets (user_id, name, asset_type, purchase_date, purchase_price, current_value, depreciation_rate) VALUES
(1, 'Motor Honda PCX', 'vehicle', '2022-05-15', 35000000, 28000000, 10),
(1, 'MacBook Pro M1', 'electronics', '2023-01-20', 22000000, 16000000, 15),
(1, 'iPhone 14 Pro', 'electronics', '2023-09-25', 18000000, 13000000, 20);

-- Sample debts
INSERT INTO debts (user_id, debt_type, creditor, original_amount, current_balance, interest_rate, minimum_payment, payment_due_date, start_date, maturity_date) VALUES
(1, 'credit_card', 'BCA Credit Card', 5000000, 2500000, 2.95, 250000, 15, '2024-01-01', NULL),
(1, 'personal_loan', 'Bank Mandiri KTA', 20000000, 12000000, 12.5, 600000, 10, '2023-06-01', '2026-06-01');

-- Sample credit card
INSERT INTO credit_cards (user_id, account_id, card_name, bank, credit_limit, current_balance, statement_date, due_date, interest_rate, rewards_program, points_earned) VALUES
(1, 6, 'BCA Everyday Card', 'BCA', 10000000, 2500000, 1, 15, 2.95, 'BCA Rewards', 125000);


-- Master data for investment instruments
CREATE TABLE investment_instruments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- 'stocks_id', 'stocks_us', 'mutual_funds', 'crypto', 'bonds', 'commodities'
    market VARCHAR(100), -- 'IDX', 'NASDAQ', 'NYSE', 'Crypto', etc
    currency VARCHAR(10) DEFAULT 'IDR',
    country VARCHAR(50),
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, market)
);

-- Add foreign key to investments table
ALTER TABLE investments 
ADD COLUMN instrument_id INTEGER REFERENCES investment_instruments(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX idx_instruments_type ON investment_instruments(asset_type);
CREATE INDEX idx_instruments_symbol ON investment_instruments(symbol);

-- Sample master data
INSERT INTO investment_instruments (name, symbol, asset_type, market, currency, country) VALUES
-- Indonesian Stocks
('PT Bank Central Asia Tbk', 'BBCA', 'stocks_id', 'IDX', 'IDR', 'Indonesia'),
('PT Bank Mandiri Tbk', 'BMRI', 'stocks_id', 'IDX', 'IDR', 'Indonesia'),
('PT Bank Rakyat Indonesia Tbk', 'BBRI', 'stocks_id', 'IDX', 'IDR', 'Indonesia'),
('PT Bank Negara Indonesia Tbk', 'BBNI', 'stocks_id', 'IDX', 'IDR', 'Indonesia'),
('PT Telkom Indonesia Tbk', 'TLKM', 'stocks_id', 'IDX', 'IDR', 'Indonesia'),
('PT Unilever Indonesia Tbk', 'UNVR', 'stocks_id', 'IDX', 'IDR', 'Indonesia'),

-- US Stocks
('Apple Inc', 'AAPL', 'stocks_us', 'NASDAQ', 'USD', 'United States'),
('Microsoft Corporation', 'MSFT', 'stocks_us', 'NASDAQ', 'USD', 'United States'),
('NVIDIA Corporation', 'NVDA', 'stocks_us', 'NASDAQ', 'USD', 'United States'),
('Alphabet Inc Class A', 'GOOGL', 'stocks_us', 'NASDAQ', 'USD', 'United States'),
('Amazon.com Inc', 'AMZN', 'stocks_us', 'NASDAQ', 'USD', 'United States'),
('Tesla Inc', 'TSLA', 'stocks_us', 'NASDAQ', 'USD', 'United States'),
('Meta Platforms Inc', 'META', 'stocks_us', 'NASDAQ', 'USD', 'United States'),

-- Mutual Funds
('Sucorinvest Equity Fund', 'SUCORINVEST-EF', 'mutual_funds', 'Indonesia', 'IDR', 'Indonesia'),
('Mandiri Investa Atraktif', 'MANDIRI-IA', 'mutual_funds', 'Indonesia', 'IDR', 'Indonesia'),
('Schroder Dana Prestasi Plus', 'SCHRODER-DPP', 'mutual_funds', 'Indonesia', 'IDR', 'Indonesia'),
('BNI-AM Dana Saham Inspirasi', 'BNI-DSI', 'mutual_funds', 'Indonesia', 'IDR', 'Indonesia'),

-- Cryptocurrency
('Bitcoin', 'BTC', 'crypto', 'Crypto', 'USD', 'Global'),
('Ethereum', 'ETH', 'crypto', 'Crypto', 'USD', 'Global'),
('Binance Coin', 'BNB', 'crypto', 'Crypto', 'USD', 'Global'),
('Ripple', 'XRP', 'crypto', 'Crypto', 'USD', 'Global'),
('Cardano', 'ADA', 'crypto', 'Crypto', 'USD', 'Global'),
('Solana', 'SOL', 'crypto', 'Crypto', 'USD', 'Global'),

-- Commodities
('Gold', 'GOLD', 'commodities', 'Commodity', 'USD', 'Global'),
('Silver', 'SILVER', 'commodities', 'Commodity', 'USD', 'Global'),
('Crude Oil', 'OIL', 'commodities', 'Commodity', 'USD', 'Global');

ALTER TABLE investment_instruments 
ADD COLUMN price_source VARCHAR(50),
ADD COLUMN price_mapping VARCHAR(100);

-- Add comment for clarity
COMMENT ON COLUMN investment_instruments.price_source IS 'API source for price: coingecko, yahoo_finance, alpha_vantage, finnhub';
COMMENT ON COLUMN investment_instruments.price_mapping IS 'Ticker/ID used in the price source API (e.g., bitcoin for coingecko, AAPL for yahoo)';

-- Crypto mappings for CoinGecko
UPDATE investment_instruments 
SET price_source = 'coingecko',
    price_mapping = CASE symbol
        WHEN 'BTC' THEN 'bitcoin'
        WHEN 'ETH' THEN 'ethereum'
        WHEN 'BNB' THEN 'binancecoin'
        WHEN 'XRP' THEN 'ripple'
        WHEN 'ADA' THEN 'cardano'
        WHEN 'SOL' THEN 'solana'
        WHEN 'DOGE' THEN 'dogecoin'
        WHEN 'DOT' THEN 'polkadot'
        WHEN 'MATIC' THEN 'matic-network'
        WHEN 'AVAX' THEN 'avalanche-2'
    END
WHERE asset_type = 'crypto';

-- US Stocks for Yahoo Finance
UPDATE investment_instruments 
SET price_source = 'yahoo_finance',
    price_mapping = symbol
WHERE asset_type = 'stocks_us';

-- Indonesian Stocks for Yahoo Finance
UPDATE investment_instruments 
SET price_source = 'yahoo_finance',
    price_mapping = CASE 
        WHEN symbol LIKE '%.JK' THEN symbol 
        ELSE symbol || '.JK' 
    END
WHERE asset_type = 'stocks_id';

-- Commodities for Yahoo Finance
UPDATE investment_instruments 
SET price_source = 'yahoo_finance',
    price_mapping = CASE symbol
        WHEN 'GOLD' THEN 'GC=F'
        WHEN 'SILVER' THEN 'SI=F'
        WHEN 'OIL' THEN 'CL=F'
    END
WHERE asset_type = 'commodities';

-- Mutual funds - set to manual for now
UPDATE investment_instruments 
SET price_source = 'manual',
    price_mapping = NULL
WHERE asset_type = 'mutual_funds';

-- Add last price caching columns to investment_instruments
ALTER TABLE investment_instruments 
ADD COLUMN last_price DECIMAL(20, 8),
ADD COLUMN last_price_idr DECIMAL(20, 2),
ADD COLUMN last_updated TIMESTAMP,
ADD COLUMN price_fetch_error TEXT;

-- Add indexes for performance
CREATE INDEX idx_instruments_last_updated ON investment_instruments(last_updated);

-- Add comments
COMMENT ON COLUMN investment_instruments.last_price IS 'Last successfully fetched price in original currency';
COMMENT ON COLUMN investment_instruments.last_price_idr IS 'Last successfully fetched price in IDR';
COMMENT ON COLUMN investment_instruments.last_updated IS 'Timestamp of last successful price fetch';
COMMENT ON COLUMN investment_instruments.price_fetch_error IS 'Last error message if price fetch failed';

-- Make sure instrument_id is required (not null)
ALTER TABLE investments 
ALTER COLUMN instrument_id SET NOT NULL;

-- Add foreign key constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_investments_instrument'
  ) THEN
    ALTER TABLE investments
    ADD CONSTRAINT fk_investments_instrument 
    FOREIGN KEY (instrument_id) 
    REFERENCES investment_instruments(id)
    ON DELETE RESTRICT;
  END IF;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
