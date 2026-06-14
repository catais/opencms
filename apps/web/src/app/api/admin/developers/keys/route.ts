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
    const keys = await prisma.apiKey.findMany({
      where: { workspaceId: workspace.id },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(keys);
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_api_keys', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage API keys', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const { name, scopes, rateLimit } = await req.json();

    if (!name || name.trim() === '') {
      return apiError('BAD_REQUEST', 'API key name is required', null, 400);
    }

    // Generate random plain API Key token
    const rawKey = 'oc_live_' + crypto.randomBytes(24).toString('hex');
    // SHA256 Hash of the key
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await prisma.apiKey.create({
      data: {
        workspaceId: workspace.id,
        name,
        keyHash,
        userId: payload.userId,
        scopesJson: JSON.stringify(scopes || ['*']),
        rateLimit: rateLimit ? parseInt(rateLimit) : 60,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'api_key.created',
      entityType: 'ApiKey',
      entityId: apiKey.id,
      details: { name: apiKey.name, scopes },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(
      {
        ...apiKey,
        plainTextKey: rawKey, // Plain text key returned EXACTLY ONCE
      },
      'API Key generated successfully. Save it in a safe place, it will not be shown again.',
      201
    );
  } catch (error: any) {
    console.error('API key generation error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
