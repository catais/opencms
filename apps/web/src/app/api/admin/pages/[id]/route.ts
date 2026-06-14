import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { PageCreateSchema, slugify } from '@opencms/utils';
import { createAuditLog } from '@opencms/core';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  const { id } = await params;

  try {
    const page = await prisma.page.findFirst({
      where: { id, workspaceId: workspace.id },
      include: {
        featuredImage: true,
      },
    });

    if (!page) {
      return apiError('PAGE_NOT_FOUND', 'Page not found', null, 404);
    }

    return apiSuccess(page);
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_pages', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage pages', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  const { id } = await params;

  try {
    const page = await prisma.page.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!page) {
      return apiError('PAGE_NOT_FOUND', 'Page not found', null, 404);
    }

    const body = await req.json();
    const result = PageCreateSchema.safeParse(body);

    if (!result.success) {
      return apiError('VALIDATION_ERROR', 'Invalid page data', result.error.format());
    }

    const data = result.data;
    const finalSlug = slugify(data.slug);

    // Check unique slug excluding this page
    const existing = await prisma.page.findFirst({
      where: {
        workspaceId: workspace.id,
        slug: finalSlug,
        NOT: { id },
      },
    });

    if (existing) {
      return apiError('SLUG_CONFLICT', 'A page with this slug already exists in this workspace', null, 409);
    }

    const updatedPage = await prisma.page.update({
      where: { id },
      data: {
        title: data.title,
        slug: finalSlug,
        content: data.content,
        htmlContent: data.content,
        status: data.status,
        visibility: data.visibility,
        seoTitle: data.seoTitle || data.title,
        seoDescription: data.seoDescription || '',
        template: data.template,
        featuredImageId: data.featuredImageId || null,
        parentId: data.parentId || null,
        publishedAt: data.status === 'PUBLISHED' && !page.publishedAt ? new Date() : page.publishedAt,
      },
    });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'page.updated',
      entityType: 'Page',
      entityId: page.id,
      details: { title: updatedPage.title, slug: updatedPage.slug },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(updatedPage, 'Page updated successfully');
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_pages', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage pages', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  const { id } = await params;

  try {
    const page = await prisma.page.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!page) {
      return apiError('PAGE_NOT_FOUND', 'Page not found', null, 404);
    }

    await prisma.page.delete({ where: { id } });

    await createAuditLog({
      workspaceId: workspace.id,
      userId: payload.userId,
      action: 'page.deleted',
      entityType: 'Page',
      entityId: id,
      details: { title: page.title, slug: page.slug },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return apiSuccess(null, 'Page deleted successfully');
  } catch (error: any) {
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
