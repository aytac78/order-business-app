'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Plus, X, Edit2, Trash2, AlertCircle, Loader2, RefreshCw,
  Calendar, Clock, User, ChevronLeft, ChevronRight, Play,
  CheckCircle, XCircle, Coffee
} from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  role: string;
}

interface Shift {
  id: string;
  venue_id: string;
  staff_id: string;
  staff?: Staff;
  date: string;
  start_time: string;
  end_time: string;
  actual_start?: string;
  actual_end?: string;
  break_minutes: number;
  notes?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed';
}

export default function ShiftsPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('shifts');
  const tStaff = useTranslations('staff');
  const tCommon = useTranslations('common');

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Status config
  const statusConfig = {
    scheduled: { label: t('scheduled'), color: 'bg-blue-500', icon: Calendar },
    in_progress: { label: t('inProgress'), color: 'bg-green-500', icon: Play },
    completed: { label: t('completed'), color: 'bg-gray-500', icon: CheckCircle },
    missed: { label: t('missed'), color: 'bg-red-500', icon: XCircle },
  };

  const loadData = useCallback(async () => {
    if (!currentVenue?.id) return;

    // Load staff
    const { data: staffData } = await supabase
      .from('staff')
      .select('id, name, role')
      .eq('venue_id', currentVenue.id)
      .eq('is_active', true)
      .order('name');

    if (staffData) setStaffList(staffData);

    // Load shifts for selected date (or week)
    let startDate = selectedDate;
    let endDate = selectedDate;

    if (viewMode === 'week') {
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay();
      const monday = new Date(date);
      monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      startDate = monday.toISOString().split('T')[0];
      endDate = sunday.toISOString().split('T')[0];
    }

    const { data: shiftsData } = await supabase
      .from('shifts')
      .select('*, staff:staff_id(id, name, role)')
      .eq('venue_id', currentVenue.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('start_time');

    if (shiftsData) setShifts(shiftsData);
    setLoading(false);
  }, [currentVenue?.id, selectedDate, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleSaveShift = async (data: Partial<Shift>) => {
    if (!currentVenue?.id) return;

    if (editingShift) {
      await supabase.from('shifts').update(data).eq('id', editingShift.id);
    } else {
      await supabase.from('shifts').insert({
        ...data,
        venue_id: currentVenue.id,
        status: 'scheduled'
      });
    }

    setShowModal(false);
    setEditingShift(null);
    loadData();
  };

  const handleStartShift = async (shift: Shift) => {
    await supabase.from('shifts').update({
      status: 'in_progress',
      actual_start: new Date().toTimeString().slice(0, 5)
    }).eq('id', shift.id);
    loadData();
  };

  const handleEndShift = async (shift: Shift) => {
    await supabase.from('shifts').update({
      status: 'completed',
      actual_end: new Date().toTimeString().slice(0, 5)
    }).eq('id', shift.id);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tCommon('confirmDelete'))) return;
    await supabase.from('shifts').delete().eq('id', id);
    loadData();
  };

  const calculateHours = (start: string, end: string, breakMins: number = 0) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const totalMins = (endH * 60 + endM) - (startH * 60 + startM) - breakMins;
    return (totalMins / 60).toFixed(1);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Stats
  const todayShifts = shifts.filter(s => s.date === new Date().toISOString().split('T')[0]);
  const stats = {
    total: shifts.length,
    inProgress: todayShifts.filter(s => s.status === 'in_progress').length,
    scheduled: todayShifts.filter(s => s.status === 'scheduled').length,
    totalHours: shifts.reduce((sum, s) => sum + parseFloat(calculateHours(s.start_time, s.end_time, s.break_minutes)), 0),
  };

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">{tCommon('selectVenue')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400">{currentVenue.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
          <button type="button"
            onClick={() => { setEditingShift(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addShift')}
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-gray-800 rounded-xl p-4">
        <button type="button"
          onClick={() => changeDate(viewMode === 'week' ? -7 : -1)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'day' ? 'bg-orange-500 text-white' : 'text-gray-400'
              }`}
            >
              {t('dayView')}
            </button>
            <button type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week' ? 'bg-orange-500 text-white' : 'text-gray-400'
              }`}
            >
              {t('weekView')}
            </button>
          </div>
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
          />
          
          {!isToday && (
            <button type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm"
            >
              {tCommon('today')}
            </button>
          )}
        </div>

        <button type="button"
          onClick={() => changeDate(viewMode === 'week' ? 7 : 1)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">{tCommon('total')} {t('title')}</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <p className="text-green-400 text-sm">{t('inProgress')}</p>
          <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
        </div>
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
          <p className="text-blue-400 text-sm">{t('scheduled')}</p>
          <p className="text-2xl font-bold text-white">{stats.scheduled}</p>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
          <p className="text-purple-400 text-sm">{t('totalHours')}</p>
          <p className="text-2xl font-bold text-white">{stats.totalHours.toFixed(1)}h</p>
        </div>
      </div>

      {/* Shifts List */}
      <div className="space-y-4">
        {shifts.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{t('noShifts')}</p>
          </div>
        ) : (
          shifts.map(shift => {
            const status = statusConfig[shift.status];
            const StatusIcon = status.icon;
            const hours = calculateHours(shift.start_time, shift.end_time, shift.break_minutes);

            return (
              <div
                key={shift.id}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Time */}
                    <div className="text-center bg-gray-700 rounded-xl px-4 py-2 min-w-[100px]">
                      <p className="text-lg font-bold text-white">{shift.start_time}</p>
                      <p className="text-xs text-gray-400">{shift.end_time}</p>
                    </div>

                    {/* Staff Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{shift.staff?.name || '-'}</p>
                        <p className="text-sm text-gray-400">{shift.staff?.role || '-'}</p>
                      </div>
                    </div>

                    {/* Hours & Break */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {hours}h
                      </span>
                      {shift.break_minutes > 0 && (
                        <span className="flex items-center gap-1">
                          <Coffee className="w-4 h-4" />
                          {shift.break_minutes} dk
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status */}
                    <span className={`flex items-center gap-2 px-3 py-1.5 ${status.color} text-white text-sm rounded-full`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {shift.status === 'scheduled' && (
                        <button type="button"
                          onClick={() => handleStartShift(shift)}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                          title={t('startShift')}
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {shift.status === 'in_progress' && (
                        <button type="button"
                          onClick={() => handleEndShift(shift)}
                          className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                          title={t('endShift')}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button type="button"
                        onClick={() => { setEditingShift(shift); setShowModal(true); }}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button type="button"
                        onClick={() => handleDelete(shift.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {shift.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-sm text-gray-400">{shift.notes}</p>
                  </div>
                )}

                {/* Actual Times */}
                {(shift.actual_start || shift.actual_end) && (
                  <div className="mt-3 pt-3 border-t border-gray-700 flex gap-4 text-sm">
                    {shift.actual_start && (
                      <span className="text-green-400">{t('actualStart')}: {shift.actual_start}</span>
                    )}
                    {shift.actual_end && (
                      <span className="text-gray-400">{t('actualEnd')}: {shift.actual_end}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Shift Modal */}
      {showModal && (
        <ShiftModal
          shift={editingShift}
          staffList={staffList}
          selectedDate={selectedDate}
          t={t}
          tStaff={tStaff}
          tCommon={tCommon}
          onClose={() => { setShowModal(false); setEditingShift(null); }}
          onSave={handleSaveShift}
        />
      )}
    </div>
  );
}

// Shift Modal
function ShiftModal({
  shift, staffList, selectedDate, t, tStaff, tCommon, onClose, onSave
}: {
  shift: Shift | null;
  staffList: Staff[];
  selectedDate: string;
  t: any;
  tStaff: any;
  tCommon: any;
  onClose: () => void;
  onSave: (data: Partial<Shift>) => void;
}) {
  const [staffId, setStaffId] = useState(shift?.staff_id || staffList[0]?.id || '');
  const [date, setDate] = useState(shift?.date || selectedDate);
  const [startTime, setStartTime] = useState(shift?.start_time || '09:00');
  const [endTime, setEndTime] = useState(shift?.end_time || '17:00');
  const [breakMinutes, setBreakMinutes] = useState(shift?.break_minutes?.toString() || '60');
  const [notes, setNotes] = useState(shift?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      staff_id: staffId,
      date,
      start_time: startTime,
      end_time: endTime,
      break_minutes: parseInt(breakMinutes) || 0,
      notes: notes || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {shift ? t('editShift') : t('addShift')}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{tStaff('title')}</label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            >
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('shiftDate')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('startTime')}</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('endTime')}</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('breakTime')} (dk)</label>
            <input
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
              min="0"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{tCommon('notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button"
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
            >
              {tCommon('cancel')}
            </button>
            <button type="button"
              type="submit"
              className="flex-1 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
            >
              {tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}