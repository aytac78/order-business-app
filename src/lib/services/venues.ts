import { supabase } from '../supabase';

export interface Venue {
  id: string;
  name: string;
  slug: string;
  type: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  logo_url: string | null;
  cover_url: string | null;
  currency: string;
  timezone: string;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const venueService = {
  // Tüm mekanları getir
  async getAll(): Promise<Venue[]> {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Tek mekan getir
  async getById(id: string): Promise<Venue | null> {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Kullanıcının erişebildiği mekanları getir
  async getByUserId(userId: string): Promise<Venue[]> {
    const { data, error } = await supabase
      .from('venue_staff')
      .select(`
        venue_id,
        role,
        venues (*)
      `)
      .eq('staff_id', userId)
      .eq('is_active', true);
    
    if (error) throw error;
    return data?.map((vs: any) => vs.venues).filter(Boolean) || [];
  },

  // Mekan oluştur
  async create(venue: Partial<Venue>): Promise<Venue> {
    const { data, error } = await supabase
      .from('venues')
      .insert(venue)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mekan güncelle
  async update(id: string, updates: Partial<Venue>): Promise<Venue> {
    const { data, error } = await supabase
      .from('venues')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
