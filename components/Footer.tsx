import React from 'react';
import Link from 'next/link';
import { 
  Gamepad2, 
  ShieldCheck, 
  Zap, 
  Headphones, 
  Lock, 
  CreditCard, 
  Clock, 
  Server,
  QrCode,
  Smartphone
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#05070a] border-t border-surface-border/80 pt-16 pb-12 mt-24 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-surface-border/60">
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-surface/40 border border-white/5">
            <div className="p-2.5 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Instant Delivery</h4>
              <p className="text-xs text-slate-400 mt-0.5">Automated queue fulfillment in under 5 seconds.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-surface/40 border border-white/5">
            <div className="p-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">100% Official & Safe</h4>
              <p className="text-xs text-slate-400 mt-0.5">Direct aggregator handshake with official publisher APIs.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-surface/40 border border-white/5">
            <div className="p-2.5 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Bank-Grade Security</h4>
              <p className="text-xs text-slate-400 mt-0.5">HMAC-SHA256 encrypted webhooks & double-entry ledger.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-surface/40 border border-white/5">
            <div className="p-2.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">24/7 Live Monitoring</h4>
              <p className="text-xs text-slate-400 mt-0.5">Real-time status updates and automated retry engines.</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Branding */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 py-12 border-b border-surface-border/60">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center p-[2px]">
                <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-violet-400" />
                </div>
              </div>
              <span className="text-xl font-bold text-white font-mono uppercase">
                Imper<span className="text-violet-400">osias</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Imperosias is a next-generation game top-up platform engineered with double-entry accounting, real-time target player validation, multi-gateway payment routing, and resilient asynchronous worker queues.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All Systems Operational (99.98% SLA)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-white font-semibold text-xs tracking-wider uppercase mb-4 font-mono">Popular Games</h5>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/topup/mobile-legends" className="hover:text-violet-400 transition-colors">Mobile Legends</Link></li>
              <li><Link href="/topup/genshin-impact" className="hover:text-violet-400 transition-colors">Genshin Impact</Link></li>
              <li><Link href="/topup/valorant" className="hover:text-violet-400 transition-colors">Valorant Points</Link></li>
              <li><Link href="/topup/free-fire" className="hover:text-violet-400 transition-colors">Free Fire Diamonds</Link></li>
              <li><Link href="/topup/roblox" className="hover:text-violet-400 transition-colors">Roblox Robux</Link></li>
              <li><Link href="/topup/steam-wallet" className="hover:text-violet-400 transition-colors">Steam Wallet IDR</Link></li>
            </ul>
          </div>

          {/* Platform & Navigation */}
          <div>
            <h5 className="text-white font-semibold text-xs tracking-wider uppercase mb-4 font-mono">Platform</h5>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/" className="hover:text-violet-400 transition-colors">Catalog</Link></li>
              <li><Link href="/track" className="hover:text-violet-400 transition-colors">Order Tracker</Link></li>
              <li><Link href="/admin" className="hover:text-violet-400 transition-colors">Admin Backoffice</Link></li>
              <li><a href="#payment-channels" className="hover:text-violet-400 transition-colors">Payment Channels</a></li>
              <li><span className="text-slate-500">API Documentation (v1)</span></li>
            </ul>
          </div>

          {/* Security & Compliance */}
          <div>
            <h5 className="text-white font-semibold text-xs tracking-wider uppercase mb-4 font-mono">Security & Tech</h5>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> HMAC-SHA256 Ingestion</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-cyan-400" /> Double-Entry Ledger</li>
              <li className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-violet-400" /> BullMQ Asynchronous Worker</li>
              <li className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" /> Idempotent Replay Defense</li>
            </ul>
          </div>

        </div>

        {/* Payment Methods Badges & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-400">
            &copy; {new Date().getFullYear()} Imperosias Platform. All rights reserved. Game titles and logos are trademarks of their respective publishers.
          </p>
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span className="px-2 py-1 bg-surface rounded border border-white/5">QRIS</span>
            <span className="px-2 py-1 bg-surface rounded border border-white/5">GoPay</span>
            <span className="px-2 py-1 bg-surface rounded border border-white/5">DANA</span>
            <span className="px-2 py-1 bg-surface rounded border border-white/5">BCA VA</span>
            <span className="px-2 py-1 bg-surface rounded border border-white/5">Mandiri</span>
            <span className="px-2 py-1 bg-surface rounded border border-white/5">VISA / MC</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
