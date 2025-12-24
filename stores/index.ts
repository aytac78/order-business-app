import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ TYPES ============

export interface Venue {
  id: string;
  name: string;
  slug?: string;
  type?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  currency?: string;
  timezone?: string;
  is_active?: boolean;
}

export interface TableOrder {
  id: string;
  total: number;
  itemCount: number;
  duration: number;
  waiter: string;
}

export interface TableReservation {
  name: string;
  time: string;
  guests: number;
}

export interface TableWithDetails {
  id: string;
  number: string;
  capacity: number;
  section: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  shape: 'square' | 'round' | 'rectangle';
  position: { x: number; y: number };
  currentOrder?: TableOrder;
  reservation?: TableReservation;
}

export interface Staff {
  id: string;
  name: string;
  role: 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'reception';
  phone?: string;
  email?: string;
  pinCode?: string;
  isActive: boolean;
  lastActive?: string;
}

export interface VenueAlert {
  id: string;
  venue_id: string;
  venue_name?: string;
  type: 'order' | 'reservation' | 'stock' | 'staff' | 'system';
  severity: 'info' | 'warning' | 'error';
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  notes?: string;
}

export interface Order {
  id: string;
  venue_id: string;
  table_id?: string;
  order_number: string;
  type: 'dine_in' | 'takeaway' | 'delivery' | 'qr_order';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  waiter_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncEvent {
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_ITEM_STATUS_CHANGED' | 'TABLE_STATUS_CHANGED' | 'WAITER_CALL' | 'RESERVATION_UPDATED' | 'NOTIFICATION';
  venue_id: string;
  payload: any;
  timestamp: string;
}

// ============ VENUE STORE ============

interface VenueState {
  currentVenue: Venue | null;
  currentVenueId: string | null;
  venues: Venue[];
  alerts: VenueAlert[];
  isLoading: boolean;
  error: string | null;
  setCurrentVenue: (venue: Venue | null) => void;
  setVenues: (venues: Venue[]) => void;
  setAlerts: (alerts: VenueAlert[]) => void;
  addAlert: (alert: VenueAlert) => void;
  markAlertRead: (alertId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useVenueStore = create<VenueState>()(
  persist(
    (set) => ({
      currentVenue: { id: '1', name: 'ORDER Bodrum Marina', city: 'Bodrum', phone: '0252 123 4567', email: 'info@order.com' },
      currentVenueId: '1',
      venues: [
        { id: '1', name: 'ORDER Bodrum Marina', city: 'Bodrum' },
        { id: '2', name: 'ORDER Türkbükü Beach', city: 'Bodrum' },
        { id: '3', name: 'ORDER Yalıkavak', city: 'Bodrum' },
      ],
      alerts: [],
      isLoading: false,
      error: null,
      setCurrentVenue: (venue) => set({ currentVenue: venue, currentVenueId: venue?.id || null }),
      setVenues: (venues) => set({ venues }),
      setAlerts: (alerts) => set({ alerts: alerts.slice(0, 100) }),
      addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts].slice(0, 100) })),
      markAlertRead: (alertId) => set((state) => ({ alerts: state.alerts.map(a => a.id === alertId ? { ...a, is_read: true } : a) })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    { name: 'order-venue-storage', partialize: (state) => ({ currentVenueId: state.currentVenueId }) }
  )
);

// ============ TABLE STORE ============

const initialTables: TableWithDetails[] = [
  { id: '1', number: '1', capacity: 2, section: 'İç Mekan', status: 'occupied', shape: 'square', position: { x: 0, y: 0 }, currentOrder: { id: 'ORD-101', total: 450, itemCount: 5, duration: 45, waiter: 'Ahmet' } },
  { id: '2', number: '2', capacity: 2, section: 'İç Mekan', status: 'available', shape: 'square', position: { x: 1, y: 0 } },
  { id: '3', number: '3', capacity: 4, section: 'İç Mekan', status: 'occupied', shape: 'rectangle', position: { x: 2, y: 0 }, currentOrder: { id: 'ORD-102', total: 890, itemCount: 8, duration: 30, waiter: 'Mehmet' } },
  { id: '4', number: '4', capacity: 4, section: 'İç Mekan', status: 'reserved', shape: 'rectangle', position: { x: 0, y: 1 }, reservation: { name: 'Yılmaz', time: '20:00', guests: 4 } },
  { id: '5', number: '5', capacity: 6, section: 'İç Mekan', status: 'cleaning', shape: 'rectangle', position: { x: 1, y: 1 } },
  { id: '6', number: '6', capacity: 2, section: 'İç Mekan', status: 'available', shape: 'round', position: { x: 2, y: 1 } },
  { id: '7', number: '7', capacity: 4, section: 'Teras', status: 'occupied', shape: 'round', position: { x: 0, y: 0 }, currentOrder: { id: 'ORD-103', total: 1250, itemCount: 12, duration: 60, waiter: 'Ayşe' } },
  { id: '8', number: '8', capacity: 4, section: 'Teras', status: 'available', shape: 'round', position: { x: 1, y: 0 } },
  { id: '9', number: '9', capacity: 6, section: 'Teras', status: 'occupied', shape: 'rectangle', position: { x: 2, y: 0 }, currentOrder: { id: 'ORD-104', total: 680, itemCount: 6, duration: 25, waiter: 'Ahmet' } },
  { id: '10', number: '10', capacity: 8, section: 'Teras', status: 'reserved', shape: 'rectangle', position: { x: 0, y: 1 }, reservation: { name: 'Kaya', time: '21:00', guests: 7 } },
  { id: '11', number: '11', capacity: 4, section: 'Bahçe', status: 'available', shape: 'round', position: { x: 0, y: 0 } },
  { id: '12', number: '12', capacity: 4, section: 'Bahçe', status: 'available', shape: 'round', position: { x: 1, y: 0 } },
  { id: '13', number: '13', capacity: 6, section: 'Bahçe', status: 'occupied', shape: 'rectangle', position: { x: 2, y: 0 }, currentOrder: { id: 'ORD-105', total: 2100, itemCount: 15, duration: 90, waiter: 'Mehmet' } },
  { id: '14', number: '14', capacity: 10, section: 'Bahçe', status: 'available', shape: 'rectangle', position: { x: 0, y: 1 } },
  { id: '15', number: 'VIP 1', capacity: 8, section: 'VIP', status: 'reserved', shape: 'rectangle', position: { x: 0, y: 0 }, reservation: { name: 'Demir', time: '20:30', guests: 6 } },
  { id: '16', number: 'VIP 2', capacity: 12, section: 'VIP', status: 'available', shape: 'rectangle', position: { x: 1, y: 0 } },
];

interface TableState {
  tables: TableWithDetails[];
  sections: string[];
  setTables: (tables: TableWithDetails[]) => void;
  updateTable: (id: string, updates: Partial<TableWithDetails>) => void;
  addTable: (table: TableWithDetails) => void;
  deleteTable: (id: string) => void;
  getTablesBySection: (section: string) => TableWithDetails[];
  getTablesByStatus: (status: TableWithDetails['status']) => TableWithDetails[];
}

export const useTableStore = create<TableState>()(
  persist(
    (set, get) => ({
      tables: initialTables,
      sections: ['İç Mekan', 'Teras', 'Bahçe', 'VIP'],
      setTables: (tables) => set({ tables }),
      updateTable: (id, updates) => set((state) => ({ tables: state.tables.map(t => t.id === id ? { ...t, ...updates } : t) })),
      addTable: (table) => set((state) => ({ tables: [...state.tables, table] })),
      deleteTable: (id) => set((state) => ({ tables: state.tables.filter(t => t.id !== id) })),
      getTablesBySection: (section) => get().tables.filter(t => t.section === section),
      getTablesByStatus: (status) => get().tables.filter(t => t.status === status),
    }),
    { name: 'order-table-storage' }
  )
);

// ============ STAFF STORE ============

const initialStaff: Staff[] = [
  { id: '1', name: 'Ahmet Yılmaz', role: 'owner', phone: '0532 111 2233', email: 'ahmet@order.com', pinCode: '1234', isActive: true },
  { id: '2', name: 'Mehmet Demir', role: 'manager', phone: '0533 222 3344', pinCode: '2345', isActive: true },
  { id: '3', name: 'Ayşe Kaya', role: 'cashier', phone: '0534 333 4455', pinCode: '3456', isActive: true },
  { id: '4', name: 'Fatma Şen', role: 'waiter', phone: '0535 444 5566', pinCode: '4567', isActive: true },
  { id: '5', name: 'Ali Öztürk', role: 'kitchen', phone: '0536 555 6677', pinCode: '5678', isActive: true },
  { id: '6', name: 'Zeynep Arslan', role: 'reception', phone: '0537 666 7788', pinCode: '6789', isActive: false },
];

interface StaffState {
  staff: Staff[];
  addStaff: (staff: Staff) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  loginWithPin: (pin: string) => Staff | null;
}

export const useStaffStore = create<StaffState>()(
  persist(
    (set, get) => ({
      staff: initialStaff,
      addStaff: (newStaff) => set((state) => ({ staff: [...state.staff, newStaff] })),
      updateStaff: (id, updates) => set((state) => ({ staff: state.staff.map(s => s.id === id ? { ...s, ...updates } : s) })),
      deleteStaff: (id) => set((state) => ({ staff: state.staff.filter(s => s.id !== id) })),
      loginWithPin: (pin) => get().staff.find(s => s.pinCode === pin && s.isActive) || null,
    }),
    { name: 'order-staff-storage' }
  )
);

// ============ ORDER STORE ============

interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  updateItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => void;
  getOrdersByStatus: (status: Order['status']) => Order[];
  getOrdersByTable: (tableId: string) => Order[];
  getActiveOrders: () => Order[];
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
      updateOrder: (id, updates) => set((state) => ({ orders: state.orders.map(o => o.id === id ? { ...o, ...updates } : o) })),
      updateOrderStatus: (id, status) => set((state) => ({ orders: state.orders.map(o => o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o) })),
      updateItemStatus: (orderId, itemId, status) => set((state) => ({
        orders: state.orders.map(o => {
          if (o.id !== orderId) return o;
          const items = o.items.map(i => i.id === itemId ? { ...i, status } : i);
          const allReady = items.every(i => i.status === 'ready');
          const anyPreparing = items.some(i => i.status === 'preparing');
          let orderStatus = o.status;
          if (allReady) orderStatus = 'ready';
          else if (anyPreparing) orderStatus = 'preparing';
          return { ...o, items, status: orderStatus, updated_at: new Date().toISOString() };
        })
      })),
      getOrdersByStatus: (status) => get().orders.filter(o => o.status === status),
      getOrdersByTable: (tableId) => get().orders.filter(o => o.table_id === tableId),
      getActiveOrders: () => get().orders.filter(o => !['completed', 'cancelled'].includes(o.status)),
    }),
    { name: 'order-orders-storage' }
  )
);

// ============ NOTIFICATION STORE ============

interface NotificationState {
  notifications: VenueAlert[];
  unreadCount: number;
  soundEnabled: boolean;
  addNotification: (notification: VenueAlert) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  toggleSound: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      soundEnabled: true,
      addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications].slice(0, 50), unreadCount: state.unreadCount + 1 })),
      markAsRead: (id) => set((state) => ({ notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n), unreadCount: Math.max(0, state.unreadCount - 1) })),
      markAllAsRead: () => set((state) => ({ notifications: state.notifications.map(n => ({ ...n, is_read: true })), unreadCount: 0 })),
      clearAll: () => set({ notifications: [], unreadCount: 0 }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
    }),
    { name: 'order-notification-storage' }
  )
);

// ============ UI STORE ============

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (lang: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'light',
      language: 'tr',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'order-ui-storage' }
  )
);

// ============ BROADCAST SYNC ============

let syncChannel: BroadcastChannel | null = null;

export const initSyncChannel = (venueId: string, onEvent: (event: SyncEvent) => void) => {
  if (typeof window === 'undefined') return;
  syncChannel = new BroadcastChannel(`order-sync-${venueId}`);
  syncChannel.onmessage = (e) => onEvent(e.data);
};

export const broadcastSync = (event: SyncEvent) => {
  if (syncChannel) syncChannel.postMessage(event);
};

export const closeSyncChannel = () => {
  if (syncChannel) { syncChannel.close(); syncChannel = null; }
};

// ============ WAITER CALL STORE ============

interface WaiterCall {
  id: string;
  tableId: string;
  tableNumber: string;
  type: 'call' | 'bill' | 'complaint';
  status: 'pending' | 'acknowledged';
  createdAt: string;
}

interface WaiterCallState {
  calls: WaiterCall[];
  addCall: (call: WaiterCall) => void;
  acknowledgeCall: (id: string) => void;
  removeCall: (id: string) => void;
  clearAll: () => void;
}

export const useWaiterCallStore = create<WaiterCallState>((set) => ({
  calls: [],
  addCall: (call) => set((state) => ({ calls: [...state.calls, call] })),
  acknowledgeCall: (id) => set((state) => ({
    calls: state.calls.map(c => c.id === id ? { ...c, status: 'acknowledged' } : c)
  })),
  removeCall: (id) => set((state) => ({ calls: state.calls.filter(c => c.id !== id) })),
  clearAll: () => set({ calls: [] }),
}));
