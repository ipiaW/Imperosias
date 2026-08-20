A full-stack **Top-Up Web Application** requires tight coordination between account validation, payment gateways, balance/item fulfillment aggregators, and an immutable ledger system.

---

### 1. System Architecture & Tech Stack

```
[ Client: Next.js / React ] 
         │  (HTTPS / REST or tRPC)
[ API Gateway & Load Balancer: NGINX / Cloudflare ]
         │
[ Backend: Node.js (NestJS) / Go (Fiber) ] ── (Queue: BullMQ / Redis)
         ├── Database: PostgreSQL (ACID Transactions)
         ├── Cache / Rate Limiter: Redis
         ├── Payment Aggregators (Stripe, Midtrans, Xendit)
         └── Product Fulfillment Providers (APIs like UniPin, Codashop, SmileOne, or Telco Aggregators)

```

---

### 2. Core Modules & Technical Specifications

**A. User & Guest Checkout Flow**

* **Identity Management:** JWT (stateless access tokens + rotating refresh tokens in `HttpOnly` cookies). Support OAuth 2.0 (Google, Discord).
* **Guest Transactions:** Allow checkouts without account creation by capturing raw contact details (`email`, `phone_number`) tied to an `order_id` to reduce drop-off rates.

**B. Product Catalog & Target Account Validation**

* **Dynamic Form Fields:** Games require distinct ID formats (e.g., Mobile Legends requires `User ID` + `Zone ID`; Genshin Impact requires `UID` + `Server`). Store input field schemas in JSON within the database.
* **Real-Time Account Validation API:**
* Trigger an asynchronous check to the aggregator API (e.g., `POST /api/v1/validate-account`) when user completes inputs to display the in-game nickname before payment.


* **Denomination Matrix:** Tiered SKUs, profit margins, dynamic discounting, and real-time inventory checks.

**C. Payment Gateway Integration**

* **Multi-Gateway Routing:** Fallback strategy across e-wallets, virtual accounts, QR codes, and cards.
* **Webhook Ingestion Engine:**
* **Idempotency:** Verify `event_id` or transaction hash to prevent double-crediting.
* **Signature Verification:** Compute HMAC-SHA256 of the payload using the gateway secret key before processing.
* **Replay Attack Defense:** Reject webhook events with timestamps older than 5 minutes.



**D. Automated Fulfillment Engine**

* **Asynchronous Queue (BullMQ / RabbitMQ):** Offload external top-up API calls to a worker queue.
* **Worker Execution Policy:**
* Auto-retry with exponential backoff for network timeouts (`HTTP 502/504`).
* Instant fail and route to "Manual Review" on critical business errors (e.g., `INSUFFICIENT_AGGREGATOR_BALANCE`, `INVALID_USER_ID`).


* **Dead Letter Queue (DLQ):** Capture failed tasks for automated alerting (Slack/Telegram webhooks).

**E. Ledger & Wallet System (Double-Entry Bookkeeping)**

* Do not store balances simply as an integer column that gets overwritten.
* Implement double-entry transaction tables:
* Every top-up creates a `DEBIT` to the `Customer_Receivables` account and a `CREDIT` to `Revenue`.
* Every payout to an aggregator logs a `DEBIT` to `COGS` and a `CREDIT` to `Aggregator_Balance`.



---

### 3. Database Schema (PostgreSQL DDL Reference)

```sql
-- Product and SKU
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    form_schema JSONB NOT NULL, -- e.g. [{"name": "userId", "type": "number"}, {"name": "zoneId", "type": "number"}]
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE skus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    name VARCHAR(100) NOT NULL,
    provider_sku_code VARCHAR(100) NOT NULL,
    base_cost DECIMAL(12, 2) NOT NULL,
    selling_price DECIMAL(12, 2) NOT NULL,
    is_available BOOLEAN DEFAULT true
);

-- Transaction Management
CREATE TYPE order_status AS ENUM ('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SUCCESS', 'FAILED', 'MANUAL_REVIEW');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(32) UNIQUE NOT NULL,
    user_id UUID NULL, -- Nullable for guest checkouts
    sku_id UUID REFERENCES skus(id),
    target_account_payload JSONB NOT NULL, -- {"userId": "123456", "zoneId": "1234"}
    account_nickname VARCHAR(100),
    amount DECIMAL(12, 2) NOT NULL,
    status order_status DEFAULT 'PENDING_PAYMENT',
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Idempotency and Webhooks
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    event_id VARCHAR(100) UNIQUE NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

```

---

### 4. End-to-End Execution Pipeline

```
1. Customer selects SKU + Inputs ID 
   └─> Frontend calls /api/v1/product/validate-target (fetches in-game name)
2. Customer selects Payment Method & Clicks "Pay"
   └─> POST /api/v1/orders/create (DB: PENDING_PAYMENT)
   └─> Backend calls Payment Gateway (returns QR code / redirect URL)
3. Customer completes payment
   └─> Payment Gateway triggers webhook -> POST /api/v1/webhooks/payment
   └─> Backend verifies HMAC signature, checks idempotency key
   └─> DB: Updates order status to PAID
   └─> Push job to BullMQ queue: 'process-topup'
4. BullMQ Worker processes job:
   └─> Calls Aggregator/Supplier API with provider_sku_code + target_account_payload
   └─> IF Success: DB -> SUCCESS -> Push notification / Email receipt to user
   └─> IF Timeout: Retry queue (exponential backoff)
   └─> IF Hard Failure: DB -> MANUAL_REVIEW -> Push alert to Admin Telegram

```

---

### 5. Security & Reliability Checklist

* **Distributed Locks (Redis Redlock):** Wrap order processing logic in distributed locks keyed by `order_id` to prevent race conditions during concurrent webhook callbacks.
* **Rate Limiting:** Implement IP and token-based rate limits (Token Bucket algorithm via Redis) on target account validation endpoints to prevent API scraping and provider rate-exhaustion.
* **Database Concurrency:** Use `SELECT ... FOR UPDATE` when reading user balance in closed-loop internal wallet scenarios.
* **Admin Backoffice (RBAC):** Build an internal dashboard with strict Role-Based Access Control to manually trigger fulfillment retries, adjust margins, manage aggregator deposits, and view audit logs.

