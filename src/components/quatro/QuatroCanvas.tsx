import React, { useEffect, useRef } from 'react'
import { QUATRO_COLOR_MARKS } from '../../game/quatro/tiles'
import type {
  QuatroColor,
  QuatroState,
  QuatroTile,
} from '../../game/quatro/types'
import type { AnimationSpeed, SoundCue } from '../../game/types'
import {
  createQuatroLayout,
  hitTestQuatroLayout,
  type QuatroLayout,
  type QuatroRect,
} from './quatroLayout'
import {
  buildQuatroAnimationTimeline,
  soundCueForQuatroEvent,
  type QuatroAnimationTrack,
} from './quatroAnimations'

interface QuatroCanvasProps {
  state: QuatroState
  viewerPlayerId: string
  selectedTileId: string | null
  movableTileIds: string[]
  legalColumns: number[]
  labels?: {
    bag?: string
    tray?: string
  }
  onTileSelect: (tileId: string) => void
  onColumnSelect: (column: number) => void
  onPendingChoice: (choice: 'keep' | 'push') => void
  onBlockingAnimationChange?: (blocking: boolean) => void
  animationSpeed?: AnimationSpeed
  reducedMotion?: boolean
  onSoundCue?: (cue: SoundCue) => void
}

const tileColors: Record<QuatroColor, string> = {
  red: '#f04444',
  green: '#29a85b',
  yellow: '#f6cf3d',
  blue: '#3297ed',
}

function roundedRect(
  context: CanvasRenderingContext2D,
  rect: QuatroRect,
  radius: number,
): void {
  const safeRadius = Math.min(radius, rect.width / 2, rect.height / 2)
  context.beginPath()
  context.roundRect(rect.x, rect.y, rect.width, rect.height, safeRadius)
}

function drawColorblindMark(
  context: CanvasRenderingContext2D,
  color: QuatroColor,
  x: number,
  y: number,
  size: number,
): void {
  const mark = QUATRO_COLOR_MARKS[color]
  context.save()
  context.translate(x, y)
  context.strokeStyle = '#111827'
  context.fillStyle = 'rgba(255,255,255,0.82)'
  context.lineWidth = Math.max(1.5, size * 0.1)
  context.beginPath()
  if (mark === 'triangle') {
    context.moveTo(0, -size)
    context.lineTo(size * 0.88, size * 0.72)
    context.lineTo(-size * 0.88, size * 0.72)
    context.closePath()
  } else if (mark === 'circle') {
    context.arc(0, 0, size * 0.82, 0, Math.PI * 2)
  } else if (mark === 'diamond') {
    context.moveTo(0, -size)
    context.lineTo(size, 0)
    context.lineTo(0, size)
    context.lineTo(-size, 0)
    context.closePath()
  } else if (mark === 'star') {
    for (let point = 0; point < 10; point += 1) {
      const angle = -Math.PI / 2 + point * Math.PI / 5
      const radius = point % 2 === 0 ? size : size * 0.42
      const pointX = Math.cos(angle) * radius
      const pointY = Math.sin(angle) * radius
      if (point === 0) context.moveTo(pointX, pointY)
      else context.lineTo(pointX, pointY)
    }
    context.closePath()
  }
  context.fill()
  context.stroke()
  context.restore()
}

function drawTile(
  context: CanvasRenderingContext2D,
  tile: QuatroTile,
  x: number,
  y: number,
  width: number,
  height: number,
  highlighted: boolean,
): void {
  const rect = { x: x - width / 2, y: y - height / 2, width, height }
  context.save()
  context.shadowColor = 'rgba(0,0,0,0.45)'
  context.shadowBlur = Math.max(2, width * 0.1)
  context.shadowOffsetY = Math.max(1, height * 0.05)
  roundedRect(context, rect, Math.max(4, width * 0.16))
  context.fillStyle = '#f8fafc'
  context.fill()
  context.shadowColor = 'transparent'
  context.lineWidth = highlighted ? 4 : 1.5
  context.strokeStyle = highlighted ? '#ffd54a' : '#111827'
  context.stroke()

  context.save()
  context.translate(x, y)
  context.rotate(-0.2)
  context.scale(1, 1.35)
  context.beginPath()
  context.ellipse(0, 0, width * 0.34, height * 0.28, 0, 0, Math.PI * 2)
  context.fillStyle = tileColors[tile.color]
  context.fill()
  context.restore()

  context.fillStyle = '#ffffff'
  context.strokeStyle = '#111827'
  context.lineWidth = Math.max(1, width * 0.04)
  context.font = `800 ${Math.max(12, height * 0.44)}px system-ui`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.strokeText(String(tile.value), x, y)
  context.fillText(String(tile.value), x, y)
  drawColorblindMark(
    context,
    tile.color,
    x - width * 0.28,
    y - height * 0.3,
    Math.max(3, width * 0.09),
  )

  if (tile.action) {
    const glyph =
      tile.action === 'swap'
        ? '⇄'
        : tile.action === 'push'
          ? '⇩'
          : '−2'
    context.font = `900 ${Math.max(8, height * 0.18)}px system-ui`
    context.fillStyle = '#111827'
    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    context.strokeText(glyph, x + width * 0.24, y + height * 0.32)
    context.fillText(glyph, x + width * 0.24, y + height * 0.32)
  }
  context.restore()
}

function drawHiddenTile(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const rect = { x: x - width / 2, y: y - height / 2, width, height }
  roundedRect(context, rect, 7)
  context.fillStyle = '#111827'
  context.fill()
  context.lineWidth = 2
  context.strokeStyle = '#e5e4e2'
  context.stroke()
  context.font = `900 ${Math.max(9, height * 0.25)}px system-ui`
  context.fillStyle = '#e5e4e2'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('4', x, y)
}

function handTileRects(
  handRect: QuatroRect,
  count: number,
): QuatroRect[] {
  if (count <= 0) return []
  const tileHeight = Math.min(handRect.height * 0.84, 72)
  const tileWidth = tileHeight * 0.66
  const available = Math.max(0, handRect.width - tileWidth)
  const step = count === 1
    ? 0
    : Math.min(tileWidth * 0.8, available / (count - 1))
  const totalWidth = tileWidth + step * (count - 1)
  const startX = handRect.x + (handRect.width - totalWidth) / 2
  return Array.from({ length: count }, (_, index) => ({
    x: startX + step * index,
    y: handRect.y + (handRect.height - tileHeight) / 2,
    width: tileWidth,
    height: tileHeight,
  }))
}

function pointInRect(x: number, y: number, rect: QuatroRect): boolean {
  return (
    x >= rect.x
    && x <= rect.x + rect.width
    && y >= rect.y
    && y <= rect.y + rect.height
  )
}

function drawScene(
  context: CanvasRenderingContext2D,
  layout: QuatroLayout,
  props: QuatroCanvasProps,
): void {
  context.clearRect(0, 0, layout.width, layout.height)
  const background = context.createLinearGradient(
    0,
    0,
    layout.width,
    layout.height,
  )
  background.addColorStop(0, '#101827')
  background.addColorStop(1, '#05070b')
  context.fillStyle = background
  context.fillRect(0, 0, layout.width, layout.height)

  const boardGradient = context.createLinearGradient(
    layout.board.x,
    layout.board.y,
    layout.board.x + layout.board.width,
    layout.board.y + layout.board.height,
  )
  boardGradient.addColorStop(0, '#f3f2ef')
  boardGradient.addColorStop(0.45, '#a7a6a3')
  boardGradient.addColorStop(1, '#3f434a')
  roundedRect(context, layout.board, 18)
  context.fillStyle = boardGradient
  context.fill()
  context.lineWidth = 4
  context.strokeStyle = '#050505'
  context.stroke()

  for (let column = 0; column < 7; column += 1) {
    const tray = layout.trays[column]
    roundedRect(context, tray, Math.max(6, tray.width * 0.12))
    context.fillStyle = props.legalColumns.includes(column)
      ? 'rgba(39,213,255,0.32)'
      : '#171a20'
    context.fill()
    context.lineWidth = props.legalColumns.includes(column) ? 3 : 1.5
    context.strokeStyle = props.legalColumns.includes(column)
      ? '#34d9ff'
      : '#4b515c'
    context.stroke()
    for (const slot of layout.slots[column]) {
      context.beginPath()
      context.arc(slot.x, slot.y, slot.radius, 0, Math.PI * 2)
      context.fillStyle = '#080a0d'
      context.fill()
      context.lineWidth = 1.5
      context.strokeStyle = '#535862'
      context.stroke()
    }
    for (let row = 0; row < props.state.columns[column].length; row += 1) {
      const slot = layout.slots[column][row]
      drawTile(
        context,
        props.state.columns[column][row],
        slot.x,
        slot.y,
        slot.radius * 1.45,
        slot.radius * 1.7,
        false,
      )
    }
  }

  roundedRect(context, layout.bag, Math.max(8, layout.bag.width * 0.18))
  context.fillStyle = '#4c2f22'
  context.fill()
  context.lineWidth = 3
  context.strokeStyle = '#c9a276'
  context.stroke()
  context.beginPath()
  context.moveTo(layout.bag.x + layout.bag.width * 0.14, layout.bag.y + 12)
  context.lineTo(layout.bag.x + layout.bag.width * 0.86, layout.bag.y + 12)
  context.stroke()
  context.fillStyle = '#f7e8cf'
  context.textAlign = 'center'
  context.font = `700 ${Math.max(10, layout.bag.width * 0.14)}px system-ui`
  context.fillText(
    props.labels?.bag ?? 'Bag',
    layout.bag.x + layout.bag.width / 2,
    layout.bag.y + layout.bag.height * 0.55,
  )
  context.font = `900 ${Math.max(14, layout.bag.width * 0.24)}px system-ui`
  context.fillText(
    String(props.state.bag.length),
    layout.bag.x + layout.bag.width / 2,
    layout.bag.y + layout.bag.height * 0.78,
  )

  const viewer = props.state.players.find(
    (player) => player.id === props.viewerPlayerId,
  )
  const opponent = props.state.players.find(
    (player) => player.id !== props.viewerPlayerId,
  )
  if (viewer) {
    const rects = handTileRects(layout.hands.near, viewer.hand.length)
    for (let index = 0; index < viewer.hand.length; index += 1) {
      const rect = rects[index]
      drawTile(
        context,
        viewer.hand[index],
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        rect.width,
        rect.height,
        props.movableTileIds.includes(viewer.hand[index].id)
          || props.selectedTileId === viewer.hand[index].id,
      )
    }
  }
  if (opponent) {
    const rects = handTileRects(layout.hands.far, opponent.handCount)
    for (const rect of rects) {
      drawHiddenTile(
        context,
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        rect.width,
        rect.height,
      )
    }
  }

  if (props.state.winningLine) {
    const first = props.state.winningLine.cells[0]
    const last =
      props.state.winningLine.cells[
        props.state.winningLine.cells.length - 1
      ]
    const from = layout.slots[first.column][first.row]
    const to = layout.slots[last.column][last.row]
    context.beginPath()
    context.moveTo(from.x, from.y)
    context.lineTo(to.x, to.y)
    context.strokeStyle = '#ffe66d'
    context.lineWidth = 7
    context.lineCap = 'round'
    context.stroke()
  }
}

function drawAnimationOverlay(
  context: CanvasRenderingContext2D,
  layout: QuatroLayout,
  track: QuatroAnimationTrack,
  elapsed: number,
): void {
  const duration = Math.max(1, track.endsAt - track.startsAt)
  const progress = Math.max(
    0,
    Math.min(1, (elapsed - track.startsAt) / duration),
  )
  if (track.style === 'static') return
  const bagCenter = {
    x: layout.bag.x + layout.bag.width / 2,
    y: layout.bag.y + layout.bag.height / 2,
  }
  context.save()
  context.lineCap = 'round'

  if (track.style === 'shake') {
    const wobble = Math.sin(progress * Math.PI * 12)
    context.translate(wobble * 6, Math.cos(progress * Math.PI * 10) * 2)
    roundedRect(context, layout.bag, Math.max(8, layout.bag.width * 0.18))
    context.strokeStyle = 'rgba(255,230,109,0.85)'
    context.lineWidth = 4
    context.stroke()
  } else if (track.style === 'bounce') {
    const event = track.event
    if (event.kind === 'drop') {
      const slot = layout.slots[event.column][event.row]
      const startY = layout.board.y - 24
      const eased = 1 - (1 - progress) ** 3
      const bounce = Math.sin(progress * Math.PI * 3) * (1 - progress) * 12
      context.beginPath()
      context.arc(
        slot.x,
        startY + (slot.y - startY) * eased - bounce,
        Math.max(7, slot.radius * 0.35),
        0,
        Math.PI * 2,
      )
      context.fillStyle = 'rgba(255,230,109,0.82)'
      context.fill()
    }
  } else if (track.style === 'cross') {
    const event = track.event
    if (event.kind === 'swap') {
      const first = layout.trays[event.columns[0]]
      const second = layout.trays[event.columns[1]]
      const firstX = first.x + first.width / 2
      const secondX = second.x + second.width / 2
      const y = layout.board.y + layout.board.height / 2
      const arc = Math.sin(progress * Math.PI) * 45
      context.beginPath()
      context.moveTo(firstX, y - arc)
      context.lineTo(firstX + (secondX - firstX) * progress, y - arc)
      context.moveTo(secondX, y + arc)
      context.lineTo(secondX + (firstX - secondX) * progress, y + arc)
      context.strokeStyle = 'rgba(52,217,255,0.9)'
      context.lineWidth = 8
      context.stroke()
    }
  } else if (track.style === 'pulse') {
    const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.2
    context.beginPath()
    context.arc(
      layout.board.x + layout.board.width / 2,
      layout.board.y + layout.board.height / 2,
      Math.min(layout.board.width, layout.board.height) * 0.22 * scale,
      0,
      Math.PI * 2,
    )
    context.strokeStyle = `rgba(255,230,109,${1 - progress * 0.35})`
    context.lineWidth = 9
    context.stroke()
  } else if (track.style === 'particles') {
    const centerX = layout.board.x + layout.board.width / 2
    const centerY = layout.board.y + layout.board.height * 0.42
    for (let index = 0; index < 24; index += 1) {
      const angle = index * 2.399
      const distance =
        progress * Math.min(layout.board.width, layout.board.height) * 0.5
      const x = centerX + Math.cos(angle) * distance
      const y =
        centerY
        + Math.sin(angle) * distance
        + progress * progress * 90
      context.beginPath()
      context.arc(x, y, 2 + (index % 4), 0, Math.PI * 2)
      context.fillStyle = [
        '#ffe66d',
        '#34d9ff',
        '#f04444',
        '#29a85b',
      ][index % 4]
      context.globalAlpha = 1 - progress
      context.fill()
    }
  } else {
    let from = bagCenter
    let to = {
      x: layout.hands.near.x + layout.hands.near.width / 2,
      y: layout.hands.near.y + layout.hands.near.height / 2,
    }
    if (
      track.event.kind === 'returnToBag'
      || track.event.kind === 'minus2Return'
      || track.event.kind === 'push'
    ) {
      ;[from, to] = [to, from]
    } else if (track.event.kind === 'deal') {
      const movement = track.event.movements[
        Math.min(
          track.event.movements.length - 1,
          Math.max(0, track.eventIndex),
        )
      ]
      if (movement?.playerId.endsWith('2')) {
        to = {
          x: layout.hands.far.x + layout.hands.far.width / 2,
          y: layout.hands.far.y + layout.hands.far.height / 2,
        }
      }
    } else if (track.event.kind === 'drop') {
      const slot = layout.slots[track.event.column][track.event.row]
      from = { x: slot.x, y: layout.board.y }
      to = { x: slot.x, y: slot.y }
    }
    const x = from.x + (to.x - from.x) * progress
    const y =
      from.y
      + (to.y - from.y) * progress
      - Math.sin(progress * Math.PI) * 24
    context.beginPath()
    context.arc(x, y, 8, 0, Math.PI * 2)
    context.fillStyle = 'rgba(52,217,255,0.88)'
    context.fill()
  }
  context.restore()
}

export function QuatroCanvas(props: QuatroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const layoutRef = useRef<QuatroLayout | null>(null)
  const frameRef = useRef<number | null>(null)
  const playedSoundKeysRef = useRef(new Set<string>())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const timeline = buildQuatroAnimationTimeline(props.state.events, {
      speed: props.animationSpeed ?? props.state.animationSpeed,
      reducedMotion: props.reducedMotion ?? false,
    })
    const startedAt = performance.now()
    props.onBlockingAnimationChange?.(timeline.durationMs > 0)

    const render = () => {
      frameRef.current = null
      const rect = canvas.getBoundingClientRect()
      const cssWidth = Math.max(1, rect.width || 640)
      const cssHeight = Math.max(1, rect.height || 480)
      const pixelRatio = Math.min(2, window.devicePixelRatio || 1)
      const backingWidth = Math.round(cssWidth * pixelRatio)
      const backingHeight = Math.round(cssHeight * pixelRatio)
      if (
        canvas.width !== backingWidth
        || canvas.height !== backingHeight
      ) {
        canvas.width = backingWidth
        canvas.height = backingHeight
      }
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      const layout = createQuatroLayout(cssWidth, cssHeight)
      layoutRef.current = layout
      drawScene(context, layout, props)
      const elapsed = performance.now() - startedAt
      for (const track of timeline.tracks) {
        if (elapsed < track.startsAt || elapsed > track.endsAt) continue
        drawAnimationOverlay(context, layout, track, elapsed)
        const soundKey =
          `${props.state.transitionSequence}:${track.eventIndex}`
        if (!playedSoundKeysRef.current.has(soundKey)) {
          playedSoundKeysRef.current.add(soundKey)
          const cue = soundCueForQuatroEvent(track.event)
          if (cue) props.onSoundCue?.(cue)
        }
      }
      if (elapsed < timeline.durationMs) {
        frameRef.current = requestAnimationFrame(render)
      } else {
        props.onBlockingAnimationChange?.(false)
      }
    }

    const scheduleRender = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
      frameRef.current = requestAnimationFrame(render)
    }
    const observer = new ResizeObserver(scheduleRender)
    observer.observe(canvas)
    scheduleRender()
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
      observer.disconnect()
      props.onBlockingAnimationChange?.(false)
    }
  }, [props])

  function handlePointerDown(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    const canvas = canvasRef.current
    const layout = layoutRef.current
    if (!canvas || !layout) return
    const bounds = canvas.getBoundingClientRect()
    const x = (event.clientX - bounds.left) * (layout.width / bounds.width)
    const y = (event.clientY - bounds.top) * (layout.height / bounds.height)

    const viewer = props.state.players.find(
      (player) => player.id === props.viewerPlayerId,
    )
    if (viewer && pointInRect(x, y, layout.hands.near)) {
      const rects = handTileRects(layout.hands.near, viewer.hand.length)
      for (let index = rects.length - 1; index >= 0; index -= 1) {
        if (pointInRect(x, y, rects[index])) {
          props.onTileSelect(viewer.hand[index].id)
          return
        }
      }
    }
    const column = hitTestQuatroLayout(layout, x, y)
    if (column !== null) {
      props.onColumnSelect(column)
      return
    }
    if (
      props.state.phase === 'chooseEmptyPush'
      && pointInRect(x, y, layout.bag)
    ) {
      props.onPendingChoice('push')
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="quatro-canvas"
      aria-label="UNO Quatro board"
      onPointerDown={handlePointerDown}
    />
  )
}
