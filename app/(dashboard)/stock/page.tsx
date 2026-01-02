'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Plus, X, Edit2, Trash2, AlertCircle, Loader2, RefreshCw,
  Package, AlertTriangle, TrendingDown, TrendingUp, Search,
  Filter, BarChart3, History
} from 'lucide-react';

interface StockItem {
  id: string;
  venue_id: string;
  name: string;
  sku?: string;
  category: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  max_quantity?: number;
  cost_per_unit: number;
  supplier?: string;
  last_restocked?: string;
  is_active: boolean;
}

export default function StockPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('stock');
  const tCommon = useTranslations('common');

  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockingItem, setRestockingItem] = useState<StockItem | null>(null);

  const loadItems = useCallback(async () => {
    if (!currentVenue?.id) return;

    const { data } = await supabase
      .from('stock_items')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('is_active', true)
      .order('name');

    if (data) setItems(data);
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))];

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'low' && item.current_quantity <= item.min_quantity && item.current_quantity > 0) ||
      (filterStatus === 'out' && item.current_quantity === 0) ||
      (filterStatus === 'ok' && item.current_quantity > item.min_quantity);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Stats
  const stats = {
    total: items.length,
    lowStock: items.filter(i => i.current_quantity <= i.min_quantity && i.current_quantity > 0).length,
    outOfStock: items.filter(i => i.current_quantity === 0).length,
    totalValue: items.reduce((sum, i) => sum + (i.current_quantity * i.cost_per_unit), 0),
  };

  const getStockStatus = (item: StockItem) => {
    if (item.current_quantity === 0) return { label: t('outOfStock'), color: 'bg-red-500', textColor: 'text-red-400' };
    if (item.current_quantity <= item.min_quantity) return { label: t('lowStock'), color: 'bg-amber-500', textColor: 'text-amber-400' };
    return { label: t('inStock'), color: 'bg-green-500', textColor: 'text-green-400' };
  };

  const handleSaveItem = async (data: Partial<StockItem>) => {
    if (!currentVenue?.id) return;

    if (editingItem) {
      await supabase.from('stock_items').update(data).eq('id', editingItem.id);
    } else {
      await supabase.from('stock_items').insert({
        ...data,
        venue_id: currentVenue.id,
        is_active: true
      });
    }

    setShowModal(false);
    setEditingItem(null);
    loadItems();
  };

  const handleRestock = async (itemId: string, quantity: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    await supabase.from('stock_items').update({
      current_quantity: item.current_quantity + quantity,
      last_restocked: new Date().toISOString()
    }).eq('id', itemId);

    setShowRestockModal(false);
    setRestockingItem(null);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tCommon('confirmDelete'))) return;
    await supabase.from('stock_items').update({ is_active: false }).eq('id', id);
    loadItems();
  };

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">{tCommon('selectVenue')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400">{items.length} {tCommon('items')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={loadItems}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
          <button type="button"
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addItem')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="w-10 h-10 text-blue-400 bg-blue-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400">{tCommon('total')} {tCommon('items')}</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-10 h-10 text-amber-400 bg-amber-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.lowStock}</p>
              <p className="text-sm text-amber-400">{t('lowStock')}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-10 h-10 text-red-400 bg-red-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.outOfStock}</p>
              <p className="text-sm text-red-400">{t('outOfStock')}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-green-400 bg-green-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">₺{stats.totalValue.toLocaleString()}</p>
              <p className="text-sm text-green-400">{tCommon('total')} {tCommon('amount')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${tCommon('search')}...`}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white"
        >
          <option value="all">{tCommon('all')} {t('category')}</option>
          {categories.filter(c => c !== 'all').map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white"
        >
          <option value="all">{tCommon('all')} {tCommon('status')}</option>
          <option value="ok">{t('inStock')}</option>
          <option value="low">{t('lowStock')}</option>
          <option value="out">{t('outOfStock')}</option>
        </select>
      </div>

      {/* Items Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700/50 text-left">
                <th className="px-4 py-3 text-sm font-medium text-gray-400">{t('itemName')}</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-400">{t('category')}</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-400">{t('currentStock')}</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-400">{t('minStock')}</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-400">{t('costPerUnit')}</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-400">{tCommon('status')}</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-400">{tCommon('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{tCommon('noData')}</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-white">{item.name}</p>
                          {item.sku && <p className="text-xs text-gray-500">{t('sku')}: {item.sku}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{item.category}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${status.textColor}`}>
                          {item.current_quantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{item.min_quantity} {item.unit}</td>
                      <td className="px-4 py-3 text-gray-400">₺{item.cost_per_unit.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 ${status.color} text-white text-xs rounded-full`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button type="button"
                            onClick={() => { setRestockingItem(item); setShowRestockModal(true); }}
                            className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg"
                            title={t('restock')}
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button type="button"
                            onClick={() => { setEditingItem(item); setShowModal(true); }}
                            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <StockItemModal
          item={editingItem}
          categories={categories.filter(c => c !== 'all')}
          t={t}
          tCommon={tCommon}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          onSave={handleSaveItem}
        />
      )}

      {/* Restock Modal */}
      {showRestockModal && restockingItem && (
        <RestockModal
          item={restockingItem}
          t={t}
          tCommon={tCommon}
          onClose={() => { setShowRestockModal(false); setRestockingItem(null); }}
          onRestock={(qty) => handleRestock(restockingItem.id, qty)}
        />
      )}
    </div>
  );
}

// Stock Item Modal
function StockItemModal({
  item, categories, t, tCommon, onClose, onSave
}: {
  item: StockItem | null;
  categories: string[];
  t: any;
  tCommon: any;
  onClose: () => void;
  onSave: (data: Partial<StockItem>) => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [sku, setSku] = useState(item?.sku || '');
  const [category, setCategory] = useState(item?.category || categories[0] || '');
  const [newCategory, setNewCategory] = useState('');
  const [unit, setUnit] = useState(item?.unit || 'adet');
  const [currentQuantity, setCurrentQuantity] = useState(item?.current_quantity?.toString() || '0');
  const [minQuantity, setMinQuantity] = useState(item?.min_quantity?.toString() || '10');
  const [costPerUnit, setCostPerUnit] = useState(item?.cost_per_unit?.toString() || '0');
  const [supplier, setSupplier] = useState(item?.supplier || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      sku: sku || undefined,
      category: newCategory || category,
      unit,
      current_quantity: parseFloat(currentQuantity),
      min_quantity: parseFloat(minQuantity),
      cost_per_unit: parseFloat(costPerUnit),
      supplier: supplier || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <h2 className="text-xl font-bold text-white">
            {item ? t('editItem') : t('addItem')}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('itemName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('sku')}</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('unit')}</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              >
                <option value="adet">Adet</option>
                <option value="kg">Kilogram</option>
                <option value="lt">Litre</option>
                <option value="paket">Paket</option>
                <option value="kutu">Kutu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('category')}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="">{tCommon('newSection')}</option>
              </select>
              {category === '' && (
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={tCommon('enterSectionName')}
                  className="w-full mt-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('supplier')}</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('currentStock')}</label>
              <input
                type="number"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('minStock')}</label>
              <input
                type="number"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('costPerUnit')} (₺)</label>
              <input
                type="number"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button"
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
            >
              {tCommon('cancel')}
            </button>
            <button type="button"
              type="submit"
              className="flex-1 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
            >
              {tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Restock Modal
function RestockModal({
  item, t, tCommon, onClose, onRestock
}: {
  item: StockItem;
  t: any;
  tCommon: any;
  onClose: () => void;
  onRestock: (quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (qty > 0) onRestock(qty);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-sm">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{t('restock')}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-gray-400">{item.name}</p>
            <p className="text-sm text-gray-500">{t('currentStock')}: {item.current_quantity} {item.unit}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{tCommon('quantity')} ({item.unit})</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0.01"
              step="0.01"
              placeholder="0"
              className="w-full text-2xl text-center px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          {quantity && parseFloat(quantity) > 0 && (
            <div className="text-center p-3 bg-green-900/30 border border-green-700 rounded-xl">
              <p className="text-green-400">{t('currentStock')}: {(item.current_quantity + parseFloat(quantity)).toFixed(2)} {item.unit}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button type="button"
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
            >
              {tCommon('cancel')}
            </button>
            <button type="button"
              type="submit"
              className="flex-1 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600"
            >
              {t('restock')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}