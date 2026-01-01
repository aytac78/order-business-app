// ============================================
// STOK VE REÇETE SİSTEMİ - SUPABASE ENTEGRASYONU
// ============================================

import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

export type IngredientCategory = 'meat' | 'vegetable' | 'dairy' | 'grain' | 'spice' | 'beverage' | 'alcohol' | 'fruit' | 'seafood' | 'other';
export type StockUnit = 'kg' | 'g' | 'lt' | 'ml' | 'adet' | 'paket' | 'kutu' | 'şişe' | 'porsiyon';
export type StockLocation = 'kitchen' | 'bar' | 'storage' | 'freezer';
export type MovementType = 'in' | 'out' | 'waste' | 'transfer' | 'adjustment';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: StockUnit;
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPerUnit: number;
  location: StockLocation;
  supplierId?: string;
  barcode?: string;
  isActive: boolean;
  lastUpdated: Date;
  expiryDate?: Date;
}

export interface RecipeItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: StockUnit;
  isOptional: boolean;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  menuItemName: string;
  category: 'kitchen' | 'bar';
  items: RecipeItem[];
  preparationTime: number;
  instructions?: string;
  isActive: boolean;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  orderId?: string;
  supplierId?: string;
  performedBy: string;
  timestamp: Date;
}

export interface StockAlert {
  id: string;
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  minStock: number;
  alertType: 'low' | 'critical' | 'expired' | 'expiring_soon';
  isAcknowledged: boolean;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  categories: IngredientCategory[];
  minOrderAmount?: number;
  deliveryDays: string[];
  isActive: boolean;
}

export interface SupplierOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: SupplierOrderItem[];
  status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'delivered' | 'cancelled';
  totalAmount: number;
  requestedBy: string;
  approvedBy?: string;
  createdAt: Date;
  expectedDelivery?: Date;
  deliveredAt?: Date;
  notes?: string;
}

export interface SupplierOrderItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: StockUnit;
  unitPrice: number;
  totalPrice: number;
}

// ============================================
// STOCK SERVICE - SUPABASE CONNECTED
// ============================================

class StockService {
  private venueId: string | null = null;

  setVenueId(venueId: string) {
    this.venueId = venueId;
  }

  // Fetch ingredients from Supabase
  async getIngredients(): Promise<Ingredient[]> {
    if (!this.venueId) return [];

    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('venue_id', this.venueId)
      .order('name');

    if (error) {
      console.error('Error fetching ingredients:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category || 'other',
      unit: item.unit || 'adet',
      currentStock: item.current_quantity || 0,
      minStock: item.min_quantity || 0,
      maxStock: item.max_quantity || 100,
      costPerUnit: item.cost_per_unit || 0,
      location: item.location || 'storage',
      supplierId: item.supplier_id,
      barcode: item.barcode,
      isActive: item.is_active !== false,
      lastUpdated: new Date(item.last_restocked || item.updated_at),
      expiryDate: item.expiry_date ? new Date(item.expiry_date) : undefined
    }));
  }

  async getIngredientsByLocation(location: StockLocation): Promise<Ingredient[]> {
    const ingredients = await this.getIngredients();
    return ingredients.filter(i => i.location === location);
  }

  async getLowStockIngredients(): Promise<Ingredient[]> {
    if (!this.venueId) return [];

    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('venue_id', this.venueId)
      .lt('current_quantity', supabase.rpc('get_min_quantity'));

    // Fallback: fetch all and filter
    const ingredients = await this.getIngredients();
    return ingredients.filter(i => i.currentStock < i.minStock);
  }

  // Fetch recipes from Supabase
  async getRecipes(): Promise<Recipe[]> {
    if (!this.venueId) return [];

    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          id,
          ingredient_id,
          quantity,
          unit,
          is_optional,
          stock_items (name)
        )
      `)
      .eq('venue_id', this.venueId);

    if (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }

    return (data || []).map((recipe: any) => ({
      id: recipe.id,
      menuItemId: recipe.product_id || recipe.menu_item_id,
      menuItemName: recipe.name,
      category: recipe.category || 'kitchen',
      items: (recipe.recipe_ingredients || []).map((ri: any) => ({
        ingredientId: ri.ingredient_id,
        ingredientName: ri.stock_items?.name || 'Bilinmiyor',
        quantity: ri.quantity,
        unit: ri.unit,
        isOptional: ri.is_optional || false
      })),
      preparationTime: recipe.preparation_time || 0,
      instructions: recipe.instructions,
      isActive: recipe.is_active !== false
    }));
  }

  async getRecipeByMenuItemId(menuItemId: string): Promise<Recipe | undefined> {
    const recipes = await this.getRecipes();
    return recipes.find(r => r.menuItemId === menuItemId);
  }

  // Fetch suppliers from Supabase
  async getSuppliers(): Promise<Supplier[]> {
    if (!this.venueId) return [];

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('venue_id', this.venueId)
      .order('name');

    if (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }

    return (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      phone: s.phone || '',
      email: s.email,
      address: s.address,
      categories: s.categories || [],
      minOrderAmount: s.min_order_amount,
      deliveryDays: s.delivery_days || [],
      isActive: s.is_active !== false
    }));
  }

  // Fetch stock movements from Supabase
  async getMovements(limit = 50): Promise<StockMovement[]> {
    if (!this.venueId) return [];

    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        stock_items (name)
      `)
      .eq('venue_id', this.venueId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching movements:', error);
      return [];
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      ingredientId: m.stock_item_id,
      ingredientName: m.stock_items?.name || 'Bilinmiyor',
      type: m.type,
      quantity: m.quantity,
      previousStock: m.previous_quantity || 0,
      newStock: m.new_quantity || 0,
      reason: m.reason || '',
      orderId: m.order_id,
      supplierId: m.supplier_id,
      performedBy: m.performed_by || 'Sistem',
      timestamp: new Date(m.created_at)
    }));
  }

  // Fetch alerts from Supabase
  async getAlerts(): Promise<StockAlert[]> {
    const ingredients = await this.getLowStockIngredients();
    
    return ingredients.map(ing => ({
      id: `alert-${ing.id}`,
      ingredientId: ing.id,
      ingredientName: ing.name,
      currentStock: ing.currentStock,
      minStock: ing.minStock,
      alertType: ing.currentStock === 0 ? 'critical' : 'low',
      isAcknowledged: false,
      createdAt: new Date()
    }));
  }

  // Add stock (stok girişi)
  async addStock(
    ingredientId: string,
    quantity: number,
    reason: string,
    performedBy: string,
    supplierId?: string
  ): Promise<StockMovement | null> {
    if (!this.venueId) return null;

    // Get current stock
    const { data: item } = await supabase
      .from('stock_items')
      .select('current_quantity, name')
      .eq('id', ingredientId)
      .single();

    if (!item) return null;

    const previousStock = item.current_quantity || 0;
    const newStock = previousStock + quantity;

    // Update stock
    await supabase
      .from('stock_items')
      .update({ 
        current_quantity: newStock,
        last_restocked: new Date().toISOString()
      })
      .eq('id', ingredientId);

    // Record movement
    const { data: movement } = await supabase
      .from('stock_movements')
      .insert({
        venue_id: this.venueId,
        stock_item_id: ingredientId,
        type: 'in',
        quantity,
        previous_quantity: previousStock,
        new_quantity: newStock,
        reason,
        performed_by: performedBy,
        supplier_id: supplierId
      })
      .select()
      .single();

    return movement ? {
      id: movement.id,
      ingredientId,
      ingredientName: item.name,
      type: 'in',
      quantity,
      previousStock,
      newStock,
      reason,
      supplierId,
      performedBy,
      timestamp: new Date()
    } : null;
  }

  // Use stock (stok çıkışı - sipariş için)
  async useStock(
    ingredientId: string,
    quantity: number,
    reason: string,
    performedBy: string,
    orderId?: string
  ): Promise<StockMovement | null> {
    if (!this.venueId) return null;

    const { data: item } = await supabase
      .from('stock_items')
      .select('current_quantity, name')
      .eq('id', ingredientId)
      .single();

    if (!item) return null;

    const previousStock = item.current_quantity || 0;
    const newStock = Math.max(0, previousStock - quantity);

    await supabase
      .from('stock_items')
      .update({ current_quantity: newStock })
      .eq('id', ingredientId);

    const { data: movement } = await supabase
      .from('stock_movements')
      .insert({
        venue_id: this.venueId,
        stock_item_id: ingredientId,
        type: 'out',
        quantity,
        previous_quantity: previousStock,
        new_quantity: newStock,
        reason,
        performed_by: performedBy,
        order_id: orderId
      })
      .select()
      .single();

    return movement ? {
      id: movement.id,
      ingredientId,
      ingredientName: item.name,
      type: 'out',
      quantity,
      previousStock,
      newStock,
      reason,
      orderId,
      performedBy,
      timestamp: new Date()
    } : null;
  }

  // Record waste (fire)
  async recordWaste(
    ingredientId: string,
    quantity: number,
    reason: string,
    performedBy: string
  ): Promise<StockMovement | null> {
    if (!this.venueId) return null;

    const { data: item } = await supabase
      .from('stock_items')
      .select('current_quantity, name')
      .eq('id', ingredientId)
      .single();

    if (!item) return null;

    const previousStock = item.current_quantity || 0;
    const newStock = Math.max(0, previousStock - quantity);

    await supabase
      .from('stock_items')
      .update({ current_quantity: newStock })
      .eq('id', ingredientId);

    const { data: movement } = await supabase
      .from('stock_movements')
      .insert({
        venue_id: this.venueId,
        stock_item_id: ingredientId,
        type: 'waste',
        quantity,
        previous_quantity: previousStock,
        new_quantity: newStock,
        reason,
        performed_by: performedBy
      })
      .select()
      .single();

    return movement ? {
      id: movement.id,
      ingredientId,
      ingredientName: item.name,
      type: 'waste',
      quantity,
      previousStock,
      newStock,
      reason,
      performedBy,
      timestamp: new Date()
    } : null;
  }

  // Deduct recipe ingredients from stock
  async deductRecipeFromStock(
    recipeId: string,
    quantity: number,
    performedBy: string,
    orderId?: string
  ): Promise<boolean> {
    const recipes = await this.getRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe) return false;

    for (const item of recipe.items) {
      if (!item.isOptional) {
        await this.useStock(
          item.ingredientId,
          item.quantity * quantity,
          `Sipariş: ${recipe.menuItemName} x${quantity}`,
          performedBy,
          orderId
        );
      }
    }

    return true;
  }
}

// Singleton instance
export const stockService = new StockService();
