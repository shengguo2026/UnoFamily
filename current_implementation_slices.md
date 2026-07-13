# Current Implementation Slices

This document tracks the planned implementation slices for the agreed animation and sound/music requirements. It is an execution backlog, not implementation code.

## Guiding Principles

- Implement animations and audio as optional enhancements; gameplay state remains authoritative.
- Do not let AI, human input, or WiFi state visually race ahead while blocking animations are active.
- Keep every slice manually testable.
- Respect Hot Seat privacy and WiFi synchronization.
- Keep mobile and Android APK compatibility in mind from the beginning.
- Use original, generic, licensed, or generated audio only. Do not copy brand sounds or music.

## Animation Slices

### Slice A1: Animation Foundation And Settings

Status: Complete

Scope:

- Add central animation settings:
  - Round-start flourish on/off.
  - Flourish style: random plus named styles.
  - Deal animation on/off.
  - Winner celebration on/off.
  - Animation speed: fast, normal, slow.
  - Reduced-motion behavior.
- Add shared animation queue/lock so AI and user actions wait when a blocking animation is active.
- Add shared helpers for table coordinates, player seat targets, card sizing, and mobile scaling.

Manual test focus:

- Settings can be changed and remembered.
- AI does not continue during blocking animation.
- Reduced motion skips major motion.

### Slice A2: Play Card To Discard Pile

Status: Complete

Scope:

- Animate a played card from player hand/seat to the central discard pile.
- Use face-up card for visible hands.
- Use card back first for hidden/private hands, then reveal near the pile when allowed.
- Add small landing settle/bounce.
- Add small pulse for wild/action cards.

Recommended durations:

- Fast: 230 ms.
- Normal: 320 ms.
- Slow: 420 ms.

Manual test focus:

- Human player card movement.
- AI player card movement.
- Wild card landing.
- Hidden hand privacy in Hot Seat and WiFi.

### Slice A3: Draw Card To Player

Status: Complete

Scope:

- Animate one card from draw pile to the receiving player.
- Use card back for hidden recipients.
- For local visible player, optionally reveal/flip after landing.
- Pulse playable drawn card when applicable.

Recommended durations:

- Fast: 190 ms.
- Normal: 260 ms.
- Slow: 340 ms.

Manual test focus:

- Human draw.
- AI draw.
- WiFi local player draw privacy.
- Smartphone layout target position.

### Slice A4: Penalty Draw Stream

Status: Complete

Scope:

- Animate multiple cards from draw pile to target player.
- Stagger cards for clarity.
- Cap large penalties and show a `+N` badge.
- Pulse target label.
- Support single-target and all-player penalties.

Recommended duration formula:

```text
min(900ms, 260ms + (N - 1) * 70ms)
```

Manual test focus:

- Draw 2.
- Wild +4.
- Draw 10 / large penalty.
- All-player penalties.
- Reduced motion pulse-only behavior.

### Slice A5: Round-Start Deal Animation

Status: Complete

Scope:

- Animate round start after state creation and before normal play begins.
- Deal cards to players with a fast staggered stream.
- Support grouped/compact dealing for large player counts.

Recommended duration formula:

```text
min(1100ms, 450ms + playerCount * startingHandSize * 18ms)
```

Manual test focus:

- 2-player, 4-player, and large-player games.
- Single player vs AI, Hot Seat, WiFi host/client, Spectator.
- No hidden information leaks.

### Slice A6: Card Flourish Slice 1

Status: Complete

Scope:

- Add first set of round-start card flourishes:
  - Card fan out/in.
  - Revolutionary cut.
  - Faro shuffle.
  - Single-card pirouette.
- Use Canvas 2D first.
- Make flourish selectable or random from settings.

Recommended duration:

- 900-1400 ms, included in a total round-start intro cap of about 2400 ms.

Manual test focus:

- Flourish on/off.
- Random style changes between rounds.
- Mobile performance.
- Reduced motion skips flourish.

### Slice A7: Round-End Winner Celebration

Status: Complete

Scope:

- Add full-screen winner celebration before the existing score screen.
- Localize title and subtext in English, Chinese, and German.
- Show 3D-looking winner text falling from top to center.
- Add fireworks from bottom toward the title.
- Let player tap/click anywhere to skip.
- Ignore the trailing click from the winning-card pointer gesture so it cannot dismiss a newly mounted celebration before it is visible; fresh pointer presses and keyboard activation still skip normally.
- Duration fixed at 3 seconds initially.

Manual test focus:

- Round winner.
- Session/game winner.
- Skip by click/tap.
- Correct localized text.
- Score screen appears after animation.

### Slice A8: Special Start Animations For Custom Layout Games

Status: Complete

Scope:

- Add custom round-start animations for games that do not use a normal hand-only deal:
  - UNO Triple Play: deal hands, then light three center piles.
  - UNO Dice: dice roll/line up instead of card deal.
  - DOS: deal hands and two center cards.
  - Phase 10: deal hands and phase badge.
  - Skip-Bo: stock pile, hand, and build piles.
  - UNO Zero: 2x3 grid deal.
  - Cabo: 2x2 grid deal plus initial reveal.
  - Skyjo: 3x4 grid deal plus initial reveal.

Manual test focus:

- Each listed game starts without overlap.
- Smartphone display remains usable.
- Hot Seat privacy remains correct.

### Slice A9: Memory Grid Start And Collection Animations

Status: Complete

Scope:

- Add grid-fill animation for:
  - Guo's Exclusive UNO Memory.
  - Guo's Exclusive UNO Memory Action.
  - Guo's Exclusive UNO Triple Memory.
  - Guo's Exclusive UNO Triple Memory Action.
- Animate selected card reveal.
- Animate matched cards moving to the collecting player.
- Keep existing action-card popup animations compatible.

Manual test focus:

- 4x4, 6x6, 8x8, 6x3, and 6x8 grids.
- AI reveal visibility.
- Action-card animations block further play.
- Smartphone zoom/fit remains correct.

### Slice A10: Mahjong-Specific Tile Animations

Status: Complete

Scope:

- Traditional Chinese Mahjong:
  - Tile wall build.
  - Dealer marker.
  - Tiles slide from wall to hands.
  - Tile draw and discard movement.
- Guo's Exclusive Uno Mahjong:
  - UNO-card Mahjong wall/deal style.
  - Draw/discard movement adapted to UNO-card tiles.
- Drawn and discarded tiles receive distinct highlights so the latest move is easy to recognize.
- Render exposed meld rows and animate claimed tiles for chow (吃), pong (碰), and kong (杠).
- Add a private ready-hand (听牌) animation visible only to that hand's viewer.
- Add a win (胡牌) tile flourish and result marker.
- Show every player's revealed concealed hand and exposed melds in the winning popup, including a claimed winning discard.
- Respect animation-speed and reduced-motion settings while retaining static recognition highlights.
- Seed the wall/deal transition on every Three.js controller mount so React Strict Mode cannot consume the intro before display.

Manual test focus:

- Single player, Hot Seat, WiFi, Spectator.
- Smartphone zoom/pan remains usable.
- No hidden tile information leaks.
- Drawn/discarded highlights remain visible after their movement settles.
- Chow, pong, kong, ready-hand, and win events are visually distinct.

### Slice A11: Premium Flourishes And Optional Three.js Upgrades

Status: Complete

Scope:

- Add four selectable premium flourishes:
  - Spring forms an elastic bowed bridge with a settling release.
  - Waterfall staggers cards through a high curved arc into a catch stack.
  - Dribble alternates falling cards from two raised packets.
  - One-handed shuffle rotates two scissored packets around loose orbiting cards.
- Include all premium styles in Random selection while avoiding an immediate repeat.
- Add deck-theme-colored spotlight, orbit, and sparkle accents shared by the premium styles.
- Show the localized golden flourish name above the active animation in English, Chinese, or German.
- Random uses a shuffled bag that shows every flourish once per cycle and prevents consecutive repeats, including across Canvas remounts.
- Keep animation speed, reduced-motion, disable, and round-start blocking behavior consistent with the original flourishes.
- Settled hands and center piles remain hidden during the flourish and deal; the final cards are revealed only after dealing finishes.
- Canvas 2D was retained because it delivers the intended layered motion with lower startup and rendering overhead; no Three.js upgrade was needed.

Manual test focus:

- Performance on laptop and smartphone.
- Visual quality compared to simpler Canvas flourishes.
- Settings can disable premium flourishes.

## Sound And Music Slices

### Slice S1: Audio Foundation And Settings

Status: Complete

Scope:

- Add audio manager.
- Add sound map keyed by game event names.
- Add audio unlock after first user interaction for mobile browsers and Android APK.
- Add settings:
  - Master volume.
  - Sound effects volume.
  - Background music volume.
  - Sound effects on/off.
  - Background music on/off.
- Add translations for audio settings in English, Chinese, and German.

Recommended defaults:

- Sound effects: on.
- Background music: off.
- Master volume: medium.
- Sound effects volume: medium-high.
- Background music volume: low.

Manual test focus:

- First tap unlocks audio.
- Toggles work.
- Volume sliders work.
- Settings persist.

### Slice S2: Core Reusable Sound Effects

Status: Complete

Scope:

- Add first reusable sound effects:
  - Shuffle/deal.
  - Draw card.
  - Play card to discard pile.
  - Penalty draw stream.
  - Invalid move.
  - Match success.
  - Mismatch.
  - Round win.
  - Session win.
  - Generic hardware fire/release.

Manual test focus:

- Sounds trigger exactly once per event.
- Disabled sound effects stay silent.
- Sounds are not too loud or annoying.
- Animation skip still plays key sound once when appropriate.

### Slice S3: Hardware-Specific Sound Effects

Status: Complete

Scope:

- UNO Extreme: launcher build-up and fire.
- UNO Blast: pressure build and release.
- UNO Roboto: electronic beep and instruction cue.
- UNO Tippo: tray wobble and tip.
- UNO Dice: dice roll and settle.

Manual test focus:

- Hardware popups and sounds stay synchronized.
- AI waits while blocking hardware animation is active.
- Sound effects stay silent when disabled.

### Slice S4: Mahjong-Specific Sound Effects

Status: Complete

Scope:

- Tile wall build.
- Tile draw.
- Tile discard.
- Chow claim.
- Pong claim.
- Kong claim.
- Win gong.
- Optional Mahjong table ambience later.
- Use A10 state transitions so each visual event produces at most one matching sound.
- Play public transition sounds from privacy-filtered WiFi snapshots without exposing concealed tile identities.
- Wait for browser audio unlock before playing the initial wall-construction cue.

Manual test focus:

- Sounds match tile actions.
- Hot Seat and WiFi do not reveal private information.
- Smartphone and Android audio playback remains stable.

### Slice S5: Memory-Specific Sound Effects

Status: Complete

Scope:

- Card flip.
- Match success variation.
- Mismatch return.
- Action-card reveal.
- Winner-takes-all cue.

Manual test focus:

- Human and AI card reveals play sound.
- Action-card sounds do not stack confusingly.
- Blocking action-card animation and sound finish before play continues.

### Slice S6: Background Music Foundation

Status: Complete

Scope:

- Add background music playback with loop support.
- Background music remains off by default.
- Add one neutral low-volume loop first.
- Pause/resume music correctly when setting is changed.
- Avoid restarting the loop unnecessarily between turns.

Manual test focus:

- Music on/off.
- Music volume.
- No music when disabled.
- Music continues smoothly during gameplay.

### Slice S7: Themed Background Music

Status: Complete

Scope:

- Add optional music moods:
  - Classic table: soft lounge or light jazz loop.
  - Mahjong: calm guzheng or Chinese instrumental loop.
  - Kids/pop-culture variants: playful arcade-style loop.
  - Guo exclusive games: light premium puzzle loop.
- Decide whether table theme or game type selects the loop automatically.
- MIDI-note arrangements drive locally generated instrument samples without external music licensing or network loading.
- Normalize theme output at a higher audible level and route it through a compressor/limiter.
- Retain a lightweight oscillator fallback if sample playback is unavailable.

Manual test focus:

- Correct loop chosen for representative games.
- Switching games does not create overlapping music.
- Music remains optional.
- Music at 100% is clearly audible without clipping or overpowering sound effects.

### Slice S8: Audio Asset Polish And APK Readiness

Status: Complete

Scope:

- No binary audio assets are shipped; effects and music remain original procedural Web Audio synthesis with a zero-byte APK audio payload.
- Route generated effects through a dedicated dynamics compressor to protect against clipping from overlapping voices.
- Cap the generated instrument-sample cache at 64 entries for stable smartphone and Android memory use.
- Add a build-time audio audit covering browser-compatible formats, source-only MIDI, unsupported formats, per-file size, and total payload size.
- Document provenance rules, format guidance, size limits, and the Android 12+ post-migration device checklist in `docs/audio-asset-policy.md`.
- Confirm no licensed, copied brand, or third-party audio is present in the current implementation.

Manual test focus:

- Audio file sizes are acceptable.
- APK build includes assets.
- Audio works after app install.
- Android device validation remains manual after an Android wrapper is added; none exists in this repository yet.

## Cross-Cutting QA Slices

### Slice Q1: Desktop And Laptop Visual QA

Status: Complete

Progress: Source audit and manual desktop validation complete.

Scope:

- Test animation and audio settings on common laptop and desktop sizes.
- Confirm game selection remains scrollable on smaller laptop screens.
- Confirm no animation causes card/label overlap.
- Added an earlier three-column control-dock reflow for laptop widths and 125% browser zoom.
- Added bounded scrolling for generic choice dialogs on short laptop viewports.
- Manual matrix: `docs/q1-desktop-qa-checklist.md`.

### Slice Q2: Smartphone And Tablet QA

Status: Open

Progress: Source audit complete; manual phone and tablet validation pending.

Scope:

- Test portrait and landscape smartphone displays.
- Test tablet display.
- Confirm all animations scale correctly.
- Confirm touch skip for winner celebration works.
- Confirm audio unlock works after first interaction.
- Cap the 2D table canvas at 2x device pixel ratio to reduce high-DPI phone memory pressure while retaining sharp rendering.
- Confirm static tables redraw on viewport resize/orientation changes and Mahjong retains pointer-cancel handling plus capped WebGL resolution.
- Manual matrix: `docs/q2-mobile-tablet-qa-checklist.md`.

### Slice Q3: Mode Coverage QA

Status: Open

Scope:

- Single player vs AI.
- Hot Seat.
- Local WiFi host/client.
- Spectator.

Focus:

- Blocking animations pause AI progression.
- WiFi synchronization is not dependent on animation completion.
- Hot Seat privacy remains protected.

## Recommended Overall Order

1. Slice A1: Animation foundation and settings.
2. Slice S1: Audio foundation and settings.
3. Slice A2: Play card to discard pile.
4. Slice A3: Draw card to player.
5. Slice A4: Penalty draw stream.
6. Slice S2: Core reusable sound effects.
7. Slice A5: Round-start deal animation.
8. Slice A6: Card flourish slice 1.
9. Slice A7: Round-end winner celebration.
10. Slice S3: Hardware-specific sound effects.
11. Slice A8: Special start animations for custom layout games.
12. Slice A9: Memory grid start and collection animations.
13. Slice S5: Memory-specific sound effects.
14. Slice A10: Mahjong-specific tile animations.
15. Slice S4: Mahjong-specific sound effects.
16. Slice S6: Background music foundation.
17. Slice S7: Themed background music.
18. Slice A11: Premium flourishes and optional Three.js upgrades.
19. Slice S8: Audio asset polish and APK readiness.
20. Slice Q1: Desktop and laptop visual QA.
21. Slice Q2: Smartphone and tablet QA.
22. Slice Q3: Mode coverage QA.

## Reference Documents

- `animation_plan.md`
- `sound_music_plan.md`
