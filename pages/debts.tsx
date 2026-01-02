// pages\debts.tsx
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import AccountSelect from '@/components/AccountSelect';
import { Plus, AlertCircle, DollarSign, Calendar, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export default function Debts() {
  const [debts, setDebts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    creditor_name: '',
    debt_type: 'personal',
    original_amount: '',
    interest_rate: '',
    current_balance: '',
    minimum_payment: '',
    due_date: '',
    payment_type: 'manual',
    start_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [paymentData, setPaymentData] = useState({
    account_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchDebts();
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const data = await apiGet('/api/accounts');
      console.log('Fetched accounts:', data); // Debug log
      // API returns array directly, not { accounts: [] }
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/debts');
      setDebts(data.debts);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching debts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (debt?: any) => {
    if (debt) {
      setEditingDebt(debt);
      setFormData({
        creditor_name: debt.creditor,
        debt_type: debt.debt_type,
        original_amount: debt.original_amount,
        interest_rate: debt.interest_rate,
        current_balance: debt.current_balance,
        minimum_payment: debt.minimum_payment,
        due_date: debt.payment_due_date?.toString() || '',
        payment_type: debt.payment_type || 'manual',
        start_date: debt.start_date.split('T')[0],
        notes: debt.notes || ''
      });
    } else {
      setEditingDebt(null);
      setFormData({
        creditor_name: '',
        debt_type: 'personal',
        original_amount: '',
        interest_rate: '',
        current_balance: '',
        minimum_payment: '',
        due_date: '',
        payment_type: 'manual',
        start_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDebt(null);
  };

  const handleOpenPaymentModal = (debt: any) => {
    setSelectedDebt(debt);
    const activeAccounts = accounts.filter(acc => acc.is_active);
    console.log('Active accounts for payment:', activeAccounts); // Debug log
    setPaymentData({
      account_id: activeAccounts.length > 0 ? activeAccounts[0].id.toString() : '',
      amount: debt.minimum_payment || '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedDebt(null);
  };

  const handleOpenHistoryModal = async (debt: any) => {
    setSelectedDebt(debt);
    try {
      const data = await apiGet(`/api/debts/${debt.id}/payments`);
      setPaymentHistory(data.payments || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setPaymentHistory([]);
    }
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedDebt(null);
    setPaymentHistory([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDebt 
        ? `/api/debts?id=${editingDebt.id}` 
        : '/api/debts';

      const response = editingDebt ? await apiPut(url, formData) : await apiPost(url, formData);

      if (response) {
        await fetchDebts();
        handleCloseModal();
      } else {
        alert('Failed to save debt');
      }
    } catch (error) {
      console.error('Error saving debt:', error);
      alert('Error saving debt');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;

    const paymentAmount = parseFloat(paymentData.amount);
    const currentBalance = parseFloat(selectedDebt.current_balance);

    // Frontend validation
    if (paymentAmount <= 0) {
      alert('❌ Payment amount must be greater than 0');
      return;
    }

    if (paymentAmount > currentBalance) {
      alert(`⚠️ Payment amount (${formatCurrency(paymentAmount)}) exceeds current balance (${formatCurrency(currentBalance)}).\n\nPlease enter a valid amount up to ${formatCurrency(currentBalance)}.`);
      return;
    }

    try {
      const response = await apiPost('/api/debts/payment', {
        debt_id: selectedDebt.id,
        ...paymentData
      });

      if (response && response.success) {
        // Show success message
        const isPaidOff = response.debt_update?.is_paid_off;
        if (isPaidOff) {
          alert(`🎉 ${response.message}\n\n"${selectedDebt.creditor}" is now fully paid off!`);
        } else {
          alert(`✅ Payment recorded successfully!\n\nNew balance: ${formatCurrency(response.debt_update.new_balance)}`);
        }
        
        await fetchDebts();
        handleClosePaymentModal();
      }
    } catch (error: any) {
      console.error('Error recording payment:', error);
      
      // Handle specific error types
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.error === 'DEBT_ALREADY_PAID') {
          alert(`❌ ${errorData.message}\n\nThis debt is already paid off.`);
        } else if (errorData.error === 'OVERPAYMENT') {
          alert(`⚠️ ${errorData.message}\n\n${errorData.suggestion || ''}`);
        } else if (errorData.error === 'INVALID_AMOUNT') {
          alert(`❌ ${errorData.message}`);
        } else {
          alert(`Error: ${errorData.message || 'Failed to record payment'}`);
        }
      } else {
        alert('Failed to record payment. Please try again.');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this debt?')) return;
    
    try {
      const response = await apiDelete(`/api/debts?id=${id}`);

      if (response) {
        await fetchDebts();
      } else {
        alert('Failed to delete debt');
      }
    } catch (error) {
      console.error('Error deleting debt:', error);
      alert('Error deleting debt');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Debt Management</h1>
            <p className="text-dark-400 mt-1 text-sm">Track dan manage semua hutang kamu</p>
          </div>
          <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center justify-center space-x-2 text-sm">
            <Plus className="w-4 h-4" />
            <span>Add Debt</span>
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="card bg-gradient-to-br from-danger/20 to-danger/5 border-danger/30">
              <p className="text-xs sm:text-sm text-dark-400 mb-1">Total Debt</p>
              <h3 className={`font-bold text-danger break-words ${
                formatCurrency(summary.total_debt).length > 15 ? 'text-base sm:text-lg' :
                formatCurrency(summary.total_debt).length > 12 ? 'text-lg sm:text-xl' :
                'text-lg sm:text-2xl'
              }`}>
                {formatCurrency(summary.total_debt)}
              </h3>
              <p className="text-xs text-dark-400 mt-2 hidden sm:block">Outstanding balance</p>
            </div>

            <div className="card bg-gradient-to-br from-warning/20 to-warning/5 border-warning/30">
              <p className="text-xs sm:text-sm text-dark-400 mb-1">Monthly Payments</p>
              <h3 className={`font-bold text-warning break-words ${
                formatCurrency(summary.monthly_minimum).length > 15 ? 'text-base sm:text-lg' :
                formatCurrency(summary.monthly_minimum).length > 12 ? 'text-lg sm:text-xl' :
                'text-lg sm:text-2xl'
              }`}>
                {formatCurrency(summary.monthly_minimum)}
              </h3>
              <p className="text-xs text-dark-400 mt-2 hidden sm:block">Total minimum due</p>
            </div>

            <div className="card bg-gradient-to-br from-info/20 to-info/5 border-info/30">
              <p className="text-xs sm:text-sm text-dark-400 mb-1">Total Paid</p>
              <h3 className={`font-bold text-info break-words ${
                formatCurrency(summary.total_paid).length > 15 ? 'text-base sm:text-lg' :
                formatCurrency(summary.total_paid).length > 12 ? 'text-lg sm:text-xl' :
                'text-lg sm:text-2xl'
              }`}>
                {formatCurrency(summary.total_paid)}
              </h3>
              <p className="text-xs text-dark-400 mt-2 hidden sm:block">Total paid amount</p>
            </div>

            <div className="card bg-gradient-to-br from-success/20 to-success/5 border-success/30">
              <p className="text-xs sm:text-sm text-dark-400 mb-1">Paid Off</p>
              <h3 className="text-lg sm:text-2xl font-bold text-success">
                {summary.paid_off_debts}
              </h3>
              <p className="text-xs text-dark-400 mt-2 hidden sm:block">Completed debts</p>
            </div>
          </div>
        )}

        {/* Debts List */}
        <div className="card">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-6">Your Debts</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dark-400 text-sm">Loading debts...</p>
            </div>
          ) : debts.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 mb-4">No debts recorded</p>
              <button onClick={() => handleOpenModal()} className="btn btn-primary">
                Add Debt
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {debts.map((debt) => {
                const progressPercentage = ((parseFloat(debt.original_amount) - parseFloat(debt.current_balance)) / parseFloat(debt.original_amount)) * 100;
                const isPaidOff = debt.status === 'paid_off';
                
                return (
                  <div 
                    key={debt.id} 
                    className={`p-3 sm:p-4 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors border-l-4 ${
                      isPaidOff ? 'border-success opacity-75' : 'border-danger'
                    }`}
                  >
                    {/* Mobile Layout */}
                    <div className="block lg:hidden space-y-3">
                      {/* Header with Icon & Name */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isPaidOff ? 'bg-success/20' : 'bg-danger/20'
                          }`}>
                            {isPaidOff ? (
                              <CheckCircle className="w-5 h-5 text-success" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-danger" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white text-sm truncate">{debt.creditor}</h3>
                              {isPaidOff && (
                                <span className="px-2 py-0.5 bg-success/20 text-success text-xs font-semibold rounded">
                                  PAID OFF
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-dark-400 capitalize mt-0.5">{debt.debt_type.replace('_', ' ')}</p>
                            <p className="text-xs text-dark-400 mt-1">
                              {!isPaidOff && `Due: ${debt.payment_due_date || 'N/A'} • `}
                              Started: {formatDate(debt.start_date)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button
                            onClick={() => handleOpenHistoryModal(debt)}
                            className="btn btn-secondary btn-sm text-xs px-2 py-1"
                            title="View payment history"
                          >
                            History
                          </button>
                          {!isPaidOff && (
                            <button
                              onClick={() => handleOpenPaymentModal(debt)}
                              className="btn btn-success btn-sm text-xs px-2 py-1"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenModal(debt)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-dark-400 hover:text-primary-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(debt.id)}
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
                          <p className="text-xs text-dark-400 mb-0.5">Current Balance</p>
                          <p className={`text-sm font-semibold break-words ${
                            isPaidOff ? 'text-success' : 'text-danger'
                          } ${formatCurrency(debt.current_balance).length > 12 ? 'text-xs' : ''}`}>
                            {formatCurrency(debt.current_balance)}
                          </p>
                          <p className="text-xs text-dark-500">of {formatCurrency(debt.original_amount)}</p>
                        </div>
                        
                        <div className="bg-dark-900/50 p-2 rounded">
                          <p className="text-xs text-dark-400 mb-0.5">Monthly Payment</p>
                          <p className={`text-sm font-semibold text-white break-words ${
                            formatCurrency(debt.minimum_payment).length > 12 ? 'text-xs' : ''
                          }`}>
                            {formatCurrency(debt.minimum_payment)}
                          </p>
                          <p className="text-xs text-dark-500">Interest: {debt.interest_rate}%</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-dark-400">Paid Off Progress</span>
                          <span className="font-semibold text-white">{progressPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-dark-700 rounded-full h-2">
                          <div
                            className="h-2 bg-success rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop Layout */}
                    <div className="hidden lg:block">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              isPaidOff ? 'bg-success/20' : 'bg-danger/20'
                            }`}>
                              {isPaidOff ? (
                                <CheckCircle className="w-6 h-6 text-success" />
                              ) : (
                                <AlertCircle className="w-6 h-6 text-danger" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white">{debt.creditor}</h3>
                                {isPaidOff && (
                                  <span className="px-2 py-1 bg-success/20 text-success text-xs font-semibold rounded">
                                    PAID OFF
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-dark-400 capitalize">{debt.debt_type.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-dark-400">Current Balance</p>
                            <p className={`font-bold break-words ${
                              isPaidOff ? 'text-success' : 'text-danger'
                            } ${
                              formatCurrency(debt.current_balance).length > 15 ? 'text-base' :
                              formatCurrency(debt.current_balance).length > 12 ? 'text-lg' :
                              'text-xl'
                            }`}>
                              {formatCurrency(debt.current_balance)}
                            </p>
                            <p className="text-xs text-dark-400">of {formatCurrency(debt.original_amount)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-dark-400">Monthly Payment</p>
                            <p className="font-semibold text-white">{formatCurrency(debt.minimum_payment)}</p>
                            <p className="text-xs text-dark-400">Interest: {debt.interest_rate}%</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleOpenHistoryModal(debt)}
                              className="btn btn-secondary btn-sm"
                              title="View payment history"
                            >
                              History
                            </button>
                            {!isPaidOff && (
                              <button
                                onClick={() => handleOpenPaymentModal(debt)}
                                className="btn btn-success btn-sm"
                              >
                                Pay
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenModal(debt)}
                              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-dark-400 hover:text-primary-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(debt.id)}
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
                          <span className="text-dark-400">Paid Off Progress</span>
                          <span className="font-semibold text-white">{progressPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-dark-700 rounded-full h-2">
                          <div
                            className="h-2 bg-success rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-dark-400">
                          {!isPaidOff && <span>Due Date: {debt.payment_due_date || 'N/A'}</span>}
                          <span>Started: {formatDate(debt.start_date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingDebt ? 'Edit Debt' : 'Add New Debt'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">Creditor Name</label>
              <input
                type="text"
                value={formData.creditor_name}
                onChange={(e) => setFormData({ ...formData, creditor_name: e.target.value })}
                className="input w-full"
                placeholder="e.g., Bank ABC"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">Debt Type</label>
              <select
                value={formData.debt_type}
                onChange={(e) => setFormData({ ...formData, debt_type: e.target.value })}
                className="input w-full"
                required
              >
                <option value="personal">Personal Loan</option>
                <option value="credit_card">Credit Card</option>
                <option value="mortgage">Mortgage</option>
                <option value="auto">Auto Loan</option>
                <option value="student">Student Loan</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">Payment Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_type"
                    value="manual"
                    checked={formData.payment_type === 'manual'}
                    onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-dark-300">Manual</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_type"
                    value="autopayment"
                    checked={formData.payment_type === 'autopayment'}
                    onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-dark-300">Autopayment</span>
                </label>
              </div>
              <p className="text-xs text-dark-500 mt-1">
                {formData.payment_type === 'autopayment' 
                  ? 'Payment will be automatically created on due date' 
                  : 'You will receive reminder 3 days before due date'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">Original Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.original_amount}
                  onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">Current Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_balance}
                  onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">Minimum Payment</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minimum_payment}
                  onChange={(e) => setFormData({ ...formData, minimum_payment: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">Due Date (Day of Month)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., 15"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input w-full"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
              <button type="submit" className="btn btn-primary flex-1">
                {editingDebt ? 'Update Debt' : 'Add Debt'}
              </button>
              <button type="button" onClick={handleCloseModal} className="btn btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </Modal>

        {/* Payment Modal */}
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          title={`Record Payment - ${selectedDebt?.creditor || ''}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            {/* Debug info */}
            {console.log('Rendering payment modal, accounts:', accounts, 'paymentData:', paymentData)}
            
            <div className="bg-dark-800 p-4 rounded-lg border border-dark-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-dark-400">Current Balance</span>
                <span className="text-lg font-bold text-danger">
                  {formatCurrency(selectedDebt?.current_balance || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-400">Minimum Payment</span>
                <span className="text-sm font-semibold text-white">
                  {formatCurrency(selectedDebt?.minimum_payment || 0)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">Account</label>
              {accounts.length === 0 ? (
                <div className="text-sm text-danger">No accounts found. Please create an account first.</div>
              ) : (
                <AccountSelect
                  accounts={accounts.filter(acc => acc.is_active)}
                  value={paymentData.account_id}
                  onChange={(accountId) => setPaymentData({ ...paymentData, account_id: accountId })}
                  placeholder="Select Account"
                  formatBalance={formatCurrency}
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">Payment Amount</label>
              <input
                type="number"
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                className="input w-full"
                placeholder="0.00"
                required
              />
              <p className="text-xs text-dark-500 mt-1">
                Maximum: {formatCurrency(selectedDebt?.current_balance || 0)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">Payment Date</label>
              <input
                type="date"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">Notes (Optional)</label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                className="input w-full"
                rows={2}
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
              <button type="submit" className="btn btn-primary flex-1">
                Record Payment
              </button>
              <button type="button" onClick={handleClosePaymentModal} className="btn btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </Modal>

        {/* Payment History Modal */}
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={handleCloseHistoryModal}
          title={`Payment History - ${selectedDebt?.creditor || ''}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-dark-400">
                No payment history yet
              </div>
            ) : (
              <div className="space-y-3">
                {paymentHistory.map((payment: any, index: number) => (
                  <div key={payment.id} className="bg-dark-800 p-4 rounded-lg border border-dark-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm text-dark-400">Payment #{paymentHistory.length - index}</p>
                        <p className="text-xs text-dark-500">{formatDate(payment.payment_date)}</p>
                      </div>
                      <p className="text-lg font-bold text-success">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-dark-400">Principal</p>
                        <p className="font-semibold text-white">{formatCurrency(payment.principal_amount)}</p>
                      </div>
                      <div>
                        <p className="text-dark-400">Interest</p>
                        <p className="font-semibold text-warning">{formatCurrency(payment.interest_amount)}</p>
                      </div>
                      {payment.account_name && (
                        <div>
                          <p className="text-dark-400">Account</p>
                          <p className="font-semibold text-white">{payment.account_name}</p>
                        </div>
                      )}
                      {payment.transaction_id && (
                        <div>
                          <p className="text-dark-400">Transaction</p>
                          <p className="font-semibold text-primary">#{payment.transaction_id}</p>
                        </div>
                      )}
                    </div>
                    
                    {payment.notes && (
                      <p className="text-sm text-dark-400 mt-3 pt-3 border-t border-dark-700">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <button onClick={handleCloseHistoryModal} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}