import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { createAuditLog } from '@opencms/core';

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const settings = await prisma.setting.findMany({
      where: { workspaceId: workspace.id },
    });

    const config: Record<string, string> = {};
    settings.forEach(s => {
      config[s.key] = s.value;
    });

    // Fallback defaults if empty
    const defaults = {
      site_title: 'OpenCMS Storefront',
      site_description: 'Modern WooCommerce + WordPress Replica in Next.js',
      currency: 'USD',
      shipping_flat_rate: '10.00',
      tax_standard_rate: '0.0825',
      stripe_enabled: 'true',
      cod_enabled: 'true',
    };

    return apiSuccess({ ...defaults, ...config });
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_settings', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage settings', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const body = await req.json();

    const updatedKeys: string[] = [];

    // Save each key-value pair in body to Setting table
    for (const key of Object.keys(body)) {
      const val = String(body[key]);
      
      await prisma.setting.upsert({
        where: {
          workspaceId_key: {
            workspaceId: workspace.id,
            key,
          },
        },
        create: {
          workspaceId: workspace.id,
          key,
          value: val,
        },
        update: {
          value: val,
        },
      });

      updatedKeys.push(key);
    }

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'settings.updated',
      entityType: 'Setting',
      details: { keys: updatedKeys },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(body, 'Settings updated successfully');
  } catch (error: any) {
    console.error('Settings update error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
