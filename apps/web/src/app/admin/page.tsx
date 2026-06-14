'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Aggregates {
  totalRevenue: number;
  ordersCount: number;
  productsCount: number;
  postsCount: number;
  pagesCount: number;
}

interface RecentOrder {
  id: string;
  number: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
}

interface RecentActivity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  userName: string;
  details: any;
}

interface SalesChartData {
  day: string;
  revenue: number;
  orders: number;
}

interface SystemHealth {
  database: string;
  responseTime: string;
  uptime: string;
  webhookQueues: string;
  pluginsCount: number;
  themesCount: number;
}

interface StatsData {
  aggregates: Aggregates;
  recentOrders: RecentOrder[];
  recentActivity: RecentActivity[];
  salesChart: SalesChartData[];
  systemHealth: SystemHealth;
}

export default function AdminDashboard() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/stats?_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401) {
          setError('Unauthorized. Redirecting to login...');
          window.location.href = '/login';
          return;
        }
        if (res.status === 403) {
          setError('Forbidden. You do not have permissions to view this panel.');
          return;
        }
        throw new Error('Failed to load dashboard metrics');
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading your admin workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl max-w-2xl mx-auto my-10 space-y-4">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <i className="ri-error-warning-fill text-2xl"></i>
          <h2 className="text-lg font-bold">Dashboard Sync Error</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { aggregates, recentOrders, recentActivity, salesChart, systemHealth } = data;

  // Find max revenue for custom SVG graphing height scaler
  const maxRevenue = Math.max(...salesChart.map((d) => d.revenue), 100);

  // Status Badge Colors
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
      case 'PENDING':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
      case 'REFUNDED':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      default:
        return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight dark:text-white">Admin Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time workspace statistics, analytics, sales performance, and audit trails.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1 px-3.5 py-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
          >
            <i className="ri-refresh-line"></i> Refresh Stats
          </button>
          <Link
            href="/shop"
            target="_blank"
            className="flex items-center gap-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
          >
            <i className="ri-external-link-line"></i> Visit Storefront
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="border border-slate-100 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 h-20 w-20 rounded-full bg-blue-500/5 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <span className="text-xxs uppercase tracking-wider font-bold text-slate-400">Total Sales</span>
            <div className="h-8 w-8 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-lg"></i>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black dark:text-white">${aggregates.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-[10px] text-green-500 mt-1 font-semibold flex items-center gap-0.5">
              <i className="ri-arrow-right-up-line"></i> +12.4% vs last week
            </p>
          </div>
        </div>

        {/* Orders Count */}
        <div className="border border-slate-100 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 h-20 w-20 rounded-full bg-green-500/5 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <span className="text-xxs uppercase tracking-wider font-bold text-slate-400">Total Orders</span>
            <div className="h-8 w-8 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center">
              <i className="ri-shopping-cart-2-line text-lg"></i>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black dark:text-white">{aggregates.ordersCount}</h3>
            <p className="text-[10px] text-green-500 mt-1 font-semibold flex items-center gap-0.5">
              <i className="ri-arrow-right-up-line"></i> +4.1% vs last week
            </p>
          </div>
        </div>

        {/* Products */}
        <div className="border border-slate-100 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 h-20 w-20 rounded-full bg-indigo-500/5 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <span className="text-xxs uppercase tracking-wider font-bold text-slate-400">Active Products</span>
            <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
              <i className="ri-shopping-bag-line text-lg"></i>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black dark:text-white">{aggregates.productsCount}</h3>
            <p className="text-[10px] text-slate-400 mt-1">
              Active in catalog
            </p>
          </div>
        </div>

        {/* Blog Posts */}
        <div className="border border-slate-100 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 h-20 w-20 rounded-full bg-purple-500/5 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <span className="text-xxs uppercase tracking-wider font-bold text-slate-400">Blog Posts</span>
            <div className="h-8 w-8 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
              <i className="ri-article-line text-lg"></i>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black dark:text-white">{aggregates.postsCount}</h3>
            <p className="text-[10px] text-slate-400 mt-1">
              Published blog articles
            </p>
          </div>
        </div>

        {/* Static Pages */}
        <div className="border border-slate-100 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 h-20 w-20 rounded-full bg-orange-500/5 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <span className="text-xxs uppercase tracking-wider font-bold text-slate-400">Static Pages</span>
            <div className="h-8 w-8 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center">
              <i className="ri-file-copy-2-line text-lg"></i>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black dark:text-white">{aggregates.pagesCount}</h3>
            <p className="text-[10px] text-slate-400 mt-1">
              CMS site page models
            </p>
          </div>
        </div>
      </div>

      {/* 3. Analytics Chart & Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Sales Chart */}
        <div className="border border-slate-100 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold dark:text-white">Store Sales Aggregates</h3>
              <p className="text-xxs text-slate-400">Weekly sales breakdown chart based on active database checkouts</p>
            </div>
            <span className="text-xxs font-bold text-blue-500 px-2 py-1 bg-blue-50 dark:bg-blue-950/40 rounded-lg">Last 7 Days</span>
          </div>

          {/* Core SVG graph */}
          <div className="relative h-60 w-full flex items-end justify-between pt-6 border-b border-slate-100 dark:border-slate-800 pb-1 px-4">
            {salesChart.map((d, idx) => {
              // Calculate percentage height
              const heightPct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 80 + 10 : 10;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-3xs font-extrabold px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 flex flex-col items-center">
                    <span>Revenue: ${d.revenue.toFixed(2)}</span>
                    <span className="text-slate-400 font-semibold">{d.orders} orders</span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-8 sm:w-12 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg group-hover:from-blue-500 group-hover:to-indigo-400 transition-all duration-300 shadow-inner cursor-pointer" style={{ height: `${heightPct}%` }}></div>
                  
                  {/* Label */}
                  <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Health and Extension counts */}
        <div className="border border-slate-100 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="text-sm font-bold dark:text-white">Workspace Health & Systems</h3>
          <p className="text-xxs text-slate-400 -mt-2">Self-diagnostic microservices, plugin triggers, and active modules.</p>
          
          <div className="space-y-3.5 pt-2">
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Database Core</span>
              <span className="font-bold text-green-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                {systemHealth.database}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Core Response Time</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{systemHealth.responseTime}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Platform Uptime</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{systemHealth.uptime}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Webhook Deliveries Status</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{systemHealth.webhookQueues}</span>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-20">
                <span className="text-3xs text-slate-400 uppercase tracking-wider font-bold">Active Plugins</span>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black dark:text-white">{systemHealth.pluginsCount}</span>
                  <Link href="/admin/plugins" className="text-xxs text-blue-500 font-semibold hover:underline">Manage</Link>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-20">
                <span className="text-3xs text-slate-400 uppercase tracking-wider font-bold">Themes Installed</span>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black dark:text-white">{systemHealth.themesCount}</span>
                  <Link href="/admin/themes" className="text-xxs text-blue-500 font-semibold hover:underline">View</Link>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 4. Recent Orders & Audit Trail Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Orders Table widget */}
        <div className="border border-slate-100 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold dark:text-white">Recent Store Orders</h3>
            <Link href="/admin/orders" className="text-xxs text-blue-500 font-bold hover:underline">View all orders</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Order</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Total</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {recentOrders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer" onClick={() => window.location.href = `/admin/orders?id=${order.id}`}>
                    <td className="py-3 font-bold text-blue-600 dark:text-blue-400">{order.number}</td>
                    <td className="py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{order.customerName}</div>
                      <div className="text-[10px] text-slate-400">{order.customerEmail}</div>
                    </td>
                    <td className="py-3 font-black dark:text-white">${order.total.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">No orders found in workspace database.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs Widget */}
        <div className="border border-slate-100 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="text-sm font-bold dark:text-white">Recent System Audit Logs</h3>
          
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivity.map((log, idx) => (
                <li key={idx}>
                  <div className="relative pb-8">
                    {idx !== recentActivity.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100 dark:bg-slate-800" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-3 text-xs">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300">
                          <i className="ri-history-line"></i>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">
                            {log.action} <span className="font-normal text-slate-400">on</span> {log.entityType}
                          </p>
                          {log.details && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 bg-slate-50 dark:bg-slate-800/40 p-1 rounded font-mono truncate max-w-sm">
                              {JSON.stringify(log.details)}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap text-slate-400 font-bold self-start">
                          <time dateTime={log.createdAt}>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {recentActivity.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">No recent audits found.</div>
              )}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
