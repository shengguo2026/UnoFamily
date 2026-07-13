import type { MahjongDragon, MahjongFlower, MahjongPlayerState, MahjongSeason, MahjongSuit, MahjongTile, MahjongWind } from './types'

const suits: MahjongSuit[] = ['dots', 'bamboo', 'characters']
const winds: MahjongWind[] = ['east', 'south', 'west', 'north']
const dragons: MahjongDragon[] = ['red', 'green', 'white']
const flowers: MahjongFlower[] = ['plum', 'orchid', 'chrysanthemum', 'bamboo']
const seasons: MahjongSeason[] = ['spring', 'summer', 'autumn', 'winter']

const suitOrder: Record<MahjongSuit, number> = {
  dots: 0,
  bamboo: 1,
  characters: 2,
}

const windOrder: Record<MahjongWind, number> = {
  east: 0,
  south: 1,
  west: 2,
  north: 3,
}

const dragonOrder: Record<MahjongDragon, number> = {
  red: 0,
  green: 1,
  white: 2,
}

export function buildMahjongTileSet(): MahjongTile[] {
  const tiles: MahjongTile[] = []

  for (const suit of suits) {
    for (let rank = 1; rank <= 9; rank += 1) {
      for (let copy = 1; copy <= 4; copy += 1) {
        tiles.push({ id: `${suit}-${rank}-${copy}`, category: 'suit', suit, rank, copy, key: `${suit}-${rank}` })
      }
    }
  }

  for (const wind of winds) {
    for (let copy = 1; copy <= 4; copy += 1) {
      tiles.push({ id: `wind-${wind}-${copy}`, category: 'wind', wind, copy, key: `wind-${wind}` })
    }
  }

  for (const dragon of dragons) {
    for (let copy = 1; copy <= 4; copy += 1) {
      tiles.push({ id: `dragon-${dragon}-${copy}`, category: 'dragon', dragon, copy, key: `dragon-${dragon}` })
    }
  }

  flowers.forEach((flower, index) => {
    tiles.push({ id: `flower-${flower}-1`, category: 'flower', flower, copy: index + 1, key: `flower-${flower}` })
  })

  seasons.forEach((season, index) => {
    tiles.push({ id: `season-${season}-1`, category: 'season', season, copy: index + 1, key: `season-${season}` })
  })

  return tiles
}

export function shuffleMahjongTiles(tiles: MahjongTile[], random: () => number = Math.random): MahjongTile[] {
  const shuffled = [...tiles]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = shuffled[index]
    const swap = shuffled[swapIndex]
    if (!current || !swap) continue
    shuffled[index] = swap
    shuffled[swapIndex] = current
  }
  return shuffled
}

export function mahjongTileSortValue(tile: MahjongTile): number {
  if (tile.category === 'suit') return suitOrder[tile.suit] * 100 + tile.rank * 4 + tile.copy
  if (tile.category === 'wind') return 300 + windOrder[tile.wind] * 4 + tile.copy
  if (tile.category === 'dragon') return 400 + dragonOrder[tile.dragon] * 4 + tile.copy
  if (tile.category === 'flower') return 500 + tile.copy
  return 600 + tile.copy
}

export function sortMahjongTiles(tiles: MahjongTile[]): MahjongTile[] {
  return [...tiles].sort((left, right) => mahjongTileSortValue(left) - mahjongTileSortValue(right))
}

export function isMahjongBonusTile(tile: MahjongTile): boolean {
  return tile.category === 'flower' || tile.category === 'season'
}

export interface MahjongDealResult {
  players: MahjongPlayerState[]
  wall: MahjongTile[]
  deadWall: MahjongTile[]
}

export function dealMahjongRound(wall: MahjongTile[], playerIds: string[], dealerIndex: number): MahjongDealResult {
  const liveWall = wall.slice(0, Math.max(0, wall.length - 14))
  const deadWall = wall.slice(Math.max(0, wall.length - 14))
  const playerWinds: MahjongWind[] = ['east', 'south', 'west', 'north']
  const players = playerIds.map<MahjongPlayerState>((playerId, index) => ({
    id: playerId,
    name: index === 0 ? 'Player 1' : `Player ${index + 1}`,
    type: 'human',
    concealed: [],
    exposedMelds: [],
    flowers: [],
    discardRiver: [],
    score: 0,
    wind: playerWinds[(index - dealerIndex + 4) % 4],
  }))

  players.forEach((player, index) => {
    const targetHandSize = index === dealerIndex ? 14 : 13
    while (player.concealed.length < targetHandSize) {
      const tile = drawFromFront(liveWall)
      if (!tile) break
      addDealtTile(player, tile, deadWall)
    }
    player.concealed = sortMahjongTiles(player.concealed)
  })

  return { players, wall: liveWall, deadWall }
}

function drawFromFront(wall: MahjongTile[]): MahjongTile | undefined {
  return wall.shift()
}

function drawReplacement(deadWall: MahjongTile[]): MahjongTile | undefined {
  return deadWall.pop()
}

function addDealtTile(player: MahjongPlayerState, tile: MahjongTile, deadWall: MahjongTile[]): void {
  if (!isMahjongBonusTile(tile)) {
    player.concealed.push(tile)
    return
  }

  player.flowers.push(tile)
  let replacement = drawReplacement(deadWall)
  while (replacement) {
    if (!isMahjongBonusTile(replacement)) {
      player.concealed.push(replacement)
      return
    }
    player.flowers.push(replacement)
    replacement = drawReplacement(deadWall)
  }
}
