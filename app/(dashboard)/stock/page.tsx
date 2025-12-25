'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, AlertTriangle, TrendingDown, TrendingUp, Plus, Minus,
  Search, Filter, ChefHat, Wine, Warehouse, Snowflake, Home,
  ArrowUpRight, ArrowDownRight, RefreshCw, Bell, Settings,
  FileText, Truck, Check, X, Edit, Trash2, Eye, BarChart3
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Ingredient, Recipe, StockMovement, StockAlert,
  mockIngredients, mockRecipes, stockService,
  IngredientCategory, StockLocation
} from '@/lib/services/stockService';

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

const getCategoryLabel = (category: IngredientCategory) => {
  const labels: Record<IngredientCategory, string> = {
    meat: 'Et', vegetable: 'Sebze', dairy: 'Süt Ürünü', grain: 'Tahıl',
    spice: 'Baharat', beverage: 'İçecek', alcohol: 'Alkol', fruit: 'Meyve',
    seafood: 'Deniz Ürünü', other: 'Diğer'
  };
  return labels[category];
};

const getLocationLabel = (location: StockLocation) => {
  const labels: Record<StockLocation, string> = {
    kitchen: 'Mutfak', bar: 'Bar', storage: 'Depo', freezer: 'Soğuk Hava'
  };
  return labels[location];
};

const getLocationIcon = (location: StockLocation) => {
  switch (location) {
    case 'kitchen': return ChefHat;
    case 'bar': return Wine;
    case 'storage': return Warehouse;
    case 'freezer': return Snowflake;
  }
};

const getStockStatus = (current: number, min: number) => {
  const ratio = current / min;
  if (ratio <= 0) return { color: 'text-red-500 bg-red-500/20', label: 'Tükendi' };
  if (ratio < 1) return { color: 'text-orange-500 bg-orange-500/20', label: 'Kritik' };
  if (ratio < 1.5) return { color: 'text-yellow-500 bg-yellow-500/20', label: 'Düşük' };
  return { color: 'text-emerald-500 bg-emerald-500/20', label: 'Yeterli' };
};

// ============================================
// STATS CARDS
// ============================================

function StatsCard({ title, value, subtitle, icon: Icon, color, trend }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; isUp: boolean };
}) {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${trend.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>%{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// INGREDIENT ROW
// ============================================

function IngredientRow({ ingredient, onEdit, onAdjust }: {
  ingredient: Ingredient;
  onEdit: () => void;
  onAdjust: (type: 'add' | 'remove') => void;
}) {
  const status = getStockStatus(ingredient.currentStock, ingredient.minStock);
  const LocationIcon = getLocationIcon(ingredient.location);
  const stockPercentage = Math.min((ingredient.currentStock / ingredient.maxStock) * 100, 100);

  return (
    <div className="bg-zinc-800/30 hover:bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/30 transition-all">
      <div className="flex items-center gap-4">
        {/* Location Icon */}
        <div className={`p-2 rounded-lg ${
          ingredient.location === 'kitchen' ? 'bg-orange-500/20 text-orange-400' :
          ingredient.location === 'bar' ? 'bg-purple-500/20 text-purple-400' :
          ingredient.location === 'freezer' ? 'bg-cyan-500/20 text-cyan-400' :
          'bg-zinc-500/20 text-zinc-400'
        }`}>
          <LocationIcon className="w-5 h-5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-white truncate">{ingredient.name}</h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>{getCategoryLabel(ingredient.category)}</span>
            <span>•</span>
            <span>{getLocationLabel(ingredient.location)}</span>
            <span>•</span>
            <span>{formatCurrency(ingredient.costPerUnit)}/{ingredient.unit}</span>
          </div>
        </div>

        {/* Stock Level */}
        <div className="w-32">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-lg font-bold text-white">{ingredient.currentStock.toFixed(1)}</span>
            <span className="text-xs text-zinc-500">{ingredient.unit}</span>
          </div>
          <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                stockPercentage < 20 ? 'bg-red-500' :
                stockPercentage < 50 ? 'bg-yellow-500' :
                'bg-emerald-500'
              }`}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600 mt-0.5">
            <span>Min: {ingredient.minStock}</span>
            <span>Max: {ingredient.maxStock}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onAdjust('remove')}
            className="p-2 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onAdjust('add')}
            className="p-2 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={onEdit}
            className="p-2 hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// RECIPE CARD
// ============================================

function RecipeCard({ recipe, ingredients }: { recipe: Recipe; ingredients: Ingredient[] }) {
  const totalCost = recipe.items.reduce((sum, item) => {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    return sum + (ing ? ing.costPerUnit * item.quantity : 0);
  }, 0);

  const hasStockIssue = recipe.items.some(item => {
    if (item.isOptional) return false;
    const ing = ingredients.find(i => i.id === item.ingredientId);
    return ing && ing.currentStock < item.quantity;
  });

  return (
    <div className={`bg-zinc-800/50 rounded-xl p-4 border ${
      hasStockIssue ? 'border-red-500/50' : 'border-zinc-700/50'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white">{recipe.menuItemName}</h3>
            {hasStockIssue && (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
          </div>
          <p className="text-xs text-zinc-500">
            {recipe.category === 'kitchen' ? '🍳 Mutfak' : '🍸 Bar'} • {recipe.preparationTime} dk
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-emerald-400">{formatCurrency(totalCost)}</p>
          <p className="text-[10px] text-zinc-500">maliyet</p>
        </div>
      </div>

      <div className="space-y-1">
        {recipe.items.map((item, idx) => {
          const ing = ingredients.find(i => i.id === item.ingredientId);
          const hasStock = ing && ing.currentStock >= item.quantity;
          
          return (
            <div key={idx} className={`flex items-center justify-between text-xs py-1 px-2 rounded ${
              !hasStock && !item.isOptional ? 'bg-red-500/10' : ''
            }`}>
              <span className={`${item.isOptional ? 'text-zinc-500' : 'text-zinc-300'}`}>
                {item.isOptional && '(opsiyonel) '}
                {item.ingredientName}
              </span>
              <span className={hasStock || item.isOptional ? 'text-zinc-400' : 'text-red-400'}>
                {item.quantity} {item.unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// ALERT ITEM
// ============================================

function AlertItem({ alert, onAcknowledge }: { alert: StockAlert; onAcknowledge: () => void }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      alert.alertType === 'critical' ? 'bg-red-500/10 border border-red-500/30' :
      'bg-orange-500/10 border border-orange-500/30'
    }`}>
      <AlertTriangle className={`w-5 h-5 ${
        alert.alertType === 'critical' ? 'text-red-400' : 'text-orange-400'
      }`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{alert.ingredientName}</p>
        <p className="text-xs text-zinc-400">
          Stok: {alert.currentStock} / Min: {alert.minStock}
        </p>
      </div>
      <button
        onClick={onAcknowledge}
        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
      >
        <Check className="w-4 h-4 text-zinc-400" />
      </button>
    </div>
  );
}

// ============================================
// STOCK ADJUSTMENT MODAL
// ============================================

function StockAdjustModal({ 
  ingredient, 
  type, 
  onClose, 
  onSubmit 
}: { 
  ingredient: Ingredient;
  type: 'add' | 'remove';
  onClose: () => void;
  onSubmit: (quantity: number, reason: string) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (quantity > 0 && reason) {
      onSubmit(quantity, reason);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          {type === 'add' ? 'Stok Girişi' : 'Stok Çıkışı'}
        </h2>
        
        <div className="space-y-4">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <p className="text-sm text-zinc-400">Malzeme</p>
            <p className="text-lg font-bold text-white">{ingredient.name}</p>
            <p className="text-sm text-zinc-500">
              Mevcut: {ingredient.currentStock} {ingredient.unit}
            </p>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Miktar ({ingredient.unit})</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={0.1}
              step={0.1}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Açıklama</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Seçin...</option>
              {type === 'add' ? (
                <>
                  <option value="Tedarikçi siparişi">Tedarikçi siparişi</option>
                  <option value="Envanter düzeltme">Envanter düzeltme</option>
                  <option value="Transfer">Transfer</option>
                </>
              ) : (
                <>
                  <option value="Fire/Kayıp">Fire/Kayıp</option>
                  <option value="Son kullanma tarihi">Son kullanma tarihi</option>
                  <option value="Kırık/Hasarlı">Kırık/Hasarlı</option>
                  <option value="Envanter düzeltme">Envanter düzeltme</option>
                </>
              )}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={!quantity || !reason}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                type === 'add'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-zinc-700'
                  : 'bg-red-600 hover:bg-red-500 text-white disabled:bg-zinc-700'
              }`}
            >
              {type === 'add' ? 'Stok Ekle' : 'Stok Düş'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

function StockPageContent() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(mockIngredients);
  const [recipes] = useState<Recipe[]>(mockRecipes);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<StockLocation | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'recipes' | 'movements'>('inventory');
  const [adjustModal, setAdjustModal] = useState<{ ingredient: Ingredient; type: 'add' | 'remove' } | null>(null);
  const [editModal, setEditModal] = useState<Ingredient | null>(null);

  // Stats
  const totalItems = ingredients.length;
  const lowStockItems = ingredients.filter(i => i.currentStock < i.minStock).length;
  const criticalItems = ingredients.filter(i => i.currentStock <= 0).length;
  const totalValue = ingredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0);

  // Alerts
  const alerts = ingredients
    .filter(i => i.currentStock < i.minStock)
    .map(i => ({
      id: i.id,
      ingredientId: i.id,
      ingredientName: i.name,
      currentStock: i.currentStock,
      minStock: i.minStock,
      alertType: i.currentStock <= 0 ? 'critical' : 'low' as 'critical' | 'low',
      isAcknowledged: false,
      createdAt: new Date(),
    }));

  // Filtered ingredients
  const filteredIngredients = ingredients.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === 'all' || i.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

  // Handle stock adjustment
  const handleAdjust = (quantity: number, reason: string) => {
    if (!adjustModal) return;

    setIngredients(prev => prev.map(i => {
      if (i.id !== adjustModal.ingredient.id) return i;
      return {
        ...i,
        currentStock: adjustModal.type === 'add' 
          ? i.currentStock + quantity 
          : Math.max(0, i.currentStock - quantity),
        lastUpdated: new Date(),
      };
    }));

    setAdjustModal(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Stok Yönetimi</h1>
              <p className="text-sm text-zinc-400">Malzeme ve reçete takibi</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all"
            >
              <Home className="w-5 h-5" />
            </Link>
            
            {alerts.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-xl">
                <Bell className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">{alerts.length} uyarı</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Toplam Ürün"
            value={totalItems}
            subtitle={`${ingredients.filter(i => i.location === 'kitchen' || i.location === 'freezer').length} mutfak, ${ingredients.filter(i => i.location === 'bar').length} bar`}
            icon={Package}
            color="from-blue-500 to-cyan-600"
          />
          <StatsCard
            title="Düşük Stok"
            value={lowStockItems}
            subtitle={criticalItems > 0 ? `${criticalItems} kritik` : 'Kritik yok'}
            icon={AlertTriangle}
            color="from-orange-500 to-red-600"
          />
          <StatsCard
            title="Stok Değeri"
            value={formatCurrency(totalValue)}
            icon={TrendingUp}
            color="from-emerald-500 to-teal-600"
          />
          <StatsCard
            title="Tedarikçi"
            value="4"
            subtitle="Aktif tedarikçi"
            icon={Truck}
            color="from-purple-500 to-pink-600"
          />
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Stok Uyarıları
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {alerts.slice(0, 6).map(alert => (
                <AlertItem 
                  key={alert.id} 
                  alert={alert as StockAlert} 
                  onAcknowledge={() => {}} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-zinc-800 pb-2">
          {[
            { key: 'inventory', label: 'Envanter', icon: Package },
            { key: 'recipes', label: 'Reçeteler', icon: FileText },
            { key: 'movements', label: 'Hareketler', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'inventory' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Malzeme ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'Tümü', icon: null },
                  { key: 'kitchen', label: 'Mutfak', icon: ChefHat },
                  { key: 'bar', label: 'Bar', icon: Wine },
                  { key: 'storage', label: 'Depo', icon: Warehouse },
                  { key: 'freezer', label: 'Soğuk', icon: Snowflake },
                ].map(loc => (
                  <button
                    key={loc.key}
                    onClick={() => setLocationFilter(loc.key as typeof locationFilter)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      locationFilter === loc.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {loc.icon && <loc.icon className="w-4 h-4" />}
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredients List */}
            <div className="space-y-2">
              {filteredIngredients.map(ingredient => (
                <IngredientRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  onEdit={() => setEditModal(ingredient)}
                  onAdjust={(type) => setAdjustModal({ ingredient, type })}
                />
              ))}
            </div>
          </>
        )}

        {activeTab === 'recipes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} ingredients={ingredients} />
            ))}
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="bg-zinc-800/30 rounded-xl p-8 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
            <h3 className="text-xl font-bold text-zinc-400 mb-2">Stok Hareketleri</h3>
            <p className="text-zinc-500">
              Stok giriş/çıkış hareketleri burada listelenecek
            </p>
          </div>
        )}
      </main>

      {/* Stock Adjustment Modal */}
      {editModal && (
        <IngredientEditModal
          ingredient={editModal}
          onClose={() => setEditModal(null)}
          onSave={(updated) => {
            setIngredients(prev => prev.map(i => i.id === updated.id ? updated : i));
            setEditModal(null);
          }}
        />
      )}

      {adjustModal && (
        <StockAdjustModal
          ingredient={adjustModal.ingredient}
          type={adjustModal.type}
          onClose={() => setAdjustModal(null)}
          onSubmit={handleAdjust}
        />
      )}
    </div>
  );
}

export default function StockPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'manager']}>
      <StockPageContent />
    </ProtectedRoute>
  );
}

// ============================================
// INGREDIENT EDIT MODAL
// ============================================

function IngredientEditModal({ 
  ingredient, 
  onClose, 
  onSave 
}: { 
  ingredient: Ingredient;
  onClose: () => void;
  onSave: (updated: Ingredient) => void;
}) {
  const [formData, setFormData] = useState({
    name: ingredient.name,
    minStock: ingredient.minStock,
    maxStock: ingredient.maxStock,
    costPerUnit: ingredient.costPerUnit,
    location: ingredient.location,
    category: ingredient.category,
  });

  const handleSubmit = () => {
    onSave({ ...ingredient, ...formData });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Malzeme Düzenle</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Malzeme Adı</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Min Stok</label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData(prev => ({ ...prev, minStock: Number(e.target.value) }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Max Stok</label>
              <input
                type="number"
                value={formData.maxStock}
                onChange={(e) => setFormData(prev => ({ ...prev, maxStock: Number(e.target.value) }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Birim Maliyet (₺)</label>
            <input
              type="number"
              step="0.01"
              value={formData.costPerUnit}
              onChange={(e) => setFormData(prev => ({ ...prev, costPerUnit: Number(e.target.value) }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Konum</label>
            <select
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value as StockLocation }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="kitchen">Mutfak</option>
              <option value="bar">Bar</option>
              <option value="storage">Depo</option>
              <option value="freezer">Soğuk Hava</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
