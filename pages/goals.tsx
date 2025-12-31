// pages/goals.tsx
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { Plus, Target, TrendingUp, Calendar, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, getDaysRemaining } from '@/lib/utils';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingContribution, setIsSubmittingContribution] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    priority: 'medium',
    status: 'active',
    auto_save_amount: '',
    category: 'savings'
  });
  
  const [contributionData, setContributionData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/goals');
      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (goal?: any) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        description: goal.description || '',
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
        priority: goal.priority,
        status: goal.status,
        auto_save_amount: goal.auto_save_amount || '',
        category: goal.category || 'savings'
      });
    } else {
      setEditingGoal(null);
      setFormData({
        name: '',
        description: '',
        target_amount: '',
        current_amount: '0',
        target_date: '',
        priority: 'medium',
        status: 'active',
        auto_save_amount: '',
        category: 'savings'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    setIsSubmitting(false);
  };

  const handleOpenContributionModal = (goal: any) => {
    setSelectedGoal(goal);
    setContributionData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsContributionModalOpen(true);
  };

  const handleCloseContributionModal = () => {
    setIsContributionModalOpen(false);
    setSelectedGoal(null);
    setIsSubmittingContribution(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      let response;
      
      if (editingGoal) {
        const url = `/api/goals?id=${editingGoal.id}`;
        response = await apiPut(url, formData);
      } else {
        response = await apiPost('/api/goals', formData);
      }

      if (response) {
        await fetchGoals();
        handleCloseModal();
      } else {
        alert('Failed to save goal');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Error saving goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedGoal) return;
    
    if (isSubmittingContribution) return;
    setIsSubmittingContribution(true);

    try {
      const response = await apiPost('/api/goals/contributions', {
        goal_id: selectedGoal.id,
        ...contributionData
      });

      if (response) {
        await fetchGoals();
        handleCloseContributionModal();
      } else {
        alert('Failed to add contribution');
      }
    } catch (error) {
      console.error('Error adding contribution:', error);
      alert('Error adding contribution');
    } finally {
      setIsSubmittingContribution(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      const response = await apiDelete(`/api/goals?id=${id}`);

      if (response) {
        await fetchGoals();
      } else {
        alert('Failed to delete goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Error deleting goal');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-danger/20 text-danger',
      medium: 'bg-warning/20 text-warning',
      low: 'bg-info/20 text-info',
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-success/20 text-success',
      completed: 'bg-info/20 text-info',
      paused: 'bg-warning/20 text-warning',
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Financial Goals</h1>
            <p className="text-dark-400 mt-1 text-sm">Set dan track progress goals keuangan kamu</p>
          </div>
          <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center justify-center space-x-2 text-sm">
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="card bg-gradient-to-br from-primary-600/20 to-primary-700/5 border-primary-600/30">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-dark-400">Active Goals</p>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-white">
              {goals.filter((g) => g.status === 'active').length}
            </h3>
          </div>

          <div className="card bg-gradient-to-br from-success/20 to-success/5 border-success/30">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-4 h-4 text-success flex-shrink-0" />
              <p className="text-xs sm:text-sm text-dark-400">Total Target</p>
            </div>
            <h3 className={`font-bold text-white break-words ${
              formatCurrency(
                goals
                  .filter((g) => g.status === 'active')
                  .reduce((sum, g) => sum + parseFloat(g.target_amount), 0)
              ).length > 15 ? 'text-base sm:text-lg' :
              formatCurrency(
                goals
                  .filter((g) => g.status === 'active')
                  .reduce((sum, g) => sum + parseFloat(g.target_amount), 0)
              ).length > 12 ? 'text-lg sm:text-xl' :
              'text-lg sm:text-2xl'
            }`}>
              {formatCurrency(
                goals
                  .filter((g) => g.status === 'active')
                  .reduce((sum, g) => sum + parseFloat(g.target_amount), 0)
              )}
            </h3>
          </div>

          <div className="card bg-gradient-to-br from-info/20 to-info/5 border-info/30">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-info flex-shrink-0" />
              <p className="text-xs sm:text-sm text-dark-400">Total Saved</p>
            </div>
            <h3 className={`font-bold text-white break-words ${
              formatCurrency(
                goals
                  .filter((g) => g.status === 'active')
                  .reduce((sum, g) => sum + parseFloat(g.current_amount), 0)
              ).length > 15 ? 'text-base sm:text-lg' :
              formatCurrency(
                goals
                  .filter((g) => g.status === 'active')
                  .reduce((sum, g) => sum + parseFloat(g.current_amount), 0)
              ).length > 12 ? 'text-lg sm:text-xl' :
              'text-lg sm:text-2xl'
            }`}>
              {formatCurrency(
                goals
                  .filter((g) => g.status === 'active')
                  .reduce((sum, g) => sum + parseFloat(g.current_amount), 0)
              )}
            </h3>
          </div>

          <div className="card bg-gradient-to-br from-warning/20 to-warning/5 border-warning/30">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-warning flex-shrink-0" />
              <p className="text-xs sm:text-sm text-dark-400">Avg Progress</p>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-white">
              {goals.filter((g) => g.status === 'active').length > 0
                ? (
                    goals
                      .filter((g) => g.status === 'active')
                      .reduce((sum, g) => sum + parseFloat(g.progress_percentage || 0), 0) /
                    goals.filter((g) => g.status === 'active').length
                  ).toFixed(1)
                : 0}
              %
            </h3>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {loading ? (
            <div className="card">
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-dark-400 text-sm">Loading goals...</p>
              </div>
            </div>
          ) : goals.length === 0 ? (
            <div className="card">
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400 mb-4">No financial goals yet</p>
                <button onClick={() => handleOpenModal()} className="btn btn-primary">
                  Create Your First Goal
                </button>
              </div>
            </div>
          ) : (
            goals.map((goal) => {
              const progress = parseFloat(goal.progress_percentage || 0);
              const daysRemaining = goal.target_date ? getDaysRemaining(goal.target_date) : null;

              return (
                <div
                  key={goal.id}
                  className="card hover:border-primary-600/50 transition-all"
                >
                  {/* Mobile Layout */}
                  <div className="block lg:hidden space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base font-bold text-white">{goal.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${getPriorityBadge(goal.priority)}`}>
                            {goal.priority}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusBadge(goal.status)}`}>
                            {goal.status}
                          </span>
                        </div>
                        {goal.description && (
                          <p className="text-xs text-dark-400 mb-2 line-clamp-2">{goal.description}</p>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                          onClick={() => handleOpenContributionModal(goal)}
                          className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                          title="Add Contribution"
                        >
                          <Plus className="w-4 h-4 text-dark-400 hover:text-success" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(goal)}
                          className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-dark-400 hover:text-primary-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-dark-900/50 p-2 rounded">
                        <p className="text-xs text-dark-400 mb-0.5">Target</p>
                        <p className="text-sm font-semibold text-white break-words">
                          {formatCurrency(goal.target_amount)}
                        </p>
                      </div>
                      
                      <div className="bg-dark-900/50 p-2 rounded">
                        <p className="text-xs text-dark-400 mb-0.5">Current</p>
                        <p className="text-sm font-semibold text-white break-words">
                          {formatCurrency(goal.current_amount)}
                        </p>
                      </div>
                      
                      {goal.target_date && (
                        <div className="bg-dark-900/50 p-2 rounded">
                          <p className="text-xs text-dark-400 mb-0.5">Days Left</p>
                          <p className="text-sm font-semibold text-white">
                            {daysRemaining !== null
                              ? daysRemaining > 0
                                ? `${daysRemaining} days`
                                : 'Overdue'
                              : 'No deadline'}
                          </p>
                        </div>
                      )}
                      
                      {goal.monthly_required && (
                        <div className="bg-dark-900/50 p-2 rounded">
                          <p className="text-xs text-dark-400 mb-0.5">Monthly Required</p>
                          <p className="text-sm font-semibold text-white break-words">
                            {formatCurrency(goal.monthly_required)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-dark-400">Progress</span>
                        <span className="font-semibold text-white">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-3">
                        <div
                          className="h-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                          }}
                        >
                          {progress >= 10 && (
                            <span className="text-xs font-bold text-white">
                              {progress.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-dark-400">
                        <span className="break-words">Remaining: {formatCurrency(goal.remaining_amount)}</span>
                        {goal.auto_save_amount > 0 && (
                          <span className="break-words">Auto: {formatCurrency(goal.auto_save_amount)}/mo</span>
                        )}
                      </div>
                    </div>

                    {/* Recent Contributions */}
                    {goal.recent_contributions && goal.recent_contributions.length > 0 && (
                      <div className="pt-3 border-t border-dark-700">
                        <p className="text-xs text-dark-400 mb-2">Recent Contributions</p>
                        <div className="space-y-1">
                          {goal.recent_contributions.slice(0, 3).map((contrib: any) => (
                            <div
                              key={contrib.id}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-dark-300">
                                {new Date(contrib.date).toLocaleDateString('id-ID')}
                              </span>
                              <span className="text-success font-medium">
                                +{formatCurrency(contrib.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:block">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{goal.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${getPriorityBadge(goal.priority)}`}>
                            {goal.priority}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusBadge(goal.status)}`}>
                            {goal.status}
                          </span>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-dark-400 mb-3">{goal.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-dark-400">
                          <span className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>Target: {formatCurrency(goal.target_amount)}</span>
                          </span>
                          {goal.target_date && (
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {daysRemaining !== null
                                  ? daysRemaining > 0
                                    ? `${daysRemaining} days left`
                                    : 'Overdue'
                                  : 'No deadline'}
                              </span>
                            </span>
                          )}
                          {goal.monthly_required && (
                            <span className="flex items-center space-x-1">
                              <TrendingUp className="w-4 h-4" />
                              <span>Required: {formatCurrency(goal.monthly_required)}/month</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-dark-400 mb-1">Current Progress</p>
                          <p className="text-2xl font-bold text-white">
                            {formatCurrency(goal.current_amount)}
                          </p>
                          <p className="text-xs text-dark-400">
                            of {formatCurrency(goal.target_amount)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenContributionModal(goal)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Add Contribution"
                          >
                            <Plus className="w-4 h-4 text-dark-400 hover:text-success" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(goal)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-dark-400 hover:text-primary-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(goal.id)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dark-400">Progress</span>
                        <span className="font-semibold text-white">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-4">
                        <div
                          className="h-4 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                          }}
                        >
                          {progress >= 10 && (
                            <span className="text-xs font-bold text-white">
                              {progress.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-dark-400">
                        <span>Remaining: {formatCurrency(goal.remaining_amount)}</span>
                        {goal.auto_save_amount > 0 && (
                          <span>Auto-save: {formatCurrency(goal.auto_save_amount)}/month</span>
                        )}
                      </div>
                    </div>

                    {/* Recent Contributions */}
                    {goal.recent_contributions && goal.recent_contributions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-dark-700">
                        <p className="text-sm text-dark-400 mb-2">Recent Contributions</p>
                        <div className="space-y-1">
                          {goal.recent_contributions.slice(0, 3).map((contrib: any) => (
                            <div
                              key={contrib.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-dark-300">
                                {new Date(contrib.date).toLocaleDateString('id-ID')}
                              </span>
                              <span className="text-success font-medium">
                                +{formatCurrency(contrib.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Form for Goal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingGoal ? 'Edit Goal' : 'Add New Goal'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Goal Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="e.g., Emergency Fund"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full"
                rows={2}
                placeholder="Describe your goal..."
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Target Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Current Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="input w-full"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Auto-save Amount (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.auto_save_amount}
                  onChange={(e) => setFormData({ ...formData, auto_save_amount: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input w-full"
                  required
                  disabled={isSubmitting}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input w-full"
                  required
                  disabled={isSubmitting}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input w-full"
                  required
                  disabled={isSubmitting}
                >
                  <option value="savings">Savings</option>
                  <option value="investment">Investment</option>
                  <option value="purchase">Purchase</option>
                  <option value="debt_repayment">Debt Repayment</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
              <button 
                type="submit" 
                className="btn btn-primary flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </span>
                ) : (
                  editingGoal ? 'Update Goal' : 'Create Goal'
                )}
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="btn btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Form for Contribution */}
        <Modal
          isOpen={isContributionModalOpen}
          onClose={handleCloseContributionModal}
          title={`Add Contribution to ${selectedGoal?.name || ''}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleContributionSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={contributionData.amount}
                onChange={(e) => setContributionData({ ...contributionData, amount: e.target.value })}
                className="input w-full"
                placeholder="0.00"
                required
                disabled={isSubmittingContribution}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Date
              </label>
              <input
                type="date"
                value={contributionData.date}
                onChange={(e) => setContributionData({ ...contributionData, date: e.target.value })}
                className="input w-full"
                required
                disabled={isSubmittingContribution}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={contributionData.notes}
                onChange={(e) => setContributionData({ ...contributionData, notes: e.target.value })}
                className="input w-full"
                rows={2}
                placeholder="Additional notes..."
                disabled={isSubmittingContribution}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
              <button 
                type="submit" 
                className="btn btn-primary flex-1"
                disabled={isSubmittingContribution}
              >
                {isSubmittingContribution ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding...</span>
                  </span>
                ) : (
                  'Add Contribution'
                )}
              </button>
              <button
                type="button"
                onClick={handleCloseContributionModal}
                className="btn btn-secondary flex-1"
                disabled={isSubmittingContribution}
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