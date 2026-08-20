import './globals.css';
import type { Metadata } from 'next';
import LayoutClient from './layout-client';

export const metadata: Metadata = {
  title: 'Imperosias | Enterprise Game Top-Up & Digital Goods Platform',
  description: 'Instant official game top-up with real-time target account validation, multi-gateway payments (QRIS, E-Wallets, Virtual Accounts), and automated queue fulfillment.',
  keywords: 'game topup, mobile legends diamonds, genshin impact crystals, valorant points, roblox robux, qris topup',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#07090e] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-violet-600 selection:text-white">
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
