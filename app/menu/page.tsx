'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { UtensilsCrossed, Plus, Edit2, Trash2, X, Search, Image, GripVertical, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  prepTime?: number;
  image?: string;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

const initialCategories: Category[] = [
  { id: '1', name: 'Başlangıçlar', items: [
    { id: '1a', name: 'Humus', description: 'Nohut ezmesi, zeytinyağı', price: 85, categoryId: '1', isAvailable: true, prepTime: 5 },
    { id: '1b', name: 'Mercimek Çorbası', description: 'Geleneksel tarif', price: 65, categoryId: '1', isAvailable: true, prepTime: 3 },
    { id: '1c', name: 'Sigara Böreği', description: '6 adet, peynirli', price: 95, categoryId: '1', isAvailable: true, prepTime: 10 },
    { id: '1d', name: 'Karışık Meze', description: '8 çeşit meze tabağı', price: 180, categoryId: '1', isAvailable: false, prepTime: 8 },
  ]},
  { id: '2', name: 'Ana Yemekler', items: [
    { id: '2a', name: 'Izgara Levrek', description: 'Taze levrek, sebze garnitür', price: 320, categoryId: '2', isAvailable: true, prepTime: 20 },
    { id: '2b', name: 'Karışık Izgara', description: 'Kuzu pirzola, köfte, tavuk', price: 350, categoryId: '2', isAvailable: true, prepTime: 25 },
    { id: '2c', name: 'Adana Kebap', description: 'Acılı kıyma kebabı, pilav', price: 200, categoryId: '2', isAvailable: true, prepTime: 15 },
    { id: '2d', name: 'Biftek', description: 'Dana bonfile, mantar sos', price: 420, categoryId: '2', isAvailable: true, prepTime: 20 },
  ]},
  { id: '3', name: 'İçecekler', items: [
    { id: '3a', name: 'Ayran', price: 25, categoryId: '3', isAvailable: true },
    { id: '3b', name: 'Kola', price: 35, categoryId: '3', isAvailable: true },
    { id: '3c', name: 'Taze Sıkılmış Portakal', price: 55, categoryId: '3', isAvailable: true, prepTime: 3 },
    { id: '3d', name: 'Türk Kahvesi', price: 45, categoryId: '3', isAvailable: true, prepTime: 5 },
  ]},
  { id: '4', name: 'Tatlılar', items: [
    { id: '4a', name: 'Künefe', description: 'Antep fıstıklı', price: 140, categoryId: '4', isAvailable: true, prepTime: 15 },
    { id: '4b', name: 'Sütlaç', description: 'Fırında', price: 75, categoryId: '4', isAvailable: true },
    { id: '4c', name: 'Baklava', description: '4 dilim', price: 120, categoryId: '4', isAvailable: true },
  ]},
];

export default function MenuPage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const allItems = categories.flatMap(c => c.items);
  const filteredItems = allItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAvailability = (itemId: string) => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      items: cat.items.map(item => item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item)
    })));
  };

  const deleteItem = (itemId: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    setCategories(prev => prev.map(cat => ({
      ...cat,
      items: cat.items.filter(item => item.id !== itemId)
    })));
  };

  const saveItem = (data: Partial<MenuItem>) => {
    if (editingItem) {
      setCategories(prev => prev.map(cat => ({
        ...cat,
        items: cat.items.map(item => item.id === editingItem.id ? { ...item, ...data } : item)
      })));
    } else {
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        name: data.name || '',
        description: data.description,
        price: data.price || 0,
        categoryId: data.categoryId || categories[0].id,
        isAvailable: true,
        prepTime: data.prepTime,
      };
      setCategories(prev => prev.map(cat => 
        cat.id === newItem.categoryId ? { ...cat, items: [...cat.items, newItem] } : cat
      ));
    }
    setShowItemModal(false);
    setEditingItem(null);
  };

  const stats = {
    total: allItems.length,
    available: allItems.filter(i => i.isAvailable).length,
    categories: categories.length,
  };

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Menü yönetimi için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menü Yönetimi</h1>
          <p className="text-gray-500">{currentVenue?.name} • {stats.total} ürün</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }} className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50">
            <Plus className="w-4 h-4" />Kategori
          </button>
          <button onClick={() => { setEditingItem(null); setShowItemModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
            <Plus className="w-4 h-4" />Ürün Ekle
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-gray-500">Toplam Ürün</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-2xl font-bold text-green-600">{stats.available}</p>
          <p className="text-sm text-gray-500">Satışta</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-2xl font-bold text-purple-600">{stats.categories}</p>
          <p className="text-sm text-gray-500">Kategori</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border flex flex-wrap items-center gap-4">
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${selectedCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Tümü</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {cat.name} ({cat.items.length})
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ürün ara..." className="pl-10 pr-4 py-2 border rounded-lg w-64" />
        </div>
      </div>

      {/* Menu Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const category = categories.find(c => c.id === item.categoryId);
          return (
            <div key={item.id} className={`bg-white rounded-xl border overflow-hidden ${!item.isAvailable ? 'opacity-60' : ''}`}>
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500">{category?.name}</p>
                  </div>
                  <p className="text-lg font-bold text-orange-600">₺{item.price}</p>
                </div>
                {item.description && <p className="text-sm text-gray-500 mb-3">{item.description}</p>}
                {item.prepTime && <p className="text-xs text-gray-400 mb-3">⏱ {item.prepTime} dk</p>}
                
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleAvailability(item.id)} className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {item.isAvailable ? <><Eye className="w-4 h-4" />Satışta</> : <><EyeOff className="w-4 h-4" />Gizli</>}
                  </button>
                  <button onClick={() => { setEditingItem(item); setShowItemModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                  <button onClick={() => deleteItem(item.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Ürün bulunamadı</p>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingItem ? 'Ürün Düzenle' : 'Yeni Ürün'}</h2>
              <button onClick={() => { setShowItemModal(false); setEditingItem(null); }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); saveItem({ name: f.get('name') as string, description: f.get('description') as string, price: parseFloat(f.get('price') as string), categoryId: f.get('category') as string, prepTime: parseInt(f.get('prepTime') as string) || undefined }); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ürün Adı</label>
                <input name="name" required defaultValue={editingItem?.name} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Açıklama</label>
                <textarea name="description" defaultValue={editingItem?.description} className="w-full px-4 py-2 border rounded-xl resize-none h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fiyat (₺)</label>
                  <input name="price" type="number" min="0" step="0.01" required defaultValue={editingItem?.price} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hazırlama (dk)</label>
                  <input name="prepTime" type="number" min="0" defaultValue={editingItem?.prepTime} className="w-full px-4 py-2 border rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kategori</label>
                <select name="category" defaultValue={editingItem?.categoryId || categories[0].id} className="w-full px-4 py-2 border rounded-xl">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowItemModal(false); setEditingItem(null); }} className="flex-1 py-3 border rounded-xl">İptal</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}</h2>
              <button onClick={() => setShowCategoryModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const name = f.get('name') as string; if (editingCategory) { setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name } : c)); } else { setCategories(prev => [...prev, { id: `cat-${Date.now()}`, name, items: [] }]); } setShowCategoryModal(false); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kategori Adı</label>
                <input name="name" required defaultValue={editingCategory?.name} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 py-3 border rounded-xl">İptal</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
