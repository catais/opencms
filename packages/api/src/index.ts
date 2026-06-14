import { NextResponse } from 'next/server';

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message: string;
}

export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

const CACHE_BUST_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

/**
 * Return a standard JSON success response
 */
export function apiSuccess<T = any>(
  data: T,
  message: string = 'Request completed successfully',
  status: number = 200
) {
  const payload: SuccessResponse<T> = {
    success: true,
    data,
    message,
  };
  return NextResponse.json(payload, {
    status,
    headers: CACHE_BUST_HEADERS,
  });
}

/**
 * Return a standard JSON paginated list response
 */
export function apiPaginated<T = any>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  status: number = 200
) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const payload: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
  return NextResponse.json(payload, {
    status,
    headers: CACHE_BUST_HEADERS,
  });
}

/**
 * Return a standard JSON error response
 */
export function apiError(
  code: string,
  message: string,
  details: any = null,
  status: number = 400
) {
  const payload: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
  return NextResponse.json(payload, {
    status,
    headers: CACHE_BUST_HEADERS,
  });
}

