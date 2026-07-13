export type MahjongTableFeltTheme = 'classicGreen' | 'skyBlue' | 'goldenBeach' | 'chineseRed'
export type MahjongTableFrameTheme = 'classicMahjong' | 'vintage' | 'premiumWood' | 'luxusKing'
export type MahjongCenterPattern = 'none' | 'dragon' | 'lion' | 'faCai' | 'yuanBao'
export type MahjongTileDeckTheme = 'classicIvory' | 'jadeGreen' | 'golden' | 'ruby' | 'sapphire'

export interface MahjongVisualTheme {
  felt: MahjongTableFeltTheme
  frame: MahjongTableFrameTheme
  centerPattern: MahjongCenterPattern
  tileDeck: MahjongTileDeckTheme
}

export interface MahjongFeltPalette {
  base: string
  glow: string
  shade: string
  line: string
}

export interface MahjongFramePalette {
  rail: string
  railRoughness: number
  railMetalness: number
  inlay: string
  inlayMetalness: number
}

export interface MahjongCenterPatternSpec {
  label: string
  motif: 'none' | 'dragon' | 'lion' | 'yuanBao' | 'text'
  color: string
}

export interface MahjongTileDeckPalette {
  side: string
  selectedSide: string
  face: string
  faceMid: string
  faceShade: string
  border: string
  back: string
}

export const mahjongTableFeltThemes: MahjongTableFeltTheme[] = ['classicGreen', 'skyBlue', 'goldenBeach', 'chineseRed']
export const mahjongTableFrameThemes: MahjongTableFrameTheme[] = ['classicMahjong', 'vintage', 'premiumWood', 'luxusKing']
export const mahjongCenterPatterns: MahjongCenterPattern[] = ['none', 'dragon', 'lion', 'faCai', 'yuanBao']
export const mahjongTileDeckThemes: MahjongTileDeckTheme[] = ['classicIvory', 'jadeGreen', 'golden', 'ruby', 'sapphire']

export const defaultMahjongVisualTheme: MahjongVisualTheme = {
  felt: 'classicGreen',
  frame: 'classicMahjong',
  centerPattern: 'none',
  tileDeck: 'classicIvory',
}

const feltPalettes: Record<MahjongTableFeltTheme, MahjongFeltPalette> = {
  classicGreen: { base: '#136347', glow: '#1c7a58', shade: '#0e4d38', line: 'rgba(255,255,255,0.055)' },
  skyBlue: { base: '#2d7ea8', glow: '#5bb6d8', shade: '#1f577c', line: 'rgba(255,255,255,0.09)' },
  goldenBeach: { base: '#c99a45', glow: '#e8c46d', shade: '#8f652d', line: 'rgba(65,42,18,0.12)' },
  chineseRed: { base: '#9d2f2b', glow: '#ca4b3f', shade: '#6e1e21', line: 'rgba(255,229,186,0.1)' },
}

const framePalettes: Record<MahjongTableFrameTheme, MahjongFramePalette> = {
  classicMahjong: { rail: '#6b3a24', railRoughness: 0.36, railMetalness: 0.04, inlay: '#c58d44', inlayMetalness: 0.18 },
  vintage: { rail: '#7a4a2d', railRoughness: 0.62, railMetalness: 0.02, inlay: '#b68b58', inlayMetalness: 0.08 },
  premiumWood: { rail: '#4f2f1d', railRoughness: 0.28, railMetalness: 0.06, inlay: '#d6a75b', inlayMetalness: 0.16 },
  luxusKing: { rail: '#261713', railRoughness: 0.22, railMetalness: 0.2, inlay: '#f0c85a', inlayMetalness: 0.55 },
}

const centerPatternSpecs: Record<MahjongCenterPattern, MahjongCenterPatternSpec> = {
  none: { label: '', motif: 'none', color: 'rgba(0,0,0,0)' },
  dragon: { label: '龍', motif: 'dragon', color: 'rgba(245, 207, 100, 0.34)' },
  lion: { label: '獅', motif: 'lion', color: 'rgba(245, 207, 100, 0.32)' },
  faCai: { label: '發', motif: 'text', color: 'rgba(255, 232, 128, 0.38)' },
  yuanBao: { label: '元寶', motif: 'yuanBao', color: 'rgba(255, 210, 92, 0.38)' },
}

const tileDeckPalettes: Record<MahjongTileDeckTheme, MahjongTileDeckPalette> = {
  classicIvory: {
    side: '#f8ead0',
    selectedSide: '#ffe27a',
    face: '#fffdf2',
    faceMid: '#f7eed6',
    faceShade: '#e8d8b4',
    border: '#cdbb8f',
    back: '#173328',
  },
  jadeGreen: {
    side: '#6bbf8a',
    selectedSide: '#b8f1c9',
    face: '#eefbf0',
    faceMid: '#d6f2dd',
    faceShade: '#b5dfc1',
    border: '#6fa981',
    back: '#20543b',
  },
  golden: {
    side: '#d9a93d',
    selectedSide: '#ffe082',
    face: '#fff4c8',
    faceMid: '#f1d982',
    faceShade: '#d8b456',
    border: '#9b7430',
    back: '#5a3d18',
  },
  ruby: {
    side: '#a83245',
    selectedSide: '#e07182',
    face: '#fff1f2',
    faceMid: '#f5d0d5',
    faceShade: '#daa3ac',
    border: '#9b4a56',
    back: '#551924',
  },
  sapphire: {
    side: '#2f5fa8',
    selectedSide: '#79a8f2',
    face: '#eef5ff',
    faceMid: '#cfe0f8',
    faceShade: '#aabfe0',
    border: '#496eaa',
    back: '#18345f',
  },
}

export function mahjongFeltPalette(theme: MahjongTableFeltTheme): MahjongFeltPalette {
  return feltPalettes[theme]
}

export function mahjongFramePalette(theme: MahjongTableFrameTheme): MahjongFramePalette {
  return framePalettes[theme]
}

export function mahjongCenterPatternSpec(pattern: MahjongCenterPattern): MahjongCenterPatternSpec {
  return centerPatternSpecs[pattern]
}

export function mahjongTileDeckPalette(theme: MahjongTileDeckTheme): MahjongTileDeckPalette {
  return tileDeckPalettes[theme]
}
