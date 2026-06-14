'use client';

import React, { useState, useEffect } from 'react';
import { useStorefrontTheme } from '../../../components/StorefrontLayout';

interface Attribute {
  id: string;
  name: string;
  isVariation: boolean;
  values: string[];
}

interface Variation {
  id: string;
  sku: string;
  price: number;
  salePrice: number | null;
  stockStatus: string;
  stockQuantity: number | null;
  attributes: Record<string, string>;
  imageUrl: string | null;
}

interface Product {
  id: string;
  type: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  sku: string;
  price: number;
  salePrice: number | null;
  stockStatus: string;
  stockQuantity: number | null;
  manageStock: boolean;
  imageUrl: string;
  gallery: string[];
  categoryName: string;
  attributes: Attribute[];
  variations: Variation[];
}

interface Props {
  product: Product;
}

export default function ProductDetailClient({ product }: Props) {
  // Theme styling context
  const { activeThemeSlug } = useStorefrontTheme();
  const isRetro = activeThemeSlug === 'retro-coffee';
  const isMidnight = activeThemeSlug === 'dark-midnight';

  // Gallery viewing state
  const [mainImage, setMainImage] = useState(product.imageUrl);

  // Selected variation parameters state
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [activeVariation, setActiveVariation] = useState<Variation | null>(null);

  // Initialize selected attributes with first available value for each variation attribute
  useEffect(() => {
    const variationAttrs = product.attributes.filter(a => a.isVariation);
    if (variationAttrs.length > 0) {
      const initial: Record<string, string> = {};
      variationAttrs.forEach(a => {
        if (a.values.length > 0) {
          initial[a.name] = a.values[0];
        }
      });
      setSelectedAttributes(initial);
    }
  }, [product.attributes]);

  // Track active variation when selected attributes change
  useEffect(() => {
    if (product.variations.length === 0) {
      setActiveVariation(null);
      return;
    }

    const match = product.variations.find(v => {
      return Object.entries(selectedAttributes).every(([key, value]) => {
        return v.attributes[key] === value;
      });
    });

    if (match) {
      setActiveVariation(match);
      if (match.imageUrl) {
        setMainImage(match.imageUrl);
      }
    } else {
      setActiveVariation(null);
    }
  }, [selectedAttributes, product.variations]);

  const handleAttributeSelect = (name: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddToCart = () => {
    try {
      const currentCart = JSON.parse(localStorage.getItem('opencms_cart') || '[]');
      
      const targetId = activeVariation ? activeVariation.id : product.id;
      const targetSku = activeVariation ? activeVariation.sku : product.sku;
      const targetPrice = activeVariation ? activeVariation.price : product.price;
      const targetSalePrice = activeVariation ? activeVariation.salePrice : product.salePrice;
      const targetName = activeVariation
        ? `${product.name} (${Object.values(selectedAttributes).join(', ')})`
        : product.name;

      const existing = currentCart.find((item: any) => item.id === targetId);

      if (existing) {
        existing.quantity += 1;
      } else {
        currentCart.push({
          id: targetId,
          name: targetName,
          slug: product.slug,
          sku: targetSku,
          price: targetPrice,
          salePrice: targetSalePrice,
          imageUrl: mainImage,
          quantity: 1,
          variationId: activeVariation ? activeVariation.id : null,
          productId: product.id,
        });
      }

      localStorage.setItem('opencms_cart', JSON.stringify(currentCart));
      window.dispatchEvent(new Event('opencms_cart_updated'));
      alert(`Success! "${targetName}" has been added to your shopping cart.`);
    } catch (e) {
      console.error(e);
    }
  };

  // Pricing definitions
  const hasSale = activeVariation ? activeVariation.salePrice !== null : product.salePrice !== null;
  const originalPrice = activeVariation ? activeVariation.price : product.price;
  const salePrice = activeVariation ? activeVariation.salePrice : product.salePrice;
  const sku = activeVariation ? activeVariation.sku : product.sku;
  const stockStatus = activeVariation ? activeVariation.stockStatus : product.stockStatus;
  const stockQuantity = activeVariation ? activeVariation.stockQuantity : product.stockQuantity;

  const isOutOfStock = stockStatus === 'OUT_OF_STOCK';

  // Build full gallery (featured + subimages)
  const fullGallery = [product.imageUrl, ...product.gallery];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      
      {/* 1. Left Column: Image Gallery Frame */}
      <div className="lg:col-span-6 space-y-4">
        <div className={`h-[400px] md:h-[500px] overflow-hidden relative transition-all duration-300 ${
          isRetro
            ? 'border-3 border-[#451A03] rounded-none bg-[#FFFDF5] shadow-[6px_6px_0px_0px_#451A03]'
            : isMidnight
            ? 'border border-indigo-500/20 rounded-xl bg-[#0E1322] shadow-[0_0_20px_rgba(99,102,241,0.08)]'
            : 'border border-slate-200/50 dark:border-slate-800/50 rounded-3xl bg-white dark:bg-slate-900 shadow-sm'
        }`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {isOutOfStock && (
            <span className={`absolute top-4 left-4 text-xxs font-extrabold uppercase px-3 py-1 shadow-md ${
              isRetro
                ? 'bg-[#451A03] border border-[#FEF3C7] text-white rounded-none font-serif'
                : isMidnight
                ? 'bg-red-950/80 border border-red-500/40 text-red-200 font-mono shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                : 'bg-red-600 text-white rounded-full'
            }`}>
              Out of stock
            </span>
          )}
        </div>

        {/* Thumbnail Carousels */}
        {fullGallery.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {fullGallery.map((img, idx) => {
              const isActive = mainImage === img;
              return (
                <button
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={`h-16 w-16 overflow-hidden shrink-0 transition-all ${
                    isRetro
                      ? `rounded-none border-3 ${isActive ? 'border-[#B45309] scale-[1.03]' : 'border-[#451A03] opacity-70 hover:opacity-100 bg-[#FEF3C7]'}`
                      : isMidnight
                      ? `rounded border-2 ${isActive ? 'border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)] scale-[1.03]' : 'border-indigo-500/10 opacity-70 hover:opacity-100 bg-[#0E1322]'}`
                      : `rounded-xl border-2 ${isActive ? 'border-blue-600 scale-[1.03]' : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'}`
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`Thumbnail ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Right Column: Attributes & Detail Fields */}
      <div className="lg:col-span-6 space-y-6">
        
        {/* Breadcrumb / Category */}
        <div className="space-y-2">
          <span className={`${
            isRetro
              ? 'text-xs uppercase tracking-widest font-bold text-[#B45309] font-serif'
              : isMidnight
              ? 'text-xxs uppercase tracking-wider font-mono text-indigo-400'
              : 'text-xxs uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400'
          }`}>
            {product.categoryName}
          </span>
          <h1 className={`leading-none ${
            isRetro
              ? 'text-3xl sm:text-4xl font-extrabold text-[#451A03] font-serif leading-tight'
              : isMidnight
              ? 'text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-indigo-200 font-mono'
              : 'text-2xl sm:text-3xl font-black text-slate-800 dark:text-white'
          }`}>
            {product.name}
          </h1>
          <div className={`flex items-center gap-4 text-xxs pt-1 ${
            isRetro ? 'text-xs text-[#451A03]/70 font-serif italic' : isMidnight ? 'text-indigo-400/60 font-mono' : 'text-slate-400 font-mono'
          }`}>
            <span>SKU: {sku}</span>
            <span>•</span>
            <span className={`font-bold uppercase ${isOutOfStock ? 'text-red-500' : 'text-green-500'}`}>
              {isOutOfStock ? 'Out of stock' : stockQuantity ? `${stockQuantity} In Stock` : 'In Stock'}
            </span>
          </div>
        </div>

        {/* Short Description */}
        <div className={isRetro ? 'bg-[#FFFDF5] p-4 border-l-4 border-[#451A03]' : ''}>
          <p className={`leading-relaxed italic ${
            isRetro 
              ? 'text-sm text-[#451A03]/90 font-serif' 
              : isMidnight 
              ? 'text-xs text-slate-400 font-mono' 
              : 'text-xs text-slate-500 dark:text-slate-400'
          }`}>
            {product.shortDescription || 'No quick description provided.'}
          </p>
        </div>

        {/* Price Tag Box */}
        <div className={`flex items-center justify-between ${
          isRetro
            ? 'p-4 bg-[#FFFDF5] border-3 border-[#451A03] rounded-none shadow-[4px_4px_0px_0px_#451A03] font-serif'
            : isMidnight
            ? 'p-4 bg-[#0E1322] border border-indigo-500/10 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.03)] font-mono'
            : 'p-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl'
        }`}>
          <span className={`uppercase tracking-wider font-extrabold ${
            isRetro
              ? 'text-xs text-[#451A03]'
              : isMidnight
              ? 'text-xxs text-indigo-400/60'
              : 'text-xxs text-slate-400'
          }`}>Price Structure</span>
          <div>
            {hasSale ? (
              <div className="flex items-baseline gap-2">
                <span className={`line-through ${
                  isRetro 
                    ? 'text-xs text-[#451A03]/60 font-serif' 
                    : isMidnight 
                    ? 'text-xxs text-indigo-400/40 font-mono' 
                    : 'text-xs text-slate-400'
                }`}>${originalPrice.toFixed(2)}</span>
                <span className={`font-black ${
                  isRetro 
                    ? 'text-2xl text-[#B45309] font-serif' 
                    : isMidnight 
                    ? 'text-xl text-indigo-300 font-mono' 
                    : 'text-2xl text-blue-600 dark:text-blue-400'
                }`}>${salePrice?.toFixed(2)}</span>
              </div>
            ) : (
              <span className={`font-black ${
                isRetro 
                  ? 'text-2xl text-[#451A03] font-serif' 
                  : isMidnight 
                  ? 'text-xl text-slate-200 font-mono' 
                  : 'text-2xl text-slate-800 dark:text-white'
              }`}>${originalPrice.toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Attributes Variable Selectors */}
        {product.attributes.filter(a => a.isVariation).map(attr => (
          <div key={attr.id} className="space-y-2.5">
            <span className={`uppercase tracking-wider font-bold block ${
              isRetro
                ? 'text-xs text-[#451A03] font-serif font-extrabold'
                : isMidnight
                ? 'text-xxs text-indigo-400 font-mono'
                : 'text-xxs text-slate-400'
            }`}>{attr.name}</span>
            <div className="flex flex-wrap gap-2.5">
              {attr.values.map(val => {
                const isSelected = selectedAttributes[attr.name] === val;
                return (
                  <button
                    key={val}
                    onClick={() => handleAttributeSelect(attr.name, val)}
                    className={`transition-all duration-150 select-none ${
                      isRetro
                        ? `px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider border-2 border-[#451A03] font-serif ${
                            isSelected
                              ? 'bg-[#B45309] text-[#FEF3C7]'
                              : 'bg-[#FEF3C7] text-[#451A03] hover:bg-[#FFFDF5] shadow-[2px_2px_0px_0px_#451A03] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                          }`
                        : isMidnight
                        ? `px-3.5 py-1.5 rounded text-xxs font-mono uppercase tracking-wider ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-indigo-400'
                              : 'bg-[#0E1322] text-slate-300 border border-indigo-500/20 hover:border-indigo-500/40'
                          }`
                        : `px-3.5 py-2 rounded-xl text-xxs font-bold tracking-tight border ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Actions Button */}
        <div className="pt-4 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex-1 font-bold text-xs transition-all flex items-center justify-center gap-2 select-none ${
              isOutOfStock
                ? isRetro
                  ? 'bg-[#FEF3C7] text-[#451A03]/40 border-3 border-[#451A03]/40 cursor-not-allowed py-4 text-center font-serif text-sm uppercase tracking-wider'
                  : isMidnight
                  ? 'bg-[#0E1322] text-slate-600 border border-slate-800 cursor-not-allowed py-3.5 font-semibold font-mono tracking-wider'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed py-3.5 rounded-xl'
                : isRetro
                ? 'theme-btn py-4 text-center text-sm font-bold uppercase tracking-wider font-serif shadow-[4px_4px_0px_0px_#451A03]'
                : isMidnight
                ? 'theme-btn py-3.5 font-semibold font-mono tracking-wider'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 active:scale-[0.98] py-3.5 rounded-xl shadow-md'
            }`}
          >
            <i className="ri-shopping-cart-2-line text-sm"></i>
            {isOutOfStock ? 'Out Of Stock' : 'Add Selected to Cart'}
          </button>
        </div>

        {/* Detailed Long Description */}
        <div className={`border-t pt-6 space-y-3 ${
          isRetro
            ? 'border-t-3 border-[#451A03] font-serif text-[#451A03]'
            : isMidnight
            ? 'border-t border-indigo-500/10 font-mono'
            : 'border-slate-200 dark:border-slate-800/80'
        }`}>
          <h3 className={`uppercase tracking-wider font-black ${
            isRetro
              ? 'text-sm text-[#451A03] font-extrabold'
              : isMidnight
              ? 'text-xs text-indigo-400 font-bold'
              : 'text-xs text-slate-700 dark:text-slate-300'
          }`}>Detailed Description</h3>
          <div className={`text-xs leading-relaxed space-y-4 whitespace-pre-wrap ${
            isRetro
              ? 'text-sm text-[#451A03]'
              : isMidnight
              ? 'text-xs text-slate-300 font-mono'
              : 'text-slate-600 dark:text-slate-400'
          }`}>
            {product.description}
          </div>
        </div>

      </div>
    </div>
  );
}
