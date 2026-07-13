# Mahjong Game 24 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Game 24, Traditional Chinese Mahjong, with a tested rules engine, Three.js playfield, React controls, AI difficulties, hints, Hot Seat, Local WiFi, Spectacular mode, and English/German/Chinese translations.

**Architecture:** Keep Mahjong rules in pure TypeScript modules under `src/game/mahjong/` and keep Three.js as a rendering adapter under `src/components/mahjong/`. React owns setup, controls, hints, language, mode selection, and WiFi integration. Local WiFi should transmit serializable Mahjong actions and sanitized public state, not renderer objects.

**Tech Stack:** React 19, Vite, TypeScript, Three.js, existing local WiFi Node server, existing test style with TypeScript behavior files compiled into `.tmp-tests`.

---

## Rule Assumption To Confirm

Default implementation target: 4-player Chinese Mahjong with 144 tiles: 3 suits 1-9 x4, winds x4, dragons x4, flowers/seasons x1; 13-card hand, draw to 14 on turn; discard after draw unless declaring win/kong; chow only from previous player's discard; pong/kong from any discard; win by 4 melds plus 1 pair, with seven pairs as an optional supported hand; flower tiles are immediately exposed and replaced from the wall; round can end by win or exhausted wall.

Before coding, confirm whether scoring should be:
- Minimal first release: winner detection + simple point summary.
- Full traditional scoring: fan/pattern-based scoring and payments.

Recommended first release: implement full legal play and win detection first, then add scoring detail in a later refinement slice.

---

## Planned File Structure

- Create `src/game/mahjong/types.ts`: tile, meld, action, rule, state, public-state types.
- Create `src/game/mahjong/tiles.ts`: tile catalog, wall builder, tile labels, sorting.
- Create `src/game/mahjong/win.ts`: hand decomposition, pair/meld detection, seven-pairs detection.
- Create `src/game/mahjong/rules.ts`: legal actions, draw/discard/claim/kong/win/flower replacement, turn advancement.
- Create `src/game/mahjong/ai.ts`: easy/medium/hard heuristics.
- Create `src/game/mahjong/hints.ts`: player-facing suggestions and rule explanations.
- Create `src/game/mahjong/publicState.ts`: WiFi/spectator-safe state projection.
- Create `src/components/mahjong/MahjongTable3D.tsx`: Three.js scene lifecycle and tile rendering.
- Create `src/components/mahjong/mahjongScene.ts`: Three.js renderer, camera, scene objects, resize/dispose.
- Create `src/components/mahjong/mahjongLayout.ts`: table positions for desktop/mobile, player seats, wall, discard river.
- Create `src/components/mahjong/mahjongTextures.ts`: canvas-generated tile-face textures for symbols.
- Modify `src/game/types.ts`: add `mahjong` variant and state field.
- Modify `src/game/classic.ts`: route Mahjong creation/actions only if the app keeps one shared game facade.
- Modify `src/App.tsx`: add Game 24 setup, action buttons, hints, rules, modes, WiFi actions.
- Modify `src/App.css`: Mahjong shell, controls, responsive safe areas, fallback states.
- Modify `src/i18n.ts`: English, German, Chinese labels and card/tile/action explanations.
- Modify `src/network/localWifi.ts`: Mahjong client action types and public state handling.
- Modify `server/local-wifi-server.mjs`: allow `mahjong`, player count rules, action forwarding.
- Create `tests/mahjong.tiles.behavior.ts`.
- Create `tests/mahjong.win.behavior.ts`.
- Create `tests/mahjong.rules.behavior.ts`.
- Create `tests/mahjong.ai.behavior.ts`.
- Create `tests/mahjong.publicState.behavior.ts`.
- Create `tests/mahjong.i18n.behavior.ts`.

---

## Task Breakdown

### Task 1: Lock Rules And Add Type Model

**Files:**
- Create: `src/game/mahjong/types.ts`
- Modify: `src/game/types.ts`
- Test: `tests/mahjong.tiles.behavior.ts`

- [ ] Add `mahjong` to `GameVariant`.
- [ ] Define serializable Mahjong types: `MahjongSuit`, `MahjongHonor`, `MahjongTile`, `MahjongMeld`, `MahjongAction`, `MahjongPlayerState`, `MahjongState`.
- [ ] Include fields for concealed hand, exposed melds, flowers, discard river, wall count, current drawn tile, claim window, dealer, wind, active player, winner, and event log.
- [ ] Test that the type model supports 4 players, hidden opponent hands, exposed melds, and claimable discards.
- [ ] Estimated tokens: 2k-3k.

### Task 2: Tile Catalog, Wall, Deal, Flowers

**Files:**
- Create: `src/game/mahjong/tiles.ts`
- Create/extend: `tests/mahjong.tiles.behavior.ts`

- [ ] Build a deterministic 144-tile catalog with stable IDs and duplicate group keys.
- [ ] Shuffle and deal 13 tiles to each player, 14 to dealer if desired by selected flow, then perform flower replacement.
- [ ] Sort player hands by suit, rank, honors, then flowers.
- [ ] Test tile counts: 36 dots, 36 bamboo, 36 characters, 16 winds, 12 dragons, 8 flowers/seasons.
- [ ] Test flower replacement: flowers leave concealed hand, enter exposed flowers, replacement tiles are drawn from the back/dead wall area.
- [ ] Estimated tokens: 3k-5k.

### Task 3: Winning Hand Detection

**Files:**
- Create: `src/game/mahjong/win.ts`
- Create/extend: `tests/mahjong.win.behavior.ts`

- [ ] Implement 4 melds + pair detection for suited sequences, triplets, quads-as-triplet-equivalent, honors triplets, and one pair.
- [ ] Implement optional seven-pairs detection.
- [ ] Return a structured result: winning boolean, pair, meld groups, pattern labels, rejected reason.
- [ ] Test normal win, all-pong win, mixed chow/pong win, seven pairs, near-miss with only 13 tiles, invalid honor sequence, invalid duplicate count.
- [ ] Estimated tokens: 5k-8k.

### Task 4: Core Turn Engine

**Files:**
- Create: `src/game/mahjong/rules.ts`
- Create/extend: `tests/mahjong.rules.behavior.ts`

- [ ] Create `createMahjongGame(config)` with 4 players and mode-aware player types.
- [ ] Implement draw, discard, chow, pong, exposed kong, concealed kong, added kong, win declaration, pass claim, and exhausted-wall draw.
- [ ] Enforce claim priority: win over kong/pong over chow; chow only for next player in turn order.
- [ ] Add claim window state after every discard.
- [ ] Test that a player cannot discard before drawing, cannot chow from non-left player, cannot pong without pair, cannot kong without four, cannot win invalid hand.
- [ ] Estimated tokens: 8k-12k.

### Task 5: Round Lifecycle And Scoring Skeleton

**Files:**
- Modify: `src/game/mahjong/rules.ts`
- Create: `src/game/mahjong/scoring.ts`
- Extend: `tests/mahjong.rules.behavior.ts`

- [ ] End round on win or wall exhaustion.
- [ ] Track winner, winning tile source, discarder, self-draw flag, exposed/concealed melds, and round summary.
- [ ] Implement minimal scoring summary first: winner gets base points, discarder pays on discard win, all opponents pay on self-draw.
- [ ] Keep a scoring hook ready for later full fan/pattern scoring.
- [ ] Test discard win payment, self-draw payment, draw round, dealer rotation basics.
- [ ] Estimated tokens: 4k-7k.

### Task 6: AI Difficulty Heuristics

**Files:**
- Create: `src/game/mahjong/ai.ts`
- Create/extend: `tests/mahjong.ai.behavior.ts`

- [ ] Easy AI: legal random discard, accepts obvious win, random legal pong/chow at low probability.
- [ ] Medium AI: discard isolated tiles, keep pairs and near-sequences, claim win/pong useful tiles, chow when it improves shanten-like distance.
- [ ] Hard AI: estimate hand distance, avoid discarding recent dangerous tiles, prefer live tiles, preserve pairs, evaluate chow/pong/kong tradeoffs, reduce risk when opponent is near win.
- [ ] Test that AI always returns legal actions, declares available win, avoids discarding a tile that immediately completes its own better shape when alternatives exist.
- [ ] Estimated tokens: 8k-14k.

### Task 7: Hint And Suggestion Engine

**Files:**
- Create: `src/game/mahjong/hints.ts`
- Create/extend: `tests/mahjong.ai.behavior.ts`

- [ ] Generate turn hints: draw, discard recommendation, claim recommendation, win available, kong available.
- [ ] Explain why a tile is suggested: isolated, duplicate, completes sequence, dangerous discard, keeps pair, opens chow.
- [ ] Include beginner rule text for claim windows and winning condition.
- [ ] Expand hints with tile-aware, current-hand suggestions: explain why the selected discard is weak, what useful shapes remain, and what kind of draw/claim would improve the hand.
- [ ] Ensure hints do not reveal hidden opponent hands.
- [ ] Test discard suggestion wording and claim suggestion wording in neutral structured keys before translation.
- [ ] Estimated tokens: 4k-7k.

### Task 8: Three.js Renderer Foundation

**Files:**
- Create: `src/components/mahjong/MahjongTable3D.tsx`
- Create: `src/components/mahjong/mahjongScene.ts`
- Create: `src/components/mahjong/mahjongTextures.ts`
- Modify: `package.json`

- [ ] Add `three` dependency.
- [ ] Create a React component that mounts a canvas and owns renderer setup/dispose.
- [ ] Implement scene, orthographic or shallow perspective camera, lights, resize, requestAnimationFrame loop, and WebGL context loss handling.
- [ ] Generate tile face textures from canvas text/symbol drawing, avoiding external image dependencies in the first version.
- [ ] Render a static table with one sample wall, one player hand, and sample discards before connecting game state.
- [ ] Estimated tokens: 7k-11k.

### Task 9: 3D Mahjong Layout And Mobile Responsiveness

**Files:**
- Create: `src/components/mahjong/mahjongLayout.ts`
- Modify: `src/components/mahjong/MahjongTable3D.tsx`
- Modify: `src/App.css`

- [ ] Define stable 4-seat positions: bottom human, left, top, right.
- [ ] Render concealed hands, exposed melds, flowers, wall stacks, discard river, current drawn tile, selected tile highlight.
- [ ] Use lower-detail tile geometry or instancing-like reuse on mobile.
- [ ] Keep DOM buttons out of the center playfield and avoid card/label overlap patterns seen in earlier games.
- [ ] Add a 2D fallback message if WebGL is unavailable.
- [ ] Estimated tokens: 8k-12k.

### Task 10: React Integration And Action Controls

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/game/classic.ts` only if shared facade routing is required.

- [ ] Add Game 24 card/setup entry.
- [ ] Add Mahjong action buttons: Draw, Discard selected, Chow, Pong, Kong, Win, Pass.
- [ ] Add selected tile state and click plumbing from Three.js tile picks to React action state.
- [ ] Add rule panel and hint panel.
- [ ] Disable invalid controls with clear labels.
- [ ] Estimated tokens: 6k-10k.

### Task 11: Single Player, Hot Seat, Spectacular Modes

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/game/mahjong/rules.ts`
- Modify: `src/game/mahjong/ai.ts`

- [ ] Single Player: one human plus three AI, with difficulty mapped to AI heuristics.
- [ ] Hot Seat: multiple human seats, only active player concealed hand visible; no hidden information leakage.
- [ ] Spectacular: all hands visible or observer-safe toggle, with autoplay/step AI controls if consistent with existing app mode.
- [ ] Test mode-specific visibility with public state projection tests.
- [ ] Estimated tokens: 5k-8k.

### Task 12: Local WiFi Mode

**Files:**
- Modify: `src/network/localWifi.ts`
- Modify: `server/local-wifi-server.mjs`
- Create: `src/game/mahjong/publicState.ts`
- Create/extend: `tests/mahjong.publicState.behavior.ts`

- [ ] Add `mahjong` to server allow-list and clamp player count to exactly 4.
- [ ] Add WiFi action types for draw, discard, claim chow/pong/kong/win, pass, select claim option.
- [ ] Server must store canonical Mahjong state and forward sanitized public state per client.
- [ ] Public state must show only each client's own concealed hand plus public melds/discards/wall count.
- [ ] Test that client A cannot see client B concealed tiles.
- [ ] Estimated tokens: 7k-12k.

### Task 13: Translations In English, German, Chinese

**Files:**
- Modify: `src/i18n.ts`
- Create/extend: `tests/mahjong.i18n.behavior.ts`

- [ ] Add tile names for dots, bamboo, characters, winds, dragons, flowers/seasons.
- [ ] Add action labels: draw, discard, chow, pong, kong, win, pass, self-draw, claim discard.
- [ ] Add hint labels and rule sections in English, German, and Chinese.
- [ ] Add win-pattern labels for base hand and seven pairs.
- [ ] Test that every Mahjong translation key resolves for `en`, `de`, and `zh` without English fallback for Chinese/German.
- [ ] Estimated tokens: 5k-9k.

### Task 14: Rules Documentation And In-App Explanation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/i18n.ts`

- [ ] Add beginner-friendly rule sections: objective, tile set, turn order, draw/discard, chow/pong/kong, flowers, win condition, scoring, tips.
- [ ] Add examples: valid chow, invalid honor chow, pong from discard, self-draw win, discard win.
- [ ] Add strategy tips: keep pairs, build two-sided waits, avoid dangerous late discards, do not overuse open melds.
- [ ] Add deeper Mahjong explanations than the lighter UNO-family games: practical strategy, beginner examples, common mistakes, and German/Chinese translations that keep the extra detail instead of shortening it away.
- [ ] Estimated tokens: 3k-6k.

### Task 15: Verification And Manual Test Script

**Files:**
- Create/extend: `tests/mahjong.*.behavior.ts`
- Modify: any build/test helper only if needed.

- [ ] Run Mahjong behavior tests.
- [ ] Run existing high-risk tests: Skip-Bo, Phase 10, DOS, Cabo, Skyjo.
- [ ] Run `npm run build`.
- [ ] Prepare manual test checklist for Single Player, Hot Seat, Local WiFi host/client, Spectacular, mobile viewport, German, Chinese.
- [ ] Estimated tokens: 2k-4k.

---

## Suggested Delivery Slices

1. **Slice A: Rules Engine MVP**  
   Tasks 1-5. No Three.js yet, only tests and minimal state.

2. **Slice B: AI + Hints MVP**  
   Tasks 6-7. Make Single Player playable at basic/medium/hard levels.

3. **Slice C: Three.js Table MVP**  
   Tasks 8-10. Static then interactive 3D table with React controls.

4. **Slice D: Modes**  
   Task 11. Single Player, Hot Seat, Spectacular.

5. **Slice E: Local WiFi**  
   Task 12. Host/client public state and action routing.

6. **Slice F: Translations + Rules + Polish**  
   Tasks 13-15. German/Chinese completeness, rules, manual test script, build.

7. **Slice G: Mahjong Visual Polish Backlog**
   Add Mahjong-specific visual customization after the core game is stable:
   - Table themes: vintage, premium wood, luxus king, classic Mahjong table.
   - Table decks/felt colors: classic green, sky blue, golden beach, Chinese red.
   - Center patterns: Chinese dragon, Chinese lion, Chinese characters "发财", Chinese gold ingot / yuan bao.
   - Tile decks: jade green, golden, ruby, sapphire.
   - Tile readability: ensure all suit/honor text has strong contrast against the tile deck background, especially 条 on light green tiles and 饼 on light blue/white tiles.

---

## Token Estimate

Conservative full implementation estimate: **72k-119k tokens**.

Expected practical range if implemented in focused slices with feedback: **85k-105k tokens**.

Highest-risk areas:
- Correct Mahjong claim/win/kong/flower timing.
- Hard AI quality without leaking hidden information.
- Local WiFi public/private state separation.
- Three.js mobile performance and touch picking.
- Complete Chinese and German translation coverage.

---

## Acceptance Criteria

- Game 24 appears as Mahjong and supports exactly 4 players.
- Single Player works with three AI players and selectable difficulty.
- Hot Seat hides inactive players' concealed tiles.
- Spectacular mode allows observation without breaking turn flow.
- Local WiFi room starts Mahjong, not another game, and clients only see their own concealed hand.
- Legal actions match the selected Mahjong rule profile.
- Hints explain current goal, legal claims, suggested discard, and winning condition.
- English, German, and Chinese have complete Mahjong UI/rules/hint translations.
- Mobile layout has no overlapping labels, controls, or tiles.
- `npm run build` passes.
- Mahjong behavior tests pass, and high-risk existing game tests still pass.
