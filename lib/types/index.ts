export type GameCategory = 'MOBILE' | 'PC' | 'CONSOLE' | 'VOUCHER' | 'STREAMING';

export interface FormSchemaField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  required: boolean;
  options?: { label: string; value: string }[];
  helperText?: string;
  validationRegex?: string;
}

export interface Sku {
  id: string;
  productId: string;
  name: string;
  providerSkuCode: string;
  baseCost: number;     // COGS (Cost of Goods Sold)
  sellingPrice: number; // Customer price
  originalPrice?: number;
  bonusText?: string;
  icon?: string;
  isAvailable: boolean;
  stockCount?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  publisher: string;
  category: GameCategory;
  bannerImage: string;
  iconImage: string;
  description: string;
  formSchema: FormSchemaField[];
  skus: Sku[];
  isActive: boolean;
  isTrending?: boolean;
  badge?: string;
  rating?: number;
  instantDelivery: boolean;
}

export type OrderStatus = 
  | 'PENDING_PAYMENT' 
  | 'PAID' 
  | 'PROCESSING' 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'MANUAL_REVIEW';

export type PaymentChannelCategory = 'QRIS' | 'EWALLET' | 'VIRTUAL_ACCOUNT' | 'CARD' | 'WALLET' | 'CRYPTO';

export interface PaymentMethod {
  id: string;
  name: string;
  category: PaymentChannelCategory;
  icon: string;
  feePercent: number;
  feeFlat: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  instructions: string[];
}

export interface TargetAccountPayload {
  [key: string]: string | number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerEmail: string;
  customerPhone: string;
  productId: string;
  productName: string;
  productSlug: string;
  productIcon: string;
  skuId: string;
  skuName: string;
  providerSkuCode: string;
  targetAccountPayload: TargetAccountPayload;
  accountNickname?: string;
  baseCost: number;
  subtotal: number;
  fee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethodId: string;
  paymentMethodName: string;
  paymentReference?: string; // QR payload, VA number, or checkout link
  paymentExpiredAt: string;
  paidAt?: string;
  fulfilledAt?: string;
  failureReason?: string;
  manualReviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Double-Entry Bookkeeping Ledger
export type LedgerAccountType = 
  | 'Customer_Receivables'
  | 'Revenue'
  | 'COGS'
  | 'Aggregator_Balance'
  | 'User_Wallet'
  | 'Payment_Gateway_Clearing'
  | 'Operating_Expense';

export type EntryType = 'DEBIT' | 'CREDIT';

export interface JournalEntry {
  id: string;
  transactionId: string; // references orderNumber or deposit ID
  account: LedgerAccountType;
  type: EntryType;
  amount: number;
  description: string;
  timestamp: string;
}

export interface WebhookLog {
  id: string;
  provider: string;
  eventId: string;
  signature: string;
  payload: Record<string, any>;
  isSignatureValid: boolean;
  isIdempotent: boolean;
  status: 'PROCESSED' | 'REJECTED_REPLAY' | 'REJECTED_SIGNATURE' | 'DUPLICATE_IGNORED';
  processedAt: string;
}

export interface FulfillmentJob {
  id: string;
  orderNumber: string;
  providerSkuCode: string;
  targetAccountPayload: TargetAccountPayload;
  attemptCount: number;
  maxAttempts: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'RETRY_PENDING' | 'DLQ';
  lastError?: string;
  nextRetryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWallet {
  userId: string;
  username: string;
  email: string;
  balance: number;
  currency: string;
}

export interface AccountValidationResult {
  isValid: boolean;
  nickname?: string;
  avatar?: string;
  region?: string;
  level?: number;
  rawResponse?: Record<string, any>;
  errorMessage?: string;
}
