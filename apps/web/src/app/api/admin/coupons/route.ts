export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { createAuditLog } from '@opencms/core';

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const coupons = await prisma.coupon.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
    });

    const serialized = coupons.map(c => ({
      ...c,
      amount: Number(c.amount),
      minSpend: c.minSpend ? Number(c.minSpend) : null,
      maxSpend: c.maxSpend ? Number(c.maxSpend) : null,
    }));

    return apiSuccess(serialized);
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_products', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage coupons', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const body = await req.json();
    const {
      code,
      type,
      amount,
      expiryDate,
      usageLimit,
      minSpend,
      maxSpend,
      individualUse,
      excludeSaleItems,
    } = body;

    if (!code || !amount) {
      return apiError('BAD_REQUEST', 'Coupon code and discount amount are required', null, 400);
    }

    const cleanCode = code.toUpperCase().trim();

    // Check for existing coupon
    const existing = await prisma.coupon.findFirst({
      where: { workspaceId: workspace.id, code: cleanCode },
    });

    if (existing) {
      return apiError('DUPLICATE_CODE', 'A coupon with this code already exists', null, 400);
    }

    const coupon = await prisma.coupon.create({
      data: {
        workspaceId: workspace.id,
        code: cleanCode,
        type: type || 'PERCENTAGE',
        amount: Number(amount),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        minSpend: minSpend ? Number(minSpend) : null,
        maxSpend: maxSpend ? Number(maxSpend) : null,
        individualUse: !!individualUse,
        excludeSaleItems: !!excludeSaleItems,
      },
    });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'coupon.created',
      entityType: 'Coupon',
      entityId: coupon.id,
      details: { code: cleanCode, amount, type },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess({
      ...coupon,
      amount: Number(coupon.amount),
    }, 'Coupon created successfully', 201);
  } catch (error: any) {
    console.error('Coupon creation error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
