import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, any> = {};
  const tables = ['orders', 'reservations', 'stock_items', 'customers', 'staff'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    results[table] = {
      columns: data?.[0] ? Object.keys(data[0]) : [],
      error: error?.message
    };
  }
  return NextResponse.json(results);
}
