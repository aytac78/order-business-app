'use client';

import { useVenueStore } from '@/stores';
import { Users, AlertCircle } from 'lucide-react';

export default function CRMPage() {
  const { currentVenue } = useVenueStore();

  if (!currentVenue) {
    return <div className="flex items-center justify-center h-96"><AlertCircle className="w-12 h-12 text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Müşteri CRM</h1>
        <p className="text-gray-500 mt-1">{currentVenue.name}</p>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
        <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-blue-800 mb-2">CRM Tablosu Bulunamadı</h2>
        <p className="text-blue-700">Supabase'de customers tablosu henüz oluşturulmamış.</p>
        <p className="text-sm text-blue-600 mt-2">Bu özellik ileride aktif edilecek.</p>
      </div>
    </div>
  );
}
