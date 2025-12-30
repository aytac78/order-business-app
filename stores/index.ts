import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Venue, VenueSummary, UserVenue, VenueAlert } from '@/types';

// =============================================
// VENUE STORE
// =============================================
interface VenueState {
  currentVenue: Venue | null;
  currentVenueId: string | null;
  venues: Venue[];
  userVenues: UserVenue[];
  venueSummaries: VenueSummary[];
  alerts: VenueAlert[];
  isLoading: boolean;
  error: string | null;
  
  setCurrentVenue: (venue: Venue | null) => void;
  setCurrentVenueById: (venueId: string) => void;
  setVenues: (venues: Venue[]) => void;
  setUserVenues: (userVenues: UserVenue[]) => void;
  setVenueSummaries: (summaries: VenueSummary[]) => void;
  setAlerts: (alerts: VenueAlert[]) => void;
  markAlertRead: (alertId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getCurrentVenueRole: () => string | null;
  hasPermission: (permission: string) => boolean;
}

export const useVenueStore = create<VenueState>()(
  persist(
    (set, get) => ({
      currentVenue: null,
      currentVenueId: null,
      venues: [],
      userVenues: [],
      venueSummaries: [],
      alerts: [],
      isLoading: false,
      error: null,
      
      setCurrentVenue: (venue) => set({ 
        currentVenue: venue,
        currentVenueId: venue?.id || null 
      }),
      
      setCurrentVenueById: (venueId) => {
        const venues = get().venues;
        const venue = venues.find(v => v.id === venueId) || null;
        set({ currentVenue: venue, currentVenueId: venueId });
      },
      
      setVenues: (venues) => set({ venues }),
      setUserVenues: (userVenues) => set({ userVenues }),
      setVenueSummaries: (summaries) => set({ venueSummaries: summaries }),
      setAlerts: (alerts) => set({ alerts }),
      
      markAlertRead: (alertId) => set((state) => ({
        alerts: state.alerts.map(alert => 
          alert.id === alertId ? { ...alert, is_read: true } : alert
        )
      })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      getCurrentVenueRole: () => {
        const { currentVenueId, userVenues } = get();
        if (!currentVenueId) return null;
        const userVenue = userVenues.find(uv => uv.venue_id === currentVenueId);
        return userVenue?.role || null;
      },
      
      hasPermission: (permission: string) => {
        const { currentVenueId, userVenues } = get();
        if (!currentVenueId) return false;
        const userVenue = userVenues.find(uv => uv.venue_id === currentVenueId);
        if (!userVenue) return false;
        if (userVenue.role === 'owner') return true;
        return userVenue.permissions.includes(permission as never);
      },
    }),
    {
      name: 'order-venue-storage',
      partialize: (state) => ({ currentVenueId: state.currentVenueId }),
    }
  )
);

// =============================================
// NOTIFICATION STORE
// =============================================
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

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  soundEnabled: true,
  
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications].slice(0, 50),
    unreadCount: state.unreadCount + 1
  })),
  
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, is_read: true })),
    unreadCount: 0
  })),
  
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}));

// =============================================
// UI STATE STORE
// =============================================
interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  venueDrawerOpen: boolean;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setVenueDrawerOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      venueDrawerOpen: false,
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setVenueDrawerOpen: (open) => set({ venueDrawerOpen: open }),
    }),
    { name: 'order-ui-storage' }
  )
);

// =============================================
// TABLE TYPES & STORE
// =============================================
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';
export type TableShape = 'square' | 'round' | 'rectangle';

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

export interface Table {
  id: string;
  venue_id?: string;
  number: string;
  name?: string;
  capacity: number;
  section: string;
  status: TableStatus;
  shape: TableShape;
  position: { x: number; y: number };
  position_x?: number;
  position_y?: number;
  is_active?: boolean;
  currentOrder?: TableOrder;
  reservation?: TableReservation;
}

interface TableState {
  tables: Table[];
  isLoading: boolean;
  error: string | null;
  
  setTables: (tables: Table[]) => void;
  updateTableLocal: (id: string, updates: Partial<Table>) => void;
  addTableLocal: (table: Table) => void;
  deleteTableLocal: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTableStore = create<TableState>()((set) => ({
  tables: [],
  isLoading: false,
  error: null,
  
  setTables: (tables) => set({ tables }),
  updateTableLocal: (id, updates) => set((state) => ({
    tables: state.tables.map((t) => t.id === id ? { ...t, ...updates } : t)
  })),
  addTableLocal: (table) => set((state) => ({
    tables: [...state.tables, table]
  })),
  deleteTableLocal: (id) => set((state) => ({
    tables: state.tables.filter((t) => t.id !== id)
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

// =============================================
// ORDER STORE
// =============================================
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  status?: 'pending' | 'preparing' | 'ready';
}

export interface Order {
  id: string;
  venue_id: string;
  order_number?: string;
  table_number?: string;
  customer_name?: string;
  type: 'dine_in' | 'takeaway' | 'delivery' | 'qr_order';
  status: string;
  items: OrderItem[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  discount_type?: 'percent' | 'amount';
  total: number;
  payment_status?: string;
  payment_method?: string;
  waiter_name?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOrderStore = create<OrderState>()((set) => ({
  orders: [],
  isLoading: false,
  error: null,
  
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
  updateOrder: (id, updates) => set((state) => ({
    orders: state.orders.map((o) => o.id === id ? { ...o, ...updates } : o)
  })),
  removeOrder: (id) => set((state) => ({
    orders: state.orders.filter((o) => o.id !== id)
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

// =============================================
// CART STORE
// =============================================
export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  options?: { name: string; choice: string; price: number }[];
}

interface CartState {
  items: CartItem[];
  tableNumber: string | null;
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'qr_order';
  notes: string;
  orderId: string | null;
  
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  setTableNumber: (tableNumber: string | null) => void;
  setOrderType: (type: 'dine_in' | 'takeaway' | 'delivery' | 'qr_order') => void;
  setNotes: (notes: string) => void;
  setOrderId: (orderId: string | null) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  tableNumber: null,
  orderType: 'dine_in',
  notes: '',
  orderId: null,
  
  addItem: (item) => {
    const id = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => {
      const existingItem = state.items.find(
        i => i.product_id === item.product_id && 
             i.notes === item.notes &&
             JSON.stringify(i.options) === JSON.stringify(item.options)
      );
      
      if (existingItem) {
        return {
          items: state.items.map(i => 
            i.id === existingItem.id 
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          )
        };
      }
      
      return { items: [...state.items, { ...item, id }] };
    });
  },
  
  updateItemQuantity: (id, quantity) => set((state) => ({
    items: quantity <= 0 
      ? state.items.filter(i => i.id !== id)
      : state.items.map(i => i.id === id ? { ...i, quantity } : i)
  })),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),
  
  setTableNumber: (tableNumber) => set({ tableNumber }),
  setOrderType: (orderType) => set({ orderType }),
  setNotes: (notes) => set({ notes }),
  setOrderId: (orderId) => set({ orderId }),
  
  clearCart: () => set({ 
    items: [], 
    tableNumber: null, 
    orderType: 'dine_in', 
    notes: '',
    orderId: null 
  }),
  
  getTotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => {
      const optionsPrice = item.options?.reduce((s, o) => s + o.price, 0) || 0;
      return sum + ((item.price + optionsPrice) * item.quantity);
    }, 0);
  },
}));
// Re-export authStore
export * from './authStore';
