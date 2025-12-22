import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useVenueStore } from '@/stores';

// Orders Hook
export function useOrders() {
  const { currentVenue } = useVenueStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('created_at', { ascending: false });
    
    if (!error) setOrders(data || []);
    setIsLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrder = async (id: string, updates: any) => {
    const { error } = await supabase.from('orders').update(updates).eq('id', id);
    if (!error) fetchOrders();
    return { error };
  };

  const createOrder = async (order: any) => {
    const { data, error } = await supabase.from('orders').insert(order).select().single();
    if (!error) fetchOrders();
    return { data, error };
  };

  return { orders, isLoading, fetchOrders, updateOrder, createOrder };
}

// Reservations Hook
export function useReservations() {
  const { currentVenue } = useVenueStore();
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReservations = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .order('reservation_date', { ascending: true });
      
      if (!error) setReservations(data || []);
    } catch (e) {
      console.log('Reservations fetch failed');
    }
    setIsLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

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
    const { data: reservation } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();
    
    const { error } = await supabase.from('reservations').update(updates).eq('id', id);
    
    if (!error) {
      if (updates.status === 'confirmed' && reservation) {
        const { data: venue } = await supabase
          .from('venues')
          .select('name')
          .eq('id', reservation.venue_id)
          .single();
        
        await supabase.from('notifications').insert({
          user_phone: reservation.customer_phone,
          type: 'reservation_confirmed',
          title: 'Rezervasyon Onaylandı',
          message: `${venue?.name || 'Mekan'} - ${reservation.reservation_date} ${reservation.reservation_time}`,
          data: {
            reservation_id: id,
            venue_id: reservation.venue_id,
            venue_name: venue?.name,
            date: reservation.reservation_date,
            time: reservation.reservation_time,
            guests: reservation.party_size
          },
          is_read: false
        });
      }
      fetchReservations();
    }
    return { error };
  };

  const deleteReservation = async (id: string) => {
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (!error) fetchReservations();
    return { error };
  };

  return { reservations, isLoading, fetchReservations, createReservation, updateReservation, deleteReservation };
}

// Menu Items Hook
export function useMenuItems() {
  const { currentVenue } = useVenueStore();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMenu = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('name');
    
    if (!error) setMenuItems(data || []);
    setIsLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const createMenuItem = async (item: any) => {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({ ...item, venue_id: currentVenue?.id })
      .select()
      .single();
    if (!error) fetchMenu();
    return { data, error };
  };

  const updateMenuItem = async (id: string, updates: any) => {
    const { error } = await supabase.from('menu_items').update(updates).eq('id', id);
    if (!error) fetchMenu();
    return { error };
  };

  const deleteMenuItem = async (id: string) => {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (!error) fetchMenu();
    return { error };
  };

  return { menuItems, categories, isLoading, fetchMenu, createMenuItem, updateMenuItem, deleteMenuItem };
}

// Staff Hook
export function useStaff() {
  const { currentVenue } = useVenueStore();
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStaff = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('name');
    
    if (!error) setStaff(data || []);
    setIsLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  return { staff, isLoading, fetchStaff };
}

// Coupons Hook
export function useCoupons() {
  const { currentVenue } = useVenueStore();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .order('created_at', { ascending: false });
      
      if (!error) setCoupons(data || []);
    } catch (e) {
      console.log('Coupons fetch failed');
    }
    setIsLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const createCoupon = async (coupon: any) => {
    const { data, error } = await supabase
      .from('coupons')
      .insert({ ...coupon, venue_id: currentVenue?.id })
      .select()
      .single();
    if (!error) fetchCoupons();
    return { data, error };
  };

  return { coupons, isLoading, fetchCoupons, createCoupon };
}
