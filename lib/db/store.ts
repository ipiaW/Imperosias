import fs from 'fs';
import path from 'path';
import { 
  Product, 
  Order, 
  JournalEntry, 
  WebhookLog, 
  FulfillmentJob, 
  UserWallet, 
  PaymentMethod,
  OrderStatus 
} from '../types';
import { INITIAL_PRODUCTS, PAYMENT_METHODS } from '../mock/seed-data';
import { createPaymentJournalEntries, createFulfillmentJournalEntries, computeLedgerSummary } from '../ledger/bookkeeping';

interface DatabaseSchema {
  products: Product[];
  paymentMethods: PaymentMethod[];
  orders: Order[];
  ledgerEntries: JournalEntry[];
  webhookLogs: WebhookLog[];
  fulfillmentJobs: FulfillmentJob[];
  userWallets: UserWallet[];
  aggregatorBalance: number;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'imperosias_db.json');

// In-memory cache
let cachedDb: DatabaseSchema | null = null;

function ensureDbFile(): DatabaseSchema {
  if (cachedDb) return cachedDb;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      products: INITIAL_PRODUCTS,
      paymentMethods: PAYMENT_METHODS,
      orders: [
        {
          id: 'ord-seed-01',
          orderNumber: 'IMP-20260820-9182',
          userId: 'user-demo-01',
          customerEmail: 'alex.gamer@example.com',
          customerPhone: '081298765432',
          productId: 'prod-mlbb',
          productName: 'Mobile Legends: Bang Bang',
          productSlug: 'mobile-legends',
          productIcon: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=300&auto=format&fit=crop',
          skuId: 'sku-ml-257',
          skuName: '257 Diamonds (234 + 23 Bonus)',
          providerSkuCode: 'MLBB_257_DIA',
          targetAccountPayload: { userId: '12847592', zoneId: '2024' },
          accountNickname: 'Shadow_Slayer_99',
          baseCost: 54000,
          subtotal: 61500,
          fee: 500,
          totalAmount: 62000,
          status: 'SUCCESS',
          paymentMethodId: 'pay-qris',
          paymentMethodName: 'QRIS',
          paymentReference: '00020101021226580016ID.CO.IMPEROSIAS.WWW01189360091800202608205204581253033605802ID5910IMPEROSIAS6007JAKARTA62070703A016304E8A2',
          paymentExpiredAt: new Date(Date.now() - 3600000).toISOString(),
          paidAt: new Date(Date.now() - 3500000).toISOString(),
          fulfilledAt: new Date(Date.now() - 3495000).toISOString(),
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3495000).toISOString(),
        }
      ],
      ledgerEntries: [
        {
          id: 'je-seed-1',
          transactionId: 'IMP-20260820-9182',
          account: 'Customer_Receivables',
          type: 'DEBIT',
          amount: 62000,
          description: 'Payment received for Order #IMP-20260820-9182 via QRIS',
          timestamp: new Date(Date.now() - 3500000).toISOString()
        },
        {
          id: 'je-seed-2',
          transactionId: 'IMP-20260820-9182',
          account: 'Revenue',
          type: 'CREDIT',
          amount: 62000,
          description: 'Revenue recognized for Mobile Legends: Bang Bang - 257 Diamonds',
          timestamp: new Date(Date.now() - 3500000).toISOString()
        },
        {
          id: 'je-seed-3',
          transactionId: 'IMP-20260820-9182',
          account: 'COGS',
          type: 'DEBIT',
          amount: 54000,
          description: 'COGS for Order #IMP-20260820-9182 (MLBB_257_DIA)',
          timestamp: new Date(Date.now() - 3495000).toISOString()
        },
        {
          id: 'je-seed-4',
          transactionId: 'IMP-20260820-9182',
          account: 'Aggregator_Balance',
          type: 'CREDIT',
          amount: 54000,
          description: 'Supplier balance deducted for MLBB_257_DIA to Shadow_Slayer_99',
          timestamp: new Date(Date.now() - 3495000).toISOString()
        }
      ],
      webhookLogs: [
        {
          id: 'wh-seed-01',
          provider: 'QRIS_GATEWAY',
          eventId: 'evt_sim_918204128',
          signature: '8f92a1b7c4e5d6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
          payload: { order_number: 'IMP-20260820-9182', amount: 62000, status: 'PAID' },
          isSignatureValid: true,
          isIdempotent: true,
          status: 'PROCESSED',
          processedAt: new Date(Date.now() - 3500000).toISOString()
        }
      ],
      fulfillmentJobs: [],
      userWallets: [
        {
          userId: 'user-demo-01',
          username: 'ProGamerVIP',
          email: 'alex.gamer@example.com',
          balance: 250000,
          currency: 'IDR'
        }
      ],
      aggregatorBalance: 50000000 // IDR 50,000,000 baseline working capital
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    cachedDb = initialData;
    return cachedDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    cachedDb = JSON.parse(raw);
    return cachedDb!;
  } catch (err) {
    console.error('Error reading DB, re-initializing:', err);
    fs.unlinkSync(DB_FILE);
    return ensureDbFile();
  }
}

function persistDb(data: DatabaseSchema): void {
  cachedDb = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting database:', err);
  }
}

// ---------------- Product & SKU API ----------------
export function getProducts(): Product[] {
  const db = ensureDbFile();
  return db.products.filter(p => p.isActive);
}

export function getAllProductsAdmin(): Product[] {
  const db = ensureDbFile();
  return db.products;
}

export function getProductBySlug(slug: string): Product | null {
  const db = ensureDbFile();
  return db.products.find(p => p.slug === slug) || null;
}

export function updateProduct(product: Product): Product {
  const db = ensureDbFile();
  const idx = db.products.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    db.products[idx] = product;
  } else {
    db.products.push(product);
  }
  persistDb(db);
  return product;
}

export function updateSku(productId: string, skuId: string, patch: Partial<Product['skus'][0]>): Product | null {
  const db = ensureDbFile();
  const product = db.products.find(p => p.id === productId);
  if (!product) return null;

  const sku = product.skus.find(s => s.id === skuId);
  if (!sku) return null;

  Object.assign(sku, patch);
  persistDb(db);
  return product;
}

// ---------------- Payment Methods ----------------
export function getPaymentMethods(): PaymentMethod[] {
  const db = ensureDbFile();
  return db.paymentMethods.filter(pm => pm.isActive);
}

// ---------------- Orders & Transactions ----------------
export function createOrder(order: Order): Order {
  const db = ensureDbFile();
  db.orders.unshift(order);
  persistDb(db);
  return order;
}

export function getOrder(orderNumber: string): Order | null {
  const db = ensureDbFile();
  return db.orders.find(o => o.orderNumber === orderNumber) || null;
}

export function getOrders(query?: { status?: OrderStatus; search?: string; limit?: number }): Order[] {
  const db = ensureDbFile();
  let list = [...db.orders];

  if (query?.status) {
    list = list.filter(o => o.status === query.status);
  }

  if (query?.search) {
    const q = query.search.toLowerCase();
    list = list.filter(o => 
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q) ||
      o.productName.toLowerCase().includes(q) ||
      (o.accountNickname && o.accountNickname.toLowerCase().includes(q))
    );
  }

  if (query?.limit) {
    list = list.slice(0, query.limit);
  }

  return list;
}

export function updateOrderStatus(
  orderNumber: string, 
  status: OrderStatus, 
  extras?: { paidAt?: string; fulfilledAt?: string; failureReason?: string; manualReviewNotes?: string }
): Order | null {
  const db = ensureDbFile();
  const order = db.orders.find(o => o.orderNumber === orderNumber);
  if (!order) return null;

  order.status = status;
  order.updatedAt = new Date().toISOString();

  if (extras?.paidAt) order.paidAt = extras.paidAt;
  if (extras?.fulfilledAt) order.fulfilledAt = extras.fulfilledAt;
  if (extras?.failureReason) order.failureReason = extras.failureReason;
  if (extras?.manualReviewNotes) order.manualReviewNotes = extras.manualReviewNotes;

  // Bookkeeping triggers
  if (status === 'PAID') {
    const paymentEntries = createPaymentJournalEntries(order);
    db.ledgerEntries.push(...paymentEntries);
  } else if (status === 'SUCCESS') {
    const fulfillmentEntries = createFulfillmentJournalEntries(order);
    db.ledgerEntries.push(...fulfillmentEntries);
    db.aggregatorBalance -= order.baseCost;
  }

  persistDb(db);
  return order;
}

// ---------------- Webhooks & Idempotency ----------------
export function hasProcessedEventId(eventId: string): boolean {
  const db = ensureDbFile();
  return db.webhookLogs.some(log => log.eventId === eventId);
}

export function saveWebhookLog(log: WebhookLog): void {
  const db = ensureDbFile();
  db.webhookLogs.unshift(log);
  if (db.webhookLogs.length > 500) {
    db.webhookLogs = db.webhookLogs.slice(0, 500);
  }
  persistDb(db);
}

export function getWebhookLogs(): WebhookLog[] {
  const db = ensureDbFile();
  return db.webhookLogs;
}

// ---------------- Fulfillment Queue ----------------
export function enqueueFulfillmentJob(job: Omit<FulfillmentJob, 'id' | 'createdAt' | 'updatedAt'>): FulfillmentJob {
  const db = ensureDbFile();
  const fullJob: FulfillmentJob = {
    ...job,
    id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.fulfillmentJobs.unshift(fullJob);
  persistDb(db);
  return fullJob;
}

export function getFulfillmentJobs(): FulfillmentJob[] {
  const db = ensureDbFile();
  return db.fulfillmentJobs;
}

export function updateFulfillmentJob(jobId: string, patch: Partial<FulfillmentJob>): FulfillmentJob | null {
  const db = ensureDbFile();
  const job = db.fulfillmentJobs.find(j => j.id === jobId);
  if (!job) return null;

  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  persistDb(db);
  return job;
}

// ---------------- Double-Entry Ledger ----------------
export function getJournalEntries(): JournalEntry[] {
  const db = ensureDbFile();
  return db.ledgerEntries;
}

export function addJournalEntry(entry: JournalEntry): void {
  const db = ensureDbFile();
  db.ledgerEntries.push(entry);
  persistDb(db);
}

export function getLedgerStats() {
  const db = ensureDbFile();
  return computeLedgerSummary(db.ledgerEntries, db.aggregatorBalance);
}

// ---------------- User Wallets ----------------
export function getUserWallet(userId = 'user-demo-01'): UserWallet {
  const db = ensureDbFile();
  let wallet = db.userWallets.find(w => w.userId === userId);
  if (!wallet) {
    wallet = {
      userId,
      username: 'ProGamerVIP',
      email: 'alex.gamer@example.com',
      balance: 250000,
      currency: 'IDR'
    };
    db.userWallets.push(wallet);
    persistDb(db);
  }
  return wallet;
}

export function deductUserWallet(userId: string, amount: number): boolean {
  const db = ensureDbFile();
  const wallet = db.userWallets.find(w => w.userId === userId);
  if (!wallet || wallet.balance < amount) return false;

  wallet.balance -= amount;
  persistDb(db);
  return true;
}

export function topupUserWallet(userId: string, amount: number): UserWallet {
  const db = ensureDbFile();
  let wallet = getUserWallet(userId);
  wallet.balance += amount;
  persistDb(db);
  return wallet;
}

// ---------------- Admin Aggregator Balance ----------------
export function getAggregatorBalance(): number {
  const db = ensureDbFile();
  return db.aggregatorBalance;
}

export function depositAggregatorBalance(amount: number, ref = 'BANK_TRANSFER_BCA'): number {
  const db = ensureDbFile();
  db.aggregatorBalance += amount;
  
  // Create journal entry for deposit
  const now = new Date().toISOString();
  db.ledgerEntries.push(
    {
      id: `je-dep-dr-${Date.now()}`,
      transactionId: ref,
      account: 'Aggregator_Balance',
      type: 'DEBIT',
      amount: amount,
      description: `Aggregator working capital deposit ref: ${ref}`,
      timestamp: now
    },
    {
      id: `je-dep-cr-${Date.now()}`,
      transactionId: ref,
      account: 'Customer_Receivables',
      type: 'CREDIT',
      amount: amount,
      description: `Bank transfer to supplier aggregator ref: ${ref}`,
      timestamp: now
    }
  );

  persistDb(db);
  return db.aggregatorBalance;
}
