import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getActiveWorkspace } from '../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { INSTALLED_PLUGINS } from '@opencms/plugins';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const workspace = await getActiveWorkspace(req);
    if (!workspace) {
      return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);
    }

    const dbPlugins = await prisma.plugin.findMany({
      where: {
        workspaceId: workspace.id,
      },
    });

    const activePlugins = INSTALLED_PLUGINS.map(manifest => {
      const dbRecord = dbPlugins.find(p => p.slug === manifest.slug);
      return {
        slug: manifest.slug,
        name: manifest.name,
        isActive: dbRecord ? dbRecord.isActive : false,
        settings: dbRecord ? JSON.parse(dbRecord.settingsJson || '{}') : (() => {
          const defaultSettings: Record<string, string> = {};
          manifest.settingsFields.forEach(f => {
            defaultSettings[f.key] = f.defaultValue;
          });
          return defaultSettings;
        })(),
      };
    });

    return apiSuccess(activePlugins);
  } catch (error: any) {
    console.error('Active plugins error:', error);
    return apiError('DB_ERROR', error.message || 'Error fetching active plugins', null, 500);
  }
}
