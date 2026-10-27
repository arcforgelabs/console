import { describe, expect, it, vi } from 'vitest'
import { onSignedIn, onSignedOut } from './session'

function memoryStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (k: string) => items.get(k) ?? null,
    setItem: (k: string, v: string) => void items.set(k, v),
    removeItem: (k: string) => void items.delete(k),
  }
}

describe('signed out (API answers 401)', () => {
  it('reloads once, then shows the signed-out page instead of reloading again', () => {
    const storage = memoryStorage()
    const reload = vi.fn()
    const showSignedOut = vi.fn()

    // First 401, then the page after that reload gets a 401 again.
    onSignedOut({ storage, reload, showSignedOut })
    onSignedOut({ storage, reload, showSignedOut })
    onSignedOut({ storage, reload, showSignedOut })

    expect(reload).toHaveBeenCalledTimes(1)
    expect(showSignedOut).toHaveBeenCalledTimes(2)
  })

  it('reloads again after the session worked in between', () => {
    const storage = memoryStorage()
    const reload = vi.fn()
    const showSignedOut = vi.fn()

    onSignedOut({ storage, reload, showSignedOut })
    onSignedIn(storage)
    onSignedOut({ storage, reload, showSignedOut })

    expect(reload).toHaveBeenCalledTimes(2)
    expect(showSignedOut).not.toHaveBeenCalled()
  })
})
