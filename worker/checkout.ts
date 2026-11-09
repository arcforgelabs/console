import Stripe from 'stripe'

// Optional until platform activation; missing bindings always fail closed.
export interface CheckoutEnv {
  CHECKOUT_DB?: D1Database
  PROVISIONING_QUEUE?: Queue<ProvisioningReference>
  CHECKOUT_LIMITER?: {
    limit(input: { key: string }): Promise<{ success: boolean }>
  }
  CHECKOUT_ORIGIN?: string
  CHECKOUT_CATALOGUE?: string
  TURNSTILE_SITE_KEY?: string
  TURNSTILE_SECRET_KEY?: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
}
export interface ProvisioningReference {
  schema_version: 1
  source: 'stripe'
  event_id: string
  subscription_id: string
  order_id: string
}
type Product = { sku: string; label: string; price_id: string }
type Order = {
  id: string
  capability_hash: string
  sku: string
  price_id: string
  created_at: number
  origin: string
  session_id: string | null
}
class Rejection extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}
const reject = (status: number, message: string): never => {
  throw new Rejection(status, message)
}
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'cache-control': 'no-store' } })
function catalogue(env: CheckoutEnv): Product[] {
  const rows: unknown = JSON.parse(env.CHECKOUT_CATALOGUE || '[]')
  if (
    !Array.isArray(rows) ||
    rows.some(
      (p) =>
        !p ||
        typeof p.sku !== 'string' ||
        typeof p.label !== 'string' ||
        !/^price_[a-zA-Z0-9]+$/.test(p.price_id)
    ) ||
    new Set(rows.map((p) => p.sku)).size !== rows.length
  )
    reject(503, 'Catalogue unavailable')
  return rows as Product[]
}
function configured(env: CheckoutEnv) {
  if (
    !/^(?:sk|rk)_test_.+/.test(env.STRIPE_SECRET_KEY || '') ||
    !env.CHECKOUT_DB ||
    !env.PROVISIONING_QUEUE ||
    !env.STRIPE_WEBHOOK_SECRET ||
    !env.CHECKOUT_ORIGIN ||
    new URL(env.CHECKOUT_ORIGIN).origin !== env.CHECKOUT_ORIGIN ||
    !env.CHECKOUT_ORIGIN.startsWith('https://')
  )
    reject(503, 'Test checkout is not configured')
  return {
    db: env.CHECKOUT_DB!,
    stripe: new Stripe(env.STRIPE_SECRET_KEY!, {
      httpClient: Stripe.createFetchHttpClient(),
      maxNetworkRetries: 0,
      timeout: 10000,
    }),
  }
}
async function bounded(request: Request, max: number) {
  const reader = request.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) {
      await reader.cancel()
      reject(413, 'Request too large')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
    bytes
  )
}
async function input(request: Request) {
  try {
    return JSON.parse(await bounded(request, 8192)) as Record<string, unknown>
  } catch (e) {
    if (e instanceof Rejection) throw e
    return reject(400, 'Invalid JSON')
  }
}
async function hash(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
    ),
    (b) => b.toString(16).padStart(2, '0')
  ).join('')
}
async function limited(request: Request, env: CheckoutEnv) {
  const ip = request.headers.get('CF-Connecting-IP')
  if (!env.CHECKOUT_LIMITER || !ip)
    reject(503, 'Checkout protection unavailable')
  if (!(await env.CHECKOUT_LIMITER!.limit({ key: await hash(ip!) })).success)
    reject(429, 'Too many requests. Try again later.')
}
async function owner(request: Request, db: D1Database) {
  // Cookie holds order UUID + random secret; only the hash grants access.
  const raw = request.headers
    .get('cookie')
    ?.match(/(?:^|;\s*)__Host-checkout=([a-f0-9-]{36})\.([a-f0-9]{64})(?:;|$)/)
  if (!raw) reject(404, 'Order not found')
  const order = await db
    .prepare(
      'SELECT * FROM checkout_orders WHERE id = ? AND capability_hash = ?'
    )
    .bind(raw![1], await hash(raw![2]))
    .first<Order>()
  if (!order) reject(404, 'Order not found')
  return order!
}
async function verifyHuman(request: Request, env: CheckoutEnv, token: unknown) {
  if (
    !env.TURNSTILE_SECRET_KEY ||
    typeof token !== 'string' ||
    !token ||
    token.length > 2048
  )
    reject(400, 'Complete the security check')
  const result = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY!,
        response: token as string,
        remoteip: request.headers.get('CF-Connecting-IP')!,
      }),
      signal: AbortSignal.timeout(10000),
    }
  )
  const body = (await result.json()) as {
    success?: boolean
    hostname?: string
    action?: string
  }
  if (
    !result.ok ||
    body.success !== true ||
    body.hostname !== new URL(env.CHECKOUT_ORIGIN!).hostname ||
    body.action !== 'checkout'
  )
    reject(400, 'Security check failed. Try again.')
}
async function createSession(order: Order, env: CheckoutEnv) {
  const { db, stripe } = configured(env)
  if (order.session_id) {
    const session = await stripe.checkout.sessions.retrieve(order.session_id)
    if (session.livemode || session.metadata?.order_id !== order.id)
      reject(502, 'Provider order mismatch')
    return session
  }
  // Stripe may prune keys after 24 hours. Never recreate an uncertain old effect.
  if (Date.now() - order.created_at >= 23 * 3600000)
    reject(409, 'Order expired. Contact support before starting again.')
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'subscription',
      line_items: [{ price: order.price_id, quantity: 1 }],
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      subscription_data: { metadata: { order_id: order.id } },
      success_url: order.origin + '/buy/status',
      cancel_url: order.origin + '/buy/status',
    },
    { idempotencyKey: 'checkout-v1-' + order.id }
  )
  if (session.livemode) reject(502, 'Unexpected provider mode')
  await db
    .prepare('UPDATE checkout_orders SET session_id = ? WHERE id = ?')
    .bind(session.id, order.id)
    .run()
  return session
}
async function status(order: Order, stripe: Stripe) {
  if (!order.session_id) return { status: 'pending' }
  const session = await stripe.checkout.sessions.retrieve(order.session_id, {
    expand: ['line_items'],
  })
  if (
    session.livemode ||
    session.metadata?.order_id !== order.id ||
    session.line_items?.data.length !== 1 ||
    session.line_items.data[0].price?.id !== order.price_id ||
    session.line_items.data[0].quantity !== 1
  )
    reject(502, 'Provider order mismatch')
  if (!session.subscription)
    return { status: session.status === 'expired' ? 'failure' : 'pending' }
  const subscription = await stripe.subscriptions.retrieve(
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id,
    { expand: ['latest_invoice'] }
  )
  if (
    subscription.livemode ||
    subscription.metadata.order_id !== order.id ||
    subscription.items.data.length !== 1 ||
    subscription.items.data[0].price.id !== order.price_id
  )
    reject(502, 'Provider subscription mismatch')
  const invoice = subscription.latest_invoice
  let paymentFailed = false
  if (invoice && typeof invoice !== 'string') {
    if (invoice.livemode) reject(502, 'Unexpected provider mode')
    paymentFailed = ['void', 'uncollectible'].includes(invoice.status || '')
    if (invoice.status === 'open') {
      const payments = await stripe.invoicePayments.list({
        invoice: invoice.id,
        limit: 100,
        expand: ['data.payment.payment_intent'],
      })
      const payment = payments.data.find((p) => p.is_default)
      const intent = payment?.payment.payment_intent
      if (
        payment?.livemode ||
        (intent && typeof intent !== 'string' && intent.livemode)
      )
        reject(502, 'Unexpected provider mode')
      paymentFailed ||=
        payment?.status === 'canceled' ||
        Boolean(
          intent &&
          typeof intent !== 'string' &&
          (intent.status === 'canceled' ||
            (intent.status === 'requires_payment_method' &&
              intent.last_payment_error))
        )
    }
  }
  const paid =
    invoice &&
    typeof invoice !== 'string' &&
    !invoice.livemode &&
    invoice.status === 'paid'
  return {
    status:
      paid && subscription.status === 'active'
        ? 'confirmed'
        : paymentFailed ||
            ['past_due', 'unpaid', 'canceled', 'incomplete_expired'].includes(
              subscription.status
            )
          ? 'failure'
          : 'pending',
  }
}
export async function flushCheckoutOutbox(env: CheckoutEnv) {
  if (!env.CHECKOUT_DB || !env.PROVISIONING_QUEUE)
    throw new Error('Checkout outbox unavailable')
  const rows = await env.CHECKOUT_DB.prepare(
    'SELECT e.* FROM stripe_events e JOIN checkout_outbox o USING(event_id) WHERE o.sent_at IS NULL LIMIT 50'
  ).all<{ event_id: string; order_id: string; subscription_id: string }>()
  for (const row of rows.results) {
    await env.PROVISIONING_QUEUE.send({
      schema_version: 1,
      source: 'stripe',
      event_id: row.event_id,
      order_id: row.order_id,
      subscription_id: row.subscription_id,
    })
    await env.CHECKOUT_DB.prepare(
      'UPDATE checkout_outbox SET sent_at = ? WHERE event_id = ?'
    )
      .bind(Date.now(), row.event_id)
      .run()
  }
}
async function webhook(request: Request, env: CheckoutEnv) {
  const { db, stripe } = configured(env)
  if (!env.STRIPE_WEBHOOK_SECRET || !env.PROVISIONING_QUEUE)
    reject(503, 'Webhook not configured')
  const payload = await bounded(request, 262144)
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      request.headers.get('stripe-signature') || '',
      env.STRIPE_WEBHOOK_SECRET!,
      300,
      Stripe.createSubtleCryptoProvider()
    )
  } catch {
    return reject(400, 'Invalid Stripe signature')
  }
  if (
    event.livemode ||
    ('livemode' in event.data.object && event.data.object.livemode)
  )
    reject(400, 'Live events are not accepted')
  let orderId: string | undefined
  let subscriptionId: string | undefined
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object
      if (session.livemode || session.mode !== 'subscription')
        reject(400, 'Invalid test subscription')
      orderId = session.metadata?.order_id
      subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id
      break
    }
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const details = event.data.object.parent?.subscription_details
      orderId = details?.metadata?.order_id
      subscriptionId =
        typeof details?.subscription === 'string'
          ? details.subscription
          : details?.subscription?.id
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      orderId = event.data.object.metadata.order_id
      subscriptionId = event.data.object.id
      break
    default:
      return json({ received: true })
  }
  // A signed reference is still not build authority. Backend re-fetches all facts.
  if (!orderId || !subscriptionId) reject(400, 'Missing order reference')
  const order = await db
    .prepare('SELECT id FROM checkout_orders WHERE id = ?')
    .bind(orderId!)
    .first()
  if (!order) reject(400, 'Unknown order')
  await db.batch([
    db
      .prepare(
        'INSERT INTO stripe_events(event_id, order_id, subscription_id, received_at) VALUES (?, ?, ?, ?) ON CONFLICT(event_id) DO NOTHING'
      )
      .bind(event.id, orderId!, subscriptionId!, Date.now()),
    db
      .prepare(
        'INSERT INTO checkout_outbox(event_id) VALUES (?) ON CONFLICT(event_id) DO NOTHING'
      )
      .bind(event.id),
  ])
  // Failure after commit returns 503: Stripe retry or scheduled replay drains SAME queue.
  await flushCheckoutOutbox(env)
  return json({ received: true })
}
export async function handleCheckout(
  request: Request,
  env: CheckoutEnv
): Promise<Response> {
  try {
    const path = new URL(request.url).pathname
    if (path === '/webhooks/stripe') {
      if (request.method !== 'POST') reject(405, 'Method not allowed')
      return await webhook(request, env)
    }
    if (path === '/checkout/catalogue' && request.method === 'GET') {
      return json({
        products: catalogue(env).map(({ sku, label }) => ({ sku, label })),
        site_key: env.TURNSTILE_SITE_KEY || null,
      })
    }
    const { db, stripe } = configured(env)
    await limited(request, env)
    if (request.method === 'GET' && path === '/checkout/status')
      return json(await status(await owner(request, db), stripe))
    if (request.method !== 'POST') reject(405, 'Method not allowed')
    if (request.headers.get('origin') !== env.CHECKOUT_ORIGIN)
      reject(403, 'Origin not allowed')
    if (path === '/checkout/orders') {
      const body = await input(request)
      if (
        !body ||
        Object.keys(body).some((k) => !['sku', 'turnstile_token'].includes(k))
      )
        reject(400, 'Only a catalogue selection is accepted')
      const product = catalogue(env).find((p) => p.sku === body.sku)
      if (!product) reject(400, 'Select an available product')
      await verifyHuman(request, env, body.turnstile_token)
      // Admit a valid test price once; recovery must replay the immutable order
      // even if the price is later archived after a successful, unseen effect.
      const price = await stripe.prices.retrieve(product!.price_id)
      if (price.livemode || !price.active || price.type !== 'recurring')
        reject(503, 'Test subscription price unavailable')
      const id = crypto.randomUUID()
      const secret = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (b) => b.toString(16).padStart(2, '0')
      ).join('')
      await db
        .prepare(
          'INSERT INTO checkout_orders(id, capability_hash, sku, price_id, created_at, origin) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .bind(
          id,
          await hash(secret),
          product!.sku,
          product!.price_id,
          Date.now(),
          env.CHECKOUT_ORIGIN!
        )
        .run()
      const response = json({ order_id: id }, 201)
      response.headers.set(
        'set-cookie',
        '__Host-checkout=' +
          id +
          '.' +
          secret +
          '; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000'
      )
      return response
    }
    if (path === '/checkout/session') {
      const session = await createSession(await owner(request, db), env)
      if (
        !session.url ||
        new URL(session.url).origin !== 'https://checkout.stripe.com'
      )
        reject(409, 'Checkout is closed. Check payment status.')
      return json({ url: session.url })
    }
    return json({ error: 'Not found' }, 404)
  } catch (error) {
    if (error instanceof Rejection)
      return json({ error: error.message }, error.status)
    // Never echo Stripe errors, tokens, payloads or customer data.
    return json({ error: 'Checkout unavailable. Retry this order later.' }, 503)
  }
}
