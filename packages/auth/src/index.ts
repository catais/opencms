import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'opencms-secure-fallback-secret-2026-key';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare an incoming password with its hashed version
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a new JWT session token
 */
export function signToken(payload: TokenPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify a JWT session token and return its payload
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a list of user permissions includes a specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (userPermissions.includes('manage_all') || userPermissions.includes('*')) {
    return true;
  }
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user permissions include all requested permissions
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (userPermissions.includes('manage_all') || userPermissions.includes('*')) {
    return true;
  }
  return requiredPermissions.every(perm => userPermissions.includes(perm));
}
