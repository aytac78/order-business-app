'use client';

import { useState } from 'react';
import { useReservations } from '@/hooks/useSupabase';
import { useVenueStore } from '@/stores';
import { Calendar, Clock, Users, Phone, Plus, RefreshCw, AlertCircle, Search, X } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Onaylandı', color: 'bg-green-100 text-green-800' },
  seated: { label: 'Oturdu', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Tamamlandı', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'İptal', color: 'bg-red-100 text-red-800' },
  no_show: { label: 'Gelmedi', color: 'bg-red-100 text-red-800' },
};

export default function ReservationsPage() {
  const { reservations, isLoading, fetchReservations, createReservation, updateReservation } = useReservations();
  const { currentVenue } = useVenueStore();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = res.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !!dateFilter || res.reservation_date === dateFilter;
    return matchesSearch && matchesDate;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateReservation(id, { status: newStatus });
  };

  const handleCreate = async (data: any) => {
    await createReservation(data);
    setShowModal(false);
  };

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rezervasyonlar</h1>
          <p className="text-gray-500 mt-1">{currentVenue.name}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fetchReservations()} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Yenile
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg">
            <Plus className="w-4 h-4" /> Yeni
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-4 py-2 border rounded-lg" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReservations.map((res) => (
            <div key={res.id} className="bg-white rounded-xl border p-4">
              <div className="flex justify-between mb-3">
                <div>
                  <h3 className="font-bold">{res.customer_name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[res.status]?.color}`}>
                    {statusConfig[res.status]?.label}
                  </span>
                </div>
                <select value={res.status} onChange={(e) => handleStatusChange(res.id, e.target.value)} className="text-xs border rounded px-2">
                  {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {res.reservation_date}</div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {res.reservation_time}</div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4" /> {res.party_size} kişi</div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {res.customer_phone}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Yeni Rezervasyon</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <ReservationForm onSave={handleCreate} onCancel={() => setShowModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function ReservationForm({ onSave, onCancel }: { onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', date: new Date().toISOString().split('T')[0],
    time: '19:00', party_size: 2, notes: '', status: 'pending'
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <input type="text" placeholder="İsim" required value={form.customer_name}
        onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
      <input type="tel" placeholder="Telefon" required value={form.customer_phone}
        onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
      <div className="grid grid-cols-2 gap-4">
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="px-4 py-2 border rounded-lg" />
        <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="px-4 py-2 border rounded-lg" />
      </div>
      <input type="number" min="1" placeholder="Kişi" value={form.party_size}
        onChange={(e) => setForm({ ...form, party_size: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" />
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border rounded-lg">İptal</button>
        <button type="submit" className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg">Kaydet</button>
      </div>
    </form>
  );
}
