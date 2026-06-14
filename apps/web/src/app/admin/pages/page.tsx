'use client';

import React, { useState, useEffect } from 'react';

interface PageModel {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  visibility: string;
  template: string;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  createdAt: string;
}

export default function PagesAdmin() {
  const [pages, setPages] = useState<PageModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Editor form state
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [template, setTemplate] = useState('default');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/pages?limit=100&_t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setPages(json.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditId(null);
    setTitle('');
    setSlug('');
    setContent('');
    setStatus('DRAFT');
    setVisibility('PUBLIC');
    setTemplate('default');
    setSeoTitle('');
    setSeoDescription('');
    setIsEditorOpen(true);
    setEditorTab('write');
  };

  const handleEdit = (page: PageModel) => {
    setEditId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content);
    setStatus(page.status);
    setVisibility(page.visibility);
    setTemplate(page.template);
    setSeoTitle(page.seoTitle || '');
    setSeoDescription(page.seoDescription || '');
    setIsEditorOpen(true);
    setEditorTab('write');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this static page?')) return;
    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setPages(pages.filter(p => p.id !== id));
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
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
      visibility,
      template,
      seoTitle: seoTitle || title,
      seoDescription,
    };

    try {
      const url = editId ? `/api/admin/pages/${editId}` : '/api/admin/pages';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setIsEditorOpen(false);
        fetchPages();
      } else {
        setError(json.message || 'Validation or database constraints error.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPages = pages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight dark:text-white">CMS Static Pages</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Publish modular custom static pages, layout landing blocks, and legal policies.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
        >
          <i className="ri-add-line text-sm"></i> Add New Page
        </button>
      </div>

      {/* Pages List View */}
      {!isEditorOpen && (
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 border px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 w-full max-w-md">
              <i className="ri-search-2-line text-slate-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search static pages by title or slug..."
                className="bg-transparent text-xs w-full focus:outline-none text-slate-600 dark:text-slate-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="text-xxs font-bold text-slate-400 whitespace-nowrap">{filteredPages.length} Pages Available</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Title</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Template</th>
                  <th className="p-4">Visibility</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 block">{page.title}</span>
                      <span className="text-3xs text-slate-400 block font-medium mt-0.5">Created on {new Date(page.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-500 dark:text-slate-400 text-xxs">/{page.slug}</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-3xs font-bold text-slate-600 dark:text-slate-300">{page.template}</span></td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">{page.visibility}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        page.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {page.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(page)}
                          className="h-8 w-8 rounded-lg border hover:bg-blue-50 dark:hover:bg-blue-950/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center justify-center transition-colors border-slate-200 dark:border-slate-800"
                        >
                          <i className="ri-pencil-line"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(page.id)}
                          className="h-8 w-8 rounded-lg border hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 dark:text-slate-300 hover:text-red-600 flex items-center justify-center transition-colors border-slate-200 dark:border-slate-800"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPages.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {loading ? 'Fetching pages...' : 'No static pages found in workspace database.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Responsive Immersive Split Visual/Markdown Editor */}
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
                {editId ? `Editing page: ${title}` : 'Create New Static Page'}
              </h2>
            </div>
            
            {/* Split Screen Tab selectors */}
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
            {/* Editor Workspace Column */}
            <div className={`flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-y-auto ${editorTab !== 'write' ? 'hidden lg:flex border-r dark:border-slate-800' : ''}`}>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xxs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <i className="ri-error-warning-line text-sm"></i>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Page Title</label>
                <input
                  type="text"
                  required
                  placeholder="Enter beautiful title e.g. Summer Clearance Sale"
                  className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Custom URL Slug</label>
                  <div className="flex border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 overflow-hidden items-center text-xs">
                    <span className="bg-slate-100 dark:bg-slate-900 px-3 py-2.5 border-r dark:border-slate-700 text-slate-400 text-xxs font-semibold">/</span>
                    <input
                      type="text"
                      placeholder="summer-clearance"
                      className="w-full bg-transparent px-3 py-1 focus:outline-none text-slate-800 dark:text-white font-mono"
                      value={slug}
                      onChange={e => setSlug(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Page Layout Template</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-700 dark:text-white"
                    value={template}
                    onChange={e => setTemplate(e.target.value)}
                  >
                    <option value="default">Default Content</option>
                    <option value="landing">Full Width Canvas</option>
                    <option value="minimal">Minimal Single-Col</option>
                  </select>
                </div>
              </div>

              {/* Rich visual markdown text writing canvas */}
              <div className="flex-1 flex flex-col space-y-1 min-h-[250px] lg:min-h-0">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Markdown Editor Content</label>
                  <span className="text-[10px] text-slate-400 font-semibold font-mono">Supports HTML elements</span>
                </div>
                <textarea
                  required
                  placeholder="# Hello World! \n\n This is markdown text."
                  className="w-full flex-1 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white font-mono resize-none leading-relaxed"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>

              {/* SEO Configurations Dropdown Card */}
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

            {/* Live Rendered Preview Column */}
            <div className={`flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-y-auto ${editorTab !== 'preview' ? 'hidden lg:flex' : ''}`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Live Canvas Rendering Preview</span>
              
              <div className="flex-1 rounded-xl p-6 bg-slate-100/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/80 overflow-y-auto prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{title || 'Your Title Goes Here'}</h1>
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
                  <div className="space-y-1">
                    <span className="text-3xs uppercase font-bold text-slate-400 block">Visibility</span>
                    <select
                      className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                      value={visibility}
                      onChange={e => setVisibility(e.target.value)}
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="PRIVATE">Private</option>
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
                    {saving ? 'Saving...' : editId ? 'Save Changes' : 'Publish Page'}
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
