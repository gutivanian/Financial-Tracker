// pftu\pages\accounts.tsx
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { Plus, Wallet, Building2, Smartphone, CreditCard as CreditCardIcon, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export default function Accounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    balance: '',
    currency: 'IDR',
    color: '#3B82F6',
    is_active: true
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/accounts');
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (account?: any) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
        color: account.color,
        is_active: account.is_active
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        type: 'bank',
        balance: '',
        currency: 'IDR',
        color: '#3B82F6',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    setFormData({
      name: '',
      type: 'bank',
      balance: '',
      currency: 'IDR',
      color: '#3B82F6',
      is_active: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAccount 
        ? `/api/accounts?id=${editingAccount.id}` 
        : '/api/accounts';
      const method = editingAccount ? 'PUT' : 'POST';

      const response = editingAccount ? await apiPut(url, formData) : await apiPost(url, formData);

      if (response) {
        await fetchAccounts();
        handleCloseModal();
      } else {
        alert('Failed to save account');
      }
    } catch (error) {
      console.error('Error saving account:', error);
      alert('Error saving account');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    
    try {
      const response = await apiDelete(`/api/accounts?id=${id}`);

      if (response) {
        await fetchAccounts();
      } else {
        alert('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account');
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return Building2;
      case 'e-wallet':
        return Smartphone;
      case 'cash':
        return Wallet;
      case 'credit_card':
        return CreditCardIcon;
      default:
        return Wallet;
    }
  };

  const totalBalance = accounts
    .filter((a) => a.type !== 'credit_card' && a.is_active)
    .reduce((sum, a) => sum + parseFloat(a.balance), 0);

  const totalCreditCardDebt = accounts
    .filter((a) => a.type === 'credit_card' && a.is_active)
    .reduce((sum, a) => sum + Math.abs(parseFloat(a.balance)), 0);

  const accountsByType = {
    bank: accounts.filter((a) => a.type === 'bank' && a.is_active),
    'e-wallet': accounts.filter((a) => a.type === 'e-wallet' && a.is_active),
    cash: accounts.filter((a) => a.type === 'cash' && a.is_active),
    credit_card: accounts.filter((a) => a.type === 'credit_card' && a.is_active),
  };

  const AccountCard = ({ account }: { account: any }) => {
    const Icon = getAccountIcon(account.type);
    const isCredit = account.type === 'credit_card';
    const formattedBalance = formatCurrency(isCredit ? Math.abs(account.balance) : account.balance, account.currency);
    
    return (
      <div className="p-3 sm:p-5 bg-dark-800 rounded-lg hover:bg-dark-750 transition-all">
        {/* Mobile Layout */}
        <div className="block lg:hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isCredit ? 'bg-danger/20' : ''
                }`}
                style={!isCredit ? { backgroundColor: account.color + '20' } : {}}
              >
                <Icon 
                  className={`w-5 h-5 ${isCredit ? 'text-danger' : ''}`}
                  style={!isCredit ? { color: account.color } : {}}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm truncate">{account.name}</h3>
                <p className="text-xs text-dark-400">{account.currency}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <button
                onClick={() => handleOpenModal(account)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4 text-dark-400 hover:text-primary-400" />
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger" />
              </button>
            </div>
          </div>
          
          <div className="bg-dark-900/50 p-2 rounded text-right">
            <p className="text-xs text-dark-400 mb-1">Balance</p>
            <p className={`font-bold break-words ${isCredit ? 'text-danger' : 'text-white'} ${
              formattedBalance.length > 15 ? 'text-base' :
              formattedBalance.length > 12 ? 'text-lg' :
              'text-xl'
            }`}>
              {formattedBalance}
            </p>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isCredit ? 'bg-danger/20' : ''
                }`}
                style={!isCredit ? { backgroundColor: account.color + '20' } : {}}
              >
                <Icon 
                  className={`w-6 h-6 ${isCredit ? 'text-danger' : ''}`}
                  style={!isCredit ? { color: account.color } : {}}
                />
              </div>
              <div>
                <h3 className="font-semibold text-white">{account.name}</h3>
                <p className="text-xs text-dark-400">{account.currency}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleOpenModal(account)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4 text-dark-400 hover:text-primary-400" />
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger" />
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-dark-400 mb-1">Balance</p>
            <p className={`font-bold break-words ${isCredit ? 'text-danger' : 'text-white'} ${
              formattedBalance.length > 15 ? 'text-lg' :
              formattedBalance.length > 12 ? 'text-xl' :
              'text-2xl'
            }`}>
              {formattedBalance}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Akun & Rekening</h1>
            <p className="text-dark-400 mt-1 text-sm">Kelola semua akun keuangan kamu</p>
          </div>
          <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center justify-center space-x-2 text-sm">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Add Account</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="card bg-gradient-to-br from-success/20 to-success/5 border-success/30">
            <p className="text-xs sm:text-sm text-dark-400 mb-1">Total Balance</p>
            <h3 className={`font-bold text-success break-words ${
              formatCurrency(totalBalance).length > 15 ? 'text-base sm:text-lg' :
              formatCurrency(totalBalance).length > 12 ? 'text-lg sm:text-xl' :
              'text-lg sm:text-2xl'
            }`}>
              {formatCurrency(totalBalance)}
            </h3>
            <p className="text-xs text-dark-400 mt-2">
              {accounts.filter((a) => a.type !== 'credit_card' && a.is_active).length} accounts
            </p>
          </div>

          <div className="card bg-gradient-to-br from-danger/20 to-danger/5 border-danger/30">
            <p className="text-xs sm:text-sm text-dark-400 mb-1">Credit Card Debt</p>
            <h3 className={`font-bold text-danger break-words ${
              formatCurrency(totalCreditCardDebt).length > 15 ? 'text-base sm:text-lg' :
              formatCurrency(totalCreditCardDebt).length > 12 ? 'text-lg sm:text-xl' :
              'text-lg sm:text-2xl'
            }`}>
              {formatCurrency(totalCreditCardDebt)}
            </h3>
            <p className="text-xs text-dark-400 mt-2">
              {accountsByType.credit_card.length} cards
            </p>
          </div>

          <div className="card bg-gradient-to-br from-primary-600/20 to-primary-700/5 border-primary-600/30">
            <p className="text-xs sm:text-sm text-dark-400 mb-1">Net Worth</p>
            <h3
              className={`font-bold break-words ${
                totalBalance - totalCreditCardDebt >= 0 ? 'text-success' : 'text-danger'
              } ${
                formatCurrency(totalBalance - totalCreditCardDebt).length > 15 ? 'text-base sm:text-lg' :
                formatCurrency(totalBalance - totalCreditCardDebt).length > 12 ? 'text-lg sm:text-xl' :
                'text-lg sm:text-2xl'
              }`}
            >
              {formatCurrency(totalBalance - totalCreditCardDebt)}
            </h3>
            <p className="text-xs text-dark-400 mt-2">From liquid assets</p>
          </div>
        </div>

        {/* Bank Accounts */}
        {accountsByType.bank.length > 0 && (
          <div className="card">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
              <span>Bank Accounts</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {accountsByType.bank.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          </div>
        )}

        {/* E-Wallets */}
        {accountsByType['e-wallet'].length > 0 && (
          <div className="card">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
              <span>E-Wallets</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {accountsByType['e-wallet'].map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          </div>
        )}

        {/* Cash */}
        {accountsByType.cash.length > 0 && (
          <div className="card">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
              <span>Cash</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {accountsByType.cash.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          </div>
        )}

        {/* Credit Cards */}
        {accountsByType.credit_card.length > 0 && (
          <div className="card">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <CreditCardIcon className="w-5 h-5 sm:w-6 sm:h-6 text-danger" />
              <span>Credit Cards</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {accountsByType.credit_card.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          </div>
        )}

        {/* Modal Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingAccount ? 'Edit Account' : 'Add New Account'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Account Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="e.g., BCA Savings"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Account Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input w-full"
                required
              >
                <option value="bank">Bank Account</option>
                <option value="e-wallet">E-Wallet</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="SGD">SGD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="input flex-1"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-dark-600 text-primary-600 focus:ring-primary-600"
              />
              <label htmlFor="is_active" className="text-sm text-dark-400">
                Active Account
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
              <button type="submit" className="btn btn-primary flex-1">
                {editingAccount ? 'Update Account' : 'Create Account'}
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