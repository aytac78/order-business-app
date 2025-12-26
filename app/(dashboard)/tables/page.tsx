'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Users,
  RefreshCw,
  Edit,
  Trash2,
  X,
  Armchair,
  CircleDot,
  Square,
  RectangleHorizontal,
  AlertCircle,
  Bell
} from 'lucide-react';

interface ActiveOrder {
  id: string;
  order_number: string;
  table_number: string;
  status: string;
  total: number;
  items: any[];
  created_at: string;
}

const statusConfig = {
  available: { label: 'Boş', color: 'bg-green-100 border-green-300 text-green-700' },
  occupied: { label: 'Dolu', color: 'bg-red-100 border-red-300 text-red-700' },
  reserved: { label: 'Rezerve', color: 'bg-amber-100 border-amber-300 text-amber-700' },
  cleaning: { label: 'Temizleniyor', color: 'bg-blue-100 border-blue-300 text-blue-700' },
};

const shapeIcons = {
  square: Square,
  round: CircleDot,
  rectangle: RectangleHorizontal,
};

export default function TablesPage() {
  const { currentVenue } = useVenueStore();
  const [tables, setTables] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Masaları Supabase'den yükle
  const loadTables = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('is_available', true)
      .order('table_number');
    
    const formattedTables = (data || []).map(t => ({
      ...t,
      number: t.table_number,
      status: t.status || 'available',
      shape: t.shape || 'square',
      section: t.section || 'İç Mekan',
      position: { x: t.position_x || 0, y: t.position_y || 0 }
    }));
    setTables(formattedTables);
    setIsLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Masa ekle
  const addTable = async (tableData: any) => {
    if (!currentVenue?.id) return;
    const { error } = await supabase
      .from('tables')
      .insert({
        venue_id: currentVenue.id,
        table_number: tableData.number,
        capacity: tableData.capacity,
        section: tableData.section,
        shape: tableData.shape,
        status: 'available',
        is_available: true
      });
    if (!error) loadTables();
  };

  // Masa güncelle
  const updateTable = async (id: string, updates: any) => {
    const { error } = await supabase
      .from('tables')
      .update({
        status: updates.status,
        capacity: updates.capacity,
        section: updates.section
      })
      .eq('id', id);
    if (!error) loadTables();
  };

  // Masa sil
  const deleteTable = async (id: string) => {
    const { error } = await supabase
      .from('tables')
      .update({ is_available: false })
      .eq('id', id);
    if (!error) loadTables();
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);

  // Siparişleri yükle
  const fetchOrders = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .not('table_number', 'is', null);

    setActiveOrders(ordersData || []);
    setIsLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    fetchOrders();

    if (currentVenue?.id) {
      const channel = supabase
        .channel('tables-orders')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` },
          () => fetchOrders()
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [currentVenue?.id, fetchOrders]);

  // Masa siparişi al
  const getTableOrder = (tableNumber: string) => {
    return activeOrders.filter(o => o.table_number === tableNumber);
  };

  // Bölümler
  const sections = ['all', ...new Set(tables.map(t => t.section))];

  // Filtreli masalar
  const filteredTables = selectedSection === 'all' 
    ? tables 
    : tables.filter(t => t.section === selectedSection);

  // İstatistikler
  const stats = {
    available: tables.filter(t => !getTableOrder(t.number).length && t.status !== 'reserved' && t.status !== 'cleaning').length,
    occupied: tables.filter(t => getTableOrder(t.number).length > 0).length,
    reserved: tables.filter(t => t.status === 'reserved' && !getTableOrder(t.number).length).length,
    cleaning: tables.filter(t => t.status === 'cleaning' && !getTableOrder(t.number).length).length,
  };

  // Masa ekle
  const handleSaveTable = (tableData: any) => {
    if (editingTable) {
      updateTable(editingTable.id, tableData);
    } else {
      const newTable = {
        id: Date.now().toString(),
        ...tableData,
        position: { x: 0, y: 0 }
      };
      addTable(newTable);
    }
    setShowAddModal(false);
    setEditingTable(null);
  };

  // Masa sil
  const handleDeleteTable = (id: string) => {
    if (!confirm('Bu masayı silmek istediğinize emin misiniz?')) return;
    deleteTable(id);
  };

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-500">Lütfen bir mekan seçin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Masa Yönetimi</h1>
          <p className="text-gray-500">{currentVenue.name} • {tables.length} masa</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Plus className="w-4 h-4" />
            Masa Ekle
          </button>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-green-600 text-sm font-medium">Boş</p>
          <p className="text-3xl font-bold text-green-700">{stats.available}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-red-600 text-sm font-medium">Dolu</p>
          <p className="text-3xl font-bold text-red-700">{stats.occupied}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <p className="text-amber-600 text-sm font-medium">Rezerve</p>
          <p className="text-3xl font-bold text-amber-700">{stats.reserved}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-blue-600 text-sm font-medium">Temizleniyor</p>
          <p className="text-3xl font-bold text-blue-700">{stats.cleaning}</p>
        </div>
      </div>

      {/* Bölüm Filtreleri */}
      <div className="flex items-center gap-2 flex-wrap">
        {sections.map(section => (
          <button
            key={section}
            onClick={() => setSelectedSection(section)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedSection === section
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {section === 'all' ? 'Tümü' : section} ({section === 'all' ? tables.length : tables.filter(t => t.section === section).length})
          </button>
        ))}
      </div>

      {/* Masalar Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredTables.map(table => {
          const tableOrders = getTableOrder(table.number);
          const hasOrder = tableOrders.length > 0;
          const hasReadyOrder = tableOrders.some(o => o.status === 'ready');
          const totalAmount = tableOrders.reduce((sum, o) => sum + (o.total || 0), 0);
          const ShapeIcon = shapeIcons[table.shape as keyof typeof shapeIcons] || Square;
          
          // Gerçek durum (siparişe göre)
          const realStatus = hasOrder ? 'occupied' : table.status;
          const config = statusConfig[realStatus as keyof typeof statusConfig] || statusConfig.available;

          return (
            <div
              key={table.id}
              className={`relative p-4 rounded-xl border-2 ${config.color} ${
                hasReadyOrder ? 'ring-2 ring-green-500 animate-pulse' : ''
              }`}
            >
              {/* Hazır bildirimi */}
              {hasReadyOrder && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                  <Bell className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Sipariş sayısı */}
              {hasOrder && !hasReadyOrder && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{tableOrders.length}</span>
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{table.number}</h3>
                  <p className="text-xs opacity-70">{table.section}</p>
                </div>
                <ShapeIcon className="w-6 h-6 opacity-50" />
              </div>

              <div className="flex items-center gap-2 text-sm mb-2">
                <Users className="w-4 h-4" />
                <span>{table.capacity} kişilik</span>
              </div>

              <p className={`text-sm font-medium ${hasOrder ? 'text-red-700' : ''}`}>
                {hasReadyOrder ? '🔔 HAZIR!' : config.label}
              </p>

              {/* Sipariş bilgisi */}
              {hasOrder && (
                <div className="mt-2 pt-2 border-t border-current/20">
                  <p className="text-xs font-medium">₺{totalAmount.toLocaleString()}</p>
                  <p className="text-xs opacity-70">{tableOrders.length} sipariş</p>
                </div>
              )}

              {/* Aksiyonlar */}
              <div className="flex items-center gap-1 mt-3">
                <button
                  onClick={() => { setEditingTable(table); setShowAddModal(true); }}
                  className="p-1.5 hover:bg-black/10 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="p-1.5 hover:bg-black/10 rounded text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <Armchair className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Henüz masa eklenmemiş</p>
        </div>
      )}

      {/* Masa Ekle/Düzenle Modal */}
      {showAddModal && (
        <TableModal
          table={editingTable}
          onSave={handleSaveTable}
          onClose={() => { setShowAddModal(false); setEditingTable(null); }}
        />
      )}
    </div>
  );
}

// Masa Modal
function TableModal({
  table,
  onSave,
  onClose
}: {
  table: any;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    number: table?.number || '',
    capacity: table?.capacity || 4,
    section: table?.section || 'İç Mekan',
    shape: table?.shape || 'square' as 'square' | 'round' | 'rectangle',
    status: table?.status || 'available' as 'available' | 'reserved' | 'cleaning',
  });

  const sections = ['İç Mekan', 'Bahçe', 'Teras', 'VIP', 'Bar'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">{table ? 'Masa Düzenle' : 'Yeni Masa'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Masa No</label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="1, 2, VIP1..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kapasite</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border rounded-lg"
                min={1}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bölüm</label>
            <select
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şekil</label>
            <div className="flex gap-2">
              {(['square', 'round', 'rectangle'] as const).map(shape => {
                const Icon = shapeIcons[shape as keyof typeof shapeIcons];
                return (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => setFormData({ ...formData, shape })}
                    className={`flex-1 p-3 rounded-lg border-2 ${
                      formData.shape === shape ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="available">Boş</option>
              <option value="reserved">Rezerve</option>
              <option value="cleaning">Temizleniyor</option>
            </select>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
