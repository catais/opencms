import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { ProductCreateSchema, slugify } from '@opencms/utils';
import { createAuditLog } from '@opencms/core';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  const { id } = await params;

  try {
    const product = await prisma.product.findFirst({
      where: { id, workspaceId: workspace.id },
      include: {
        featuredImage: true,
        galleryImages: { include: { media: true } },
        attributes: true,
        variations: { include: { image: true } },
        categories: true,
        tags: true,
      },
    });

    if (!product) {
      return apiError('PRODUCT_NOT_FOUND', 'Product not found', null, 404);
    }

    const serialized = {
      ...product,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      shippingWeight: product.shippingWeight ? Number(product.shippingWeight) : null,
      shippingLength: product.shippingLength ? Number(product.shippingLength) : null,
      shippingWidth: product.shippingWidth ? Number(product.shippingWidth) : null,
      shippingHeight: product.shippingHeight ? Number(product.shippingHeight) : null,
      variations: product.variations.map(v => ({
        ...v,
        price: Number(v.price),
        salePrice: v.salePrice ? Number(v.salePrice) : null,
      })),
    };

    return apiSuccess(serialized);
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_products', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage products', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  const { id } = await params;

  try {
    const product = await prisma.product.findFirst({
      where: { id, workspaceId: workspace.id },
      include: { categories: true, tags: true },
    });

    if (!product) {
      return apiError('PRODUCT_NOT_FOUND', 'Product not found', null, 404);
    }

    const body = await req.json();
    const { attributes, variations, ...rest } = body;

    const result = ProductCreateSchema.safeParse(rest);
    if (!result.success) {
      return apiError('VALIDATION_ERROR', 'Invalid product fields', result.error.format());
    }

    const data = result.data;
    const finalSlug = slugify(data.slug);

    // Validate sku excluding self
    const existingSku = await prisma.product.findFirst({
      where: {
        workspaceId: workspace.id,
        sku: data.sku,
        NOT: { id },
      },
    });
    if (existingSku) {
      return apiError('SKU_CONFLICT', 'A product with this SKU already exists', null, 409);
    }

    const existingSlug = await prisma.product.findFirst({
      where: {
        workspaceId: workspace.id,
        slug: finalSlug,
        NOT: { id },
      },
    });
    if (existingSlug) {
      return apiError('SLUG_CONFLICT', 'A product with this slug already exists', null, 409);
    }

    // 1. Update Core Product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
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
          disconnect: product.categories.map(c => ({ id: c.id })),
          connect: data.categoryIds.map(id => ({ id })),
        },
        tags: {
          disconnect: product.tags.map(t => ({ id: t.id })),
          connect: data.tagIds.map(id => ({ id })),
        },
      },
    });

    // 2. Handle Attributes if provided
    if (attributes && Array.isArray(attributes)) {
      // Delete old attributes
      await prisma.productAttribute.deleteMany({ where: { productId: id } });
      // Create new ones
      for (const attr of attributes) {
        await prisma.productAttribute.create({
          data: {
            productId: id,
            name: attr.name,
            valuesJson: JSON.stringify(attr.values),
            isVariation: attr.isVariation || false,
            isVisible: attr.isVisible !== false,
            position: attr.position || 0,
          },
        });
      }
    }

    // 3. Handle Variations if provided
    if (variations && Array.isArray(variations)) {
      await prisma.productVariation.deleteMany({ where: { productId: id } });
      for (const v of variations) {
        await prisma.productVariation.create({
          data: {
            productId: id,
            sku: v.sku,
            price: v.price,
            salePrice: v.salePrice || null,
            stockQuantity: v.stockQuantity || null,
            manageStock: v.manageStock || false,
            stockStatus: v.stockStatus || 'IN_STOCK',
            attributesJson: JSON.stringify(v.attributes),
            imageId: v.imageId || null,
          },
        });
      }
    }

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'product.updated',
      entityType: 'Product',
      entityId: id,
      details: { name: updatedProduct.name, sku: updatedProduct.sku },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(updatedProduct, 'Product updated successfully');
  } catch (error: any) {
    console.error('Product update error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_products', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage products', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  const { id } = await params;

  try {
    const product = await prisma.product.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!product) {
      return apiError('PRODUCT_NOT_FOUND', 'Product not found', null, 404);
    }

    await prisma.product.delete({ where: { id } });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'product.deleted',
      entityType: 'Product',
      entityId: id,
      details: { name: product.name, sku: product.sku },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(null, 'Product deleted successfully');
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
