import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { createAuditLog } from '@opencms/core';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_media', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage media', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  const { id } = await params;

  try {
    const media = await prisma.media.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!media) {
      return apiError('MEDIA_NOT_FOUND', 'Media file not found', null, 404);
    }

    await prisma.media.delete({ where: { id } });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'media.deleted',
      entityType: 'Media',
      entityId: id,
      details: { name: media.name, path: media.path },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(null, 'Media file deleted successfully');
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
