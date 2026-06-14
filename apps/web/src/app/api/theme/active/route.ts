import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getActiveWorkspace } from '../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { INSTALLED_THEMES } from '@opencms/themes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const workspace = await getActiveWorkspace(req);
    if (!workspace) {
      return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);
    }

    const activeTheme = await prisma.theme.findFirst({
      where: {
        workspaceId: workspace.id,
        isActive: true,
      },
    });

    if (activeTheme) {
      return apiSuccess({
        slug: activeTheme.slug,
        name: activeTheme.name,
        config: JSON.parse(activeTheme.settingsJson || '{}'),
      });
    }

    // Fallback to default
    const defaultTheme = INSTALLED_THEMES.find(t => t.slug === 'minimal-saas') || INSTALLED_THEMES[0];
    return apiSuccess({
      slug: defaultTheme.slug,
      name: defaultTheme.name,
      config: defaultTheme.config,
    });
  } catch (error: any) {
    console.error('Active theme error:', error);
    return apiError('DB_ERROR', error.message || 'Error fetching active theme', null, 500);
  }
}
