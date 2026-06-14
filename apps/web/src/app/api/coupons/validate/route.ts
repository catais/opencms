import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getActiveWorkspace } from '@/lib/auth';
import { apiSuccess, apiError } from '@opencms/api';

export async function POST(req: NextRequest) {
  const workspace = await getActiveWorkspace(req);
  if (!workspace) {
    return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);
  }

  try {
    const body = await req.json();
    const { code, subtotal } = body;

    if (!code) {
      return apiError('BAD_REQUEST', 'Coupon code is required', null, 400);
    }

    const cleanCode = code.toUpperCase().trim();

    // Query active coupon in the default workspace
    const coupon = await prisma.coupon.findFirst({
      where: {
        workspaceId: workspace.id,
        code: cleanCode,
      },
    });

    if (!coupon) {
      return apiError('COUPON_NOT_FOUND', 'Invalid coupon code', null, 404);
    }

    // Check expiration date
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return apiError('COUPON_EXPIRED', 'This coupon has expired', null, 400);
    }

    // Check usage limits
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return apiError('USAGE_LIMIT_EXCEEDED', 'This coupon is no longer available', null, 400);
    }

    // Check minimum spend
    if (coupon.minSpend !== null && Number(subtotal) < Number(coupon.minSpend)) {
      return apiError(
        'MIN_SPEND_NOT_MET',
        `Minimum spend of $${Number(coupon.minSpend).toFixed(2)} is required to use this coupon`,
        null,
        400
      );
    }

    // Check maximum spend
    if (coupon.maxSpend !== null && Number(subtotal) > Number(coupon.maxSpend)) {
      return apiError(
        'MAX_SPEND_EXCEEDED',
        `This coupon cannot be used for subtotals over $${Number(coupon.maxSpend).toFixed(2)}`,
        null,
        400
      );
    }

    // Return successfully with coupon calculations
    return apiSuccess({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      amount: Number(coupon.amount),
      individualUse: coupon.individualUse,
      excludeSaleItems: coupon.excludeSaleItems,
    }, 'Coupon code validated successfully');

  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return apiError('SERVER_ERROR', error.message || 'Validation failed', null, 500);
  }
}
