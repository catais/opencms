'use client';

import React, { useState, useEffect } from 'react';

interface Theme {
  slug: string;
  name: string;
  description: string;
  version: string;
  author: string;
  isActive: boolean;
  settings: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    headerStyle: 'sticky' | 'static' | 'minimal';
    footerColumns: number;
    showSidebarOnBlog: boolean;
  };
}

export default function ThemesAdmin() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingSlug, setActivatingSlug] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedThemeDetails, setSelectedThemeDetails] = useState<Theme | null>(null);

  // ZIP Upload States
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadThemeZip(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadThemeZip(file);
    }
  };

  const uploadThemeZip = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setErrorMsg('Only ZIP archives are supported.');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/themes/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Theme "${json.data.name}" uploaded, unpacked, and registered successfully!`);
        setTimeout(() => setSuccessMsg(null), 5000);
        fetchThemes();
      } else {
        throw new Error(json.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to upload theme package.');
    } finally {
      setUploading(false);
    }
  };

  const fetchThemes = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/admin/themes');
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to load theme repositories');
      }
      const json = await res.json();
      if (json.success) {
        setThemes(json.data || []);
      } else {
        throw new Error(json.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error occurred loading themes');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTheme = async (slug: string) => {
    try {
      setActivatingSlug(slug);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch('/api/admin/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Theme "${json.data.name || slug}" is now live across your storefront layout!`);
        setTimeout(() => setSuccessMsg(null), 4000);
        // Dispatch theme changed event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('opencms_theme_changed'));
        }
        // Refresh listings
        fetchThemes();
        if (selectedThemeDetails?.slug === slug) {
          setSelectedThemeDetails(prev => prev ? { ...prev, isActive: true } : null);
        }
      } else {
        throw new Error(json.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error activating theme');
    } finally {
      setActivatingSlug(null);
    }
  };

  // Mock theme screenshots mapped to gorgeous Unsplash layouts matching theme description!
  const themeScreenshots: Record<string, string> = {
    'minimal-saas': 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    'retro-coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    'dark-midnight': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Area */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
          <i className="ri-palette-line text-blue-600"></i>
          Themes Manager
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Swap and configure your public storefront templates. OpenCMS theme engines compile styles, header systems, and typography grids on the fly.
        </p>
      </div>

      {/* 2. Developer Upload Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
        <div className="lg:col-span-1 space-y-2">
          <span className="text-xxs font-extrabold uppercase tracking-wider px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
            Developer Desk
          </span>
          <h2 className="text-sm font-black text-slate-800 dark:text-white">Custom Extensions Portal</h2>
          <p className="text-xxs text-slate-500 leading-relaxed dark:text-slate-400">
            For local directory drop, drag your folder directly into:
            <br />
            <code className="font-mono bg-white dark:bg-slate-950 p-1 rounded border dark:border-slate-800 text-[10px] mt-1 inline-block break-all">
              packages/themes/custom/&lt;theme-slug&gt;/
            </code>
            <br />
            Ensure your folder has a valid <code className="font-mono text-slate-600 dark:text-slate-400">manifest.json</code> in its root. It will display here automatically!
          </p>
        </div>

        <div className="lg:col-span-2">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('theme-zip-input')?.click()}
            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer text-center bg-white dark:bg-slate-950 h-full min-h-[120px] ${
              dragActive
                ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/5'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <input
              id="theme-zip-input"
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
            />
            {uploading ? (
              <div className="space-y-2 py-2">
                <i className="ri-loader-4-line text-2xl text-blue-600 animate-spin block"></i>
                <span className="text-xxs font-bold text-slate-600 dark:text-slate-400 block">Extracting and parsing package...</span>
              </div>
            ) : (
              <div className="space-y-1">
                <i className="ri-folder-zip-line text-2xl text-slate-400 dark:text-slate-500 block"></i>
                <span className="text-xxs font-black text-slate-700 dark:text-slate-300 block">
                  Drag and drop Theme ZIP archive
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  or click to browse your desktop (ZIP format only)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Success/Error Notifiers */}
      {successMsg && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs rounded-xl flex items-center gap-2 animate-fadeIn shadow-sm">
          <i className="ri-checkbox-circle-line text-base"></i>
          <span className="font-semibold text-xxs">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 animate-fadeIn shadow-sm">
          <i className="ri-error-warning-line text-base"></i>
          <span className="font-semibold text-xxs">{errorMsg}</span>
        </div>
      )}


      {/* 3. Themes Grid Catalog */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading installed templates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map(theme => {
            const isLive = theme.isActive;
            const previewUrl = themeScreenshots[theme.slug] || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={theme.slug}
                className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 group bg-white dark:bg-slate-900 ${
                  isLive
                    ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-lg'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                {/* Screenshot Frame */}
                <div className="h-44 relative bg-slate-950 overflow-hidden shrink-0 border-b border-inherit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={theme.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  {isLive && (
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      Active Template
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-950/75 text-white text-[9px] font-mono rounded">
                    v{theme.version}
                  </div>
                </div>

                {/* Information Card */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white truncate">
                      {theme.name}
                    </h3>
                    <p className="text-xxs text-slate-400 dark:text-slate-500">
                      By <span className="font-semibold text-slate-500 dark:text-slate-400">{theme.author}</span>
                    </p>
                    <p className="text-xxs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {theme.description}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedThemeDetails(theme)}
                      className="flex-1 py-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-bold text-xxs transition-colors text-center"
                    >
                      Theme Options
                    </button>
                    {!isLive ? (
                      <button
                        onClick={() => handleActivateTheme(theme.slug)}
                        disabled={activatingSlug === theme.slug}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xxs transition-all shadow-sm shadow-blue-500/10 disabled:opacity-40"
                      >
                        {activatingSlug === theme.slug ? (
                          <span className="flex items-center justify-center gap-1">
                            <i className="ri-loader-4-line animate-spin"></i> Activating...
                          </span>
                        ) : (
                          'Activate Theme'
                        )}
                      </button>
                    ) : (
                      <div className="flex-1 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-center font-extrabold text-xxs rounded-lg cursor-default select-none">
                        Active & Live
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* THEME DETAIL OPTIONS OVERLAY */}
      {selectedThemeDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="h-14 border-b dark:border-slate-800 px-6 flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-slate-800 dark:text-white block">
                  Configuration Manifest
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{selectedThemeDetails.name}</span>
              </div>
              <button
                onClick={() => setSelectedThemeDetails(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-normal">
              {/* Color Swatch Card */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Style Compilation Scheme</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border dark:border-slate-800 rounded-xl flex items-center gap-2 bg-slate-50 dark:bg-slate-950">
                    <span
                      className="h-6 w-6 rounded-lg border dark:border-slate-800 shrink-0"
                      style={{ backgroundColor: selectedThemeDetails.settings.primaryColor }}
                    />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Primary</div>
                      <div className="font-mono text-xxs text-slate-600 dark:text-slate-400">{selectedThemeDetails.settings.primaryColor}</div>
                    </div>
                  </div>
                  <div className="p-3 border dark:border-slate-800 rounded-xl flex items-center gap-2 bg-slate-50 dark:bg-slate-950">
                    <span
                      className="h-6 w-6 rounded-lg border dark:border-slate-800 shrink-0"
                      style={{ backgroundColor: selectedThemeDetails.settings.secondaryColor }}
                    />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Secondary</div>
                      <div className="font-mono text-xxs text-slate-600 dark:text-slate-400">{selectedThemeDetails.settings.secondaryColor}</div>
                    </div>
                  </div>
                  <div className="p-3 border dark:border-slate-800 rounded-xl flex items-center gap-2 bg-slate-50 dark:bg-slate-950">
                    <span
                      className="h-6 w-6 rounded-lg border dark:border-slate-800 shrink-0"
                      style={{ backgroundColor: selectedThemeDetails.settings.backgroundColor }}
                    />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Background</div>
                      <div className="font-mono text-xxs text-slate-600 dark:text-slate-400">{selectedThemeDetails.settings.backgroundColor}</div>
                    </div>
                  </div>
                  <div className="p-3 border dark:border-slate-800 rounded-xl flex items-center gap-2 bg-slate-50 dark:bg-slate-950">
                    <span
                      className="h-6 w-6 rounded-lg border dark:border-slate-800 shrink-0"
                      style={{ backgroundColor: selectedThemeDetails.settings.textColor }}
                    />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Text Color</div>
                      <div className="font-mono text-xxs text-slate-600 dark:text-slate-400">{selectedThemeDetails.settings.textColor}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Parameters */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Advanced layout settings</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border dark:border-slate-800 rounded-xl overflow-hidden text-xxs bg-slate-50 dark:bg-slate-950/40">
                  <div className="p-3.5 flex justify-between items-center">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Font Families</span>
                    <span className="font-mono text-slate-500">{selectedThemeDetails.settings.fontFamily}</span>
                  </div>
                  <div className="p-3.5 flex justify-between items-center">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Header Display Format</span>
                    <span className="capitalize px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-slate-500">
                      {selectedThemeDetails.settings.headerStyle}
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between items-center">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Footer Navigation Columns</span>
                    <span className="font-bold font-mono text-slate-500">{selectedThemeDetails.settings.footerColumns} Columns</span>
                  </div>
                  <div className="p-3.5 flex justify-between items-center">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Blog Directory Sidebars</span>
                    <span className={`font-bold font-mono ${selectedThemeDetails.settings.showSidebarOnBlog ? 'text-green-600' : 'text-slate-400'}`}>
                      {selectedThemeDetails.settings.showSidebarOnBlog ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status footer button */}
              <div className="pt-2">
                {selectedThemeDetails.isActive ? (
                  <div className="p-3 text-center text-blue-500 bg-blue-500/5 rounded-xl border border-blue-500/10 font-bold select-none text-xxs">
                    This template is active and handling storefront render processes.
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleActivateTheme(selectedThemeDetails.slug);
                      setSelectedThemeDetails(null);
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all text-xxs shadow-md shadow-blue-500/20"
                  >
                    Activate {selectedThemeDetails.name} Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
