import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('*');
    
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('*');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');

    return NextResponse.json({
      success: true,
      venues: { count: venues?.length || 0, data: venues, error: venuesError?.message },
      tables: { count: tables?.length || 0, error: tablesError?.message },
      orders: { count: orders?.length || 0, error: ordersError?.message },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
