'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StorefrontLayout from '../../components/StorefrontLayout';

interface CartItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  imageUrl: string;
  quantity: number;
  selectedAttributes?: Record<string, string>;
}

interface CouponDetails {
  code: string;
  type: string;
  amount: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<CouponDetails | null>(null);
  const [isSameAddress, setIsSameAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cod'>('stripe');
  const [isStripeActive, setIsStripeActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [billing, setBilling] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'United States',
    phone: '',
  });

  const [shipping, setShipping] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'United States',
    phone: '',
  });

  // Credit Card Inputs (Simulated Stripe)
  const [ccNumber, setCcNumber] = useState('');
  const [ccExpiry, setCcExpiry] = useState('');
  const [ccCvv, setCcCvv] = useState('');

  // Load cart data
  useEffect(() => {
    try {
      const storedCart = JSON.parse(localStorage.getItem('opencms_cart') || '[]');
      if (storedCart.length === 0) {
        router.push('/shop'); // Send back if empty
        return;
      }
      setCartItems(storedCart);

      const storedCoupon = localStorage.getItem('opencms_active_coupon');
      if (storedCoupon) {
        setCoupon(JSON.parse(storedCoupon));
      }
    } catch (e) {
      console.error('Error fetching checkout cart:', e);
    }
  }, [router]);

  // Load active plugins to check Stripe status
  useEffect(() => {
    fetch('/api/plugins/active')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          const stripePlugin = json.data.find((p: any) => p.slug === 'stripe-gateway');
          if (stripePlugin) {
            setIsStripeActive(stripePlugin.isActive);
            if (!stripePlugin.isActive) {
              setPaymentMethod('cod'); // Fallback to Cash on Delivery
            }
          }
        }
      })
      .catch(err => console.error('Error fetching active plugins on checkout:', err));
  }, []);

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBilling(prev => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShipping(prev => ({ ...prev, [name]: value }));
  };

  // Calculations
  const subtotalPrice = cartItems.reduce((acc, item) => {
    const itemPrice = item.salePrice !== null ? item.salePrice : item.price;
    return acc + itemPrice * item.quantity;
  }, 0);

  let discountAmount = 0;
  if (coupon) {
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (subtotalPrice * coupon.amount) / 100;
    } else {
      discountAmount = coupon.amount;
    }
  }
  discountAmount = Math.min(discountAmount, subtotalPrice);

  const taxAmount = (subtotalPrice - discountAmount) * 0.08;
  const shippingAmount = subtotalPrice > 100 ? 0 : 10.00;
  const finalTotalPrice = subtotalPrice - discountAmount + taxAmount + shippingAmount;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!billing.firstName || !billing.lastName || !billing.email || !billing.address1 || !billing.city || !billing.postcode || !billing.phone) {
      setErrorMsg('Please complete all required fields in the Billing Address section.');
      return;
    }

    if (!isSameAddress) {
      if (!shipping.firstName || !shipping.lastName || !shipping.address1 || !shipping.city || !shipping.postcode) {
        setErrorMsg('Please complete all required fields in the Shipping Address section.');
        return;
      }
    }

    if (paymentMethod === 'stripe') {
      if (!ccNumber || !ccExpiry || !ccCvv) {
        setErrorMsg('Please supply Credit Card credentials for the simulated Stripe checkout.');
        return;
      }
    }

    setIsSubmitting(true);

    const billingData = billing;
    const shippingData = isSameAddress
      ? {
          firstName: billing.firstName,
          lastName: billing.lastName,
          company: billing.company,
          address1: billing.address1,
          address2: billing.address2,
          city: billing.city,
          state: billing.state,
          postcode: billing.postcode,
          country: billing.country,
          phone: billing.phone,
        }
      : shipping;

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingAddress: billingData,
          shippingAddress: shippingData,
          paymentMethod: paymentMethod,
          couponCode: coupon ? coupon.code : null,
          cartItems: cartItems,
        }),
      });

      const res = await response.json();

      if (!response.ok) {
        setErrorMsg(res.message || 'Fulfillment request failed. Please check stock limits.');
        setIsSubmitting(false);
      } else {
        // Successful checkout!
        localStorage.setItem(
          'opencms_last_order',
          JSON.stringify({
            orderNumber: res.data.orderNumber,
            orderId: res.data.orderId,
            total: res.data.total,
            billingEmail: billing.email,
            shippingMethod: shippingAmount === 0 ? 'Free Shipping' : 'Flat-rate Shipping',
            billingAddress: billingData,
          })
        );

        // Clean local cart
        localStorage.removeItem('opencms_cart');
        localStorage.removeItem('opencms_active_coupon');
        window.dispatchEvent(new Event('opencms_cart_updated'));

        // Delay redirect briefly to make loading overlay feel premium and stateful
        setTimeout(() => {
          router.push('/checkout/success');
        }, 1500);
      }
    } catch (err) {
      setErrorMsg('A connection error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        
        {/* Page Title */}
        <div className="border-b dark:border-slate-800 pb-6 mb-8">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Final Step</span>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">Fulfillment Checkout</h1>
        </div>

        {isSubmitting && (
          /* High Fidelity Processing Overlay */
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6 text-white text-center px-4">
            <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-blue-500/30 animate-spin">
              <i className="ri-loader-4-line"></i>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Processing Order Fulfillment</h2>
              <p className="text-xs text-slate-400 max-w-sm">
                We are validating inventory stock, executing database mutations, and firing off outgoing Webhook triggers...
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Checkout Form Inputs (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Billing Details Box */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-4">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2 mb-4">
                1. Billing Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={billing.firstName}
                    onChange={handleBillingChange}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={billing.lastName}
                    onChange={handleBillingChange}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={billing.email}
                    onChange={handleBillingChange}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={billing.phone}
                    onChange={handleBillingChange}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Company Name (Optional)</label>
                <input
                  type="text"
                  name="company"
                  value={billing.company}
                  onChange={handleBillingChange}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Street Address 1 *</label>
                  <input
                    type="text"
                    name="address1"
                    required
                    placeholder="House number and street name"
                    value={billing.address1}
                    onChange={handleBillingChange}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Apartment, Suite, Unit (Optional)</label>
                  <input
                    type="text"
                    name="address2"
                    placeholder="Apartment, suite, unit, etc."
                    value={billing.address2}
                    onChange={handleBillingChange}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Town / City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={billing.city}
                    onChange={handleBillingChange}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">State / Province</label>
                  <input
                    type="text"
                    name="state"
                    value={billing.state}
                    onChange={handleBillingChange}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Postcode / ZIP *</label>
                  <input
                    type="text"
                    name="postcode"
                    required
                    value={billing.postcode}
                    onChange={handleBillingChange}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Same address toggle */}
            <div className="flex items-center gap-2 bg-white/40 dark:bg-slate-900/40 p-4 rounded-xl border dark:border-slate-800">
              <input
                type="checkbox"
                id="sameAddress"
                checked={isSameAddress}
                onChange={() => setIsSameAddress(!isSameAddress)}
                className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="sameAddress" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                Shipping Address is the same as Billing Address
              </label>
            </div>

            {/* 2. Shipping Details Box */}
            {!isSameAddress && (
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-4 animate-fadeIn">
                <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2 mb-4">
                  2. Shipping Address
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={shipping.firstName}
                      onChange={handleShippingChange}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={shipping.lastName}
                      onChange={handleShippingChange}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Company Name (Optional)</label>
                  <input
                    type="text"
                    name="company"
                    value={shipping.company}
                    onChange={handleShippingChange}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Street Address 1 *</label>
                    <input
                      type="text"
                      name="address1"
                      required
                      value={shipping.address1}
                      onChange={handleShippingChange}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Apartment, Suite, Unit (Optional)</label>
                    <input
                      type="text"
                      name="address2"
                      value={shipping.address2}
                      onChange={handleShippingChange}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Town / City *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={shipping.city}
                      onChange={handleShippingChange}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">State / Province</label>
                    <input
                      type="text"
                      name="state"
                      value={shipping.state}
                      onChange={handleShippingChange}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Postcode / ZIP *</label>
                    <input
                      type="text"
                      name="postcode"
                      required
                      value={shipping.postcode}
                      onChange={handleShippingChange}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Secure Payment Gateways */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-4">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2 mb-4">
                3. Secure Payment Methods
              </h2>

              <div className="space-y-3">
                {/* Gateway Tab 1: Credit Card */}
                <div
                  onClick={() => isStripeActive && setPaymentMethod('stripe')}
                  className={`p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                    !isStripeActive
                      ? 'border-slate-100 dark:border-slate-900 bg-slate-100/50 dark:bg-slate-950/20 opacity-50 cursor-not-allowed'
                      : paymentMethod === 'stripe'
                      ? 'border-blue-600 bg-blue-500/5 dark:bg-blue-500/10 cursor-pointer'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer'
                  }`}
                >
                  <div className="mt-0.5">
                    <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'stripe' && isStripeActive ? 'border-blue-600 text-blue-600' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {paymentMethod === 'stripe' && isStripeActive && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold dark:text-white">Credit Card (Simulated Stripe)</span>
                      <div className="flex gap-1 text-slate-400 dark:text-slate-500 text-xs">
                        <i className="ri-visa-line"></i>
                        <i className="ri-mastercard-line"></i>
                        <i className="ri-credit-card-line"></i>
                      </div>
                    </div>
                    <p className="text-3xs text-slate-500 dark:text-slate-400">
                      Charge mock funds inside your offline sandboxing container. Safe and credentials-free.
                    </p>
                    {!isStripeActive && (
                      <p className="text-[10px] text-red-500 font-bold mt-1">
                        Disabled by administrators (Stripe Gateway inactive)
                      </p>
                    )}
                  </div>
                </div>

                {/* Gateway Tab 2: COD */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === 'cod'
                      ? 'border-blue-600 bg-blue-500/5 dark:bg-blue-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <div className="mt-0.5">
                    <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'cod' ? 'border-blue-600 text-blue-600' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {paymentMethod === 'cod' && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold dark:text-white">Cash on Delivery (COD)</span>
                    <p className="text-3xs text-slate-500 dark:text-slate-400">
                      Complete order immediately and pay at your doorstep when delivery shipment arrives.
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulated Stripe Credit Card Grid Details */}
              {paymentMethod === 'stripe' && (
                <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 space-y-4 animate-slideDown">
                  
                  {/* Premium credit card mockup widget */}
                  <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-2xl p-5 text-white space-y-8 relative overflow-hidden shadow-md max-w-sm mx-auto">
                    <div className="absolute -top-10 -right-10 h-32 w-32 bg-white/5 rounded-full blur-2xl" />
                    <div className="flex justify-between items-start">
                      <div className="h-8 w-11 bg-amber-400/20 border border-amber-400/30 rounded-lg backdrop-blur" />
                      <span className="font-extrabold text-sm tracking-widest italic opacity-80">STRIPE TEST</span>
                    </div>
                    <div className="space-y-4">
                      <p className="text-sm font-bold tracking-widest font-mono">
                        {ccNumber || '•••• •••• •••• ••••'}
                      </p>
                      <div className="flex justify-between text-4xs uppercase tracking-wider">
                        <div>
                          <p className="text-[7px] text-slate-300">Card Holder</p>
                          <p className="font-bold tracking-wide">
                            {billing.firstName ? `${billing.firstName} ${billing.lastName}` : 'YOUR NAME'}
                          </p>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <p className="text-[7px] text-slate-300">Expires</p>
                            <p className="font-bold">{ccExpiry || 'MM/YY'}</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-slate-300">CVV</p>
                            <p className="font-bold">{ccCvv || '•••'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                    <div className="sm:col-span-1.5 space-y-1">
                      <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Card Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="4242 4242 4242 4242"
                        value={ccNumber}
                        onChange={(e) => setCcNumber(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Expiration (MM/YY) *</label>
                      <input
                        type="text"
                        required
                        placeholder="12/28"
                        value={ccExpiry}
                        onChange={(e) => setCcExpiry(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider">CVV Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="123"
                        value={ccCvv}
                        onChange={(e) => setCcCvv(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Checkout Right Review Column (Right 5 Cols) */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">
            
            {/* Products Receipt Panel */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-md p-6 space-y-4">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2 mb-4">
                Fulfillment Summary
              </h2>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-60 overflow-y-auto pr-1 scrollbar-none">
                {cartItems.map((item, idx) => {
                  const itemPrice = item.salePrice !== null ? item.salePrice : item.price;
                  return (
                    <div key={idx} className="flex justify-between items-center py-3 text-xs gap-4">
                      <div className="flex gap-3 items-center min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-950 border overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                          <p className="text-4xs text-slate-400">
                            Qty: <strong className="text-slate-600 dark:text-slate-300">{item.quantity}</strong>
                            {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                              <span className="ml-1">
                                | {Object.entries(item.selectedAttributes).map(([k, v]) => `${k}:${v}`).join(', ')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 shrink-0">
                        ${(itemPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price break-downs */}
              <div className="border-t dark:border-slate-800 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">${subtotalPrice.toFixed(2)}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-emerald-500 font-semibold">
                    <span>Discount Coupon ({coupon.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Sales Tax (8%)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Shipping Cost</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {shippingAmount === 0 ? (
                      <span className="text-emerald-500 font-bold uppercase tracking-tight text-3xs bg-emerald-500/10 px-1.5 py-0.5 rounded">Free</span>
                    ) : (
                      `$${shippingAmount.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="border-t dark:border-slate-800 pt-3 flex justify-between items-center text-sm font-black">
                  <span className="dark:text-white uppercase tracking-wider">Order Total</span>
                  <span className="text-lg text-blue-600 dark:text-blue-400 font-black">
                    ${finalTotalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-500/5 border border-red-500/20 text-red-500 rounded-xl p-3 text-xxs font-semibold flex items-start gap-1.5 leading-relaxed">
                  <i className="ri-error-warning-line mt-0.5 shrink-0"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl font-bold text-xs text-center transition-all shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <i className="ri-shield-check-line text-sm"></i> Place Secure Order (${finalTotalPrice.toFixed(2)})
              </button>
              
              <Link
                href="/cart"
                className="w-full block py-3 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-500 hover:text-slate-700 dark:hover:text-white rounded-xl font-bold text-xxs text-center transition-all"
              >
                <i className="ri-arrow-left-line"></i> Back to Shopping Cart
              </Link>
            </div>
            
            {/* Safety guidelines trust box */}
            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border dark:border-slate-800 flex gap-3 text-4xs">
              <i className="ri-lock-password-line text-lg text-blue-500 shrink-0"></i>
              <div className="space-y-0.5 leading-relaxed text-slate-500 dark:text-slate-400">
                <p className="font-extrabold text-slate-700 dark:text-slate-200">SSL Secure Order Encryption</p>
                <p>All database modifications are secured under strict transaction lock isolation layers. We prioritize database integrity and transaction thread safety.</p>
              </div>
            </div>

          </div>

        </form>
      </div>
    </StorefrontLayout>
  );
}
