import type {
  QuatroPlayer,
  QuatroWinningLine,
} from '../../game/quatro/types'

export interface QuatroRect {
  x: number
  y: number
  width: number
  height: number
}

export interface QuatroSlot {
  x: number
  y: number
  width: number
  height: number
}

export interface QuatroLayout {
  width: number
  height: number
  board: QuatroRect
  trays: QuatroRect[]
  slots: QuatroSlot[][]
  bag: QuatroRect
  hands: Record<'near' | 'far', QuatroRect>
}

function makeTrayGeometry(board: QuatroRect): {
  trays: QuatroRect[]
  slots: QuatroSlot[][]
} {
  const boardPadding = Math.max(6, Math.min(14, board.width * 0.018))
  const trayGap = Math.max(3, Math.min(10, board.width * 0.008))
  const trayWidth =
    (board.width - boardPadding * 2 - trayGap * 6) / 7
  const trayHeight = board.height - boardPadding * 2
  const slotStep = trayHeight / 6
  const slotSize = Math.max(
    24,
    Math.min(trayWidth * 0.62, slotStep * 0.74),
  )

  const trays = Array.from({ length: 7 }, (_, column) => ({
    x: board.x + boardPadding + column * (trayWidth + trayGap),
    y: board.y + boardPadding,
    width: trayWidth,
    height: trayHeight,
  }))
  const slots = trays.map((tray) =>
    Array.from({ length: 6 }, (_, row) => ({
      x: tray.x + tray.width / 2,
      y: tray.y + tray.height - slotStep * (row + 0.5),
      width: slotSize,
      height: slotSize,
    })),
  )
  return { trays, slots }
}

export function createQuatroLayout(
  rawWidth: number,
  rawHeight: number,
): QuatroLayout {
  const width = Math.max(1, rawWidth)
  const height = Math.max(1, rawHeight)
  const wide = width / height >= 1.15
  const outerPadding = Math.max(8, Math.min(18, width * 0.018))
  const farHeight = Math.max(48, Math.min(62, height * 0.09))
  const nearHeight = Math.max(58, Math.min(78, height * 0.11))
  const far: QuatroRect = {
    x: outerPadding,
    y: outerPadding,
    width: width - outerPadding * 2,
    height: farHeight,
  }
  const near: QuatroRect = {
    x: outerPadding,
    y: height - outerPadding - nearHeight,
    width: width - outerPadding * 2,
    height: nearHeight,
  }
  const contentTop = far.y + far.height + Math.max(8, outerPadding * 0.6)
  const contentBottom = near.y - Math.max(8, outerPadding * 0.6)
  const contentHeight = Math.max(120, contentBottom - contentTop)

  let board: QuatroRect
  let bag: QuatroRect
  if (wide) {
    const bagWidth = Math.max(86, Math.min(150, width * 0.12))
    const gap = Math.max(12, outerPadding)
    bag = {
      x: outerPadding,
      y: contentTop + contentHeight * 0.3,
      width: bagWidth,
      height: Math.min(contentHeight * 0.4, bagWidth * 1.25),
    }
    board = {
      x: bag.x + bag.width + gap,
      y: contentTop,
      width: width - (bag.x + bag.width + gap) - outerPadding,
      height: contentHeight,
    }
  } else {
    const bagWidth = Math.max(48, Math.min(82, width * 0.12))
    const gap = Math.max(6, outerPadding * 0.6)
    board = {
      x: outerPadding,
      y: contentTop,
      width: width - outerPadding * 2 - bagWidth - gap,
      height: contentHeight,
    }
    bag = {
      x: board.x + board.width + gap,
      y: contentTop + contentHeight * 0.34,
      width: bagWidth,
      height: Math.min(contentHeight * 0.32, bagWidth * 1.28),
    }
  }

  const geometry = makeTrayGeometry(board)
  return {
    width,
    height,
    board,
    trays: geometry.trays,
    slots: geometry.slots,
    bag,
    hands: { near, far },
  }
}

export function hitTestQuatroLayout(
  layout: QuatroLayout,
  x: number,
  y: number,
): number | null {
  for (let column = 0; column < layout.slots.length; column += 1) {
    for (const slot of layout.slots[column]) {
      const hitWidth = Math.max(44, slot.width)
      const hitHeight = Math.max(44, slot.height)
      if (
        x >= slot.x - hitWidth / 2
        && x <= slot.x + hitWidth / 2
        && y >= slot.y - hitHeight / 2
        && y <= slot.y + hitHeight / 2
      ) {
        return column
      }
    }
  }
  return null
}

export function quatroWinningLineFrames(
  layout: QuatroLayout,
  line: QuatroWinningLine,
): QuatroRect[] {
  return line.cells.map((cell) => {
    const slot = layout.slots[cell.column][cell.row]
    const width = slot.width * 1.2
    const height = slot.height * 1.2
    return {
      x: slot.x - width / 2,
      y: slot.y - height / 2,
      width,
      height,
    }
  })
}

export function quatroCanvasHandCounts(
  players: readonly QuatroPlayer[],
  viewerPlayerId: string,
): { near: 0; far: number } {
  const opponent = players.find(
    (player) => player.id !== viewerPlayerId,
  )
  return {
    near: 0,
    far: opponent?.handCount ?? 0,
  }
}
