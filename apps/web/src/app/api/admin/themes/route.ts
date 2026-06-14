export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { INSTALLED_THEMES } from '@opencms/themes';
import { createAuditLog } from '@opencms/core';
import { getCustomThemes } from '../../../../lib/scanner';

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    // Get DB records
    const dbThemes = await prisma.theme.findMany({
      where: { workspaceId: workspace.id },
    });

    const customThemes = getCustomThemes();
    const allThemes = [...INSTALLED_THEMES, ...customThemes];

    // Merge static and custom manifest data with active status in DB
    const merged = allThemes.map(manifest => {
      const dbRecord = dbThemes.find(t => t.slug === manifest.slug);
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

  const hasAccess = await checkPermission('manage_themes', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage themes', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const { slug } = await req.json();

    if (!slug) {
      return apiError('BAD_REQUEST', 'Theme slug is required', null, 400);
    }

    const customThemes = getCustomThemes();
    const allThemes = [...INSTALLED_THEMES, ...customThemes];
    const manifest = allThemes.find(t => t.slug === slug);
    if (!manifest) {
      return apiError('NOT_FOUND', 'Theme not found in manifest registries', null, 404);
    }

    // Deactivate all themes for this workspace
    await prisma.theme.updateMany({
      where: { workspaceId: workspace.id },
      data: { isActive: false },
    });

    // Upsert and activate this theme
    const theme = await prisma.theme.upsert({
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
        isActive: true,
        settingsJson: JSON.stringify(manifest.config),
      },
      update: {
        isActive: true,
      },
    });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'theme.activated',
      entityType: 'Theme',
      entityId: theme.id,
      details: { slug, name: theme.name },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(theme, `Theme "${theme.name}" activated successfully`);
  } catch (error: any) {
    console.error('Theme toggle error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

