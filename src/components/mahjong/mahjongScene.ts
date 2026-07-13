import * as THREE from 'three'
import { buildMahjongTileSet } from '../../game/mahjong/tiles'
import type { AnimationSpeed } from '../../game/types'
import type { MahjongState, MahjongTile } from '../../game/mahjong/types'
import type { MahjongAnimationTransition } from './mahjongAnimations'
import { createMahjongTableLayout, type MahjongTableLayout } from './mahjongLayout'
import { createMahjongTileFaceSpec } from './mahjongTextures'
import {
  defaultMahjongVisualTheme,
  mahjongCenterPatternSpec,
  mahjongFeltPalette,
  mahjongFramePalette,
  mahjongTileDeckPalette,
  type MahjongFeltPalette,
  type MahjongTileDeckPalette,
  type MahjongVisualTheme,
} from './mahjongVisuals'

export interface MahjongSceneOptions {
  canvas: HTMLCanvasElement
  state?: MahjongState | null
  viewerPlayerId?: string | null
  selectedTileId?: string | null
  visualTheme?: MahjongVisualTheme
  tileStyle?: 'mahjong' | 'unoMahjong'
  transition?: MahjongAnimationTransition | null
  reducedMotion?: boolean
  animationSpeed?: AnimationSpeed
  onTileSelect?: (tileId: string) => void
}

export interface MahjongSceneController {
  update: (options: Pick<MahjongSceneOptions, 'state' | 'viewerPlayerId' | 'selectedTileId' | 'visualTheme' | 'tileStyle' | 'transition' | 'reducedMotion' | 'animationSpeed'>) => void
  dispose: () => void
}

type MahjongTileHighlight = 'drawn' | 'discarded' | 'claimed'
type MahjongMeshAnimationKind = 'wall' | 'deal' | 'draw' | 'discard' | 'claim' | 'ready' | 'win' | 'event'

interface MahjongMeshAnimation {
  kind: MahjongMeshAnimationKind
  delay: number
  origin?: THREE.Vector3
}

interface MahjongSceneMesh extends THREE.Mesh {
  userData: {
    tileId?: string
    selectable?: boolean
    basePosition?: THREE.Vector3
    baseScale?: THREE.Vector3
    animation?: MahjongMeshAnimation
    highlight?: MahjongTileHighlight
  }
}

interface MahjongPointerState {
  x: number
  y: number
}

interface MahjongCameraGesture {
  zoom: number
  panX: number
  panZ: number
}

export function createMahjongScene(options: MahjongSceneOptions): MahjongSceneController {
  const renderer = new THREE.WebGLRenderer({ canvas: options.canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2(-1000, -1000)
  const groups = {
    table: new THREE.Group(),
    wall: new THREE.Group(),
    tiles: new THREE.Group(),
    effects: new THREE.Group(),
  }
  scene.add(groups.table, groups.wall, groups.tiles, groups.effects)
  addLights(scene)

  let frame = 0
  let selectedTileId = options.selectedTileId ?? null
  let viewerPlayerId = options.viewerPlayerId ?? null
  let visualTheme = options.visualTheme ?? defaultMahjongVisualTheme
  let tileStyle = options.tileStyle ?? 'mahjong'
  let reducedMotion = options.reducedMotion ?? false
  let animationSpeed = options.animationSpeed ?? 'normal'
  let activeTransition = options.transition ?? null
  let animationStartedAt = performance.now()
  let lastDrawnTileId = activeTransition?.drawnTileId ?? null
  let lastDiscardedTileId = activeTransition?.discardedTileId ?? null
  let lastClaimedTileId = activeTransition?.claimedTileId ?? null
  let currentLayout: MahjongTableLayout | null = null
  const cameraGesture: MahjongCameraGesture = { zoom: 1, panX: 0, panZ: 0 }
  const activePointers = new Map<number, MahjongPointerState>()
  let tapStart: MahjongPointerState | null = null
  let tapPointerId: number | null = null
  let gestureStartDistance = 0
  let gestureStartZoom = 1
  let gestureStartCenter: MahjongPointerState | null = null
  let gestureStartPan = { x: 0, z: 0 }
  let pointerMoved = false

  function rebuild(): void {
    const layout = createMahjongTableLayout({
      viewportWidth: options.canvas.clientWidth || 1024,
      viewportHeight: options.canvas.clientHeight || 640,
    })
    currentLayout = layout
    clearGroup(groups.table)
    clearGroup(groups.wall)
    clearGroup(groups.tiles)
    clearGroup(groups.effects)
    positionCamera(camera, layout, cameraGesture)
    addTable(groups.table, layout, visualTheme)
    addWall(groups.wall, layout, options.state ?? null, activeTransition, visualTheme, tileStyle, reducedMotion)
    addVisibleTiles(
      groups.tiles,
      layout,
      options.state ?? null,
      viewerPlayerId,
      selectedTileId,
      visualTheme,
      tileStyle,
      activeTransition,
      { drawn: lastDrawnTileId, discarded: lastDiscardedTileId, claimed: lastClaimedTileId },
      reducedMotion,
    )
    addDealerMarker(groups.tiles, layout, options.state ?? null, viewerPlayerId)
    addEventCallout(groups.effects, layout, activeTransition, reducedMotion)
  }

  function render(timestamp = performance.now()): void {
    resizeRenderer(renderer, camera)
    animateMahjongScene(groups, timestamp, animationStartedAt, animationSpeed, reducedMotion)
    renderer.render(scene, camera)
    frame = window.requestAnimationFrame(render)
  }

  function handlePointerDown(event: PointerEvent): void {
    options.canvas.setPointerCapture(event.pointerId)
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    pointerMoved = false
    if (activePointers.size === 1) {
      tapPointerId = event.pointerId
      tapStart = { x: event.clientX, y: event.clientY }
      gestureStartCenter = { x: event.clientX, y: event.clientY }
      gestureStartPan = { x: cameraGesture.panX, z: cameraGesture.panZ }
      return
    }
    if (activePointers.size === 2) {
      tapPointerId = null
      tapStart = null
      gestureStartDistance = distanceBetweenPointers(activePointers)
      gestureStartZoom = cameraGesture.zoom
      gestureStartCenter = centerOfPointers(activePointers)
      gestureStartPan = { x: cameraGesture.panX, z: cameraGesture.panZ }
    }
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!activePointers.has(event.pointerId)) return
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const layout = currentLayout
    if (!layout) return
    if (activePointers.size >= 2) {
      pointerMoved = true
      const distance = distanceBetweenPointers(activePointers)
      const center = centerOfPointers(activePointers)
      const zoomRatio = gestureStartDistance > 0 ? distance / gestureStartDistance : 1
      cameraGesture.zoom = clamp(gestureStartZoom * zoomRatio, 0.9, 2.45)
      if (gestureStartCenter) {
        applyPanDelta(cameraGesture, layout, gestureStartPan, center.x - gestureStartCenter.x, center.y - gestureStartCenter.y)
      }
      positionCamera(camera, layout, cameraGesture)
      return
    }
    if (tapStart && (Math.abs(event.clientX - tapStart.x) > 6 || Math.abs(event.clientY - tapStart.y) > 6)) {
      pointerMoved = true
    }
    if (gestureStartCenter && pointerMoved) {
      applyPanDelta(cameraGesture, layout, gestureStartPan, event.clientX - gestureStartCenter.x, event.clientY - gestureStartCenter.y)
      positionCamera(camera, layout, cameraGesture)
    }
  }

  function handlePointerUp(event: PointerEvent): void {
    const wasTap = tapPointerId === event.pointerId && !pointerMoved && activePointers.size === 1
    activePointers.delete(event.pointerId)
    if (options.canvas.hasPointerCapture(event.pointerId)) options.canvas.releasePointerCapture(event.pointerId)
    if (wasTap) selectTileAt(event)
    if (activePointers.size === 1) {
      const remaining = [...activePointers.entries()][0]
      tapPointerId = remaining[0]
      tapStart = { ...remaining[1] }
      gestureStartCenter = { ...remaining[1] }
      gestureStartPan = { x: cameraGesture.panX, z: cameraGesture.panZ }
      pointerMoved = false
      return
    }
    if (activePointers.size === 2) {
      gestureStartDistance = distanceBetweenPointers(activePointers)
      gestureStartZoom = cameraGesture.zoom
      gestureStartCenter = centerOfPointers(activePointers)
      gestureStartPan = { x: cameraGesture.panX, z: cameraGesture.panZ }
      return
    }
    tapPointerId = null
    tapStart = null
    gestureStartCenter = null
    pointerMoved = false
  }

  function selectTileAt(event: PointerEvent): void {
    const rect = options.canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = ((event.clientY - rect.top) / rect.height) * -2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(groups.tiles.children, true)
    const tileId = hits.map((hit) => (hit.object as MahjongSceneMesh).userData.tileId).find(Boolean)
    if (tileId) options.onTileSelect?.(tileId)
  }

  options.canvas.addEventListener('pointerdown', handlePointerDown)
  options.canvas.addEventListener('pointermove', handlePointerMove)
  options.canvas.addEventListener('pointerup', handlePointerUp)
  options.canvas.addEventListener('pointercancel', handlePointerUp)
  rebuild()
  render()

  return {
    update(nextOptions) {
      selectedTileId = nextOptions.selectedTileId ?? null
      viewerPlayerId = nextOptions.viewerPlayerId ?? null
      visualTheme = nextOptions.visualTheme ?? defaultMahjongVisualTheme
      tileStyle = nextOptions.tileStyle ?? 'mahjong'
      reducedMotion = nextOptions.reducedMotion ?? false
      animationSpeed = nextOptions.animationSpeed ?? 'normal'
      if (nextOptions.transition && nextOptions.transition.key !== activeTransition?.key) {
        activeTransition = nextOptions.transition
        animationStartedAt = performance.now()
        if (activeTransition.roundStart) {
          lastDrawnTileId = null
          lastDiscardedTileId = null
          lastClaimedTileId = null
        }
        if (activeTransition.drawnTileId) lastDrawnTileId = activeTransition.drawnTileId
        if (activeTransition.discardedTileId) lastDiscardedTileId = activeTransition.discardedTileId
        if (activeTransition.claimedTileId) lastClaimedTileId = activeTransition.claimedTileId
      }
      options.state = nextOptions.state
      options.viewerPlayerId = nextOptions.viewerPlayerId
      rebuild()
    },
    dispose() {
      window.cancelAnimationFrame(frame)
      options.canvas.removeEventListener('pointerdown', handlePointerDown)
      options.canvas.removeEventListener('pointermove', handlePointerMove)
      options.canvas.removeEventListener('pointerup', handlePointerUp)
      options.canvas.removeEventListener('pointercancel', handlePointerUp)
      clearGroup(groups.table)
      clearGroup(groups.wall)
      clearGroup(groups.tiles)
      clearGroup(groups.effects)
      renderer.dispose()
    },
  }
}

function addLights(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(0xfff7e0, 0x143d2b, 1.65))
  const key = new THREE.DirectionalLight(0xffffff, 3.4)
  key.position.set(-4.6, 8.5, 5.4)
  key.castShadow = true
  key.shadow.mapSize.width = 2048
  key.shadow.mapSize.height = 2048
  key.shadow.camera.near = 1
  key.shadow.camera.far = 24
  key.shadow.camera.left = -9
  key.shadow.camera.right = 9
  key.shadow.camera.top = 8
  key.shadow.camera.bottom = -8
  scene.add(key)
  const fill = new THREE.DirectionalLight(0x9bd6ff, 1.1)
  fill.position.set(5, 4, -6)
  scene.add(fill)
}

function positionCamera(camera: THREE.PerspectiveCamera, layout: MahjongTableLayout, gesture: MahjongCameraGesture): void {
  const boundedPan = clampCameraPan(layout, gesture)
  gesture.panX = boundedPan.x
  gesture.panZ = boundedPan.z
  camera.fov = clamp(layout.camera.fov / gesture.zoom, 24, 70)
  camera.position.set(layout.camera.position.x + gesture.panX, layout.camera.position.y, layout.camera.position.z + gesture.panZ)
  camera.lookAt(layout.camera.target.x + gesture.panX, layout.camera.target.y, layout.camera.target.z + gesture.panZ)
  camera.updateProjectionMatrix()
}

function distanceBetweenPointers(pointers: Map<number, MahjongPointerState>): number {
  const [first, second] = [...pointers.values()]
  if (!first || !second) return 0
  return Math.hypot(first.x - second.x, first.y - second.y)
}

function centerOfPointers(pointers: Map<number, MahjongPointerState>): MahjongPointerState {
  const values = [...pointers.values()]
  const total = values.reduce((sum, pointer) => ({ x: sum.x + pointer.x, y: sum.y + pointer.y }), { x: 0, y: 0 })
  return { x: total.x / values.length, y: total.y / values.length }
}

function applyPanDelta(
  gesture: MahjongCameraGesture,
  layout: MahjongTableLayout,
  startPan: { x: number; z: number },
  deltaX: number,
  deltaY: number,
): void {
  const zoomPanWeight = Math.max(0.28, gesture.zoom - 0.72)
  const worldPerPixel = Math.min(layout.table.width, layout.table.depth) / 620 / zoomPanWeight
  gesture.panX = startPan.x - deltaX * worldPerPixel
  gesture.panZ = startPan.z - deltaY * worldPerPixel
  const bounded = clampCameraPan(layout, gesture)
  gesture.panX = bounded.x
  gesture.panZ = bounded.z
}

function clampCameraPan(layout: MahjongTableLayout, gesture: MahjongCameraGesture): { x: number; z: number } {
  const panRoom = Math.max(0, gesture.zoom - 1) / 1.45
  const maxX = layout.table.width * 0.22 * panRoom
  const maxZ = layout.table.depth * 0.22 * panRoom
  return {
    x: clamp(gesture.panX, -maxX, maxX),
    z: clamp(gesture.panZ, -maxZ, maxZ),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function addTable(group: THREE.Group, layout: MahjongTableLayout, visualTheme: MahjongVisualTheme): void {
  const felt = mahjongFeltPalette(visualTheme.felt)
  const frame = mahjongFramePalette(visualTheme.frame)
  const tableGeometry = new THREE.BoxGeometry(layout.table.width, 0.24, layout.table.depth)
  const tableMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(felt.base),
    roughness: 0.72,
    metalness: 0.02,
    map: createFeltTexture(felt, visualTheme),
  })
  const table = new THREE.Mesh(tableGeometry, tableMaterial)
  table.position.y = -0.15
  table.receiveShadow = true
  group.add(table)

  const railGeometry = new THREE.BoxGeometry(layout.table.width + 0.52, 0.22, 0.18)
  const railMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(frame.rail),
    roughness: frame.railRoughness,
    metalness: frame.railMetalness,
  })
  const frontRail = new THREE.Mesh(railGeometry, railMaterial)
  frontRail.position.set(0, 0.02, layout.table.depth / 2 + 0.18)
  const backRail = frontRail.clone()
  backRail.position.z = -layout.table.depth / 2 - 0.18
  group.add(frontRail, backRail)

  const sideRailGeometry = new THREE.BoxGeometry(0.18, 0.22, layout.table.depth + 0.52)
  const leftRail = new THREE.Mesh(sideRailGeometry, railMaterial)
  leftRail.position.set(-layout.table.width / 2 - 0.18, 0.02, 0)
  const rightRail = leftRail.clone()
  rightRail.position.x = layout.table.width / 2 + 0.18
  for (const rail of [frontRail, backRail, leftRail, rightRail]) {
    rail.castShadow = true
    rail.receiveShadow = true
  }
  group.add(leftRail, rightRail)

  const inlayMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(frame.inlay),
    roughness: 0.42,
    metalness: frame.inlayMetalness,
  })
  const inlayWidth = 0.035
  const frontInlay = new THREE.Mesh(new THREE.BoxGeometry(layout.table.width - 0.7, 0.018, inlayWidth), inlayMaterial)
  frontInlay.position.set(0, 0.015, layout.table.depth / 2 - 0.36)
  const backInlay = frontInlay.clone()
  backInlay.position.z = -layout.table.depth / 2 + 0.36
  const sideInlay = new THREE.Mesh(new THREE.BoxGeometry(inlayWidth, 0.018, layout.table.depth - 0.7), inlayMaterial)
  sideInlay.position.set(-layout.table.width / 2 + 0.36, 0.015, 0)
  const rightInlay = sideInlay.clone()
  rightInlay.position.x = layout.table.width / 2 - 0.36
  group.add(frontInlay, backInlay, sideInlay, rightInlay)
}

function addWall(
  group: THREE.Group,
  layout: MahjongTableLayout,
  state: MahjongState | null,
  transition: MahjongAnimationTransition | null,
  visualTheme: MahjongVisualTheme,
  tileStyle: 'mahjong' | 'unoMahjong',
  reducedMotion: boolean,
): void {
  const geometry = new THREE.BoxGeometry(layout.tile.width, layout.tile.depth * 1.6, layout.tile.height)
  const deck = mahjongTileDeckPalette(visualTheme.tileDeck)
  const sideMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(deck.side), roughness: 0.34, metalness: 0.02 })
  const backMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(deck.back), map: createTileBackTexture(deck, tileStyle), roughness: 0.36 })
  const materials = [sideMaterial, sideMaterial, backMaterial, sideMaterial, sideMaterial, sideMaterial]
  const remainingTileCount = state ? state.wall.length + state.deadWall.length : layout.wallStacks.length * layout.wallStackLevels
  for (const [stackIndex, stack] of layout.wallStacks.entries()) {
    for (let level = 0; level < layout.wallStackLevels; level += 1) {
      const tileIndex = stackIndex * layout.wallStackLevels + level
      if (tileIndex >= remainingTileCount) continue
      const mesh = new THREE.Mesh(geometry, materials) as MahjongSceneMesh
      mesh.position.set(stack.position.x, stack.position.y + level * layout.tile.depth * 1.72, stack.position.z)
      mesh.rotation.y = stack.rotationY
      mesh.castShadow = true
      mesh.receiveShadow = true
      registerMeshAnimation(mesh, transition?.roundStart && !reducedMotion ? { kind: 'wall', delay: tileIndex * 0.006 } : undefined)
      group.add(mesh)
    }
  }
}

function addVisibleTiles(
  group: THREE.Group,
  layout: MahjongTableLayout,
  state: MahjongState | null,
  viewerPlayerId: string | null,
  selectedTileId: string | null,
  visualTheme: MahjongVisualTheme,
  tileStyle: 'mahjong' | 'unoMahjong',
  transition: MahjongAnimationTransition | null,
  highlights: { drawn: string | null; discarded: string | null; claimed: string | null },
  reducedMotion: boolean,
): void {
  const viewerIndex = state && viewerPlayerId ? state.players.findIndex((player) => player.id === viewerPlayerId) : -1
  const orderedPlayers = state && viewerIndex >= 0 ? [...state.players.slice(viewerIndex), ...state.players.slice(0, viewerIndex)] : state?.players ?? []
  const discards = state ? state.players.flatMap((player) => player.discardRiver).slice(-24) : buildMahjongTileSet().slice(36, 48)
  const displayPlayers = orderedPlayers.length > 0
    ? orderedPlayers
    : [{ id: 'preview', concealed: buildMahjongTileSet().slice(0, 14), exposedMelds: [] }]

  displayPlayers.forEach((player, seatIndex) => {
    const seat = layout.seats[seatIndex]
    if (!seat) return
    addTileRow(group, player.concealed.slice(0, 14), layout, {
      position: seat.hand.position,
      rotationY: seat.hand.rotationY,
      axis: seat.hand.axis,
      selectable: seatIndex === 0,
      selectedTileId: seatIndex === 0 ? selectedTileId : null,
      faceUp: seatIndex === 0,
      visualTheme,
      tileStyle,
      playerId: player.id,
      seatIndex,
      transition,
      highlights,
      reducedMotion,
      rowKind: 'hand',
    })
    if ('exposedMelds' in player) {
      addExposedMelds(group, player.exposedMelds, player.id, seatIndex, layout, visualTheme, tileStyle, transition, highlights, reducedMotion)
    }
  })

  const discardColumns = 6
  discards.forEach((tile, index) => {
    const column = index % discardColumns
    const row = Math.floor(index / discardColumns)
    const x = (column - (discardColumns - 1) / 2) * (layout.tile.width + layout.tile.gap)
    const z = (row - 1.5) * (layout.tile.height + layout.tile.gap)
    const highlight = tile.id === highlights.discarded ? 'discarded' : tile.id === highlights.claimed ? 'claimed' : null
    const mesh = createTileMesh(tile, layout, false, selectedTileId === tile.id, true, visualTheme, tileStyle, highlight)
    mesh.position.set(layout.discardCenter.x + x, layout.tile.depth / 2 + 0.03, layout.discardCenter.z + z)
    const sourceSeatIndex = orderedPlayers.findIndex((player) => player.id === transition?.sourcePlayerId)
    const sourceSeat = layout.seats[sourceSeatIndex >= 0 ? sourceSeatIndex : 0]
    const discardOrigin = sourceSeat
      ? new THREE.Vector3(sourceSeat.hand.position.x, sourceSeat.hand.position.y + layout.tile.height * 1.4, sourceSeat.hand.position.z)
      : undefined
    registerMeshAnimation(mesh, tile.id === transition?.discardedTileId && !reducedMotion
      ? { kind: 'discard', delay: 0, origin: discardOrigin }
      : undefined)
    group.add(mesh)
  })
}

interface TileRowOptions {
  position: { x: number; y: number; z: number }
  rotationY: number
  axis: 'x' | 'z'
  selectable: boolean
  selectedTileId: string | null
  faceUp: boolean
  visualTheme: MahjongVisualTheme
  tileStyle: 'mahjong' | 'unoMahjong'
  playerId: string
  seatIndex: number
  transition: MahjongAnimationTransition | null
  highlights: { drawn: string | null; discarded: string | null; claimed: string | null }
  reducedMotion: boolean
  rowKind: 'hand' | 'meld'
}

function addTileRow(
  group: THREE.Group,
  tiles: MahjongTile[],
  layout: MahjongTableLayout,
  options: TileRowOptions,
): void {
  const spacing = layout.tile.width + layout.tile.gap
  const start = -((tiles.length - 1) * spacing) / 2
  tiles.forEach((tile, index) => {
    const selected = options.selectedTileId === tile.id
    const highlight = tile.id === options.highlights.discarded
      ? 'discarded'
      : tile.id === options.highlights.claimed
        ? 'claimed'
        : tile.id === options.highlights.drawn
          ? 'drawn'
          : null
    const mesh = createTileMesh(tile, layout, options.selectable, selected, options.faceUp, options.visualTheme, options.tileStyle, highlight)
    const offset = start + index * spacing
    mesh.position.set(
      options.position.x + (options.axis === 'x' ? offset : 0),
      options.position.y + (selected ? layout.tile.depth * 0.55 : 0),
      options.position.z + (options.axis === 'z' ? offset : 0) - (selected ? layout.tile.height * 0.12 : 0),
    )
    mesh.rotation.y = options.rotationY
    let animation: MahjongMeshAnimation | undefined
    if (!options.reducedMotion && options.transition?.roundStart && options.rowKind === 'hand') {
      animation = {
        kind: 'deal',
        delay: 0.42 + options.seatIndex * 0.08 + index * 0.018,
        origin: new THREE.Vector3(options.position.x * 0.32, layout.tile.height * 2.2, options.position.z * 0.32),
      }
    } else if (!options.reducedMotion && tile.id === options.transition?.drawnTileId) {
      animation = {
        kind: 'draw',
        delay: 0,
        origin: new THREE.Vector3(options.position.x * 0.42, layout.tile.height * 1.8, options.position.z * 0.42),
      }
    } else if (!options.reducedMotion && options.transition?.eventKind === 'ready' && options.transition.playerId === options.playerId) {
      animation = { kind: 'ready', delay: index * 0.025 }
    } else if (!options.reducedMotion && options.transition?.eventKind === 'win' && options.transition.playerId === options.playerId) {
      animation = { kind: 'win', delay: index * 0.018 }
    } else if (!options.reducedMotion && options.rowKind === 'meld' && options.transition?.claimTileIds.includes(tile.id)) {
      const claimedFromCenter = tile.id === options.transition.claimedTileId
      animation = {
        kind: 'claim',
        delay: index * 0.025,
        origin: claimedFromCenter
          ? new THREE.Vector3(layout.discardCenter.x, layout.tile.height * 1.2, layout.discardCenter.z)
          : new THREE.Vector3(options.position.x / 0.82, layout.tile.height * 1.2, options.position.z / 0.82),
      }
    }
    registerMeshAnimation(mesh, animation)
    group.add(mesh)
  })
}

function addExposedMelds(
  group: THREE.Group,
  melds: MahjongState['players'][number]['exposedMelds'],
  playerId: string,
  seatIndex: number,
  layout: MahjongTableLayout,
  visualTheme: MahjongVisualTheme,
  tileStyle: 'mahjong' | 'unoMahjong',
  transition: MahjongAnimationTransition | null,
  highlights: { drawn: string | null; discarded: string | null; claimed: string | null },
  reducedMotion: boolean,
): void {
  const seat = layout.seats[seatIndex]
  if (!seat || melds.length === 0) return
  addTileRow(group, melds.flatMap((meld) => meld.tiles), layout, {
    position: seat.melds.position,
    rotationY: seat.melds.rotationY,
    axis: seat.hand.axis,
    selectable: false,
    selectedTileId: null,
    faceUp: true,
    visualTheme,
    tileStyle,
    playerId,
    seatIndex,
    transition,
    highlights,
    reducedMotion,
    rowKind: 'meld',
  })
}

function createTileMesh(tile: MahjongTile, layout: MahjongTableLayout, selectable: boolean, selected: boolean, faceUp = true, visualTheme: MahjongVisualTheme, tileStyle: 'mahjong' | 'unoMahjong', highlight: MahjongTileHighlight | null = null): MahjongSceneMesh {
  const geometry = new THREE.BoxGeometry(layout.tile.width, layout.tile.depth, layout.tile.height)
  const deck = mahjongTileDeckPalette(visualTheme.tileDeck)
  const highlightColor = highlight === 'drawn' ? 0x55c8ff : highlight === 'discarded' ? 0xffd54f : highlight === 'claimed' ? 0xff718f : 0x000000
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(selected ? deck.selectedSide : deck.side),
    roughness: 0.28,
    metalness: visualTheme.tileDeck === 'golden' ? 0.18 : 0.02,
    emissive: highlightColor,
    emissiveIntensity: highlight ? 0.28 : 0,
  })
  const faceMaterial = new THREE.MeshStandardMaterial({
    color: faceUp ? new THREE.Color(deck.face) : new THREE.Color(deck.back),
    map: faceUp ? createTileFaceTexture(tile, deck, tileStyle) : createTileBackTexture(deck, tileStyle),
    roughness: 0.38,
    metalness: 0.01,
    emissive: highlightColor,
    emissiveIntensity: highlight ? 0.42 : 0,
  })
  const mesh = new THREE.Mesh(geometry, [sideMaterial, sideMaterial, faceMaterial, sideMaterial, sideMaterial, sideMaterial]) as MahjongSceneMesh
  mesh.userData.tileId = tile.id
  mesh.userData.selectable = selectable
  mesh.userData.highlight = highlight ?? undefined
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function registerMeshAnimation(mesh: MahjongSceneMesh, animation?: MahjongMeshAnimation): void {
  mesh.userData.basePosition = mesh.position.clone()
  mesh.userData.baseScale = mesh.scale.clone()
  mesh.userData.animation = animation
}

function addDealerMarker(group: THREE.Group, layout: MahjongTableLayout, state: MahjongState | null, viewerPlayerId: string | null): void {
  if (!state) return
  const viewerIndex = viewerPlayerId ? state.players.findIndex((player) => player.id === viewerPlayerId) : -1
  const dealerSeatIndex = viewerIndex >= 0
    ? (state.dealerIndex - viewerIndex + state.players.length) % state.players.length
    : state.dealerIndex
  const seat = layout.seats[dealerSeatIndex]
  if (!seat) return
  const texture = createDealerMarkerTexture()
  const material = new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.34, metalness: 0.18 })
  const marker = new THREE.Mesh(new THREE.CircleGeometry(layout.tile.width * 0.78, 32), material)
  const edgeX = seat.id === 'right'
    ? seat.hand.position.x
    : seat.id === 'left'
      ? seat.hand.position.x
      : seat.id === 'bottom'
        ? -layout.table.width * 0.34
        : layout.table.width * 0.34
  const edgeZ = seat.id === 'bottom'
    ? seat.hand.position.z
    : seat.id === 'top'
      ? seat.hand.position.z
      : seat.id === 'right'
        ? -layout.table.depth * 0.31
        : layout.table.depth * 0.31
  marker.position.set(edgeX, 0.035, edgeZ)
  marker.rotation.x = -Math.PI / 2
  marker.rotation.z = -seat.hand.rotationY
  marker.receiveShadow = true
  group.add(marker)
}

const mahjongEventSymbols: Record<NonNullable<MahjongAnimationTransition['eventKind']>, string> = {
  chow: '吃',
  pong: '碰',
  kong: '杠',
  ready: '听牌',
  win: '胡牌',
}

function addEventCallout(group: THREE.Group, layout: MahjongTableLayout, transition: MahjongAnimationTransition | null, reducedMotion: boolean): void {
  if (!transition?.eventKind) return
  const material = new THREE.SpriteMaterial({
    map: createMahjongEventTexture(mahjongEventSymbols[transition.eventKind], transition.eventKind),
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.position.set(0, layout.tile.height * 4.3, -layout.table.depth * 0.08)
  const width = transition.eventKind === 'ready' || transition.eventKind === 'win' ? 2.15 : 1.45
  sprite.scale.set(width, 1.15, 1)
  sprite.renderOrder = 20
  sprite.userData.basePosition = sprite.position.clone()
  sprite.userData.baseScale = sprite.scale.clone()
  sprite.userData.animation = { kind: 'event', delay: reducedMotion ? 0 : 0.03 }
  group.add(sprite)
}

function animateMahjongScene(
  groups: { table: THREE.Group; wall: THREE.Group; tiles: THREE.Group; effects: THREE.Group },
  timestamp: number,
  startedAt: number,
  animationSpeed: AnimationSpeed,
  reducedMotion: boolean,
): void {
  const elapsedSeconds = Math.max(0, (timestamp - startedAt) / 1000)
  const durationScale = animationSpeed === 'fast' ? 0.72 : animationSpeed === 'slow' ? 1.34 : 1

  for (const group of [groups.wall, groups.tiles, groups.effects]) {
    group.traverse((object) => {
      const animated = object as THREE.Object3D & {
        material?: THREE.Material | THREE.Material[]
        userData: MahjongSceneMesh['userData']
      }
      const basePosition = animated.userData.basePosition
      const baseScale = animated.userData.baseScale
      const animation = animated.userData.animation
      if (basePosition) animated.position.copy(basePosition)
      if (baseScale) animated.scale.copy(baseScale)

      if (animation && basePosition && baseScale) {
        const delay = animation.delay * durationScale
        const duration = mahjongAnimationDuration(animation.kind) * durationScale
        const progress = reducedMotion && animation.kind !== 'event'
          ? 1
          : clamp((elapsedSeconds - delay) / duration, 0, 1)
        const eased = 1 - (1 - progress) ** 3

        if (animation.kind === 'wall') {
          animated.position.y = basePosition.y - (1 - eased) * 0.72
          animated.scale.y = Math.max(0.08, eased)
        } else if (animation.kind === 'deal' || animation.kind === 'draw' || animation.kind === 'discard' || animation.kind === 'claim') {
          if (animation.origin) animated.position.lerpVectors(animation.origin, basePosition, eased)
          animated.position.y += Math.sin(progress * Math.PI) * (animation.kind === 'deal' ? 0.34 : 0.2)
          animated.rotation.z = Math.sin(progress * Math.PI) * (animation.kind === 'discard' ? 0.24 : 0.12)
        } else if (animation.kind === 'ready') {
          const lift = Math.sin(progress * Math.PI)
          animated.position.y += lift * 0.28
          animated.scale.multiplyScalar(1 + lift * 0.08)
        } else if (animation.kind === 'win') {
          const lift = Math.sin(progress * Math.PI)
          animated.position.y += lift * 0.72
          animated.scale.multiplyScalar(1 + lift * 0.12)
          animated.rotation.z = Math.sin(progress * Math.PI * 2) * 0.08
        } else if (animation.kind === 'event') {
          const spriteMaterial = animated.material as THREE.SpriteMaterial | undefined
          const reveal = Math.sin(progress * Math.PI)
          animated.scale.copy(baseScale).multiplyScalar(reducedMotion ? 1 : 0.82 + reveal * 0.22)
          if (spriteMaterial) spriteMaterial.opacity = progress < 0.72 ? 1 : Math.max(0, 1 - (progress - 0.72) / 0.28)
        }
      }

      const highlight = animated.userData.highlight
      if (highlight && animated.material) {
        const materials = Array.isArray(animated.material) ? animated.material : [animated.material]
        const pulse = 0.12 + (Math.sin(timestamp * 0.007) + 1) * 0.11
        for (const material of materials) {
          if (material instanceof THREE.MeshStandardMaterial) material.emissiveIntensity = (highlight === 'discarded' ? 0.42 : 0.3) + pulse
        }
      }
    })
  }
}

function mahjongAnimationDuration(kind: MahjongMeshAnimationKind): number {
  if (kind === 'event') return 0.92
  if (kind === 'wall' || kind === 'deal') return 0.62
  if (kind === 'win') return 1.1
  if (kind === 'ready') return 0.84
  return 0.52
}

function createDealerMarkerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 192
  canvas.height = 192
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(70, 55, 12, 96, 96, 88)
    gradient.addColorStop(0, '#fff1a8')
    gradient.addColorStop(0.58, '#e9b93f')
    gradient.addColorStop(1, '#8f4e12')
    context.fillStyle = gradient
    context.beginPath()
    context.arc(96, 96, 88, 0, Math.PI * 2)
    context.fill()
    context.strokeStyle = '#fff4bd'
    context.lineWidth = 9
    context.stroke()
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = chineseFont(94, 'bold')
    drawOutlinedText(context, '庄', 96, 100, '#591c10', '#fff1a8', 7)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createMahjongEventTexture(symbol: string, kind: NonNullable<MahjongAnimationTransition['eventKind']>): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 384
  canvas.height = 224
  const context = canvas.getContext('2d')
  if (context) {
    const accent = kind === 'win' ? '#ffe47b' : kind === 'ready' ? '#7ce8ff' : '#fff1b0'
    const gradient = context.createLinearGradient(0, 0, 384, 224)
    gradient.addColorStop(0, 'rgba(64, 10, 13, 0.94)')
    gradient.addColorStop(0.5, 'rgba(142, 28, 24, 0.97)')
    gradient.addColorStop(1, 'rgba(64, 10, 13, 0.94)')
    roundRect(context, 12, 12, 360, 200, 24)
    context.fillStyle = gradient
    context.fill()
    context.strokeStyle = accent
    context.lineWidth = 8
    context.stroke()
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = chineseFont(symbol.length > 1 ? 88 : 126, 'bold')
    drawOutlinedText(context, symbol, 192, 117, accent, 'rgba(25, 3, 5, 0.9)', 10)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createTileFaceTexture(tile: MahjongTile, deck: MahjongTileDeckPalette, tileStyle: 'mahjong' | 'unoMahjong'): THREE.CanvasTexture {
  if (tileStyle === 'unoMahjong') return createUnoMahjongTileFaceTexture(tile)
  const spec = createMahjongTileFaceSpec(tile)
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 320
  const context = canvas.getContext('2d')
  if (context) {
    const faceGradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
    faceGradient.addColorStop(0, deck.face)
    faceGradient.addColorStop(0.58, deck.faceMid)
    faceGradient.addColorStop(1, deck.faceShade)
    roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 18)
    context.fillStyle = faceGradient
    context.fill()
    context.strokeStyle = deck.border
    context.lineWidth = 8
    context.stroke()
    roundRect(context, 28, 28, canvas.width - 56, canvas.height - 56, 12)
    context.strokeStyle = 'rgba(120, 96, 55, 0.28)'
    context.lineWidth = 3
    context.stroke()
    context.fillStyle = spec.accent
    context.textAlign = 'left'
    context.textBaseline = 'middle'
    context.font = chineseFont(32, 'bold')
    drawOutlinedText(context, spec.corner, 38, 54, spec.accent, 'rgba(255, 252, 232, 0.72)', 4)
    context.textAlign = 'right'
    context.font = 'bold 30px Arial, sans-serif'
    drawOutlinedText(context, spec.primary, 218, 54, spec.accent, 'rgba(255, 252, 232, 0.72)', 4)
    drawTileMotif(context, spec, canvas.width)
    context.textAlign = 'center'
    context.font = chineseFont(28, 'bold')
    drawOutlinedText(context, spec.center, canvas.width / 2, 276, spec.accent, 'rgba(255, 252, 232, 0.72)', 4)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createUnoMahjongTileFaceTexture(tile: MahjongTile): THREE.CanvasTexture {
  const face = unoMahjongFaceSpec(tile)
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 320
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#fffaf0')
    gradient.addColorStop(0.18, '#f7f0dc')
    gradient.addColorStop(1, '#e5d6ac')
    roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 20)
    context.fillStyle = gradient
    context.fill()
    context.strokeStyle = '#f7f0dc'
    context.lineWidth = 9
    context.stroke()

    roundRect(context, 28, 28, canvas.width - 56, canvas.height - 56, 15)
    context.fillStyle = face.color
    context.fill()
    context.strokeStyle = 'rgba(8, 14, 18, 0.34)'
    context.lineWidth = 3
    context.stroke()

    if (face.wild) {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = 82
      const wildColors = ['#df3f3f', '#eac64a', '#327dd9', '#2fa56a']
      wildColors.forEach((color, index) => {
        context.beginPath()
        context.moveTo(centerX, centerY)
        context.arc(centerX, centerY, radius, (index * Math.PI) / 2, ((index + 1) * Math.PI) / 2)
        context.closePath()
        context.fillStyle = color
        context.fill()
      })
      context.strokeStyle = 'rgba(255, 255, 255, 0.74)'
      context.lineWidth = 5
      context.beginPath()
      context.arc(centerX, centerY, radius, 0, Math.PI * 2)
      context.stroke()
    }

    context.textAlign = 'left'
    context.textBaseline = 'middle'
    context.font = 'bold 36px Arial, sans-serif'
    drawOutlinedText(context, face.corner, 42, 58, face.textColor, face.strokeColor, 5)
    context.font = chineseFont(22, 'bold')
    drawOutlinedText(context, face.suitLabel, 42, 88, face.textColor, face.strokeColor, 4)

    context.textAlign = 'center'
    context.font = face.center.length <= 2 ? chineseFont(92, 'bold') : 'bold 68px Arial, sans-serif'
    drawOutlinedText(context, face.center, canvas.width / 2, 164, face.textColor, face.strokeColor, 8)
    context.font = chineseFont(30, 'bold')
    drawOutlinedText(context, face.suitLabel, canvas.width / 2, 230, face.textColor, face.strokeColor, 5)

    context.textAlign = 'right'
    context.font = 'bold 28px Arial, sans-serif'
    drawOutlinedText(context, face.corner, 214, 268, face.textColor, face.strokeColor, 5)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function unoMahjongFaceSpec(tile: MahjongTile): { color: string; textColor: string; strokeColor: string; corner: string; center: string; suitLabel: string; wild?: boolean } {
  if (tile.category === 'suit') {
    if (tile.suit === 'characters') return { color: '#df3f3f', textColor: '#ffffff', strokeColor: 'rgba(90, 0, 0, 0.62)', corner: String(tile.rank), center: String(tile.rank), suitLabel: '\u4e07' }
    if (tile.suit === 'dots') return { color: '#eac64a', textColor: '#1f1808', strokeColor: 'rgba(255, 247, 199, 0.72)', corner: String(tile.rank), center: String(tile.rank), suitLabel: '\u997c' }
    return { color: '#327dd9', textColor: '#ffffff', strokeColor: 'rgba(0, 24, 82, 0.64)', corner: String(tile.rank), center: String(tile.rank), suitLabel: '\u6761' }
  }
  if (tile.category === 'wind') {
    const labels: Record<string, string> = { east: '\u4e1c', south: '\u5357', west: '\u897f', north: '\u5317' }
    return { color: '#2fa56a', textColor: '#ffffff', strokeColor: 'rgba(0, 58, 27, 0.66)', corner: labels[tile.wind] ?? '?', center: labels[tile.wind] ?? '?', suitLabel: '\u98ce' }
  }
  if (tile.category === 'dragon') {
    const labels: Record<string, string> = { red: '\u4e2d', green: '\u53d1', white: '\u767d' }
    return { color: '#2fa56a', textColor: '#ffffff', strokeColor: 'rgba(0, 58, 27, 0.66)', corner: labels[tile.dragon] ?? '?', center: labels[tile.dragon] ?? '?', suitLabel: '\u7bad' }
  }
  if (tile.category === 'flower') {
    const labels: Record<string, string> = { plum: '\u6885', orchid: '\u5170', bamboo: '\u7af9', chrysanthemum: '\u83ca' }
    return { color: '#20242d', textColor: '#ffffff', strokeColor: 'rgba(0, 0, 0, 0.72)', corner: 'W', center: labels[tile.flower] ?? 'W', suitLabel: 'Wild', wild: true }
  }
  const labels: Record<string, string> = { spring: '\u6625', summer: '\u590f', autumn: '\u79cb', winter: '\u51ac' }
  return { color: '#20242d', textColor: '#ffffff', strokeColor: 'rgba(0, 0, 0, 0.72)', corner: 'W', center: labels[tile.season] ?? 'W', suitLabel: 'Wild', wild: true }
}

function drawOutlinedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
  stroke: string,
  width: number,
): void {
  context.strokeStyle = stroke
  context.lineWidth = width
  context.strokeText(text, x, y)
  context.fillStyle = fill
  context.fillText(text, x, y)
}

function createTileBackTexture(deck: MahjongTileDeckPalette, tileStyle: 'mahjong' | 'unoMahjong' = 'mahjong'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 320
  const context = canvas.getContext('2d')
  if (context) {
    const background = tileStyle === 'unoMahjong' ? context.createLinearGradient(0, 0, canvas.width, canvas.height) : null
    background?.addColorStop(0, '#d83d34')
    background?.addColorStop(0.52, '#8c1018')
    background?.addColorStop(1, '#251016')
    context.fillStyle = background ?? deck.back
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = '#d9c58b'
    context.lineWidth = 10
    context.strokeRect(24, 24, canvas.width - 48, canvas.height - 48)
    context.strokeStyle = 'rgba(255, 250, 224, 0.34)'
    context.lineWidth = 4
    for (let offset = -180; offset < 320; offset += 28) {
      context.beginPath()
      context.moveTo(offset, 320)
      context.lineTo(offset + 210, 0)
      context.stroke()
    }
    if (tileStyle === 'unoMahjong') {
      context.save()
      context.translate(canvas.width / 2, canvas.height / 2)
      context.rotate(-Math.PI / 12)
      context.beginPath()
      context.ellipse(0, 0, 88, 116, 0, 0, Math.PI * 2)
      context.fillStyle = '#11161b'
      context.fill()
      context.strokeStyle = '#f0c94a'
      context.lineWidth = 8
      context.stroke()
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.font = 'bold 48px Arial, sans-serif'
      drawOutlinedText(context, 'UNO', 0, -12, '#fff8dd', '#c62d2d', 9)
      context.font = chineseFont(30, 'bold')
      drawOutlinedText(context, '麻将', 0, 42, '#f0c94a', '#11161b', 5)
      context.restore()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createFeltTexture(palette: MahjongFeltPalette, visualTheme: MahjongVisualTheme): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(256, 220, 40, 256, 256, 360)
    gradient.addColorStop(0, palette.glow)
    gradient.addColorStop(0.7, palette.base)
    gradient.addColorStop(1, palette.shade)
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = palette.line
    context.lineWidth = 1
    for (let y = 0; y < canvas.height; y += 18) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(canvas.width, y + 18)
      context.stroke()
    }
    context.fillStyle = 'rgba(0,0,0,0.08)'
    context.fillRect(0, 0, canvas.width, canvas.height)
    drawCenterPattern(context, visualTheme)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 2)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function drawCenterPattern(context: CanvasRenderingContext2D, visualTheme: MahjongVisualTheme): void {
  const pattern = mahjongCenterPatternSpec(visualTheme.centerPattern)
  if (!pattern.label) return
  context.save()
  context.translate(256, 258)
  if (pattern.motif === 'dragon') {
    drawCenterDragon(context, pattern.color)
  } else if (pattern.motif === 'lion') {
    drawCenterLion(context, pattern.color)
  } else if (pattern.motif === 'yuanBao') {
    drawCenterYuanBao(context, pattern.color)
  }
  if (pattern.motif === 'text') {
    context.rotate(-Math.PI / 18)
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = chineseFont(156, 'bold')
    context.fillStyle = pattern.color
    context.strokeStyle = 'rgba(38, 23, 10, 0.16)'
    context.lineWidth = 8
    context.strokeText(pattern.label, 0, 0)
    context.fillText(pattern.label, 0, 0)
  } else {
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = chineseFont(58, 'bold')
    context.fillStyle = pattern.color
    context.fillText(pattern.label, 0, 92)
  }
  context.restore()
}

function drawCenterDragon(context: CanvasRenderingContext2D, color: string): void {
  context.save()
  context.strokeStyle = color
  context.fillStyle = color
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = 22
  context.beginPath()
  context.moveTo(-130, 28)
  context.bezierCurveTo(-88, -80, -14, -86, 32, -28)
  context.bezierCurveTo(78, 31, 16, 76, -32, 33)
  context.bezierCurveTo(-78, -6, -8, -45, 88, -14)
  context.stroke()
  context.lineWidth = 9
  context.beginPath()
  context.moveTo(85, -14)
  context.lineTo(128, -48)
  context.lineTo(112, -4)
  context.lineTo(150, 18)
  context.stroke()
  context.beginPath()
  context.arc(124, -17, 24, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = 'rgba(38, 23, 10, 0.18)'
  context.beginPath()
  context.arc(132, -23, 4, 0, Math.PI * 2)
  context.fill()
  for (let x = -76; x <= 52; x += 32) {
    context.strokeStyle = 'rgba(255, 238, 150, 0.22)'
    context.lineWidth = 5
    context.beginPath()
    context.moveTo(x, -46)
    context.lineTo(x + 18, -66)
    context.stroke()
  }
  context.restore()
}

function drawCenterLion(context: CanvasRenderingContext2D, color: string): void {
  context.save()
  context.fillStyle = color
  context.strokeStyle = 'rgba(38, 23, 10, 0.14)'
  context.lineWidth = 8
  context.beginPath()
  context.arc(0, -18, 70, 0, Math.PI * 2)
  context.fill()
  context.stroke()
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2
    const x = Math.cos(angle) * 84
    const y = -18 + Math.sin(angle) * 84
    context.beginPath()
    context.arc(x, y, 18, 0, Math.PI * 2)
    context.fill()
  }
  context.fillStyle = 'rgba(38, 23, 10, 0.2)'
  context.beginPath()
  context.arc(-24, -28, 8, 0, Math.PI * 2)
  context.arc(24, -28, 8, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.moveTo(0, -8)
  context.lineTo(-16, 18)
  context.lineTo(16, 18)
  context.closePath()
  context.fill()
  context.strokeStyle = 'rgba(255, 238, 150, 0.25)'
  context.lineWidth = 10
  context.beginPath()
  context.arc(0, -18, 48, 0.18 * Math.PI, 0.82 * Math.PI)
  context.stroke()
  context.restore()
}

function drawCenterYuanBao(context: CanvasRenderingContext2D, color: string): void {
  context.save()
  context.fillStyle = color
  context.strokeStyle = 'rgba(38, 23, 10, 0.16)'
  context.lineWidth = 10
  context.beginPath()
  context.moveTo(-132, 20)
  context.bezierCurveTo(-98, -52, -40, -62, 0, -16)
  context.bezierCurveTo(40, -62, 98, -52, 132, 20)
  context.bezierCurveTo(78, 72, -78, 72, -132, 20)
  context.closePath()
  context.fill()
  context.stroke()
  context.fillStyle = 'rgba(255, 248, 190, 0.22)'
  context.beginPath()
  context.ellipse(0, 8, 62, 28, 0, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawTileMotif(context: CanvasRenderingContext2D, spec: ReturnType<typeof createMahjongTileFaceSpec>, width: number): void {
  if (spec.motif === 'dot') {
    drawPips(context, spec.count, width, spec.motifAccent)
    return
  }
  if (spec.motif === 'bamboo') {
    drawBamboo(context, spec.count, width, spec.motifAccent)
    return
  }
  if (spec.motif === 'character') {
    context.textAlign = 'center'
    context.fillStyle = '#c7352d'
    context.font = 'bold 78px Arial, sans-serif'
    context.fillText(spec.primary, width / 2, 128)
    context.font = chineseFont(88, 'bold')
    context.fillText('萬', width / 2, 214)
    return
  }
  context.textAlign = 'center'
  context.font = chineseFont(spec.motif === 'dragon' ? 118 : 132, 'bold')
  context.fillText(spec.center, width / 2, 166)
}

function drawPips(context: CanvasRenderingContext2D, count: number, width: number, color: string): void {
  const positions = pipPositions(count).map(([x, y]) => [width / 2 + x * 42, 148 + y * 44])
  for (const [x, y] of positions) {
    context.beginPath()
    context.fillStyle = color
    context.arc(x, y, 15, 0, Math.PI * 2)
    context.fill()
    context.beginPath()
    context.fillStyle = '#ffffff'
    context.arc(x, y, 6, 0, Math.PI * 2)
    context.fill()
  }
}

function drawBamboo(context: CanvasRenderingContext2D, count: number, width: number, color: string): void {
  const positions = pipPositions(count).map(([x, y]) => [width / 2 + x * 34, 148 + y * 42])
  for (const [x, y] of positions) {
    context.fillStyle = color
    context.fillRect(x - 4, y - 20, 8, 40)
    context.fillStyle = 'rgba(255, 255, 255, 0.24)'
    context.fillRect(x - 12, y - 3, 24, 6)
  }
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function chineseFont(size: number, weight = 'normal'): string {
  return `${weight} ${size}px "Microsoft YaHei", "SimSun", "Noto Sans CJK SC", "PingFang SC", Arial, sans-serif`
}

function pipPositions(count: number): Array<[number, number]> {
  const patterns: Record<number, Array<[number, number]>> = {
    1: [[0, 0]],
    2: [[-0.7, -0.55], [0.7, 0.55]],
    3: [[-0.8, -0.75], [0, 0], [0.8, 0.75]],
    4: [[-0.8, -0.75], [0.8, -0.75], [-0.8, 0.75], [0.8, 0.75]],
    5: [[-0.9, -0.85], [0.9, -0.85], [0, 0], [-0.9, 0.85], [0.9, 0.85]],
    6: [[-0.9, -0.95], [0.9, -0.95], [-0.9, 0], [0.9, 0], [-0.9, 0.95], [0.9, 0.95]],
    7: [[-0.9, -0.95], [0.9, -0.95], [-0.9, 0], [0, 0], [0.9, 0], [-0.9, 0.95], [0.9, 0.95]],
    8: [[-0.9, -1.05], [0, -1.05], [0.9, -1.05], [-0.9, 0], [0.9, 0], [-0.9, 1.05], [0, 1.05], [0.9, 1.05]],
    9: [[-0.9, -1.05], [0, -1.05], [0.9, -1.05], [-0.9, 0], [0, 0], [0.9, 0], [-0.9, 1.05], [0, 1.05], [0.9, 1.05]],
  }
  return patterns[count] ?? patterns[1]
}

function resizeRenderer(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera): void {
  const canvas = renderer.domElement
  const width = canvas.clientWidth || 1
  const height = canvas.clientHeight || 1
  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
}

function clearGroup(group: THREE.Group): void {
  for (const child of [...group.children]) {
    group.remove(child)
    child.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const material = mesh.material
      if (Array.isArray(material)) {
        material.forEach(disposeMaterial)
      } else if (material) {
        disposeMaterial(material)
      }
    })
  }
}

function disposeMaterial(material: THREE.Material): void {
  const maybeMapped = material as THREE.Material & { map?: THREE.Texture }
  maybeMapped.map?.dispose()
  material.dispose()
}
