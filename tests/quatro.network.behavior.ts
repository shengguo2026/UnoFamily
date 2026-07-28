import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createQuatroGame } from '../src/game/quatro/rules'
import { createPrivateQuatroState } from '../src/game/quatro/privacy'
import { acceptQuatroWifiSnapshot } from '../src/network/quatroWifiSnapshot'
import { remapQuatroPlayersForWifi } from '../src/network/quatroWifiPlayers'
import { quatroAnimationHandForPlayer } from '../src/components/quatro/quatroAnimations'
import type { QuatroTile } from '../src/game/quatro/types'

const state = createQuatroGame({
  mode: 'wifi',
  aiDifficulty: 'medium',
  avatarId: 'explorer',
  random: { int: (maximum) => maximum - 1 },
})
{
  const remapped = remapQuatroPlayersForWifi(state, [
    {
      id: 'wifi-host',
      name: 'Host',
      type: 'human',
      avatarId: 'explorer',
    },
    {
      id: 'wifi-guest',
      name: 'Guest',
      type: 'human',
      avatarId: 'teacher',
    },
  ])
  const deal = remapped.events.find((event) => event.kind === 'deal')
  assert.ok(deal && deal.kind === 'deal')
  assert.deepEqual(
    deal.movements.map((movement) => movement.playerId),
    [
      'wifi-host',
      'wifi-guest',
      'wifi-host',
      'wifi-guest',
      'wifi-host',
      'wifi-guest',
    ],
    'Local WiFi must remap the opening animation to the room player IDs',
  )
  assert.deepEqual(
    deal.movements.map((movement) =>
      quatroAnimationHandForPlayer('wifi-host', movement.playerId),
    ),
    ['near', 'far', 'near', 'far', 'near', 'far'],
    'the host opening deal should animate three tiles to each player',
  )
  assert.deepEqual(
    deal.movements.map((movement) =>
      quatroAnimationHandForPlayer('wifi-guest', movement.playerId),
    ),
    ['far', 'near', 'far', 'near', 'far', 'near'],
    'the guest opening deal should animate three tiles to each player',
  )
}
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

const firstAcceptance = acceptQuatroWifiSnapshot(privateState, null)
assert.equal(firstAcceptance.state.transitionSequence, 17)
assert.deepEqual(firstAcceptance.state.events, [])
assert.equal(firstAcceptance.lastAnimatedSequence, 17)

{
  const openingState = createQuatroGame({
    mode: 'wifi',
    aiDifficulty: 'medium',
    avatarId: 'explorer',
    random: { int: () => 0 },
  })
  const openingPrivateState = createPrivateQuatroState(
    openingState,
    openingState.players[1].id,
  )
  const openingAcceptance = acceptQuatroWifiSnapshot(
    openingPrivateState,
    null,
  )
  assert.equal(
    openingAcceptance.state.events.some(
      (event) => event.kind === 'deal',
    ),
    true,
    'a guest must animate the first opening deal snapshot',
  )
}

const nextPrivateState = {
  ...privateState,
  transitionSequence: 18,
  events: [{ kind: 'turn' as const, playerId: state.players[0].id }],
}
const nextAcceptance = acceptQuatroWifiSnapshot(
  nextPrivateState,
  firstAcceptance.lastAnimatedSequence,
)
assert.deepEqual(nextAcceptance.state.events, nextPrivateState.events)
assert.equal(nextAcceptance.lastAnimatedSequence, 18)

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
