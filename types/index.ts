// =============================================
// ORDER BUSINESS - TYPE DEFINITIONS
// Multi-Venue Support + Real-time Sync
// =============================================

// Venue Types
export interface Venue {
  id: string;
  name: string;
  slug: string;
  type: VenueType;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  logo_url?: string;
  cover_url?: string;
  currency: string;
  timezone: string;
  is_active: boolean;
  settings: VenueSettings;
  created_at: string;
  updated_at: string;
}

export type VenueType = 'restaurant' | 'cafe' | 'bar' | 'beach_club' | 'nightclub' | 'hotel_restaurant';

export interface VenueSettings {
  working_hours: WorkingHours;
  reservation_enabled: boolean;
  qr_menu_enabled: boolean;
  online_ordering_enabled: boolean;
  min_order_amount?: number;
  service_charge_percent?: number;
  tax_rate: number;
  auto_accept_orders: boolean;
  notification_sounds: boolean;
  theme_color: string;
}

export interface WorkingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  is_open: boolean;
  open: string;
  close: string;
}

// User & Permissions
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'staff';

export interface UserVenue {
  id: string;
  user_id: string;
  venue_id: string;
  role: VenueRole;
  permissions: Permission[];
  is_default: boolean;
  created_at: string;
}

export type VenueRole = 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'reception';

export type Permission = 
  | 'view_dashboard'
  | 'manage_orders'
  | 'manage_tables'
  | 'manage_menu'
  | 'manage_reservations'
  | 'manage_stock'
  | 'manage_staff'
  | 'view_reports'
  | 'manage_settings'
  | 'manage_pos'
  | 'manage_coupons';

// Table Management
export interface Table {
  id: string;
  venue_id: string;
  number: string;
  name?: string;
  capacity: number;
  section: string;
  status: TableStatus;
  current_order_id?: string;
  position_x?: number;
  position_y?: number;
  shape: 'square' | 'round' | 'rectangle';
  is_active: boolean;
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

// Menu & Products
export interface Category {
  id: string;
  venue_id: string;
  name: string;
  name_en?: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  venue_id: string;
  category_id: string;
  name: string;
  name_en?: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  preparation_time?: number;
  allergens?: string[];
  options?: ProductOption[];
  sort_order: number;
}

export interface ProductOption {
  id: string;
  name: string;
  choices: ProductOptionChoice[];
  is_required: boolean;
  max_selections: number;
}

export interface ProductOptionChoice {
  id: string;
  name: string;
  price_modifier: number;
}

// Orders
export interface Order {
  id: string;
  venue_id: string;
  table_id?: string;
  table_number?: string;
  customer_id?: string;
  customer_name?: string;
  order_number: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  service_charge: number;
  discount: number;
  discount_type?: 'percent' | 'amount';
  total: number;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  notes?: string;
  waiter_id?: string;
  waiter_name?: string;
  priority: 'normal' | 'rush';
  created_at: string;
  updated_at: string;
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'qr_order';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'tit_pay' | 'multinet' | 'sodexo' | 'ticket' | 'mobile' | 'mixed';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  options?: SelectedOption[];
  notes?: string;
  status: OrderItemStatus;
}

export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface SelectedOption {
  option_name: string;
  choice_name: string;
  price_modifier: number;
}

// Waiter Calls
export interface WaiterCall {
  id: string;
  venue_id: string;
  table_id: string;
  table_number: string;
  type: 'call' | 'bill' | 'help';
  status: 'pending' | 'acknowledged' | 'completed';
  created_at: string;
  acknowledged_at?: string;
  completed_at?: string;
}

// Reservations
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
  table_ids?: string[];
  status: ReservationStatus;
  deposit_amount?: number;
  deposit_paid: boolean;
  notes?: string;
  special_requests?: string;
  source: 'phone' | 'online' | 'walk_in' | 'app';
  is_vip: boolean;
  created_at: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';

// Waitlist
export interface WaitlistEntry {
  id: string;
  venue_id: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  estimated_wait: number;
  notes?: string;
  status: 'waiting' | 'notified' | 'seated' | 'cancelled';
  created_at: string;
}

// Stock Management
export interface StockItem {
  id: string;
  venue_id: string;
  name: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  max_quantity?: number;
  cost_per_unit: number;
  supplier_id?: string;
  category: string;
  last_restocked?: string;
}

export interface StockAlert {
  id: string;
  venue_id: string;
  stock_item_id: string;
  stock_item?: StockItem;
  type: 'low' | 'out' | 'expiring';
  is_read: boolean;
  created_at: string;
}

// Staff & Shifts
export interface Staff {
  id: string;
  venue_id: string;
  user_id?: string;
  name: string;
  role: VenueRole;
  phone?: string;
  email?: string;
  hourly_rate?: number;
  is_active: boolean;
  pin_code?: string;
  last_active?: string;
}

export interface Shift {
  id: string;
  venue_id: string;
  staff_id: string;
  staff?: Staff;
  date: string;
  start_time: string;
  end_time: string;
  actual_start?: string;
  actual_end?: string;
  break_minutes: number;
  notes?: string;
  status: ShiftStatus;
}

export type ShiftStatus = 'scheduled' | 'in_progress' | 'completed' | 'missed';

// CRM & Customers
export interface Customer {
  id: string;
  venue_id: string;
  name: string;
  phone: string;
  email?: string;
  total_visits: number;
  total_spent: number;
  last_visit?: string;
  tags?: string[];
  notes?: string;
  is_vip: boolean;
  loyalty_points: number;
  created_at: string;
}

// Coupons & Discounts
export interface Coupon {
  id: string;
  venue_id: string;
  code: string;
  name: string;
  type: CouponType;
  value: number;
  min_order_amount?: number;
  max_uses?: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export type CouponType = 'percentage' | 'fixed' | 'free_item';

// Analytics & Reports
export interface DailySummary {
  date: string;
  venue_id: string;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  total_customers: number;
  new_customers: number;
  top_products: { product_id: string; name: string; quantity: number; revenue: number }[];
  orders_by_type: Record<OrderType, number>;
  payment_breakdown: Record<PaymentMethod, number>;
}

// Multi-Venue Dashboard Types
export interface VenueSummary {
  venue_id: string;
  venue_name: string;
  today_revenue: number;
  today_orders: number;
  active_orders: number;
  pending_reservations: number;
  low_stock_items: number;
  staff_on_duty: number;
  occupancy_rate: number;
}

export interface MultiVenueDashboard {
  total_revenue_today: number;
  total_orders_today: number;
  total_active_orders: number;
  total_reservations: number;
  venues: VenueSummary[];
  alerts: VenueAlert[];
}

export interface VenueAlert {
  id: string;
  venue_id: string;
  venue_name: string;
  type: 'order' | 'reservation' | 'stock' | 'staff' | 'system' | 'waiter_call';
  severity: 'info' | 'warning' | 'error';
  message: string;
  data?: Record<string, any>;
  created_at: string;
  is_read: boolean;
}

// Notifications
export interface Notification {
  id: string;
  venue_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export type NotificationType = 
  | 'new_order'
  | 'order_ready'
  | 'order_updated'
  | 'new_reservation'
  | 'low_stock'
  | 'shift_reminder'
  | 'payment_received'
  | 'waiter_call'
  | 'system';

// Real-time Sync Events
export type SyncEventType = 
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_ITEM_STATUS_CHANGED'
  | 'TABLE_STATUS_CHANGED'
  | 'WAITER_CALL'
  | 'RESERVATION_UPDATED'
  | 'NOTIFICATION';

export interface SyncEvent {
  type: SyncEventType;
  venue_id: string;
  payload: any;
  timestamp: string;
}
