import { describe, expect, it } from 'vitest'
import { ago, compact, initials, money, since } from './format'

describe('format', () => {
  it('formats Australian dollars', () => {
    expect(money(42.1)).toBe('$42.10')
  })

  it('shortens big numbers', () => {
    expect(compact(1_900_000)).toBe('1.9M')
  })

  it('says how long ago', () => {
    const now = Date.parse('2026-10-26T10:00:00Z')
    expect(ago('2026-10-26T09:59:30Z', now)).toBe('now')
    expect(ago('2026-10-26T09:45:00Z', now)).toBe('15 min')
    expect(ago('2026-10-26T08:00:00Z', now)).toBe('2 h')
    expect(ago('2026-10-23T10:00:00Z', now)).toBe('3 d')
  })

  it('reads as a phrase', () => {
    const now = Date.parse('2026-10-26T10:00:00Z')
    expect(since('2026-10-26T09:59:30Z', now)).toBe('just now')
    expect(since('2026-10-26T08:00:00Z', now)).toBe('2 h ago')
  })

  it('takes two initials', () => {
    expect(initials('Acme assistant')).toBe('AA')
    expect(initials('Field')).toBe('F')
  })
})
