import type { PrivateQuatroState } from '../game/quatro/privacy'
import type { QuatroState } from '../game/quatro/types'

export interface AcceptedQuatroWifiSnapshot {
  state: QuatroState
  lastAnimatedSequence: number
}

export function acceptQuatroWifiSnapshot(
  snapshot: PrivateQuatroState,
  previousSequence: number | null,
): AcceptedQuatroWifiSnapshot {
  const incomingSequence = snapshot.transitionSequence
  const shouldAnimate =
    (
      previousSequence !== null
      && incomingSequence > previousSequence
    )
    || (
      previousSequence === null
      && incomingSequence === 1
      && snapshot.events.some((event) => event.kind === 'deal')
    )

  return {
    state: {
      ...snapshot,
      events: shouldAnimate ? snapshot.events : [],
    },
    lastAnimatedSequence:
      previousSequence === null
        ? incomingSequence
        : Math.max(previousSequence, incomingSequence),
  }
}
