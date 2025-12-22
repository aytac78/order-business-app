export interface PrintItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface PrintData {
  type: 'receipt' | 'kitchen' | 'bill';
  venue: {
    name: string;
    address?: string;
    phone?: string;
  };
  order: {
    id: string;
    number: string;
    table?: string;
    waiter?: string;
    type: 'dine_in' | 'takeaway' | 'delivery';
    items: PrintItem[];
    subtotal: number;
    tax: number;
    discount?: number;
    total: number;
    paymentMethod?: string;
  };
  date: Date;
}

export function generateReceiptHTML(data: PrintData): string {
  const { venue, order, date } = data;
  const isKitchen = data.type === 'kitchen';
  const formatPrice = (p: number) => `₺${p.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  const formatDate = (d: Date) => d.toLocaleDateString('tr-TR');
  const formatTime = (d: Date) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const typeLabels = { dine_in: 'MASA', takeaway: 'PAKET', delivery: 'TESLİMAT' };

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${isKitchen ? 'Mutfak' : 'Fiş'}</title>
<style>
@page{size:80mm auto;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:12px;width:80mm;padding:5mm;background:#fff;color:#000}
.header{text-align:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed #000}
.venue-name{font-size:18px;font-weight:bold;margin-bottom:5px}
.order-type{font-size:16px;font-weight:bold;text-align:center;padding:5px;background:${isKitchen?'#000':'#f0f0f0'};color:${isKitchen?'#fff':'#000'};margin:10px 0}
.info-row{display:flex;justify-content:space-between;margin:3px 0}
.item{margin:8px 0;padding-bottom:8px;border-bottom:1px dotted #ccc}
.item-header{display:flex;justify-content:space-between;font-weight:bold}
.item-notes{font-size:10px;color:#666;font-style:italic;margin-top:3px;padding-left:30px}
.totals{margin-top:10px;padding-top:10px;border-top:1px dashed #000}
.total-row{display:flex;justify-content:space-between;margin:5px 0}
.grand-total{font-size:16px;font-weight:bold;margin-top:10px;padding-top:10px;border-top:2px solid #000}
.footer{margin-top:15px;padding-top:10px;border-top:1px dashed #000;text-align:center;font-size:10px}
</style></head><body>
${isKitchen ? `
<div style="font-size:18px;font-weight:bold;text-align:center;padding:10px;background:#000;color:#fff">🍳 MUTFAK FİŞİ</div>
<div class="order-type">${typeLabels[order.type]} ${order.table ? '#' + order.table : ''}</div>
<div style="text-align:center;font-size:14px;margin:10px 0">${formatTime(date)}</div>
<div class="info-row"><span>Sipariş:</span><strong>${order.number}</strong></div>
${order.waiter ? `<div class="info-row"><span>Garson:</span><span>${order.waiter}</span></div>` : ''}
<div style="margin:10px 0">
${order.items.map(i => `<div class="item"><div class="item-header"><span style="font-size:14px">${i.quantity}x</span><span style="flex:1;font-size:14px">${i.name}</span></div>${i.notes ? `<div class="item-notes">⚠️ ${i.notes}</div>` : ''}</div>`).join('')}
</div>
` : `
<div class="header"><div class="venue-name">${venue.name}</div>${venue.address ? `<div style="font-size:10px">${venue.address}</div>` : ''}${venue.phone ? `<div style="font-size:10px">Tel: ${venue.phone}</div>` : ''}</div>
<div class="order-type">${typeLabels[order.type]} ${order.table ? '#' + order.table : ''}</div>
<div style="margin:10px 0;padding:10px 0;border-bottom:1px dashed #000">
<div class="info-row"><span>Fiş No:</span><span>${order.number}</span></div>
<div class="info-row"><span>Tarih:</span><span>${formatDate(date)}</span></div>
<div class="info-row"><span>Saat:</span><span>${formatTime(date)}</span></div>
${order.waiter ? `<div class="info-row"><span>Garson:</span><span>${order.waiter}</span></div>` : ''}
</div>
<div style="margin:10px 0">
${order.items.map(i => `<div class="item"><div class="item-header"><span>${i.quantity}x</span><span style="flex:1">${i.name}</span><span>${formatPrice(i.price * i.quantity)}</span></div>${i.notes ? `<div class="item-notes">${i.notes}</div>` : ''}</div>`).join('')}
</div>
<div class="totals">
<div class="total-row"><span>Ara Toplam:</span><span>${formatPrice(order.subtotal)}</span></div>
${order.discount ? `<div class="total-row" style="color:green"><span>İndirim:</span><span>-${formatPrice(order.discount)}</span></div>` : ''}
<div class="total-row"><span>KDV (%8):</span><span>${formatPrice(order.tax)}</span></div>
<div class="total-row grand-total"><span>TOPLAM:</span><span>${formatPrice(order.total)}</span></div>
${order.paymentMethod ? `<div class="total-row" style="margin-top:10px"><span>Ödeme:</span><span>${order.paymentMethod}</span></div>` : ''}
</div>
<div class="footer"><p>Teşekkürler!</p><p>www.orderapp.com</p></div>
`}
</body></html>`;
}

export function printReceipt(data: PrintData): void {
  const html = generateReceiptHTML(data);
  const win = window.open('', '_blank', 'width=350,height=600');
  if (!win) { alert('Popup engelleyici aktif!'); return; }
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); setTimeout(() => win.close(), 1000); };
}

export function printKitchenTicket(data: PrintData): void {
  printReceipt({ ...data, type: 'kitchen' });
}
