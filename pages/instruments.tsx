// pages/instruments.tsx

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { Plus, Search, Edit2, Trash2, TrendingUp, Info, AlertCircle, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// Price sources - NO MANUAL
const PRICE_SOURCES = [
  { 
    value: 'coingecko', 
    label: 'CoinGecko', 
    description: 'Free API for cryptocurrency prices',
    supports: ['crypto'],
    example: 'bitcoin, ethereum, binancecoin'
  },
  { 
    value: 'yahoo_finance', 
    label: 'Yahoo Finance', 
    description: 'Free API for stocks, ETFs, and commodities',
    supports: ['stocks_id', 'stocks_us', 'commodities', 'bonds'],
    example: 'AAPL, BBCA.JK, GC=F'
  },
  { 
    value: 'alpha_vantage', 
    label: 'Alpha Vantage', 
    description: 'Free tier: 25 requests/day (requires API key)',
    supports: ['stocks_us'],
    example: 'AAPL, MSFT, IBM'
  },
  { 
    value: 'finnhub', 
    label: 'Finnhub', 
    description: 'Free tier: 60 requests/minute (requires API key)',
    supports: ['stocks_us'],
    example: 'AAPL, TSLA, NVDA'
  },
];

export default function Instruments() {
  const [instruments, setInstruments] = useState<any>({ all: [] });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<any>(null);
  const [filter, setFilter] = useState({
    asset_type: '',
    search: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    asset_type: 'stocks_id',
    market: 'IDX',
    currency: 'IDR',
    country: 'Indonesia',
    description: '',
    logo_url: '',
    price_source: 'yahoo_finance',
    price_mapping: '',
    is_active: true,
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [checkingPrice, setCheckingPrice] = useState(false);
  const [priceCheckResult, setPriceCheckResult] = useState<any>(null);

  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.asset_type) params.append('asset_type', filter.asset_type);
      if (filter.search) params.append('search', filter.search);

      const data = await apiGet(`/api/instruments?${params.toString()}`);
      setInstruments(data);
    } catch (error) {
      console.error('Error fetching instruments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPrice = async () => {
    if (!formData.price_source || !formData.price_mapping) {
      setValidationError('Please fill in both Price Source and API Mapping first');
      return;
    }

    setCheckingPrice(true);
    setPriceCheckResult(null);
    setValidationError(null);

    try {
      console.log('🔍 Testing price configuration...');
      const response = await apiPost('/api/instruments/check-price', {
        price_source: formData.price_source,
        price_mapping: formData.price_mapping,
        asset_type: formData.asset_type,
      });

      console.log('📦 API Response:', response);

      if (response.success) {
        setPriceCheckResult({
          success: true,
          data: response.data,
        });
        console.log('✅ Price check successful:', response.data);
      } else {
        // API return success: false
        console.log('⚠️ Error details:', response.details);
        setPriceCheckResult({
          success: false,
          error: response.error || response.message || 'Failed to fetch price',
          suggestion: response.suggestion || '',
          details: response.details || {},
        });
        setValidationError(response.message || 'Failed to fetch price. Please check your configuration.');
      }
    } catch (error: any) {
      console.error('❌ Price check failed:', error);
      
      // Parse error dari axios/fetch
      const errorData = error.response?.data || error;
      console.log('🔍 Error data:', errorData);
      
      setPriceCheckResult({
        success: false,
        error: errorData.error || errorData.message || error.message || 'Failed to fetch price',
        suggestion: errorData.suggestion || '',
        details: errorData.details || {},
      });
      setValidationError(errorData.message || error.message || 'Failed to fetch price. Please check your configuration.');
    } finally {
      setCheckingPrice(false);
    }
  };

  const handleOpenModal = (instrument?: any) => {
    setValidationError(null);
    setPriceCheckResult(null);
    
    if (instrument) {
      setEditingInstrument(instrument);
      setFormData({
        name: instrument.name,
        symbol: instrument.symbol,
        asset_type: instrument.asset_type,
        market: instrument.market || '',
        currency: instrument.currency,
        country: instrument.country || '',
        description: instrument.description || '',
        logo_url: instrument.logo_url || '',
        price_source: instrument.price_source || getRecommendedSource(instrument.asset_type),
        price_mapping: instrument.price_mapping || '',
        is_active: instrument.is_active,
      });
    } else {
      setEditingInstrument(null);
      setFormData({
        name: '',
        symbol: '',
        asset_type: 'stocks_id',
        market: 'IDX',
        currency: 'IDR',
        country: 'Indonesia',
        description: '',
        logo_url: '',
        price_source: 'yahoo_finance',
        price_mapping: '',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInstrument(null);
    setValidationError(null);
    setPriceCheckResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Client-side validation
    if (!validateSourceForAssetType(formData.price_source, formData.asset_type)) {
      setValidationError(
        `Price source '${formData.price_source}' does not support '${assetTypeLabels[formData.asset_type]}'. ` +
        `Please use ${getRecommendedSource(formData.asset_type)}.`
      );
      return;
    }

    if (!formData.price_mapping) {
      setValidationError('Price mapping is required for API-based price fetching.');
      return;
    }

    try {
      if (editingInstrument) {
        await apiPut(`/api/instruments?id=${editingInstrument.id}`, formData);
      } else {
        await apiPost('/api/instruments', formData);
      }
      await fetchInstruments();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving instrument:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error saving instrument';
      setValidationError(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this instrument? This action cannot be undone.')) return;
    
    try {
      await apiDelete(`/api/instruments?id=${id}`);
      await fetchInstruments();
    } catch (error: any) {
      console.error('Error deleting instrument:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error deleting instrument';
      alert(errorMessage);
    }
  };

  const filteredInstruments = instruments.all.filter((inst: any) => {
    if (filter.asset_type && inst.asset_type !== filter.asset_type) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        inst.name.toLowerCase().includes(searchLower) ||
        inst.symbol.toLowerCase().includes(searchLower) ||
        (inst.price_mapping && inst.price_mapping.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  // Asset types
  const assetTypeLabels: Record<string, string> = {
    stocks_id: 'Saham Indonesia',
    stocks_us: 'Saham Amerika',
    crypto: 'Cryptocurrency',
    commodities: 'Komoditas',
    bonds: 'Obligasi',
  };

  const assetTypeColors: Record<string, string> = {
    stocks_id: 'primary',
    stocks_us: 'info',
    crypto: 'warning',
    commodities: 'orange',
    bonds: 'purple',
  };

  // Helper functions
  const getRecommendedSource = (assetType: string): string => {
    switch (assetType) {
      case 'crypto':
        return 'coingecko';
      case 'stocks_id':
      case 'stocks_us':
      case 'commodities':
      case 'bonds':
        return 'yahoo_finance';
      default:
        return 'yahoo_finance';
    }
  };

  const validateSourceForAssetType = (source: string, assetType: string): boolean => {
    const priceSource = PRICE_SOURCES.find(s => s.value === source);
    if (!priceSource) return false;
    return priceSource.supports.includes(assetType);
  };

  const getAvailableSources = (assetType: string) => {
    return PRICE_SOURCES.filter(source => source.supports.includes(assetType));
  };

  const getMarketOptions = (assetType: string) => {
    switch (assetType) {
      case 'stocks_id':
        return ['IDX'];
      case 'stocks_us':
        return ['NASDAQ', 'NYSE', 'AMEX'];
      case 'crypto':
        return ['Crypto'];
      case 'commodities':
        return ['Commodity'];
      case 'bonds':
        return ['Government', 'Corporate'];
      default:
        return ['Other'];
    }
  };

  const getCurrencyOptions = (assetType: string) => {
    switch (assetType) {
      case 'stocks_id':
        return ['IDR'];
      case 'stocks_us':
      case 'crypto':
      case 'commodities':
      case 'bonds':
        return ['USD'];
      default:
        return ['IDR', 'USD'];
    }
  };

  const getCountryDefault = (assetType: string) => {
    switch (assetType) {
      case 'stocks_id':
        return 'Indonesia';
      case 'stocks_us':
        return 'United States';
      default:
        return '';
    }
  };

  const getMappingPlaceholder = () => {
    const source = PRICE_SOURCES.find(s => s.value === formData.price_source);
    if (!source) return '';

    switch (formData.asset_type) {
      case 'stocks_id':
        return 'e.g., BBCA.JK, BMRI.JK (add .JK suffix)';
      case 'stocks_us':
        return 'e.g., AAPL, MSFT, GOOGL';
      case 'crypto':
        return 'e.g., bitcoin, ethereum, binancecoin';
      case 'commodities':
        return 'e.g., GC=F (Gold), SI=F (Silver), CL=F (Oil)';
      case 'bonds':
        return 'e.g., Use bond ETF tickers';
      default:
        return source.example;
    }
  };

  const getMappingHint = () => {
    switch (formData.asset_type) {
      case 'stocks_id':
        return 'For Indonesian stocks, add .JK suffix (e.g., BBCA.JK)';
      case 'crypto':
        return 'Use lowercase CoinGecko IDs. Check: coingecko.com/api';
      case 'commodities':
        return 'Use Yahoo Finance futures tickers with =F suffix';
      default:
        return 'Use the ticker/symbol from the API provider';
    }
  };

  const handleAssetTypeChange = (newAssetType: string) => {
    const recommendedSource = getRecommendedSource(newAssetType);
    const markets = getMarketOptions(newAssetType);
    const currencies = getCurrencyOptions(newAssetType);
    const country = getCountryDefault(newAssetType);

    setFormData({
      ...formData,
      asset_type: newAssetType,
      market: markets[0] || '',
      currency: currencies[0] || 'IDR',
      country: country,
      price_source: recommendedSource,
      price_mapping: '',
    });
    setValidationError(null);
    setPriceCheckResult(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Master Data Instrumen</h1>
            <p className="text-dark-400 mt-1">Kelola master data dengan harga real-time dari API</p>
          </div>
          <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Tambah Instrumen</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="card bg-info/10 border-info/30">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-1">All instruments require API integration</h3>
              <p className="text-xs text-dark-300 leading-relaxed">
                Every instrument must have a valid price source (CoinGecko, Yahoo Finance, etc.) and mapping configured. 
                Manual price updates are not supported. Prices will be fetched automatically.
              </p>
              <a 
                href="https://github.com/yourusername/docs/supported-instruments" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-info hover:text-info-400 mt-2"
              >
                <span>View supported instruments guide</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(assetTypeLabels).map(([key, label]) => {
            const count = instruments[key]?.length || 0;
            const color = assetTypeColors[key];
            return (
              <div key={key} className={`card bg-${color}/10 border-${color}/30 hover:bg-${color}/20 transition-colors cursor-pointer`}
                   onClick={() => setFilter({ ...filter, asset_type: key })}>
                <p className="text-xs text-dark-400 mb-1">{label}</p>
                <p className={`text-2xl font-bold text-${color}`}>{count}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-400 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  placeholder="Search name, symbol, or mapping..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-2">Asset Type</label>
              <select
                value={filter.asset_type}
                onChange={(e) => setFilter({ ...filter, asset_type: e.target.value })}
                className="input w-full"
              >
                <option value="">Semua ({instruments.all.length})</option>
                {Object.entries(assetTypeLabels).map(([key, label]) => {
                  const count = instruments[key]?.length || 0;
                  return (
                    <option key={key} value={key}>{label} ({count})</option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Instruments List */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              {filter.asset_type ? assetTypeLabels[filter.asset_type] : 'All Instruments'} ({filteredInstruments.length})
            </h2>
            {filter.asset_type && (
              <button 
                onClick={() => setFilter({ ...filter, asset_type: '' })}
                className="text-xs text-primary-400 hover:text-primary-300"
              >
                Clear filter
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dark-400">Loading instruments...</p>
            </div>
          ) : filteredInstruments.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 mb-4">No instruments found</p>
              <button onClick={() => handleOpenModal()} className="btn btn-primary">
                Add First Instrument
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Symbol</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Market</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Price Source</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">API Mapping</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Last Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstruments.map((inst: any) => (
                    <tr key={inst.id} className="border-b border-dark-800 hover:bg-dark-800 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg bg-${assetTypeColors[inst.asset_type]}/20 flex items-center justify-center`}>
                            <TrendingUp className={`w-5 h-5 text-${assetTypeColors[inst.asset_type]}`} />
                          </div>
                          <div>
                            <p className="font-medium text-white">{inst.name}</p>
                            {inst.country && (
                              <p className="text-xs text-dark-400">{inst.country}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-white">{inst.symbol}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded font-medium bg-${assetTypeColors[inst.asset_type]}/20 text-${assetTypeColors[inst.asset_type]}`}>
                          {assetTypeLabels[inst.asset_type]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-dark-300 text-sm">{inst.market || '-'}</td>
                      <td className="py-3 px-4">
                        {inst.price_source ? (
                          <span className="text-xs px-2 py-1 rounded bg-dark-700 text-dark-300 capitalize">
                            {inst.price_source.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-xs text-danger">Not configured</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {inst.price_mapping ? (
                          <span className="text-xs text-dark-300 font-mono bg-dark-800 px-2 py-1 rounded">
                            {inst.price_mapping}
                          </span>
                        ) : (
                          <span className="text-xs text-danger">Missing</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {inst.last_price_idr ? (
                          <div>
                            <p className="text-sm font-medium text-white">
                              Rp {parseFloat(inst.last_price_idr).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                            {inst.last_updated && (
                              <p className="text-xs text-dark-500">
                                {new Date(inst.last_updated).toLocaleDateString('id-ID')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-dark-500">No price yet</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col space-y-1">
                          <span className={`text-xs px-2 py-1 rounded font-medium inline-block ${
                            inst.is_active ? 'bg-success/20 text-success' : 'bg-dark-700 text-dark-400'
                          }`}>
                            {inst.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {inst.price_fetch_error && (
                            <span className="text-xs px-2 py-1 rounded bg-danger/20 text-danger inline-block" title={inst.price_fetch_error}>
                              Error
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenModal(inst)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-dark-400 hover:text-primary-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(inst.id)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger" />
                          </button>
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
          title={editingInstrument ? 'Edit Instrument' : 'Add New Instrument'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Validation Error */}
            {validationError && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{validationError}</p>
              </div>
            )}

            {/* Price Check Result */}
            {priceCheckResult && (
              <div className={`p-3 border rounded-lg flex items-start space-x-2 ${
                priceCheckResult.success
                  ? 'bg-success/10 border-success/30'
                  : 'bg-danger/10 border-danger/30'
              }`}>
                {priceCheckResult.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-success mb-1">✅ Price Fetch Successful!</p>
                      <div className="text-xs text-dark-300 space-y-1">
                        <p><strong>Price:</strong> {priceCheckResult.data.displayPrice}</p>
                        <p><strong>IDR:</strong> {priceCheckResult.data.displayPriceIDR}</p>
                        <p><strong>Source:</strong> {priceCheckResult.data.source}</p>
                        <p className="text-dark-500">
                          This configuration is valid. You can now save the instrument.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-danger mb-1">❌ Price Check Failed</p>
                      <p className="text-xs text-dark-300 mb-2">{priceCheckResult.error}</p>
                      {priceCheckResult.suggestion && (
                        <p className="text-xs text-warning mb-2">💡 {priceCheckResult.suggestion}</p>
                      )}
                      {/* Show documentation link from API response */}
                      {priceCheckResult.details?.docLink && (
                        <div className="mt-2 pt-2 border-t border-danger/20">
                          <p className="text-xs text-dark-400 mb-2">📚 Find correct mapping:</p>
                          <a
                            href={priceCheckResult.details.docLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-xs text-primary-400 hover:text-primary-300 bg-dark-800 px-3 py-1.5 rounded transition-colors"
                          >
                            <span>View Documentation & Examples</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Instrument Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="e.g., PT Bank Central Asia Tbk"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Symbol/Ticker *
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  className="input w-full"
                  placeholder="e.g., BBCA"
                  required
                />
                <p className="text-xs text-dark-500 mt-1">
                  Display symbol (not necessarily API mapping)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Asset Type *
                </label>
                <select
                  value={formData.asset_type}
                  onChange={(e) => handleAssetTypeChange(e.target.value)}
                  className="input w-full"
                  required
                >
                  {Object.entries(assetTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">Market</label>
                <select
                  value={formData.market}
                  onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                  className="input w-full"
                >
                  {getMarketOptions(formData.asset_type).map((market) => (
                    <option key={market} value={market}>{market}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="input w-full"
                >
                  {getCurrencyOptions(formData.asset_type).map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Indonesia"
                />
              </div>
            </div>

            {/* Price Source Configuration */}
            <div className="border-t border-dark-700 pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <h3 className="text-sm font-semibold text-white">API Price Configuration</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-2">
                    Price Source * <span className="text-xs text-dark-500">(Auto-selected based on asset type)</span>
                  </label>
                  <select
                    value={formData.price_source}
                    onChange={(e) => {
                      setFormData({ ...formData, price_source: e.target.value, price_mapping: '' });
                      setValidationError(null);
                      setPriceCheckResult(null);
                    }}
                    className="input w-full"
                    required
                  >
                    {getAvailableSources(formData.asset_type).map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-dark-500 mt-1">
                    {PRICE_SOURCES.find(s => s.value === formData.price_source)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-2">
                    API Mapping (Ticker/ID) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={formData.price_mapping}
                      onChange={(e) => {
                        setFormData({ ...formData, price_mapping: e.target.value });
                        setPriceCheckResult(null);
                      }}
                      className="input w-full font-mono"
                      placeholder={getMappingPlaceholder()}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleCheckPrice}
                      disabled={checkingPrice || !formData.price_mapping}
                      className="btn btn-secondary whitespace-nowrap flex items-center space-x-2"
                      title="Test price configuration"
                    >
                      <RefreshCw className={`w-4 h-4 ${checkingPrice ? 'animate-spin' : ''}`} />
                      <span>{checkingPrice ? 'Checking...' : 'Check Price'}</span>
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-info flex items-start space-x-1">
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{getMappingHint()}</span>
                    </p>
                    <p className="text-xs text-dark-500">
                      Example: {PRICE_SOURCES.find(s => s.value === formData.price_source)?.example}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full"
                rows={3}
                placeholder="Additional information about this instrument..."
              />
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
                Active (will be included in price updates)
              </label>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-dark-700">
              <button type="submit" className="btn btn-primary flex-1">
                {editingInstrument ? 'Update Instrument' : 'Add Instrument'}
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