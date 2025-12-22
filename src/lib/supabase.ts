import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      venues: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['venues']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['venues']['Insert']>;
      };
      user_venues: {
        Row: {
          id: string;
          user_id: string;
          venue_id: string;
          role: string;
          permissions: string[];
          is_default: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_venues']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_venues']['Insert']>;
      };
      tables: {
        Row: {
          id: string;
          venue_id: string;
          number: string;
          name: string | null;
          capacity: number;
          section: string;
          status: string;
          current_order_id: string | null;
          position_x: number | null;
          position_y: number | null;
          shape: string;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['tables']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['tables']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          venue_id: string;
          table_id: string | null;
          customer_id: string | null;
          order_number: string;
          type: string;
          status: string;
          items: Record<string, any>[];
          subtotal: number;
          tax: number;
          service_charge: number;
          discount: number;
          total: number;
          payment_status: string;
          payment_method: string | null;
          notes: string | null;
          waiter_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      reservations: {
        Row: {
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
          status: string;
          deposit_amount: number | null;
          deposit_paid: boolean;
          notes: string | null;
          special_requests: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reservations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reservations']['Insert']>;
      };
      stock_items: {
        Row: {
          id: string;
          venue_id: string;
          name: string;
          unit: string;
          current_quantity: number;
          min_quantity: number;
          max_quantity: number | null;
          cost_per_unit: number;
          supplier_id: string | null;
          category: string;
          last_restocked: string | null;
        };
        Insert: Omit<Database['public']['Tables']['stock_items']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['stock_items']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          venue_id: string;
          type: string;
          title: string;
          message: string;
          data: Record<string, any> | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
    };
  };
};
