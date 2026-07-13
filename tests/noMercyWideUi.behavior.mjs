import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const canvasSource = readFileSync('src/components/GameCanvas.tsx', 'utf8')
const compactBranch = canvasSource.match(/if \(\([\s\S]*?displayPlayers\.length > 4\) \{[\s\S]*?drawPartyPlayers/)?.[0] ?? ''

assert.match(compactBranch, /noMercy/, "No Mercy with more than 4 players should use the compact many-player canvas renderer")
assert.match(compactBranch, /superMario/, "UNO Super Mario with more than 4 players should use the compact many-player canvas renderer")
assert.match(compactBranch, /marioKart/, "UNO Mario Kart with more than 4 players should use the compact many-player canvas renderer")

console.log('Wide UNO UI regression test passed')
