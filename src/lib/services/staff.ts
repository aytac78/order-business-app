import { supabase } from '../supabase';

export interface Staff {
  id: string;
  venue_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen';
  pin_code: string;
  is_active: boolean;
  created_at: string;
}

export const staffService = {
  // Mekana göre personel listesi
  async getByVenue(venueId: string): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // PIN ile giriş
  async loginWithPin(venueId: string, pin: string): Promise<Staff | null> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('venue_id', venueId)
      .eq('pin_code', pin)
      .eq('is_active', true)
      .single();
    
    if (error) return null;
    return data;
  },

  // Tüm mekanlardaki personeli getir (owner/manager için)
  async getAll(): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('staff')
      .select(`
        *,
        venues:venue_id (name)
      `)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Personel oluştur
  async create(staff: Partial<Staff>): Promise<Staff> {
    const { data, error } = await supabase
      .from('staff')
      .insert(staff)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Personel güncelle
  async update(id: string, updates: Partial<Staff>): Promise<Staff> {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
