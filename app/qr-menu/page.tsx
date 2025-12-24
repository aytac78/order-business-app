'use client';

import { useState, useEffect } from 'react';
import { useVenueStore, useTableStore } from '@/stores';
import { QrCode, Download, Printer, RefreshCw, Eye, Copy, Check, AlertCircle, ExternalLink, Grid3X3 } from 'lucide-react';

export default function QRMenuPage() {
  const { currentVenue } = useVenueStore();
  const { tables } = useTableStore();
  const [mounted, setMounted] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrStyle, setQrStyle] = useState<'simple' | 'branded'>('branded');

  useEffect(() => { setMounted(true); }, []);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://order.app';
  const menuUrl = currentVenue ? `${baseUrl}/menu/${currentVenue.slug}` : '';
  const tableUrl = selectedTable ? `${menuUrl}?table=${selectedTable}` : menuUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(tableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    alert('Tüm QR kodları ZIP olarak indirilecek');
  };

  const handlePrintAll = () => {
    alert('Tüm QR kodları yazdırılacak');
  };

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">QR Menü için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QR Menü</h1>
          <p className="text-gray-500">{currentVenue?.name} • Masalar için QR kod oluştur</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadAll} className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50">
            <Download className="w-4 h-4" />Tümünü İndir
          </button>
          <button onClick={handlePrintAll} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
            <Printer className="w-4 h-4" />Tümünü Yazdır
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border p-6 sticky top-6">
            <h2 className="font-bold mb-4">QR Kod Önizleme</h2>
            
            {/* QR Display */}
            <div className={`aspect-square rounded-2xl flex items-center justify-center mb-4 ${qrStyle === 'branded' ? 'bg-gradient-to-br from-orange-500 to-red-500 p-6' : 'bg-white border-2 border-dashed'}`}>
              <div className={`w-full h-full rounded-xl flex items-center justify-center ${qrStyle === 'branded' ? 'bg-white' : ''}`}>
                <div className="text-center">
                  <QrCode className={`w-32 h-32 mx-auto ${qrStyle === 'branded' ? 'text-gray-800' : 'text-gray-400'}`} />
                  {qrStyle === 'branded' && (
                    <p className="mt-2 font-bold text-gray-800">{selectedTable ? `Masa ${selectedTable}` : 'Genel Menü'}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Style Toggle */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setQrStyle('simple')} className={`flex-1 py-2 rounded-lg font-medium text-sm ${qrStyle === 'simple' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
                Basit
              </button>
              <button onClick={() => setQrStyle('branded')} className={`flex-1 py-2 rounded-lg font-medium text-sm ${qrStyle === 'branded' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
                Markalı
              </button>
            </div>
            
            {/* URL */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Menü URL</label>
              <div className="flex items-center gap-2">
                <input type="text" value={tableUrl} readOnly className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm" />
                <button onClick={handleCopy} className="p-2 hover:bg-gray-100 rounded-lg">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-gray-100 rounded-lg font-medium text-sm hover:bg-gray-200 flex items-center justify-center gap-1">
                <Download className="w-4 h-4" />PNG
              </button>
              <button className="flex-1 py-2 bg-gray-100 rounded-lg font-medium text-sm hover:bg-gray-200 flex items-center justify-center gap-1">
                <Download className="w-4 h-4" />PDF
              </button>
              <button className="flex-1 py-2 bg-gray-100 rounded-lg font-medium text-sm hover:bg-gray-200 flex items-center justify-center gap-1">
                <Printer className="w-4 h-4" />Yazdır
              </button>
            </div>
            
            <a href={tableUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 py-2 text-orange-600 hover:bg-orange-50 rounded-lg font-medium text-sm">
              <Eye className="w-4 h-4" />Menüyü Önizle
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Masa QR Kodları</h2>
              <button onClick={() => setSelectedTable(null)} className={`px-4 py-2 rounded-lg font-medium text-sm ${!selectedTable ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <Grid3X3 className="w-4 h-4 inline mr-1" />Genel Menü
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table.number)}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    selectedTable === table.number
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <QrCode className={`w-10 h-10 mb-2 ${selectedTable === table.number ? 'text-orange-500' : 'text-gray-400'}`} />
                  <span className="font-bold">{table.number}</span>
                  <span className="text-xs text-gray-500">{table.section}</span>
                </button>
              ))}
            </div>
            
            {tables.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Grid3X3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Henüz masa eklenmemiş</p>
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 rounded-2xl p-6 mt-6">
            <h3 className="font-bold text-blue-900 mb-3">Nasıl Kullanılır?</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Yukarıdan bir masa seçin veya genel menü QR kodunu kullanın</li>
              <li>QR kodunu PNG veya PDF olarak indirin</li>
              <li>Masalara yapıştırın veya menü kartlarına ekleyin</li>
              <li>Müşteriler QR kodu tarayarak menüye erişebilir</li>
              <li>Masa seçili QR kodlarda sipariş otomatik o masaya atanır</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
