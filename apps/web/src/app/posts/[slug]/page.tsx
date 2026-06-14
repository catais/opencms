import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@opencms/database';
import StorefrontLayout from '../../../components/StorefrontLayout';

export const revalidate = 0; // Disable caching for blog updates

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // Resolve active default workspace
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

  // Fetch the article details
  const post = await prisma.post.findFirst({
    where: {
      workspaceId: workspace.id,
      slug: slug,
      status: 'PUBLISHED',
    },
    include: {
      author: {
        select: { name: true, avatarUrl: true, email: true },
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
  });

  if (!post) {
    return notFound();
  }

  // Fetch 3 other published posts for a "Related Articles" section at the bottom
  const relatedPosts = await prisma.post.findMany({
    where: {
      workspaceId: workspace.id,
      status: 'PUBLISHED',
      id: { not: post.id },
    },
    include: {
      author: {
        select: { name: true, avatarUrl: true },
      },
      categories: {
        select: { name: true },
      },
      featuredImage: {
        select: { url: true },
      },
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });

  // Simple Markdown content renderer for high-fidelity visual layout
  const renderContent = (contentStr: string) => {
    if (!contentStr) return null;
    const blocks = contentStr.split('\n\n');
    return blocks.map((block, idx) => {
      // Check for headings
      if (block.startsWith('# ')) {
        return <h1 key={idx} className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-6 mb-3 tracking-tight">{block.replace('# ', '')}</h1>;
      }
      if (block.startsWith('## ')) {
        return <h2 key={idx} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-5 mb-2 tracking-tight">{block.replace('## ', '')}</h2>;
      }
      if (block.startsWith('### ')) {
        return <h3 key={idx} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 tracking-tight">{block.replace('### ', '')}</h3>;
      }
      // Check for blockquotes
      if (block.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 border-blue-600 pl-4 italic text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-950/40 p-4 rounded-r-xl my-4 text-xs leading-relaxed">
            {block.replace('> ', '')}
          </blockquote>
        );
      }
      // Check for code block fences
      if (block.startsWith('```')) {
        const cleaned = block.replace(/```[a-zA-Z]*/, '').replace(/```$/, '').trim();
        return (
          <pre key={idx} className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xxs font-mono overflow-x-auto border border-slate-800 my-4 leading-relaxed scrollbar-none">
            <code>{cleaned}</code>
          </pre>
        );
      }
      // Check for bullet lists
      if (block.startsWith('- ') || block.startsWith('* ')) {
        const items = block.split('\n');
        return (
          <ul key={idx} className="list-disc list-inside space-y-1.5 text-xs text-slate-700 dark:text-slate-300 my-4 leading-relaxed pl-2">
            {items.map((item, i) => (
              <li key={i}>{item.replace(/^[-*]\s+/, '')}</li>
            ))}
          </ul>
        );
      }

      // Default paragraph layout
      return (
        <p key={idx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed my-4">
          {block}
        </p>
      );
    });
  };

  const defaultImage = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80';
  const featuredUrl = post.featuredImage?.url || defaultImage;

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 space-y-10">
        
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-xxs font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-wider">
          <i className="ri-arrow-left-line"></i> Back to Blog Directory
        </Link>

        {/* 1. Article Hero Banner */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xxs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              <span>{post.categories[0]?.name || 'Uncategorized'}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-400 dark:text-slate-500 flex items-center gap-0.5 font-semibold">
                <i className="ri-time-line"></i> {post.readingTime || 3} min read
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
              {post.title}
            </h1>
          </div>

          {/* Author info header */}
          <div className="flex items-center gap-3 bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border dark:border-slate-800/80">
            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0 border border-slate-200 dark:border-slate-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.author.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                alt={post.author.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-xxs leading-tight">
              <p className="font-bold text-slate-800 dark:text-slate-200">{post.author.name}</p>
              <p className="text-slate-400 mt-0.5">
                Published on{' '}
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'June 13, 2026'}
              </p>
            </div>
          </div>
        </div>

        {/* Big high quality hero graphic */}
        <div className="aspect-video w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-950 border dark:border-slate-800 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featuredUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 2. Article Reader Body (Glassmorphic Container) */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 sm:p-10 shadow-sm leading-relaxed prose dark:prose-invert max-w-none">
          {renderContent(post.content)}
        </div>

        {/* Tag list nodes */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-4xs font-bold text-slate-400 uppercase tracking-widest mr-1">Tagged:</span>
            {post.tags.map(tag => (
              <span key={tag.slug} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xxs font-bold rounded-lg tracking-tight">
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* 3. Related Articles Rail */}
        {relatedPosts.length > 0 && (
          <div className="border-t dark:border-slate-800 pt-10 space-y-6">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              More inside OpenCMS Chronicles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedPosts.map(rel => (
                <div key={rel.id} className="group space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="aspect-video bg-slate-100 dark:bg-slate-950 border dark:border-slate-800 rounded-xl overflow-hidden relative">
                      <Link href={`/posts/${rel.slug}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rel.featuredImage?.url || defaultImage}
                          alt={rel.title}
                          className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                      </Link>
                    </div>
                    <span className="inline-block text-4xs font-bold text-slate-400 uppercase tracking-wider">
                      {rel.categories[0]?.name || 'Platform'}
                    </span>
                    <Link href={`/posts/${rel.slug}`} className="block group-hover:text-blue-600 transition-colors">
                      <h4 className="text-xs font-bold leading-tight dark:text-white line-clamp-2">
                        {rel.title}
                      </h4>
                    </Link>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    By {rel.author.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </StorefrontLayout>
  );
}
