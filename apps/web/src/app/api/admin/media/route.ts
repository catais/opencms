import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../lib/auth';
import { apiSuccess, apiError, apiPaginated } from '@opencms/api';
import { slugify } from '@opencms/utils';
import { createAuditLog } from '@opencms/core';

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '24');
    const skip = (page - 1) * limit;

    const total = await prisma.media.count({ where: { workspaceId: workspace.id } });
    const media = await prisma.media.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return apiPaginated(media, page, limit, total);
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_media', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage media', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiError('BAD_REQUEST', 'No file was uploaded', null, 400);
    }

    const filename = file.name;
    const size = file.size;
    const mimeType = file.type || 'image/jpeg';

    // Premium image simulator based on search queries
    const randomSeed = Math.floor(Math.random() * 10000);
    let sampleUrl = `https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80`; // Sneakers fallback

    if (filename.toLowerCase().includes('shirt') || filename.toLowerCase().includes('hoodie')) {
      sampleUrl = `https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80`;
    } else if (filename.toLowerCase().includes('phone') || filename.toLowerCase().includes('tech')) {
      sampleUrl = `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80`;
    } else if (filename.toLowerCase().includes('chair') || filename.toLowerCase().includes('furniture')) {
      sampleUrl = `https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80`;
    } else if (mimeType.startsWith('image/')) {
      // Just some nice modern design abstract background
      sampleUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80&sig=${randomSeed}`;
    }

    const path = `/media/${slugify(filename.split('.')[0])}-${randomSeed}.${filename.split('.').pop() || 'jpg'}`;

    const media = await prisma.media.create({
      data: {
        workspaceId: workspace.id,
        name: filename,
        url: sampleUrl,
        path,
        mimeType,
        size,
        width: 800,
        height: 600,
        altText: filename.split('.')[0],
      },
    });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'media.uploaded',
      entityType: 'Media',
      entityId: media.id,
      details: { name: media.name, path: media.path, size },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(media, 'Media file uploaded successfully', 201);
  } catch (error: any) {
    console.error('Media upload simulation error:', error);
    return apiError('INTERNAL_ERROR', error.message || 'Error uploading file', null, 500);
  }
}
