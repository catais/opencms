import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { createAuditLog } from '@opencms/core';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_webhooks', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage webhooks', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  const { id } = await params;

  try {
    const webhook = await prisma.webhook.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!webhook) {
      return apiError('NOT_FOUND', 'Webhook not found', null, 404);
    }

    await prisma.webhook.delete({ where: { id } });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'webhook.deleted',
      entityType: 'Webhook',
      entityId: id,
      details: { name: webhook.name, url: webhook.url },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(null, 'Webhook receiver deleted successfully');
  } catch (error: any) {
    console.error('Webhook deletion error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
