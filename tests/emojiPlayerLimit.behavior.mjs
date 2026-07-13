import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const serverSource = readFileSync(new URL('../server/local-wifi-server.mjs', import.meta.url), 'utf8')

const playableBlock = appSource.match(/const playableGames:[\s\S]*?\n}/)?.[0] ?? ''
assert.match(playableBlock, /:\s*'emoji'/, 'UNO Emoji should remain selectable from the game list')

const widePlayerBody = appSource.match(/function usesWidePlayerOptions\(game: GameVariant\): boolean \{([\s\S]*?)\n}/)?.[1] ?? ''
assert.equal(widePlayerBody.includes("game === 'emoji'"), false, 'UNO Emoji should use the standard 2-4 player setup')

const cleanMaxPlayersBody = serverSource.match(/function cleanMaxPlayers\(game, value\) \{([\s\S]*?)\n}/)?.[1] ?? ''
assert.equal(
  /game === 'emoji'\)\s*return clamp\(requested, 2, 10\)/.test(cleanMaxPlayersBody),
  false,
  'Local WiFi should not allow UNO Emoji rooms above 4 players',
)

console.log('UNO Emoji player limit tests passed')
