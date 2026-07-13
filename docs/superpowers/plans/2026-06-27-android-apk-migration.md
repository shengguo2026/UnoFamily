# Android APK Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the Uno Family app, including all 24 games after Mahjong is added, as an installable Android APK using Capacitor.

**Architecture:** Treat the existing Vite/React app as the canonical UI and game runtime, then wrap the built web bundle in Capacitor Android. Keep all local/offline game modes inside the APK first. Treat Local WiFi hosting as a separate migration problem because the current host uses a Node.js server process that does not run inside a normal Capacitor Android WebView.

**Tech Stack:** React 19, Vite, TypeScript, Capacitor Android, Android Studio/Gradle, Android WebView, existing Node Local WiFi server for desktop-hosted rooms.

---

## Documentation Format Recommendation

Use **Markdown** for planning and developer documentation in this repository.

Reasons:
- Markdown is easier to review in git diffs.
- Markdown is easier for Codex and humans to update incrementally.
- Markdown can be rendered to HTML later for a polished manual.
- Markdown keeps implementation checklists close to the code without extra styling noise.

Use **HTML** only for a final user-facing manual, embedded help page, or visual showcase where layout and styling matter more than clean diffs.

---

## Feasibility Summary

APK packaging is feasible for:
- Single Player vs AI.
- Hot Seat.
- Spectacular mode.
- All local rules, hints, translations, sounds, animations, and themes.
- Mahjong Three.js rendering, subject to Android WebView performance testing.

APK packaging is partially feasible for:
- Joining a Local WiFi room hosted by the desktop app.
- Connecting to another host on the same network if Android network permissions and cleartext/local URL policy are configured correctly.

APK packaging is not directly feasible for:
- Running the current `server/local-wifi-server.mjs` Node host inside the Android APK.

Recommended first Android release:
- APK supports all 24 games locally.
- APK can optionally join desktop-hosted Local WiFi rooms.
- Phone-as-host is deferred to a later native networking slice.

---

## Planned File Structure

- Create `capacitor.config.ts`: app id, app name, webDir, Android configuration.
- Create `android/`: generated Capacitor Android native project.
- Modify `package.json`: add Capacitor dependencies and scripts.
- Modify `vite.config.ts` if needed: stable base path and build output assumptions.
- Modify `src/App.css` and/or `src/index.css`: Android safe area, viewport, touch behavior.
- Modify `src/network/localWifi.ts`: Android-friendly host URL handling and client-only fallback copy.
- Modify `server/local-wifi-server.mjs`: no APK runtime use; keep desktop host behavior.
- Create `docs/android-testing.md`: manual installation and test checklist.
- Create or extend `tests/` only if packaging-related pure functions are added.

---

## Task Breakdown

### Task 1: Confirm APK Scope And Mode Policy

**Files:**
- Create: `docs/android-testing.md`

- [ ] Document first APK scope as: local Single Player, Hot Seat, Spectacular, and all 24 games.
- [ ] Document WiFi scope as: Android client can join a desktop-hosted Local WiFi room if network policy allows it.
- [ ] Document phone-as-host as deferred because the current host is `server/local-wifi-server.mjs`.
- [ ] Add a user-facing note for APK WiFi mode: "Host rooms from the desktop app for this version."
- [ ] Estimated tokens: 1k-2k.

### Task 2: Add Capacitor Dependencies And Config

**Files:**
- Modify: `package.json`
- Create: `capacitor.config.ts`

- [ ] Install `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android`.
- [ ] Add scripts:
  - `android:init`: initialize or verify Capacitor config.
  - `android:sync`: run `npm run build` then `npx cap sync android`.
  - `android:open`: run `npx cap open android`.
- [ ] Configure `appId`, for example `com.unofamily.app`.
- [ ] Configure `appName`, for example `Uno Family`.
- [ ] Configure `webDir` as `dist`, matching Vite output.
- [ ] Estimated tokens: 2k-3k.

### Task 3: Generate Android Project

**Files:**
- Create: `android/`
- Modify: `.gitignore` only if generated local-only files need ignoring.

- [ ] Run `npm run build`.
- [ ] Run `npx cap add android`.
- [ ] Run `npx cap sync android`.
- [ ] Open with `npx cap open android`.
- [ ] Verify Android Studio can sync Gradle.
- [ ] Estimated tokens: 1k-2k, excluding Android Studio download/setup time.

### Task 4: Android Viewport, Safe Area, And Touch Polish

**Files:**
- Modify: `src/index.css`
- Modify: `src/App.css`

- [ ] Add safe-area padding using `env(safe-area-inset-*)` fallback variables.
- [ ] Ensure app root uses stable full-height behavior for Android WebView.
- [ ] Audit fixed headers, bottom action areas, and game canvases for notches/navigation bars.
- [ ] Add touch-action rules where needed so cards/tiles can be selected without browser gestures fighting the app.
- [ ] Recheck previously sensitive layouts: Skyjo, Cabo, DOS, Phase 10, Skip-Bo, Mahjong.
- [ ] Estimated tokens: 3k-6k.

### Task 5: Offline Asset And Build Audit

**Files:**
- Modify: `src/assets/` only if missing assets are discovered.
- Modify: `vite.config.ts` only if base path causes asset failures.

- [ ] Verify the app does not rely on remote images, fonts, scripts, or APIs for normal play.
- [ ] Ensure all generated card/tile graphics, sounds, and Three.js textures work from packaged assets.
- [ ] Run `npm run build`.
- [ ] Run Vite preview and inspect built `dist` before syncing to Android.
- [ ] Estimated tokens: 2k-4k.

### Task 6: Android WebView Audio Policy

**Files:**
- Modify: `src/game/sound.ts`
- Modify: `src/App.tsx` only if an explicit audio unlock control is needed.

- [ ] Ensure audio context starts only after a user gesture.
- [ ] Add or reuse a visible mute/sound toggle that unlocks audio on first tap.
- [ ] Confirm no sound errors occur when Android blocks autoplay.
- [ ] Test launcher/dice/Mahjong tile sounds after touch interaction.
- [ ] Estimated tokens: 2k-4k.

### Task 7: Local WiFi Client Support In APK

**Files:**
- Modify: `src/network/localWifi.ts`
- Modify: `src/App.tsx`
- Create/extend: `docs/android-testing.md`

- [ ] Detect Android/Capacitor runtime where possible.
- [ ] Keep host-room creation disabled or clearly marked unsupported inside APK for first release.
- [ ] Allow manual host IP entry or reuse existing host discovery if Android WebView permits it.
- [ ] Ensure clear error messages for blocked LAN connection, wrong host, disconnected desktop server, and unsupported phone-host mode.
- [ ] Add Android network permission notes for local network access.
- [ ] Estimated tokens: 4k-8k.

### Task 8: Optional Native Permissions And Manifest Review

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `capacitor.config.ts` only if cleartext/local traffic settings are needed.

- [ ] Add only required permissions, likely network state/internet for WiFi client mode.
- [ ] Review whether local HTTP connections need Android cleartext policy.
- [ ] Avoid broad permissions that are not needed for local card gameplay.
- [ ] Verify installation on a real Android device.
- [ ] Estimated tokens: 2k-4k.

### Task 9: Android Build, APK Generation, And Signing Path

**Files:**
- Create/extend: `docs/android-testing.md`
- Android Studio generated Gradle files as needed.

- [ ] Build a debug APK from Android Studio.
- [ ] Install debug APK on at least one Android phone.
- [ ] Document debug APK location and install command if using `adb`.
- [ ] Define release signing requirements but do not commit private keystore files.
- [ ] Build a signed release APK only after manual testing is positive.
- [ ] Estimated tokens: 2k-4k.

### Task 10: Android Manual Regression Checklist

**Files:**
- Create/extend: `docs/android-testing.md`

- [ ] Test startup, game selection, language switch, theme switch, and restart.
- [ ] Test all local modes for representative games:
  - Uno Classic.
  - Uno Extreme or Flip Extreme for hardware simulation.
  - Cabo.
  - Skyjo.
  - DOS.
  - Phase 10.
  - Skip-Bo.
  - Mahjong.
- [ ] Test Chinese and German text for overflow and missing fallback.
- [ ] Test portrait and landscape orientation.
- [ ] Test low-end Android performance with Mahjong Three.js table.
- [ ] Test APK joins desktop-hosted WiFi room if client mode is in scope.
- [ ] Estimated tokens: 2k-3k.

### Task 11: Phone-As-Host Feasibility Slice

**Files:**
- No implementation files in first pass.
- Create/extend: `docs/android-testing.md` or create `docs/android-wifi-host-options.md`.

- [ ] Compare three host options:
  - Native Android HTTP/WebSocket server plugin.
  - Remote relay server.
  - WebRTC peer-to-peer with signaling.
- [ ] Estimate security, setup complexity, offline capability, and maintenance for each.
- [ ] Recommend one path only after the first APK client/local release is stable.
- [ ] Estimated tokens: 3k-6k.

---

## Suggested Delivery Slices

1. **APK Local Prototype**  
   Tasks 1-5. Installable debug APK, no WiFi hosting.

2. **Android Runtime Polish**  
   Tasks 6, 8, and 10. Audio, safe areas, Android permissions, real-device checks.

3. **WiFi Client Mode**  
   Task 7. APK joins desktop-hosted rooms.

4. **Release APK Path**  
   Task 9. Signed APK process and install instructions.

5. **Phone-As-Host Decision**  
   Task 11. Choose native host, relay, or WebRTC.

---

## Token Estimate

APK local prototype: **14k-25k tokens**.

APK with Android polish and WiFi client mode: **25k-45k tokens**.

Phone-as-host after that:
- Native Android host plugin: **30k-55k tokens**.
- Remote relay server: **35k-70k tokens**, plus deployment/hosting decisions.
- WebRTC peer-to-peer: **45k-85k tokens**, highest complexity.

Recommended total before phone-as-host: **25k-45k tokens**.

Recommended total with phone-as-host: **60k-100k+ tokens**, depending on selected network architecture.

---

## Acceptance Criteria

- `npm run build` passes.
- `npx cap sync android` succeeds.
- Android Studio builds a debug APK.
- APK installs and launches on a real Android phone.
- All 24 games are selectable after Mahjong exists.
- Local Single Player, Hot Seat, and Spectacular modes work without blank screens.
- Chinese and German text remains readable on phone display.
- Sounds work after first user interaction.
- Mahjong Three.js view is visible, responsive, and usable on Android.
- Local WiFi host creation is either disabled with clear copy or implemented through a later approved native/networking slice.
- Optional WiFi client mode can join a desktop-hosted room if included in the first Android release.
