'use client';

import { useState } from 'react';
import { X, Printer, Eye } from 'lucide-react';
import { PrintData, generateReceiptHTML, printReceipt } from '@/lib/print';

interface PrintPreviewProps {
  data: PrintData;
  onClose: () => void;
  title?: string;
}

export function PrintPreview({ data, onClose, title = 'Fiş Önizleme' }: PrintPreviewProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const html = generateReceiptHTML(data);

  const handlePrint = () => {
    setIsPrinting(true);
    printReceipt(data);
    setTimeout(() => {
      setIsPrinting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div className="bg-white shadow-lg mx-auto" style={{ width: '80mm', minHeight: '200px' }}>
            <iframe
              srcDoc={html}
              className="w-full border-0"
              style={{ minHeight: '400px', height: 'auto' }}
              title="Fiş Önizleme"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
          >
            Kapat
          </button>
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:bg-gray-300"
          >
            <Printer className="w-5 h-5" />
            {isPrinting ? 'Yazdırılıyor...' : 'Yazdır'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline preview component (iframe yerine div ile)
export function ReceiptPreview({ data }: { data: PrintData }) {
  const { venue, order, date } = data;
  const isKitchen = data.type === 'kitchen';
  const formatPrice = (p: number) => `₺${p.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  const formatDate = (d: Date) => d.toLocaleDateString('tr-TR');
  const formatTime = (d: Date) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const typeLabels = { dine_in: 'MASA', takeaway: 'PAKET', delivery: 'TESLİMAT' };

  return (
    <div className="bg-white p-4 font-mono text-sm" style={{ width: '80mm' }}>
      {/* Header */}
      <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
        <p className="text-lg font-bold">{venue.name}</p>
        {venue.address && <p className="text-xs text-gray-600">{venue.address}</p>}
        {venue.phone && <p className="text-xs text-gray-600">Tel: {venue.phone}</p>}
      </div>

      {/* Order Type */}
      <div className={`text-center py-2 mb-3 font-bold ${isKitchen ? 'bg-black text-white' : 'bg-gray-100'}`}>
        {typeLabels[order.type]} {order.table ? `#${order.table}` : ''}
      </div>

      {/* Order Info */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3 space-y-1">
        <div className="flex justify-between">
          <span>Fiş No:</span>
          <span>{order.number}</span>
        </div>
        <div className="flex justify-between">
          <span>Tarih:</span>
          <span>{formatDate(date)}</span>
        </div>
        <div className="flex justify-between">
          <span>Saat:</span>
          <span>{formatTime(date)}</span>
        </div>
        {order.waiter && (
          <div className="flex justify-between">
            <span>Garson:</span>
            <span>{order.waiter}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
        {order.items.map((item, idx) => (
          <div key={idx} className="mb-2">
            <div className="flex justify-between">
              <span className="font-medium">{item.quantity}x {item.name}</span>
              {!isKitchen && <span>{formatPrice(item.price * item.quantity)}</span>}
            </div>
            {item.notes && (
              <p className="text-xs text-gray-500 ml-4">⚠️ {item.notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* Totals (not for kitchen) */}
      {!isKitchen && (
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Ara Toplam:</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount && (
            <div className="flex justify-between text-green-600">
              <span>İndirim:</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>KDV (%8):</span>
            <span>{formatPrice(order.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-800 mt-2">
            <span>TOPLAM:</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          {order.paymentMethod && (
            <div className="flex justify-between mt-2">
              <span>Ödeme:</span>
              <span>{order.paymentMethod}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center border-t border-dashed border-gray-400 pt-3 mt-3 text-xs text-gray-500">
        <p>Teşekkürler!</p>
        <p>www.orderapp.com</p>
      </div>
    </div>
  );
}
