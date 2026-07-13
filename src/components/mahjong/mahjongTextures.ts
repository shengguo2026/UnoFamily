import type { MahjongDragon, MahjongSuit, MahjongTile, MahjongWind } from '../../game/mahjong/types'

export interface MahjongTileFaceSpec {
  primary: string
  secondary: string
  accent: string
  motifAccent: string
  corner: string
  center: string
  motif: 'dot' | 'bamboo' | 'character' | 'wind' | 'dragon' | 'flower' | 'season'
  count: number
}

const suitLabels: Record<MahjongSuit, { secondary: string; accent: string; corner: string; center: string }> = {
  dots: { secondary: 'Dots', accent: '#165aa8', corner: '筒', center: '筒' },
  bamboo: { secondary: 'Bamboo', accent: '#146c3a', corner: '条', center: '条' },
  characters: { secondary: 'Chars', accent: '#c7352d', corner: '萬', center: '萬' },
}

const windLabels: Record<MahjongWind, { primary: string; secondary: string; corner: string; center: string }> = {
  east: { primary: '東', secondary: 'East', corner: '東', center: '東' },
  south: { primary: '南', secondary: 'South', corner: '南', center: '南' },
  west: { primary: '西', secondary: 'West', corner: '西', center: '西' },
  north: { primary: '北', secondary: 'North', corner: '北', center: '北' },
}

const dragonLabels: Record<MahjongDragon, { primary: string; secondary: string; accent: string; corner: string; center: string }> = {
  red: { primary: '中', secondary: 'Red', accent: '#c7352d', corner: '中', center: '中' },
  green: { primary: '發', secondary: 'Green', accent: '#146c3a', corner: '發', center: '發' },
  white: { primary: '白', secondary: 'White', accent: '#1f2933', corner: '白', center: '白' },
}

const flowerLabels: Record<string, { primary: string; secondary: string; accent: string; corner: string; center: string }> = {
  plum: { primary: '梅', secondary: 'Plum', accent: '#b56a1d', corner: '花', center: '梅' },
  orchid: { primary: '蘭', secondary: 'Orchid', accent: '#b56a1d', corner: '花', center: '蘭' },
  chrysanthemum: { primary: '菊', secondary: 'Chrysanthemum', accent: '#b56a1d', corner: '花', center: '菊' },
  bamboo: { primary: '竹', secondary: 'Bamboo flower', accent: '#b56a1d', corner: '花', center: '竹' },
}

const seasonLabels: Record<string, { primary: string; secondary: string; accent: string; corner: string; center: string }> = {
  spring: { primary: '春', secondary: 'Spring', accent: '#8c5fbf', corner: '季', center: '春' },
  summer: { primary: '夏', secondary: 'Summer', accent: '#8c5fbf', corner: '季', center: '夏' },
  autumn: { primary: '秋', secondary: 'Autumn', accent: '#8c5fbf', corner: '季', center: '秋' },
  winter: { primary: '冬', secondary: 'Winter', accent: '#8c5fbf', corner: '季', center: '冬' },
}

export function createMahjongTileFaceSpec(tile: MahjongTile): MahjongTileFaceSpec {
  if (tile.category === 'suit') {
    const suit = suitLabels[tile.suit]
    return { primary: String(tile.rank), secondary: suit.secondary, accent: suit.accent, motifAccent: suit.accent, corner: suit.corner, center: suit.center, motif: tile.suit === 'dots' ? 'dot' : tile.suit === 'bamboo' ? 'bamboo' : 'character', count: tile.rank }
  }
  if (tile.category === 'wind') {
    const wind = windLabels[tile.wind]
    return { primary: wind.primary, secondary: wind.secondary, accent: '#1f2933', motifAccent: '#1f2933', corner: wind.corner, center: wind.center, motif: 'wind', count: 1 }
  }
  if (tile.category === 'dragon') {
    const dragon = dragonLabels[tile.dragon]
    return { ...dragon, motifAccent: dragon.accent, motif: 'dragon', count: 1 }
  }
  if (tile.category === 'flower') {
    const flower = flowerLabels[tile.flower]
    return { ...flower, motifAccent: flower.accent, motif: 'flower', count: 1 }
  }
  const season = seasonLabels[tile.season]
  return { ...season, motifAccent: season.accent, motif: 'season', count: 1 }
}

export function titleCase(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`
}
