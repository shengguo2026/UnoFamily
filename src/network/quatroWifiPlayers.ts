import type {
  QuatroAnimationEvent,
  QuatroPlayer,
  QuatroState,
  QuatroTraceEntry,
} from '../game/quatro/types'

export type QuatroWifiPlayerIdentity = Pick<
  QuatroPlayer,
  'id' | 'name' | 'type' | 'avatarId'
> & {
  aiDifficulty?: QuatroPlayer['aiDifficulty']
}

function remapPlayerId(
  playerId: string | null,
  playerIds: ReadonlyMap<string, string>,
): string | null {
  return playerId === null
    ? null
    : playerIds.get(playerId) ?? playerId
}

function remapEvent(
  event: QuatroAnimationEvent,
  playerIds: ReadonlyMap<string, string>,
): QuatroAnimationEvent {
  if (event.kind === 'deal') {
    return {
      ...event,
      movements: event.movements.map((movement) => ({
        ...movement,
        playerId: remapPlayerId(movement.playerId, playerIds)!,
      })),
    }
  }
  if (
    event.kind === 'drop'
    || event.kind === 'minus2Return'
    || event.kind === 'returnToBag'
    || event.kind === 'draw'
    || event.kind === 'turn'
    || event.kind === 'win'
  ) {
    return {
      ...event,
      playerId: remapPlayerId(event.playerId, playerIds)!,
    }
  }
  return event
}

function remapTrace(
  entry: QuatroTraceEntry,
  playerIds: ReadonlyMap<string, string>,
): QuatroTraceEntry {
  if (entry.kind === 'minus2') {
    return {
      ...entry,
      playerId: remapPlayerId(entry.playerId, playerIds)!,
      targetPlayerId: remapPlayerId(entry.targetPlayerId, playerIds)!,
    }
  }
  return {
    ...entry,
    playerId: remapPlayerId(entry.playerId, playerIds)!,
  }
}

export function remapQuatroPlayersForWifi(
  state: QuatroState,
  identities: readonly [
    QuatroWifiPlayerIdentity,
    QuatroWifiPlayerIdentity,
  ],
): QuatroState {
  const playerIds = new Map(
    state.players.map((player, index) => [
      player.id,
      identities[index].id,
    ]),
  )
  const players = state.players.map((player, index) => ({
    ...player,
    ...identities[index],
  })) as QuatroState['players']

  return {
    ...state,
    players,
    winnerId: remapPlayerId(state.winnerId, playerIds),
    minus2RefillPlayerId: remapPlayerId(
      state.minus2RefillPlayerId,
      playerIds,
    ),
    events: state.events.map((event) => remapEvent(event, playerIds)),
    log: state.log.map((entry) => remapTrace(entry, playerIds)),
  }
}
