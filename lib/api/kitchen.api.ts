// Kitchen Panel - Supabase API Functions
// /lib/api/kitchen.api.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// TYPES
// ============================================

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type OrderPriority = 'normal' | 'high' | 'rush';
export type OrderChannel = 'qr' | 'waiter' | 'app' | 'phone';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  options?: OrderItemOption[];
  status: 'pending' | 'preparing' | 'ready';
}

export interface OrderItemOption {
  id: string;
  option_name: string;
  option_value: string;
  price_modifier: number;
}

export interface KitchenOrder {
  id: string;
  order_number: string;
  venue_id: string;
  table_id?: string;
  table_number?: string;
  customer_id?: string;
  waiter_id?: string;
  waiter_name?: string;
  status: OrderStatus;
  priority: OrderPriority;
  channel: OrderChannel;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  prepared_at?: string;
  served_at?: string;
}

export interface KitchenStats {
  pending_count: number;
  preparing_count: number;
  ready_count: number;
  avg_preparation_time: number; // in minutes
  orders_today: number;
  items_today: number;
}

// ============================================
// FETCH FUNCTIONS
// ============================================

/**
 * Get all active kitchen orders for a venue
 */
export async function getKitchenOrders(venueId: string): Promise<{ data: KitchenOrder[] | null; error: any }> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      tables (table_number),
      users!orders_waiter_id_fkey (full_name),
      order_items (
        *,
        products (name, category_id),
        order_item_options (*)
      )
    `)
    .eq('venue_id', venueId)
    .in('status', ['pending', 'preparing', 'ready'])
    .order('created_at', { ascending: true });

  if (error) return { data: null, error };

  // Transform data to KitchenOrder format
  const orders: KitchenOrder[] = (data || []).map((order: any) => ({
    id: order.id,
    order_number: order.order_number,
    venue_id: order.venue_id,
    table_id: order.table_id,
    table_number: order.tables?.table_number || 'N/A',
    customer_id: order.customer_id,
    waiter_id: order.waiter_id,
    waiter_name: order.users?.full_name || 'Bilinmiyor',
    status: order.status,
    priority: order.priority || 'normal',
    channel: order.channel || 'waiter',
    items: (order.order_items || []).map((item: any) => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      product_name: item.products?.name || item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      notes: item.notes,
      status: item.status || 'pending',
      options: (item.order_item_options || []).map((opt: any) => ({
        id: opt.id,
        option_name: opt.option_name,
        option_value: opt.option_value,
        price_modifier: opt.price_modifier,
      })),
    })),
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    notes: order.notes,
    created_at: order.created_at,
    updated_at: order.updated_at,
    prepared_at: order.prepared_at,
    served_at: order.served_at,
  }));

  return { data: orders, error: null };
}

/**
 * Get kitchen statistics for today
 */
export async function getKitchenStats(venueId: string): Promise<{ data: KitchenStats | null; error: any }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get order counts by status
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, status, created_at, prepared_at, order_items(quantity)')
    .eq('venue_id', venueId)
    .gte('created_at', today.toISOString());

  if (error) return { data: null, error };

  const pending = orders?.filter(o => o.status === 'pending').length || 0;
  const preparing = orders?.filter(o => o.status === 'preparing').length || 0;
  const ready = orders?.filter(o => o.status === 'ready').length || 0;

  // Calculate average preparation time
  const completedOrders = orders?.filter(o => o.prepared_at && o.created_at) || [];
  let avgTime = 0;
  if (completedOrders.length > 0) {
    const totalTime = completedOrders.reduce((sum, o) => {
      const diff = new Date(o.prepared_at!).getTime() - new Date(o.created_at).getTime();
      return sum + diff;
    }, 0);
    avgTime = Math.round(totalTime / completedOrders.length / 60000); // Convert to minutes
  }

  // Count total items
  const itemsToday = orders?.reduce((sum, o) => {
    return sum + (o.order_items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0);
  }, 0) || 0;

  return {
    data: {
      pending_count: pending,
      preparing_count: preparing,
      ready_count: ready,
      avg_preparation_time: avgTime,
      orders_today: orders?.length || 0,
      items_today: itemsToday,
    },
    error: null,
  };
}

// ============================================
// UPDATE FUNCTIONS
// ============================================

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ data: KitchenOrder | null; error: any }> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  // Set timestamps based on status
  if (status === 'preparing') {
    updateData.started_at = new Date().toISOString();
  } else if (status === 'ready') {
    updateData.prepared_at = new Date().toISOString();
  } else if (status === 'served') {
    updateData.served_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  return { data, error };
}

/**
 * Update individual item status
 */
export async function updateItemStatus(
  itemId: string,
  status: 'pending' | 'preparing' | 'ready'
): Promise<{ data: OrderItem | null; error: any }> {
  const { data, error } = await supabase
    .from('order_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select()
    .single();

  return { data, error };
}

/**
 * Update order priority
 */
export async function updateOrderPriority(
  orderId: string,
  priority: OrderPriority
): Promise<{ data: KitchenOrder | null; error: any }> {
  const { data, error } = await supabase
    .from('orders')
    .update({ priority, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  return { data, error };
}

/**
 * Add note to order
 */
export async function addOrderNote(
  orderId: string,
  note: string
): Promise<{ data: KitchenOrder | null; error: any }> {
  const { data, error } = await supabase
    .from('orders')
    .update({ notes: note, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  return { data, error };
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to kitchen order changes
 */
export function subscribeToKitchenOrders(
  venueId: string,
  onInsert: (order: any) => void,
  onUpdate: (order: any) => void,
  onDelete: (order: any) => void
) {
  const channel = supabase
    .channel(`kitchen-orders-${venueId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `venue_id=eq.${venueId}`,
      },
      (payload) => {
        console.log('New order:', payload.new);
        onInsert(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `venue_id=eq.${venueId}`,
      },
      (payload) => {
        console.log('Order updated:', payload.new);
        onUpdate(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'orders',
        filter: `venue_id=eq.${venueId}`,
      },
      (payload) => {
        console.log('Order deleted:', payload.old);
        onDelete(payload.old);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from kitchen orders
 */
export function unsubscribeFromKitchenOrders(channel: any) {
  supabase.removeChannel(channel);
}

// ============================================
// NOTIFICATION HELPERS
// ============================================

/**
 * Notify waiter that order is ready
 */
export async function notifyWaiterOrderReady(
  orderId: string,
  waiterId: string,
  tableNumber: string
): Promise<{ success: boolean; error: any }> {
  // Insert notification record
  const { error } = await supabase.from('notifications').insert({
    user_id: waiterId,
    type: 'order_ready',
    title: 'Sipariş Hazır',
    message: `Masa ${tableNumber} siparişi hazır!`,
    data: { order_id: orderId, table_number: tableNumber },
    read: false,
  });

  if (error) return { success: false, error };

  // TODO: Send push notification via OneSignal/Firebase
  // await sendPushNotification(waiterId, { ... });

  return { success: true, error: null };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate estimated preparation time based on items
 */
export function calculateEstimatedTime(items: OrderItem[]): number {
  // Base time per item type (can be configured per product in DB)
  const baseTimePerItem = 5; // minutes
  const maxParallelItems = 3;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const parallelBatches = Math.ceil(totalItems / maxParallelItems);

  return parallelBatches * baseTimePerItem;
}

/**
 * Sort orders by priority and time
 */
export function sortKitchenOrders(orders: KitchenOrder[]): KitchenOrder[] {
  const priorityOrder: Record<OrderPriority, number> = {
    rush: 0,
    high: 1,
    normal: 2,
  };

  return [...orders].sort((a, b) => {
    // First by priority
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // Then by creation time (oldest first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/**
 * Group orders by status
 */
export function groupOrdersByStatus(orders: KitchenOrder[]): Record<OrderStatus, KitchenOrder[]> {
  return orders.reduce((groups, order) => {
    const status = order.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(order);
    return groups;
  }, {} as Record<OrderStatus, KitchenOrder[]>);
}
