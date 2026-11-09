import {
  Miniflare,
  convertV4MiniflareOptions,
  type LegacyWorkerOptions,
  type Request as RuntimeRequest,
  Response as RuntimeResponse,
} from 'miniflare'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import Stripe from 'stripe'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const origin = 'https://console.example'
const secret = 'whsec_synthetic'
const received: unknown[] = []
let mf: Miniflare
let reconfigure: (
  override: Partial<Pick<LegacyWorkerOptions, 'bindings' | 'ratelimits'>>
) => Promise<void>
let db: Awaited<ReturnType<Miniflare['getD1Database']>>
let orderId = ''
let cookie = ''
let human = true
let livePrice = false
let activePrice = true
let priceType = 'recurring'
let stripeRequests = 0
let providerState = 'pending'
let loseCreateResponse = true
const providerSessions = new Map<string, string>()
const keys: string[] = []
let params: URLSearchParams
const headers = {
  origin,
  'CF-Connecting-IP': '192.0.2.1',
  'content-type': 'application/json',
}
const post = (path: string, body: unknown, extra = {}) =>
  mf.dispatchFetch(origin + path, {
    method: 'POST',
    headers: { ...headers, ...extra },
    body: JSON.stringify(body),
  })
const getStatus = (extra = {}) =>
  mf.dispatchFetch(origin + '/checkout/status?session_id=forged&success=true', {
    headers: { ...headers, cookie, ...extra },
  })
async function event(
  id: string,
  type = 'checkout.session.completed',
  live = false
) {
  const payload = JSON.stringify(
    {
      id,
      object: 'event',
      type,
      livemode: live,
      data: {
        object: {
          id: 'cs_synthetic',
          mode: 'subscription',
          livemode: live,
          metadata: { order_id: orderId },
          subscription: 'sub_synthetic',
        },
      },
    },
    null,
    2
  )
  const signature = await Stripe.webhooks.generateTestHeaderStringAsync({
    payload,
    secret,
  })
  return mf.dispatchFetch(origin + '/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': signature },
    body: payload,
  })
}
beforeAll(async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'checkout-proof-'))
  const config = resolve(dir, 'wrangler.json')
  writeFileSync(
    config,
    JSON.stringify({
      name: 'checkout-proof',
      main: resolve('worker/index.ts'),
      compatibility_date: '2026-10-01',
    })
  )
  execFileSync(
    'pnpm',
    [
      'exec',
      'wrangler',
      'deploy',
      '--dry-run',
      '--config',
      config,
      '--outdir',
      dir,
    ],
    { stdio: 'pipe', timeout: 60000 }
  )
  const options: { workers: LegacyWorkerOptions[] } = {
    workers: [
      {
        name: 'checkout',
        modules: true,
        scriptPath: resolve(dir, 'index.js'),
        modulesRoot: dir,
        compatibilityDate: '2026-10-01',
        d1Databases: { CHECKOUT_DB: 'orders' },
        kvNamespaces: ['CLAWS'],
        ratelimits: {
          CHECKOUT_LIMITER: {
            namespace_id: '1',
            simple: { limit: 100, period: 60 },
          },
        },
        queueProducers: { PROVISIONING_QUEUE: 'provisioning' },
        serviceBindings: { ASSETS: () => new RuntimeResponse('asset') },
        bindings: {
          CHECKOUT_ORIGIN: origin,
          STRIPE_SECRET_KEY: 'sk_test_synthetic',
          STRIPE_WEBHOOK_SECRET: secret,
          TURNSTILE_SECRET_KEY: 'synthetic',
          CHECKOUT_CATALOGUE: JSON.stringify([
            {
              sku: 'synthetic',
              label: 'Synthetic test subscription',
              price_id: 'price_synthetic',
            },
          ]),
        },
        outboundService: async (request: RuntimeRequest) => {
          const url = new URL(request.url)
          if (url.hostname === 'challenges.cloudflare.com')
            return RuntimeResponse.json({
              success: human,
              hostname: 'console.example',
              action: 'checkout',
            })
          if (url.hostname !== 'api.stripe.com')
            throw new Error('Unexpected external network: ' + url.hostname)
          stripeRequests++
          if (url.pathname === '/v1/prices/price_synthetic')
            return RuntimeResponse.json({
              id: 'price_synthetic',
              active: activePrice,
              livemode: livePrice,
              type: priceType,
            })
          if (
            url.pathname === '/v1/checkout/sessions' &&
            request.method === 'POST'
          ) {
            // Assert durable intent through actual D1 before accepting the effect.
            const row = await db
              .prepare('SELECT id FROM checkout_orders WHERE id = ?')
              .bind(orderId)
              .first()
            expect(row?.id).toBe(orderId)
            const key = request.headers.get('idempotency-key')!
            keys.push(key)
            const body = await request.text()
            const previous = providerSessions.get(key)
            if (previous !== undefined) expect(body).toBe(previous)
            else providerSessions.set(key, body)
            params = new URLSearchParams(body)
            if (loseCreateResponse) {
              loseCreateResponse = false
              return RuntimeResponse.json(
                {
                  error: {
                    type: 'api_error',
                    message: 'Synthetic lost response',
                  },
                },
                { status: 503 }
              )
            }
            return RuntimeResponse.json({
              id: 'cs_synthetic',
              livemode: false,
              metadata: { order_id: orderId },
              url: 'https://checkout.stripe.com/c/pay/synthetic',
            })
          }
          if (url.pathname === '/v1/checkout/sessions/cs_synthetic')
            return RuntimeResponse.json({
              id: 'cs_synthetic',
              livemode: false,
              metadata: { order_id: orderId },
              status: 'complete',
              subscription: 'sub_synthetic',
              line_items: {
                data: [{ price: { id: 'price_synthetic' }, quantity: 1 }],
              },
              url: 'https://checkout.stripe.com/c/pay/synthetic',
            })
          if (url.pathname === '/v1/subscriptions/sub_synthetic')
            return RuntimeResponse.json({
              id: 'sub_synthetic',
              livemode: false,
              metadata: { order_id: orderId },
              status:
                providerState === 'confirmed'
                  ? 'active'
                  : providerState === 'failure'
                    ? 'incomplete'
                    : 'incomplete',
              items: {
                data: [{ price: { id: 'price_synthetic' }, quantity: 1 }],
              },
              latest_invoice: {
                id: 'in_synthetic',
                livemode: false,
                status: providerState === 'confirmed' ? 'paid' : 'open',
              },
            })
          if (url.pathname === '/v1/invoice_payments')
            return RuntimeResponse.json({
              data: [
                {
                  is_default: true,
                  livemode: false,
                  status: 'open',
                  payment: {
                    payment_intent: {
                      livemode: false,
                      status:
                        providerState === 'failure'
                          ? 'requires_payment_method'
                          : 'processing',
                      last_payment_error:
                        providerState === 'failure'
                          ? { message: 'Synthetic payment failure' }
                          : null,
                    },
                  },
                },
              ],
            })
          throw new Error('Unexpected Stripe request: ' + request.url)
        },
      },
      {
        name: 'backend-receipt-fixture',
        modules: true,
        compatibilityDate: '2026-10-01',
        script:
          'export default { async queue(batch, env) { for (const message of batch.messages) await env.RECEIPTS.fetch("https://receipt.example", {method:"POST", body:JSON.stringify(message.body)}); } }',
        queueConsumers: {
          provisioning: { maxBatchSize: 1, maxBatchTimeout: 0 },
        },
        serviceBindings: {
          RECEIPTS: async (request: RuntimeRequest) => {
            received.push(await request.json())
            return new RuntimeResponse('ok')
          },
        },
      },
    ],
  }
  mf = new Miniflare(convertV4MiniflareOptions(options))
  reconfigure = (override) =>
    mf.setOptions(
      convertV4MiniflareOptions({
        ...options,
        workers: [{ ...options.workers[0], ...override }, options.workers[1]],
      })
    )
  db = await mf.getD1Database('CHECKOUT_DB', 'checkout')
  const migration = readFileSync(
    'worker/migrations/0001_checkout.sql',
    'utf8'
  ).replace(/^--.*$/gm, '')
  await db.batch(
    migration
      .split(';')
      .filter((sql) => sql.trim())
      .map((sql) => db.prepare(sql))
  )
}, 90000)
afterAll(async () => {
  await mf?.dispose()
})

describe.sequential(
  'public checkout real Worker + D1 + Stripe wire boundary',
  () => {
    it('preserves API authentication and rejects origin, forged authority and failed Turnstile before durable intent', async () => {
      expect((await mf.dispatchFetch(origin + '/api/me')).status).toBe(401)
      expect((await mf.dispatchFetch(origin + '/api/checkout')).status).toBe(
        401
      )
      expect(
        (
          await post(
            '/checkout/orders',
            { sku: 'synthetic', turnstile_token: 'token' },
            { origin: 'https://evil.example' }
          )
        ).status
      ).toBe(403)
      expect(
        (
          await post('/checkout/orders', {
            sku: 'synthetic',
            price_id: 'price_evil',
            tenant_id: 'other',
            turnstile_token: 'token',
          })
        ).status
      ).toBe(400)
      human = false
      expect(
        (
          await post('/checkout/orders', {
            sku: 'synthetic',
            turnstile_token: 'token',
          })
        ).status
      ).toBe(400)
      expect(
        await db.prepare('SELECT count(*) AS n FROM checkout_orders').first('n')
      ).toBe(0)
      human = true
    })
    it('admits only active recurring test prices before durable intent', async () => {
      for (const invalid of ['live', 'archived', 'one_time']) {
        livePrice = invalid === 'live'
        activePrice = invalid !== 'archived'
        priceType = invalid === 'one_time' ? 'one_time' : 'recurring'
        expect(
          (
            await post('/checkout/orders', {
              sku: 'synthetic',
              turnstile_token: 'token',
            })
          ).status
        ).toBe(503)
        expect(
          await db
            .prepare('SELECT count(*) AS n FROM checkout_orders')
            .first('n')
        ).toBe(0)
      }
      livePrice = false
      activePrice = true
      priceType = 'recurring'
    })
    it('recovers a created session after response loss and price archival with the original key', async () => {
      livePrice = false
      activePrice = true
      const order = await post('/checkout/orders', {
        sku: 'synthetic',
        turnstile_token: 'token',
      })
      expect(order.status).toBe(201)
      orderId = ((await order.json()) as { order_id: string }).order_id
      cookie = order.headers.get('set-cookie')!.split(';')[0]
      expect(order.headers.get('set-cookie')).toContain(
        'Secure; HttpOnly; SameSite=Strict'
      )
      const stored = await db
        .prepare('SELECT * FROM checkout_orders WHERE id = ?')
        .bind(orderId)
        .first()
      expect(stored?.capability_hash).not.toBe(cookie.split('.')[1])
      await db
        .prepare('UPDATE checkout_orders SET created_at = ? WHERE id = ?')
        .bind(Date.now() - 24 * 3600000, orderId)
        .run()
      expect((await post('/checkout/session', {}, { cookie })).status).toBe(409)
      expect(keys).toHaveLength(0)
      await db
        .prepare('UPDATE checkout_orders SET created_at = ? WHERE id = ?')
        .bind(Date.now(), orderId)
        .run()
      // Denied capabilities must not reach any Stripe endpoint, even on retry.
      const deny = async () => {
        const before = stripeRequests
        for (const deniedCookie of [
          '',
          cookie.slice(0, -1) + (cookie.endsWith('a') ? 'b' : 'a'),
        ]) {
          const response = await post(
            '/checkout/session',
            {},
            { cookie: deniedCookie }
          )
          expect(response.status).toBe(404)
          expect(await response.json()).toEqual({ error: 'Order not found' })
        }
        const savedHash = stored!.capability_hash
        await db
          .prepare(
            'UPDATE checkout_orders SET capability_hash = ? WHERE id = ?'
          )
          .bind('invalidated', orderId)
          .run()
        const invalidated = await post('/checkout/session', {}, { cookie })
        expect(invalidated.status).toBe(404)
        expect(await invalidated.json()).toEqual({ error: 'Order not found' })
        expect(stripeRequests).toBe(before)
        await db
          .prepare(
            'UPDATE checkout_orders SET capability_hash = ? WHERE id = ?'
          )
          .bind(savedHash, orderId)
          .run()
      }
      await deny()
      expect((await post('/checkout/session', {}, { cookie })).status).toBe(503)
      expect(providerSessions.size).toBe(1) // External creation succeeded; response was lost.
      expect(
        await db
          .prepare('SELECT session_id FROM checkout_orders WHERE id = ?')
          .bind(orderId)
          .first('session_id')
      ).toBeNull()
      activePrice = false
      await deny()
      const retry = await post('/checkout/session', {}, { cookie })
      expect(retry.status).toBe(200)
      expect(await retry.json()).toEqual({
        url: 'https://checkout.stripe.com/c/pay/synthetic',
      })
      expect(keys).toEqual(['checkout-v1-' + orderId, 'checkout-v1-' + orderId])
      expect(providerSessions.size).toBe(1)
      activePrice = true
      expect(params.get('line_items[0][price]')).toBe('price_synthetic')
      expect(params.get('subscription_data[metadata][order_id]')).toBe(orderId)
    })
    it('never trusts a success URL or event order; status needs capability and re-fetches current payment facts', async () => {
      expect((await getStatus({ cookie: '' })).status).toBe(404)
      expect(
        (
          await getStatus({
            cookie: cookie.slice(0, -1) + (cookie.endsWith('a') ? 'b' : 'a'),
          })
        ).status
      ).toBe(404)
      expect(await (await getStatus()).json()).toEqual({ status: 'pending' })
      providerState = 'confirmed'
      expect(await (await getStatus()).json()).toEqual({ status: 'confirmed' })
      providerState = 'failure'
      expect(await (await getStatus()).json()).toEqual({ status: 'failure' })
    })
    it('verifies raw bounded signatures and rejects live events without receipts', async () => {
      expect(
        (
          await mf.dispatchFetch(origin + '/webhooks/stripe', {
            method: 'POST',
            body: '{}',
          })
        ).status
      ).toBe(400)
      expect(
        (
          await mf.dispatchFetch(origin + '/webhooks/stripe', {
            method: 'POST',
            body: 'x'.repeat(262145),
          })
        ).status
      ).toBe(413)
      expect(
        (await event('evt_live', 'checkout.session.completed', true)).status
      ).toBe(400)
      expect(
        await db.prepare('SELECT count(*) AS n FROM stripe_events').first('n')
      ).toBe(0)
    })
    it('deduplicates receipt/outbox atomically and replays after send/ack loss through the single queue', async () => {
      // Force rollback of the second statement: a receipt alone must never survive.
      await db.exec(
        "CREATE TRIGGER reject_outbox BEFORE INSERT ON checkout_outbox BEGIN SELECT RAISE(ABORT, 'synthetic outage'); END;"
      )
      expect((await event('evt_atomic')).status).toBe(503)
      expect(
        await db.prepare('SELECT count(*) AS n FROM stripe_events').first('n')
      ).toBe(0)
      await db.exec('DROP TRIGGER reject_outbox;')
      await db.exec(
        "CREATE TRIGGER lose_ack BEFORE UPDATE ON checkout_outbox BEGIN SELECT RAISE(ABORT, 'synthetic ack loss'); END;"
      )
      expect(
        (await event('evt_async', 'checkout.session.async_payment_succeeded'))
          .status
      ).toBe(503)
      expect(
        await db.prepare('SELECT sent_at FROM checkout_outbox').first('sent_at')
      ).toBeNull()
      await db.exec('DROP TRIGGER lose_ack;')
      const replay = await (await mf.getWorker('checkout')).scheduled()
      expect(replay.outcome).toBe('ok')
      expect(
        await db.prepare('SELECT sent_at FROM checkout_outbox').first('sent_at')
      ).toBeTypeOf('number')
      const expected = {
        schema_version: 1,
        source: 'stripe',
        event_id: 'evt_async',
        subscription_id: 'sub_synthetic',
        order_id: orderId,
      }
      await expect.poll(() => received.length).toBe(2)
      expect(received).toEqual([expected, expected])
      expect(
        (await event('evt_async', 'checkout.session.async_payment_succeeded'))
          .status
      ).toBe(200)
      expect(
        await db.prepare('SELECT count(*) AS n FROM stripe_events').first('n')
      ).toBe(1)
      // A late completed/failed event does not overwrite current Stripe truth.
      expect(
        (await event('evt_older', 'checkout.session.async_payment_failed'))
          .status
      ).toBe(200)
      providerState = 'confirmed'
      expect(await (await getStatus()).json()).toEqual({ status: 'confirmed' })
    })
    it('fails closed without a limiter or with live keys and enforces the native rate limit', async () => {
      await reconfigure({ ratelimits: {} })
      expect((await getStatus()).status).toBe(503)
      for (const key of [
        'sk_live_synthetic',
        'rk_live_synthetic',
        'sk_org_synthetic',
        'pk_test_synthetic',
        'unknown',
        '',
      ]) {
        const before = stripeRequests
        await reconfigure({
          bindings: {
            CHECKOUT_ORIGIN: origin,
            STRIPE_SECRET_KEY: key,
            STRIPE_WEBHOOK_SECRET: secret,
          },
        })
        expect((await getStatus()).status).toBe(503)
        expect(stripeRequests).toBe(before)
      }
      await reconfigure({
        bindings: {
          CHECKOUT_ORIGIN: origin,
          STRIPE_SECRET_KEY: 'rk_test_synthetic',
          STRIPE_WEBHOOK_SECRET: secret,
        },
      })
      // No capability is needed to prove the restricted key reaches owner refusal.
      expect((await getStatus({ cookie: '' })).status).toBe(404)
      await reconfigure({
        ratelimits: {
          CHECKOUT_LIMITER: {
            namespace_id: '2',
            simple: { limit: 1, period: 60 },
          },
        },
      })
      expect((await getStatus({ cookie: '' })).status).toBe(404)
      expect((await getStatus({ cookie: '' })).status).toBe(429)
      await reconfigure({})
    }, 30000)
  }
)
