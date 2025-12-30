// =============================================
// ORDER - SUPABASE API FUNCTIONS
// Bu dosyayı hem Customer hem Business app'e kopyalayın
// Konum: lib/api.ts
// =============================================

import { supabase } from './supabase';
import type {
  Venue, Profile, Category, Product, Table, Order, OrderItem,
  Reservation, TableCall, Payment, Notification, Favorite,
  OrderType, OrderStatus, TableStatus, ReservationStatus, TableCallType
} from './supabase';

// =============================================
// AUTH
// =============================================

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: 'customer' }
    }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithPhone(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
  return data;
}

export async function verifyOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

// Staff PIN login
export async function signInWithPin(venueId: string, pinCode: string) {
  const { data, error } = await supabase
    .from('staff_venues')
    .select('*, profiles(*), venues(*)')
    .eq('venue_id', venueId)
    .eq('pin_code', pinCode)
    .eq('is_active', true)
    .single();
  if (error) throw error;
  return data;
}

// =============================================
// VENUES
// =============================================

export async function getVenues(options?: {
  city?: string;
  type?: string;
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}) {
  let query = supabase
    .from('venues')
    .select('*')
    .eq('is_active', true);

  if (options?.city) {
    query = query.eq('city', options.city);
  }
  if (options?.type) {
    query = query.eq('type', options.type);
  }
  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,address.ilike.%${options.search}%`);
  }

  const { data, error } = await query.order('name');
  if (error) throw error;
  return data as Venue[];
}

export async function getVenue(idOrSlug: string) {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .eq('is_active', true)
    .single();
  if (error) throw error;
  return data as Venue;
}

export async function createVenue(venue: Partial<Venue>) {
  const { data, error } = await supabase
    .from('venues')
    .insert(venue)
    .select()
    .single();
  if (error) throw error;
  return data as Venue;
}

export async function updateVenue(venueId: string, updates: Partial<Venue>) {
  const { data, error } = await supabase
    .from('venues')
    .update(updates)
    .eq('id', venueId)
    .select()
    .single();
  if (error) throw error;
  return data as Venue;
}

// =============================================
// MENU (Categories & Products)
// =============================================

export async function getMenu(venueId: string) {
  const [categoriesRes, productsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('products')
      .select('*')
      .eq('venue_id', venueId)
      .order('sort_order')
  ]);

  if (categoriesRes.error) throw categoriesRes.error;
  if (productsRes.error) throw productsRes.error;

  const categories = categoriesRes.data as Category[];
  const products = productsRes.data as Product[];

  return categories.map(cat => ({
    ...cat,
    products: products.filter(p => p.category_id === cat.id)
  }));
}

export async function getCategories(venueId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data as Category[];
}

export async function createCategory(category: Partial<Category>) {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(categoryId: string, updates: Partial<Category>) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(categoryId: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);
  if (error) throw error;
}

export async function getProducts(venueId: string, categoryId?: string) {
  let query = supabase
    .from('products')
    .select('*, categories(name)')
    .eq('venue_id', venueId);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order('sort_order');
  if (error) throw error;
  return data as Product[];
}

export async function createProduct(product: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(productId: string, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function toggleProductAvailability(productId: string, isAvailable: boolean) {
  const { data, error } = await supabase
    .from('products')
    .update({ is_available: isAvailable })
    .eq('id', productId)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(productId: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);
  if (error) throw error;
}

// =============================================
// TABLES
// =============================================

export async function getTables(venueId: string) {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('section')
    .order('number');
  if (error) throw error;
  return data as Table[];
}

export async function getTableByQR(qrCode: string) {
  const { data, error } = await supabase
    .from('tables')
    .select('*, venues(*)')
    .eq('qr_code', qrCode)
    .eq('is_active', true)
    .single();
  if (error) throw error;
  return data;
}

export async function createTable(table: Partial<Table>) {
  const { data, error } = await supabase
    .from('tables')
    .insert(table)
    .select()
    .single();
  if (error) throw error;
  return data as Table;
}

export async function updateTable(tableId: string, updates: Partial<Table>) {
  const { data, error } = await supabase
    .from('tables')
    .update(updates)
    .eq('id', tableId)
    .select()
    .single();
  if (error) throw error;
  return data as Table;
}

export async function updateTableStatus(tableId: string, status: TableStatus) {
  const { data, error } = await supabase
    .from('tables')
    .update({ status })
    .eq('id', tableId)
    .select()
    .single();
  if (error) throw error;
  return data as Table;
}

export async function deleteTable(tableId: string) {
  const { error } = await supabase
    .from('tables')
    .delete()
    .eq('id', tableId);
  if (error) throw error;
}

// =============================================
// ORDERS
// =============================================

export async function getOrders(venueId: string, options?: {
  status?: OrderStatus | OrderStatus[];
  type?: OrderType;
  tableId?: string;
  date?: string;
  limit?: number;
}) {
  let query = supabase
    .from('orders')
    .select(`
      *,
      table:tables(number, section),
      customer:profiles!customer_id(full_name, phone),
      waiter:profiles!waiter_id(full_name),
      items:order_items(*)
    `)
    .eq('venue_id', venueId);

  if (options?.status) {
    if (Array.isArray(options.status)) {
      query = query.in('status', options.status);
    } else {
      query = query.eq('status', options.status);
    }
  }
  if (options?.type) {
    query = query.eq('type', options.type);
  }
  if (options?.tableId) {
    query = query.eq('table_id', options.tableId);
  }
  if (options?.date) {
    query = query.gte('created_at', `${options.date}T00:00:00`)
                 .lte('created_at', `${options.date}T23:59:59`);
  }

  query = query.order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Order[];
}

export async function getOrder(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(number, section),
      customer:profiles!customer_id(full_name, phone, email),
      waiter:profiles!waiter_id(full_name),
      items:order_items(*)
    `)
    .eq('id', orderId)
    .single();
  if (error) throw error;
  return data as Order;
}

export async function createOrder(order: {
  venue_id: string;
  table_id?: string;
  customer_id?: string;
  waiter_id?: string;
  type: OrderType;
  items: { product_id: string; product_name: string; quantity: number; unit_price: number; options?: any[]; notes?: string }[];
  notes?: string;
  priority?: 'normal' | 'rush';
}) {
  const { items, ...orderData } = order;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const taxRate = 0.08; // TODO: Get from venue settings
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Create order
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      subtotal,
      tax,
      total,
      order_number: '' // Trigger will generate this
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Create order items
  const orderItems = items.map(item => ({
    order_id: newOrder.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity,
    options: item.options || [],
    notes: item.notes
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  // Update table status if dine_in
  if (order.table_id && order.type === 'dine_in') {
    await updateTableStatus(order.table_id, 'occupied');
  }

  return getOrder(newOrder.id);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;

  // If completed/cancelled, update table
  if (status === 'completed' || status === 'cancelled') {
    const order = data as Order;
    if (order.table_id) {
      await updateTableStatus(order.table_id, 'cleaning');
    }
  }

  return data as Order;
}

export async function updateOrderItemStatus(itemId: string, status: OrderItem['status']) {
  const { data, error } = await supabase
    .from('order_items')
    .update({ status })
    .eq('id', itemId)
    .select()
    .single();
  if (error) throw error;
  return data as OrderItem;
}

export async function addOrderItem(orderId: string, item: {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  options?: any[];
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('order_items')
    .insert({
      order_id: orderId,
      ...item,
      total_price: item.unit_price * item.quantity
    })
    .select()
    .single();
  if (error) throw error;

  // Recalculate order totals
  await recalculateOrderTotals(orderId);

  return data as OrderItem;
}

async function recalculateOrderTotals(orderId: string) {
  const { data: items } = await supabase
    .from('order_items')
    .select('total_price')
    .eq('order_id', orderId);

  if (!items) return;

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  await supabase
    .from('orders')
    .update({ subtotal, tax, total })
    .eq('id', orderId);
}

// =============================================
// TABLE CALLS (Garson Çağrısı)
// =============================================

export async function createTableCall(call: {
  venue_id: string;
  table_id: string;
  customer_id?: string;
  type?: TableCallType;
}) {
  const { data, error } = await supabase
    .from('table_calls')
    .insert(call)
    .select()
    .single();
  if (error) throw error;
  return data as TableCall;
}

export async function getTableCalls(venueId: string, status?: TableCall['status']) {
  let query = supabase
    .from('table_calls')
    .select('*, table:tables(number, section)')
    .eq('venue_id', venueId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) throw error;
  return data as TableCall[];
}

export async function acknowledgeTableCall(callId: string, staffId: string) {
  const { data, error } = await supabase
    .from('table_calls')
    .update({
      status: 'acknowledged',
      acknowledged_by: staffId,
      acknowledged_at: new Date().toISOString()
    })
    .eq('id', callId)
    .select()
    .single();
  if (error) throw error;
  return data as TableCall;
}

export async function resolveTableCall(callId: string) {
  const { data, error } = await supabase
    .from('table_calls')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString()
    })
    .eq('id', callId)
    .select()
    .single();
  if (error) throw error;
  return data as TableCall;
}

// =============================================
// RESERVATIONS
// =============================================

export async function getReservations(venueId: string, options?: {
  date?: string;
  status?: ReservationStatus;
}) {
  let query = supabase
    .from('reservations')
    .select('*')
    .eq('venue_id', venueId);

  if (options?.date) {
    query = query.eq('date', options.date);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query.order('date').order('time');
  if (error) throw error;
  return data as Reservation[];
}

export async function createReservation(reservation: Partial<Reservation>) {
  const { data, error } = await supabase
    .from('reservations')
    .insert(reservation)
    .select()
    .single();
  if (error) throw error;
  return data as Reservation;
}

export async function updateReservationStatus(reservationId: string, status: ReservationStatus, tableIds?: string[]) {
  const updates: Partial<Reservation> = { status };
  if (tableIds) {
    updates.table_ids = tableIds;
  }

  const { data, error } = await supabase
    .from('reservations')
    .update(updates)
    .eq('id', reservationId)
    .select()
    .single();
  if (error) throw error;

  // If seated, update tables
  if (status === 'seated' && tableIds) {
    for (const tableId of tableIds) {
      await updateTableStatus(tableId, 'occupied');
    }
  }

  return data as Reservation;
}

export async function getMyReservations(userId: string) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, venues(name, address, logo_url)')
    .eq('customer_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

// =============================================
// PAYMENTS
// =============================================

export async function createPayment(payment: {
  order_id: string;
  venue_id: string;
  amount: number;
  method: PaymentMethod;
  processed_by?: string;
  reference_no?: string;
}) {
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single();
  if (error) throw error;

  // Update order payment status
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('order_id', payment.order_id)
    .eq('status', 'completed');

  const totalPaid = allPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const order = await getOrder(payment.order_id);

  let paymentStatus: PaymentStatus = 'pending';
  if (totalPaid >= order.total) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partial';
  }

  await supabase
    .from('orders')
    .update({ payment_status: paymentStatus, payment_method: payment.method })
    .eq('id', payment.order_id);

  return data as Payment;
}

// =============================================
// FAVORITES
// =============================================

export async function getFavorites(userId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, venue:venues(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return data as Favorite[];
}

export async function addFavorite(userId: string, venueId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, venue_id: venueId })
    .select()
    .single();
  if (error) throw error;
  return data as Favorite;
}

export async function removeFavorite(userId: string, venueId: string) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('venue_id', venueId);
  if (error) throw error;
}

export async function isFavorite(userId: string, venueId: string) {
  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('venue_id', venueId)
    .single();
  return !!data;
}

// =============================================
// NOTIFICATIONS
// =============================================

export async function getNotifications(userId: string, unreadOnly = false) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data as Notification[];
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId);
  if (error) throw error;
}

// =============================================
// STAFF
// =============================================

export async function getStaffVenues(userId: string) {
  const { data, error } = await supabase
    .from('staff_venues')
    .select('*, venues(*)')
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) throw error;
  return data;
}

export async function getVenueStaff(venueId: string) {
  const { data, error } = await supabase
    .from('staff_venues')
    .select('*, profiles(*)')
    .eq('venue_id', venueId)
    .eq('is_active', true);
  if (error) throw error;
  return data;
}
