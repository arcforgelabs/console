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
  // The Address page (platform#564).
  id_hostname?: string
  chosen_name?: string
  domains?: string[]
}

// What the Address page shows: the permanent client ID address, the chosen
// name (empty when none), and each own domain with the CNAME target the
// customer adds at their DNS provider.
type Addresses = {
  permanent: string
  chosenName: string
  domains: { hostname: string; cnameTarget: string }[]
}

export type Claw = {
  name: string
  label: string
  url: string
  status?: string
  version?: string
  addresses?: Addresses
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
      addresses: addressesOf(c),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

function addressesOf(c: ClawRecord): Addresses | undefined {
  if (!c.id_hostname || !hostnamePattern.test(c.id_hostname)) return undefined
  const permanent = c.id_hostname
  return {
    permanent,
    chosenName: c.chosen_name ?? '',
    domains: (c.domains ?? [])
      .filter((d) => hostnamePattern.test(d))
      .map((hostname) => ({ hostname, cnameTarget: permanent })),
  }
}
