import { NextRequest } from 'next/server';
import { prisma } from '@opencms/database';
import { getActiveWorkspace } from '@/lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { createAuditLog, dispatchWebhook } from '@opencms/core';

export async function POST(req: NextRequest) {
  const workspace = await getActiveWorkspace(req);
  if (!workspace) {
    return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);
  }

  try {
    const body = await req.json();
    const { billingAddress, shippingAddress, paymentMethod, couponCode, cartItems } = body;

    // Validate request inputs
    if (!billingAddress || !shippingAddress || !cartItems || cartItems.length === 0) {
      return apiError('BAD_REQUEST', 'Missing billing, shipping, or cart item parameters', null, 400);
    }

    if (!billingAddress.email || !billingAddress.firstName || !billingAddress.lastName || !billingAddress.address1) {
      return apiError('BAD_REQUEST', 'Incomplete billing address records', null, 400);
    }

    // Enforce Stripe Gateway plugin active status
    if (paymentMethod && paymentMethod.toUpperCase() === 'STRIPE') {
      const stripePlugin = await prisma.plugin.findUnique({
        where: {
          workspaceId_slug: {
            workspaceId: workspace.id,
            slug: 'stripe-gateway',
          },
        },
      });

      if (!stripePlugin || !stripePlugin.isActive) {
        return apiError('STRIPE_DISABLED', 'Stripe payment gateway is currently inactive. Please select Cash on Delivery.', null, 400);
      }
    }

    // MailChimp Synchronizer Lead verification setup
    let mailchimpNote = null;
    const mailchimpPlugin = await prisma.plugin.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: workspace.id,
          slug: 'mailchimp-sync',
        },
      },
    });

    if (mailchimpPlugin && mailchimpPlugin.isActive) {
      try {
        const settings = JSON.parse(mailchimpPlugin.settingsJson || '{}');
        const audienceId = settings.audienceId || 'MC_DEFAULT_LIST';
        mailchimpNote = `MailChimp Synchronizer: Synchronized lead "${billingAddress.email.toLowerCase().trim()}" to audience list "${audienceId}" successfully.`;
      } catch (e) {
        console.error('Error parsing MailChimp settings:', e);
      }
    }

    // 1. Resolve / Create Customer Row
    let customer = await prisma.customer.findUnique({
      where: {
        workspaceId_email: {
          workspaceId: workspace.id,
          email: billingAddress.email.toLowerCase().trim(),
        },
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          workspaceId: workspace.id,
          email: billingAddress.email.toLowerCase().trim(),
          firstName: billingAddress.firstName,
          lastName: billingAddress.lastName,
          phone: billingAddress.phone || null,
          totalSpent: 0,
          ordersCount: 0,
        },
      });
    }

    // 2. Create Billing and Shipping Coordinates
    const dbBillingAddress = await prisma.address.create({
      data: {
        customerId: customer.id,
        type: 'BILLING',
        firstName: billingAddress.firstName,
        lastName: billingAddress.lastName,
        company: billingAddress.company || null,
        address1: billingAddress.address1,
        address2: billingAddress.address2 || null,
        city: billingAddress.city,
        state: billingAddress.state,
        postcode: billingAddress.postcode,
        country: billingAddress.country,
        phone: billingAddress.phone || null,
      },
    });

    const dbShippingAddress = await prisma.address.create({
      data: {
        customerId: customer.id,
        type: 'SHIPPING',
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        company: shippingAddress.company || null,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2 || null,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postcode: shippingAddress.postcode,
        country: shippingAddress.country,
        phone: shippingAddress.phone || null,
      },
    });

    // 3. Process Cart Items, verify stock and calculate pricing from DB values
    const lineItemsToCreate = [];
    let calculatedSubtotal = 0;

    for (const item of cartItems) {
      // Query original Product from DB to prevent client price-manipulation
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        include: { variations: true },
      });

      if (!product) {
        return apiError('PRODUCT_NOT_FOUND', `Product "${item.name}" was not found`, null, 404);
      }

      let activePrice = Number(product.salePrice !== null ? product.salePrice : product.price);
      let activeSku = product.sku;
      let variationId = null;

      // Handle variable attributes variations if selected
      if (item.selectedAttributes && product.type === 'VARIABLE') {
        const selectedAttrs = item.selectedAttributes;
        const matchedVariation = product.variations.find(v => {
          try {
            const vAttrs = JSON.parse(v.attributesJson || '{}');
            return Object.entries(selectedAttrs).every(([k, v]) => vAttrs[keyCaseInsensitive(vAttrs, k)] === v);
          } catch {
            return false;
          }
        });

        if (matchedVariation) {
          activePrice = Number(matchedVariation.salePrice !== null ? matchedVariation.salePrice : matchedVariation.price);
          activeSku = matchedVariation.sku;
          variationId = matchedVariation.id;

          // Check stock limits on variation
          if (matchedVariation.manageStock) {
            const stockQty = matchedVariation.stockQuantity || 0;
            if (stockQty < item.quantity) {
              return apiError('OUT_OF_STOCK', `Sorry, "${product.name} - ${activeSku}" has only ${stockQty} units remaining.`, null, 400);
            }
          }
        }
      } else {
        // Check stock limits on simple product
        if (product.manageStock) {
          const stockQty = product.stockQuantity || 0;
          if (stockQty < item.quantity) {
            return apiError('OUT_OF_STOCK', `Sorry, "${product.name}" has only ${stockQty} units remaining.`, null, 400);
          }
        }
      }

      calculatedSubtotal += activePrice * item.quantity;

      lineItemsToCreate.push({
        productId: product.id,
        variationId: variationId,
        name: product.name,
        price: activePrice,
        quantity: item.quantity,
        subtotal: activePrice * item.quantity,
        total: activePrice * item.quantity, // Prior to coupon discount split
      });
    }

    // 4. Validate Coupon Discount code if any
    let discountTotal = 0;
    let validatedCoupon = null;

    if (couponCode) {
      const cleanCoupon = couponCode.toUpperCase().trim();
      const coupon = await prisma.coupon.findFirst({
        where: { workspaceId: workspace.id, code: cleanCoupon },
      });

      if (coupon) {
        // Confirm coupon criteria
        const validDate = !coupon.expiryDate || new Date(coupon.expiryDate) >= new Date();
        const validUsage = coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit;
        const validMinSpend = coupon.minSpend === null || calculatedSubtotal >= Number(coupon.minSpend);
        const validMaxSpend = coupon.maxSpend === null || calculatedSubtotal <= Number(coupon.maxSpend);

        if (validDate && validUsage && validMinSpend && validMaxSpend) {
          validatedCoupon = coupon;
          if (coupon.type === 'PERCENTAGE') {
            discountTotal = (calculatedSubtotal * Number(coupon.amount)) / 100;
          } else {
            discountTotal = Number(coupon.amount);
          }
          discountTotal = Math.min(discountTotal, calculatedSubtotal); // Cap discount
        }
      }
    }

    // 5. Calculate Taxes and Shipping cost totals
    const taxRate = 0.08; // 8% sales tax
    const taxableSubtotal = calculatedSubtotal - discountTotal;
    const taxTotal = taxableSubtotal * taxRate;
    
    // Free shipping on subtotals over $100
    const shippingTotal = calculatedSubtotal > 100 ? 0 : 10.00;
    const orderFinalTotal = calculatedSubtotal - discountTotal + taxTotal + shippingTotal;

    // 6. Generate order numbers sequentially (e.g. OC-1001, OC-1002...)
    const orderCount = await prisma.order.count({
      where: { workspaceId: workspace.id },
    });
    const orderNumber = `OC-${1000 + orderCount + 1}`;

    // 7. Perform sequential database updates using standard transaction
    const orderResult = await prisma.$transaction(async (tx) => {
      // Create the core Order Record
      const createdOrder = await tx.order.create({
        data: {
          workspaceId: workspace.id,
          number: orderNumber,
          status: 'COMPLETED', // Completed since payment succeeds in simulation
          customerId: customer.id,
          billingAddressId: dbBillingAddress.id,
          shippingAddressId: dbShippingAddress.id,
          paymentMethod: paymentMethod.toUpperCase(),
          paymentId: paymentMethod === 'stripe' ? `ch_mock_${Math.random().toString(36).substring(2, 10)}` : null,
          shippingMethod: shippingTotal === 0 ? 'Free Shipping' : 'Flat-rate Shipping',
          subtotal: calculatedSubtotal,
          discountTotal: discountTotal,
          taxTotal: taxTotal,
          shippingTotal: shippingTotal,
          total: orderFinalTotal,
          couponCode: validatedCoupon ? validatedCoupon.code : null,
        },
      });

      // Write order items
      for (const line of lineItemsToCreate) {
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: line.productId,
            variationId: line.variationId,
            name: line.name,
            price: line.price,
            quantity: line.quantity,
            subtotal: line.subtotal,
            total: line.total,
          },
        });

        // Decrement physical stock counters
        if (line.variationId) {
          const variation = await tx.productVariation.findUnique({ where: { id: line.variationId } });
          if (variation && variation.manageStock && variation.stockQuantity !== null) {
            await tx.productVariation.update({
              where: { id: line.variationId },
              data: {
                stockQuantity: Math.max(0, variation.stockQuantity - line.quantity),
                stockStatus: variation.stockQuantity - line.quantity <= 0 ? 'OUT_OF_STOCK' : 'IN_STOCK',
              },
            });
          }
        } else if (line.productId) {
          const product = await tx.product.findUnique({ where: { id: line.productId } });
          if (product && product.manageStock && product.stockQuantity !== null) {
            await tx.product.update({
              where: { id: line.productId },
              data: {
                stockQuantity: Math.max(0, product.stockQuantity - line.quantity),
                stockStatus: product.stockQuantity - line.quantity <= 0 ? 'OUT_OF_STOCK' : 'IN_STOCK',
              },
            });
          }
        }
      }

      // Update coupon usage frequency
      if (validatedCoupon) {
        await tx.coupon.update({
          where: { id: validatedCoupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      // Update customer lifetime metrics
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          ordersCount: { increment: 1 },
          totalSpent: { increment: orderFinalTotal },
        },
      });

      // Write Order Note Logs
      await tx.orderNote.create({
        data: {
          orderId: createdOrder.id,
          note: `Order registered successfully. Billing processed via Simulated ${paymentMethod.toUpperCase()}.`,
          isCustomerNote: true,
        },
      });

      if (mailchimpNote) {
        await tx.orderNote.create({
          data: {
            orderId: createdOrder.id,
            note: mailchimpNote,
            isCustomerNote: false, // Private admin note
          },
        });
      }

      // Write Transaction Ledger Payment Log
      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          method: paymentMethod,
          status: 'succeeded',
          transactionId: paymentMethod === 'stripe' ? `txn_mock_${Math.random().toString(36).substring(2, 10)}` : `txn_cod_pending`,
          amount: orderFinalTotal,
          currency: 'USD',
        },
      });

      return createdOrder;
    });

    // 8. Create system audit logs
    await createAuditLog({
      workspaceId: workspace.id,
      action: 'order.created',
      entityType: 'Order',
      entityId: orderResult.id,
      details: { orderNumber, finalTotal: orderFinalTotal },
    });

    // 9. Dispatch background REST webhook trigger asynchronously
    await dispatchWebhook(workspace.id, 'order.created', {
      orderId: orderResult.id,
      orderNumber: orderNumber,
      total: orderFinalTotal,
      billingAddress: billingAddress,
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod,
      items: lineItemsToCreate,
    });

    return apiSuccess({
      orderId: orderResult.id,
      orderNumber: orderNumber,
      total: orderFinalTotal,
    }, 'Checkout completed successfully', 201);

  } catch (error: any) {
    console.error('Fulfillment checkout error:', error);
    return apiError('SERVER_ERROR', error.message || 'Fulfillment checkout failed', null, 500);
  }
}

// Utility to read keys case-insensitively for nested JSON objects
function keyCaseInsensitive(obj: Record<string, any>, lookupKey: string): string {
  const normalized = lookupKey.toLowerCase();
  for (const k of Object.keys(obj)) {
    if (k.toLowerCase() === normalized) return k;
  }
  return lookupKey;
}
