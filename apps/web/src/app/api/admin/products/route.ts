export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../lib/auth';
import { apiSuccess, apiError, apiPaginated } from '@opencms/api';
import { ProductCreateSchema, slugify } from '@opencms/utils';
import { createAuditLog } from '@opencms/core';

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const total = await prisma.product.count({ where: { workspaceId: workspace.id } });
    const products = await prisma.product.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        featuredImage: { select: { id: true, url: true } },
        galleryImages: { include: { media: { select: { id: true, url: true } } } },
        attributes: true,
        variations: { include: { image: { select: { id: true, url: true } } } },
        categories: { select: { id: true, name: true } },
        tags: { select: { id: true, name: true } },
      },
    });

    // Clean Decimal serialization issues by converting to standard numbers
    const serializedProducts = products.map(prod => ({
      ...prod,
      price: Number(prod.price),
      salePrice: prod.salePrice ? Number(prod.salePrice) : null,
      shippingWeight: prod.shippingWeight ? Number(prod.shippingWeight) : null,
      shippingLength: prod.shippingLength ? Number(prod.shippingLength) : null,
      shippingWidth: prod.shippingWidth ? Number(prod.shippingWidth) : null,
      shippingHeight: prod.shippingHeight ? Number(prod.shippingHeight) : null,
      variations: prod.variations.map(v => ({
        ...v,
        price: Number(v.price),
        salePrice: v.salePrice ? Number(v.salePrice) : null,
      })),
    }));

    return apiPaginated(serializedProducts, page, limit, total);
  } catch (error: any) {
    console.error('Products fetch error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_products', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage products', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const body = await req.json();
    const result = ProductCreateSchema.safeParse(body);

    if (!result.success) {
      return apiError('VALIDATION_ERROR', 'Invalid product data', result.error.format());
    }

    const data = result.data;
    const finalSlug = slugify(data.slug);

    // Verify unique SKU & unique slug
    const existingSku = await prisma.product.findFirst({
      where: { workspaceId: workspace.id, sku: data.sku },
    });
    if (existingSku) {
      return apiError('SKU_CONFLICT', 'A product with this SKU already exists', null, 409);
    }

    const existingSlug = await prisma.product.findFirst({
      where: { workspaceId: workspace.id, slug: finalSlug },
    });
    if (existingSlug) {
      return apiError('SLUG_CONFLICT', 'A product with this slug already exists', null, 409);
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        type: data.type,
        name: data.name,
        slug: finalSlug,
        sku: data.sku,
        description: data.description,
        shortDescription: data.shortDescription || '',
        price: data.price,
        salePrice: data.salePrice || null,
        stockQuantity: data.stockQuantity || null,
        manageStock: data.manageStock,
        stockStatus: data.stockStatus,
        lowStockAmount: data.lowStockAmount || null,
        featuredImageId: data.featuredImageId || null,
        categories: {
          connect: data.categoryIds.map(id => ({ id })),
        },
        tags: {
          connect: data.tagIds.map(id => ({ id })),
        },
      },
    });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'product.created',
      entityType: 'Product',
      entityId: product.id,
      details: { name: product.name, sku: product.sku, type: product.type },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(product, 'Product created successfully', 201);
  } catch (error: any) {
    console.error('Product creation error:', error);
    return apiError('INTERNAL_ERROR', error.message || 'Error creating product', null, 500);
  }
}
