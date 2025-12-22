'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, User, Coffee, CreditCard, HelpCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useVenueStore } from '@/stores'

interface WaiterCall {
  id: string
  table_number: string
  anonymous_id: string
  call_type: 'waiter' | 'bill' | 'help'
  status: 'pending' | 'acknowledged' | 'completed'
  created_at: string
}

const callTypeConfig = {
  waiter: { icon: Coffee, label: 'Garson Çağrısı', color: 'bg-blue-500' },
  bill: { icon: CreditCard, label: 'Hesap İstendi', color: 'bg-green-500' },
  help: { icon: HelpCircle, label: 'Yardım', color: 'bg-purple-500' }
}

export default function WaiterCallsPage() {
  const { currentVenue } = useVenueStore()
  const [calls, setCalls] = useState<WaiterCall[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    if (currentVenue) {
      loadCalls()
      const channel = supabase.channel('waiter-calls')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'waiter_calls', filter: `venue_id=eq.${currentVenue.id}` }, (payload) => {
          setCalls(prev => [payload.new as WaiterCall, ...prev])
          if (soundEnabled) new Audio('/notification.mp3').play().catch(() => {})
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'waiter_calls' }, loadCalls)
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [currentVenue, soundEnabled])

  const loadCalls = async () => {
    if (!currentVenue) return
    const { data } = await supabase.from('waiter_calls').select('*').eq('venue_id', currentVenue.id).in('status', ['pending', 'acknowledged']).order('created_at', { ascending: false })
    if (data) setCalls(data)
  }

  const acknowledgeCall = async (id: string) => {
    await supabase.from('waiter_calls').update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() }).eq('id', id)
    loadCalls()
  }

  const completeCall = async (id: string) => {
    await supabase.from('waiter_calls').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id)
    setCalls(prev => prev.filter(c => c.id !== id))
  }

  const formatTime = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000 / 60)
    if (diff < 1) return 'Şimdi'
    if (diff < 60) return `${diff} dk önce`
    return new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  const pendingCalls = calls.filter(c => c.status === 'pending')
  const acknowledgedCalls = calls.filter(c => c.status === 'acknowledged')

  if (!currentVenue) return <div className="flex items-center justify-center h-96"><p className="text-gray-500">Lütfen bir mekan seçin</p></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Garson Çağrıları</h1><p className="text-gray-500">{pendingCalls.length} bekleyen çağrı</p></div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className={`px-4 py-2 rounded-xl flex items-center gap-2 ${soundEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}><Bell className="w-4 h-4" />Ses {soundEnabled ? 'Açık' : 'Kapalı'}</button>
      </div>

      {pendingCalls.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />Bekleyen ({pendingCalls.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingCalls.map(call => {
              const config = callTypeConfig[call.call_type]
              const Icon = config.icon
              return (
                <div key={call.id} className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 animate-pulse">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center`}><Icon className="w-6 h-6 text-white" /></div>
                      <div><p className="font-bold text-2xl">Masa {call.table_number}</p><p className="text-sm text-gray-600">{config.label}</p></div>
                    </div>
                    <span className="text-sm text-gray-500">{formatTime(call.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4"><User className="w-4 h-4" /><span>{call.anonymous_id || 'Anonim'}</span></div>
                  <button onClick={() => acknowledgeCall(call.id)} className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold">Üzerime Al</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {acknowledgedCalls.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-orange-600 mb-3">İşleniyor ({acknowledgedCalls.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {acknowledgedCalls.map(call => {
              const config = callTypeConfig[call.call_type]
              const Icon = config.icon
              return (
                <div key={call.id} className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center opacity-70`}><Icon className="w-6 h-6 text-white" /></div>
                    <div><p className="font-bold text-xl">Masa {call.table_number}</p><p className="text-sm text-gray-600">{config.label}</p></div>
                  </div>
                  <button onClick={() => completeCall(call.id)} className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"><Check className="w-5 h-5" />Tamamlandı</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {calls.length === 0 && <div className="text-center py-16"><Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h2 className="text-xl font-semibold text-gray-600 mb-2">Çağrı Yok</h2><p className="text-gray-400">Müşterilerden gelen çağrılar burada görünecek</p></div>}
    </div>
  )
}
