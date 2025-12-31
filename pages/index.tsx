import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Wallet,
  Target,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils';
import { apiGet } from '@/lib/api';

interface DashboardData {
  stats: any;
  spendingByCategory: any[];
  monthlyTrends: any[];
  recentTransactions: any[];
  accounts: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('current_month');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const result = await apiGet(`/api/dashboard?period=${period}`);
      
      // Log untuk debugging
      console.log('Dashboard data:', result);
      console.log('Spending by category:', result.spendingByCategory);
      
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-dark-400">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) return null;

  const COLORS = ['#159999', '#1a80b0', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Custom label untuk PieChart
  const renderCustomLabel = (entry: any) => {
    const percentage = Number(entry.percentage) || 0;
    if (percentage < 3) return ''; // Hide label if too small
    return `${entry.category_name} (${percentage.toFixed(1)}%)`;
  };

  // Custom tooltip untuk PieChart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark-850 border border-dark-700 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-white mb-1">{data.category_name}</p>
          <p className="text-primary-400 text-sm">
            {formatCurrency(Number(data.total_amount) || 0)}
          </p>
          <p className="text-dark-400 text-xs">
            {Number(data.percentage || 0).toFixed(2)}% of total
          </p>
          <p className="text-dark-500 text-xs mt-1">
            {data.transaction_count} transaction{data.transaction_count > 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-dark-400 mt-1">Selamat datang kembali! Ini ringkasan keuangan kamu.</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input"
          >
            <option value="current_month">Bulan Ini</option>
            <option value="last_month">Bulan Lalu</option>
            <option value="last_3_months">3 Bulan Terakhir</option>
            <option value="year_to_date">Tahun Ini</option>
          </select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Income"
            value={formatCurrency(data.stats.total_income)}
            icon={TrendingUp}
            color="success"
            subtitle="Pendapatan periode ini"
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(data.stats.total_expenses)}
            icon={TrendingDown}
            color="danger"
            subtitle="Pengeluaran periode ini"
          />
          <StatCard
            title="Net Cashflow"
            value={formatCurrency(data.stats.net_cashflow)}
            icon={DollarSign}
            color={data.stats.net_cashflow >= 0 ? 'success' : 'danger'}
            trend={{
              value: formatPercentage(data.stats.saving_rate, 1),
              isPositive: data.stats.saving_rate >= 0,
            }}
          />
          <StatCard
            title="Net Worth"
            value={formatCurrency(data.stats.net_worth)}
            icon={Wallet}
            color="primary"
            subtitle={`Aset: ${formatCurrency(data.stats.total_assets)}`}
          />
        </div>

        {/* Budget Overview */}
        {data.stats.total_budget > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Budget Overview</h2>
              <div className="text-sm text-dark-400">
                {formatCurrency(data.stats.budget_spent)} / {formatCurrency(data.stats.total_budget)}
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-dark-300">Budget Usage</span>
                <span className="text-white font-semibold">
                  {formatPercentage(
                    (data.stats.budget_spent / data.stats.total_budget) * 100,
                    1
                  )}
                </span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    (data.stats.budget_spent / data.stats.total_budget) * 100 >= 100
                      ? 'bg-danger'
                      : (data.stats.budget_spent / data.stats.total_budget) * 100 >= 80
                      ? 'bg-warning'
                      : 'bg-success'
                  }`}
                  style={{
                    width: `${Math.min(
                      (data.stats.budget_spent / data.stats.total_budget) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-dark-400">
              Remaining: {formatCurrency(data.stats.budget_remaining)}
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-6">
              Cashflow Trends ({period === 'year_to_date' ? '12 Months' : '6 Months'})
            </h2>
            {data.monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a4040" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#8fb0b0"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#8fb0b0" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a2828',
                      border: '1px solid #2a4040',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => formatCurrency(Number(value) || 0)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Income"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Expenses"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    stroke="#159999"
                    strokeWidth={2}
                    name="Savings"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-dark-400">
                No transaction data for this period
              </div>
            )}
          </div>

          {/* Spending by Category */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-6">Spending by Category</h2>
            {data.spendingByCategory && data.spendingByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.spendingByCategory}
                    dataKey="total_amount"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={renderCustomLabel}
                    labelLine={{ stroke: '#8fb0b0' }}
                  >
                    {data.spendingByCategory.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.category_color || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-dark-400">
                No expense data for this period
              </div>
            )}
          </div>
        </div>

        {/* Accounts and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accounts */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-6">Accounts</h2>
            {data.accounts.length > 0 ? (
              <div className="space-y-3">
                {data.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: account.color + '20' }}
                      >
                        <Wallet className="w-5 h-5" style={{ color: account.color }} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{account.name}</p>
                        <p className="text-xs text-dark-400 capitalize">{account.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          account.balance >= 0 ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-dark-400">
                No active accounts
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
              <a href="/transactions" className="text-sm text-primary-400 hover:text-primary-300">
                View All
              </a>
            </div>
            {data.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {data.recentTransactions.slice(0, 8).map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-3 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          txn.type === 'income' ? 'bg-success/20' : 'bg-danger/20'
                        }`}
                      >
                        {txn.type === 'income' ? (
                          <ArrowUpRight className="w-5 h-5 text-success" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-danger" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">
                          {txn.description || txn.category_name}
                        </p>
                        <p className="text-xs text-dark-400">{formatDate(txn.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-sm ${
                          txn.type === 'income' ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {txn.type === 'income' ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </p>
                      <p className="text-xs text-dark-400">{txn.account_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-dark-400">
                No recent transactions
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}