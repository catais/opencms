import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, getActiveWorkspace } from '../../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const categories = await prisma.productCategory.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { name: 'asc' },
    });

    const tags = await prisma.productTag.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { name: 'asc' },
    });

    return apiSuccess({ categories, tags });
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
