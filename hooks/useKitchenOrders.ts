// Kitchen Real-time Hook
// /hooks/useKitchenOrders.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  KitchenOrder,
  KitchenStats,
  getKitchenOrders,
  getKitchenStats,
  updateOrderStatus as apiUpdateOrderStatus,
  updateOrderPriority as apiUpdateOrderPriority,
  subscribeToKitchenOrders,
  unsubscribeFromKitchenOrders,
  sortKitchenOrders,
  OrderStatus,
  OrderPriority,
} from '@/lib/api/kitchen.api';

interface UseKitchenOrdersOptions {
  venueId: string;
  soundEnabled?: boolean;
  autoRefreshInterval?: number; // in milliseconds, 0 to disable
}

interface UseKitchenOrdersReturn {
  orders: KitchenOrder[];
  stats: KitchenStats | null;
  loading: boolean;
  error: string | null;
  filter: OrderStatus | 'all';
  setFilter: (filter: OrderStatus | 'all') => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updatePriority: (orderId: string, priority: OrderPriority) => Promise<void>;
  refresh: () => Promise<void>;
  filteredOrders: KitchenOrder[];
}

export function useKitchenOrders({
  venueId,
  soundEnabled = true,
  autoRefreshInterval = 30000, // 30 seconds default
}: UseKitchenOrdersOptions): UseKitchenOrdersReturn {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [stats, setStats] = useState<KitchenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<any>(null);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/kitchen-bell.mp3');
      audioRef.current.preload = 'auto';
    }
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Play notification sound
  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }, [soundEnabled]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!venueId) return;
    
    try {
      const [ordersResult, statsResult] = await Promise.all([
        getKitchenOrders(venueId),
        getKitchenStats(venueId),
      ]);

      if (ordersResult.error) {
        setError(ordersResult.error.message);
      } else {
        setOrders(sortKitchenOrders(ordersResult.data || []));
        setError(null);
      }

      if (statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (err) {
      setError('Siparişler yüklenirken hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto refresh
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const interval = setInterval(fetchOrders, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchOrders]);

  // Real-time subscription
  useEffect(() => {
    if (!venueId) return;

    channelRef.current = subscribeToKitchenOrders(
      venueId,
      // On Insert
      (newOrder) => {
        setOrders(prev => sortKitchenOrders([...prev, newOrder]));
        playSound();
        // Refresh stats
        getKitchenStats(venueId).then(result => {
          if (result.data) setStats(result.data);
        });
      },
      // On Update
      (updatedOrder) => {
        setOrders(prev =>
          sortKitchenOrders(
            prev.map(o => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
          )
        );
        // Refresh stats
        getKitchenStats(venueId).then(result => {
          if (result.data) setStats(result.data);
        });
      },
      // On Delete
      (deletedOrder) => {
        setOrders(prev => prev.filter(o => o.id !== deletedOrder.id));
        // Refresh stats
        getKitchenStats(venueId).then(result => {
          if (result.data) setStats(result.data);
        });
      }
    );

    return () => {
      if (channelRef.current) {
        unsubscribeFromKitchenOrders(channelRef.current);
      }
    };
  }, [venueId, playSound]);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    // Optimistic update
    setOrders(prev =>
      sortKitchenOrders(
        prev.map(o => (o.id === orderId ? { ...o, status } : o))
      )
    );

    const { error } = await apiUpdateOrderStatus(orderId, status);
    
    if (error) {
      // Revert on error
      fetchOrders();
      throw new Error(error.message);
    }

    // Refresh stats
    const statsResult = await getKitchenStats(venueId);
    if (statsResult.data) {
      setStats(statsResult.data);
    }
  }, [venueId, fetchOrders]);

  // Update priority
  const updatePriority = useCallback(async (orderId: string, priority: OrderPriority) => {
    // Optimistic update
    setOrders(prev =>
      sortKitchenOrders(
        prev.map(o => (o.id === orderId ? { ...o, priority } : o))
      )
    );

    const { error } = await apiUpdateOrderPriority(orderId, priority);
    
    if (error) {
      fetchOrders();
      throw new Error(error.message);
    }
  }, [fetchOrders]);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return order.status !== 'served' && order.status !== 'cancelled';
    return order.status === filter;
  });

  return {
    orders,
    stats,
    loading,
    error,
    filter,
    setFilter,
    updateOrderStatus,
    updatePriority,
    refresh: fetchOrders,
    filteredOrders,
  };
}

// Time utilities
export function getElapsedMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

export function formatElapsedTime(createdAt: string): string {
  const minutes = getElapsedMinutes(createdAt);
  if (minutes < 1) return 'Şimdi';
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  return `${hours} sa ${minutes % 60} dk`;
}

export function getTimeUrgency(createdAt: string, status: string): 'ok' | 'warning' | 'urgent' | 'critical' {
  if (status === 'ready' || status === 'served') return 'ok';
  
  const minutes = getElapsedMinutes(createdAt);
  if (minutes < 5) return 'ok';
  if (minutes < 10) return 'warning';
  if (minutes < 15) return 'urgent';
  return 'critical';
}
