import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Venue, VenueSummary, UserVenue, VenueAlert } from '@/types';

// Default venue - Nihal's Break Point
const defaultVenue: Venue = {
  id: '1',
  name: "Nihal's Break Point",
  slug: 'nihals-break-point',
  type: 'restaurant',
  address: 'Bodrum Marina, Bodrum',
  city: 'Muğla',
  district: 'Bodrum',
  phone: '+90 252 316 1234',
  email: 'info@nihalsbreakpoint.com',
  currency: 'TRY',
  timezone: 'Europe/Istanbul',
  is_active: true,
  settings: {
    working_hours: {
      monday: { is_open: true, open: '10:00', close: '23:00' },
      tuesday: { is_open: true, open: '10:00', close: '23:00' },
      wednesday: { is_open: true, open: '10:00', close: '23:00' },
      thursday: { is_open: true, open: '10:00', close: '23:00' },
      friday: { is_open: true, open: '10:00', close: '00:00' },
      saturday: { is_open: true, open: '10:00', close: '00:00' },
      sunday: { is_open: true, open: '10:00', close: '22:00' },
    },
    reservation_enabled: true,
    qr_menu_enabled: true,
    online_ordering_enabled: true,
    min_order_amount: 100,
    service_charge_percent: 10,
    tax_rate: 8,
    auto_accept_orders: true,
    notification_sounds: true,
    theme_color: '#f97316',
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

interface VenueState {
  // Current venue
  currentVenue: Venue | null;
  currentVenueId: string | null;
  
  // All venues user has access to
  venues: Venue[];
  userVenues: UserVenue[];
  
  // Multi-venue dashboard data
  venueSummaries: VenueSummary[];
  alerts: VenueAlert[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentVenue: (venue: Venue | null) => void;
  setCurrentVenueById: (venueId: string) => void;
  setVenues: (venues: Venue[]) => void;
  setUserVenues: (userVenues: UserVenue[]) => void;
  setVenueSummaries: (summaries: VenueSummary[]) => void;
  setAlerts: (alerts: VenueAlert[]) => void;
  markAlertRead: (alertId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getCurrentVenueRole: () => string | null;
  hasPermission: (permission: string) => boolean;
}

export const useVenueStore = create<VenueState>()(
  persist(
    (set, get) => ({
      // Initial state - varsayılan venue ile başla
      currentVenue: defaultVenue,
      currentVenueId: defaultVenue.id,
      venues: [defaultVenue],
      userVenues: [],
      venueSummaries: [],
      alerts: [],
      isLoading: false,
      error: null,
      
      // Actions
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
      
      // Computed
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
        // Owner has all permissions
        if (userVenue.role === 'owner') return true;
        return userVenue.permissions.includes(permission as any);
      },
    }),
    {
      name: 'order-venue-storage',
      partialize: (state) => ({ 
        currentVenueId: state.currentVenueId,
        currentVenue: state.currentVenue,
        venues: state.venues,
      }),
    }
  )
);

// Notification store
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

export const useNotificationStore = create<NotificationState>((set, get) => ({
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

// UI State store
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
    {
      name: 'order-ui-storage',
    }
  )
);

// Table types
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
  number: string;
  capacity: number;
  section: string;
  status: TableStatus;
  shape: TableShape;
  position: { x: number; y: number };
  currentOrder?: TableOrder;
  reservation?: TableReservation;
}

// Table Store
interface TableState {
  tables: Table[];
  setTables: (tables: Table[]) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  addTable: (table: Table) => void;
  deleteTable: (id: string) => void;
  swapTablePositions: (id1: string, id2: string) => void;
}

const initialTables: Table[] = [
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

export const useTableStore = create<TableState>()(
  persist(
    (set) => ({
      tables: initialTables,
      setTables: (tables) => set({ tables }),
      updateTable: (id, updates) => set((state) => ({
        tables: state.tables.map((t) => t.id === id ? { ...t, ...updates } : t)
      })),
      addTable: (table) => set((state) => ({
        tables: [...state.tables, table]
      })),
      deleteTable: (id) => set((state) => ({
        tables: state.tables.filter((t) => t.id !== id)
      })),
      swapTablePositions: (id1, id2) => set((state) => {
        const table1 = state.tables.find(t => t.id === id1);
        const table2 = state.tables.find(t => t.id === id2);
        if (!table1 || !table2) return state;
        
        return {
          tables: state.tables.map(t => {
            if (t.id === id1) return { ...t, position: table2.position };
            if (t.id === id2) return { ...t, position: table1.position };
            return t;
          })
        };
      }),
    }),
    {
      name: 'order-table-storage',
    }
  )
);

// Panel PIN Store
interface PinState {
  isAuthenticated: boolean;
  authenticatedPanels: string[];
  
  authenticate: (panel: string) => void;
  logout: (panel: string) => void;
  logoutAll: () => void;
  isAuthenticatedForPanel: (panel: string) => boolean;
}

export const usePinStore = create<PinState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      authenticatedPanels: [],
      
      authenticate: (panel) => set((state) => ({
        isAuthenticated: true,
        authenticatedPanels: [...new Set([...state.authenticatedPanels, panel])]
      })),
      
      logout: (panel) => set((state) => ({
        authenticatedPanels: state.authenticatedPanels.filter(p => p !== panel),
        isAuthenticated: state.authenticatedPanels.filter(p => p !== panel).length > 0
      })),
      
      logoutAll: () => set({
        isAuthenticated: false,
        authenticatedPanels: []
      }),
      
      isAuthenticatedForPanel: (panel) => {
        return get().authenticatedPanels.includes(panel);
      }
    }),
    {
      name: 'order-pin-storage',
    }
  )
);
