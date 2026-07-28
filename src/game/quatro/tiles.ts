import type {
  QuatroActionKind,
  QuatroColor,
  QuatroRandom,
  QuatroTile,
} from './types'

export type QuatroColorMark = 'triangle' | 'circle' | 'star' | 'diamond'

export const QUATRO_COLOR_MARKS: Record<QuatroColor, QuatroColorMark> = {
  red: 'triangle',
  green: 'circle',
  yellow: 'star',
  blue: 'diamond',
}

const specs = [
  ['blue', 0, null], ['blue', 1, null], ['blue', 1, 'minus2'],
  ['blue', 2, 'swap'], ['blue', 2, 'push'], ['blue', 3, null],
  ['blue', 3, 'swap'], ['blue', 4, 'push'], ['blue', 4, 'swap'],
  ['blue', 5, null], ['blue', 5, 'minus2'],
  ['green', 0, 'minus2'], ['green', 1, null], ['green', 1, 'swap'],
  ['green', 2, null], ['green', 2, 'swap'], ['green', 3, null],
  ['green', 3, 'push'], ['green', 4, null], ['green', 4, 'minus2'],
  ['green', 5, 'swap'], ['green', 5, 'push'],
  ['red', 0, null], ['red', 1, 'push'], ['red', 1, 'swap'],
  ['red', 2, null], ['red', 2, 'minus2'], ['red', 3, 'push'],
  ['red', 3, 'swap'], ['red', 4, null], ['red', 4, 'swap'],
  ['red', 5, null], ['red', 5, 'minus2'],
  ['yellow', 0, 'swap'], ['yellow', 1, null], ['yellow', 1, 'minus2'],
  ['yellow', 2, null], ['yellow', 2, 'push'], ['yellow', 3, null],
  ['yellow', 3, 'minus2'], ['yellow', 4, 'push'], ['yellow', 4, 'swap'],
  ['yellow', 5, null], ['yellow', 5, 'swap'],
] as const satisfies ReadonlyArray<
  readonly [QuatroColor, QuatroTile['value'], QuatroActionKind | null]
>

export function buildQuatroBag(): QuatroTile[] {
  const occurrences = new Map<string, number>()

  return specs.map(([color, value, action]) => {
    const key = `${color}-${value}-${action ?? 'normal'}`
    const occurrence = (occurrences.get(key) ?? 0) + 1
    occurrences.set(key, occurrence)
    return {
      id: `${key}-${occurrence}`,
      color,
      value,
      action,
    }
  })
}

export function shuffleQuatroTiles(
  tiles: readonly QuatroTile[],
  random: QuatroRandom,
): QuatroTile[] {
  const shuffled = [...tiles]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = random.int(index + 1)
    if (!Number.isInteger(swapIndex) || swapIndex < 0 || swapIndex > index) {
      throw new RangeError('Quatro random source returned an invalid index')
    }
    ;[shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ]
  }
  return shuffled
}
