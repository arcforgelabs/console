import { useQuery } from '@tanstack/react-query'
import { demo, getJson } from './api'
import {
  demoApps,
  demoBilling,
  demoSupport,
  demoTeam,
  demoUsage,
} from './demo-data'

// Types for the console pages after Claws. The Worker routes for these come
// later (seats: Keycloak organisations; usage: ClawRouter; apps and billing:
// Stripe; support: the support relay). Until a route exists it returns 404,
// and the page says it is not connected yet.

export type Role = 'owner' | 'admin' | 'member'

export type TeamMember = {
  email: string
  name: string
  role: Role
  claws: string[]
  lastSignIn?: string
  invited?: boolean
}

export type Team = {
  claws: { name: string; label: string }[]
  members: TeamMember[]
  seatsIncluded: number
}

export type UsageRow = {
  key: string
  requests: number
  tokens: number
  cost: number
}

export type Usage = {
  currency: string
  periodStart: string
  periodEnd: string
  included: { used: number; limit: number }
  ownSubscription: { connected: boolean; claws: string[] }
  daily: { date: string; cost: number }[]
  byPerson: UsageRow[]
  byClaw: UsageRow[]
  byModel: UsageRow[]
}

export type CareApp = {
  id: string
  name: string
  url: string
  version: string
  plan?: {
    name: string
    renews: string
    requestsThisMonth: number
    uptime30d: number
  }
}

export type SupportState = 'new' | 'fixing' | 'waiting' | 'live' | 'closed'

export type SupportRequest = {
  id: string
  title: string
  app: string
  state: SupportState
  reporter: string
  inCarePlan: boolean
  rating?: 'good' | 'bad'
  updated: string
  steps: { label: string; at?: string; note?: string }[]
}

export type Billing = {
  plan: string
  renews: string
  items: { name: string; detail: string; kind: 'included' | 'addon' }[]
  models: { included: boolean; own: boolean; ownFirst: boolean }
  invoices: { id: string; date: string; items: string }[]
}

function demoOr<T>(data: T, path: string) {
  return () => (demo ? Promise.resolve(data) : getJson<T>(path))
}

export const useTeam = () =>
  useQuery({ queryKey: ['team'], queryFn: demoOr(demoTeam, '/api/team') })

export const useUsage = () =>
  useQuery({ queryKey: ['usage'], queryFn: demoOr(demoUsage, '/api/usage') })

export const useApps = () =>
  useQuery({ queryKey: ['apps'], queryFn: demoOr(demoApps, '/api/apps') })

export const useSupport = () =>
  useQuery({
    queryKey: ['support'],
    queryFn: demoOr(demoSupport, '/api/support'),
  })

export const useBilling = () =>
  useQuery({
    queryKey: ['billing'],
    queryFn: demoOr(demoBilling, '/api/billing'),
  })
