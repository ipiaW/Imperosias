'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  QrCode, 
  Zap, 
  AlertCircle, 
  Printer, 
  ArrowLeft, 
  ShieldCheck, 
  Receipt, 
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Lock,
  Sparkles,
  Server
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, FulfillmentJob } from '@/lib/types';

export default function CheckoutPage() {
  const params = useParams();
  const orderNumber = params?.orderNumber as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [fulfillmentJob, setFulfillmentJob] = useState<FulfillmentJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<'PAYMENT' | 'INVOICE'>('PAYMENT');

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
      const interval = setInterval(fetchOrder, 2500); // Live poll for status updates
      return () => clearInterval(interval);
    }
  }, [orderNumber]);

  useEffect(() => {
    if (!order) return;

    const expiryTime = new Date(order.paymentExpiredAt).getTime();
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [order]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      const data = await res.json();
      if (data.success) {
        setOrder(prev => {
          // If status just transitioned to SUCCESS, trigger celebratory confetti!
          if (prev && prev.status !== 'SUCCESS' && data.data.order.status === 'SUCCESS') {
            triggerConfetti();
          }
          return data.data.order;
        });
        setFulfillmentJob(data.data.fulfillmentJob);
      }
    } catch (err) {
      console.error('Failed to fetch order status:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignore if confetti fails in test env
    }
  };

  const handleSimulatePayment = async () => {
    if (!order) return;
    setIsSimulatingPayment(true);

    try {
      const res = await fetch(`/api/orders/${orderNumber}/pay`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data.order);
        triggerConfetti();
      }
    } catch (err) {
      console.error('Payment simulation failed:', err);
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Loading payment intent & invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Order Not Found</h2>
        <p className="text-xs text-slate-400">Order #{orderNumber} could not be located in the database.</p>
        <Link href="/" className="inline-block px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold">
          Back to Home
        </Link>
      </div>
    );
  }

  const isSuccess = order.status === 'SUCCESS';
  const isPaid = order.status === 'PAID' || order.status === 'PROCESSING' || isSuccess;
  const isManualReview = order.status === 'MANUAL_REVIEW';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-violet-400 font-bold">#{order.orderNumber}</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            {isSuccess ? 'Payment & Fulfillment Completed!' : 'Complete Your Payment'}
          </h1>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {order.status === 'PENDING_PAYMENT' && (
            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 font-mono">
              <Clock className="w-4 h-4 animate-spin" /> Awaiting Payment ({formatTime(timeLeft)})
            </span>
          )}
          {order.status === 'PAID' && (
            <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4" /> Payment Confirmed
            </span>
          )}
          {order.status === 'PROCESSING' && (
            <span className="px-3.5 py-1.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 text-xs font-bold flex items-center gap-1.5 font-mono">
              <RefreshCw className="w-4 h-4 animate-spin" /> Delivering Diamonds...
            </span>
          )}
          {isSuccess && (
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 font-mono shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" /> Delivered & Fulfilled
            </span>
          )}
          {isManualReview && (
            <span className="px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 font-mono">
              <AlertCircle className="w-4 h-4" /> Manual Review
            </span>
          )}
        </div>
      </div>

      {/* Live Stepper Execution Flow */}
      <div className="p-6 rounded-3xl bg-surface/90 border border-surface-border shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          
          {/* Step 1: Created */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Order Created</div>
              <div className="text-[10px] text-slate-400 font-mono">ID Verified</div>
            </div>
          </div>

          {/* Step 2: Payment */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
              isPaid
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse'
            }`}>
              {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-white">Payment Ingestion</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {isPaid ? 'HMAC Verified' : 'Pending Gateway'}
              </div>
            </div>
          </div>

          {/* Step 3: Queue & Aggregator */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
              isSuccess
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : order.status === 'PROCESSING' || order.status === 'PAID'
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-400 animate-pulse'
                : 'bg-surface-elevated border-surface-border text-slate-500'
            }`}>
              {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Server className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-white">Worker Queue</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {isSuccess ? 'Aggregator OK' : order.status === 'PROCESSING' ? 'Processing API' : 'Waiting'}
              </div>
            </div>
          </div>

          {/* Step 4: Fulfillment */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
              isSuccess
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/30'
                : 'bg-surface-elevated border-surface-border text-slate-500'
            }`}>
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">In-Game Delivery</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {isSuccess ? 'Delivered' : 'Pending'}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Payment Details / Receipt */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: QR / VA & Payment Instructions */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="p-6 sm:p-8 rounded-3xl bg-surface/90 border border-surface-border space-y-6 shadow-xl backdrop-blur-md">
            
            {/* Payment Method Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-surface-border/80">
              <div>
                <span className="text-xs text-slate-400 font-medium">Payment Channel</span>
                <h3 className="text-base font-bold text-white">{order.paymentMethodName}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Total Amount</span>
                <div className="text-lg font-black text-cyan-300 font-mono">
                  IDR {order.totalAmount.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Dynamic QRIS or Virtual Account UI */}
            {order.status === 'PENDING_PAYMENT' ? (
              <div className="space-y-6">
                
                {/* QR Code Display for QRIS */}
                {order.paymentMethodId.includes('qris') ? (
                  <div className="p-6 rounded-2xl bg-white text-slate-900 text-center space-y-4 max-w-sm mx-auto shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-black tracking-wider text-slate-800">QRIS STANDAR PEMBAYARAN</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">NMID VERIFIED</span>
                    </div>

                    {/* Simulated SVG QR Code */}
                    <div className="relative mx-auto w-52 h-52 bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center shadow-inner">
                      <div className="w-full h-full bg-white rounded-lg p-2 flex flex-col items-center justify-center">
                        <QrCode className="w-40 h-40 text-black" />
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="text-xs font-bold text-slate-800">MERCHANT: IMPEROSIAS TOPUP</div>
                      <div className="text-[11px] text-slate-500 font-mono">ID: {order.orderNumber}</div>
                    </div>
                  </div>
                ) : (
                  /* Virtual Account Display */
                  <div className="p-6 rounded-2xl bg-surface-elevated border border-surface-border space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">VIRTUAL ACCOUNT NUMBER</span>
                      <span className="text-xs font-bold text-cyan-400">Automatic Check</span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-xl font-black text-white font-mono tracking-widest">
                        {order.paymentReference || '80777' + order.orderNumber.replace(/[^0-9]/g, '')}
                      </span>
                      <button
                        onClick={() => handleCopy(order.paymentReference || '')}
                        className="px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600 text-violet-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Instant Test Payment Sandbox Button */}
                <div className="p-4 rounded-2xl bg-violet-950/40 border border-violet-500/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Interactive Payment Simulator</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Simulate customer completing the payment in mobile banking to trigger webhook ingestion and automated worker queue fulfillment:
                  </p>
                  <button
                    onClick={handleSimulatePayment}
                    disabled={isSimulatingPayment}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50"
                  >
                    {isSimulatingPayment ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Simulate Successful Payment (Instant Ingestion)</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            ) : (
              /* Success / Fulfilled View */
              <div className="p-8 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">Diamonds Successfully Delivered!</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Your account <strong className="text-cyan-300 font-mono">@{order.accountNickname}</strong> has been credited with <strong className="text-white">{order.skuName}</strong>.
                  </p>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface border border-surface-border text-white text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <Printer className="w-4 h-4 text-cyan-400" />
                    <span>Print Invoice Receipt</span>
                  </button>
                  <Link
                    href="/"
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <span>Top Up Another Game</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Payment Instructions */}
            <div className="space-y-3 pt-4 border-t border-surface-border/60">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Payment Instructions:
              </h4>
              <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside">
                <li>Make sure to pay the exact amount of <strong className="text-white font-mono">IDR {order.totalAmount.toLocaleString('id-ID')}</strong>.</li>
                <li>Payment verification runs automatically via webhook within 1-3 seconds.</li>
                <li>If the diamonds do not arrive in 5 minutes, our 24/7 automated DLQ system will route the order for manual admin review.</li>
              </ul>
            </div>

          </div>

        </div>

        {/* Right Column: Order Details & Invoice Receipt Card */}
        <div className="lg:col-span-5 space-y-6">
          
          <div id="printable-receipt" className="p-6 sm:p-8 rounded-3xl bg-surface/90 border border-surface-border space-y-6 shadow-xl backdrop-blur-md">
            
            <div className="flex items-center justify-between pb-4 border-b border-surface-border/80">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-violet-400" />
                <h3 className="text-base font-bold text-white">Digital Order Invoice</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Product Item Row */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-elevated/60 border border-surface-border">
              <img
                src={order.productIcon}
                alt={order.productName}
                className="w-12 h-12 rounded-xl object-cover border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{order.productName}</div>
                <div className="text-[11px] text-cyan-300 truncate">{order.skuName}</div>
                <div className="text-[10px] text-slate-400 font-mono">SKU: {order.providerSkuCode}</div>
              </div>
            </div>

            {/* Target Account Summary */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-surface-elevated/40 border border-white/5 text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Target Account Info:</div>
              {order.accountNickname && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Player Nickname:</span>
                  <span className="font-bold text-white font-mono">{order.accountNickname}</span>
                </div>
              )}
              {Object.entries(order.targetAccountPayload).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-400 capitalize">{key}:</span>
                  <span className="font-mono text-white">{String(val)}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-slate-400">Customer Email:</span>
                <span className="text-slate-300 font-mono truncate max-w-[200px]">{order.customerEmail}</span>
              </div>
            </div>

            {/* Financial Ledger Details */}
            <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-surface-border/60">
              <div className="flex justify-between">
                <span className="text-slate-400">Base Price:</span>
                <span className="font-mono">IDR {order.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Gateway Fee:</span>
                <span className="font-mono">IDR {order.fee.toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-2 border-t border-surface-border/60 flex justify-between items-baseline text-sm">
                <span className="font-bold text-white">Grand Total:</span>
                <span className="text-lg font-black text-cyan-300 font-mono">
                  IDR {order.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Timestamp & Fulfillment Info */}
            <div className="pt-4 border-t border-surface-border/60 space-y-1.5 text-[11px] text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Order Ref:</span>
                <span className="text-white">{order.orderNumber}</span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between">
                  <span>Paid At:</span>
                  <span className="text-emerald-400">{new Date(order.paidAt).toLocaleTimeString()}</span>
                </div>
              )}
              {order.fulfilledAt && (
                <div className="flex justify-between">
                  <span>Fulfilled At:</span>
                  <span className="text-cyan-400">{new Date(order.fulfilledAt).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
