# Audio Asset Policy

## Current Baseline

No binary audio assets are currently shipped. Sound effects and music are original procedural synthesis implemented with the Web Audio API in `src/game/sound.ts`. This keeps the browser build and a future APK audio payload at zero bytes and avoids copied brand, commercial, or third-party recordings.

The effects bus and music bus each use a dynamics compressor to limit overlapping generated voices. Generated instrument samples are cached only in memory and capped at 64 entries for mobile stability.

## Future Asset Rules

- Prefer MP3 or OGG for longer loops and WAV only for very short effects.
- M4A/AAC may be used only after both browser and Android WebView playback are confirmed.
- MIDI files are source-only because browsers and Android WebView do not provide native MIDI-file playback. Convert them to an approved format or reproduce the arrangement with the existing synthesizer.
- Keep each file below 1.5 MB and the complete shipped audio payload below 4 MB.
- Record the creator, source, license, and modification history before adding any audio file. Brand sounds and unlicensed recordings are prohibited.
- Run `npm run check:audio`; the production build runs the same audit automatically.

## Browser And APK Readiness

The runtime uses standard `AudioContext`, oscillator, buffer-source, gain, and compressor nodes. Audio remains locked until a user interaction, matching browser and Android WebView autoplay requirements.

There is no Android wrapper in this repository yet. After the planned APK migration, validate on a physical Android 12+ device:

1. Install a release APK and confirm no audio files are omitted from its packaged web assets.
2. Enable audio after the first tap and test effects plus every music theme.
3. Background and resume the app, then confirm music does not overlap or remain silent.
4. Test speaker and headphones at 100% volume for clipping, distortion, and acceptable balance.
