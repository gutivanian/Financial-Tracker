# PFTU - Personal Finance Tracker & Utilities

> 💰 Comprehensive personal finance management application with SSO authentication, split payment, transfer features, and more.

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [SSO Integration](#sso-integration)
- [Database Setup](#database-setup)
- [User Management](#user-management)
- [API Documentation](#api-documentation)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**PFTU** is a modern personal finance management application built with Next.js 14, featuring:
- 🔐 **SSO Authentication** - Centralized authentication with backward compatible local login
- 💰 **Transaction Management** - Income, expense, and transfer tracking
- 📊 **Budget & Goals** - Financial planning with progress tracking
- 📈 **Investment Portfolio** - Multi-asset portfolio management
- 💳 **Debt Tracking** - Debt management with payment schedules
- 🎨 **Dark Theme** - Modern UI with blue-green palette

---

## ✨ Features

### 1. Dashboard & Overview
- 📊 Real-time financial statistics
- 💵 Income vs Expenses tracking
- 💰 Net cashflow & saving rate
- 🏦 Net worth calculator
- 📈 Monthly cashflow trends
- 🥧 Spending by category visualization
- 📜 Recent transactions
- 🎯 Budget overview with progress bars

### 2. Transaction Management
- ➕ Add, edit, delete transactions
- 🔄 Multiple transaction types: **income**, **expense**, **transfer**
- 📂 Category & sub-category support
- 💳 Multiple payment methods/accounts
- 🏷️ Tags & merchant tracking
- 🔍 Advanced filtering & search
- 📎 Receipt attachment support
- 🔁 Recurring transactions
- 💱 **Split Payment** - Pay with multiple accounts
- ↔️ **Transfer with Admin Fee** - Transfer between accounts with optional fees

### 3. Budget Management
- 📊 Category-based budgets
- 📊 50/30/20 rule support (Needs/Wants/Savings)
- 📈 Budget vs actual tracking
- ⚠️ Real-time alerts (80%, 90%, 100%)
- 🔄 Budget rollover options
- 📊 Visual progress indicators
- 📅 Monthly/quarterly/yearly budgets

### 4. Financial Goals
- 🎯 Multiple goal types (emergency fund, vacation, home, retirement)
- 📈 Progress tracking with milestones
- ⏰ Target date & deadline monitoring
- 💾 Auto-save features
- ⭐ Priority levels (high, medium, low)
- 📜 Goal contributions history
- 💰 Monthly required savings calculator

### 5. Investment Portfolio
- 📊 Multiple asset types (stocks, mutual funds, crypto, bonds, gold, property)
- 📈 ROI & gain/loss tracking
- 🥧 Portfolio allocation visualization
- 💹 Current price updates
- 📊 Performance metrics

### 6. Debt Tracking
- 💳 Multiple debt types (credit card, loan, mortgage)
- 📅 Payment schedules
- 💰 Interest calculation
- 📊 Remaining balance tracking
- ⏰ Due date reminders

### 7. Accounts Management
- 🏦 Multiple account types (cash, bank, e-wallet, investment)
- 💰 Real-time balance tracking
- 📊 Account-wise expenses
- 💳 Virtual cards support

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Aiven Cloud)
- **Authentication**: JWT + SSO Integration
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Context API
- **Password Hashing**: bcryptjs
- **Database Client**: pg (node-postgres)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed (local or cloud)
- npm or yarn package manager

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd pftu

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# 4. Setup database
psql -U postgres -d personal-finance -f database/schema.sql

# 5. Run migration for SSO support
node database/run-migration-safe.js

# 6. Start development server
npm run dev
```

App will be running at **http://localhost:3002**

### Environment Variables

Create `.env` file in root directory:

```env
# Environment
NODE_ENV=development

# Database Configuration
DB_USER=your_username
DB_HOST=localhost
DB_NAME=personal-finance
DB_PASSWORD=your_password
DB_PORT=5432
DB_SSL=false

# SSO Configuration (Development)
NEXT_PUBLIC_SSO_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3002

# JWT Secret (MUST be same as SSO!)
JWT_SECRET=your-shared-jwt-secret-min-32-chars

# Production SSO (for deployment)
# NEXT_PUBLIC_SSO_URL=https://sso.yourdomain.com
# NEXT_PUBLIC_APP_URL=https://pftu.yourdomain.com

# API Keys (Optional)
ALPHA_VANTAGE_API_KEY=your_key
FINNHUB_API_KEY=your_key
```

### Demo Credentials

**Local Login:**
- Email: `demo@finance.com`
- Password: `demo123`

**SSO Login:**
- Use "Login dengan SSO" button
- Redirects to centralized SSO service

---

## 🔐 SSO Integration

### Overview

PFTU supports **Single Sign-On (SSO)** for centralized authentication across multiple applications. Users can login once and access all integrated apps.

### Configuration

**Port Setup:**
- Development: `3002`
- Production: `3000`
- SSO Service: `3001`

**Database Migration:**

PFTU requires `sso_user_id` column for mapping to SSO users:

```bash
# Run safe migration script
node database/run-migration-safe.js
```

This will:
- ✅ Backup existing users
- ✅ Add `sso_user_id UUID` column to users table
- ✅ Create unique index
- ✅ Generate temporary UUIDs for existing users

### Authentication Flow

#### SSO Login (Recommended)

1. User clicks **"Login dengan SSO"** on PFTU login page
2. Redirects to SSO: `http://localhost:3001/login?redirect_uri=...`
3. User authenticates at SSO service
4. SSO redirects back with token: `http://localhost:3002/auth/callback?token=...`
5. PFTU verifies token and syncs user data
6. User successfully logged in!

**Auto-merge by email:** If user exists in PFTU with same email, they will be automatically linked.

#### Local Login (Legacy)

Backward compatible local authentication still available:
- Email: `demo@finance.com`
- Password: `demo123`

### Middleware Implementation

**API Middleware** (`lib/middleware/auth.ts`):
- Detects token type (SSO UUID vs Local INTEGER)
- For SSO tokens: Looks up local user by `sso_user_id`
- Attaches local INTEGER `userId` to `req.user` for database queries
- Ensures all transactions use correct user context

**Public Pages:**

Add pages to public list in `pages/_app.tsx` to skip auth check:

```typescript
const publicPages = ['/login', '/auth/callback', '/register']
```

---

## 🗄️ Database Setup

### Schema

Main tables:
- **users** - User accounts (with `sso_user_id` for SSO mapping)
- **accounts** - Financial accounts (bank, cash, e-wallet)
- **categories** - Transaction categories
- **transactions** - All financial transactions
- **transaction_splits** - Split payment details
- **budgets** - Budget targets
- **goals** - Financial goals
- **investments** - Investment portfolio
- **debts** - Debt tracking

### Initial Setup

```bash
# Create database
createdb personal-finance

# Import schema
psql -d personal-finance -f database/schema.sql

# Run SSO migration
node database/run-migration-safe.js
```

### Verify Migration

```sql
-- Check sso_user_id column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'sso_user_id';

-- Check users
SELECT id, email, name, sso_user_id FROM users;
```

---

## 👥 User Management

### Create User via Script (Recommended)

**Interactive mode:**
```bash
node scripts/create-user.js
```

**Command line mode:**
```bash
node scripts/create-user.js user@email.com "User Name" password123
```

Script will:
- ✅ Hash password with bcrypt
- ✅ Check for duplicate email
- ✅ Insert user into database
- ✅ Display created user details

### Create User via API

**Endpoint:** `POST /api/auth/register`

```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@email.com",
    "name": "User Name",
    "password": "password123"
  }'
```

### Create User via SQL

```sql
INSERT INTO users (email, name, password_hash, created_at, updated_at)
VALUES (
  'user@email.com',
  'User Name', 
  '$2a$10$...',  -- bcrypt hash
  NOW(),
  NOW()
);
```

---

## 📡 API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@email.com",
  "password": "password123"
}

Response: { "token": "jwt_token", "user": {...} }
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer jwt_token

Response: { "user": {...} }
```

### Transactions

#### List Transactions
```http
GET /api/transactions?start_date=2026-01-01&end_date=2026-01-31&type=expense
Authorization: Bearer jwt_token
```

#### Create Transaction (Regular)
```http
POST /api/transactions
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "type": "expense",
  "category_id": 10,
  "account_id": 1,
  "amount": 50000,
  "date": "2026-01-15",
  "description": "Dinner",
  "merchant": "Restaurant A"
}
```

#### Create Transfer Transaction
```http
POST /api/transactions
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "type": "transfer",
  "account_id": 1,           // From account
  "to_account_id": 2,        // To account
  "amount": 100000,
  "admin_fee": 2500,         // Optional
  "date": "2026-01-15",
  "description": "Transfer to savings"
}
```

#### Create Split Payment Transaction
```http
POST /api/transactions
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "type": "expense",
  "category_id": 10,
  "amount": 50000,
  "date": "2026-01-15",
  "description": "Shopping",
  "is_split_payment": true,
  "splits": [
    { "account_id": 1, "amount": 20000 },
    { "account_id": 2, "amount": 30000 }
  ]
}
```

#### Update Transaction
```http
PUT /api/transactions?id=123
Authorization: Bearer jwt_token
Content-Type: application/json

{ ...updated_fields... }
```

#### Delete Transaction
```http
DELETE /api/transactions?id=123
Authorization: Bearer jwt_token
```

### Dashboard

```http
GET /api/dashboard?period=current_month
Authorization: Bearer jwt_token

Response:
{
  "income": 5000000,
  "expenses": 3500000,
  "netCashflow": 1500000,
  "accountBalances": [...],
  "recentTransactions": [...],
  "budgets": [...]
}
```

---

## 🚀 Advanced Features

### Split Payment Feature

**What is Split Payment?**

Pay a single transaction using multiple accounts. Example: Pay Rp 50,000 with Rp 20,000 from GoPay + Rp 30,000 from Cash.

**Database Schema:**

```sql
-- transactions table
is_split_payment BOOLEAN DEFAULT FALSE
split_count INTEGER DEFAULT 1

-- transaction_splits table
CREATE TABLE transaction_splits (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id),
    amount NUMERIC(15,2) NOT NULL,
    percentage NUMERIC(5,2)
);
```

**Usage:**

1. Create transaction with `is_split_payment: true`
2. Provide `splits` array with account_id and amount
3. System automatically:
   - Updates all account balances
   - Calculates percentages
   - Validates total equals transaction amount

### Transfer Feature

**Transfer Between Accounts:**

- Transfer money between your accounts
- Optional admin fee (automatically recorded as expense)
- Atomic operations with database transactions
- Automatic balance updates for both accounts

**Admin Fee:**

If admin fee > 0, system automatically:
- Creates expense transaction with "Admin Fee" category
- Deducts fee from source account
- Links fee transaction to original transfer

### Investment Portfolio

Track multiple investment types:
- **Stocks** - Individual stocks with price tracking
- **Mutual Funds** - Mutual fund investments
- **Crypto** - Cryptocurrency holdings
- **Bonds** - Bond investments
- **Gold** - Precious metals
- **Property** - Real estate investments

Calculate ROI, gain/loss, and visualize portfolio allocation.

### Recurring Transactions

Schedule automatic transactions:
- Daily, Weekly, Monthly, Yearly frequency
- Auto-create on schedule
- Category & account presets
- Email reminders

---

## 🐛 Troubleshooting

### Cannot Connect to Database

**Check environment variables:**
```bash
# Verify .env file
cat .env | grep DB_
```

**Test connection:**
```bash
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "SELECT 1"
```

**Common fixes:**
- Ensure PostgreSQL service is running
- Verify credentials in `.env`
- Check database exists: `psql -l`
- For cloud database: Check SSL settings

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

```bash
# Check process using port 3002
lsof -ti:3002 | xargs kill -9

# Or use different port
npm run dev -- -p 3003
```

### SSO Token Verification Failed

**Check JWT_SECRET matches SSO:**
```bash
# In PFTU .env
JWT_SECRET=same-secret-as-sso

# In SSO .env
JWT_SECRET=same-secret-as-sso
```

**Verify sso_user_id exists:**
```sql
SELECT id, email, sso_user_id FROM users WHERE email = 'your@email.com';
```

**Clear localStorage and try again:**
```javascript
localStorage.clear();
location.reload();
```

### Transaction Splits Not Working

**Validate:**
- Sum of splits equals transaction amount
- All split amounts > 0
- Valid account_ids exist
- At least 1 split for split payment

**Check database:**
```sql
-- View transaction with splits
SELECT 
  t.*,
  json_agg(json_build_object(
    'account_id', ts.account_id,
    'amount', ts.amount,
    'percentage', ts.percentage
  )) as splits
FROM transactions t
LEFT JOIN transaction_splits ts ON t.id = ts.transaction_id
WHERE t.id = YOUR_TRANSACTION_ID
GROUP BY t.id;
```

### Admin Fee Category Missing

**Auto-create for user:**
```sql
INSERT INTO categories (user_id, name, type, icon, color, is_system)
VALUES (
  YOUR_USER_ID,
  'Admin Fee',
  'expense',
  'coins',
  'orange',
  true
)
ON CONFLICT (user_id, name) DO NOTHING;
```

### Next.js Cache Issues

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Database Migration Failed

```bash
# Rollback migration
psql -d personal-finance -f database/rollback-sso.sql

# Try again with safe script
node database/run-migration-safe.js
```

---

## 📂 Project Structure

```
pftu/
├── pages/
│   ├── api/
│   │   ├── auth/         # Authentication endpoints
│   │   ├── transactions/ # Transaction CRUD
│   │   ├── accounts/     # Account management
│   │   ├── budgets/      # Budget management
│   │   └── dashboard/    # Dashboard data
│   ├── auth/
│   │   └── callback.tsx  # SSO callback handler
│   ├── index.tsx         # Dashboard page
│   ├── transactions.tsx  # Transactions page
│   ├── budgets.tsx       # Budgets page
│   └── ...
├── contexts/
│   └── AuthContext.tsx   # Auth state management
├── lib/
│   ├── db.ts            # Database connection
│   ├── middleware/
│   │   └── auth.ts      # API auth middleware
│   └── types.ts         # TypeScript types
├── database/
│   ├── schema.sql                # Database schema
│   ├── migration-add-sso.sql     # SSO migration
│   └── run-migration-safe.js     # Safe migration script
├── scripts/
│   └── create-user.js   # User creation script
└── public/              # Static assets
```

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Export to PDF/Excel
- [ ] Bank account integration
- [ ] Machine learning expense categorization
- [ ] Multi-currency support
- [ ] Family/shared accounts
- [ ] Financial advisor chatbot

---

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Check [Troubleshooting](#troubleshooting) section
- Review API documentation above

---

**Built with ❤️ using Next.js, TypeScript, and PostgreSQL**
