'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { Package, Plus, Edit2, AlertTriangle, Search, TrendingDown, TrendingUp, X, AlertCircle } from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentQty: number;
  minQty: number;
  maxQty: number;
  costPerUnit: number;
  lastRestocked?: string;
}

const initialStock: StockItem[] = [
  { id: '1', name: 'Zeytinyağı', category: 'Yağlar', unit: 'Litre', currentQty: 15, minQty: 10, maxQty: 50, costPerUnit: 180, lastRestocked: '2025-01-10' },
  { id: '2', name: 'Un', category: 'Kuru Gıda', unit: 'Kg', currentQty: 25, minQty: 20, maxQty: 100, costPerUnit: 25, lastRestocked: '2025-01-12' },
  { id: '3', name: 'Tavuk Göğsü', category: 'Et', unit: 'Kg', currentQty: 8, minQty: 15, maxQty: 50, costPerUnit: 120, lastRestocked: '2025-01-14' },
  { id: '4', name: 'Dana Kıyma', category: 'Et', unit: 'Kg', currentQty: 12, minQty: 10, maxQty: 40, costPerUnit: 280, lastRestocked: '2025-01-14' },
  { id: '5', name: 'Domates', category: 'Sebze', unit: 'Kg', currentQty: 5, minQty: 10, maxQty: 30, costPerUnit: 35, lastRestocked: '2025-01-15' },
  { id: '6', name: 'Soğan', category: 'Sebze', unit: 'Kg', currentQty: 18, minQty: 10, maxQty: 40, costPerUnit: 15, lastRestocked: '2025-01-13' },
  { id: '7', name: 'Levrek (Taze)', category: 'Deniz Ürünü', unit: 'Kg', currentQty: 3, minQty: 5, maxQty: 20, costPerUnit: 250, lastRestocked: '2025-01-15' },
  { id: '8', name: 'Karides', category: 'Deniz Ürünü', unit: 'Kg', currentQty: 4, minQty: 3, maxQty: 15, costPerUnit: 350, lastRestocked: '2025-01-15' },
  { id: '9', name: 'Rakı', category: 'Alkol', unit: 'Şişe', currentQty: 24, minQty: 10, maxQty: 50, costPerUnit: 450, lastRestocked: '2025-01-08' },
  { id: '10', name: 'Şarap (Kırmızı)', category: 'Alkol', unit: 'Şişe', currentQty: 18, minQty: 12, maxQty: 40, costPerUnit: 280, lastRestocked: '2025-01-08' },
  { id: '11', name: 'Kola', category: 'İçecek', unit: 'Kasa', currentQty: 6, minQty: 5, maxQty: 20, costPerUnit: 180, lastRestocked: '2025-01-12' },
  { id: '12', name: 'Ayran', category: 'İçecek', unit: 'Kasa', currentQty: 4, minQty: 5, maxQty: 15, costPerUnit: 120, lastRestocked: '2025-01-14' },
];

const categories = ['Tümü', 'Et', 'Deniz Ürünü', 'Sebze', 'Kuru Gıda', 'Yağlar', 'Alkol', 'İçecek'];

export default function StockPage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [stock, setStock] = useState<StockItem[]>(initialStock);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const filteredStock = stock.filter(item => {
    const matchesCategory = selectedCategory === 'Tümü' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockItems = stock.filter(item => item.currentQty <= item.minQty);
  const totalValue = stock.reduce((sum, item) => sum + (item.currentQty * item.costPerUnit), 0);

  const getStockStatus = (item: StockItem) => {
    if (item.currentQty <= item.minQty * 0.5) return { label: 'Kritik', color: 'bg-red-100 text-red-700' };
    if (item.currentQty <= item.minQty) return { label: 'Düşük', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Normal', color: 'bg-green-100 text-green-700' };
  };

  const updateStock = (id: string, qty: number) => {
    setStock(prev => prev.map(item => item.id === id ? { ...item, currentQty: Math.max(0, item.currentQty + qty) } : item));
  };

  const saveItem = (data: Partial<StockItem>) => {
    if (editingItem) {
      setStock(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...data } : item));
    } else {
      setStock(prev => [...prev, { ...data, id: `stock-${Date.now()}` } as StockItem]);
    }
    setShowModal(false);
    setEditingItem(null);
  };

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Stok yönetimi için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stok Yönetimi</h1>
          <p className="text-gray-500">{currentVenue?.name} • {stock.length} ürün</p>
        </div>
        <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
          <Plus className="w-4 h-4" />Ürün Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Package className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{stock.length}</p><p className="text-xs text-gray-500">Toplam Ürün</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-amber-600">{lowStockItems.length}</p><p className="text-xs text-gray-500">Düşük Stok</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-green-600">₺{totalValue.toLocaleString()}</p><p className="text-xs text-gray-500">Stok Değeri</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><span className="text-purple-600 font-bold">{categories.length - 1}</span></div>
            <div><p className="text-2xl font-bold">{categories.length - 1}</p><p className="text-xs text-gray-500">Kategori</p></div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-amber-800">Düşük Stok Uyarısı</h3>
          </div>
          <p className="text-sm text-amber-700">{lowStockItems.map(i => i.name).join(', ')} - stok seviyesi düşük!</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border flex flex-wrap items-center gap-4">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{cat}</button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ara..." className="pl-10 pr-4 py-2 border rounded-lg" />
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-500">
              <th className="px-4 py-3 font-medium">Ürün</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Miktar</th>
              <th className="px-4 py-3 font-medium">Min/Max</th>
              <th className="px-4 py-3 font-medium">Birim Fiyat</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredStock.map(item => {
              const status = getStockStatus(item);
              const percentage = Math.min(100, (item.currentQty / item.maxQty) * 100);
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">Son: {item.lastRestocked}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{item.currentQty}</span>
                      <span className="text-gray-500 text-sm">{item.unit}</span>
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                      <div className={`h-full rounded-full ${percentage < 30 ? 'bg-red-500' : percentage < 60 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.minQty} / {item.maxQty}</td>
                  <td className="px-4 py-3 font-medium">₺{item.costPerUnit}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateStock(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200">-</button>
                      <button onClick={() => updateStock(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-lg hover:bg-green-200">+</button>
                      <button onClick={() => { setEditingItem(item); setShowModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingItem ? 'Ürün Düzenle' : 'Yeni Stok Ürünü'}</h2>
              <button onClick={() => { setShowModal(false); setEditingItem(null); }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); saveItem({ name: f.get('name') as string, category: f.get('category') as string, unit: f.get('unit') as string, currentQty: parseFloat(f.get('currentQty') as string), minQty: parseFloat(f.get('minQty') as string), maxQty: parseFloat(f.get('maxQty') as string), costPerUnit: parseFloat(f.get('costPerUnit') as string), lastRestocked: new Date().toISOString().split('T')[0] }); }} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Ürün Adı</label><input name="name" required defaultValue={editingItem?.name} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Kategori</label><select name="category" defaultValue={editingItem?.category} className="w-full px-4 py-2 border rounded-xl">{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Birim</label><input name="unit" required defaultValue={editingItem?.unit || 'Kg'} className="w-full px-4 py-2 border rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">Miktar</label><input name="currentQty" type="number" min="0" required defaultValue={editingItem?.currentQty} className="w-full px-4 py-2 border rounded-xl" /></div>
                <div><label className="block text-sm font-medium mb-1">Min</label><input name="minQty" type="number" min="0" required defaultValue={editingItem?.minQty} className="w-full px-4 py-2 border rounded-xl" /></div>
                <div><label className="block text-sm font-medium mb-1">Max</label><input name="maxQty" type="number" min="0" required defaultValue={editingItem?.maxQty} className="w-full px-4 py-2 border rounded-xl" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Birim Fiyat (₺)</label><input name="costPerUnit" type="number" min="0" step="0.01" required defaultValue={editingItem?.costPerUnit} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); }} className="flex-1 py-3 border rounded-xl">İptal</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
