import assert from 'node:assert/strict'
import { createConfig, createGame } from '../src/game/classic'
import { tooltipCardEffectForTest } from '../src/components/GameCanvas'
import type { AddOnPack, Card, GameVariant } from '../src/game/types'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

const state = createGame(createConfig('marioKart' as GameVariant, 'hotseat', 4, 'medium', addOns))
const itemBox: Card = { id: 'box', kind: 'wildItemBox', color: 'wild', label: 'Wild Item Box', points: 50 }

{
  const hint = tooltipCardEffectForTest('en', itemBox, state)

  assert.match(hint, /Mushroom/i, 'Wild Item Box hint should mention Mushroom')
  assert.match(hint, /Banana/i, 'Wild Item Box hint should mention Banana Peel')
  assert.match(hint, /Green Shell/i, 'Wild Item Box hint should mention Green Shell')
  assert.match(hint, /Lightning/i, 'Wild Item Box hint should mention Lightning')
  assert.match(hint, /Bob-omb/i, 'Wild Item Box hint should mention Bob-omb')
}

{
  const hint = tooltipCardEffectForTest('zh', itemBox, state)

  assert.match(hint, /蘑菇/, 'Chinese Wild Item Box hint should mention Mushroom')
  assert.match(hint, /香蕉/, 'Chinese Wild Item Box hint should mention Banana Peel')
  assert.match(hint, /绿龟壳/, 'Chinese Wild Item Box hint should mention Green Shell')
  assert.match(hint, /闪电/, 'Chinese Wild Item Box hint should mention Lightning')
  assert.match(hint, /炸弹兵/, 'Chinese Wild Item Box hint should mention Bob-omb')
}

console.log('UNO Mario Kart hint tests passed')
