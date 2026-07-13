import type { Language } from '../../i18n'
import type { MahjongState } from './types'

export function mahjongSelectedTileText(language: Language, state: MahjongState, tileId: string): string {
  const tile = state.players
    .flatMap((player) => [
      ...player.concealed,
      ...player.flowers,
      ...player.discardRiver,
      ...player.exposedMelds.flatMap((meld) => meld.tiles),
    ])
    .find((candidate) => candidate.id === tileId)
  return tile ? mahjongTileKeyText(language, tile.key) : tileId
}

export function mahjongLogText(language: Language, text: string): string {
  if (language === 'en') return text

  const dealer = text.match(/^(.+) starts as dealer\.$/)
  if (dealer) {
    const name = dealer[1] ?? ''
    return language === 'zh' ? `${name} 开始做庄家。` : `${name} beginnt als Geber.`
  }

  const discarded = text.match(/^(.+) discarded ([^.]+)\.$/)
  if (discarded) {
    const name = discarded[1] ?? ''
    const tile = mahjongTileKeyText(language, discarded[2] ?? '')
    return language === 'zh' ? `${name} 打出 ${tile}。` : `${name} wirft ${tile} ab.`
  }

  const drew = text.match(/^(.+) drew a tile\.$/)
  if (drew) {
    const name = drew[1] ?? ''
    return language === 'zh' ? `${name} 摸了一张牌。` : `${name} zieht einen Stein.`
  }

  const claimed = text.match(/^(.+) claimed (chow|pong|kong)\.$/)
  if (claimed) {
    const name = claimed[1] ?? ''
    const action = mahjongClaimLogName(language, claimed[2] ?? '')
    return language === 'zh' ? `${name} ${action}。` : `${name} meldet ${action}.`
  }

  const winOn = text.match(/^(.+) wins on ([^.]+)\.$/)
  if (winOn) {
    const name = winOn[1] ?? ''
    const tile = mahjongTileKeyText(language, winOn[2] ?? '')
    return language === 'zh' ? `${name} 胡 ${tile}。` : `${name} gewinnt mit ${tile}.`
  }

  const selfDraw = text.match(/^(.+) wins by self-draw\.$/)
  if (selfDraw) {
    const name = selfDraw[1] ?? ''
    return language === 'zh' ? `${name} 自摸胡。` : `${name} gewinnt selbst gezogen.`
  }

  const round = text.match(/^Round (\d+) begins\.$/)
  if (round) {
    const roundNumber = round[1] ?? ''
    return language === 'zh' ? `第 ${roundNumber} 局开始。` : `Runde ${roundNumber} beginnt.`
  }

  const exact: Record<Language, Record<string, string>> = {
    en: {},
    zh: {
      'Nobody claimed the discard.': '无人鸣这张弃牌。',
      'The wall is exhausted. The round is drawn.': '牌墙已摸完，本局流局。',
      'No replacement tile remains. The round is drawn.': '没有补牌，本局流局。',
      'Nobody robbed the kong.': '无人抢杠。',
    },
    de: {
      'Nobody claimed the discard.': 'Niemand meldet die Ablage.',
      'The wall is exhausted. The round is drawn.': 'Die Mauer ist leer. Die Runde endet unentschieden.',
      'No replacement tile remains. The round is drawn.': 'Kein Ersatzstein bleibt. Die Runde endet unentschieden.',
      'Nobody robbed the kong.': 'Niemand raubt den Kong.',
    },
  }
  return exact[language][text] ?? text
}

export function mahjongTileKeyText(language: Language, key: string): string {
  const suit = key.match(/^(dots|bamboo|characters)-(\d)$/)
  if (suit) {
    const rank = suit[2] ?? ''
    const suitName = suit[1] === 'dots'
      ? language === 'zh' ? '筒' : language === 'de' ? 'Kreise' : 'dots'
      : suit[1] === 'bamboo'
        ? language === 'zh' ? '条' : language === 'de' ? 'Bambus' : 'bamboo'
        : language === 'zh' ? '万' : language === 'de' ? 'Zeichen' : 'characters'
    return language === 'zh' ? `${rank}${suitName}` : `${rank} ${suitName}`
  }
  const winds: Record<string, Record<Language, string>> = {
    'wind-east': { en: 'East wind', zh: '东风', de: 'Ostwind' },
    'wind-south': { en: 'South wind', zh: '南风', de: 'Südwind' },
    'wind-west': { en: 'West wind', zh: '西风', de: 'Westwind' },
    'wind-north': { en: 'North wind', zh: '北风', de: 'Nordwind' },
  }
  const dragons: Record<string, Record<Language, string>> = {
    'dragon-red': { en: 'Red dragon', zh: '红中', de: 'Roter Drache' },
    'dragon-green': { en: 'Green dragon', zh: '发财', de: 'Grüner Drache' },
    'dragon-white': { en: 'White dragon', zh: '白板', de: 'Weißer Drache' },
  }
  return winds[key]?.[language] ?? dragons[key]?.[language] ?? key
}

function mahjongClaimLogName(language: Exclude<Language, 'en'>, action: string): string {
  if (language === 'zh') {
    if (action === 'chow') return '吃'
    if (action === 'pong') return '碰'
    return '杠'
  }
  if (action === 'chow') return 'Chow'
  if (action === 'pong') return 'Pong'
  return 'Kong'
}
