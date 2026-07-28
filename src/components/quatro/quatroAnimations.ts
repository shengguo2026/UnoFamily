import type { AnimationSpeed, SoundCue } from '../../game/types'
import type { QuatroAnimationEvent } from '../../game/quatro/types'
import type {
  QuatroLayout,
  QuatroRect,
} from './quatroLayout'

export type QuatroAnimationStyle =
  | 'static'
  | 'shake'
  | 'linear'
  | 'bounce'
  | 'cross'
  | 'push'
  | 'pulse'
  | 'particles'

export interface QuatroAnimationTrack {
  kind: QuatroAnimationEvent['kind']
  startsAt: number
  endsAt: number
  eventIndex: number
  movementIndex?: number
  event: QuatroAnimationEvent
  style: QuatroAnimationStyle
}

export interface QuatroAnimationTimeline {
  durationMs: number
  tracks: QuatroAnimationTrack[]
}

export interface QuatroAnimationSettings {
  speed: AnimationSpeed
  reducedMotion: boolean
}

export interface QuatroAnimationTransitionSource {
  transitionSequence: number
  events: readonly QuatroAnimationEvent[]
}

export interface QuatroAnimationTransition {
  transitionSequence: number
  timeline: QuatroAnimationTimeline
}

export function quatroInitialDealKey(
  transition: QuatroAnimationTransitionSource,
): string | null {
  const deal = transition.events.find((event) => event.kind === 'deal')
  if (!deal || deal.kind !== 'deal') return null
  return [
    transition.transitionSequence,
    ...deal.movements.flatMap((movement) => [
      movement.playerId,
      movement.tileId,
    ]),
  ].join(':')
}

export function quatroInitialDealPending(
  transition: QuatroAnimationTransitionSource,
  completedDealKey: string | null,
): boolean {
  const dealKey = quatroInitialDealKey(transition)
  return dealKey !== null && completedDealKey !== dealKey
}

const speedMultipliers: Record<AnimationSpeed, number> = {
  fast: 0.7,
  normal: 1,
  slow: 1.35,
}

function fullMotionTracks(
  event: QuatroAnimationEvent,
  eventIndex: number,
  startsAt: number,
): { tracks: QuatroAnimationTrack[]; duration: number } {
  const track = (
    duration: number,
    style: QuatroAnimationStyle,
    offset = 0,
    movementIndex?: number,
  ): QuatroAnimationTrack => ({
    kind: event.kind,
    startsAt: startsAt + offset,
    endsAt: startsAt + offset + duration,
    eventIndex,
    ...(movementIndex === undefined ? {} : { movementIndex }),
    event,
    style,
  })

  if (event.kind === 'bagShake') {
    return { tracks: [track(800, 'shake')], duration: 800 }
  }
  if (event.kind === 'deal') {
    const tracks = event.movements.map((_, index) =>
      track(360, 'linear', index * 105, index),
    )
    return {
      tracks,
      duration: tracks.at(-1)?.endsAt
        ? tracks.at(-1)!.endsAt - startsAt
        : 0,
    }
  }
  if (event.kind === 'drop') {
    return { tracks: [track(430, 'bounce')], duration: 430 }
  }
  if (event.kind === 'swap') {
    return { tracks: [track(720, 'cross')], duration: 720 }
  }
  if (event.kind === 'push') {
    return { tracks: [track(760, 'push')], duration: 760 }
  }
  if (event.kind === 'minus2Return') {
    return {
      tracks: [
        track(480, 'linear', 0, 0),
        track(480, 'linear', 120, 1),
      ],
      duration: 600,
    }
  }
  if (event.kind === 'returnToBag') {
    return { tracks: [track(330, 'linear')], duration: 330 }
  }
  if (event.kind === 'draw') {
    return { tracks: [track(360, 'linear')], duration: 360 }
  }
  if (event.kind === 'win') {
    return {
      tracks: [
        track(420, 'pulse'),
        track(900, 'particles', 420),
      ],
      duration: 1320,
    }
  }
  return { tracks: [track(80, 'linear')], duration: 80 }
}

export function quatroAnimationHandForPlayer(
  viewerPlayerId: string,
  playerId: string,
): 'near' | 'far' {
  return playerId === viewerPlayerId ? 'near' : 'far'
}

export function quatroSoundKey(
  transitionSequence: number,
  track: QuatroAnimationTrack,
): string {
  return [
    transitionSequence,
    track.eventIndex,
    track.kind === 'deal' ? track.movementIndex ?? 0 : 0,
  ].join(':')
}

export function quatroDropPoint(
  layout: QuatroLayout,
  event: Extract<QuatroAnimationEvent, { kind: 'drop' }>,
  progress: number,
): { x: number; y: number } {
  const normalized = Math.max(0, Math.min(1, progress))
  const slot = layout.slots[event.column][event.row]
  const startY = layout.board.y - slot.height
  const eased = 1 - (1 - normalized) ** 3
  const bounce =
    Math.sin(normalized * Math.PI * 3)
    * (1 - normalized)
    * Math.max(8, slot.height * 0.32)
  return {
    x: slot.x,
    y: startY + (slot.y - startY) * eased - bounce,
  }
}

export function quatroPushArrowGeometry(
  layout: QuatroLayout,
  column: number,
  progress: number,
): { x: number; y: number } {
  const normalized = Math.max(0, Math.min(1, progress))
  const tray = layout.trays[column]
  return {
    x: tray.x + tray.width / 2,
    y:
      tray.y
      + tray.height * (0.16 + normalized * 0.72),
  }
}

export interface QuatroSwapTrayTransform extends QuatroRect {
  sourceColumn: number
  targetColumn: number
}

export function quatroSwapTrayTransforms(
  layout: QuatroLayout,
  columns: [number, number],
  progress: number,
): [QuatroSwapTrayTransform, QuatroSwapTrayTransform] {
  const normalized = Math.max(0, Math.min(1, progress))
  const lift = Math.sin(normalized * Math.PI)
    * Math.min(52, layout.board.height * 0.13)
  const makeTransform = (
    sourceColumn: number,
    targetColumn: number,
  ): QuatroSwapTrayTransform => {
    const source = layout.trays[sourceColumn]
    const target = layout.trays[targetColumn]
    return {
      sourceColumn,
      targetColumn,
      x: source.x + (target.x - source.x) * normalized,
      y: source.y - lift,
      width: source.width,
      height: source.height,
    }
  }
  return [
    makeTransform(columns[0], columns[1]),
    makeTransform(columns[1], columns[0]),
  ]
}

export function buildQuatroAnimationTimeline(
  events: readonly QuatroAnimationEvent[],
  settings: QuatroAnimationSettings,
): QuatroAnimationTimeline {
  if (settings.reducedMotion) {
    let cursor = 0
    const tracks = events.map((event, eventIndex) => {
      const duration = event.kind === 'turn' ? 40 : 100
      const result: QuatroAnimationTrack = {
        kind: event.kind,
        startsAt: cursor,
        endsAt: cursor + duration,
        eventIndex,
        event,
        style: 'static',
      }
      cursor += duration
      return result
    })
    return { durationMs: cursor, tracks }
  }

  const multiplier = speedMultipliers[settings.speed]
  let cursor = 0
  const tracks: QuatroAnimationTrack[] = []
  events.forEach((event, eventIndex) => {
    const segment = fullMotionTracks(event, eventIndex, cursor)
    tracks.push(...segment.tracks)
    cursor += segment.duration
  })
  const scaledTracks = tracks.map((track) => ({
    ...track,
    startsAt: Math.round(track.startsAt * multiplier),
    endsAt: Math.round(track.endsAt * multiplier),
  }))
  return {
    durationMs: Math.round(cursor * multiplier),
    tracks: scaledTracks,
  }
}

export function buildQuatroAnimationTimelineForTransition(
  transition: QuatroAnimationTransitionSource,
  settings: QuatroAnimationSettings,
): QuatroAnimationTransition {
  return {
    transitionSequence: transition.transitionSequence,
    timeline: buildQuatroAnimationTimeline(transition.events, settings),
  }
}

export function quatroActiveDropTileIds(
  tracks: readonly QuatroAnimationTrack[],
  elapsedMs: number,
): Set<string> {
  return new Set(
    tracks
      .filter(
        (track) =>
          track.event.kind === 'drop'
          && track.style !== 'static'
          && elapsedMs >= track.startsAt
          && elapsedMs <= track.endsAt,
      )
      .map((track) =>
        track.event.kind === 'drop' ? track.event.tileId : '',
      ),
  )
}

export function soundCueForQuatroEvent(
  event: QuatroAnimationEvent,
): SoundCue | null {
  if (event.kind === 'bagShake') return 'quatroBagShake'
  if (event.kind === 'deal') return 'quatroDeal'
  if (event.kind === 'drop') return 'quatroDrop'
  if (event.kind === 'swap') return 'quatroSwap'
  if (event.kind === 'push') return 'quatroPush'
  if (event.kind === 'minus2Return') return 'quatroMinus2'
  if (event.kind === 'returnToBag') return 'quatroReturn'
  if (event.kind === 'draw') return 'quatroDraw'
  if (event.kind === 'win') return 'quatroWin'
  return null
}
