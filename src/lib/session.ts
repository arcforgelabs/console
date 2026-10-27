// A 401 from the API means the Access session ended. One reload sends the
// browser through Cloudflare Access, which signs the person in again. If the
// API still answers 401 after that reload, Access cannot help (for example
// an expired session or an Access fault): stop and show the signed-out page,
// or the page reloads without end.
const reloadedKey = 'console:reloaded-for-401'

type Deps = {
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  reload: () => void
  showSignedOut: () => void
}

export function onSignedOut({ storage, reload, showSignedOut }: Deps) {
  if (storage.getItem(reloadedKey)) return showSignedOut()
  storage.setItem(reloadedKey, '1')
  reload()
}

// Any answer from the API shows the session works again.
export function onSignedIn(storage: Deps['storage']) {
  storage.removeItem(reloadedKey)
}
