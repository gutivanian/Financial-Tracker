import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import IconRenderer from '@/components/IconRenderer';
import IconPicker from '@/components/IconPicker';
import { Plus, Search, Edit2, Trash2, Folder, TrendingUp, TrendingDown } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export default function Categories() {
  const [categories, setCategories] = useState<any>({ all: [] });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [filter, setFilter] = useState({
    type: '',
    budget_type: '',
    search: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    icon: 'Folder',
    color: '#6366f1',
    budget_type: 'needs',
    parent_id: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.budget_type) params.append('budget_type', filter.budget_type);

      const data = await apiGet(`/api/categories?${params.toString()}`);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
        icon: category.icon || 'Folder',
        color: category.color || '#6366f1',
        budget_type: category.budget_type || 'needs',
        parent_id: category.parent_id || '',
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        type: 'expense',
        icon: 'Folder',
        color: '#6366f1',
        budget_type: 'needs',
        parent_id: '',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await apiPut(`/api/categories?id=${editingCategory.id}`, formData);
      } else {
        await apiPost('/api/categories', formData);
      }
      await fetchCategories();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert(error?.message || 'Error saving category');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This will fail if the category is being used in transactions or budgets.')) return;
    
    try {
      await apiDelete(`/api/categories?id=${id}`);
      await fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(error?.message || 'Error deleting category');
    }
  };

  const filteredCategories = categories.all.filter((cat: any) => {
    if (filter.type && cat.type !== filter.type) return false;
    if (filter.budget_type && cat.budget_type !== filter.budget_type) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return cat.name.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const budgetTypeLabels: Record<string, string> = {
    needs: 'Needs (50%)',
    wants: 'Wants (30%)',
    savings: 'Savings (20%)',
  };

  const budgetTypeColors: Record<string, string> = {
    needs: 'warning',
    wants: 'info',
    savings: 'success',
  };

  const colorPresets = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1',
    '#f97316', '#14b8a6', '#a855f7', '#84cc16'
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Master Data Kategori</h1>
            <p className="text-dark-400 mt-1">Kelola kategori income dan expense</p>
          </div>
          <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Tambah Kategori</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card">
            <p className="text-xs text-dark-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{categories.all.length}</p>
          </div>
          <div className="card">
            <p className="text-xs text-dark-400 mb-1">Income</p>
            <p className="text-2xl font-bold text-success">{categories.income?.length || 0}</p>
          </div>
          <div className="card">
            <p className="text-xs text-dark-400 mb-1">Needs</p>
            <p className="text-2xl font-bold text-warning">{categories.needs?.length || 0}</p>
          </div>
          <div className="card">
            <p className="text-xs text-dark-400 mb-1">Wants</p>
            <p className="text-2xl font-bold text-info">{categories.wants?.length || 0}</p>
          </div>
          <div className="card">
            <p className="text-xs text-dark-400 mb-1">Savings</p>
            <p className="text-2xl font-bold text-success">{categories.savings?.length || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-dark-400 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  placeholder="Cari kategori..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-2">Type</label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="input w-full"
              >
                <option value="">Semua Type</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-2">Budget Type</label>
              <select
                value={filter.budget_type}
                onChange={(e) => setFilter({ ...filter, budget_type: e.target.value })}
                className="input w-full"
              >
                <option value="">Semua Budget Type</option>
                <option value="needs">Needs (50%)</option>
                <option value="wants">Wants (30%)</option>
                <option value="savings">Savings (20%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              All Categories ({filteredCategories.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dark-400">Loading categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 mb-4">No categories found</p>
              <button onClick={() => handleOpenModal()} className="btn btn-primary">
                Add First Category
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Icon</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Budget Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Color</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat: any) => (
                    <tr key={cat.id} className="border-b border-dark-800 hover:bg-dark-800 transition-colors">
                      <td className="py-3 px-4">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: cat.color + '20' }}
                        >
                          <IconRenderer iconName={cat.icon} className="w-6 h-6" fallbackEmoji="📊" />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-white">{cat.name}</p>
                        {cat.user_id === null && (
                          <span className="text-xs text-dark-500 bg-dark-700 px-2 py-0.5 rounded">
                            System Default
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {cat.type === 'income' ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-success" />
                              <span className="text-success text-sm font-medium">Income</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-4 h-4 text-danger" />
                              <span className="text-danger text-sm font-medium">Expense</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {cat.budget_type ? (
                          <span className={`text-xs px-2 py-1 rounded font-medium bg-${budgetTypeColors[cat.budget_type]}/20 text-${budgetTypeColors[cat.budget_type]}`}>
                            {budgetTypeLabels[cat.budget_type]}
                          </span>
                        ) : (
                          <span className="text-xs text-dark-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded border border-dark-600"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-xs text-dark-400 font-mono">{cat.color}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          cat.is_active ? 'bg-success/20 text-success' : 'bg-dark-700 text-dark-400'
                        }`}>
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenModal(cat)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-dark-400 hover:text-primary-400" />
                          </button>
                          {cat.user_id !== null && (
                            <button
                              onClick={() => handleDelete(cat.id)}
                              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingCategory ? 'Edit Category' : 'Add New Category'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="e.g., Groceries"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              {formData.type === 'expense' && (
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-2">
                    Budget Type (50/30/20)
                  </label>
                  <select
                    value={formData.budget_type}
                    onChange={(e) => setFormData({ ...formData, budget_type: e.target.value })}
                    className="input w-full"
                  >
                    <option value="needs">Needs (50%)</option>
                    <option value="wants">Wants (30%)</option>
                    <option value="savings">Savings (20%)</option>
                  </select>
                  <p className="text-xs text-dark-500 mt-1">
                    {formData.budget_type === 'needs' && 'Essentials: housing, food, healthcare'}
                    {formData.budget_type === 'wants' && 'Lifestyle: entertainment, dining out'}
                    {formData.budget_type === 'savings' && 'Future: investments, emergency fund'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Icon *
              </label>
              <IconPicker
                value={formData.icon}
                onChange={(icon) => setFormData({ ...formData, icon })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Color *
              </label>
              <div className="flex items-center space-x-3 mb-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      formData.color === color ? 'scale-110 ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
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
                  placeholder="#6366f1"
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
                Active Category
              </label>
            </div>

            {/* Preview */}
            <div className="p-4 bg-dark-800 rounded-lg border border-dark-700">
              <p className="text-xs text-dark-400 mb-2">Preview:</p>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: formData.color + '20' }}
                >
                  <IconRenderer iconName={formData.icon} className="w-7 h-7" fallbackEmoji="📊" />
                </div>
                <div>
                  <p className="font-medium text-white">{formData.name || 'Category Name'}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      formData.type === 'income' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                    }`}>
                      {formData.type}
                    </span>
                    {formData.type === 'expense' && formData.budget_type && (
                      <span className={`text-xs px-2 py-0.5 rounded bg-${budgetTypeColors[formData.budget_type]}/20 text-${budgetTypeColors[formData.budget_type]}`}>
                        {formData.budget_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <button type="submit" className="btn btn-primary flex-1">
                {editingCategory ? 'Update Category' : 'Add Category'}
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