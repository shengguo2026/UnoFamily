# Mahjong Responsive Camera Design

## Objective

Keep the complete 3D Mahjong table and all playable tiles visible on portrait
tablets, 5:4 monitors, wide desktops, and after live orientation changes. The
fix applies to Traditional Chinese Mahjong and Guo's Exclusive Uno Mahjong
through their shared renderer.

## Root Cause

The current scene chooses between two fixed table/camera presets using a
700-pixel width and 520-pixel height breakpoint. A 768-pixel portrait tablet
therefore receives the large desktop table and narrow 38-degree camera even
though the rendered canvas is nearly square after the toolbar and control dock
consume space.

The render loop updates `camera.aspect`, but the table layout and camera
position are rebuilt only at scene creation and on game-state updates. Resizing
or rotating the viewport does not re-fit the camera. The renderer also compares
the high-DPI canvas backing-buffer dimensions with CSS dimensions, which causes
unnecessary `setSize` calls when the device pixel ratio is greater than one.

## Chosen Approach

Retain the perspective camera and existing table geometry. Calculate the
minimum camera distance needed to fit a padded table rectangle into both the
vertical and horizontal perspective frusta for the current canvas aspect ratio.
This preserves the current 3D appearance while removing aspect-ratio-dependent
cropping.

A `ResizeObserver` will watch the canvas container. When its CSS dimensions
change, the scene will:

1. update the WebGL drawing-buffer size,
2. rebuild the layout using the new dimensions,
3. re-fit the camera while retaining valid user pan/zoom state, and
4. render with the updated projection.

The animation loop remains responsible for animation and rendering, not layout
measurement.

## Alternatives Considered

- **More CSS breakpoints:** rejected because additional device-specific
  thresholds would still fail at unlisted aspect ratios and browser zoom
  levels.
- **Orthographic camera:** would guarantee uniform tile shapes, but would
  substantially change the established 3D presentation. It remains an option
  only if the fitted perspective view is rejected during manual testing.
- **Always use the compact table:** rejected because it would reduce tile
  readability unnecessarily on wide displays and would not address live resize
  behavior.

## Camera Fit

The fit calculation uses the current camera direction and vertical field of
view. It derives the horizontal field of view from the canvas aspect ratio,
projects the padded table corners onto the camera's right, up, and forward
axes, and chooses the greatest distance required by either frustum dimension.
A small framing margin accounts for the wooden rails, tile height, selection
lift, shadows, and animation movement.

User zoom continues to divide the fitted field of view. At the default zoom,
the full table is visible. Panning remains clamped and becomes available only
after the user zooms in.

## Resize and High-DPI Behavior

The scene will cache the last measured CSS width and height. Resizing work will
run only when either changes. WebGL backing-buffer dimensions will continue to
use the existing device-pixel-ratio cap of 2 without comparing those device
pixels directly to CSS pixels.

The observer will be disconnected during scene disposal. A window resize
fallback will cover environments where `ResizeObserver` is unavailable.

## Validation

- Extend the Mahjong render behavior test with portrait-tablet and 5:4-monitor
  canvas sizes and assert that all padded table corners project inside the
  visible normalized device-coordinate range.
- Add source-level behavior checks for resize observation, cleanup, and cached
  CSS-size handling.
- Run the complete behavior suite, ESLint, TypeScript/Vite production build,
  and browser checks at 768×1024, 1024×768, and 1280×1024.
- Verify that resizing an already-running game updates the camera without a
  game-state transition.

## Non-Goals

- Changing Mahjong rules, tile placement, controls, or visual themes
- Replacing Three.js
- Redesigning the toolbar or control dock
- Changing the perspective camera to orthographic in this fix
