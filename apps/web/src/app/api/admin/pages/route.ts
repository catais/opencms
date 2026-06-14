export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../lib/auth';
import { apiSuccess, apiError, apiPaginated } from '@opencms/api';
import { PageCreateSchema, slugify } from '@opencms/utils';
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

    const total = await prisma.page.count({ where: { workspaceId: workspace.id } });
    const pages = await prisma.page.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        featuredImage: {
          select: { id: true, url: true, name: true },
        },
      },
    });

    return apiPaginated(pages, page, limit, total);
  } catch (error: any) {
    return apiError('DB_ERROR', error.message || 'Error fetching pages', null, 500);
  }
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_pages', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage pages', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const body = await req.json();
    const result = PageCreateSchema.safeParse(body);

    if (!result.success) {
      return apiError('VALIDATION_ERROR', 'Invalid page data', result.error.format());
    }

    const data = result.data;
    const finalSlug = slugify(data.slug);

    // Ensure unique slug
    const existing = await prisma.page.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: workspace.id,
          slug: finalSlug,
        },
      },
    });

    if (existing) {
      return apiError('SLUG_CONFLICT', 'A page with this slug already exists in this workspace', null, 409);
    }

    const page = await prisma.page.create({
      data: {
        workspaceId: workspace.id,
        title: data.title,
        slug: finalSlug,
        content: data.content,
        htmlContent: data.content, // Simple rendering of markdown to html simulator
        status: data.status,
        visibility: data.visibility,
        seoTitle: data.seoTitle || data.title,
        seoDescription: data.seoDescription || '',
        template: data.template,
        featuredImageId: data.featuredImageId || null,
        parentId: data.parentId || null,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      },
    });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'page.created',
      entityType: 'Page',
      entityId: page.id,
      details: { title: page.title, slug: page.slug },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(page, 'Page created successfully', 201);
  } catch (error: any) {
    console.error('Page creation error:', error);
    return apiError('INTERNAL_ERROR', error.message || 'Error creating page', null, 500);
  }
}
