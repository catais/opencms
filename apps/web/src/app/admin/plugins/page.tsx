'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface SettingsField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'boolean';
  defaultValue: string;
  helpText?: string;
}

interface Plugin {
  slug: string;
  name: string;
  description: string;
  version: string;
  author: string;
  isActive: boolean;
  settingsFields: SettingsField[];
  settings: Record<string, string>;
}

export default function PluginsAdmin() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings editing drawer state
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [drawerSettings, setDrawerSettings] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // ZIP Upload States
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchPlugins();
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
      await uploadPluginZip(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadPluginZip(file);
    }
  };

  const uploadPluginZip = async (file: File) => {
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

      const res = await fetch('/api/admin/plugins/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Plugin "${json.data.name}" uploaded, unpacked, and registered successfully!`);
        setTimeout(() => setSuccessMsg(null), 5000);
        fetchPlugins();
      } else {
        throw new Error(json.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to upload plugin package.');
    } finally {
      setUploading(false);
    }
  };

  const fetchPlugins = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/admin/plugins');
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to load plugin manifest registries');
      }
      const json = await res.json();
      if (json.success) {
        setPlugins(json.data || []);
      } else {
        throw new Error(json.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error occurred loading plugin registries');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlugin = async (slug: string, currentActive: boolean) => {
    try {
      setUpdatingSlug(slug);
      setErrorMsg(null);
      setSuccessMsg(null);

      const targetActive = !currentActive;

      const res = await fetch('/api/admin/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, isActive: targetActive }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Plugin "${json.data.name || slug}" ${targetActive ? 'activated' : 'deactivated'} successfully!`);
        setTimeout(() => setSuccessMsg(null), 4000);
        // Dispatch plugins changed event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('opencms_plugins_changed'));
        }
        fetchPlugins();
      } else {
        throw new Error(json.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error updating plugin state');
    } finally {
      setUpdatingSlug(null);
    }
  };

  const handleOpenSettings = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    // Combine defaults with existing saved database settings
    const initial: Record<string, string> = {};
    plugin.settingsFields.forEach(f => {
      initial[f.key] = plugin.settings[f.key] !== undefined ? plugin.settings[f.key] : f.defaultValue;
    });
    setDrawerSettings(initial);
  };

  const handleSettingChange = (key: string, value: string) => {
    setDrawerSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlugin) return;

    try {
      setSavingSettings(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch('/api/admin/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: selectedPlugin.slug,
          settings: drawerSettings,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Plugin configurations for "${selectedPlugin.name}" successfully updated!`);
        setTimeout(() => setSuccessMsg(null), 4000);
        // Dispatch plugins changed event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('opencms_plugins_changed'));
        }
        setSelectedPlugin(null);
        fetchPlugins();
      } else {
        throw new Error(json.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error saving plugin settings');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Area */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
          <i className="ri-plug-2-line text-blue-600 animate-pulse"></i>
          Plugins & Applications
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Toggle pre-installed hooks, modular storefront extensions, SEO builders, and payment gateway classes.
        </p>
      </div>

      {/* 2. Developer Upload Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
        <div className="lg:col-span-1 space-y-2">
          <span className="text-xxs font-extrabold uppercase tracking-wider px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md">
            Developer Desk
          </span>
          <h2 className="text-sm font-black text-slate-800 dark:text-white">Custom Plugins Portal</h2>
          <p className="text-xxs text-slate-500 leading-relaxed dark:text-slate-400">
            For local directory drop, drag your folder directly into:
            <br />
            <code className="font-mono bg-white dark:bg-slate-950 p-1 rounded border dark:border-slate-800 text-[10px] mt-1 inline-block break-all">
              packages/plugins/custom/&lt;plugin-slug&gt;/
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
            onClick={() => document.getElementById('plugin-zip-input')?.click()}
            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer text-center bg-white dark:bg-slate-950 h-full min-h-[120px] ${
              dragActive
                ? 'border-green-500 bg-green-500/5 ring-4 ring-green-500/5'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <input
              id="plugin-zip-input"
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
            />
            {uploading ? (
              <div className="space-y-2 py-2">
                <i className="ri-loader-4-line text-2xl text-green-600 animate-spin block"></i>
                <span className="text-xxs font-bold text-slate-600 dark:text-slate-400 block">Extracting and parsing package...</span>
              </div>
            ) : (
              <div className="space-y-1">
                <i className="ri-folder-zip-line text-2xl text-slate-400 dark:text-slate-500 block"></i>
                <span className="text-xxs font-black text-slate-700 dark:text-slate-300 block">
                  Drag and drop Plugin ZIP archive
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


      {/* 3. Plugins Grid List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading modules registry...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plugins.map(plugin => {
            const isLive = plugin.isActive;
            const updating = updatingSlug === plugin.slug;

            return (
              <div
                key={plugin.slug}
                className={`relative p-5 rounded-2xl border bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col justify-between space-y-4 ${
                  isLive
                    ? 'border-green-500/30 ring-1 ring-green-500/10 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Plugin Meta */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                        {plugin.name}
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-mono rounded text-slate-500">
                          v{plugin.version}
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Developer: <span className="font-semibold text-slate-500">{plugin.author}</span>
                      </p>
                    </div>

                    {/* Switch Toggle */}
                    <button
                      onClick={() => handleTogglePlugin(plugin.slug, isLive)}
                      disabled={updating}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isLive ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isLive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xxs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {plugin.description}
                  </p>
                </div>

                {/* Configurations triggers */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
                  <span className="text-[10px] uppercase font-extrabold tracking-wide flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                    {isLive ? 'Active & Hooked' : 'Inactive'}
                  </span>

                  <Link
                    href={`/admin/plugins/setup/${plugin.slug}`}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 border dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 text-xxs font-bold transition-colors flex items-center gap-1"
                  >
                    <i className="ri-equalizer-line text-xs text-blue-500"></i> Settings
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PLUGIN SETTINGS DRAWER OVERLAY */}
      {selectedPlugin && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedPlugin(null)} />
          
          <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl p-6 border-l dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-6 overflow-y-auto pr-1 flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <i className="ri-equalizer-line text-blue-600 animate-spin"></i> Module Configurations
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selectedPlugin.name}</p>
                </div>
                <button
                  onClick={() => setSelectedPlugin(null)}
                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100"
                >
                  <i className="ri-close-line text-slate-500"></i>
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
                {selectedPlugin.settingsFields.map(field => {
                  const currentValue = drawerSettings[field.key] !== undefined ? drawerSettings[field.key] : '';

                  return (
                    <div key={field.key} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">{field.label}</label>
                        <span className="text-[9px] font-mono text-slate-400">{field.key}</span>
                      </div>

                      {field.type === 'boolean' ? (
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleSettingChange(field.key, currentValue === 'true' ? 'false' : 'true')}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              currentValue === 'true' ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                currentValue === 'true' ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="ml-2.5 text-xxs font-semibold text-slate-500">
                            {currentValue === 'true' ? 'Yes, generate' : 'Disabled'}
                          </span>
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          value={currentValue}
                          onChange={(e) => handleSettingChange(field.key, e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono text-xxs text-slate-700 dark:text-slate-200"
                          placeholder={field.defaultValue}
                        />
                      )}

                      {field.helpText && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal italic">
                          {field.helpText}
                        </p>
                      )}
                    </div>
                  );
                })}

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 text-xxs flex items-center justify-center gap-1"
                >
                  {savingSettings ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i> Saving...
                    </>
                  ) : (
                    'Save configurations and apply settings'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
