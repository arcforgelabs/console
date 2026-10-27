import { describe, expect, it, vi } from 'vitest'
import { ApiError } from './api'
import { createQueryClient } from './session'

function memoryStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (k: string) => items.get(k) ?? null,
    setItem: (k: string, v: string) => void items.set(k, v),
    removeItem: (k: string) => void items.delete(k),
  }
}

// One page load: a new query client asks the API for the signed-in person,
// as the console layout does. sessionStorage outlives the reload.
async function pageLoad(
  storage: ReturnType<typeof memoryStorage>,
  answer: () => Promise<unknown>
) {
  const reload = vi.fn()
  const showSignedOut = vi.fn()
  const client = createQueryClient({ storage, reload, showSignedOut })
  await client.fetchQuery({ queryKey: ['me'], queryFn: answer }).catch(() => {})
  return { reload, showSignedOut }
}

const signedOut = () => Promise.reject(new ApiError(401))
const signedIn = () => Promise.resolve({ email: 'jordan@acme.example' })

describe('signed out (API answers 401)', () => {
  it('reloads once, then shows the signed-out page instead of reloading again', async () => {
    const storage = memoryStorage()

    const first = await pageLoad(storage, signedOut)
    expect(first.reload).toHaveBeenCalledTimes(1)

    // The page after that reload gets a 401 again.
    const second = await pageLoad(storage, signedOut)
    expect(second.reload).not.toHaveBeenCalled()
    expect(second.showSignedOut).toHaveBeenCalledTimes(1)
  })

  it('reloads again after the session worked in between', async () => {
    const storage = memoryStorage()

    await pageLoad(storage, signedOut)
    await pageLoad(storage, signedIn)
    const later = await pageLoad(storage, signedOut)

    expect(later.reload).toHaveBeenCalledTimes(1)
    expect(later.showSignedOut).not.toHaveBeenCalled()
  })
})
