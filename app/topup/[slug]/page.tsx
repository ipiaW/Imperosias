'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Gamepad2, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Star, 
  HelpCircle, 
  CreditCard, 
  Smartphone, 
  Building2, 
  QrCode, 
  Wallet,
  ChevronLeft,
  Loader2,
  Lock
} from 'lucide-react';
import { Product, PaymentMethod, Sku, TargetAccountPayload, AccountValidationResult } from '@/lib/types';

export default function TopupPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [accountPayload, setAccountPayload] = useState<TargetAccountPayload>({});
  const [validatingAccount, setValidatingAccount] = useState(false);
  const [validationResult, setValidationResult] = useState<AccountValidationResult | null>(null);

  const [selectedSku, setSelectedSku] = useState<Sku | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchProductDetails();
    }
  }, [slug]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${slug}`);
      const data = await res.json();
      if (data.success) {
        setProduct(data.data.product);
        setPaymentMethods(data.data.paymentMethods);

        // Pre-select first SKU and QRIS payment method
        if (data.data.product.skus?.length > 0) {
          setSelectedSku(data.data.product.skus[0]);
        }
        if (data.data.paymentMethods?.length > 0) {
          setSelectedPaymentMethod(data.data.paymentMethods[0]);
        }

        // Initialize default select fields
        const initialPayload: TargetAccountPayload = {};
        data.data.product.formSchema.forEach((field: any) => {
          if (field.type === 'select' && field.options?.length > 0) {
            initialPayload[field.name] = field.options[0].value;
          }
        });
        setAccountPayload(initialPayload);
      }
    } catch (err) {
      console.error('Failed to load product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName: string, value: string | number) => {
    setAccountPayload(prev => ({ ...prev, [fieldName]: value }));
    setValidationResult(null); // Reset validation when user modifies inputs
  };

  const handleValidateAccount = async () => {
    if (!product) return;
    setValidatingAccount(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/validate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: product.slug,
          payload: accountPayload
        })
      });

      const data = await res.json();
      if (data.success) {
        setValidationResult(data.data);
      } else {
        setValidationResult({
          isValid: false,
          errorMessage: data.error || 'Failed to verify account'
        });
      }
    } catch (err) {
      console.error('Validation error:', err);
      setValidationResult({
        isValid: false,
        errorMessage: 'Network error validating account'
      });
    } finally {
      setValidatingAccount(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !selectedSku || !selectedPaymentMethod) return;

    if (!customerEmail || !customerEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address for receipt delivery.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: product.slug,
          skuId: selectedSku.id,
          targetAccountPayload: accountPayload,
          paymentMethodId: selectedPaymentMethod.id,
          customerEmail,
          customerPhone,
          userId: 'user-demo-01'
        })
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/checkout/${data.data.order.orderNumber}`);
      } else {
        setErrorMessage(data.error || 'Failed to initiate order. Please try again.');
      }
    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMessage('Network error creating order. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Loading product specifications & SKU matrix...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Product Not Found</h2>
        <p className="text-sm text-slate-400">The game top-up item you are looking for is unavailable.</p>
        <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold">
          Back to Catalog
        </Link>
      </div>
    );
  }

  // Calculate pricing breakdown
  const subtotal = selectedSku ? selectedSku.sellingPrice : 0;
  const fee = selectedPaymentMethod
    ? Math.round((subtotal * (selectedPaymentMethod.feePercent / 100)) + selectedPaymentMethod.feeFlat)
    : 0;
  const totalAmount = subtotal + fee;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> All Games
        </Link>
        <span>/</span>
        <span className="text-slate-200 font-medium">{product.name}</span>
      </div>

      {/* Main Grid: Left Game Info & Right Top-Up Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Game Card & Information */}
        <div className="lg:col-span-4 space-y-6 sticky top-28">
          
          <div className="rounded-3xl bg-surface/90 border border-surface-border p-6 space-y-6 shadow-xl backdrop-blur-md">
            
            {/* Game Banner / Icon */}
            <div className="relative rounded-2xl overflow-hidden h-52 bg-slate-900 border border-white/5">
              <img
                src={product.bannerImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
              
              <div className="absolute top-3 left-3">
                {product.badge && (
                  <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-violet-600 text-white rounded-lg shadow-md border border-violet-400/30">
                    {product.badge}
                  </span>
                )}
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                <img
                  src={product.iconImage}
                  alt={product.name}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-surface shadow-md shrink-0"
                />
                <div>
                  <h1 className="text-lg font-black text-white leading-tight">{product.name}</h1>
                  <p className="text-xs text-cyan-300 font-medium">{product.publisher}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed">
              {product.description}
            </p>

            {/* Feature Highlights */}
            <div className="space-y-2.5 pt-2 border-t border-surface-border/60 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-cyan-400" /> Delivery Speed:</span>
                <span className="text-white font-bold font-mono">Instant (1-5s)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Verification:</span>
                <span className="text-emerald-400 font-bold">100% Official API</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" /> Rating:</span>
                <span className="text-white font-bold">{product.rating || 5.0} / 5.0 (4.2k+ Reviews)</span>
              </div>
            </div>

            {/* Security note */}
            <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-500/20 text-[11px] text-violet-300 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <span>Orders are secured with double-entry ledger bookkeeping and official aggregator fulfillment.</span>
            </div>

          </div>

        </div>

        {/* Right Side: 4-Step Top-Up Form */}
        <div className="lg:col-span-8 space-y-8">
          
          <form onSubmit={handleCreateOrder} className="space-y-8">

            {/* Step 1: Target Account Information */}
            <div className="p-6 sm:p-8 rounded-3xl bg-surface/90 border border-surface-border space-y-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-mono font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Enter Account Details</h2>
                    <p className="text-xs text-slate-400">Required target player information for in-game crediting</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.formSchema.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>{field.label} {field.required && <span className="text-rose-400">*</span>}</span>
                    </label>

                    {field.type === 'select' ? (
                      <select
                        value={accountPayload[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        required={field.required}
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-surface text-white">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={accountPayload[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
                        required={field.required}
                      />
                    )}

                    {field.helperText && (
                      <p className="text-[11px] text-slate-400">{field.helperText}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Account Validation Button & Verified Nickname Display */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleValidateAccount}
                  disabled={validatingAccount}
                  className="px-4 py-2.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {validatingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying with {product.publisher} API...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span>Check In-Game Nickname</span>
                    </>
                  )}
                </button>

                {validationResult && (
                  <div className={`px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 ${
                    validationResult.isValid
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                  }`}>
                    {validationResult.isValid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          Verified Player: <strong className="text-white font-mono">{validationResult.nickname}</strong>
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{validationResult.errorMessage || 'Invalid Player Account'}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Step 2: Select Denomination / SKU */}
            <div className="p-6 sm:p-8 rounded-3xl bg-surface/90 border border-surface-border space-y-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-mono font-bold text-sm">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Select Denomination</h2>
                  <p className="text-xs text-slate-400">Choose your desired diamond, crystal, or voucher package</p>
                </div>
              </div>

              {/* SKU Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {product.skus.map((sku) => {
                  const isSelected = selectedSku?.id === sku.id;
                  return (
                    <div
                      key={sku.id}
                      onClick={() => setSelectedSku(sku)}
                      className={`relative p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gradient-to-b from-violet-900/40 to-surface-elevated border-violet-500 shadow-lg shadow-violet-950/50 ring-1 ring-violet-500/50'
                          : 'bg-surface-elevated/60 border-surface-border hover:border-slate-600 hover:bg-surface-elevated'
                      }`}
                    >
                      {sku.bonusText && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-violet-600 text-white rounded-md shadow">
                          {sku.bonusText}
                        </span>
                      )}

                      <div className="text-sm font-bold text-white mb-2 pr-6">
                        {sku.name}
                      </div>

                      <div className="flex items-baseline justify-between mt-auto">
                        <div>
                          <div className="text-sm font-black text-cyan-300 font-mono">
                            IDR {sku.sellingPrice.toLocaleString('id-ID')}
                          </div>
                          {sku.originalPrice && (
                            <div className="text-[10px] text-slate-500 line-through font-mono">
                              IDR {sku.originalPrice.toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-white text-violet-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Step 3: Select Payment Method */}
            <div className="p-6 sm:p-8 rounded-3xl bg-surface/90 border border-surface-border space-y-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-mono font-bold text-sm">
                  3
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Select Payment Method</h2>
                  <p className="text-xs text-slate-400">Instant QRIS, e-wallets, virtual accounts, or 0% fee member wallet</p>
                </div>
              </div>

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {paymentMethods.map((pm) => {
                  const isSelected = selectedPaymentMethod?.id === pm.id;
                  const itemFee = selectedSku 
                    ? Math.round((selectedSku.sellingPrice * (pm.feePercent / 100)) + pm.feeFlat) 
                    : 0;
                  const itemTotal = (selectedSku?.sellingPrice || 0) + itemFee;

                  return (
                    <div
                      key={pm.id}
                      onClick={() => setSelectedPaymentMethod(pm)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-gradient-to-b from-cyan-950/40 to-surface-elevated border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                          : 'bg-surface-elevated/60 border-surface-border hover:border-slate-600 hover:bg-surface-elevated'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          {pm.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Total: <strong className="text-cyan-300">IDR {itemTotal.toLocaleString('id-ID')}</strong>
                        </div>
                        {pm.feePercent === 0 && pm.feeFlat === 0 && (
                          <span className="inline-block text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            0% Fee
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 fill-black text-cyan-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Step 4: Contact & Summary Checkout */}
            <div className="p-6 sm:p-8 rounded-3xl bg-surface/90 border border-surface-border space-y-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-mono font-bold text-sm">
                  4
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Contact & Receipt Details</h2>
                  <p className="text-xs text-slate-400">Order invoice and payment receipt will be sent to your email</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. gamer@gmail.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                  <p className="text-[11px] text-slate-400">Proof of payment and digital invoice delivered here.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    WhatsApp / Phone Number <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 081234567890"
                    className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400">For SMS/WhatsApp instant delivery notification.</p>
                </div>
              </div>

              {/* Order Summary Breakdown Box */}
              <div className="p-4 rounded-2xl bg-surface-elevated/70 border border-surface-border space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Order Summary
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Product:</span>
                    <span className="font-semibold text-white">{product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Item / SKU:</span>
                    <span className="font-semibold text-white">{selectedSku?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Method:</span>
                    <span className="font-semibold text-cyan-300">{selectedPaymentMethod?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal:</span>
                    <span className="font-mono">IDR {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Gateway Fee:</span>
                    <span className="font-mono">IDR {fee.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-border/80 flex items-center justify-between text-sm">
                  <span className="font-bold text-white">Grand Total:</span>
                  <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300 font-mono">
                    IDR {totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit / Checkout Button */}
              <button
                type="submit"
                disabled={isSubmitting || !selectedSku || !selectedPaymentMethod}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-violet-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating Secure Payment Intent...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 text-cyan-300 fill-cyan-300" />
                    <span>Proceed to Payment (IDR {totalAmount.toLocaleString('id-ID')})</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}
