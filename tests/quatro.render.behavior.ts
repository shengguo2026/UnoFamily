import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  createQuatroLayout,
  hitTestQuatroLayout,
  quatroCanvasHandCounts,
  quatroWinningLineFrames,
} from '../src/components/quatro/quatroLayout'
import {
  buildQuatroAnimationTimelineForTransition,
  buildQuatroAnimationTimeline,
  quatroActiveDropTileIds,
  quatroAnimationHandForPlayer,
  quatroDropPoint,
  quatroInitialDealKey,
  quatroInitialDealPending,
  quatroPushArrowGeometry,
  quatroSoundKey,
  quatroSwapTrayTransforms,
  soundCueForQuatroEvent,
} from '../src/components/quatro/quatroAnimations'
import { soundEventMap, soundProfiles } from '../src/game/sound'
import type { QuatroAnimationEvent } from '../src/game/quatro/types'
import { createQuatroGame } from '../src/game/quatro/rules'
import { QuatroTable } from '../src/components/quatro/QuatroTable'
import {
  QUATRO_WINNING_LINE_HOLD_MS,
  quatroWinnerPresentationStage,
} from '../src/components/quatro/quatroWinnerPresentation'

Object.assign(globalThis, { React })

function overlapsSlotRect(
  slot: {
    x: number
    y: number
    width: number
    height: number
  },
  rect: { x: number; y: number; width: number; height: number },
): boolean {
  const slotLeft = slot.x - slot.width / 2
  const slotRight = slot.x + slot.width / 2
  const slotTop = slot.y - slot.height / 2
  const slotBottom = slot.y + slot.height / 2
  return (
    slotLeft < rect.x + rect.width
    && slotRight > rect.x
    && slotTop < rect.y + rect.height
    && slotBottom > rect.y
  )
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
    const slotSizes = layout.slots[column].map(
      (slot) => `${slot.width}:${slot.height}`,
    )
    assert.equal(new Set(slotSizes).size, 1)
    for (const slot of layout.slots[column]) {
      assert.equal(
        slot.width,
        slot.height,
        'Quatro board slots should match the square physical tiles',
      )
      assert.equal(hitTestQuatroLayout(layout, slot.x, slot.y), column)
      assert.equal(overlapsSlotRect(slot, layout.bag), false)
      assert.equal(overlapsSlotRect(slot, layout.hands.near), false)
      assert.equal(overlapsSlotRect(slot, layout.hands.far), false)
    }
  }
  if (width >= 700) {
    assert.equal(
      Math.min(...layout.slots.flat().map((slot) => slot.height)) >= 44,
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
  const handState = createQuatroGame(
    {
      mode: 'hotseat',
      aiDifficulty: 'medium',
      avatarId: 'explorer',
      random: { int: () => 0 },
    },
  )
  const viewer = handState.players[0]
  const opponent = handState.players[1]
  assert.equal(
    quatroInitialDealPending(handState, null),
    true,
    'both static hands should remain hidden before the opening deal completes',
  )
  assert.equal(
    quatroInitialDealPending(
      handState,
      quatroInitialDealKey(handState),
    ),
    false,
    'static hands should appear after the opening deal completes',
  )
  assert.deepEqual(
    quatroCanvasHandCounts(handState.players, viewer.id),
    {
      near: 0,
      far: opponent.handCount,
    },
    'the Canvas should render only the opponent hand because the DOM owns the local hand',
  )
  const tableCallbacks = {
    language: 'en' as const,
    viewerPlayerId: viewer.id,
    selectedTileId: null,
    hiddenHands: false,
    animationLocked: false,
    reducedMotion: false,
    tileTheme: 'classicQuatro' as const,
    onSelectTile: () => undefined,
    onAction: () => undefined,
    onRevealHand: () => undefined,
    onOpenSetup: () => undefined,
    onNewGame: () => undefined,
    onBlockingAnimationChange: () => undefined,
    onSoundCue: () => undefined,
  }
  const openingMarkup = renderToStaticMarkup(
    createElement(QuatroTable, {
      state: handState,
      ...tableCallbacks,
    }),
  )
  assert.match(openingMarkup, /data-initial-deal="pending"/)
  assert.equal(
    openingMarkup.includes('aria-label="Your tiles"'),
    false,
    'the local hand must not be visible beneath the opening deal animation',
  )

  handState.events = []
  handState.players[0] = {
    ...viewer,
    hand: [
      {
        ...viewer.hand[0],
        action: 'push',
      },
      ...viewer.hand.slice(1),
    ],
  }
  const markup = renderToStaticMarkup(
    createElement(QuatroTable, {
      state: handState,
      ...tableCallbacks,
    }),
  )
  assert.match(markup, /class="quatro-tile-action"[^>]*>⇩</)
  assert.equal(
    (markup.match(/aria-label="Your tiles"/g) ?? []).length,
    1,
    'the interactive local hand should appear once',
  )
}

{
  const layout = createQuatroLayout(768, 720)
  const line = {
    match: 'color' as const,
    color: 'red' as const,
    cells: [
      { column: 1, row: 0 },
      { column: 2, row: 1 },
      { column: 3, row: 2 },
      { column: 4, row: 3 },
    ],
  }
  const frames = quatroWinningLineFrames(layout, line)
  assert.equal(frames.length, 4)
  assert.equal(
    frames.every((frame) => frame.width > 0 && frame.height > 0),
    true,
  )
  assert.equal(
    new Set(frames.map((frame) => `${frame.x}:${frame.y}`)).size,
    4,
  )

  assert.equal(QUATRO_WINNING_LINE_HOLD_MS, 3_000)
  assert.equal(
    quatroWinnerPresentationStage(false, 99_999),
    'playing',
  )
  assert.equal(
    quatroWinnerPresentationStage(true, 0),
    'winningLine',
  )
  assert.equal(
    quatroWinnerPresentationStage(
      true,
      QUATRO_WINNING_LINE_HOLD_MS - 1,
    ),
    'winningLine',
  )
  assert.equal(
    quatroWinnerPresentationStage(
      true,
      QUATRO_WINNING_LINE_HOLD_MS,
    ),
    'celebration',
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
  assert.deepEqual(
    timeline.tracks
      .filter((track) => track.kind === 'deal')
      .map((track) => track.movementIndex),
    [0, 1, 2, 3, 4, 5],
  )
  assert.deepEqual(
    timeline.tracks
      .filter((track) => track.kind === 'deal')
      .map((track) => quatroSoundKey(7, track)),
    [
      '7:1:0',
      '7:1:1',
      '7:1:2',
      '7:1:3',
      '7:1:4',
      '7:1:5',
    ],
  )
  assert.equal(
    quatroAnimationHandForPlayer('player-0', 'player-0'),
    'near',
  )
  assert.equal(
    quatroAnimationHandForPlayer('player-0', 'player-1'),
    'far',
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

{
  const trayTwoEvents: QuatroAnimationEvent[] = [
    {
      kind: 'drop',
      playerId: 'player-1',
      tileId: 'yellow-push-four',
      column: 1,
      row: 2,
    },
    {
      kind: 'push',
      column: 1,
      tileId: 'yellow-push-four',
      ejectedTileId: 'old-bottom',
    },
  ]
  const transition = buildQuatroAnimationTimelineForTransition(
    {
      transitionSequence: 12,
      events: trayTwoEvents,
    },
    {
      speed: 'normal',
      reducedMotion: false,
    },
  )
  assert.equal(transition.transitionSequence, 12)
  assert.deepEqual(
    transition.timeline.tracks
      .filter((track) =>
        track.event.kind === 'drop' || track.event.kind === 'push',
      )
      .map((track) =>
        track.event.kind === 'drop' || track.event.kind === 'push'
          ? track.event.column
          : null,
      ),
    [1, 1],
    'a Tray 2 transition must never reuse the previous tray animation',
  )
  assert.deepEqual(
    [...quatroActiveDropTileIds(transition.timeline.tracks, 120)],
    ['yellow-push-four'],
    'the placed tile should be withheld from the board while it drops',
  )
  assert.deepEqual(
    [...quatroActiveDropTileIds(transition.timeline.tracks, 431)],
    [],
  )
}

{
  const layout = createQuatroLayout(1024, 600)
  const dropEvent: QuatroAnimationEvent = {
    kind: 'drop',
    playerId: 'p1',
    tileId: 'tile-drop',
    column: 4,
    row: 2,
  }
  const dropEnd = quatroDropPoint(layout, dropEvent, 1)
  assert.equal(dropEnd.x, layout.slots[4][2].x)
  assert.equal(dropEnd.y, layout.slots[4][2].y)

  const pushStart = quatroPushArrowGeometry(layout, 5, 0)
  const pushEnd = quatroPushArrowGeometry(layout, 5, 1)
  assert.equal(pushStart.x, layout.trays[5].x + layout.trays[5].width / 2)
  assert.equal(pushEnd.x, pushStart.x)
  assert.equal(pushEnd.y > pushStart.y, true)

  const swapHalfway = quatroSwapTrayTransforms(layout, [1, 5], 0.5)
  assert.equal(swapHalfway.length, 2)
  assert.equal(
    swapHalfway.every((transform) => transform.y < layout.trays[1].y),
    true,
  )
  const swapEnd = quatroSwapTrayTransforms(layout, [1, 5], 1)
  assert.equal(swapEnd[0].x, layout.trays[5].x)
  assert.equal(swapEnd[1].x, layout.trays[1].x)
}

{
  const tableSource = readFileSync(
    'src/components/quatro/QuatroTable.tsx',
    'utf8',
  )
  const cssSource = readFileSync('src/App.css', 'utf8')
  const appSource = readFileSync('src/App.tsx', 'utf8')
  for (const contract of [
    'quatro-hand-row',
    'quatro-info-pane',
    'quatro-tile-tooltip',
  ]) {
    assert.equal(
      tableSource.includes(contract),
      true,
      `missing compact control contract: ${contract}`,
    )
  }
  assert.equal(cssSource.includes('.quatro-tile-tooltip'), true)
  assert.match(
    cssSource,
    /\.quatro-canvas-wrap\s*>\s*\.visually-hidden\s*\{[\s\S]{0,420}position:\s*absolute/,
    'the canvas tray controls must stay accessible without entering the visual layout',
  )
  assert.equal(cssSource.includes('overflow-y: auto'), true)
  assert.match(
    appSource,
    /config\.mode === 'spectacular'[\s\S]{0,120}quatroState\.players\[0\]\.id/,
  )
}

console.log('UNO Quatro render behavior tests passed')
