'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StorefrontLayout from '../../../components/StorefrontLayout';

interface OrderDetails {
  orderNumber: string;
  orderId: string;
  total: number;
  billingEmail: string;
  shippingMethod: string;
  billingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

export default function CheckoutSuccessPage() {
  const [order, setOrder] = useState<OrderDetails | null>(null);

  useEffect(() => {
    try {
      const storedOrder = localStorage.getItem('opencms_last_order');
      if (storedOrder) {
        setOrder(JSON.parse(storedOrder));
      }
    } catch (e) {
      console.error('Error fetching checkout success order:', e);
    }
  }, []);

  // Compute estimated delivery date (3-5 business days from now)
  const getDeliveryEstimation = () => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 4);
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <StorefrontLayout>
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8">
        
        {/* Success Banner Animation */}
        <div className="space-y-4">
          <div className="relative h-20 w-20 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center text-4xl mx-auto shadow-sm shadow-emerald-500/5">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-25" />
            <i className="ri-checkbox-circle-fill"></i>
          </div>
          <div className="space-y-1">
            <span className="text-xxs text-emerald-500 font-extrabold uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Payment Confirmed
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-3">
              Order Placed Successfully!
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Thank you for your purchase! Your order is successfully registered, stock limits are decremented, and your shipment has entered our fulfillment queue.
            </p>
          </div>
        </div>

        {order ? (
          /* Detailed order tracker card */
          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg p-6 text-left space-y-6">
              
              {/* Core tracking header grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b dark:border-slate-800 pb-5">
                <div className="space-y-1">
                  <p className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Order Number</p>
                  <p className="text-xs font-black text-slate-950 dark:text-white">{order.orderNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Fulfillment Date</p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Amount Paid</p>
                  <p className="text-xs font-black text-blue-600 dark:text-blue-400">${Number(order.total).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Delivery Carrier</p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{order.shippingMethod}</p>
                </div>
              </div>

              {/* Status and Estimation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                
                {/* Delivery details */}
                <div className="space-y-3">
                  <h3 className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest">
                    Shipping & Tracking Details
                  </h3>
                  <div className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <p className="flex items-center gap-1.5">
                      <i className="ri-truck-line text-slate-400 text-sm"></i>
                      <span>Status: <strong className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg text-xxs">Processing Shipment</strong></span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <i className="ri-calendar-line text-slate-400 text-sm"></i>
                      <span>Estimated Delivery: <strong>{getDeliveryEstimation()}</strong></span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <i className="ri-mail-line text-slate-400 text-sm"></i>
                      <span>Receipt sent to: <strong>{order.billingEmail}</strong></span>
                    </p>
                  </div>
                </div>

                {/* Billing details coordinates */}
                <div className="space-y-3">
                  <h3 className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest">
                    Billing Information
                  </h3>
                  <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border dark:border-slate-800">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {order.billingAddress.firstName} {order.billingAddress.lastName}
                    </p>
                    <p>{order.billingAddress.address1}</p>
                    <p>
                      {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postcode}
                    </p>
                    <p>{order.billingAddress.country}</p>
                  </div>
                </div>

              </div>

            </div>

            {/* Sandbox details info banner */}
            <div className="bg-blue-500/5 border border-blue-500/20 text-blue-500 rounded-2xl p-4 text-xs flex gap-3 text-left leading-relaxed">
              <i className="ri-information-line text-lg shrink-0"></i>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-800 dark:text-slate-100">Sandbox Log Summary:</p>
                <p>The checkout engine successfully processed this purchase against the local SQLite database container. Active webhook configurations are already notified with the corresponding <code>order.created</code> events.</p>
              </div>
            </div>
          </div>
        ) : (
          /* Backup/Fallback loader if no order in storage */
          <div className="p-8 border rounded-2xl bg-white/40 dark:bg-slate-900/40 text-center">
            <p className="text-xs text-slate-500">Retrieving order details from local sandboxed session...</p>
          </div>
        )}

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link
            href="/shop"
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs text-center transition-all shadow-md shadow-blue-600/20 hover:scale-[1.01] active:scale-[0.98]"
          >
            <i className="ri-shopping-bag-line"></i> Go back to Shop Catalog
          </Link>
          <Link
            href="/admin/orders"
            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl font-bold text-xs text-center transition-all"
          >
            <i className="ri-settings-line"></i> View Admin Orders
          </Link>
        </div>

      </div>
    </StorefrontLayout>
  );
}
