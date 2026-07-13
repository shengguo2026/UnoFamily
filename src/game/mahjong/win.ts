import { sortMahjongTiles } from './tiles'
import type { MahjongTile, MahjongWinMeld, MahjongWinResult } from './types'

export function evaluateMahjongWin(tiles: MahjongTile[], options: { allowSevenPairs?: boolean; exposedMeldCount?: number } = {}): MahjongWinResult {
  const allowSevenPairs = options.allowSevenPairs ?? true
  const exposedMeldCount = options.exposedMeldCount ?? 0
  const expectedTileCount = 14 - exposedMeldCount * 3

  if (exposedMeldCount < 0 || exposedMeldCount > 4 || tiles.length !== expectedTileCount) {
    return losing('wrongTileCount')
  }

  const counts = countTiles(tiles)
  if ([...counts.values()].some((count) => count > 4)) {
    return losing('tooManyCopies')
  }

  if (exposedMeldCount === 0 && allowSevenPairs && isSevenPairs(counts)) {
    return {
      winning: true,
      pattern: 'sevenPairs',
      melds: [],
      pair: null,
    }
  }

  const sorted = sortMahjongTiles(tiles)
  for (const [pairKey, count] of counts) {
    if (count < 2) continue

    const remaining = new Map(counts)
    remaining.set(pairKey, count - 2)
    const melds = decomposeMelds(remaining, sorted)
    if (melds) {
      return {
        winning: true,
        pattern: 'standard',
        melds,
        pair: sorted.filter((tile) => tile.key === pairKey).slice(0, 2),
      }
    }
  }

  return losing('noValidGrouping')
}

function losing(reason: MahjongWinResult['reason']): MahjongWinResult {
  return {
    winning: false,
    pattern: null,
    melds: [],
    pair: null,
    reason,
  }
}

function countTiles(tiles: MahjongTile[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const tile of tiles) {
    counts.set(tile.key, (counts.get(tile.key) ?? 0) + 1)
  }
  return counts
}

function isSevenPairs(counts: Map<string, number>): boolean {
  return counts.size === 7 && [...counts.values()].every((count) => count === 2)
}

function decomposeMelds(counts: Map<string, number>, sourceTiles: MahjongTile[]): MahjongWinMeld[] | null {
  const firstKey = firstRemainingKey(counts, sourceTiles)
  if (!firstKey) return []

  const triplet = takeTriplet(counts, firstKey, sourceTiles)
  if (triplet) {
    const rest = decomposeMelds(triplet.remaining, sourceTiles)
    if (rest) return [triplet.meld, ...rest]
  }

  const sequence = takeSequence(counts, firstKey, sourceTiles)
  if (sequence) {
    const rest = decomposeMelds(sequence.remaining, sourceTiles)
    if (rest) return [sequence.meld, ...rest]
  }

  return null
}

function firstRemainingKey(counts: Map<string, number>, sourceTiles: MahjongTile[]): string | null {
  for (const tile of sourceTiles) {
    if ((counts.get(tile.key) ?? 0) > 0) return tile.key
  }
  return null
}

function takeTriplet(counts: Map<string, number>, key: string, sourceTiles: MahjongTile[]): { remaining: Map<string, number>; meld: MahjongWinMeld } | null {
  if ((counts.get(key) ?? 0) < 3) return null

  const remaining = new Map(counts)
  remaining.set(key, (remaining.get(key) ?? 0) - 3)
  return {
    remaining,
    meld: {
      kind: 'pong',
      tiles: sourceTiles.filter((tile) => tile.key === key).slice(0, 3),
    },
  }
}

function takeSequence(counts: Map<string, number>, key: string, sourceTiles: MahjongTile[]): { remaining: Map<string, number>; meld: MahjongWinMeld } | null {
  const first = sourceTiles.find((tile) => tile.key === key)
  if (!first || first.category !== 'suit' || first.rank > 7) return null

  const secondKey = `${first.suit}-${first.rank + 1}`
  const thirdKey = `${first.suit}-${first.rank + 2}`
  if ((counts.get(secondKey) ?? 0) < 1 || (counts.get(thirdKey) ?? 0) < 1) return null

  const remaining = new Map(counts)
  remaining.set(first.key, (remaining.get(first.key) ?? 0) - 1)
  remaining.set(secondKey, (remaining.get(secondKey) ?? 0) - 1)
  remaining.set(thirdKey, (remaining.get(thirdKey) ?? 0) - 1)

  return {
    remaining,
    meld: {
      kind: 'chow',
      tiles: [
        first,
        sourceTiles.find((tile) => tile.key === secondKey),
        sourceTiles.find((tile) => tile.key === thirdKey),
      ].filter((tile): tile is MahjongTile => Boolean(tile)),
    },
  }
}
