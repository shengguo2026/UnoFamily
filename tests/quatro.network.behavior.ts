import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createQuatroGame } from '../src/game/quatro/rules'
import { createPrivateQuatroState } from '../src/game/quatro/privacy'
import type { QuatroTile } from '../src/game/quatro/types'

const state = createQuatroGame({
  mode: 'wifi',
  aiDifficulty: 'medium',
  avatarId: 'explorer',
  random: { int: (maximum) => maximum - 1 },
})
const ownTile: QuatroTile = {
  id: 'visible-own-tile',
  color: 'red',
  value: 0,
  action: null,
}
const hiddenTiles: QuatroTile[] = [
  {
    id: 'secret-opponent-alpha',
    color: 'yellow',
    value: 5,
    action: 'swap',
  },
  {
    id: 'secret-opponent-beta',
    color: 'yellow',
    value: 5,
    action: 'push',
  },
  {
    id: 'secret-opponent-gamma',
    color: 'yellow',
    value: 5,
    action: 'minus2',
  },
]
state.players[0].hand = [ownTile]
state.players[0].handCount = 1
state.players[1].hand = hiddenTiles
state.players[1].handCount = 3
state.bag = [
  {
    id: 'secret-next-bag-tile',
    color: 'green',
    value: 4,
    action: null,
  },
]
state.events = [
  {
    kind: 'minus2Return',
    playerId: state.players[1].id,
    tileIds: [hiddenTiles[0].id, hiddenTiles[1].id],
  },
]
state.phase = 'selectSwapSecond'
state.pendingSwapFirstColumn = 2
state.transitionSequence = 17

const privateState = createPrivateQuatroState(
  state,
  state.players[0].id,
)
assert.deepEqual(privateState.players[0].hand, [ownTile])
assert.deepEqual(privateState.players[1].hand, [])
assert.equal(privateState.players[1].handCount, 3)
assert.deepEqual(privateState.bag, [])
assert.equal(privateState.bagCount, 1)
assert.equal(privateState.phase, state.phase)
assert.equal(privateState.pendingSwapFirstColumn, 2)
assert.equal(privateState.transitionSequence, 17)
assert.deepEqual(privateState.columns, state.columns)
assert.equal(
  privateState.events[0].kind === 'minus2Return'
    ? privateState.events[0].tileIds.length
    : 0,
  2,
)

const serialized = JSON.stringify(privateState)
for (const secret of [
  ...hiddenTiles.map((tile) => tile.id),
  'secret-next-bag-tile',
  'yellow',
  'green',
  '"value":5',
  '"value":4',
]) {
  assert.equal(
    serialized.includes(secret),
    false,
    `private snapshot leaked ${secret}`,
  )
}

const protocol = readFileSync('src/network/localWifi.ts', 'utf8')
for (const action of [
  'quatroPlace',
  'quatroSwapColumn',
  'quatroEmptyPush',
  'quatroExchange',
]) {
  assert.equal(protocol.includes(action), true)
}
assert.equal(protocol.includes('quatroState?: PrivateQuatroState'), true)

const server = readFileSync('server/local-wifi-server.mjs', 'utf8')
const cleanGameBody =
  server.match(/function cleanGame\(value\) \{([\s\S]*?)\n}/)?.[1] ?? ''
const cleanPlayersBody =
  server.match(
    /function cleanMaxPlayers\(game, value\) \{([\s\S]*?)\n}/,
  )?.[1] ?? ''
assert.equal(cleanGameBody.includes("value === 'quatro'"), true)
assert.equal(
  cleanPlayersBody.includes("if (game === 'quatro') return 2"),
  true,
)

console.log('UNO Quatro network privacy behavior tests passed')
