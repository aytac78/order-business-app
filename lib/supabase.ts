// =============================================
// ORDER - SUPABASE CLIENT CONFIGURATION
// Bu dosyayı hem Customer hem Business app'e kopyalayın
// Konum: lib/supabase.ts
// =============================================

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Supabase credentials
const supabaseUrl = 'https://acckonwumiecauqcusra.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjY2tvbnd1bWllY2F1cWN1c3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4ODgyOTQsImV4cCI6MjA4MjQ2NDI5NH0.j9rl2WExdwZOHaSarfTrxbhlSXAcuHOgTyXqocIgPzo';

// Browser client (for client components)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Alternative: Basic client (if not using SSR package)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// DATABASE TYPES
// =============================================

export type VenueType = 'restaurant' | 'cafe' | 'bar' | 'beach_club' | 'nightclub' | 'hotel_restaurant';
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';
export type TableShape = 'square' | 'round' | 'rectangle';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'qr_order';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'tit_pay' | 'multinet' | 'sodexo' | 'ticket' | 'mobile';
export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
export type TableCallType = 'waiter' | 'bill' | 'help';
export type TableCallStatus = 'pending' | 'acknowledged' | 'resolved';
export type StaffRole = 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'reception';
export type UserRole = 'customer' | 'staff' | 'admin';

export interface Venue {
  id: string;
  name: string;
  slug: string;
  type: VenueType;
  address?: string;
  city?: string;
  district?: string;
  country: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  cover_url?: string;
  latitude?: number;
  longitude?: number;
  currency: string;
  timezone: string;
  is_active: boolean;
  settings: {
    reservation_enabled: boolean;
    qr_menu_enabled: boolean;
    online_ordering_enabled: boolean;
    tax_rate: number;
    auto_accept_orders: boolean;
    service_charge_percent: number;
  };
  working_hours: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffVenue {
  id: string;
  user_id: string;
  venue_id: string;
  role: StaffRole;
  pin_code?: string;
  permissions: string[];
  hourly_rate?: number;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  venue_id: string;
  name: string;
  name_en?: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  venue_id: string;
  category_id?: string;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  preparation_time?: number;
  allergens: string[];
  options: ProductOption[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductOption {
  id: string;
  name: string;
  choices: { id: string; name: string; price_modifier: number }[];
  is_required: boolean;
  max_selections: number;
}

export interface Table {
  id: string;
  venue_id: string;
  number: string;
  name?: string;
  capacity: number;
  section?: string;
  status: TableStatus;
  shape: TableShape;
  position_x: number;
  position_y: number;
  qr_code?: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  venue_id: string;
  table_id?: string;
  customer_id?: string;
  waiter_id?: string;
  order_number: string;
  type: OrderType;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  service_charge: number;
  discount: number;
  discount_type?: string;
  total: number;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  notes?: string;
  priority: 'normal' | 'rush';
  created_at: string;
  updated_at: string;
  // Joined data
  items?: OrderItem[];
  table?: Table;
  customer?: Profile;
  waiter?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  options: any[];
  notes?: string;
  status: OrderItemStatus;
  created_at: string;
}

export interface Reservation {
  id: string;
  venue_id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  date: string;
  time: string;
  party_size: number;
  table_ids: string[];
  status: ReservationStatus;
  deposit_amount?: number;
  deposit_paid: boolean;
  notes?: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export interface TableCall {
  id: string;
  venue_id: string;
  table_id: string;
  customer_id?: string;
  type: TableCallType;
  status: TableCallStatus;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  // Joined
  table?: Table;
}

export interface Payment {
  id: string;
  order_id: string;
  venue_id: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference_no?: string;
  processed_by?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  venue_id?: string;
  type: string;
  title: string;
  message?: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  venue_id: string;
  created_at: string;
  venue?: Venue;
}

// =============================================
// REALTIME SUBSCRIPTIONS
// =============================================

export function subscribeToOrders(venueId: string, callback: (order: Order) => void) {
  return supabase
    .channel(`orders:${venueId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `venue_id=eq.${venueId}`
      },
      (payload) => callback(payload.new as Order)
    )
    .subscribe();
}

export function subscribeToOrderItems(orderId: string, callback: (item: OrderItem) => void) {
  return supabase
    .channel(`order_items:${orderId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_items',
        filter: `order_id=eq.${orderId}`
      },
      (payload) => callback(payload.new as OrderItem)
    )
    .subscribe();
}

export function subscribeToTables(venueId: string, callback: (table: Table) => void) {
  return supabase
    .channel(`tables:${venueId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tables',
        filter: `venue_id=eq.${venueId}`
      },
      (payload) => callback(payload.new as Table)
    )
    .subscribe();
}

export function subscribeToTableCalls(venueId: string, callback: (call: TableCall) => void) {
  return supabase
    .channel(`table_calls:${venueId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'table_calls',
        filter: `venue_id=eq.${venueId}`
      },
      (payload) => callback(payload.new as TableCall)
    )
    .subscribe();
}

export function subscribeToReservations(venueId: string, callback: (reservation: Reservation) => void) {
  return supabase
    .channel(`reservations:${venueId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reservations',
        filter: `venue_id=eq.${venueId}`
      },
      (payload) => callback(payload.new as Reservation)
    )
    .subscribe();
}

export function subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => callback(payload.new as Notification)
    )
    .subscribe();
}

// Customer subscribes to their order status
export function subscribeToMyOrder(orderId: string, callback: (order: Order) => void) {
  return supabase
    .channel(`my_order:${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      },
      (payload) => callback(payload.new as Order)
    )
    .subscribe();
}
