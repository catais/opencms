export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { INSTALLED_PLUGINS } from '@opencms/plugins';
import { createAuditLog } from '@opencms/core';
import { getCustomPlugins } from '../../../../lib/scanner';

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const dbPlugins = await prisma.plugin.findMany({
      where: { workspaceId: workspace.id },
    });

    const customPlugins = getCustomPlugins();
    const allPlugins = [...INSTALLED_PLUGINS, ...customPlugins];

    const merged = allPlugins.map(manifest => {
      const dbRecord = dbPlugins.find(p => p.slug === manifest.slug);
      return {
        ...manifest,
        id: dbRecord?.id || null,
        isActive: dbRecord ? dbRecord.isActive : false,
        settings: dbRecord ? JSON.parse(dbRecord.settingsJson || '{}') : {},
      };
    });

    return apiSuccess(merged);
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_plugins', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage plugins', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const body = await req.json();
    const { slug, isActive, settings } = body;

    if (!slug) {
      return apiError('BAD_REQUEST', 'Plugin slug is required', null, 400);
    }

    const customPlugins = getCustomPlugins();
    const allPlugins = [...INSTALLED_PLUGINS, ...customPlugins];
    const manifest = allPlugins.find(p => p.slug === slug);
    if (!manifest) {
      return apiError('NOT_FOUND', 'Plugin not found in manifest registries', null, 404);
    }

    const currentRecord = await prisma.plugin.findFirst({
      where: { workspaceId: workspace.id, slug },
    });

    const defaultSettings: Record<string, string> = {};
    manifest.settingsFields.forEach(f => {
      defaultSettings[f.key] = f.defaultValue;
    });

    const finalSettings = settings ? { ...defaultSettings, ...settings } : (currentRecord ? JSON.parse(currentRecord.settingsJson || '{}') : defaultSettings);
    const finalIsActive = typeof isActive === 'boolean' ? isActive : (currentRecord ? currentRecord.isActive : false);

    const plugin = await prisma.plugin.upsert({
      where: {
        workspaceId_slug: {
          workspaceId: workspace.id,
          slug,
        },
      },
      create: {
        workspaceId: workspace.id,
        name: manifest.name,
        slug,
        description: manifest.description,
        version: manifest.version,
        author: manifest.author,
        isActive: finalIsActive,
        settingsJson: JSON.stringify(finalSettings),
      },
      update: {
        isActive: finalIsActive,
        settingsJson: JSON.stringify(finalSettings),
      },
    });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: finalIsActive ? 'plugin.activated' : 'plugin.deactivated',
      entityType: 'Plugin',
      entityId: plugin.id,
      details: { slug, name: plugin.name, settings: finalSettings },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(plugin, `Plugin "${plugin.name}" updated successfully`);
  } catch (error: any) {
    console.error('Plugin update error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

