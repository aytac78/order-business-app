'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Bell, User, Clock, Check, X, Send,
  Coffee, CreditCard, HelpCircle, AlertTriangle,
  ChevronRight, Volume2, Phone, Mail, ArrowLeft,
  CheckCheck, Paperclip, ChevronDown
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type MessageType = 'waiter_call' | 'bill_request' | 'help' | 'complaint' | 'order_update' | 'general' | 'chat';
export type ConversationStatus = 'active' | 'waiting' | 'resolved';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'customer' | 'business';
  senderName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isAutoReply?: boolean;
}

export interface Conversation {
  id: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  type: MessageType;
  status: ConversationStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  messages: ChatMessage[];
  createdAt: Date;
  lastMessageAt: Date;
  assignedTo?: string;
  isTyping?: boolean;
}

// ============================================
// AUTO REPLY TEMPLATES
// ============================================

const autoReplyTemplates: Record<MessageType, string> = {
  waiter_call: 'Garson çağrınız alındı. En kısa sürede masanıza geleceğiz. 🙋‍♂️',
  bill_request: 'Hesap talebiniz alındı. Garsonumuz hesabınızı hazırlayıp masanıza getirecektir. 💳',
  help: 'Mesajınız alındı. Size yardımcı olmak için en kısa sürede dönüş yapılacaktır. 🤝',
  complaint: 'Geri bildiriminiz için teşekkür ederiz. Yöneticimiz konuyla ilgili sizinle iletişime geçecektir. 🙏',
  order_update: 'Sipariş güncelleme talebiniz alındı. Mutfağımıza iletilmiştir. 👨‍🍳',
  general: 'Mesajınız alındı. En kısa sürede size dönüş yapılacaktır. ✨',
  chat: 'Mesajınız alındı. Size yardımcı olmaktan mutluluk duyarız. 😊',
};

// ============================================
// QUICK REPLIES
// ============================================

const quickReplies = [
  'Hemen geliyoruz! 🏃',
  'Siparişiniz hazırlanıyor.',
  '5 dakika içinde masanızda olacak.',
  'Tabii, hemen ilgileniyoruz.',
  'Teşekkür ederiz, iyi günler! 😊',
];

// ============================================
// MOCK DATA
// ============================================

const createMockConversations = (): Conversation[] => [
  {
    id: '1',
    tableNumber: 'A-5',
    customerName: 'Mehmet K.',
    customerPhone: '+90 532 123 4567',
    type: 'waiter_call',
    status: 'active',
    priority: 'high',
    createdAt: new Date(Date.now() - 5 * 60000),
    lastMessageAt: new Date(Date.now() - 2 * 60000),
    messages: [
      {
        id: '1a', conversationId: '1', senderId: 'customer1', senderType: 'customer',
        senderName: 'Mehmet K.', message: 'Merhaba, bir garson çağırabilir miyim?',
        timestamp: new Date(Date.now() - 5 * 60000), isRead: true,
      },
      {
        id: '1b', conversationId: '1', senderId: 'system', senderType: 'business',
        senderName: 'ORDER', message: autoReplyTemplates.waiter_call,
        timestamp: new Date(Date.now() - 5 * 60000 + 1000), isRead: true, isAutoReply: true,
      },
      {
        id: '1c', conversationId: '1', senderId: 'customer1', senderType: 'customer',
        senderName: 'Mehmet K.', message: 'Teşekkürler, bekliyoruz.',
        timestamp: new Date(Date.now() - 2 * 60000), isRead: false,
      },
    ],
  },
  {
    id: '2',
    tableNumber: 'B-3',
    customerName: 'Ayşe Y.',
    type: 'bill_request',
    status: 'waiting',
    priority: 'normal',
    createdAt: new Date(Date.now() - 10 * 60000),
    lastMessageAt: new Date(Date.now() - 8 * 60000),
    messages: [
      {
        id: '2a', conversationId: '2', senderId: 'customer2', senderType: 'customer',
        senderName: 'Ayşe Y.', message: 'Hesabı alabilir miyiz lütfen?',
        timestamp: new Date(Date.now() - 10 * 60000), isRead: true,
      },
      {
        id: '2b', conversationId: '2', senderId: 'system', senderType: 'business',
        senderName: 'ORDER', message: autoReplyTemplates.bill_request,
        timestamp: new Date(Date.now() - 10 * 60000 + 1000), isRead: true, isAutoReply: true,
      },
    ],
  },
  {
    id: '3',
    tableNumber: 'C-1',
    customerName: 'Ali D.',
    type: 'complaint',
    status: 'active',
    priority: 'urgent',
    createdAt: new Date(Date.now() - 3 * 60000),
    lastMessageAt: new Date(Date.now() - 1 * 60000),
    assignedTo: 'Yönetici',
    messages: [
      {
        id: '3a', conversationId: '3', senderId: 'customer3', senderType: 'customer',
        senderName: 'Ali D.', message: 'Siparişimiz 30 dakikadır gelmedi!',
        timestamp: new Date(Date.now() - 3 * 60000), isRead: true,
      },
      {
        id: '3b', conversationId: '3', senderId: 'system', senderType: 'business',
        senderName: 'ORDER', message: autoReplyTemplates.complaint,
        timestamp: new Date(Date.now() - 3 * 60000 + 1000), isRead: true, isAutoReply: true,
      },
      {
        id: '3c', conversationId: '3', senderId: 'staff1', senderType: 'business',
        senderName: 'Yönetici', message: 'Özür dileriz, siparişiniz 5 dk içinde gelecek. Tatlı ikramımız olacak.',
        timestamp: new Date(Date.now() - 2 * 60000), isRead: true,
      },
      {
        id: '3d', conversationId: '3', senderId: 'customer3', senderType: 'customer',
        senderName: 'Ali D.', message: 'Tamam, teşekkürler.',
        timestamp: new Date(Date.now() - 1 * 60000), isRead: false,
      },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const getTypeIcon = (type: MessageType) => {
  switch (type) {
    case 'waiter_call': return User;
    case 'bill_request': return CreditCard;
    case 'help': return HelpCircle;
    case 'complaint': return AlertTriangle;
    case 'order_update': return Coffee;
    default: return MessageSquare;
  }
};

const getTypeLabel = (type: MessageType) => {
  switch (type) {
    case 'waiter_call': return 'Garson Çağrısı';
    case 'bill_request': return 'Hesap İsteği';
    case 'help': return 'Yardım';
    case 'complaint': return 'Şikayet';
    case 'order_update': return 'Sipariş';
    default: return 'Mesaj';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'normal': return 'bg-blue-500';
    default: return 'bg-zinc-500';
  }
};

const getStatusBadge = (status: ConversationStatus) => {
  switch (status) {
    case 'active': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Aktif' };
    case 'waiting': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Bekliyor' };
    case 'resolved': return { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: 'Çözüldü' };
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Şimdi';
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};

// ============================================
// CONVERSATION LIST ITEM
// ============================================

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const Icon = getTypeIcon(conversation.type);
  const unreadCount = conversation.messages.filter(m => !m.isRead && m.senderType === 'customer').length;
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const statusBadge = getStatusBadge(conversation.status);

  return (
    <button type="button"
      onClick={onClick}
      className={`w-full p-3 rounded-xl text-left transition-all ${
        isSelected 
          ? 'bg-blue-600/20 border border-blue-500/50' 
          : 'bg-zinc-800/50 hover:bg-zinc-800 border border-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`relative p-2 rounded-lg ${getPriorityColor(conversation.priority)}/20`}>
          <Icon className={`w-5 h-5 ${getPriorityColor(conversation.priority).replace('bg-', 'text-')}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{conversation.tableNumber}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusBadge.bg} ${statusBadge.text}`}>
                {statusBadge.label}
              </span>
            </div>
            <span className="text-xs text-zinc-500">{formatTime(conversation.lastMessageAt)}</span>
          </div>
          
          <p className="text-sm text-zinc-400 truncate">{conversation.customerName}</p>
          <p className="text-xs text-zinc-500 truncate mt-1">
            {lastMessage?.senderType === 'business' && '✓ '}
            {lastMessage?.message}
          </p>
        </div>
      </div>
    </button>
  );
}

// ============================================
// CHAT VIEW
// ============================================

interface ChatViewProps {
  conversation: Conversation;
  onSendMessage: (message: string) => void;
  onBack: () => void;
  onResolve: () => void;
}

function ChatView({ conversation, onSendMessage, onBack, onResolve }: ChatViewProps) {
  const [message, setMessage] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const Icon = getTypeIcon(conversation.type);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleQuickReply = (reply: string) => {
    onSendMessage(reply);
    setShowQuickReplies(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-700/50">
        <button type="button" onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-lg lg:hidden">
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className={`p-2 rounded-lg ${getPriorityColor(conversation.priority)}/20`}>
          <Icon className={`w-5 h-5 ${getPriorityColor(conversation.priority).replace('bg-', 'text-')}`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{conversation.tableNumber}</span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-400">{conversation.customerName}</span>
          </div>
          <p className="text-xs text-zinc-500">{getTypeLabel(conversation.type)}</p>
        </div>
        
        {conversation.status !== 'resolved' && (
          <button type="button"
            onClick={onResolve}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
          >
            <Check className="w-4 h-4 inline mr-1" />
            Çözüldü
          </button>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderType === 'business' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${
              msg.senderType === 'business'
                ? msg.isAutoReply
                  ? 'bg-zinc-700/50 text-zinc-300'
                  : 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-white'
            } rounded-2xl px-4 py-2`}>
              {msg.senderType === 'customer' && (
                <p className="text-xs text-zinc-400 mb-1">{msg.senderName}</p>
              )}
              {msg.isAutoReply && (
                <p className="text-xs text-zinc-500 mb-1">🤖 Otomatik Yanıt</p>
              )}
              <p className="text-sm">{msg.message}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] opacity-60">
                  {msg.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.senderType === 'business' && !msg.isAutoReply && (
                  <CheckCheck className={`w-3 h-3 ${msg.isRead ? 'text-blue-400' : 'opacity-60'}`} />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick Replies */}
      {showQuickReplies && (
        <div className="px-4 py-2 border-t border-zinc-700/50 flex flex-wrap gap-2">
          {quickReplies.map((reply, i) => (
            <button type="button"
              key={i}
              onClick={() => handleQuickReply(reply)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 rounded-full transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      )}
      
      {/* Input */}
      {conversation.status !== 'resolved' && (
        <div className="p-4 border-t border-zinc-700/50">
          <div className="flex items-center gap-2">
            <button type="button"
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              className={`p-2 rounded-lg transition-colors ${
                showQuickReplies ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showQuickReplies ? 'rotate-180' : ''}`} />
            </button>
            
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Mesaj yazın..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            
            <button type="button"
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN MESSAGING PANEL
// ============================================

interface MessagingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagingPanel({ isOpen, onClose }: MessagingPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'waiting' | 'resolved'>('all');

  const selectedConversation = conversations.find(c => c.id === selectedId);
  
  const filteredConversations = conversations
    .filter(c => filter === 'all' || c.status === filter)
    .sort((a, b) => {
      // Unread first, then by priority, then by time
      const aUnread = a.messages.some(m => !m.isRead && m.senderType === 'customer');
      const bUnread = b.messages.some(m => !m.isRead && m.senderType === 'customer');
      if (aUnread !== bUnread) return aUnread ? -1 : 1;
      
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
    });

  const unreadTotal = conversations.reduce(
    (sum, c) => sum + c.messages.filter(m => !m.isRead && m.senderType === 'customer').length, 0
  );

  const handleSendMessage = (conversationId: string, message: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c;
      
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        conversationId,
        senderId: 'staff',
        senderType: 'business',
        senderName: 'Siz',
        message,
        timestamp: new Date(),
        isRead: false,
      };
      
      return {
        ...c,
        messages: [...c.messages, newMessage],
        lastMessageAt: new Date(),
        status: 'active' as ConversationStatus,
      };
    }));
  };

  const handleResolve = (conversationId: string) => {
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, status: 'resolved' as ConversationStatus } : c
    ));
  };

  const markAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        messages: c.messages.map(m => ({ ...m, isRead: true })),
      };
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[80vh] bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl flex overflow-hidden">
        {/* Conversation List */}
        <div className={`w-full lg:w-80 border-r border-zinc-700/50 flex flex-col ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-zinc-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold text-white">Mesajlar</h2>
                {unreadTotal > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadTotal}
                  </span>
                )}
              </div>
              <button type="button" onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            
            {/* Filters */}
            <div className="flex gap-1">
              {[
                { key: 'all', label: 'Tümü' },
                { key: 'active', label: 'Aktif' },
                { key: 'waiting', label: 'Bekleyen' },
              ].map(f => (
                <button type="button"
                  key={f.key}
                  onClick={() => setFilter(f.key as typeof filter)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filter === f.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Mesaj yok</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={selectedId === conv.id}
                  onClick={() => {
                    setSelectedId(conv.id);
                    markAsRead(conv.id);
                  }}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Chat View */}
        <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
          {selectedConversation ? (
            <ChatView
              conversation={selectedConversation}
              onSendMessage={(msg) => handleSendMessage(selectedConversation.id, msg)}
              onBack={() => setSelectedId(null)}
              onResolve={() => handleResolve(selectedConversation.id)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Bir konuşma seçin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MESSAGE NOTIFICATION BUTTON
// ============================================

interface MessageButtonProps {
  onClick: () => void;
}

export function MessageButton({ onClick }: MessageButtonProps) {
  const [conversations] = useState<Conversation[]>([]);
  const unreadCount = conversations.reduce(
    (sum, c) => sum + c.messages.filter(m => !m.isRead && m.senderType === 'customer').length, 0
  );
  const hasUrgent = conversations.some(c => c.priority === 'urgent' && c.status !== 'resolved');

  return (
    <button type="button"
      onClick={onClick}
      className={`relative p-3 rounded-xl transition-all ${
        hasUrgent 
          ? 'bg-red-500 hover:bg-red-400 animate-pulse' 
          : 'bg-zinc-800 hover:bg-zinc-700'
      }`}
    >
      <MessageSquare className={`w-6 h-6 ${hasUrgent ? 'text-white' : 'text-zinc-400'}`} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

export default MessagingPanel;