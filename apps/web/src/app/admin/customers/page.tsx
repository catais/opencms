'use client';

import React, { useState, useEffect } from 'react';

interface Address {
  id: string;
  type: string;
  firstName: string;
  lastName: string;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string | null;
}

interface OrderSummary {
  id: string;
  number: string;
  total: number;
  status: string;
  createdAt: string;
}

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  totalSpent: number;
  ordersCount: number;
  notes?: string | null;
  createdAt: string;
  addresses: Address[];
  orders: OrderSummary[];
}

export default function CustomersAdmin() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Profile Drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (searchQuery = '') => {
    try {
      setLoading(true);
      const url = searchQuery ? `/api/admin/customers?search=${encodeURIComponent(searchQuery)}` : '/api/admin/customers';
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to load customers');
      }
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data || []);
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchCustomers('');
  };

  const handleOpenCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setSelectedCustomer(customer);
  };

  const handleCloseDrawer = () => {
    setSelectedCustomerId(null);
    setSelectedCustomer(null);
  };

  // Metrics
  const totalspent = customers.reduce((sum, c) => sum + Number(c.totalSpent), 0);
  const totalorders = customers.reduce((sum, c) => sum + Number(c.ordersCount), 0);
  const averageSpent = customers.length > 0 ? (totalspent / customers.length) : 0;

  const getOrderStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200/50 dark:border-green-800/30';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30';
      case 'REFUNDED':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200/50 dark:border-red-800/30';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800/30 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Area */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
          <i className="ri-user-shared-line text-blue-600"></i>
          Customers Directory
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor storefront customer statistics, lifetime sales, and full customer billing addresses.
        </p>
      </div>

      {/* 2. Customer metrics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/60 dark:border-slate-800/50">
          <p className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Total Directory Users</p>
          <p className="text-xl font-extrabold mt-1">{customers.length}</p>
        </div>
        <div className="p-4 rounded-2xl border bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/60 dark:border-slate-800/50">
          <p className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Lifetime Sales Volume</p>
          <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            ${totalspent.toFixed(2)}
          </p>
        </div>
        <div className="p-4 rounded-2xl border bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/60 dark:border-slate-800/50">
          <p className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Average Customer Lifetime Value</p>
          <p className="text-xl font-extrabold text-green-500 mt-1">
            ${averageSpent.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 3. Search Bar */}
      <form onSubmit={handleSearchSubmit} className="p-4 rounded-2xl border bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 border px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 dark:border-slate-800 w-full sm:w-96">
          <i className="ri-search-2-line text-slate-400 text-sm"></i>
          <input
            type="text"
            placeholder="Search by first name, last name, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs w-full focus:outline-none text-slate-700 dark:text-slate-200"
          />
          {search && (
            <button type="button" onClick={handleClearSearch}>
              <i className="ri-close-circle-fill text-slate-400 hover:text-slate-600 text-sm"></i>
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all w-full sm:w-auto"
        >
          Query Search
        </button>
      </form>

      {/* 4. Customers Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading user directories...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400 text-xs">
          <i className="ri-alert-line mr-2"></i> {error}
        </div>
      ) : customers.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20">
          <i className="ri-user-shared-line text-4xl text-slate-300 dark:text-slate-700"></i>
          <p className="text-sm font-bold text-slate-500 mt-2">No customers found</p>
        </div>
      ) : (
        <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xxs uppercase tracking-wider font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-950/50">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Orders Count</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-300">
                {customers.map(customer => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => handleOpenCustomer(customer)}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-850 dark:text-white">
                      {customer.firstName} {customer.lastName}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-500 dark:text-slate-400">
                      {customer.email}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {customer.phone || <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                      {customer.ordersCount}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-800 dark:text-slate-100">
                      ${Number(customer.totalSpent).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenCustomer(customer)}
                        className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xxs font-bold text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Right Slide-Over customer profiles */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleCloseDrawer}
          />
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 transition-all transform duration-300">
            {/* Header */}
            <div className="h-16 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between px-6 bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <i className="ri-user-line text-blue-500"></i>
                  {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                </h2>
                <p className="text-xxs text-slate-400 mt-0.5">
                  Registered since {selectedCustomer ? new Date(selectedCustomer.createdAt).toLocaleDateString() : '...'}
                </p>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            {/* Profile body content */}
            {selectedCustomer && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Stats ribbon */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/40 dark:bg-slate-900/40">
                  <div>
                    <p className="text-xxs text-slate-450 font-bold uppercase tracking-wider">Lifetime Purchases</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
                      ${Number(selectedCustomer.totalSpent).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xxs text-slate-450 font-bold uppercase tracking-wider">Total Invoices</p>
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">
                      {selectedCustomer.ordersCount} orders
                    </p>
                  </div>
                </div>

                {/* Email details */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Contact Credentials</p>
                  <p className="flex items-center gap-1.5 mt-1 font-semibold">
                    <i className="ri-mail-line text-slate-400"></i> {selectedCustomer.email}
                  </p>
                  {selectedCustomer.phone && (
                    <p className="flex items-center gap-1.5 font-semibold">
                      <i className="ri-phone-line text-slate-400"></i> {selectedCustomer.phone}
                    </p>
                  )}
                </div>

                {/* Addresses */}
                <div className="space-y-2.5">
                  <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Address Book</p>
                  {selectedCustomer.addresses.length === 0 ? (
                    <p className="text-xxs text-slate-400 italic">No addresses saved for this customer.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {selectedCustomer.addresses.map(address => (
                        <div key={address.id} className="p-4 border rounded-xl border-slate-200/60 dark:border-slate-800/60 space-y-1 text-xs text-slate-500">
                          <p className="font-bold text-slate-850 dark:text-white flex items-center gap-1">
                            <i className="ri-map-pin-line text-blue-500"></i>
                            {address.type} Address ({address.firstName} {address.lastName})
                          </p>
                          {address.company && <p>{address.company}</p>}
                          <p>{address.address1}</p>
                          {address.address2 && <p>{address.address2}</p>}
                          <p>{address.city}, {address.state} {address.postcode}</p>
                          <p className="uppercase">{address.country}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Purchase history */}
                <div className="space-y-3">
                  <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Order History Logs</p>
                  {selectedCustomer.orders.length === 0 ? (
                    <p className="text-xxs text-slate-450 italic">No past transactions registered.</p>
                  ) : (
                    <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/20 dark:bg-slate-900/20">
                      {selectedCustomer.orders.map(order => (
                        <div key={order.id} className="p-3.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/50" onClick={() => window.location.href = `/admin/orders`}>
                          <div>
                            <p className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                              {order.number}
                            </p>
                            <p className="text-xxs text-slate-400 mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-slate-850 dark:text-white">
                              ${Number(order.total).toFixed(2)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xxs font-black uppercase border tracking-wider ${getOrderStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Internal notes */}
                <div className="space-y-2">
                  <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Staff Administrative Notes</p>
                  <div className="p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/30 bg-amber-50/15 dark:bg-amber-950/5 text-xs text-slate-650 leading-relaxed font-medium">
                    {selectedCustomer.notes || "No internal staff notes compiled for this directory profile."}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
