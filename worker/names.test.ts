import { describe, expect, it } from 'vitest'
import { checkName, parseTaken } from './names'

const taken = parseTaken(JSON.stringify(['acme', 'acme-old', 'console']))

describe('checkName', () => {
  it('says yes to a free name in the right shape', () => {
    expect(checkName('bright-dental', taken)).toEqual({ available: true })
  })

  it('says no to a chosen, held or reserved name, without saying whose', () => {
    for (const n of ['acme', 'ACME-old', 'console'])
      expect(checkName(n, taken)).toEqual({ available: false, reason: 'taken' })
  })

  it('refuses names the platform would refuse', () => {
    for (const n of [
      'ab',
      'Acme!',
      '1acme',
      'a--b',
      'acme-widgets',
      'c7k2mq',
      'x'.repeat(33),
    ])
      expect(checkName(n, taken)).toEqual({ available: false, reason: 'shape' })
  })
})
