import { NextRequest } from 'next/server';
import { getAuthUser } from '../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { prisma } from '@opencms/database';

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) {
    return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return apiError('USER_NOT_FOUND', 'User record no longer exists', null, 404);
    }

    return apiSuccess({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role.name,
      permissions: payload.permissions,
    });
  } catch (error: any) {
    return apiError('INTERNAL_ERROR', error.message, null, 500);
  }
}
