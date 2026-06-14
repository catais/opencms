'use client';

import React, { useState, useEffect } from 'react';

interface OrderItem {
  id: string;
  productId?: string;
  variationId?: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  total: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    featuredImage?: {
      url: string;
    } | null;
  } | null;
}

interface OrderNote {
  id: string;
  note: string;
  isCustomerNote: boolean;
  createdAt: string;
}

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

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

interface Order {
  id: string;
  number: string;
  status: string;
  customerId: string;
  paymentMethod: string;
  paymentId?: string | null;
  shippingMethod?: string | null;
  total: number;
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
  couponCode?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  billingAddress?: Address | null;
  shippingAddress?: Address | null;
  items: OrderItem[];
  notes: OrderNote[];
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Order Drawer
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isCustomerNote, setIsCustomerNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders?limit=100&_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch orders');
      }
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (id: string) => {
    try {
      setDrawerLoading(true);
      const res = await fetch(`/api/admin/orders/${id}`);
      const json = await res.json();
      if (json.success) {
        setSelectedOrder(json.data);
      } else {
        alert('Failed to load order details: ' + json.message);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleOpenDetails = (id: string) => {
    setSelectedOrderId(id);
    fetchOrderDetails(id);
  };

  const handleCloseDrawer = () => {
    setSelectedOrderId(null);
    setSelectedOrder(null);
    setNewNote('');
    setIsCustomerNote(false);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedOrder) return;
    try {
      setUpdatingStatus(status);
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedOrder(json.data);
        // Refresh listing
        setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status } : o));
      } else {
        alert('Error updating status: ' + json.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newNote.trim()) return;

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newNote.trim(),
          isCustomerNote,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedOrder(json.data);
        setNewNote('');
        setIsCustomerNote(false);
      } else {
        alert('Error adding note: ' + json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateRefund = async () => {
    if (!selectedOrder) return;
    const confirmRefund = window.confirm(`Are you sure you want to simulate a full refund of $${Number(selectedOrder.total).toFixed(2)} for Order ${selectedOrder.number}?`);
    if (!confirmRefund) return;

    try {
      setUpdatingStatus('REFUNDING');
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REFUNDED',
          note: `Refund of $${Number(selectedOrder.total).toFixed(2)} was successfully processed via Simulated Stripe Gateway.`,
          isCustomerNote: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedOrder(json.data);
        setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'REFUNDED' } : o));
      } else {
        alert('Refund simulation failed: ' + json.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.number.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.firstName.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.lastName.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <i className="ri-bill-line text-blue-600"></i>
            Orders Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fulfill and refund customer orders, view detailed transaction receipts, and log private admin notes.
          </p>
        </div>
      </div>

      {/* 2. Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/60 dark:border-slate-800/50">
          <p className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Total Orders</p>
          <p className="text-xl font-extrabold mt-1">{orders.length}</p>
        </div>
        <div className="p-4 rounded-2xl border bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/60 dark:border-slate-800/50">
          <p className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Pending Fulfillment</p>
          <p className="text-xl font-extrabold text-amber-500 mt-1">
            {orders.filter(o => o.status === 'PENDING').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl border bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/60 dark:border-slate-800/50">
          <p className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Completed Sales</p>
          <p className="text-xl font-extrabold text-green-500 mt-1">
            {orders.filter(o => o.status === 'COMPLETED').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl border bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/60 dark:border-slate-800/50">
          <p className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Refunded/Cancelled</p>
          <p className="text-xl font-extrabold text-red-500 mt-1">
            {orders.filter(o => o.status === 'REFUNDED' || o.status === 'CANCELLED').length}
          </p>
        </div>
      </div>

      {/* 3. Filtering & Search Toolbar */}
      <div className="p-4 rounded-2xl border bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {['ALL', 'PENDING', 'COMPLETED', 'REFUNDED', 'CANCELLED'].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 border px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 dark:border-slate-800 w-full md:w-80">
          <i className="ri-search-2-line text-slate-400 text-sm"></i>
          <input
            type="text"
            placeholder="Search order number or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs w-full focus:outline-none text-slate-700 dark:text-slate-200"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <i className="ri-close-circle-fill text-slate-400 hover:text-slate-600 text-sm"></i>
            </button>
          )}
        </div>
      </div>

      {/* 4. Orders Table / Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Fetching order history...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400 text-xs">
          <i className="ri-alert-line mr-2"></i> {error}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20">
          <i className="ri-bill-line text-4xl text-slate-300 dark:text-slate-700"></i>
          <p className="text-sm font-bold text-slate-500 mt-2">No orders match your filters</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or tabs.</p>
        </div>
      ) : (
        <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xxs uppercase tracking-wider font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-950/50">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-300">
                {filteredOrders.map(order => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetails(order.id)}
                  >
                    <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                      {order.number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {order.customer.firstName} {order.customer.lastName}
                        </p>
                        <p className="text-xxs text-slate-400">{order.customer.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-medium uppercase text-slate-500">
                      {order.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-800 dark:text-slate-200">
                      ${Number(order.total).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xxs font-black border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenDetails(order.id)}
                        className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xxs font-bold text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Right Slide-Over Details Drawer */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop Blur */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleCloseDrawer}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 transition-all transform duration-300">
            {/* Header */}
            <div className="h-16 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between px-6 bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span className="text-blue-500">{selectedOrder?.number || '...'}</span> Details
                </h2>
                <p className="text-xxs text-slate-400 mt-0.5">
                  Placed on {selectedOrder ? new Date(selectedOrder.createdAt).toLocaleString() : '...'}
                </p>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            {/* Content Scroller */}
            {drawerLoading || !selectedOrder ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <div className="h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xxs text-slate-400">Syncing detailed receipt...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status Command Ribbon */}
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Current Status</p>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xxs font-black uppercase border ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  {/* Quick updates */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedOrder.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus('COMPLETED')}
                        disabled={!!updatingStatus}
                        className="px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xxs font-bold transition-all disabled:opacity-50"
                      >
                        {updatingStatus === 'COMPLETED' ? 'Updating...' : 'Mark Completed'}
                      </button>
                    )}
                    {selectedOrder.status === 'COMPLETED' && (
                      <button
                        onClick={handleSimulateRefund}
                        disabled={!!updatingStatus}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xxs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        <i className="ri-refund-2-line"></i> Refund Order
                      </button>
                    )}
                    {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'REFUNDED' && (
                      <button
                        onClick={() => handleUpdateStatus('CANCELLED')}
                        disabled={!!updatingStatus}
                        className="px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 text-xxs font-bold transition-all"
                      >
                        Cancel
                      </button>
                    )}
                    {selectedOrder.status === 'CANCELLED' && (
                      <button
                        onClick={() => handleUpdateStatus('PENDING')}
                        disabled={!!updatingStatus}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xxs font-bold transition-all"
                      >
                        Restore to Pending
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid Address and Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Customer Profile */}
                  <div className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                    <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Customer Info</p>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}
                      </p>
                      <p className="text-slate-500 flex items-center gap-1">
                        <i className="ri-mail-line"></i> {selectedOrder.customer.email}
                      </p>
                      {selectedOrder.customer.phone && (
                        <p className="text-slate-500 flex items-center gap-1">
                          <i className="ri-phone-line"></i> {selectedOrder.customer.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Billing Address */}
                  <div className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                    <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Shipping & Billing Address</p>
                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                      {selectedOrder.shippingAddress ? (
                        <>
                          <p className="font-bold">
                            {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                          </p>
                          {selectedOrder.shippingAddress.company && <p className="text-slate-500">{selectedOrder.shippingAddress.company}</p>}
                          <p className="text-slate-500">{selectedOrder.shippingAddress.address1}</p>
                          {selectedOrder.shippingAddress.address2 && <p className="text-slate-500">{selectedOrder.shippingAddress.address2}</p>}
                          <p className="text-slate-500">
                            {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postcode}
                          </p>
                          <p className="text-slate-500 uppercase">{selectedOrder.shippingAddress.country}</p>
                        </>
                      ) : (
                        <p className="text-slate-400 italic">No address provided</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Line Items Ordered */}
                <div className="space-y-2.5">
                  <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Line Items Ordered</p>
                  <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/20 dark:bg-slate-900/20">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="p-3.5 flex items-center gap-3 text-xs">
                        {/* Thumbnail */}
                        <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 border overflow-hidden">
                          {item.product?.featuredImage?.url ? (
                            <img
                              src={item.product.featuredImage.url}
                              alt={item.name}
                              className="object-cover h-full w-full"
                            />
                          ) : (
                            <i className="ri-shopping-bag-line text-lg text-slate-400"></i>
                          )}
                        </div>
                        {/* Detail columns */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                          <p className="text-xxs text-slate-400 mt-0.5">SKU: {item.product?.sku || 'N/A'}</p>
                        </div>
                        {/* Numbers */}
                        <div className="text-right">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            ${Number(item.price).toFixed(2)}
                          </p>
                          <p className="text-xxs text-slate-400 mt-0.5">Qty: {item.quantity}</p>
                        </div>
                        {/* Total */}
                        <div className="text-right pl-3">
                          <p className="font-extrabold text-slate-800 dark:text-slate-200">
                            ${Number(item.total).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Receipt Aggregates */}
                <div className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/10 dark:bg-slate-900/10 flex flex-col justify-end space-y-2 text-xs text-slate-500 pl-24 ml-auto max-w-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      ${Number(selectedOrder.subtotal).toFixed(2)}
                    </span>
                  </div>
                  {Number(selectedOrder.shippingTotal) > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping ({selectedOrder.shippingMethod || 'Flat Rate'})</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        +${Number(selectedOrder.shippingTotal).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {Number(selectedOrder.taxTotal) > 0 && (
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        +${Number(selectedOrder.taxTotal).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {Number(selectedOrder.discountTotal) > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</span>
                      <span className="font-bold">
                        -${Number(selectedOrder.discountTotal).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
                  <div className="flex justify-between text-sm text-slate-800 dark:text-white font-extrabold">
                    <span>Total Receipt</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      ${Number(selectedOrder.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Order Notes Logger Feed */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Order Logs & Notes</p>
                    <span className="text-xxs font-bold text-slate-400">
                      {selectedOrder.notes.length} log entries
                    </span>
                  </div>

                  {/* Note input form */}
                  <form onSubmit={handleAddNote} className="space-y-2.5">
                    <textarea
                      placeholder="Type a log message, refund description, or customer updates..."
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      required
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xxs text-slate-500">
                        <input
                          type="checkbox"
                          checked={isCustomerNote}
                          onChange={e => setIsCustomerNote(e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0"
                        />
                        <i className="ri-user-shared-line"></i> Customer Note (Visible on customer account)
                      </label>
                      <button
                        type="submit"
                        disabled={!newNote.trim()}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white hover:bg-slate-800 dark:hover:bg-white text-xxs font-bold disabled:opacity-50 transition-colors"
                      >
                        Append Note
                      </button>
                    </div>
                  </form>

                  {/* Notes Feed list */}
                  <div className="space-y-3 mt-4">
                    {selectedOrder.notes.map(note => (
                      <div
                        key={note.id}
                        className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
                          note.isCustomerNote
                            ? 'bg-blue-50/30 border-blue-100/60 dark:bg-blue-950/10 dark:border-blue-900/30'
                            : 'bg-slate-50/50 border-slate-100/60 dark:bg-slate-900/40 dark:border-slate-800/40'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xxs text-slate-400 font-bold">
                          <span className="flex items-center gap-1">
                            {note.isCustomerNote ? (
                              <span className="text-blue-500 font-black flex items-center gap-0.5">
                                <i className="ri-user-shared-line"></i> Customer Note
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-0.5">
                                <i className="ri-lock-line"></i> Private Staff Note
                              </span>
                            )}
                          </span>
                          <span>
                            {new Date(note.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                          {note.note}
                        </p>
                      </div>
                    ))}
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
