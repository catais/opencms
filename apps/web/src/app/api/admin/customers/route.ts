export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, getActiveWorkspace } from '../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';

    const customers = await prisma.customer.findMany({
      where: {
        workspaceId: workspace.id,
        OR: search ? [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ] : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        addresses: true,
        orders: {
          select: { id: true, number: true, total: true, status: true, createdAt: true }
        }
      }
    });

    const serialized = customers.map(c => ({
      ...c,
      totalSpent: Number(c.totalSpent),
      orders: c.orders.map(o => ({
        ...o,
        total: Number(o.total)
      }))
    }));

    return apiSuccess(serialized);
  } catch (error: any) {
    console.error('Customers API error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
