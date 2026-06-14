import { cookies } from 'next/headers';
import { verifyToken, TokenPayload, hasPermission } from '@opencms/auth';
import { prisma } from '@opencms/database';

/**
 * Get the currently authenticated user from cookies or Authorization header
 */
export async function getAuthUser(req?: Request): Promise<TokenPayload | null> {
  let token: string | null = null;

  // 1. Try to read from HTTPOnly Cookie
  try {
    const cookieStore = await cookies();
    token = cookieStore.get('opencms_session')?.value || null;
  } catch (e) {
    // cookies() might fail in some contexts, fallback to headers
  }

  // 2. Try to read from Authorization Header (Bearer token)
  if (!token && req) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  // Verify the JWT token
  const payload = verifyToken(token);
  if (!payload) return null;

  return payload;
}

/**
 * Verify if the current user has the required permission
 */
export async function checkPermission(permission: string, req?: Request): Promise<boolean> {
  const user = await getAuthUser(req);
  if (!user) return false;
  return hasPermission(user.permissions, permission);
}

/**
 * Get active workspace from context or header
 */
export async function getActiveWorkspace(req?: Request): Promise<any> {
  // Return the default workspace seeded in the DB
  const workspace = await prisma.workspace.findFirst({
    where: { slug: 'my-site' },
  });
  return workspace;
}
