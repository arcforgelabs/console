import type {
  CareApp,
  Billing,
  SupportRequest,
  Team,
  Usage,
} from './console-api'

// Synthetic data for demo mode (VITE_DEMO=1). Names, hosts and amounts are
// made up. Prices are placeholders until the price list is set.

export const demoTeam: Team = {
  claws: [
    { name: 'acme', label: 'Acme assistant' },
    { name: 'acme-ops', label: 'Acme ops' },
  ],
  seatsIncluded: 10,
  members: [
    {
      email: 'jordan@acme.example',
      name: 'Jordan Lee',
      role: 'owner',
      claws: ['acme', 'acme-ops'],
      lastSignIn: '2026-10-26T09:00:00Z',
    },
    {
      email: 'priya@acme.example',
      name: 'Priya Nair',
      role: 'admin',
      claws: ['acme', 'acme-ops'],
      lastSignIn: '2026-10-25T08:10:00Z',
    },
    {
      email: 'sam@acme.example',
      name: 'Sam Ortiz',
      role: 'member',
      claws: ['acme'],
      lastSignIn: '2026-10-26T07:02:00Z',
    },
    {
      email: 'alex@acme.example',
      name: 'Alex Chen',
      role: 'member',
      claws: ['acme'],
      invited: true,
    },
  ],
}

const daily = [
  0.9, 1.4, 0.7, 2.1, 1.3, 1.0, 2.6, 1.7, 1.2, 2.3, 1.4, 2.0, 3.9, 1.6, 1.1,
  1.8, 1.5, 1.2, 2.2, 1.9, 0.8, 1.3, 1.6, 2.4, 1.7, 1.1,
]

export const demoUsage: Usage = {
  currency: 'AUD',
  periodStart: '2026-10-01',
  periodEnd: '2026-10-31',
  included: { used: 42.1, limit: 100 },
  ownSubscription: { connected: true, claws: ['Acme ops'] },
  daily: daily.map((cost, i) => ({
    date: `2026-10-${String(i + 1).padStart(2, '0')}`,
    cost,
  })),
  byPerson: [
    { key: 'Sam Ortiz', requests: 412, tokens: 1_900_000, cost: 18.4 },
    { key: 'Jordan Lee', requests: 266, tokens: 1_200_000, cost: 12.2 },
    { key: 'Priya Nair', requests: 198, tokens: 900_000, cost: 11.5 },
  ],
  byClaw: [
    { key: 'Acme assistant', requests: 701, tokens: 3_300_000, cost: 33.9 },
    { key: 'Acme ops', requests: 175, tokens: 700_000, cost: 8.2 },
  ],
  byModel: [
    { key: 'Claude Sonnet', requests: 540, tokens: 2_600_000, cost: 29.6 },
    { key: 'Claude Haiku', requests: 336, tokens: 1_400_000, cost: 12.5 },
  ],
}

export const demoApps: CareApp[] = [
  {
    id: 'field',
    name: 'Field',
    url: 'https://quotes.acme.example/',
    version: '2026.10.12 stable',
    plan: {
      name: 'Care, monthly',
      renews: '2026-12-01',
      requestsThisMonth: 3,
      uptime30d: 99.98,
    },
  },
  {
    id: 'flow',
    name: 'Flow',
    url: 'https://jobs.acme.example/',
    version: '2026.10.48 stable',
  },
]

export const demoSupport: SupportRequest[] = [
  {
    id: 'req-104',
    title: 'Quote PDF shows old logo',
    app: 'Field',
    state: 'fixing',
    reporter: 'Sam Ortiz',
    inCarePlan: true,
    updated: '2026-10-26T07:00:00Z',
    steps: [
      {
        label: 'Reported',
        at: '2026-10-26T09:12:00+11:00',
        note: 'From the app',
      },
      {
        label: 'Reproduced',
        at: '2026-10-26T09:40:00+11:00',
        note: 'Cause found',
      },
      { label: 'Fixing', note: 'Fix in review' },
      { label: 'Live', note: 'You get an email and can rate it' },
    ],
  },
  {
    id: 'req-101',
    title: 'Add a site visit field',
    app: 'Flow',
    state: 'waiting',
    reporter: 'Jordan Lee',
    inCarePlan: false,
    updated: '2026-10-25T03:00:00Z',
    steps: [
      {
        label: 'Reported',
        at: '2026-10-24T10:00:00+11:00',
        note: 'From this console',
      },
      { label: 'Your reply', note: 'We asked which form needs the field' },
    ],
  },
  {
    id: 'req-097',
    title: 'Claw cannot read inbox',
    app: 'Acme assistant',
    state: 'live',
    reporter: 'Priya Nair',
    inCarePlan: true,
    updated: '2026-10-23T02:00:00Z',
    steps: [
      { label: 'Reported', at: '2026-10-22T08:30:00+11:00' },
      { label: 'Fixed', at: '2026-10-22T14:10:00+11:00' },
      { label: 'Live', at: '2026-10-23T13:00:00+11:00', note: 'Rate the fix' },
    ],
  },
  {
    id: 'req-090',
    title: 'Invoice email bounced',
    app: 'Field',
    state: 'closed',
    reporter: 'Jordan Lee',
    inCarePlan: true,
    rating: 'good',
    updated: '2026-10-14T02:00:00Z',
    steps: [
      { label: 'Reported', at: '2026-10-13T09:00:00+11:00' },
      { label: 'Live', at: '2026-10-13T15:00:00+11:00' },
      { label: 'Rated', at: '2026-10-14T13:00:00+11:00', note: 'Good' },
    ],
  },
]

export const demoBilling: Billing = {
  plan: 'Business',
  renews: '2026-12-01',
  items: [
    {
      name: 'Claws',
      detail: '2 claws, own boxes, daily backups',
      kind: 'included',
    },
    {
      name: 'Model use',
      detail: 'A$100 a month included, then metered',
      kind: 'included',
    },
    {
      name: 'Care plan · Field',
      detail: 'Fixes, updates, support requests',
      kind: 'addon',
    },
  ],
  models: { included: true, own: true, ownFirst: false },
  invoices: [
    {
      id: 'in_demo_2',
      date: '2026-10-01',
      items: 'Business, Care · Field, metered use',
    },
    { id: 'in_demo_1', date: '2026-09-01', items: 'Business, Care · Field' },
  ],
}
