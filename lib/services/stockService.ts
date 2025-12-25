// ============================================
// STOK VE REÇETE SİSTEMİ - TİPLER VE SERVİSLER
// ============================================

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
  preparationTime: number; // dakika
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
// MOCK DATA - MALZEMELER
// ============================================

export const mockIngredients: Ingredient[] = [
  // MUTFAK - Et
  { id: 'ing-1', name: 'Dana Kıyma', category: 'meat', unit: 'kg', currentStock: 15, minStock: 10, maxStock: 50, costPerUnit: 280, location: 'freezer', isActive: true, lastUpdated: new Date() },
  { id: 'ing-2', name: 'Tavuk Göğsü', category: 'meat', unit: 'kg', currentStock: 8, minStock: 10, maxStock: 40, costPerUnit: 120, location: 'freezer', isActive: true, lastUpdated: new Date() },
  { id: 'ing-3', name: 'Kuzu Pirzola', category: 'meat', unit: 'kg', currentStock: 5, minStock: 8, maxStock: 25, costPerUnit: 450, location: 'freezer', isActive: true, lastUpdated: new Date() },
  { id: 'ing-4', name: 'Adana Kebap Kıyması', category: 'meat', unit: 'kg', currentStock: 12, minStock: 8, maxStock: 30, costPerUnit: 320, location: 'freezer', isActive: true, lastUpdated: new Date() },
  
  // MUTFAK - Sebze
  { id: 'ing-5', name: 'Domates', category: 'vegetable', unit: 'kg', currentStock: 20, minStock: 15, maxStock: 50, costPerUnit: 25, location: 'storage', isActive: true, lastUpdated: new Date() },
  { id: 'ing-6', name: 'Soğan', category: 'vegetable', unit: 'kg', currentStock: 25, minStock: 10, maxStock: 40, costPerUnit: 15, location: 'storage', isActive: true, lastUpdated: new Date() },
  { id: 'ing-7', name: 'Biber (Yeşil)', category: 'vegetable', unit: 'kg', currentStock: 8, minStock: 5, maxStock: 20, costPerUnit: 35, location: 'storage', isActive: true, lastUpdated: new Date() },
  { id: 'ing-8', name: 'Marul', category: 'vegetable', unit: 'kg', currentStock: 3, minStock: 5, maxStock: 15, costPerUnit: 30, location: 'storage', isActive: true, lastUpdated: new Date() },
  { id: 'ing-9', name: 'Patates', category: 'vegetable', unit: 'kg', currentStock: 30, minStock: 20, maxStock: 80, costPerUnit: 12, location: 'storage', isActive: true, lastUpdated: new Date() },
  
  // MUTFAK - Süt Ürünleri
  { id: 'ing-10', name: 'Kaşar Peyniri', category: 'dairy', unit: 'kg', currentStock: 6, minStock: 5, maxStock: 20, costPerUnit: 180, location: 'freezer', isActive: true, lastUpdated: new Date() },
  { id: 'ing-11', name: 'Beyaz Peynir', category: 'dairy', unit: 'kg', currentStock: 4, minStock: 3, maxStock: 15, costPerUnit: 150, location: 'freezer', isActive: true, lastUpdated: new Date() },
  { id: 'ing-12', name: 'Tereyağı', category: 'dairy', unit: 'kg', currentStock: 3, minStock: 2, maxStock: 10, costPerUnit: 250, location: 'freezer', isActive: true, lastUpdated: new Date() },
  { id: 'ing-13', name: 'Süt', category: 'dairy', unit: 'lt', currentStock: 20, minStock: 15, maxStock: 50, costPerUnit: 28, location: 'freezer', isActive: true, lastUpdated: new Date() },
  
  // MUTFAK - Tahıl
  { id: 'ing-14', name: 'Pirinç', category: 'grain', unit: 'kg', currentStock: 25, minStock: 15, maxStock: 50, costPerUnit: 45, location: 'storage', isActive: true, lastUpdated: new Date() },
  { id: 'ing-15', name: 'Un', category: 'grain', unit: 'kg', currentStock: 20, minStock: 10, maxStock: 40, costPerUnit: 25, location: 'storage', isActive: true, lastUpdated: new Date() },
  { id: 'ing-16', name: 'Bulgur', category: 'grain', unit: 'kg', currentStock: 10, minStock: 5, maxStock: 25, costPerUnit: 35, location: 'storage', isActive: true, lastUpdated: new Date() },
  
  // BAR - İçecekler
  { id: 'ing-20', name: 'Coca Cola', category: 'beverage', unit: 'şişe', currentStock: 48, minStock: 24, maxStock: 120, costPerUnit: 15, location: 'bar', isActive: true, lastUpdated: new Date() },
  { id: 'ing-21', name: 'Fanta', category: 'beverage', unit: 'şişe', currentStock: 36, minStock: 24, maxStock: 96, costPerUnit: 15, location: 'bar', isActive: true, lastUpdated: new Date() },
  { id: 'ing-22', name: 'Ayran', category: 'beverage', unit: 'adet', currentStock: 50, minStock: 30, maxStock: 100, costPerUnit: 8, location: 'bar', isActive: true, lastUpdated: new Date() },
  { id: 'ing-23', name: 'Maden Suyu', category: 'beverage', unit: 'şişe', currentStock: 60, minStock: 40, maxStock: 150, costPerUnit: 10, location: 'bar', isActive: true, lastUpdated: new Date() },
  { id: 'ing-24', name: 'Türk Kahvesi', category: 'beverage', unit: 'kg', currentStock: 2, minStock: 1, maxStock: 5, costPerUnit: 400, location: 'bar', isActive: true, lastUpdated: new Date() },
  { id: 'ing-25', name: 'Çay', category: 'beverage', unit: 'kg', currentStock: 3, minStock: 2, maxStock: 8, costPerUnit: 200, location: 'bar', isActive: true, lastUpdated: new Date() },
  
  // BAR - Alkol
  { id: 'ing-30', name: 'Rakı (Yeni)', category: 'alcohol', unit: 'şişe', currentStock: 10, minStock: 5, maxStock: 30, costPerUnit: 450, location: 'bar', isActive: true, lastUpdated: new Date() },
  { id: 'ing-31', name: 'Bira (Efes)', category: 'alcohol', unit: 'şişe', currentStock: 24, minStock: 20, maxStock: 72, costPerUnit: 45, location: 'bar', isActive: true, lastUpdated: new Date() },
  { id: 'ing-32', name: 'Şarap (Kırmızı)', category: 'alcohol', unit: 'şişe', currentStock: 8, minStock: 6, maxStock: 24, costPerUnit: 180, location: 'bar', isActive: true, lastUpdated: new Date() },
  { id: 'ing-33', name: 'Votka', category: 'alcohol', unit: 'şişe', currentStock: 4, minStock: 3, maxStock: 12, costPerUnit: 350, location: 'bar', isActive: true, lastUpdated: new Date() },
  
  // BAR - Meyve
  { id: 'ing-40', name: 'Limon', category: 'fruit', unit: 'kg', currentStock: 5, minStock: 3, maxStock: 15, costPerUnit: 40, location: 'bar', isActive: true, lastUpdated: new Date() },
  { id: 'ing-41', name: 'Portakal', category: 'fruit', unit: 'kg', currentStock: 8, minStock: 5, maxStock: 20, costPerUnit: 35, location: 'bar', isActive: true, lastUpdated: new Date() },
];

// ============================================
// MOCK DATA - REÇETELER
// ============================================

export const mockRecipes: Recipe[] = [
  // MUTFAK REÇETELERİ
  {
    id: 'rec-1',
    menuItemId: 'menu-1',
    menuItemName: 'Izgara Köfte',
    category: 'kitchen',
    items: [
      { ingredientId: 'ing-1', ingredientName: 'Dana Kıyma', quantity: 0.150, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-6', ingredientName: 'Soğan', quantity: 0.030, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-5', ingredientName: 'Domates', quantity: 0.050, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-7', ingredientName: 'Biber (Yeşil)', quantity: 0.030, unit: 'kg', isOptional: false },
    ],
    preparationTime: 15,
    isActive: true,
  },
  {
    id: 'rec-2',
    menuItemId: 'menu-2',
    menuItemName: 'Tavuk Şiş',
    category: 'kitchen',
    items: [
      { ingredientId: 'ing-2', ingredientName: 'Tavuk Göğsü', quantity: 0.200, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-7', ingredientName: 'Biber (Yeşil)', quantity: 0.040, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-5', ingredientName: 'Domates', quantity: 0.040, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-6', ingredientName: 'Soğan', quantity: 0.030, unit: 'kg', isOptional: false },
    ],
    preparationTime: 20,
    isActive: true,
  },
  {
    id: 'rec-3',
    menuItemId: 'menu-3',
    menuItemName: 'Adana Kebap',
    category: 'kitchen',
    items: [
      { ingredientId: 'ing-4', ingredientName: 'Adana Kebap Kıyması', quantity: 0.200, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-5', ingredientName: 'Domates', quantity: 0.050, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-7', ingredientName: 'Biber (Yeşil)', quantity: 0.040, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-6', ingredientName: 'Soğan', quantity: 0.050, unit: 'kg', isOptional: false },
    ],
    preparationTime: 25,
    isActive: true,
  },
  {
    id: 'rec-4',
    menuItemId: 'menu-4',
    menuItemName: 'Karışık Salata',
    category: 'kitchen',
    items: [
      { ingredientId: 'ing-8', ingredientName: 'Marul', quantity: 0.100, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-5', ingredientName: 'Domates', quantity: 0.080, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-6', ingredientName: 'Soğan', quantity: 0.030, unit: 'kg', isOptional: true },
    ],
    preparationTime: 5,
    isActive: true,
  },
  {
    id: 'rec-5',
    menuItemId: 'menu-5',
    menuItemName: 'Pilav',
    category: 'kitchen',
    items: [
      { ingredientId: 'ing-14', ingredientName: 'Pirinç', quantity: 0.100, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-12', ingredientName: 'Tereyağı', quantity: 0.020, unit: 'kg', isOptional: false },
    ],
    preparationTime: 20,
    isActive: true,
  },
  {
    id: 'rec-6',
    menuItemId: 'menu-6',
    menuItemName: 'Kaşarlı Pide',
    category: 'kitchen',
    items: [
      { ingredientId: 'ing-15', ingredientName: 'Un', quantity: 0.200, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-10', ingredientName: 'Kaşar Peyniri', quantity: 0.150, unit: 'kg', isOptional: false },
      { ingredientId: 'ing-12', ingredientName: 'Tereyağı', quantity: 0.030, unit: 'kg', isOptional: false },
    ],
    preparationTime: 15,
    isActive: true,
  },
  
  // BAR REÇETELERİ
  {
    id: 'rec-10',
    menuItemId: 'menu-10',
    menuItemName: 'Türk Kahvesi',
    category: 'bar',
    items: [
      { ingredientId: 'ing-24', ingredientName: 'Türk Kahvesi', quantity: 0.010, unit: 'kg', isOptional: false },
    ],
    preparationTime: 5,
    isActive: true,
  },
  {
    id: 'rec-11',
    menuItemId: 'menu-11',
    menuItemName: 'Çay',
    category: 'bar',
    items: [
      { ingredientId: 'ing-25', ingredientName: 'Çay', quantity: 0.005, unit: 'kg', isOptional: false },
    ],
    preparationTime: 3,
    isActive: true,
  },
  {
    id: 'rec-12',
    menuItemId: 'menu-12',
    menuItemName: 'Ayran',
    category: 'bar',
    items: [
      { ingredientId: 'ing-22', ingredientName: 'Ayran', quantity: 1, unit: 'adet', isOptional: false },
    ],
    preparationTime: 1,
    isActive: true,
  },
  {
    id: 'rec-13',
    menuItemId: 'menu-13',
    menuItemName: 'Cola',
    category: 'bar',
    items: [
      { ingredientId: 'ing-20', ingredientName: 'Coca Cola', quantity: 1, unit: 'şişe', isOptional: false },
    ],
    preparationTime: 1,
    isActive: true,
  },
  {
    id: 'rec-14',
    menuItemId: 'menu-14',
    menuItemName: 'Rakı (Tek)',
    category: 'bar',
    items: [
      { ingredientId: 'ing-30', ingredientName: 'Rakı (Yeni)', quantity: 0.05, unit: 'şişe', isOptional: false },
    ],
    preparationTime: 2,
    isActive: true,
  },
  {
    id: 'rec-15',
    menuItemId: 'menu-15',
    menuItemName: 'Bira',
    category: 'bar',
    items: [
      { ingredientId: 'ing-31', ingredientName: 'Bira (Efes)', quantity: 1, unit: 'şişe', isOptional: false },
    ],
    preparationTime: 1,
    isActive: true,
  },
];

// ============================================
// MOCK DATA - TEDARİKÇİLER
// ============================================

export const mockSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Bodrum Et Market',
    phone: '+90 252 316 1234',
    email: 'info@bodrummarket.com',
    categories: ['meat', 'seafood'],
    deliveryDays: ['Pazartesi', 'Çarşamba', 'Cuma'],
    minOrderAmount: 500,
    isActive: true,
  },
  {
    id: 'sup-2',
    name: 'Taze Sebze Meyve',
    phone: '+90 252 316 5678',
    email: 'siparis@tazesebze.com',
    categories: ['vegetable', 'fruit'],
    deliveryDays: ['Her gün'],
    minOrderAmount: 200,
    isActive: true,
  },
  {
    id: 'sup-3',
    name: 'İçecek Deposu',
    phone: '+90 252 316 9012',
    categories: ['beverage', 'alcohol'],
    deliveryDays: ['Salı', 'Perşembe', 'Cumartesi'],
    minOrderAmount: 1000,
    isActive: true,
  },
  {
    id: 'sup-4',
    name: 'Süt Ürünleri A.Ş.',
    phone: '+90 252 316 3456',
    categories: ['dairy'],
    deliveryDays: ['Her gün'],
    minOrderAmount: 300,
    isActive: true,
  },
];

// ============================================
// STOK SERVİSLERİ
// ============================================

export class StockService {
  private ingredients: Ingredient[] = [...mockIngredients];
  private recipes: Recipe[] = [...mockRecipes];
  private movements: StockMovement[] = [];
  private alerts: StockAlert[] = [];

  // Stok kontrolü ve uyarı oluşturma
  checkStockLevels(): StockAlert[] {
    const newAlerts: StockAlert[] = [];
    
    this.ingredients.forEach(ing => {
      if (ing.currentStock <= 0) {
        newAlerts.push({
          id: `alert-${Date.now()}-${ing.id}`,
          ingredientId: ing.id,
          ingredientName: ing.name,
          currentStock: ing.currentStock,
          minStock: ing.minStock,
          alertType: 'critical',
          isAcknowledged: false,
          createdAt: new Date(),
        });
      } else if (ing.currentStock < ing.minStock) {
        newAlerts.push({
          id: `alert-${Date.now()}-${ing.id}`,
          ingredientId: ing.id,
          ingredientName: ing.name,
          currentStock: ing.currentStock,
          minStock: ing.minStock,
          alertType: 'low',
          isAcknowledged: false,
          createdAt: new Date(),
        });
      }
    });

    this.alerts = newAlerts;
    return newAlerts;
  }

  // Sipariş için stok düşümü
  processOrder(orderItems: { menuItemId: string; quantity: number }[]): { 
    success: boolean; 
    movements: StockMovement[]; 
    insufficientStock: { ingredientName: string; required: number; available: number }[] 
  } {
    const movements: StockMovement[] = [];
    const insufficientStock: { ingredientName: string; required: number; available: number }[] = [];

    // Önce stok yeterliliğini kontrol et
    for (const item of orderItems) {
      const recipe = this.recipes.find(r => r.menuItemId === item.menuItemId);
      if (!recipe) continue;

      for (const recipeItem of recipe.items) {
        if (recipeItem.isOptional) continue;
        
        const ingredient = this.ingredients.find(i => i.id === recipeItem.ingredientId);
        if (!ingredient) continue;

        const required = recipeItem.quantity * item.quantity;
        if (ingredient.currentStock < required) {
          insufficientStock.push({
            ingredientName: ingredient.name,
            required,
            available: ingredient.currentStock,
          });
        }
      }
    }

    if (insufficientStock.length > 0) {
      return { success: false, movements: [], insufficientStock };
    }

    // Stok düşümü yap
    for (const item of orderItems) {
      const recipe = this.recipes.find(r => r.menuItemId === item.menuItemId);
      if (!recipe) continue;

      for (const recipeItem of recipe.items) {
        const ingredient = this.ingredients.find(i => i.id === recipeItem.ingredientId);
        if (!ingredient) continue;

        const quantity = recipeItem.quantity * item.quantity;
        const previousStock = ingredient.currentStock;
        ingredient.currentStock -= quantity;
        ingredient.lastUpdated = new Date();

        movements.push({
          id: `mov-${Date.now()}-${ingredient.id}`,
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          type: 'out',
          quantity,
          previousStock,
          newStock: ingredient.currentStock,
          reason: `Sipariş: ${recipe.menuItemName} x${item.quantity}`,
          performedBy: 'Sistem',
          timestamp: new Date(),
        });
      }
    }

    this.movements.push(...movements);
    this.checkStockLevels();

    return { success: true, movements, insufficientStock: [] };
  }

  // Stok girişi
  addStock(ingredientId: string, quantity: number, reason: string, performedBy: string): StockMovement | null {
    const ingredient = this.ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return null;

    const previousStock = ingredient.currentStock;
    ingredient.currentStock += quantity;
    ingredient.lastUpdated = new Date();

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      type: 'in',
      quantity,
      previousStock,
      newStock: ingredient.currentStock,
      reason,
      performedBy,
      timestamp: new Date(),
    };

    this.movements.push(movement);
    this.checkStockLevels();

    return movement;
  }

  // Fire/Kayıp kaydı
  recordWaste(ingredientId: string, quantity: number, reason: string, performedBy: string): StockMovement | null {
    const ingredient = this.ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return null;

    const previousStock = ingredient.currentStock;
    ingredient.currentStock -= quantity;
    ingredient.lastUpdated = new Date();

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      type: 'waste',
      quantity,
      previousStock,
      newStock: ingredient.currentStock,
      reason,
      performedBy,
      timestamp: new Date(),
    };

    this.movements.push(movement);
    this.checkStockLevels();

    return movement;
  }

  // Getters
  getIngredients(): Ingredient[] {
    return this.ingredients;
  }

  getIngredientsByLocation(location: StockLocation): Ingredient[] {
    return this.ingredients.filter(i => i.location === location);
  }

  getLowStockIngredients(): Ingredient[] {
    return this.ingredients.filter(i => i.currentStock < i.minStock);
  }

  getRecipes(): Recipe[] {
    return this.recipes;
  }

  getRecipeByMenuItemId(menuItemId: string): Recipe | undefined {
    return this.recipes.find(r => r.menuItemId === menuItemId);
  }

  getMovements(): StockMovement[] {
    return this.movements;
  }

  getAlerts(): StockAlert[] {
    return this.alerts;
  }
}

// Singleton instance
export const stockService = new StockService();
