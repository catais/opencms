import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@opencms/database';
import { comparePassword, signToken } from '@opencms/auth';
import { LoginSchema } from '@opencms/utils';
import { apiSuccess, apiError } from '@opencms/api';
import { createAuditLog } from '@opencms/core';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return apiError('VALIDATION_ERROR', 'Invalid credentials format', result.error.format());
    }

    const { email, password } = result.data;

    // Find user in database with role and permissions
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return apiError('AUTH_FAILED', 'Invalid email or password', null, 401);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return apiError('AUTH_FAILED', 'Invalid email or password', null, 401);
    }

    const permissions = user.role.permissions.map(rp => rp.permission.name);

    // Create Token Payload
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };

    // Sign Token
    const token = signToken(payload);

    // Set cookie response
    const response = apiSuccess(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          avatarUrl: user.avatarUrl,
        },
        token,
      },
      'Logged in successfully'
    );

    // Secure cookie setup
    response.cookies.set('opencms_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Write audit log
    await createAuditLog({
      userId: user.id,
      action: 'user.login',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return apiError('INTERNAL_ERROR', error.message || 'An unexpected error occurred', null, 500);
  }
}
