# Game Rules: Guo's Exclusive UNO Memory Variants

This document records the agreed rules for four custom UNO-inspired memory games:

1. Guo's Exclusive UNO Memory
2. Guo's Exclusive UNO Memory Action
3. Guo's Exclusive UNO Triple Memory
4. Guo's Exclusive UNO Triple Memory Action

These variants are planned as later slices after the currently open UNO collection variants.

## Shared Concepts

All four games are memory games using UNO-style number cards as the base.

- Supported modes: Single vs AI, Hot Seat, Local WiFi, Spectacular.
- Supported players: 2 to 4.
- Normal cards: UNO number cards only.
- No normal UNO action cards are used in the base memory variants.
- Player labels must show name, avatar/badge, collected card count, and points.
- The winner is the player with the most collected cards.
- Tie-breaker: highest collected point total.
- Number-card points use face value.
- Reveal duration defaults to 2 seconds and can be configured to 2, 3, 4, or 5 seconds.
- During the reveal duration, all players can see the selected cards.
- While selected cards are being revealed or resolved, further card selection is locked.
- Layout must avoid overlap between cards and player labels on desktop, tablet, and smartphone.
- Smartphone layouts should support initial fit-to-screen plus pinch zoom, pan while zoomed, bounded pan, and reset zoom, similar to Mahjong.

## Match Modes

Each memory game supports three match modes.

### Number Match

Cards match when their numbers are the same. Color does not matter.

Example: Red 7, Blue 7, and Green 7 are all number matches.

### Color Match

Cards match when their colors are the same. Number does not matter.

Example: Red 2, Red 5, and Red 9 are all color matches.

### Color + Number Match

Cards match only when both color and number are the same.

Example: Red 7 matches only another Red 7.

## 1. Guo's Exclusive UNO Memory

### Goal

Find matching pairs on the table. Collect the most cards before the board is empty.

### Difficulty

| Difficulty | Grid | Cards | Matches |
| --- | ---: | ---: | ---: |
| Easy | 4 x 4 | 16 | 8 pairs |
| Medium | 6 x 6 | 36 | 18 pairs |
| Hard | 8 x 8 | 64 | 32 pairs |

### Setup

- The app generates a solvable board for the selected match mode.
- All cards start face down.
- Duplicate generated cards are allowed when needed so every board has valid pairs.

### Turn Flow

1. The active player selects two face-down cards.
2. Both selected cards are revealed to all players.
3. The app checks the selected match mode.
4. If the two cards match, the active player collects both cards and plays again.
5. If the two cards do not match, both cards stay visible for the reveal duration, then flip face down and the turn passes.
6. Play continues until all table cards have been collected.

### Winning

- The player with the most collected cards wins.
- If tied, the player with the highest collected point total wins.

### Strategy

- In Number Match, remember number positions first; color is only visual noise.
- In Color Match, scan by color clusters and ignore number values.
- In Color + Number Match, exact identity matters, so repeated sightings are very valuable.
- A successful pair grants another turn, so a remembered match can start a chain.

## 2. Guo's Exclusive UNO Memory Action

### Goal

Find matching pairs while surprise action cards add luck and disruption.

### Difficulty

The board sizes are the same as Guo's Exclusive UNO Memory.

| Difficulty | Grid | Cards |
| --- | ---: | ---: |
| Easy | 4 x 4 | 16 |
| Medium | 6 x 6 | 36 |
| Hard | 8 x 8 | 64 |

### Action Card Counts

Action cards replace some normal board cards. The total grid size stays fixed.

| Difficulty | Action Cards |
| --- | --- |
| Easy | 2 Wild |
| Medium | 4 Wild, 2 Lose Cards, 2 Earn Cards |
| Hard | 4 Wild, 2 Lose Cards, 2 Earn Cards, 1 All Others Lose, 1 All Others Earn, 1 Lose All, 1 Winner Takes All |

The generator must still guarantee that enough valid normal pairs remain after action cards are inserted.

### Wild Card

- A traditional UNO Wild matches any number and any color.
- Wild cards stay on the table until matched.
- Wild + any normal card is a valid pair in every match mode.
- Wild + Wild is also a valid pair.
- Wild cards are collected as part of a successful match.

### Immediate Action Cards

Immediate action cards resolve as soon as they are revealed.

- They reveal only once.
- They take effect immediately.
- After resolving, they leave the table.
- They are not collected as normal score cards.
- They are worth 0 points.
- If revealed as the first selected card, the player continues selecting.
- If revealed as the second selected card, the first normal selected card flips back after the reveal duration and the turn continues according to the action result.

### Launcher Probability

Launcher-style action cards reuse the UNO Extreme launcher probability:

| Result | Probability |
| --- | ---: |
| 0 cards | 30% |
| 2 cards | 32% |
| 3 cards | 31% |
| 4 cards | 7% |

A result of 0 means no cards are gained or lost.

### Action Cards

#### Lose Cards

- Starts the simulated UNO Extreme launcher.
- The current player loses up to the fired number of collected cards.
- If the player has fewer collected cards than the fired number, they lose only what they have.
- If the player has no collected cards, nothing happens.
- Lost cards leave the round and do not return to the table.

#### Earn Cards

- Starts the simulated UNO Extreme launcher.
- The current player gains the fired number of bonus cards.
- Earned cards come from a separate bonus pile, not from the table.
- Bonus cards count as collected cards.
- Bonus cards are worth 0 points unless later changed.

#### All Other Players Lose Cards

- Starts the simulated UNO Extreme launcher.
- Every other player loses up to the fired number of collected cards.
- Lost cards leave the round.
- The current player is not affected.

#### All Other Players Earn Cards

- Starts the simulated UNO Extreme launcher.
- Every other player gains the fired number of bonus cards.
- Bonus cards come from the bonus pile.
- The current player is not affected.

#### Lose All Cards

- The current player loses all collected cards.
- Lost cards leave the round.
- If the current player has no collected cards, nothing happens.

#### Winner Takes All

- Hard mode only.
- One copy only.
- The current player takes all remaining table cards.
- The round ends immediately.
- The game shows a message that the player revealed "Winner Takes All".

### Winning

- The player with the most collected cards wins.
- Winner Takes All can end the round early.
- If tied, highest collected point total wins.

### Strategy

- Wild cards are valuable because they can complete a pair in any match mode.
- Action cards add risk to unknown selections; a player far ahead may still lose cards.
- Hard mode has the highest swing potential because Winner Takes All and Lose All Cards can reverse the round quickly.

## 3. Guo's Exclusive UNO Triple Memory

### Goal

Find matching triples instead of pairs. Collect the most cards before the board is empty.

### Difficulty

| Difficulty | Grid | Cards | Matches |
| --- | ---: | ---: | ---: |
| Easy | 6 x 3 | 18 | 6 triples |
| Medium | 6 x 6 | 36 | 12 triples |
| Hard | 6 x 8 | 48 | 16 triples |

### Setup

- The app generates a solvable board for the selected match mode.
- All cards start face down.
- Duplicate generated cards are allowed when needed so every board has valid triples.

### Turn Flow

1. The active player selects three face-down cards.
2. All three selected cards are revealed to all players.
3. The app checks the selected match mode.
4. If all three cards match, the active player collects all three cards and plays again.
5. If they do not all match, the three cards stay visible for the reveal duration, then flip face down and the turn passes.
6. Play continues until all table cards have been collected.

### Triple Match Rules

- Number Match: all three cards have the same number.
- Color Match: all three cards have the same color.
- Color + Number Match: all three cards have the same color and number.

### Winning

- The player with the most collected cards wins.
- If tied, highest collected point total wins.

### Strategy

- Triple Memory is more difficult than pair memory because partial information is not enough.
- Remember clusters of three, not just pairs.
- In Number Match, track number groups across the board.
- In Color Match, track where repeated colors appear.
- In Color + Number Match, exact repeated cards are the key targets.

## 4. Guo's Exclusive UNO Triple Memory Action

### Goal

Find matching triples while action cards add surprise effects and luck.

### Difficulty

The board sizes are the same as Guo's Exclusive UNO Triple Memory.

| Difficulty | Grid | Cards |
| --- | ---: | ---: |
| Easy | 6 x 3 | 18 |
| Medium | 6 x 6 | 36 |
| Hard | 6 x 8 | 48 |

### Action Card Counts

Action cards replace some normal board cards. The total grid size stays fixed.

| Difficulty | Action Cards |
| --- | --- |
| Easy | 3 Wild |
| Medium | 3 Wild, 2 Lose Cards, 2 Earn Cards |
| Hard | 3 Wild, 2 Lose Cards, 2 Earn Cards, 1 All Others Lose, 1 All Others Earn, 1 Lose All, 1 Winner Takes All |

The generator must still guarantee that enough valid normal triples remain after action cards are inserted.

### Wild Card

- A Wild matches any number and any color.
- Wild cards stay on the table until matched.
- Wild can complete any triple.
- Examples:
  - Wild + Red 7 + Blue 7 is valid in Number Match.
  - Wild + Red 2 + Red 9 is valid in Color Match.
  - Wild + Red 7 + Red 7 is valid in Color + Number Match.
  - Wild + Wild + any normal card is valid.
  - Wild + Wild + Wild is valid.

### Immediate Action Cards

Immediate action cards use the same rules as Guo's Exclusive UNO Memory Action:

- They resolve immediately when revealed.
- They leave the table after resolving.
- They are worth 0 points.
- They do not count as one of the three matching cards.
- If an action card is revealed as card 1, 2, or 3, it resolves immediately and the player continues selecting until three non-action cards are revealed, unless the board ends or Winner Takes All ends the round.

### Launcher Probability

Launcher-style actions reuse the UNO Extreme launcher probability:

| Result | Probability |
| --- | ---: |
| 0 cards | 30% |
| 2 cards | 32% |
| 3 cards | 31% |
| 4 cards | 7% |

### Action Cards

The available action cards are:

- Lose Cards
- Earn Cards
- All Other Players Lose Cards
- All Other Players Earn Cards
- Lose All Cards
- Winner Takes All

Their effects are identical to Guo's Exclusive UNO Memory Action.

### Winning

- The player with the most collected cards wins.
- Winner Takes All can end the round early.
- If tied, highest collected point total wins.

### Strategy

- Wild cards are stronger than in pair Memory because they can complete difficult triples.
- Revealing an action card does not use up one of the three required normal selections, so action-heavy turns can become unpredictable.
- Hard mode is high-risk because a player can build a strong lead through triples and then lose it through Lose All Cards or Winner Takes All.

## AI Behavior

### Easy AI

- Mostly random card selection.
- Remembers very little or no previous information.

### Medium AI

- Remembers some recently revealed cards.
- Takes known pairs or triples when obvious.
- Does not perfectly optimize action-card risk.

### Hard AI

- Remembers all revealed number and wild card positions.
- Takes known matches whenever available.
- Uses match-mode logic correctly.
- Cannot predict hidden immediate action cards, so the action variants keep meaningful luck.

## UI And Layout Requirements

- Desktop should show the whole board without zoom for every difficulty.
- Tablet should show the whole board initially, with optional zoom/pan for medium and hard grids.
- Smartphone should show the whole board initially, but support pinch zoom and pan.
- Player labels must stay readable and must not overlap the grid.
- The board should have a reserved rectangle separate from player label areas.
- When zoomed, labels should remain outside the zoomed board area.
- Selected cards should have a clear highlight.
- Matched cards should animate or clearly move into the current player's collected area.
- Immediate action cards should show a short result message.
- Launcher action cards should use a hardware-style popup inspired by UNO Extreme.

## Implementation Notes

- These games should use a dedicated 2D canvas layout inside the existing app.
- The memory board generator must guarantee solvable pairs or triples for the selected match mode.
- Action cards should replace normal cards, not increase the grid size.
- Bonus cards are virtual collected cards and should not affect board solvability.
- Local WiFi snapshots must reveal selected cards to all players during the reveal window.
- Hot Seat should use privacy protection between turns, but selected reveal cards are public during the reveal duration.

# Game Rules: Guo's Exclusive Uno Neighbor Match

This variant is based on Uno Classic with the same action cards and optional expansion packs, but number-card matching uses neighbor numbers instead of normal Classic UNO color-or-number matching.

## Supported Modes

- Single vs AI
- Hot Seat
- Local WiFi
- Spectacular

## Supported Players

- 2 to 10 players, following the standard UNO-style player options used by the wider UNO variants.

## Goal

Be the first player to empty your hand. Scoring uses the existing UNO scoring model unless changed during implementation.

## Core Number Matching Rule

When the discard pile or active neighbor state has a number, a number card is playable if it is:

- the same number, or
- one neighboring number before or after it, using wraparound.

## Neighbor Map

| Active Number | Neighbor Numbers |
| ---: | --- |
| 0 | 9 and 1 |
| 1 | 0 and 2 |
| 2 | 1 and 3 |
| 3 | 2 and 4 |
| 4 | 3 and 5 |
| 5 | 4 and 6 |
| 6 | 5 and 7 |
| 7 | 6 and 8 |
| 8 | 7 and 9 |
| 9 | 8 and 0 |

Example: if the active number is 5, playable number cards are 4, 5, and 6.

Example with Yellow 5 on top:

- Any 5 is playable.
- In the Neighbor Number option, any 4 or 6 is playable.
- In the Neighbor Color option, only Yellow 4 or Yellow 6 are playable as neighbor cards.
- Blue 5 is playable and changes the active color to blue.

## Rule Options

The variant should support two matching options.

### Neighbor Number

- Same number is playable in any color.
- Neighbor number is playable in any color.
- Playing a number card changes the active color to that card's color and changes the active neighbor number to that card's number.

### Neighbor Color

- Same number is playable in any color.
- Neighbor number is playable only if the card color matches the active color.
- Playing a same-number card with a different color is allowed and changes the active color to that card's color.
- Playing any number card changes the active neighbor number to that card's number.

## Action Cards

Colored action cards follow the Classic UNO color rule:

- Color match is enough to play a colored action card.
- Same-symbol action matching can remain available, but color match alone is sufficient.
- A colored action card changes the active color to that card's color.
- A colored action card does not change the active neighbor number.

Example: active state is Yellow 5. A Yellow Skip may be played. After Skip resolves, the active color is Yellow and the active neighbor number remains 5.

## Wild Cards

Wild cards are expanded for this variant.

- A Wild card lets the player choose both active color and active neighbor number.
- Wild +4 also lets the player choose both active color and active neighbor number, then applies its draw penalty normally.
- After a Wild chooses Blue 5, the active state is color Blue and neighbor number 5.
- The next playable number cards depend on the selected rule option:
  - Neighbor Number: any 4, 5, or 6.
  - Neighbor Color: any 5, or Blue 4 / Blue 6.

## Expansion Packs

Expansion packs are allowed.

- Expansion action cards keep their existing effects.
- If an expansion card has a number, it should participate in the neighbor-number rule.
- If an expansion card has no number, it follows color, symbol, or wild playability rules as appropriate.
- If an expansion wild card requires a color choice, it should also require an active neighbor number choice unless a later implementation decision says otherwise.

## Active Neighbor Number

The game state needs an `activeNeighborNumber` value.

This value is required because the top discard can be a Wild or an action card without a number.

Rules:

- When a number card is played, `activeNeighborNumber` becomes that card's number.
- When a Wild or Wild +4 is played, the player chooses `activeNeighborNumber`.
- When a colored action card is played, `activeNeighborNumber` stays unchanged.
- When a same-symbol action card is played on another action card, `activeNeighborNumber` stays unchanged.
- If the opening discard is an action card or wild card, the app should choose a random active color and random active neighbor number before the first turn begins.

## Strategy

- Same-number cards are flexible because they can change the active color even in Neighbor Color mode.
- Edge numbers are not weak because 0 wraps to 9 and 1, and 9 wraps to 8 and 0.
- In Neighbor Color mode, controlling the active color is more important because neighbor cards must match color.
- Wild cards are more powerful than in Classic UNO because they set both the active color and the active number target.
- Action cards can preserve a difficult active neighbor number while changing turn pressure.

## UI And Hint Requirements

- The table should show both active color and active neighbor number.
- The hint panel should explain why a card is playable:
  - same number,
  - neighbor number,
  - neighbor number with matching color,
  - action card color match,
  - wild choice.
- When playing Wild or Wild +4, the choice dialog must ask for both color and active neighbor number.
- Rules text should include examples for Yellow 5, Blue 5, 0, and 9.

# Game Rules: Guo's Exclusive Uno Mahjong

This variant applies Traditional Chinese Mahjong gameplay to UNO-inspired 3D Mahjong tiles.

The rules should be a Mahjong-family implementation, not a Classic UNO rules implementation. Visually, it should not be a pure Mahjong clone and should not be flat UNO cards. The expected look is 3D Mahjong tiles with UNO identity: UNO colors, UNO-inspired styling, and Mahjong labels/symbols.

## Supported Modes

- Single vs AI
- Hot Seat
- Local WiFi
- Spectacular

## Supported Players

- Always exactly 4 players.

## Visual Direction

- Reuse the existing Three.js Mahjong table and camera system.
- Keep the existing monitor, tablet, and smartphone Mahjong layout optimizations.
- Keep smartphone pinch zoom, pan while zoomed, bounded pan, and reset zoom.
- Redraw the pieces as 3D Mahjong tiles with UNO-inspired colors and labels.
- The game should feel like "3D Mahjong tiles wearing UNO identity".

## Tile Set

Do not use the literal Classic UNO deck counts. Generate a Mahjong-sized tile set with UNO-themed faces.

| UNO Source | Mahjong Mapping | Copies | Total |
| --- | --- | ---: | ---: |
| Red numbers 1-9 | Wan suit | 4 each | 36 |
| Yellow numbers 1-9 | Bing suit | 4 each | 36 |
| Blue numbers 1-9 | Tiao suit | 4 each | 36 |
| Green honor tiles | East, West, South, North, Red Dragon, Green Dragon, White Dragon | 4 each | 28 |
| Wild/flower tiles | Spring, Summer, Autumn, Winter, Plum, Orchid, Bamboo, Chrysanthemum | 1 each | 8 |

Total: 144 tiles.

## Tile Face Labels

### Red / Wan

- Red 1 to Red 9 map to Wan 1 to Wan 9.
- Chinese display can use `一万` to `九万` or compact `1万` to `9万`.
- English display: `1 Wan` to `9 Wan`.
- German display: `1 Wan` to `9 Wan`.

### Yellow / Bing

- Yellow 1 to Yellow 9 map to Bing 1 to Bing 9.
- Chinese display can use `一饼` to `九饼` or compact `1饼` to `9饼`.
- English display: `1 Bing` to `9 Bing`.
- German display: `1 Bing` to `9 Bing`.

### Blue / Tiao

- Blue 1 to Blue 9 map to Tiao 1 to Tiao 9.
- Chinese display can use `一条` to `九条` or compact `1条` to `9条`.
- English display: `1 Tiao` to `9 Tiao`.
- German display: `1 Tiao` to `9 Tiao`.

### Green / Honors

Green number cards are not used as numbers. Green maps to Mahjong honor tiles:

- `东` East
- `西` West
- `南` South
- `北` North
- `中` Red Dragon
- `发` Green Dragon
- `白` White Dragon

### Wild / Flowers And Seasons

Wild cards are not wild substitutes in this variant. They represent Mahjong flower and season bonus tiles:

- `春` Spring
- `夏` Summer
- `秋` Autumn
- `冬` Winter
- `梅` Plum
- `兰` Orchid
- `竹` Bamboo
- `菊` Chrysanthemum

## Wild / Flower Rule

Wild/flower tiles are bonus tiles, not substitutes.

- When a flower or season is drawn, reveal it immediately.
- Set it aside as a bonus tile for that player.
- Draw a replacement tile.
- Flower/season tiles cannot be used in melds or pairs.
- Recommended v1 scoring: each flower/season gives +1 bonus point.

## Core Mahjong Rules

Reuse the existing Traditional Chinese Mahjong rules engine as much as possible.

- The game is played clockwise with four players.
- Players draw one tile and discard one tile.
- A normal winning hand is four melds plus one pair.
- Melds:
  - Chow: three consecutive numbers in the same suit.
  - Pong: three identical tiles.
  - Kong: four identical tiles.
- Honors cannot form chows.
- Honors can form pongs and kongs.
- Flower/season tiles cannot form melds.
- Claim priority: Win > Kong/Pong > Chow.
- Chow can only be claimed from the previous player's discard.
- Pong and Kong can be claimed from any player's discard.
- Kong draws a replacement tile.

## Recommended V1 Win Patterns

For the first implementation, support only:

- Standard hand: four melds plus one pair.

Do not include advanced special hands in v1 unless implementation time allows.

Potential later additions:

- Seven Pairs
- Thirteen Orphans style pattern adapted to UNO-Mahjong tiles
- All Honors
- Pure One Suit
- Flower/season bonus patterns

## Scoring

Recommended first version:

- Reuse the current Mahjong scoring model.
- Add +1 for each flower/season bonus tile.
- Keep scoring simple and explainable in the rules modal.

Scoring can be expanded later with advanced fan/yaku-style patterns.

## UI And Layout Requirements

- Use the existing Three.js Mahjong table.
- Use 3D Mahjong tile geometry.
- Redesign the tile faces with UNO-inspired color identity.
- Preserve the current Mahjong table polish, zoom/pan behavior, and smartphone readability.
- Player labels, scores, event log, turn panel, hint panel, and claim controls should follow the existing Mahjong UI patterns.
- Tile face text must have strong contrast against tile backgrounds.
- The player should be able to inspect their tiles clearly on smartphone after zooming.

## Translation Requirements

Implement full English, Chinese, and German translations for:

- Game title
- Rules text
- Tile names
- Suit names
- Honor names
- Flower/season names
- Claim/action labels
- Hint text
- Event log text
- Scoring labels
- Strategy examples

## Hint And AI Requirements

Reuse and adapt the existing Mahjong AI and hint system.

- AI should evaluate meld potential, pairs, waits, honors, and dead tiles.
- Hints should explain useful discards and potential melds.
- Hints should use UNO-Mahjong tile names in the selected language.
- Spectacular mode should run with the same Mahjong AI flow.

## Implementation Notes

- Implement as a Mahjong-family variant powered by the existing Mahjong rules, not as a standard UNO variant.
- Add a tile-set/profile layer so Traditional Chinese Mahjong and Guo's Exclusive Uno Mahjong can share the rules engine.
- Add a visual profile for UNO-Mahjong tile faces.
- Local WiFi snapshots must use the correct Mahjong-style private hand visibility.
- Hot Seat mode must keep Mahjong privacy protection while changing players.
- The app start page should list this as a Guo-exclusive later variant.

# Game Rules: Guo's Exclusive Uno Hi-Lo

This variant is based on Uno Classic, but number-card playability is controlled by a table indicator. The indicator points either Higher or Lower and tells players whether the next number card must be strictly higher or strictly lower than the active number.

## Supported Modes

- Single vs AI
- Hot Seat
- Local WiFi
- Spectacular

## Supported Players

- 2 to 10 players, following the standard UNO-style player options used by the wider UNO variants.

## Goal

Be the first player to empty your hand. Scoring uses the existing UNO scoring model unless changed during implementation.

## Deck

Recommended v1 deck:

- Number cards 0-9 in the four standard colors.
- Skip.
- Reverse.
- Draw 2.
- Wild.
- Wild +2.
- Wild +4.

Do not include expansion packs in v1. Expansion compatibility can be added later.

## Hi-Lo Indicator

- A center table indicator is shown left of the deck.
- The indicator points upward for Higher.
- The indicator points downward for Lower.
- The indicator can be visualized like an anchor that rotates after a card is played.
- In reduced-motion mode, the anchor should snap or fade instead of rotating.

## Core Number Rule

Same number is not playable by default.

If the active number is 5:

- Higher allows 6, 7, 8, and 9.
- Lower allows 0, 1, 2, 3, and 4.

The number check is strict:

- Higher means greater than the active number.
- Lower means less than the active number.
- There is no wraparound.

## Rule Options

The variant should support two matching options.

### Hi-Lo Number

- A number card is playable if its number satisfies the current Higher/Lower indicator.
- Color does not matter.
- Playing a number card changes the active color to that card's color.
- Playing a number card changes the active number to that card's number.

### Hi-Lo Color

- A number card is playable only if:
  - its number satisfies the current Higher/Lower indicator, and
  - its color matches the active color.
- Playing a number card changes the active color to that card's color.
- Playing a number card changes the active number to that card's number.

## Edge Dead-End States

There is no wraparound for edge numbers.

- If the active number is 9 and the indicator is Higher, no number card is playable.
- If the active number is 0 and the indicator is Lower, no number card is playable.

In these states, the active player can still:

- play a valid colored action card,
- play a valid same-symbol action card where applicable,
- play a Wild, Wild +2, or Wild +4,
- draw a card and play it immediately if it is playable.

If the player cannot play after drawing, the turn passes normally.

## Indicator Reroll

The indicator is independent and random.

- After every successfully played card, reroll the indicator.
- This includes number cards, action cards, and wild cards.
- The new result is 50% Higher and 50% Lower.
- Wild cards do not choose the indicator direction.

This prevents permanent lock states:

- Example: active number 9 and indicator Higher means no number card is playable.
- If a player plays a Yellow Skip, the indicator rerolls.
- If it becomes Lower, number cards 0-8 can become playable again.
- If it remains Higher, the pressure continues, but players can still draw or use action/wild cards.

## Action Cards

Colored action cards follow Classic UNO color/symbol logic:

- Color match is enough to play Skip, Reverse, or Draw 2.
- Same-symbol action matching can remain available.
- A colored action card changes the active color to that card's color.
- A colored action card does not change the active number.
- After the action card resolves, the indicator rerolls 50/50.

Recommended v1 action effects:

- Skip: next player loses a turn.
- Reverse: direction changes.
- Draw 2: next player draws 2 and loses a turn.

## Wild Cards

Wild cards are expanded for this variant.

- Wild lets the player choose active color and active number.
- Wild +2 lets the player choose active color and active number, then applies a draw-2 penalty.
- Wild +4 lets the player choose active color and active number, then applies a draw-4 penalty.
- Wild cards do not choose the indicator direction.
- After a wild card resolves, the indicator rerolls 50/50.

Example:

- Indicator is Higher.
- A player plays Wild and chooses Blue 9.
- The indicator rerolls after the Wild resolves.
- If it lands Higher, the game is in a 9 Higher dead-end state.
- If it lands Lower, number cards lower than 9 can be played according to the selected rule option.

## Expansion Packs

Do not enable expansion packs in v1.

Possible later compatibility:

- Numbered expansion cards follow the Hi-Lo number rule.
- Colored non-number action cards follow color/symbol playability.
- Wild expansion cards must choose active color and active number.
- Every successfully played expansion card rerolls the indicator.

## Active Number

The game state needs an `activeHiLoNumber` value.

This value is required because the top discard can be a Wild or an action card without a number.

Rules:

- When a number card is played, `activeHiLoNumber` becomes that card's number.
- When a Wild, Wild +2, or Wild +4 is played, the player chooses `activeHiLoNumber`.
- When a colored action card is played, `activeHiLoNumber` stays unchanged.
- If the opening discard is an action card or wild card, the app should choose a random active color, random active number, and random indicator direction before the first turn begins.

## Strategy

- High numbers are powerful when the indicator may reroll to Lower.
- Low numbers are powerful when the indicator may reroll to Higher.
- Playing Wild to choose 9 can create pressure if the indicator lands Higher.
- Playing Wild to choose 0 can create pressure if the indicator lands Lower.
- In Hi-Lo Color mode, color control is as important as number control.
- Action cards can escape dead-end states and force an indicator reroll.

## UI And Hint Requirements

- The table should show active color, active number, and the Hi-Lo indicator.
- The indicator should sit left of the deck and look like a rotating anchor or pointer.
- The hint panel should explain why a card is playable:
  - higher number,
  - lower number,
  - higher/lower with matching color,
  - action color match,
  - action same-symbol match,
  - wild choice.
- When playing Wild, Wild +2, or Wild +4, the choice dialog must ask for color and active number.
- The choice dialog must not ask for indicator direction.
- Rules text should include examples for 5 Higher, 5 Lower, 9 Higher, and 0 Lower.

# Game Rules: Guo's Exclusive Uno Passage

This variant is a UNO-inspired shedding and pairing game. It does not use normal Classic UNO playability. Instead, players take one card, try to pair it with a card from their hand, score completed pairs, and then pass one card forward either face up or face down.

## Supported Modes

- Single vs AI
- Hot Seat
- Local WiFi
- Spectacular

## Supported Players

- 2 to 4 players.

## Goal

Be the first player to empty your hand. The first player out wins the round and receives a quickest-run bonus.

## Session Target

The setup screen should allow a session target:

- 100 points
- 200 points default
- 300 points
- 400 points
- 500 points

The first player to reach or exceed the session target wins the session.

## Starting Hand

- Default starting hand size: 7 cards.
- Setup options: 5, 6, 7, 8, 9, or 10 cards.
- UNO declaration is not used.

## Deck

This variant does not use 0 cards.

Recommended v1 deck:

- Number cards 1-9 only.
- Four standard colors: red, yellow, green, blue.
- Two copies per color and number.
- Four traditional Wild cards.
- No Skip, Reverse, Draw 2, Wild +4, or expansion-pack cards in v1.

Deck count:

- `9 numbers x 4 colors x 2 copies = 72 number cards`
- `4 Wild cards`
- Total: `76 cards`

## Table Areas

Use three separate take sources:

1. Face-up slot: exactly one visible card available to take.
2. Face-down passage slot: exactly one hidden card passed by the previous player.
3. Draw deck: random face-down stock.

The face-up slot and face-down passage slot are not multi-card piles. Each slot can hold at most one card. When a player passes a new card to one of these slots, the new card replaces the previous card in that slot.

Replaced slot cards are non-scoring discarded cards. They go into a separate refill discard pool. If the draw deck becomes empty, this refill pool can be shuffled back into the draw deck. Completed scoring pairs never enter this refill pool.

Do not mix the current face-down passage slot into the draw deck. Keeping these areas separate makes the game easier to understand and implement.

## Turn Flow

1. The active player takes one card from one of three sources:
   - face-up slot,
   - face-down passage slot,
   - draw deck.
2. With the taken card, the player may build exactly one pair using one card from their hand.
3. If a pair is built, both cards leave the round as a scoring pair for that player.
4. If no pair is built, the taken card becomes part of the player's hand.
5. The player must then pass one card from hand:
   - face up to the face-up slot, or
   - face down to the passage slot.
6. Turn passes clockwise.
7. If pairing empties the player's hand, the player wins immediately before passing.
8. If passing empties the player's hand, the player wins immediately after passing.

## Pair Modes

The game supports three pair-building options.

### Number Pair

Default mode.

- Two cards pair if their numbers match.
- Color does not matter.

Example: Yellow 2 pairs with Green 2.

### Color Pair

- Two cards pair if their colors match.
- Number does not matter.

Example: Red 1 pairs with Red 8.

### Color + Number Pair

- Two cards pair only if both color and number match.

Example: Red 2 pairs with Red 2 only.

## Wild Cards

Wild cards are pairing helpers.

- A Wild can pair with any one number card.
- When using a Wild, the player declares color and number.
- The declared number determines the Wild's score value.
- Wild cannot be passed with a declaration. It is declared only when used in a pair.
- In Number Pair mode, the declared number must match the paired card's number.
- In Color Pair mode, the declared color must match the paired card's color.
- In Color + Number Pair mode, both declared color and declared number must match the paired card.

## Scoring

- Number cards score their face value.
- Wild cards score the declared number when used in a pair.
- Pair score is the sum of both paired card values.
- The first player to empty their hand gets a +10 quickest-run bonus.
- A detailed round score modal should show:
  - each completed pair,
  - points from each pair,
  - Wild declarations,
  - quickest-run bonus,
  - round total,
  - session total.

Examples:

- Yellow 2 + Green 2 scores 4 points.
- Red 5 + Wild declared Red 5 scores 10 points.

## Draw Deck Refill

If the draw deck is empty, reshuffle non-scoring discarded cards into the draw deck.

This follows the spirit of Uno Classic's draw-pile refill, where the current top discard remains available and the rest of the discard pile is shuffled back into the draw pile.

For Uno Passage:

- Completed scoring pairs stay out of the round and are never reshuffled.
- The current face-up slot card stays available and should not be shuffled away.
- The current face-down passage slot stays available and should not be shuffled away.
- Only non-scoring discarded cards that are not currently in the face-up slot or passage slot can be reshuffled into the draw deck.

This keeps the three take options available as much as possible:

1. take from face-up slot,
2. take from face-down passage slot,
3. draw from deck.

If the draw deck is empty and there are no non-scoring discarded cards to reshuffle, drawing from deck is temporarily unavailable until a future pass creates refill material.

## End Of Round

The round ends immediately when a player empties their hand.

- The winner receives the +10 quickest-run bonus.
- Other players keep the points they already scored from completed pairs.
- Cards still in hand do not score for their owners.
- Scoring pairs remain visible in the score detail.

## Strategy

- Taking the face-up pile card is safer because everyone can see it.
- Taking the face-down passage card may be stronger but carries uncertainty.
- Passing face up can tempt the next player or control what they know.
- Passing face down can hide information and create pressure.
- In Number Pair mode, tracking numbers is most important.
- In Color Pair mode, color distribution matters more than card value.
- In Color + Number Pair mode, Wild cards are very valuable because exact pairs are harder.

## AI Requirements

- Easy AI can choose sources and pass cards mostly randomly.
- Medium AI should prefer visible cards that immediately create a pair.
- Hard AI should remember recently passed visible cards, evaluate pair chances, and choose whether to pass face up or face down strategically.

## UI And Hint Requirements

- The table should clearly show:
  - draw deck,
  - face-up pile,
  - face-down passage slot,
  - each player's card count,
  - each player's round points.
- The active player should see clear take-source buttons or clickable table areas.
- After taking a card, the hint panel should show possible pairs from hand.
- If no pair is possible, the hint panel should recommend a pass card.
- Passing face up or face down should be an explicit choice.
- The score modal should explain the quickest-run bonus and each pair's point value.
