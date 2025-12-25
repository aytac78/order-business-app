'use client';

import { useState, useEffect, useRef } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Bell, X, CheckCheck, Volume2, VolumeX,
  ShoppingBag, Calendar, AlertTriangle, CreditCard
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'order' | 'reservation' | 'stock' | 'payment' | 'system';
  title: string;
  message: string;
  venue_name?: string;
  created_at: string;
  is_read: boolean;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  order: { icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
  reservation: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
  stock: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
  payment: { icon: CreditCard, color: 'text-green-600', bg: 'bg-green-100' },
  system: { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' },
};

export function NotificationCenter() {
  const { currentVenue, venues } = useVenueStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAllVenues = currentVenue === null;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Realtime subscription for orders
    const orderChannel = supabase
      .channel('notification-orders')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new as any;
          
          if (!isAllVenues && currentVenue?.id && order.venue_id !== currentVenue.id) {
            return;
          }

          const venue = venues.find(v => v.id === order.venue_id);
          const newNotification: Notification = {
            id: `order-${order.id}`,
            type: 'order',
            title: 'Yeni Sipariş',
            message: order.table_number 
              ? `Masa #${order.table_number} - ₺${(order.total_amount || order.total || 0).toLocaleString()}`
              : `₺${(order.total_amount || order.total || 0).toLocaleString()}`,
            venue_name: venue?.name || order.venue_name,
            created_at: new Date().toISOString(),
            is_read: false,
          };

          setNotifications(prev => [newNotification, ...prev].slice(0, 50));
          
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification('Yeni Sipariş!', { body: newNotification.message });
          }
        }
      )
      .subscribe();

    // Realtime subscription for reservations
    const reservationChannel = supabase
      .channel('notification-reservations')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reservations' },
        (payload) => {
          const reservation = payload.new as any;

          if (!isAllVenues && currentVenue?.id && reservation.venue_id !== currentVenue.id) {
            return;
          }

          const venue = venues.find(v => v.id === reservation.venue_id);
          const newNotification: Notification = {
            id: `reservation-${reservation.id}`,
            type: 'reservation',
            title: 'Yeni Rezervasyon',
            message: `${reservation.customer_name} - ${reservation.party_size} kişi`,
            venue_name: venue?.name,
            created_at: new Date().toISOString(),
            is_read: false,
          };

          setNotifications(prev => [newNotification, ...prev].slice(0, 50));
          
          if (Notification.permission === 'granted') {
            new Notification('Yeni Rezervasyon!', { body: newNotification.message });
          }
        }
      )
      .subscribe();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(reservationChannel);
    };
  }, [currentVenue?.id, isAllVenues, venues]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    setIsOpen(false);
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Şimdi';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} dk önce`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat önce`;
    return `${Math.floor(seconds / 86400)} gün önce`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-gray-900">Bildirimler</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg ${soundEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllAsRead} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500">
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button onClick={clearAll} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500">
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Bildirim yok</p>
                <p className="text-xs mt-1">Yeni sipariş geldiğinde burada görünecek</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = typeConfig[notification.type] || typeConfig.system;
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-4 border-b last:border-0 hover:bg-gray-50 cursor-pointer ${
                      !notification.is_read ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{notification.title}</p>
                          {!notification.is_read && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {notification.venue_name && isAllVenues && (
                            <span className="text-xs text-purple-600">{notification.venue_name}</span>
                          )}
                          <span className="text-xs text-gray-400">{timeAgo(notification.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
