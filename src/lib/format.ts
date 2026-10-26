const locale = 'en-AU'

export function money(amount: number, currency = 'AUD') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(amount)
}

export function day(iso: string) {
  return new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function compact(n: number) {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

// "now", "5 min", "2 h", "3 d" since a time. Uses `now` for tests.
export function ago(iso: string, now = Date.now()) {
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60000))
  if (min < 2) return 'now'
  if (min < 60) return `${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} h`
  return `${Math.round(h / 24)} d`
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
