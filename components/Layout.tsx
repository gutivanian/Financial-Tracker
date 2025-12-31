import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Target,
  CreditCard,
  Receipt,
  PieChart,
  LogOut,
  Menu,
  X,
  Database,
  ChevronRight,
  Folder,
  BarChart3
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationSections = [
    {
      title: 'Main Menu',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Transaksi', href: '/transactions', icon: Receipt },
        { name: 'Akun & Rekening', href: '/accounts', icon: Wallet },
      ],
    },
    {
      title: 'Planning & Goals',
      items: [
        { name: 'Budget', href: '/budgets', icon: PieChart },
        { name: 'Financial Goals', href: '/goals', icon: Target },
      ],
    },
    {
      title: 'Investments & Debts',
      items: [
        { name: 'Investasi', href: '/investments', icon: TrendingUp },
        { name: 'Hutang', href: '/debts', icon: CreditCard },
      ],
    },
    {
      title: 'Master Data',
      items: [
        { name: 'Kategori', href: '/categories', icon: Folder },
        { name: 'Instrumen', href: '/instruments', icon: Database },
      ],
    },
  ];

  const isActive = (path: string) => router.pathname === path;

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-dark-850 rounded-lg border border-dark-700 text-white hover:bg-dark-800 transition-colors shadow-lg"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-64 bg-dark-850 border-r border-dark-700 z-40 
          flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo - Fixed at top */}
        <div className="p-6 border-b border-dark-700 flex-shrink-0">
          <Link href="/" onClick={() => setSidebarOpen(false)}>
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
                  FinanceApp
                </h1>
                <p className="text-xs text-dark-300">Personal Finance Tracker</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation - Scrollable area */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {/* Section Title */}
              <div className="px-4 mb-2">
                <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>

              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center justify-between px-4 py-2.5 rounded-lg 
                        transition-all duration-200 group
                        ${
                          active
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                            : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${active ? '' : 'group-hover:scale-110 transition-transform'}`} />
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      {active && (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User info and logout - Fixed at bottom */}
        <div className="border-t border-dark-700 flex-shrink-0">
          <div className="p-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 mb-3 p-2 rounded-lg bg-dark-800/50">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white font-bold text-sm">
                  {user?.name?.substring(0, 2).toUpperCase() || 'DU'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.name || 'Demo User'}
                </p>
                <p className="text-xs text-dark-400 truncate">
                  {user?.email || 'demo@finance.com'}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 
                bg-dark-800 hover:bg-danger/10 text-dark-300 hover:text-danger 
                rounded-lg transition-all duration-200 border border-dark-700 
                hover:border-danger/30 group"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-sm">Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top bar for mobile - shows user info */}
        <div className="lg:hidden sticky top-0 z-20 bg-dark-850 border-b border-dark-700 px-4 py-3">
          <div className="flex items-center justify-between pl-12">
            <div>
              <p className="text-sm font-semibold text-white">
                {user?.name || 'Demo User'}
              </p>
              <p className="text-xs text-dark-400">
                {user?.email || 'demo@finance.com'}
              </p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xs">
                {user?.name?.substring(0, 2).toUpperCase() || 'DU'}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;