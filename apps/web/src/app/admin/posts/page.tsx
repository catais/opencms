'use client';

import React, { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface PostModel {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  excerpt?: string;
  readingTime: number;
  publishedAt?: string;
  createdAt: string;
  author: { name: string; email: string };
  categories: Category[];
  tags: Tag[];
}

export default function PostsAdmin() {
  const [posts, setPosts] = useState<PostModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [excerpt, setExcerpt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchTaxonomies();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/posts?limit=100&_t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setPosts(json.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxonomies = async () => {
    try {
      const res = await fetch(`/api/admin/posts/taxonomies?_t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setCategories(json.data.categories || []);
        setTags(json.data.tags || []);
      }
    } catch (err: any) {
      console.error('Error fetching taxonomies:', err);
    }
  };

  const handleCreateNew = () => {
    setEditId(null);
    setTitle('');
    setSlug('');
    setContent('');
    setStatus('DRAFT');
    setExcerpt('');
    setSeoTitle('');
    setSeoDescription('');
    setSelectedCategories([]);
    setSelectedTags([]);
    setIsEditorOpen(true);
    setEditorTab('write');
  };

  const handleEdit = (post: PostModel) => {
    setEditId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setContent(post.content);
    setStatus(post.status);
    setExcerpt(post.excerpt || '');
    setSeoTitle(post.title);
    setSeoDescription('');
    setSelectedCategories(post.categories.map(c => c.id));
    setSelectedTags(post.tags.map(t => t.id));
    setIsEditorOpen(true);
    setEditorTab('write');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setPosts(posts.filter(p => p.id !== id));
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryToggle = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      content,
      status,
      excerpt,
      seoTitle: seoTitle || title,
      seoDescription,
      categoryIds: selectedCategories,
      tagIds: selectedTags,
    };

    try {
      const url = editId ? `/api/admin/posts/${editId}` : '/api/admin/posts';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setIsEditorOpen(false);
        fetchPosts();
      } else {
        setError(json.message || 'Validation error. Verify fields match post model requirements.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight dark:text-white">Blog Publications</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Publish rich-markdown marketing articles, announcements, technical guides, and release notes.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
        >
          <i className="ri-add-line text-sm"></i> Write Article
        </button>
      </div>

      {/* Posts List View */}
      {!isEditorOpen && (
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 border px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 w-full max-w-md">
              <i className="ri-search-2-line text-slate-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search blog posts by title, slug, or keywords..."
                className="bg-transparent text-xs w-full focus:outline-none text-slate-600 dark:text-slate-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="text-xxs font-bold text-slate-400 whitespace-nowrap">{filteredPosts.length} Articles Published</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Article Details</th>
                  <th className="p-4">Taxonomies</th>
                  <th className="p-4">Read Time</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 max-w-sm">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 block truncate">{post.title}</span>
                      <span className="text-xxs text-slate-400 font-mono block mt-0.5 truncate">/{post.slug}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {post.categories.map((c) => (
                          <span key={c.id} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 text-[9px] font-bold rounded">
                            {c.name}
                          </span>
                        ))}
                        {post.tags.map((t) => (
                          <span key={t.id} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[9px] font-bold rounded">
                            #{t.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-semibold">{post.readingTime} min read</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{post.author?.name || 'Admin'}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{post.author?.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        post.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(post)}
                          className="h-8 w-8 rounded-lg border hover:bg-blue-50 dark:hover:bg-blue-950/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center justify-center transition-colors border-slate-200 dark:border-slate-800"
                        >
                          <i className="ri-pencil-line"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="h-8 w-8 rounded-lg border hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 dark:text-slate-300 hover:text-red-600 flex items-center justify-center transition-colors border-slate-200 dark:border-slate-800"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPosts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {loading ? 'Fetching posts...' : 'No published posts found in database.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full-Screen Immersive Markdown Split Editor */}
      {isEditorOpen && (
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-[78vh]">
          {/* Editor Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500"
              >
                <i className="ri-arrow-left-line"></i>
              </button>
              <h2 className="text-sm font-bold dark:text-white">
                {editId ? `Editing Post: ${title}` : 'Write New Blog Article'}
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                onClick={() => setEditorTab('write')}
                className={`px-3 py-1.5 text-3xs font-extrabold rounded-md uppercase tracking-wider transition-all ${
                  editorTab === 'write' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setEditorTab('preview')}
                className={`px-3 py-1.5 text-3xs font-extrabold rounded-md uppercase tracking-wider transition-all ${
                  editorTab === 'preview' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'
                }`}
              >
                Live Preview
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-hidden lg:flex-row">
            {/* Editor Input Panel */}
            <div className={`flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-y-auto ${editorTab !== 'write' ? 'hidden lg:flex border-r dark:border-slate-800' : ''}`}>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xxs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <i className="ri-error-warning-line text-sm"></i>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Article Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10 Reasons to Migrate to OpenCMS"
                  className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Custom URL Slug</label>
                  <div className="flex border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 overflow-hidden items-center text-xs">
                    <span className="bg-slate-100 dark:bg-slate-900 px-3 py-2.5 border-r dark:border-slate-700 text-slate-400 text-xxs font-semibold">/blog/</span>
                    <input
                      type="text"
                      placeholder="reasons-to-migrate"
                      className="w-full bg-transparent px-3 py-1 focus:outline-none text-slate-800 dark:text-white font-mono"
                      value={slug}
                      onChange={e => setSlug(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Short Excerpt Summary</label>
                  <input
                    type="text"
                    placeholder="Enter short engaging lead sentence for archives"
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                    value={excerpt}
                    onChange={e => setExcerpt(e.target.value)}
                  />
                </div>
              </div>

              {/* Taxonomies Grid selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Categories card selection */}
                <div className="border dark:border-slate-800 rounded-xl p-3 bg-slate-50/40 dark:bg-slate-950/20 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-500 block">Blog Categories</span>
                  <div className="max-h-24 overflow-y-auto space-y-1.5 pr-2">
                    {categories.map(c => (
                      <label key={c.id} className="flex items-center gap-2 text-xxs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-blue-600"
                          checked={selectedCategories.includes(c.id)}
                          onChange={() => handleCategoryToggle(c.id)}
                        />
                        <span>{c.name}</span>
                      </label>
                    ))}
                    {categories.length === 0 && <span className="text-3xs text-slate-400 block italic">No categories loaded.</span>}
                  </div>
                </div>

                {/* Tags card selection */}
                <div className="border dark:border-slate-800 rounded-xl p-3 bg-slate-50/40 dark:bg-slate-950/20 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-500 block">Blog Tags</span>
                  <div className="max-h-24 overflow-y-auto space-y-1.5 pr-2">
                    {tags.map(t => (
                      <label key={t.id} className="flex items-center gap-2 text-xxs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-blue-600"
                          checked={selectedTags.includes(t.id)}
                          onChange={() => handleTagToggle(t.id)}
                        />
                        <span>#{t.name}</span>
                      </label>
                    ))}
                    {tags.length === 0 && <span className="text-3xs text-slate-400 block italic">No tags loaded.</span>}
                  </div>
                </div>
              </div>

              {/* Core Content Box */}
              <div className="flex-1 flex flex-col space-y-1 min-h-[220px] lg:min-h-0">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Article Content (Markdown)</label>
                <textarea
                  required
                  placeholder="Write beautiful articles using Markdown..."
                  className="w-full flex-1 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white font-mono resize-none leading-relaxed"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>

              {/* SEO Subcard */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-500 flex items-center gap-1">
                  <i className="ri-google-line"></i> Meta SEO Configurations
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-3xs uppercase font-bold text-slate-400">SEO Custom Title</span>
                    <input
                      type="text"
                      placeholder="Title on Google Search"
                      className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-2 rounded-lg text-[11px] text-slate-700 dark:text-white"
                      value={seoTitle}
                      onChange={e => setSeoTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-3xs uppercase font-bold text-slate-400">SEO Custom Description</span>
                    <input
                      type="text"
                      placeholder="Google snippet meta summary description"
                      className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-2 rounded-lg text-[11px] text-slate-700 dark:text-white"
                      value={seoDescription}
                      onChange={e => setSeoDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Render Preview Panel */}
            <div className={`flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-y-auto ${editorTab !== 'preview' ? 'hidden lg:flex' : ''}`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Live Canvas Rendering Preview</span>
              
              <div className="flex-1 rounded-xl p-6 bg-slate-100/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/80 overflow-y-auto prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
                <div className="space-y-2">
                  <div className="flex gap-2 text-xxs font-bold text-slate-400 uppercase tracking-wider">
                    <span>{new Date().toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Admin</span>
                  </div>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{title || 'Your Article Title'}</h1>
                  {excerpt && <p className="text-slate-500 font-semibold italic text-xxs -mt-1">"{excerpt}"</p>}
                </div>
                <hr className="border-slate-200 dark:border-slate-800" />
                {content ? (
                  <div className="space-y-3 whitespace-pre-wrap font-sans">
                    {content}
                  </div>
                ) : (
                  <p className="italic text-slate-400">Type content in the editor to see it rendered instantly...</p>
                )}
              </div>

              {/* Status and Actions Bar */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-900 flex flex-wrap justify-between items-center gap-3 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-3xs uppercase font-bold text-slate-400 block">Status</span>
                    <select
                      className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10 flex items-center gap-1"
                  >
                    {saving ? 'Saving...' : editId ? 'Save Changes' : 'Publish Article'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
