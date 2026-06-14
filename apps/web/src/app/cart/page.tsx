'use client';

import React, { useState, useEffect } from 'react';
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

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<CouponDetails | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Load cart and coupon from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = JSON.parse(localStorage.getItem('opencms_cart') || '[]');
      setCartItems(storedCart);

      const storedCoupon = localStorage.getItem('opencms_active_coupon');
      if (storedCoupon) {
        setCoupon(JSON.parse(storedCoupon));
      }
    } catch (e) {
      console.error('Error reading localStorage data:', e);
    }
  }, []);

  const saveCartToStorage = (newCart: CartItem[]) => {
    setCartItems(newCart);
    localStorage.setItem('opencms_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('opencms_cart_updated'));
  };

  const handleUpdateQuantity = (itemId: string, attributes: Record<string, string> | undefined, change: number) => {
    const updated = cartItems.map(item => {
      // Compare ID and selected attributes to uniquely identify items
      const matchesAttributes = !attributes || JSON.stringify(item.selectedAttributes) === JSON.stringify(attributes);
      if (item.id === itemId && matchesAttributes) {
        const newQty = item.quantity + change;
        return { ...item, quantity: newQty < 1 ? 1 : newQty };
      }
      return item;
    });
    saveCartToStorage(updated);
  };

  const handleRemoveItem = (itemId: string, attributes: Record<string, string> | undefined) => {
    const updated = cartItems.filter(item => {
      const matchesAttributes = !attributes || JSON.stringify(item.selectedAttributes) === JSON.stringify(attributes);
      return !(item.id === itemId && matchesAttributes);
    });
    saveCartToStorage(updated);
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your shopping cart?')) {
      saveCartToStorage([]);
      setCoupon(null);
      localStorage.removeItem('opencms_active_coupon');
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          subtotal: subtotalPrice,
        }),
      });

      const res = await response.json();

      if (!response.ok) {
        setCouponError(res.message || 'Failed to validate coupon.');
        setCoupon(null);
        localStorage.removeItem('opencms_active_coupon');
      } else {
        const couponData: CouponDetails = {
          code: res.data.code,
          type: res.data.type,
          amount: res.data.amount,
        };
        setCoupon(couponData);
        localStorage.setItem('opencms_active_coupon', JSON.stringify(couponData));
        setCouponSuccess(`Coupon "${couponData.code}" successfully applied!`);
        setCouponCode('');
      }
    } catch (err) {
      setCouponError('Network error. Please try again.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    localStorage.removeItem('opencms_active_coupon');
    setCouponSuccess('');
    setCouponError('');
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

  // Ensure discount doesn't exceed subtotal
  discountAmount = Math.min(discountAmount, subtotalPrice);

  const flatTaxRate = 0.08; // 8% sales tax
  const taxAmount = (subtotalPrice - discountAmount) * flatTaxRate;

  const flatShippingCost = subtotalPrice > 100 || subtotalPrice === 0 ? 0 : 10.00; // Free shipping over $100
  const finalTotalPrice = subtotalPrice - discountAmount + taxAmount + flatShippingCost;

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        
        {/* Page Header */}
        <div className="border-b dark:border-slate-800 pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Your Selection</span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">Shopping Cart</h1>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-xxs font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 bg-red-500/5 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20"
            >
              <i className="ri-delete-bin-line"></i> Clear Shopping Cart
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart View */
          <div className="py-24 max-w-lg mx-auto text-center space-y-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-10 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg">
            <div className="h-16 w-16 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner animate-bounce">
              <i className="ri-shopping-cart-2-line"></i>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold dark:text-white">Your cart is empty</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Looks like you haven't added any products to your cart yet. Head back to our catalog to discover incredible products and developer deals!
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <i className="ri-arrow-left-line"></i> Continue Shopping
            </Link>
          </div>
        ) : (
          /* Cart Grid Content */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Cart Items List Table (Left 8 Cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-slate-200/50 dark:border-slate-800/50 text-xxs font-extrabold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-6">Product Details</div>
                  <div className="col-span-2 text-center">Unit Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right font-bold">Line Total</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {cartItems.map((item, idx) => {
                    const itemPrice = item.salePrice !== null ? item.salePrice : item.price;
                    const lineTotal = itemPrice * item.quantity;

                    return (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center group">
                        
                        {/* Product Meta Column (Image + Title + Attributes) */}
                        <div className="col-span-6 flex gap-4 items-center">
                          <div className="h-16 w-16 rounded-xl bg-slate-100 dark:bg-slate-950 overflow-hidden relative border border-slate-200/50 dark:border-slate-800/50 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <Link href={`/products/${item.slug}`} className="text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate">
                              {item.name}
                            </Link>
                            {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(item.selectedAttributes).map(([key, val]) => (
                                  <span key={key} className="inline-flex px-1.5 py-0.5 rounded text-4xs font-bold uppercase tracking-tight bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                                    {key}: {val}
                                  </span>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={() => handleRemoveItem(item.id, item.selectedAttributes)}
                              className="text-xxs font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-0.5 pt-1"
                            >
                              <i className="ri-delete-bin-6-line"></i> Remove
                            </button>
                          </div>
                        </div>

                        {/* Price Column */}
                        <div className="col-span-2 text-left md:text-center flex justify-between md:block items-center">
                          <span className="md:hidden text-4xs font-bold text-slate-400 uppercase">Unit Price</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            ${itemPrice.toFixed(2)}
                            {item.salePrice !== null && (
                              <span className="text-4xs text-slate-400 line-through ml-1 block md:inline">
                                ${item.price.toFixed(2)}
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Quantity Adjusters */}
                        <div className="col-span-2 text-left md:text-center flex justify-between md:block items-center">
                          <span className="md:hidden text-4xs font-bold text-slate-400 uppercase">Quantity</span>
                          <div className="inline-flex items-center border dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.selectedAttributes, -1)}
                              className="px-2 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                              <i className="ri-subtract-line text-xxs"></i>
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.selectedAttributes, 1)}
                              className="px-2 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                              <i className="ri-add-line text-xxs"></i>
                            </button>
                          </div>
                        </div>

                        {/* Total Column */}
                        <div className="col-span-2 text-right flex justify-between md:block items-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/40">
                          <span className="md:hidden text-4xs font-bold text-slate-400 uppercase">Total</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-white">
                            ${lineTotal.toFixed(2)}
                          </span>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Promo Coupon Card */}
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm p-4">
                <h3 className="text-xs font-bold dark:text-white mb-2">Promotional Coupon Code</h3>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. SAVE20)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl text-xs px-3 py-2 w-full focus:outline-none text-slate-800 dark:text-slate-200 uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isValidatingCoupon}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/10 shrink-0"
                  >
                    {isValidatingCoupon ? (
                      <i className="ri-loader-4-line animate-spin"></i>
                    ) : (
                      'Apply Code'
                    )}
                  </button>
                </form>

                {/* Response Logs */}
                {couponError && (
                  <p className="text-xxs font-semibold text-red-500 mt-2 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i> {couponError}
                  </p>
                )}
                {couponSuccess && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 rounded-xl p-3 mt-3 flex justify-between items-center text-xxs font-semibold">
                    <span className="flex items-center gap-1">
                      <i className="ri-checkbox-circle-line"></i> {couponSuccess}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-400 font-bold uppercase tracking-tight text-3xs"
                    >
                      Remove Coupon
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Price Calculations Card (Right 4 Cols) */}
            <div className="lg:col-span-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-md p-6 space-y-6 sticky top-24">
              <h2 className="text-sm font-black dark:text-white uppercase tracking-wider border-b dark:border-slate-800 pb-3">Cart Summary</h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Cart Items Subtotal</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ${subtotalPrice.toFixed(2)}
                  </span>
                </div>

                {coupon && (
                  <div className="flex justify-between text-emerald-500 font-semibold">
                    <span>Discount Coupon ({coupon.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Sales Tax (8%)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ${taxAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Shipping Cost</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {flatShippingCost === 0 ? (
                      <span className="text-emerald-500 font-bold uppercase tracking-tight text-3xs bg-emerald-500/10 px-1.5 py-0.5 rounded">Free</span>
                    ) : (
                      `$${flatShippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>

                {flatShippingCost > 0 && (
                  <p className="text-4xs text-slate-400 italic bg-blue-500/5 p-2 rounded-lg border border-blue-500/10 leading-relaxed">
                    💡 Tip: Add another <strong>${(100 - subtotalPrice).toFixed(2)}</strong> to qualify for <strong>FREE SHIPPING!</strong>
                  </p>
                )}

                <div className="border-t dark:border-slate-800 pt-4 flex justify-between items-center text-sm font-black">
                  <span className="dark:text-white uppercase tracking-wider">Final Total</span>
                  <span className="text-lg text-blue-600 dark:text-blue-400 font-black">
                    ${finalTotalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs text-center transition-all shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.98]"
                >
                  Proceed to Checkout <i className="ri-arrow-right-line"></i>
                </Link>
                <Link
                  href="/shop"
                  className="w-full block py-3 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-500 hover:text-slate-700 dark:hover:text-white rounded-xl font-bold text-xxs text-center transition-all"
                >
                  <i className="ri-arrow-left-line"></i> Continue Shopping
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </StorefrontLayout>
  );
}
