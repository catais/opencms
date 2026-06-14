import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getActiveWorkspace } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const workspace = await getActiveWorkspace(req);
    if (!workspace) {
      return new Response('Workspace not found', { status: 404 });
    }

    // Check if the seo-optimizer plugin is active
    const seoPlugin = await prisma.plugin.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: workspace.id,
          slug: 'seo-optimizer',
        },
      },
    });

    let addSitemap = false;
    if (seoPlugin && seoPlugin.isActive) {
      try {
        const settings = JSON.parse(seoPlugin.settingsJson || '{}');
        addSitemap = settings.addSitemap === 'true' || settings.addSitemap === true;
      } catch (e) {
        console.error('Error parsing SEO Optimizer settings:', e);
      }
    }

    if (!seoPlugin || !seoPlugin.isActive || !addSitemap) {
      return new Response('SEO Optimizer sitemap index is disabled in settings.', { status: 404 });
    }

    // Query published posts
    const posts = await prisma.post.findMany({
      where: {
        workspaceId: workspace.id,
        status: 'PUBLISHED',
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    // Query products
    const products = await prisma.product.findMany({
      where: {
        workspaceId: workspace.id,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    const origin = req.nextUrl.origin;
    const baseUrl = workspace.domain || origin;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/shop</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

    posts.forEach(post => {
      const lastMod = new Date(post.updatedAt).toISOString().split('T')[0];
      xml += `
  <url>
    <loc>${baseUrl}/posts/${post.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    products.forEach(product => {
      const lastMod = new Date(product.updatedAt).toISOString().split('T')[0];
      xml += `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Sitemap generation error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
