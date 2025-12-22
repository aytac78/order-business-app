import { supabase } from '@/lib/supabase';
import { Table, TableStatus } from '@/types';

// Fetch all tables for a venue
export async function fetchTables(venueId: string): Promise<Table[]> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('section')
    .order('number');

  if (error) {
    console.error('Error fetching tables:', error);
    throw error;
  }

  return data || [];
}

// Fetch tables by section
export async function fetchTablesBySection(venueId: string, section: string): Promise<Table[]> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('venue_id', venueId)
    .eq('section', section)
    .eq('is_active', true)
    .order('number');

  if (error) {
    console.error('Error fetching tables by section:', error);
    throw error;
  }

  return data || [];
}

// Fetch single table
export async function fetchTable(tableId: string): Promise<Table | null> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .single();

  if (error) {
    console.error('Error fetching table:', error);
    return null;
  }

  return data;
}

// Update table status
export async function updateTableStatus(tableId: string, status: TableStatus): Promise<Table | null> {
  const { data, error } = await supabase
    .from('tables')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', tableId)
    .select()
    .single();

  if (error) {
    console.error('Error updating table status:', error);
    throw error;
  }

  return data;
}

// Assign order to table
export async function assignOrderToTable(tableId: string, orderId: string): Promise<Table | null> {
  const { data, error } = await supabase
    .from('tables')
    .update({ 
      status: 'occupied',
      current_order_id: orderId,
      updated_at: new Date().toISOString()
    })
    .eq('id', tableId)
    .select()
    .single();

  if (error) {
    console.error('Error assigning order to table:', error);
    throw error;
  }

  return data;
}

// Clear table (after payment)
export async function clearTable(tableId: string): Promise<Table | null> {
  const { data, error } = await supabase
    .from('tables')
    .update({ 
      status: 'cleaning',
      current_order_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', tableId)
    .select()
    .single();

  if (error) {
    console.error('Error clearing table:', error);
    throw error;
  }

  return data;
}

// Mark table as available
export async function markTableAvailable(tableId: string): Promise<Table | null> {
  const { data, error } = await supabase
    .from('tables')
    .update({ 
      status: 'available',
      current_order_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', tableId)
    .select()
    .single();

  if (error) {
    console.error('Error marking table available:', error);
    throw error;
  }

  return data;
}

// Create new table
export async function createTable(table: Omit<Table, 'id' | 'created_at' | 'updated_at'>): Promise<Table | null> {
  const { data, error } = await supabase
    .from('tables')
    .insert({
      ...table,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating table:', error);
    throw error;
  }

  return data;
}

// Update table
export async function updateTable(tableId: string, updates: Partial<Table>): Promise<Table | null> {
  const { data, error } = await supabase
    .from('tables')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', tableId)
    .select()
    .single();

  if (error) {
    console.error('Error updating table:', error);
    throw error;
  }

  return data;
}

// Delete table (soft delete)
export async function deleteTable(tableId: string): Promise<boolean> {
  const { error } = await supabase
    .from('tables')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', tableId);

  if (error) {
    console.error('Error deleting table:', error);
    throw error;
  }

  return true;
}

// Get table sections
export async function getTableSections(venueId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('tables')
    .select('section')
    .eq('venue_id', venueId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching table sections:', error);
    throw error;
  }

  const sections = [...new Set(data?.map(t => t.section) || [])];
  return sections;
}

// Get table statistics
export async function getTableStats(venueId: string): Promise<{
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  cleaning: number;
}> {
  const { data, error } = await supabase
    .from('tables')
    .select('status')
    .eq('venue_id', venueId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching table stats:', error);
    throw error;
  }

  const tables = data || [];
  return {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    cleaning: tables.filter(t => t.status === 'cleaning').length,
  };
}

// Subscribe to table changes (real-time)
export function subscribeToTables(
  venueId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`tables-${venueId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tables',
        filter: `venue_id=eq.${venueId}`,
      },
      callback
    )
    .subscribe();
}
