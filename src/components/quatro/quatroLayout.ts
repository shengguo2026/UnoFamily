export interface QuatroRect {
  x: number
  y: number
  width: number
  height: number
}

export interface QuatroSlot {
  x: number
  y: number
  radius: number
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
  const radius = Math.max(
    8,
    Math.min(trayWidth * 0.36, slotStep * 0.34),
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
      radius,
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
      const deltaX = x - slot.x
      const deltaY = y - slot.y
      const hitRadius = Math.max(22, slot.radius)
      if (
        deltaX * deltaX + deltaY * deltaY
        <= hitRadius * hitRadius
      ) {
        return column
      }
    }
  }
  return null
}
