import type { Card, CardFlourishStyle, CardKind, GameMode, GameState, UnoColor } from './game/types'
import { tippoLegalTrayIndexes, topCard, triplePlayLegalPileIndexes } from './game/classic'

export type Language = 'en' | 'zh' | 'de'

type TranslationKey =
  | 'appName'
  | 'chooseTable'
  | 'homeLead'
  | 'playable'
  | 'planned'
  | 'back'
  | 'start'
  | 'rules'
  | 'close'
  | 'gameOne'
  | 'mode'
  | 'players'
  | 'totalPlayers'
  | 'startingCards'
  | 'sessionTarget'
  | 'aiDifficulty'
  | 'spectacularDelay'
  | 'flashTimer'
  | 'flashTimerOff'
  | 'flashUnit'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'addOnPacks'
  | 'localWifiHint'
  | 'localWifiLobby'
  | 'wifiGameSyncPending'
  | 'wifiPlayerName'
  | 'wifiAllowAi'
  | 'wifiStatus'
  | 'wifiIdle'
  | 'wifiConnecting'
  | 'wifiConnected'
  | 'wifiError'
  | 'hostRoom'
  | 'joinRoom'
  | 'joinCode'
  | 'leaveRoom'
  | 'startRoomGame'
  | 'roomCode'
  | 'connectedPlayers'
  | 'setup'
  | 'round'
  | 'sound'
  | 'theme'
  | 'lightTheme'
  | 'darkTheme'
  | 'hotSeat'
  | 'hotSeatTurn'
  | 'hotSeatHint'
  | 'revealHand'
  | 'choice'
  | 'chooseColor'
  | 'chooseTarget'
  | 'chooseTwoTargets'
  | 'cancel'
  | 'gameOver'
  | 'roundComplete'
  | 'wins'
  | 'scoreHint'
  | 'congratulations'
  | 'scoringDetails'
  | 'roundScore'
  | 'subtotal'
  | 'total'
  | 'sessionScore'
  | 'continueSession'
  | 'resumeSession'
  | 'closeSession'
  | 'newSession'
  | 'noCards'
  | 'backToSetup'
  | 'waitingForHost'
  | 'nextRound'
  | 'turn'
  | 'activeColor'
  | 'playableCards'
  | 'draw'
  | 'launcher'
  | 'endTurn'
  | 'acceptDraw'
  | 'challengeDraw4'
  | 'catchUno'
  | 'recommendation'
  | 'recommendPlay'
  | 'recommendCallUnoPlay'
  | 'recommendDraw'
  | 'recommendLauncher'
  | 'recommendAcceptPenalty'
  | 'recommendWait'
  | 'recommendReasonFinish'
  | 'recommendReasonCallUno'
  | 'recommendReasonPressure'
  | 'recommendReasonPenalty'
  | 'recommendReasonWild'
  | 'recommendReasonKeepColor'
  | 'recommendReasonNumber'
  | 'recommendReasonSymbol'
  | 'recommendReasonPoints'
  | 'recommendReasonForcedColor'
  | 'recommendReasonForcedPlay'
  | 'recommendReasonDraw'
  | 'recommendReasonAccept'
  | 'recommendReasonWait'
  | 'eventLog'
  | 'cards'
  | 'points'
  | 'clockwise'
  | 'counterClockwise'
  | 'drawStack'
  | 'cardEffect'
  | 'moveStatus'
  | 'movable'
  | 'notMovable'
  | 'waitForTurn'
  | 'deckCount'
  | 'drawPile'
  | 'none'
  | 'moreGamesUnlockTitle'
  | 'moreGamesPassword'
  | 'moreGamesConfirm'
  | 'moreGamesChecking'
  | 'moreGamesFailure'

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    appName: 'Uno Family',
    chooseTable: "Guo's card games collection",
    homeLead: 'The first five UNO games are available for playable passes. The remaining rule sets are staged here for the next milestones.',
    playable: 'Playable',
    planned: 'Planned',
    back: 'Back',
    start: 'Start',
    rules: 'Rules',
    close: 'Close',
    gameOne: 'Game 1',
    mode: 'Mode',
    players: 'Players',
    totalPlayers: 'Total players',
    startingCards: 'Starting cards',
    sessionTarget: 'Session points',
    aiDifficulty: 'AI difficulty',
    spectacularDelay: 'AI card delay',
    flashTimer: 'Flash timer',
    flashTimerOff: 'Unlimited',
    flashUnit: 'Flash unit',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    addOnPacks: 'Add-on Packs',
    localWifiHint: 'Local WiFi rooms use this computer as a lightweight host for synchronized play.',
    localWifiLobby: 'Local WiFi lobby',
    wifiGameSyncPending: 'Host a room on this computer, then let players on the same network join with the 4-digit code.',
    wifiPlayerName: 'Your name',
    wifiAllowAi: 'Allow AI fill-ins',
    wifiStatus: 'Status',
    wifiIdle: 'Idle',
    wifiConnecting: 'Connecting',
    wifiConnected: 'Connected',
    wifiError: 'Connection issue',
    hostRoom: 'Host room',
    joinRoom: 'Join room',
    joinCode: 'Join code',
    leaveRoom: 'Leave room',
    startRoomGame: 'Start room game',
    roomCode: 'Room code',
    connectedPlayers: 'Connected players',
    setup: 'Setup',
    round: 'Round',
    sound: 'Sound',
    theme: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    hotSeat: 'Hot Seat',
    hotSeatTurn: 'turn',
    hotSeatHint: 'Pass the computer before revealing this hand.',
    revealHand: 'Reveal hand',
    choice: 'Choice',
    chooseColor: 'Choose the next color.',
    chooseTarget: 'Choose a player to swap hands with.',
    chooseTwoTargets: 'Choose two other players to swap hands.',
    cancel: 'Cancel',
    gameOver: 'Game Over',
    roundComplete: 'Round Complete',
    wins: 'wins',
    scoreHint: 'Scores are updated from cards left in every opponent hand.',
    congratulations: 'Congratulations',
    scoringDetails: 'Score calculation',
    roundScore: 'Round score',
    subtotal: 'Subtotal',
    total: 'Total',
    sessionScore: 'Session score',
    continueSession: 'Continue session',
    resumeSession: 'Resume session',
    closeSession: 'Close session',
    newSession: 'Start new session',
    noCards: 'No cards',
    backToSetup: 'Back to setup',
    waitingForHost: 'Waiting for the host to continue the session.',
    nextRound: 'Next round',
    turn: 'Turn',
    activeColor: 'Active color',
    playableCards: 'playable cards',
    draw: 'Draw',
    launcher: 'Launcher',
    endTurn: 'End turn',
    acceptDraw: 'Accept draw',
    challengeDraw4: 'Challenge +4',
    catchUno: 'Catch UNO',
    recommendation: 'Hint',
    recommendPlay: 'Play',
    recommendCallUnoPlay: 'Call UNO, then play',
    recommendDraw: 'Draw a card',
    recommendLauncher: 'Press the launcher',
    recommendAcceptPenalty: 'Accept the draw penalty',
    recommendWait: 'Wait',
    recommendReasonFinish: 'This can empty your hand and score the round.',
    recommendReasonCallUno: 'You will have one card left, so call UNO first to stay safe.',
    recommendReasonPressure: 'It pressures the next player, who is close to going out.',
    recommendReasonPenalty: 'It answers the current draw penalty instead of accepting it.',
    recommendReasonWild: 'It lets you choose the color that best fits your hand.',
    recommendReasonKeepColor: 'It keeps play in a color you still hold.',
    recommendReasonNumber: 'It matches the number on the top card.',
    recommendReasonSymbol: 'It matches the action symbol on the top card.',
    recommendReasonPoints: 'It removes the highest-risk points from your hand.',
    recommendReasonForcedColor: 'Speed Play requires the chosen color now.',
    recommendReasonForcedPlay: 'The current card effect requires an immediate follow-up play.',
    recommendReasonDraw: 'No card in your hand is currently movable.',
    recommendReasonAccept: 'No card can answer the pending draw penalty.',
    recommendReasonWait: 'Wait until it is your controllable turn.',
    eventLog: 'Event log',
    cards: 'cards',
    points: 'pts',
    clockwise: 'Clockwise',
    counterClockwise: 'Counter-clockwise',
    drawStack: 'Draw stack',
    cardEffect: 'Effect',
    moveStatus: 'Move',
    movable: 'Movable',
    notMovable: 'Not movable',
    waitForTurn: 'Not movable because it is not your turn.',
    deckCount: 'Deck',
    drawPile: 'Draw',
    none: 'None',
    moreGamesUnlockTitle: 'More games',
    moreGamesPassword: 'Password',
    moreGamesConfirm: 'Confirm',
    moreGamesChecking: 'Checking…',
    moreGamesFailure: 'Unable to unlock a game.',
  },
  zh: {
    appName: 'UNO 家族',
    chooseTable: '盛国的纸牌游戏收藏',
    homeLead: '前五个 UNO 游戏已可进行可玩版本测试。其余规则集会在后续里程碑逐步加入。',
    playable: '可玩',
    planned: '计划中',
    back: '返回',
    start: '开始',
    rules: '规则',
    close: '关闭',
    gameOne: '游戏 1',
    mode: '模式',
    players: '玩家',
    totalPlayers: '玩家总数',
    startingCards: '起始手牌',
    sessionTarget: '会话目标分',
    aiDifficulty: 'AI 难度',
    spectacularDelay: 'AI 出牌延迟',
    flashTimer: 'Flash 计时器',
    flashTimerOff: '无限制',
    flashUnit: 'Flash 装置',
    easy: '简单',
    medium: '中等',
    hard: '困难',
    addOnPacks: '扩展包',
    localWifiHint: '本地 WiFi 房间会使用这台电脑作为轻量主机进行同步对局。',
    localWifiLobby: '本地 WiFi 大厅',
    wifiGameSyncPending: '在这台电脑上创建房间，同一网络中的玩家可用 4 位代码加入。',
    wifiPlayerName: '你的名字',
    wifiAllowAi: '允许 AI 补位',
    wifiStatus: '状态',
    wifiIdle: '空闲',
    wifiConnecting: '连接中',
    wifiConnected: '已连接',
    wifiError: '连接问题',
    hostRoom: '创建房间',
    joinRoom: '加入房间',
    joinCode: '加入代码',
    leaveRoom: '离开房间',
    startRoomGame: '开始房间对局',
    roomCode: '房间代码',
    connectedPlayers: '已连接玩家',
    setup: '设置',
    round: '回合',
    sound: '音效',
    theme: '主题',
    lightTheme: '浅色',
    darkTheme: '深色',
    hotSeat: '本地轮流',
    hotSeatTurn: '的回合',
    hotSeatHint: '请先把电脑交给下一位玩家，再显示手牌。',
    revealHand: '显示手牌',
    choice: '选择',
    chooseColor: '选择下一种颜色。',
    chooseTarget: '选择一名玩家交换手牌。',
    chooseTwoTargets: '选择另外两名玩家交换手牌。',
    cancel: '取消',
    gameOver: '游戏结束',
    roundComplete: '本局结束',
    wins: '获胜',
    scoreHint: '分数已根据其他玩家剩余手牌更新。',
    congratulations: '恭喜',
    scoringDetails: '计分明细',
    roundScore: '本局得分',
    subtotal: '小计',
    total: '总计',
    sessionScore: '本次会话分数',
    continueSession: '继续本次会话',
    resumeSession: '继续会话',
    closeSession: '关闭会话',
    newSession: '开始新会话',
    noCards: '无手牌',
    backToSetup: '返回设置',
    waitingForHost: '正在等待主机继续本次会话。',
    nextRound: '下一局',
    turn: '当前回合',
    activeColor: '当前颜色',
    playableCards: '张可出的牌',
    draw: '摸牌',
    launcher: '发牌器',
    endTurn: '结束回合',
    acceptDraw: '接受摸牌',
    challengeDraw4: '质疑 +4',
    catchUno: '抓 UNO',
    recommendation: '提示',
    recommendPlay: '打出',
    recommendCallUnoPlay: '先喊 UNO，再打出',
    recommendDraw: '摸一张牌',
    recommendLauncher: '按发牌器',
    recommendAcceptPenalty: '接受摸牌惩罚',
    recommendWait: '等待',
    recommendReasonFinish: '这可以清空你的手牌并赢得本局得分。',
    recommendReasonCallUno: '你会只剩一张牌，先喊 UNO 可以避免被抓。',
    recommendReasonPressure: '下一位玩家快出完了，这张牌可以施加压力。',
    recommendReasonPenalty: '这张牌可以回应当前摸牌惩罚，而不是直接接受。',
    recommendReasonWild: '这张牌可以让你选择最适合手牌的颜色。',
    recommendReasonKeepColor: '这会把颜色保持在你手里还有的颜色上。',
    recommendReasonNumber: '它与桌面牌的数字相同。',
    recommendReasonSymbol: '它与桌面牌的功能符号相同。',
    recommendReasonPoints: '它可以先移除手中风险最高的分值。',
    recommendReasonForcedColor: '加速出牌现在要求打出所选颜色。',
    recommendReasonForcedPlay: '当前牌的效果要求立刻追加出牌。',
    recommendReasonDraw: '你的手牌中目前没有可出的牌。',
    recommendReasonAccept: '没有牌可以回应当前摸牌惩罚。',
    recommendReasonWait: '请等到你可以操作的回合。',
    eventLog: '事件记录',
    cards: '张牌',
    points: '分',
    clockwise: '顺时针',
    counterClockwise: '逆时针',
    drawStack: '摸牌叠加',
    cardEffect: '效果',
    moveStatus: '出牌',
    movable: '可出',
    notMovable: '不可出',
    waitForTurn: '不可出：现在还不是你的回合。',
    deckCount: '牌库',
    drawPile: '摸牌',
    none: '无',
    moreGamesUnlockTitle: '更多游戏',
    moreGamesPassword: '密码',
    moreGamesConfirm: '确认',
    moreGamesChecking: '正在验证…',
    moreGamesFailure: '无法解锁游戏。',
  },
  de: {
    appName: 'Uno Familie',
    chooseTable: 'Guos Kartenspielsammlung',
    homeLead: 'Die ersten fünf UNO-Spiele sind für spielbare Tests verfügbar. Die weiteren Regelsets folgen in den nächsten Meilensteinen.',
    playable: 'Spielbar',
    planned: 'Geplant',
    back: 'Zurück',
    start: 'Start',
    rules: 'Regeln',
    close: 'Schließen',
    gameOne: 'Spiel 1',
    mode: 'Modus',
    players: 'Spieler',
    totalPlayers: 'Spielerzahl',
    startingCards: 'Startkarten',
    sessionTarget: 'Sitzungsziel',
    aiDifficulty: 'KI-Stärke',
    spectacularDelay: 'KI-Kartenpause',
    flashTimer: 'Flash-Timer',
    flashTimerOff: 'Unbegrenzt',
    flashUnit: 'Flash-Einheit',
    easy: 'Leicht',
    medium: 'Mittel',
    hard: 'Schwer',
    addOnPacks: 'Erweiterungen',
    localWifiHint: 'Lokale WLAN-Räume nutzen diesen Computer als kleinen Host für synchrones Spielen.',
    localWifiLobby: 'Lokale WLAN-Lobby',
    wifiGameSyncPending: 'Hoste einen Raum auf diesem Computer; Spieler im gleichen Netzwerk treten mit dem 4-stelligen Code bei.',
    wifiPlayerName: 'Dein Name',
    wifiAllowAi: 'KI-Auffuller erlauben',
    wifiStatus: 'Status',
    wifiIdle: 'Bereit',
    wifiConnecting: 'Verbindung',
    wifiConnected: 'Verbunden',
    wifiError: 'Verbindungsproblem',
    hostRoom: 'Raum hosten',
    joinRoom: 'Raum beitreten',
    joinCode: 'Beitrittscode',
    leaveRoom: 'Raum verlassen',
    startRoomGame: 'Raumspiel starten',
    roomCode: 'Raumcode',
    connectedPlayers: 'Verbundene Spieler',
    setup: 'Setup',
    round: 'Runde',
    sound: 'Ton',
    theme: 'Design',
    lightTheme: 'Hell',
    darkTheme: 'Dunkel',
    hotSeat: 'Hot Seat',
    hotSeatTurn: 'ist am Zug',
    hotSeatHint: 'Gib den Computer weiter, bevor diese Hand gezeigt wird.',
    revealHand: 'Hand zeigen',
    choice: 'Auswahl',
    chooseColor: 'Wähle die nächste Farbe.',
    chooseTarget: 'Wähle einen Spieler für den Handtausch.',
    chooseTwoTargets: 'Wähle zwei andere Spieler für den Handtausch.',
    cancel: 'Abbrechen',
    gameOver: 'Spielende',
    roundComplete: 'Runde beendet',
    wins: 'gewinnt',
    scoreHint: 'Punkte wurden aus den Restkarten aller Gegner berechnet.',
    congratulations: 'Gluckwunsch',
    scoringDetails: 'Punkteberechnung',
    roundScore: 'Rundenpunkte',
    subtotal: 'Zwischensumme',
    total: 'Gesamt',
    sessionScore: 'Sitzungspunktestand',
    continueSession: 'Sitzung fortsetzen',
    resumeSession: 'Sitzung fortsetzen',
    closeSession: 'Sitzung schließen',
    newSession: 'Neue Sitzung starten',
    noCards: 'Keine Karten',
    backToSetup: 'Zurück zum Setup',
    waitingForHost: 'Warte darauf, dass der Host die Sitzung fortsetzt.',
    nextRound: 'Nächste Runde',
    turn: 'Zug',
    activeColor: 'Aktive Farbe',
    playableCards: 'spielbare Karten',
    draw: 'Ziehen',
    launcher: 'Launcher',
    endTurn: 'Zug beenden',
    acceptDraw: 'Ziehen akzeptieren',
    challengeDraw4: '+4 anzweifeln',
    catchUno: 'UNO fangen',
    recommendation: 'Hinweis',
    recommendPlay: 'Spiele',
    recommendCallUnoPlay: 'Erst UNO rufen, dann spielen',
    recommendDraw: 'Eine Karte ziehen',
    recommendLauncher: 'Launcher drücken',
    recommendAcceptPenalty: 'Ziehstrafe akzeptieren',
    recommendWait: 'Warten',
    recommendReasonFinish: 'Damit kannst du deine Hand leeren und die Runde werten.',
    recommendReasonCallUno: 'Du hast danach nur noch eine Karte, also rufe zuerst UNO.',
    recommendReasonPressure: 'Das setzt den nächsten Spieler unter Druck, der fast fertig ist.',
    recommendReasonPenalty: 'Damit beantwortest du die aktuelle Ziehstrafe, statt sie zu akzeptieren.',
    recommendReasonWild: 'Damit kannst du die Farbe wählen, die am besten zu deiner Hand passt.',
    recommendReasonKeepColor: 'Damit bleibt die Farbe bei einer Farbe, die du noch hast.',
    recommendReasonNumber: 'Die Zahl passt zur obersten Karte.',
    recommendReasonSymbol: 'Das Aktionssymbol passt zur obersten Karte.',
    recommendReasonPoints: 'Damit entfernst du die riskantesten Punkte aus deiner Hand.',
    recommendReasonForcedColor: 'Tempo verlangt jetzt die gewählte Farbe.',
    recommendReasonForcedPlay: 'Der aktuelle Karteneffekt verlangt sofort eine Folgekarte.',
    recommendReasonDraw: 'In deiner Hand ist gerade keine Karte spielbar.',
    recommendReasonAccept: 'Keine Karte kann die aktuelle Ziehstrafe beantworten.',
    recommendReasonWait: 'Warte, bis du diesen Zug steuern kannst.',
    eventLog: 'Ereignisse',
    cards: 'Karten',
    points: 'Pkt.',
    clockwise: 'Im Uhrzeigersinn',
    counterClockwise: 'Gegen den Uhrzeigersinn',
    drawStack: 'Ziehstapel',
    cardEffect: 'Effekt',
    moveStatus: 'Zug',
    movable: 'Spielbar',
    notMovable: 'Nicht spielbar',
    waitForTurn: 'Nicht spielbar, weil du nicht am Zug bist.',
    deckCount: 'Deck',
    drawPile: 'Ziehen',
    none: 'Keine',
    moreGamesUnlockTitle: 'Weitere Spiele',
    moreGamesPassword: 'Passwort',
    moreGamesConfirm: 'Bestätigen',
    moreGamesChecking: 'Wird geprüft…',
    moreGamesFailure: 'Ein Spiel konnte nicht freigeschaltet werden.',
  },
}

const colorNames: Record<Language, Record<UnoColor | 'wild', string>> = {
  en: { red: 'Red', yellow: 'Yellow', green: 'Green', blue: 'Blue', teal: 'Teal', pink: 'Pink', purple: 'Purple', orange: 'Orange', wild: 'Wild' },
  zh: { red: '红色', yellow: '黄色', green: '绿色', blue: '蓝色', teal: '青色', pink: '粉色', purple: '紫色', orange: '橙色', wild: '万能' },
  de: { red: 'Rot', yellow: 'Gelb', green: 'Grün', blue: 'Blau', teal: 'Türkis', pink: 'Pink', purple: 'Violett', orange: 'Orange', wild: 'Wild' },
}

const modeNames: Record<Language, Record<GameMode, string>> = {
  en: { single: 'Single vs AI', hotseat: 'Hot Seat', wifi: 'Local WiFi', spectacular: 'Spectacular' },
  zh: { single: '单人对 AI', hotseat: '本地轮流', wifi: '本地 WiFi', spectacular: '观战模式' },
  de: { single: 'Solo gegen KI', hotseat: 'Hot Seat', wifi: 'Lokales WLAN', spectacular: 'Zuschauermodus' },
}

const cardNames: Record<Language, Partial<Record<CardKind, string>>> = {
  en: {
    number: 'Number',
    skip: 'Skip',
    reverse: 'Reverse',
    draw2: '+2',
    draw4: '+4',
    wild: 'Wild',
    wildDraw4: '+4',
    wildDraw6: '+6',
    wildDraw10: '+10',
    wildReverseDraw4: 'Wild Rev +4',
    wildColorRoulette: 'Color Roulette',
    wildNoU: 'No U',
    reverseDraw2: 'Rev +2',
    reverseSkip: 'Rev Skip',
    wildPowerReverse: 'Power Rev',
    stack1: 'Stack +1',
    stack2: 'Stack +2',
    wildDraw3: '+3',
    wildDrawMystery: '+?',
    wildSpeedPlay: 'Speed',
    wildDraw1SpeedPlay: '+1 Speed',
    speedMatch: 'Match',
    wildLightningRound: 'Lightning',
    wildSwapHands: 'Swap',
    targetedSwap: 'Target Swap',
    passingSwap: 'Pass Hands',
    wildDraw2Swap: '+2 Swap',
    hit2: 'Hit 2',
    discardAll: 'Discard All',
    wildExtremeHit: 'Extreme Hit',
    wildHitFire: 'Hit-Fire',
    wildAllHit: 'All Hit',
    tradeHands: 'Trade Hands',
    slap: 'SLAP',
    flip: 'Flip',
    draw1: '+1',
    draw5: '+5',
    skipEveryone: 'Skip All',
    wildDraw2: '+2',
    wildDrawColor: 'Draw Color',
    wildDownpour1: 'Downpour +1',
    wildDownpour2: 'Downpour +2',
    flexSkip: 'Flex Skip',
    flexReverse: 'Flex Reverse',
    flexDraw2: 'Flex +2',
    wildFlexDraw2: 'Wild Flex +2',
    wildAllFlip: 'Wild All Flip',
    wildLiarChallenge: "Liar's Challenge",
    wildReverse: 'Wild Reverse',
    wildSkip: 'Wild Skip',
    wildSkipTwo: 'Wild Skip Two',
    wildTargetDraw2: 'Target +2',
    wildForcedSwap: 'Forced Swap',
    dare: 'Dare',
    wildDare: 'Wild Dare',
    wildHuntRing: 'Hunt for the Ring',
    wildSortingHat: 'Sorting Hat',
    wildTheForce: 'The Force',
    wildAvengersAssemble: 'Avengers Assemble',
    wildTrexAttack: 'T-Rex Attack',
    wildCreeper: 'Creeper',
    wildSuperStar: 'Super Star',
    wildVictoryLap: 'Victory Lap',
    wildPlayedTooMuch: 'Played With Too Much',
    wildPowerOfGrayskull: 'Power of Grayskull',
    wildTurtlePower: 'Turtle Power',
    wildWebSwing: 'Web Swing',
    wildJusticeLeague: 'Justice League',
    wildBeamMeUp: 'Beam Me Up',
    wildAvatarState: 'Avatar State',
    wildCreepyCool: 'Creepy Cool',
    wildTouchdown: 'Touchdown',
    wildJackpot: 'Wild Jackpot',
    blast: 'Blast',
    wildRoboto: 'Wild Roboto',
    tippo: 'Tippo',
    wildEmoji: 'Wild Emoji',
    wildItemBox: 'Wild Item Box',
    wildDos: 'Wild DOS',
    wildNumber: 'Wild #',
  },
  zh: {
    number: '数字',
    skip: '跳过',
    reverse: '反转',
    draw2: '+2',
    draw4: '+4',
    wild: '万能',
    wildDraw4: '+4',
    wildDraw6: '+6',
    wildDraw10: '+10',
    wildReverseDraw4: '万能反转 +4',
    wildColorRoulette: '颜色轮盘',
    wildNoU: '反弹',
    reverseDraw2: '反转 +2',
    reverseSkip: '反转跳过',
    wildPowerReverse: '强力反转',
    stack1: '叠加 +1',
    stack2: '叠加 +2',
    wildDraw3: '+3',
    wildDrawMystery: '+?',
    wildSpeedPlay: '加速',
    wildDraw1SpeedPlay: '+1 加速',
    speedMatch: '快速匹配',
    wildLightningRound: '闪电回合',
    wildSwapHands: '换手牌',
    targetedSwap: '指定交换',
    passingSwap: '传递手牌',
    wildDraw2Swap: '+2 交换',
    hit2: '按 2 次',
    discardAll: '全弃',
    wildExtremeHit: '极限攻击',
    wildHitFire: '按到发射',
    wildAllHit: '全员按',
    tradeHands: '交换手牌',
    slap: '拍击',
    flip: '翻面',
    draw1: '+1',
    draw5: '+5',
    skipEveryone: '跳过所有人',
    wildDraw2: '+2',
    wildDrawColor: '抽到指定颜色',
    wildDownpour1: '大雨 +1',
    wildDownpour2: '大雨 +2',
    wildCreeper: '爬行者',
    wildSuperStar: '超级星星',
    wildVictoryLap: '胜利冲刺',
    wildPlayedTooMuch: '玩得太旧',
    wildPowerOfGrayskull: '灰颅堡之力',
    wildTurtlePower: '忍者神龟力量',
    wildWebSwing: '蛛网摆荡',
    wildJusticeLeague: '正义联盟',
    wildBeamMeUp: '传送上舰',
    wildAvatarState: '降世神通状态',
    wildCreepyCool: '怪酷时刻',
    wildTouchdown: 'Touchdown 达阵',
    wildJackpot: 'Wild Jackpot 转轮',
    blast: '爆破',
    wildRoboto: '机器人万能牌',
    tippo: 'Tippo 平衡牌',
    wildEmoji: '表情万能牌',
    wildItemBox: '道具箱万能牌',
    wildDos: 'Wild DOS',
    wildNumber: 'Wild #',
  },
  de: {
    number: 'Zahl',
    skip: 'Aussetzen',
    reverse: 'Richtung',
    draw2: '+2',
    draw4: '+4',
    wild: 'Wild',
    wildDraw4: '+4',
    wildDraw6: '+6',
    wildDraw10: '+10',
    wildReverseDraw4: 'Wild Richt. +4',
    wildColorRoulette: 'Farb-Roulette',
    wildNoU: 'Retour',
    reverseDraw2: 'Richt. +2',
    reverseSkip: 'Richt. Aussetzen',
    wildPowerReverse: 'Power-Richtung',
    stack1: 'Stapel +1',
    stack2: 'Stapel +2',
    wildDraw3: '+3',
    wildDrawMystery: '+?',
    wildSpeedPlay: 'Tempo',
    wildDraw1SpeedPlay: '+1 Tempo',
    speedMatch: 'Match',
    wildLightningRound: 'Blitzrunde',
    wildSwapHands: 'Handtausch',
    targetedSwap: 'Zieltausch',
    passingSwap: 'Hand weitergeben',
    wildDraw2Swap: '+2 Tausch',
    hit2: 'Hit 2',
    discardAll: 'Alle ablegen',
    wildExtremeHit: 'Extrem-Hit',
    wildHitFire: 'Hit-Fire',
    wildAllHit: 'Alle Hit',
    tradeHands: 'Handtausch',
    slap: 'SLAP',
    flip: 'Flip',
    draw1: '+1',
    draw5: '+5',
    skipEveryone: 'Alle aussetzen',
    wildDraw2: '+2',
    wildDrawColor: 'Farbe ziehen',
    wildDownpour1: 'Wolkenbruch +1',
    wildDownpour2: 'Wolkenbruch +2',
    flexSkip: 'Flex Aussetzen',
    flexReverse: 'Flex Richtung',
    flexDraw2: 'Flex +2',
    wildFlexDraw2: 'Wild Flex +2',
    wildAllFlip: 'Wild All Flip',
    wildLiarChallenge: "Liar's Challenge",
    wildReverse: 'Wild Richtung',
    wildSkip: 'Wild Aussetzen',
    wildSkipTwo: 'Wild Zwei aussetzen',
    wildTargetDraw2: 'Ziel +2',
    wildForcedSwap: 'Zwangstausch',
    dare: 'Dare',
    wildDare: 'Wild Dare',
    wildHuntRing: 'Jagd nach dem Ring',
    wildSortingHat: 'Sprechender Hut',
    wildTheForce: 'Die Macht',
    wildAvengersAssemble: 'Avengers Assemble',
    wildTrexAttack: 'T-Rex-Angriff',
    wildCreeper: 'Creeper',
    wildSuperStar: 'Super Star',
    wildVictoryLap: 'Victory Lap',
    wildPlayedTooMuch: 'Zu viel gespielt',
    wildPowerOfGrayskull: 'Kraft von Grayskull',
    wildTurtlePower: 'Turtle Power',
    wildWebSwing: 'Web Swing',
    wildJusticeLeague: 'Justice League',
    wildBeamMeUp: 'Beam Me Up',
    wildAvatarState: 'Avatar State',
    wildCreepyCool: 'Creepy Cool',
    wildTouchdown: 'Touchdown',
    wildJackpot: 'Wild Jackpot',
    blast: 'Blast',
    wildRoboto: 'Wild Roboto',
    tippo: 'Tippo',
    wildEmoji: 'Wild Emoji',
    wildItemBox: 'Wild Item-Box',
    wildDos: 'Wild DOS',
    wildNumber: 'Wild #',
  },
}

const cardEffects: Record<Language, Partial<Record<CardKind, string>>> = {
  en: {
    number: 'Match by color or number.',
    skip: 'Skips the next player.',
    reverse: 'Reverses play direction.',
    draw2: 'Next player draws 2 and loses the turn.',
    draw4: 'Next player draws 4 and loses the turn. In No Mercy it can be stacked by +4 or higher.',
    wild: 'Choose the active color.',
    wildDraw4: 'Choose a color; next player draws 4 and may challenge.',
    wildDraw6: 'Choose a color; next player draws 6 and loses the turn.',
    wildDraw10: 'Choose a color; next player draws 10 and loses the turn.',
    wildReverseDraw4: 'Choose a color, reverse direction, then the new next player draws 4 and loses the turn.',
    wildColorRoulette: 'Choose a color; next player draws until that color appears and loses the turn.',
    wildNoU: 'Blocks an incoming draw penalty and sends it back.',
    reverseDraw2: 'Reverses direction, then the new next player draws 2.',
    reverseSkip: 'Reverses direction and skips the new next player.',
    wildPowerReverse: 'Choose a color, reverse direction, and play again.',
    stack1: 'Adds 1 to a pending draw stack.',
    stack2: 'Adds 2 to a pending draw stack.',
    wildDraw3: 'Choose a color and add 3 to the draw penalty.',
    wildDrawMystery: 'Choose a color and add a random draw value.',
    wildSpeedPlay: 'Choose a color and immediately play another card of that color.',
    wildDraw1SpeedPlay: 'Next player draws 1; you immediately play again.',
    speedMatch: 'Dump matching color or number cards.',
    wildLightningRound: 'Everyone discards one chosen-color card or draws 2.',
    wildSwapHands: 'Choose an opponent and swap hands.',
    targetedSwap: 'Make two other players swap hands.',
    passingSwap: 'Everyone passes hands in play direction.',
    wildDraw2Swap: 'Next player draws 2, then you swap hands with a player.',
    hit2: 'Next player presses the launcher twice and loses the turn.',
    discardAll: 'Discard every card in your hand that matches this color.',
    wildExtremeHit: 'Choose a color and an opponent; that opponent presses twice.',
    wildHitFire: 'Next player presses until the launcher fires cards.',
    wildAllHit: 'Every other player presses the launcher once.',
    tradeHands: 'Choose an opponent and trade hands.',
    slap: 'All opponents slap; the simulated Flash unit makes the last player draw 2.',
    flip: 'Everyone flips their hands and both piles to the other side.',
    draw1: 'Next player draws 1 and loses the turn.',
    draw5: 'Next player draws 5 and loses the turn.',
    skipEveryone: 'Every other player is skipped; you play again.',
    wildDraw2: 'Choose a color; next player draws 2 and loses the turn.',
    wildDrawColor: 'Choose a color; next player draws until that color appears and loses the turn.',
    wildDownpour1: 'Choose a color; every other player immediately draws 1 card.',
    wildDownpour2: 'Choose a color; every other player immediately draws 2 cards.',
    wildJackpot: 'Choose a color, then spin the Wild Jackpot roller for a random house-rule effect.',
    blast: 'Choose a color and force the Blast unit to fire; you take cards equal to the loaded pressure.',
    wildRoboto: 'Choose a color and make the robot issue a random command.',
    tippo: 'Choose a color and force the selected Tippo tray to tip; you take that tray.',
    wildEmoji: 'Choose a color; the next player must make the emoji face or draw 4.',
    wildItemBox: 'Choose a color and a Green Shell target; reveal the top stock card and activate only its Mario Kart item.',
    wildSuperStar: 'Choose a color. During an incoming +2 or +4 penalty, play it to reflect the cards back to the source player.',
    wildVictoryLap: 'Choose a color; every other player draws 1 card.',
    wildPlayedTooMuch: 'Choose the active color and one discard color; everyone discards that color from hand and redraws the same count.',
    wildPowerOfGrayskull: 'Choose a color; if you still hold that color, keep the turn and play again.',
    wildTurtlePower: 'Choose a color; everyone passes 1 card to the next player in game direction.',
    wildWebSwing: 'Choose a color and target; you trade one low-value card for one high-value card from that player.',
    wildJusticeLeague: 'Choose a color; other players reveal their strongest cards, you capture the best one and return a low card if possible.',
    wildBeamMeUp: 'Choose a color and target; their strongest card is beamed into the draw pile, then they draw 1 replacement card.',
    wildAvatarState: 'Choose a color; reveal 3 draw-pile cards, keep the strongest one, and return the others to the draw pile.',
    wildCreepyCool: 'Choose a color; each other player reveals 1 random card, discarding it if it matches the chosen color.',
    wildTouchdown: 'Choose a color and defender; reveal the top draw card. If it matches the chosen color, the defender draws 4 and loses the turn.',
    wildDos: 'Counts as number 2 in DOS matches.',
    wildNumber: 'Counts as any number from 1 to 10 in DOS matches.',
    wildReverse: 'Reverses play direction.',
    wildSkip: 'Skips the next player.',
    wildSkipTwo: 'Skips the next two players.',
    wildTargetDraw2: 'Choose any player to draw 2; normal turn order continues.',
    wildForcedSwap: 'Choose an opponent and swap hands.',
    dare: 'Next player chooses: draw 2, or roll the Dare die.',
    wildDare: 'Choose a color; next player chooses: draw 2, or roll the Dare die.',
    wildHuntRing: 'Choose a color and a Ring-bearer; that player draws 3 cards. Normal turn order continues.',
  },
  zh: {
    number: '按颜色或数字匹配。',
    skip: '跳过下一位玩家。',
    reverse: '反转出牌方向。',
    draw2: '下一位玩家摸 2 张并跳过回合。',
    draw4: '下一位玩家摸 4 张并跳过回合。No Mercy 中可用 +4 或更高的摸牌牌叠加。',
    wild: '选择当前颜色。',
    wildDraw4: '选择颜色；下一位摸 4 张，可被质疑。',
    wildDraw6: '选择颜色；下一位摸 6 张并跳过回合。',
    wildDraw10: '选择颜色；下一位摸 10 张并跳过回合。',
    wildReverseDraw4: '选择颜色并反转方向；新方向的下一位摸 4 张并跳过回合。',
    wildColorRoulette: '选择颜色；下一位一直摸到该颜色并跳过回合。',
    wildNoU: '阻挡摸牌惩罚并反弹给来源玩家。',
    reverseDraw2: '反转方向，新方向的下一位摸 2 张。',
    reverseSkip: '反转方向并跳过新方向的下一位。',
    wildPowerReverse: '选择颜色、反转方向，并立刻再出一次。',
    stack1: '给当前摸牌叠加 +1。',
    stack2: '给当前摸牌叠加 +2。',
    wildDraw3: '选择颜色并叠加摸 3 张。',
    wildDrawMystery: '选择颜色并叠加随机摸牌数。',
    wildSpeedPlay: '选择颜色，然后立刻再出一张该颜色的牌。',
    wildDraw1SpeedPlay: '下一位摸 1 张；你立刻再出一次。',
    speedMatch: '弃掉所有匹配颜色或数字的牌。',
    wildLightningRound: '所有人弃一张指定颜色，否则摸 2 张。',
    wildSwapHands: '选择一名对手交换手牌。',
    targetedSwap: '让另外两名玩家交换手牌。',
    passingSwap: '所有人按当前方向传递手牌。',
    wildDraw2Swap: '下一位摸 2 张，然后你和一名玩家换手牌。',
    hit2: '下一位玩家按发牌器 2 次并跳过回合。',
    discardAll: '弃掉你手中所有同颜色的牌。',
    wildExtremeHit: '选择颜色和一名对手；该对手按 2 次发牌器。',
    wildHitFire: '下一位玩家一直按到发牌器发射为止。',
    wildAllHit: '其他所有玩家各按一次发牌器。',
    tradeHands: '选择一名对手并交换手牌。',
    slap: '所有对手拍击；模拟 Flash 装置让最慢的玩家摸 2 张。',
    flip: '所有玩家、摸牌堆和弃牌堆都翻到另一面。',
    draw1: '下一位玩家摸 1 张并失去回合。',
    draw5: '下一位玩家摸 5 张并失去回合。',
    skipEveryone: '跳过其他所有玩家；你再次行动。',
    wildDraw2: '选择颜色；下一位玩家摸 2 张并失去回合。',
    wildDrawColor: '选择颜色；下一位玩家一直摸到该颜色并失去回合。',
    wildDownpour1: '选择颜色；其他每位玩家立即摸 1 张。',
    wildDownpour2: '选择颜色；其他每位玩家立即摸 2 张。',
    wildJackpot: '选择颜色，然后转动 Wild Jackpot 转轮，触发一个随机规则效果。',
    blast: '选择颜色并强制爆破装置发射；你按已加载的压力数量摸牌。',
    wildRoboto: '选择颜色，并让机器人发布一个随机指令。',
    tippo: '选择颜色，并强制所选 Tippo 托盘倾倒；你拿走该托盘中的牌。',
    wildEmoji: '选择颜色；下一位玩家必须模仿表情，否则摸 4 张。',
    wildItemBox: '选择颜色和绿龟壳目标；翻开摸牌堆顶牌，只触发它的马力欧卡丁车道具。',
    wildSuperStar: '选择颜色。受到 +2 或 +4 惩罚时，可以打出它把摸牌惩罚反弹给来源玩家。',
    wildVictoryLap: '选择颜色；其他所有玩家各摸 1 张。',
    wildPlayedTooMuch: '选择当前颜色和一个弃牌颜色；所有玩家弃掉手中该颜色的牌，并摸回相同数量。',
    wildPowerOfGrayskull: '选择颜色；如果你手中仍有该颜色的牌，就保留回合并继续出牌。',
    wildTurtlePower: '选择颜色；所有玩家按游戏方向传 1 张牌给下一位玩家。',
    wildWebSwing: '选择颜色和目标；你用一张低价值牌换取该玩家的一张高价值牌。',
    wildJusticeLeague: '选择颜色；其他玩家亮出最强牌，你获得其中最好的一张，并尽量还回一张低价值牌。',
    wildBeamMeUp: '选择颜色和目标；目标最强的一张牌被传送回摸牌堆，然后摸 1 张替换牌。',
    wildAvatarState: '选择颜色；翻开摸牌堆 3 张牌，保留最强的一张，其余放回摸牌堆。',
    wildCreepyCool: '选择颜色；其他每位玩家随机亮出 1 张牌，若匹配所选颜色则弃掉。',
    wildTouchdown: '选择颜色和防守方；翻开摸牌堆顶牌。若匹配所选颜色，防守方摸 4 张并失去回合。',
    wildDos: '在 DOS 匹配中视为数字 2。',
    wildNumber: '在 DOS 匹配中可视为 1 到 10 中的任意数字。',
  },
  de: {
    number: 'Passend nach Farbe oder Zahl.',
    skip: 'Der nächste Spieler setzt aus.',
    reverse: 'Ändert die Spielrichtung.',
    draw2: 'Der nächste Spieler zieht 2 und setzt aus.',
    draw4: 'Der nächste Spieler zieht 4 und setzt aus. In No Mercy stapelbar mit +4 oder höher.',
    wild: 'Wähle die aktive Farbe.',
    wildDraw4: 'Wähle eine Farbe; der nächste Spieler zieht 4 und darf anzweifeln.',
    wildDraw6: 'Wähle eine Farbe; der nächste Spieler zieht 6 und setzt aus.',
    wildDraw10: 'Wähle eine Farbe; der nächste Spieler zieht 10 und setzt aus.',
    wildReverseDraw4: 'Wähle eine Farbe, andere die Richtung; der neue nächste Spieler zieht 4 und setzt aus.',
    wildColorRoulette: 'Wähle eine Farbe; der nächste Spieler zieht, bis diese Farbe erscheint, und setzt aus.',
    wildNoU: 'Blockt eine Ziehstrafe und schickt sie zurück.',
    reverseDraw2: 'Ändert die Richtung; der neue nächste Spieler zieht 2.',
    reverseSkip: 'Ändert die Richtung und lässt den neuen nächsten Spieler aussetzen.',
    wildPowerReverse: 'Wähle eine Farbe, andere die Richtung und spiele erneut.',
    stack1: 'Erhoht einen Ziehstapel um 1.',
    stack2: 'Erhoht einen Ziehstapel um 2.',
    wildDraw3: 'Wähle eine Farbe und erhöhe die Ziehstrafe um 3.',
    wildDrawMystery: 'Wähle eine Farbe und erhöhe um einen Zufallswert.',
    wildSpeedPlay: 'Wähle eine Farbe und spiele sofort eine weitere Karte dieser Farbe.',
    wildDraw1SpeedPlay: 'Nächster Spieler zieht 1; du spielst sofort erneut.',
    speedMatch: 'Lege passende Farb- oder Zahlenkarten ab.',
    wildLightningRound: 'Alle legen eine Karte der gewählten Farbe ab oder ziehen 2.',
    wildSwapHands: 'Wähle einen Gegner und tausche die Hand.',
    targetedSwap: 'Zwei andere Spieler tauschen ihre Hande.',
    passingSwap: 'Alle geben ihre Hand in Spielrichtung weiter.',
    wildDraw2Swap: 'Nächster Spieler zieht 2, dann tauschst du mit einem Spieler.',
    hit2: 'Der nächste Spieler drückt den Launcher zweimal und setzt aus.',
    discardAll: 'Lege alle Karten deiner Hand mit dieser Farbe ab.',
    wildExtremeHit: 'Wähle eine Farbe und einen Gegner; dieser drückt zweimal.',
    wildHitFire: 'Der nächste Spieler drückt, bis der Launcher Karten feuert.',
    wildAllHit: 'Alle anderen Spieler drücken den Launcher einmal.',
    tradeHands: 'Wähle einen Gegner und tausche die Hand.',
    slap: 'Alle Gegner schlagen ab; die simulierte Flash-Einheit lässt den langsamsten Spieler 2 ziehen.',
    flip: 'Alle Hande und beide Stapel werden auf die andere Seite gedreht.',
    draw1: 'Der nächste Spieler zieht 1 und setzt aus.',
    draw5: 'Der nächste Spieler zieht 5 und setzt aus.',
    skipEveryone: 'Alle anderen Spieler setzen aus; du bist wieder dran.',
    wildDraw2: 'Wähle eine Farbe; der nächste Spieler zieht 2 und setzt aus.',
    wildDrawColor: 'Wähle eine Farbe; der nächste Spieler zieht, bis diese Farbe erscheint, und setzt aus.',
    wildDownpour1: 'Wähle eine Farbe; alle anderen Spieler ziehen sofort 1 Karte.',
    wildDownpour2: 'Wähle eine Farbe; alle anderen Spieler ziehen sofort 2 Karten.',
    wildJackpot: 'Wähle eine Farbe und drehe den Wild-Jackpot-Roller für einen zufälligen Regel-Effekt.',
    blast: 'Wähle eine Farbe und zwinge die Blast-Einheit zum Auslösen; du ziehst Karten in Höhe des geladenen Drucks.',
    wildRoboto: 'Wähle eine Farbe und lass den Roboter einen zufälligen Befehl geben.',
    tippo: 'Wähle eine Farbe und kippe die gewählte Tippo-Ablage; du nimmst diese Ablage.',
    wildEmoji: 'Wähle eine Farbe; der nächste Spieler macht das Emoji-Gesicht oder zieht 4.',
    wildItemBox: 'Wähle eine Farbe und ein Grüner-Panzer-Ziel; decke die oberste Karte auf und aktiviere nur ihr Mario-Kart-Item.',
    wildSuperStar: 'Wähle eine Farbe. Bei einer eingehenden +2- oder +4-Strafe spielst du sie, um die Karten zum Ursprungsspieler zurückzuwerfen.',
    wildVictoryLap: 'Wähle eine Farbe; alle anderen Spieler ziehen 1 Karte.',
    wildPlayedTooMuch: 'Wähle die aktive Farbe und eine Ablagefarbe; alle werfen diese Farbe aus der Hand ab und ziehen dieselbe Anzahl nach.',
    wildPowerOfGrayskull: 'Wähle eine Farbe; hast du diese Farbe noch auf der Hand, behältst du den Zug und spielst erneut.',
    wildTurtlePower: 'Wähle eine Farbe; alle geben 1 Karte in Spielrichtung an den nächsten Spieler weiter.',
    wildWebSwing: 'Wähle eine Farbe und ein Ziel; du tauschst eine niedrige Karte gegen eine hohe Karte dieses Spielers.',
    wildJusticeLeague: 'Wähle eine Farbe; andere Spieler decken ihre stärkste Karte auf, du nimmst die beste und gibst möglichst eine niedrige Karte zurück.',
    wildBeamMeUp: 'Wähle Farbe und Ziel; die stärkste Karte des Ziels wird in den Ziehstapel gebeamt, dann zieht es 1 Ersatzkarte.',
    wildAvatarState: 'Wähle eine Farbe; decke 3 Ziehstapelkarten auf, behalte die stärkste und lege die anderen zurück.',
    wildCreepyCool: 'Wähle eine Farbe; jeder andere Spieler deckt 1 Zufallskarte auf und wirft sie ab, falls sie passt.',
    wildTouchdown: 'Wähle Farbe und Verteidiger; decke die oberste Ziehkarte auf. Passt sie zur Farbe, zieht der Verteidiger 4 und verliert den Zug.',
    wildDos: 'Zählt in DOS-Treffern als Zahl 2.',
    wildNumber: 'Zählt in DOS-Treffern als beliebige Zahl von 1 bis 10.',
    wildReverse: 'Ändert die Spielrichtung.',
    wildSkip: 'Der nächste Spieler setzt aus.',
    wildSkipTwo: 'Die nächsten zwei Spieler setzen aus.',
    wildTargetDraw2: 'Wähle einen beliebigen Spieler, der 2 zieht; die normale Reihenfolge geht weiter.',
    wildForcedSwap: 'Wähle einen Gegner und tausche die Hand.',
    dare: 'Der nächste Spieler wählt: 2 ziehen oder den Dare-Würfel werfen.',
    wildDare: 'Wähle eine Farbe; der nächste Spieler wählt: 2 ziehen oder den Dare-Würfel werfen.',
    wildHuntRing: 'Wähle eine Farbe und einen Ringträger; dieser Spieler zieht 3 Karten. Danach geht die normale Reihenfolge weiter.',
  },
}

export function t(language: Language, key: TranslationKey): string {
  return translations[language][key]
}

export function colorName(language: Language, color: UnoColor | 'wild' | null): string {
  if (!color) return t(language, 'none')
  return colorNames[language][color]
}

export function modeName(language: Language, mode: GameMode): string {
  return modeNames[language][mode]
}

export function cardFlourishStyleName(language: Language, style: CardFlourishStyle): string {
  const names: Record<Language, Record<CardFlourishStyle, string>> = {
    en: { random: 'Random', fan: 'Card fan', cut: 'Revolutionary cut', faro: 'Faro shuffle', pirouette: 'Pirouette', spring: 'Spring', waterfall: 'Waterfall', dribble: 'Dribble', oneHanded: 'One-handed shuffle' },
    zh: { random: '随机', fan: '扇形展开', cut: '旋转切牌', faro: '法罗洗牌', pirouette: '单牌旋转', spring: '弹簧飞牌', waterfall: '瀑布落牌', dribble: '滴落洗牌', oneHanded: '单手洗牌' },
    de: { random: 'Zufall', fan: 'Kartenfächer', cut: 'Revolutionärer Schnitt', faro: 'Faro-Mischen', pirouette: 'Pirouette', spring: 'Kartenfeder', waterfall: 'Wasserfall', dribble: 'Dribbeln', oneHanded: 'Einhand-Mischen' },
  }
  return names[language][style]
}

export function cardName(language: Language, card: Card): string {
  if (card.liarFaceDown && card.liarClaim) return liarClaimCardName(language, card.liarClaim.label)
  const allWildName = allWildCardName(language, card)
  if (allWildName) return allWildName
  const challengeName = challengeCardName(language, card)
  if (challengeName) return challengeName
  const popCultureName = popCultureCardName(language, card)
  if (popCultureName) return popCultureName
  const minecraftName = minecraftCardName(language, card)
  if (minecraftName) return minecraftName
  const triplePlayName = triplePlayCardName(language, card)
  if (triplePlayName) return triplePlayName
  if (card.kind === 'wildEmoji') {
    const face = card.label.match(/[\u{1F300}-\u{1FAFF}]/u)?.[0] ?? ''
    if (language === 'zh') return `表情万能 ${face}`.trim()
    if (language === 'de') return `Wild Emoji ${face}`.trim()
    return `Wild Emoji ${face}`.trim()
  }
  if (card.kind === 'number') return String(card.value)
  if (card.kind === 'wildHuntRing' && language === 'zh') return '猎戒'
  if (card.kind === 'wildLiarChallenge') return liarChallengeCardName(language)
  const partyName = partyCardName(language, card.kind)
  if (partyName) return partyName
  return flexCardName(language, card.kind) ?? cardNames[language][card.kind] ?? cardNames.en[card.kind] ?? card.label
}

export function cardEffect(language: Language, card: Card): string {
  if (card.liarFaceDown && card.liarClaim) {
    if (language === 'zh') return `盖着的谎言牌，公开宣称为 ${card.liarClaim.label}。可在质疑窗口中质疑。`
    if (language === 'de') return `Verdeckte Liar-Karte mit Behauptung ${card.liarClaim.label}. Kann im Challenge-Fenster angezweifelt werden.`
    return `Face-down Liar card claiming ${card.liarClaim.label}. It can be challenged while the challenge window is open.`
  }
  if (card.liar) {
    if (language === 'zh') return '谎言牌必须盖着打出，并宣称一个合理的牌面。'
    if (language === 'de') return 'Liar-Karten werden verdeckt gespielt und mit einer plausiblen Behauptung angesagt.'
    return 'Liar cards are played face down with a plausible announced claim.'
  }
  if (card.kind === 'wildLiarChallenge') {
    if (language === 'zh') return '选择颜色；其他玩家必须交出该颜色，否则摸 1 张罚牌。'
    if (language === 'de') return 'Wähle eine Farbe; Gegner legen diese Farbe ab oder ziehen 1 Strafkarte.'
    return 'Choose a color; opponents discard that color or draw 1 penalty card.'
  }
  const partyEffect = partyCardEffect(language, card.kind)
  if (partyEffect) return partyEffect
  const selectedFlex = selectedFlexEffect(language, card)
  if (selectedFlex) return selectedFlex
  const allWildEffect = allWildCardEffect(language, card)
  if (allWildEffect) return allWildEffect
  const challengeEffect = challengeCardEffect(language, card)
  if (challengeEffect) return challengeEffect
  const popCultureEffect = popCultureCardEffect(language, card)
  if (popCultureEffect) return popCultureEffect
  const minecraftEffect = minecraftCardEffect(language, card)
  if (minecraftEffect) return minecraftEffect
  const triplePlayEffect = triplePlayCardEffect(language, card)
  if (triplePlayEffect) return triplePlayEffect
  if (card.kind === 'wildHuntRing' && language === 'zh') return '选择颜色和一名持戒者；该玩家摸 3 张牌，然后按正常顺序继续。'
  if (card.spin) {
    if (language === 'zh') return '按颜色或数字匹配；打出后下一位玩家必须旋转轮并失去回合。'
    if (language === 'de') return 'Passend nach Farbe oder Zahl; danach dreht der nächste Spieler das Spin-Rad und setzt aus.'
    return 'Match by color or number; the next player spins the wheel and loses the turn.'
  }
  const base = flexCardEffect(language, card.kind) ?? cardEffects[language][card.kind] ?? cardEffects.en[card.kind] ?? ''
  if (!card.flexFlip) return base
  if (language === 'zh') return `${base} 打出后你的 Power Card 翻回绿色。`
  if (language === 'de') return `${base} Danach dreht deine Power Card zurück auf grün.`
  return `${base} Playing it flips your Power Card back to green.`
}

function allWildCardName(language: Language, card: Card): string | null {
  if (!isAllWildDeckCard(card)) return null
  const names: Partial<Record<CardKind, Record<Language, string>>> = {
    wild: { en: 'Wild', zh: '万能牌', de: 'Wild' },
    wildReverse: { en: 'Wild Reverse', zh: '万能反转', de: 'Wild Richtung' },
    wildSkip: { en: 'Wild Skip', zh: '万能跳过', de: 'Wild Aussetzen' },
    wildSkipTwo: { en: 'Wild Skip Two', zh: '万能跳过两人', de: 'Wild Zwei aussetzen' },
    wildDraw2: { en: 'Wild +2', zh: '万能 +2', de: 'Wild +2' },
    wildDraw4: { en: 'Wild +4', zh: '万能 +4', de: 'Wild +4' },
    wildTargetDraw2: { en: 'Target +2', zh: '指定 +2', de: 'Ziel +2' },
    wildForcedSwap: { en: 'Forced Swap', zh: '强制换牌', de: 'Zwangstausch' },
  }
  return names[card.kind]?.[language] ?? null
}

function popCultureCardName(language: Language, card: Card): string | null {
  const names: Partial<Record<CardKind, Record<Language, string>>> = {
    wildSortingHat: { en: 'Sorting Hat', zh: '分院帽', de: 'Sprechender Hut' },
    wildTheForce: { en: 'The Force', zh: '原力', de: 'Die Macht' },
    wildAvengersAssemble: { en: 'Avengers Assemble', zh: '复仇者集结', de: 'Avengers Assemble' },
    wildTrexAttack: { en: 'T-Rex Attack', zh: '霸王龙攻击', de: 'T-Rex-Angriff' },
  }
  return names[card.kind]?.[language] ?? null
}

function popCultureCardEffect(language: Language, card: Card): string | null {
  if (card.kind === 'wildSortingHat') {
    if (language === 'zh') return '选择颜色和一名玩家；该玩家一直摸牌，直到摸到 1-4 的数字牌。'
    if (language === 'de') return 'Wähle Farbe und Spieler; dieser zieht bis zu einer Zahlenkarte 1-4.'
    return 'Choose a color and player; that player draws until a 1-4 number card appears.'
  }
  if (card.kind === 'wildTheForce') {
    if (language === 'zh') return '选择颜色和一名玩家；如果该玩家有该颜色，他摸 2 张。'
    if (language === 'de') return 'Wähle Farbe und Spieler; hat dieser Spieler die Farbe, zieht er 2.'
    return 'Choose a color and player; if that player has that color, they draw 2.'
  }
  if (card.kind === 'wildAvengersAssemble') {
    if (language === 'zh') return '当普通万能牌使用；也可反弹当前 +2/+4 惩罚给来源玩家。'
    if (language === 'de') return 'Normales Wild; kann eine aktuelle +2/+4-Strafe zum Ursprung zurückwerfen.'
    return 'Acts as a Wild; may also reflect a pending +2/+4 penalty back to its source.'
  }
  if (card.kind === 'wildTrexAttack') {
    if (language === 'zh') return '选择颜色；如果下一位玩家没有该颜色，他摸 5 张。'
    if (language === 'de') return 'Wähle eine Farbe; hat der nächste Spieler sie nicht, zieht er 5.'
    return 'Choose a color; if the next player does not have that color, they draw 5.'
  }
  return null
}

function minecraftCardName(language: Language, card: Card): string | null {
  if (card.kind !== 'wildCreeper') return null
  const names: Record<Language, string> = {
    en: 'Creeper',
    zh: '爬行者',
    de: 'Creeper',
  }
  return names[language]
}

function minecraftCardEffect(language: Language, card: Card): string | null {
  if (card.kind !== 'wildCreeper') return null
  if (language === 'zh') return '选择颜色；下一位玩家摸 3 张牌并跳过回合。'
  if (language === 'de') return 'Wähle eine Farbe; der nächste Spieler zieht 3 Karten und setzt aus.'
  return 'Choose a color; the next player draws 3 cards and loses the turn.'
}

function triplePlayCardName(language: Language, card: Card): string | null {
  const names: Partial<Record<CardKind, Record<Language, string>>> = {
    triplePlayDiscardTwo: { en: 'Discard Two', zh: '弃两张', de: 'Zwei ablegen' },
    wildClear: { en: 'Wild Clear', zh: '万能清零', de: 'Wild Clear' },
    wildGiveAway: { en: 'Wild Give Away', zh: '万能送牌', de: 'Wild Weitergeben' },
  }
  return names[card.kind]?.[language] ?? null
}

function triplePlayCardEffect(language: Language, card: Card): string | null {
  if (card.kind === 'triplePlayDiscardTwo') {
    if (language === 'zh') return '打到一个点亮且匹配的 Triple Play 牌堆；然后额外弃掉最多两张同色手牌。'
    if (language === 'de') return 'Auf einen leuchtenden passenden Triple-Play-Stapel spielen; danach bis zu zwei weitere Karten derselben Farbe ablegen.'
    return 'Play to a lit matching Triple Play pile; then discard up to two extra cards of the same color.'
  }
  if (card.kind === 'wildClear') {
    if (language === 'zh') return '选择颜色和一个点亮牌堆；把该牌堆的过载计量清零。'
    if (language === 'de') return 'Wähle Farbe und leuchtenden Stapel; setze dessen Überlastungsanzeige auf null.'
    return 'Choose a color and lit pile; reset that pile overload meter to zero.'
  }
  if (card.kind === 'wildGiveAway') {
    if (language === 'zh') return '选择颜色、目标玩家和牌堆；然后把最多两张手牌交给目标玩家。'
    if (language === 'de') return 'Wähle Farbe, Zielperson und Stapel; gib danach bis zu zwei Handkarten weiter.'
    return 'Choose a color, target player, and pile; then give away up to two cards from your hand.'
  }
  return null
}

function allWildCardEffect(language: Language, card: Card): string | null {
  if (!isAllWildDeckCard(card)) return null
  if (card.kind === 'wild') {
    if (language === 'zh') return 'All Wild 普通牌；没有额外效果。'
    if (language === 'de') return 'Normale All-Wild-Karte ohne Zusatzeffekt.'
    return 'Plain All Wild card with no extra effect.'
  }
  if (card.kind === 'wildDraw2') {
    if (language === 'zh') return '下一位玩家摸 2 张并失去回合。'
    if (language === 'de') return 'Der nächste Spieler zieht 2 und setzt aus.'
    return 'Next player draws 2 and loses the turn.'
  }
  if (card.kind === 'wildDraw4') {
    if (language === 'zh') return '下一位玩家摸 4 张并失去回合；不能质疑。'
    if (language === 'de') return 'Der nächste Spieler zieht 4 und setzt aus; keine Challenge.'
    return 'Next player draws 4 and loses the turn; it cannot be challenged.'
  }
  if (card.kind === 'wildReverse') {
    if (language === 'zh') return '反转出牌方向。'
    if (language === 'de') return 'Ändert die Spielrichtung.'
    return 'Reverses play direction.'
  }
  if (card.kind === 'wildSkip') {
    if (language === 'zh') return '跳过下一位玩家。'
    if (language === 'de') return 'Der nächste Spieler setzt aus.'
    return 'Skips the next player.'
  }
  if (card.kind === 'wildSkipTwo') {
    if (language === 'zh') return '跳过接下来的两位玩家。'
    if (language === 'de') return 'Die nächsten zwei Spieler setzen aus.'
    return 'Skips the next two players.'
  }
  if (card.kind === 'wildTargetDraw2') {
    if (language === 'zh') return '选择任意一名玩家摸 2 张；之后按正常顺序继续。'
    if (language === 'de') return 'Wähle einen beliebigen Spieler, der 2 zieht; die normale Reihenfolge geht weiter.'
    return 'Choose any player to draw 2; normal turn order continues.'
  }
  if (card.kind === 'wildForcedSwap') {
    if (language === 'zh') return '选择一名对手并与其交换手牌。'
    if (language === 'de') return 'Wähle einen Gegner und tausche die Hand.'
    return 'Choose an opponent and swap hands.'
  }
  return null
}

function challengeCardName(language: Language, card: Card): string | null {
  const names: Partial<Record<CardKind, Record<Language, string>>> = {
    dare: { en: 'Dare', zh: 'Dare 挑战', de: 'Dare' },
    wildDare: { en: 'Wild Dare', zh: '万能 Dare', de: 'Wild Dare' },
  }
  return names[card.kind]?.[language] ?? null
}

function challengeCardEffect(language: Language, card: Card): string | null {
  if (card.kind === 'dare') {
    if (language === 'zh') return '下一位玩家选择：摸 2 张并失去回合，或掷 Dare 骰子。'
    if (language === 'de') return 'Der nächste Spieler wählt: 2 ziehen und aussetzen oder den Dare-Würfel werfen.'
    return 'Next player chooses: draw 2 and lose the turn, or roll the Dare die.'
  }
  if (card.kind === 'wildDare') {
    if (language === 'zh') return '选择颜色；下一位玩家选择：摸 2 张并失去回合，或掷 Dare 骰子。'
    if (language === 'de') return 'Wähle eine Farbe; der nächste Spieler wählt: 2 ziehen und aussetzen oder den Dare-Würfel werfen.'
    return 'Choose a color; next player chooses: draw 2 and lose the turn, or roll the Dare die.'
  }
  return null
}

function isAllWildDeckCard(card: Card): boolean {
  return (
    card.color === 'wild' &&
    ['Wild', 'Wild Reverse', 'Wild Skip', 'Wild Skip Two', 'Wild +2', 'Wild +4', 'Target +2', 'Forced Swap'].includes(card.label)
  )
}

function partyCardName(language: Language, kind: CardKind): string | null {
  const names: Partial<Record<CardKind, Record<Language, string>>> = {
    pointTaken: { en: 'Point Taken', zh: '指向惩罚', de: 'Point Taken' },
    wildDrawnTogether: { en: 'Drawn Together', zh: '一起摸牌', de: 'Gemeinsam ziehen' },
    wildPileUp: { en: 'Pile Up', zh: '堆叠牌堆', de: 'Pile Up' },
  }
  return names[kind]?.[language] ?? null
}

function partyCardEffect(language: Language, kind: CardKind): string | null {
  const effects: Partial<Record<CardKind, Record<Language, string>>> = {
    pointTaken: {
      en: 'Everyone points at one opponent; that player draws 1 to 5 cards.',
      zh: '所有人指向一名对手；该玩家摸 1 到 5 张牌。',
      de: 'Alle zeigen auf einen Gegner; dieser Spieler zieht 1 bis 5 Karten.',
    },
    wildDrawnTogether: {
      en: 'Choose a color and link two other players. When one draws, the other draws the same amount.',
      zh: '选择颜色并连接另外两名玩家；其中一人摸牌时，另一人也摸同样数量。',
      de: 'Wähle eine Farbe und verbinde zwei andere Spieler. Wenn einer zieht, zieht der andere dieselbe Menge.',
    },
    wildPileUp: {
      en: 'Choose a color and start a pile. Players add that color until someone cannot; that player takes the pile.',
      zh: '选择颜色并开始堆叠；玩家依次交出该颜色，无法交出的人拿走牌堆。',
      de: 'Wähle eine Farbe und starte einen Stapel. Spieler legen diese Farbe, bis jemand nicht kann; diese Person nimmt den Stapel.',
    },
  }
  return effects[kind]?.[language] ?? null
}

function liarClaimCardName(language: Language, claim: string): string {
  if (language === 'zh') return `宣称 ${claim}`
  if (language === 'de') return `Behauptet ${claim}`
  return `Claimed ${claim}`
}

function liarChallengeCardName(language: Language): string {
  if (language === 'zh') return '谎言挑战'
  if (language === 'de') return "Liar's Challenge"
  return "Liar's Challenge"
}

function flexCardName(language: Language, kind: CardKind): string | null {
  const names: Partial<Record<CardKind, Record<Language, string>>> = {
    flexSkip: { en: 'Flex Skip', zh: 'Flex 跳过', de: 'Flex Aussetzen' },
    flexReverse: { en: 'Flex Reverse', zh: 'Flex 反转', de: 'Flex Richtung' },
    flexDraw2: { en: 'Flex +2', zh: 'Flex +2', de: 'Flex +2' },
    wildFlexDraw2: { en: 'Wild Flex +2', zh: '万能 Flex +2', de: 'Wild Flex +2' },
    wildAllFlip: { en: 'Wild All Flip', zh: '万能全员翻转', de: 'Wild All Flip' },
  }
  return names[kind]?.[language] ?? null
}

function flexCardEffect(language: Language, kind: CardKind): string | null {
  const effects: Partial<Record<CardKind, Record<Language, string>>> = {
    flexSkip: {
      en: 'Choose normal or Flex side. Normal skips the next player; Flex skips every other player.',
      zh: '选择普通面或 Flex 面。普通面跳过下一位；Flex 面跳过其他所有玩家。',
      de: 'Wähle normale oder Flex-Seite. Normal setzt den nächsten Spieler aus; Flex setzt alle anderen Spieler aus.',
    },
    flexReverse: {
      en: 'Choose normal or Flex side. Normal reverses direction; Flex reverses and skips the next player in the new direction.',
      zh: '选择普通面或 Flex 面。普通面反转方向；Flex 面反转并跳过新方向的下一位。',
      de: 'Wähle normale oder Flex-Seite. Normal wechselt die Richtung; Flex wechselt die Richtung und setzt den nächsten Spieler aus.',
    },
    flexDraw2: {
      en: 'Choose normal or Flex side. Normal makes the next player draw 2; Flex makes every other player draw 1.',
      zh: '选择普通面或 Flex 面。普通面让下一位摸 2 张；Flex 面让其他每位玩家各摸 1 张。',
      de: 'Wähle normale oder Flex-Seite. Normal lässt den nächsten Spieler 2 ziehen; Flex lässt alle anderen Spieler 1 ziehen.',
    },
    wildFlexDraw2: {
      en: 'Choose normal or Flex side. Normal is a Wild color choice; Flex chooses a color and one player to draw 2.',
      zh: '选择普通面或 Flex 面。普通面是万能选色；Flex 面选择颜色并指定一名玩家摸 2 张。',
      de: 'Wähle normale oder Flex-Seite. Normal ist eine Wild-Farbwahl; Flex wählt Farbe und einen Spieler, der 2 zieht.',
    },
    wildAllFlip: {
      en: 'Choose a color and flip every Power Card to the opposite side.',
      zh: '选择颜色，并把所有 Power Card 翻到相反面。',
      de: 'Wähle eine Farbe und drehe jede Power Card auf die andere Seite.',
    },
  }
  return effects[kind]?.[language] ?? null
}

function selectedFlexEffect(language: Language, card: Card): string | null {
  if (!card.flexPlayedMode) return null
  const selected = card.flexPlayedMode
  const effects: Partial<Record<CardKind, Record<'normal' | 'flex', Record<Language, string>>>> = {
    flexSkip: {
      normal: {
        en: 'Selected effect: the next player was skipped.',
        zh: '已选择效果：跳过下一位玩家。',
        de: 'Gewählter Effekt: Der nächste Spieler wurde ausgesetzt.',
      },
      flex: {
        en: 'Selected Flex effect: every other player was skipped, so the same player continues.',
        zh: '已选择 Flex 效果：跳过其他所有玩家，当前玩家继续行动。',
        de: 'Gewählter Flex-Effekt: Alle anderen Spieler wurden ausgesetzt; derselbe Spieler ist erneut dran.',
      },
    },
    flexReverse: {
      normal: {
        en: 'Selected effect: play direction was reversed.',
        zh: '已选择效果：出牌方向已反转。',
        de: 'Gewählter Effekt: Die Spielrichtung wurde gewechselt.',
      },
      flex: {
        en: 'Selected Flex effect: direction was reversed and the next player in the new direction was skipped.',
        zh: '已选择 Flex 效果：方向反转，并跳过新方向的下一位。',
        de: 'Gewählter Flex-Effekt: Die Richtung wurde gewechselt und der nächste Spieler ausgesetzt.',
      },
    },
    flexDraw2: {
      normal: {
        en: 'Selected effect: the next player must draw 2 and loses the turn.',
        zh: '已选择效果：下一位玩家摸 2 张并失去回合。',
        de: 'Gewählter Effekt: Der nächste Spieler zieht 2 und setzt aus.',
      },
      flex: {
        en: 'Selected Flex effect: every other player drew 1 card.',
        zh: '已选择 Flex 效果：其他每位玩家各摸 1 张。',
        de: 'Gewählter Flex-Effekt: Alle anderen Spieler haben 1 Karte gezogen.',
      },
    },
    wildFlexDraw2: {
      normal: {
        en: 'Selected effect: normal Wild color choice.',
        zh: '已选择效果：普通万能选色。',
        de: 'Gewählter Effekt: normale Wild-Farbwahl.',
      },
      flex: {
        en: 'Selected Flex effect: one chosen player drew 2.',
        zh: '已选择 Flex 效果：指定的一名玩家摸 2 张。',
        de: 'Gewählter Flex-Effekt: Ein gewählter Spieler hat 2 gezogen.',
      },
    },
  }
  return effects[card.kind]?.[selected]?.[language] ?? null
}

export function playerName(language: Language, name: string): string {
  if (name === 'You') {
    return language === 'zh' ? '你' : language === 'de' ? 'Du' : 'You'
  }
  if (name.startsWith('Player ')) {
    const number = name.replace('Player ', '')
    return language === 'zh' ? `玩家 ${number}` : language === 'de' ? `Spieler ${number}` : name
  }
  if (name.startsWith('AI ')) {
    const number = name.replace('AI ', '')
    return language === 'zh' ? `AI ${number}` : language === 'de' ? `KI ${number}` : name
  }
  return name
}

export function playableReason(language: Language, card: Card, state: GameState): string {
  if (state.winnerId) return reasonText(language, 'roundDone')
  if (card.kind === 'targetedSwap' && state.players.length < 3) return reasonText(language, 'notEnoughTargets')
  if (state.speedPlayColor) {
    return card.color === state.speedPlayColor ? reasonText(language, 'color') : reasonText(language, 'speedColor')
  }
  if (state.pendingDraw) {
    if (card.kind === 'wildNoU' && state.config.addOns.reverse) return reasonText(language, 'bounce')
    if (state.config.game === 'houseRules' && (card.kind === 'draw2' || card.kind === 'wildDraw4')) return reasonText(language, 'stack')
    if (state.config.addOns.stack && isDrawCard(card)) return reasonText(language, 'stack')
    return reasonText(language, 'pendingDraw')
  }
  if (state.config.game === 'phase10') {
    if (language === 'zh') return state.drewThisTurn ? '点击弃掉这张牌并结束回合。' : '先摸牌或拿弃牌。'
    if (language === 'de') return state.drewThisTurn ? 'Klicke, um diese Karte abzuwerfen und den Zug zu beenden.' : 'Ziehe zuerst oder nimm die Ablage.'
    return state.drewThisTurn ? 'Click to discard this card and end your turn.' : 'Draw or take discard first.'
  }
  if (state.drewThisTurn && state.drawnCardIdThisTurn && card.id !== state.drawnCardIdThisTurn) {
    return reasonText(language, 'drawnOnly')
  }
  if (state.config.game === 'dos') return dosPlayableReason(language, card, state)
  if (state.config.game === 'skipBo') return skipBoPlayableReason(language, card, state)
  if (state.config.game === 'triplePlay') return triplePlayPlayableReason(language, card, state)
  if (state.config.game === 'tippo') return tippoPlayableReason(language, card, state)
  if (state.config.game === 'dice') return dicePlayableReason(language, card, state)
  if (state.config.game === 'guoPassage') return passagePlayableReason(language, card, state)

  const top = topCard(state)
  if (card.color === 'wild') return reasonText(language, 'wild')
  if (card.color === state.activeColor) return reasonText(language, 'color')
  if (card.kind === 'number' && top.kind === 'number' && card.value === top.value) return reasonText(language, 'number')
  if (card.kind !== 'number' && card.kind === top.kind) return reasonText(language, 'symbol')
  return reasonText(language, 'noMatch')
}

function passagePlayableReason(language: Language, card: Card, state: GameState): string {
  const phase = state.passageTurn?.phase
  if (phase === 'take') {
    if (language === 'zh') return '先从明牌、Passage 暗格或牌库拿一张牌。'
    if (language === 'de') return 'Nimm zuerst eine Karte von Offen, Passage oder Deck.'
    return 'Take one card first from Face up, Passage, or Deck.'
  }
  if (phase === 'pair') {
    const taken = state.passageTurn?.takenCard
    if (!taken) {
      if (language === 'zh') return '先拿一张牌，然后再尝试配对。'
      if (language === 'de') return 'Nimm zuerst eine Karte und versuche dann ein Paar.'
      return 'Take a card first, then try to make a pair.'
    }
    const wildPair = (taken.kind === 'wild' && card.kind === 'number') || (taken.kind === 'number' && card.kind === 'wild')
    const numberPair = taken.kind === 'number' && card.kind === 'number' && taken.value === card.value
    const colorPair = taken.kind === 'number' && card.kind === 'number' && taken.color === card.color
    const exactPair = numberPair && colorPair
    const matchMode = state.config.memoryMatchMode ?? 'number'
    const movable = wildPair || (matchMode === 'number' ? numberPair : matchMode === 'color' ? colorPair : exactPair)
    if (movable) {
      if (language === 'zh') return `可配对：这张牌可以和刚拿到的 ${taken.label} 组成得分配对。`
      if (language === 'de') return `Spielbar: Diese Karte kann mit ${taken.label} ein Wertungspaar bilden.`
      return `Movable: this card can pair with the taken ${taken.label}.`
    }
    if (language === 'zh') return `不可配对：它不符合当前模式下 ${taken.label} 的配对条件。`
    if (language === 'de') return `Nicht spielbar: Sie passt in diesem Modus nicht zu ${taken.label}.`
    return `Not movable because it does not pair with the taken ${taken.label} in this mode.`
  }
  if (phase === 'pass') {
    if (language === 'zh') return '可传出：先选择明牌传出或暗牌传出，然后点这张牌。'
    if (language === 'de') return 'Spielbar: Wähle zuerst offen oder verdeckt passen und klicke dann diese Karte.'
    return 'Movable: choose Face up or Face down pass, then click this card.'
  }
  if (language === 'zh') return '等待 Passage 回合动作。'
  if (language === 'de') return 'Warte auf die Passage-Aktion.'
  return 'Waiting for the Passage turn action.'
}

function triplePlayPlayableReason(language: Language, card: Card, state: GameState): string {
  const piles = triplePlayLegalPileIndexes(state, card)
  if (piles.length > 0) {
    const pileList = piles.map((index) => index + 1).join(', ')
    if (language === 'zh') return `可出：这张牌可以打到点亮且匹配的 Triple Play 牌堆 ${pileList}。优先选择计量较低的牌堆。`
    if (language === 'de') return `Spielbar: Diese Karte passt auf leuchtende Triple-Play-Stapel ${pileList}. Wähle möglichst einen Stapel mit niedriger Anzeige.`
    return `Movable: this card fits lit Triple Play pile ${pileList}. Prefer the pile with the lower overload meter.`
  }
  if (language === 'zh') return '不可出：它没有匹配任何点亮的 Triple Play 牌堆。'
  if (language === 'de') return 'Nicht spielbar: Sie passt auf keinen leuchtenden Triple-Play-Stapel.'
  return 'Not movable because it does not match any lit Triple Play pile.'
}

function tippoPlayableReason(language: Language, card: Card, state: GameState): string {
  const trays = tippoLegalTrayIndexes(state, card)
  if (trays.length > 0) {
    const trayList = trays.map((index) => {
      const tray = state.tippoTrays?.[index]
      return `${index + 1}${tray ? ` (${tray.load}/${tray.limit})` : ''}`
    }).join(', ')
    if (language === 'zh') return `可出：这张牌可打到 Tippo 托盘 ${trayList}。优先选择负载较低的托盘，避免倾倒后拿回牌。`
    if (language === 'de') return `Spielbar: Diese Karte passt auf Tippo-Ablage ${trayList}. Wähle möglichst die Ablage mit niedriger Last.`
    return `Movable: this card fits Tippo tray ${trayList}. Prefer the lower-load tray so you do not take the tray back.`
  }
  if (language === 'zh') return '不可出：它没有匹配任何 Tippo 托盘。'
  if (language === 'de') return 'Nicht spielbar: Sie passt auf keine Tippo-Ablage.'
  return 'Not movable because it does not match either Tippo tray.'
}

function dicePlayableReason(language: Language, card: Card, state: GameState): string {
  const top = topCard(state)
  if (card.color === 'wild') {
    if (language === 'zh') return '可出：万能骰可以匹配任何骰子，并让你选择新的颜色。'
    if (language === 'de') return 'Spielbar: Wild passt auf jeden Würfel und wählt die neue Farbe.'
    return 'Movable: Wild matches any die and lets you choose the new color.'
  }
  if (card.color === state.activeColor) {
    if (language === 'zh') return `可出：颜色匹配中央骰子线的当前颜色 ${colorName(language, state.activeColor)}。`
    if (language === 'de') return `Spielbar: Die Farbe passt zur aktiven Würfellinien-Farbe ${colorName(language, state.activeColor)}.`
    return `Movable: the color matches the active dice-line color ${colorName(language, state.activeColor)}.`
  }
  if (card.kind === 'number' && top.kind === 'number' && card.value === top.value) {
    if (language === 'zh') return `可出：数字 ${card.value} 匹配中央线最上面的骰子。`
    if (language === 'de') return `Spielbar: Die Zahl ${card.value} passt zum obersten Würfel der Linie.`
    return `Movable: number ${card.value} matches the top die in the line.`
  }
  if (card.kind !== 'number' && card.kind === top.kind) {
    if (language === 'zh') return '可出：行动符号匹配中央线最上面的行动骰。'
    if (language === 'de') return 'Spielbar: Das Aktionssymbol passt zum obersten Aktionswürfel.'
    return 'Movable: the action symbol matches the top action die.'
  }
  if (language === 'zh') return '不可出：这个骰子没有匹配中央线最上面的颜色、数字或符号。'
  if (language === 'de') return 'Nicht spielbar: Dieser Würfel passt nicht nach Farbe, Zahl oder Symbol zur Linie.'
  return 'Not movable because this die does not match the line by color, number, or symbol.'
}

function skipBoPlayableReason(language: Language, card: Card, state: GameState): string {
  if (!state.drewThisTurn) {
    if (language === 'zh') return '先摸到 5 张手牌。'
    if (language === 'de') return 'Ziehe zuerst auf 5 Handkarten.'
    return 'Draw up to five cards first.'
  }
  const neededValues = (state.skipBoBuildPiles ?? [[], [], [], []]).map((pile) => pile.length + 1).filter((value) => value <= 12)
  const canBuild = card.kind === 'wild' || neededValues.includes(card.value ?? -1)
  if (canBuild) {
    if (language === 'zh') return '可移动：这张牌可以放到一个建筑堆上。'
    if (language === 'de') return 'Spielbar: Diese Karte passt auf einen Bau-Stapel.'
    return 'Movable because this card fits a building pile.'
  }
  if (language === 'zh') return '现在不能建造：它不是任何建筑堆需要的下一张。'
  if (language === 'de') return 'Nicht spielbar: Kein Bau-Stapel braucht diese Karte.'
  return 'Not movable because no building pile needs this card right now.'
}

function dosPlayableReason(language: Language, card: Card, state: GameState): string {
  const owner = state.players.find((player) => player.hand.some((entry) => entry.id === card.id))
  const hand = owner?.hand ?? []
  const centerRow = state.dosCenterRow ?? []
  if (centerRow.some((target) => dosCardsMatchTarget([card], target))) {
    if (language === 'zh') return '可出：这张牌可以匹配一张 DOS 中心牌。'
    if (language === 'de') return 'Spielbar: Diese Karte passt zu einer DOS-Mittelkarte.'
    return 'Movable because this card matches a DOS center card.'
  }
  if (hand.some((other) => other.id !== card.id && centerRow.some((target) => dosCardsMatchTarget([card, other], target)))) {
    if (language === 'zh') return '可出：这张牌可与另一张手牌相加匹配 DOS 中心牌。'
    if (language === 'de') return 'Spielbar: Zusammen mit einer zweiten Handkarte passt sie zu einer DOS-Mittelkarte.'
    return 'Movable because this card can pair with another hand card to match a DOS center card.'
  }
  if (language === 'zh') return '不可出：它无法单独或组合匹配 DOS 中心牌。'
  if (language === 'de') return 'Nicht spielbar: Sie passt weder allein noch als Summe zu einer DOS-Mittelkarte.'
  return 'Not movable because it cannot match a DOS center card alone or as a two-card sum.'
}

function dosCardsMatchTarget(cards: Card[], target: Card): boolean {
  if (cards.length < 1 || cards.length > 2) return false
  const targetValues = dosCardValues(target)
  if (targetValues.length === 0) return false
  const options = cards.map(dosCardValues)
  if (options.some((values) => values.length === 0)) return false
  for (const first of options[0]) {
    if (cards.length === 1 && targetValues.includes(first)) return true
    for (const second of options[1] ?? []) {
      if (targetValues.includes(first + second)) return true
    }
  }
  return false
}

function dosCardValues(card: Card): number[] {
  if (card.kind === 'wildDos') return [2]
  if (card.kind === 'wildNumber') return Array.from({ length: 10 }, (_, index) => index + 1)
  if (card.kind === 'number' && typeof card.value === 'number') return [card.value]
  return []
}

function isDrawCard(card: Card): boolean {
  return ['draw1', 'draw2', 'draw5', 'reverseDraw2', 'stack1', 'stack2', 'wildDraw2', 'wildDraw2Swap', 'wildDraw3', 'wildDraw4', 'wildDrawColor', 'wildDrawMystery', 'wildDraw1SpeedPlay'].includes(card.kind)
}

function reasonText(
  language: Language,
  reason:
    | 'roundDone'
    | 'bounce'
    | 'stack'
    | 'pendingDraw'
    | 'drawnOnly'
    | 'notEnoughTargets'
    | 'speedColor'
    | 'wild'
    | 'color'
    | 'number'
    | 'symbol'
    | 'noMatch',
): string {
  const copy = {
    en: {
      roundDone: 'The round is already complete.',
      bounce: 'Movable because it can bounce the pending draw penalty.',
      stack: 'Movable because it can be stacked on the pending draw penalty.',
      pendingDraw: 'Not movable because you must answer the pending draw penalty.',
      drawnOnly: 'Not movable because after drawing you may only play the card you just drew.',
      notEnoughTargets: 'Not movable because this card needs two other players.',
      speedColor: 'Not movable because Speed Play requires the chosen color.',
      wild: 'Movable because Wild cards can be played on any card.',
      color: 'Movable because its color matches the active color.',
      number: 'Movable because its number matches the top card.',
      symbol: 'Movable because its symbol matches the top card.',
      noMatch: 'Not movable because it does not match color, number, symbol, or Wild rules.',
    },
    zh: {
      roundDone: '本局已经结束。',
      bounce: '可出：它可以反弹当前摸牌惩罚。',
      stack: '可出：它可以叠加到当前摸牌惩罚上。',
      pendingDraw: '不可出：你必须先处理当前摸牌惩罚。',
      drawnOnly: '不可出：摸牌后只能打出刚摸到的那张牌。',
      notEnoughTargets: '不可出：这张牌需要另外两名玩家。',
      speedColor: '不可出：加速出牌要求打出所选颜色。',
      wild: '可出：万能牌可以出在任意牌上。',
      color: '可出：颜色与当前颜色相同。',
      number: '可出：数字与牌堆顶牌相同。',
      symbol: '可出：符号与牌堆顶牌相同。',
      noMatch: '不可出：不符合颜色、数字、符号或万能牌规则。',
    },
    de: {
      roundDone: 'Die Runde ist bereits beendet.',
      bounce: 'Spielbar, weil sie die aktuelle Ziehstrafe zurückschicken kann.',
      stack: 'Spielbar, weil sie auf die aktuelle Ziehstrafe gestapelt werden kann.',
      pendingDraw: 'Nicht spielbar, weil zuerst die Ziehstrafe beantwortet werden muss.',
      drawnOnly: 'Nicht spielbar, weil nach dem Ziehen nur die gerade gezogene Karte gespielt werden darf.',
      notEnoughTargets: 'Nicht spielbar, weil diese Karte zwei andere Spieler braucht.',
      speedColor: 'Nicht spielbar, weil Tempo die gewählte Farbe verlangt.',
      wild: 'Spielbar, weil Wild-Karten auf jede Karte gelegt werden können.',
      color: 'Spielbar, weil die Farbe zur aktiven Farbe passt.',
      number: 'Spielbar, weil die Zahl zur obersten Karte passt.',
      symbol: 'Spielbar, weil das Symbol zur obersten Karte passt.',
      noMatch: 'Nicht spielbar, weil Farbe, Zahl, Symbol und Wild-Regel nicht passen.',
    },
  }
  return copy[language][reason]
}
