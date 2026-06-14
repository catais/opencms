import React from 'react';
import { prisma } from '@opencms/database';
import { notFound } from 'next/navigation';
import StorefrontLayout from '../../../components/StorefrontLayout';
import ProductDetailClient from './ProductDetailClient';

export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetail({ params }: Props) {
  const { slug } = await params;

  // Retrieve product from DB with attributes, variations, gallery and featured image
  const product = await prisma.product.findFirst({
    where: { slug },
    include: {
      featuredImage: {
        select: { url: true, altText: true },
      },
      galleryImages: {
        include: { media: { select: { url: true } } },
      },
      attributes: true,
      variations: {
        include: { image: { select: { url: true } } },
      },
      categories: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Format Decimal fields to standard numbers for hydration safety
  const serializedProduct = {
    id: product.id,
    type: product.type,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    sku: product.sku,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    stockStatus: product.stockStatus,
    stockQuantity: product.stockQuantity,
    manageStock: product.manageStock,
    imageUrl: product.featuredImage?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    gallery: product.galleryImages.map(img => img.media.url),
    categoryName: product.categories[0]?.name || 'Uncategorized',
    attributes: product.attributes.map(attr => ({
      id: catClean(attr.id),
      name: attr.name,
      isVariation: attr.isVariation,
      values: JSON.parse(attr.valuesJson || '[]') as string[],
    })),
    variations: product.variations.map(v => ({
      id: v.id,
      sku: v.sku,
      price: Number(v.price),
      salePrice: v.salePrice ? Number(v.salePrice) : null,
      stockStatus: v.stockStatus,
      stockQuantity: v.stockQuantity,
      attributes: JSON.parse(v.attributesJson || '{}') as Record<string, string>,
      imageUrl: v.image?.url || null,
    })),
  };

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <ProductDetailClient product={serializedProduct} />
      </div>
    </StorefrontLayout>
  );
}

function catClean(val: string) {
  return val.replace(/[^a-zA-Z0-9-]/g, '');
}
