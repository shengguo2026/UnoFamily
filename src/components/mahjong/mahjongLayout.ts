export type MahjongSeatId = 'bottom' | 'right' | 'top' | 'left'
export type MahjongWallSide = MahjongSeatId

export interface MahjongVector3 {
  x: number
  y: number
  z: number
}

export interface MahjongLayoutInput {
  viewportWidth: number
  viewportHeight: number
}

export interface MahjongTileDimensions {
  width: number
  height: number
  depth: number
  gap: number
}

export interface MahjongSeatLayout {
  id: MahjongSeatId
  playerIndex: number
  hand: {
    position: MahjongVector3
    rotationY: number
    maxTiles: number
    axis: 'x' | 'z'
  }
  melds: {
    position: MahjongVector3
    rotationY: number
  }
  label: {
    position: MahjongVector3
  }
}

export interface MahjongWallStackLayout {
  side: MahjongWallSide
  index: number
  position: MahjongVector3
  rotationY: number
}

export interface MahjongTableLayout {
  table: {
    width: number
    depth: number
  }
  tile: MahjongTileDimensions
  wallStackLevels: number
  camera: {
    fov: number
    position: MahjongVector3
    target: MahjongVector3
  }
  seats: MahjongSeatLayout[]
  wallStacks: MahjongWallStackLayout[]
  discardCenter: MahjongVector3
}

export interface MahjongCameraFitInput {
  viewportWidth: number
  viewportHeight: number
  fov: number
  direction: MahjongVector3
  bounds: {
    width: number
    depth: number
    height: number
  }
  margin: number
}

export function createMahjongTableLayout(input: MahjongLayoutInput): MahjongTableLayout {
  const isMobile = input.viewportWidth < 700 || input.viewportHeight < 520
  const tableWidth = isMobile ? 9.4 : 14.4
  const tableDepth = isMobile ? 7.2 : 10.2
  const tile: MahjongTileDimensions = {
    width: isMobile ? 0.29 : 0.42,
    height: isMobile ? 0.39 : 0.56,
    depth: isMobile ? 0.15 : 0.22,
    gap: isMobile ? 0.035 : 0.06,
  }
  const handZ = tableDepth / 2 - tile.height * 2.35
  const handX = tableWidth / 2 - tile.height * 2.35
  const cameraFov = isMobile ? 62 : 38
  const cameraDirection = { x: 0, y: isMobile ? 10.8 : 8.2, z: isMobile ? 7.6 : 7.8 }
  const fittedCameraDistance = fitMahjongCameraDistance({
    viewportWidth: input.viewportWidth,
    viewportHeight: input.viewportHeight,
    fov: cameraFov,
    direction: cameraDirection,
    bounds: {
      width: tableWidth + 0.8,
      depth: tableDepth + 0.8,
      height: 1.4,
    },
    margin: 0.9,
  })
  const cameraDirectionLength = vectorLength(cameraDirection)
  const cameraDistanceScale = fittedCameraDistance / cameraDirectionLength

  return {
    table: { width: tableWidth, depth: tableDepth },
    tile,
    wallStackLevels: 2,
    camera: {
      fov: cameraFov,
      position: {
        x: cameraDirection.x * cameraDistanceScale,
        y: cameraDirection.y * cameraDistanceScale,
        z: cameraDirection.z * cameraDistanceScale,
      },
      target: { x: 0, y: 0, z: 0 },
    },
    seats: [
      seat('bottom', 0, { x: 0, y: tile.depth / 2, z: handZ }, 0, 14, 'x'),
      seat('right', 1, { x: handX, y: tile.depth / 2, z: 0 }, -Math.PI / 2, 14, 'z'),
      seat('top', 2, { x: 0, y: tile.depth / 2, z: -handZ }, Math.PI, 14, 'x'),
      seat('left', 3, { x: -handX, y: tile.depth / 2, z: 0 }, Math.PI / 2, 14, 'z'),
    ],
    wallStacks: createWallStacks(tableWidth, tableDepth, tile),
    discardCenter: { x: 0, y: tile.depth / 2, z: 0 },
  }
}

export function fitMahjongCameraDistance(input: MahjongCameraFitInput): number {
  const viewportWidth = Math.max(1, input.viewportWidth)
  const viewportHeight = Math.max(1, input.viewportHeight)
  const aspect = viewportWidth / viewportHeight
  const verticalHalfFov = Math.max(0.01, Math.min(Math.PI / 2 - 0.01, input.fov * Math.PI / 360))
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * aspect)
  const framingMargin = Math.max(0.1, Math.min(1, input.margin))
  const direction = normalizeVector(input.direction, { x: 0, y: 1, z: 1 })
  const forward = { x: -direction.x, y: -direction.y, z: -direction.z }
  const worldUp = { x: 0, y: 1, z: 0 }
  const rightCandidate = crossProduct(forward, worldUp)
  const right = normalizeVector(
    rightCandidate,
    normalizeVector(crossProduct(forward, { x: 0, y: 0, z: 1 }), { x: 1, y: 0, z: 0 }),
  )
  const up = normalizeVector(crossProduct(right, forward), worldUp)
  const halfWidth = Math.max(0, input.bounds.width / 2)
  const halfDepth = Math.max(0, input.bounds.depth / 2)
  const halfHeight = Math.max(0, input.bounds.height / 2)
  const horizontalTangent = Math.max(0.001, Math.tan(horizontalHalfFov) * framingMargin)
  const verticalTangent = Math.max(0.001, Math.tan(verticalHalfFov) * framingMargin)
  let distance = 0.1

  for (const x of [-halfWidth, halfWidth]) {
    for (const y of [-halfHeight, halfHeight]) {
      for (const z of [-halfDepth, halfDepth]) {
        const corner = { x, y, z }
        const forwardOffset = dotProduct(corner, forward)
        distance = Math.max(
          distance,
          Math.abs(dotProduct(corner, right)) / horizontalTangent - forwardOffset,
          Math.abs(dotProduct(corner, up)) / verticalTangent - forwardOffset,
        )
      }
    }
  }

  return distance
}

function seat(id: MahjongSeatId, playerIndex: number, position: MahjongVector3, rotationY: number, maxTiles: number, axis: 'x' | 'z'): MahjongSeatLayout {
  return {
    id,
    playerIndex,
    hand: { position, rotationY, maxTiles, axis },
    melds: {
      position: {
        x: position.x * 0.82,
        y: position.y,
        z: position.z * 0.82,
      },
      rotationY,
    },
    label: {
      position: {
        x: position.x,
        y: position.y + 0.36,
        z: position.z,
      },
    },
  }
}

function createWallStacks(tableWidth: number, tableDepth: number, tile: MahjongTileDimensions): MahjongWallStackLayout[] {
  const stacks: MahjongWallStackLayout[] = []
  const spacing = tile.width + tile.gap
  const bottomZ = tableDepth * 0.24
  const topZ = -bottomZ
  const rightX = tableWidth * 0.26
  const leftX = -rightX
  const start = -((18 - 1) * spacing) / 2

  for (let index = 0; index < 18; index += 1) {
    const offset = start + index * spacing
    stacks.push({ side: 'bottom', index, position: { x: offset, y: tile.depth / 2, z: bottomZ }, rotationY: 0 })
    stacks.push({ side: 'top', index, position: { x: -offset, y: tile.depth / 2, z: topZ }, rotationY: Math.PI })
    stacks.push({ side: 'right', index, position: { x: rightX, y: tile.depth / 2, z: offset }, rotationY: -Math.PI / 2 })
    stacks.push({ side: 'left', index, position: { x: leftX, y: tile.depth / 2, z: -offset }, rotationY: Math.PI / 2 })
  }

  return stacks
}

function vectorLength(vector: MahjongVector3): number {
  return Math.hypot(vector.x, vector.y, vector.z)
}

function normalizeVector(vector: MahjongVector3, fallback: MahjongVector3): MahjongVector3 {
  const length = vectorLength(vector)
  if (length <= 0.000001) return normalizeVector(fallback, { x: 1, y: 0, z: 0 })
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  }
}

function dotProduct(left: MahjongVector3, right: MahjongVector3): number {
  return left.x * right.x + left.y * right.y + left.z * right.z
}

function crossProduct(left: MahjongVector3, right: MahjongVector3): MahjongVector3 {
  return {
    x: left.y * right.z - left.z * right.y,
    y: left.z * right.x - left.x * right.z,
    z: left.x * right.y - left.y * right.x,
  }
}
