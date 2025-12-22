import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Venue, VenueSummary, UserVenue, VenueAlert } from '@/types';

// Venue Store
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
      setCurrentVenue: (venue) => set({ currentVenue: venue, currentVenueId: venue?.id || null }),
      setCurrentVenueById: (venueId) => {
        const venue = get().venues.find(v => v.id === venueId) || null;
        set({ currentVenue: venue, currentVenueId: venueId });
      },
      setVenues: (venues) => set({ venues }),
      setUserVenues: (userVenues) => set({ userVenues }),
      setVenueSummaries: (summaries) => set({ venueSummaries: summaries }),
      setAlerts: (alerts) => set({ alerts }),
      markAlertRead: (alertId) => set((state) => ({
        alerts: state.alerts.map(alert => alert.id === alertId ? { ...alert, is_read: true } : alert)
      })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      getCurrentVenueRole: () => {
        const { currentVenueId, userVenues } = get();
        if (!currentVenueId) return null;
        return userVenues.find(uv => uv.venue_id === currentVenueId)?.role || null;
      },
      hasPermission: (permission: string) => {
        const { currentVenueId, userVenues } = get();
        if (!currentVenueId) return false;
        const userVenue = userVenues.find(uv => uv.venue_id === currentVenueId);
        if (!userVenue) return false;
        if (userVenue.role === 'owner') return true;
        return userVenue.permissions.includes(permission as any);
      },
    }),
    { name: 'order-venue-storage', partialize: (state) => ({ currentVenueId: state.currentVenueId }) }
  )
);

// Notification Store
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
    notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, is_read: true })),
    unreadCount: 0
  })),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}));

// UI Store
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

// Table Store
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';
export type TableShape = 'square' | 'round' | 'rectangle';

export interface Table {
  id: string;
  number: string;
  capacity: number;
  section: string;
  status: TableStatus;
  shape: TableShape;
  position: { x: number; y: number };
}

interface TableState {
  tables: Table[];
  setTables: (tables: Table[]) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  addTable: (table: Table) => void;
  deleteTable: (id: string) => void;
}

const initialTables: Table[] = [
  { id: '1', number: '1', capacity: 2, section: 'İç Mekan', status: 'available', shape: 'square', position: { x: 0, y: 0 } },
  { id: '2', number: '2', capacity: 2, section: 'İç Mekan', status: 'available', shape: 'square', position: { x: 1, y: 0 } },
  { id: '3', number: '3', capacity: 4, section: 'İç Mekan', status: 'available', shape: 'rectangle', position: { x: 2, y: 0 } },
  { id: '4', number: '4', capacity: 4, section: 'İç Mekan', status: 'available', shape: 'rectangle', position: { x: 0, y: 1 } },
  { id: '5', number: '5', capacity: 6, section: 'İç Mekan', status: 'available', shape: 'rectangle', position: { x: 1, y: 1 } },
  { id: '6', number: '6', capacity: 2, section: 'İç Mekan', status: 'available', shape: 'round', position: { x: 2, y: 1 } },
  { id: '7', number: '7', capacity: 4, section: 'Teras', status: 'available', shape: 'round', position: { x: 0, y: 0 } },
  { id: '8', number: '8', capacity: 4, section: 'Teras', status: 'available', shape: 'round', position: { x: 1, y: 0 } },
  { id: '9', number: '9', capacity: 6, section: 'Teras', status: 'available', shape: 'rectangle', position: { x: 2, y: 0 } },
  { id: '10', number: '10', capacity: 8, section: 'Teras', status: 'available', shape: 'rectangle', position: { x: 0, y: 1 } },
  { id: '11', number: '11', capacity: 4, section: 'Bahçe', status: 'available', shape: 'round', position: { x: 0, y: 0 } },
  { id: '12', number: '12', capacity: 4, section: 'Bahçe', status: 'available', shape: 'round', position: { x: 1, y: 0 } },
  { id: '13', number: '13', capacity: 6, section: 'Bahçe', status: 'available', shape: 'rectangle', position: { x: 2, y: 0 } },
  { id: '14', number: '14', capacity: 10, section: 'Bahçe', status: 'available', shape: 'rectangle', position: { x: 0, y: 1 } },
  { id: '15', number: 'VIP 1', capacity: 8, section: 'VIP', status: 'available', shape: 'rectangle', position: { x: 0, y: 0 } },
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
      addTable: (table) => set((state) => ({ tables: [...state.tables, table] })),
      deleteTable: (id) => set((state) => ({ tables: state.tables.filter((t) => t.id !== id) })),
    }),
    { name: 'order-table-storage' }
  )
);

// Auth Store
interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  login: (userData: { id: string; name: string; role: string }) => void;
  setUser: (user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (userData) => set({ user: userData, isAuthenticated: true }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'order-auth-storage' }
  )
);
