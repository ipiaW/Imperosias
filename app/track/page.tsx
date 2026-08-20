'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ReceiptText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Zap, 
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Order } from '@/lib/types';

export default function TrackOrderPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/admin/orders?search=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      } else {
        setErrorMessage(data.error || 'Failed to search orders');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setErrorMessage('Network error while searching for order.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
          <ReceiptText className="w-3.5 h-3.5" />
          <span>Real-Time Order Tracking</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          Track Your Top-Up Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter your Order Number (e.g. <span className="text-slate-300 font-mono">IMP-20260820-9182</span>), email, or phone number to check delivery progress.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Order Number, Email, or WhatsApp Number..."
            className="w-full pl-12 pr-32 py-4 rounded-2xl bg-surface/90 border border-surface-border text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 shadow-2xl backdrop-blur-md font-mono"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-bold font-mono uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSearching ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Track</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Search Results */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Found {orders.length} Order(s)
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 bg-surface/50 rounded-3xl border border-surface-border p-8 space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Matching Orders Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Please double-check the order number or email you provided during checkout.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 sm:p-6 rounded-2xl bg-surface/90 border border-surface-border hover:border-violet-500/40 transition-all shadow-xl space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-surface-border/60">
                    <div>
                      <span className="text-xs font-mono font-bold text-violet-400">#{ord.orderNumber}</span>
                      <div className="text-xs text-slate-400">{new Date(ord.createdAt).toLocaleString()}</div>
                    </div>

                    {/* Status Badges */}
                    <div>
                      {ord.status === 'SUCCESS' && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS / DELIVERED
                        </span>
                      )}
                      {ord.status === 'PENDING_PAYMENT' && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5" /> PENDING PAYMENT
                        </span>
                      )}
                      {ord.status === 'PROCESSING' && (
                        <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 text-xs font-bold flex items-center gap-1 font-mono">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> FULFILLING...
                        </span>
                      )}
                      {ord.status === 'MANUAL_REVIEW' && (
                        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1 font-mono">
                          <ShieldAlert className="w-3.5 h-3.5" /> MANUAL REVIEW
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Product & SKU:</span>
                      <span className="font-bold text-white">{ord.productName}</span>
                      <span className="text-cyan-300 block">{ord.skuName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Target Account:</span>
                      <span className="font-mono text-white">
                        {ord.accountNickname ? `${ord.accountNickname}` : 'Target User'}
                      </span>
                      <span className="text-slate-500 block font-mono">
                        {Object.entries(ord.targetAccountPayload).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Total & Payment:</span>
                      <span className="font-mono font-bold text-white">IDR {ord.totalAmount.toLocaleString('id-ID')}</span>
                      <span className="text-slate-400 block">{ord.paymentMethodName}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/checkout/${ord.orderNumber}`}
                      className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-violet-600 hover:text-white border border-surface-border text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <span>View Live Order / Invoice</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
