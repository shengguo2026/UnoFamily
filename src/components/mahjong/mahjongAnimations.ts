import { buildMahjongTileSet } from '../../game/mahjong/tiles'
import type { MahjongMeld, MahjongState, MahjongTile } from '../../game/mahjong/types'
import { evaluateMahjongWin } from '../../game/mahjong/win'

export type MahjongAnimationEventKind = 'chow' | 'pong' | 'kong' | 'ready' | 'win'

export interface MahjongAnimationTransition {
  key: string
  roundStart: boolean
  drawnTileId: string | null
  discardedTileId: string | null
  claimedTileId: string | null
  claimTileIds: string[]
  eventKind: MahjongAnimationEventKind | null
  playerId: string | null
  sourcePlayerId: string | null
}

interface LocatedTile {
  playerId: string
  tile: MahjongTile
}

interface LocatedMeld {
  playerId: string
  meld: MahjongMeld
  previousMeld: MahjongMeld | null
}

const readyCandidates = [...new Map(
  buildMahjongTileSet()
    .filter((tile) => tile.category !== 'flower' && tile.category !== 'season')
    .map((tile) => [tile.key, tile]),
).values()]

export function deriveMahjongAnimationTransition(previous: MahjongState | null, next: MahjongState | null): MahjongAnimationTransition | null {
  if (!next) return null
  const roundStart = !previous || previous.currentRound !== next.currentRound
  if (roundStart) {
    const logId = next.log[next.log.length - 1]?.id ?? next.nextLogId
    return {
      key: `${next.currentRound}:${logId}:round-start`,
      roundStart: true,
      drawnTileId: null,
      discardedTileId: null,
      claimedTileId: null,
      claimTileIds: [],
      eventKind: null,
      playerId: null,
      sourcePlayerId: null,
    }
  }
  if (!previous) return null
  const winnerId = next.winnerId && next.winnerId !== previous.winnerId ? next.winnerId : null
  const drawn = !winnerId ? findAddedConcealedTile(previous, next) : null
  const discarded = previous ? findAddedDiscard(previous, next) : null
  const changedMeld = previous ? findChangedMeld(previous, next) : null
  const readyPlayerId = discarded && mahjongWaitingTileKeys(next, discarded.playerId).length > 0 ? discarded.playerId : null
  const eventKind: MahjongAnimationEventKind | null = winnerId
    ? 'win'
    : changedMeld
      ? changedMeld.meld.kind
      : readyPlayerId
        ? 'ready'
        : null
  const playerId = winnerId ?? changedMeld?.playerId ?? readyPlayerId ?? drawn?.playerId ?? discarded?.playerId ?? null
  const sourcePlayerId = changedMeld?.meld.claimedFromPlayerId ?? discarded?.playerId ?? null

  if (!drawn && !discarded && !changedMeld && !winnerId && !readyPlayerId) return null

  const changedTileIds = changedMeld
    ? changedMeld.meld.tiles
      .filter((tile) => !changedMeld.previousMeld?.tiles.some((previousTile) => previousTile.id === tile.id))
      .map((tile) => tile.id)
    : []
  const claimTileIds = changedMeld?.meld.tiles.map((tile) => tile.id) ?? []
  const claimedTileId = changedMeld?.meld.claimedTileId ?? changedTileIds[0] ?? null
  const logId = next.log[next.log.length - 1]?.id ?? next.nextLogId

  return {
    key: [next.currentRound, logId, eventKind ?? 'move', drawn?.tile.id ?? '', discarded?.tile.id ?? '', claimedTileId ?? ''].join(':'),
    roundStart: false,
    drawnTileId: drawn?.tile.id ?? null,
    discardedTileId: discarded?.tile.id ?? null,
    claimedTileId,
    claimTileIds,
    eventKind,
    playerId,
    sourcePlayerId,
  }
}

export function mahjongWaitingTileKeys(state: MahjongState, playerId: string): string[] {
  const player = state.players.find((candidate) => candidate.id === playerId)
  if (!player) return []
  const expectedReadyTileCount = 13 - player.exposedMelds.length * 3
  if (player.concealed.length !== expectedReadyTileCount) return []
  const counts = new Map<string, number>()
  for (const tile of player.concealed) counts.set(tile.key, (counts.get(tile.key) ?? 0) + 1)

  return readyCandidates
    .filter((candidate) => (counts.get(candidate.key) ?? 0) < 4)
    .filter((candidate) => evaluateMahjongWin(
      [...player.concealed, { ...candidate, id: `ready-${candidate.key}`, copy: (counts.get(candidate.key) ?? 0) + 1 }],
      { allowSevenPairs: state.ruleProfile.allowSevenPairs, exposedMeldCount: player.exposedMelds.length },
    ).winning)
    .map((candidate) => candidate.key)
}

function findAddedConcealedTile(previous: MahjongState, next: MahjongState): LocatedTile | null {
  for (const player of next.players) {
    const previousIds = new Set(previous.players.find((candidate) => candidate.id === player.id)?.concealed.map((tile) => tile.id) ?? [])
    const tile = player.concealed.find((candidate) => !previousIds.has(candidate.id))
    if (tile) return { playerId: player.id, tile }
  }
  return null
}

function findAddedDiscard(previous: MahjongState, next: MahjongState): LocatedTile | null {
  for (const player of next.players) {
    const previousIds = new Set(previous.players.find((candidate) => candidate.id === player.id)?.discardRiver.map((tile) => tile.id) ?? [])
    const tile = player.discardRiver.find((candidate) => !previousIds.has(candidate.id))
    if (tile) return { playerId: player.id, tile }
  }
  return null
}

function findChangedMeld(previous: MahjongState, next: MahjongState): LocatedMeld | null {
  for (const player of next.players) {
    const previousMelds = previous.players.find((candidate) => candidate.id === player.id)?.exposedMelds ?? []
    for (const meld of player.exposedMelds) {
      const exact = previousMelds.find((candidate) => meldSignature(candidate) === meldSignature(meld))
      if (exact) continue
      const previousMeld = meld.kind === 'kong'
        ? previousMelds.find((candidate) => candidate.kind === 'pong' && candidate.tiles.every((tile) => meld.tiles.some((nextTile) => nextTile.id === tile.id))) ?? null
        : null
      return { playerId: player.id, meld, previousMeld }
    }
  }
  return null
}

function meldSignature(meld: MahjongMeld): string {
  return `${meld.kind}:${meld.tiles.map((tile) => tile.id).sort().join('|')}`
}
