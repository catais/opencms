import { NextRequest } from 'next/server';
import { apiSuccess } from '@opencms/api';

export async function POST(req: NextRequest) {
  const response = apiSuccess(null, 'Logged out successfully');
  
  // Clear cookie
  response.cookies.set('opencms_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
