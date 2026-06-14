import { z } from 'zod';

/**
 * Generate a URL-friendly slug from a text string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

/**
 * Format a number/Decimal to standard currency notation
 */
export function formatCurrency(amount: any, currency: string = 'USD'): string {
  const num = typeof amount === 'number' ? amount : Number(amount || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(num);
}

/**
 * Format a date object or ISO string to a human-readable format
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format file sizes to KB, MB, GB formats
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ==========================================
// Shared Zod Input Validation Schemas
// ==========================================

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const PageCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().default(''),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).default('DRAFT'),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'PASSWORD']).default('PUBLIC'),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  template: z.string().default('default'),
  featuredImageId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
});

export const PostCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().default(''),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).default('DRAFT'),
  excerpt: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  featuredImageId: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
});

export const ProductCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  type: z.enum(['SIMPLE', 'VARIABLE', 'DIGITAL', 'PHYSICAL', 'DOWNLOADABLE']).default('SIMPLE'),
  description: z.string().default(''),
  shortDescription: z.string().optional().nullable(),
  sku: z.string().min(1, 'SKU is required'),
  price: z.preprocess((val) => Number(val), z.number().nonnegative('Price must be positive')),
  salePrice: z.preprocess((val) => (val ? Number(val) : undefined), z.number().nonnegative().optional().nullable()),
  stockQuantity: z.preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().int().optional().nullable()),
  manageStock: z.boolean().default(false),
  stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'ON_BACKORDER']).default('IN_STOCK'),
  lowStockAmount: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().optional().nullable()),
  featuredImageId: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
});

export const CouponCreateSchema = z.object({
  code: z.string().min(1, 'Code is required').toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FIXED_CART', 'FIXED_PRODUCT']).default('PERCENTAGE'),
  amount: z.preprocess((val) => Number(val), z.number().positive('Discount amount must be positive')),
  expiryDate: z.string().optional().nullable(),
  usageLimit: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().positive().optional().nullable()),
  minSpend: z.preprocess((val) => (val ? Number(val) : undefined), z.number().nonnegative().optional().nullable()),
  maxSpend: z.preprocess((val) => (val ? Number(val) : undefined), z.number().nonnegative().optional().nullable()),
});
