# More Games and UNO Quatro Refined Specification

**Status:** Ready for implementation planning  
**Date:** 2026-07-27  
**Project:** UnoFamily  
**Languages:** English (`en`), Simplified Chinese (`zh`), German (`de`)

## 1. Product outcome

Add a password-gated “More games” entry after “Guo's Exclusive Uno Passage”
on the home screen. The gate must not disclose which games exist behind it.
The first gated game will be UNO Quatro, implemented as a distinct
two-player, tile-placement game with its own rules engine, AI, HTML canvas
renderer, CSS interface, animations, sound cues, hints, strategy guidance,
and localized rules.

This work is split into two independently testable releases:

1. the “More games” tile and secure access gate;
2. the complete two-player UNO Quatro game.

## 2. More games tile and access gate

### 2.1 Home-screen tile

- Place one enabled tile immediately after “Guo's Exclusive Uno Passage”.
- The only game-identifying text on the tile is “More games”.
- Use a Platinum visual treatment based on `#E5E4E2`, with accessible dark
  foreground text, a visible focus state, and equivalent dark/light-theme
  contrast.
- Do not show the number, names, thumbnails, descriptions, or availability
  of games behind the tile.

### 2.2 Unlock modal

Selecting “More games” opens an accessible modal while the home screen stays
behind it.

- Render one `<input type="password">`.
- Every entered character must remain masked. Do not add a reveal control,
  preview, tooltip, copied value, console output, analytics field, or log.
- The modal contains exactly two actions:
  - **Cancel:** clear the input, close the modal, and leave the user on the
    home screen.
  - **Confirm:** submit the password for server-side verification.
- Pressing Enter submits the form. Pressing Escape has the same result as
  Cancel.
- Focus moves to the password field when the modal opens and returns to the
  “More games” tile when it closes.
- While verification is pending, prevent duplicate submissions.
- A failed attempt shows only a localized generic message such as
  “Unable to unlock a game.” It must not reveal whether a game exists, which
  password was expected, or how close the input was.
- A successful attempt clears the input and navigates directly to the setup
  screen of the game mapped to that password. Do not display a hidden-games
  catalog.

### 2.3 Password handling

- Do not put any real password or reversible secret in `src/`, `public/`,
  tests, documentation, git history, browser storage, URLs, or WebSocket
  messages.
- Do not compare a password in the React bundle. A client-only comparison,
  including comparison against a client-side hash, would expose an
  offline-verifiable secret.
- Verify passwords in `server/local-wifi-server.mjs`.
- Provision only salted `scrypt` verifiers through the untracked environment
  variable `UNO_MORE_GAMES_VERIFIERS`. The value is a JSON object keyed by
  stable game ID; each value is `<salt-hex>:<derived-key-hex>`.
- Add a local, non-networked script that reads a password from a masked
  terminal prompt and prints its salted verifier. The script must never echo
  the password or write it to disk.
- Compare derived keys with `timingSafeEqual`.
- Add per-client throttling and return the same response shape and status for
  all failed attempts.
- Never log request bodies, submitted passwords, derived keys, salts, or
  successful game mappings.
- The current application is intended for a trusted local network. The gate
  prevents casual discovery; it is not a substitute for public-internet
  authentication. Continue to follow the README warning not to expose the
  development services publicly.

## 3. UNO Quatro supported modes

UNO Quatro always has exactly two seats. The player-count control is hidden or
fixed at `2`.

- **Single vs AI:** one local human and one AI.
- **Hot Seat:** two local humans with the existing hand-privacy handoff.
- **Local WiFi:** one host seat and one joining seat; the host remains
  authoritative.
- **Spectacular:** two AI players with the existing configurable AI delay.

No UNO Quatro mode supports a third or fourth player.

## 4. Official game model

The implementation follows Mattel's official English instruction sheet for
product HPF82, with the project's explicit two-player restriction.

### 4.1 Components and setup

- Use 44 unique tiles in four colors: red, green, yellow, and blue.
- Values are `0` through `5`.
- Some tiles also have one action: `swap`, `push`, or `minus2`.
- Use seven vertical trays, modeled as seven columns with six visible slots
  per tray.
- Put all 44 tiles into the bag, animate the bag shaking, and deal three
  random tiles to each player with one visible deal animation per tile.
- Seat 1 starts because the application does not collect player ages. The
  localized rules explain this digital substitution for the physical
  “youngest player starts” rule.

### 4.2 Legal placement

- A played tile enters at the top of one selected tray and falls to the
  lowest open slot.
- A non-Push tile cannot be played into a full tray.
- A Push tile may be played into a full tray because its action ejects the
  bottom tile.
- Evaluate a Push tile's color/number match at the slot it will occupy after
  the mandatory push, including when the tray was full before placement.
- If the tile's landing position touches no existing tile horizontally,
  vertically, or diagonally, any tile is legal.
- If it touches one or more tiles, it must match at least one adjacent tile
  by color or number. It does not have to match every adjacent tile.
- Once placed, a board tile is neutral: either player may use it to form a
  later match. Board tiles do not retain player ownership.
- Highlight every hand tile that has at least one legal destination.
- After selecting a movable tile, highlight every legal tray and suppress
  interaction with illegal trays.

### 4.3 Normal turn

1. Select a legal hand tile.
2. Select a legal tray.
3. Animate the tile dropping and settling into its slot.
4. Resolve the action symbol, if any.
5. Check for a win after the complete action has resolved.
6. If there is no winner, draw from the bag until the active player has three
   tiles, animate each draw, and pass the turn.

Inputs remain locked while a blocking animation is running.

### 4.4 No playable tile

The exchange action is available only when none of the active player's hand
tiles has a legal destination.

1. The player selects one hand tile to return to the bag.
2. Animate that tile moving into the bag and mix it back into the random pool.
3. Draw one random replacement tile and animate it moving from the bag into
   the hand.
4. If the replacement has a legal destination, the player may immediately
   play it.
5. If the replacement is not playable, the turn ends.
6. The hand ends the turn with three tiles.

### 4.5 Action tiles

#### Swap

- After the Swap tile settles, the active player must select two different
  trays.
- Animate both complete tray stacks lifting, crossing, and settling in their
  new positions.
- Play a dedicated swap sound synchronized to the movement.
- Swap is mandatory and may create the winning line.

#### Push

- After the Push tile enters a non-empty tray, push the new tile and all
  existing tiles down by one slot.
- Animate the bottom tile leaving the board and returning to the bag.
- Play a dedicated push/ejection sound.
- Push is mandatory for a tray that was non-empty before the tile was played.
- If the Push tile is played into an empty tray, offer a localized choice to
  keep it as the sole tile or push it out, matching the official exception.
- A Push tile may be played into a full tray.

#### Minus 2

- Randomly choose two tiles from the opponent's three-tile hand and return
  them to the bag with staggered animations and a dedicated penalty sound.
- The opponent takes the next turn with the one remaining tile.
- At the end of that opponent's turn, refill the hand to three with two
  animated random draws.

The official rule above intentionally differs from an immediate two-tile
replacement. Immediate replacement would remove the official one-tile-turn
penalty and is therefore not part of this implementation.

### 4.6 Winning

- After the active player's placement and mandatory action finish, scan the
  final board for four adjacent tiles in a straight horizontal, vertical, or
  diagonal line.
- The four tiles must all share one color or all share one number.
- Because placed tiles are neutral, the active player wins if their completed
  move leaves any valid four-tile line on the board.
- End immediately after the action and win check. Do not calculate round,
  card, or session scores.
- Show a localized winning overlay containing the winner's localized name and
  a fireworks animation.
- Offer exactly two post-win actions:
  - return to the UNO Quatro setup screen;
  - start a fresh UNO Quatro game with the same settings.

## 5. Visual and audio direction

- Build a dedicated `QuatroCanvas` with the HTML Canvas 2D API.
- Use CSS for the responsive table shell, controls, modal surfaces,
  hand-privacy overlay, and winner overlay.
- Draw a distinct seven-tray board, dimensional plastic tiles, colorblind
  symbols, numbers, action marks, bag, and hand tiles. Do not reuse standard
  UNO card rectangles as the principal visual.
- Colorblind marks follow the official mapping:
  - red: triangle;
  - green: circle;
  - yellow: star;
  - blue: diamond.
- Scale the canvas for device pixel ratio while using CSS pixels for layout
  and hit testing.
- Support mouse, touch, and keyboard-equivalent controls.
- Respect the existing reduced-motion setting. Reduced motion uses short
  fades and immediate state transitions while preserving every rule and
  sound setting.
- Add distinct synthesized sound cues for bag shake, tile deal, tile drop,
  tray swap, push/eject, Minus 2 return, exchange return, exchange draw, and
  win.
- Continue to honor master volume, effects volume, and the sound-effects
  toggle.

## 6. Help, hints, rules, and strategy

Provide all text in English, Simplified Chinese, and German.

- **Rules:** objective, setup, placement legality, normal turn, no-play
  exchange, each action tile, winning, and the two-player mode restriction.
- **Action reference:** visual examples and concise behavior for Swap, Push,
  and Minus 2.
- **Strategy:** build threats in two directions; retain colors/numbers that
  connect to several board regions; use Swap to create a line or break the
  opponent's threat; use Push to change vertical and diagonal geometry;
  consider the opponent's lone tile after Minus 2; avoid opening a forced
  win.
- **Live hint:** identify legal hand tiles and trays, explain why an item is
  legal or blocked, recommend an action without exposing an AI player's hand,
  and explain mandatory pending choices.

## 7. AI requirements

- Easy AI chooses randomly among legal moves and valid action choices.
- Medium AI wins immediately when possible, blocks an immediate opponent win,
  then scores remaining legal moves by line potential.
- Hard AI evaluates placement plus resolved Swap/Push/Minus 2 outcomes using
  a bounded two-ply search with deterministic tie-breaking in tests.
- AI must use the same pure legality and transition functions as human and
  WiFi actions.
- AI must never read hidden future bag order when scoring a move.

## 8. Networking and privacy

- The WiFi host validates every UNO Quatro action with the pure rules engine.
- Add UNO Quatro state and actions to the existing WiFi snapshot protocol.
- Each client snapshot contains only that client's hand; the opponent's tiles
  are represented by a count and hidden backs.
- Random selection, bag draws, Minus 2 selection, and AI choices happen only
  on the authoritative host.
- Reconnecting clients receive the latest private snapshot and animation
  sequence number without replaying stale effects.

## 9. Acceptance criteria

- “More games” is the first tile after “Guo's Exclusive Uno Passage” and has
  a Platinum background.
- No hidden game name or real password appears before successful
  verification, in the frontend bundle, or in committed files.
- Cancel reliably returns to the unchanged home screen.
- Correct verification routes to UNO Quatro setup; failed verification leaks
  no mapping information.
- UNO Quatro always starts exactly two players with three tiles each.
- All official placement, exchange, Swap, Push, Minus 2, and win behaviors are
  enforced by pure tested rules.
- Every required movement has a visible reduced-motion-aware animation.
- Every required action has an independently testable sound cue.
- Legal moves are visibly highlighted.
- Rules, action reference, strategy, hints, errors, and winning UI are
  complete in `en`, `zh`, and `de`.
- No score is shown or calculated.
- The winning overlay names the winner, animates fireworks, and offers setup
  or a fresh game.
- Single, hot-seat, two-seat WiFi, and two-AI spectacular modes pass behavior
  and responsive browser checks.

## 10. Rule sources

- Mattel Consumer Support, product HPF82 and official English instruction
  sheet: `https://service.mattel.com/instruction_sheets/HPF82-4B70_4LB_IS.pdf`
- Mattel product page for UNO Quatro:
  `https://shop.mattel.com/products/uno-quatro-hpf82`

The official instruction sheet is authoritative when secondary summaries
disagree.
