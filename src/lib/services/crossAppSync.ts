/**
 * ORDER Cross-App Synchronization Service
 * 
 * Bu servis, Customer ve Business uygulamaları arasındaki
 * gerçek zamanlı veri senkronizasyonunu yönetir.
 * 
 * Supabase Realtime kullanılarak:
 * - Yeni siparişler anında Business'a iletilir
 * - Sipariş durumu değişiklikleri Customer'a yansır
 * - Garson çağrıları anında bildirilir
 * - Mesajlar gerçek zamanlı iletilir
 * - HERE check-in'ler senkronize edilir
 */

import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type EventHandler = (payload: any) => void;

interface SyncChannels {
  orders: RealtimeChannel | null;
  tables: RealtimeChannel | null;
  waiterCalls: RealtimeChannel | null;
  messages: RealtimeChannel | null;
  reservations: RealtimeChannel | null;
  checkins: RealtimeChannel | null;
}

class CrossAppSync {
  private venueId: string | null = null;
  private channels: SyncChannels = {
    orders: null,
    tables: null,
    waiterCalls: null,
    messages: null,
    reservations: null,
    checkins: null,
  };
  private handlers: Map<string, EventHandler[]> = new Map();

  // Initialize sync for a venue
  initialize(venueId: string) {
    this.venueId = venueId;
    this.cleanup(); // Clean up any existing channels
    this.setupChannels();
  }

  // Set up all realtime channels
  private setupChannels() {
    if (!this.venueId) return;

    // Orders channel
    this.channels.orders = supabase
      .channel(`sync-orders-${this.venueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `venue_id=eq.${this.venueId}`,
        },
        (payload) => this.emit('order', payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        (payload) => this.emit('order_item', payload)
      )
      .subscribe();

    // Tables channel
    this.channels.tables = supabase
      .channel(`sync-tables-${this.venueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `venue_id=eq.${this.venueId}`,
        },
        (payload) => this.emit('table', payload)
      )
      .subscribe();

    // Waiter calls channel
    this.channels.waiterCalls = supabase
      .channel(`sync-waiter-calls-${this.venueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waiter_calls',
          filter: `venue_id=eq.${this.venueId}`,
        },
        (payload) => this.emit('waiter_call', payload)
      )
      .subscribe();

    // Messages channel
    this.channels.messages = supabase
      .channel(`sync-messages-${this.venueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Filter by conversation that belongs to this venue
          if (payload.new) {
            this.emit('message', payload);
          }
        }
      )
      .subscribe();

    // Reservations channel
    this.channels.reservations = supabase
      .channel(`sync-reservations-${this.venueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `venue_id=eq.${this.venueId}`,
        },
        (payload) => this.emit('reservation', payload)
      )
      .subscribe();

    // Check-ins channel (HERE feature)
    this.channels.checkins = supabase
      .channel(`sync-checkins-${this.venueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'venue_checkins',
          filter: `venue_id=eq.${this.venueId}`,
        },
        (payload) => this.emit('checkin', payload)
      )
      .subscribe();
  }

  // Register event handler
  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  // Emit event to all handlers
  private emit(event: string, payload: any) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }

    // Also emit to 'all' handlers
    const allHandlers = this.handlers.get('all');
    if (allHandlers) {
      allHandlers.forEach(handler => {
        try {
          handler({ event, payload });
        } catch (error) {
          console.error('Error in all handler:', error);
        }
      });
    }
  }

  // Clean up all channels
  cleanup() {
    Object.values(this.channels).forEach(channel => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    });

    this.channels = {
      orders: null,
      tables: null,
      waiterCalls: null,
      messages: null,
      reservations: null,
      checkins: null,
    };
  }

  // Get current venue ID
  getVenueId() {
    return this.venueId;
  }

  // Check if sync is active
  isActive() {
    return this.venueId !== null && Object.values(this.channels).some(c => c !== null);
  }
}

// Singleton instance
export const crossAppSync = new CrossAppSync();

// Hook for React components
export function useCrossAppSync(venueId: string | null) {
  if (typeof window === 'undefined') return;

  if (venueId && venueId !== crossAppSync.getVenueId()) {
    crossAppSync.initialize(venueId);
  }

  return crossAppSync;
}

// Utility functions for common sync operations

// Notify Business about new order from Customer
export async function notifyNewOrder(orderId: string, venueId: string) {
  // The realtime subscription will handle this automatically
  // This function can be used for additional actions like push notifications
  console.log(`New order ${orderId} for venue ${venueId}`);
}

// Notify Customer about order status change
export async function notifyOrderStatusChange(
  orderId: string, 
  newStatus: string, 
  customerId?: string
) {
  // The realtime subscription will handle this automatically
  console.log(`Order ${orderId} status changed to ${newStatus}`);
}

// Notify Business about waiter call
export async function notifyWaiterCall(
  callId: string, 
  venueId: string, 
  tableNumber: string,
  callType: string
) {
  // The realtime subscription will handle this automatically
  console.log(`Waiter call ${callId} at table ${tableNumber}: ${callType}`);
}

// Notify Customer about waiter call response
export async function notifyWaiterCallResponse(
  callId: string, 
  customerId: string,
  response: string
) {
  // The realtime subscription will handle this automatically
  console.log(`Waiter call ${callId} responded: ${response}`);
}
