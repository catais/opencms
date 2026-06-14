import React from 'react';
import { prisma } from '@opencms/database';
import StorefrontLayout from '../../components/StorefrontLayout';
import CatalogClient from './CatalogClient';

export const revalidate = 0; // Disable caching for live catalog updates

export default async function ShopCatalog() {
  // Query all active products from SQLite database
  const products = await prisma.product.findMany({
    include: {
      featuredImage: {
        select: { url: true, altText: true },
      },
      categories: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Query categories to allow filtering
  const categories = await prisma.productCategory.findMany({
    select: { id: true, name: true, slug: true },
  });

  // Serialize Decimal objects to standard numbers for Next.js hydration safety
  const serializedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    sku: p.sku,
    price: Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    stockStatus: p.stockStatus,
    stockQuantity: p.stockQuantity,
    manageStock: p.manageStock,
    imageUrl: p.featuredImage?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    categoryName: p.categories[0]?.name || 'Uncategorized',
  }));

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-8">
        {/* Banner/Hero Title */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h1 className="text-3xl font-black tracking-tight dark:text-white">Storefront Catalog</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explore our curated collections of premium developer merchandise, apparel, hardware modules, and digital SaaS license products.
          </p>
        </div>

        {/* Client Interactive Filter & Grid Layer */}
        <CatalogClient initialProducts={serializedProducts} categories={categories} />
      </div>
    </StorefrontLayout>
  );
}
