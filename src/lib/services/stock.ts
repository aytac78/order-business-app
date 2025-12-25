import { supabase } from '@/lib/supabase';

// Types
export interface StockItem {
  id: string;
  venue_id: string;
  supplier_id?: string;
  name: string;
  sku?: string;
  barcode?: string;
  category: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  max_quantity?: number;
  cost_per_unit: number;
  sale_price?: number;
  tax_rate: number;
  location?: string;
  expiry_date?: string;
  image_url?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface Supplier {
  id: string;
  venue_id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  payment_terms?: string;
  notes?: string;
  is_active: boolean;
}

export interface StockMovement {
  id: string;
  venue_id: string;
  stock_item_id: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'waste' | 'return';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_type?: string;
  reference_id?: string;
  supplier_id?: string;
  performed_by?: string;
  notes?: string;
  created_at: string;
  stock_item?: StockItem;
}

// ============ STOCK ITEMS ============

export async function fetchStockItems(venueId: string): Promise<StockItem[]> {
  const { data, error } = await supabase
    .from('stock_items')
    .select('*, supplier:suppliers(*)')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('category')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function fetchStockItemByBarcode(venueId: string, barcode: string): Promise<StockItem | null> {
  const { data, error } = await supabase
    .from('stock_items')
    .select('*, supplier:suppliers(*)')
    .eq('venue_id', venueId)
    .eq('barcode', barcode)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data;
}

export async function createStockItem(item: Partial<StockItem>): Promise<StockItem> {
  const { data, error } = await supabase
    .from('stock_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStockItem(itemId: string, updates: Partial<StockItem>): Promise<StockItem> {
  const { data, error } = await supabase
    .from('stock_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStockItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('stock_items')
    .update({ is_active: false })
    .eq('id', itemId);

  if (error) throw error;
}

// ============ STOCK MOVEMENTS ============

export async function fetchStockMovements(venueId: string, limit = 100): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*, stock_item:stock_items(id, name, unit, barcode)')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function addStockMovement(
  venueId: string,
  itemId: string,
  type: StockMovement['type'],
  quantity: number,
  notes?: string,
  unitCost?: number,
  supplierId?: string
): Promise<StockMovement> {
  const { data: item } = await supabase
    .from('stock_items')
    .select('current_quantity, cost_per_unit')
    .eq('id', itemId)
    .single();

  if (!item) throw new Error('Item not found');

  const previousQuantity = Number(item.current_quantity);
  const newQuantity = type === 'in' || type === 'return' 
    ? previousQuantity + quantity 
    : previousQuantity - quantity;

  const cost = unitCost || Number(item.cost_per_unit);

  const { data: movement, error: movementError } = await supabase
    .from('stock_movements')
    .insert({
      venue_id: venueId,
      stock_item_id: itemId,
      type,
      quantity,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      unit_cost: cost,
      total_cost: cost * quantity,
      supplier_id: supplierId,
      notes
    })
    .select()
    .single();

  if (movementError) throw movementError;

  await supabase
    .from('stock_items')
    .update({ current_quantity: newQuantity })
    .eq('id', itemId);

  return movement;
}

// ============ SUPPLIERS ============

export async function fetchSuppliers(venueId: string): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplier)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ ANALYTICS ============

export async function getStockStats(venueId: string) {
  const { data: items } = await supabase
    .from('stock_items')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true);

  if (!items) return null;

  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (Number(item.current_quantity) * Number(item.cost_per_unit)), 0);
  const lowStockItems = items.filter(item => Number(item.current_quantity) <= Number(item.min_quantity));
  const outOfStockItems = items.filter(item => Number(item.current_quantity) === 0);
  const categories = [...new Set(items.map(item => item.category))];

  return {
    totalItems,
    totalValue,
    lowStockCount: lowStockItems.length,
    outOfStockCount: outOfStockItems.length,
    categories,
    lowStockItems,
    outOfStockItems
  };
}

// ============ REALTIME ============

export function subscribeToStockChanges(venueId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`stock-${venueId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_items', filter: `venue_id=eq.${venueId}` }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements', filter: `venue_id=eq.${venueId}` }, callback)
    .subscribe();
}

// ============ RECIPES ============

export interface Recipe {
  id: string;
  venue_id: string;
  menu_item_id?: string;
  name: string;
  description?: string;
  yield_quantity: number;
  yield_unit: string;
  preparation_time?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ingredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  stock_item_id: string;
  quantity: number;
  unit: string;
  notes?: string;
  stock_item?: StockItem;
}

export async function fetchRecipes(venueId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      ingredients:recipe_ingredients(
        *,
        stock_item:stock_items(id, name, unit, current_quantity, cost_per_unit)
      )
    `)
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipe)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .update(updates)
    .eq('id', recipeId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .update({ is_active: false })
    .eq('id', recipeId);

  if (error) throw error;
}

export async function addRecipeIngredient(ingredient: Partial<RecipeIngredient>): Promise<RecipeIngredient> {
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .insert(ingredient)
    .select('*, stock_item:stock_items(id, name, unit, current_quantity, cost_per_unit)')
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecipeIngredient(ingredientId: string, updates: Partial<RecipeIngredient>): Promise<RecipeIngredient> {
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .update(updates)
    .eq('id', ingredientId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRecipeIngredient(ingredientId: string): Promise<void> {
  const { error } = await supabase
    .from('recipe_ingredients')
    .delete()
    .eq('id', ingredientId);

  if (error) throw error;
}

// Reçete maliyeti hesapla
export function calculateRecipeCost(recipe: Recipe): number {
  if (!recipe.ingredients) return 0;
  return recipe.ingredients.reduce((total, ing) => {
    const unitCost = ing.stock_item?.cost_per_unit || 0;
    return total + (ing.quantity * unitCost);
  }, 0);
}

// Reçeteye göre stok düş
export async function deductRecipeStock(
  venueId: string, 
  recipeId: string, 
  multiplier: number = 1,
  notes?: string
): Promise<void> {
  const { data: recipe } = await supabase
    .from('recipes')
    .select(`
      *,
      ingredients:recipe_ingredients(*, stock_item:stock_items(*))
    `)
    .eq('id', recipeId)
    .single();

  if (!recipe?.ingredients) return;

  for (const ing of recipe.ingredients) {
    const qty = ing.quantity * multiplier;
    await addStockMovement(venueId, ing.stock_item_id, 'out', qty, notes || `Reçete: ${recipe.name}`);
  }
}

// ============ STOCK COUNTS ============

export interface StockCount {
  id: string;
  venue_id: string;
  count_date: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  performed_by?: string;
  notes?: string;
  total_items: number;
  counted_items: number;
  variance_value: number;
  created_at: string;
  completed_at?: string;
  items?: StockCountItem[];
}

export interface StockCountItem {
  id: string;
  count_id: string;
  stock_item_id: string;
  system_quantity: number;
  counted_quantity?: number;
  difference?: number;
  notes?: string;
  stock_item?: StockItem;
}

export async function fetchStockCounts(venueId: string): Promise<StockCount[]> {
  const { data, error } = await supabase
    .from('stock_counts')
    .select('*')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createStockCount(venueId: string, notes?: string): Promise<StockCount> {
  // Tüm aktif stok kalemlerini al
  const { data: items } = await supabase
    .from('stock_items')
    .select('id, current_quantity')
    .eq('venue_id', venueId)
    .eq('is_active', true);

  // Sayım oluştur
  const { data: count, error } = await supabase
    .from('stock_counts')
    .insert({
      venue_id: venueId,
      status: 'in_progress',
      notes,
      total_items: items?.length || 0,
      counted_items: 0,
      variance_value: 0
    })
    .select()
    .single();

  if (error) throw error;

  // Sayım kalemlerini oluştur
  if (items && items.length > 0) {
    const countItems = items.map(item => ({
      count_id: count.id,
      stock_item_id: item.id,
      system_quantity: item.current_quantity
    }));

    await supabase.from('stock_count_items').insert(countItems);
  }

  return count;
}

export async function fetchStockCountItems(countId: string): Promise<StockCountItem[]> {
  const { data, error } = await supabase
    .from('stock_count_items')
    .select('*, stock_item:stock_items(id, name, unit, barcode, category)')
    .eq('count_id', countId);

  if (error) throw error;
  return data || [];
}

export async function updateStockCountItem(
  itemId: string, 
  countedQuantity: number,
  notes?: string
): Promise<StockCountItem> {
  const { data: item } = await supabase
    .from('stock_count_items')
    .select('system_quantity')
    .eq('id', itemId)
    .single();

  const difference = countedQuantity - (item?.system_quantity || 0);

  const { data, error } = await supabase
    .from('stock_count_items')
    .update({ 
      counted_quantity: countedQuantity,
      difference,
      notes
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function completeStockCount(countId: string, applyChanges: boolean = true): Promise<void> {
  const { data: items } = await supabase
    .from('stock_count_items')
    .select('*, stock_item:stock_items(*)')
    .eq('count_id', countId)
    .not('counted_quantity', 'is', null);

  if (!items) return;

  let varianceValue = 0;
  
  for (const item of items) {
    const diff = (item.counted_quantity || 0) - item.system_quantity;
    varianceValue += diff * (item.stock_item?.cost_per_unit || 0);

    if (applyChanges && diff !== 0) {
      // Stok düzeltme hareketi oluştur
      await supabase.from('stock_movements').insert({
        venue_id: item.stock_item?.venue_id,
        stock_item_id: item.stock_item_id,
        type: 'adjustment',
        quantity: Math.abs(diff),
        previous_quantity: item.system_quantity,
        new_quantity: item.counted_quantity,
        notes: `Sayım düzeltmesi #${countId.slice(0, 8)}`
      });

      // Stok miktarını güncelle
      await supabase
        .from('stock_items')
        .update({ current_quantity: item.counted_quantity })
        .eq('id', item.stock_item_id);
    }
  }

  // Sayımı tamamla
  await supabase
    .from('stock_counts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      counted_items: items.length,
      variance_value: varianceValue
    })
    .eq('id', countId);
}
