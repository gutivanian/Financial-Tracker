// pages/investments.tsx
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { Plus, TrendingUp, Edit2, Trash2, RefreshCw, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export default function Investments() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);
  const [instrumentsData, setInstrumentsData] = useState<any>({ all: [] });
  
  const [formData, setFormData] = useState({
    instrument_id: '',
    quantity: '',
    purchase_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
    platform: '',
    notes: ''
  });

  useEffect(() => {
    fetchInvestments(true);
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    try {
      const data = await apiGet('/api/instruments?is_active=true');
      setInstrumentsData(data);
    } catch (error) {
      console.error('Error fetching instruments:', error);
    }
  };

  const fetchInvestments = async (withPrices = true) => {
    try {
      setLoading(true);
      const data = await apiGet(`/api/investments?with_prices=${withPrices}`);
      setInvestments(data.investments);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPrices = async () => {
    setRefreshingPrices(true);
    try {
      console.log('🔄 Starting batch price update...');
      
      // Call batch update endpoint
      const response = await apiPost('/api/investments/update-prices', {});
      
      if (response.success) {
        const { stats, errors, updated } = response;
        
        console.log('✅ Batch update completed:', stats);
        
        // Build detailed message
        let message = `✅ Price Update Completed!\n\n`;
        message += `📊 Statistics:\n`;
        message += `   Total Instruments: ${stats.total}\n`;
        message += `   ✅ Successfully Updated: ${stats.success}\n`;
        message += `   📦 Used Cache: ${stats.cached}\n`;
        message += `   ❌ Failed: ${stats.failed}\n`;
        message += `   ⏭️  Skipped: ${stats.skipped}\n`;
        
        // Show some successful updates
        if (updated && updated.length > 0) {
          message += `\n🎉 Recently Updated:\n`;
          updated.forEach((item: any) => {
            const displayPrice = item.source?.includes('IDR') || item.priceIDR === item.price
              ? `Rp ${item.priceIDR.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
              : `$${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            message += `   • ${item.instrument}: ${displayPrice}\n`;
          });
        }
        
        // Show errors if any
        if (errors && errors.length > 0) {
          message += `\n⚠️ Failed Updates (${errors.length}):\n`;
          errors.slice(0, 3).forEach((err: any) => {
            message += `   • ${err.instrument}\n     ${err.error}\n`;
          });
          if (errors.length > 3) {
            message += `   ... and ${errors.length - 3} more\n`;
          }
        }
        
        alert(message);
        
        // Refresh the investments list to show updated prices
        await fetchInvestments(false);
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error: any) {
      console.error('❌ Error refreshing prices:', error);
      alert(`Failed to refresh prices:\n\n${error.message || 'Unknown error occurred. Please try again.'}`);
    } finally {
      setRefreshingPrices(false);
    }
  };

  const handleOpenModal = (investment?: any) => {
    if (investment) {
      setEditingInvestment(investment);
      setFormData({
        instrument_id: investment.instrument_id || '',
        quantity: investment.quantity,
        purchase_price: investment.purchase_price,
        purchase_date: investment.purchase_date.split('T')[0],
        platform: investment.platform || '',
        notes: investment.notes || ''
      });
    } else {
      setEditingInvestment(null);
      setFormData({
        instrument_id: '',
        quantity: '',
        purchase_price: '',
        purchase_date: new Date().toISOString().split('T')[0],
        platform: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInvestment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInvestment) {
        await apiPut(`/api/investments?id=${editingInvestment.id}`, formData);
      } else {
        await apiPost('/api/investments', formData);
      }
      await fetchInvestments(true);
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving investment:', error);
      alert(error.message || 'Error saving investment');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this investment?')) return;
    
    try {
      await apiDelete(`/api/investments?id=${id}`);
      await fetchInvestments(true);
    } catch (error) {
      console.error('Error deleting investment:', error);
      alert('Error deleting investment');
    }
  };

  const getTimeSinceUpdate = (lastUpdated: string) => {
    if (!lastUpdated) return 'Never';
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMinutes = Math.floor((now.getTime() - updated.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getPriceStatusBadge = (inv: any) => {
    const hasRealTimePrice = inv.real_time_price;
    const hasError = inv.price_fetch_error;
    
    if (hasError) {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-danger/20 text-danger flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>Fetch Error</span>
        </span>
      );
    }
    
    if (hasRealTimePrice?.fromCache) {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-warning/20 text-warning flex items-center space-x-1">
          <span className="w-1.5 h-1.5 bg-warning rounded-full"></span>
          <span>Cached ({hasRealTimePrice.cacheAge}m)</span>
        </span>
      );
    }
    
    if (hasRealTimePrice && !hasRealTimePrice.fromCache) {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-success/20 text-success flex items-center space-x-1">
          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
          <span>Live</span>
        </span>
      );
    }
    
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-dark-700 text-dark-400 flex items-center space-x-1">
        <AlertCircle className="w-3 h-3" />
        <span>No Price</span>
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Investment Portfolio</h1>
            <p className="text-dark-400 mt-1 text-sm">Track semua investasi dengan harga real-time dari API</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-3">
            <button 
              onClick={handleRefreshPrices}
              disabled={refreshingPrices}
              className="btn btn-secondary flex items-center justify-center space-x-2 text-sm"
              title="Batch update all instrument prices from APIs"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingPrices ? 'animate-spin' : ''}`} />
              <span>{refreshingPrices ? 'Updating...' : 'Refresh All Prices'}</span>
            </button>
            <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center justify-center space-x-2 text-sm">
              <Plus className="w-4 h-4" />
              <span>Add Investment</span>
            </button>
          </div>
        </div>

        {/* Info Banner */}
        {refreshingPrices && (
          <div className="card bg-info/10 border-info/30 animate-pulse">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 text-info animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Updating prices from APIs...</p>
                <p className="text-xs text-dark-300">This may take a few moments. Please wait.</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
{/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="card bg-gradient-to-br from-primary-600/20 to-primary-700/5 border-primary-600/30">
              <p className="text-xs sm:text-sm text-dark-400 mb-1">Total Invested</p>
              <h3 className={`font-bold text-white break-words ${
                formatCurrency(summary.total_invested).length > 15 ? 'text-base sm:text-lg' :
                formatCurrency(summary.total_invested).length > 12 ? 'text-lg sm:text-xl' :
                'text-lg sm:text-2xl'
              }`}>
                {formatCurrency(summary.total_invested)}
              </h3>
              <p className="text-xs text-dark-400 mt-2 hidden sm:block">Capital invested</p>
            </div>

            <div className="card bg-gradient-to-br from-info/20 to-info/5 border-info/30">
              <p className="text-xs sm:text-sm text-dark-400 mb-1">Current Value</p>
              <h3 className={`font-bold text-white break-words ${
                formatCurrency(summary.current_value).length > 15 ? 'text-base sm:text-lg' :
                formatCurrency(summary.current_value).length > 12 ? 'text-lg sm:text-xl' :
                'text-lg sm:text-2xl'
              }`}>
                {formatCurrency(summary.current_value)}
              </h3>
              <p className="text-xs text-dark-400 mt-2 hidden sm:block">Live market value</p>
            </div>

            <div className={`card bg-gradient-to-br ${
              summary.total_gain_loss >= 0
                ? 'from-success/20 to-success/5 border-success/30'
                : 'from-danger/20 to-danger/5 border-danger/30'
            }`}>
              <p className="text-xs sm:text-sm text-dark-400 mb-1">Total Gain/Loss</p>
              <h3 className={`font-bold break-words ${
                summary.total_gain_loss >= 0 ? 'text-success' : 'text-danger'
              } ${
                formatCurrency(summary.total_gain_loss).length > 15 ? 'text-base sm:text-lg' :
                formatCurrency(summary.total_gain_loss).length > 12 ? 'text-lg sm:text-xl' :
                'text-lg sm:text-2xl'
              }`}>
                {summary.total_gain_loss >= 0 ? '+' : ''}
                {formatCurrency(summary.total_gain_loss)}
              </h3>
              <p className="text-xs text-dark-400 mt-2 hidden sm:block">Unrealized P/L</p>
            </div>

            <div className="card bg-gradient-to-br from-warning/20 to-warning/5 border-warning/30">
              <p className="text-xs sm:text-sm text-dark-400 mb-1">ROI</p>
              <h3 className={`text-lg sm:text-2xl font-bold ${
                summary.total_gain_loss_percentage >= 0 ? 'text-success' : 'text-danger'
              }`}>
                {summary.total_gain_loss_percentage >= 0 ? '+' : ''}
                {formatPercentage(summary.total_gain_loss_percentage, 2)}
              </h3>
              <p className="text-xs text-dark-400 mt-2 hidden sm:block">Return on investment</p>
            </div>
          </div>
        )}

        {/* Investments List */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white">All Investments</h2>
            {investments.length > 0 && (
              <div className="flex items-center space-x-2 text-xs text-dark-500">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Prices from master data instruments</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dark-400 text-sm">Loading investments and fetching prices...</p>
            </div>
          ) : investments.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 mb-4">No investments yet</p>
              <button onClick={() => handleOpenModal()} className="btn btn-primary">
                Add Your First Investment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {investments.map((inv) => {
                const gainLoss = inv.gain_loss || 0;
                const gainLossPercentage = inv.gain_loss_percentage || 0;
                const hasRealTimePrice = inv.real_time_price;
                const priceAge = getTimeSinceUpdate(inv.price_last_updated);
                const hasError = inv.price_fetch_error;
                
                return (
                  <div key={inv.id} className="p-3 sm:p-4 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors">
                    {/* Mobile Layout */}
                    <div className="block lg:hidden space-y-3">
                      {/* Header with Icon & Name */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm truncate">{inv.name}</h3>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {getPriceStatusBadge(inv)}
                              {hasRealTimePrice && (
                                <span className="text-xs px-2 py-0.5 rounded bg-dark-700 text-dark-400">
                                  {hasRealTimePrice.source}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-dark-400">
                              <span className="capitalize">
                                {inv.asset_type?.replace('_', ' ') || 'N/A'}
                              </span>
                              {inv.instrument_symbol && (
                                <>
                                  <span className="text-dark-600">•</span>
                                  <span className="font-mono">{inv.instrument_symbol}</span>
                                </>
                              )}
                              {inv.platform && (
                                <>
                                  <span className="text-dark-600">•</span>
                                  <span>{inv.platform}</span>
                                </>
                              )}
                            </div>
                            {priceAge !== 'Never' && (
                              <p className="text-xs text-dark-500 mt-1">
                                Updated {priceAge}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button
                            onClick={() => handleOpenModal(inv)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-dark-400 hover:text-primary-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Error Message */}
                      {hasError && (
                        <div className="p-2 bg-danger/10 border border-danger/30 rounded">
                          <p className="text-xs text-danger flex items-start space-x-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span className="break-words">{inv.price_fetch_error}</span>
                          </p>
                        </div>
                      )}
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-dark-900/50 p-2 rounded">
                          <p className="text-xs text-dark-400 mb-0.5">Quantity</p>
                          <p className="text-sm font-semibold text-white">
                            {parseFloat(inv.quantity).toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 8
                            })}
                          </p>
                        </div>
                        
                        <div className="bg-dark-900/50 p-2 rounded">
                          <p className="text-xs text-dark-400 mb-0.5">Purchase Price</p>
                          <p className="text-sm font-semibold text-white">{formatCurrency(inv.purchase_price)}</p>
                        </div>
                        
                        <div className="bg-dark-900/50 p-2 rounded">
                          <p className="text-xs text-dark-400 mb-0.5">Current Value</p>
                          <p className="text-sm font-semibold text-white">{formatCurrency(inv.current_value)}</p>
                          <p className="text-xs text-dark-500">
                            @ {formatCurrency(inv.current_price)}
                          </p>
                        </div>
                        
                        <div className="bg-dark-900/50 p-2 rounded">
                          <p className="text-xs text-dark-400 mb-0.5">Gain/Loss</p>
                          <p className={`text-sm font-semibold ${gainLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                            {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                          </p>
                          <p className={`text-xs ${gainLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                            {gainLoss >= 0 ? '+' : ''}{formatPercentage(gainLossPercentage, 2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop Layout */}
                    <div className="hidden lg:flex items-center justify-between">
                      {/* Left: Instrument Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-primary-400" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-white">{inv.name}</h3>
                              {getPriceStatusBadge(inv)}
                              {hasRealTimePrice && (
                                <span className="text-xs px-2 py-0.5 rounded bg-dark-700 text-dark-400">
                                  {hasRealTimePrice.source}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-sm text-dark-400 capitalize">
                                {inv.asset_type?.replace('_', ' ') || 'N/A'}
                              </p>
                              {inv.instrument_symbol && (
                                <>
                                  <span className="text-dark-600">•</span>
                                  <p className="text-sm text-dark-400 font-mono">
                                    {inv.instrument_symbol}
                                  </p>
                                </>
                              )}
                              {inv.platform && (
                                <>
                                  <span className="text-dark-600">•</span>
                                  <p className="text-sm text-dark-400">
                                    {inv.platform}
                                  </p>
                                </>
                              )}
                              {priceAge !== 'Never' && (
                                <>
                                  <span className="text-dark-600">•</span>
                                  <p className="text-xs text-dark-500">
                                    Updated {priceAge}
                                  </p>
                                </>
                              )}
                            </div>
                            
                            {hasError && (
                              <div className="mt-2 p-2 bg-danger/10 border border-danger/30 rounded">
                                <p className="text-xs text-danger flex items-center space-x-1">
                                  <AlertCircle className="w-3 h-3" />
                                  <span className="max-w-md truncate">{inv.price_fetch_error}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: Stats & Actions */}
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-dark-400">Quantity</p>
                          <p className="font-semibold text-white">
                            {parseFloat(inv.quantity).toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 8
                            })}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-dark-400">Purchase Price</p>
                          <p className="text-sm text-dark-300">{formatCurrency(inv.purchase_price)}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-dark-400">Current Value</p>
                          <p className="font-semibold text-white">{formatCurrency(inv.current_value)}</p>
                          <p className="text-xs text-dark-500">
                            @ {formatCurrency(inv.current_price)}
                          </p>
                        </div>
                        
                        <div className="text-right min-w-[120px]">
                          <p className="text-sm text-dark-400">Gain/Loss</p>
                          <p className={`font-semibold text-lg ${gainLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                            {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                          </p>
                          <p className={`text-xs ${gainLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                            {gainLoss >= 0 ? '+' : ''}{formatPercentage(gainLossPercentage, 2)}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenModal(inv)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-dark-400 hover:text-primary-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger" />
                          </button>
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
          title={editingInvestment ? 'Edit Investment' : 'Add New Investment'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Select Instrument *
              </label>
              <select
                value={formData.instrument_id}
                onChange={(e) => setFormData({ ...formData, instrument_id: e.target.value })}
                className="input w-full"
                required
              >
                <option value="">-- Select Instrument --</option>
                
                {instrumentsData.crypto && instrumentsData.crypto.length > 0 && (
                  <optgroup label="🪙 Cryptocurrency">
                    {instrumentsData.crypto.map((inst: any) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.symbol} - {inst.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                
                {instrumentsData.stocks_id && instrumentsData.stocks_id.length > 0 && (
                  <optgroup label="🇮🇩 Saham Indonesia">
                    {instrumentsData.stocks_id.map((inst: any) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.symbol} - {inst.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                
                {instrumentsData.stocks_us && instrumentsData.stocks_us.length > 0 && (
                  <optgroup label="🇺🇸 Saham Amerika">
                    {instrumentsData.stocks_us.map((inst: any) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.symbol} - {inst.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                
                {instrumentsData.commodities && instrumentsData.commodities.length > 0 && (
                  <optgroup label="🥇 Komoditas">
                    {instrumentsData.commodities.map((inst: any) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.symbol} - {inst.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                
                {instrumentsData.bonds && instrumentsData.bonds.length > 0 && (
                  <optgroup label="📜 Obligasi">
                    {instrumentsData.bonds.map((inst: any) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.symbol} - {inst.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              
              <div className="mt-2 p-3 bg-info/10 border border-info/30 rounded-lg">
                <p className="text-xs text-info flex items-center space-x-2">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Price akan diambil otomatis dari API berdasarkan konfigurasi di master data instrument.
                  </span>
                </p>
              </div>
              
              <p className="text-xs text-dark-400 mt-2">
                Belum ada instrumen yang diinginkan?{' '}
                <button 
                  type="button" 
                  onClick={() => window.open('/instruments', '_blank')} 
                  className="text-primary-400 hover:underline"
                >
                  Tambah instrumen baru
                </button>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-dark-500 mt-1">
                  Jumlah unit/lembar/koin
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Purchase Price *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                className="input w-full"
                placeholder="0.00"
                required
              />
              <p className="text-xs text-dark-500 mt-1">
                Harga per unit saat membeli (dalam IDR)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Platform (Optional)
              </label>
              <input
                type="text"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="input w-full"
                placeholder="e.g., Stockbit, Binance, IPOT, Ajaib"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Notes (Optional)
              </label>
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
                {editingInvestment ? 'Update Investment' : 'Add Investment'}
              </button>
              <button type="button" onClick={handleCloseModal} className="btn btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}