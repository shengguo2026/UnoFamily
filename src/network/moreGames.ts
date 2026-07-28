export type MoreGameUnlockResult =
  | { ok: true; gameId: 'quatro' }
  | { ok: false }

export async function unlockMoreGame(
  password: string,
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<MoreGameUnlockResult> {
  if (typeof window === 'undefined' || typeof password !== 'string' || password.length === 0) {
    return { ok: false }
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
  const endpoint = `${protocol}//${window.location.hostname}:5203/api/more-games/unlock`

  try {
    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
      signal,
      cache: 'no-store',
    })
    const payload = await response.json() as unknown
    if (
      response.ok &&
      payload &&
      typeof payload === 'object' &&
      (payload as { ok?: unknown }).ok === true &&
      (payload as { gameId?: unknown }).gameId === 'quatro'
    ) {
      return { ok: true, gameId: 'quatro' }
    }
  } catch {
    return { ok: false }
  }

  return { ok: false }
}
