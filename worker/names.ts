// The chosen-name check for the Address page (platform#564). The private
// platform deploy writes KV key "taken_names": every chosen and held name,
// and the reserved list. The answer is only yes or no: it never says whose
// name it is. The platform checks again when support merges the request.
export type NameCheck = { available: boolean; reason?: 'shape' | 'taken' }

// The same shape that tofu/customers accepts: 3 to 32 of a-z, 0-9 and single
// hyphens, a letter first, not ending in -widgets, not shaped like a client ID.
const shape = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/
const clientId = /^c[0-9abcdefghjkmnpqrstvwxyz]{5}$/

export function parseTaken(raw: string | null): Set<string> {
  if (!raw) return new Set()
  const value: unknown = JSON.parse(raw)
  if (!Array.isArray(value)) throw new Error('taken_names must be a JSON array')
  return new Set(value.filter((n): n is string => typeof n === 'string'))
}

export function checkName(name: string, taken: Set<string>): NameCheck {
  const n = name.trim().toLowerCase()
  if (
    !shape.test(n) ||
    n.includes('--') ||
    n.endsWith('-widgets') ||
    clientId.test(n)
  )
    return { available: false, reason: 'shape' }
  if (taken.has(n)) return { available: false, reason: 'taken' }
  return { available: true }
}
