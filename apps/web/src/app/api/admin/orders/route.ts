export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../lib/auth';
import { apiSuccess, apiError, apiPaginated } from '@opencms/api';

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

    const total = await prisma.order.count({ where: { workspaceId: workspace.id } });
    const orders = await prisma.order.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
        items: true,
      },
    });

    const serialized = orders.map(o => ({
      ...o,
      total: Number(o.total),
      subtotal: Number(o.subtotal),
      taxTotal: Number(o.taxTotal),
      shippingTotal: Number(o.shippingTotal),
      discountTotal: Number(o.discountTotal),
      itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
    }));

    return apiPaginated(serialized, page, limit, total);
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
