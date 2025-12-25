'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Plus, RefreshCw, Search, Utensils, X, Trash2, ImageIcon,
  Camera, Upload, Edit, Save, ChevronDown, ChevronRight, Download,
  Package, Coffee, Wine, Beef, Fish, IceCream, Salad, Soup, Pizza,
  Loader2
} from 'lucide-react';

// Ana kategori grupları
const mainCategoryGroups = [
  {
    id: 'starters',
    name: 'Başlangıçlar & Mezeler',
    icon: '🥗',
    color: 'bg-green-500',
    subCategories: ['Soğuk Mezeler', 'Sıcak Mezeler', 'Mezeler', 'Beach Bites', 'Paylaşım Tabakları', 'Finger Food / Tapas']
  },
  {
    id: 'salads',
    name: 'Salatalar',
    icon: '🥬',
    color: 'bg-emerald-500',
    subCategories: ['Salatalar', 'Klasik Salatalar', 'Şef Salataları', 'Proteinli Salatalar']
  },
  {
    id: 'soups',
    name: 'Çorbalar',
    icon: '🍲',
    color: 'bg-amber-500',
    subCategories: ['Çorbalar', 'Günün Çorbası', 'Klasik Çorbalar']
  },
  {
    id: 'mains',
    name: 'Ana Yemekler',
    icon: '🍽️',
    color: 'bg-red-500',
    subCategories: ['Et Yemekleri', 'Tavuk Yemekleri', 'Deniz Ürünleri', 'Balıklar', 'Makarnalar', 'Risotto', 'Burgerler', 'Kebaplar', 'Izgara', 'Ana Yemekler']
  },
  {
    id: 'ara',
    name: 'Ara Sıcaklar',
    icon: '🥟',
    color: 'bg-orange-500',
    subCategories: ['Ara Sıcaklar', 'Hamur İşleri', 'Börekler']
  },
  {
    id: 'pizza',
    name: 'Pizza',
    icon: '🍕',
    color: 'bg-yellow-500',
    subCategories: ['Pizzalar', 'Klasik Pizzalar', 'Özel Pizzalar']
  },
  {
    id: 'sides',
    name: 'Yan Ürünler',
    icon: '🍟',
    color: 'bg-yellow-600',
    subCategories: ['Yan Ürünler', 'Garnitürler', 'Soslar', 'Ekstralar']
  },
  {
    id: 'desserts',
    name: 'Tatlılar',
    icon: '🍰',
    color: 'bg-pink-500',
    subCategories: ['Tatlılar', 'Sütlü Tatlılar', 'Çikolatalı Tatlılar', 'Şerbetli Tatlılar', 'Dondurmalar']
  },
  {
    id: 'hotdrinks',
    name: 'Sıcak İçecekler',
    icon: '☕',
    color: 'bg-amber-700',
    subCategories: ['Sıcak İçecekler', 'Türk Kahvesi', 'Espresso Bazlı', 'Çaylar', 'Kahveler']
  },
  {
    id: 'colddrinks',
    name: 'Soğuk İçecekler',
    icon: '🧊',
    color: 'bg-cyan-500',
    subCategories: ['Soğuk İçecekler', 'Su / Soda', 'Meşrubatlar', 'Meyve Suları', 'Smoothie', 'Mocktail']
  },
  {
    id: 'alcohol',
    name: 'Alkollü İçecekler',
    icon: '🍺',
    color: 'bg-purple-500',
    subCategories: [
      'Biralar', 'Şaraplar', 'Kokteyller',
      '↳ Kırmızı Şarap (Kadeh)', '↳ Kırmızı Şarap (Şişe)',
      '↳ Beyaz Şarap (Kadeh)', '↳ Beyaz Şarap (Şişe)',
      '↳ Rose (Kadeh)', '↳ Rose (Şişe)',
      '↳ Şampanya (Kadeh)', '↳ Şampanya (Şişe)',
      '↳ Rakı (Kadeh)', '↳ Rakı (Şişe)',
      '↳ Votka (Kadeh)', '↳ Votka (Şişe)',
      '↳ Cin (Kadeh)', '↳ Cin (Şişe)',
      '↳ Rom (Kadeh)', '↳ Rom (Şişe)',
      '↳ Tekila (Kadeh)', '↳ Tekila (Şişe)',
      '↳ Viski (Kadeh)', '↳ Viski (Şişe)',
      '↳ Konyak (Kadeh)', '↳ Konyak (Şişe)',
      '↳ Likör (Kadeh)', '↳ Likör (Şişe)',
      'Rakı', 'Viski', 'Votka', 'Cin', 'Rom', 'Tekila'
    ]
  },
  {
    id: 'other',
    name: 'Diğer',
    icon: '📦',
    color: 'bg-gray-500',
    subCategories: ['Diğer', 'Genel', 'Kategorisiz', '']
  }
];

// Ürünün hangi ana gruba ait olduğunu bul
function getMainGroup(category: string): typeof mainCategoryGroups[0] | null {
  if (!category) return mainCategoryGroups.find(g => g.id === 'other') || null;
  
  for (const group of mainCategoryGroups) {
    if (group.subCategories.some(sub => 
      sub.toLowerCase() === category.toLowerCase() ||
      category.toLowerCase().includes(sub.toLowerCase()) ||
      sub.toLowerCase().includes(category.toLowerCase())
    )) {
      return group;
    }
  }
  return mainCategoryGroups.find(g => g.id === 'other') || null;
}

export default function MenuPage() {
  const { currentVenue } = useVenueStore();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchMenu = useCallback(async () => {
    setIsLoading(true);
    let query = supabase.from('menu_items').select('*').order('name');
    if (currentVenue?.id) {
      query = query.eq('venue_id', currentVenue.id);
    }
    const { data, error } = await query;
    if (!error) setMenuItems(data || []);
    setIsLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Ürünleri ana gruplara göre grupla
  const groupedByMain = menuItems.reduce((acc, item) => {
    const group = getMainGroup(item.category);
    const groupId = group?.id || 'other';
    if (!acc[groupId]) acc[groupId] = [];
    acc[groupId].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // Arama filtresi
  const filteredItems = searchTerm 
    ? menuItems.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    await supabase.from('menu_items').delete().eq('id', id);
    fetchMenu();
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    await supabase.from('menu_items').update({ is_available: !currentStatus }).eq('id', id);
    fetchMenu();
  };

  const handleUpdateItem = async (id: string, updates: any) => {
    await supabase.from('menu_items').update(updates).eq('id', id);
    fetchMenu();
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menü Yönetimi</h1>
          <p className="text-gray-500 mt-1">{currentVenue?.name || 'Tüm Mekanlar'} • {menuItems.length} ürün</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchMenu} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Yenile
          </button>
          <a href="/menu/import" className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
            <Download className="w-4 h-4" /> İçe Aktar
          </a>
          <button 
            onClick={() => setEditingItem({})}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Plus className="w-4 h-4" /> Ürün Ekle
          </button>
        </div>
      </div>

      {/* Arama */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Ürün veya kategori ara..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg" 
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : searchTerm && filteredItems ? (
        /* Arama Sonuçları */
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <p className="font-medium text-gray-700">"{searchTerm}" için {filteredItems.length} sonuç</p>
          </div>
          <div className="divide-y">
            {filteredItems.map((item: any) => (
              <MenuItemRow 
                key={item.id} 
                item={item} 
                onEdit={() => setEditingItem(item)}
                onDelete={handleDeleteItem}
                onToggle={handleToggleAvailability}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Ana Kategori Grupları */
        <div className="space-y-3">
          {mainCategoryGroups.map(group => {
            const items = groupedByMain[group.id] || [];
            if (items.length === 0) return null;
            
            const isExpanded = expandedGroup === group.id;
            
            // Alt kategorilere göre grupla
            const subGrouped = items.reduce((acc: Record<string, any[]>, item: any) => {
              const cat = item.category || 'Genel';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(item);
              return acc;
            }, {} as Record<string, any[]>);

            return (
              <div key={group.id} className="bg-white rounded-xl border overflow-hidden">
                {/* Ana Başlık */}
                <button
                  onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${group.color} rounded-xl flex items-center justify-center text-2xl`}>
                      {group.icon}
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-gray-900">{group.name}</h2>
                      <p className="text-sm text-gray-500">{items.length} ürün</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                      {Object.keys(subGrouped).length} alt kategori
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Alt Kategoriler ve Ürünler */}
                {isExpanded && (
                  <div className="border-t">
                    {(Object.entries(subGrouped) as [string, any[]][]).map(([subCat, subItems]) => (
                      <div key={subCat} className="border-b last:border-0">
                        {/* Alt Kategori Başlığı */}
                        <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
                          <span className="font-medium text-gray-700">{subCat}</span>
                          <span className="text-sm text-gray-500">{subItems.length} ürün</span>
                        </div>
                        {/* Ürünler */}
                        <div className="divide-y">
                          {subItems.map((item: any) => (
                            <MenuItemRow 
                              key={item.id} 
                              item={item} 
                              onEdit={() => setEditingItem(item)}
                              onDelete={handleDeleteItem}
                              onToggle={handleToggleAvailability}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && menuItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Menü ürünü bulunamadı</p>
          <div className="flex gap-3 justify-center">
            <a href="/menu/import" className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
              Menü İçe Aktar
            </a>
            <button onClick={() => setEditingItem({})} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              Manuel Ekle
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem.id ? editingItem : null}
          venueId={currentVenue?.id}
          onSave={async (data) => {
            if (editingItem.id) {
              await handleUpdateItem(editingItem.id, data);
            } else {
              await supabase.from('menu_items').insert({ ...data, venue_id: currentVenue?.id, is_available: true });
              fetchMenu();
            }
            setEditingItem(null);
          }}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

// Ürün Satırı
function MenuItemRow({ item, onEdit, onDelete, onToggle }: {
  item: any;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, status: boolean) => void;
}) {
  return (
    <div className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 group">
      <div className="flex items-center gap-4 flex-1">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-gray-500 truncate">{item.description}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="font-bold text-orange-600 text-lg">₺{item.price}</span>
        
        <span className={`px-2 py-1 rounded-full text-xs ${
          item.is_available !== false 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {item.is_available !== false ? 'Aktif' : 'Pasif'}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-blue-50 rounded-lg text-blue-500"
            title="Düzenle"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggle(item.id, item.is_available !== false)}
            className="p-2 hover:bg-amber-50 rounded-lg text-amber-500"
            title={item.is_available !== false ? 'Pasife Al' : 'Aktif Et'}
          >
            {item.is_available !== false ? '⏸️' : '▶️'}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 hover:bg-red-50 rounded-lg text-red-500"
            title="Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Düzenleme Modalı - GÖRSEL YÜKLEME ÖZELLİKLİ
function EditItemModal({ item, venueId, onSave, onClose }: {
  item: any;
  venueId?: string;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    price: item?.price?.toString() || '',
    category: item?.category || '',
    description: item?.description || '',
    image_url: item?.image_url || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Görsel yükleme state'leri
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(item?.image_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Kategorileri Supabase'den çek
  useEffect(() => {
    async function loadCategories() {
      if (!venueId) return;
      const { data } = await supabase
        .from('menu_categories')
        .select('name')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .order('display_order');
      if (data) {
        setCategories(data.map(c => c.name));
      }
    }
    loadCategories();
  }, [venueId]);

  // Dosya yükleme fonksiyonu
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Dosya boyutu 5MB\'dan küçük olmalı');
      return;
    }

    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Sadece JPG, PNG, WebP ve GIF dosyaları yüklenebilir');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Dosya adı oluştur (benzersiz)
      const fileExt = file.name.split('.').pop();
      const fileName = `${venueId || 'general'}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Supabase Storage'a yükle
      const { error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        if (error.message.includes('Bucket not found')) {
          setUploadError('Storage bucket bulunamadı. Supabase Dashboard\'dan "menu-images" bucket\'ı oluşturun.');
        } else {
          setUploadError(`Yükleme hatası: ${error.message}`);
        }
        return;
      }

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      // Form ve preview güncelle
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setPreviewUrl(publicUrl);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError('Beklenmeyen bir hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  // Drag & Drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  // File input change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Görseli kaldır
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    
    setIsSubmitting(true);
    await onSave({
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category || null,
      description: formData.description || null,
      image_url: formData.image_url || null,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold">{item ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Görsel Yükleme Alanı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Görseli</label>
            
            {previewUrl ? (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Önizleme" 
                  className="w-full h-48 object-cover rounded-xl border"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg shadow text-blue-600"
                    title="Değiştir"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg shadow text-red-600"
                    title="Kaldır"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                  transition-colors hover:border-orange-400 hover:bg-orange-50
                  ${isUploading ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}
                `}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-2" />
                    <p className="text-sm text-gray-600">Yükleniyor...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-orange-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Görsel yüklemek için tıklayın veya sürükleyin
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, WebP, GIF • Max 5MB
                    </p>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />

            {uploadError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <X className="w-4 h-4" />
                {uploadError}
              </p>
            )}

            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Görsel URL\'si girin:');
                  if (url) {
                    setFormData(prev => ({ ...prev, image_url: url }));
                    setPreviewUrl(url);
                  }
                }}
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <ImageIcon className="w-4 h-4" />
                URL ile ekle
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺) *</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Seçin...</option>
              {categories.map((cat, index) => (
              <option key={`${cat}-${index}`} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Kaydet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}