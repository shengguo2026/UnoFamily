# Q1 Desktop And Laptop QA Checklist

Q1 remains open until these checks are manually confirmed. Test with the browser maximized, developer tools closed, and no operating-system display magnifier unless the row explicitly requests zoom.

## Viewport Matrix

| Viewport | Browser zoom | Result | Notes |
| --- | --- | --- | --- |
| 1280 x 720 | 100% | Pending | Small laptop baseline |
| 1366 x 768 | 100% | Pending | Common laptop baseline |
| 1366 x 768 | 125% | Pending | Effective width exercises the three-column dock |
| 1440 x 900 | 100% | Pending | Medium desktop baseline |
| 1920 x 1080 | 100% | Pending | Full-HD baseline |

Repeat representative text checks in English, Chinese, and German.

## Setup And Navigation

- The complete game collection can be reached by normal vertical scrolling.
- Setup panels do not create horizontal page scrolling.
- Game, mode, player count, themes, animation settings, and audio controls remain readable and operable.
- Long German labels wrap without covering controls; Chinese labels are not clipped.
- Setup header buttons remain visible at 125% zoom.

## Standard Table

Use Classic UNO with two players and then four players.

- Toolbar controls remain on-screen and the game title truncates cleanly when necessary.
- The table canvas receives the remaining height without covering the toolbar or control dock.
- At 125% zoom, the control dock reflows to three columns and two rows with no clipped panels.
- Player labels, hands, draw pile, and discard pile do not overlap incoherently.
- Turn, action, recommendation, score, and event-log panels remain independently scrollable when content is long.

## Representative Layouts

- Large-player game: UNO Party or All Wild with more than four players.
- Custom center layout: DOS.
- Large hand layout: Phase 10.
- Multi-pile layout: Skip-Bo.
- Grid layout: Skyjo or UNO Zero.
- Memory layout: one 4x4 game and one largest available grid.
- Traditional Mahjong and UNO Mahjong.

For each, confirm that the table remains usable at 1280 x 720 and 1366 x 768 at 125% zoom, with no card, label, center-pile, or dock overlap.

## Animations And Audio

- Flourish, deal, and final reveal remain distinct stages.
- Play, draw, penalty stream, and winner celebration stay inside the viewport.
- Release the winning card without clicking again; the celebration must remain visible for three seconds before scoring.
- Hardware, Memory, and Mahjong animations do not obscure required controls after completion.
- Fast, Normal, Slow, disabled, and Reduced Motion settings behave as configured.
- Sound and music toggles and volume sliders remain reachable.
- Rapid effects at high volume do not audibly clip; changing games does not overlap music themes.

## Dialogs And Overlays

- Rules content scrolls while its header and close button remain reachable.
- Color, target, two-target, liar, and game-specific choice dialogs fit or scroll vertically.
- Hot Seat handoff, score, Mahjong result, and winner overlays remain centered and dismissible.
- Tooltips do not cover the card being inspected or leave the viewport.

## Reporting

For each failure, provide the viewport, browser zoom, language, game, player count, and a screenshot. Q1 can be marked complete after every row and section passes or any reported defects are corrected and retested.
