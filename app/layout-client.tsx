'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WalletModal from '@/components/WalletModal';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(250000);

  useEffect(() => {
    // Fetch initial wallet balance
    fetch('/api/wallet')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.balance !== undefined) {
          setWalletBalance(data.data.balance);
        }
      })
      .catch(err => console.error('Failed to fetch wallet balance:', err));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        onOpenWallet={() => setIsWalletOpen(true)} 
        walletBalance={walletBalance} 
      />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        currentBalance={walletBalance}
        onTopupSuccess={(newBal) => setWalletBalance(newBal)}
      />
    </div>
  );
}
