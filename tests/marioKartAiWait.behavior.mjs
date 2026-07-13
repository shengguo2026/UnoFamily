import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const hardwareKeyBody = appSource.match(/function hardwareEventKey\(state: GameState\): string \| null \{([\s\S]*?)\n}/)?.[1] ?? ''
const aiWaitBlock = appSource.match(/const hardwareKey = hardwareEventKey\(state\)[\s\S]*?const aiDelayMs =[\s\S]*?\n/)?.[0] ?? ''

assert.match(hardwareKeyBody, /marioKartEvent/, 'Mario Kart item events should create a hardware event key')
assert.match(hardwareKeyBody, /marioKart/, 'Mario Kart should participate in hardware animation AI wait gating')
assert.match(aiWaitBlock, /hardwarePopupSeconds \* 1000/, 'AI wait should use the hardware popup duration')

console.log('UNO Mario Kart AI animation wait test passed')
