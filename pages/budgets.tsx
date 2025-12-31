// pftu\pages\budgets.tsx
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { Plus, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export default function Budgets() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any>({ needs: [], wants: [], savings: [], all: [] });
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period: 'monthly',
    budget_type: 'needs',
    alert_threshold: '80',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await apiGet('/api/categories?type=expense&is_active=true');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/budgets');
      setBudgets(data.budgets || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setBudgets([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (budget?: any) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        category_id: budget.category_id,
        amount: budget.amount,
        period: budget.period || 'monthly',
        budget_type: budget.budget_type || 'needs',
        alert_threshold: budget.alert_threshold || '80',
        start_date: budget.period_start ? budget.period_start.split('T')[0] : new Date().toISOString().split('T')[0],
        end_date: budget.period_end ? budget.period_end.split('T')[0] : ''
      });
    } else {
      setEditingBudget(null);
      setFormData({
        category_id: '',
        amount: '',
        period: 'monthly',
        budget_type: 'needs',
        alert_threshold: '80',
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (editingBudget) {
        response = await apiPut(`/api/budgets?id=${editingBudget.id}`, formData);
      } else {
        response = await apiPost('/api/budgets', formData);
      }

      if (response && !response.error) {
        await fetchBudgets();
        handleCloseModal();
      } else {
        alert(response?.message || 'Failed to save budget');
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Error saving budget: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    
    try {
      const response = await apiDelete(`/api/budgets?id=${id}`);

      if (response && !response.error) {
        await fetchBudgets();
      } else {
        alert(response?.message || 'Failed to delete budget');
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Error deleting budget: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getBudgetStatus = (percentage: number) => {
    if (percentage >= 100) return { color: 'danger', text: 'Over Budget' };
    if (percentage >= 80) return { color: 'warning', text: 'High Usage' };
    return { color: 'success', text: 'On Track' };
  };

  const getFilteredCategories = () => {
    const budgetType = formData.budget_type;
    if (budgetType === 'needs') return categories.needs;
    if (budgetType === 'wants') return categories.wants;
    if (budgetType === 'savings') return categories.savings;
    return categories.all.filter((c: any) => c.type === 'expense');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Budget Management</h1>
            <p className="text-dark-400 mt-1 text-sm">Kelola dan pantau budget kamu per kategori</p>
          </div>
          <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center justify-center space-x-2 text-sm">
            <Plus className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="card bg-gradient-to-br from-primary-600/20 to-primary-700/5 border-primary-600/30">
              <p className="text-xs sm:text-sm text-dark-400 mb-1">Total Budget</p>
              <h3 className={`font-bold text-white break-words ${
                formatCurrency(summary.total?.budget || 0).length > 15 ? 'text-base sm:text-lg' :
                formatCurrency(summary.total?.budget || 0).length > 12 ? 'text-lg sm:text-xl' :
                'text-lg sm:text-2xl'
              }`}>
                {formatCurrency(summary.total?.budget || 0)}
              </h3>
              <div className="mt-3">
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className="h-2 bg-primary-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((summary.total?.spent || 0) / (summary.total?.budget || 1)) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-dark-400 mt-2">
                  Spent: {formatCurrency(summary.total?.spent || 0)}
                </p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-warning/20 to-warning/5 border-warning/30">
              <p className="text-xs sm:text-sm text-dark-400 mb-1">Needs (50%)</p>
              <h3 className={`font-bold text-warning break-words ${
                formatCurrency(summary.needs?.budget || 0).length > 15 ? 'text-base sm:text-lg' :
                formatCurrency(summary.needs?.budget || 0).length > 12 ? 'text-lg sm:text-xl' :
                'text-lg sm:text-2xl'
              }`}>
                {formatCurrency(summary.needs?.budget || 0)}
              </h3>
              <div className="mt-3">
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className="h-2 bg-warning rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((summary.needs?.spent || 0) / (summary.needs?.budget || 1)) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-dark-400 mt-2">
                  Spent: {formatCurrency(summary.needs?.spent || 0)}
                </p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-info/20 to-info/5 border-info/30">
              <p className="text-xs sm:text-sm text-dark-400 mb-1">Wants (30%)</p>
              <h3 className={`font-bold text-info break-words ${
                formatCurrency(summary.wants?.budget || 0).length > 15 ? 'text-base sm:text-lg' :
                formatCurrency(summary.wants?.budget || 0).length > 12 ? 'text-lg sm:text-xl' :
                'text-lg sm:text-2xl'
              }`}>
                {formatCurrency(summary.wants?.budget || 0)}
              </h3>
              <div className="mt-3">
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className="h-2 bg-info rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((summary.wants?.spent || 0) / (summary.wants?.budget || 1)) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-dark-400 mt-2">
                  Spent: {formatCurrency(summary.wants?.spent || 0)}
                </p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-success/20 to-success/5 border-success/30">
              <p className="text-xs sm:text-sm text-dark-400 mb-1">Savings (20%)</p>
              <h3 className={`font-bold text-success break-words ${
                formatCurrency(summary.savings?.budget || 0).length > 15 ? 'text-base sm:text-lg' :
                formatCurrency(summary.savings?.budget || 0).length > 12 ? 'text-lg sm:text-xl' :
                'text-lg sm:text-2xl'
              }`}>
                {formatCurrency(summary.savings?.budget || 0)}
              </h3>
              <div className="mt-3">
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className="h-2 bg-success rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((summary.savings?.spent || 0) / (summary.savings?.budget || 1)) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-dark-400 mt-2">
                  Allocated: {formatCurrency(summary.savings?.spent || 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Budgets by Category */}
        <div className="card">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-6">Budget by Category</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dark-400 text-sm">Loading budgets...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-dark-400 mb-4 text-sm">No budgets set yet</p>
              <button onClick={() => handleOpenModal()} className="btn btn-primary">
                Set Your First Budget
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.map((budget) => {
                const percentage = parseFloat(budget.percentage || 0);
                const status = getBudgetStatus(percentage);

                return (
                  <div
                    key={budget.id}
                    className="p-3 sm:p-5 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors"
                  >
                    {/* Mobile Layout */}
                    <div className="block lg:hidden space-y-3">
                      {/* Header with Icon & Name */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: budget.category_color + '20' }}
                          >
                            <span className="text-xl">
                              {budget.category_icon || '📊'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm truncate">
                              {budget.category_name}
                            </h3>
                            <p className="text-xs text-dark-400 capitalize mt-0.5">
                              {budget.budget_type?.replace('_', ' ')}
                            </p>
                            <div className="flex items-center space-x-2 mt-1.5">
                              <span
                                className={`text-xs px-2 py-0.5 rounded font-medium ${
                                  status.color === 'danger' ? 'bg-danger/20 text-danger' :
                                  status.color === 'warning' ? 'bg-warning/20 text-warning' :
                                  'bg-success/20 text-success'
                                }`}
                              >
                                {status.text}
                              </span>
                              {percentage >= 80 && (
                                <AlertTriangle className="w-4 h-4 text-warning" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button
                            onClick={() => handleOpenModal(budget)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-dark-400 hover:text-primary-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Budget Info */}
                      <div className="bg-dark-900/50 p-2 rounded">
                        <p className="text-xs text-dark-400 mb-1">Budget Usage</p>
                        <p className="text-sm font-semibold text-white break-words">
                          {formatCurrency(budget.spent || 0)} / {formatCurrency(budget.amount || 0)}
                        </p>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-dark-400">Progress</span>
                          <span className="font-semibold text-white">
                            {formatPercentage(percentage, 1)}
                          </span>
                        </div>
                        <div className="w-full bg-dark-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              percentage >= 100
                                ? 'bg-danger'
                                : percentage >= 80
                                ? 'bg-warning'
                                : 'bg-success'
                            }`}
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-dark-400">
                          <span>Remaining: {formatCurrency(budget.remaining || 0)}</span>
                          <span>Alert at {budget.alert_threshold}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:block">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: budget.category_color + '20' }}
                          >
                            <span className="text-xl">
                              {budget.category_icon || '📊'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">
                              {budget.category_name}
                            </h3>
                            <p className="text-xs text-dark-400 capitalize">
                              {budget.budget_type?.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-dark-400 break-words">
                              {formatCurrency(budget.spent || 0)} / {formatCurrency(budget.amount || 0)}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`text-xs px-2 py-1 rounded font-medium ${
                                  status.color === 'danger' ? 'bg-danger/20 text-danger' :
                                  status.color === 'warning' ? 'bg-warning/20 text-warning' :
                                  'bg-success/20 text-success'
                                }`}
                              >
                                {status.text}
                              </span>
                              {percentage >= 80 && (
                                <AlertTriangle className="w-4 h-4 text-warning" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleOpenModal(budget)}
                              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-dark-400 hover:text-primary-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(budget.id)}
                              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-dark-400">Progress</span>
                          <span className="font-semibold text-white">
                            {formatPercentage(percentage, 1)}
                          </span>
                        </div>
                        <div className="w-full bg-dark-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              percentage >= 100
                                ? 'bg-danger'
                                : percentage >= 80
                                ? 'bg-warning'
                                : 'bg-success'
                            }`}
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-dark-400">
                          <span>Remaining: {formatCurrency(budget.remaining || 0)}</span>
                          <span>Alert at {budget.alert_threshold}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingBudget ? 'Edit Budget' : 'Set New Budget'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Budget Type (50/30/20 Rule)
              </label>
              <select
                value={formData.budget_type}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  budget_type: e.target.value,
                  category_id: ''
                })}
                className="input w-full"
                required
              >
                <option value="needs">Needs (50%) - Essentials</option>
                <option value="wants">Wants (30%) - Lifestyle</option>
                <option value="savings">Savings (20%) - Future</option>
              </select>
              <p className="text-xs text-dark-400 mt-1">
                {formData.budget_type === 'needs' && 'Housing, food, healthcare, transportation'}
                {formData.budget_type === 'wants' && 'Entertainment, dining out, hobbies'}
                {formData.budget_type === 'savings' && 'Emergency fund, investments, debt payment'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="input w-full"
                required
              >
                <option value="">Select Category</option>
                {getFilteredCategories().map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Budget Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Alert Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.alert_threshold}
                onChange={(e) => setFormData({ ...formData, alert_threshold: e.target.value })}
                className="input w-full"
                required
              />
              <p className="text-xs text-dark-400 mt-1">
                You'll be notified when spending reaches this percentage
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
              <button type="submit" className="btn btn-primary flex-1">
                {editingBudget ? 'Update Budget' : 'Set Budget'}
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}