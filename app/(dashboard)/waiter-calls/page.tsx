'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Bell, AlertCircle, Loader2, RefreshCw, CheckCircle, XCircle,
  User, Receipt, HelpCircle, Clock, Volume2, VolumeX, Trash2
} from 'lucide-react';

interface WaiterCall {
  id: string;
  venue_id: string;
  table_id: string;
  table_number: string;
  type: 'waiter' | 'bill' | 'assistance';
  status: 'pending' | 'answered' | 'dismissed';
  created_at: string;
  answered_at?: string;
  answered_by?: string;
}

export default function WaiterCallsPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('waiterCalls');
  const tCommon = useTranslations('common');

  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<string>('pending');

  // Call type config
  const callTypeConfig = {
    waiter: { label: t('waiterRequest'), icon: User, color: 'bg-blue-500' },
    bill: { label: t('billRequest'), icon: Receipt, color: 'bg-green-500' },
    assistance: { label: t('assistanceRequest'), icon: HelpCircle, color: 'bg-purple-500' },
  };

  const loadCalls = useCallback(async () => {
    if (!currentVenue?.id) return;

    const { data } = await supabase
      .from('waiter_calls')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setCalls(data);
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadCalls();

    // Real-time subscription
    if (!currentVenue?.id) return;
    
    const channel = supabase
      .channel('waiter-calls')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'waiter_calls',
        filter: `venue_id=eq.${currentVenue.id}`
      }, () => {
        loadCalls();
        if (soundEnabled) {
          // Play notification sound
          try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.play();
          } catch (e) {
            console.log('Sound not available');
          }
        }
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadCalls, soundEnabled]);

  const handleAnswer = async (call: WaiterCall) => {
    await supabase.from('waiter_calls').update({
      status: 'answered',
      answered_at: new Date().toISOString()
    }).eq('id', call.id);
    loadCalls();
  };

  const handleDismiss = async (call: WaiterCall) => {
    await supabase.from('waiter_calls').update({
      status: 'dismissed'
    }).eq('id', call.id);
    loadCalls();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('waiter_calls').delete().eq('id', id);
    loadCalls();
  };

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Az önce';
    if (mins < 60) return `${mins} dk`;
    return `${Math.floor(mins / 60)} sa ${mins % 60} dk`;
  };

  // Filter calls
  const filteredCalls = calls.filter(call => {
    if (filter === 'all') return true;
    return call.status === filter;
  });

  // Stats
  const stats = {
    total: calls.length,
    pending: calls.filter(c => c.status === 'pending').length,
    answered: calls.filter(c => c.status === 'answered').length,
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
          <p className="text-gray-400">{stats.pending} bekleyen çağrı</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              soundEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
            } text-white`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Ses {soundEnabled ? 'Açık' : 'Kapalı'}
          </button>
          <button
            onClick={loadCalls}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Bell className="w-10 h-10 text-amber-400 bg-amber-400/20 rounded-xl p-2 animate-pulse" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-sm text-amber-400">{t('pendingCalls')}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-10 h-10 text-green-400 bg-green-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.answered}</p>
              <p className="text-sm text-green-400">{t('answeredCalls')}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <Clock className="w-10 h-10 text-gray-400 bg-gray-700 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400">{tCommon('total')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['pending', 'answered', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl transition-colors ${
              filter === f
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {f === 'pending' ? t('pendingCalls') : f === 'answered' ? t('answeredCalls') : tCommon('all')}
          </button>
        ))}
      </div>

      {/* Calls List */}
      <div className="space-y-4">
        {filteredCalls.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{t('noCalls')}</p>
          </div>
        ) : (
          filteredCalls.map(call => {
            const typeInfo = callTypeConfig[call.type];
            const TypeIcon = typeInfo.icon;
            const isPending = call.status === 'pending';

            return (
              <div
                key={call.id}
                className={`bg-gray-800 rounded-xl p-4 border transition-all ${
                  isPending 
                    ? 'border-amber-500 bg-amber-500/5 animate-pulse' 
                    : 'border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 ${typeInfo.color} rounded-xl flex items-center justify-center ${isPending ? 'animate-bounce' : ''}`}>
                      <TypeIcon className="w-7 h-7 text-white" />
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-white">Masa {call.table_number}</span>
                        <span className={`px-2 py-0.5 ${typeInfo.color} text-white text-xs rounded-full`}>
                          {typeInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {getTimeSince(call.created_at)}
                        </span>
                        {call.status === 'answered' && call.answered_at && (
                          <span className="text-green-400">
                            ✓ {getTimeSince(call.answered_at)} önce cevaplandı
                          </span>
                        )}
                        {call.status === 'dismissed' && (
                          <span className="text-gray-500">Kapatıldı</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleAnswer(call)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {t('answer')}
                        </button>
                        <button
                          onClick={() => handleDismiss(call)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl"
                        >
                          <XCircle className="w-4 h-4" />
                          {t('dismiss')}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(call.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
