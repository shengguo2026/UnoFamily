# Animation Plan

This document captures the current agreed recommendations for gameplay animation, round-start flourish, and round-end winner celebration. It is a design plan only; implementation should start only after explicit confirmation.

## Goals

- Make card and tile movement feel physical and readable.
- Improve player understanding of who acted, who received cards, and why a round ended.
- Keep turns fast; animations should support gameplay, not slow it down.
- Respect reduced-motion settings.
- Keep implementation aligned with the current app architecture.

## Recommended Technology Stack

Use a hybrid animation stack:

- **Canvas 2D** for core table gameplay movement:
  - play card to discard pile
  - draw card to player
  - penalty draw stream
  - round-start deal
  - card flourishes
  - memory grid fill and collection
- **CSS animations** for UI, popups, badges, buttons, and winner overlay text.
- **Canvas particles** for fireworks and celebration effects.
- **Three.js** only where true 3D pays off:
  - Mahjong table and tile movement
  - optional future premium 3D flourishes

The main table is already rendered in `GameCanvas`, so gameplay card movement should stay Canvas-based. CSS would require separate floating DOM cards that must stay synchronized with canvas positions, mobile scaling, hidden hands, and hit areas.

## Global Animation Settings

Recommended settings to add later:

| Setting | Default | Options |
|---|---|---|
| Round-start flourish | On | On / Off |
| Flourish style | Random | Random + named styles |
| Deal animation | On | On / Off |
| Winner celebration | On | On / Off |
| Winner celebration duration | 3s | Fixed initially |
| Click to skip celebration | On | Always on |
| Animation speed | Normal | Fast / Normal / Slow |
| Reduced motion override | On | Skip flourish and fireworks |

Animation speed multipliers:

| Speed | Multiplier |
|---|---:|
| Fast | 70% |
| Normal | 100% |
| Slow | 130% |
| Off / Reduced motion | No movement; use minimal pulse/fade only |

## Core Gameplay Animations

These are the first recommended implementation slice.

### 1. Play Card To Discard Pile

Purpose: show exactly which player played a card and where it landed.

Recommended behavior:

- A temporary animated card appears at the source player hand or seat.
- It moves to the central discard pile.
- It slightly scales up during travel, then settles onto the pile.
- If the player's hand is visible, animate the actual card face.
- If the player's hand is hidden, animate a card back first, then flip/reveal near the discard pile.
- End with a small bounce/settle on the discard pile.

Timing:

| Speed | Duration |
|---|---:|
| Fast | 230ms |
| Normal | 320ms |
| Slow | 420ms |

Recommended motion:

- Use a slight curved path, not a perfectly straight line.
- Bottom player: card travels upward.
- Left/right/top players: card travels inward from their side.
- On smartphone: shorter curve and smaller scale change.

Suggested timeline:

| Time | Visual |
|---:|---|
| 0-70ms | Card lifts from hand |
| 70-260ms | Card flies to center |
| 260-320ms | Card lands and settles |

Special cases:

- Wild card: add a small color-wheel pulse at the center after landing.
- Skip/Reverse/Draw card: after landing, show a tiny icon pulse toward the affected player.
- Liar's Uno: if the card is played face down, animate card back to discard pile and do not reveal unless challenged.
- Flip games: animate the correct light/dark face.

### 2. Draw Card To Player

Purpose: make drawing feel physical and clearly show who received a card.

Recommended behavior:

- A card back moves from the draw pile to the receiving player.
- It lands at the player's hand or seat area.
- For the local/human player, it may flip briefly if the drawn card is visible to them.
- For AI/hidden hands, it stays as a card back.
- Player card count updates as the card lands or appears to update with the landing.

Timing:

| Speed | Duration |
|---|---:|
| Fast | 190ms |
| Normal | 260ms |
| Slow | 340ms |

Recommended motion:

- Mostly straight path with a slight arc.
- Use card back for privacy unless the local player can see the card.
- On smartphone, animate to the compact player label or hand area.

Suggested timeline:

| Time | Visual |
|---:|---|
| 0-40ms | Card lifts from draw pile |
| 40-220ms | Card flies to player |
| 220-260ms | Card snaps into hand/card-count area |

Special cases:

- Drawing after "cannot play": one simple card.
- Drawing a playable card: after landing, optionally pulse the drawn card in the player's hand.
- WiFi mode: local player sees their own drawn card; other clients see a card back animation.
- Mahjong is separate: tile should slide from wall to hand, not use this card animation.

### 3. Penalty Draw Stream

Purpose: show multi-card penalties clearly without making the player wait too long.

Recommended behavior:

- Multiple card backs stream from draw pile to the target player.
- Cards are staggered by a small delay.
- For large penalties, show only a capped number of animated cards plus a badge like `+10`.
- Target player label pulses while receiving cards.
- If several players are affected, animate one short stream per player in turn order or parallel with reduced intensity.

Timing formula:

```text
min(900ms, 260ms + (N - 1) * 70ms)
```

Examples:

| Penalty | Duration |
|---|---:|
| Draw 2 | 330ms |
| Draw 4 | 470ms |
| Draw 6 | 610ms |
| Draw 10 | 890ms |

Hard cap: **900ms**.

Recommended motion:

- Source is always the draw pile.
- Target is the affected player's hand or label.
- Cards should use slight offsets so they do not perfectly overlap.
- For huge penalties, show the first 5-6 cards visibly and a `+N` badge.

Special cases:

- Wild +4: show 4 cards, then a skip/turn-loss pulse.
- Draw 10 / No Mercy: show 6 cards max plus `+10`.
- All-player draw effects: animate around table in game direction, or use parallel streams if faster.
- Launcher/Blast/Tippo cards: popup animation remains primary; the penalty stream can happen after or be represented inside the popup.
- AI turns: use faster version so gameplay does not feel blocked.
- Reduced motion: no flying cards; just pulse target label and update count.

## Round-Start Animation

Recommended sequence:

1. Round state is created.
2. Optional card flourish plays in the center.
3. Staggered deal animation starts.
4. Normal gameplay begins.

Recommended timing:

| Stage | Duration |
|---|---:|
| Card flourish | 900-1400ms |
| Staggered deal | 700-1100ms |
| Total intro | 1600-2400ms |

Cap the full round-start intro at about **2.4 seconds**.

### Round-Start Deal Duration

Preferred formula:

```text
min(1100ms, 450ms + playerCount * startingHandSize * 18ms)
```

Large-game caps:

| Player Count | Recommendation |
|---|---|
| 2-4 players | Full deal animation, up to about 950ms |
| 5-10 players | Grouped/fast deal, capped at 1100ms |
| 12+ players | Compact deal sparkle/stream, capped at 900ms |

## Card Flourishes

Flourish is on by default and can be disabled in settings.

Feasibility and recommendation:

| Flourish | CSS | Canvas 2D | Three.js | Recommendation |
|---|---|---|---|---|
| Card fan out/in | Possible | Excellent | Possible | Canvas 2D |
| Spring with deck | Hard | Good | Excellent | Canvas first, Three.js later if needed |
| Revolutionary cut | Possible | Excellent | Good | Canvas 2D |
| Faro shuffle | Hard | Excellent | Good | Canvas 2D |
| Waterfall with deck | Hard | Good | Excellent | Canvas first |
| Dribble with deck | Hard | Good | Excellent | Canvas first |
| Single-card pirouette | Good | Good | Excellent | Canvas or CSS; Three.js if true 3D |
| One-handed shuffle | Hard | Medium | Excellent | Later premium slice, likely Three.js |

Recommended implementation phases:

### Flourish Slice 1

1. Card fan out/in
2. Revolutionary cut
3. Faro shuffle
4. Single-card pirouette

### Flourish Slice 2

1. Card spring
2. Waterfall
3. Dribble

### Premium Flourish Slice

1. One-handed shuffle

The one-handed shuffle is the hardest to make convincing without true 3D.

## Round-Start Applicability

### Group A: Full Card Flourish + Staggered Hand Deal

These can use card flourish directly, followed by normal card dealing to player hands:

- Uno Classic
- Uno Extreme
- Uno Flash
- Uno Flip
- Uno H2O
- Uno Spin
- Uno Flex
- Liar's Uno
- Uno Party
- Uno Teams
- Uno House Rules
- Uno Challenge Adults Only
- Uno Flip Extreme
- Uno Der Herr der Ringe
- Pop-Culture Uno editions
- UNO All Wild
- Uno Show 'em No Mercy
- UNO Minecraft
- UNO Wild Jackpot
- UNO Blast
- UNO Roboto
- UNO Tippo
- UNO Emoji
- UNO Mario Kart
- UNO Super Mario
- UNO Sonic the Hedgehog
- UNO Barbie
- UNO Masters of the Universe
- UNO TMNT
- UNO Spider-Man
- UNO DC
- UNO Star Trek
- UNO Avatar
- UNO Monster High
- UNO NFL
- Guo's Exclusive Uno Neighbor Match
- Guo's Exclusive Uno Hi-Lo
- Guo's Exclusive Uno Passage

### Group B: Card Flourish, Custom Deal Layout

These can use the same initial flourish, but need a custom deal animation:

| Game | Deal Definition |
|---|---|
| UNO Triple Play | Deal hands, then animate three center discard piles lighting up |
| UNO Dice | Dice roll/line up instead of card hand deal |
| DOS | Deal hands, then animate two center-row cards |
| Phase 10 | Deal hands, then show current phase goal badge |
| Skip-Bo | Deal stock pile + hand, then animate build piles appearing |
| UNO Zero | Deal 2x3 grid cards to each player |
| Cabo | Deal 2x2 grid cards, reveal initial known cards |
| Skyjo | Deal 3x4 grid cards, reveal initial two cards |

### Group C: Memory Grid Start Animation

These should use grid-fill animation instead of normal hand dealing:

- Guo's Exclusive UNO Memory
- Guo's Exclusive UNO Memory Action
- Guo's Exclusive UNO Triple Memory
- Guo's Exclusive UNO Triple Memory Action

Recommended sequence:

1. Flourish in center.
2. Cards scatter/fill the grid face down.
3. Player labels pulse in seating order.
4. Turn starts.

### Group D: Mahjong-Specific Start Animation

These should not use card flourish by default:

- Traditional Chinese Mahjong
- Guo's Exclusive Uno Mahjong

Recommended sequence:

- Traditional Mahjong: tile wall build animation, dealer marker, tiles slide into hands.
- Guo's Exclusive Uno Mahjong: UNO-card Mahjong wall/deal animation, not normal UNO dealing.

## Round-End Winner Celebration

Recommended behavior:

- Before the score screen appears, show a full-screen celebration overlay.
- Title: localized winner text.
- Subtext: localized game-aware message.
- 3D-looking text falls from top to center.
- Fireworks shoot from bottom toward the text.
- Duration: **3 seconds**.
- User can click/tap anywhere to skip.
- After animation ends or is skipped, show the existing detailed score screen.

Recommended technology:

- **CSS 3D text** for the winner title.
- **Canvas particles** for fireworks.
- Optional future premium: Three.js 3D text and particles.

The winner animation should wait until any hardware/action popup has finished:

1. Action/hardware popup
2. Winner celebration
3. Score screen

## Localized Winner Text

Default title:

| Language | Round title | Game/session title |
|---|---|---|
| English | `{name} wins!` | `{name} wins the game!` |
| Chinese | `{name} 获胜！` | `{name} 赢得整场游戏！` |
| German | `{name} gewinnt!` | `{name} gewinnt das Spiel!` |

Default subtext:

| Language | Round subtext | Game/session subtext |
|---|---|---|
| English | `Round complete` | `Final score reached` |
| Chinese | `本局结束` | `达到最终分数` |
| German | `Runde beendet` | `Zielpunktzahl erreicht` |

Special subtexts:

| Game Type | English | Chinese | German |
|---|---|---|---|
| Classic scoring games | `Cards scored from opponents' hands` | `按对手剩余手牌计分` | `Restkarten der Gegner werden gewertet` |
| Teams | `Team round complete` | `团队本局结束` | `Teamrunde beendet` |
| H2O Splash | `Hand point awarded` | `获得 1 个手牌胜点` | `Handpunkt vergeben` |
| Zero | `No hidden grid cards left` | `没有剩余隐藏网格牌` | `Keine verdeckten Rasterkarten übrig` |
| Cabo / Skyjo | `Lowest grid total wins` | `最低网格总分获胜` | `Niedrigster Rasterwert gewinnt` |
| Memory games | `Most collected cards wins` | `收集牌最多者获胜` | `Meiste gesammelte Karten gewinnen` |
| Phase 10 | `Player went out after phase progress` | `玩家出完手牌并推进阶段` | `Spieler ist raus und Phase wird gewertet` |
| Skip-Bo | `Stock pile cleared` | `库存牌堆已清空` | `Stockstapel geleert` |
| Mahjong | `Winning hand scored` | `胡牌已计分` | `Gewinnhand gewertet` |
| Passage | `Quickest-run bonus awarded` | `获得最快出完奖励` | `Schnellster-Lauf-Bonus vergeben` |

## Round-End Applicability

The winner celebration can apply to almost every game.

### Generic Winner Celebration

Use directly for:

- Normal UNO-style games
- Guo's Exclusive Uno Neighbor Match
- Guo's Exclusive Uno Hi-Lo
- Guo's Exclusive Uno Passage

### Same Animation, Special Subtext

Use same animation but game-aware subtext for:

- Teams
- H2O Splash
- Zero
- Cabo
- Skyjo
- DOS
- Phase 10
- Skip-Bo
- Memory variants
- Mahjong

## Implementation Principles

- Animations are visual-only; game state remains authoritative.
- Do not allow AI or player input to visually race ahead during action/winner animations.
- In WiFi mode, each client can show local animations, but game state must not depend on animation completion.
- Hot seat privacy should not reveal hidden hands during animation.
- Spectator mode should show all animations.
- Reduced motion should skip movement and use minimal pulse/fade.
- Large player-count games should cap animation duration and use grouped streams.

## Recommended Implementation Order

1. Play card to discard pile.
2. Draw card to player.
3. Penalty draw stream.
4. Round-start deal animation.
5. Card flourish slice 1.
6. Round-end winner celebration.
7. Custom starts for grid/memory/special games.
8. Mahjong-specific tile animations.
9. Premium flourishes / Three.js upgrades.
