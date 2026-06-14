'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function PluginConfigPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [drawerSettings, setDrawerSettings] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPlugin();
    }
  }, [slug]);

  const fetchPlugin = async () => {
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
        const found = (json.data || []).find((p: Plugin) => p.slug === slug);
        if (!found) {
          throw new Error(`Plugin with slug "${slug}" was not found.`);
        }
        setPlugin(found);

        // Combine defaults with existing saved database settings
        const initial: Record<string, string> = {};
        found.settingsFields.forEach((f: SettingsField) => {
          initial[f.key] = found.settings[f.key] !== undefined ? found.settings[f.key] : f.defaultValue;
        });
        setDrawerSettings(initial);
      } else {
        throw new Error(json.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error occurred loading plugin configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setDrawerSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plugin) return;

    try {
      setSavingSettings(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch('/api/admin/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: plugin.slug,
          settings: drawerSettings,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Plugin configurations for "${plugin.name}" successfully updated!`);
        setTimeout(() => setSuccessMsg(null), 4000);
        
        // Dispatch plugins changed event to reload sidebar dynamically
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('opencms_plugins_changed'));
        }
      } else {
        throw new Error(json.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error saving plugin settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <i className="ri-loader-4-line text-3xl text-blue-600 animate-spin"></i>
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading module configuration settings...</p>
      </div>
    );
  }

  if (errorMsg && !plugin) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-8">
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
          <i className="ri-error-warning-line text-lg"></i>
          <span className="font-semibold">{errorMsg}</span>
        </div>
        <Link
          href="/admin/plugins"
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-600"
        >
          <i className="ri-arrow-left-line"></i> Back to Plugins & Apps
        </Link>
      </div>
    );
  }

  if (!plugin) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumbs & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-900 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xxs font-bold text-slate-400 uppercase tracking-wider">
            <Link href="/admin/plugins" className="hover:text-blue-500 transition-colors">Plugins & Apps</Link>
            <i className="ri-arrow-right-s-line"></i>
            <span className="text-slate-500 dark:text-slate-300 truncate max-w-[200px]">{plugin.name}</span>
            <i className="ri-arrow-right-s-line"></i>
            <span className="text-blue-500">Setup</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <i className="ri-equalizer-line text-blue-600"></i>
            {plugin.name} Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
            Configure integration parameters, credentials, and behavioral hooks for this active module.
          </p>
        </div>
        <Link
          href="/admin/plugins"
          className="shrink-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/80 border dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-xxs font-bold transition-all flex items-center justify-center gap-1"
        >
          <i className="ri-arrow-left-line"></i> All Plugins
        </Link>
      </div>

      {/* Plugin Status Summary Panel */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 transition-all duration-300 ${
        plugin.isActive 
          ? 'border-green-500/20 ring-1 ring-green-500/5 bg-green-500/5 dark:bg-green-950/5' 
          : 'border-slate-200 dark:border-slate-800'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 dark:text-white">{plugin.name}</span>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-mono rounded text-slate-500">
              v{plugin.version}
            </span>
          </div>
          <p className="text-xxs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            {plugin.description}
          </p>
          <p className="text-[10px] text-slate-400">
            Developer: <span className="font-semibold text-slate-500">{plugin.author}</span>
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border dark:border-slate-800 shadow-xs">
          <span className={`h-2 w-2 rounded-full ${plugin.isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="text-xxs font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            {plugin.isActive ? 'Active & Hooked' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Success/Error Notifiers */}
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

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm p-6">
        <h2 className="text-sm font-black text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-900 pb-3 mb-5">
          Configuration Settings Fields
        </h2>

        {plugin.settingsFields.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            <i className="ri-settings-4-line text-2xl text-slate-300 dark:text-slate-700 block mb-2"></i>
            This plugin does not require any custom settings.
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
            {plugin.settingsFields.map(field => {
              const currentValue = drawerSettings[field.key] !== undefined ? drawerSettings[field.key] : '';

              return (
                <div key={field.key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">{field.label}</label>
                    <span className="text-[10px] font-mono text-slate-400">{field.key}</span>
                  </div>

                  {field.type === 'boolean' ? (
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleSettingChange(field.key, currentValue === 'true' ? 'false' : 'true')}
                        className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          currentValue === 'true' ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            currentValue === 'true' ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="ml-3 text-xxs font-extrabold text-slate-500">
                        {currentValue === 'true' ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      value={currentValue}
                      onChange={(e) => handleSettingChange(field.key, e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-mono text-xxs text-slate-700 dark:text-slate-200 transition-all"
                      placeholder={field.defaultValue || `Enter ${field.label.toLowerCase()}`}
                    />
                  )}

                  {field.helpText && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal italic pl-1">
                      {field.helpText}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-900 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 text-xxs flex items-center gap-1.5"
              >
                {savingSettings ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i> Saving...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line text-sm"></i> Save Configurations
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
