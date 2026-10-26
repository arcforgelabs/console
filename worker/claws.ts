// The claw list. The private platform deploy writes it to the CLAWS KV
// namespace (key "claws") from customers/*.yaml. It holds no secrets.
export type ClawRecord = {
  name: string
  label: string
  hostname: string
  emails?: string[]
  email_domains?: string[]
  groups?: string[]
  status?: string
  version?: string
}

export type Claw = {
  name: string
  label: string
  url: string
  status?: string
  version?: string
}

const hostnamePattern = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/

export function parseClaws(raw: string | null): ClawRecord[] {
  if (!raw) return []
  const value: unknown = JSON.parse(raw)
  if (!Array.isArray(value)) throw new Error('claws must be a JSON array')
  return value.filter(
    (c): c is ClawRecord =>
      typeof c === 'object' &&
      c !== null &&
      typeof c.name === 'string' &&
      typeof c.hostname === 'string' &&
      hostnamePattern.test(c.hostname)
  )
}

// A person sees a claw when their email is listed, or their email domain is.
export function clawsFor(email: string, records: ClawRecord[]): Claw[] {
  const address = email.trim().toLowerCase()
  const at = address.lastIndexOf('@')
  if (at < 1) return []
  const domain = address.slice(at + 1)

  return records
    .filter(
      (c) =>
        (c.emails ?? []).some((e) => e.toLowerCase() === address) ||
        (c.email_domains ?? []).some((d) => d.toLowerCase() === domain)
    )
    .map((c) => ({
      name: c.name,
      label: c.label || c.name,
      url: `https://${c.hostname}/`,
      status: c.status,
      version: c.version,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
