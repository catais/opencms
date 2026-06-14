'use client';

import React, { useState, useEffect } from 'react';

export default function SettingsAdmin() {
  const [settings, setSettings] = useState<Record<string, string>>({
    site_title: '',
    site_description: '',
    currency: 'USD',
    shipping_flat_rate: '10.00',
    tax_standard_rate: '0.0825',
    stripe_enabled: 'true',
    cod_enabled: 'true',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'commerce' | 'payment'>('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch configurations');
      }
      const json = await res.json();
      if (json.success) {
        setSettings(json.data || {});
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (json.success) {
        setSuccess('System configurations successfully saved and synchronized!');
        setTimeout(() => setSuccess(null), 4000);
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving configurations');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General Settings', icon: 'ri-window-line' },
    { id: 'commerce', name: 'Commerce & Shipping', icon: 'ri-shopping-basket-line' },
    { id: 'payment', name: 'Payment Gateways', icon: 'ri-bank-card-line' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* 1. Header Area */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
          <i className="ri-settings-4-line text-blue-600"></i>
          System Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure site-level meta tags, WooCommerce currency rules, flat-rate shipping classes, and sandbox Stripe payment gateways.
        </p>
      </div>

      {/* 2. Success/Error Toast Notifications */}
      {success && (
        <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400 text-xs flex items-center gap-2 animate-pulse">
          <i className="ri-checkbox-circle-line text-lg"></i>
          <span className="font-bold">{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 text-xs flex items-center gap-2">
          <i className="ri-alert-line text-lg"></i>
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* 3. Main Settings Shell */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Syncing active configurations...</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Left Vertical Tabs list */}
          <div className="w-full md:w-60 shrink-0 flex flex-row md:flex-col bg-slate-100 dark:bg-slate-900/40 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 overflow-x-auto gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === t.id
                    ? 'bg-white dark:bg-slate-850 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <i className={`${t.icon} text-base`}></i>
                <span className="hidden sm:inline whitespace-nowrap">{t.name}</span>
              </button>
            ))}
          </div>

          {/* Right Forms Field Area */}
          <form onSubmit={handleSubmit} className="flex-1 w-full p-6 border rounded-2xl border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-sm space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-white pb-2 border-b dark:border-slate-800">
                  General Configurations
                </h3>
                {/* Site Title */}
                <div className="space-y-1">
                  <label className="text-xxs font-black uppercase text-slate-400 tracking-wider">Site Title</label>
                  <input
                    type="text"
                    required
                    value={settings.site_title || ''}
                    onChange={e => handleFieldChange('site_title', e.target.value)}
                    placeholder="e.g. OpenCMS Storefront"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Used in HTML meta titles and notifications.</p>
                </div>

                {/* Site Description */}
                <div className="space-y-1">
                  <label className="text-xxs font-black uppercase text-slate-400 tracking-wider">Site Description</label>
                  <textarea
                    required
                    value={settings.site_description || ''}
                    onChange={e => handleFieldChange('site_description', e.target.value)}
                    placeholder="e.g. Modern WooCommerce + WordPress Replica"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                    rows={3}
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Provides SEO metadata descriptions for the public landing pages.</p>
                </div>
              </div>
            )}

            {activeTab === 'commerce' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-white pb-2 border-b dark:border-slate-800">
                  E-Commerce Setup
                </h3>
                {/* Currency */}
                <div className="space-y-1">
                  <label className="text-xxs font-black uppercase text-slate-400 tracking-wider">Base Store Currency</label>
                  <select
                    value={settings.currency || 'USD'}
                    onChange={e => handleFieldChange('currency', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 dark:text-white"
                  >
                    <option value="USD">United States Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                    <option value="JPY">Japanese Yen (¥)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sets pricing formats across public directories and storefront orders.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Shipping flat rate */}
                  <div className="space-y-1">
                    <label className="text-xxs font-black uppercase text-slate-400 tracking-wider">Flat Shipping Fee ($)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={settings.shipping_flat_rate || '10.00'}
                      onChange={e => handleFieldChange('shipping_flat_rate', e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Standard flat shipping surcharge added during checkout.</p>
                  </div>

                  {/* Standard Tax Rate */}
                  <div className="space-y-1">
                    <label className="text-xxs font-black uppercase text-slate-400 tracking-wider">Standard Tax Rate (Decimal)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="1"
                      step="0.0001"
                      value={settings.tax_standard_rate || '0.0825'}
                      onChange={e => handleFieldChange('tax_standard_rate', e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Standard VAT/Sales surcharge (e.g., 0.0825 maps to 8.25%).</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-white pb-2 border-b dark:border-slate-800">
                  Payment Gateways Configuration
                </h3>
                {/* Stripe Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/30">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                      <i className="ri-stripe-line text-blue-500"></i> Stripe Checkout API
                    </p>
                    <p className="text-[10px] text-slate-400">Accept credit and debit payments using a sandbox mock Stripe form.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.stripe_enabled === 'true'}
                      onChange={e => handleFieldChange('stripe_enabled', e.target.checked ? 'true' : 'false')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* COD Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/30">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                      <i className="ri-hand-coin-line text-blue-500"></i> Cash on Delivery (COD)
                    </p>
                    <p className="text-[10px] text-slate-400">Accept offline cash payments on package delivery.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.cod_enabled === 'true'}
                      onChange={e => handleFieldChange('cod_enabled', e.target.checked ? 'true' : 'false')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Actions Submit area */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-900 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line"></i> Save Configurations
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
