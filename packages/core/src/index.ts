import { prisma } from '@opencms/database';
import crypto from 'crypto';

/**
 * Record an audit log for an action in the system
 */
export async function createAuditLog({
  workspaceId,
  userId,
  action,
  entityType,
  entityId,
  details = {},
  ipAddress,
  userAgent,
}: {
  workspaceId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    // Validate if userId exists in database to prevent P2003 Foreign Key constraint violations
    let validUserId: string | null = null;
    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (userExists) {
        validUserId = userId;
      } else {
        console.warn(`[AuditLog] Warning: Provided userId "${userId}" does not exist in the database. Omitting user relation.`);
      }
    }

    // Validate if workspaceId exists in database to prevent P2003 Foreign Key constraint violations
    let validWorkspaceId: string | null = null;
    if (workspaceId) {
      const workspaceExists = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true },
      });
      if (workspaceExists) {
        validWorkspaceId = workspaceId;
      } else {
        console.warn(`[AuditLog] Warning: Provided workspaceId "${workspaceId}" does not exist in the database. Omitting workspace relation.`);
      }
    }

    return await prisma.auditLog.create({
      data: {
        workspaceId: validWorkspaceId,
        userId: validUserId,
        action,
        entityType,
        entityId: entityId || null,
        detailsJson: JSON.stringify(details),
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
}

/**
 * Dispatch a webhook event asynchronously.
 * Finds all active webhooks registered for the workspace, filters those subscribed to the event,
 * signs the payload with SHA-256 HMAC, makes the POST request, and logs the delivery attempt.
 */
export async function dispatchWebhook(
  workspaceId: string,
  event: string,
  payload: Record<string, any>
): Promise<void> {
  // Execute in the background so we do not block the main request thread
  setTimeout(async () => {
    try {
      // Find active webhooks for this workspace
      const webhooks = await prisma.webhook.findMany({
        where: {
          workspaceId,
          isActive: true,
        },
      });

      for (const webhook of webhooks) {
        const events = JSON.parse(webhook.eventsJson || '[]');
        
        // Check if webhook is subscribed to this event (or all events '*')
        if (!events.includes(event) && !events.includes('*')) {
          continue;
        }

        const body = JSON.stringify({
          id: crypto.randomUUID(),
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        });

        // Compute HMAC signature
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(body)
          .digest('hex');

        const headers = {
          'Content-Type': 'application/json',
          'X-OpenCMS-Event': event,
          'X-OpenCMS-Signature': `sha256=${signature}`,
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
            // Timeout after 10 seconds
            signal: AbortSignal.timeout(10000),
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

          // Log the webhook delivery details
          await prisma.webhookDelivery.create({
            data: {
              webhookId: webhook.id,
              event,
              statusCode,
              requestHeaderJson: JSON.stringify(headers),
              requestBodyJson: body,
              responseHeaderJson: responseHeadersStr,
              responseBodyJson: responseBody.slice(0, 1000), // Cap size
              duration,
              isSuccess,
            },
          });
        }
      }
    } catch (err) {
      console.error('Error during webhook dispatching:', err);
    }
  }, 0);
}
