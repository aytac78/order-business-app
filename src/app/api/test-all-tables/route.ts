import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const tables = ['venues', 'tables', 'orders', 'reservations', 'stock_items', 'staff', 'customers', 'menu_items', 'categories', 'shifts', 'coupons', 'notifications'];
  const results: Record<string, any> = {};

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      results[table] = { exists: !error, count: count || 0, error: error?.message };
    } catch (e: any) {
      results[table] = { exists: false, count: 0, error: e.message };
    }
  }

  return NextResponse.json(results);
}
