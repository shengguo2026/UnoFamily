import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  createQuatroLayout,
  hitTestQuatroLayout,
} from '../src/components/quatro/quatroLayout'
import {
  buildQuatroAnimationTimeline,
  soundCueForQuatroEvent,
} from '../src/components/quatro/quatroAnimations'
import { soundEventMap, soundProfiles } from '../src/game/sound'
import type { QuatroAnimationEvent } from '../src/game/quatro/types'

function overlapsCircleRect(
  circle: { x: number; y: number; radius: number },
  rect: { x: number; y: number; width: number; height: number },
): boolean {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width))
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height))
  const deltaX = circle.x - closestX
  const deltaY = circle.y - closestY
  return deltaX * deltaX + deltaY * deltaY < circle.radius * circle.radius
}

for (const [width, height] of [
  [320, 420],
  [768, 720],
  [1024, 600],
  [1440, 800],
] as const) {
  const layout = createQuatroLayout(width, height)
  assert.equal(layout.trays.length, 7)
  assert.equal(layout.slots.length, 7)

  for (let column = 0; column < 7; column += 1) {
    const tray = layout.trays[column]
    assert.equal(tray.x >= 0 && tray.y >= 0, true)
    assert.equal(tray.x + tray.width <= width, true)
    assert.equal(tray.y + tray.height <= height, true)
    assert.equal(layout.slots[column].length, 6)
    const radii = layout.slots[column].map((slot) => slot.radius)
    assert.equal(new Set(radii).size, 1)
    for (const slot of layout.slots[column]) {
      assert.equal(hitTestQuatroLayout(layout, slot.x, slot.y), column)
      assert.equal(overlapsCircleRect(slot, layout.bag), false)
      assert.equal(overlapsCircleRect(slot, layout.hands.near), false)
      assert.equal(overlapsCircleRect(slot, layout.hands.far), false)
    }
  }
  if (width >= 700) {
    assert.equal(
      Math.min(...layout.slots.flat().map((slot) => slot.radius * 2)) >= 44,
      true,
      'tablet and desktop slots should meet the 44px touch target',
    )
  }
  assert.equal(hitTestQuatroLayout(layout, -1, -1), null)
  assert.deepEqual(
    createQuatroLayout(width, height),
    createQuatroLayout(width, height),
    'CSS geometry should be independent from device pixel ratio',
  )
}

{
  const source = readFileSync(
    'src/components/quatro/QuatroCanvas.tsx',
    'utf8',
  )
  for (const contract of [
    '<canvas',
    'ResizeObserver',
    'devicePixelRatio',
    'Math.min(2',
    'getBoundingClientRect',
    'onTileSelect',
    'onColumnSelect',
    'onPendingChoice',
    'triangle',
    'circle',
    'star',
    'diamond',
    'cancelAnimationFrame',
    '.disconnect()',
  ]) {
    assert.equal(source.includes(contract), true, `missing renderer contract: ${contract}`)
  }
}

{
  const dealEvent: QuatroAnimationEvent = {
    kind: 'deal',
    movements: Array.from({ length: 6 }, (_, index) => ({
      playerId: `player-${index % 2}`,
      tileId: `tile-${index}`,
    })),
  }
  const events: QuatroAnimationEvent[] = [
    { kind: 'bagShake' },
    dealEvent,
    {
      kind: 'drop',
      playerId: 'player-1',
      tileId: 'drop-tile',
      column: 2,
      row: 3,
    },
    { kind: 'swap', columns: [1, 5] },
    {
      kind: 'push',
      column: 3,
      tileId: 'push-tile',
      ejectedTileId: 'old-bottom',
    },
    {
      kind: 'minus2Return',
      playerId: 'player-2',
      tileIds: ['minus-a', 'minus-b'],
    },
    { kind: 'returnToBag', playerId: 'player-1', tileId: 'return-tile' },
    { kind: 'draw', playerId: 'player-1', tileId: 'draw-tile' },
    {
      kind: 'win',
      playerId: 'player-1',
      line: {
        match: 'color',
        color: 'red',
        cells: [
          { column: 0, row: 0 },
          { column: 1, row: 0 },
          { column: 2, row: 0 },
          { column: 3, row: 0 },
        ],
      },
    },
  ]
  const timeline = buildQuatroAnimationTimeline(events, {
    speed: 'normal',
    reducedMotion: false,
  })
  assert.equal(
    timeline.tracks.find((track) => track.kind === 'bagShake')!.endsAt
      - timeline.tracks.find((track) => track.kind === 'bagShake')!.startsAt
      >= 700,
    true,
  )
  assert.equal(
    timeline.tracks.filter((track) => track.kind === 'deal').length,
    6,
  )
  assert.equal(
    timeline.tracks.filter((track) => track.kind === 'minus2Return').length,
    2,
  )
  const returnTrack = timeline.tracks.find(
    (track) => track.kind === 'returnToBag',
  )!
  const drawTrack = timeline.tracks.find((track) => track.kind === 'draw')!
  assert.equal(drawTrack.startsAt >= returnTrack.endsAt, true)
  const winTracks = timeline.tracks.filter((track) => track.kind === 'win')
  assert.deepEqual(winTracks.map((track) => track.style), ['pulse', 'particles'])
  assert.equal(winTracks[1].startsAt >= winTracks[0].endsAt, true)

  const reduced = buildQuatroAnimationTimeline(events, {
    speed: 'slow',
    reducedMotion: true,
  })
  assert.equal(
    reduced.tracks.every(
      (track) =>
        track.endsAt - track.startsAt <= 120
        && track.style === 'static',
    ),
    true,
  )

  const soundExpectations = new Map<
    QuatroAnimationEvent['kind'],
    string | null
  >([
    ['bagShake', 'quatroBagShake'],
    ['deal', 'quatroDeal'],
    ['drop', 'quatroDrop'],
    ['swap', 'quatroSwap'],
    ['push', 'quatroPush'],
    ['minus2Return', 'quatroMinus2'],
    ['returnToBag', 'quatroReturn'],
    ['draw', 'quatroDraw'],
    ['turn', null],
    ['win', 'quatroWin'],
  ])
  for (const event of events) {
    assert.equal(
      soundCueForQuatroEvent(event),
      soundExpectations.get(event.kind),
    )
  }
  for (const cue of [...soundExpectations.values()].filter(Boolean) as string[]) {
    assert.equal(cue in soundEventMap, true)
    assert.equal(cue in soundProfiles, true)
  }
}

console.log('UNO Quatro render behavior tests passed')
