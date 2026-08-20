import { NextResponse } from 'next/server';
import { getProductBySlug, getPaymentMethods, createOrder, deductUserWallet } from '@/lib/db/store';
import { validateTargetAccount } from '@/lib/mock/aggregators';
import { Order } from '@/lib/types';
import { enqueueFulfillmentJob } from '@/lib/db/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      productSlug,
      skuId,
      targetAccountPayload,
      paymentMethodId,
      customerEmail,
      customerPhone,
      userId
    } = body;

    // 1. Validation
    if (!productSlug || !skuId || !targetAccountPayload || !paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields' },
        { status: 400 }
      );
    }

    if (!customerEmail || !customerEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required for receipt delivery' },
        { status: 400 }
      );
    }

    const product = getProductBySlug(productSlug);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const sku = product.skus.find(s => s.id === skuId);
    if (!sku || !sku.isAvailable) {
      return NextResponse.json(
        { success: false, error: 'Selected denomination/SKU is unavailable' },
        { status: 400 }
      );
    }

    const paymentMethods = getPaymentMethods();
    const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // 2. Validate target account
    const validationResult = await validateTargetAccount(productSlug, targetAccountPayload);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.errorMessage || 'Invalid in-game account details' },
        { status: 400 }
      );
    }

    // 3. Calculate Fee and Totals
    const subtotal = sku.sellingPrice;
    const fee = Math.round((subtotal * (paymentMethod.feePercent / 100)) + paymentMethod.feeFlat);
    const totalAmount = subtotal + fee;

    // Check min/max amounts
    if (totalAmount < paymentMethod.minAmount || totalAmount > paymentMethod.maxAmount) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Order total IDR ${totalAmount.toLocaleString()} is outside allowed limit (min: IDR ${paymentMethod.minAmount.toLocaleString()}, max: IDR ${paymentMethod.maxAmount.toLocaleString()})` 
        },
        { status: 400 }
      );
    }

    // Generate Order Number: IMP-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `IMP-${dateStr}-${randomSuffix}`;

    // Generate Payment Reference (QR payload / VA / Link)
    let paymentRef = '';
    if (paymentMethod.category === 'QRIS') {
      paymentRef = `00020101021226580016ID.CO.IMPEROSIAS.WWW01189360091800${orderNumber.replace(/-/g, '')}5204581253033605802ID5910IMPEROSIAS6007JAKARTA62070703A016304E8A2`;
    } else if (paymentMethod.category === 'VIRTUAL_ACCOUNT') {
      const bankCode = paymentMethod.id.includes('bca') ? '80777' : '88990';
      paymentRef = `${bankCode}${orderNumber.replace(/[^0-9]/g, '').slice(-8)}`;
    } else {
      paymentRef = `PAYREF-${orderNumber}-${Date.now().toString(36).toUpperCase()}`;
    }

    // Payment Expiry: 15 minutes from creation
    const paymentExpiredAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const isMemberWallet = paymentMethod.id === 'pay-internal-wallet';

    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderNumber,
      userId: userId || null,
      customerEmail,
      customerPhone: customerPhone || '-',
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productIcon: product.iconImage,
      skuId: sku.id,
      skuName: sku.name,
      providerSkuCode: sku.providerSkuCode,
      targetAccountPayload,
      accountNickname: validationResult.nickname,
      baseCost: sku.baseCost,
      subtotal,
      fee,
      totalAmount,
      status: isMemberWallet ? 'PAID' : 'PENDING_PAYMENT',
      paymentMethodId: paymentMethod.id,
      paymentMethodName: paymentMethod.name,
      paymentReference: paymentRef,
      paymentExpiredAt,
      paidAt: isMemberWallet ? new Date().toISOString() : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // If paying via internal wallet, deduct wallet and queue fulfillment immediately
    if (isMemberWallet) {
      const userToDeduct = userId || 'user-demo-01';
      const deducted = deductUserWallet(userToDeduct, totalAmount);
      if (!deducted) {
        return NextResponse.json(
          { success: false, error: 'Insufficient user wallet balance' },
          { status: 400 }
        );
      }

      createOrder(newOrder);

      // Enqueue fulfillment job
      enqueueFulfillmentJob({
        orderNumber: newOrder.orderNumber,
        providerSkuCode: newOrder.providerSkuCode,
        targetAccountPayload: newOrder.targetAccountPayload,
        attemptCount: 0,
        maxAttempts: 3,
        status: 'QUEUED'
      });

      return NextResponse.json({
        success: true,
        data: {
          order: newOrder,
          checkoutUrl: `/checkout/${orderNumber}`
        }
      });
    }

    // Standard checkout
    createOrder(newOrder);

    return NextResponse.json({
      success: true,
      data: {
        order: newOrder,
        checkoutUrl: `/checkout/${orderNumber}`
      }
    });

  } catch (err: any) {
    console.error('Order creation error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
