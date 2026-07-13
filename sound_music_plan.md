# Sound And Background Music Plan

This document records the agreed direction for later sound effects and background music implementation. It is a planning document only; implementation should start only after explicit confirmation.

## Goals

- Add sound effects that make actions feel clear and responsive.
- Keep long sessions comfortable by making background music optional.
- Use reusable, generic audio assets instead of copying sounds from licensed brands.
- Support the existing three-language UI through localized labels and settings text.
- Keep audio lightweight enough for browser and future Android APK packaging.

## Audio Layers

### Sound Effects

Sound effects should be on by default. They should be short, clear, and never block gameplay.

Recommended categories:

- Card actions: shuffle, deal, draw, play to discard pile, penalty draw stream, invalid move.
- UI actions: button tap, option selection, popup open, popup close, countdown, card reveal.
- Round events: UNO warning, round win, session win, score screen.
- Hardware-style games: launcher fire, blast pressure build, blast release, Roboto beep, Roboto instruction, Tippo tray tilt, dice roll.
- Memory games: card flip, mismatch soft tap, match chime, action-card reveal.
- Mahjong: tile draw clack, discard tap, chow claim, pong claim, kong claim, win gong.

### Background Music

Background music should be off by default. It should be optional because many rounds can take a long time.

Recommended music moods:

- Classic table: soft lounge or light jazz loop.
- Mahjong: calm guzheng or Chinese instrumental loop.
- Kids and pop-culture UNO variants: playful arcade-style loop.
- Guo exclusive games: light premium puzzle music with a golden, celebratory feeling.

Music loops should be seamless, low volume, and easy to disable.

## Settings

Recommended settings:

- Master volume.
- Sound effects volume.
- Background music volume.
- Sound effects on/off.
- Background music on/off.
- Optional later setting: action-card voice or announcer on/off.

Recommended defaults:

- Sound effects: on.
- Background music: off.
- Master volume: medium.
- Sound effects volume: medium-high.
- Background music volume: low.

## Copyright And Brand Safety

All audio should be original, generic, generated, purchased with a suitable license, or from a clearly permissive source.

Do not copy real sounds, music, jingles, voices, or recognizable audio cues from licensed brands such as Mario, Sonic, Barbie, NFL, Star Trek, DC, Spider-Man, TMNT, Avatar, Monster High, or other official editions.

The themed games can still feel different through generic mood, instrument choice, rhythm, and UI timing.

## Recommended First Slice

The first implementation slice should focus on the highest-value reusable effects:

1. Shuffle/deal sound.
2. Draw card sound.
3. Play card to discard pile sound.
4. Penalty draw stream sound.
5. Invalid move sound.
6. Match and mismatch sounds for memory games.
7. Round win sound.
8. Session win sound.
9. One generic hardware fire/release sound reusable for UNO Extreme, UNO Blast, UNO Tippo, UNO Roboto-style popups, and similar hardware simulations.

## Later Slices

### Hardware-Specific Sounds

- UNO Extreme launcher build-up and fire.
- UNO Blast pressure build and release.
- UNO Roboto electronic beep and instruction cue.
- UNO Tippo tray wobble and tip.
- UNO Dice roll and settle.

### Mahjong-Specific Sounds

- Tile wall build.
- Tile draw.
- Tile discard.
- Chow, pong, kong, and win cues.
- Optional table ambience for Mahjong themes.

### Memory-Specific Sounds

- Card flip.
- Match success.
- Mismatch return.
- Action-card reveal.
- Winner-takes-all cue.

### Background Music

- Add one neutral loop first.
- Add one Mahjong loop second.
- Add one Guo exclusive puzzle loop third.
- Add optional table-theme-specific loops later.

## Implementation Notes

- Audio playback should be driven by game events, not by visual state alone.
- If an animation is skipped, the related key sound should still play once unless sound effects are disabled.
- If reduced motion is enabled, audio can remain enabled, but dramatic layered sounds should stay modest.
- In WiFi mode, clients should play local sound effects for the events they receive, but sound must not affect game synchronization.
- In Hot Seat mode, audio must not reveal hidden private information.
- In Spectator mode, all public sounds can be played normally.
- On mobile browsers and Android APK, audio may require the first user interaction before playback. The app should unlock the audio context from a button tap or first setup interaction.

## Asset Guidelines

- Prefer short `.mp3`, `.ogg`, or `.wav` assets depending on browser/APK compatibility.
- Keep most effects under one second.
- Keep background loops compact and compressed.
- Normalize loudness so effects do not surprise the player.
- Use a small reusable sound map keyed by game event names.

## Open Decisions

- Whether to include voice/announcer effects in the first release.
- Whether each table theme should select a different music loop automatically.
- Whether background music should remember the last chosen track or only the on/off state.
- Whether to allow per-game audio profiles later.
