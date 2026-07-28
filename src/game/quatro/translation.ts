import type { Language } from '../../i18n'
import type { QuatroHint } from './hints'

export const QUATRO_TEXT_KEYS = [
  'gameTitle',
  'setupTitle',
  'tableTitle',
  'bag',
  'hand',
  'tray',
  'tile',
  'turn',
  'player',
  'selectTile',
  'placeTile',
  'exchangeTile',
  'keepTile',
  'pushOut',
  'selectSwapFirst',
  'selectSwapSecond',
  'legalMove',
  'illegalMove',
  'waiting',
  'wifiWaiting',
  'privacyPassDevice',
  'rulesHeading',
  'actionsHeading',
  'strategyHeading',
  'actionSwap',
  'actionPush',
  'actionMinus2',
  'hintPlace',
  'hintSwapFirst',
  'hintSwapSecond',
  'hintEmptyPush',
  'hintExchange',
  'hintWait',
  'hintGameOver',
  'winnerTitle',
  'winnerSetup',
  'winnerNewGame',
] as const

export type QuatroTextKey = (typeof QUATRO_TEXT_KEYS)[number]

const quatroTranslations: Record<
  Language,
  Record<QuatroTextKey, string>
> = {
  en: {
    gameTitle: 'UNO Quatro — Four in a Row',
    setupTitle: 'Prepare a two-player Quatro game',
    tableTitle: 'Quatro tile table',
    bag: 'Tile bag',
    hand: 'Your tiles',
    tray: 'Tray',
    tile: 'Tile',
    turn: 'Current turn',
    player: 'Player',
    selectTile: 'Choose a movable tile',
    placeTile: 'Place selected tile',
    exchangeTile: 'Return one tile and draw',
    keepTile: 'Keep tile in the empty tray',
    pushOut: 'Push tile back to the bag',
    selectSwapFirst: 'Choose the first tray to swap',
    selectSwapSecond: 'Choose a different second tray',
    legalMove: 'This tray is a legal destination.',
    illegalMove: 'This tile does not match a neighboring color or number.',
    waiting: 'Wait for the other player to finish.',
    wifiWaiting: 'Waiting for the private Wi‑Fi seat to respond.',
    privacyPassDevice: 'Pass the device, then reveal the next private hand.',
    rulesHeading: 'How to play Quatro',
    actionsHeading: 'Action tile reference',
    strategyHeading: 'Quatro strategy',
    actionSwap: 'Swap two complete trays',
    actionPush: 'Push a tray downward',
    actionMinus2: 'Reduce the next hand by two',
    hintPlace: 'Highlighted tiles and trays are legal; prefer the strongest connection.',
    hintSwapFirst: 'Select the first complete tray for the mandatory swap.',
    hintSwapSecond: 'Select a different tray to finish the mandatory swap.',
    hintEmptyPush: 'Choose whether the Push tile stays or returns to the bag.',
    hintExchange: 'No tile is playable, so return one tile and draw a replacement.',
    hintWait: 'The other player is choosing a move.',
    hintGameOver: 'The winning line is complete.',
    winnerTitle: 'Four in a row!',
    winnerSetup: 'Back to Quatro setup',
    winnerNewGame: 'Start a new Quatro game',
  },
  zh: {
    gameTitle: 'UNO Quatro——四色连珠',
    setupTitle: '准备双人 Quatro 游戏',
    tableTitle: 'Quatro 方块棋盘',
    bag: '方块袋',
    hand: '你的方块',
    tray: '槽列',
    tile: '方块',
    turn: '当前回合',
    player: '玩家',
    selectTile: '选择可移动的方块',
    placeTile: '放置已选方块',
    exchangeTile: '放回一个方块并抽取',
    keepTile: '把方块留在空槽中',
    pushOut: '把方块压回袋中',
    selectSwapFirst: '选择要交换的第一列',
    selectSwapSecond: '选择另一列完成交换',
    legalMove: '这一列是合法落点。',
    illegalMove: '此方块与相邻方块的颜色和数字都不匹配。',
    waiting: '请等待另一位玩家完成操作。',
    wifiWaiting: '正在等待局域网另一席完成操作。',
    privacyPassDevice: '请把设备交给下一位玩家，再显示其私密手牌。',
    rulesHeading: 'Quatro 游戏规则',
    actionsHeading: '行动方块说明',
    strategyHeading: 'Quatro 策略',
    actionSwap: '交换两整列方块',
    actionPush: '向下压动一整列',
    actionMinus2: '让下一手牌减少两个',
    hintPlace: '高亮的方块和槽列均可移动；优先建立更强的连接。',
    hintSwapFirst: '必须交换槽列，请先选择第一整列。',
    hintSwapSecond: '请选择另一列来完成强制交换。',
    hintEmptyPush: '请选择保留压入方块，或把它压回袋中。',
    hintExchange: '当前没有可放方块，请放回一个并抽取替代方块。',
    hintWait: '另一位玩家正在选择操作。',
    hintGameOver: '获胜的四连线已经完成。',
    winnerTitle: '四连线完成！',
    winnerSetup: '返回 Quatro 设置',
    winnerNewGame: '开始新的 Quatro 游戏',
  },
  de: {
    gameTitle: 'UNO Quatro – Vier gewinnt',
    setupTitle: 'Quatro für zwei Personen vorbereiten',
    tableTitle: 'Quatro-Spielbrett',
    bag: 'Steinbeutel',
    hand: 'Deine Steine',
    tray: 'Schiene',
    tile: 'Spielstein',
    turn: 'Aktueller Zug',
    player: 'Spielperson',
    selectTile: 'Einen beweglichen Stein wählen',
    placeTile: 'Gewählten Stein einsetzen',
    exchangeTile: 'Einen Stein zurückgeben und ziehen',
    keepTile: 'Stein in der leeren Schiene behalten',
    pushOut: 'Stein zurück in den Beutel drücken',
    selectSwapFirst: 'Erste Schiene zum Tauschen wählen',
    selectSwapSecond: 'Eine andere zweite Schiene wählen',
    legalMove: 'Diese Schiene ist ein gültiges Ziel.',
    illegalMove: 'Dieser Stein passt weder in Farbe noch Zahl zu einem Nachbarn.',
    waiting: 'Warte, bis die andere Person fertig ist.',
    wifiWaiting: 'Die private WLAN-Gegenstelle ist am Zug.',
    privacyPassDevice: 'Gerät weitergeben und erst dann die nächste private Hand zeigen.',
    rulesHeading: 'Quatro-Spielregeln',
    actionsHeading: 'Übersicht der Aktionssteine',
    strategyHeading: 'Quatro-Strategie',
    actionSwap: 'Zwei vollständige Schienen tauschen',
    actionPush: 'Eine Schiene nach unten drücken',
    actionMinus2: 'Die nächste Hand um zwei verkleinern',
    hintPlace: 'Markierte Steine und Schienen sind erlaubt; bevorzuge starke Verbindungen.',
    hintSwapFirst: 'Wähle die erste vollständige Schiene für den Pflichttausch.',
    hintSwapSecond: 'Wähle eine andere Schiene und schließe den Pflichttausch ab.',
    hintEmptyPush: 'Entscheide, ob der Push-Stein bleibt oder in den Beutel zurückgeht.',
    hintExchange: 'Kein Stein passt; gib einen zurück und ziehe Ersatz.',
    hintWait: 'Die andere Person wählt gerade ihren Zug.',
    hintGameOver: 'Die Gewinnlinie aus vier Steinen ist vollständig.',
    winnerTitle: 'Vier in einer Reihe!',
    winnerSetup: 'Zurück zur Quatro-Einrichtung',
    winnerNewGame: 'Neue Quatro-Partie starten',
  },
}

export interface QuatroHelpSection {
  heading: string
  items: string[]
}

export function quatroText(
  language: Language,
  key: QuatroTextKey,
): string {
  return quatroTranslations[language][key]
}

const rules: Record<Language, QuatroHelpSection[]> = {
  en: [
    {
      heading: 'Objective and setup',
      items: [
        'Win by completing four tiles in a straight horizontal, vertical, or diagonal line that share one color or one number.',
        'The game uses 44 tiles, seven six-slot trays, two players, and a three-tile hand for each player.',
        'A landing tile is legal when it touches no tile or matches the color or number of at least one of its eight possible neighbors, including diagonals.',
        'Placed tiles are neutral: whoever completes a line may use every tile already on the board.',
        'There is no score; the first completed line ends the game after its action is resolved.',
      ],
    },
    {
      heading: 'Turns and special timing',
      items: [
        'If no hand tile is playable, return any one tile and draw a random replacement; play it immediately when it is legal.',
        'Swap always finishes by exchanging two different complete trays before the win check.',
        'Push ejects the bottom tile from a non-empty tray and remains legal in a full tray; in an empty tray choose Keep or Push Out.',
        'Minus 2 returns two random opponent tiles to the bag, so that opponent starts the next turn with one tile and refills to three only after finishing it.',
        'A winner is checked only after Swap, Push, or Minus 2 has completely changed the board and hands.',
      ],
    },
  ],
  zh: [
    {
      heading: '目标与开局',
      items: [
        '横向、纵向或斜向连成四个同色或同数字方块即可获胜。',
        '游戏共有四十四个方块、七个六格槽列、两位玩家；每人持有三个方块。',
        '落点没有相邻方块时可以放置；否则八个方向（包括斜角）至少有一个相邻方块的颜色或数字相同。',
        '棋盘上的方块没有归属；完成连线的人可以利用之前任何玩家放置的方块。',
        '本游戏不计分；行动结算后出现第一条四连线即结束。',
      ],
    },
    {
      heading: '回合与特殊时机',
      items: [
        '手中没有合法方块时，可任选一个放回袋中并随机抽取；若替代方块可放，必须立即放置。',
        '交换方块必须选择两个不同的整列完成互换，然后才检查胜利。',
        '压入方块会把非空槽列底部方块挤回袋中，满列仍可使用；空列则选择保留或压出。',
        '减二方块会随机把对手两个方块放回袋中；对手下一回合只持一个方块，并在完成该回合后补回三个。',
        '交换、压入或减二的全部效果结束后，系统才检查获胜连线。',
      ],
    },
  ],
  de: [
    {
      heading: 'Ziel und Aufbau',
      items: [
        'Gewonnen wird mit vier geraden Steinen waagerecht, senkrecht oder diagonal, die dieselbe Farbe oder dieselbe Zahl zeigen.',
        'Gespielt wird mit 44 Steinen, sieben Schienen mit je sechs Plätzen, genau zwei Personen und drei Handsteinen pro Person.',
        'Ein freistehender Landeplatz ist erlaubt; sonst muss mindestens einer der bis zu acht Nachbarn einschließlich Diagonalen Farbe oder Zahl teilen.',
        'Ausgelegte Steine gehören niemandem; die gewinnende Person darf alle bereits liegenden Steine für ihre Linie nutzen.',
        'Es gibt keine Punkte; die erste fertige Linie beendet die Partie nach Abschluss ihrer Aktion.',
      ],
    },
    {
      heading: 'Züge und Aktionszeitpunkt',
      items: [
        'Passt kein Handstein, wird ein beliebiger Stein zurückgegeben und zufällig ersetzt; ist der Ersatz spielbar, wird er sofort gelegt.',
        'Nach einem Tauschstein müssen zwei verschiedene vollständige Schienen getauscht werden, bevor der Sieg geprüft wird.',
        'Push wirft bei einer nicht leeren Schiene den untersten Stein in den Beutel und ist auch bei voller Schiene erlaubt; bei leerer Schiene gilt Behalten oder Herausdrücken.',
        'Minus 2 legt zwei zufällige gegnerische Steine zurück; die betroffene Person beginnt ihren nächsten Zug mit einem Stein und füllt erst danach wieder auf drei auf.',
        'Erst nach der vollständigen Wirkung von Tausch, Push oder Minus 2 wird nach einer Gewinnlinie gesucht.',
      ],
    },
  ],
}

const actionReference: Record<Language, QuatroHelpSection[]> = {
  en: [
    { heading: 'Swap', items: ['After placing it, choose two different trays; every tile in those trays changes position together.'] },
    { heading: 'Push', items: ['A non-empty tray shifts downward and ejects its bottom tile; an empty tray offers Keep or Push Out.'] },
    { heading: 'Minus 2', items: ['Two random opponent tiles return to the bag; their one-tile turn is refilled only when it ends.'] },
  ],
  zh: [
    { heading: '交换', items: ['放置后选择两个不同槽列，两个槽列中的全部方块一起换位。'] },
    { heading: '压入', items: ['非空槽列整体下移并挤出底部方块；空槽列可选择保留或压出。'] },
    { heading: '减二', items: ['对手随机两个方块回到袋中；其单方块回合结束后才补满。'] },
  ],
  de: [
    { heading: 'Tausch', items: ['Nach dem Legen werden zwei verschiedene Schienen gewählt und mit ihrem gesamten Inhalt vertauscht.'] },
    { heading: 'Push', items: ['Eine nicht leere Schiene rutscht abwärts und wirft den untersten Stein aus; leer bedeutet Behalten oder Herausdrücken.'] },
    { heading: 'Minus zwei', items: ['Zwei zufällige gegnerische Steine gehen zurück; die Ein-Stein-Hand wird erst nach dem Zug aufgefüllt.'] },
  ],
}

const strategy: Record<Language, QuatroHelpSection[]> = {
  en: [{
    heading: 'Connections and disruption',
    items: [
      'Build double threats so two different next moves can finish a line.',
      'Central trays touch more neighbors and usually create more future choices.',
      'Occupy the open fourth cell of a visible opposing color or number threat.',
      'Plan Swap by reading the complete geometry after both trays move.',
      'Use Push to remove a useful bottom tile or change the height of a diagonal.',
      'Time Minus 2 when the opponent is likely to need several alternatives.',
      'Before extending a group, check whether the same tile gives the opponent a forced line.',
    ],
  }],
  zh: [{
    heading: '连接与干扰',
    items: [
      '制造双重威胁，让下一回合有两个不同落点可以完成连线。',
      '中央槽列接触更多邻格，通常能保留更多后续选择。',
      '及时占据对手明显同色或同数字三连线的第四格。',
      '使用交换前，应先推演两个整列换位后的完整几何形状。',
      '使用压入可移除关键底部方块，也能改变斜线所需高度。',
      '当对手需要多种选择时使用减二，干扰效果通常更强。',
      '扩展自己的组合前，先确认同一方块不会让对手形成必胜线。',
    ],
  }],
  de: [{
    heading: 'Verbindungen und Störungen',
    items: [
      'Erzeuge Doppelangriffe, damit zwei verschiedene Folgezüge eine Linie vollenden können.',
      'Mittlere Schienen berühren mehr Nachbarn und eröffnen meist mehr spätere Möglichkeiten.',
      'Besetze das offene vierte Feld einer sichtbaren gegnerischen Farb- oder Zahlendrohung.',
      'Plane einen Tausch anhand der vollständigen Geometrie nach beiden Schienenbewegungen.',
      'Nutze Push, um einen wertvollen unteren Stein zu entfernen oder eine Diagonalhöhe zu verändern.',
      'Setze Minus 2 ein, wenn die Gegenseite wahrscheinlich mehrere Alternativen benötigt.',
      'Prüfe vor jeder Erweiterung, ob derselbe Stein der Gegenseite eine erzwungene Gewinnlinie ermöglicht.',
    ],
  }],
}

export function quatroRuleSections(
  language: Language,
): QuatroHelpSection[] {
  return rules[language]
}

export function quatroActionReference(
  language: Language,
): QuatroHelpSection[] {
  return actionReference[language]
}

export function quatroStrategySections(
  language: Language,
): QuatroHelpSection[] {
  return strategy[language]
}

export function quatroHintText(
  language: Language,
  hint: QuatroHint,
): string {
  if (hint.reasonKey.startsWith('hint.place')) {
    return quatroText(language, 'hintPlace')
  }
  const keys: Record<string, QuatroTextKey> = {
    'hint.swapFirst': 'hintSwapFirst',
    'hint.swapSecond': 'hintSwapSecond',
    'hint.emptyPush': 'hintEmptyPush',
    'hint.exchange': 'hintExchange',
    'hint.wait': 'hintWait',
    'hint.gameOver': 'hintGameOver',
  }
  return quatroText(language, keys[hint.reasonKey] ?? 'hintWait')
}

export function quatroPlayerLabel(
  language: Language,
  playerName: string,
): string {
  return `${quatroText(language, 'player')}: ${playerName}`
}

export function quatroTrayLabel(
  language: Language,
  trayNumber: number,
): string {
  return `${quatroText(language, 'tray')} ${trayNumber}`
}

export function quatroWinnerText(
  language: Language,
  playerName: string,
): string {
  if (language === 'zh') return `${playerName} 完成四连线！`
  if (language === 'de') return `${playerName} hat vier in einer Reihe!`
  return `${playerName} completed four in a row!`
}
