import { describe, expect, it } from 'vitest'
import { clawsFor, parseClaws, type ClawRecord } from './claws'

const records: ClawRecord[] = [
  {
    name: 'acme',
    label: 'Acme assistant',
    hostname: 'acme.arcforge.space',
    email_domains: ['acme.example'],
  },
  {
    name: 'acme-ops',
    label: 'Acme ops',
    hostname: 'acme-ops.arcforge.space',
    emails: ['priya@acme.example'],
  },
  {
    name: 'other',
    label: 'Other',
    hostname: 'other.arcforge.space',
    emails: ['x@other.example'],
  },
]

describe('clawsFor', () => {
  it('matches an email domain', () => {
    expect(clawsFor('sam@acme.example', records).map((c) => c.name)).toEqual([
      'acme',
    ])
  })

  it('matches a listed email, case-insensitive, sorted by label', () => {
    expect(clawsFor('Priya@ACME.example', records).map((c) => c.name)).toEqual([
      'acme',
      'acme-ops',
    ])
  })

  it('gives nothing to a stranger', () => {
    expect(clawsFor('eve@evil.example', records)).toEqual([])
  })

  it('does not match a domain by suffix', () => {
    expect(clawsFor('eve@notacme.example', records)).toEqual([])
  })

  it('returns only public fields and an https address', () => {
    expect(clawsFor('sam@acme.example', records)[0]).toEqual({
      name: 'acme',
      label: 'Acme assistant',
      url: 'https://acme.arcforge.space/',
      status: undefined,
      version: undefined,
    })
  })
})

describe('parseClaws', () => {
  it('reads an empty store as no claws', () => {
    expect(parseClaws(null)).toEqual([])
  })

  it('drops rows with a bad hostname', () => {
    const raw = JSON.stringify([
      ...records,
      { name: 'bad', label: 'Bad', hostname: 'evil.example/path' },
    ])
    expect(parseClaws(raw).map((c) => c.name)).toEqual([
      'acme',
      'acme-ops',
      'other',
    ])
  })

  it('refuses a value that is not a list', () => {
    expect(() => parseClaws('{}')).toThrow()
  })
})
