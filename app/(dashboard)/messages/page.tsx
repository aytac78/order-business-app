'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Send, User, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useVenueStore } from '@/stores'

interface Conversation {
  id: string
  customer_id: string
  customer_anonymous_id: string
  last_message: string
  last_message_at: string
  unread_venue: number
}

interface Message {
  id: string
  sender_type: 'customer' | 'venue' | 'system'
  content: string
  created_at: string
}

export default function MessagesPage() {
  const { currentVenue } = useVenueStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (currentVenue) {
      loadConversations()
      
      const channel = supabase
        .channel('business-messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          loadConversations()
          if (selectedConv) loadMessages(selectedConv.id)
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [currentVenue])

  const loadConversations = async () => {
    if (!currentVenue) return
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('last_message_at', { ascending: false })
    
    if (data) setConversations(data)
  }

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    
    if (data) setMessages(data)

    await supabase.from('conversations').update({ unread_venue: 0 }).eq('id', convId)
    loadConversations()
  }

  const selectConversation = (conv: Conversation) => {
    setSelectedConv(conv)
    loadMessages(conv.id)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || !currentVenue) return

    setSending(true)
    await supabase.from('messages').insert({
      conversation_id: selectedConv.id,
      sender_type: 'venue',
      venue_id: currentVenue.id,
      customer_id: selectedConv.customer_id,
      content: newMessage.trim()
    })

    await supabase.from('conversations').update({ 
      last_message: newMessage.trim(), 
      last_message_at: new Date().toISOString(),
      unread_customer: 1
    }).eq('id', selectedConv.id)

    setNewMessage('')
    setSending(false)
    loadMessages(selectedConv.id)
  }

  const formatTime = (date: string) => new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

  const filteredConversations = conversations.filter(c =>
    c.customer_anonymous_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!currentVenue) {
    return <div className="flex items-center justify-center h-96"><p className="text-gray-500">Lütfen bir mekan seçin</p></div>
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">Mesajlar</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Müşteri ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500"><MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Henüz mesaj yok</p></div>
          ) : (
            filteredConversations.map(conv => (
              <button key={conv.id} onClick={() => selectConversation(conv)} className={`w-full p-4 flex items-center gap-3 text-left border-b border-gray-50 hover:bg-gray-50 ${selectedConv?.id === conv.id ? 'bg-orange-50' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><User className="w-5 h-5 text-gray-500" /></div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{conv.customer_anonymous_id || 'Anonim'}</span>
                  <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                </div>
                {conv.unread_venue > 0 && <div className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">{conv.unread_venue}</div>}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col">
        {selectedConv ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><User className="w-5 h-5 text-gray-500" /></div>
              <div><h3 className="font-semibold">{selectedConv.customer_anonymous_id || 'Anonim Müşteri'}</h3><p className="text-xs text-gray-500">Müşteri ID</p></div>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_type === 'venue' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${msg.sender_type === 'venue' ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender_type === 'venue' ? 'text-orange-200' : 'text-gray-400'}`}>{formatTime(msg.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Mesajınızı yazın..." className="flex-1 px-4 py-3 bg-gray-50 rounded-xl outline-none" />
                <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"><Send className="w-4 h-4" />Gönder</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500"><MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" /><p>Bir konuşma seçin</p></div>
        )}
      </div>
    </div>
  )
}
