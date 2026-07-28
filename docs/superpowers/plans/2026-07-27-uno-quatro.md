# UNO Quatro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete, localized, two-player UNO Quatro game behind the “More games” access gate, including official rules, AI, WiFi, canvas visuals, animations, sounds, hints, and a no-score winner flow.

**Architecture:** UNO Quatro uses a focused `src/game/quatro/` domain instead of adding board-game branches throughout the classic UNO card engine. Pure functions own tile generation, legality, actions, winner detection, AI, hints, and private snapshots; React coordinates mode/setup state while a dedicated Canvas 2D component renders and animates the seven-tray board.

**Tech Stack:** React 19, TypeScript 6, HTML Canvas 2D, CSS, Web Audio, Vite 8, existing local WiFi WebSocket protocol, Node.js behavior tests.

## Global Constraints

- UNO Quatro is available only after successful “More games” verification.
- Every mode has exactly two players.
- Every player begins with exactly three tiles.
- Use the official 44-tile set, seven trays, and a seven-column by six-row board.
- Enforce adjacency matching by color or number.
- Resolve mandatory action effects before checking the final board for a win.
- Minus 2 leaves the opponent with one tile for the next turn, then refills to three after that turn.
- Do not calculate or display a score.
- Use HTML canvas and CSS for new game visuals.
- Animate and sound bag shake, deal, placement, Swap, Push/eject, Minus 2, exchange return/draw, and winning fireworks.
- Highlight all movable hand tiles and legal trays.
- Provide hints, rules, strategy, and action references in English, Simplified Chinese, and German.
- Respect existing sound, animation speed, deal-animation, winner-celebration, and reduced-motion settings.

---

## File structure

- Create `src/game/quatro/types.ts`: complete UNO Quatro domain types.
- Create `src/game/quatro/tiles.ts`: exact 44-tile definition and shuffled bag.
- Create `src/game/quatro/rules.ts`: setup, legality, transitions, actions, refill, and win detection.
- Create `src/game/quatro/ai.ts`: easy, medium, and hard two-player decisions.
- Create `src/game/quatro/hints.ts`: legal highlighting and player-facing recommendations.
- Create `src/game/quatro/translation.ts`: `en`, `zh`, and `de` game text and rule sections.
- Create `src/game/quatro/privacy.ts`: per-viewer WiFi snapshots.
- Create `src/components/quatro/quatroLayout.ts`: pure responsive geometry and hit areas.
- Create `src/components/quatro/quatroAnimations.ts`: transition-to-animation timelines.
- Create `src/components/quatro/QuatroCanvas.tsx`: Canvas 2D drawing, pointer input, and animation loop.
- Create `src/components/quatro/QuatroTable.tsx`: CSS/React controls, accessible overlays, and canvas integration.
- Create `src/components/quatro/QuatroWinnerOverlay.tsx`: winner name, fireworks, and two post-win actions.
- Create `tests/quatro.tiles.behavior.ts`.
- Create `tests/quatro.rules.behavior.ts`.
- Create `tests/quatro.ai.behavior.ts`.
- Create `tests/quatro.i18n.behavior.ts`.
- Create `tests/quatro.render.behavior.ts`.
- Create `tests/quatro.network.behavior.ts`.
- Modify `src/game/types.ts`: reserve the `quatro` game variant and new sound cues.
- Modify `src/game/sound.ts`: UNO Quatro sound profiles.
- Modify `src/App.tsx`: unlock mapping, setup, state coordination, AI, table, winner, and rules.
- Modify `src/App.css`: responsive Quatro shell, controls, privacy screen, and fireworks.
- Modify `src/network/localWifi.ts`: Quatro snapshots and player actions.
- Modify `server/local-wifi-server.mjs`: allowlisted game ID and exactly two WiFi seats.
- Modify `tests/wifiGameAllowlist.behavior.mjs`, `tests/mobileTabletQa.behavior.mjs`, and `tests/desktopLayoutQa.behavior.mjs`.

### Task 1: Define the domain and exact tile bag

**Files:**
- Create: `src/game/quatro/types.ts`
- Create: `src/game/quatro/tiles.ts`
- Create: `tests/quatro.tiles.behavior.ts`
- Modify: `src/game/types.ts`

**Interfaces:**
- Produces: `QuatroTile`, `QuatroState`, `QuatroAction`, `QuatroAnimationEvent`, `QuatroRandom`, and `buildQuatroBag()`.
- Consumes: existing `AiDifficulty`, `AnimationSpeed`, `AvatarId`, and `GameMode`.

- [ ] **Step 1: Write the failing 44-tile tests**

In `tests/quatro.tiles.behavior.ts`, assert:

```ts
const bag = buildQuatroBag()
assert.equal(bag.length, 44)
assert.equal(new Set(bag.map((tile) => tile.id)).size, 44)
assert.deepEqual(
  Object.fromEntries(['red', 'green', 'yellow', 'blue'].map((color) => [
    color,
    bag.filter((tile) => tile.color === color).length,
  ])),
  { red: 11, green: 11, yellow: 11, blue: 11 },
)
assert.equal(bag.every((tile) => tile.value >= 0 && tile.value <= 5), true)
assert.equal(bag.filter((tile) => tile.action === 'minus2').length, 8)
assert.equal(bag.filter((tile) => tile.action === 'swap').length, 12)
assert.equal(bag.filter((tile) => tile.action === 'push').length, 8)
assert.equal(bag.filter((tile) => tile.action === null).length, 16)
```

Also assert the colorblind marks:

```ts
assert.deepEqual(QUATRO_COLOR_MARKS, {
  red: 'triangle',
  green: 'circle',
  yellow: 'star',
  blue: 'diamond',
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
npx --yes tsx tests/quatro.tiles.behavior.ts
```

Expected: FAIL because the Quatro domain does not exist.

- [ ] **Step 3: Add focused domain types**

Define:

```ts
export type QuatroColor = 'red' | 'green' | 'yellow' | 'blue'
export type QuatroActionKind = 'swap' | 'push' | 'minus2'
export type QuatroPhase =
  | 'playing'
  | 'selectSwapFirst'
  | 'selectSwapSecond'
  | 'chooseEmptyPush'
  | 'gameOver'

export interface QuatroTile {
  id: string
  color: QuatroColor
  value: 0 | 1 | 2 | 3 | 4 | 5
  action: QuatroActionKind | null
}

export interface QuatroPlayer {
  id: string
  name: string
  type: 'human' | 'ai'
  aiDifficulty?: AiDifficulty
  avatarId: AvatarId
  hand: QuatroTile[]
  handCount: number
}

export interface QuatroRandom {
  int(maxExclusive: number): number
}
```

Represent the board as `columns: QuatroTile[][]`, each ordered bottom to top.
Define `QuatroState` with exactly two players, bag, seven columns,
`activePlayerIndex`, phase, selected tile/column state, pending Swap/Push
fields, `minus2RefillPlayerId`, `winnerId`, transition sequence, latest
animation events, mode, AI settings, and log.

- [ ] **Step 4: Encode the exact unique tiles**

Use one tuple for every physical tile:

```ts
const specs = [
  ['blue', 0, null], ['blue', 1, null], ['blue', 1, 'minus2'],
  ['blue', 2, 'swap'], ['blue', 2, 'push'], ['blue', 3, null],
  ['blue', 3, 'swap'], ['blue', 4, 'push'], ['blue', 4, 'swap'],
  ['blue', 5, null], ['blue', 5, 'minus2'],
  ['green', 0, 'minus2'], ['green', 1, null], ['green', 1, 'swap'],
  ['green', 2, null], ['green', 2, 'swap'], ['green', 3, null],
  ['green', 3, 'push'], ['green', 4, null], ['green', 4, 'minus2'],
  ['green', 5, 'swap'], ['green', 5, 'push'],
  ['red', 0, null], ['red', 1, 'push'], ['red', 1, 'swap'],
  ['red', 2, null], ['red', 2, 'minus2'], ['red', 3, 'push'],
  ['red', 3, 'swap'], ['red', 4, null], ['red', 4, 'swap'],
  ['red', 5, null], ['red', 5, 'minus2'],
  ['yellow', 0, 'swap'], ['yellow', 1, null], ['yellow', 1, 'minus2'],
  ['yellow', 2, null], ['yellow', 2, 'push'], ['yellow', 3, null],
  ['yellow', 3, 'minus2'], ['yellow', 4, 'push'], ['yellow', 4, 'swap'],
  ['yellow', 5, null], ['yellow', 5, 'swap'],
] as const
```

Create stable IDs from color, value, action, and occurrence index. Export a
Fisher-Yates `shuffleQuatroTiles(tiles, random)` that does not mutate its
input.

- [ ] **Step 5: Reserve integration identifiers**

Add `'quatro'` to `GameVariant`. Add the following `SoundCue` members:

```ts
'quatroBagShake'
| 'quatroDeal'
| 'quatroDrop'
| 'quatroSwap'
| 'quatroPush'
| 'quatroMinus2'
| 'quatroReturn'
| 'quatroDraw'
| 'quatroWin'
```

- [ ] **Step 6: Run the tile tests**

Run:

```powershell
npx --yes tsx tests/quatro.tiles.behavior.ts
```

Expected: PASS for exact count, uniqueness, distribution, values, actions,
marks, and deterministic shuffle.

- [ ] **Step 7: Commit**

```powershell
git add src/game/quatro/types.ts src/game/quatro/tiles.ts src/game/types.ts tests/quatro.tiles.behavior.ts
git commit -m "feat: define UNO Quatro tile domain"
```

### Task 2: Implement setup, placement legality, and winner detection

**Files:**
- Create: `src/game/quatro/rules.ts`
- Create: `tests/quatro.rules.behavior.ts`

**Interfaces:**
- Produces: `createQuatroGame`, `quatroLegalColumns`, `quatroPlayableTileIds`, `quatroPlaceTile`, and `findQuatroWinningLine`.
- Consumes: `buildQuatroBag`, `QuatroRandom`, and the domain types.

- [ ] **Step 1: Write failing setup tests**

Assert every mode creates exactly two players, six total dealt tiles, 38 bag
tiles, seven empty columns, no score fields, and one ordered setup event:

```ts
assert.equal(state.players.length, 2)
assert.deepEqual(state.players.map((player) => player.hand.length), [3, 3])
assert.equal(state.bag.length, 38)
assert.deepEqual(state.columns.map((column) => column.length), [0, 0, 0, 0, 0, 0, 0])
assert.deepEqual(state.events.map((event) => event.kind), ['bagShake', 'deal'])
```

Assert mode ownership:

- single: human, AI;
- hot seat: human, human;
- WiFi host state: human, human;
- spectacular: AI, AI.

- [ ] **Step 2: Write failing legality tests**

Cover:

- any tile can enter a tray whose landing slot touches no tile;
- matching at least one adjacent color is legal;
- matching at least one adjacent number is legal;
- matching none of bottom/side/diagonal neighbors is illegal;
- matching one neighbor remains legal when other neighbors mismatch;
- non-Push is illegal in a six-tile column;
- Push remains legal in a six-tile column;
- legal tray output is stable and contains no duplicates.

- [ ] **Step 3: Write failing winning-line tests**

Create board fixtures for:

- four equal colors horizontal, vertical, rising diagonal, falling diagonal;
- four equal numbers in all four directions;
- mixed values of one color;
- mixed colors of one number;
- three matching tiles;
- a bent group of four;
- five in a row, returning the deterministic first four-cell segment.

Assert that board tiles have no owner field and that the active player becomes
the winner after creating a line from previously placed neutral tiles.

- [ ] **Step 4: Run the rules test and verify it fails**

Run:

```powershell
npx --yes tsx tests/quatro.rules.behavior.ts
```

Expected: FAIL because the rules module is absent.

- [ ] **Step 5: Implement game creation and deterministic drawing**

Define:

```ts
export function createQuatroGame(input: {
  mode: GameMode
  aiDifficulty: AiDifficulty
  avatarId: AvatarId
  random: QuatroRandom
}): QuatroState
```

Shuffle once, draw in alternating seat order until both hands contain three,
set `handCount` to the actual hand length, and create `bagShake` plus one
`deal` event containing the six ordered `{ playerId, tileId }` movements.

- [ ] **Step 6: Implement landing-cell adjacency**

For a normal candidate, calculate row as the current column length. For a
Push candidate, first simulate the mandatory downward shift and calculate
the new tile's final row; in a full column that is row `5`. Inspect the eight
surrounding coordinates in that resulting board. Ignore out-of-bounds and
empty cells. Return legal when no occupied neighbor exists, or when any
occupied neighbor shares color or value.

Export:

```ts
export function quatroLegalColumns(state: QuatroState, tileId: string): number[]
export function quatroPlayableTileIds(state: QuatroState, playerId: string): string[]
```

- [ ] **Step 7: Implement four-direction scanning**

Scan directions `[1, 0]`, `[0, 1]`, `[1, 1]`, and `[1, -1]`. For every
occupied start cell, read four consecutive cells and accept when every tile
shares the start tile's color or every tile shares its value. Return:

```ts
export interface QuatroWinningLine {
  match: 'color' | 'number'
  color?: QuatroColor
  value?: QuatroTile['value']
  cells: Array<{ column: number; row: number }>
}
```

- [ ] **Step 8: Implement normal placement**

`quatroPlaceTile(state, playerId, tileId, columnIndex, random)` validates the
active player, phase, hand membership, and legal column. Remove the tile from
the hand, append it to the column, increment the transition sequence, and add
a `drop` event. Normal tiles complete the turn; action tiles enter the
appropriate pending phase without advancing early.

- [ ] **Step 9: Run the rules tests**

Run:

```powershell
npx --yes tsx tests/quatro.rules.behavior.ts
```

Expected: setup, legality, placement, immutability, and win scanning tests
pass.

- [ ] **Step 10: Commit**

```powershell
git add src/game/quatro/rules.ts tests/quatro.rules.behavior.ts
git commit -m "feat: add UNO Quatro placement rules"
```

### Task 3: Implement Swap, Push, Minus 2, exchange, and turn completion

**Files:**
- Modify: `src/game/quatro/rules.ts`
- Modify: `tests/quatro.rules.behavior.ts`

**Interfaces:**
- Produces: `quatroSelectSwapColumn`, `quatroResolveEmptyPush`, `quatroExchangeTile`, and `quatroCompleteTurn`.
- Consumes: validated placement state and injected host-authoritative randomness.

- [ ] **Step 1: Add failing Swap tests**

Assert:

- playing Swap enters `selectSwapFirst`;
- selecting one tray enters `selectSwapSecond`;
- selecting the same tray twice is rejected;
- selecting a second tray swaps entire bottom-to-top arrays;
- the event records both tray indexes;
- turn completion and winner detection wait until after the swap;
- a line created by the swapped geometry awards the active player the win.

- [ ] **Step 2: Add failing Push tests**

Assert:

- Push into a non-empty tray shifts all tiles down and returns the previous
  bottom tile to the bag;
- Push into a full tray remains legal and leaves six tiles;
- the ejected tile appears once in the bag;
- Push into an empty tray enters `chooseEmptyPush`;
- choosing Keep leaves one tile in the tray;
- choosing Push returns the new tile to the bag and leaves the tray empty;
- winner detection reads the post-push board.

- [ ] **Step 3: Add failing Minus 2 tests**

With a deterministic `random.int`, assert:

- exactly two distinct opponent tiles return to the bag;
- the opponent starts the next turn with one tile;
- no two replacement tiles are dealt before that turn;
- after the penalized opponent plays or exchanges, refill restores the hand
  to three and clears `minus2RefillPlayerId`;
- events order as `drop`, `minus2Return`, then active-player refill/turn
  transition;
- hidden bag order is never used to choose the two removed hand indexes.

- [ ] **Step 4: Add failing exchange tests**

Assert exchange is rejected when any hand tile is playable. When no tile is
playable:

- the selected tile returns to the bag;
- one random replacement enters the hand;
- events are `returnToBag` then `draw`;
- a playable replacement keeps the same player active and restricts
  placement to that replacement tile;
- an unplayable replacement ends the turn;
- the hand count remains correct when the bag contains only the returned
  tile.

- [ ] **Step 5: Run the action tests and verify they fail**

Run:

```powershell
npx --yes tsx tests/quatro.rules.behavior.ts
```

Expected: FAIL on unresolved action and exchange behavior.

- [ ] **Step 6: Implement one action-resolution pipeline**

Use a private `finishResolvedMove(state, random)` that:

1. checks `findQuatroWinningLine` on the final board;
2. if found, sets `winnerId`, `winningLine`, and `phase: 'gameOver'`;
3. otherwise refills the player whose completed turn requires refill;
4. advances `activePlayerIndex`;
5. clears pending selection state and emits ordered refill/turn events.

Never call it between initial placement and a mandatory action.

- [ ] **Step 7: Implement Swap and Push choices**

`quatroSelectSwapColumn` stores the first index, then swaps immutable column
copies on the second. `quatroResolveEmptyPush(state, playerId, pushOut,
random)` either retains the sole tile or removes it to the bag. Both paths
call `finishResolvedMove`.

- [ ] **Step 8: Implement host-authoritative Minus 2**

Choose two indexes without replacement from the opponent hand using only
`random.int(currentHandLength)`. Remove those tiles, add them to the bag,
shuffle through the same injected random source, set
`minus2RefillPlayerId` to the opponent, and complete the attacker's turn.
Suppress the ordinary start-of-turn refill for that marked opponent.

- [ ] **Step 9: Implement no-play exchange**

Reject unless `quatroPlayableTileIds` is empty. Return the chosen tile before
drawing, so the bag is never empty for the exchange. Track
`exchangeDrawnTileId`; if that tile is playable, allow only it to be placed.
Otherwise complete the turn immediately.

- [ ] **Step 10: Run the complete rule tests**

Run:

```powershell
npx --yes tsx tests/quatro.rules.behavior.ts
```

Expected: PASS for normal play, every action, exchange, refill timing, final
win timing, and immutable invalid-action rejection.

- [ ] **Step 11: Commit**

```powershell
git add src/game/quatro/rules.ts tests/quatro.rules.behavior.ts
git commit -m "feat: implement UNO Quatro actions"
```

### Task 4: Add AI and live move recommendations

**Files:**
- Create: `src/game/quatro/ai.ts`
- Create: `src/game/quatro/hints.ts`
- Create: `tests/quatro.ai.behavior.ts`

**Interfaces:**
- Produces: `chooseQuatroAiAction(state, random)` and `getQuatroHint(state, viewerPlayerId)`.
- Consumes: only public board state, the AI player's own hand, and pure rules.

- [ ] **Step 1: Write failing AI tests**

Assert:

- Easy returns a member of `listQuatroLegalActions` using injected randomness.
- Medium takes an immediate win.
- Medium blocks an opponent's one-move color or number win when possible.
- Medium selects mandatory Swap columns and the empty-Push choice.
- Hard prefers a fork that creates two next-turn winning placements.
- Hard's two-ply evaluation does not inspect or reorder the bag.
- Identical state and deterministic random input produce identical actions.
- An AI with no playable tile selects a legal exchange.

- [ ] **Step 2: Write failing hint tests**

Assert hints:

- return movable tile IDs and legal tray indexes;
- identify mandatory first/second Swap selection;
- explain Keep/Push for an empty tray;
- recommend exchange only when no tile is playable;
- never include the opponent's tile values, colors, IDs, or future bag order;
- return no move after `gameOver`.

- [ ] **Step 3: Run the AI test and verify it fails**

Run:

```powershell
npx --yes tsx tests/quatro.ai.behavior.ts
```

Expected: FAIL because AI and hints do not exist.

- [ ] **Step 4: Implement complete legal-action enumeration**

Define:

```ts
export type QuatroAiAction =
  | { type: 'place'; tileId: string; column: number }
  | { type: 'selectSwap'; column: number }
  | { type: 'resolveEmptyPush'; pushOut: boolean }
  | { type: 'exchange'; tileId: string }
```

Enumerate only actions accepted by the rules engine. Mandatory pending phases
return only their valid continuations.

- [ ] **Step 5: Implement evaluation tiers**

- Easy: random legal action.
- Medium: simulate complete move outcomes; score immediate win `100000`,
  opponent immediate threats blocked `10000`, own open threes `1000`, open
  twos `100`, central columns `10`, and Minus 2 pressure `40`.
- Hard: apply every own complete move, then every opponent complete reply,
  using the worst opponent score. Add `2500` for two independent next-turn
  wins. Break ties by tile ID, column, then action-choice indexes.

For unknown bag draws, evaluate only current board and hands; use a neutral
draw score of zero.

- [ ] **Step 6: Implement hint derivation**

Return:

```ts
export interface QuatroHint {
  kind: 'place' | 'swapFirst' | 'swapSecond' | 'emptyPush' | 'exchange' | 'wait' | 'won'
  tileIds: string[]
  columns: number[]
  reasonKey: string
}
```

Use the Medium ranking for a human recommendation while still returning all
legal highlight IDs.

- [ ] **Step 7: Run the AI and hint tests**

Run:

```powershell
npx --yes tsx tests/quatro.ai.behavior.ts
```

Expected: PASS for legal actions, tactical priorities, deterministic hard AI,
exchange behavior, and hidden-information safety.

- [ ] **Step 8: Commit**

```powershell
git add src/game/quatro/ai.ts src/game/quatro/hints.ts tests/quatro.ai.behavior.ts
git commit -m "feat: add UNO Quatro AI and hints"
```

### Task 5: Build responsive canvas layout and interaction

**Files:**
- Create: `src/components/quatro/quatroLayout.ts`
- Create: `src/components/quatro/QuatroCanvas.tsx`
- Create: `tests/quatro.render.behavior.ts`

**Interfaces:**
- Produces: `createQuatroLayout(width, height)`, `hitTestQuatroLayout`, and `<QuatroCanvas />`.
- Consumes: `QuatroState`, localized labels, selection/highlight state, and callbacks.

- [ ] **Step 1: Write failing pure layout tests**

For `320×420`, `768×720`, `1024×600`, and `1440×800`, assert:

- all seven tray rectangles fit inside the canvas;
- every tray has six equal slot centers;
- no slot overlaps the bag or either hand region;
- minimum touch target is 44 CSS pixels where viewport size permits;
- device-pixel ratio does not change CSS hit geometry;
- hit testing maps every slot center to its tray index;
- points outside the board return `null`.

- [ ] **Step 2: Write failing renderer contract checks**

Require:

- one `<canvas>` with a `ResizeObserver`;
- backing-buffer size uses `devicePixelRatio` capped at `2`;
- pointer coordinates convert through `getBoundingClientRect`;
- the component exposes callbacks for hand tile, tray, and pending choice;
- draw code includes all four colorblind marks;
- `requestAnimationFrame` is cancelled and the observer disconnected on
  unmount.

- [ ] **Step 3: Run the render test and verify it fails**

Run:

```powershell
npx --yes tsx tests/quatro.render.behavior.ts
```

Expected: FAIL because no layout or canvas exists.

- [ ] **Step 4: Implement pure geometry**

Return:

```ts
export interface QuatroLayout {
  width: number
  height: number
  board: { x: number; y: number; width: number; height: number }
  trays: Array<{ x: number; y: number; width: number; height: number }>
  slots: Array<Array<{ x: number; y: number; radius: number }>>
  bag: { x: number; y: number; width: number; height: number }
  hands: Record<'near' | 'far', { x: number; y: number; width: number; height: number }>
}
```

Use a wide layout when `width / height >= 1.15` and a stacked layout
otherwise. Keep layout in CSS pixels.

- [ ] **Step 5: Implement distinctive Canvas 2D drawing**

Draw:

- a dimensional platinum-and-black board frame;
- seven separated removable trays;
- six recessed slots per tray;
- rounded plastic tiles with UNO-style colored ovals;
- large `0`–`5` values;
- triangle, circle, star, or diamond colorblind mark;
- clear Swap, Push, and `−2` action glyphs;
- a cloth bag with remaining-tile count;
- near/far hands with hidden backs when the viewer cannot see a hand;
- gold movable-tile rings and cyan legal-tray glows;
- the winning four-cell line.

Do not import or call standard card drawing functions from `GameCanvas.tsx`.

- [ ] **Step 6: Add pointer and accessible action input**

Pointer selection uses canvas hit areas. In `QuatroTable.tsx` from Task 8,
mirror each currently legal tray as a visually hidden but keyboard-focusable
button labeled with localized tray number and reason. Mirror hand tiles as
real DOM buttons in the control dock so keyboard users never depend on canvas
hit testing.

- [ ] **Step 7: Run the render tests**

Run:

```powershell
npx --yes tsx tests/quatro.render.behavior.ts
```

Expected: PASS for geometry, hit testing, responsive bounds, colorblind
symbols, cleanup, and interaction contracts.

- [ ] **Step 8: Commit**

```powershell
git add src/components/quatro/quatroLayout.ts src/components/quatro/QuatroCanvas.tsx tests/quatro.render.behavior.ts
git commit -m "feat: render UNO Quatro canvas"
```

### Task 6: Add animation timelines and sound cues

**Files:**
- Create: `src/components/quatro/quatroAnimations.ts`
- Modify: `src/components/quatro/QuatroCanvas.tsx`
- Modify: `src/game/sound.ts`
- Modify: `src/game/types.ts`
- Modify: `tests/quatro.render.behavior.ts`

**Interfaces:**
- Produces: `buildQuatroAnimationTimeline(events, settings)` and `soundCueForQuatroEvent(event)`.
- Consumes: ordered rule events and existing animation/audio settings.

- [ ] **Step 1: Write failing timeline tests**

Assert full-motion timelines contain:

- bag shake: alternating rotation/translation for at least 700 ms;
- deal: six staggered bag-to-hand movements;
- drop: top-of-tray to final slot with settle bounce;
- Swap: lift, cross, and settle for two complete tray stacks;
- Push: shift all tray tiles down, eject bottom tile, move it to bag;
- Minus 2: two staggered opponent-hand-to-bag movements;
- exchange: return completes before replacement draw begins;
- winner: winning-line pulse before fireworks.

Assert reduced motion collapses each to at most 120 ms, removes shaking,
bounce, crossing arcs, and particles, but still calls completion exactly once.

- [ ] **Step 2: Write failing sound-map tests**

Assert every event maps to its dedicated `SoundCue` and every new cue exists
in both `soundEventMap` and `soundProfiles`.

- [ ] **Step 3: Run the render test and verify it fails**

Run:

```powershell
npx --yes tsx tests/quatro.render.behavior.ts
```

Expected: FAIL because timelines and sound profiles are absent.

- [ ] **Step 4: Implement deterministic timelines**

Define animation tracks with absolute start/end milliseconds and typed payloads:

```ts
export interface QuatroAnimationTrack {
  kind: QuatroAnimationEvent['kind']
  startsAt: number
  endsAt: number
  event: QuatroAnimationEvent
}

export interface QuatroAnimationTimeline {
  durationMs: number
  tracks: QuatroAnimationTrack[]
}
```

Use speed multipliers `fast: 0.7`, `normal: 1`, `slow: 1.35`. The canvas
interpolates from the previous visual snapshot to final state and notifies
`onBlockingAnimationChange` until the final track ends.

- [ ] **Step 5: Add synthesized sound profiles**

Create distinct profiles:

- bag shake: six short low wooden rattles;
- deal: paired mid clicks;
- drop: descending plastic click;
- Swap: two opposing glides;
- Push: low thunk plus ejection click;
- Minus 2: two descending penalty notes;
- return: short inward whoosh;
- draw: rising outward click;
- win: bright five-note cadence.

Continue routing through the existing compressor and volume settings.

- [ ] **Step 6: Synchronize sound with timeline events**

Play each cue once when its track begins, keyed by
`transitionSequence:eventIndex`. Do not replay sounds on React re-render,
resize, or WiFi reconnect.

- [ ] **Step 7: Run animation and sound tests**

Run:

```powershell
npx --yes tsx tests/quatro.render.behavior.ts
node tests/coreSoundEffects.behavior.mjs
node tests/audioSettings.behavior.mjs
```

Expected: all pass.

- [ ] **Step 8: Commit**

```powershell
git add src/components/quatro/quatroAnimations.ts src/components/quatro/QuatroCanvas.tsx src/game/sound.ts src/game/types.ts tests/quatro.render.behavior.ts
git commit -m "feat: animate and sound UNO Quatro actions"
```

### Task 7: Add complete three-language help and strategy

**Files:**
- Create: `src/game/quatro/translation.ts`
- Create: `tests/quatro.i18n.behavior.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `quatroText`, `quatroRuleSections`, `quatroActionReference`, `quatroStrategySections`, and `quatroHintText`.
- Consumes: `Language`, `QuatroState`, and `QuatroHint`.

- [ ] **Step 1: Write failing localization coverage**

Define a typed `QuatroTextKey` list and assert every key has a non-empty,
distinct entry in `en`, `zh`, and `de`. Required groups:

- setup/table labels;
- bag, hand, tray, tile, turn, and player labels;
- place/exchange/keep/push/swap selection controls;
- legal/illegal reasons;
- generic waiting and WiFi text;
- rules section headings and items;
- action reference for Swap, Push, and Minus 2;
- at least six strategy items;
- winner title, setup action, and new-game action.

Reject untranslated English fallback in Chinese and German for all full
sentences.

- [ ] **Step 2: Run the i18n test and verify it fails**

Run:

```powershell
npx --yes tsx tests/quatro.i18n.behavior.ts
```

Expected: FAIL because translations do not exist.

- [ ] **Step 3: Implement typed translation lookup**

Use:

```ts
const quatroTranslations: Record<Language, Record<QuatroTextKey, string>>

export function quatroText(language: Language, key: QuatroTextKey): string {
  return quatroTranslations[language][key]
}
```

Keep interpolated player names and tray numbers out of raw translation
strings by providing focused formatter functions.

- [ ] **Step 4: Implement rules and action reference**

Each language must explain:

1. four-by-color or four-by-number objective;
2. 44-tile bag, seven trays, and three-tile hands;
3. adjacency legality including diagonals;
4. neutral ownership of placed tiles;
5. no-play exchange and immediate replacement play;
6. mandatory Swap;
7. Push including full- and empty-tray exceptions;
8. official one-tile next turn for Minus 2;
9. post-action win timing;
10. exactly two players and no score.

- [ ] **Step 5: Implement hints and strategy**

Map every `QuatroHint.reasonKey` to localized text. Include strategy for
double threats, central connectivity, defensive blocking, Swap geometry,
Push geometry, Minus 2 timing, and avoiding opponent forced wins.

- [ ] **Step 6: Route rules through the existing modal**

Add `quatroRuleSections(language)` to `rulesForGame` when
`config.game === 'quatro'`. Render action reference and strategy as separate
sections rather than merging several peer headings into one body.

- [ ] **Step 7: Run localization tests**

Run:

```powershell
npx --yes tsx tests/quatro.i18n.behavior.ts
```

Expected: PASS with complete `en`, `zh`, and `de` coverage.

- [ ] **Step 8: Commit**

```powershell
git add src/game/quatro/translation.ts tests/quatro.i18n.behavior.ts src/App.tsx
git commit -m "feat: localize UNO Quatro help"
```

### Task 8: Integrate setup, modes, gameplay, privacy, and winner flow

**Files:**
- Create: `src/components/quatro/QuatroTable.tsx`
- Create: `src/components/quatro/QuatroWinnerOverlay.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Create: `tests/quatro.integration.behavior.mjs`

**Interfaces:**
- Produces: dedicated `quatroState`, table action dispatch, hot-seat privacy, AI effect, and winner actions.
- Consumes: completed rules, AI, hints, canvas, translations, animations, and sounds.

- [ ] **Step 1: Write failing integration checks**

Assert:

- successful game ID `quatro` routes to `GameVariant 'quatro'`;
- setup shows all four modes but fixes player count at two;
- starting-hand and target-score controls are absent;
- start/new game calls `createQuatroGame`;
- standard `GameCanvas` and score modal are not rendered for Quatro;
- animation lock disables all Quatro inputs;
- hot seat hides both hands until the active player accepts the handoff;
- winner overlay contains the localized name, fireworks, setup, and new game;
- no Quatro UI contains score, points, next round, or session target.

- [ ] **Step 2: Run the integration test and verify it fails**

Run:

```powershell
node tests/quatro.integration.behavior.mjs
```

Expected: FAIL because App has no Quatro state path.

- [ ] **Step 3: Add dedicated App state and setup**

Add:

```ts
const [quatroState, setQuatroState] = useState<QuatroState | null>(null)
const quatroStateRef = useRef<QuatroState | null>(null)
```

When `selectUnlockedGame('quatro')` succeeds, set `config.game = 'quatro'`,
`playerCount = 2`, `startingHandSize = 3`, and navigate to setup. Hide
player-count, starting-hand, add-on, and score controls. Preserve mode, AI,
avatar, animation, theme, and audio settings.

- [ ] **Step 4: Implement one typed action dispatcher**

Define App-local:

```ts
type QuatroUiAction =
  | { type: 'place'; tileId: string; column: number }
  | { type: 'swapColumn'; column: number }
  | { type: 'emptyPush'; pushOut: boolean }
  | { type: 'exchange'; tileId: string }
```

Apply each through the pure rules functions. Update the state/ref together,
publish WiFi state when host, start the event animation queue, and play
event-aligned sounds.

- [ ] **Step 5: Add AI scheduling**

When the active player is AI, no choice is pending, no blocking animation is
active, and there is no winner, call `chooseQuatroAiAction` after `650 ms` or
the configured spectacular delay. Apply one AI action per effect pass so
Swap selections and empty-Push choices remain visible.

- [ ] **Step 6: Build the table and privacy controls**

`QuatroTable` renders the shared toolbar, Canvas, visible/hidden hands,
localized hint, DOM-equivalent legal actions, bag count, current turn, Rules
button, language, theme, sound, and volume. Reuse the current hot-seat
handoff pattern but reveal only the active player's Quatro hand.

- [ ] **Step 7: Build the winner overlay**

Render the winner's localized name and a non-interactive fireworks layer.
With motion enabled, emit at least 40 CSS particles in five staggered bursts;
with reduced motion, render a static star field. Buttons:

```tsx
<button onClick={openQuatroSetup}>{quatroText(language, 'winner.setup')}</button>
<button onClick={startNewQuatroGame}>{quatroText(language, 'winner.newGame')}</button>
```

Neither action enters the generic score/round flow.

- [ ] **Step 8: Add responsive CSS**

Create `.quatro-table`, `.quatro-canvas-wrap`, `.quatro-controls`,
`.quatro-hand`, `.quatro-legal`, `.quatro-privacy-overlay`,
`.quatro-winner-overlay`, and `.quatro-firework` styles. Verify no horizontal
page scroll at 320 px width and no canvas clipping at 1280×720.

- [ ] **Step 9: Run integration tests**

Run:

```powershell
node tests/quatro.integration.behavior.mjs
npx --yes tsx tests/quatro.rules.behavior.ts
npx --yes tsx tests/quatro.ai.behavior.ts
```

Expected: all pass.

- [ ] **Step 10: Commit**

```powershell
git add src/components/quatro/QuatroTable.tsx src/components/quatro/QuatroWinnerOverlay.tsx src/App.tsx src/App.css tests/quatro.integration.behavior.mjs
git commit -m "feat: integrate two-player UNO Quatro"
```

### Task 9: Add private two-seat WiFi play

**Files:**
- Create: `src/game/quatro/privacy.ts`
- Create: `tests/quatro.network.behavior.ts`
- Modify: `src/network/localWifi.ts`
- Modify: `server/local-wifi-server.mjs`
- Modify: `src/App.tsx`
- Modify: `tests/wifiGameAllowlist.behavior.mjs`

**Interfaces:**
- Produces: `createPrivateQuatroState(state, viewerPlayerId)`.
- Produces: `quatroState?: QuatroState` snapshots and four Quatro action messages.
- Consumes: host-authoritative random transitions.

- [ ] **Step 1: Write failing privacy tests**

For each viewer assert:

- their own `hand` contains complete tiles;
- the opponent `hand` is empty while `handCount` is accurate;
- bag order is removed and only `bagCount` is visible;
- public board, phase, selections, winner, and transition sequence remain;
- hidden Minus 2 returns identify the number of tiles but not opponent tile
  faces to the attacking remote client;
- JSON serialization contains no hidden tile IDs, colors, or values.

- [ ] **Step 2: Write failing protocol tests**

Require:

```ts
| { type: 'quatroPlace'; tileId: string; column: number }
| { type: 'quatroSwapColumn'; column: number }
| { type: 'quatroEmptyPush'; pushOut: boolean }
| { type: 'quatroExchange'; tileId: string }
```

Assert `cleanGame('quatro') === 'quatro'` and
`cleanMaxPlayers('quatro', anyValue) === 2`.

- [ ] **Step 3: Run the network tests and verify they fail**

Run:

```powershell
npx --yes tsx tests/quatro.network.behavior.ts
node tests/wifiGameAllowlist.behavior.mjs
```

Expected: FAIL because the protocol does not know Quatro.

- [ ] **Step 4: Implement private snapshots**

Return a deep clone. For the non-viewer:

```ts
{
  ...player,
  hand: [],
  handCount: player.hand.length,
}
```

Replace `bag` with `[]` and retain `bagCount`. Redact private event payloads
according to the viewer while retaining animation kind, count, source seat,
destination, and sequence.

- [ ] **Step 5: Extend the WiFi protocol**

Add `quatroState` to `WifiGameSnapshot` and the four actions to
`WifiPlayerAction`. The host validates active player, phase, tile ownership,
column, and choice through the rules engine; invalid actions return the
unchanged state.

- [ ] **Step 6: Publish one private snapshot per seat**

Mirror `publishMahjongWifiSnapshots` with
`publishQuatroWifiSnapshots`. Remote clients render their snapshot but never
run randomness, AI, Minus 2 selection, exchange draw, or bag shuffle.

- [ ] **Step 7: Prevent stale animation replay**

When a client receives its first snapshot or reconnects, initialize
`lastAnimatedQuatroSequence` to the snapshot sequence. For later snapshots,
animate only a strictly greater sequence.

- [ ] **Step 8: Run network tests**

Run:

```powershell
npx --yes tsx tests/quatro.network.behavior.ts
node tests/wifiGameAllowlist.behavior.mjs
```

Expected: PASS for two-seat enforcement, action validation, hidden hands,
hidden bag, and reconnect sequencing.

- [ ] **Step 9: Commit**

```powershell
git add src/game/quatro/privacy.ts tests/quatro.network.behavior.ts src/network/localWifi.ts server/local-wifi-server.mjs src/App.tsx tests/wifiGameAllowlist.behavior.mjs
git commit -m "feat: add private UNO Quatro WiFi play"
```

### Task 10: Complete automated and browser verification

**Files:**
- Modify: `tests/mobileTabletQa.behavior.mjs`
- Modify: `tests/desktopLayoutQa.behavior.mjs`
- Verify: all UNO Quatro files and affected shared files.

**Interfaces:**
- Consumes: the complete feature.
- Produces: release-readiness evidence.

- [ ] **Step 1: Extend responsive QA contracts**

Require the Quatro CSS and canvas to support:

- `320×568` phone portrait;
- `768×1024` tablet portrait;
- `1024×768` tablet landscape;
- `1280×720` desktop;
- `1440×900` desktop.

Reject fixed pixel board widths wider than the viewport, hidden overflow that
clips controls, and touch targets below 44 px when space permits.

- [ ] **Step 2: Run every targeted Quatro test**

Run:

```powershell
npx --yes tsx tests/quatro.tiles.behavior.ts
npx --yes tsx tests/quatro.rules.behavior.ts
npx --yes tsx tests/quatro.ai.behavior.ts
npx --yes tsx tests/quatro.i18n.behavior.ts
npx --yes tsx tests/quatro.render.behavior.ts
npx --yes tsx tests/quatro.network.behavior.ts
node tests/quatro.integration.behavior.mjs
node tests/moreGamesAccess.behavior.mjs
```

Expected: every command exits `0`.

- [ ] **Step 3: Run the complete behavior suite**

Run every `tests/*.behavior.mjs` with Node and every
`tests/*.behavior.ts` with `npx --yes tsx`, stopping on the first failure.

- [ ] **Step 4: Run static and production checks**

Run:

```powershell
npm run lint
npm run build
```

Expected: both exit `0`.

- [ ] **Step 5: Browser-test the access and setup flow**

At phone, tablet, and desktop sizes:

1. unlock with a test-only configured verifier;
2. confirm no game name appears before success;
3. enter UNO Quatro setup;
4. verify every mode fixes player count at two;
5. start each non-WiFi mode and confirm bag shake plus six-tile deal;
6. confirm the canvas and controls remain fully visible.

- [ ] **Step 6: Browser-test every rule and animation**

Use deterministic development fixtures to demonstrate:

- color and number adjacency;
- isolated legal placement;
- blocked illegal placement;
- horizontal, vertical, and both diagonal wins;
- Swap-created win;
- Push with non-empty, full, and empty trays;
- Minus 2 one-tile next turn and delayed refill;
- unplayable exchange, playable replacement, and unplayable replacement;
- reduced-motion equivalents;
- all dedicated sound cues with sound enabled and silence when disabled.

- [ ] **Step 7: Browser-test modes and privacy**

- Single: human vs AI completes a game.
- Hot seat: inactive hands never appear before handoff.
- WiFi: two devices see only their own tiles and stay synchronized through
  all action animations.
- Spectacular: two AIs complete a game without user input.

- [ ] **Step 8: Verify winner flow**

Confirm the final action resolves before win detection, winner name is
correct, fireworks render, no score appears, Setup returns to UNO Quatro
setup, and New Game creates a fresh shuffled state with the same settings.

- [ ] **Step 9: Review repository safety and diff**

Run:

```powershell
rg -n -i "password|secret|verifier" src public server scripts tests docs README.md
git diff --check
git status --short
git diff --stat
git diff
```

Expected: no real password or frontend verifier; only generic access-gate
terms, test-only fixtures, and intended feature changes. Preserve the user's
pre-existing `.gitignore` edit.
