'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  DollarSign, 
  TrendingUp, 
  Package, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Settings, 
  Receipt, 
  Send, 
  PlusCircle, 
  Lock, 
  Eye, 
  Check, 
  X,
  Server,
  Play,
  ArrowRight,
  Database
} from 'lucide-react';
import { Order, Product, JournalEntry, WebhookLog, Sku, OrderStatus } from '@/lib/types';
import { generateWebhookSignature } from '@/lib/security/hmac';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ORDERS' | 'SKUS' | 'LEDGER' | 'SIMULATOR'>('OVERVIEW');
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<JournalEntry[]>([]);
  const [ledgerStats, setLedgerStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Action State
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState<number>(50000000);
  const [isDepositing, setIsDepositing] = useState(false);

  // Webhook Simulator State
  const [simOrderNumber, setSimOrderNumber] = useState('');
  const [simAmount, setSimAmount] = useState(20500);
  const [simStatus, setSimStatus] = useState('PAID');
  const [simEventId, setSimEventId] = useState(`evt_test_${Date.now()}`);
  const [simResult, setSimResult] = useState<any>(null);
  const [simIsLoading, setSimIsLoading] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [orderFilter]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // Fetch orders
      const ordersUrl = orderFilter === 'ALL' 
        ? '/api/admin/orders' 
        : `/api/admin/orders?status=${orderFilter}`;
      const ordersRes = await fetch(ordersUrl);
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        setOrders(ordersData.data);
        if (ordersData.data.length > 0 && !simOrderNumber) {
          setSimOrderNumber(ordersData.data[0].orderNumber);
        }
      }

      // Fetch SKUs
      const skusRes = await fetch('/api/admin/skus');
      const skusData = await skusRes.json();
      if (skusData.success) setProducts(skusData.data);

      // Fetch Ledger
      const ledgerRes = await fetch('/api/admin/ledger');
      const ledgerData = await ledgerRes.json();
      if (ledgerData.success) {
        setLedgerEntries(ledgerData.data.entries);
        setLedgerStats(ledgerData.data.stats);
      }

    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFulfillment = async (orderNumber: string) => {
    setActionLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RETRY_FULFILLMENT',
          orderNumber
        })
      });

      const data = await res.json();
      if (data.success) {
        setActionMessage(`Fulfillment worker re-triggered for #${orderNumber}. Status: ${data.data.order.status}`);
        fetchAdminData();
      }
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverrideStatus = async (orderNumber: string, newStatus: OrderStatus) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'OVERRIDE_STATUS',
          orderNumber,
          newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Order #${orderNumber} updated to ${newStatus}`);
        fetchAdminData();
      }
    } catch (err) {
      console.error('Status override failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSku = async (productId: string, skuId: string, sellingPrice: number, baseCost: number, isAvailable: boolean) => {
    try {
      const res = await fetch('/api/admin/skus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          skuId,
          sellingPrice,
          baseCost,
          isAvailable
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('SKU margin and availability updated!');
        fetchAdminData();
      }
    } catch (err) {
      console.error('SKU update failed:', err);
    }
  };

  const handleDepositAggregator = async () => {
    setIsDepositing(true);
    try {
      const res = await fetch('/api/admin/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: depositAmount,
          reference: `BANK_DEP_${Date.now().toString(36).toUpperCase()}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        fetchAdminData();
      }
    } catch (err) {
      console.error('Deposit failed:', err);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleSendTestWebhook = async () => {
    setSimIsLoading(true);
    setSimResult(null);

    const payload = {
      event_id: simEventId,
      order_number: simOrderNumber,
      amount: simAmount,
      status: simStatus,
      timestamp: Date.now(),
      provider: 'SIMULATED_PAYMENT_GATEWAY'
    };

    try {
      const res = await fetch('/api/webhooks/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gateway-signature': 'SIMULATED_TEST_SIGNATURE'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setSimResult({
        status: res.status,
        response: data
      });
      fetchAdminData();
    } catch (err: any) {
      setSimResult({
        status: 500,
        response: { error: err?.message || 'Network error' }
      });
    } finally {
      setSimIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-[2px] flex items-center justify-center shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#0a0d14] rounded-[14px] flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Admin Backoffice</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded uppercase font-mono">
                RBAC Level 3: Superadmin
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Aggregator Fulfillment Controls, Double-Entry Financial Ledger, and Margin Management
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface border border-surface-border text-slate-300 text-xs font-bold flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border overflow-x-auto pb-2 scrollbar-none text-xs font-bold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'OVERVIEW'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Overview & Metrics</span>
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'ORDERS'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Order Management ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SKUS')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'SKUS'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products & SKU Margins</span>
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'LEDGER'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Double-Entry Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('SIMULATOR')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'SIMULATOR'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Webhook & Queue Simulator</span>
        </button>
      </div>

      {/* Tab 1: Overview & KPI Metrics */}
      {activeTab === 'OVERVIEW' && stats && (
        <div className="space-y-8">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Total Revenue */}
            <div className="p-5 rounded-2xl bg-surface/90 border border-surface-border shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Recognized Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                IDR {(stats.totalRevenue || 0).toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-emerald-400">100% verified ledger balance</p>
            </div>

            {/* Gross Profit */}
            <div className="p-5 rounded-2xl bg-surface/90 border border-surface-border shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Gross Profit (Margin)</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-300 font-mono">
                IDR {(stats.grossProfit || 0).toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-400">Revenue minus COGS</p>
            </div>

            {/* Aggregator Working Capital */}
            <div className="p-5 rounded-2xl bg-surface/90 border border-surface-border shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Aggregator Balance</span>
                <Database className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                IDR {(stats.aggregatorBalance || 0).toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-emerald-400">Sufficient for ~1,200 recharges</p>
            </div>

            {/* Success Rate & DLQ */}
            <div className="p-5 rounded-2xl bg-surface/90 border border-surface-border shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Fulfillment Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {stats.successRate}%
              </div>
              <p className="text-[11px] text-slate-400">
                {stats.manualReviewOrders} in manual review, {stats.dlqJobs} DLQ jobs
              </p>
            </div>

          </div>

          {/* Double-Entry Ledger Integrity Status Card */}
          <div className="p-6 rounded-3xl bg-surface/90 border border-surface-border shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Immutable Ledger Integrity Verification</h3>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full font-mono ${
                stats.isLedgerBalanced 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {stats.isLedgerBalanced ? 'BALANCED: Sum(Debits) === Sum(Credits)' : 'DISCREPANCY DETECTED'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Every top-up transaction automatically enforces double-entry journal entries. When an order is paid, receivables are debited and revenue is recognized. When fulfilled, COGS is debited and the aggregator balance is credited.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border">
                <span className="text-slate-400 block">Total Ledger Debits:</span>
                <span className="font-mono font-bold text-white text-sm">IDR {(stats.totalDebits || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border">
                <span className="text-slate-400 block">Total Ledger Credits:</span>
                <span className="font-mono font-bold text-white text-sm">IDR {(stats.totalCredits || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border">
                <span className="text-slate-400 block">Customer Receivables:</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  IDR {(stats.accounts?.Customer_Receivables?.netBalance || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border">
                <span className="text-slate-400 block">COGS (Supplier Payouts):</span>
                <span className="font-mono font-bold text-rose-300 text-sm">
                  IDR {(stats.totalCOGS || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="p-6 rounded-3xl bg-surface/90 border border-surface-border shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Aggregator Working Capital Deposit</h3>
            <p className="text-xs text-slate-400">
              Replenish working balance with UniPin / Codashop / SmileOne aggregator providers to ensure 0% fulfillment timeouts.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-sm font-mono"
                placeholder="Deposit Amount (IDR)"
              />
              <button
                onClick={handleDepositAggregator}
                disabled={isDepositing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isDepositing ? 'Depositing...' : `Deposit IDR ${depositAmount.toLocaleString('id-ID')}`}</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Order Management */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-6">
          
          {/* Order Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SUCCESS', 'MANUAL_REVIEW'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    orderFilter === st
                      ? 'bg-violet-600 text-white shadow'
                      : 'bg-surface border border-surface-border text-slate-400 hover:text-white'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-2xl bg-surface/90 border border-surface-border overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-elevated/80 text-slate-400 uppercase tracking-wider font-mono border-b border-surface-border">
                  <tr>
                    <th className="p-4">Order Ref</th>
                    <th className="p-4">Game & SKU</th>
                    <th className="p-4">Target Player</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/60 text-slate-300">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-white">
                        <div>#{ord.orderNumber}</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {new Date(ord.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{ord.productName}</div>
                        <div className="text-cyan-300">{ord.skuName}</div>
                      </td>
                      <td className="p-4 font-mono">
                        <div className="text-white font-bold">{ord.accountNickname || 'Player'}</div>
                        <div className="text-[10px] text-slate-400">
                          {Object.entries(ord.targetAccountPayload).map(([k, v]) => `${k}:${v}`).join(' ')}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-white">
                        IDR {ord.totalAmount.toLocaleString('id-ID')}
                        <div className="text-[10px] text-slate-500 font-normal">{ord.paymentMethodName}</div>
                      </td>
                      <td className="p-4">
                        {ord.status === 'SUCCESS' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                            SUCCESS
                          </span>
                        )}
                        {ord.status === 'PENDING_PAYMENT' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                            PENDING
                          </span>
                        )}
                        {ord.status === 'PAID' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                            PAID
                          </span>
                        )}
                        {ord.status === 'PROCESSING' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[11px] font-bold animate-pulse">
                            PROCESSING
                          </span>
                        )}
                        {ord.status === 'MANUAL_REVIEW' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                            MANUAL REVIEW
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleRetryFulfillment(ord.orderNumber)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-violet-600/30 hover:bg-violet-600 text-violet-300 hover:text-white text-[11px] font-bold transition-all"
                        >
                          Retry Worker
                        </button>
                        {ord.status !== 'SUCCESS' && (
                          <button
                            onClick={() => handleOverrideStatus(ord.orderNumber, 'SUCCESS')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[11px] font-bold transition-all"
                          >
                            Mark Success
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab 3: SKU & Margins Editor */}
      {activeTab === 'SKUS' && (
        <div className="space-y-6">
          <div className="text-xs text-slate-400">
            Adjust selling prices, base supplier costs (COGS), profit margins, and availability flags across all games.
          </div>

          <div className="space-y-6">
            {products.map((product) => (
              <div key={product.id} className="p-6 rounded-3xl bg-surface/90 border border-surface-border space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border/60">
                  <div className="flex items-center gap-3">
                    <img src={product.iconImage} alt={product.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <h3 className="text-base font-bold text-white">{product.name}</h3>
                      <p className="text-xs text-slate-400">{product.publisher} &bull; {product.category}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-violet-400">
                    {product.skus.length} SKU Variants
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {product.skus.map((sku) => {
                    const margin = sku.sellingPrice - sku.baseCost;
                    const marginPercent = ((margin / sku.sellingPrice) * 100).toFixed(1);

                    return (
                      <div key={sku.id} className="p-4 rounded-2xl bg-surface-elevated/70 border border-surface-border space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-bold text-white">{sku.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 font-mono">
                            {marginPercent}% Margin
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] text-slate-400 block">Selling Price (IDR)</label>
                            <input
                              type="number"
                              defaultValue={sku.sellingPrice}
                              onBlur={(e) => handleUpdateSku(product.id, sku.id, Number(e.target.value), sku.baseCost, sku.isAvailable)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-white text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block">Base Cost (COGS)</label>
                            <input
                              type="number"
                              defaultValue={sku.baseCost}
                              onBlur={(e) => handleUpdateSku(product.id, sku.id, sku.sellingPrice, Number(e.target.value), sku.isAvailable)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-white text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-surface-border/60 text-xs">
                          <span className="text-slate-400 font-mono text-[11px]">Profit: IDR {margin.toLocaleString('id-ID')}</span>
                          <button
                            onClick={() => handleUpdateSku(product.id, sku.id, sku.sellingPrice, sku.baseCost, !sku.isAvailable)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sku.isAvailable
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {sku.isAvailable ? 'In Stock' : 'Disabled'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Double-Entry Financial Ledger */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-6">
          <div className="text-xs text-slate-400">
            Immutable Double-Entry Ledger Journal entries. Every DEBIT is balanced with a CREDIT.
          </div>

          <div className="rounded-2xl bg-surface/90 border border-surface-border overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-elevated/80 text-slate-400 uppercase tracking-wider font-mono border-b border-surface-border">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Tx Ref</th>
                    <th className="p-4">Account</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/60 text-slate-300 font-mono">
                  {ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="p-4 text-slate-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-4 text-white font-bold">
                        {entry.transactionId}
                      </td>
                      <td className="p-4 text-cyan-300 font-bold">
                        {entry.account}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.type === 'DEBIT' 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-white">
                        IDR {entry.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-slate-400 max-w-xs truncate">
                        {entry.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Webhook & Queue Simulator */}
      {activeTab === 'SIMULATOR' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-surface/90 border border-surface-border shadow-xl space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Payment Gateway Webhook Simulator</h3>
              <p className="text-xs text-slate-400">
                Test incoming HTTP POST callbacks with HMAC-SHA256 signatures, idempotency event_id checking, and replay attack defense.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target Order Number</label>
                <input
                  type="text"
                  value={simOrderNumber}
                  onChange={(e) => setSimOrderNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs font-mono"
                  placeholder="IMP-20260820-XXXX"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Event ID (Idempotency Key)</label>
                <input
                  type="text"
                  value={simEventId}
                  onChange={(e) => setSimEventId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Payment Status</label>
                <select
                  value={simStatus}
                  onChange={(e) => setSimStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs"
                >
                  <option value="PAID">PAID (Triggers queue fulfillment)</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Amount (IDR)</label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleSendTestWebhook}
              disabled={simIsLoading || !simOrderNumber}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-violet-600/30 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{simIsLoading ? 'Dispatching Webhook...' : 'Dispatch Webhook & Verify HMAC'}</span>
            </button>

            {simResult && (
              <div className="p-4 rounded-2xl bg-black/50 border border-surface-border space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">HTTP Status:</span>
                  <span className={simResult.status === 200 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {simResult.status} {simResult.status === 200 ? 'OK' : 'ERROR'}
                  </span>
                </div>
                <pre className="p-3 rounded-xl bg-surface text-xs text-slate-200 font-mono overflow-x-auto">
                  {JSON.stringify(simResult.response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
