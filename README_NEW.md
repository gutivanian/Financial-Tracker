# Personal Finance Management App 💰

Aplikasi manajemen keuangan pribadi yang lengkap dengan autentikasi JWT, responsive design, dan fitur-fitur canggih untuk mengelola keuangan Anda.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.3.6-38bdf8)

## ✨ Fitur Utama

### 🔐 Authentication & Security
- ✅ Login dengan JWT (JSON Web Token)
- ✅ Password hashing dengan bcrypt
- ✅ Protected routes dengan auto-redirect
- ✅ Session management dengan localStorage
- ✅ Logout functionality
- ✅ Token verification

### 📊 Dashboard
- Total saldo semua akun
- Overview pemasukan dan pengeluaran
- Grafik cashflow bulanan
- Budget tracking dengan progress bar
- Financial goals progress
- Recent transactions

### 💳 Manajemen Akun
- Multiple accounts (Bank, E-wallet, Cash, Credit Card)
- Real-time balance tracking
- Custom icons dan colors
- Account activation/deactivation

### 💸 Transaksi
- Income, expense, dan transfer tracking
- Category-based classification
- Date filtering dan search
- Bulk operations
- Transaction history

### 📈 Budget Management
- Monthly budget planning
- Needs, wants, savings categorization
- Real-time spending tracking
- Budget vs actual comparison
- Visual progress indicators

### 🎯 Financial Goals
- Multiple goal tracking
- Progress monitoring
- Contribution history
- Target amount dan deadline
- Achievement tracking

### 💹 Investasi
- Portfolio tracking
- Multiple investment types
- Return calculation
- Performance monitoring
- Buy/sell history

### 🏦 Debt Management
- Loan tracking
- Payment scheduling
- Interest calculation
- Remaining balance monitoring
- Payment history

### 📱 Responsive Design
- ✅ Desktop-optimized layout
- ✅ Tablet-friendly interface
- ✅ Mobile-responsive design
- ✅ Touch-friendly controls
- ✅ Adaptive sidebar

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm atau yarn

### 1. Clone Repository

```bash
git clone <repository-url>
cd personal-finance-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
# Buat database
createdb personal-finance

# Import schema
psql -U your_username -d personal-finance -f database/schema.sql

# Jalankan migration untuk authentication
psql -U your_username -d personal-finance -f database/add_password_migration.sql
```

### 4. Setup Environment Variables

Copy `.env.example` ke `.env` dan sesuaikan:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=personal-finance
DB_PASSWORD=your_db_password
DB_PORT=5432
DB_SSL=false

# JWT Secret (GANTI INI DI PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
```

### 5. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000/login](http://localhost:3000/login)

### 6. Login

```
Email: demo@finance.com
Password: demo123
```

## 📁 Struktur Project

```
personal-finance-app/
├── components/          # React components
│   ├── Layout.tsx      # Main layout dengan sidebar & logout
│   ├── Modal.tsx       # Modal component
│   └── StatCard.tsx    # Statistics card
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── database/           # Database files
│   ├── schema.sql      # Main database schema
│   └── add_password_migration.sql  # Auth migration
├── lib/                # Utilities
│   ├── db.ts          # Database connection
│   ├── types.ts       # TypeScript types
│   └── utils.ts       # Helper functions
├── pages/              # Next.js pages
│   ├── api/           # API routes
│   │   ├── auth/      # Authentication APIs
│   │   │   ├── login.ts
│   │   │   └── verify.ts
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── investments/
│   │   ├── debts/
│   │   └── dashboard/
│   ├── login.tsx      # Login page
│   ├── index.tsx      # Dashboard
│   ├── accounts.tsx   # Accounts page
│   ├── transactions.tsx
│   ├── budgets.tsx
│   ├── goals.tsx
│   ├── investments.tsx
│   ├── debts.tsx
│   └── _app.tsx       # App wrapper dengan AuthProvider
├── scripts/
│   └── generate-password.js  # Password hash generator
├── styles/
│   └── globals.css    # Global styles
├── .env.example       # Environment variables template
├── AUTH_SETUP.md      # Authentication setup guide
└── README.md          # This file
```

## 🔐 Authentication Setup

Lihat [AUTH_SETUP.md](./AUTH_SETUP.md) untuk panduan lengkap setup authentication.

### Quick Summary

1. **Database Migration**: Jalankan `database/add_password_migration.sql`
2. **Environment**: Set `JWT_SECRET` di `.env`
3. **Demo User**: `demo@finance.com` / `demo123`

## 🎨 Design System

### Color Palette

```css
Primary (Teal):
  - primary-500: #159999
  - primary-600: #107777
  - primary-700: #0c5555

Secondary (Blue):
  - secondary-500: #156699
  - secondary-600: #104d77
  - secondary-700: #0c3355

Dark Theme:
  - dark-850: #151f1f (Sidebar)
  - dark-900: #0f1717 (Background)
  - dark-700: #2a4040 (Border)
```

### Typography

- Font: System UI Stack
- Headers: Bold, various sizes
- Body: Medium weight
- Labels: Small, uppercase

### Components

- Cards: Rounded-lg, shadow-lg, gradient backgrounds
- Buttons: Primary (teal), Secondary (gray), Danger (red)
- Inputs: Dark theme, focus ring
- Modals: Overlay, animated

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date**: date-fns

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1023px
- **Desktop**: ≥ 1024px

## 🔒 Security Features

✅ **Implemented:**
- Password hashing (bcrypt, 10 rounds)
- JWT with expiration (7 days)
- Protected routes with middleware
- Input validation
- SQL injection prevention
- XSS protection

⚠️ **For Production:**
- Use strong JWT_SECRET (32+ chars)
- Enable HTTPS only
- Implement refresh tokens
- Add rate limiting
- Enable CSRF protection
- Use HTTP-only cookies
- Set secure cookie flags

## 🧪 Testing

```bash
# Run tests (ketika sudah dibuat)
npm test

# Run linting
npm run lint
```

## 📦 Build for Production

```bash
# Build
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

Personal Finance App - Your complete financial management solution

## 🙏 Acknowledgments

- Next.js team untuk amazing framework
- Tailwind CSS untuk utility-first CSS
- Recharts untuk beautiful charts
- Lucide untuk icon set

## 📧 Support

Jika ada pertanyaan atau issue, silakan buka issue di repository atau hubungi maintainer.

---

Made with ❤️ and ☕ using Next.js
