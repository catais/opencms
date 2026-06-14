export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { createAuditLog } from '@opencms/core';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    // Get all users in this workspace, or all users in sandbox for convenience
    const users = await prisma.user.findMany({
      include: {
        role: { select: { id: true, name: true, description: true } },
        workspaces: {
          where: { workspaceId: workspace.id },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also fetch available roles
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, description: true },
    });

    return apiSuccess({ users, roles });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_users', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage users', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const body = await req.json();
    const { action, userId, roleId, name, email, password } = body;

    // Action 1: Create a new user
    if (action === 'create') {
      if (!name || !email || !password || !roleId) {
        return apiError('BAD_REQUEST', 'Missing required fields for user creation', null, 400);
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return apiError('CONFLICT', 'A user with this email already exists', null, 409);
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // Create user and map to active workspace
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          roleId,
          workspaces: {
            create: {
              workspaceId: workspace.id,
              roleId, // Same role inside workspace override
            },
          },
        },
        include: { role: true },
      });

      await createAuditLog({
        workspaceId: workspace.id,
        userId: payload.userId,
        action: 'user.created',
        entityType: 'User',
        entityId: newUser.id,
        details: { name, email, role: newUser.role.name },
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent'),
      });

      return apiSuccess(newUser, 'New staff user created successfully', 201);
    }

    // Action 2: Update role
    if (action === 'update_role') {
      if (!userId || !roleId) {
        return apiError('BAD_REQUEST', 'userId and roleId are required to modify role permissions', null, 400);
      }

      // Keep from self locking
      if (userId === payload.userId) {
        return apiError('BAD_REQUEST', 'You cannot modify your own administrative roles', null, 400);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { roleId },
        include: { role: true },
      });

      // Update workspace override too
      await prisma.userWorkspace.updateMany({
        where: { userId, workspaceId: workspace.id },
        data: { roleId },
      });

      await createAuditLog({
        workspaceId: workspace.id,
        userId: payload.userId,
        action: 'user.role_updated',
        entityType: 'User',
        entityId: userId,
        details: { userEmail: updatedUser.email, newRole: updatedUser.role.name },
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent'),
      });

      return apiSuccess(updatedUser, 'User role updated successfully');
    }

    // Action 3: Delete user
    if (action === 'delete') {
      if (!userId) return apiError('BAD_REQUEST', 'userId is required to delete user', null, 400);

      if (userId === payload.userId) {
        return apiError('BAD_REQUEST', 'You cannot terminate your own active administrator account', null, 400);
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return apiError('NOT_FOUND', 'User profile not found', null, 404);

      await prisma.user.delete({ where: { id: userId } });

      await createAuditLog({
        workspaceId: workspace.id,
        userId: payload.userId,
        action: 'user.deleted',
        entityType: 'User',
        entityId: userId,
        details: { email: user.email, name: user.name },
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent'),
      });

      return apiSuccess(null, 'User account removed from database registries');
    }

    return apiError('BAD_REQUEST', 'Invalid action specified', null, 400);
  } catch (error: any) {
    console.error('User management error:', error);
    return apiError('DB_ERROR', error.message, null, 500);
  }
}
