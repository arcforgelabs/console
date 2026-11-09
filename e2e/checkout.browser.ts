/// <reference lib="dom" />
import { test, expect } from '@playwright/test'
import {
  Miniflare,
  convertV4MiniflareOptions,
  Response as RuntimeResponse,
} from 'miniflare'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { extname, resolve } from 'node:path'

// Real built UI + bundled Worker + native D1. Only external providers are synthetic.
// Outbound allowlists below prevent accidental provider traffic or real charges.
for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 900 },
]) {
  test(
    `active checkout and uncertain recovery at ` + viewport.width,
    async ({ browser }) => {
      const artifacts = resolve(
        process.env.CHECKOUT_EVIDENCE_DIR || 'e2e/results/checkout-evidence'
      )
      mkdirSync(artifacts, { recursive: true })
      const dir = mkdtempSync(resolve(tmpdir(), 'checkout-browser-'))
      execFileSync(
        'openssl',
        [
          'req',
          '-x509',
          '-newkey',
          'rsa:2048',
          '-nodes',
          '-keyout',
          resolve(dir, 'key.pem'),
          '-out',
          resolve(dir, 'cert.pem'),
          '-days',
          '1',
          '-subj',
          '/CN=localhost',
        ],
        { stdio: 'pipe' }
      )
      const events: Record<string, unknown>[] = []
      const reservation = createServer()
      await new Promise<void>((resolve) =>
        reservation.listen(0, '127.0.0.1', resolve)
      )
      const address = reservation.address()
      if (!address || typeof address === 'string')
        throw new Error('No local port')
      const port = address.port
      await new Promise<void>((resolve, reject) =>
        reservation.close((error) => (error ? reject(error) : resolve()))
      )
      const origin = 'https://127.0.0.1:' + port
      let orderId = ''
      let activePrice = true
      let confirmed = false
      let lostResponse = true
      let acceptedBody: string | undefined
      let acceptedKey: string | undefined
      let stripeRequests = 0
      let sessionPosts = 0
      const mf = new Miniflare(
        convertV4MiniflareOptions({
          host: '127.0.0.1',
          port,
          https: true,
          httpsKeyPath: resolve(dir, 'key.pem'),
          httpsCertPath: resolve(dir, 'cert.pem'),
          workers: [
            {
              name: 'checkout-browser',
              modules: true,
              scriptPath: resolve('dist-worker/index.js'),
              modulesRoot: resolve('dist-worker'),
              compatibilityDate: '2026-10-01',
              d1Databases: { CHECKOUT_DB: 'browser-orders' },
              kvNamespaces: ['CLAWS'],
              ratelimits: {
                CHECKOUT_LIMITER: {
                  namespace_id: '1',
                  simple: { limit: 100, period: 60 },
                },
              },
              queueProducers: { PROVISIONING_QUEUE: 'provisioning' },
              bindings: {
                CHECKOUT_ORIGIN: origin,
                STRIPE_SECRET_KEY: 'rk_test_synthetic',
                STRIPE_WEBHOOK_SECRET: 'whsec_synthetic',
                TURNSTILE_SECRET_KEY: 'synthetic',
                TURNSTILE_SITE_KEY: 'synthetic',
                CHECKOUT_CATALOGUE: JSON.stringify([
                  {
                    sku: 'synthetic',
                    label: 'Synthetic test subscription',
                    price_id: 'price_synthetic',
                  },
                ]),
              },
              serviceBindings: {
                ASSETS: (request) => {
                  const path = new URL(request.url).pathname
                  const file = path.startsWith('/assets/')
                    ? resolve('dist', '.' + path)
                    : resolve('dist/index.html')
                  const mime: Record<string, string> = {
                    '.js': 'text/javascript',
                    '.css': 'text/css',
                    '.woff2': 'font/woff2',
                  }
                  return new RuntimeResponse(readFileSync(file), {
                    headers: {
                      'content-type': mime[extname(file)] || 'text/html',
                    },
                  })
                },
              },
              outboundService: async (request) => {
                const url = new URL(request.url)
                if (
                  url.hostname === 'challenges.cloudflare.com' &&
                  url.pathname.endsWith('/siteverify')
                ) {
                  const body = new URLSearchParams(await request.text())
                  expect(body.get('response')).toBe('synthetic-browser-token')
                  events.push({
                    boundary: 'Turnstile synthetic',
                    action: 'checkout',
                    token: '[redacted]',
                    success: true,
                  })
                  return RuntimeResponse.json({
                    success: true,
                    hostname: '127.0.0.1',
                    action: 'checkout',
                  })
                }
                expect(url.hostname).toBe('api.stripe.com')
                stripeRequests++
                events.push({
                  boundary: 'Stripe synthetic wire',
                  method: request.method,
                  path: url.pathname,
                  authorization: '[redacted]',
                })
                if (url.pathname === '/v1/prices/price_synthetic')
                  return RuntimeResponse.json({
                    id: 'price_synthetic',
                    active: activePrice,
                    livemode: false,
                    type: 'recurring',
                  })
                if (
                  url.pathname === '/v1/checkout/sessions' &&
                  request.method === 'POST'
                ) {
                  sessionPosts++
                  const body = await request.text()
                  const params = new URLSearchParams(body)
                  orderId = params.get('metadata[order_id]')!
                  const row = await db
                    .prepare(
                      'SELECT session_id, price_id FROM checkout_orders WHERE id = ?'
                    )
                    .bind(orderId)
                    .first()
                  expect(row?.price_id).toBe('price_synthetic')
                  const key = request.headers.get('idempotency-key')!
                  expect(key).toBe('checkout-v1-' + orderId)
                  if (acceptedBody !== undefined) {
                    expect(body).toBe(acceptedBody)
                    expect(key).toBe(acceptedKey)
                  } else {
                    acceptedBody = body
                    acceptedKey = key
                  }
                  events.push({
                    authority: 'D1 order precedes session effect',
                    order: '[order-1]',
                    idempotency: '[stable-order-key]',
                    replay: sessionPosts > 1,
                  })
                  if (lostResponse) {
                    lostResponse = false
                    return RuntimeResponse.json(
                      {
                        error: {
                          type: 'api_error',
                          message: 'Synthetic response loss after creation',
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
                    status: confirmed ? 'active' : 'incomplete',
                    items: {
                      data: [{ price: { id: 'price_synthetic' }, quantity: 1 }],
                    },
                    latest_invoice: {
                      id: 'in_synthetic',
                      livemode: false,
                      status: confirmed ? 'paid' : 'open',
                    },
                  })
                if (url.pathname === '/v1/invoice_payments')
                  return RuntimeResponse.json({ data: [] })
                throw new Error('Unexpected synthetic Stripe endpoint')
              },
            },
          ],
        })
      )
      const db = await mf.getD1Database('CHECKOUT_DB', 'checkout-browser')
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
      await mf.ready
      const context = await browser.newContext({
        viewport,
        ignoreHTTPSErrors: true,
      })
      const page = await context.newPage()
      try {
        await context.route('**/*', async (route) => {
          const url = new URL(route.request().url())
          if (url.origin === origin)
            return route.continue({
              headers: {
                ...route.request().headers(),
                'cf-connecting-ip': '192.0.2.1',
              },
            })
          if (
            url.hostname === 'challenges.cloudflare.com' &&
            url.pathname.endsWith('/api.js')
          )
            return route.fulfill({
              contentType: 'text/javascript',
              body: `window.turnstile={render(element, options){const button=document.createElement('button');button.textContent='Synthetic security check';button.onclick=()=>options.callback('synthetic-browser-token');element.append(button);return 'synthetic'},remove(){}}`,
            })
          if (url.hostname === 'checkout.stripe.com') {
            events.push({
              browser: 'external Stripe redirect',
              destination: 'https://checkout.stripe.com/c/pay/synthetic',
              synthetic: true,
            })
            return route.fulfill({
              contentType: 'text/html',
              body:
                '<h1>Synthetic Stripe boundary — no payment</h1><a href="' +
                origin +
                '/buy/status">Return to console</a>',
            })
          }
          throw new Error('Browser external network refused: ' + url.origin)
        })
        await page.goto(origin + '/buy')
        await page.getByRole('combobox').selectOption('synthetic')
        await page
          .getByRole('button', { name: 'Synthetic security check' })
          .click()
        await page.screenshot({
          path: resolve(artifacts, 'active-buy-' + viewport.width + '.png'),
          fullPage: true,
        })
        await page.getByRole('button', { name: 'Create test checkout' }).click()
        await expect(page).toHaveURL(origin + '/buy/status')
        await expect(page.getByRole('status')).toContainText('Payment pending')
        expect(sessionPosts).toBe(0)
        const cookies = await context.cookies()
        const capability = cookies.find(
          (cookie) => cookie.name === '__Host-checkout'
        )!
        expect(
          capability.secure &&
            capability.httpOnly &&
            capability.sameSite === 'Strict'
        ).toBe(true)
        events.push({
          browser: 'durable recovery navigation',
          path: '/buy/status',
          cookie: '[redacted Secure HttpOnly SameSite=Strict]',
          sessionPosts,
        })
        await page
          .getByRole('button', { name: 'Continue this checkout' })
          .click()
        await expect(page.getByRole('alert')).toContainText(
          'Retry this order later'
        )
        activePrice = false
        expect(
          await db
            .prepare('SELECT session_id FROM checkout_orders')
            .first('session_id')
        ).toBeNull()
        await page.reload()
        await expect(page.getByRole('status')).toContainText('Payment pending')
        await page.screenshot({
          path: resolve(artifacts, 'active-pending-' + viewport.width + '.png'),
          fullPage: true,
        })
        // Exercise browser-visible refusal after uncertainty, at the effect boundary.
        const savedHash = await db
          .prepare('SELECT capability_hash FROM checkout_orders')
          .first('capability_hash')
        for (const denial of ['missing', 'forged', 'invalidated']) {
          const before = stripeRequests
          if (denial === 'missing') await context.clearCookies()
          if (denial === 'forged')
            await context.addCookies([
              {
                ...capability,
                value:
                  capability.value.slice(0, -1) +
                  (capability.value.endsWith('a') ? 'b' : 'a'),
              },
            ])
          if (denial === 'invalidated') {
            await context.addCookies([capability])
            await db
              .prepare('UPDATE checkout_orders SET capability_hash = ?')
              .bind('invalidated')
              .run()
          }
          await page
            .getByRole('button', { name: 'Continue this checkout' })
            .click()
          await expect(page.getByRole('alert')).toContainText('Order not found')
          expect(stripeRequests).toBe(before)
          events.push({
            authority: denial + ' capability refused after uncertainty',
            http: 404,
            stripeRequestDelta: stripeRequests - before,
          })
        }
        await db
          .prepare('UPDATE checkout_orders SET capability_hash = ?')
          .bind(savedHash)
          .run()
        await context.addCookies([capability])
        await page
          .getByRole('button', { name: 'Continue this checkout' })
          .click()
        await expect(page).toHaveURL(
          'https://checkout.stripe.com/c/pay/synthetic'
        )
        expect(sessionPosts).toBe(2)
        await page.getByRole('link', { name: 'Return to console' }).click()
        await expect(page).toHaveURL(origin + '/buy/status')
        // Strict cookies can be omitted on a cross-site return; same-origin refresh restores authority.
        await page
          .getByRole('button', { name: 'Refresh payment status' })
          .click()
        await expect(page.getByRole('status')).toContainText('Payment pending')
        confirmed = true
        await page
          .getByRole('button', { name: 'Refresh payment status' })
          .click()
        await expect(page.getByRole('status')).toHaveText(
          'Payment confirmed. Setup is not confirmed here.'
        )
        await page.reload()
        await expect(page.getByRole('status')).toContainText(
          'Payment confirmed'
        )
        await expect(
          page.getByRole('button', { name: 'Continue this checkout' })
        ).toHaveCount(0)
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true)
        await page.screenshot({
          path: resolve(
            artifacts,
            'active-confirmed-' + viewport.width + '.png'
          ),
          fullPage: true,
        })
        events.push({
          browser: 'return and explicit refresh',
          status: 'confirmed',
          provisioningAuthority: false,
          sandboxAcceptance: false,
        })
        writeFileSync(
          resolve(artifacts, 'active-trace-' + viewport.width + '.json'),
          JSON.stringify(
            { synthetic: true, externalNetwork: false, viewport, events },
            null,
            2
          ) + '\n'
        )
      } finally {
        await context.close()
        await mf.dispose()
      }
    }
  )
}
