'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Plus, X, Edit2, Trash2, AlertCircle, Loader2, RefreshCw,
  Image, DollarSign, Clock, Tag, ChevronRight, Eye, EyeOff,
  GripVertical, Upload, Search, Filter
} from 'lucide-react';

interface Category {
  id: string;
  venue_id: string;
  name: string;
  name_en?: string;
  name_it?: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
}

interface Product {
  id: string;
  venue_id: string;
  category_id: string;
  name: string;
  name_en?: string;
  name_it?: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  preparation_time?: number;
  sort_order: number;
}

export default function MenuPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('menu');
  const locale = useLocale();

  const getCategoryName = (category: Category) => {
    if (locale === 'en' && category.name_en) return category.name_en;
    if (locale === 'it' && category.name_it) return category.name_it;
    return category.name;
  };
  const tCommon = useTranslations('common');

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadData = useCallback(async () => {
    if (!currentVenue?.id) return;

    const [categoriesRes, productsRes] = await Promise.all([
      supabase.from('categories').select('*').eq('venue_id', currentVenue.id).order('sort_order'),
      supabase.from('products').select('*').eq('venue_id', currentVenue.id).order('sort_order')
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryProducts = (categoryId: string) => products.filter(p => p.category_id === categoryId);

  const handleSaveCategory = async (data: Partial<Category>) => {
    if (!currentVenue?.id) return;

    if (editingCategory) {
      await supabase.from('categories').update(data).eq('id', editingCategory.id);
    } else {
      await supabase.from('categories').insert({
        ...data,
        venue_id: currentVenue.id,
        sort_order: categories.length,
        is_active: true
      });
    }

    setShowCategoryModal(false);
    setEditingCategory(null);
    loadData();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(tCommon('confirmDelete'))) return;
    await supabase.from('categories').delete().eq('id', id);
    loadData();
  };

  const handleSaveProduct = async (data: Partial<Product>) => {
    if (!currentVenue?.id) return;

    if (editingProduct) {
      await supabase.from('products').update(data).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert({
        ...data,
        venue_id: currentVenue.id,
        sort_order: products.length,
        is_available: true
      });
    }

    setShowProductModal(false);
    setEditingProduct(null);
    loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(tCommon('confirmDelete'))) return;
    await supabase.from('products').delete().eq('id', id);
    loadData();
  };

  const handleToggleAvailability = async (product: Product) => {
    await supabase.from('products').update({ is_available: !product.is_available }).eq('id', product.id);
    loadData();
  };

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">{tCommon('selectVenue')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400">{categories.length} {t('categories')} • {products.length} {t('products')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
          <button type="button"
            onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addCategory')}
          </button>
          <button type="button"
            onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addProduct')}
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${tCommon('search')}...`}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white"
        >
          <option value="">{tCommon('all')} {t('categories')}</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-medium text-gray-400 mb-3">{t('categories')}</h3>
          
          <button type="button"
            onClick={() => setSelectedCategory(null)}
            className={`w-full p-3 rounded-xl text-left transition-colors ${
              !selectedCategory ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{tCommon('all')}</span>
              <span className="text-sm opacity-70">{products.length}</span>
            </div>
          </button>

          {categories.map(category => (
            <div
              key={category.id}
              className={`group p-3 rounded-xl transition-colors ${
                selectedCategory === category.id ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <button type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex-1 text-left"
                >
                  <span>{getCategoryName(category)}</span>
                  <span className="text-sm opacity-70 ml-2">({getCategoryProducts(category.id).length})</span>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button"
                    onClick={() => { setEditingCategory(category); setShowCategoryModal(true); }}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button type="button"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1 hover:bg-white/20 rounded text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl">
              <Tag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">{tCommon('noData')}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const category = categories.find(c => c.id === product.category_id);
                return (
                  <div
                    key={product.id}
                    className={`bg-gray-800 rounded-xl overflow-hidden border border-gray-700 ${
                      !product.is_available ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Image */}
                    <div className="h-32 bg-gray-700 relative">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                      {/* Availability badge */}
                      <button type="button"
                        onClick={() => handleToggleAvailability(product)}
                        className={`absolute top-2 right-2 p-1.5 rounded-lg ${
                          product.is_available ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        {product.is_available ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-white">{product.name}</h3>
                          {category && (
                            <p className="text-xs text-gray-500">{getCategoryName(category)}</p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-orange-400">₺{product.price}</p>
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{product.description}</p>
                      )}

                      {product.preparation_time && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                          <Clock className="w-3 h-3" />
                          <span>{product.preparation_time} dk</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button type="button"
                          onClick={() => { setEditingProduct(product); setShowProductModal(true); }}
                          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm flex items-center justify-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          {tCommon('edit')}
                        </button>
                        <button type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="py-2 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          t={t}
          tCommon={tCommon}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
          onSave={handleSaveCategory}
        />
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          t={t}
          tCommon={tCommon}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}

// Category Modal
function CategoryModal({
  category, t, tCommon, onClose, onSave
}: {
  category: Category | null;
  t: any;
  tCommon: any;
  onClose: () => void;
  onSave: (data: Partial<Category>) => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {category ? t('editCategory') : t('addCategory')}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('categoryName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{tCommon('description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button"
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
            >
              {tCommon('cancel')}
            </button>
            <button type="button"
              type="submit"
              className="flex-1 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
            >
              {tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Product Modal
function ProductModal({
  product, categories, t, tCommon, onClose, onSave
}: {
  product: Product | null;
  categories: Category[];
  t: any;
  tCommon: any;
  onClose: () => void;
  onSave: (data: Partial<Product>) => void;
}) {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [categoryId, setCategoryId] = useState(product?.category_id || categories[0]?.id || '');
  const [preparationTime, setPreparationTime] = useState(product?.preparation_time?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      price: parseFloat(price),
      category_id: categoryId,
      preparation_time: preparationTime ? parseInt(preparationTime) : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <h2 className="text-xl font-bold text-white">
            {product ? t('editProduct') : t('addProduct')}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('productName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('productDescription')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('categories')}</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('productPrice')} (₺)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('preparationTime')} (dk)</label>
              <input
                type="number"
                value={preparationTime}
                onChange={(e) => setPreparationTime(e.target.value)}
                min="0"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button"
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
            >
              {tCommon('cancel')}
            </button>
            <button type="button"
              type="submit"
              className="flex-1 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
            >
              {tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}