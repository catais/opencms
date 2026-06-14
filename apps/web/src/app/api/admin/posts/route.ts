export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../lib/auth';
import { apiSuccess, apiError, apiPaginated } from '@opencms/api';
import { PostCreateSchema, slugify } from '@opencms/utils';
import { createAuditLog } from '@opencms/core';

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const total = await prisma.post.count({ where: { workspaceId: workspace.id } });
    const posts = await prisma.post.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        featuredImage: {
          select: { id: true, url: true },
        },
        categories: {
          select: { id: true, name: true, slug: true },
        },
        tags: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return apiPaginated(posts, page, limit, total);
  } catch (error: any) {
    return apiError('DB_ERROR', error.message || 'Error fetching posts', null, 500);
  }
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_posts', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage posts', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const body = await req.json();
    const result = PostCreateSchema.safeParse(body);

    if (!result.success) {
      return apiError('VALIDATION_ERROR', 'Invalid post data', result.error.format());
    }

    const data = result.data;
    const finalSlug = slugify(data.slug);

    // Ensure unique slug
    const existing = await prisma.post.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: workspace.id,
          slug: finalSlug,
        },
      },
    });

    if (existing) {
      return apiError('SLUG_CONFLICT', 'A blog post with this slug already exists in this workspace', null, 409);
    }

    const wordCount = data.content.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // Average reading speed 200 wpm

    const post = await prisma.post.create({
      data: {
        workspaceId: workspace.id,
        title: data.title,
        slug: finalSlug,
        content: data.content,
        status: data.status,
        excerpt: data.excerpt || '',
        readingTime,
        seoTitle: data.seoTitle || data.title,
        seoDescription: data.seoDescription || '',
        featuredImageId: data.featuredImageId || null,
        authorId: payload.userId,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        categories: {
          connect: data.categoryIds.map(id => ({ id })),
        },
        tags: {
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
      action: 'post.created',
      entityType: 'Post',
      entityId: post.id,
      details: { title: post.title, slug: post.slug },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(post, 'Blog post created successfully', 201);
  } catch (error: any) {
    console.error('Post creation error:', error);
    return apiError('INTERNAL_ERROR', error.message || 'Error creating post', null, 500);
  }
}
