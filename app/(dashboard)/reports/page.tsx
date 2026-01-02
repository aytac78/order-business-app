'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  FileText, Download, AlertCircle, Loader2, RefreshCw,
  Calendar, DollarSign, ShoppingCart, Users, TrendingUp,
  ChevronLeft, ChevronRight, Printer
} from 'lucide-react';

interface DailyReport {
  date: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  avg_order_value: number;
  unique_customers: number;
}

export default function ReportsPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');

  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reports, setReports] = useState<DailyReport[]>([]);

  const loadReports = useCallback(async () => {
    if (!currentVenue?.id) return;

    let startDate: string;
    let endDate = new Date().toISOString();

    if (reportType === 'daily') {
      startDate = new Date(Date.now() - 30 * 86400000).toISOString();
    } else if (reportType === 'weekly') {
      startDate = new Date(Date.now() - 12 * 7 * 86400000).toISOString();
    } else {
      startDate = new Date(Date.now() - 365 * 86400000).toISOString();
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (orders) {
      // Group by date
      const groupedByDate: Record<string, DailyReport> = {};
      
      orders.forEach(order => {
        let dateKey: string;
        const orderDate = new Date(order.created_at);
        
        if (reportType === 'daily') {
          dateKey = orderDate.toISOString().split('T')[0];
        } else if (reportType === 'weekly') {
          const weekStart = new Date(orderDate);
          weekStart.setDate(orderDate.getDate() - orderDate.getDay());
          dateKey = weekStart.toISOString().split('T')[0];
        } else {
          dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = {
            date: dateKey,
            total_orders: 0,
            completed_orders: 0,
            cancelled_orders: 0,
            total_revenue: 0,
            avg_order_value: 0,
            unique_customers: 0
          };
        }

        groupedByDate[dateKey].total_orders++;
        if (order.status === 'completed') {
          groupedByDate[dateKey].completed_orders++;
          groupedByDate[dateKey].total_revenue += order.total || 0;
        }
        if (order.status === 'cancelled') {
          groupedByDate[dateKey].cancelled_orders++;
        }
      });

      // Calculate averages
      Object.values(groupedByDate).forEach(report => {
        if (report.completed_orders > 0) {
          report.avg_order_value = report.total_revenue / report.completed_orders;
        }
      });

      const sortedReports = Object.values(groupedByDate).sort((a, b) => 
        b.date.localeCompare(a.date)
      );

      setReports(sortedReports);
    }

    setLoading(false);
  }, [currentVenue?.id, reportType]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const headers = ['Tarih', 'Toplam Sipariş', 'Tamamlanan', 'İptal', 'Gelir', 'Ort. Sipariş'];
      const rows = reports.map(r => [
        r.date,
        r.total_orders,
        r.completed_orders,
        r.cancelled_orders,
        r.total_revenue,
        r.avg_order_value.toFixed(2)
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapor-${reportType}-${selectedDate}.csv`;
      a.click();
    } else {
      alert('PDF export yakında eklenecek');
    }
  };

  // Summary stats
  const totalRevenue = reports.reduce((sum, r) => sum + r.total_revenue, 0);
  const totalOrders = reports.reduce((sum, r) => sum + r.total_orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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
          <p className="text-gray-400">{currentVenue.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={loadReports}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
          <button type="button"
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex items-center gap-4">
        <div className="flex bg-gray-800 rounded-xl p-1">
          {(['daily', 'weekly', 'monthly'] as const).map(type => (
            <button type="button"
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                reportType === type ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {type === 'daily' ? t('dailyReport') : type === 'weekly' ? t('weeklyReport') : t('monthlyReport')}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-10 h-10 text-green-400 bg-green-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">₺{totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-400">Toplam Gelir</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-10 h-10 text-blue-400 bg-blue-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{totalOrders}</p>
              <p className="text-sm text-blue-400">Toplam Sipariş</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-purple-400 bg-purple-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">₺{avgOrderValue.toFixed(0)}</p>
              <p className="text-sm text-purple-400">Ort. Sipariş</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-10 h-10 text-orange-400 bg-orange-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{reports.length}</p>
              <p className="text-sm text-orange-400">Rapor Sayısı</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700/50">
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Tarih</th>
                <th className="text-center py-4 px-6 text-sm font-medium text-gray-400">Toplam</th>
                <th className="text-center py-4 px-6 text-sm font-medium text-gray-400">Tamamlanan</th>
                <th className="text-center py-4 px-6 text-sm font-medium text-gray-400">İptal</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-gray-400">Gelir</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-gray-400">Ort. Sipariş</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    Rapor verisi bulunamadı
                  </td>
                </tr>
              ) : (
                reports.map((report, index) => (
                  <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-medium text-white">
                        {reportType === 'monthly' 
                          ? new Date(report.date + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
                          : new Date(report.date).toLocaleDateString('tr-TR', { 
                              day: 'numeric', 
                              month: 'short',
                              ...(reportType === 'weekly' && { weekday: 'short' })
                            })
                        }
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-white">{report.total_orders}</td>
                    <td className="py-4 px-6 text-center text-green-400">{report.completed_orders}</td>
                    <td className="py-4 px-6 text-center text-red-400">{report.cancelled_orders}</td>
                    <td className="py-4 px-6 text-right font-medium text-white">₺{report.total_revenue.toLocaleString()}</td>
                    <td className="py-4 px-6 text-right text-gray-400">₺{report.avg_order_value.toFixed(0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}