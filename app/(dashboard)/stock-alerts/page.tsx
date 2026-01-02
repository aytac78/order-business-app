'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  AlertTriangle, AlertCircle, Loader2, RefreshCw,
  Package, CheckCircle, Clock, TrendingDown, XCircle,
  Bell, BellOff, Eye, Trash2
} from 'lucide-react';

interface StockAlert {
  id: string;
  venue_id: string;
  stock_item_id: string;
  item_name: string;
  item_sku?: string;
  current_quantity: number;
  min_quantity: number;
  unit: string;
  type: 'low' | 'out' | 'expiring';
  is_read: boolean;
  created_at: string;
}

export default function StockAlertsPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('stockAlerts');
  const tStock = useTranslations('stock');
  const tCommon = useTranslations('common');

  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [showRead, setShowRead] = useState(false);

  // Alert type config
  const alertTypeConfig = {
    low: { label: tStock('lowStock'), color: 'bg-amber-500', icon: TrendingDown },
    out: { label: tStock('outOfStock'), color: 'bg-red-500', icon: XCircle },
    expiring: { label: t('expiringAlerts'), color: 'bg-orange-500', icon: Clock },
  };

  const loadAlerts = useCallback(async () => {
    if (!currentVenue?.id) return;

    // Get stock items that are low or out of stock
    const { data: stockItems } = await supabase
      .from('stock_items')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('is_active', true);

    if (stockItems) {
      const generatedAlerts: StockAlert[] = stockItems
        .filter(item => item.current_quantity <= item.min_quantity)
        .map(item => ({
          id: item.id,
          venue_id: item.venue_id,
          stock_item_id: item.id,
          item_name: item.name,
          item_sku: item.sku,
          current_quantity: item.current_quantity,
          min_quantity: item.min_quantity,
          unit: item.unit,
          type: item.current_quantity === 0 ? 'out' : 'low',
          is_read: false,
          created_at: item.updated_at || item.created_at
        }));

      setAlerts(generatedAlerts);
    }
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesRead = showRead || !alert.is_read;
    return matchesType && matchesRead;
  });

  // Stats
  const stats = {
    total: alerts.length,
    low: alerts.filter(a => a.type === 'low').length,
    out: alerts.filter(a => a.type === 'out').length,
    unread: alerts.filter(a => !a.is_read).length,
  };

  const handleMarkRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, is_read: true } : a
    ));
  };

  const handleMarkAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  };

  const handleDismiss = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
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
          <p className="text-gray-400">{stats.unread} {tCommon('items')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={loadAlerts}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
          {stats.unread > 0 && (
            <button type="button"
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {t('markRead')}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <Bell className="w-10 h-10 text-blue-400 bg-blue-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400">{tCommon('total')}</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-10 h-10 text-amber-400 bg-amber-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.low}</p>
              <p className="text-sm text-amber-400">{tStock('lowStock')}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-10 h-10 text-red-400 bg-red-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.out}</p>
              <p className="text-sm text-red-400">{tStock('outOfStock')}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <BellOff className="w-10 h-10 text-purple-400 bg-purple-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.unread}</p>
              <p className="text-sm text-purple-400">Okunmamış</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          {['all', 'low', 'out'].map(type => (
            <button type="button"
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl transition-colors ${
                filterType === type
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {type === 'all' ? tCommon('all') : alertTypeConfig[type as 'low' | 'out']?.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showRead}
            onChange={(e) => setShowRead(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          Okunanları göster
        </label>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-400">{t('noAlerts')}</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const typeConfig = alertTypeConfig[alert.type];
            const TypeIcon = typeConfig.icon;

            return (
              <div
                key={alert.id}
                className={`bg-gray-800 rounded-xl p-4 border transition-colors ${
                  alert.is_read 
                    ? 'border-gray-700 opacity-60' 
                    : 'border-amber-500/50 bg-amber-500/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 ${typeConfig.color} rounded-xl flex items-center justify-center`}>
                      <TypeIcon className="w-6 h-6 text-white" />
                    </div>

                    {/* Info */}
                    <div>
                      <p className="font-medium text-white">{alert.item_name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        {alert.item_sku && <span>SKU: {alert.item_sku}</span>}
                        <span className={alert.type === 'out' ? 'text-red-400' : 'text-amber-400'}>
                          {tStock('currentStock')}: {alert.current_quantity} {alert.unit}
                        </span>
                        <span>Min: {alert.min_quantity} {alert.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span className={`px-3 py-1 ${typeConfig.color} text-white text-sm rounded-full`}>
                      {typeConfig.label}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!alert.is_read && (
                        <button type="button"
                          onClick={() => handleMarkRead(alert.id)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                          title={t('markRead')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button type="button"
                        onClick={() => handleDismiss(alert.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                        title="Kapat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <a
                        href="/stock"
                        className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                        title={tStock('restock')}
                      >
                        <Package className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}