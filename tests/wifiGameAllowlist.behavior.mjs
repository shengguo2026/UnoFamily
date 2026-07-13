import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const serverSource = readFileSync(new URL('../server/local-wifi-server.mjs', import.meta.url), 'utf8')

const playableBlock = appSource.match(/const playableGames:[\s\S]*?\n}/)?.[0] ?? ''
const playableGames = [...playableBlock.matchAll(/:\s*'([^']+)'/g)].map((match) => match[1])

const cleanGameBody = serverSource.match(/function cleanGame\(value\) \{([\s\S]*?)\n}/)?.[1] ?? ''
const missing = playableGames.filter((game) => !cleanGameBody.includes(`'${game}'`))

assert.deepEqual(missing, [], `WiFi server cleanGame is missing playable game(s): ${missing.join(', ')}`)

console.log('WiFi game allow-list test passed')
