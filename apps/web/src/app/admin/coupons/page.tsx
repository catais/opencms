'use client';

import React, { useState, useEffect } from 'react';

interface Coupon {
  id: string;
  code: string;
  type: string;
  amount: number;
  expiryDate?: string | null;
  usageLimit?: number | null;
  usageCount: number;
  minSpend?: number | null;
  maxSpend?: number | null;
  individualUse: boolean;
  excludeSaleItems: boolean;
  createdAt: string;
}

export default function CouponsAdmin() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New Coupon Fields
  const [code, setCode] = useState('');
  const [type, setType] = useState('PERCENTAGE');
  const [amount, setAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [maxSpend, setMaxSpend] = useState('');
  const [individualUse, setIndividualUse] = useState(false);
  const [excludeSaleItems, setExcludeSaleItems] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/coupons');
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to load coupons');
      }
      const json = await res.json();
      if (json.success) {
        setCoupons(json.data || []);
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true);
    // Reset fields
    setCode('');
    setType('PERCENTAGE');
    setAmount('');
    setExpiryDate('');
    setUsageLimit('');
    setMinSpend('');
    setMaxSpend('');
    setIndividualUse(false);
    setExcludeSaleItems(false);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !amount) return;

    try {
      setSaving(true);
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          type,
          amount: parseFloat(amount),
          expiryDate: expiryDate || null,
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
          minSpend: minSpend ? parseFloat(minSpend) : null,
          maxSpend: maxSpend ? parseFloat(maxSpend) : null,
          individualUse,
          excludeSaleItems,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCoupons([json.data, ...coupons]);
        setIsDrawerOpen(false);
      } else {
        alert('Coupon generation failed: ' + json.message);
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while creating coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string, codeStr: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to deactivate and delete Coupon "${codeStr}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setCoupons(coupons.filter(c => c.id !== id));
      } else {
        alert('Failed to delete coupon: ' + json.message);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <i className="ri-coupon-3-line text-blue-600"></i>
            Vouchers & Coupons
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate percentage and fixed discount codes with custom spending parameters, usage counts, and expiration filters.
          </p>
        </div>
        <button
          onClick={handleOpenDrawer}
          className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <i className="ri-add-line font-black"></i> New Discount Code
        </button>
      </div>

      {/* 2. Coupons List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Syncing dynamic promotions registry...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400 text-xs">
          <i className="ri-alert-line mr-2"></i> {error}
        </div>
      ) : coupons.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20">
          <i className="ri-coupon-3-line text-4xl text-slate-300 dark:text-slate-700"></i>
          <p className="text-sm font-bold text-slate-500 mt-2">No promotional coupons created yet</p>
          <p className="text-xs text-slate-400 mt-1">Click the button in the top right to distribute your first promo code.</p>
        </div>
      ) : (
        <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xxs uppercase tracking-wider font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-950/50">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Formula</th>
                  <th className="py-3 px-4">Discount Magnitude</th>
                  <th className="py-3 px-4">Min Spend</th>
                  <th className="py-3 px-4">Usage Tracker</th>
                  <th className="py-3 px-4">Expires At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-300">
                {coupons.map(coupon => (
                  <tr key={coupon.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-extrabold font-mono text-xs border border-blue-100/50 dark:border-blue-900/30">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {coupon.type === 'PERCENTAGE' ? 'Percentage Off' : 'Flat Store Discount'}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-800 dark:text-slate-100">
                      {coupon.type === 'PERCENTAGE' ? `${coupon.amount}%` : `$${Number(coupon.amount).toFixed(2)}`}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-500">
                      {coupon.minSpend ? `$${Number(coupon.minSpend).toFixed(2)}` : <span className="text-slate-400 italic">No minimum</span>}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      <div>
                        <p>{coupon.usageCount} applied</p>
                        {coupon.usageLimit && (
                          <p className="text-xxs text-slate-400">Limit: {coupon.usageLimit} maximum</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {coupon.expiryDate ? (
                        new Date(coupon.expiryDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      ) : (
                        <span className="text-slate-400 italic">Never expires</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                        className="p-1 px-2.5 rounded-lg border border-red-150 hover:bg-red-50 dark:hover:bg-red-950/20 text-xxs font-bold text-red-600 dark:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. New Coupon Slide-Drawer Form */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop Blur */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleCloseDrawer}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 transition-all transform duration-300">
            {/* Header */}
            <div className="h-16 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between px-6 bg-slate-50/50 dark:bg-slate-900/40">
              <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <i className="ri-coupon-3-line text-blue-500"></i>
                Create Promotional Code
              </h2>
              <button
                onClick={handleCloseDrawer}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCoupon} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Code */}
              <div className="space-y-1">
                <label className="text-xxs font-black uppercase text-slate-400 tracking-wider">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER50"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 dark:text-white font-mono uppercase"
                />
              </div>

              {/* Type */}
              <div className="space-y-1">
                <label className="text-xxs font-black uppercase text-slate-400 tracking-wider">Discount Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 dark:text-white"
                >
                  <option value="PERCENTAGE">Percentage off cart subtotal</option>
                  <option value="FIXED_AMOUNT">Fixed cart discount amount ($)</option>
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xxs font-black uppercase text-slate-400 tracking-wider">
                  {type === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Fixed Amount ($)'}
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder={type === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 15.00'}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 dark:text-white"
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1">
                <label className="text-xxs font-black uppercase text-slate-400 tracking-wider">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 dark:text-white"
                />
              </div>

              {/* Usage Limit */}
              <div className="space-y-1">
                <label className="text-xxs font-black uppercase text-slate-400 tracking-wider">Usage Limit per coupon (Optional)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 100 uses"
                  value={usageLimit}
                  onChange={e => setUsageLimit(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Min Spend */}
                <div className="space-y-1">
                  <label className="text-xxs font-black uppercase text-slate-400 tracking-wider">Min Spend ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 50.00"
                    value={minSpend}
                    onChange={e => setMinSpend(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 dark:text-white"
                  />
                </div>

                {/* Max Spend */}
                <div className="space-y-1">
                  <label className="text-xxs font-black uppercase text-slate-400 tracking-wider">Max Spend ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 500.00"
                    value={maxSpend}
                    onChange={e => setMaxSpend(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 dark:text-white"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="pt-2 space-y-2.5 text-xs text-slate-650">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={individualUse}
                    onChange={e => setIndividualUse(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0 text-sm"
                  />
                  <span>Individual Use Only (Cannot merge with other codes)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeSaleItems}
                    onChange={e => setExcludeSaleItems(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0 text-sm"
                  />
                  <span>Exclude Sale Items (Applies to regular priced stock only)</span>
                </label>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="px-4 py-2 rounded-xl border border-slate-250 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !code.trim() || !amount}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Deploy Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
