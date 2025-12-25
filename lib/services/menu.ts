import { supabase } from '../supabase';

export interface Category {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  venue_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  preparation_time: number | null;
  allergens: string[] | null;
  sort_order: number;
  created_at: string;
}

export const menuService = {
  // Kategorileri getir
  async getCategories(venueId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .order('display_order');
    
    if (error) throw error;
    return data || [];
  },

  // Menü ürünlerini getir
  async getItems(venueId: string): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:category_id (name)
      `)
      .eq('venue_id', venueId)
      .order('display_order');
    
    if (error) throw error;
    return data || [];
  },

  // Kategoriye göre ürünler
  async getItemsByCategory(venueId: string, categoryId: string): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('venue_id', venueId)
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('display_order');
    
    if (error) throw error;
    return data || [];
  },

  // Ürün oluştur
  async createItem(item: Partial<MenuItem>): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Ürün güncelle
  async updateItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Ürün sil
  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Kategori oluştur
  async createCategory(category: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert(category)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Stok durumu güncelle
  async toggleAvailability(id: string, isAvailable: boolean): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_available: isAvailable })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
