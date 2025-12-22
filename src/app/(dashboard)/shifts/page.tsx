'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import {
  Clock,
  Calendar,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'active' | 'completed' | 'absent';
}

const demoShifts: Shift[] = [
  { id: '1', staffId: '1', staffName: 'Ahmet Yılmaz', role: 'Garson', date: '2025-01-15', startTime: '10:00', endTime: '18:00', status: 'active' },
  { id: '2', staffId: '2', staffName: 'Mehmet Demir', role: 'Garson', date: '2025-01-15', startTime: '18:00', endTime: '02:00', status: 'scheduled' },
  { id: '3', staffId: '3', staffName: 'Ayşe Kaya', role: 'Kasiyer', date: '2025-01-15', startTime: '10:00', endTime: '22:00', status: 'active' },
  { id: '4', staffId: '4', staffName: 'Fatma Şahin', role: 'Mutfak', date: '2025-01-15', startTime: '08:00', endTime: '16:00', status: 'completed' },
  { id: '5', staffId: '5', staffName: 'Ali Öztürk', role: 'Mutfak', date: '2025-01-15', startTime: '14:00', endTime: '22:00', status: 'active' },
  { id: '6', staffId: '6', staffName: 'Zeynep Arslan', role: 'Barmen', date: '2025-01-15', startTime: '18:00', endTime: '02:00', status: 'scheduled' },
  { id: '7', staffId: '1', staffName: 'Ahmet Yılmaz', role: 'Garson', date: '2025-01-16', startTime: '10:00', endTime: '18:00', status: 'scheduled' },
  { id: '8', staffId: '3', staffName: 'Ayşe Kaya', role: 'Kasiyer', date: '2025-01-16', startTime: '10:00', endTime: '22:00', status: 'scheduled' },
];

const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00'];

export default function ShiftsPage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>(demoShifts);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState('2025-01-15');

  useEffect(() => {
    setMounted(true);
  }, []);

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const todayShifts = shifts.filter(s => s.date === selectedDate);

  const getStatusColor = (status: Shift['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 border-green-300 text-green-800';
      case 'scheduled': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'completed': return 'bg-gray-100 border-gray-300 text-gray-600';
      case 'absent': return 'bg-red-100 border-red-300 text-red-800';
    }
  };

  if (!mounted) {
    return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;
  }

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Vardiya yönetimi için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vardiyalar</h1>
          <p className="text-gray-500 mt-1">Personel vardiyalarını planlayın ve yönetin</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Vardiya Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aktif Çalışan</p>
              <p className="text-xl font-bold text-gray-900">{shifts.filter(s => s.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bugün Vardiya</p>
              <p className="text-xl font-bold text-gray-900">{todayShifts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Haftalık Saat</p>
              <p className="text-xl font-bold text-gray-900">248</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Boş Vardiya</p>
              <p className="text-xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-gray-900">
              {weekDates[0].toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </h3>
            <button 
              onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg font-medium ${viewMode === 'week' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
            >
              Hafta
            </button>
            <button 
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-lg font-medium ${viewMode === 'day' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
            >
              Gün
            </button>
          </div>
        </div>

        {/* Week View */}
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayShifts = shifts.filter(s => s.date === dateStr);
            const isToday = dateStr === '2025-01-15';
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dateStr)}
                className={`p-3 rounded-xl text-center transition-all ${
                  isSelected ? 'bg-orange-500 text-white' : 
                  isToday ? 'bg-orange-50 border-2 border-orange-500' : 
                  'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <p className="text-xs font-medium opacity-70">{weekDays[i]}</p>
                <p className="text-lg font-bold">{date.getDate()}</p>
                <p className={`text-xs ${isSelected ? 'text-orange-100' : 'text-gray-500'}`}>
                  {dayShifts.length} vardiya
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Shifts */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          {new Date(selectedDate).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} Vardiyaları
        </h3>
        <div className="space-y-3">
          {todayShifts.map(shift => (
            <div key={shift.id} className={`flex items-center justify-between p-4 rounded-xl border ${getStatusColor(shift.status)}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                  {shift.staffName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium">{shift.staffName}</p>
                  <p className="text-sm opacity-70">{shift.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="font-bold">{shift.startTime} - {shift.endTime}</p>
                  <p className="text-xs opacity-70">8 saat</p>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 hover:bg-white/50 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-white/50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
