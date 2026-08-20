'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Gamepad2, 
  Search, 
  Wallet, 
  ShieldAlert, 
  ReceiptText, 
  Menu, 
  X, 
  Zap, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  onOpenWallet?: () => void;
  walletBalance?: number;
}

export default function Navbar({ onOpenWallet, walletBalance = 250000 }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-[#07090e]/90 backdrop-blur-md border-b border-surface-border/60 shadow-xl' 
        : 'bg-transparent border-b border-white/5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 p-[2px] shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-violet-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-white font-mono uppercase">
                  Imper<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400">osias</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-1 tracking-wide">Enterprise Game Top-Up</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-surface/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
            <Link 
              href="/" 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                pathname === '/' 
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Game Catalog
            </Link>
            <Link 
              href="/track" 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                pathname === '/track' 
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ReceiptText className="w-4 h-4 text-cyan-400" />
              Track Order
            </Link>
            <Link 
              href="/admin" 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                pathname.startsWith('/admin') 
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Admin Backoffice
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Wallet Button */}
            <button
              onClick={onOpenWallet}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-elevated/80 hover:bg-surface-elevated border border-surface-border hover:border-violet-500/40 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                <Wallet className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Member Balance</p>
                <p className="text-xs font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                  IDR {walletBalance.toLocaleString('id-ID')}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 ml-1">
                + Top Up
              </span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenWallet}
              className="p-2 rounded-lg bg-surface-elevated border border-surface-border text-violet-400"
            >
              <Wallet className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg bg-surface-elevated border border-surface-border text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0d14] border-b border-surface-border px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border text-slate-200"
          >
            <div className="flex items-center gap-2.5">
              <Gamepad2 className="w-5 h-5 text-violet-400" />
              <span className="font-medium">Game Catalog</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>
          <Link
            href="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border text-slate-200"
          >
            <div className="flex items-center gap-2.5">
              <ReceiptText className="w-5 h-5 text-cyan-400" />
              <span className="font-medium">Track Order</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border text-slate-200"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span className="font-medium">Admin Backoffice (RBAC)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>
        </div>
      )}
    </header>
  );
}
