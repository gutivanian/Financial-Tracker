// pages/reports.tsx
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import IconRenderer from '@/components/IconRenderer';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Store,
  AlertTriangle,
  CheckCircle,
  Minus
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
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { apiGet } from '@/lib/api';

export default function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('current_month');
  const [compareWith, setCompareWith] = useState('last_month');

  useEffect(() => {
    fetchReportsData();
  }, [period, compareWith]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const result = await apiGet(`/api/reports?period=${period}&compare_with=${compareWith}`);
      setData(result);
    } catch (error) {
      console.error('Error fetching reports:', error);
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
            <p className="text-dark-400">Loading reports...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data || !data.summary) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-dark-400">No data available</p>
          </div>
        </div>
      </Layout>
    );
  }

  const COLORS = ['#159999', '#1a80b0', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getChangeColor = (change: number, isExpense = false) => {
    if (isExpense) {
      // For expenses, decrease is good
      if (change < 0) return 'text-green-400';
      if (change > 0) return 'text-red-400';
    } else {
      // For income, increase is good
      if (change > 0) return 'text-green-400';
      if (change < 0) return 'text-red-400';
    }
    return 'text-dark-400';
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Financial Reports</h1>
            <p className="text-dark-400">Analisis mendalam keuangan Anda</p>
          </div>

          {/* Period Selector */}
          <div className="flex gap-3">
            <div>
              <label className="block text-sm text-dark-400 mb-1">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="current_month">Current Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="year_to_date">Year to Date</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Compare With</label>
              <select
                value={compareWith}
                onChange={(e) => setCompareWith(e.target.value)}
                className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="last_month">Last Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="year_to_date">Year to Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Income Card */}
          <div className="bg-dark-850 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-sm text-dark-400">
                {data.summary.current_income_count} transactions
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-dark-400">Total Income</h3>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(data.summary.current_income)}
              </p>
              <div className={`flex items-center gap-1 text-sm ${getChangeColor(data.summary.income_change_percent)}`}>
                {getChangeIcon(data.summary.income_change_percent)}
                <span>{formatPercentage(Math.abs(data.summary.income_change_percent))}</span>
                <span className="text-dark-400">vs comparison</span>
              </div>
            </div>
          </div>

          {/* Expense Card */}
          <div className="bg-dark-850 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-sm text-dark-400">
                {data.summary.current_expense_count} transactions
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-dark-400">Total Expense</h3>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(data.summary.current_expense)}
              </p>
              <div className={`flex items-center gap-1 text-sm ${getChangeColor(data.summary.expense_change_percent, true)}`}>
                {getChangeIcon(data.summary.expense_change_percent)}
                <span>{formatPercentage(Math.abs(data.summary.expense_change_percent))}</span>
                <span className="text-dark-400">vs comparison</span>
              </div>
            </div>
          </div>

          {/* Net Card */}
          <div className="bg-dark-850 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary-400" />
              </div>
              <span className="text-sm text-dark-400">Net Cashflow</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-dark-400">Current Period</h3>
              <p className={`text-2xl font-bold ${data.summary.current_net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(data.summary.current_net)}
              </p>
              <div className="text-sm text-dark-400">
                Previous: {formatCurrency(data.summary.comparison_net)}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trends Chart */}
        <div className="bg-dark-850 border border-dark-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-semibold text-white">Monthly Trends (Last 6 Months)</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3f3f" />
              <XAxis dataKey="month_label" stroke="#6b8e8e" />
              <YAxis stroke="#6b8e8e" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a2828', 
                  border: '1px solid #2a3f3f',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Income"
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Expense"
              />
              <Line 
                type="monotone" 
                dataKey="net" 
                stroke="#159999" 
                strokeWidth={2}
                name="Net"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Analysis */}
          <div className="bg-dark-850 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <PieChartIcon className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Category Analysis</h2>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {!data.categoryAnalysis || data.categoryAnalysis.length === 0 ? (
                <p className="text-dark-400 text-center py-8">No category data available</p>
              ) : (
                data.categoryAnalysis.map((cat: any, index: number) => (
                <div key={cat.category_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconRenderer iconName={cat.category_icon} className="w-5 h-5" fallbackEmoji="📊" />
                      <span className="text-white font-medium">{cat.category_name}</span>
                      {cat.budget_type && (
                        <span className="text-xs px-2 py-1 bg-dark-700 rounded text-dark-400">
                          {cat.budget_type}
                        </span>
                      )}
                    </div>
                    <span className="text-white font-semibold">
                      {formatCurrency(cat.current_amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className={`flex items-center gap-1 ${getChangeColor(cat.change_percent, true)}`}>
                      {getChangeIcon(cat.change_percent)}
                      <span>{formatPercentage(Math.abs(cat.change_percent))}</span>
                    </div>
                    {cat.budget_amount > 0 && (
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-dark-400">
                            Budget: {formatCurrency(cat.budget_amount)}
                          </span>
                          <span className={
                            cat.budget_usage_percent > 100 ? 'text-red-400' :
                            cat.budget_usage_percent > 80 ? 'text-yellow-400' :
                            'text-green-400'
                          }>
                            {formatPercentage(cat.budget_usage_percent)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              cat.budget_usage_percent > 100 ? 'bg-red-500' :
                              cat.budget_usage_percent > 80 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(cat.budget_usage_percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
              )}
            </div>
          </div>

          {/* Budget Performance */}
          <div className="bg-dark-850 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Budget Performance</h2>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {!data.budgetPerformance || data.budgetPerformance.length === 0 ? (
                <p className="text-dark-400 text-center py-8">No budget data available</p>
              ) : (
                data.budgetPerformance.map((budget: any) => (
                  <div key={budget.id} className="bg-dark-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <IconRenderer iconName={budget.category_icon} className="w-5 h-5" fallbackEmoji="📊" />
                        <div>
                          <div className="text-white font-medium">{budget.category_name}</div>
                          <div className="text-xs text-dark-400">{budget.budget_type}</div>
                        </div>
                      </div>
                      {budget.usage_percent > 100 ? (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      ) : budget.usage_percent > 80 ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-400">Spent / Budget</span>
                        <span className="text-white font-medium">
                          {formatCurrency(budget.spent_amount)} / {formatCurrency(budget.budget_amount)}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            budget.usage_percent > 100 ? 'bg-red-500' :
                            budget.usage_percent > 80 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budget.usage_percent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={
                          budget.usage_percent > 100 ? 'text-red-400' :
                          budget.usage_percent > 80 ? 'text-yellow-400' :
                          'text-green-400'
                        }>
                          {formatPercentage(budget.usage_percent)} used
                        </span>
                        <span className="text-dark-400">
                          Remaining: {formatCurrency(Math.max(0, budget.remaining))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Top Merchants */}
        {data.topMerchants && data.topMerchants.length > 0 && (
          <div className="bg-dark-850 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Store className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Top Merchants</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.topMerchants.map((merchant: any, index: number) => (
                <div key={index} className="bg-dark-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-white font-medium">{merchant.merchant}</span>
                    <span className="text-xs text-dark-400">
                      {merchant.transaction_count}x
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-primary-400">
                    {formatCurrency(merchant.total_amount)}
                  </div>
                  <div className="text-xs text-dark-400">
                    Avg: {formatCurrency(merchant.average_amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Spending Pattern */}
        {data.dailyPattern && data.dailyPattern.length > 0 && (
          <div className="bg-dark-850 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Spending Pattern by Day</h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.dailyPattern}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3f3f" />
                <XAxis dataKey="day_name" stroke="#6b8e8e" />
                <YAxis stroke="#6b8e8e" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a2828', 
                    border: '1px solid #2a3f3f',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Bar dataKey="total_amount" fill="#159999" name="Total Spending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Layout>
  );
}
