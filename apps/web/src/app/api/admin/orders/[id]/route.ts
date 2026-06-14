import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { createAuditLog } from '@opencms/core';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  const { id } = await params;

  try {
    const order = await prisma.order.findFirst({
      where: { id, workspaceId: workspace.id },
      include: {
        customer: true,
        billingAddress: true,
        shippingAddress: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, featuredImage: { select: { url: true } } } },
            variation: true,
          },
        },
        notes: { orderBy: { createdAt: 'desc' } },
        payments: true,
      },
    });

    if (!order) {
      return apiError('ORDER_NOT_FOUND', 'Order not found', null, 404);
    }

    const serialized = {
      ...order,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      taxTotal: Number(order.taxTotal),
      shippingTotal: Number(order.shippingTotal),
      discountTotal: Number(order.discountTotal),
      items: order.items.map(i => ({
        ...i,
        price: Number(i.price),
        subtotal: Number(i.subtotal),
        total: Number(i.total),
      })),
      payments: order.payments.map(p => ({
        ...p,
        amount: Number(p.amount),
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

  const hasAccess = await checkPermission('manage_orders', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage orders', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  const { id } = await params;

  try {
    const order = await prisma.order.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!order) {
      return apiError('ORDER_NOT_FOUND', 'Order not found', null, 404);
    }

    const body = await req.json();
    const { status, note, isCustomerNote } = body;

    let updatedOrder = order;

    // 1. If updating status
    if (status) {
      updatedOrder = await prisma.order.update({
        where: { id },
        data: { status },
      });

      // Add automatic private note on status change
      await prisma.orderNote.create({
        data: {
          orderId: id,
          note: `Order status changed from "${order.status}" to "${status}" by ${payload.email}`,
          isCustomerNote: false,
        },
      });

      await createAuditLog({
        workspaceId: workspace.id,
        userId: payload.userId,
        action: `order.status_changed`,
        entityType: 'Order',
        entityId: id,
        details: { number: order.number, oldStatus: order.status, newStatus: status },
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent'),
      });
    }

    // 2. If adding a manual note
    if (note && note.trim() !== '') {
      await prisma.orderNote.create({
        data: {
          orderId: id,
          note: note.trim(),
          isCustomerNote: isCustomerNote || false,
        },
      });

      await createAuditLog({
        workspaceId: workspace.id,
        userId: payload.userId,
        action: 'order.note_added',
        entityType: 'Order',
        entityId: id,
        details: { number: order.number, isCustomer: isCustomerNote },
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent'),
      });
    }

    // Return the updated full detailed order
    const refreshedOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        billingAddress: true,
        shippingAddress: true,
        items: { include: { product: true, variation: true } },
        notes: { orderBy: { createdAt: 'desc' } },
        payments: true,
      },
    });

    const serialized = {
      ...refreshedOrder,
      total: Number(refreshedOrder?.total || 0),
      subtotal: Number(refreshedOrder?.subtotal || 0),
      taxTotal: Number(refreshedOrder?.taxTotal || 0),
      shippingTotal: Number(refreshedOrder?.shippingTotal || 0),
      discountTotal: Number(refreshedOrder?.discountTotal || 0),
      items: refreshedOrder?.items.map(i => ({
        ...i,
        price: Number(i.price),
        subtotal: Number(i.subtotal),
        total: Number(i.total),
      })) || [],
      payments: refreshedOrder?.payments.map(p => ({
        ...p,
        amount: Number(p.amount),
      })) || [],
    };

    return apiSuccess(serialized, 'Order updated successfully');
  } catch (error: any) {
    console.error('Order update error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
