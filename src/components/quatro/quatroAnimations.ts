import type { AnimationSpeed, SoundCue } from '../../game/types'
import type { QuatroAnimationEvent } from '../../game/quatro/types'

export type QuatroAnimationStyle =
  | 'static'
  | 'shake'
  | 'linear'
  | 'bounce'
  | 'cross'
  | 'pulse'
  | 'particles'

export interface QuatroAnimationTrack {
  kind: QuatroAnimationEvent['kind']
  startsAt: number
  endsAt: number
  eventIndex: number
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
  ): QuatroAnimationTrack => ({
    kind: event.kind,
    startsAt: startsAt + offset,
    endsAt: startsAt + offset + duration,
    eventIndex,
    event,
    style,
  })

  if (event.kind === 'bagShake') {
    return { tracks: [track(800, 'shake')], duration: 800 }
  }
  if (event.kind === 'deal') {
    const tracks = event.movements.map((_, index) =>
      track(360, 'linear', index * 105),
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
    return { tracks: [track(650, 'linear')], duration: 650 }
  }
  if (event.kind === 'minus2Return') {
    return {
      tracks: [track(480, 'linear'), track(480, 'linear', 120)],
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
