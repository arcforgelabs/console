-- Orders precede provider effects. Capabilities are hashed, never stored in clear.
CREATE TABLE checkout_orders (
  id TEXT PRIMARY KEY,
  capability_hash TEXT NOT NULL,
  sku TEXT NOT NULL,
  price_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  origin TEXT NOT NULL,
  session_id TEXT UNIQUE
);
CREATE TABLE stripe_events (
  event_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES checkout_orders(id),
  subscription_id TEXT NOT NULL,
  received_at INTEGER NOT NULL
);
-- Receipt and outbox are inserted in one D1 transaction.
CREATE TABLE checkout_outbox (
  event_id TEXT PRIMARY KEY REFERENCES stripe_events(event_id),
  sent_at INTEGER
);
