'use client';

import { useState, useEffect } from 'react';
import { 
  MessageSquare, Bell, User, Clock, Check, X, 
  Coffee, CreditCard, HelpCircle, AlertTriangle,
  ChevronRight, Volume2
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type MessageType = 'waiter_call' | 'bill_request' | 'help' | 'complaint' | 'order_update' | 'general';
export type MessageStatus = 'unread' | 'read' | 'handled';
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CustomerMessage {
  id: string;
  type: MessageType;
  tableNumber: string;
  customerName?: string;
  message: string;
  status: MessageStatus;
  priority: MessagePriority;
  createdAt: Date;
  handledBy?: string;
  handledAt?: Date;
}


// ============================================
// HELPER FUNCTIONS
// ============================================

const getMessageIcon = (type: MessageType) => {
  switch (type) {
    case 'waiter_call': return User;
    case 'bill_request': return CreditCard;
    case 'help': return HelpCircle;
    case 'complaint': return AlertTriangle;
    case 'order_update': return Coffee;
    default: return MessageSquare;
  }
};

const getMessageLabel = (type: MessageType) => {
  switch (type) {
    case 'waiter_call': return 'Garson Çağrısı';
    case 'bill_request': return 'Hesap İsteği';
    case 'help': return 'Yardım';
    case 'complaint': return 'Şikayet';
    case 'order_update': return 'Sipariş Güncellemesi';
    default: return 'Mesaj';
  }
};

const getPriorityColor = (priority: MessagePriority) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/50';
    case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    case 'normal': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    case 'low': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50';
  }
};

const getTimeAgo = (date: Date) => {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Şimdi';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  return `${Math.floor(hours / 24)} gün önce`;
};

// ============================================
// MESSAGE ITEM COMPONENT
// ============================================

interface MessageItemProps {
  message: CustomerMessage;
  onHandle: (id: string) => void;
  onDismiss: (id: string) => void;
  compact?: boolean;
}

function MessageItem({ message, onHandle, onDismiss, compact = false }: MessageItemProps) {
  const Icon = getMessageIcon(message.type);
  const isUnread = message.status === 'unread';
  
  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
        isUnread ? 'bg-zinc-800 border-l-2 border-blue-500' : 'bg-zinc-800/50'
      }`}>
        <div className={`p-2 rounded-lg ${getPriorityColor(message.priority)}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{message.tableNumber}</span>
            <span className="text-xs text-zinc-500">{getMessageLabel(message.type)}</span>
          </div>
          <p className="text-xs text-zinc-400 truncate">{message.message}</p>
        </div>
        <div className="text-xs text-zinc-500">{getTimeAgo(message.createdAt)}</div>
        {isUnread && (
          <button
            onClick={() => onHandle(message.id)}
            className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isUnread 
        ? 'bg-zinc-800 border-zinc-700 shadow-lg' 
        : 'bg-zinc-800/30 border-zinc-800'
    } ${message.priority === 'urgent' ? 'animate-pulse' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`p-3 rounded-xl ${getPriorityColor(message.priority)}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white">{message.tableNumber}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(message.priority)}`}>
                {getMessageLabel(message.type)}
              </span>
              {isUnread && (
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-sm text-zinc-500">{getTimeAgo(message.createdAt)}</span>
          </div>
          
          {message.customerName && (
            <p className="text-sm text-zinc-400 mb-1">{message.customerName}</p>
          )}
          
          <p className="text-zinc-300">{message.message}</p>
          
          {message.status === 'handled' && message.handledBy && (
            <p className="text-xs text-zinc-500 mt-2">
              ✓ {message.handledBy} tarafından işlendi
            </p>
          )}
        </div>
      </div>
      
      {isUnread && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-700">
          <button
            onClick={() => onHandle(message.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium"
          >
            <Check className="w-4 h-4" />
            İşle
          </button>
          <button
            onClick={() => onDismiss(message.id)}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// MESSAGE BOX COMPONENT (WIDGET)
// ============================================

interface MessageBoxProps {
  variant?: 'full' | 'compact' | 'minimal';
  maxMessages?: number;
  showHeader?: boolean;
  className?: string;
}

export function MessageBox({ 
  variant = 'compact', 
  maxMessages = 5,
  showHeader = true,
  className = ''
}: MessageBoxProps) {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  const handleMessage = (id: string) => {
    setMessages(prev => prev.map(m => 
      m.id === id ? { ...m, status: 'handled' as MessageStatus, handledAt: new Date() } : m
    ));
  };

  const dismissMessage = (id: string) => {
    setMessages(prev => prev.map(m => 
      m.id === id ? { ...m, status: 'read' as MessageStatus } : m
    ));
  };

  const displayMessages = messages
    .filter(m => m.status !== 'handled')
    .sort((a, b) => {
      // Unread first, then by priority, then by time
      if (a.status !== b.status) return a.status === 'unread' ? -1 : 1;
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, maxMessages);

  if (variant === 'minimal') {
    return (
      <button className="relative p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors">
        <MessageSquare className="w-5 h-5 text-zinc-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`bg-zinc-800/50 rounded-xl border border-zinc-700/50 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-zinc-700/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <MessageSquare className="w-5 h-5 text-zinc-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <h3 className="font-bold text-white">Mesajlar</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                {unreadCount} yeni
              </span>
            )}
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-500'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <div className={`p-3 space-y-2 ${variant === 'full' ? 'max-h-[500px]' : 'max-h-[300px]'} overflow-y-auto`}>
        {displayMessages.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Mesaj yok</p>
          </div>
        ) : (
          displayMessages.map(message => (
            <MessageItem
              key={message.id}
              message={message}
              onHandle={handleMessage}
              onDismiss={dismissMessage}
              compact={variant === 'compact'}
            />
          ))
        )}
      </div>
      
      {messages.length > maxMessages && (
        <div className="p-3 border-t border-zinc-700/50">
          <button className="w-full flex items-center justify-center gap-2 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
            Tüm mesajları gör
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// FLOATING MESSAGE INDICATOR
// ============================================

export function MessageIndicator({ onClick }: { onClick?: () => void }) {
  const [messages] = useState<CustomerMessage[]>([]);
  const unreadCount = messages.filter(m => m.status === 'unread').length;
  const hasUrgent = messages.some(m => m.status === 'unread' && m.priority === 'urgent');

  if (unreadCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-full shadow-lg transition-all ${
        hasUrgent 
          ? 'bg-red-500 hover:bg-red-400 animate-bounce' 
          : 'bg-blue-500 hover:bg-blue-400'
      }`}
    >
      <MessageSquare className="w-5 h-5 text-white" />
      <span className="text-white font-bold">{unreadCount} yeni mesaj</span>
    </button>
  );
}

export default MessageBox;
