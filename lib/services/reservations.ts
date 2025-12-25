import { supabase } from '../supabase';

export interface Reservation {
  id: string;
  venue_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  date: string;
  time: string;
  party_size: number;
  table_ids: string[] | null;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  deposit_amount: number | null;
  deposit_paid: boolean;
  notes: string | null;
  special_requests: string | null;
  created_at: string;
}

export const reservationService = {
  // Mekana göre rezervasyonlar
  async getByVenue(venueId: string, date?: string): Promise<Reservation[]> {
    let query = supabase
      .from('reservations')
      .select('*')
      .eq('venue_id', venueId)
      .order('date')
      .order('time');
    
    if (date) {
      query = query.eq('date', date);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Bugünkü rezervasyonlar
  async getToday(venueId: string): Promise<Reservation[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('venue_id', venueId)
      .eq('date', today)
      .in('status', ['pending', 'confirmed'])
      .order('time');
    
    if (error) throw error;
    return data || [];
  },

  // Bekleyen rezervasyonlar
  async getPending(venueId: string): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('venue_id', venueId)
      .eq('status', 'pending')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
      .order('time');
    
    if (error) throw error;
    return data || [];
  },

  // Rezervasyon oluştur
  async create(reservation: Partial<Reservation>): Promise<Reservation> {
    const { data, error } = await supabase
      .from('reservations')
      .insert(reservation)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Rezervasyon durumu güncelle
  async updateStatus(id: string, status: string): Promise<Reservation> {
    const { data, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Rezervasyon güncelle
  async update(id: string, updates: Partial<Reservation>): Promise<Reservation> {
    const { data, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Rezervasyon iptal
  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id);
    
    if (error) throw error;
  }
};
