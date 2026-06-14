'use client';

import React, { useState, useEffect } from 'react';

interface MediaModel {
  id: string;
  name: string;
  url: string;
  path: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  altText?: string;
  createdAt: string;
}

export default function MediaAdmin() {
  const [mediaItems, setMediaItems] = useState<MediaModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaModel | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/media?limit=100');
      const json = await res.json();
      if (json.success) {
        setMediaItems(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setMediaItems([json.data, ...mediaItems]);
        setSelectedItem(json.data); // Inspect the newly uploaded file instantly
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this media file?')) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMediaItems(mediaItems.filter(m => m.id !== id));
        setSelectedItem(null);
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredItems = mediaItems.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.path.toLowerCase().includes(search.toLowerCase())
  );

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight dark:text-white">Media Assets Library</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload images, track asset dimensions, copy system paths, and reference themes.
          </p>
        </div>
        
        {/* Upload Button overlaying file picker */}
        <label className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-blue-600/10">
          <i className="ri-upload-cloud-line text-sm"></i>
          <span>{uploading ? 'Uploading...' : 'Upload New File'}</span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            disabled={uploading}
            onChange={handleFileUpload}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Main Explorer Grid */}
        <div className="lg:col-span-3 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm p-4 space-y-4">
          
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 border px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 w-full max-w-sm">
              <i className="ri-search-2-line text-slate-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search assets by file name or path..."
                className="bg-transparent text-xs w-full focus:outline-none text-slate-600 dark:text-slate-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider">{filteredItems.length} assets found</span>
          </div>

          {/* Grid explorer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2 pb-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`group relative aspect-square border rounded-2xl overflow-hidden cursor-pointer transition-all ${
                  selectedItem?.id === item.id
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <img
                  src={item.url}
                  alt={item.name}
                  className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300 bg-slate-50 dark:bg-slate-950"
                />
                
                {/* Meta details overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <p className="text-[10px] font-bold text-white truncate">{item.name}</p>
                  <p className="text-[8px] text-slate-300 mt-0.5">{formatBytes(item.size)}</p>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                <i className="ri-image-add-line text-3xl text-slate-300"></i>
                <span>{loading ? 'Scanning disk file systems...' : 'No media assets found in workspace.'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Detail slide drawer (Right Column Card) */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm p-4 space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">File Inspector Pane</h3>
          
          {selectedItem ? (
            <div className="space-y-4 text-xs">
              {/* Thumbnail */}
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <img src={selectedItem.url} alt={selectedItem.name} className="object-contain h-full w-full mx-auto" />
              </div>

              {/* Attributes lists */}
              <div className="space-y-2.5 pt-1">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">File Name</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 block break-all font-mono text-[11px]">{selectedItem.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">File Size</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">{formatBytes(selectedItem.size)}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dimensions</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">{selectedItem.width || 800} x {selectedItem.height || 600} px</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MIME Type</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 block font-mono text-[11px]">{selectedItem.mimeType}</span>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                {/* Copy Paths widgets */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Local Reference Path</span>
                    <div className="flex border rounded-xl overflow-hidden text-[11px] font-mono bg-slate-50 dark:bg-slate-800 dark:border-slate-700 items-center justify-between pl-3 pr-1 py-1">
                      <span className="truncate text-slate-500 max-w-[130px]">{selectedItem.path}</span>
                      <button
                        onClick={() => handleCopy(selectedItem.path, 'path')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-lg text-slate-500 font-bold border dark:border-slate-700 flex items-center gap-1 font-sans"
                      >
                        {copiedId === 'path' ? <i className="ri-check-line text-green-500"></i> : <i className="ri-file-copy-2-line"></i>}
                        <span className="text-[9px] uppercase font-bold">{copiedId === 'path' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Static Public URL</span>
                    <div className="flex border rounded-xl overflow-hidden text-[11px] font-mono bg-slate-50 dark:bg-slate-800 dark:border-slate-700 items-center justify-between pl-3 pr-1 py-1">
                      <span className="truncate text-slate-500 max-w-[130px]">{selectedItem.url}</span>
                      <button
                        onClick={() => handleCopy(selectedItem.url, 'url')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-lg text-slate-500 font-bold border dark:border-slate-700 flex items-center gap-1 font-sans"
                      >
                        {copiedId === 'url' ? <i className="ri-check-line text-green-500"></i> : <i className="ri-file-copy-2-line"></i>}
                        <span className="text-[9px] uppercase font-bold">{copiedId === 'url' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleDeleteItem(selectedItem.id)}
                    className="w-full flex items-center justify-center gap-1 py-2 border border-red-200 hover:border-red-300 hover:bg-red-50 dark:border-red-950 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl font-bold transition-all text-xxs"
                  >
                    <i className="ri-delete-bin-fill text-xs"></i> Delete Permanent Asset
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs italic">
              Select an asset from the library to inspect dimensions, metadata properties, and copy reference path keys...
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
