'use client';

import { useState, useEffect } from 'react';
import { useVenueStore, useTableStore, useWaiterCallStore, broadcastSync, TableWithDetails } from '@/stores';
import {
  UtensilsCrossed,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Send,
  Clock,
  Users,
  Bell,
  X,
  Coffee,
  Wine,
  Cake,
  Salad,
  AlertCircle,
  Check,
  MessageSquare
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  prepTime?: number;
}

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

const menuItems: MenuItem[] = [
  { id: 'p1', name: 'Humus', price: 85, category: 'Başlangıçlar', prepTime: 5 },
  { id: 'p2', name: 'Cacık', price: 65, category: 'Başlangıçlar', prepTime: 5 },
  { id: 'p3', name: 'Patlıcan Salatası', price: 95, category: 'Başlangıçlar', prepTime: 8 },
  { id: 'p4', name: 'Atom', price: 55, category: 'Başlangıçlar', prepTime: 3 },
  { id: 'p5', name: 'Sigara Böreği', price: 120, category: 'Başlangıçlar', prepTime: 12 },
  { id: 'p6', name: 'Izgara Levrek', price: 320, category: 'Ana Yemekler', prepTime: 25 },
  { id: 'p7', name: 'Karides Güveç', price: 280, category: 'Ana Yemekler', prepTime: 20 },
  { id: 'p8', name: 'Karışık Izgara', price: 350, category: 'Ana Yemekler', prepTime: 30 },
  { id: 'p9', name: 'Adana Kebap', price: 200, category: 'Ana Yemekler', prepTime: 20 },
  { id: 'p10', name: 'Urfa Kebap', price: 200, category: 'Ana Yemekler', prepTime: 20 },
  { id: 'p11', name: 'Tavuk Şiş', price: 160, category: 'Ana Yemekler', prepTime: 18 },
  { id: 'p12', name: 'Kuzu Pirzola', price: 380, category: 'Ana Yemekler', prepTime: 25 },
  { id: 'p13', name: 'Biftek', price: 420, category: 'Ana Yemekler', prepTime: 25 },
  { id: 'p14', name: 'Pizza Margherita', price: 180, category: 'Ana Yemekler', prepTime: 15 },
  { id: 'p15', name: 'Lahmacun', price: 45, category: 'Ana Yemekler', prepTime: 10 },
  { id: 'p16', name: 'Ayran', price: 25, category: 'İçecekler', prepTime: 1 },
  { id: 'p17', name: 'Kola', price: 35, category: 'İçecekler', prepTime: 1 },
  { id: 'p18', name: 'Limonata', price: 45, category: 'İçecekler', prepTime: 2 },
  { id: 'p19', name: 'Türk Kahvesi', price: 50, category: 'İçecekler', prepTime: 5 },
  { id: 'p20', name: 'Çay', price: 20, category: 'İçecekler', prepTime: 3 },
  { id: 'p21', name: 'Rakı (70cl)', price: 450, category: 'Alkollü', prepTime: 2 },
  { id: 'p22', name: 'Bira', price: 80, category: 'Alkollü', prepTime: 1 },
  { id: 'p23', name: 'Şarap', price: 350, category: 'Alkollü', prepTime: 2 },
  { id: 'p24', name: 'Mojito', price: 180, category: 'Alkollü', prepTime: 5 },
  { id: 'p25', name: 'Künefe', price: 140, category: 'Tatlılar', prepTime: 15 },
  { id: 'p26', name: 'Sütlaç', price: 75, category: 'Tatlılar', prepTime: 2 },
  { id: 'p27', name: 'Baklava', price: 120, category: 'Tatlılar', prepTime: 2 },
  { id: 'p28', name: 'Dondurma', price: 85, category: 'Tatlılar', prepTime: 3 },
];

const categories = ['Başlangıçlar', 'Ana Yemekler', 'İçecekler', 'Alkollü', 'Tatlılar'];
const categoryIcons: Record<string, any> = {
  'Başlangıçlar': Salad,
  'Ana Yemekler': UtensilsCrossed,
  'İçecekler': Coffee,
  'Alkollü': Wine,
  'Tatlılar': Cake,
};

export default function WaiterPage() {
  const { currentVenue } = useVenueStore();
  const { tables } = useTableStore();
  const { calls, acknowledgeCall } = useWaiterCallStore();
  
  const [mounted, setMounted] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableWithDetails | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Ana Yemekler');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [itemNote, setItemNote] = useState<{id: string; note: string} | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('all');

  useEffect(() => { setMounted(true); }, []);

  const pendingCalls = calls.filter(c => c.status === 'pending');
  const sections = [...new Set(tables.map(t => t.section))];
  const filteredTables = selectedSection === 'all' ? tables : tables.filter(t => t.section === selectedSection);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + delta;
        return newQty <= 0 ? null : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const sendOrder = () => {
    if (!selectedTable || cart.length === 0) return;
    const orderNumber = `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const order = {
      id: `order-${Date.now()}`,
      order_number: orderNumber,
      venue_id: currentVenue?.id || '1',
      table_id: selectedTable.id,
      table_number: selectedTable.number,
      type: 'dine_in' as const,
      status: 'pending' as const,
      priority: 'normal' as const,
      items: cart.map(item => ({
        id: `item-${Date.now()}-${item.id}`,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        notes: item.notes,
        status: 'pending' as const
      })),
      subtotal: cartTotal,
      tax: Math.round(cartTotal * 0.08),
      total: Math.round(cartTotal * 1.08),
      created_at: new Date().toISOString()
    };
    
    broadcastSync({
      type: 'ORDER_CREATED',
      venue_id: currentVenue?.id || '1',
      payload: order,
      timestamp: new Date().toISOString()
    });
    
    setCart([]);
    alert(`Sipariş gönderildi!\n${orderNumber}\nMasa: ${selectedTable.number}\nToplam: ₺${order.total}`);
  };

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Garson paneli için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Tables */}
      <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 mb-3">Masa Seçimi</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button onClick={() => setSelectedSection('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${selectedSection === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}>Tümü</button>
            {sections.map(s => (
              <button key={s} onClick={() => setSelectedSection(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${selectedSection === s ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}>{s}</button>
            ))}
          </div>
        </div>
        
        {pendingCalls.length > 0 && (
          <div className="p-3 bg-red-50 border-b border-red-100">
            <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1"><Bell className="w-3 h-3 animate-pulse" /> Garson Çağrısı ({pendingCalls.length})</p>
            {pendingCalls.slice(0, 3).map(call => (
              <div key={call.id} className="flex items-center justify-between bg-white p-2 rounded-lg mb-1">
                <div>
                  <p className="font-medium text-red-700">Masa #{call.table_number}</p>
                  <p className="text-xs text-red-500">{call.type === 'call' ? 'Garson' : call.type === 'bill' ? 'Hesap' : 'Yardım'}</p>
                </div>
                <button onClick={() => acknowledgeCall(call.id)} className="p-2 bg-red-500 text-white rounded-lg"><Check className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-2">
            {filteredTables.map(table => {
              const colors = { available: 'bg-green-100 border-green-300 text-green-700', occupied: 'bg-red-100 border-red-300 text-red-700', reserved: 'bg-blue-100 border-blue-300 text-blue-700', cleaning: 'bg-yellow-100 border-yellow-300 text-yellow-700' };
              return (
                <button key={table.id} onClick={() => setSelectedTable(table)} disabled={table.status === 'cleaning'} className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center ${selectedTable?.id === table.id ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' : colors[table.status]} ${table.status === 'cleaning' ? 'opacity-50' : ''}`}>
                  <span className="font-bold text-lg">{table.number}</span>
                  <span className="text-xs flex items-center gap-0.5"><Users className="w-3 h-3" /> {table.capacity}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(cat => {
              const Icon = categoryIcons[cat];
              return (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap ${selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  <Icon className="w-4 h-4" />{cat}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedTable ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center"><Users className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Sipariş almak için masa seçin</p></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {menuItems.filter(i => i.category === selectedCategory).map(item => (
                <button key={item.id} onClick={() => addToCart(item)} className="p-4 bg-gray-50 hover:bg-orange-50 rounded-xl text-left border border-transparent hover:border-orange-200">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-orange-600">₺{item.price}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.prepTime} dk</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-red-500 text-white -m-px rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /><span className="font-bold">Sepet</span></div>
            {selectedTable && <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Masa {selectedTable.number}</span>}
          </div>
        </div>
        
        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center"><ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Sepet boş</p></div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-orange-600 font-bold">₺{item.price * item.quantity}</p>
                      {item.notes && <p className="text-xs text-gray-500 mt-1">Not: {item.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                      <span className="w-6 text-center font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setItemNote({ id: item.id, note: item.notes || '' })} className="flex-1 py-1.5 text-xs bg-gray-200 rounded-lg flex items-center justify-center gap-1"><MessageSquare className="w-3 h-3" />{item.notes ? 'Not Düzenle' : 'Not Ekle'}</button>
                    <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded-lg"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-100 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Ara Toplam</span><span>₺{cartTotal}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">KDV (%8)</span><span>₺{Math.round(cartTotal * 0.08)}</span></div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Toplam</span><span className="text-orange-600">₺{Math.round(cartTotal * 1.08)}</span></div>
              <button onClick={sendOrder} disabled={!selectedTable} className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"><Send className="w-5 h-5" />Siparişi Gönder</button>
            </div>
          </>
        )}
      </div>

      {itemNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-4 border-b flex items-center justify-between"><h3 className="font-bold">Ürün Notu</h3><button onClick={() => setItemNote(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
            <div className="p-4">
              <textarea value={itemNote.note} onChange={(e) => setItemNote({ ...itemNote, note: e.target.value })} placeholder="Örn: Acısız olsun..." className="w-full h-24 p-3 border rounded-xl resize-none" />
              <button onClick={() => { setCart(prev => prev.map(i => i.id === itemNote.id ? { ...i, notes: itemNote.note } : i)); setItemNote(null); }} className="w-full mt-3 py-3 bg-orange-500 text-white rounded-xl font-medium">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
