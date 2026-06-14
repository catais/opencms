'use client';

import React, { useState, useEffect } from 'react';
import StorefrontLayout from '../../components/StorefrontLayout';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  total: number;
}

interface Address {
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
  paymentMethod: string;
  shippingMethod: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
  billingAddress: Address;
  shippingAddress: Address;
}

export default function AccountPage() {
  const [emailInput, setEmailInput] = useState('');
  const [activeEmail, setActiveEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [openOrderNumber, setOpenOrderNumber] = useState<string | null>(null);

  // Auto-load previously searched email if present in session
  useEffect(() => {
    const savedEmail = localStorage.getItem('opencms_customer_email');
    if (savedEmail) {
      setActiveEmail(savedEmail);
      setEmailInput(savedEmail);
      fetchOrders(savedEmail);
    }
  }, []);

  const fetchOrders = async (email: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`/api/account/orders?email=${encodeURIComponent(email)}`);
      const res = await response.json();
      if (!response.ok) {
        setErrorMsg(res.message || 'Retrieval failed.');
        setOrders([]);
      } else {
        setOrders(res.data);
        if (res.data.length > 0) {
          setOpenOrderNumber(res.data[0].number); // Auto-open latest order
        }
      }
    } catch (e) {
      setErrorMsg('Network error. Failed to retrieve orders.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setActiveEmail(emailInput);
    localStorage.setItem('opencms_customer_email', emailInput.trim());
    fetchOrders(emailInput.trim());
  };

  const handleLogout = () => {
    setActiveEmail('');
    setEmailInput('');
    setOrders([]);
    setOpenOrderNumber(null);
    localStorage.removeItem('opencms_customer_email');
  };

  const toggleCollapse = (orderNum: string) => {
    setOpenOrderNumber(prev => (prev === orderNum ? null : orderNum));
  };

  // Lifetime Stats
  const totalLifetimeSpend = orders.reduce((acc, o) => acc + o.total, 0);

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
    }
  };

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        
        {/* Header Block */}
        <div className="border-b dark:border-slate-800 pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Customer Portal</span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">My Orders & Accounts</h1>
          </div>
          {activeEmail && (
            <button
              onClick={handleLogout}
              className="text-xxs font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 bg-red-500/5 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20"
            >
              <i className="ri-logout-box-r-line"></i> Switch Email Account
            </button>
          )}
        </div>

        {!activeEmail ? (
          /* Email entry login card */
          <div className="max-w-md mx-auto text-center space-y-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-8 sm:p-10 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg">
            <div className="h-14 w-14 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-inner">
              <i className="ri-user-search-line animate-pulse"></i>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold dark:text-white">Track Your Purchases</h2>
              <p className="text-xxs text-slate-500 dark:text-slate-400 leading-relaxed">
                Enter the email address you specified during checkout to query your purchase metrics, billing coordinates, and live delivery tracking status.
              </p>
            </div>

            <form onSubmit={handleInquiry} className="space-y-4">
              <input
                type="email"
                required
                placeholder="customer@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full text-xs px-4 py-3 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 text-center"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl font-bold text-xs text-center transition-all shadow-md shadow-blue-500/15"
              >
                {isLoading ? <i className="ri-loader-4-line animate-spin text-sm"></i> : 'Retrieve Orders'}
              </button>
            </form>
          </div>
        ) : (
          /* Main Customer dashboard view */
          <div className="space-y-8 animate-fadeIn">
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <i className="ri-loader-4-line animate-spin text-lg text-blue-500"></i>
                <span>Retrieving billing data from SQLite...</span>
              </div>
            )}

            {/* Error notifications */}
            {errorMsg && (
              <div className="bg-red-500/5 border border-red-500/20 text-red-500 rounded-xl p-4 text-xs font-semibold flex items-center gap-1.5 max-w-md mx-auto">
                <i className="ri-error-warning-line"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {!isLoading && orders.length === 0 ? (
              /* No Purchases feedback block */
              <div className="py-16 max-w-md mx-auto text-center space-y-4 bg-white dark:bg-slate-900 border rounded-2xl p-8 shadow-sm">
                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto text-lg">
                  <i className="ri-shopping-cart-2-line"></i>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold dark:text-white">No purchase history found</p>
                  <p className="text-xxs text-slate-400 leading-relaxed">
                    No orders have been registered for email <strong className="text-slate-600 dark:text-slate-300">{activeEmail}</strong>. Place an order on the catalog first!
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xxs font-bold hover:bg-slate-200"
                >
                  Change Email Search
                </button>
              </div>
            ) : !isLoading && (
              /* Core Purchases Panels and Charts */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* 1. Lifetime Customer Metrics Cards (Left 3 Cols) */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white space-y-4 shadow-md">
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Customer Profile</p>
                    <div className="space-y-1 truncate">
                      <p className="text-sm font-black truncate">{orders[0]?.billingAddress.firstName} {orders[0]?.billingAddress.lastName}</p>
                      <p className="text-xxs font-mono opacity-80 truncate">{activeEmail}</p>
                    </div>
                  </div>

                  <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-4 shadow-sm">
                    <h3 className="text-xxs font-black text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2">Lifetime metrics</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                      <div className="space-y-0.5">
                        <p className="text-4xs text-slate-400 uppercase font-bold">Total Orders</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{orders.length}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-4xs text-slate-400 uppercase font-bold">Total Spent</p>
                        <p className="text-lg font-black text-blue-600 dark:text-blue-400">${totalLifetimeSpend.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Order History collapsible list feed (Right 9 Cols) */}
                <div className="lg:col-span-9 space-y-4">
                  <h3 className="text-xxs font-black text-slate-400 uppercase tracking-widest pl-1">Purchase Records History</h3>
                  
                  {orders.map((o) => {
                    const isOpen = openOrderNumber === o.number;
                    return (
                      <div
                        key={o.id}
                        className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                      >
                        {/* Collapsible header summary rail */}
                        <div
                          onClick={() => toggleCollapse(o.number)}
                          className="p-4 sm:p-5 flex justify-between items-center cursor-pointer select-none gap-4"
                        >
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
                            <span className="font-mono font-black text-xs text-slate-900 dark:text-white shrink-0">
                              {o.number}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className={`text-xxs font-extrabold uppercase px-2 py-0.5 rounded-lg shrink-0 ${getStatusStyle(o.status)}`}>
                              {o.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                              ${o.total.toFixed(2)}
                            </span>
                            <i className={`text-slate-400 dark:text-slate-500 text-lg transition-transform duration-200 ${isOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>
                          </div>
                        </div>

                        {/* Expandable Order Details Panel */}
                        {isOpen && (
                          <div className="border-t dark:border-slate-800 p-5 bg-slate-50/40 dark:bg-slate-950/40 space-y-6 animate-slideDown">
                            
                            {/* 1. Itemized Products receipt list */}
                            <div className="space-y-2">
                              <h4 className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Itemized Line Items</h4>
                              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 overflow-hidden text-xxs">
                                {o.items.map((it) => (
                                  <div key={it.id} className="p-3 flex justify-between items-center">
                                    <div className="space-y-0.5">
                                      <p className="font-bold text-slate-800 dark:text-slate-100">{it.name}</p>
                                      <p className="text-4xs text-slate-400">Qty: {it.quantity} x ${it.price.toFixed(2)}</p>
                                    </div>
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">${it.total.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 2. Billing / Shipping split panel details */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xxs leading-relaxed">
                              
                              {/* Shipping summary */}
                              <div className="space-y-2">
                                <h4 className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Fulfillment Method</h4>
                                <div className="space-y-1 text-slate-600 dark:text-slate-400">
                                  <p className="flex items-center gap-1">
                                    <i className="ri-truck-line text-slate-400"></i>
                                    <span>Method: <strong>{o.shippingMethod}</strong></span>
                                  </p>
                                  <p className="flex items-center gap-1">
                                    <i className="ri-money-dollar-circle-line text-slate-400"></i>
                                    <span>Gateway: <strong>{o.paymentMethod}</strong></span>
                                  </p>
                                </div>
                              </div>

                              {/* Shipping address coordinates */}
                              <div className="space-y-2">
                                <h4 className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Shipping Address</h4>
                                <div className="text-slate-600 dark:text-slate-400">
                                  <p className="font-bold text-slate-800 dark:text-slate-200">
                                    {o.shippingAddress.firstName} {o.shippingAddress.lastName}
                                  </p>
                                  <p>{o.shippingAddress.address1}</p>
                                  <p>{o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postcode}</p>
                                  <p>{o.shippingAddress.country}</p>
                                </div>
                              </div>

                              {/* Financial invoice break-downs */}
                              <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 text-xxs">
                                <div className="flex justify-between text-slate-500">
                                  <span>Subtotal:</span>
                                  <span>${o.subtotal.toFixed(2)}</span>
                                </div>
                                {o.discountTotal > 0 && (
                                  <div className="flex justify-between text-emerald-500 font-semibold">
                                    <span>Discount:</span>
                                    <span>-${o.discountTotal.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-slate-500">
                                  <span>Taxes:</span>
                                  <span>${o.taxTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                  <span>Shipping:</span>
                                  <span>${o.shippingTotal.toFixed(2)}</span>
                                </div>
                                <div className="border-t dark:border-slate-800 pt-2 flex justify-between font-black text-slate-800 dark:text-white">
                                  <span>Invoice Total:</span>
                                  <span className="text-xs text-blue-600 dark:text-blue-400 font-black">${o.total.toFixed(2)}</span>
                                </div>
                              </div>

                            </div>

                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </StorefrontLayout>
  );
}
