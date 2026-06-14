import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { createAuditLog } from '@opencms/core';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const deliveries = await prisma.webhookDelivery.findMany({
      where: {
        webhook: {
          workspaceId: workspace.id,
        },
      },
      include: {
        webhook: {
          select: {
            name: true,
            url: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100 entries
    });

    return apiSuccess(deliveries);
  } catch (error: any) {
    console.error('Webhook deliveries fetching error:', error);
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
    const { deliveryId } = await req.json();

    if (!deliveryId) {
      return apiError('BAD_REQUEST', 'deliveryId is required to retry', null, 400);
    }

    // Find original delivery and ensure it belongs to this workspace
    const originalDelivery = await prisma.webhookDelivery.findFirst({
      where: {
        id: deliveryId,
        webhook: {
          workspaceId: workspace.id,
        },
      },
      include: {
        webhook: true,
      },
    });

    if (!originalDelivery) {
      return apiError('NOT_FOUND', 'Webhook delivery attempt not found', null, 404);
    }

    const webhook = originalDelivery.webhook;
    const event = originalDelivery.event;
    const body = originalDelivery.requestBodyJson;

    // Construct the standard headers as before
    // Compute HMAC signature over body if we can parse it, or use the raw text body
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-OpenCMS-Event': event,
      'X-OpenCMS-Signature': `sha256=${signature}`,
      'X-OpenCMS-Retry': 'true',
      'User-Agent': 'OpenCMS-Webhook-Dispatcher/1.0',
    };

    const startTime = Date.now();
    let statusCode: number | null = null;
    let responseBody = '';
    let responseHeadersStr = '{}';
    let isSuccess = false;

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      statusCode = response.status;
      isSuccess = response.ok;
      responseBody = await response.text();
      
      const respHeadersObj: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        respHeadersObj[key] = val;
      });
      responseHeadersStr = JSON.stringify(respHeadersObj);
    } catch (fetchError: any) {
      responseBody = fetchError.message || 'Connection failed / Timeout';
      isSuccess = false;
    } finally {
      const duration = Date.now() - startTime;

      // Save a new delivery entry
      const newDelivery = await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: `${event} (Retry)`,
          statusCode,
          requestHeaderJson: JSON.stringify(headers),
          requestBodyJson: body,
          responseHeaderJson: responseHeadersStr,
          responseBodyJson: responseBody.slice(0, 1000),
          duration,
          isSuccess,
        },
      });

      await createAuditLog({
        workspaceId: workspace.id,
        userId: payload.userId,
        action: 'webhook.retried',
        entityType: 'WebhookDelivery',
        entityId: newDelivery.id,
        details: { webhookName: webhook.name, originalDeliveryId: deliveryId, newDeliveryId: newDelivery.id, isSuccess },
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent'),
      });

      return apiSuccess(
        newDelivery,
        isSuccess ? 'Webhook redelivered successfully' : 'Webhook redelivery attempted but failed',
        200
      );
    }
  } catch (error: any) {
    console.error('Webhook retry execution error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
