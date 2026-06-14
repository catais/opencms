import React from 'react';
import Link from 'next/link';
import { prisma } from '@opencms/database';
import StorefrontLayout from '../../components/StorefrontLayout';

export const revalidate = 0; // Disable cache for live blog additions

interface Props {
  searchParams: Promise<{ category?: string; tag?: string; search?: string }>;
}

export default async function BlogListingPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const activeCategory = resolvedParams.category || 'all';
  const activeTag = resolvedParams.tag || 'all';
  const searchQuery = resolvedParams.search || '';

  // Get current workspace ('my-site')
  const workspace = await prisma.workspace.findFirst({
    where: { slug: 'my-site' },
  });

  if (!workspace) {
    return (
      <StorefrontLayout>
        <div className="p-12 text-center text-xs text-slate-500">Workspace not initialized.</div>
      </StorefrontLayout>
    );
  }

  // 1. Fetch categories and tags for active filter rails
  const categories = await prisma.category.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true, name: true, slug: true },
  });

  const tags = await prisma.tag.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true, name: true, slug: true },
  });

  // 2. Fetch published posts with filters applied
  const posts = await prisma.post.findMany({
    where: {
      workspaceId: workspace.id,
      status: 'PUBLISHED',
      ...(activeCategory !== 'all' && {
        categories: {
          some: { slug: activeCategory },
        },
      }),
      ...(activeTag !== 'all' && {
        tags: {
          some: { slug: activeTag },
        },
      }),
      ...(searchQuery && {
        OR: [
          { title: { contains: searchQuery } },
          { content: { contains: searchQuery } },
          { excerpt: { contains: searchQuery } },
        ],
      }),
    },
    include: {
      author: {
        select: { name: true, avatarUrl: true },
      },
      categories: {
        select: { name: true, slug: true },
      },
      tags: {
        select: { name: true, slug: true },
      },
      featuredImage: {
        select: { url: true, altText: true },
      },
    },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-10">
        
        {/* Blog Banner Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            OpenCMS Chronicles
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight dark:text-white mt-2">
            Inside the Sandbox: Engineering Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Stay up to date with core platform architectures, WooCommerce module additions, security reviews, and headless routing guides curated by OpenCMS engineers.
          </p>
        </div>

        {/* Filters and Searches Row */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm w-full">
          
          {/* Categories Tab list */}
          <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
            <Link
              href="/blog"
              className={`px-3 py-1.5 rounded-lg text-xxs font-bold tracking-tight transition-all shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              All Articles
            </Link>
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className={`px-3 py-1.5 rounded-lg text-xxs font-bold tracking-tight transition-all shrink-0 ${
                  activeCategory === cat.slug
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Search bar input node */}
          <form method="GET" action="/blog" className="flex items-center gap-2 border px-3 py-1.5 rounded-xl w-full lg:w-64 bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
            <i className="ri-search-line text-slate-400"></i>
            <input
              type="text"
              name="search"
              placeholder="Search blog articles..."
              defaultValue={searchQuery}
              className="bg-transparent text-xs w-full focus:outline-none text-slate-700 dark:text-slate-200"
            />
          </form>
        </div>

        {/* Main Grid Posts Section */}
        {posts.length === 0 ? (
          <div className="py-20 border rounded-2xl bg-white/40 dark:bg-slate-900/40 text-center space-y-3">
            <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <i className="ri-article-line text-xl"></i>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No published articles match criteria</p>
              <p className="text-xxs text-slate-400">Try adjusting your category search filters or explore standard posts.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => {
              const defaultImage = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80';
              const articleImage = post.featuredImage?.url || defaultImage;

              return (
                <article
                  key={post.id}
                  className="flex flex-col rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group"
                >
                  {/* Aspect Ratio Image frame */}
                  <div className="h-48 bg-slate-100 dark:bg-slate-950 relative overflow-hidden shrink-0 border-b dark:border-slate-800">
                    <Link href={`/posts/${post.slug}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={articleImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                  </div>

                  {/* Text meta column details */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-4xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>
                          {post.categories[0]?.name || 'Uncategorized'}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <i className="ri-time-line"></i> {post.readingTime || 3} min read
                        </span>
                      </div>
                      <Link href={`/posts/${post.slug}`} className="block group-hover:text-blue-600 transition-colors">
                        <h2 className="text-sm font-bold leading-snug dark:text-white line-clamp-2">
                          {post.title}
                        </h2>
                      </Link>
                      <p className="text-xxs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {post.excerpt || 'Read this incredible technical journal directly published inside OpenCMS.'}
                      </p>
                    </div>

                    {/* Author block details */}
                    <div className="border-t dark:border-slate-800 pt-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0 border border-slate-200 dark:border-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.author.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                          alt={post.author.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xxs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          {post.author.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'June 13, 2026'}
                        </p>
                      </div>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </StorefrontLayout>
  );
}
