'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStorefrontTheme } from '../../components/StorefrontLayout';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: number;
  salePrice: number | null;
  stockStatus: string;
  stockQuantity: number | null;
  manageStock: boolean;
  imageUrl: string;
  categoryName: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  initialProducts: ProductItem[];
  categories: Category[];
}

export default function CatalogClient({ initialProducts, categories }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { activeThemeSlug } = useStorefrontTheme();

  const filteredProducts = initialProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase()) ||
                          p.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                            p.categoryName.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: ProductItem) => {
    try {
      const currentCart = JSON.parse(localStorage.getItem('opencms_cart') || '[]');
      const existing = currentCart.find((item: any) => item.id === product.id);
      
      if (existing) {
        existing.quantity += 1;
      } else {
        currentCart.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          salePrice: product.salePrice,
          imageUrl: product.imageUrl,
          quantity: 1,
        });
      }
      
      localStorage.setItem('opencms_cart', JSON.stringify(currentCart));
      // Fire update event for header sync
      window.dispatchEvent(new Event('opencms_cart_updated'));
      alert(`Success! "${product.name}" added to shopping cart.`);
    } catch (e) {
      console.error('Cart saving error:', e);
    }
  };

  // Theme styling configurations
  const isRetro = activeThemeSlug === 'retro-coffee';
  const isMidnight = activeThemeSlug === 'dark-midnight';

  return (
    <div className="space-y-8">
      {/* 1. Filtering Controls Row */}
      <div className={`flex flex-col md:flex-row gap-6 justify-between items-center w-full transition-all duration-300 ${
        isRetro 
          ? 'bg-[#FFFDF5] p-5 border-3 border-[#451A03] shadow-[5px_5px_0px_0px_#451A03]' 
          : isMidnight
          ? 'bg-[#0E1322] p-5 border border-indigo-500/20 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.05)]'
          : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm'
      }`}>
        
        {/* Category select tags */}
        <div className="flex gap-2.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`transition-all duration-150 shrink-0 select-none ${
              isRetro
                ? `px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-[#451A03] font-serif ${
                    selectedCategory === 'all'
                      ? 'bg-[#B45309] text-[#FEF3C7]'
                      : 'bg-[#FEF3C7] text-[#451A03] hover:bg-[#FFFDF5] shadow-[2px_2px_0px_0px_#451A03] hover:translate-y-[-1px] hover:translate-x-[-1px] hover:shadow-[3px_3px_0px_0px_#451A03] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none'
                  }`
                : isMidnight
                ? `px-3 py-1.5 rounded text-xxs font-mono uppercase tracking-wider ${
                    selectedCategory === 'all'
                      ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-indigo-400'
                      : 'bg-[#0E1322] text-slate-300 border border-indigo-500/20 hover:border-indigo-500/50 hover:text-white'
                  }`
                : `px-3 py-1.5 rounded-lg text-xxs font-bold tracking-tight ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`
            }`}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`transition-all duration-150 shrink-0 select-none ${
                isRetro
                  ? `px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-[#451A03] font-serif ${
                      selectedCategory === cat.name
                        ? 'bg-[#B45309] text-[#FEF3C7]'
                        : 'bg-[#FEF3C7] text-[#451A03] hover:bg-[#FFFDF5] shadow-[2px_2px_0px_0px_#451A03] hover:translate-y-[-1px] hover:translate-x-[-1px] hover:shadow-[3px_3px_0px_0px_#451A03] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none'
                    }`
                  : isMidnight
                  ? `px-3 py-1.5 rounded text-xxs font-mono uppercase tracking-wider ${
                      selectedCategory === cat.name
                        ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-indigo-400'
                        : 'bg-[#0E1322] text-slate-300 border border-indigo-500/20 hover:border-indigo-500/50 hover:text-white'
                    }`
                  : `px-3 py-1.5 rounded-lg text-xxs font-bold tracking-tight ${
                      selectedCategory === cat.name
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search bar input node */}
        <div className={`flex items-center gap-2.5 px-3.5 py-1.5 w-full md:w-72 transition-all ${
          isRetro
            ? 'border-2 border-[#451A03] rounded-none bg-[#FFFDF5] text-[#451A03] font-serif'
            : isMidnight
            ? 'border border-indigo-500/20 rounded bg-[#05070B] text-slate-200 font-mono text-xs focus-within:border-indigo-500/50 focus-within:shadow-[0_0_12px_rgba(99,102,241,0.15)]'
            : 'border px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 dark:border-slate-800 focus-within:ring-2 focus-within:ring-blue-500/10'
        }`}>
          <i className={`ri-search-line ${isRetro ? 'text-[#451A03]' : isMidnight ? 'text-indigo-400' : 'text-slate-400'}`}></i>
          <input
            type="text"
            placeholder={isRetro ? "Search vintage goods..." : isMidnight ? "shell_query_products..." : "Search catalog products..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`bg-transparent text-xs w-full focus:outline-none ${
              isRetro 
                ? 'text-[#451A03] placeholder-[#451A03]/50' 
                : isMidnight 
                ? 'text-indigo-200 placeholder-indigo-500/30' 
                : 'text-slate-700 dark:text-slate-200 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* 2. Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className={`p-16 text-center space-y-4 ${
          isRetro
            ? 'border-3 border-dashed border-[#451A03] bg-[#FEF3C7]/40 text-[#451A03] font-serif'
            : isMidnight
            ? 'border border-dashed border-indigo-500/20 rounded-xl bg-[#0E1322]/40 text-indigo-400 font-mono'
            : 'border rounded-2xl bg-white/40 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400'
        }`}>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto ${
            isRetro 
              ? 'bg-[#FEF3C7] border-2 border-[#451A03] text-[#451A03]' 
              : isMidnight 
              ? 'bg-[#0E1322] border border-indigo-500/30 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <i className="ri-shopping-bag-line text-lg"></i>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider">No products matched filters</p>
            <p className="text-xxs opacity-70">Try clearing your search query or choosing another taxonomy group.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const hasSale = product.salePrice !== null;
            const displayPrice = hasSale ? product.salePrice : product.price;
            const isOutOfStock = product.stockStatus === 'OUT_OF_STOCK';

            return (
              <div
                key={product.id}
                className="theme-card flex flex-col overflow-hidden group"
              >
                {/* Image Frame */}
                <div className={`h-48 relative overflow-hidden shrink-0 ${
                  isRetro
                    ? 'bg-[#FEF3C7] border-b-3 border-[#451A03]'
                    : isMidnight
                    ? 'bg-[#05070B] border-b border-indigo-500/10'
                    : 'bg-slate-100 dark:bg-slate-950 border-b dark:border-slate-800'
                }`}>
                  <Link href={`/products/${product.slug}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Stock status badge */}
                  {isOutOfStock ? (
                    <span className={`absolute top-3 left-3 text-[9px] font-bold uppercase px-2 py-0.5 ${
                      isRetro
                        ? 'bg-[#451A03] border border-[#FEF3C7] text-white rounded-none font-serif'
                        : isMidnight
                        ? 'bg-red-950/80 border border-red-500/40 text-red-200 font-mono shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                        : 'bg-red-600 text-white font-extrabold rounded-full'
                    }`}>
                      Out of stock
                    </span>
                  ) : hasSale ? (
                    <span className={`absolute top-3 left-3 text-[9px] font-extrabold uppercase px-2 py-0.5 ${
                      isRetro
                        ? 'bg-[#B45309] border-2 border-[#451A03] text-[#FEF3C7] rounded-none font-serif'
                        : isMidnight
                        ? 'bg-indigo-600 text-white font-mono rounded shadow-[0_0_10px_#6366F1]'
                        : 'bg-blue-600 text-white rounded-full'
                    }`}>
                      On Sale
                    </span>
                  ) : null}

                  <span className={`absolute bottom-3 right-3 text-[9px] font-bold px-2 py-0.5 ${
                    isRetro
                      ? 'bg-[#FEF3C7] border-2 border-[#451A03] text-[#451A03] rounded-none font-serif'
                      : isMidnight
                      ? 'bg-[#0E1322]/90 border border-indigo-500/30 text-indigo-300 font-mono rounded'
                      : 'bg-slate-950/70 backdrop-blur-sm text-white rounded-md'
                  }`}>
                    {product.categoryName}
                  </span>
                </div>

                {/* Info block */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <Link
                      href={`/products/${product.slug}`}
                      className={`block line-clamp-2 transition-colors ${
                        isRetro
                          ? 'text-sm font-black text-[#451A03] hover:underline font-serif'
                          : isMidnight
                          ? 'text-xs font-bold text-slate-100 hover:text-indigo-400 font-mono'
                          : 'text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      {product.name}
                    </Link>
                    <p className={`text-[9px] font-mono uppercase ${
                      isRetro ? 'text-[#451A03]/50 font-serif italic' : isMidnight ? 'text-indigo-400/50' : 'text-slate-400'
                    }`}>
                      SKU: {product.sku}
                    </p>
                    <p className={`line-clamp-2 leading-relaxed ${
                      isRetro 
                        ? 'text-xxs text-[#451A03]/80 font-serif' 
                        : isMidnight 
                        ? 'text-[10px] text-slate-400 font-mono' 
                        : 'text-xxs text-slate-500 dark:text-slate-400'
                    }`}>
                      {product.description}
                    </p>
                  </div>

                  {/* Pricing and Action row */}
                  <div className={`flex items-center justify-between pt-3 border-t shrink-0 ${
                    isRetro
                      ? 'border-[#451A03]'
                      : isMidnight
                      ? 'border-indigo-500/10'
                      : 'border-slate-100 dark:border-slate-800/80'
                  }`}>
                    <div>
                      {hasSale ? (
                        <div className={`flex ${isRetro ? 'flex-col gap-0.5' : 'items-center gap-1.5'}`}>
                          <span className={`line-through ${
                            isRetro 
                              ? 'text-xxs text-[#451A03]/50 font-serif' 
                              : isMidnight 
                              ? 'text-[10px] text-indigo-400/40 font-mono' 
                              : 'text-xxs text-slate-400'
                          }`}>
                            ${product.price.toFixed(2)}
                          </span>
                          <span className={`font-black ${
                            isRetro 
                              ? 'text-sm text-[#B45309] font-serif' 
                              : isMidnight 
                              ? 'text-xs text-indigo-300 font-mono' 
                              : 'text-xs text-blue-600 dark:text-blue-400'
                          }`}>
                            ${product.salePrice?.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className={`font-black ${
                          isRetro 
                            ? 'text-sm text-[#451A03] font-serif' 
                            : isMidnight 
                            ? 'text-xs text-slate-200 font-mono' 
                            : 'text-xs text-slate-800 dark:text-slate-100'
                        }`}>
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(product)}
                      className={`px-3 py-1.5 transition-all duration-150 flex items-center gap-1.5 select-none ${
                        isOutOfStock
                          ? isRetro
                            ? 'bg-[#FEF3C7] text-[#451A03]/40 border-2 border-[#451A03]/40 cursor-not-allowed text-xxs font-bold uppercase tracking-wider font-serif'
                            : isMidnight
                            ? 'bg-[#0E1322] text-slate-600 border border-slate-800 cursor-not-allowed text-xxs font-mono uppercase tracking-wider'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed rounded-lg text-xxs font-bold tracking-tight'
                          : isRetro
                          ? 'theme-btn text-xxs font-bold uppercase tracking-wider'
                          : isMidnight
                          ? 'theme-btn text-xxs font-mono uppercase tracking-wider'
                          : 'theme-btn text-xxs font-bold tracking-tight'
                      }`}
                    >
                      <i className="ri-shopping-cart-2-line"></i> Buy
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
