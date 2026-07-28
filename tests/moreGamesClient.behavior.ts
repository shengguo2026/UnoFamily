import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MoreGamesTile } from '../src/components/MoreGamesTile'
import { MoreGamesUnlockModal } from '../src/components/MoreGamesUnlockModal'
import { unlockMoreGame } from '../src/network/moreGames'

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: {
      protocol: 'http:',
      hostname: 'family-table.local',
    },
  },
})

{
  let receivedUrl = ''
  let receivedInit: RequestInit | undefined
  const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
    receivedUrl = String(url)
    receivedInit = init
    return new Response(JSON.stringify({ ok: true, gameId: 'quatro' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch

  const result = await unlockMoreGame('test-only-value', undefined, fetcher)
  assert.deepEqual(result, { ok: true, gameId: 'quatro' })
  assert.equal(receivedUrl, 'http://family-table.local:5203/api/more-games/unlock')
  assert.equal(receivedInit?.method, 'POST')
  assert.equal(receivedInit?.cache, 'no-store')
  assert.deepEqual(JSON.parse(String(receivedInit?.body)), { password: 'test-only-value' })
}

{
  const malformedFetcher = (async () => new Response(
    JSON.stringify({ ok: true, gameId: 'unknown-game' }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )) as typeof fetch
  assert.deepEqual(await unlockMoreGame('test-only-value', undefined, malformedFetcher), { ok: false })
}

for (const language of ['en', 'zh', 'de'] as const) {
  const markup = renderToStaticMarkup(createElement(MoreGamesUnlockModal, {
    language,
    onCancel: () => undefined,
    onUnlocked: () => undefined,
  }))
  assert.match(markup, /role="dialog"/)
  assert.match(markup, /aria-modal="true"/)
  assert.match(markup, /type="password"/)
  assert.match(markup, /auto[Cc]omplete="new-password"/)
  assert.equal((markup.match(/<button/g) ?? []).length, 2)
  assert.doesNotMatch(markup, /type="text"/)
}

{
  const markup = renderToStaticMarkup(createElement(MoreGamesTile, {
    onOpen: () => undefined,
  }))
  assert.match(markup, /<button/)
  assert.match(markup, /more-games-platinum/)
  assert.match(markup, />More games</)
  assert.doesNotMatch(markup, /disabled/)
}

console.log('More games client behavior tests passed')
