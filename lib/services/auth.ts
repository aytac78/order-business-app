import { supabase } from '@/lib/supabase';

export interface StaffMember {
  id: string;
  venue_id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  pin_code?: string;
  is_active: boolean;
  avatar_url?: string;
  last_login?: string;
}

// Fetch active staff members for a venue
export async function fetchStaffMembers(venueId?: string): Promise<StaffMember[]> {
  let query = supabase
    .from('staff')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (venueId) {
    query = query.eq('venue_id', venueId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching staff:', error);
    return [];
  }

  return data || [];
}

// Verify staff PIN code
export async function verifyPin(staffId: string, pin: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('staff')
    .select('pin_code')
    .eq('id', staffId)
    .single();

  if (error || !data) {
    console.error('Error verifying PIN:', error);
    return false;
  }

  return data.pin_code === pin;
}

// Get role permissions
export async function getRolePermissions(role: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('allowed_routes')
    .eq('role', role)
    .single();

  if (error || !data) {
    // Default permissions based on role
    const defaultPermissions: Record<string, string[]> = {
      owner: ['*'],
      manager: ['/dashboard', '/tables', '/orders', '/menu', '/reservations', '/pos', '/stock', '/staff', '/reports', '/analytics', '/crm', '/settings', '/kitchen', '/waiter', '/reception'],
      cashier: ['/pos', '/orders', '/pos-tablet'],
      waiter: ['/waiter', '/orders', '/tables', '/waiter-tablet'],
      kitchen: ['/kitchen', '/orders', '/kitchen-tablet'],
      reception: ['/reception', '/reservations', '/tables', '/reception-tablet'],
    };
    return defaultPermissions[role] || [];
  }

  return data.allowed_routes || [];
}

// Update last login time
export async function updateLastLogin(staffId: string): Promise<void> {
  await supabase
    .from('staff')
    .update({ last_login: new Date().toISOString() })
    .eq('id', staffId);
}
