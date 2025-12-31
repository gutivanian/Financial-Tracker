# Personal Finance Management App

Aplikasi Personal Finance Management yang comprehensive dengan fitur lengkap untuk mengelola keuangan pribadi.

## 🚀 Features

### 1. Dashboard & Overview
- Real-time financial statistics
- Income vs Expenses tracking
- Net cashflow & saving rate
- Net worth calculator
- Monthly cashflow trends
- Spending by category visualization
- Recent transactions
- Budget overview

### 2. Transaction Management
- Add, edit, delete transactions
- Multiple transaction types (income, expense, transfer)
- Category & sub-category support
- Multiple payment methods
- Tags & merchant tracking
- Advanced filtering & search
- Receipt attachment support
- Recurring transactions

### 3. Budget Management
- Category-based budgets
- 50/30/20 rule support (Needs/Wants/Savings)
- Budget vs actual tracking
- Real-time alerts (80%, 90%, 100%)
- Budget rollover options
- Visual progress indicators
- Monthly/quarterly/yearly budgets

### 4. Financial Goals
- Multiple goal types (emergency fund, vacation, home, retirement, etc.)
- Progress tracking with milestones
- Target date & deadline monitoring
- Auto-save features
- Priority levels (high, medium, low)
- Goal contributions history
- Monthly required savings calculator
- Visual progress bars

### 5. Investment Portfolio
- Multiple asset types (stocks, mutual funds, crypto, bonds, gold, property)
- ROI & gain/loss tracking
- Portfolio allocation visualization
- Current price updates
- Platform tracking
- Total portfolio value
- Asset-wise performance

### 6. Debt Management
- Multiple debt types (credit cards, mortgages, personal loans, etc.)
- Payment tracking & history
- Interest rate monitoring
- Minimum payment alerts
- Debt payoff projections
- Snowball/Avalanche method support
- Payment due date reminders

### 7. Account Management
- Bank accounts
- E-wallets (GoPay, OVO, Dana, etc.)
- Cash tracking
- Credit cards
- Multi-currency support
- Real-time balance updates

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS (Dark Mode)
- **Charts**: Recharts
- **Database**: PostgreSQL
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## 🔧 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd personal-finance-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Database

#### Create PostgreSQL database
```bash
createdb personal_finance
```

#### Run database schema
```bash
psql -d personal_finance -f database/schema.sql
```

This will:
- Create all necessary tables
- Insert sample data for development
- Setup indexes for performance

### 4. Environment Variables

Create `.env.local` file in root directory:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=personal_finance
DB_PASSWORD=your_password
DB_PORT=5432
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
personal-finance-app/
├── components/          # React components
│   ├── Layout.tsx      # Main layout with sidebar
│   └── StatCard.tsx    # Reusable stat card component
├── database/
│   └── schema.sql      # PostgreSQL schema with sample data
├── lib/
│   ├── db.ts          # Database connection
│   ├── types.ts       # TypeScript type definitions
│   └── utils.ts       # Utility functions
├── pages/
│   ├── api/           # API routes
│   │   ├── accounts/
│   │   ├── budgets/
│   │   ├── dashboard/
│   │   ├── debts/
│   │   ├── goals/
│   │   ├── investments/
│   │   └── transactions/
│   ├── _app.tsx       # App wrapper
│   ├── index.tsx      # Dashboard page
│   ├── accounts.tsx   # Accounts management
│   ├── budgets.tsx    # Budget management
│   ├── debts.tsx      # Debt management
│   ├── goals.tsx      # Financial goals
│   ├── investments.tsx # Investment portfolio
│   └── transactions.tsx # Transaction management
├── styles/
│   └── globals.css    # Global styles with Tailwind
├── public/            # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 🎨 Color Palette

The app uses a dark blue-green color scheme:

- **Primary**: Blue-green tones (#159999)
- **Secondary**: Deep blue (#1a80b0)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)
- **Danger**: Red (#ef4444)
- **Background**: Dark slate (#0f1717, #1a2828)

## 📊 Database Schema

### Main Tables:
- `users` - User accounts
- `accounts` - Bank accounts, e-wallets, cash, credit cards
- `categories` - Transaction categories
- `transactions` - All financial transactions
- `budgets` - Budget allocations
- `financial_goals` - Savings goals
- `goal_contributions` - Goal contribution history
- `investments` - Investment portfolio
- `assets` - Physical assets
- `debts` - Debt tracking
- `debt_payments` - Debt payment history
- `credit_cards` - Credit card details

## 🔌 API Endpoints

### Dashboard
- `GET /api/dashboard?period=current_month` - Get dashboard overview

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions?id=1` - Update transaction
- `DELETE /api/transactions?id=1` - Delete transaction

### Budgets
- `GET /api/budgets` - List budgets with spending
- `POST /api/budgets` - Create budget
- `PUT /api/budgets?id=1` - Update budget
- `DELETE /api/budgets?id=1` - Delete budget

### Goals
- `GET /api/goals` - List financial goals
- `POST /api/goals` - Create goal
- `PUT /api/goals?id=1` - Update goal
- `DELETE /api/goals?id=1` - Delete goal
- `POST /api/goals/contributions` - Add contribution

### Investments
- `GET /api/investments` - List investments with portfolio summary
- `POST /api/investments` - Create investment
- `PUT /api/investments?id=1` - Update investment
- `DELETE /api/investments?id=1` - Delete investment

### Debts
- `GET /api/debts` - List debts with summary
- `POST /api/debts` - Create debt
- `PUT /api/debts?id=1` - Update debt
- `DELETE /api/debts?id=1` - Delete debt

### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts?id=1` - Update account
- `DELETE /api/accounts?id=1` - Delete account

## 🎯 Sample Data

The database schema includes comprehensive sample data:
- 1 demo user
- 6 accounts (banks, e-wallets, cash, credit card)
- 18 categories (income, needs, wants, savings)
- 25+ sample transactions
- 8 budget allocations
- 4 financial goals
- 5 investments
- 3 assets
- 2 debts
- 1 credit card

## 🚧 Development Notes

### Database Queries
All database queries are in the API route files for easy access and modification. Each route includes:
- Comprehensive SQL queries
- Sample data handling
- Error handling
- Transaction support where needed

### Styling
- Uses Tailwind CSS with custom dark theme
- All colors defined in `tailwind.config.js`
- Component classes in `globals.css`
- Responsive design for all screen sizes

### Type Safety
- Full TypeScript support
- Type definitions in `lib/types.ts`
- Strict mode enabled

## 🔐 Security Notes

**For Production:**
1. Add proper authentication (NextAuth.js, Clerk, etc.)
2. Add user session management
3. Implement API route protection
4. Add input validation & sanitization
5. Use environment variables for sensitive data
6. Enable CORS properly
7. Add rate limiting
8. Implement proper error handling

## 📝 Future Enhancements

- [ ] Multi-user support with authentication
- [ ] Real-time price updates for investments
- [ ] Export to PDF/Excel
- [ ] Mobile responsive improvements
- [ ] Email notifications for budget alerts
- [ ] Recurring transaction automation
- [ ] Bank account integration (Plaid, etc.)
- [ ] Advanced analytics & reports
- [ ] Goal recommendations with AI
- [ ] Split expenses with friends/family
- [ ] Receipt OCR scanning
- [ ] Tax calculation & reporting

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 👨‍💻 Author

Created with ❤️ for personal finance management

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**Note**: This is a comprehensive personal finance management system. The sample data is for demonstration purposes. Make sure to customize it according to your needs!
# Financial-Tracker
