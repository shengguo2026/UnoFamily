# Q2 Smartphone And Tablet QA Checklist

Q2 remains open until these checks are confirmed on touch devices. Use a current Chrome-based browser where possible and record the operating system, browser, viewport, and game for each failure.

## Device Matrix

| Device class | Viewport | Orientation | Result | Notes |
| --- | --- | --- | --- | --- |
| Small phone | 360 x 800 | Portrait | Pending | Narrow-width baseline |
| Phone | 390 x 844 | Portrait | Pending | Primary phone baseline |
| Phone | 844 x 390 | Landscape | Pending | Short-height baseline |
| Large phone | 412 x 915 | Portrait | Pending | Large-phone baseline |
| Tablet | 768 x 1024 | Portrait | Pending | Compact tablet baseline |
| Tablet | 1024 x 768 | Landscape | Pending | Landscape tablet baseline |

Repeat representative checks in English, Chinese, and German. During a live game, rotate from portrait to landscape and back; the canvas must redraw immediately without stretching, blank regions, or stale hit targets.

## Setup And Navigation

- The full game list and every setup panel are reachable by vertical touch scrolling.
- There is no horizontal page scrolling.
- Selects, checkboxes, sliders, segmented controls, and start/back buttons respond reliably to touch.
- Long German labels wrap without covering controls; Chinese labels remain readable.
- Focusing a text input does not leave a dialog or primary action permanently hidden behind the software keyboard.

## Table And Touch Input

- Toolbar controls fit in portrait and landscape without covering the title or table.
- The table keeps usable space above the control dock at each viewport.
- A short tap plays a valid card exactly once.
- A long press shows the card tooltip without also playing the card when released.
- Invalid cards do not play and their tooltip remains readable.
- Scrollable score, log, action, and dialog regions move independently without dragging the table.

## Representative Games

- Classic UNO with two and four players.
- UNO Party or All Wild with more than four players.
- DOS, Phase 10, Skip-Bo, Skyjo, and UNO Zero.
- One 4x4 Memory game and the largest available Memory grid.
- Traditional Mahjong and UNO Mahjong, including tap selection, one-finger pan, and two-finger zoom.

Check that hands, player labels, draw/discard areas, custom center piles, grids, and control panels do not overlap incoherently.

## Animations

- Flourish, deal, and reveal remain separate and fit within both orientations.
- Play, draw, penalty stream, and winner celebration remain correctly framed.
- Release the winning card without tapping again; the celebration must remain visible for three seconds before scoring.
- Tap the winner celebration once and confirm it skips immediately to scoring.
- Hardware, Memory, and Mahjong animations remain readable and return control after completion.
- Repeat with Fast, Normal, Slow, disabled animations, and Reduced Motion.

## Audio

- With music enabled before starting, the first interaction unlocks audio and playback begins.
- Effects and music sliders respond while the device uses speakers and headphones.
- Switching games changes music without overlapping loops.
- Background the browser/app, resume it, interact once if required, and confirm audio recovers.
- High volume does not clip or overpower important effects.

## Reporting

For each failure, provide the device or viewport, orientation, language, game, player count, exact action, and screenshot. Q2 can be marked complete after all matrix rows pass or reported defects are corrected and retested.
