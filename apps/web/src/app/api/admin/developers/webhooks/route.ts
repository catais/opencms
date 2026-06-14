import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import crypto from 'crypto';
import { createAuditLog } from '@opencms/core';

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const webhooks = await prisma.webhook.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
    });

    const serialized = webhooks.map(w => ({
      ...w,
      events: JSON.parse(w.eventsJson || '[]'),
    }));

    return apiSuccess(serialized);
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_webhooks', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage webhooks', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const { name, url, events } = await req.json();

    if (!name || !url) {
      return apiError('BAD_REQUEST', 'Webhook name and target URL are required', null, 400);
    }

    // Generate random secure secret for HMAC SHA256 signing
    const secret = 'whsec_' + crypto.randomBytes(16).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        workspaceId: workspace.id,
        name,
        url,
        secret,
        eventsJson: JSON.stringify(events || ['*']),
        isActive: true,
      },
    });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'webhook.created',
      entityType: 'Webhook',
      entityId: webhook.id,
      details: { name: webhook.name, url: webhook.url, events },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(
      {
        ...webhook,
        events: events || ['*'],
      },
      'Webhook created successfully',
      201
    );
  } catch (error: any) {
    console.error('Webhook creation error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
