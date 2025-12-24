'use client';

import { useState, useEffect } from 'react';
import { useTableStore, useVenueStore, TableWithDetails } from '@/stores';
import { Grid3X3, Users, Plus, Edit2, Trash2, X, Check, Clock, AlertCircle, Search, Filter } from 'lucide-react';

const statusConfig = {
  available: { label: 'Boş', color: 'bg-green-100 text-green-700 border-green-300' },
  occupied: { label: 'Dolu', color: 'bg-red-100 text-red-700 border-red-300' },
  reserved: { label: 'Rezerve', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  cleaning: { label: 'Temizlik', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
};

export default function TablesPage() {
  const { currentVenue } = useVenueStore();
  const { tables, sections, updateTable, addTable, deleteTable } = useTableStore();
  const [mounted, setMounted] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableWithDetails | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => { setMounted(true); }, []);

  const filteredTables = tables.filter(t => {
    const matchesSection = selectedSection === 'all' || t.section === selectedSection;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSection && matchesStatus;
  });

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  const handleStatusChange = (tableId: string, status: TableWithDetails['status']) => {
    updateTable(tableId, { status, currentOrder: status === 'available' ? undefined : tables.find(t => t.id === tableId)?.currentOrder });
  };

  const handleSaveTable = (data: Partial<TableWithDetails>) => {
    if (editingTable) {
      updateTable(editingTable.id, data);
    } else {
      addTable({
        id: `table-${Date.now()}`,
        number: data.number || '',
        capacity: data.capacity || 4,
        section: data.section || sections[0],
        status: 'available',
        shape: data.shape || 'square',
        position: { x: 0, y: 0 },
      });
    }
    setShowAddModal(false);
    setEditingTable(null);
  };

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Masa yönetimi için lütfen bir mekan seçin.</p>
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
          <p className="text-gray-500">{currentVenue?.name} • {tables.length} masa</p>
        </div>
        <button onClick={() => { setEditingTable(null); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
          <Plus className="w-4 h-4" />Yeni Masa
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Grid3X3 className="w-5 h-5 text-gray-600" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-gray-500">Toplam Masa</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Check className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-green-600">{stats.available}</p><p className="text-xs text-gray-500">Boş</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><Users className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold text-red-600">{stats.occupied}</p><p className="text-xs text-gray-500">Dolu</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Clock className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-blue-600">{stats.reserved}</p><p className="text-xs text-gray-500">Rezerve</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          <button onClick={() => setSelectedSection('all')} className={`px-4 py-2 rounded-lg font-medium ${selectedSection === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Tümü</button>
          {sections.map(section => (
            <button key={section} onClick={() => setSelectedSection(section)} className={`px-4 py-2 rounded-lg font-medium ${selectedSection === section ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{section}</button>
          ))}
        </div>
        <div className="flex-1" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="all">Tüm Durumlar</option>
          <option value="available">Boş</option>
          <option value="occupied">Dolu</option>
          <option value="reserved">Rezerve</option>
          <option value="cleaning">Temizlik</option>
        </select>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredTables.map(table => (
          <div key={table.id} className={`bg-white rounded-xl border-2 overflow-hidden ${statusConfig[table.status].color}`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-lg">{table.number}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[table.status].color}`}>
                  {statusConfig[table.status].label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Users className="w-4 h-4" />
                <span>{table.capacity} kişilik</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">{table.section}</p>
              
              {table.currentOrder && (
                <div className="p-2 bg-gray-50 rounded-lg mb-3">
                  <p className="text-xs text-gray-500">{table.currentOrder.waiter}</p>
                  <p className="font-bold text-orange-600">₺{table.currentOrder.total}</p>
                  <p className="text-xs text-gray-400">{table.currentOrder.duration} dk</p>
                </div>
              )}
              
              {table.reservation && (
                <div className="p-2 bg-blue-50 rounded-lg mb-3">
                  <p className="font-medium text-blue-700">{table.reservation.name}</p>
                  <p className="text-xs text-blue-600">{table.reservation.time} • {table.reservation.guests} kişi</p>
                </div>
              )}
              
              <div className="flex gap-1">
                <select value={table.status} onChange={(e) => handleStatusChange(table.id, e.target.value as any)} className="flex-1 px-2 py-1.5 text-xs border rounded-lg">
                  <option value="available">Boş</option>
                  <option value="occupied">Dolu</option>
                  <option value="reserved">Rezerve</option>
                  <option value="cleaning">Temizlik</option>
                </select>
                <button onClick={() => { setEditingTable(table); setShowAddModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingTable ? 'Masa Düzenle' : 'Yeni Masa'}</h2>
              <button onClick={() => { setShowAddModal(false); setEditingTable(null); }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); handleSaveTable({ number: f.get('number') as string, capacity: parseInt(f.get('capacity') as string), section: f.get('section') as string, shape: f.get('shape') as any }); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Masa Numarası</label>
                <input name="number" defaultValue={editingTable?.number} required className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kapasite</label>
                <input name="capacity" type="number" min="1" defaultValue={editingTable?.capacity || 4} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bölüm</label>
                <select name="section" defaultValue={editingTable?.section || sections[0]} className="w-full px-4 py-2 border rounded-xl">
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Şekil</label>
                <select name="shape" defaultValue={editingTable?.shape || 'square'} className="w-full px-4 py-2 border rounded-xl">
                  <option value="square">Kare</option>
                  <option value="round">Yuvarlak</option>
                  <option value="rectangle">Dikdörtgen</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingTable(null); }} className="flex-1 py-3 border rounded-xl">İptal</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
