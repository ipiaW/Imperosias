import { JournalEntry, LedgerAccountType, Order } from '../types';

export interface LedgerSummary {
  accounts: Record<LedgerAccountType, { debit: number; credit: number; netBalance: number }>;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
}

/**
 * Creates double-entry journal entries when an order is paid
 * Every top-up creates a DEBIT to Customer_Receivables (or User_Wallet) and a CREDIT to Revenue
 */
export function createPaymentJournalEntries(order: Order): JournalEntry[] {
  const now = new Date().toISOString();
  const isWallet = order.paymentMethodId === 'pay-internal-wallet';

  const debitAccount: LedgerAccountType = isWallet ? 'User_Wallet' : 'Customer_Receivables';
  
  return [
    {
      id: `je-pay-dr-${order.orderNumber}-${Date.now()}`,
      transactionId: order.orderNumber,
      account: debitAccount,
      type: 'DEBIT',
      amount: order.totalAmount,
      description: `Payment received for Order #${order.orderNumber} via ${order.paymentMethodName}`,
      timestamp: now
    },
    {
      id: `je-pay-cr-${order.orderNumber}-${Date.now()}`,
      transactionId: order.orderNumber,
      account: 'Revenue',
      type: 'CREDIT',
      amount: order.totalAmount,
      description: `Revenue recognized for ${order.productName} - ${order.skuName}`,
      timestamp: now
    }
  ];
}

/**
 * Creates double-entry journal entries when an order is fulfilled by aggregator
 * Every payout to an aggregator logs a DEBIT to COGS and a CREDIT to Aggregator_Balance
 */
export function createFulfillmentJournalEntries(order: Order): JournalEntry[] {
  const now = new Date().toISOString();
  
  return [
    {
      id: `je-ful-dr-${order.orderNumber}-${Date.now()}`,
      transactionId: order.orderNumber,
      account: 'COGS',
      type: 'DEBIT',
      amount: order.baseCost,
      description: `Cost of Goods Sold (COGS) for Order #${order.orderNumber} (${order.providerSkuCode})`,
      timestamp: now
    },
    {
      id: `je-ful-cr-${order.orderNumber}-${Date.now()}`,
      transactionId: order.orderNumber,
      account: 'Aggregator_Balance',
      type: 'CREDIT',
      amount: order.baseCost,
      description: `Supplier balance deducted for ${order.providerSkuCode} to ${order.accountNickname || 'target user'}`,
      timestamp: now
    }
  ];
}

/**
 * Creates journal entries for topping up supplier/aggregator working capital
 */
export function createAggregatorDepositJournalEntries(amount: number, reference: string): JournalEntry[] {
  const now = new Date().toISOString();
  
  return [
    {
      id: `je-dep-dr-${Date.now()}`,
      transactionId: reference,
      account: 'Aggregator_Balance',
      type: 'DEBIT',
      amount: amount,
      description: `Aggregator working capital deposit ref: ${reference}`,
      timestamp: now
    },
    {
      id: `je-dep-cr-${Date.now()}`,
      transactionId: reference,
      account: 'Customer_Receivables',
      type: 'CREDIT',
      amount: amount,
      description: `Bank transfer to supplier aggregator ref: ${reference}`,
      timestamp: now
    }
  ];
}

/**
 * Computes trial balance, account balances, and verifies double-entry integrity
 */
export function computeLedgerSummary(entries: JournalEntry[], initialAggregatorBalance = 50000000): LedgerSummary {
  const accountTypes: LedgerAccountType[] = [
    'Customer_Receivables',
    'Revenue',
    'COGS',
    'Aggregator_Balance',
    'User_Wallet',
    'Payment_Gateway_Clearing',
    'Operating_Expense'
  ];

  const accounts: Record<LedgerAccountType, { debit: number; credit: number; netBalance: number }> = {} as any;

  accountTypes.forEach((acc) => {
    accounts[acc] = { debit: 0, credit: 0, netBalance: 0 };
  });

  let totalDebits = 0;
  let totalCredits = 0;

  // Add initial aggregator balance as baseline DEBIT to Aggregator_Balance
  accounts['Aggregator_Balance'].debit += initialAggregatorBalance;
  totalDebits += initialAggregatorBalance;
  accounts['Customer_Receivables'].credit += initialAggregatorBalance;
  totalCredits += initialAggregatorBalance;

  entries.forEach((entry) => {
    if (!accounts[entry.account]) {
      accounts[entry.account] = { debit: 0, credit: 0, netBalance: 0 };
    }

    if (entry.type === 'DEBIT') {
      accounts[entry.account].debit += entry.amount;
      totalDebits += entry.amount;
    } else {
      accounts[entry.account].credit += entry.amount;
      totalCredits += entry.amount;
    }
  });

  // Calculate Net Balances per standard accounting rules
  // Asset & Expense accounts: Net = Debit - Credit
  // Liability, Equity & Revenue accounts: Net = Credit - Debit
  accounts['Customer_Receivables'].netBalance = accounts['Customer_Receivables'].debit - accounts['Customer_Receivables'].credit;
  accounts['COGS'].netBalance = accounts['COGS'].debit - accounts['COGS'].credit;
  accounts['Aggregator_Balance'].netBalance = accounts['Aggregator_Balance'].debit - accounts['Aggregator_Balance'].credit;
  accounts['Operating_Expense'].netBalance = accounts['Operating_Expense'].debit - accounts['Operating_Expense'].credit;

  accounts['Revenue'].netBalance = accounts['Revenue'].credit - accounts['Revenue'].debit;
  accounts['User_Wallet'].netBalance = accounts['User_Wallet'].credit - accounts['User_Wallet'].debit;
  accounts['Payment_Gateway_Clearing'].netBalance = accounts['Payment_Gateway_Clearing'].debit - accounts['Payment_Gateway_Clearing'].credit;

  const totalRevenue = accounts['Revenue'].netBalance;
  const totalCOGS = accounts['COGS'].netBalance;
  const grossProfit = totalRevenue - totalCOGS;
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return {
    accounts,
    totalDebits,
    totalCredits,
    isBalanced,
    totalRevenue,
    totalCOGS,
    grossProfit
  };
}
