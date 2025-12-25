import { supabase } from '@/lib/supabase';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '@/types';

// Fetch all orders for a venue
export async function fetchOrders(venueId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(id, number, section),
      items:order_items(*)
    `)
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }

  return data || [];
}

// Fetch active orders (not completed or cancelled)
export async function fetchActiveOrders(venueId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(id, number, section),
      items:order_items(*)
    `)
    .eq('venue_id', venueId)
    .not('status', 'in', '("completed","cancelled")')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active orders:', error);
    throw error;
  }

  return data || [];
}

// Fetch orders by status
export async function fetchOrdersByStatus(venueId: string, status: OrderStatus): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(id, number, section),
      items:order_items(*)
    `)
    .eq('venue_id', venueId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders by status:', error);
    throw error;
  }

  return data || [];
}

// Fetch single order
export async function fetchOrder(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(id, number, section),
      items:order_items(*)
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return data;
}

// Update order status
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order status:', error);
    throw error;
  }

  return data;
}

// Update payment status
export async function updatePaymentStatus(
  orderId: string, 
  paymentStatus: PaymentStatus,
  paymentMethod?: string
): Promise<Order | null> {
  const updateData: any = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString()
  };

  if (paymentMethod) {
    updateData.payment_method = paymentMethod;
  }

  if (paymentStatus === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }

  return data;
}

// Update order item status
export async function updateOrderItemStatus(
  itemId: string, 
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
): Promise<OrderItem | null> {
  const { data, error } = await supabase
    .from('order_items')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order item status:', error);
    throw error;
  }

  return data;
}

// Cancel order
export async function cancelOrder(orderId: string, reason?: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status: 'cancelled',
      notes: reason || 'İptal edildi',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }

  return data;
}

// Subscribe to order changes (real-time)
export function subscribeToOrders(
  venueId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`orders-${venueId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `venue_id=eq.${venueId}`,
      },
      callback
    )
    .subscribe();
}
