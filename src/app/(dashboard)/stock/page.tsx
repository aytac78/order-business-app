'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import {
  fetchStockItems, fetchStockMovements, fetchSuppliers, fetchRecipes, fetchStockCounts,
  createStockItem, updateStockItem, addStockMovement, createSupplier,
  createRecipe, addRecipeIngredient, deleteRecipeIngredient, createStockCount,
  fetchStockCountItems, updateStockCountItem, completeStockCount,
  getStockStats, subscribeToStockChanges, calculateRecipeCost,
  StockItem, StockMovement, Supplier, Recipe, RecipeIngredient, StockCount, StockCountItem
} from '@/lib/services/stock';
import {
  Package, Plus, Search, AlertTriangle, Truck, History, Edit, Trash2, X, Check, RefreshCw,
  ArrowDownCircle, ArrowUpCircle, AlertCircle, DollarSign, Boxes, ChefHat, ClipboardList,
  Barcode, Camera, ScanLine, Calculator, FileSpreadsheet, MoreVertical
} from 'lucide-react';

const UNITS = ['adet', 'kg', 'g', 'lt', 'ml', 'paket', 'kutu', 'porsiyon', 'şişe', 'kasa'];
const CATEGORIES = ['Mutfak', 'Bar', 'Depo', 'Soğuk', 'Temizlik', 'Ambalaj', 'Diğer'];

type TabType = 'inventory' | 'recipes' | 'movements' | 'counts';

export default function StockPage() {
  const { currentVenue } = useVenueStore();
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [selectedCount, setSelectedCount] = useState<StockCount | null>(null);
  const [movementType, setMovementType] = useState<'in' | 'out'>('in');

  const loadData = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);
    try {
      const [itemsData, movementsData, suppliersData, recipesData, countsData, statsData] = await Promise.all([
        fetchStockItems(currentVenue.id),
        fetchStockMovements(currentVenue.id, 100),
        fetchSuppliers(currentVenue.id),
        fetchRecipes(currentVenue.id),
        fetchStockCounts(currentVenue.id),
        getStockStats(currentVenue.id)
      ]);
      setItems(itemsData);
      setMovements(movementsData);
      setSuppliers(suppliersData);
      setRecipes(recipesData);
      setStockCounts(countsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentVenue?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!currentVenue?.id) return;
    const channel = subscribeToStockChanges(currentVenue.id, () => loadData());
    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadData]);

  // Barcode listener
  useEffect(() => {
    let buffer = '';
    let timeout: NodeJS.Timeout;
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter' && buffer.length > 3) {
        const item = items.find(i => i.barcode === buffer);
        if (item) {
          setSelectedItem(item);
          setMovementType('out');
          setShowMovementModal(true);
        } else {
          alert(`Barkod bulunamadı: ${buffer}`);
        }
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => { buffer = ''; }, 100);
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [items]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.barcode?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = items.filter(i => i.current_quantity <= i.min_quantity);

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Lütfen bir mekan seçin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
            <Package className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stok Yönetimi</h1>
            <p className="text-gray-500">Malzeme ve reçete takibi</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="p-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-colors"
            title="Barkod Okuyucu"
          >
            <ScanLine className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSupplierModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <Truck className="w-5 h-5" />
            <span className="hidden md:inline">Tedarikçiler</span>
          </button>
          <button
            onClick={() => { setEditingItem(null); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ürün Ekle
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Boxes} label="Toplam Ürün" value={stats?.totalItems || 0} sub={`${items.filter(i => i.category === 'Mutfak').length} mutfak, ${items.filter(i => i.category === 'Bar').length} bar`} color="blue" />
        <StatCard icon={AlertTriangle} label="Düşük Stok" value={stats?.lowStockCount || 0} sub={stats?.lowStockCount === 0 ? 'Kritik yok' : 'Dikkat!'} color="amber" />
        <StatCard icon={DollarSign} label="Stok Değeri" value={`₺${(stats?.totalValue || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} color="green" />
        <StatCard icon={Truck} label="Tedarikçi" value={suppliers.length} sub="Aktif tedarikçi" color="purple" />
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-800">Stok Uyarıları</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.slice(0, 5).map(item => (
              <button
                key={item.id}
                onClick={() => { setSelectedItem(item); setMovementType('in'); setShowMovementModal(true); }}
                className="flex items-center gap-2 px-3 py-2 bg-amber-100 hover:bg-amber-200 rounded-xl text-amber-800 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">{item.name}</span>
                <span className="text-sm opacity-75">Stok: {item.current_quantity} / Min: {item.min_quantity}</span>
                <Check className="w-4 h-4 ml-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={Package} label="Envanter" />
        <TabButton active={activeTab === 'recipes'} onClick={() => setActiveTab('recipes')} icon={ChefHat} label="Reçeteler" />
        <TabButton active={activeTab === 'movements'} onClick={() => setActiveTab('movements')} icon={History} label="Hareketler" />
        <TabButton active={activeTab === 'counts'} onClick={() => setActiveTab('counts')} icon={ClipboardList} label="Sayım" />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Malzeme ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <FilterButton active={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')} label="Tümü" />
          {CATEGORIES.map(cat => (
            <FilterButton key={cat} active={selectedCategory === cat} onClick={() => setSelectedCategory(cat)} label={cat} icon={cat === 'Mutfak' ? '🍳' : cat === 'Bar' ? '🍷' : cat === 'Depo' ? '📦' : cat === 'Soğuk' ? '❄️' : undefined} />
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'inventory' && (
        <InventoryTab
          items={filteredItems}
          isLoading={isLoading}
          onAddItem={() => { setEditingItem(null); setShowAddModal(true); }}
          onEditItem={(item) => { setEditingItem(item); setShowAddModal(true); }}
          onStockIn={(item) => { setSelectedItem(item); setMovementType('in'); setShowMovementModal(true); }}
          onStockOut={(item) => { setSelectedItem(item); setMovementType('out'); setShowMovementModal(true); }}
        />
      )}

      {activeTab === 'recipes' && (
        <RecipesTab
          recipes={recipes}
          isLoading={isLoading}
          onAddRecipe={() => { setEditingRecipe(null); setShowRecipeModal(true); }}
          onEditRecipe={(recipe) => { setEditingRecipe(recipe); setShowRecipeModal(true); }}
        />
      )}

      {activeTab === 'movements' && (
        <MovementsTab movements={movements} isLoading={isLoading} />
      )}

      {activeTab === 'counts' && (
        <CountsTab
          counts={stockCounts}
          isLoading={isLoading}
          onNewCount={() => setShowCountModal(true)}
          onViewCount={(count) => { setSelectedCount(count); setShowCountModal(true); }}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <AddEditItemModal
          item={editingItem}
          suppliers={suppliers}
          venueId={currentVenue.id}
          onClose={() => { setShowAddModal(false); setEditingItem(null); }}
          onSave={loadData}
        />
      )}

      {showMovementModal && selectedItem && (
        <StockMovementModal
          item={selectedItem}
          type={movementType}
          suppliers={suppliers}
          venueId={currentVenue.id}
          onClose={() => { setShowMovementModal(false); setSelectedItem(null); }}
          onSave={loadData}
        />
      )}

      {showSupplierModal && (
        <SupplierModal
          suppliers={suppliers}
          venueId={currentVenue.id}
          onClose={() => setShowSupplierModal(false)}
          onSave={loadData}
        />
      )}

      {showRecipeModal && (
        <RecipeModal
          recipe={editingRecipe}
          stockItems={items}
          venueId={currentVenue.id}
          onClose={() => { setShowRecipeModal(false); setEditingRecipe(null); }}
          onSave={loadData}
        />
      )}

      {showCountModal && (
        <StockCountModal
          count={selectedCount}
          stockItems={items}
          venueId={currentVenue.id}
          onClose={() => { setShowCountModal(false); setSelectedCount(null); }}
          onSave={loadData}
        />
      )}

      {showBarcodeScanner && (
        <BarcodeScannerModal
          items={items}
          onClose={() => setShowBarcodeScanner(false)}
          onScan={(item) => {
            setShowBarcodeScanner(false);
            setSelectedItem(item);
            setMovementType('out');
            setShowMovementModal(true);
          }}
        />
      )}
    </div>
  );
}

// ============ COMPONENTS ============

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600'
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
        active ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

function FilterButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
        active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

// ============ INVENTORY TAB ============

function InventoryTab({ items, isLoading, onAddItem, onEditItem, onStockIn, onStockOut }: {
  items: StockItem[];
  isLoading: boolean;
  onAddItem: () => void;
  onEditItem: (item: StockItem) => void;
  onStockIn: (item: StockItem) => void;
  onStockOut: (item: StockItem) => void;
}) {
  if (isLoading) return <LoadingSpinner />;
  if (items.length === 0) return <EmptyState message="Henüz ürün eklenmemiş" onAction={onAddItem} actionLabel="İlk Ürünü Ekle" />;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Ürün</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Kategori</th>
            <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Miktar</th>
            <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Min/Max</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Birim Fiyat</th>
            <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Durum</th>
            <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map(item => {
            const isLow = item.current_quantity <= item.min_quantity;
            const isOut = item.current_quantity === 0;
            const percentage = item.max_quantity ? (item.current_quantity / item.max_quantity) * 100 : 50;

            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.barcode && <p className="text-xs text-gray-400">Son: {new Date(item.updated_at).toLocaleDateString('tr-TR')}</p>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm">{item.category}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-center">
                    <p className={`font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                      {item.current_quantity} <span className="font-normal text-gray-500">{item.unit}</span>
                    </p>
                    <div className="w-24 mx-auto mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-500">
                  {item.min_quantity} / {item.max_quantity || '∞'}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  ₺{item.cost_per_unit.toLocaleString('tr-TR')}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    isOut ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {isOut ? 'Tükendi' : isLow ? 'Düşük' : 'Normal'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onStockOut(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Çıkış">
                      <span className="text-lg">-</span>
                    </button>
                    <button onClick={() => onStockIn(item)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Giriş">
                      <span className="text-lg">+</span>
                    </button>
                    <button onClick={() => onEditItem(item)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Düzenle">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============ RECIPES TAB ============

function RecipesTab({ recipes, isLoading, onAddRecipe, onEditRecipe }: {
  recipes: Recipe[];
  isLoading: boolean;
  onAddRecipe: () => void;
  onEditRecipe: (recipe: Recipe) => void;
}) {
  if (isLoading) return <LoadingSpinner />;
  if (recipes.length === 0) return <EmptyState message="Henüz reçete eklenmemiş" onAction={onAddRecipe} actionLabel="İlk Reçeteyi Ekle" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recipes.map(recipe => {
        const cost = calculateRecipeCost(recipe);
        return (
          <div key={recipe.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{recipe.name}</h3>
                  <p className="text-sm text-gray-500">{recipe.yield_quantity} {recipe.yield_unit}</p>
                </div>
              </div>
              <button onClick={() => onEditRecipe(recipe)} className="p-2 hover:bg-gray-100 rounded-lg">
                <Edit className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {recipe.ingredients?.slice(0, 4).map(ing => (
                <div key={ing.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{ing.stock_item?.name}</span>
                  <span className="text-gray-400">{ing.quantity} {ing.unit}</span>
                </div>
              ))}
              {(recipe.ingredients?.length || 0) > 4 && (
                <p className="text-xs text-gray-400">+{(recipe.ingredients?.length || 0) - 4} malzeme daha</p>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Maliyet</p>
                <p className="font-bold text-gray-900">₺{cost.toFixed(2)}</p>
              </div>
              {recipe.preparation_time && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">Hazırlık</p>
                  <p className="text-sm text-gray-600">{recipe.preparation_time} dk</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      <button
        onClick={onAddRecipe}
        className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center hover:border-orange-300 hover:bg-orange-50 transition-colors"
      >
        <Plus className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-gray-500">Yeni Reçete</span>
      </button>
    </div>
  );
}

// ============ MOVEMENTS TAB ============

function MovementsTab({ movements, isLoading }: { movements: StockMovement[]; isLoading: boolean }) {
  const typeLabels: Record<string, { label: string; color: string; icon: any }> = {
    in: { label: 'Giriş', color: 'text-green-600 bg-green-50', icon: ArrowDownCircle },
    out: { label: 'Çıkış', color: 'text-red-600 bg-red-50', icon: ArrowUpCircle },
    adjustment: { label: 'Düzeltme', color: 'text-blue-600 bg-blue-50', icon: Edit },
    transfer: { label: 'Transfer', color: 'text-purple-600 bg-purple-50', icon: Truck },
    waste: { label: 'Fire', color: 'text-orange-600 bg-orange-50', icon: Trash2 },
    return: { label: 'İade', color: 'text-cyan-600 bg-cyan-50', icon: RefreshCw }
  };

  if (isLoading) return <LoadingSpinner />;
  if (movements.length === 0) return <EmptyState message="Henüz stok hareketi yok" />;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Tarih</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Ürün</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Tür</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Miktar</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Önceki → Yeni</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Not</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {movements.map(m => {
              const typeInfo = typeLabels[m.type] || typeLabels.out;
              const Icon = typeInfo.icon;
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(m.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{(m.stock_item as any)?.name || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${typeInfo.color}`}>
                      <Icon className="w-3 h-3" />
                      {typeInfo.label}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${m.type === 'in' || m.type === 'return' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'in' || m.type === 'return' ? '+' : '-'}{m.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">
                    {m.previous_quantity} → {m.new_quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{m.notes || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ COUNTS TAB ============

function CountsTab({ counts, isLoading, onNewCount, onViewCount }: {
  counts: StockCount[];
  isLoading: boolean;
  onNewCount: () => void;
  onViewCount: (count: StockCount) => void;
}) {
  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: 'Taslak', color: 'bg-gray-100 text-gray-600' },
    in_progress: { label: 'Devam Ediyor', color: 'bg-blue-100 text-blue-600' },
    completed: { label: 'Tamamlandı', color: 'bg-green-100 text-green-600' },
    cancelled: { label: 'İptal', color: 'bg-red-100 text-red-600' }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <button
        onClick={onNewCount}
        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-orange-300 hover:text-orange-500 flex items-center justify-center gap-2 transition-colors"
      >
        <ClipboardList className="w-5 h-5" />
        Yeni Sayım Başlat
      </button>

      {counts.length === 0 ? (
        <EmptyState message="Henüz stok sayımı yapılmamış" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Tarih</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Durum</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">İlerleme</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Fark</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {counts.map(count => {
                const status = statusLabels[count.status] || statusLabels.draft;
                return (
                  <tr key={count.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{new Date(count.count_date).toLocaleDateString('tr-TR')}</p>
                      <p className="text-xs text-gray-400">{new Date(count.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {count.counted_items} / {count.total_items}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${count.variance_value > 0 ? 'text-green-600' : count.variance_value < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {count.variance_value > 0 ? '+' : ''}₺{count.variance_value.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onViewCount(count)}
                        className="px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg"
                      >
                        {count.status === 'in_progress' ? 'Devam Et' : 'Görüntüle'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============ HELPER COMPONENTS ============

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
    </div>
  );
}

function EmptyState({ message, onAction, actionLabel }: { message: string; onAction?: () => void; actionLabel?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 mb-4">{message}</p>
      {onAction && actionLabel && (
        <button onClick={onAction} className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ============ MODALS ============

function AddEditItemModal({ item, suppliers, venueId, onClose, onSave }: {
  item: StockItem | null; suppliers: Supplier[]; venueId: string; onClose: () => void; onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || '', barcode: item?.barcode || '', sku: item?.sku || '',
    category: item?.category || CATEGORIES[0], unit: item?.unit || UNITS[0],
    current_quantity: item?.current_quantity || 0, min_quantity: item?.min_quantity || 0,
    max_quantity: item?.max_quantity || 0, cost_per_unit: item?.cost_per_unit || 0,
    sale_price: item?.sale_price || 0, supplier_id: item?.supplier_id || '',
    location: item?.location || '', notes: item?.notes || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (item) await updateStockItem(item.id, { ...formData, venue_id: venueId });
      else await createStockItem({ ...formData, venue_id: venueId, is_active: true });
      onSave(); onClose();
    } catch (error) { console.error(error); alert('Hata!'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{item ? 'Ürün Düzenle' : 'Yeni Ürün'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Ürün Adı *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Barkod</label>
              <input type="text" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Birim</label>
              <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mevcut Stok</label>
              <input type="number" step="0.01" value={formData.current_quantity} onChange={(e) => setFormData({...formData, current_quantity: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Stok</label>
              <input type="number" step="0.01" value={formData.min_quantity} onChange={(e) => setFormData({...formData, min_quantity: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Stok</label>
              <input type="number" step="0.01" value={formData.max_quantity} onChange={(e) => setFormData({...formData, max_quantity: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Alış Fiyatı (₺)</label>
              <input type="number" step="0.01" value={formData.cost_per_unit} onChange={(e) => setFormData({...formData, cost_per_unit: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Satış Fiyatı (₺)</label>
              <input type="number" step="0.01" value={formData.sale_price} onChange={(e) => setFormData({...formData, sale_price: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tedarikçi</label>
              <select value={formData.supplier_id} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white">
                <option value="">Seçiniz</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Konum</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="Raf A-3" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border rounded-xl hover:bg-gray-50">İptal</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {item ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StockMovementModal({ item, type, suppliers, venueId, onClose, onSave }: {
  item: StockItem; type: 'in' | 'out'; suppliers: Supplier[]; venueId: string; onClose: () => void; onSave: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [supplierId, setSupplierId] = useState(item.supplier_id || '');
  const [saving, setSaving] = useState(false);

  const newQuantity = type === 'in' ? item.current_quantity + quantity : item.current_quantity - quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || (type === 'out' && newQuantity < 0)) return;
    setSaving(true);
    try {
      await addStockMovement(venueId, item.id, type, quantity, notes, item.cost_per_unit, supplierId || undefined);
      onSave(); onClose();
    } catch (error) { console.error(error); alert('Hata!'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="border-b px-6 py-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'in' ? 'bg-green-100' : 'bg-red-100'}`}>
            {type === 'in' ? <ArrowDownCircle className="w-5 h-5 text-green-600" /> : <ArrowUpCircle className="w-5 h-5 text-red-600" />}
          </div>
          <div>
            <h2 className="font-bold">{type === 'in' ? 'Stok Girişi' : 'Stok Çıkışı'}</h2>
            <p className="text-sm text-gray-500">{item.name}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">Mevcut Stok</p>
            <p className="text-3xl font-bold">{item.current_quantity} {item.unit}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Miktar</label>
            <input type="number" step="0.01" min="0.01" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 text-xl font-bold text-center border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" autoFocus />
          </div>
          <div className={`rounded-xl p-4 text-center ${type === 'in' ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-sm text-gray-600">Yeni Stok</p>
            <p className={`text-2xl font-bold ${type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{newQuantity.toFixed(2)} {item.unit}</p>
          </div>
          {type === 'in' && (
            <div>
              <label className="block text-sm font-medium mb-1">Tedarikçi</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white">
                <option value="">Seçiniz</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Not</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" 
              placeholder={type === 'in' ? 'Fatura No: 12345' : 'Mutfak kullanımı'} />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 border rounded-xl hover:bg-gray-50">İptal</button>
            <button type="submit" disabled={saving || quantity <= 0 || (type === 'out' && newQuantity < 0)}
              className={`flex-1 py-3 text-white rounded-xl disabled:opacity-50 ${type === 'in' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
              {type === 'in' ? 'Giriş Yap' : 'Çıkış Yap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SupplierModal({ suppliers, venueId, onClose, onSave }: {
  suppliers: Supplier[]; venueId: string; onClose: () => void; onSave: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', contact_person: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createSupplier({ ...formData, venue_id: venueId, is_active: true });
      onSave(); setShowForm(false); setFormData({ name: '', phone: '', email: '', contact_person: '' });
    } catch (error) { console.error(error); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-bold">Tedarikçiler</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {!showForm ? (
            <>
              <button onClick={() => setShowForm(true)} className="w-full mb-4 py-3 border-2 border-dashed rounded-xl text-gray-500 hover:border-orange-300 hover:text-orange-500 flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" /> Yeni Tedarikçi
              </button>
              {suppliers.length === 0 ? <p className="text-center text-gray-500 py-8">Henüz tedarikçi yok</p> : (
                <div className="space-y-2">
                  {suppliers.map(s => (
                    <div key={s.id} className="p-4 bg-gray-50 rounded-xl">
                      <p className="font-medium">{s.name}</p>
                      <div className="flex gap-4 mt-1 text-sm text-gray-500">
                        {s.phone && <span>📞 {s.phone}</span>}
                        {s.contact_person && <span>👤 {s.contact_person}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Firma Adı *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Yetkili</label>
                <input type="text" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefon</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border rounded-xl hover:bg-gray-50">İptal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50">Kaydet</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function RecipeModal({ recipe, stockItems, venueId, onClose, onSave }: {
  recipe: Recipe | null; stockItems: StockItem[]; venueId: string; onClose: () => void; onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: recipe?.name || '', description: recipe?.description || '',
    yield_quantity: recipe?.yield_quantity || 1, yield_unit: recipe?.yield_unit || 'porsiyon',
    preparation_time: recipe?.preparation_time || 0
  });
  const [ingredients, setIngredients] = useState<{stock_item_id: string; quantity: number; unit: string}[]>(
    recipe?.ingredients?.map(i => ({ stock_item_id: i.stock_item_id, quantity: i.quantity, unit: i.unit })) || []
  );
  const [saving, setSaving] = useState(false);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { stock_item_id: '', quantity: 0, unit: 'g' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || ingredients.length === 0) return;
    setSaving(true);
    try {
      let recipeId = recipe?.id;
      if (recipe) {
        await fetch(`/api/recipes/${recipe.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      } else {
        const newRecipe = await createRecipe({ ...formData, venue_id: venueId, is_active: true });
        recipeId = newRecipe.id;
      }
      // Add ingredients
      for (const ing of ingredients) {
        if (ing.stock_item_id && ing.quantity > 0) {
          await addRecipeIngredient({ recipe_id: recipeId, ...ing });
        }
      }
      onSave(); onClose();
    } catch (error) { console.error(error); alert('Hata!'); }
    finally { setSaving(false); }
  };

  const totalCost = ingredients.reduce((sum, ing) => {
    const item = stockItems.find(i => i.id === ing.stock_item_id);
    return sum + (ing.quantity * (item?.cost_per_unit || 0));
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{recipe ? 'Reçete Düzenle' : 'Yeni Reçete'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Reçete Adı *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" required placeholder="Örn: Margherita Pizza" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Miktar</label>
              <input type="number" value={formData.yield_quantity} onChange={(e) => setFormData({...formData, yield_quantity: parseFloat(e.target.value) || 1})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Birim</label>
              <input type="text" value={formData.yield_unit} onChange={(e) => setFormData({...formData, yield_unit: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="porsiyon" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hazırlık Süresi (dk)</label>
              <input type="number" value={formData.preparation_time} onChange={(e) => setFormData({...formData, preparation_time: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Malzemeler</label>
              <button type="button" onClick={handleAddIngredient} className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Malzeme Ekle
              </button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select value={ing.stock_item_id} onChange={(e) => {
                    const newIngs = [...ingredients];
                    newIngs[idx].stock_item_id = e.target.value;
                    setIngredients(newIngs);
                  }} className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white text-sm">
                    <option value="">Malzeme seç...</option>
                    {stockItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <input type="number" step="0.01" value={ing.quantity} onChange={(e) => {
                    const newIngs = [...ingredients];
                    newIngs[idx].quantity = parseFloat(e.target.value) || 0;
                    setIngredients(newIngs);
                  }} className="w-20 px-3 py-2 border rounded-lg text-sm" placeholder="Miktar" />
                  <select value={ing.unit} onChange={(e) => {
                    const newIngs = [...ingredients];
                    newIngs[idx].unit = e.target.value;
                    setIngredients(newIngs);
                  }} className="w-20 px-2 py-2 border rounded-lg text-sm bg-white">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button type="button" onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-orange-800 font-medium">Tahmini Maliyet</span>
            <span className="text-xl font-bold text-orange-600">₺{totalCost.toFixed(2)}</span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border rounded-xl hover:bg-gray-50">İptal</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50">
              {recipe ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StockCountModal({ count, stockItems, venueId, onClose, onSave }: {
  count: StockCount | null; stockItems: StockItem[]; venueId: string; onClose: () => void; onSave: () => void;
}) {
  const [countItems, setCountItems] = useState<StockCountItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (count) {
      fetchStockCountItems(count.id).then(setCountItems);
    }
  }, [count]);

  const handleStartCount = async () => {
    setLoading(true);
    try {
      const newCount = await createStockCount(venueId, notes);
      const items = await fetchStockCountItems(newCount.id);
      setCountItems(items);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleUpdateItem = async (itemId: string, quantity: number) => {
    await updateStockCountItem(itemId, quantity);
    setCountItems(prev => prev.map(i => i.id === itemId ? { ...i, counted_quantity: quantity, difference: quantity - i.system_quantity } : i));
  };

  const handleComplete = async () => {
    if (!count) return;
    setLoading(true);
    try {
      await completeStockCount(count.id, true);
      onSave(); onClose();
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="font-bold">{count ? 'Stok Sayımı' : 'Yeni Sayım'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!count && countItems.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Yeni Sayım Başlat</h3>
              <p className="text-gray-500 mb-4">Tüm stok kalemlerini sayarak envanter kontrolü yapın.</p>
              <div className="max-w-xs mx-auto mb-4">
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-xl" placeholder="Sayım notu (opsiyonel)" />
              </div>
              <button onClick={handleStartCount} disabled={loading}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50">
                {loading ? 'Başlatılıyor...' : 'Sayımı Başlat'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {countItems.map(item => (
                <div key={item.id} className={`p-4 rounded-xl border ${
                  item.difference && item.difference !== 0 
                    ? item.difference > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.stock_item?.name}</p>
                      <p className="text-sm text-gray-500">Sistem: {item.system_quantity} {item.stock_item?.unit}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        step="0.01"
                        value={item.counted_quantity ?? ''}
                        onChange={(e) => handleUpdateItem(item.id, parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border rounded-lg text-center font-bold"
                        placeholder="Sayım"
                      />
                      {item.difference !== null && item.difference !== undefined && (
                        <span className={`font-bold ${item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {item.difference > 0 ? '+' : ''}{item.difference}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {count && count.status === 'in_progress' && (
          <div className="border-t px-6 py-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {countItems.filter(i => i.counted_quantity !== null).length} / {countItems.length} sayıldı
            </p>
            <button onClick={handleComplete} disabled={loading}
              className="px-6 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50">
              Sayımı Tamamla
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BarcodeScannerModal({ items, onClose, onScan }: {
  items: StockItem[]; onClose: () => void; onScan: (item: StockItem) => void;
}) {
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');

  const handleScan = () => {
    const item = items.find(i => i.barcode === barcode);
    if (item) {
      onScan(item);
    } else {
      setError('Barkod bulunamadı!');
      setTimeout(() => setError(''), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="font-bold">Barkod Okuyucu</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-900 rounded-2xl aspect-video flex items-center justify-center">
            <div className="text-center text-white">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">Kamera desteği yakında</p>
            </div>
          </div>

          <div className="text-center text-gray-500 text-sm">veya manuel girin</div>

          <div className="flex gap-2">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              placeholder="Barkod numarası..."
              autoFocus
            />
            <button onClick={handleScan} className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600">
              <Check className="w-5 h-5" />
            </button>
          </div>

          {error && <p className="text-center text-red-500">{error}</p>}

          <p className="text-center text-sm text-gray-400">
            💡 USB barkod okuyucu ile herhangi bir yerde okutabilirsiniz
          </p>
        </div>
      </div>
    </div>
  );
}
