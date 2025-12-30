import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useVenueStore, useTableStore, useOrderStore, Table, Order } from '@/stores';

// =============================================
// USE TABLES HOOK
// =============================================
export function useTables() {
  const { currentVenue } = useVenueStore();
  const { tables, setTables, updateTableLocal, setLoading, setError } = useTableStore();
  const [isLoading, setIsLoading] = useState(true);

  const fetchTables = useCallback(async () => {
    if (!currentVenue?.id) return;

    try {
      setIsLoading(true);
      setLoading(true);

      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .eq('is_active', true)
        .order('section')
        .order('number');

      if (error) throw error;

      // Verileri store formatına dönüştür
      const formattedTables: Table[] = (data || []).map(t => ({
        id: t.id,
        venue_id: t.venue_id,
        number: t.number,
        name: t.name,
        capacity: t.capacity,
        section: t.section || 'Ana Salon',
        status: t.status || 'available',
        shape: t.shape || 'square',
        position: { x: t.position_x || 0, y: t.position_y || 0 },
        position_x: t.position_x,
        position_y: t.position_y,
        is_active: t.is_active
      }));

      setTables(formattedTables);
    } catch (err) {
      console.error('Masalar yüklenirken hata:', err);
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, [currentVenue?.id, supabase, setTables, setLoading, setError]);

  const updateTable = useCallback(async (id: string, updates: Partial<Table>) => {
    try {
      const dbUpdates: Record<string, unknown> = { ...updates };
      
      // Position objesini ayrı kolonlara dönüştür
      if (updates.position) {
        dbUpdates.position_x = updates.position.x;
        dbUpdates.position_y = updates.position.y;
        delete dbUpdates.position;
      }

      const { error } = await supabase
        .from('tables')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      // Local state güncelle
      updateTableLocal(id, updates);
    } catch (err) {
      console.error('Masa güncellenirken hata:', err);
      throw err;
    }
  }, [supabase, updateTableLocal]);

  const createTable = useCallback(async (table: Omit<Table, 'id'>) => {
    if (!currentVenue?.id) throw new Error('Venue seçili değil');

    try {
      const { data, error } = await supabase
        .from('tables')
        .insert({
          venue_id: currentVenue.id,
          number: table.number,
          name: table.name,
          capacity: table.capacity,
          section: table.section,
          status: table.status || 'available',
          shape: table.shape || 'square',
          position_x: table.position?.x || 0,
          position_y: table.position?.y || 0,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Listeyi yeniden yükle
      await fetchTables();
      return data;
    } catch (err) {
      console.error('Masa oluşturulurken hata:', err);
      throw err;
    }
  }, [currentVenue?.id, supabase, fetchTables]);

  const deleteTable = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      // Listeyi yeniden yükle
      await fetchTables();
    } catch (err) {
      console.error('Masa silinirken hata:', err);
      throw err;
    }
  }, [supabase, fetchTables]);

  // İlk yükleme
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Realtime subscription
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('tables-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `venue_id=eq.${currentVenue.id}`
        },
        () => {
          fetchTables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentVenue?.id, supabase, fetchTables]);

  return {
    tables,
    isLoading,
    fetchTables,
    updateTable,
    createTable,
    deleteTable
  };
}

// =============================================
// USE ORDERS HOOK
// =============================================
export function useOrders(statusFilter?: string[]) {
  const { currentVenue } = useVenueStore();
  const { orders, setOrders, addOrder, updateOrder, removeOrder, setLoading, setError } = useOrderStore();
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!currentVenue?.id) return;

    try {
      setIsLoading(true);
      setLoading(true);

      let query = supabase
        .from('orders')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders(data || []);
    } catch (err) {
      console.error('Siparişler yüklenirken hata:', err);
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, [currentVenue?.id, supabase, statusFilter, setOrders, setLoading, setError]);

  const createOrder = useCallback(async (orderData: Partial<Order>) => {
    if (!currentVenue?.id) throw new Error('Venue seçili değil');

    try {
      // Sipariş numarası oluştur
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          venue_id: currentVenue.id,
          order_number: orderNumber,
          table_number: orderData.table_number,
          customer_name: orderData.customer_name,
          type: orderData.type || 'dine_in',
          status: 'pending',
          items: orderData.items || [],
          total: orderData.total || 0,
          payment_status: 'pending',
          waiter_name: orderData.waiter_name,
          notes: orderData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      addOrder(data);
      return data;
    } catch (err) {
      console.error('Sipariş oluşturulurken hata:', err);
      throw err;
    }
  }, [currentVenue?.id, supabase, addOrder]);

  const updateOrderStatus = useCallback(async (id: string, status: string, additionalUpdates?: Partial<Order>) => {
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalUpdates
      };

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      updateOrder(id, updates);
    } catch (err) {
      console.error('Sipariş güncellenirken hata:', err);
      throw err;
    }
  }, [supabase, updateOrder]);

  const addItemsToOrder = useCallback(async (orderId: string, newItems: Order['items']) => {
    try {
      // Mevcut siparişi al
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('items, total')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Yeni itemları ekle
      const existingItems = currentOrder.items || [];
      const updatedItems = [...existingItems, ...newItems];
      
      // Yeni toplamı hesapla
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          items: updatedItems,
          total: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      updateOrder(orderId, { items: updatedItems, total: newTotal });
    } catch (err) {
      console.error('Ürünler eklenirken hata:', err);
      throw err;
    }
  }, [supabase, updateOrder]);

  // İlk yükleme
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime subscription
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `venue_id=eq.${currentVenue.id}`
        },
        (payload) => {
          const newOrder = payload.new as Order;
          if (!statusFilter || statusFilter.includes(newOrder.status)) {
            addOrder(newOrder);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `venue_id=eq.${currentVenue.id}`
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          if (statusFilter && !statusFilter.includes(updatedOrder.status)) {
            removeOrder(updatedOrder.id);
          } else {
            updateOrder(updatedOrder.id, updatedOrder);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
          filter: `venue_id=eq.${currentVenue.id}`
        },
        (payload) => {
          removeOrder(payload.old.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentVenue?.id, supabase, statusFilter, addOrder, updateOrder, removeOrder]);

  return {
    orders,
    isLoading,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    addItemsToOrder
  };
}

// =============================================
// USE PRODUCTS HOOK
// =============================================
export interface Product {
  id: string;
  venue_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  preparation_time?: number;
  sort_order: number;
}

export interface Category {
  id: string;
  venue_id: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
}

export function useProducts() {
  const { currentVenue } = useVenueStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentVenue?.id) return;

    try {
      setIsLoading(true);

      // Kategorileri çek
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .eq('is_active', true)
        .order('sort_order');

      if (categoriesError) throw categoriesError;

      // Ürünleri çek
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .order('sort_order');

      if (productsError) throw productsError;

      setCategories(categoriesData || []);
      setProducts(productsData || []);
    } catch (err) {
      console.error('Ürünler yüklenirken hata:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentVenue?.id, supabase]);

  const updateProductAvailability = useCallback(async (productId: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: isAvailable })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, is_available: isAvailable } : p
      ));
    } catch (err) {
      console.error('Ürün güncellenirken hata:', err);
      throw err;
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    products,
    categories,
    isLoading,
    fetchData,
    updateProductAvailability
  };
}

// =============================================
// USE VENUE HOOK
// =============================================
export function useVenue() {
  const { currentVenue, setCurrentVenue, setVenues, venues } = useVenueStore();
  const [isLoading, setIsLoading] = useState(true);

  const fetchVenue = useCallback(async (venueId: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single();

      if (error) throw error;

      setCurrentVenue(data);
      return data;
    } catch (err) {
      console.error('Mekan yüklenirken hata:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, setCurrentVenue]);

  const fetchAllVenues = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setVenues(data || []);
      
      // İlk mekanı seç (eğer henüz seçili değilse)
      if (!currentVenue && data && data.length > 0) {
        setCurrentVenue(data[0]);
      }

      return data;
    } catch (err) {
      console.error('Mekanlar yüklenirken hata:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [supabase, setVenues, currentVenue, setCurrentVenue]);

  return {
    currentVenue,
    venues,
    isLoading,
    fetchVenue,
    fetchAllVenues,
    setCurrentVenue
  };
}

// =============================================
// USE RESERVATIONS HOOK
// =============================================
export function useReservations() {
  const { currentVenue } = useVenueStore();
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReservations = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('date', { ascending: true });

    if (!error && data) setReservations(data);
    setIsLoading(false);
  }, [currentVenue?.id]);

  const createReservation = async (reservation: any) => {
    const { data, error } = await supabase
      .from('reservations')
      .insert({ ...reservation, venue_id: currentVenue?.id })
      .select()
      .single();
    
    if (!error) fetchReservations();
    return { data, error };
  };

  const updateReservation = async (id: string, updates: any) => {
    const { error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', id);
    
    if (!error) fetchReservations();
    return { error };
  };

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return { reservations, isLoading, fetchReservations, createReservation, updateReservation };
}

// =============================================
// USE COUPONS HOOK
// =============================================
export function useCoupons() {
  const { currentVenue } = useVenueStore();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('created_at', { ascending: false });

    if (!error && data) setCoupons(data);
    setIsLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  return { coupons, isLoading, fetchCoupons };
}
