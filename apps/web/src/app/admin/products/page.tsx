'use client';

import React, { useState, useEffect } from 'react';

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductTag {
  id: string;
  name: string;
  slug: string;
}

interface ProductModel {
  id: string;
  type: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number | null;
  stockQuantity?: number | null;
  manageStock: boolean;
  stockStatus: string;
  featuredImage?: { id: string; url: string } | null;
  categories: ProductCategory[];
  tags: ProductTag[];
  createdAt: string;
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [tags, setProductTags] = useState<ProductTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Editor Drawer
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'inventory' | 'taxonomies'>('general');
  const [editId, setEditId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [type, setType] = useState('SIMPLE');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [salePrice, setSalePrice] = useState('');
  const [manageStock, setManageStock] = useState(false);
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockStatus, setStockStatus] = useState('IN_STOCK');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchTaxonomies();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/products?limit=100&_t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxonomies = async () => {
    try {
      const res = await fetch(`/api/admin/products/taxonomies?_t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setCategories(json.data.categories || []);
        setProductTags(json.data.tags || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNew = () => {
    setEditId(null);
    setName('');
    setSlug('');
    setSku('');
    setType('SIMPLE');
    setDescription('');
    setShortDescription('');
    setPrice('0');
    setSalePrice('');
    setManageStock(false);
    setStockQuantity('');
    setStockStatus('IN_STOCK');
    setSelectedCategories([]);
    setSelectedTags([]);
    setIsEditorOpen(true);
    setActiveTab('general');
  };

  const handleEdit = (prod: ProductModel) => {
    setEditId(prod.id);
    setName(prod.name);
    setSlug(prod.slug);
    setSku(prod.sku);
    setType(prod.type);
    setDescription(prod.description);
    setShortDescription(prod.shortDescription || '');
    setPrice(prod.price.toString());
    setSalePrice(prod.salePrice ? prod.salePrice.toString() : '');
    setManageStock(prod.manageStock);
    setStockQuantity(prod.stockQuantity ? prod.stockQuantity.toString() : '');
    setStockStatus(prod.stockStatus);
    setSelectedCategories(prod.categories.map(c => c.id));
    setSelectedTags(prod.tags.map(t => t.id));
    setIsEditorOpen(true);
    setActiveTab('general');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryToggle = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sku,
      type,
      description,
      shortDescription,
      price: parseFloat(price) || 0,
      salePrice: salePrice ? parseFloat(salePrice) : undefined,
      manageStock,
      stockQuantity: manageStock && stockQuantity ? parseInt(stockQuantity) : undefined,
      stockStatus,
      categoryIds: selectedCategories,
      tagIds: selectedTags,
    };

    try {
      const url = editId ? `/api/admin/products/${editId}` : '/api/admin/products';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setIsEditorOpen(false);
        fetchProducts();
      } else {
        setError(json.message || 'Validation error. Check if SKU is unique.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight dark:text-white">Commerce Product Catalog</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure dynamic simple and variable WooCommerce inventories, attribute classes, pricing structures.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
        >
          <i className="ri-add-line text-sm"></i> Add Product
        </button>
      </div>

      {/* Catalog Grid/List */}
      {!isEditorOpen && (
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Filter bars */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 border px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 w-full max-w-md">
              <i className="ri-search-2-line text-slate-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search WooCommerce catalog by name, sku, or slug..."
                className="bg-transparent text-xs w-full focus:outline-none text-slate-600 dark:text-slate-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="text-xxs font-bold text-slate-400 whitespace-nowrap">{filteredProducts.length} Items Listed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Product details</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Inventory</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
                          <img src={p.featuredImage?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=80'} alt={p.name} className="object-cover h-full w-full" />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-100 block">{p.name}</span>
                          <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block mt-0.5">{p.type} PRODUCT</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-500 dark:text-slate-400 text-xxs">{p.sku}</td>
                    <td className="p-4">
                      {p.salePrice ? (
                        <div className="flex gap-1.5 items-baseline">
                          <span className="font-extrabold text-slate-800 dark:text-white">${p.salePrice.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 line-through">${p.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="font-extrabold text-slate-800 dark:text-white">${p.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-semibold">
                      {p.manageStock ? `${p.stockQuantity} in stock` : 'Unlimited'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.stockStatus === 'IN_STOCK'
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        {p.stockStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(p)}
                          className="h-8 w-8 rounded-lg border hover:bg-blue-50 dark:hover:bg-blue-950/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center justify-center transition-colors border-slate-200 dark:border-slate-800"
                        >
                          <i className="ri-pencil-line"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="h-8 w-8 rounded-lg border hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 dark:text-slate-300 hover:text-red-600 flex items-center justify-center transition-colors border-slate-200 dark:border-slate-800"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {loading ? 'Decrypting products...' : 'No products loaded in WooCommerce database.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Editor Form Drawer Panel */}
      {isEditorOpen && (
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-[78vh]">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500"
              >
                <i className="ri-arrow-left-line"></i>
              </button>
              <h2 className="text-sm font-bold dark:text-white">
                {editId ? `Configure Product: ${name}` : 'Create WooCommerce Product'}
              </h2>
            </div>

            {/* Tab controls */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`px-3 py-1.5 text-3xs font-extrabold rounded-md uppercase tracking-wider transition-all ${
                  activeTab === 'general' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'
                }`}
              >
                General Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1.5 text-3xs font-extrabold rounded-md uppercase tracking-wider transition-all ${
                  activeTab === 'inventory' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'
                }`}
              >
                Pricing & Stock
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('taxonomies')}
                className={`px-3 py-1.5 text-3xs font-extrabold rounded-md uppercase tracking-wider transition-all ${
                  activeTab === 'taxonomies' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'
                }`}
              >
                Categories & Media
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xxs text-red-600 dark:text-red-400 flex items-center gap-2">
                <i className="ri-error-warning-line text-sm"></i>
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: General Details */}
            {activeTab === 'general' && (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Product Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ergonomic Office Swivel Chair"
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Inventory SKU Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FURN-CHAIR-001"
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white font-mono"
                      value={sku}
                      onChange={e => setSku(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Product URL Slug</label>
                    <div className="flex border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 overflow-hidden items-center text-xs">
                      <span className="bg-slate-100 dark:bg-slate-900 px-3 py-2.5 border-r dark:border-slate-700 text-slate-400 text-xxs font-semibold">/product/</span>
                      <input
                        type="text"
                        placeholder="ergonomic-office-chair"
                        className="w-full bg-transparent px-3 py-1 focus:outline-none text-slate-800 dark:text-white font-mono"
                        value={slug}
                        onChange={e => setSlug(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Product Class Type</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-700 dark:text-white"
                      value={type}
                      onChange={e => setType(e.target.value)}
                    >
                      <option value="SIMPLE">Simple Product</option>
                      <option value="VARIABLE">Variable Product</option>
                      <option value="DOWNLOADABLE">Digital Download</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Short Card Excerpt Summary</label>
                  <input
                    type="text"
                    placeholder="Enter short engaging summary for listings search grids"
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                    value={shortDescription}
                    onChange={e => setShortDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-1 flex-1 flex flex-col min-h-[150px]">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Product Detailed Description</label>
                  <textarea
                    required
                    placeholder="Provide extensive marketing specifications and overview detail..."
                    className="w-full flex-1 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white font-sans resize-none leading-relaxed"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Pricing & Stock */}
            {activeTab === 'inventory' && (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Regular Base Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="99.99"
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white font-mono"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Sale Discounted Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="84.99 (Leave blank if no discount)"
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white font-mono"
                      value={salePrice}
                      onChange={e => setSalePrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-500 block">Inventory Management</span>
                  
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-blue-600"
                      checked={manageStock}
                      onChange={() => setManageStock(!manageStock)}
                    />
                    <span>Enable stock management at product level</span>
                  </label>

                  {manageStock ? (
                    <div className="space-y-1 pt-2 animate-fade-in">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current Stock Quantity</label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white font-mono"
                        value={stockQuantity}
                        onChange={e => setStockQuantity(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1 pt-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Stock Status State</label>
                      <select
                        className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-700 dark:text-white"
                        value={stockStatus}
                        onChange={e => setStockStatus(e.target.value)}
                      >
                        <option value="IN_STOCK">In Stock</option>
                        <option value="OUT_OF_STOCK">Out of Stock</option>
                        <option value="ON_BACKORDER">On Backorder</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Categories & Media */}
            {activeTab === 'taxonomies' && (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ProductCategory list checkboxes */}
                  <div className="border dark:border-slate-800 rounded-xl p-4 bg-slate-50/40 dark:bg-slate-950/20 space-y-3">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-500 block">Product Categories</span>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {categories.map(c => (
                        <label key={c.id} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded text-blue-600"
                            checked={selectedCategories.includes(c.id)}
                            onChange={() => handleCategoryToggle(c.id)}
                          />
                          <span>{c.name}</span>
                        </label>
                      ))}
                      {categories.length === 0 && <span className="text-3xs text-slate-400 block italic">No categories loaded.</span>}
                    </div>
                  </div>

                  {/* ProductTag checkboxes */}
                  <div className="border dark:border-slate-800 rounded-xl p-4 bg-slate-50/40 dark:bg-slate-950/20 space-y-3">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-500 block">Product Tags</span>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {tags.map(t => (
                        <label key={t.id} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded text-blue-600"
                            checked={selectedTags.includes(t.id)}
                            onChange={() => handleTagToggle(t.id)}
                          />
                          <span>{t.name}</span>
                        </label>
                      ))}
                      {tags.length === 0 && <span className="text-3xs text-slate-400 block italic">No tags loaded.</span>}
                    </div>
                  </div>
                </div>

                <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-500 block">Product Core Media Assets</span>
                  <p className="text-[10px] text-slate-400">Reference Unsplash premium links or copy local paths from your Media Gallery library directly.</p>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 overflow-hidden flex items-center justify-center text-slate-400">
                      <i className="ri-image-2-line text-xl"></i>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Local path reference key</span>
                      <input
                        type="text"
                        disabled
                        placeholder="/media/opencms-premium-hoodie.jpg (Automatically maps featured asset)"
                        className="w-full bg-slate-100 dark:bg-slate-850 border dark:border-slate-800 px-3 py-2 rounded-lg text-xxs text-slate-400 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions Row */}
            <div className="border-t dark:border-slate-800 pt-4 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2.5 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10 flex items-center gap-1"
              >
                {saving ? 'Saving...' : editId ? 'Save Configuration' : 'Create Product'}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}
