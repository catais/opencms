import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { PostCreateSchema, slugify } from '@opencms/utils';
import { createAuditLog } from '@opencms/core';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  const { id } = await params;

  try {
    const post = await prisma.post.findFirst({
      where: { id, workspaceId: workspace.id },
      include: {
        featuredImage: true,
        categories: { select: { id: true, name: true } },
        tags: { select: { id: true, name: true } },
      },
    });

    if (!post) {
      return apiError('POST_NOT_FOUND', 'Blog post not found', null, 404);
    }

    return apiSuccess(post);
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_posts', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage posts', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  const { id } = await params;

  try {
    const post = await prisma.post.findFirst({
      where: { id, workspaceId: workspace.id },
      include: { categories: true, tags: true },
    });

    if (!post) {
      return apiError('POST_NOT_FOUND', 'Blog post not found', null, 404);
    }

    const body = await req.json();
    const result = PostCreateSchema.safeParse(body);

    if (!result.success) {
      return apiError('VALIDATION_ERROR', 'Invalid post data', result.error.format());
    }

    const data = result.data;
    const finalSlug = slugify(data.slug);

    // Check unique slug excluding this post
    const existing = await prisma.post.findFirst({
      where: {
        workspaceId: workspace.id,
        slug: finalSlug,
        NOT: { id },
      },
    });

    if (existing) {
      return apiError('SLUG_CONFLICT', 'A blog post with this slug already exists in this workspace', null, 409);
    }

    const wordCount = data.content.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Update categories & tags connections
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        slug: finalSlug,
        content: data.content,
        status: data.status,
        excerpt: data.excerpt || '',
        readingTime,
        seoTitle: data.seoTitle || data.title,
        seoDescription: data.seoDescription || '',
        featuredImageId: data.featuredImageId || null,
        publishedAt: data.status === 'PUBLISHED' && !post.publishedAt ? new Date() : post.publishedAt,
        categories: {
          disconnect: post.categories.map(c => ({ id: c.id })),
          connect: data.categoryIds.map(id => ({ id })),
        },
        tags: {
          disconnect: post.tags.map(t => ({ id: t.id })),
          connect: data.tagIds.map(id => ({ id })),
        },
      },
      include: {
        categories: true,
        tags: true,
      },
    });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'post.updated',
      entityType: 'Post',
      entityId: post.id,
      details: { title: updatedPost.title, slug: updatedPost.slug },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(updatedPost, 'Blog post updated successfully');
  } catch (error: any) {
    console.error('Post update error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_posts', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage posts', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  const { id } = await params;

  try {
    const post = await prisma.post.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!post) {
      return apiError('POST_NOT_FOUND', 'Blog post not found', null, 404);
    }

    await prisma.post.delete({ where: { id } });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'post.deleted',
      entityType: 'Post',
      entityId: id,
      details: { title: post.title, slug: post.slug },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(null, 'Blog post deleted successfully');
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
