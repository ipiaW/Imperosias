'use client';

import React, { useState } from 'react';
import { Wallet, X, PlusCircle, CheckCircle2, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onTopupSuccess: (newBalance: number) => void;
}

export default function WalletModal({
  isOpen,
  onClose,
  currentBalance,
  onTopupSuccess
}: WalletModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(100000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const topupOptions = [
    { amount: 50000, label: 'IDR 50,000' },
    { amount: 100000, label: 'IDR 100,000', popular: true },
    { amount: 250000, label: 'IDR 250,000' },
    { amount: 500000, label: 'IDR 500,000' },
    { amount: 1000000, label: 'IDR 1,000,000', bonus: '+2% Bonus' },
    { amount: 2000000, label: 'IDR 2,000,000', bonus: '+5% Bonus' }
  ];

  const handleTopup = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-demo-01',
          amount: selectedAmount
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Successfully added IDR ${selectedAmount.toLocaleString('id-ID')} to your wallet balance!`);
        onTopupSuccess(data.data.balance);
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.error('Wallet topup failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0d121f] border border-surface-border rounded-2xl p-6 shadow-2xl shadow-violet-950/40">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-surface-elevated text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-[2px] flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
              <Wallet className="w-6 h-6 text-violet-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Imperosias Member Wallet</h3>
            <p className="text-xs text-slate-400">Zero transaction fees & instant 1-click top-up checkout</p>
          </div>
        </div>

        {/* Current Balance Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-900/30 via-surface-elevated to-cyan-950/30 border border-violet-500/30 mb-6 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Available Balance</span>
            <div className="text-2xl font-black text-white font-mono mt-0.5 text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-cyan-300">
              IDR {currentBalance.toLocaleString('id-ID')}
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Active VIP
          </span>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Top-up Amount Selection */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Select Top-Up Amount
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {topupOptions.map((opt) => {
              const isSelected = selectedAmount === opt.amount;
              return (
                <button
                  key={opt.amount}
                  type="button"
                  onClick={() => setSelectedAmount(opt.amount)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-lg shadow-violet-600/20'
                      : 'bg-surface-elevated/60 border-surface-border text-slate-300 hover:border-slate-600 hover:bg-surface-elevated'
                  }`}
                >
                  {opt.popular && (
                    <span className="absolute -top-2 right-2 px-1.5 py-0.2 bg-violet-600 text-[10px] font-bold text-white rounded">
                      POPULAR
                    </span>
                  )}
                  {opt.bonus && (
                    <span className="absolute -top-2 right-2 px-1.5 py-0.2 bg-emerald-600 text-[10px] font-bold text-white rounded">
                      {opt.bonus}
                    </span>
                  )}
                  <div className="text-xs font-bold font-mono">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Instant Credit</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Benefits Note */}
        <div className="p-3 rounded-lg bg-surface-elevated/40 border border-white/5 text-xs text-slate-400 flex items-start gap-2.5 mb-6">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>Simulated instant top-up for pair testing. Balances are debited and credited via double-entry ledger entries.</span>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleTopup}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>Top Up IDR {selectedAmount.toLocaleString('id-ID')}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>

      </div>
    </div>
  );
}
