'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import {
  QrCode, Download, Copy, CheckCircle, AlertCircle, Loader2,
  RefreshCw, Smartphone, Link2, ExternalLink, Printer, Settings
} from 'lucide-react';

interface Table {
  id: string;
  number: string;
  section: string;
}

export default function QRMenuPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('qrMenu');
  const tTables = useTranslations('tables');
  const tCommon = useTranslations('common');

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    if (!currentVenue?.id) return;

    const { data } = await supabase
      .from('tables')
      .select('id, number, section')
      .eq('venue_id', currentVenue.id)
      .eq('is_active', true)
      .order('section')
      .order('number');

    if (data) setTables(data);
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const getMenuUrl = (tableId?: string) => {
    const baseUrl = `https://order.tit.app/venue/${currentVenue?.id}/menu`;
    const table = tables.find(t => t.id === tableId);
    return tableId && table ? `${baseUrl}?table=${table.number}` : baseUrl;
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleDownloadQR = (tableId?: string, tableName?: string) => {
    // QR code download logic - would integrate with QR library
    const link = getMenuUrl(tableId);
    const filename = tableName ? `qr-masa-${tableName}.png` : 'qr-menu.png';
    
    // Create a simple QR placeholder download
    alert(`QR kodu indirilecek: ${filename}\nLink: ${link}`);
  };

  const handlePrintAll = () => {
    alert('Tüm QR kodları yazdırılacak');
  };

  // Group tables by section
  const tablesBySection = tables.reduce((acc, table) => {
    if (!acc[table.section]) acc[table.section] = [];
    acc[table.section].push(table);
    return acc;
  }, {} as Record<string, Table[]>);

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
            onClick={loadTables}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
          <button type="button"
            onClick={handlePrintAll}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            Tümünü Yazdır
          </button>
        </div>
      </div>

      {/* Main QR Code */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* QR Preview */}
          <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <QRCodeSVG value={getMenuUrl()} size={128} level="H" />
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">Ana Menü QR Kodu</h2>
            <p className="text-orange-100 mb-4">
              Bu QR kod ile müşteriler doğrudan menünüze erişebilir
            </p>
            
            {/* Link */}
            <div className="flex items-center gap-2 bg-white/20 rounded-xl p-3 mb-4">
              <Link2 className="w-5 h-5 text-white" />
              <span className="flex-1 text-white font-mono text-sm truncate">
                {getMenuUrl()}
              </span>
              <button type="button"
                onClick={() => handleCopyLink(getMenuUrl())}
                className={`p-2 rounded-lg transition-colors ${
                  copiedLink === getMenuUrl() 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {copiedLink === getMenuUrl() ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={getMenuUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button type="button"
                onClick={() => handleDownloadQR()}
                className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-xl font-medium hover:bg-orange-50"
              >
                <Download className="w-4 h-4" />
                {t('downloadQR')}
              </button>
              <button type="button" className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30">
                <Settings className="w-4 h-4" />
                QR Ayarları
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table QR Codes */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">{t('tableQR')}</h2>
          <p className="text-sm text-gray-400">{tables.length} masa</p>
        </div>

        {tables.length === 0 ? (
          <div className="text-center py-8">
            <QrCode className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{tTables('noTables')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(tablesBySection).map(([section, sectionTables]) => (
              <div key={section}>
                <h3 className="text-sm font-medium text-gray-400 mb-3">{section}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {sectionTables.map(table => (
                    <div
                      key={table.id}
                      className={`bg-gray-700 rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-gray-600 ${
                        selectedTable === table.id ? 'ring-2 ring-orange-500' : ''
                      }`}
                      onClick={() => setSelectedTable(selectedTable === table.id ? null : table.id)}
                    >
                      {/* Mini QR */}
                      <div className="w-16 h-16 bg-white rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <QrCode className="w-12 h-12 text-gray-800" />
                      </div>
                      
                      <p className="font-medium text-white mb-2">Masa {table.number}</p>
                      
                      {/* Actions */}
                      <div className="flex gap-1 justify-center">
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); handleCopyLink(getMenuUrl(table.id)); }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            copiedLink === getMenuUrl(table.id)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                        >
                          {copiedLink === getMenuUrl(table.id) ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); handleDownloadQR(table.id, table.number); }}
                          className="p-1.5 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Müşteri Görünümü</h2>
        <div className="flex items-center gap-6">
          <div className="w-64 h-[500px] bg-gray-900 rounded-3xl border-4 border-gray-700 overflow-hidden relative">
            {/* Phone mockup */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-700 rounded-b-xl" />
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Smartphone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Menü Önizleme</p>
                <a
                  href={getMenuUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Görüntüle
                </a>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-white font-medium mb-2">{t('scanToOrder')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              Müşteriler QR kodu telefonları ile taradığında menünüze yönlendirilir ve sipariş verebilirler.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Anlık menü güncellemeleri
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Masaya özel sipariş takibi
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Temassız sipariş deneyimi
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Çoklu dil desteği
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}