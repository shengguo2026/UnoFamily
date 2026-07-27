# Mahjong Responsive Camera Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the complete shared 3D Mahjong table visible across portrait-tablet, 5:4-monitor, wide-screen, and live-resize conditions.

**Architecture:** `mahjongLayout.ts` will own a pure aspect-aware perspective-camera fit so it can be regression-tested without a browser. `mahjongScene.ts` will observe CSS-size changes, rebuild the layout only when dimensions change, and size the high-DPI drawing buffer without comparing device pixels to CSS pixels.

**Tech Stack:** React 19, TypeScript 6, Three.js 0.185, Vite 8, Node.js behavior tests, Playwright CLI.

## Global Constraints

- Preserve the existing perspective-camera presentation.
- Apply the fix to both Mahjong variants through their shared renderer.
- Keep the device-pixel-ratio cap at 2.
- Preserve pinch zoom and clamped pan behavior.
- Do not change Mahjong rules, controls, tile placement, or visual themes.

---

### Task 1: Add camera-frustum regression coverage

**Files:**
- Modify: `tests/mahjong.render.behavior.ts`
- Modify: `tests/mobileTabletQa.behavior.mjs`
- Modify: `src/components/mahjong/mahjongLayout.ts`

**Interfaces:**
- Consumes: `createMahjongTableLayout({ viewportWidth, viewportHeight })`.
- Produces: an aspect-fitted `layout.camera.position` and a tested camera fit for every canvas size.

- [ ] **Step 1: Write the failing projection test**

Add a helper that creates a real `THREE.PerspectiveCamera` from the returned
layout and projects a padded rectangle with half extents
`layout.table.width / 2 + 0.4` and `layout.table.depth / 2 + 0.4`.

Test the effective canvas sizes `768×787`, `1024×555`, and `1280×811`. Assert
that every projected corner has `abs(x) <= 0.94` and `abs(y) <= 0.94`.

- [ ] **Step 2: Run the test and verify the current fixed camera fails**

Run:

```powershell
node tests/mahjong.render.behavior.ts
```

Expected: FAIL for the portrait-tablet case because projected horizontal bounds
exceed normalized device coordinates.

- [ ] **Step 3: Implement the pure fitted-distance calculation**

In `mahjongLayout.ts`, add a focused helper with this interface:

```ts
export interface MahjongCameraFitInput {
  viewportWidth: number
  viewportHeight: number
  fov: number
  direction: MahjongVector3
  bounds: { width: number; depth: number; height: number }
  margin: number
}

export function fitMahjongCameraDistance(input: MahjongCameraFitInput): number
```

Normalize the direction from target to camera, derive forward/right/up camera
axes, calculate vertical and horizontal half-angle tangents, evaluate all eight
padded bounding-box corners, and return the maximum required distance. Use the
result to scale the existing mobile or desktop camera direction.

- [ ] **Step 4: Run the render behavior test and verify it passes**

Run:

```powershell
node tests/mahjong.render.behavior.ts
```

Expected: PASS with all projected bounds inside the framing limit.

---

### Task 2: Make canvas resizing update layout and renderer size

**Files:**
- Modify: `src/components/mahjong/mahjongScene.ts`
- Modify: `tests/mobileTabletQa.behavior.mjs`

**Interfaces:**
- Consumes: canvas CSS `clientWidth` and `clientHeight`.
- Produces: one `syncViewport()` path used by initialization, resize events,
  and the animation loop.

- [ ] **Step 1: Write failing resize lifecycle checks**

Extend `tests/mobileTabletQa.behavior.mjs` to require:

```js
assert.match(mahjongSource, /new ResizeObserver/)
assert.match(mahjongSource, /resizeObserver\.observe\(options\.canvas\)/)
assert.match(mahjongSource, /resizeObserver\.disconnect\(\)/)
assert.match(mahjongSource, /lastViewportWidth/)
assert.match(mahjongSource, /lastViewportHeight/)
```

Also reject the old backing-buffer comparison:

```js
assert.doesNotMatch(mahjongSource, /canvas\.width !== width \|\| canvas\.height !== height/)
```

- [ ] **Step 2: Run the QA behavior test and verify it fails**

Run:

```powershell
node tests/mobileTabletQa.behavior.mjs
```

Expected: FAIL because the scene has no observer or cached CSS dimensions.

- [ ] **Step 3: Implement one viewport synchronization path**

In `mahjongScene.ts`, cache the last positive CSS width and height. Add
`syncViewport(force = false)` that:

1. reads `clientWidth` and `clientHeight`,
2. returns when both match the cache and `force` is false,
3. calls `renderer.setSize(width, height, false)`,
4. updates `camera.aspect`,
5. calls `rebuild()` using the measured size, and
6. updates the projection matrix through `positionCamera`.

Create a `ResizeObserver` when available and observe the canvas. Otherwise add a
window `resize` listener. Clean up the selected mechanism in `dispose()`.
Remove `resizeRenderer()` and call `syncViewport()` from the render loop only
as a low-cost fallback.

- [ ] **Step 4: Run both targeted behavior tests**

Run:

```powershell
node tests/mahjong.render.behavior.ts
node tests/mobileTabletQa.behavior.mjs
```

Expected: both exit 0.

---

### Task 3: Verify integration and reported viewports

**Files:**
- Verify: `src/components/mahjong/mahjongLayout.ts`
- Verify: `src/components/mahjong/mahjongScene.ts`
- Verify: `tests/mahjong.render.behavior.ts`
- Verify: `tests/mobileTabletQa.behavior.mjs`

**Interfaces:**
- Consumes: the completed shared Mahjong renderer.
- Produces: automated and browser evidence for manual-test handoff.

- [ ] **Step 1: Run all behavior tests**

Run every `tests/*.behavior.mjs` and `tests/*.behavior.ts` file with Node and
stop on the first nonzero exit.

- [ ] **Step 2: Run static and production checks**

Run:

```powershell
npm run lint
npm run build
```

Expected: both exit 0.

- [ ] **Step 3: Reproduce the reported viewports in Chromium**

Start Vite and use Playwright CLI to open Traditional Chinese Mahjong at
768×1024 and 1280×1024. Confirm the whole rail and all four player areas remain
inside the canvas. Resize the running 768×1024 game to 1024×768 and confirm the
scene re-fits without a game-state action.

- [ ] **Step 4: Review the final diff**

Run:

```powershell
git diff --check
git diff --stat
git diff
```

Expected: only the approved design, plan, focused renderer changes, and
regression tests are present.
