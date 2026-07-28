import type {
  QuatroAnimationEvent,
  QuatroPlayer,
  QuatroState,
  QuatroTile,
} from './types'

export type PrivateQuatroState = Omit<QuatroState, 'bag'> & {
  bag: []
  bagCount: number
}

function cloneTile(tile: QuatroTile): QuatroTile {
  return { ...tile }
}

function privateEvent(
  event: QuatroAnimationEvent,
  viewerPlayerId: string,
): QuatroAnimationEvent {
  if (event.kind === 'deal') {
    return {
      ...event,
      movements: event.movements.map((movement) => ({
        ...movement,
        tileId:
          movement.playerId === viewerPlayerId
            ? movement.tileId
            : '',
      })),
    }
  }
  if (
    event.kind === 'minus2Return'
    && event.playerId !== viewerPlayerId
  ) {
    return { ...event, tileIds: ['', ''] }
  }
  if (
    (event.kind === 'draw' || event.kind === 'returnToBag')
    && event.playerId !== viewerPlayerId
  ) {
    return { ...event, tileId: '' }
  }
  if (event.kind === 'win') {
    return {
      ...event,
      line: {
        ...event.line,
        cells: event.line.cells.map((cell) => ({ ...cell })),
      },
    }
  }
  if (event.kind === 'swap') {
    return {
      ...event,
      columns: [...event.columns] as [number, number],
      trayTiles: event.trayTiles
        ? [
            event.trayTiles[0].map(cloneTile),
            event.trayTiles[1].map(cloneTile),
          ]
        : undefined,
    }
  }
  if (event.kind === 'push') {
    return {
      ...event,
      ejectedTile: event.ejectedTile
        ? cloneTile(event.ejectedTile)
        : event.ejectedTile,
    }
  }
  if (event.kind === 'minus2Return') {
    return { ...event, tileIds: [...event.tileIds] as [string, string] }
  }
  return { ...event }
}

export function createPrivateQuatroState(
  state: QuatroState,
  viewerPlayerId: string,
): PrivateQuatroState {
  const players = state.players.map((player): QuatroPlayer => ({
    ...player,
    hand:
      player.id === viewerPlayerId
        ? player.hand.map(cloneTile)
        : [],
    handCount: player.hand.length,
  })) as [QuatroPlayer, QuatroPlayer]

  return {
    ...state,
    players,
    bag: [],
    bagCount: state.bag.length,
    columns: state.columns.map((column) =>
      column.map(cloneTile),
    ) as QuatroState['columns'],
    events: state.events.map((event) =>
      privateEvent(event, viewerPlayerId),
    ),
    winningLine: state.winningLine
      ? {
          ...state.winningLine,
          cells: state.winningLine.cells.map((cell) => ({ ...cell })),
        }
      : null,
    log: state.log.map((entry) => {
      if (entry.kind === 'place') {
        return { ...entry, tile: { ...entry.tile } }
      }
      if (entry.kind === 'swap') {
        return {
          ...entry,
          columns: [...entry.columns] as [number, number],
        }
      }
      return { ...entry }
    }),
  }
}
