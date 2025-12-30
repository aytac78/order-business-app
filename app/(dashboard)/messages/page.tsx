'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, User, Search, Phone, ShoppingBag, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useVenueStore } from '@/stores'

interface Conversation {
  id: string
  customer_id: string | null
  customer_anonymous_id: string | null
  order_id: string | null
  last_message: string
  last_message_at: string
  unread_venue: number
  status: string
}

interface Message {
  id: string
  conversation_id: string
  sender_type: 'customer' | 'venue' | 'system'
  sender_id: string | null
  content: string
  message_type: string
  created_at: string
  is_read: boolean
}

export default function MessagesPage() {
  const { currentVenue } = useVenueStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (currentVenue) {
      loadConversations()
      
      // Real-time subscription
      const channel = supabase
        .channel('business-messages')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'messages' 
        }, (payload) => {
          console.log('Message change:', payload)
          if (selectedConv) {
            loadMessages(selectedConv.id)
          }
          loadConversations()
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `venue_id=eq.${currentVenue.id}`
        }, () => {
          loadConversations()
        })
        .subscribe()

      return () => { 
        supabase.removeChannel(channel) 
      }
    }
  }, [currentVenue?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadConversations = async () => {
    if (!currentVenue) return
    setLoading(true)
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('last_message_at', { ascending: false })
    
    if (error) {
      console.error('Error loading conversations:', error)
    } else {
      setConversations(data || [])
    }
    setLoading(false)
  }

  const loadMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error loading messages:', error)
    } else {
      setMessages(data || [])
    }

    // Okundu olarak işaretle
    await supabase
      .from('conversations')
      .update({ unread_venue: 0 })
      .eq('id', convId)
    
    loadConversations()
  }

  const selectConversation = (conv: Conversation) => {
    setSelectedConv(conv)
    loadMessages(conv.id)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || !currentVenue) return

    setSending(true)
    
    // Mesajı gönder - sadece gerekli alanlar
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: selectedConv.id,
      sender_type: 'venue',
      content: newMessage.trim(),
      message_type: 'text'
    })

    if (msgError) {
      console.error('Error sending message:', msgError)
      setSending(false)
      return
    }

    // Conversation'ı güncelle
    const { error: convError } = await supabase
      .from('conversations')
      .update({ 
        last_message: newMessage.trim(), 
        last_message_at: new Date().toISOString(),
        unread_customer: 1
      })
      .eq('id', selectedConv.id)

    if (convError) {
      console.error('Error updating conversation:', convError)
    }

    setNewMessage('')
    setSending(false)
    loadMessages(selectedConv.id)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return 'Bugün'
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Dün'
    }
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  const filteredConversations = conversations.filter(c =>
    (c.customer_anonymous_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCustomerName = (conv: Conversation) => {
    return conv.customer_anonymous_id || 'Anonim Müşteri'
  }

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Lütfen bir mekan seçin</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* Sol Panel - Konuşma Listesi */}
      <div className="w-80 flex-shrink-0 bg-gray-800 rounded-2xl border border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="font-semibold text-white mb-3">Mesajlar</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Müşteri ara..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-orange-500" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Henüz mesaj yok</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button 
                key={conv.id} 
                onClick={() => selectConversation(conv)} 
                className={`w-full p-4 flex items-center gap-3 text-left border-b border-gray-700/50 transition-colors ${
                  selectedConv?.id === conv.id 
                    ? 'bg-orange-500/20 border-l-2 border-l-orange-500' 
                    : 'hover:bg-gray-700/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-white truncate">
                      {getCustomerName(conv)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{conv.last_message}</p>
                </div>
                {conv.unread_venue > 0 && (
                  <div className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                    {conv.unread_venue}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Sağ Panel - Mesajlaşma */}
      <div className="flex-1 bg-gray-800 rounded-2xl border border-gray-700 flex flex-col">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{getCustomerName(selectedConv)}</h3>
                  <p className="text-xs text-gray-500">
                    {selectedConv.order_id ? 'Sipariş ile ilgili' : 'Genel sohbet'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConv.order_id && (
                  <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <ShoppingBag className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => setSelectedConv(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => {
                const isVenue = msg.sender_type === 'venue'
                const isSystem = msg.sender_type === 'system'
                const showDate = index === 0 || 
                  new Date(messages[index - 1].created_at).toDateString() !== 
                  new Date(msg.created_at).toDateString()

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center justify-center my-4">
                        <span className="px-3 py-1 bg-gray-700 rounded-full text-xs text-gray-400">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                    )}
                    
                    {isSystem ? (
                      <div className="flex justify-center">
                        <div className="px-4 py-2 bg-gray-700/50 rounded-lg text-sm text-gray-400">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className={`flex ${isVenue ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                            isVenue 
                              ? 'bg-orange-500 text-white rounded-br-sm' 
                              : 'bg-gray-700 text-white rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            isVenue ? 'text-orange-200' : 'text-gray-400'
                          }`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Mesaj Gönderme */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyPress={handleKeyPress}
                  placeholder="Mesajınızı yazın..." 
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 outline-none focus:border-orange-500" 
                />
                <button 
                  onClick={sendMessage} 
                  disabled={sending || !newMessage.trim()} 
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Gönder</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium text-gray-400">Bir konuşma seçin</p>
            <p className="text-sm text-gray-500 mt-1">Müşterilerle mesajlaşmaya başlayın</p>
          </div>
        )}
      </div>
    </div>
  )
}
