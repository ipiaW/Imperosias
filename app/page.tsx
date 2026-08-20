'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Sparkles, 
  Flame, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  Gamepad2, 
  Monitor, 
  Smartphone, 
  Ticket, 
  Tv, 
  ArrowRight,
  Clock,
  Coins,
  Shield,
  Layers
} from 'lucide-react';
import { Product, GameCategory } from '@/lib/types';
import GameCard from '@/components/GameCard';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'ALL' 
        ? '/api/products' 
        : `/api/products?category=${selectedCategory}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.publisher.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const trendingProducts = products.filter(p => p.isTrending);

  const categories = [
    { id: 'ALL', label: 'All Products', icon: Layers },
    { id: 'MOBILE', label: 'Mobile Games', icon: Smartphone },
    { id: 'PC', label: 'PC Games', icon: Monitor },
    { id: 'VOUCHER', label: 'Digital Vouchers', icon: Ticket },
    { id: 'STREAMING', label: 'Entertainment', icon: Tv },
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Banner Section */}
      <section className="relative pt-6 pb-12 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-600/20 via-purple-600/15 to-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Hero Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-violet-300 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Next-Gen Enterprise Game Top-Up Platform</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Instant Top-Up, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400">
                  Zero Delay.
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Direct publisher API fulfillment with real-time target account verification, double-entry financial ledger protection, and automated multi-gateway payment processing.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-lg mx-auto lg:mx-0">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search game, voucher, or publisher (e.g. Mobile Legends, Valorant)..."
                    className="w-full pl-12 pr-28 py-4 rounded-2xl bg-surface-elevated/90 border border-surface-border text-white placeholder-slate-400 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 shadow-2xl backdrop-blur-md transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-24 text-xs text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                  <span className="absolute right-3 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold font-mono">
                    Search
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified Moonton & HoYoverse</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>3.2s Avg Fulfillment</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-violet-400" />
                  <span>Double-Entry Ledger</span>
                </div>
              </div>

            </div>

            {/* Hero Right Featured Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl p-1 bg-gradient-to-br from-violet-600 via-purple-600/40 to-cyan-500 shadow-2xl shadow-violet-950/60">
                <div className="bg-[#0c101c] rounded-[22px] p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-rose-500 animate-bounce" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400 font-mono">
                        Flash Sale Event
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> Auto-Delivered 24/7
                    </span>
                  </div>

                  {/* Featured Product Preview */}
                  <Link href="/topup/mobile-legends" className="block group">
                    <div className="relative rounded-2xl overflow-hidden h-48 bg-slate-900 mb-3 border border-surface-border group-hover:border-violet-500/60 transition-all">
                      <img
                        src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"
                        alt="Mobile Legends"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c101c] via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                            Moonton Official
                          </span>
                          <h4 className="text-lg font-black text-white mt-1">Mobile Legends: Bang Bang</h4>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-bold text-white bg-violet-600 rounded-lg shadow">
                          -20% OFF
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Quick SKUs List */}
                  <div className="space-y-2">
                    <Link
                      href="/topup/mobile-legends"
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated/60 hover:bg-surface-elevated border border-surface-border hover:border-violet-500/40 transition-all"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">86 Diamonds (78 + 8 Bonus)</div>
                        <div className="text-[10px] text-slate-400">Instant ID + Zone verification</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-cyan-400 font-mono">IDR 20,500</div>
                        <div className="text-[10px] text-slate-500 line-through">IDR 24,000</div>
                      </div>
                    </Link>

                    <Link
                      href="/topup/genshin-impact"
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated/60 hover:bg-surface-elevated border border-surface-border hover:border-violet-500/40 transition-all"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">Blessing of the Welkin Moon</div>
                        <div className="text-[10px] text-slate-400">3000 Primogems (30 Days)</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-cyan-400 font-mono">IDR 74,900</div>
                        <div className="text-[10px] text-slate-500 line-through">IDR 89,000</div>
                      </div>
                    </Link>
                  </div>

                  <Link
                    href="/topup/mobile-legends"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-all"
                  >
                    <span>Instant Top-Up Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Category Pills Navigation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 border border-violet-400/40'
                    : 'bg-surface/80 text-slate-400 hover:text-white hover:bg-surface-elevated border border-surface-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Trending / Recommended Games */}
      {selectedCategory === 'ALL' && !searchQuery && trendingProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Trending & Popular</h2>
                <p className="text-xs text-slate-400">Most recharged games this week</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-violet-400 flex items-center gap-1 font-mono">
              Live Stock <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProducts.map((product) => (
              <GameCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* All Games Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {searchQuery ? `Search Results for "${searchQuery}"` : 'All Game Top-Ups & Vouchers'}
              </h2>
              <p className="text-xs text-slate-400">
                Showing {filteredProducts.length} verified products
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-surface animate-pulse border border-surface-border" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-surface/40 rounded-3xl border border-surface-border p-8 space-y-4">
            <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No products found</h3>
            <p className="text-xs text-slate-400">Try searching with a different game title or category.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <GameCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4-Step How It Works Execution Pipeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-surface to-[#07090e] border border-surface-border relative overflow-hidden">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              End-To-End Execution Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              How Imperosias Fulfills Your Order
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Built on asynchronous queues, cryptographic webhook verification, and double-entry ledger bookkeeping.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-surface-elevated/70 border border-surface-border space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-mono font-black text-sm">
                01
              </div>
              <h3 className="text-sm font-bold text-white">Real-Time Validation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inputs are verified instantly against upstream publisher APIs to confirm player nickname before checkout.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-surface-elevated/70 border border-surface-border space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-black text-sm">
                02
              </div>
              <h3 className="text-sm font-bold text-white">Multi-Gateway Payment</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pay seamlessly with QRIS, GoPay, DANA, Virtual Accounts, Cards, or Imperosias Member Wallet with 0% fees.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-surface-elevated/70 border border-surface-border space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-black text-sm">
                03
              </div>
              <h3 className="text-sm font-bold text-white">HMAC Webhook Ingestion</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Payment signals are verified via HMAC-SHA256 signatures with idempotency checks and replay attack defense.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-surface-elevated/70 border border-surface-border space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-black text-sm">
                04
              </div>
              <h3 className="text-sm font-bold text-white">Automated Fulfillment</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Asynchronous BullMQ worker calls supplier API, records double-entry ledger entries, and delivers diamonds in seconds!
              </p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
