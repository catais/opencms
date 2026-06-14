import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getActiveWorkspace } from '@/lib/auth';
import { apiSuccess, apiError } from '@opencms/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return apiError('BAD_REQUEST', 'Email address is required to query purchase records.', null, 400);
  }

  const workspace = await getActiveWorkspace(req);
  if (!workspace) {
    return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);
  }

  try {
    const customer = await prisma.customer.findFirst({
      where: {
        workspaceId: workspace.id,
        email: email.toLowerCase().trim(),
      },
    });

    if (!customer) {
      return apiSuccess([], 'No customer profile found for this email address.');
    }

    const orders = await prisma.order.findMany({
      where: {
        workspaceId: workspace.id,
        customerId: customer.id,
      },
      include: {
        items: true,
        billingAddress: true,
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Serialize Decimals to normal floats for hydration safety
    const serializedOrders = orders.map(o => ({
      id: o.id,
      number: o.number,
      status: o.status,
      paymentMethod: o.paymentMethod,
      shippingMethod: o.shippingMethod,
      subtotal: Number(o.subtotal),
      discountTotal: Number(o.discountTotal),
      taxTotal: Number(o.taxTotal),
      shippingTotal: Number(o.shippingTotal),
      total: Number(o.total),
      createdAt: o.createdAt,
      items: o.items.map(i => ({
        id: i.id,
        name: i.name,
        price: Number(i.price),
        quantity: i.quantity,
        subtotal: Number(i.subtotal),
        total: Number(i.total),
      })),
      billingAddress: o.billingAddress,
      shippingAddress: o.shippingAddress,
    }));

    return apiSuccess(serializedOrders, 'Orders retrieved successfully');

  } catch (error: any) {
    console.error('Account orders retrieval error:', error);
    return apiError('SERVER_ERROR', error.message || 'Retrieval failed', null, 500);
  }
}
