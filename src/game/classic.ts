import { buildAllWildDeck, buildAvatarDeck, buildBarbieDeck, buildBlastDeck, buildCaboDeck, buildChallengeDeck, buildClassicDeck, buildDcDeck, buildDiceSet, buildDosDeck, buildEmojiDeck, buildExtremeDeck, buildFlashDeck, buildFlexDeck, buildFlipDeck, buildFlipExtremeDeck, buildH2ODeck, buildLiarsDeck, buildLordOfTheRingsDeck, buildMarioKartDeck, buildMastersOfTheUniverseDeck, buildMinecraftDeck, buildMonsterHighDeck, buildNflDeck, buildNoMercyDeck, buildPartyDeck, buildPassageDeck, buildPhase10Deck, buildPopCultureDeck, buildRobotoDeck, buildSkipBoDeck, buildSkyjoDeck, buildSonicDeck, buildSpiderManDeck, buildSpinDeck, buildStarTrekDeck, buildSuperMarioDeck, buildTippoDeck, buildTmntDeck, buildTriplePlayDeck, buildWildJackpotDeck, buildZeroDeck, colorLabel, rollDiceFaces, rollOpeningDiceFace, shuffle } from './deck'
import type {
  AddOnPack,
  AiDifficulty,
  Card,
  CardKind,
  ChoiceRequest,
  GameConfig,
  GameMode,
  GameVariant,
  GameState,
  LiarClaim,
  PlayChoice,
  PlayResult,
  Player,
  SoundCue,
  AvatarId,
  UnoColor,
  WhirlpoolCommand,
  SpinWheelAction,
  ZeroGridSlot,
  PendingCaboPower,
  Phase10Meld,
  PartyLink,
  DareDieResult,
  TriplePlayPile,
  WildJackpotRule,
  BlastEvent,
  RobotoCommand,
  TippoTray,
  MarioKartItem,
  MemoryActionKind,
  MemoryBoard,
  MemoryDifficulty,
  MemoryMatchMode,
  MemorySlot,
} from './types'

const COLORS: UnoColor[] = ['red', 'yellow', 'green', 'blue']
const DARK_COLORS: UnoColor[] = ['teal', 'pink', 'purple', 'orange']
const AVATARS: AvatarId[] = ['explorer', 'teacher', 'magician', 'builder', 'musician', 'gardener', 'pilot', 'chef', 'scientist', 'artist']
const WILD_JACKPOT_RULES: WildJackpotRule[] = ['draw1', 'draw2', 'draw4', 'allDraw1', 'skip', 'reverse', 'discardColor', 'playAgain']
const ROBOTO_COMMANDS: RobotoCommand[] = ['nextDraw2', 'sourceDraw2', 'allOthersDraw1', 'discardActiveColor', 'reverse', 'playAgain']

type Phase10Requirement = { kind: 'set' | 'run' | 'color'; size: number }
type Phase10Candidate = Phase10Meld & { indexes: number[] }

const PHASE10_PHASES: Phase10Requirement[][] = [
  [{ kind: 'set', size: 3 }, { kind: 'set', size: 3 }],
  [{ kind: 'set', size: 3 }, { kind: 'run', size: 4 }],
  [{ kind: 'set', size: 4 }, { kind: 'run', size: 4 }],
  [{ kind: 'run', size: 7 }],
  [{ kind: 'run', size: 8 }],
  [{ kind: 'run', size: 9 }],
  [{ kind: 'set', size: 4 }, { kind: 'set', size: 4 }],
  [{ kind: 'color', size: 7 }],
  [{ kind: 'set', size: 5 }, { kind: 'set', size: 2 }],
  [{ kind: 'set', size: 5 }, { kind: 'set', size: 3 }],
]

const defaultAddOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function isLauncherGame(game: GameVariant): boolean {
  return game === 'extreme' || game === 'flipExtreme'
}

function isGridMemoryGame(game: GameVariant): boolean {
  return game === 'zero' || game === 'cabo' || game === 'skyjo'
}

function isGuoMemoryGame(game: GameVariant): boolean {
  return game === 'guoMemory' || game === 'guoMemoryAction' || game === 'guoTripleMemory' || game === 'guoTripleMemoryAction'
}

function isGuoMemoryActionGame(game: GameVariant): boolean {
  return game === 'guoMemoryAction' || game === 'guoTripleMemoryAction'
}

export const initialConfig: GameConfig = {
  game: 'classic',
  mode: 'single',
  playerCount: 4,
  startingHandSize: 7,
  targetScore: 500,
  aiDifficulty: 'medium',
  spectacularDelaySeconds: 2,
  flashTimerSeconds: 0,
  h2oSplash: false,
  tableTheme: 'classicGreen',
  deckTheme: 'classicRider',
  avatarId: 'explorer',
  reducedMotion: false,
  hardwarePopupSeconds: 5,
  roundStartFlourish: true,
  cardFlourishStyle: 'random',
  dealAnimation: true,
  winnerCelebration: true,
  animationSpeed: 'normal',
  memoryDifficulty: 'easy',
  memoryMatchMode: 'number',
  memoryRevealSeconds: 2,
  neighborColorConstrained: false,
  hiLoColorConstrained: false,
  addOns: defaultAddOns,
}

export function createConfig(
  game: GameVariant,
  mode: GameMode,
  playerCount: number,
  aiDifficulty: AiDifficulty,
  addOns: Record<AddOnPack, boolean>,
  startingHandSize = 7,
  targetScore = 500,
  spectacularDelaySeconds = 2,
  flashTimerSeconds = 0,
  h2oSplash = false,
  memoryDifficulty: MemoryDifficulty = 'easy',
  memoryMatchMode: MemoryMatchMode = 'number',
  memoryRevealSeconds = 2,
  neighborColorConstrained = false,
  hiLoColorConstrained = false,
): GameConfig {
  return {
    game,
    mode,
    playerCount,
    startingHandSize,
    targetScore,
    aiDifficulty,
    spectacularDelaySeconds,
    flashTimerSeconds,
    h2oSplash,
    tableTheme: 'classicGreen',
    deckTheme: 'classicRider',
    avatarId: 'explorer',
    reducedMotion: false,
    hardwarePopupSeconds: 5,
    roundStartFlourish: true,
    cardFlourishStyle: 'random',
    dealAnimation: true,
    winnerCelebration: true,
    animationSpeed: 'normal',
    memoryDifficulty,
    memoryMatchMode,
    memoryRevealSeconds,
    neighborColorConstrained,
    hiLoColorConstrained,
    addOns,
  }
}

export function createGame(config: GameConfig): GameState {
  const players = createPlayers(config)
  if (isGuoMemoryGame(config.game)) return createGuoMemoryGame(config, players)
  if (config.game === 'zero') return createZeroGame(config, players)
  if (config.game === 'cabo') return createCaboGame(config, players)
  if (config.game === 'skyjo') return createSkyjoGame(config, players)
  if (config.game === 'dos') return createDosGame(config, players)
  if (config.game === 'phase10') return createPhase10Game(config, players)
  if (config.game === 'skipBo') return createSkipBoGame(config, players)
  if (config.game === 'guoPassage') return createPassageGame(config, players)
  if (config.game === 'triplePlay') return createTriplePlayGame(config, players)
  if (config.game === 'tippo') return createTippoGame(config, players)
  if (config.game === 'dice') return createDiceGame(config, players)
  let deck = shuffle(
    config.game === 'extreme'
      ? buildExtremeDeck()
        : config.game === 'flash'
          ? buildFlashDeck()
          : config.game === 'spin'
            ? buildSpinDeck()
            : config.game === 'flip'
              ? buildFlipDeck()
              : config.game === 'flipExtreme'
                ? buildFlipExtremeDeck()
                : config.game === 'h2o'
                  ? buildH2ODeck()
                  : config.game === 'flex'
                    ? buildFlexDeck()
                    : config.game === 'liars'
                      ? buildLiarsDeck()
                      : config.game === 'party'
                        ? buildPartyDeck()
                        : config.game === 'allWild'
                          ? buildAllWildDeck()
                          : config.game === 'challenge'
                            ? buildChallengeDeck()
                            : config.game === 'lotr'
                              ? buildLordOfTheRingsDeck()
                              : config.game === 'popCulture'
                                ? buildPopCultureDeck()
                                : config.game === 'noMercy'
                                  ? buildNoMercyDeck()
                                  : config.game === 'superMario'
                                    ? buildSuperMarioDeck()
                                    : config.game === 'sonic'
                                      ? buildSonicDeck()
                                      : config.game === 'barbie'
                                        ? buildBarbieDeck()
                                        : config.game === 'motu'
                                          ? buildMastersOfTheUniverseDeck()
                                          : config.game === 'tmnt'
                                            ? buildTmntDeck()
                                            : config.game === 'spiderman'
                                              ? buildSpiderManDeck()
                                              : config.game === 'dc'
                                                ? buildDcDeck()
                                                : config.game === 'starTrek'
                                                  ? buildStarTrekDeck()
                                                  : config.game === 'avatar'
                                                    ? buildAvatarDeck()
                                                    : config.game === 'monsterHigh'
                                                      ? buildMonsterHighDeck()
                                                      : config.game === 'nfl'
                                                        ? buildNflDeck()
                                                  : config.game === 'minecraft'
                                                    ? buildMinecraftDeck()
                                                    : config.game === 'wildJackpot'
                                                      ? buildWildJackpotDeck()
                                                      : config.game === 'blast'
                                                        ? buildBlastDeck()
                                                        : config.game === 'roboto'
                                                          ? buildRobotoDeck()
                                                          : config.game === 'emoji'
                                                            ? buildEmojiDeck()
                                                            : config.game === 'marioKart'
                                                              ? buildMarioKartDeck()
                                                              : config.game === 'teams' || config.game === 'houseRules'
                                                                ? buildClassicDeck(defaultAddOns)
                                                            : config.game === 'guoHiLo'
                                                              ? buildClassicDeck(defaultAddOns)
                                                            : buildClassicDeck(config.addOns),
  )
  if (config.game === 'party' && players.length < 3) {
    deck = deck.filter((card) => card.kind !== 'wildDrawnTogether')
  }

  for (let round = 0; round < config.startingHandSize; round += 1) {
    for (const player of players) {
      player.hand.push(deck.pop()!)
    }
  }

  const discardPile = [drawOpeningCard(deck)]
  const top = discardPile[0]
  return addLog(
    {
      players,
      drawPile: deck,
      discardPile,
      activePlayerIndex: 0,
      direction: 1,
      activeColor: config.game === 'allWild' ? null : top.color === 'wild' ? COLORS[Math.floor(Math.random() * COLORS.length)] : top.color,
      neighborAnchor: config.game === 'guoNeighborMatch' && top.kind === 'number' ? top.value ?? null : null,
      hiLoAnchor: config.game === 'guoHiLo' ? top.kind === 'number' && typeof top.value === 'number' ? normalizeHiLoNumber(top.value) : randomHiLoAnchor() : null,
      hiLoDirection: config.game === 'guoHiLo' ? randomHiLoDirection() : undefined,
      flipSide: 'light',
      currentRound: 1,
      winnerId: null,
      gameWinnerId: null,
      targetScore: isH2OSplash(config) ? 3 : config.game === 'noMercy' ? 1000 : config.targetScore,
      config,
      pendingDraw: null,
      pendingDare: null,
      pendingEmoji: null,
      pendingDareDropAll: null,
      drewThisTurn: false,
      drawnCardIdThisTurn: null,
      mustPlayFromHand: false,
      speedPlayColor: null,
      unoDeclaredPlayerId: null,
      catchableUnoPlayerId: null,
      zeroCallPendingPlayerId: null,
      pendingCaboPower: null,
      caboCallerPlayerId: null,
      caboFinalTurnsRemaining: null,
      whirlpoolEvent: null,
      launcherEvent: null,
      flashEvent: null,
      spinEvent: null,
      dareEvent: null,
      zeroTurn: null,
      pendingLiarChallenge: null,
      partyLink: null,
      partyPileEvent: null,
      wildJackpotEvent: null,
      marioKartEvent: config.game === 'marioKart' ? null : undefined,
      justiceLeagueEvent: config.game === 'dc' ? null : undefined,
      webSwingEvent: config.game === 'spiderman' ? null : undefined,
      turtlePowerEvent: config.game === 'tmnt' ? null : undefined,
      beamMeUpEvent: config.game === 'starTrek' ? null : undefined,
      avatarStateEvent: config.game === 'avatar' ? null : undefined,
      creepyCoolEvent: config.game === 'monsterHigh' ? null : undefined,
      touchdownEvent: config.game === 'nfl' ? null : undefined,
      blastChamber: config.game === 'blast' ? 0 : undefined,
      blastEvent: config.game === 'blast' ? null : undefined,
      robotoEvent: config.game === 'roboto' ? null : undefined,
      dosCenterRow: undefined,
      log: [],
      nextLogId: 1,
    },
    `Round 1 starts. Active color is ${colorLabel(top.color === 'wild' ? null : top.color)}.`,
  )
}

function createGuoMemoryGame(config: GameConfig, players: Player[]): GameState {
  return addLog(
    {
      players,
      drawPile: [],
      discardPile: [],
      activePlayerIndex: 0,
      direction: 1,
      activeColor: null,
      flipSide: 'light',
      currentRound: 1,
      winnerId: null,
      gameWinnerId: null,
      targetScore: config.targetScore,
      config,
      pendingDraw: null,
      pendingDare: null,
      pendingEmoji: null,
      pendingDareDropAll: null,
      drewThisTurn: false,
      drawnCardIdThisTurn: null,
      mustPlayFromHand: false,
      speedPlayColor: null,
      unoDeclaredPlayerId: null,
      catchableUnoPlayerId: null,
      zeroCallPendingPlayerId: null,
      pendingCaboPower: null,
      caboCallerPlayerId: null,
      caboFinalTurnsRemaining: null,
      whirlpoolEvent: null,
      launcherEvent: null,
      flashEvent: null,
      spinEvent: null,
      dareEvent: null,
      zeroTurn: null,
      pendingLiarChallenge: null,
      partyLink: null,
      partyPileEvent: null,
      wildJackpotEvent: null,
      memoryActionEvent: isGuoMemoryActionGame(config.game) ? null : undefined,
      memoryBoard: createMemoryBoard(config),
      log: [],
      nextLogId: 1,
    },
    config.game === 'guoMemoryAction'
      ? "Guo's Exclusive UNO Memory Action begins. Find pairs and survive surprise cards."
      : config.game === 'guoTripleMemoryAction'
        ? "Guo's Exclusive UNO Triple Memory Action begins. Find triples and survive surprise cards."
      : config.game === 'guoTripleMemory'
        ? "Guo's Exclusive UNO Triple Memory begins. Find matching triples."
        : "Guo's Exclusive UNO Memory begins. Find matching pairs.",
  )
}

function createMemoryBoard(config: GameConfig): MemoryBoard {
  const memoryColors: UnoColor[] = ['red', 'yellow', 'green', 'blue']
  const isTriple = config.game === 'guoTripleMemory' || config.game === 'guoTripleMemoryAction'
  const rows = isTriple ? config.memoryDifficulty === 'easy' ? 6 : 6 : config.memoryDifficulty === 'hard' ? 8 : config.memoryDifficulty === 'medium' ? 6 : 4
  const columns = isTriple ? config.memoryDifficulty === 'hard' ? 8 : config.memoryDifficulty === 'medium' ? 6 : 3 : rows
  const cardsPerMatch = isTriple ? 3 : 2
  const actionKinds = isGuoMemoryActionGame(config.game) ? memoryActionKinds(config.game, config.memoryDifficulty) : []
  const groupCount = (rows * columns - actionKinds.length) / cardsPerMatch
  const slots: MemorySlot[] = []
  for (let group = 0; group < groupCount; group += 1) {
    const value = (group % 9) + 1
    const color = memoryColors[group % memoryColors.length]
    for (let cardIndex = 0; cardIndex < cardsPerMatch; cardIndex += 1) {
      const groupColor = config.memoryMatchMode === 'color' || config.memoryMatchMode === 'both' ? color : memoryColors[(group + cardIndex * 2) % memoryColors.length]
      const groupValue = config.memoryMatchMode === 'color' ? ((group + cardIndex * 3) % 9) + 1 : value
      slots.push({ card: memoryCard(`memory-${group}-${cardIndex}`, groupColor, groupValue), faceUp: false })
    }
  }
  actionKinds.forEach((kind, index) => {
    slots.push({ card: memoryActionCard(`memory-action-${index}-${kind}`, kind), faceUp: false, memoryActionKind: kind })
  })
  if (slots.length !== rows * columns) throw new Error(`Invalid Guo Memory board size: expected ${rows * columns}, got ${slots.length}`)
  const revealSeconds = [2, 3, 4, 5].includes(config.memoryRevealSeconds) ? config.memoryRevealSeconds : 2
  return {
    slots: shuffle(slots),
    rows,
    columns,
    cardsPerMatch,
    matchMode: config.memoryMatchMode,
    selectedSlotIndexes: [],
    pendingMatchIndexes: null,
    pendingMatchPlayerId: null,
    pendingMismatchIndexes: null,
    revealDurationMs: revealSeconds * 1000,
  }
}

function memoryActionKinds(game: GameVariant, difficulty: MemoryDifficulty): MemoryActionKind[] {
  if (game === 'guoTripleMemoryAction') {
    if (difficulty === 'easy') return ['wild', 'wild', 'wild']
    if (difficulty === 'medium') return ['wild', 'wild', 'wild', 'wild', 'wild', 'wild', 'loseCards', 'loseCards', 'loseCards', 'earnCards', 'earnCards', 'earnCards']
    return [
      'wild',
      'wild',
      'wild',
      'wild',
      'wild',
      'wild',
      'loseCards',
      'loseCards',
      'loseCards',
      'earnCards',
      'earnCards',
      'allOthersLose',
      'allOthersEarn',
      'loseAll',
      'winnerTakesAll',
    ]
  }
  if (difficulty === 'easy') return ['wild', 'wild']
  if (difficulty === 'medium') return ['wild', 'wild', 'wild', 'wild', 'loseCards', 'loseCards', 'earnCards', 'earnCards']
  return [
    'wild',
    'wild',
    'wild',
    'wild',
    'loseCards',
    'loseCards',
    'earnCards',
    'earnCards',
    'allOthersLose',
    'allOthersEarn',
    'loseAll',
    'winnerTakesAll',
  ]
}

function memoryCard(id: string, color: UnoColor, value: number): Card {
  return { id, kind: 'number', color, label: String(value), points: value, value }
}

function memoryActionCard(id: string, action: MemoryActionKind): Card {
  const labels: Record<MemoryActionKind, string> = {
    wild: 'Wild',
    loseCards: 'Lose Cards',
    earnCards: 'Earn Cards',
    allOthersLose: 'Others Lose',
    allOthersEarn: 'Others Earn',
    loseAll: 'Lose All',
    winnerTakesAll: 'Winner Takes All',
  }
  return { id, kind: 'wild', color: 'wild', label: labels[action], points: 0 }
}

function createTriplePlayGame(config: GameConfig, players: Player[]): GameState {
  const deck = shuffle(buildTriplePlayDeck())
  for (let round = 0; round < config.startingHandSize; round += 1) {
    for (const player of players) {
      player.hand.push(deck.pop()!)
    }
  }

  const piles: TriplePlayPile[] = [0, 1, 2].map((index) => {
    const top = drawOpeningCard(deck)
    return {
      cards: [top],
      activeColor: top.color === 'wild' ? COLORS[index % COLORS.length] : top.color,
      overload: 0,
      limit: 3 + index,
      active: true,
    }
  })
  const firstTop = piles[0].cards[0]

  return addLog(
    {
      players,
      drawPile: deck,
      discardPile: piles.flatMap((pile) => pile.cards),
      activePlayerIndex: 0,
      direction: 1,
      activeColor: piles[0].activeColor,
      flipSide: 'light',
      currentRound: 1,
      winnerId: null,
      gameWinnerId: null,
      targetScore: config.targetScore,
      config,
      pendingDraw: null,
      pendingDare: null,
      pendingDareDropAll: null,
      drewThisTurn: false,
      drawnCardIdThisTurn: null,
      mustPlayFromHand: false,
      speedPlayColor: null,
      unoDeclaredPlayerId: null,
      catchableUnoPlayerId: null,
      zeroCallPendingPlayerId: null,
      pendingCaboPower: null,
      caboCallerPlayerId: null,
      caboFinalTurnsRemaining: null,
      whirlpoolEvent: null,
      launcherEvent: null,
      flashEvent: null,
      spinEvent: null,
      dareEvent: null,
      zeroTurn: null,
      pendingLiarChallenge: null,
      partyLink: null,
      partyPileEvent: null,
      wildJackpotEvent: null,
      triplePlayPiles: piles,
      dosCenterRow: undefined,
      log: [],
      nextLogId: 1,
    },
    `Round 1 starts. The Triple Play unit lit all piles; pile 1 starts on ${firstTop.label}.`,
  )
}

function createTippoGame(config: GameConfig, players: Player[]): GameState {
  const deck = shuffle(buildTippoDeck())
  for (let round = 0; round < config.startingHandSize; round += 1) {
    for (const player of players) {
      player.hand.push(deck.pop()!)
    }
  }

  const trays: TippoTray[] = [0, 1].map((index) => {
    const top = drawOpeningCard(deck)
    return {
      cards: [top],
      activeColor: top.color === 'wild' ? COLORS[index % COLORS.length] : top.color,
      load: 0,
      limit: 4,
    }
  })

  return addLog(
    {
      players,
      drawPile: deck,
      discardPile: trays.flatMap((tray) => tray.cards),
      activePlayerIndex: 0,
      direction: 1,
      activeColor: trays[0].activeColor,
      flipSide: 'light',
      currentRound: 1,
      winnerId: null,
      gameWinnerId: null,
      targetScore: config.targetScore,
      config,
      pendingDraw: null,
      pendingDare: null,
      pendingDareDropAll: null,
      drewThisTurn: false,
      drawnCardIdThisTurn: null,
      mustPlayFromHand: false,
      speedPlayColor: null,
      unoDeclaredPlayerId: null,
      catchableUnoPlayerId: null,
      zeroCallPendingPlayerId: null,
      pendingCaboPower: null,
      caboCallerPlayerId: null,
      caboFinalTurnsRemaining: null,
      whirlpoolEvent: null,
      launcherEvent: null,
      flashEvent: null,
      spinEvent: null,
      dareEvent: null,
      zeroTurn: null,
      pendingLiarChallenge: null,
      partyLink: null,
      partyPileEvent: null,
      wildJackpotEvent: null,
      tippoEvent: null,
      tippoTrays: trays,
      dosCenterRow: undefined,
      log: [],
      nextLogId: 1,
    },
    'Round 1 starts. The Tippo balance begins with two discard trays.',
  )
}

function createDiceGame(config: GameConfig, players: Player[]): GameState {
  const diceConfig = { ...config, playerCount: 2, startingHandSize: 5, targetScore: 200 }
  const dicePlayers = players.slice(0, 2)
  const dice = buildDiceSet()
  for (const player of dicePlayers) {
    player.hand = dice.splice(0, 5)
  }
  const extraDie = dice.pop()
  const opening = extraDie?.kind === 'number' ? extraDie : rollOpeningDiceFace()

  return addLog(
    {
      players: dicePlayers,
      drawPile: [],
      discardPile: [opening],
      activePlayerIndex: 0,
      direction: 1,
      activeColor: opening.color === 'wild' ? null : opening.color,
      flipSide: 'light',
      currentRound: 1,
      winnerId: null,
      gameWinnerId: null,
      targetScore: 200,
      config: diceConfig,
      pendingDraw: null,
      pendingDare: null,
      pendingDareDropAll: null,
      drewThisTurn: false,
      drawnCardIdThisTurn: null,
      mustPlayFromHand: false,
      speedPlayColor: null,
      unoDeclaredPlayerId: null,
      catchableUnoPlayerId: null,
      zeroCallPendingPlayerId: null,
      pendingCaboPower: null,
      caboCallerPlayerId: null,
      caboFinalTurnsRemaining: null,
      whirlpoolEvent: null,
      launcherEvent: null,
      flashEvent: null,
      spinEvent: null,
      dareEvent: null,
      zeroTurn: null,
      pendingLiarChallenge: null,
      partyLink: null,
      partyPileEvent: null,
      wildJackpotEvent: null,
      dosCenterRow: undefined,
      log: [],
      nextLogId: 1,
    },
    `Round 1 starts. UNO Dice begins with ${opening.label} in the center line.`,
  )
}

function createZeroGame(config: GameConfig, players: Player[]): GameState {
  const deck = shuffle(buildZeroDeck())
  for (const player of players) {
    const grid = Array.from({ length: 6 }, () => ({ card: deck.pop()!, faceUp: false }))
    for (const index of startingZeroRevealIndexes()) {
      grid[index].faceUp = true
    }
    player.hand = []
    player.zeroGrid = grid
  }

  const discardPile = [drawOpeningCard(deck)]
  const top = discardPile[0]
  return addLog(
    {
      players,
      drawPile: deck,
      discardPile,
      activePlayerIndex: 0,
      direction: 1,
      activeColor: top.color === 'wild' ? COLORS[Math.floor(Math.random() * COLORS.length)] : top.color,
      flipSide: 'light',
      currentRound: 1,
      winnerId: null,
      gameWinnerId: null,
      targetScore: 9,
      config,
      pendingDraw: null,
      pendingDare: null,
      pendingDareDropAll: null,
      drewThisTurn: false,
      drawnCardIdThisTurn: null,
      mustPlayFromHand: false,
      speedPlayColor: null,
      unoDeclaredPlayerId: null,
      catchableUnoPlayerId: null,
      zeroCallPendingPlayerId: null,
      pendingCaboPower: null,
      caboCallerPlayerId: null,
      caboFinalTurnsRemaining: null,
      whirlpoolEvent: null,
      launcherEvent: null,
      flashEvent: null,
      spinEvent: null,
      dareEvent: null,
      zeroTurn: { drawnCard: null, source: null },
      pendingLiarChallenge: null,
      partyLink: null,
      partyPileEvent: null,
      wildJackpotEvent: null,
      dosCenterRow: undefined,
      log: [],
      nextLogId: 1,
    },
    `Round 1 starts. UNO Zero uses 2x3 grids.`,
  )
}

function createCaboGame(config: GameConfig, players: Player[]): GameState {
  const deck = shuffle(buildCaboDeck())
  for (const player of players) {
    const grid: ZeroGridSlot[] = Array.from({ length: 4 }, () => ({ card: deck.pop()!, faceUp: false, knownByPlayerIds: [] }))
    for (const index of startingCaboRevealIndexes()) {
      grid[index].knownByPlayerIds = [player.id]
    }
    player.hand = []
    player.zeroGrid = grid
  }

  const discardPile = [drawOpeningCard(deck)]
  const top = discardPile[0]
  return addLog(
    {
      players,
      drawPile: deck,
      discardPile,
      activePlayerIndex: 0,
      direction: 1,
      activeColor: top.color === 'wild' ? COLORS[Math.floor(Math.random() * COLORS.length)] : top.color,
      flipSide: 'light',
      currentRound: 1,
      winnerId: null,
      gameWinnerId: null,
      targetScore: 100,
      config,
      pendingDraw: null,
      pendingDare: null,
      pendingDareDropAll: null,
      drewThisTurn: false,
      drawnCardIdThisTurn: null,
      mustPlayFromHand: false,
      speedPlayColor: null,
      unoDeclaredPlayerId: null,
      catchableUnoPlayerId: null,
      zeroCallPendingPlayerId: null,
      pendingCaboPower: null,
      caboCallerPlayerId: null,
      caboFinalTurnsRemaining: null,
      whirlpoolEvent: null,
      launcherEvent: null,
      flashEvent: null,
      spinEvent: null,
      dareEvent: null,
      zeroTurn: { drawnCard: null, source: null },
      pendingLiarChallenge: null,
      partyLink: null,
      partyPileEvent: null,
      wildJackpotEvent: null,
      dosCenterRow: undefined,
      log: [],
      nextLogId: 1,
    },
    `Round 1 starts. Cabo uses 2x2 memory grids.`,
  )
}

function createSkyjoGame(config: GameConfig, players: Player[]): GameState {
  const deck = shuffle(buildSkyjoDeck())
  for (const player of players) {
    const grid: ZeroGridSlot[] = Array.from({ length: 12 }, () => ({ card: deck.pop()!, faceUp: false, knownByPlayerIds: [] }))
    for (const index of startingSkyjoRevealIndexes()) {
      grid[index].faceUp = true
    }
    player.hand = []
    player.zeroGrid = grid
  }

  const discardPile = [deck.pop()!]
  const top = discardPile[0]
  return addLog(
    {
      players,
      drawPile: deck,
      discardPile,
      activePlayerIndex: 0,
      direction: 1,
      activeColor: top.color === 'wild' ? COLORS[Math.floor(Math.random() * COLORS.length)] : top.color,
      flipSide: 'light',
      currentRound: 1,
      winnerId: null,
      gameWinnerId: null,
      targetScore: 100,
      config,
      pendingDraw: null,
      pendingDare: null,
      pendingDareDropAll: null,
      drewThisTurn: false,
      drawnCardIdThisTurn: null,
      mustPlayFromHand: false,
      speedPlayColor: null,
      unoDeclaredPlayerId: null,
      catchableUnoPlayerId: null,
      zeroCallPendingPlayerId: null,
      pendingCaboPower: null,
      caboCallerPlayerId: null,
      caboFinalTurnsRemaining: null,
      whirlpoolEvent: null,
      launcherEvent: null,
      flashEvent: null,
      spinEvent: null,
      dareEvent: null,
      zeroTurn: { drawnCard: null, source: null },
      pendingLiarChallenge: null,
      partyLink: null,
      partyPileEvent: null,
      wildJackpotEvent: null,
      dosCenterRow: undefined,
      log: [],
      nextLogId: 1,
    },
    `Round 1 starts. Skyjo uses 3x4 grids.`,
  )
}

function createDosGame(config: GameConfig, players: Player[]): GameState {
  const deck = shuffle(buildDosDeck())
  for (let round = 0; round < 7; round += 1) {
    for (const player of players) {
      player.hand.push(deck.pop()!)
    }
  }
  const dosCenterRow = [drawDosCenterCard(deck), drawDosCenterCard(deck)].filter(Boolean) as Card[]
  return addLog(
    {
      players,
      drawPile: deck,
      discardPile: [],
      activePlayerIndex: 0,
      direction: 1,
      activeColor: null,
      flipSide: 'light',
      currentRound: 1,
      winnerId: null,
      gameWinnerId: null,
      targetScore: 200,
      config,
      pendingDraw: null,
      pendingDare: null,
      pendingDareDropAll: null,
      drewThisTurn: false,
      drawnCardIdThisTurn: null,
      mustPlayFromHand: false,
      speedPlayColor: null,
      unoDeclaredPlayerId: null,
      catchableUnoPlayerId: null,
      zeroCallPendingPlayerId: null,
      pendingCaboPower: null,
      caboCallerPlayerId: null,
      caboFinalTurnsRemaining: null,
      whirlpoolEvent: null,
      launcherEvent: null,
      flashEvent: null,
      spinEvent: null,
      dareEvent: null,
      zeroTurn: null,
      pendingLiarChallenge: null,
      partyLink: null,
      partyPileEvent: null,
      wildJackpotEvent: null,
      dosCenterRow,
      log: [],
      nextLogId: 1,
    },
    `Round 1 starts. DOS uses a two-card center row.`,
  )
}

function createPhase10Game(config: GameConfig, players: Player[]): GameState {
  const deck = shuffle(buildPhase10Deck())
  for (const player of players) {
    player.hand = []
    player.phase10Phase = player.phase10Phase ?? 1
    player.phase10Completed = false
    player.phase10Melds = []
  }
  for (let round = 0; round < 10; round += 1) {
    for (const player of players) {
      player.hand.push(deck.pop()!)
    }
  }

  const discardPile = [drawOpeningCard(deck)]
  const top = discardPile[0]
  return addLog(
    {
      players,
      drawPile: deck,
      discardPile,
      activePlayerIndex: 0,
      direction: 1,
      activeColor: top.color === 'wild' ? null : top.color,
      flipSide: 'light',
      currentRound: 1,
      winnerId: null,
      gameWinnerId: null,
      targetScore: 10,
      config,
      pendingDraw: null,
      pendingDare: null,
      pendingDareDropAll: null,
      drewThisTurn: false,
      drawnCardIdThisTurn: null,
      mustPlayFromHand: false,
      speedPlayColor: null,
      unoDeclaredPlayerId: null,
      catchableUnoPlayerId: null,
      zeroCallPendingPlayerId: null,
      pendingCaboPower: null,
      caboCallerPlayerId: null,
      caboFinalTurnsRemaining: null,
      whirlpoolEvent: null,
      launcherEvent: null,
      flashEvent: null,
      spinEvent: null,
      dareEvent: null,
      zeroTurn: null,
      pendingLiarChallenge: null,
      partyLink: null,
      partyPileEvent: null,
      wildJackpotEvent: null,
      dosCenterRow: undefined,
      log: [],
      nextLogId: 1,
    },
    `Round 1 starts. Phase 10 players work on phase 1.`,
  )
}

function createSkipBoGame(config: GameConfig, players: Player[]): GameState {
  const deck = shuffle(buildSkipBoDeck())
  const stockSize = players.length >= 5 ? 20 : 30
  for (const player of players) {
    player.hand = []
    player.skipBoStockPile = []
    player.skipBoDiscardPiles = [[], [], [], []]
  }
  for (let round = 0; round < stockSize; round += 1) {
    for (const player of players) {
      const card = deck.pop()
      if (card) player.skipBoStockPile?.push(card)
    }
  }

  return addLog(
    {
      players,
      drawPile: deck,
      discardPile: [],
      activePlayerIndex: 0,
      direction: 1,
      activeColor: null,
      flipSide: 'light',
      currentRound: 1,
      winnerId: null,
      gameWinnerId: null,
      targetScore: 1,
      config,
      pendingDraw: null,
      pendingDare: null,
      pendingDareDropAll: null,
      drewThisTurn: false,
      drawnCardIdThisTurn: null,
      mustPlayFromHand: false,
      speedPlayColor: null,
      unoDeclaredPlayerId: null,
      catchableUnoPlayerId: null,
      zeroCallPendingPlayerId: null,
      pendingCaboPower: null,
      caboCallerPlayerId: null,
      caboFinalTurnsRemaining: null,
      whirlpoolEvent: null,
      launcherEvent: null,
      flashEvent: null,
      spinEvent: null,
      dareEvent: null,
      zeroTurn: null,
      pendingLiarChallenge: null,
      partyLink: null,
      partyPileEvent: null,
      wildJackpotEvent: null,
      dosCenterRow: undefined,
      skipBoBuildPiles: [[], [], [], []],
      log: [],
      nextLogId: 1,
    },
    `Round 1 starts. Skip-Bo players race to clear their stock pile.`,
  )
}

function createPassageGame(config: GameConfig, players: Player[]): GameState {
  const deck = shuffle(buildPassageDeck())
  const startingHandSize = Math.max(5, Math.min(10, config.startingHandSize))

  for (let round = 0; round < startingHandSize; round += 1) {
    for (const player of players) {
      player.hand.push(deck.pop()!)
    }
  }
  for (const player of players) {
    player.passagePairs = []
  }

  const faceUp = deck.pop() ?? null

  return addLog(
    {
      players,
      drawPile: deck,
      discardPile: [],
      activePlayerIndex: 0,
      direction: 1,
      activeColor: faceUp?.color && faceUp.color !== 'wild' ? faceUp.color : null,
      flipSide: 'light',
      currentRound: 1,
      winnerId: null,
      gameWinnerId: null,
      targetScore: config.targetScore,
      config,
      pendingDraw: null,
      pendingDare: null,
      pendingEmoji: null,
      pendingDareDropAll: null,
      drewThisTurn: false,
      drawnCardIdThisTurn: null,
      mustPlayFromHand: false,
      speedPlayColor: null,
      unoDeclaredPlayerId: null,
      catchableUnoPlayerId: null,
      zeroCallPendingPlayerId: null,
      pendingCaboPower: null,
      caboCallerPlayerId: null,
      caboFinalTurnsRemaining: null,
      whirlpoolEvent: null,
      launcherEvent: null,
      flashEvent: null,
      spinEvent: null,
      dareEvent: null,
      zeroTurn: null,
      pendingLiarChallenge: null,
      partyLink: null,
      partyPileEvent: null,
      wildJackpotEvent: null,
      passageFaceUp: faceUp,
      passageSlot: null,
      passageTurn: { phase: 'take', takenCard: null, source: null },
      passageDiscardPile: [],
      dosCenterRow: undefined,
      log: [],
      nextLogId: 1,
    },
    'Round 1 starts. Take from the face-up pile, passage slot, or draw deck.',
  )
}

function startingZeroRevealIndexes(): number[] {
  const indexes = [0, 1, 2, 3, 4, 5]
  return shuffle(indexes).slice(0, 2)
}

function startingCaboRevealIndexes(): number[] {
  return shuffle([0, 1, 2, 3]).slice(0, 2)
}

function startingSkyjoRevealIndexes(): number[] {
  return shuffle(Array.from({ length: 12 }, (_, index) => index)).slice(0, 2)
}

function drawOpeningCard(deck: Card[]): Card {
  const numberIndex = deck.findIndex((card) => card.kind === 'number')
  const index = numberIndex >= 0 ? numberIndex : deck.length - 1
  return deck.splice(index, 1)[0]
}

function drawDosCenterCard(deck: Card[]): Card | null {
  const numberIndex = deck.findIndex((card) => card.kind === 'number')
  const index = numberIndex >= 0 ? numberIndex : deck.length - 1
  return deck.splice(index, 1)[0] ?? null
}

function createPlayers(config: GameConfig): Player[] {
  return Array.from({ length: config.playerCount }, (_, index) => {
    const mode = config.mode
    const isHuman =
      (mode === 'single' && index === 0) || mode === 'hotseat' || (mode === 'wifi' && index === 0)
    return {
      id: `p${index + 1}`,
      name: isHuman ? (mode === 'hotseat' ? `Player ${index + 1}` : 'You') : `AI ${index + 1}`,
      type: isHuman ? 'human' : 'ai',
      aiDifficulty: isHuman ? undefined : config.aiDifficulty,
      hand: [],
      score: 0,
      unoSafe: false,
      avatarId: isHuman && index === 0 ? config.avatarId : AVATARS[(index + 1) % AVATARS.length],
      flexPowerActive: true,
      teamId: config.game === 'teams' ? (index % 2 === 0 ? 'A' : 'B') : undefined,
      phase10Phase: config.game === 'phase10' ? 1 : undefined,
      phase10Completed: config.game === 'phase10' ? false : undefined,
      phase10Melds: config.game === 'phase10' ? [] : undefined,
      skipBoStockPile: config.game === 'skipBo' ? [] : undefined,
      skipBoDiscardPiles: config.game === 'skipBo' ? [[], [], [], []] : undefined,
    }
  })
}

export function activePlayer(state: GameState): Player {
  return state.players[state.activePlayerIndex]
}

export function topCard(state: GameState): Card {
  return state.discardPile[state.discardPile.length - 1]
}

export function isPlayable(card: Card, state: GameState): boolean {
  if (state.winnerId) return false
  if (state.pendingDare) return false
  if (state.pendingEmoji) return false
  if (state.pendingLiarChallenge) return false
  if (state.config.game === 'triplePlay') {
    if (state.pendingDraw) return false
    return triplePlayLegalPileIndexes(state, card).length > 0
  }
  if (state.config.game === 'tippo') {
    if (state.pendingDraw) return false
    return tippoLegalTrayIndexes(state, card).length > 0
  }
  if (state.config.game === 'dice') return diceCanPlayOnLine(card, state)
  if (state.config.game === 'dos') return dosCardCanMatch(card, activePlayer(state).hand, state.dosCenterRow ?? [])
  if (state.config.game === 'phase10') return state.drewThisTurn && activePlayer(state).hand.some((entry) => entry.id === card.id)
  if (state.config.game === 'skipBo') return state.drewThisTurn && findSkipBoBuildPile(state, card) >= 0
  if (state.config.game === 'guoPassage') {
    if (state.passageTurn?.phase === 'pair' && state.passageTurn.takenCard) return Boolean(passagePairScore(state, state.passageTurn.takenCard, card))
    return state.passageTurn?.phase === 'pass'
  }
  if (card.kind === 'targetedSwap' && availableTargetCount(state) < 2) {
    return false
  }
  if (card.kind === 'wildDrawnTogether' && state.players.length < 3) {
    return false
  }
  if (state.speedPlayColor) {
    return card.color === state.speedPlayColor
  }
  if (state.pendingDraw) {
    return isPenaltyResponse(card, state)
  }
  if (state.drewThisTurn && state.drawnCardIdThisTurn && card.id !== state.drawnCardIdThisTurn) {
    return false
  }
  if (state.config.game === 'liars' && card.liar) return true
  return isBasePlayable(card, state)
}

export function triplePlayLegalPileIndexes(state: GameState, card: Card): number[] {
  if (state.config.game !== 'triplePlay') return []
  return (state.triplePlayPiles ?? [])
    .map((pile, index) => ({ pile, index }))
    .filter(({ pile }) => pile.active && triplePlayCanPlayOnPile(card, pile))
    .map(({ index }) => index)
}

export function tippoLegalTrayIndexes(state: GameState, card: Card): number[] {
  if (state.config.game !== 'tippo') return []
  return (state.tippoTrays ?? [])
    .map((tray, index) => ({ tray, index }))
    .filter(({ tray }) => tippoCanPlayOnTray(card, tray))
    .map(({ index }) => index)
}

function triplePlayCanPlayOnPile(card: Card, pile: TriplePlayPile): boolean {
  const top = pile.cards[pile.cards.length - 1]
  if (!top) return true
  return (
    card.color === 'wild' ||
    card.color === pile.activeColor ||
    (card.kind === 'number' && top.kind === 'number' && card.value === top.value) ||
    (card.kind !== 'number' && cardSymbol(card) === cardSymbol(top))
  )
}

function tippoCanPlayOnTray(card: Card, tray: TippoTray): boolean {
  const top = tray.cards[tray.cards.length - 1]
  if (!top) return true
  return (
    card.color === 'wild' ||
    card.color === tray.activeColor ||
    (card.kind === 'number' && top.kind === 'number' && card.value === top.value) ||
    (card.kind !== 'number' && cardSymbol(card) === cardSymbol(top))
  )
}

function diceCanPlayOnLine(card: Card, state: GameState): boolean {
  const top = topCard(state)
  if (!top) return true
  return (
    card.color === 'wild' ||
    card.color === state.activeColor ||
    (card.kind === 'number' && top.kind === 'number' && card.value === top.value) ||
    (card.kind !== 'number' && cardSymbol(card) === cardSymbol(top))
  )
}

export function canPartySpeedPlayCutIn(card: Card, state: GameState, playerId: string): boolean {
  if (state.config.game !== 'party' && state.config.game !== 'houseRules') return false
  if (state.winnerId || state.pendingDraw || state.pendingLiarChallenge || state.mustPlayFromHand || state.speedPlayColor) return false
  if (activePlayer(state).id === playerId) return false
  const player = state.players.find((entry) => entry.id === playerId)
  if (!player?.hand.some((entry) => entry.id === card.id)) return false
  return isExactPartySpeedMatch(card, topCard(state))
}

export function speedPlayableCards(player: Player, state: GameState): Card[] {
  return player.hand.filter((card) => canPartySpeedPlayCutIn(card, state, player.id))
}

export function speedPlayCutIn(state: GameState, playerId: string, cardId: string): PlayResult {
  if (state.config.game !== 'party' && state.config.game !== 'houseRules') return { state, sound: 'error' }
  const playerIndex = state.players.findIndex((player) => player.id === playerId)
  const player = state.players[playerIndex]
  const card = player?.hand.find((entry) => entry.id === cardId)
  if (!player || !card) return { state, sound: 'error' }
  if (!canPartySpeedPlayCutIn(card, state, playerId)) {
    let penalized = drawCards(state, playerIndex, 1)
    penalized = addLog(penalized, `${player.name} tried an invalid Speed Play and drew 1.`)
    return { state: penalized, sound: 'error' }
  }
  const hijacked = setActivePlayer(addLog(state, `${player.name} cut in with Speed Play.`), playerIndex)
  return playCard(hijacked, cardId)
}

export function canPassToPartner(state: GameState, playerId: string): boolean {
  if (state.config.game !== 'teams' || state.winnerId || state.pendingDraw || state.pendingLiarChallenge) return false
  if (state.mustPlayFromHand || state.speedPlayColor || state.drewThisTurn) return false
  const player = activePlayer(state)
  return player.id === playerId && player.hand.length > 0 && Boolean(teamPartner(state, playerId))
}

export function passCardToPartner(state: GameState, playerId: string, cardId: string): GameState {
  if (!canPassToPartner(state, playerId)) return state
  const playerIndex = state.players.findIndex((player) => player.id === playerId)
  const partnerIndex = teamPartnerIndex(state, playerId)
  if (playerIndex < 0 || partnerIndex < 0) return state
  let next = cloneState(closeCatchWindow(state))
  const player = next.players[playerIndex]
  const partner = next.players[partnerIndex]
  const cardIndex = player.hand.findIndex((card) => card.id === cardId)
  if (cardIndex < 0) return state
  const [card] = player.hand.splice(cardIndex, 1)
  partner.hand.push(card)
  next = drawCards(next, playerIndex, 1)
  next = addLog(next, `${player.name} passed 1 card to partner ${partner.name} and drew 1.`)
  return advanceTurn(next)
}

function isBasePlayable(card: Card, state: GameState): boolean {
  if (state.config.game === 'guoNeighborMatch') return isNeighborMatchPlayable(card, state)
  if (state.config.game === 'guoHiLo') return isHiLoPlayable(card, state)
  const top = effectiveTopCard(state)
  return (
    card.color === 'wild' ||
    card.color === state.activeColor ||
    (card.kind === 'number' && top.kind === 'number' && card.value === top.value) ||
    (card.kind !== 'number' && cardSymbol(card) === cardSymbol(top))
  )
}

function isNeighborMatchPlayable(card: Card, state: GameState): boolean {
  if (card.color === 'wild') return true
  const anchor = neighborAnchorForState(state)
  if (card.kind === 'number') {
    if (typeof card.value !== 'number' || anchor === null) return false
    const numberMatches = card.value === anchor || card.value === neighborBefore(anchor) || card.value === neighborAfter(anchor)
    if (!numberMatches) return false
    return state.config.neighborColorConstrained ? card.color === state.activeColor : true
  }
  return card.color === state.activeColor
}

function isHiLoPlayable(card: Card, state: GameState): boolean {
  if (card.color === 'wild') return true
  const anchor = hiLoAnchorForState(state)
  if (card.kind === 'number') {
    if (typeof card.value !== 'number' || anchor === null) return false
    const direction = state.hiLoDirection ?? 'higher'
    const numberMatches = direction === 'higher' ? card.value > anchor : card.value < anchor
    if (!numberMatches) return false
    return state.config.hiLoColorConstrained ? card.color === state.activeColor : true
  }
  const top = effectiveTopCard(state)
  return card.color === state.activeColor || cardSymbol(card) === cardSymbol(top)
}

function neighborAnchorForState(state: GameState): number | null {
  if (typeof state.neighborAnchor === 'number') return normalizeNeighborNumber(state.neighborAnchor)
  const top = effectiveTopCard(state)
  return top.kind === 'number' && typeof top.value === 'number' ? normalizeNeighborNumber(top.value) : null
}

function hiLoAnchorForState(state: GameState): number | null {
  if (typeof state.hiLoAnchor === 'number') return normalizeHiLoNumber(state.hiLoAnchor)
  const top = effectiveTopCard(state)
  return top.kind === 'number' && typeof top.value === 'number' ? normalizeHiLoNumber(top.value) : null
}

function neighborBefore(value: number): number {
  return normalizeNeighborNumber(value - 1)
}

function neighborAfter(value: number): number {
  return normalizeNeighborNumber(value + 1)
}

function normalizeNeighborNumber(value: number): number {
  return ((Math.trunc(value) % 10) + 10) % 10
}

function normalizeHiLoNumber(value: number): number {
  return Math.max(0, Math.min(9, Math.trunc(value)))
}

function randomHiLoAnchor(): number {
  return Math.floor(Math.random() * 10)
}

function randomHiLoDirection(): 'higher' | 'lower' {
  return Math.random() < 0.5 ? 'higher' : 'lower'
}

function isExactPartySpeedMatch(card: Card, top: Card): boolean {
  if (card.color === 'wild' || top.color === 'wild') return false
  if (card.color !== top.color) return false
  if (card.kind === 'number' && top.kind === 'number') return card.value === top.value
  return card.kind !== 'number' && cardSymbol(card) === cardSymbol(top)
}

function effectiveTopCard(state: GameState): Card {
  const top = topCard(state)
  if (state.config.game !== 'liars' || !top.liarClaim) return top
  return cardFromLiarClaim(top.liarClaim, top)
}

function cardSymbol(card: Card): CardKind {
  if (card.kind === 'flexSkip') return 'skip'
  if (card.kind === 'flexReverse') return 'reverse'
  if (card.kind === 'flexDraw2') return 'draw2'
  if (card.kind === 'wildFlexDraw2') return 'wild'
  if (card.kind === 'wildSkip') return 'skip'
  if (card.kind === 'wildReverse') return 'reverse'
  if (card.kind === 'wildDare') return 'dare'
  return card.kind
}

function isPenaltyResponse(card: Card, state: GameState): boolean {
  if (state.config.game === 'popCulture' && card.kind === 'wildAvengersAssemble') return true
  if (state.config.game === 'superMario' && card.kind === 'wildSuperStar') return true
  if (state.config.addOns.reverse && card.kind === 'wildNoU') return true
  if (state.config.game === 'noMercy') {
    const pendingCardValue = state.pendingDraw?.cardValue ?? state.pendingDraw?.amount ?? 0
    const cardDrawValue = drawValue(card)
    return cardDrawValue > 0 && cardDrawValue >= pendingCardValue
  }
  if (state.config.game === 'party') return card.kind === 'draw2' || card.kind === 'wildDraw4'
  if (state.config.game === 'houseRules') return card.kind === 'draw2' || card.kind === 'wildDraw4'
  if (!state.config.addOns.stack) return false
  return card.pack === 'stack' || (state.config.addOns.reverse && card.kind === 'reverseDraw2')
}

function drawValue(card: Card): number {
  if (card.kind === 'draw1') return 1
  if (card.kind === 'draw5') return 5
  if (card.kind === 'wildDraw2' || card.kind === 'wildTargetDraw2') return 2
  if (card.kind === 'draw2' || card.kind === 'flexDraw2' || card.kind === 'reverseDraw2' || card.kind === 'stack2' || card.kind === 'wildDraw2Swap') return 2
  if (card.kind === 'draw4' || card.kind === 'wildReverseDraw4') return 4
  if (card.kind === 'stack1' || card.kind === 'wildDraw1SpeedPlay') return 1
  if (card.kind === 'wildDraw3') return 3
  if (card.kind === 'wildDraw4') return 4
  if (card.kind === 'wildDraw6') return 6
  if (card.kind === 'wildDraw10') return 10
  if (card.kind === 'wildDrawMystery') return Math.floor(Math.random() * 4) + 1
  return 0
}

export function playableCards(player: Player, state: GameState): Card[] {
  if (isGuoMemoryGame(state.config.game)) return []
  if (state.config.game === 'guoPassage') return activePlayer(state).id === player.id ? player.hand.filter((card) => isPlayable(card, state)) : []
  if (state.config.game === 'zero') return []
  if (state.config.game === 'dos') return player.hand.filter((card) => dosCardCanMatch(card, player.hand, state.dosCenterRow ?? []))
  if (state.config.game === 'phase10') return activePlayer(state).id === player.id && state.drewThisTurn ? player.hand : []
  if (state.config.game === 'skipBo') return activePlayer(state).id === player.id && state.drewThisTurn ? player.hand.filter((card) => findSkipBoBuildPile(state, card) >= 0) : []
  return player.hand.filter((card) => isPlayable(card, state))
}

export function playCard(state: GameState, cardId: string, choice: PlayChoice = {}): PlayResult {
  if (state.pendingDare) return { state, sound: 'error' }
  if (state.pendingEmoji) return { state, sound: 'error' }
  if (state.pendingLiarChallenge) return { state, sound: 'error' }
  if (state.config.game === 'triplePlay') return playTriplePlayCard(state, cardId, choice)
  if (state.config.game === 'tippo') return playTippoCard(state, cardId, choice)
  if (state.config.game === 'dice') return playDiceCard(state, cardId, choice)
  if (state.config.game === 'dos') return playDosMatch(state, cardId, choice)
  if (state.config.game === 'guoPassage') {
    if (state.passageTurn?.phase === 'pair') return { state: passagePairWithCard(state, cardId), sound: 'play' }
    return { state, sound: 'error' }
  }
  if (state.config.game === 'skipBo') return { state: skipBoPlayCard(state, cardId), sound: 'play' }
  if (state.config.game === 'phase10') {
    const current = activePlayer(state)
    const card = current.hand.find((entry) => entry.id === cardId)
    if (current.phase10Completed && card && findPhase10HitTarget(state, card)) {
      return { state: phase10HitCard(state, cardId), sound: 'play' }
    }
    return { state: phase10Discard(state, cardId), sound: 'play' }
  }
  if (state.config.game === 'zero') {
    if (cardId.startsWith('zero-slot:')) {
      const index = Number(cardId.split(':')[2])
      return { state: zeroSwapDrawnIntoGrid(state, index), sound: 'play' }
    }
    return { state, sound: 'error' }
  }
  const player = activePlayer(state)
  const cardIndex = player.hand.findIndex((card) => card.id === cardId)
  if (cardIndex < 0) return { state, sound: 'error' }
  const card = player.hand[cardIndex]
  if (!isPlayable(card, state)) {
    return { state: addLog(state, `${player.name} cannot play ${card.label}.`), sound: 'error' }
  }

  const choiceRequest = getChoiceRequest(state, card, choice)
  if (choiceRequest) return { state, needsChoice: choiceRequest, sound: 'action' }

  if (state.config.game === 'liars' && card.liar && choice.liarClaim) {
    return playLiarCardFaceDown(state, cardIndex, choice)
  }

  const declaredUno = state.unoDeclaredPlayerId === player.id && player.hand.length === 2
  let next = cloneState(closeCatchWindow(state))
  const current = activePlayer(next)
  const removed = current.hand.splice(cardIndex, 1)[0]
  if (isFlexAction(removed)) {
    removed.flexPlayedMode = choice.useFlex === true ? 'flex' : 'normal'
  } else {
    removed.flexPlayedMode = undefined
  }
  next.discardPile.push(removed)
  next.drewThisTurn = false
  next.drawnCardIdThisTurn = null
  next.mustPlayFromHand = false
  next.speedPlayColor = null
  next.unoDeclaredPlayerId = null

  const previousColor = state.activeColor
  if (removed.color !== 'wild') {
    next.activeColor = removed.color
  }
  if (choice.color) {
    next.activeColor = choice.color
  }
  if (state.config.game === 'guoNeighborMatch') {
    next.neighborAnchor = removed.kind === 'number' && typeof removed.value === 'number'
      ? normalizeNeighborNumber(removed.value)
      : typeof choice.neighborAnchor === 'number'
        ? normalizeNeighborNumber(choice.neighborAnchor)
        : neighborAnchorForState(state)
  }
  if (state.config.game === 'guoHiLo') {
    next.hiLoAnchor = removed.kind === 'number' && typeof removed.value === 'number'
      ? normalizeHiLoNumber(removed.value)
      : typeof choice.hiLoAnchor === 'number'
        ? normalizeHiLoNumber(choice.hiLoAnchor)
        : hiLoAnchorForState(state)
    next.hiLoDirection = randomHiLoDirection()
  }

  if (current.hand.length === 1) {
    current.unoSafe = declaredUno
    if (!declaredUno) {
      next.catchableUnoPlayerId = current.id
    }
  } else {
    current.unoSafe = false
  }

  next = addLog(next, `${current.name} played ${removed.label}${choice.color ? ` and chose ${choice.color}` : ''}${state.config.game === 'guoNeighborMatch' && typeof next.neighborAnchor === 'number' ? ` with anchor ${next.neighborAnchor}` : ''}${state.config.game === 'guoHiLo' && typeof next.hiLoAnchor === 'number' ? ` with Hi-Lo ${next.hiLoAnchor} ${next.hiLoDirection ?? 'higher'}` : ''}.`)
  if (removed.kind === 'wildLiarChallenge') {
    next = applyWildLiarChallenge(next, current.id, choice.color ?? randomColorForSide(next.flipSide))
    next = advanceTurn(next)
    if (!next.winnerId && current.hand.length === 0) {
      next = finishRound(next, current.id)
      return { state: next, sound: 'win' }
    }
    return { state: next, sound: 'wild' }
  }
  const effect = applyCardEffect(next, removed, current.id, previousColor, choice)
  next = effect.state
  let sound = effect.sound ?? 'play'

  if (!next.winnerId && next.config.game === 'blast') {
    const blast = applyBlastUnit(next, removed, current.id, choice.blastRoll)
    next = blast.state
    if (blast.sound) sound = blast.sound
  }
  if (!next.winnerId && next.config.game === 'roboto') {
    const roboto = applyRobotoUnit(next, removed, current.id, choice.robotoRoll, choice.robotoCommand)
    next = roboto.state
    if (roboto.sound) sound = roboto.sound
  }

  const updatedCurrent = next.players.find((entry) => entry.id === current.id)
  if (!next.winnerId && updatedCurrent?.hand.length === 0 && !next.pendingDraw && !next.pendingDare && !next.pendingEmoji) {
    next = finishRound(next, current.id)
    return { state: next, sound: 'win' }
  }

  return { state: next, sound }
}

function playTriplePlayCard(state: GameState, cardId: string, choice: PlayChoice = {}): PlayResult {
  if (state.winnerId || state.pendingDraw) return { state, sound: 'error' }
  const player = activePlayer(state)
  const cardIndex = player.hand.findIndex((card) => card.id === cardId)
  if (cardIndex < 0) return { state, sound: 'error' }
  const card = player.hand[cardIndex]
  if (!isPlayable(card, state)) {
    return { state: addLog(state, `${player.name} cannot play ${card.label} on any lit Triple Play pile.`), sound: 'error' }
  }

  const choiceRequest = getChoiceRequest(state, card, choice)
  if (choiceRequest) return { state, needsChoice: choiceRequest, sound: 'action' }

  const pileIndex = choice.discardPileIndex ?? triplePlayBestPileIndex(state, card)
  if (pileIndex < 0 || !triplePlayLegalPileIndexes(state, card).includes(pileIndex)) {
    return { state: addLog(state, `${player.name} must choose a lit Triple Play pile for ${card.label}.`), sound: 'error' }
  }

  const declaredUno = state.unoDeclaredPlayerId === player.id && player.hand.length === 2
  let next = cloneState(closeCatchWindow(state))
  const current = activePlayer(next)
  const removed = current.hand.splice(cardIndex, 1)[0]
  const pile = next.triplePlayPiles?.[pileIndex]
  if (!pile) return { state, sound: 'error' }
  const previousPileColor = pile.activeColor

  pile.cards.push(removed)
  pile.activeColor = removed.color === 'wild' ? choice.color ?? pile.activeColor ?? randomColorForSide(next.flipSide) : removed.color
  next.discardPile.push(removed)
  next.activeColor = pile.activeColor
  next.drewThisTurn = false
  next.drawnCardIdThisTurn = null
  next.mustPlayFromHand = false
  next.speedPlayColor = null
  next.unoDeclaredPlayerId = null

  if (current.hand.length === 1) {
    current.unoSafe = declaredUno
    if (!declaredUno) next.catchableUnoPlayerId = current.id
  } else {
    current.unoSafe = false
  }

  next = addLog(next, `${current.name} played ${removed.label} to Triple Play pile ${pileIndex + 1}${choice.color ? ` and chose ${choice.color}` : ''}.`)
  next = applyTriplePlayCardEffect(next, removed, current.id, pileIndex, choice)

  const updatedCurrent = next.players.find((entry) => entry.id === current.id)
  if (!next.winnerId && updatedCurrent?.hand.length === 0 && !next.pendingDraw && !next.pendingDare) {
    next = finishRound(next, current.id)
    return { state: next, sound: 'win' }
  }

  const actionResult = applyTriplePlayActionCard(next, removed, current.id, previousPileColor, pileIndex)
  if (actionResult) return actionResult

  next = advanceTurn(next)
  next = relightTriplePlayPiles(next, pileIndex)
  return { state: next, sound: removed.color === 'wild' ? 'wild' : 'play' }
}

function playTippoCard(state: GameState, cardId: string, choice: PlayChoice = {}): PlayResult {
  if (state.winnerId || state.pendingDraw) return { state, sound: 'error' }
  const player = activePlayer(state)
  const cardIndex = player.hand.findIndex((card) => card.id === cardId)
  if (cardIndex < 0) return { state, sound: 'error' }
  const card = player.hand[cardIndex]
  if (!isPlayable(card, state)) {
    return { state: addLog(state, `${player.name} cannot play ${card.label} on either Tippo tray.`), sound: 'error' }
  }

  const choiceRequest = getChoiceRequest(state, card, choice)
  if (choiceRequest) return { state, needsChoice: choiceRequest, sound: 'action' }

  const trayIndex = choice.discardPileIndex ?? tippoBestTrayIndex(state, card)
  if (trayIndex < 0 || !tippoLegalTrayIndexes(state, card).includes(trayIndex)) {
    return { state: addLog(state, `${player.name} must choose a Tippo tray for ${card.label}.`), sound: 'error' }
  }

  const declaredUno = state.unoDeclaredPlayerId === player.id && player.hand.length === 2
  let next = cloneState(closeCatchWindow(state))
  const current = activePlayer(next)
  const removed = current.hand.splice(cardIndex, 1)[0]
  const tray = next.tippoTrays?.[trayIndex]
  if (!tray) return { state, sound: 'error' }
  const previousTrayColor = tray.activeColor

  tray.cards.push(removed)
  tray.activeColor = removed.color === 'wild' ? choice.color ?? tray.activeColor ?? randomColorForSide(next.flipSide) : removed.color
  next.discardPile.push(removed)
  next.activeColor = tray.activeColor
  next.drewThisTurn = false
  next.drawnCardIdThisTurn = null
  next.mustPlayFromHand = false
  next.speedPlayColor = null
  next.unoDeclaredPlayerId = null

  if (current.hand.length === 1) {
    current.unoSafe = declaredUno
    if (!declaredUno) next.catchableUnoPlayerId = current.id
  } else {
    current.unoSafe = false
  }

  next = addLog(next, `${current.name} played ${removed.label} to Tippo tray ${trayIndex + 1}${choice.color ? ` and chose ${choice.color}` : ''}.`)
  const effect = applyCardEffect(next, removed, current.id, previousTrayColor, choice)
  next = effect.state
  let sound = effect.sound ?? (removed.color === 'wild' ? 'wild' : 'play')
  next = applyTippoUnit(next, removed, current.id, trayIndex)
  if (next.tippoEvent?.tipped) sound = 'action'

  const updatedCurrent = next.players.find((entry) => entry.id === current.id)
  if (!next.winnerId && updatedCurrent?.hand.length === 0 && !next.pendingDraw && !next.pendingDare) {
    next = finishRound(next, current.id)
    return { state: next, sound: 'win' }
  }

  return { state: next, sound }
}

function playDiceCard(state: GameState, cardId: string, choice: PlayChoice = {}): PlayResult {
  if (state.winnerId) return { state, sound: 'error' }
  const player = activePlayer(state)
  const cardIndex = player.hand.findIndex((card) => card.id === cardId)
  if (cardIndex < 0) return { state, sound: 'error' }
  const card = player.hand[cardIndex]
  if (!diceCanPlayOnLine(card, state)) {
    return { state: addLog(state, `${player.name} cannot play ${card.label} on the UNO Dice line.`), sound: 'error' }
  }

  const choiceRequest = getChoiceRequest(state, card, choice)
  if (choiceRequest) return { state, needsChoice: choiceRequest, sound: 'action' }

  const declaredUno = state.unoDeclaredPlayerId === player.id && player.hand.length === 2
  let next = cloneState(closeCatchWindow(state))
  const current = activePlayer(next)
  const removed = current.hand.splice(cardIndex, 1)[0]
  next.discardPile.push(removed)
  next.activeColor = removed.color === 'wild' ? choice.color ?? randomColorForSide(next.flipSide) : removed.color
  next.drewThisTurn = false
  next.drawnCardIdThisTurn = null
  next.mustPlayFromHand = false
  next.speedPlayColor = null
  next.unoDeclaredPlayerId = null

  if (current.hand.length === 1) {
    current.unoSafe = declaredUno
    if (!declaredUno) next.catchableUnoPlayerId = current.id
  } else {
    current.unoSafe = false
  }

  next = addLog(next, `${current.name} played ${removed.label}${choice.color ? ` and chose ${choice.color}` : ''}.`)
  if (removed.kind === 'draw1' || removed.kind === 'draw2') {
    const targetIndex = nextIndex(next)
    const amount = removed.kind === 'draw1' ? 1 : 2
    const targetName = next.players[targetIndex].name
    const result = diceTakeFromLine(next, targetIndex, amount)
    next = result.state
    next = addLog(next, `${targetName} took ${result.taken} ${result.taken === 1 ? 'die' : 'dice'} from the center line, rerolled all dice, and lost the turn.`)
    const updatedCurrent = next.players.find((entry) => entry.id === current.id)
    if (updatedCurrent?.hand.length === 0) {
      next = finishRound(next, current.id)
      return { state: next, sound: 'win' }
    }
    return { state: advanceTurn(next, 2), sound: 'action' }
  }

  if (current.hand.length === 0) {
    next = finishRound(next, current.id)
    return { state: next, sound: 'win' }
  }
  return { state: advanceTurn(next), sound: removed.color === 'wild' ? 'wild' : 'play' }
}

function diceTakeFromLine(state: GameState, playerIndex: number, amount: number): { state: GameState; taken: number } {
  const next = state
  const target = next.players[playerIndex]
  const takeable = Math.min(amount, Math.max(0, next.discardPile.length - 1))
  if (takeable > 0) {
    next.discardPile.splice(0, takeable)
    target.hand = rollDiceFaces(target.hand.length + takeable)
  } else {
    target.hand = rollDiceFaces(target.hand.length)
  }
  const top = topCard(next)
  next.activeColor = top.color === 'wild' ? next.activeColor : top.color
  return { state: next, taken: takeable }
}

function applyTriplePlayActionCard(state: GameState, card: Card, sourcePlayerId: string, previousColor: UnoColor | null, pileIndex: number): PlayResult | null {
  let next = state
  if (card.kind === 'skip') {
    next = addLog(next, `${next.players[nextIndex(next)].name} was skipped.`)
    next = advanceTurn(next, 2)
    return { state: relightTriplePlayPiles(next, pileIndex), sound: 'skip' }
  }
  if (card.kind === 'reverse') {
    next = reverseDirection(next)
    next = advanceTurn(next, next.players.length === 2 ? 2 : 1)
    return { state: relightTriplePlayPiles(next, pileIndex), sound: 'reverse' }
  }
  if (card.kind === 'draw2' || card.kind === 'wildDraw4') {
    next = queueOrApplyDraw(next, drawValue(card), sourcePlayerId, previousColor, card.kind === 'wildDraw4')
    return { state: relightTriplePlayPiles(next, pileIndex), sound: 'action' }
  }
  return null
}

function applyTriplePlayCardEffect(state: GameState, card: Card, sourcePlayerId: string, pileIndex: number, choice: PlayChoice): GameState {
  let next = state
  const pile = next.triplePlayPiles?.[pileIndex]
  if (!pile) return next

  if (card.kind === 'wildClear') {
    pile.overload = 0
    return addLog(next, `Wild Clear reset Triple Play pile ${pileIndex + 1}.`)
  }

  if (card.kind === 'wildGiveAway') {
    const targetId = choice.targetPlayerId
    const source = next.players.find((player) => player.id === sourcePlayerId)
    const target = next.players.find((player) => player.id === targetId)
    if (source && target) {
      const giveaway = source.hand.splice(0, Math.min(2, source.hand.length))
      target.hand.push(...giveaway)
      next = addLog(next, `${source.name} gave ${giveaway.length} card${giveaway.length === 1 ? '' : 's'} to ${target.name}.`)
    }
  }

  if (card.kind === 'triplePlayDiscardTwo') {
    next = discardTriplePlaySameColor(next, sourcePlayerId, card.color)
  }

  pile.overload += 1
  if (pile.overload >= pile.limit) {
    const amount = pile.limit
    const sourceIndex = playerIndexById(next, sourcePlayerId)
    next = drawCards(next, sourceIndex, amount)
    const resetPile = next.triplePlayPiles?.[pileIndex]
    if (resetPile) resetPile.overload = 0
    next = addLog(next, `Triple Play pile ${pileIndex + 1} overloaded; ${next.players[sourceIndex]?.name ?? 'the player'} drew ${amount}.`)
  }
  return next
}

function discardTriplePlaySameColor(state: GameState, playerId: string, color: UnoColor | 'wild'): GameState {
  if (color === 'wild') return state
  const next = state
  const player = next.players.find((entry) => entry.id === playerId)
  if (!player) return next
  const indexes = player.hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.color === color)
    .slice(0, 2)
    .map(({ index }) => index)
    .sort((a, b) => b - a)
  const discarded: Card[] = []
  for (const index of indexes) {
    discarded.unshift(player.hand.splice(index, 1)[0])
  }
  if (discarded.length === 0) return addLog(next, `${player.name} had no extra ${colorLabel(color)} cards for Discard Two.`)
  next.discardPile.push(...discarded)
  return addLog(next, `${player.name} discarded ${discarded.length} extra ${colorLabel(color)} card${discarded.length === 1 ? '' : 's'}.`)
}

function triplePlayBestPileIndex(state: GameState, card: Card): number {
  const indexes = triplePlayLegalPileIndexes(state, card)
  if (indexes.length === 0) return -1
  return indexes.sort((a, b) => (state.triplePlayPiles?.[a]?.overload ?? 0) - (state.triplePlayPiles?.[b]?.overload ?? 0))[0]
}

function tippoBestTrayIndex(state: GameState, card: Card): number {
  const indexes = tippoLegalTrayIndexes(state, card)
  if (indexes.length === 0) return -1
  return indexes.sort((a, b) => (state.tippoTrays?.[a]?.load ?? 0) - (state.tippoTrays?.[b]?.load ?? 0))[0]
}

function applyTippoUnit(state: GameState, card: Card, sourcePlayerId: string, trayIndex: number): GameState {
  const tray = state.tippoTrays?.[trayIndex]
  const sourceIndex = playerIndexById(state, sourcePlayerId)
  const source = state.players[sourceIndex]
  if (!tray || !source) return state

  let next = cloneState(state)
  const nextTray = next.tippoTrays?.[trayIndex]
  const nextSource = next.players[sourceIndex]
  if (!nextTray || !nextSource) return state

  const previousLoad = nextTray.load
  const playedCardLoad = 1
  const forced = card.kind === 'tippo'
  const loadAfter = previousLoad + playedCardLoad
  const tipped = forced || loadAfter >= nextTray.limit
  let cardsTaken = 0

  if (tipped) {
    const trayCards = nextTray.cards
    const tippedIds = new Set(trayCards.map((entry) => entry.id))
    nextSource.hand.push(...trayCards)
    cardsTaken = trayCards.length
    next.discardPile = next.discardPile.filter((entry) => !tippedIds.has(entry.id))
    const reseed = drawTippoOpeningCard(next)
    nextTray.cards = reseed ? [reseed] : []
    nextTray.activeColor = reseed ? (reseed.color === 'wild' ? randomColorForSide(next.flipSide) : reseed.color) : null
    nextTray.load = 0
    if (reseed) next.discardPile.push(reseed)
    next = addLog(next, `Tippo tray ${trayIndex + 1} tipped; ${nextSource.name} took ${cardsTaken} card${cardsTaken === 1 ? '' : 's'}.`)
  } else {
    nextTray.load = loadAfter
  }

  return {
    ...next,
    tippoEvent: {
      playerId: nextSource.id,
      playerName: nextSource.name,
      trayIndex,
      previousLoad,
      playedCardLoad,
      loadAfter: tipped ? 0 : loadAfter,
      cardsTaken,
      tipped,
      forced,
      sequence: next.nextLogId,
    },
  }
}

function drawTippoOpeningCard(state: GameState): Card | null {
  if (state.drawPile.length === 0) {
    const refilled = refillDrawPileFromDiscard(state)
    state.drawPile = refilled.drawPile
    state.discardPile = refilled.discardPile
  }
  return state.drawPile.length > 0 ? drawOpeningCard(state.drawPile) : null
}

function relightTriplePlayPiles(state: GameState, seedIndex: number): GameState {
  if (state.config.game !== 'triplePlay' || !state.triplePlayPiles) return state
  const next = cloneState(state)
  const litCount = 1 + (next.nextLogId + seedIndex) % 3
  const piles = next.triplePlayPiles ?? []
  piles.forEach((pile, index) => {
    pile.active = index < litCount
  })
  return addLog(next, `The Triple Play unit lit ${litCount} pile${litCount === 1 ? '' : 's'}.`)
}

export function phase10TakeDiscard(state: GameState): GameState {
  if (state.config.game !== 'phase10' || state.winnerId || state.drewThisTurn || state.discardPile.length === 0) return state
  const next = cloneState(clearTurnFlags(state))
  const card = next.discardPile.pop()
  if (!card) return state
  activePlayer(next).hand.push(card)
  next.drewThisTurn = true
  next.drawnCardIdThisTurn = card.id
  return addLog(next, `${activePlayer(next).name} took ${card.label} from the discard pile.`)
}

export function phase10CompletePhase(state: GameState): GameState {
  if (state.config.game !== 'phase10' || state.winnerId || !state.drewThisTurn) return state
  const player = activePlayer(state)
  if (player.phase10Completed) return state
  const melds = phase10FindPhaseMelds(player.hand, player.phase10Phase ?? 1)
  if (!melds) return addLog(state, `${player.name} cannot complete phase ${player.phase10Phase ?? 1} yet.`)

  const next = cloneState(state)
  const nextPlayer = activePlayer(next)
  const indexes = melds.flatMap((meld) => meld.indexes)
  for (const index of [...indexes].sort((a, b) => b - a)) {
    nextPlayer.hand.splice(index, 1)
  }
  nextPlayer.phase10Completed = true
  nextPlayer.phase10Melds = melds.map(({ indexes: meldIndexes, ...meld }) => ({
    ...meld,
    cards: meldIndexes.map((index) => ({ ...player.hand[index] })),
  }))
  return addLog(next, `${nextPlayer.name} completed phase ${nextPlayer.phase10Phase ?? 1}.`)
}

export function phase10HitCard(state: GameState, cardId: string): GameState {
  if (state.config.game !== 'phase10' || state.winnerId || !state.drewThisTurn) return state
  const player = activePlayer(state)
  if (!player.phase10Completed) return state
  const card = player.hand.find((entry) => entry.id === cardId)
  if (!card) return state
  const target = findPhase10HitTarget(state, card)
  if (!target) return addLog(state, `${player.name} cannot hit ${card.label} on any completed phase.`)

  let next = cloneState(state)
  const nextPlayer = activePlayer(next)
  const cardIndex = nextPlayer.hand.findIndex((entry) => entry.id === cardId)
  if (cardIndex < 0) return state
  const [hit] = nextPlayer.hand.splice(cardIndex, 1)
  const meld = next.players[target.playerIndex].phase10Melds?.[target.meldIndex]
  if (!meld) return state
  meld.cards.push(hit)
  if (meld.kind === 'run' && typeof hit.value === 'number') {
    if (typeof meld.runStart === 'number') meld.runStart = Math.min(meld.runStart, hit.value)
    if (typeof meld.runEnd === 'number') meld.runEnd = Math.max(meld.runEnd, hit.value)
  }
  next = addLog(next, `${nextPlayer.name} hit ${hit.label} onto a completed phase.`)
  if (nextPlayer.hand.length === 0) return finishPhase10Round(next, nextPlayer.id)
  return next
}

export function phase10HitCards(state: GameState, playerId: string): Card[] {
  if (state.config.game !== 'phase10' || state.winnerId || !state.drewThisTurn) return []
  const player = state.players.find((entry) => entry.id === playerId)
  if (!player?.phase10Completed) return []
  return player.hand.filter((card) => Boolean(findPhase10HitTarget(state, card)))
}

export function skipBoDrawToFive(state: GameState): GameState {
  if (state.config.game !== 'skipBo' || state.winnerId || state.drewThisTurn) return state
  let next = cloneState(clearTurnFlags(state))
  let drawn = 0
  while (activePlayer(next).hand.length < 5) {
    next = refillSkipBoDrawPile(next)
    const card = next.drawPile.pop()
    if (!card) break
    activePlayer(next).hand.push(card)
    drawn += 1
  }
  const player = activePlayer(next)
  next.drewThisTurn = true
  return addLog(next, `${player.name} drew ${drawn} Skip-Bo card${drawn === 1 ? '' : 's'} to start the turn.`)
}

export function skipBoPlayCard(state: GameState, sourceId: string): GameState {
  if (state.config.game !== 'skipBo' || state.winnerId || !state.drewThisTurn) return state
  const source = findSkipBoSource(state, sourceId)
  if (!source) return addLog(state, `${activePlayer(state).name} cannot play that Skip-Bo card.`)
  const buildIndex = findSkipBoBuildPile(state, source.card)
  if (buildIndex < 0) return addLog(state, `${activePlayer(state).name} cannot build with ${source.card.label}.`)

  let next = cloneState(state)
  const nextSource = findSkipBoSource(next, sourceId)
  if (!nextSource) return state
  const [removed] = nextSource.pile.splice(nextSource.index, 1)
  const needed = skipBoNextBuildValue(next.skipBoBuildPiles?.[buildIndex] ?? [])
  const played = removed.kind === 'wild' ? { ...removed, value: needed } : removed
  next.skipBoBuildPiles = next.skipBoBuildPiles ?? [[], [], [], []]
  const buildPiles = next.skipBoBuildPiles
  buildPiles[buildIndex].push(played)
  const player = activePlayer(next)
  next = addLog(next, `${player.name} built ${played.label}${played.kind === 'wild' ? ` as ${needed}` : ''}.`)
  if (buildPiles[buildIndex].length >= 12) {
    next.discardPile.push(...buildPiles[buildIndex])
    buildPiles[buildIndex] = []
    next = addLog(next, `A Skip-Bo building pile reached 12 and was cleared.`)
  }
  if ((player.skipBoStockPile?.length ?? 0) === 0) return finishSkipBoRound(next, player.id)
  if (player.hand.length === 0) {
    next = addLog(next, `${player.name} emptied their hand and draws five more Skip-Bo cards.`)
    return skipBoDrawToFive({ ...next, drewThisTurn: false, drawnCardIdThisTurn: null })
  }
  return next
}

export function skipBoCanPlaySource(state: GameState, sourceId: string): boolean {
  if (state.config.game !== 'skipBo' || state.winnerId || !state.drewThisTurn) return false
  const source = findSkipBoSource(state, sourceId)
  return Boolean(source && findSkipBoBuildPile(state, source.card) >= 0)
}

export function skipBoDiscardToPile(state: GameState, cardId: string, pileIndex: number): GameState {
  if (state.config.game !== 'skipBo' || state.winnerId || !state.drewThisTurn) return state
  if (pileIndex < 0 || pileIndex > 3) return state
  let next = cloneState(state)
  const player = activePlayer(next)
  const cardIndex = player.hand.findIndex((card) => card.id === cardId)
  if (cardIndex < 0) return addLog(state, `${player.name} must discard from hand to end the Skip-Bo turn.`)
  const [card] = player.hand.splice(cardIndex, 1)
  player.skipBoDiscardPiles = player.skipBoDiscardPiles ?? [[], [], [], []]
  player.skipBoDiscardPiles[pileIndex].push(card)
  next = addLog(next, `${player.name} discarded ${card.label} to pile ${pileIndex + 1}.`)
  return advanceTurn({ ...next, drewThisTurn: false, drawnCardIdThisTurn: null })
}

function findSkipBoSource(state: GameState, sourceId: string): { card: Card; pile: Card[]; index: number } | null {
  const player = activePlayer(state)
  if (sourceId === `skipbo:stock:${player.id}`) {
    const pile = player.skipBoStockPile ?? []
    const index = pile.length - 1
    return index >= 0 ? { card: pile[index], pile, index } : null
  }
  if (sourceId.startsWith(`skipbo:discard:${player.id}:`)) {
    const pileIndex = Number(sourceId.split(':')[3])
    const pile = player.skipBoDiscardPiles?.[pileIndex] ?? []
    const index = pile.length - 1
    return index >= 0 ? { card: pile[index], pile, index } : null
  }
  const index = player.hand.findIndex((card) => card.id === sourceId)
  return index >= 0 ? { card: player.hand[index], pile: player.hand, index } : null
}

function findSkipBoBuildPile(state: GameState, card: Card): number {
  const piles = state.skipBoBuildPiles ?? [[], [], [], []]
  return piles.findIndex((pile) => skipBoCanBuildOnPile(card, pile))
}

function skipBoCanBuildOnPile(card: Card, pile: Card[]): boolean {
  const needed = skipBoNextBuildValue(pile)
  if (needed > 12) return false
  return card.kind === 'wild' || card.value === needed
}

function skipBoNextBuildValue(pile: Card[]): number {
  return pile.length + 1
}

function refillSkipBoDrawPile(state: GameState): GameState {
  if (state.drawPile.length > 0 || state.discardPile.length === 0) return state
  const next = cloneState(state)
  next.drawPile = shuffle(next.discardPile)
  next.discardPile = []
  return next
}

function finishSkipBoRound(state: GameState, winnerId: string): GameState {
  const next = cloneState(state)
  next.winnerId = winnerId
  next.gameWinnerId = winnerId
  const winner = next.players.find((player) => player.id === winnerId)
  return addLog(next, `${winner?.name ?? 'A player'} emptied the stock pile and won Skip-Bo.`)
}

export function phase10Discard(state: GameState, cardId: string): GameState {
  if (state.config.game !== 'phase10' || state.winnerId || !state.drewThisTurn) return state
  let next = cloneState(state)
  const player = activePlayer(next)
  const cardIndex = player.hand.findIndex((card) => card.id === cardId)
  if (cardIndex < 0) return state
  const [discarded] = player.hand.splice(cardIndex, 1)
  next.discardPile.push(discarded)
  next.activeColor = discarded.color === 'wild' ? null : discarded.color
  next.drewThisTurn = false
  next.drawnCardIdThisTurn = null
  next = addLog(next, `${player.name} discarded ${discarded.label}.`)
  if (player.hand.length === 0 && player.phase10Completed) return finishPhase10Round(next, player.id)
  return advanceTurn(next, discarded.kind === 'skip' ? 2 : 1)
}

function phase10FindPhaseMelds(hand: Card[], phase: number): Phase10Candidate[] | null {
  const requirements = PHASE10_PHASES[Math.max(0, Math.min(PHASE10_PHASES.length - 1, phase - 1))]
  const search = (requirementIndex: number, used: Set<number>, chosen: Phase10Candidate[]): Phase10Candidate[] | null => {
    if (requirementIndex >= requirements.length) return chosen
    const candidates = findPhase10Candidates(hand, requirements[requirementIndex], used)
    for (const candidate of candidates) {
      const nextUsed = new Set(used)
      for (const index of candidate.indexes) nextUsed.add(index)
      const result = search(requirementIndex + 1, nextUsed, [...chosen, candidate])
      if (result) return result
    }
    return null
  }
  return search(0, new Set<number>(), nullSafeCandidates([]))
}

function nullSafeCandidates(candidates: Phase10Candidate[]): Phase10Candidate[] {
  return candidates
}

function findPhase10Candidates(hand: Card[], requirement: Phase10Requirement, used: Set<number>): Phase10Candidate[] {
  if (requirement.kind === 'set') return findPhase10SetCandidates(hand, requirement.size, used)
  if (requirement.kind === 'run') return findPhase10RunCandidates(hand, requirement.size, used)
  return findPhase10ColorCandidates(hand, requirement.size, used)
}

function findPhase10SetCandidates(hand: Card[], size: number, used: Set<number>): Phase10Candidate[] {
  const candidates: Phase10Candidate[] = []
  for (let value = 1; value <= 12; value += 1) {
    const numbers = hand
      .map((card, index) => ({ card, index }))
      .filter(({ card, index }) => !used.has(index) && card.kind === 'number' && card.value === value)
      .map(({ index }) => index)
    const numberChoices = numbers.length >= size ? combinations(numbers, size) : [numbers]
    for (const numberChoice of numberChoices) {
      for (const indexes of fillPhase10WithWildCandidates(hand, numberChoice, size, used)) {
        candidates.push({ kind: 'set', value, cards: indexes.map((index) => hand[index]), indexes })
      }
    }
  }
  return candidates.sort((a, b) => countWilds(a.cards) - countWilds(b.cards))
}

function findPhase10RunCandidates(hand: Card[], size: number, used: Set<number>): Phase10Candidate[] {
  const candidates: Phase10Candidate[] = []
  for (let start = 1; start <= 13 - size; start += 1) {
    const group: number[] = []
    const localUsed = new Set(used)
    let possible = true
    for (let value = start; value < start + size; value += 1) {
      const index = hand.findIndex((card, candidateIndex) => !localUsed.has(candidateIndex) && card.kind === 'number' && card.value === value)
      if (index >= 0) {
        group.push(index)
        localUsed.add(index)
        continue
      }
      const wildIndex = hand.findIndex((card, candidateIndex) => !localUsed.has(candidateIndex) && card.kind === 'wild')
      if (wildIndex < 0) {
        possible = false
        break
      }
      group.push(wildIndex)
      localUsed.add(wildIndex)
    }
    if (possible) candidates.push({ kind: 'run', runStart: start, runEnd: start + size - 1, cards: group.map((index) => hand[index]), indexes: group })
  }
  return candidates.sort((a, b) => countWilds(a.cards) - countWilds(b.cards))
}

function findPhase10ColorCandidates(hand: Card[], size: number, used: Set<number>): Phase10Candidate[] {
  const candidates: Phase10Candidate[] = []
  for (const color of COLORS) {
    const colored = hand
      .map((card, index) => ({ card, index }))
      .filter(({ card, index }) => !used.has(index) && card.kind === 'number' && card.color === color)
      .map(({ index }) => index)
    for (const indexes of fillPhase10WithWildCandidates(hand, colored, size, used)) {
      candidates.push({ kind: 'color', color, cards: indexes.map((index) => hand[index]), indexes })
    }
  }
  return candidates.sort((a, b) => countWilds(a.cards) - countWilds(b.cards))
}

function fillPhase10WithWildCandidates(hand: Card[], indexes: number[], size: number, used: Set<number>): number[][] {
  if (indexes.length + hand.filter((card, index) => !used.has(index) && !indexes.includes(index) && card.kind === 'wild').length < size) return []
  const group = indexes.slice(0, size)
  for (let index = 0; group.length < size && index < hand.length; index += 1) {
    if (!used.has(index) && !group.includes(index) && hand[index].kind === 'wild') group.push(index)
  }
  return group.length === size ? [group] : []
}

function countWilds(cards: Card[]): number {
  return cards.filter((card) => card.kind === 'wild').length
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [[]]
  if (items.length < size) return []
  const result: T[][] = []
  const visit = (start: number, group: T[]) => {
    if (group.length === size) {
      result.push([...group])
      return
    }
    for (let index = start; index < items.length; index += 1) {
      group.push(items[index])
      visit(index + 1, group)
      group.pop()
    }
  }
  visit(0, [])
  return result
}

function findPhase10HitTarget(state: GameState, card: Card): { playerIndex: number; meldIndex: number } | null {
  for (let playerIndex = 0; playerIndex < state.players.length; playerIndex += 1) {
    const melds = state.players[playerIndex].phase10Melds ?? []
    for (let meldIndex = 0; meldIndex < melds.length; meldIndex += 1) {
      if (phase10CanHitMeld(card, melds[meldIndex])) return { playerIndex, meldIndex }
    }
  }
  return null
}

function phase10CanHitMeld(card: Card, meld: Phase10Meld): boolean {
  if (card.kind === 'wild') return true
  if (card.kind !== 'number') return false
  if (meld.kind === 'set') return card.value === meld.value
  if (meld.kind === 'color') return card.color === meld.color
  if (meld.kind === 'run') {
    if (typeof card.value !== 'number') return false
    return card.value === (meld.runStart ?? 0) - 1 || card.value === (meld.runEnd ?? 0) + 1
  }
  return false
}

function playDosMatch(state: GameState, cardId: string, choice: PlayChoice): PlayResult {
  if (state.winnerId || state.pendingDraw || state.pendingDare) return { state, sound: 'error' }
  const match = findDosMatch(state, cardId, choice.secondCardId)
  if (!match) {
    return { state: addLog(state, `${activePlayer(state).name} cannot make that DOS match.`), sound: 'error' }
  }

  let next = cloneState(closeCatchWindow(state))
  const player = activePlayer(next)
  const handIndexes = match.cards
    .map((card) => player.hand.findIndex((entry) => entry.id === card.id))
    .filter((index) => index >= 0)
    .sort((a, b) => b - a)
  const played: Card[] = []
  for (const handIndex of handIndexes) {
    played.unshift(player.hand.splice(handIndex, 1)[0])
  }
  const centerIndex = next.dosCenterRow?.findIndex((card) => card.id === match.target.id) ?? -1
  const [target] = centerIndex >= 0 ? next.dosCenterRow!.splice(centerIndex, 1) : []
  next.discardPile.push(...played)
  if (target) next.discardPile.push(target)
  next.drewThisTurn = false
  next.drawnCardIdThisTurn = null
  next.mustPlayFromHand = false
  next.unoDeclaredPlayerId = null
  next = addLog(next, `${player.name} matched ${played.map((card) => card.label).join(' + ')} to ${match.target.label}.`)

  next = applyDosColorBonus(next, played, match.target)
  next = refillDosCenterRow(next)
  const finalPlayer = activePlayer(next)
  if (finalPlayer.hand.length === 0) {
    return { state: finishRound(next, finalPlayer.id), sound: 'win' }
  }
  if (finalPlayer.hand.length === 2) {
    finalPlayer.unoSafe = false
    next.catchableUnoPlayerId = finalPlayer.id
    next.unoDeclaredPlayerId = null
  } else {
    finalPlayer.unoSafe = false
    next.catchableUnoPlayerId = null
    next.unoDeclaredPlayerId = null
  }
  return { state: advanceTurn(next), sound: 'play' }
}

function dosCardCanMatch(card: Card, hand: Card[], centerRow: Card[]): boolean {
  return centerRow.some((target) => dosCardsMatchTarget([card], target)) ||
    hand.some((other) => other.id !== card.id && centerRow.some((target) => dosCardsMatchTarget([card, other], target)))
}

function findDosMatch(state: GameState, cardId: string, secondCardId?: string): { target: Card; cards: Card[] } | null {
  const hand = activePlayer(state).hand
  const first = hand.find((card) => card.id === cardId)
  if (!first) return null
  const second = secondCardId ? hand.find((card) => card.id === secondCardId && card.id !== cardId) : undefined
  const centerRow = state.dosCenterRow ?? []
  const singleTarget = !second ? centerRow.find((entry) => dosCardsMatchTarget([first], entry)) : null
  if (singleTarget) return { target: singleTarget, cards: [first] }
  if (second) {
    const target = centerRow.find((entry) => dosCardsMatchTarget([first, second], entry))
    return target ? { target, cards: [first, second] } : null
  }
  for (const partner of hand) {
    if (partner.id === first.id) continue
    const target = centerRow.find((entry) => dosCardsMatchTarget([first, partner], entry))
    if (target) return { target, cards: [first, partner] }
  }
  return null
}

function dosCardsMatchTarget(cards: Card[], target: Card): boolean {
  if (cards.length < 1 || cards.length > 2) return false
  const targetValues = dosCardValues(target)
  if (targetValues.length === 0) return false
  const cardValueOptions = cards.map(dosCardValues)
  if (cardValueOptions.some((values) => values.length === 0)) return false
  for (const first of cardValueOptions[0]) {
    if (cards.length === 1 && targetValues.includes(first)) return true
    for (const second of cardValueOptions[1] ?? []) {
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

function applyDosColorBonus(state: GameState, played: Card[], target: Card): GameState {
  const exactColorMatch = target.color !== 'wild' && played.every((card) => card.color === target.color)
  if (!exactColorMatch) return state
  let next = state
  if (played.length === 2) {
    for (let index = 0; index < next.players.length; index += 1) {
      if (index !== next.activePlayerIndex) next = drawCards(next, index, 1)
    }
    next = addLog(next, `Double color match: every other player drew 1.`)
  } else {
    next = addLog(next, `Color match: ${activePlayer(next).name} added one card to the center row.`)
  }
  return dosPlaceBonusCard(next)
}

function dosPlaceBonusCard(state: GameState): GameState {
  const player = activePlayer(state)
  if (player.hand.length === 0) return state
  const bonusIndex = player.hand
    .map((card, index) => ({ card, index }))
    .sort((a, b) => (a.card.points - b.card.points) || a.index - b.index)[0].index
  const next = cloneState(state)
  const nextPlayer = activePlayer(next)
  const [bonus] = nextPlayer.hand.splice(bonusIndex, 1)
  next.dosCenterRow = [...(next.dosCenterRow ?? []), bonus]
  return addLog(next, `${nextPlayer.name} placed ${bonus.label} into the DOS center row.`)
}

function refillDosCenterRow(state: GameState): GameState {
  if (state.config.game !== 'dos') return state
  let next = cloneState(state)
  const centerRow = [...(next.dosCenterRow ?? [])]
  while (centerRow.length < 2) {
    if (next.drawPile.length === 0) next = refillDrawPileFromDiscard(next)
    const card = drawDosCenterCard(next.drawPile)
    if (!card) break
    centerRow.push(card)
  }
  return { ...next, dosCenterRow: centerRow }
}

function getChoiceRequest(state: GameState, card: Card, choice: PlayChoice): ChoiceRequest | null {
  if (state.config.game === 'liars' && card.liar && !choice.liarClaim) {
    return { type: 'liarClaim', cardId: card.id, message: `Announce a plausible claim for ${card.label}.` }
  }
  if (state.config.game === 'liars' && card.liar && choice.liarClaim?.kind === 'number' && choice.liarClaim.value === 7 && !choice.targetPlayerId) {
    return { type: 'target', cardId: card.id, message: 'Choose a player for the claimed 7 hand swap.' }
  }
  if (state.config.game === 'flex' && isFlexAction(card) && canUseFlexPower(state, activePlayer(state).id) && typeof choice.useFlex !== 'boolean') {
    return { type: 'flexMode', cardId: card.id, message: `Use Flex power for ${card.label}?` }
  }
  if (state.config.game === 'guoNeighborMatch' && card.color === 'wild' && (!choice.color || typeof choice.neighborAnchor !== 'number')) {
    return { type: 'neighborWild', cardId: card.id, message: `Choose the next color and neighbor anchor for ${card.label}.` }
  }
  if (state.config.game === 'guoHiLo' && card.color === 'wild' && (!choice.color || typeof choice.hiLoAnchor !== 'number')) {
    return { type: 'hiLoWild', cardId: card.id, message: `Choose the next color and active number for ${card.label}.` }
  }
  if (state.config.game === 'barbie' && card.kind === 'wildPlayedTooMuch' && (!choice.color || !choice.barbieDiscardColor)) {
    return { type: 'barbieColors', cardId: card.id, message: `Choose the active color and discard color for ${card.label}.` }
  }
  if (card.color === 'wild' && state.config.game !== 'allWild' && !choice.color && card.kind !== 'wildNoU') {
    return { type: 'color', cardId: card.id, message: `Choose the next color for ${card.label}.` }
  }
  if (state.config.game === 'marioKart' && card.kind === 'wildItemBox' && availableTargetCount(state) > 1 && !choice.targetPlayerId) {
    return { type: 'target', cardId: card.id, message: 'Choose a Green Shell target if the Item Box reveals one.' }
  }
  if (state.config.game === 'triplePlay' && card.kind === 'wildGiveAway' && !choice.targetPlayerId) {
    return { type: 'target', cardId: card.id, message: 'Choose a player to receive cards.' }
  }
  if (state.config.game === 'triplePlay' && typeof choice.discardPileIndex !== 'number') {
    const legalPiles = triplePlayLegalPileIndexes(state, card)
    if (legalPiles.length > 1) return { type: 'triplePlayPile', cardId: card.id, message: `Choose a Triple Play discard pile for ${card.label}.` }
  }
  if (state.config.game === 'tippo' && typeof choice.discardPileIndex !== 'number') {
    const legalTrays = tippoLegalTrayIndexes(state, card)
    if (legalTrays.length > 1) return { type: 'triplePlayPile', cardId: card.id, message: `Choose a Tippo tray for ${card.label}.` }
  }
  if ((card.kind === 'wildSortingHat' || card.kind === 'wildTheForce') && !choice.targetPlayerId) {
    return { type: 'target', cardId: card.id, message: card.kind === 'wildSortingHat' ? 'Choose a player for the Sorting Hat.' : 'Choose a player for The Force.' }
  }
  if (card.kind === 'wildFlexDraw2' && choice.useFlex && !choice.targetPlayerId) {
    return { type: 'target', cardId: card.id, message: 'Choose a player to draw 2.' }
  }
  if (card.kind === 'wildDrawnTogether' && (!choice.targetPlayerId || !choice.secondTargetPlayerId)) {
    return { type: 'twoTargets', cardId: card.id, message: 'Choose two players to link.' }
  }
  if ((card.kind === 'wildTargetDraw2' || card.kind === 'wildForcedSwap' || card.kind === 'wildHuntRing' || card.kind === 'wildWebSwing' || card.kind === 'wildBeamMeUp' || card.kind === 'wildTouchdown') && !choice.targetPlayerId) {
    return { type: 'target', cardId: card.id, message: card.kind === 'wildTargetDraw2' || card.kind === 'wildHuntRing' ? 'Choose a player to draw cards.' : card.kind === 'wildWebSwing' ? 'Choose a player for Web Swing.' : card.kind === 'wildBeamMeUp' ? 'Choose a player for Beam Me Up.' : card.kind === 'wildTouchdown' ? 'Choose a defender for Touchdown.' : 'Choose a player to swap hands with.' }
  }
  if ((state.config.game === 'houseRules' || state.config.game === 'noMercy') && card.kind === 'number' && card.value === 7 && !choice.targetPlayerId) {
    return { type: 'target', cardId: card.id, message: 'Choose a player to swap hands with.' }
  }
  const needsTarget =
    ['wildSwapHands', 'wildDraw2Swap', 'tradeHands'].includes(card.kind) ||
    (card.kind === 'wildExtremeHit' && state.config.game !== 'flipExtreme')
  if (needsTarget && !choice.targetPlayerId) {
    return { type: 'target', cardId: card.id, message: 'Choose a player to swap hands with.' }
  }
  if (card.kind === 'targetedSwap' && (!choice.targetPlayerId || !choice.secondTargetPlayerId)) {
    return { type: 'twoTargets', cardId: card.id, message: 'Choose two other players to swap hands.' }
  }
  return null
}

function isFlexAction(card: Card): boolean {
  return ['flexSkip', 'flexReverse', 'flexDraw2', 'wildFlexDraw2'].includes(card.kind)
}

function canUseFlexPower(state: GameState, playerId: string): boolean {
  return Boolean(state.players.find((player) => player.id === playerId)?.flexPowerActive)
}

function playLiarCardFaceDown(state: GameState, cardIndex: number, choice: PlayChoice): PlayResult {
  const declaredUno = state.unoDeclaredPlayerId === activePlayer(state).id && activePlayer(state).hand.length === 2
  let next = cloneState(closeCatchWindow(state))
  const current = activePlayer(next)
  const removed = current.hand.splice(cardIndex, 1)[0]
  removed.liarFaceDown = true
  removed.liarClaim = choice.liarClaim
  next.discardPile.push(removed)
  next.drewThisTurn = false
  next.drawnCardIdThisTurn = null
  next.mustPlayFromHand = false
  next.speedPlayColor = null
  next.unoDeclaredPlayerId = null
  if (current.hand.length === 1) {
    current.unoSafe = declaredUno
    if (!declaredUno) next.catchableUnoPlayerId = current.id
  } else {
    current.unoSafe = false
  }
  next.pendingLiarChallenge = {
    sourcePlayerId: current.id,
    cardId: removed.id,
    claim: choice.liarClaim!,
    targetPlayerId: choice.targetPlayerId,
    previousColor: state.activeColor,
    sequence: next.nextLogId,
  }
  next = setActivePlayer(next, nextIndex(next))
  next = addLog(next, `${current.name} placed a Liar card face down and claimed ${choice.liarClaim!.label}.`)
  return { state: next, sound: 'action' }
}

export function acceptLiarClaim(state: GameState): GameState {
  const pending = state.pendingLiarChallenge
  if (!pending || state.config.game !== 'liars') return state
  let next = cloneState(state)
  const source = next.players.find((player) => player.id === pending.sourcePlayerId)
  next.pendingLiarChallenge = null
  next = setActivePlayer(next, playerIndexById(next, pending.sourcePlayerId))
  next.activeColor = pending.claim.color === 'wild' ? next.activeColor ?? randomColorForSide(next.flipSide) : pending.claim.color
  next = addLog(next, `${source?.name ?? 'A player'}'s claim was accepted.`)
  next = applyLiarClaimEffect(next, pending)
  if (!next.winnerId && source && source.hand.length === 0 && !next.pendingDraw) {
    return finishRound(next, source.id)
  }
  return next
}

export function challengeLiarClaim(state: GameState, challengerId?: string): GameState {
  const pending = state.pendingLiarChallenge
  if (!pending || state.config.game !== 'liars') return state
  const challengerIndex = challengerId
    ? state.players.findIndex((player) => player.id === challengerId)
    : state.activePlayerIndex
  const sourceIndex = state.players.findIndex((player) => player.id === pending.sourcePlayerId)
  let next = cloneState(state)
  const source = next.players[sourceIndex]
  const challenger = next.players[challengerIndex] ?? next.players[nextIndex(next)]
  const cardIndex = next.discardPile.findIndex((card) => card.id === pending.cardId)
  const challengedCard = cardIndex >= 0 ? next.discardPile[cardIndex] : undefined
  next.pendingLiarChallenge = null
  if (!source || !challengedCard) return next

  challengedCard.liarFaceDown = false
  const lied = !liarClaimMatchesCard(challengedCard, pending.claim)
  if (lied) {
    next.discardPile.splice(cardIndex, 1)
    challengedCard.liarClaim = undefined
    source.hand.push(challengedCard)
    next = drawCards(next, sourceIndex, 1)
    next = addLog(next, `${challenger.name} challenged successfully. ${source.name} took the Liar card back and drew 1.`)
    return setActivePlayer(next, indexFrom(next, sourceIndex, 1))
  }

  next = drawCards(next, next.players.findIndex((player) => player.id === challenger.id), 1)
  next = addLog(next, `${challenger.name} challenged and was wrong. ${challenger.name} drew 1.`)
  next = setActivePlayer(next, sourceIndex)
  next.activeColor = pending.claim.color === 'wild' ? next.activeColor ?? randomColorForSide(next.flipSide) : pending.claim.color
  next = applyLiarClaimEffect(next, pending)
  if (!next.winnerId && source.hand.length === 0 && !next.pendingDraw) {
    return finishRound(next, source.id)
  }
  return next
}

function applyLiarClaimEffect(state: GameState, pending: NonNullable<GameState['pendingLiarChallenge']>): GameState {
  let next = state
  const claim = pending.claim
  switch (claim.kind) {
    case 'skip':
      next = addLog(next, `${next.players[nextIndex(next)].name} was skipped by the accepted claim.`)
      return advanceTurn(next, 2)
    case 'reverse':
      next = reverseDirection(next)
      return advanceTurn(next, next.players.length === 2 ? 2 : 1)
    case 'draw2':
      return queueOrApplyDraw(next, 2, pending.sourcePlayerId, pending.previousColor, false)
    case 'number':
      if (claim.value === 0) {
        next = passHands(next)
        return advanceTurn(next)
      }
      if (claim.value === 7 && pending.targetPlayerId) {
        next = swapHands(next, pending.sourcePlayerId, pending.targetPlayerId)
        return advanceTurn(next)
      }
      return advanceTurn(next)
    case 'wild':
      return advanceTurn(next)
    default:
      return advanceTurn(next)
  }
}

function applyWildLiarChallenge(state: GameState, sourcePlayerId: string, color: UnoColor): GameState {
  let next = cloneState(state)
  next.activeColor = color
  let truthful = 0
  let caught = 0
  for (let index = 0; index < next.players.length; index += 1) {
    const player = next.players[index]
    if (player.id === sourcePlayerId) continue
    const cardIndex = player.hand.findIndex((card) => card.color === color)
    if (cardIndex >= 0) {
      const [card] = player.hand.splice(cardIndex, 1)
      card.liarFaceDown = true
      card.liarClaim = claimFromCard(card) ?? { kind: 'wild', color: 'wild', label: 'Wild' }
      next.discardPile.push(card)
      truthful += 1
    } else {
      next = drawCards(next, index, 1)
      caught += 1
    }
  }
  next = finishRoundIfPlayerIsOut(next)
  return addLog(next, `Wild Liar's Challenge checked ${colorLabel(color)}: ${truthful} truthful, ${caught} caught.`)
}

function cardFromLiarClaim(claim: LiarClaim, base: Card): Card {
  return {
    ...base,
    kind: claim.kind,
    color: claim.color,
    value: claim.value,
    label: claim.label,
  }
}

function liarClaimMatchesCard(card: Card, claim: LiarClaim): boolean {
  if (claim.kind !== card.kind) return false
  if (claim.kind === 'number' && claim.value !== card.value) return false
  if (claim.kind === 'wild') return card.color === 'wild'
  return claim.color === card.color
}

export function liarClaimOptions(state: GameState, card: Card): LiarClaim[] {
  const top = effectiveTopCard(state)
  const claims: LiarClaim[] = []
  const pinned: LiarClaim[] = []
  const add = (claim: LiarClaim) => {
    const key = `${claim.kind}:${claim.color}:${claim.value ?? ''}`
    if (!claims.some((entry) => `${entry.kind}:${entry.color}:${entry.value ?? ''}` === key)) claims.push(claim)
  }
  const actual = claimFromCard(card)
  if (actual && liarClaimIsPlausible(state, actual)) pinned.push(actual)
  if (state.activeColor) {
    add(actionClaim('draw2', state.activeColor))
    add(actionClaim('skip', state.activeColor))
    add(actionClaim('reverse', state.activeColor))
    for (let value = 0; value <= 9; value += 1) add(numberClaim(state.activeColor, value))
  }
  if (top.kind === 'number' && typeof top.value === 'number') {
    for (const color of COLORS) add(numberClaim(color, top.value))
  } else if (['skip', 'reverse', 'draw2'].includes(top.kind)) {
    for (const color of COLORS) add(actionClaim(top.kind as 'skip' | 'reverse' | 'draw2', color))
  }
  add({ kind: 'wild', color: 'wild', label: 'Wild' })
  for (const claim of [...pinned].reverse()) {
    const key = `${claim.kind}:${claim.color}:${claim.value ?? ''}`
    const existing = claims.findIndex((entry) => `${entry.kind}:${entry.color}:${entry.value ?? ''}` === key)
    if (existing >= 0) claims.splice(existing, 1)
    claims.unshift(claim)
  }
  return claims
}

function liarClaimIsPlausible(state: GameState, claim: LiarClaim): boolean {
  if (claim.kind === 'wild') return true
  const top = effectiveTopCard(state)
  return claim.color === state.activeColor || (claim.kind === 'number' && top.kind === 'number' && claim.value === top.value) || (claim.kind !== 'number' && claim.kind === top.kind)
}

function claimFromCard(card: Card): LiarClaim | null {
  if (card.kind === 'number' && typeof card.value === 'number' && card.color !== 'wild') return numberClaim(card.color, card.value)
  if ((card.kind === 'skip' || card.kind === 'reverse' || card.kind === 'draw2') && card.color !== 'wild') return actionClaim(card.kind, card.color)
  if (card.kind === 'wild') return { kind: 'wild', color: 'wild', label: 'Wild' }
  return null
}

function numberClaim(color: UnoColor, value: number): LiarClaim {
  return { kind: 'number', color, value, label: `${colorLabel(color)} ${value}` }
}

function actionClaim(kind: 'skip' | 'reverse' | 'draw2', color: UnoColor): LiarClaim {
  const label = kind === 'skip' ? 'Skip' : kind === 'reverse' ? 'Reverse' : '+2'
  return { kind, color, label: `${colorLabel(color)} ${label}` }
}

function spendFlexPower(state: GameState, playerId: string): GameState {
  if (state.config.game !== 'flex') return state
  const next = cloneState(state)
  const player = next.players.find((entry) => entry.id === playerId)
  if (!player?.flexPowerActive) return state
  player.flexPowerActive = false
  return restoreFlexPowerIfAllSpent(addLog(next, `${player.name} used Flex power.`))
}

function flipFlexPower(state: GameState, playerId: string, active = true): GameState {
  if (state.config.game !== 'flex') return state
  const next = cloneState(state)
  const player = next.players.find((entry) => entry.id === playerId)
  if (!player) return state
  player.flexPowerActive = active
  return restoreFlexPowerIfAllSpent(addLog(next, `${player.name}'s Power Card is ${active ? 'green' : 'red'}.`))
}

function restoreFlexPowerIfAllSpent(state: GameState): GameState {
  if (state.config.game !== 'flex' || state.players.some((player) => player.flexPowerActive)) return state
  return addLog(
    {
      ...state,
      players: state.players.map((player) => ({ ...player, flexPowerActive: true })),
    },
    'All Power Cards were red, so everyone flipped back to green.',
  )
}

function applyCardEffect(
  state: GameState,
  card: Card,
  sourcePlayerId: string,
  previousColor: UnoColor | null,
  choice: PlayChoice,
): { state: GameState; sound?: SoundCue } {
  let next = state
  const draw = drawValue(card)

  if (state.pendingDraw) {
    const pendingDraw = state.pendingDraw
    if (card.kind === 'wildAvengersAssemble' || card.kind === 'wildSuperStar') {
      const sourceIndex = state.players.findIndex((player) => player.id === pendingDraw.sourcePlayerId)
      next = applyImmediateDraw(next, sourceIndex, pendingDraw.amount)
      next.pendingDraw = null
      next = addLog(
        next,
        card.kind === 'wildSuperStar'
          ? `${activePlayer(state).name} used Super Star and reflected ${pendingDraw.amount} cards.`
          : `${activePlayer(state).name} assembled the Avengers and reflected ${pendingDraw.amount} cards.`,
      )
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    }
    if (card.kind === 'wildNoU') {
      const targetIndex = state.players.findIndex((player) => player.id === pendingDraw.sourcePlayerId)
      next.pendingDraw = {
        ...pendingDraw,
        sourcePlayerId,
        canChallenge: false,
      }
      next.activePlayerIndex = targetIndex
      return { state: addLog(next, `${activePlayer(state).name} bounced the draw penalty back.`), sound: 'reverse' }
    }
    if (draw > 0) {
      const amount = state.config.game === 'party' ? Math.min(10, pendingDraw.amount + draw) : pendingDraw.amount + draw
      next.pendingDraw = {
        ...pendingDraw,
        amount,
        cardValue: draw,
        sourcePlayerId,
        canChallenge: card.kind === 'wildDraw4',
      }
      next = advanceTurn(next)
      return { state: addLog(next, `The draw stack is now ${amount}.`), sound: 'action' }
    }
  }

  if (choice.useFlex) {
    next = spendFlexPower(next, sourcePlayerId)
  }
  if (card.flexFlip) {
    next = flipFlexPower(next, sourcePlayerId, true)
  }

  if ((state.config.game === 'houseRules' || state.config.game === 'noMercy') && card.kind === 'number') {
    if (card.value === 0) {
      next = passHands(next)
      next = finishRoundIfPlayerIsOut(next)
      if (next.winnerId) return { state: next, sound: 'win' }
      next = advanceTurn(next)
      return { state: next, sound: 'action' }
    }
    if (card.value === 7 && choice.targetPlayerId) {
      next = swapHands(next, sourcePlayerId, choice.targetPlayerId)
      next = finishRoundIfPlayerIsOut(next)
      if (next.winnerId) return { state: next, sound: 'win' }
      next = advanceTurn(next)
      return { state: next, sound: 'action' }
    }
  }

  switch (card.kind) {
    case 'flexSkip':
      if (choice.useFlex) {
        next = addLog(next, 'Flex Skip skipped every other player.')
        return { state: clearTurnFlags(next), sound: 'skip' }
      }
      next = addLog(next, 'Flex Skip used its normal effect.')
      next = addLog(next, `${next.players[nextIndex(next)].name} was skipped.`)
      next = advanceTurn(next, 2)
      return { state: next, sound: 'skip' }
    case 'flexReverse':
      next = reverseDirection(next)
      if (choice.useFlex) {
        next = addLog(next, `${next.players[nextIndex(next)].name} was skipped by Flex Reverse.`)
        next = advanceTurn(next, 2)
        return { state: next, sound: 'reverse' }
      }
      next = addLog(next, 'Flex Reverse used its normal effect.')
      next = advanceTurn(next, next.players.length === 2 ? 2 : 1)
      return { state: next, sound: 'reverse' }
    case 'flexDraw2':
      if (choice.useFlex) {
        next = addLog(next, 'Flex +2 used its Flex power: every other player draws 1.')
        next = drawForAllExcept(next, sourcePlayerId, 1, 'Flex +2')
        next = advanceTurn(next)
        return { state: next, sound: 'action' }
      }
      next = addLog(next, 'Flex +2 used its normal effect: next player draws 2.')
      next = queueOrApplyDraw(next, 2, sourcePlayerId, previousColor, false)
      return { state: next, sound: 'action' }
    case 'wildFlexDraw2':
      if (choice.useFlex) {
        next = applyImmediateDraw(next, playerIndexById(next, choice.targetPlayerId!), 2)
        next = addLog(next, `${next.players[playerIndexById(next, choice.targetPlayerId!)]?.name ?? 'A player'} drew 2 from Wild Flex +2.`)
        next = advanceTurn(next)
        return { state: next, sound: 'wild' }
      }
      next = addLog(next, 'Wild Flex +2 used its normal Wild effect.')
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildAllFlip':
      next = {
        ...next,
        players: next.players.map((player) => ({ ...player, flexPowerActive: !player.flexPowerActive })),
      }
      next = restoreFlexPowerIfAllSpent(addLog(next, 'Wild All Flip flipped every Power Card.'))
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'pointTaken':
      next = applyPointTaken(next, sourcePlayerId)
      next = advanceTurn(next)
      return { state: next, sound: 'action' }
    case 'wildDrawnTogether':
      next = setPartyLink(next, choice.targetPlayerId!, choice.secondTargetPlayerId!)
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildPileUp':
      next = applyPartyPileUp(next, nextIndex(next), next.activeColor)
      next = advanceTurn(next, 2)
      return { state: next, sound: 'wild' }
    case 'dare':
    case 'wildDare':
      next = queueDare(next, sourcePlayerId)
      return { state: next, sound: card.kind === 'wildDare' ? 'wild' : 'action' }
    case 'wildSkipTwo':
      next = addLog(next, `${next.players[nextIndex(next)].name} and ${next.players[nextIndex(next, 2)].name} were skipped.`)
      next = advanceTurn(next, 3)
      return { state: next, sound: 'skip' }
    case 'skip':
    case 'wildSkip':
    case 'reverseSkip':
      if (next.config.game === 'flash') {
        const skippedIndex = selectFlashPlayerIndex(next, next.activePlayerIndex)
        next = addLog(next, `${next.players[skippedIndex].name} was selected by the Flash unit and skipped.`)
        next = setFlashEvent(next, 'skip', skippedIndex)
        next = setActivePlayer(next, selectFlashPlayerIndex(next, skippedIndex))
        return { state: next, sound: 'flash' }
      }
      if (card.kind === 'reverseSkip') next = reverseDirection(next)
      next = addLog(next, `${next.players[nextIndex(next)].name} was skipped.`)
      next = advanceTurn(next, 2)
      return { state: next, sound: 'skip' }
    case 'reverse':
    case 'wildReverse':
      if (next.config.game === 'flash') {
        next = addLog(next, 'The Flash unit selected the next player at random.')
        next = advanceTurn(next)
        next = setFlashEvent(next, 'selected', next.activePlayerIndex)
        return { state: next, sound: 'flash' }
      }
      next = reverseDirection(next)
      next = advanceTurn(next, next.players.length === 2 ? 2 : 1)
      return { state: next, sound: 'reverse' }
    case 'reverseDraw2':
      next = reverseDirection(next)
      next = queueOrApplyDraw(next, 2, sourcePlayerId, previousColor, false)
      return { state: next, sound: 'reverse' }
    case 'draw2':
    case 'draw4':
    case 'draw1':
    case 'draw5':
    case 'wildDraw4':
    case 'wildDraw6':
    case 'wildDraw10':
    case 'wildDraw2':
    case 'stack1':
    case 'stack2':
    case 'wildDraw3':
    case 'wildDrawMystery':
      next = queueOrApplyDraw(next, draw, sourcePlayerId, previousColor, card.kind === 'wildDraw4' && next.config.game !== 'allWild' && next.config.game !== 'noMercy')
      return { state: next, sound: 'action' }
    case 'wildReverseDraw4':
      next = reverseDirection(next)
      next = queueOrApplyDraw(next, draw, sourcePlayerId, previousColor, false)
      return { state: next, sound: 'reverse' }
    case 'wildTargetDraw2':
      next = applyImmediateDraw(next, playerIndexById(next, choice.targetPlayerId!), 2)
      next = addLog(next, `${next.players[playerIndexById(next, choice.targetPlayerId!)]?.name ?? 'A player'} drew 2 from Target +2.`)
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildForcedSwap':
      next = swapHands(next, sourcePlayerId, choice.targetPlayerId!)
      next = finishRoundIfPlayerIsOut(next)
      if (next.winnerId) return { state: next, sound: 'win' }
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildHuntRing': {
      const targetIndex = playerIndexById(next, choice.targetPlayerId!)
      next = drawCards(next, targetIndex, 3)
      next = addLog(next, `${next.players[targetIndex]?.name ?? 'The Ring-bearer'} drew 3 from Hunt for the Ring.`)
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    }
    case 'wildSortingHat': {
      const targetIndex = playerIndexById(next, choice.targetPlayerId!)
      next = drawUntilGryffindor(next, targetIndex)
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    }
    case 'wildTheForce': {
      const targetIndex = playerIndexById(next, choice.targetPlayerId!)
      if (next.players[targetIndex]?.hand.some((entry) => entry.color === next.activeColor)) {
        next = drawCards(next, targetIndex, 2)
        next = addLog(next, `${next.players[targetIndex].name} had ${colorLabel(next.activeColor)} and drew 2 from The Force.`)
      } else {
        next = addLog(next, `${next.players[targetIndex]?.name ?? 'A player'} resisted The Force.`)
      }
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    }
    case 'wildAvengersAssemble':
    case 'wildSuperStar':
      next = addLog(next, card.kind === 'wildSuperStar' ? 'Super Star acted as a wild card.' : 'Avengers Assemble acted as a wild card.')
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildVictoryLap':
      next = drawForAllExcept(next, sourcePlayerId, 1, 'Victory Lap')
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildPlayedTooMuch':
      next = applyPlayedTooMuch(next, choice.barbieDiscardColor ?? chooseBarbieDiscardColor(next, sourcePlayerId))
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildPowerOfGrayskull':
      if (choice.color && next.players[playerIndexById(next, sourcePlayerId)]?.hand.some((entry) => entry.color === choice.color)) {
        next = addLog(next, `${next.players[playerIndexById(next, sourcePlayerId)].name} held ${colorLabel(choice.color)} and keeps the Power of Grayskull.`)
        return { state: next, sound: 'wild' }
      }
      next = addLog(next, 'Power of Grayskull found no matching follow-up.')
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildTurtlePower':
      next = applyTurtlePower(next)
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildWebSwing':
      next = applyWebSwing(next, sourcePlayerId, choice.targetPlayerId ?? legalTargets(next)[0]?.id)
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildJusticeLeague':
      next = applyJusticeLeague(next, sourcePlayerId)
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildBeamMeUp':
      next = applyBeamMeUp(next, sourcePlayerId, choice.targetPlayerId ?? legalTargets(next)[0]?.id)
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildAvatarState':
      next = applyAvatarState(next, sourcePlayerId)
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildCreepyCool':
      next = applyCreepyCool(next, sourcePlayerId)
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildTouchdown': {
      const targetId = choice.targetPlayerId ?? legalTargets(next)[0]?.id
      const targetWasNext = Boolean(targetId && next.players[nextIndex(next)]?.id === targetId)
      next = applyTouchdown(next, sourcePlayerId, targetId)
      next = advanceTurn(next, next.touchdownEvent?.success && targetWasNext ? 2 : 1)
      return { state: next, sound: 'wild' }
    }
    case 'wildTrexAttack':
      if (!next.players[nextIndex(next)]?.hand.some((entry) => entry.color === next.activeColor)) {
        next = drawCards(next, nextIndex(next), 5)
        next = addLog(next, `${next.players[nextIndex(next)].name} was attacked by the T-Rex and drew 5.`)
      } else {
        next = addLog(next, `${next.players[nextIndex(next)].name} escaped the T-Rex with ${colorLabel(next.activeColor)}.`)
      }
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildCreeper':
      next = drawCards(next, nextIndex(next), 3)
      next = addLog(next, `${next.players[nextIndex(next)].name} was surprised by the Creeper and drew 3.`)
      next = advanceTurn(next, 2)
      return { state: next, sound: 'wild' }
    case 'wildEmoji':
      next = queueEmoji(next, sourcePlayerId, card.label)
      return { state: next, sound: 'wild' }
    case 'wildItemBox':
      return applyMarioKartItemBox(next, sourcePlayerId, choice)
    case 'wildJackpot':
      return applyWildJackpot(next, sourcePlayerId, choice.jackpotRule)
    case 'wildDrawColor':
      next = drawUntilColor(next, nextIndex(next), next.activeColor)
      next = advanceTurn(next, 2)
      return { state: next, sound: 'wild' }
    case 'wildColorRoulette':
      {
        const targetIndex = nextIndex(next)
        const targetId = next.players[targetIndex]?.id
        next = drawUntilColor(next, targetIndex, next.activeColor)
        next = applyNoMercyEliminations(next, sourcePlayerId, targetIndex)
        if (next.winnerId) return { state: next, sound: 'win' }
        if (targetId && next.players.some((player) => player.id === targetId)) {
          next = advanceTurn(next, 2)
        }
      }
      if (next.winnerId) return { state: next, sound: 'win' }
      return { state: next, sound: 'wild' }
    case 'wildDownpour1':
      next = drawForAllExcept(next, sourcePlayerId, 1, 'Downpour')
      next = applyH2OSplashTrigger(next, card, sourcePlayerId)
      if (next.winnerId) return { state: next, sound: 'win' }
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildDownpour2':
      next = drawForAllExcept(next, sourcePlayerId, 2, 'Downpour')
      next = applyH2OSplashTrigger(next, card, sourcePlayerId)
      if (next.winnerId) return { state: next, sound: 'win' }
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'flip':
      next = flipGameSide(next)
      next = advanceTurn(next)
      return { state: next, sound: 'flash' }
    case 'hit2':
      next = pressLauncher(next, nextIndex(next), 2)
      next = advanceTurn(next, 2)
      return { state: next, sound: 'launcher' }
    case 'discardAll':
      next = discardAllColor(next, sourcePlayerId, card.color)
      next = finishRoundIfPlayerIsOut(next)
      if (next.winnerId) return { state: next, sound: 'win' }
      next = advanceTurn(next)
      return { state: next, sound: 'action' }
    case 'wildExtremeHit':
      if (next.config.game === 'flipExtreme') {
        next = pressLauncher(next, nextIndex(next), 2)
        next = advanceTurn(next, 2)
      } else {
        next = pressLauncher(next, playerIndexById(next, choice.targetPlayerId!), 2)
        next = advanceTurn(next)
      }
      return { state: next, sound: 'launcher' }
    case 'wildHitFire':
      next = pressLauncherUntilFire(next, nextIndex(next))
      next = advanceTurn(next, 2)
      return { state: next, sound: 'launcher' }
    case 'wildAllHit':
      next = pressLauncherForAllExcept(next, sourcePlayerId)
      next = advanceTurn(next)
      return { state: next, sound: 'launcher' }
    case 'tradeHands':
      next = swapHands(next, sourcePlayerId, choice.targetPlayerId!)
      next = finishRoundIfPlayerIsOut(next)
      if (next.winnerId) return { state: next, sound: 'win' }
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'slap':
      next = applyFlashSlap(next, sourcePlayerId)
      next = advanceTurn(next)
      return { state: next, sound: 'flash' }
    case 'wildDraw1SpeedPlay':
      next = applyImmediateDraw(next, nextIndex(next), 1)
      if (hasBasePlayableCard(activePlayer(next), next)) {
        next.mustPlayFromHand = true
        return { state: addLog(next, 'Speed play requires an immediate follow-up card.'), sound: 'action' }
      }
      next = addLog(next, 'No follow-up card was available for Speed Play.')
      next = advanceTurn(next)
      return { state: next, sound: 'action' }
    case 'wildPowerReverse':
      next = reverseDirection(next)
      return { state: addLog(next, 'Power Reverse grants another turn.'), sound: 'reverse' }
    case 'wildSpeedPlay':
      if (hasSpeedPlayCard(activePlayer(next), next)) {
        next.speedPlayColor = next.activeColor
        next.mustPlayFromHand = true
        return { state: addLog(next, `Speed Play requires another ${colorLabel(next.activeColor)} card.`), sound: 'action' }
      }
      next = addLog(next, `No ${colorLabel(next.activeColor)} follow-up card was available for Speed Play.`)
      next = advanceTurn(next)
      return { state: next, sound: 'action' }
    case 'speedMatch':
      next = discardSpeedMatches(next, sourcePlayerId, card)
      next = finishRoundIfPlayerIsOut(next)
      if (next.winnerId) return { state: next, sound: 'win' }
      next = advanceTurn(next)
      return { state: next, sound: 'action' }
    case 'wildLightningRound':
      next = lightningRound(next)
      next = finishRoundIfPlayerIsOut(next)
      if (next.winnerId) return { state: next, sound: 'win' }
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'wildSwapHands':
      next = swapHands(next, sourcePlayerId, choice.targetPlayerId!)
      next = finishRoundIfPlayerIsOut(next)
      if (next.winnerId) return { state: next, sound: 'win' }
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'targetedSwap':
      next = swapHands(next, choice.targetPlayerId!, choice.secondTargetPlayerId!)
      next = finishRoundIfPlayerIsOut(next)
      if (next.winnerId) return { state: next, sound: 'win' }
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'passingSwap':
      next = passHands(next)
      next = finishRoundIfPlayerIsOut(next)
      if (next.winnerId) return { state: next, sound: 'win' }
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    case 'skipEveryone':
      next = addLog(next, 'Everyone else was skipped.')
      return { state: clearTurnFlags(next), sound: 'skip' }
    case 'wildDraw2Swap':
      next = applyImmediateDraw(next, nextIndex(next), 2)
      next = swapHands(next, sourcePlayerId, choice.targetPlayerId!)
      next = finishRoundIfPlayerIsOut(next)
      if (next.winnerId) return { state: next, sound: 'win' }
      next = advanceTurn(next)
      return { state: next, sound: 'wild' }
    default:
      next = applyH2OSplashTrigger(next, card, sourcePlayerId)
      if (next.winnerId) return { state: next, sound: 'win' }
      if (next.config.game === 'spin' && card.spin && next.players[playerIndexById(next, sourcePlayerId)]?.hand.length > 0) {
        next = applySpinWheel(next, nextIndex(next))
        next = finishRoundIfPlayerIsOut(next)
        if (next.winnerId) return { state: next, sound: 'win' }
        next = advanceTurn(next, 2)
        return { state: next, sound: 'spin' }
      }
      next = advanceTurn(next)
      return { state: next, sound: card.color === 'wild' ? 'wild' : 'play' }
  }
}

function queueOrApplyDraw(
  state: GameState,
  amount: number,
  sourcePlayerId: string,
  sourceColor: UnoColor | null,
  canChallenge: boolean,
): GameState {
  const next = advanceTurn(cancelPendingDareDropAll(state))
  return addLog(
    {
      ...next,
      pendingDraw: { amount, cardValue: amount, sourcePlayerId, sourceColor, canChallenge },
    },
    `${activePlayer(next).name} faces a draw penalty of ${amount}.`,
  )
}

function queueDare(state: GameState, sourcePlayerId: string): GameState {
  const next = advanceTurn(cancelPendingDareDropAll(state))
  return addLog(
    {
      ...next,
      pendingDare: { sourcePlayerId, sequence: next.nextLogId },
    },
    `${activePlayer(next).name} must draw 2 or roll the Dare die.`,
  )
}

function queueEmoji(state: GameState, sourcePlayerId: string, emoji: string): GameState {
  const next = advanceTurn(cancelPendingDareDropAll(state))
  return addLog(
    {
      ...next,
      pendingEmoji: {
        sourcePlayerId,
        targetPlayerId: activePlayer(next).id,
        emoji,
        sequence: next.nextLogId,
      },
    },
    `${activePlayer(next).name} must make the ${emoji} face or draw 4.`,
  )
}

export function resolvePendingEmoji(state: GameState, resolution: 'madeFace' | 'draw4'): GameState {
  const pending = state.pendingEmoji
  if (!pending) return state
  const targetIndex = state.players.findIndex((player) => player.id === pending.targetPlayerId)
  if (targetIndex < 0) return { ...state, pendingEmoji: null }
  let next = cloneState(state)
  next.pendingEmoji = null
  next.activePlayerIndex = targetIndex
  const target = activePlayer(next)
  const source = next.players.find((player) => player.id === pending.sourcePlayerId)
  if (resolution === 'madeFace') {
    next = addLog(next, `${target.name} made the ${pending.emoji} face and continues the turn.`)
    return source?.hand.length === 0 ? finishRound(next, source.id) : next
  }
  next = drawCards(next, targetIndex, 4)
  next = addLog(next, `${target.name} missed the ${pending.emoji} face and drew 4.`)
  if (source?.hand.length === 0) return finishRound(next, source.id)
  return advanceTurn(next)
}

export function resolvePendingDare(state: GameState, resolution: 'draw' | 'dare', dieRoll = Math.floor(Math.random() * 6) + 1): GameState {
  if (!state.pendingDare) return state
  const target = activePlayer(state)
  const targetIndex = state.activePlayerIndex
  let next = cloneState(clearTurnFlags(state))
  next.pendingDare = null
  next.pendingDareDropAll = null

  if (resolution === 'draw') {
    next = drawCards(next, next.activePlayerIndex, 2)
    next = finishRoundIfPlayerIsOut(next)
    if (next.winnerId) return addLog(next, `${target.name} drew 2 before scoring.`)
    next = advanceTurn(next)
    return addLog(next, `${target.name} accepted the Dare penalty and drew 2.`)
  }

  const result = dareResultForRoll(dieRoll)
  next = setDareEvent(next, targetIndex, dieRoll, result, [])

  if (result === 'draw4') {
    next = drawCards(next, targetIndex, 4)
    next = setDareEvent(next, targetIndex, dieRoll, result, [target.id])
    next = addLog(next, `${target.name} rolled the Dare die and drew 4.`)
    return advanceTurn(next)
  }

  if (result === 'allOthersDrop4') {
    const affected: string[] = []
    for (const index of otherPlayerIndexesInDirection(next, targetIndex)) {
      if (next.players[index].hand.length <= 4) {
        next = setDareEvent(next, targetIndex, dieRoll, result, [...affected, next.players[index].id])
        return dropAllAndFinishRound(next, next.players[index].id, `${target.name} rolled All Others Drop 4.`)
      }
      next = dropCardsFromHand(next, index, 4)
      affected.push(next.players[index].id)
    }
    next = setDareEvent(next, targetIndex, dieRoll, result, affected)
    return addLog(next, `${target.name} rolled All Others Drop 4 and continues the turn.`)
  }

  if (result === 'nextPlayerDropAll') {
    const winnerIndex = nextIndex(next)
    next = setDareEvent(next, targetIndex, dieRoll, result, [next.players[winnerIndex].id])
    return dropAllAndFinishRound(next, next.players[winnerIndex].id, `${target.name} rolled Next Player Drop All.`)
  }

  if (result === 'overNextPlayerDropAll') {
    const guardIndex = nextIndex(next)
    const targetDropIndex = indexFrom(next, targetIndex, 2)
    next = setDareEvent(next, targetIndex, dieRoll, result, [next.players[targetDropIndex].id])
    next.pendingDareDropAll = {
      targetPlayerId: next.players[targetDropIndex].id,
      guardPlayerId: next.players[guardIndex].id,
      direction: next.direction,
      armed: false,
      sequence: next.nextLogId,
    }
    next = addLog(next, `${target.name} rolled Over Next Player Drops All. ${next.players[targetDropIndex].name} may win after ${next.players[guardIndex].name}'s normal turn.`)
    return advanceTurn(next)
  }

  if (result === 'drawToAction') {
    let drawn = 0
    let foundAction: Card | null = null
    do {
      const draw = drawSingleCard(next, targetIndex)
      next = draw.state
      if (!draw.card) break
      drawn += 1
      if (isActionCard(draw.card)) foundAction = draw.card
    } while (!foundAction)
    next = setDareEvent(next, targetIndex, dieRoll, result, foundAction ? [target.id] : [])
    next = addLog(next, foundAction ? `${target.name} drew ${drawn} card${drawn === 1 ? '' : 's'} to reach an action card.` : `${target.name} tried to draw to an action card, but the draw pile was empty.`)
    return advanceTurn(next)
  }

  next = setDareEvent(next, targetIndex, dieRoll, result, [target.id])
  next = addLog(next, `${target.name} rolled Winner of the Round.`)
  return finishRound(next, target.id)
}

function dareResultForRoll(dieRoll: number): DareDieResult {
  if (dieRoll === 1) return 'draw4'
  if (dieRoll === 2) return 'allOthersDrop4'
  if (dieRoll === 3) return 'nextPlayerDropAll'
  if (dieRoll === 4) return 'overNextPlayerDropAll'
  if (dieRoll === 5) return 'drawToAction'
  return 'instantWin'
}

function setDareEvent(
  state: GameState,
  rollerIndex: number,
  dieRoll: number,
  result: DareDieResult,
  affectedPlayerIds: string[],
): GameState {
  const roller = state.players[rollerIndex] ?? activePlayer(state)
  return {
    ...state,
    dareEvent: {
      rollerPlayerId: roller.id,
      rollerPlayerName: roller.name,
      dieRoll,
      result,
      affectedPlayerIds,
      sequence: state.nextLogId,
    },
  }
}

function otherPlayerIndexesInDirection(state: GameState, sourceIndex: number): number[] {
  return Array.from({ length: state.players.length - 1 }, (_, offset) => indexFrom(state, sourceIndex, offset + 1))
}

function isActionCard(card: Card): boolean {
  return card.kind !== 'number'
}

function dropCardsFromHand(state: GameState, playerIndex: number, amount: number): GameState {
  const next = cloneState(state)
  const player = next.players[playerIndex]
  if (!player) return next
  const top = next.discardPile.pop()
  const dropped = player.hand.splice(0, amount)
  next.discardPile.push(...dropped)
  if (top) next.discardPile.push(top)
  return next
}

function dropAllAndFinishRound(state: GameState, playerId: string, reason: string): GameState {
  let next = cloneState(state)
  const player = next.players.find((entry) => entry.id === playerId)
  if (!player) return next
  next.discardPile.push(...player.hand.splice(0))
  next.pendingDareDropAll = null
  next = addLog(next, `${reason} ${player.name} dropped all cards.`)
  return finishRound(next, player.id)
}

function cancelPendingDareDropAll(state: GameState): GameState {
  return state.pendingDareDropAll ? { ...state, pendingDareDropAll: null } : state
}

export function resolvePendingDraw(state: GameState, challenge: boolean): GameState {
  if (!state.pendingDraw) return state
  const target = activePlayer(state)
  const targetIndex = state.activePlayerIndex
  const targetId = target.id
  const source = state.players.find((player) => player.id === state.pendingDraw?.sourcePlayerId)
  let amount = state.pendingDraw.amount
  let next = cloneState(clearTurnFlags(state))

  if (challenge && source && state.pendingDraw.canChallenge) {
    const guilty = source.hand.some((card) => card.color === state.pendingDraw?.sourceColor)
    if (guilty) {
      const sourceIndex = next.players.findIndex((player) => player.id === source.id)
      next = applyImmediateDraw(next, sourceIndex, 4)
      next.pendingDraw = null
      return addLog(next, `${source.name} was challenged successfully and drew 4.`)
    }
    amount += 2
    next = addLog(next, `${target.name} challenged and lost. Penalty rises to ${amount}.`)
  }

  next = applyImmediateDraw(next, targetIndex, amount)
  next.pendingDraw = null
  next.drewThisTurn = false
  next.drawnCardIdThisTurn = null
  if (next.config.game === 'noMercy') {
    next = applyNoMercyEliminations(next, source?.id, targetIndex)
    if (next.winnerId) {
      return addLog(next, `${target.name} drew ${amount} before the Mercy Rule ended the round.`)
    }
    if (!next.players.some((player) => player.id === targetId)) {
      return addLog(next, `${target.name} drew ${amount} and was eliminated by the Mercy Rule.`)
    }
  }
  next = finishRoundIfPlayerIsOut(next)
  if (next.winnerId) {
    return addLog(next, `${target.name} drew ${amount} before scoring.`)
  }
  next = advanceTurn(next)
  return addLog(next, `${target.name} drew ${amount} and lost the turn.`)
}

export function memorySelectSlot(state: GameState, slotIndex: number): GameState {
  if (!isGuoMemoryGame(state.config.game) || state.winnerId || !state.memoryBoard) return state
  const board = state.memoryBoard
  const cardsPerMatch = board.cardsPerMatch ?? 2
  if (board.pendingMismatchIndexes?.length || board.pendingMatchIndexes?.length) return state
  if (slotIndex < 0 || slotIndex >= board.slots.length) return state
  const slot = board.slots[slotIndex]
  if (!slot || slot.collectedByPlayerId || board.selectedSlotIndexes.includes(slotIndex)) return state

  const next = cloneState(state)
  const nextBoard = next.memoryBoard!
  nextBoard.slots[slotIndex].faceUp = true
  if (isImmediateMemoryAction(nextBoard.slots[slotIndex])) {
    return resolveMemoryImmediateAction(next, slotIndex)
  }
  nextBoard.selectedSlotIndexes = [...nextBoard.selectedSlotIndexes, slotIndex]

  if (nextBoard.selectedSlotIndexes.length < cardsPerMatch) {
    return addLog(next, `${activePlayer(next).name} revealed a memory card.`)
  }

  const selectedIndexes = [...nextBoard.selectedSlotIndexes]
  const selectedSlots = selectedIndexes.map((index) => nextBoard.slots[index])
  if (memorySlotsMatch(nextBoard, ...selectedSlots)) {
    const player = activePlayer(next)
    nextBoard.pendingMatchIndexes = selectedIndexes
    nextBoard.pendingMatchPlayerId = player.id
    nextBoard.pendingMismatchIndexes = null
    return addLog(next, `${player.name} found a matching ${cardsPerMatch === 3 ? 'triple' : 'pair'}.`)
  }

  nextBoard.pendingMatchIndexes = null
  nextBoard.pendingMatchPlayerId = null
  nextBoard.pendingMismatchIndexes = selectedIndexes
  return addLog(next, `${activePlayer(next).name} found no match.`)
}

export function memoryResolvePending(state: GameState): GameState {
  if (
    !isGuoMemoryGame(state.config.game) ||
    state.winnerId ||
    !state.memoryBoard ||
    (!state.memoryBoard.pendingMismatchIndexes?.length && !state.memoryBoard.pendingMatchIndexes?.length)
  ) return state
  let next = cloneState(state)
  const board = next.memoryBoard!
  if (board.pendingMatchIndexes?.length) {
    const player = next.players.find((candidate) => candidate.id === board.pendingMatchPlayerId) ?? activePlayer(next)
    for (const index of board.pendingMatchIndexes) {
      const slot = board.slots[index]
      if (!slot || slot.collectedByPlayerId) continue
      slot.faceUp = true
      slot.collectedByPlayerId = player.id
      player.hand.push(slot.card)
      player.score += slot.card.points
    }
    if (isGuoMemoryActionGame(next.config.game)) preserveMemoryActionSolvability(board, player.id)
    board.selectedSlotIndexes = []
    board.pendingMatchIndexes = null
    board.pendingMatchPlayerId = null
    board.pendingMismatchIndexes = null
    next = addLog(next, `${player.name} collected a matching ${(board.cardsPerMatch ?? 2) === 3 ? 'triple' : 'pair'}.`)
    return finishMemoryIfComplete(next)
  }

  for (const index of board.pendingMismatchIndexes ?? []) {
    const slot = board.slots[index]
    if (slot && !slot.collectedByPlayerId) slot.faceUp = false
  }
  board.selectedSlotIndexes = []
  board.pendingMatchIndexes = null
  board.pendingMatchPlayerId = null
  board.pendingMismatchIndexes = null
  next = addLog(next, 'The memory cards flipped back down.')
  return advanceTurn(next)
}

export function memoryAiMove(state: GameState): { state: GameState; sound?: SoundCue } {
  if (!isGuoMemoryGame(state.config.game) || state.winnerId || !state.memoryBoard) return { state }
  if (state.memoryBoard.pendingMismatchIndexes?.length || state.memoryBoard.pendingMatchIndexes?.length) return { state: memoryResolvePending(state), sound: 'play' }
  const cardsPerMatch = state.memoryBoard.cardsPerMatch ?? 2
  const available = state.memoryBoard.slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot, index }) => !slot.collectedByPlayerId && !state.memoryBoard!.selectedSlotIndexes.includes(index))
  if (available.length === 0) return { state: finishMemoryIfComplete(state), sound: 'win' }
  const selectedIndexes = state.memoryBoard.selectedSlotIndexes
  if (selectedIndexes.length <= 0) {
    return { state: memorySelectSlot(state, available[Math.floor(Math.random() * available.length)].index), sound: 'play' }
  }
  if (selectedIndexes.length >= cardsPerMatch) return { state }
  const selectedSlots = selectedIndexes.map((index) => state.memoryBoard!.slots[index])
  const matches = available.filter(({ slot }) => memorySlotsMatch(state.memoryBoard!, ...selectedSlots, slot))
  const misses = available.filter(({ slot }) => !memorySlotsMatch(state.memoryBoard!, ...selectedSlots, slot))
  const difficulty = activePlayer(state).aiDifficulty ?? state.config.aiDifficulty
  const accuracy = difficulty === 'hard' ? 0.72 : difficulty === 'medium' ? 0.45 : 0.18
  const shouldHit = matches.length > 0 && (misses.length === 0 || Math.random() < accuracy)
  const pool = shouldHit ? matches : misses.length > 0 ? misses : matches
  const nextIndex = pool[Math.floor(Math.random() * pool.length)]?.index
  if (typeof nextIndex !== 'number') return { state }
  return { state: memorySelectSlot(state, nextIndex), sound: 'play' }
}

function memorySlotsMatch(board: MemoryBoard, ...slots: MemorySlot[]): boolean {
  if (slots.length < 2) return false
  const normalSlots = slots.filter((slot) => slot.memoryActionKind !== 'wild')
  if (normalSlots.length <= 1) return true
  const [first] = normalSlots
  if (board.matchMode === 'color') return normalSlots.every((slot) => slot.card.color === first.card.color)
  if (board.matchMode === 'both') return normalSlots.every((slot) => slot.card.color === first.card.color && slot.card.value === first.card.value)
  return normalSlots.every((slot) => slot.card.value === first.card.value)
}

function finishMemoryIfComplete(state: GameState): GameState {
  if (!isGuoMemoryGame(state.config.game) || !state.memoryBoard?.slots.every((slot) => slot.collectedByPlayerId)) return state
  const winner = [...state.players].sort((a, b) =>
    b.hand.length - a.hand.length ||
    memoryCollectedPoints(b) - memoryCollectedPoints(a) ||
    b.score - a.score,
  )[0]
  if (!winner) return state
  const sessionWinner = [...state.players].sort((a, b) => b.score - a.score)[0]
  const gameWinnerId = sessionWinner && sessionWinner.score >= state.targetScore ? sessionWinner.id : null
  const next = { ...state, winnerId: winner.id, gameWinnerId }
  const title =
    state.config.game === 'guoMemoryAction'
      ? "Guo's Exclusive UNO Memory Action"
      : state.config.game === 'guoTripleMemoryAction'
        ? "Guo's Exclusive UNO Triple Memory Action"
        : state.config.game === 'guoTripleMemory'
          ? "Guo's Exclusive UNO Triple Memory"
          : "Guo's Exclusive UNO Memory"
  return addLog(next, gameWinnerId && sessionWinner ? `${sessionWinner.name} won ${title}.` : `${winner.name} won round ${state.currentRound}. Continue to the next Memory round.`)
}

function memoryCollectedPoints(player: Player): number {
  return player.hand.reduce((total, card) => total + card.points, 0)
}

function isImmediateMemoryAction(slot: MemorySlot): boolean {
  return Boolean(slot.memoryActionKind && slot.memoryActionKind !== 'wild')
}

function resolveMemoryImmediateAction(state: GameState, slotIndex: number): GameState {
  let next = cloneState(state)
  const board = next.memoryBoard!
  const slot = board.slots[slotIndex]
  const action = slot.memoryActionKind
  const player = activePlayer(next)
  if (!action || action === 'wild') return next

  const selectedBeforeAction = board.selectedSlotIndexes.filter((index) => index !== slotIndex)
  slot.faceUp = true
  slot.collectedByPlayerId = action === 'winnerTakesAll' ? player.id : 'action'
  board.selectedSlotIndexes = []
  board.pendingMatchIndexes = null
  board.pendingMatchPlayerId = null
  board.pendingMismatchIndexes = null
  for (const index of selectedBeforeAction) {
    const selected = board.slots[index]
    if (selected && !selected.collectedByPlayerId) selected.faceUp = false
  }

  const setEvent = (amount: number, affectedPlayers: Array<{ player: Player; deltaCards: number }>, endedRound = false) => {
    next.memoryActionEvent = {
      action,
      playerId: player.id,
      playerName: player.name,
      amount,
      affectedPlayers: affectedPlayers.map(({ player: affected, deltaCards }) => ({
        playerId: affected.id,
        playerName: affected.name,
        deltaCards,
      })),
      endedRound,
      sequence: next.nextLogId,
    }
  }

  if (action === 'winnerTakesAll') {
    let gained = 0
    for (const remaining of board.slots) {
      if (remaining.collectedByPlayerId) continue
      remaining.faceUp = true
      remaining.collectedByPlayerId = player.id
      player.hand.push(remaining.card)
      player.score += remaining.card.points
      gained += 1
    }
    setEvent(gained, [{ player, deltaCards: gained }], true)
    next = addLog(next, `${player.name} revealed Winner Takes All and collected the remaining table.`)
    return finishMemoryIfComplete(next)
  }

  if (action === 'loseAll') {
    const lost = player.hand.length
    player.hand = []
    player.score = 0
    setEvent(lost, [{ player, deltaCards: -lost }])
    return addLog(next, `${player.name} revealed Lose All and lost ${lost} collected cards.`)
  }

  const amount = memoryLauncherResult()
  if (action === 'loseCards') {
    const lost = removeMemoryCollectedCards(player, amount)
    setEvent(amount, [{ player, deltaCards: -lost }])
    return addLog(next, `${player.name} revealed Lose Cards and lost ${lost} collected cards.`)
  }
  if (action === 'earnCards') {
    addMemoryBonusCards(player, amount)
    setEvent(amount, [{ player, deltaCards: amount }])
    return addLog(next, `${player.name} revealed Earn Cards and gained ${amount} bonus cards.`)
  }
  if (action === 'allOthersLose') {
    let lost = 0
    const affectedPlayers: Array<{ player: Player; deltaCards: number }> = []
    for (const candidate of next.players) {
      if (candidate.id !== player.id) {
        const removed = removeMemoryCollectedCards(candidate, amount)
        lost += removed
        affectedPlayers.push({ player: candidate, deltaCards: -removed })
      }
    }
    setEvent(amount, affectedPlayers)
    return addLog(next, `${player.name} revealed Others Lose. Other players lost ${lost} collected cards.`)
  }
  if (action === 'allOthersEarn') {
    const affectedPlayers: Array<{ player: Player; deltaCards: number }> = []
    for (const candidate of next.players) {
      if (candidate.id !== player.id) {
        addMemoryBonusCards(candidate, amount)
        affectedPlayers.push({ player: candidate, deltaCards: amount })
      }
    }
    setEvent(amount, affectedPlayers)
    return addLog(next, `${player.name} revealed Others Earn. Other players gained ${amount} bonus cards each.`)
  }
  return next
}

function preserveMemoryActionSolvability(board: MemoryBoard, collectedPlayerId: string) {
  if ((board.cardsPerMatch ?? 2) === 3) {
    rebalanceTripleMemoryRemainders(board)
    void collectedPlayerId
    return
  }
  const matched = board.pendingMatchIndexes?.map((index) => board.slots[index]).filter(Boolean) ?? []
  const wild = matched.find((slot) => slot.memoryActionKind === 'wild')
  const normal = matched.find((slot) => !slot.memoryActionKind)
  if (!wild || !normal) return
  const mate = board.slots.find((slot) =>
    !slot.collectedByPlayerId &&
    !board.pendingMatchIndexes?.includes(board.slots.indexOf(slot)) &&
    !slot.memoryActionKind &&
    memorySlotsMatch(board, normal, slot)
  )
  if (!mate) return
  mate.card = memoryActionCard(`${mate.card.id}-wild-rescue`, 'wild')
  mate.memoryActionKind = 'wild'
  mate.faceUp = false
  mate.collectedByPlayerId = null
  void collectedPlayerId
}

function rebalanceTripleMemoryRemainders(board: MemoryBoard) {
  const remaining = board.slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => !slot.collectedByPlayerId && !isImmediateMemoryAction(slot))
  for (let groupStart = 0; groupStart + 2 < remaining.length; groupStart += 3) {
    const group = remaining.slice(groupStart, groupStart + 3)
    if (group.some(({ slot }) => slot.memoryActionKind === 'wild')) continue
    const seed = group[0].slot.card
    const value = seed.value ?? ((groupStart / 3) % 9) + 1
    const color = seed.color === 'wild' ? 'red' : seed.color
    group.forEach(({ slot }, offset) => {
      if (board.matchMode === 'color') {
        slot.card = memoryCard(`${slot.card.id}-triple-rescue`, color, ((value + offset + 2) % 9) + 1)
      } else {
        slot.card = memoryCard(`${slot.card.id}-triple-rescue`, board.matchMode === 'both' ? color : (['red', 'yellow', 'green', 'blue'] as UnoColor[])[offset % 4], value)
      }
    })
  }
}

function memoryLauncherResult(): number {
  const roll = Math.random()
  if (roll < 0.3) return 0
  if (roll < 0.62) return 2
  if (roll < 0.93) return 3
  return 4
}

function removeMemoryCollectedCards(player: Player, amount: number): number {
  const lostCards = player.hand.splice(0, Math.max(0, Math.min(amount, player.hand.length)))
  player.score = Math.max(0, player.score - lostCards.reduce((total, card) => total + card.points, 0))
  return lostCards.length
}

function addMemoryBonusCards(player: Player, amount: number) {
  for (let index = 0; index < amount; index += 1) {
    player.hand.push({ id: `memory-bonus-${player.id}-${Date.now()}-${Math.random()}-${index}`, kind: 'number', color: 'wild', label: 'Bonus', points: 0, value: 0 })
  }
}

export function drawOne(state: GameState): GameState {
  if (isGridMemoryGame(state.config.game)) return zeroDrawFromPile(state)
  if (state.pendingDare) return resolvePendingDare(state, 'draw')
  if (state.pendingDraw) return resolvePendingDraw(state, false)
  if (state.mustPlayFromHand || state.speedPlayColor) return addLog(state, `${activePlayer(state).name} must play from hand before drawing.`)
  if (state.config.game === 'dos') return drawOneDos(state)
  if (state.config.game === 'phase10') return drawOnePhase10(state)
  if (state.config.game === 'skipBo') return skipBoDrawToFive(state)
  if (state.config.game === 'dice') return drawOneDice(state)
  if (state.config.game === 'noMercy') return drawUntilPlayableNoMercy(state)
  if (isLauncherGame(state.config.game)) {
    let next = cloneState(clearTurnFlags(state))
    next = pressLauncher(next, next.activePlayerIndex, 1)
    next = advanceTurn(next)
    return next
  }
  let next = cloneState(clearTurnFlags(state))
  next = drawCards(next, next.activePlayerIndex, 1)
  const player = activePlayer(next)
  const drawnCard = player.hand[player.hand.length - 1]
  const canPlayDrawnCard = drawnCard ? isBasePlayable(drawnCard, next) : false
  next.drewThisTurn = true
  next.drawnCardIdThisTurn = drawnCard?.id ?? null
  next = addLog(next, `${activePlayer(next).name} drew a card.`)
  if (!canPlayDrawnCard) {
    next = addLog(next, `${activePlayer(next).name} cannot play the drawn card.`)
    return advanceTurn(next)
  }
  return addLog(next, `${activePlayer(next).name} may play the drawn card or pass.`)
}

export function endTurn(state: GameState): GameState {
  if (isGridMemoryGame(state.config.game)) return state.zeroCallPendingPlayerId ? zeroMissUnoCall(state) : zeroDiscardDrawn(state)
  if (state.config.game === 'skipBo') return addLog(state, `${activePlayer(state).name} must discard a hand card to end a Skip-Bo turn.`)
  if (state.mustPlayFromHand || state.speedPlayColor) return addLog(state, `${activePlayer(state).name} must play from hand before passing.`)
  return advanceTurn({ ...clearTurnFlags(state), drewThisTurn: false, drawnCardIdThisTurn: null })
}

function drawOneDos(state: GameState): GameState {
  if (state.winnerId || state.drewThisTurn) return state
  let next = cloneState(clearTurnFlags(state))
  const drawn = drawSingleCard(next, next.activePlayerIndex)
  next = drawn.state
  next.drewThisTurn = true
  next.drawnCardIdThisTurn = drawn.card?.id ?? null
  next = addLog(next, `${activePlayer(next).name} drew a DOS card.`)
  if (drawn.card && dosCardCanMatch(drawn.card, activePlayer(next).hand, next.dosCenterRow ?? [])) {
    return addLog(next, `${activePlayer(next).name} may match the drawn card or pass.`)
  }
  next = addLog(next, `${activePlayer(next).name} cannot match the drawn card.`)
  return advanceTurn(next)
}

function drawOnePhase10(state: GameState): GameState {
  if (state.winnerId || state.drewThisTurn) return state
  let next = cloneState(clearTurnFlags(state))
  if (next.drawPile.length === 0) next = refillDrawPileFromDiscard(next)
  const drawn = drawSingleCard(next, next.activePlayerIndex)
  next = drawn.state
  next.drewThisTurn = true
  next.drawnCardIdThisTurn = drawn.card?.id ?? null
  return addLog(next, `${activePlayer(next).name} drew a Phase 10 card and must discard to end the turn.`)
}

function drawOneDice(state: GameState): GameState {
  if (state.winnerId || state.drewThisTurn) return state
  const playerIndex = state.activePlayerIndex
  const playerName = activePlayer(state).name
  let next = cloneState(clearTurnFlags(state))
  const result = diceTakeFromLine(next, playerIndex, 1)
  next = result.state
  if (result.taken > 0) {
    next = addLog(next, `${playerName} took 1 die from the center line and rerolled all dice.`)
  } else {
    next = addLog(next, `${playerName} rerolled all dice because the center line must keep one die.`)
  }
  next.drewThisTurn = true
  next.drawnCardIdThisTurn = null
  if (activePlayer(next).hand.some((card) => diceCanPlayOnLine(card, next))) {
    return addLog(next, `${playerName} may play a matching die or pass.`)
  }
  next = addLog(next, `${playerName} still cannot play a matching die.`)
  return advanceTurn(next)
}

export function applyFlashTimeoutPenalty(state: GameState): GameState {
  if (state.config.game !== 'flash' || state.winnerId) return state
  const player = activePlayer(state)
  let amount = 2
  if (state.pendingDraw) amount += state.pendingDraw.amount
  let next = cloneState(clearTurnFlags(state))
  next = drawCards(next, next.activePlayerIndex, amount)
  next.pendingDraw = null
  next.drewThisTurn = false
  next.drawnCardIdThisTurn = null
  next = addLog(next, `${player.name} timed out on the Flash unit and drew ${amount}.`)
  next = setFlashEvent(next, 'timeout', next.activePlayerIndex, next.activePlayerIndex, amount)
  return advanceTurn(next)
}

export function callUno(state: GameState, playerId: string): GameState {
  const next = cloneState(state)
  if (next.winnerId || next.pendingDraw || next.pendingDare || next.pendingEmoji || activePlayer(next).id !== playerId) return state
  const player = next.players.find((entry) => entry.id === playerId)
  if (next.config.game === 'dos') {
    if (player && player.hand.length === 2) {
      player.unoSafe = true
      next.unoDeclaredPlayerId = playerId
      next.catchableUnoPlayerId = null
      return addLog(next, `${player.name} called DOS.`)
    }
    return state
  }
  if (next.config.game === 'zero') {
    if (player && zeroFaceDownCount(player) === 1) {
      player.unoSafe = true
      next.unoDeclaredPlayerId = playerId
      next.catchableUnoPlayerId = null
      next.zeroCallPendingPlayerId = null
      const called = addLog(next, `${player.name} called UNO Zero.`)
      return state.zeroCallPendingPlayerId === playerId ? advanceTurn(called) : called
    }
    return state
  }
  if (player && player.hand.length === 2 && player.hand.some((card) => isPlayable(card, next))) {
    player.unoSafe = true
    next.unoDeclaredPlayerId = playerId
    next.catchableUnoPlayerId = null
    return addLog(next, `${player.name} called UNO.`)
  }
  return state
}

export function catchUno(state: GameState): GameState {
  if (!state.catchableUnoPlayerId) return state
  const index = state.players.findIndex((player) => player.id === state.catchableUnoPlayerId)
  let next = cloneState(state)
  const player = next.players[index]
  if (state.config.game === 'zero') {
    next = zeroAddPenaltyCards(next, index, 2)
  } else if (isLauncherGame(state.config.game)) {
    next = pressLauncher(next, index, 2)
  } else if (state.config.game === 'dice') {
    next = diceApplyUnoPenalty(next, index)
  } else {
    next = drawCards(next, index, state.config.game === 'party' ? 4 : 2)
  }
  next.catchableUnoPlayerId = null
  next.unoDeclaredPlayerId = null
  if (state.config.game === 'zero') return addLog(next, `${player.name} was caught without UNO Zero and added 2 cards to the grid.`)
  if (state.config.game === 'dice') return addLog(next, `${player.name} was caught without UNO and took a dice penalty.`)
  if (state.config.game === 'dos') return addLog(next, `${player.name} was caught without DOS and drew 2.`)
  if (state.config.game === 'party') return addLog(next, `${player.name} was caught without UNO and drew 4.`)
  return addLog(next, isLauncherGame(state.config.game) ? `${player.name} was caught without UNO and pressed the launcher twice.` : `${player.name} was caught without UNO and drew 2.`)
}

function diceApplyUnoPenalty(state: GameState, playerIndex: number): GameState {
  let next = state
  const lineResult = diceTakeFromLine(next, playerIndex, 2)
  next = lineResult.state
  if (lineResult.taken > 0) return next
  const target = next.players[playerIndex]
  const opponent = next.players.find((player, index) => index !== playerIndex && player.hand.length > 0)
  if (opponent) {
    opponent.hand.pop()
    target.hand = rollDiceFaces(target.hand.length + 1)
  }
  return next
}

export function startNextRound(state: GameState): GameState {
  if (state.gameWinnerId) return state
  const config = state.config
  const next = createGame(config)
  next.currentRound = state.currentRound + 1
  next.players = next.players.map((player, index) => {
    const previous = state.players[index]
    if (!previous) return player
    return {
      ...player,
      id: previous.id,
      name: previous.name,
      type: previous.type,
      aiDifficulty: previous.aiDifficulty,
      score: previous.score,
      avatarId: previous.avatarId,
      teamId: previous.teamId,
      phase10Phase: previous.phase10Phase,
      phase10Completed: state.config.game === 'phase10' ? false : previous.phase10Completed,
      phase10Melds: state.config.game === 'phase10' ? [] : previous.phase10Melds,
      skipBoStockPile: previous.skipBoStockPile?.map((card) => ({ ...card })),
      skipBoDiscardPiles: previous.skipBoDiscardPiles?.map((pile) => pile.map((card) => ({ ...card }))),
      passagePairs: state.config.game === 'guoPassage' ? [] : previous.passagePairs,
    }
  })
  return addLog(next, `Round ${next.currentRound} starts.`)
}

export function passageTakeCard(state: GameState, source: 'faceUp' | 'passage' | 'draw'): GameState {
  if (state.config.game !== 'guoPassage' || state.winnerId || state.passageTurn?.phase !== 'take') return state
  let next = cloneState(clearTurnFlags(state))
  next = passageRefillDrawPile(next)
  let taken: Card | null | undefined
  if (source === 'faceUp') {
    taken = next.passageFaceUp
    next.passageFaceUp = null
  } else if (source === 'passage') {
    taken = next.passageSlot
    next.passageSlot = null
  } else {
    taken = next.drawPile.pop() ?? null
  }
  if (!taken) return state
  next.passageTurn = { phase: 'pair', takenCard: taken, source }
  next.drewThisTurn = true
  return addLog(next, `${activePlayer(next).name} took ${source === 'faceUp' ? taken.label : source === 'passage' ? 'the face-down passage card' : 'a card from the deck'}.`)
}

export function passagePairWithCard(state: GameState, handCardId: string): GameState {
  if (state.config.game !== 'guoPassage' || state.winnerId || state.passageTurn?.phase !== 'pair' || !state.passageTurn.takenCard) return state
  const pairCard = activePlayer(state).hand.find((card) => card.id === handCardId)
  if (!pairCard) return state
  const pair = passagePairScore(state, state.passageTurn.takenCard, pairCard)
  if (!pair) return addLog(state, `${activePlayer(state).name} cannot pair ${state.passageTurn.takenCard.label} with ${pairCard.label}.`)
  let next = cloneState(state)
  const player = activePlayer(next)
  const cardIndex = player.hand.findIndex((card) => card.id === handCardId)
  if (cardIndex < 0) return state
  const removed = player.hand.splice(cardIndex, 1)[0]
  player.passagePairs = player.passagePairs ?? []
  player.passagePairs.push({
    cards: [{ ...next.passageTurn!.takenCard! }, removed],
    score: pair.score,
    wildDeclaration: pair.wildDeclaration,
  })
  player.score += pair.score
  next.passageTurn = { phase: 'pass', takenCard: null, source: null }
  next = addLog(next, `${player.name} paired ${removed.label} with ${pair.cards[0].label} for ${pair.score} points.`)
  if (player.hand.length === 0) return finishPassageRound(next, player.id)
  return next
}

export function passageSkipPair(state: GameState): GameState {
  if (state.config.game !== 'guoPassage' || state.winnerId || state.passageTurn?.phase !== 'pair' || !state.passageTurn.takenCard) return state
  const next = cloneState(state)
  const player = activePlayer(next)
  player.hand.push(next.passageTurn!.takenCard!)
  next.passageTurn = { phase: 'pass', takenCard: null, source: null }
  return addLog(next, `${player.name} kept the taken card and must pass one card.`)
}

export function passagePassCard(state: GameState, cardId: string, faceDown: boolean): GameState {
  if (state.config.game !== 'guoPassage' || state.winnerId || state.passageTurn?.phase !== 'pass') return state
  let next = cloneState(state)
  const player = activePlayer(next)
  const cardIndex = player.hand.findIndex((card) => card.id === cardId)
  if (cardIndex < 0) return state
  const [card] = player.hand.splice(cardIndex, 1)
  if (faceDown) {
    if (next.passageSlot) next.passageDiscardPile = [...(next.passageDiscardPile ?? []), next.passageSlot]
    next.passageSlot = card
  } else {
    if (next.passageFaceUp) next.passageDiscardPile = [...(next.passageDiscardPile ?? []), next.passageFaceUp]
    next.passageFaceUp = card
    next.activeColor = card.color === 'wild' ? next.activeColor : card.color
  }
  next.passageTurn = { phase: 'take', takenCard: null, source: null }
  next.drewThisTurn = false
  next = addLog(next, `${player.name} passed ${faceDown ? 'one card face down' : card.label + ' face up'}.`)
  if (player.hand.length === 0) return finishPassageRound(next, player.id)
  return advanceTurn(next)
}

export function passageAiMove(state: GameState): { state: GameState; sound?: SoundCue } {
  if (state.config.game !== 'guoPassage' || activePlayer(state).type !== 'ai' || state.winnerId) return { state }
  let next = state
  if (next.passageTurn?.phase === 'take') {
    next = passageTakeCard(next, choosePassageTakeSource(next))
  }
  if (next.passageTurn?.phase === 'pair') {
    const pairCard = choosePassagePairCard(next)
    next = pairCard ? passagePairWithCard(next, pairCard.id) : passageSkipPair(next)
  }
  if (next.winnerId) return { state: next, sound: 'win' }
  if (next.passageTurn?.phase === 'pass') {
    const pass = choosePassagePassCard(activePlayer(next))
    if (pass) next = passagePassCard(next, pass.id, Math.random() < 0.45)
  }
  return { state: next, sound: next.winnerId ? 'win' : 'play' }
}

function passageRefillDrawPile(state: GameState): GameState {
  if (state.drawPile.length > 0 || !(state.passageDiscardPile?.length)) return state
  const next = cloneState(state)
  next.drawPile = shuffle(next.passageDiscardPile ?? [])
  next.passageDiscardPile = []
  return addLog(next, 'The Passage draw deck was refilled from non-scoring passed cards.')
}

function passagePairScore(state: GameState, taken: Card, handCard: Card): { cards: Card[]; score: number; wildDeclaration?: { color: UnoColor; value: number } } | null {
  if (taken.kind === 'wild' && handCard.kind === 'wild') return null
  const numberCard = taken.kind === 'wild' ? handCard : handCard.kind === 'wild' ? taken : null
  const wild = taken.kind === 'wild' ? taken : handCard.kind === 'wild' ? handCard : null
  if (wild && (!numberCard || numberCard.kind !== 'number' || typeof numberCard.value !== 'number' || numberCard.color === 'wild')) return null
  if (!wild) {
    if (taken.kind !== 'number' || handCard.kind !== 'number') return null
    if (state.config.memoryMatchMode === 'number' && taken.value !== handCard.value) return null
    if (state.config.memoryMatchMode === 'color' && taken.color !== handCard.color) return null
    if (state.config.memoryMatchMode === 'both' && (taken.value !== handCard.value || taken.color !== handCard.color)) return null
    return { cards: [taken, handCard], score: (taken.value ?? 0) + (handCard.value ?? 0) }
  }
  if (!numberCard || numberCard.kind !== 'number' || typeof numberCard.value !== 'number' || numberCard.color === 'wild') return null
  const declaration = { color: numberCard.color as UnoColor, value: numberCard.value }
  return { cards: [taken, handCard], score: numberCard.value * 2, wildDeclaration: declaration }
}

function choosePassageTakeSource(state: GameState): 'faceUp' | 'passage' | 'draw' {
  const player = activePlayer(state)
  if (state.passageFaceUp && player.hand.some((card) => passagePairScore(state, state.passageFaceUp!, card))) return 'faceUp'
  if (state.passageSlot && Math.random() < 0.3) return 'passage'
  return state.drawPile.length > 0 ? 'draw' : state.passageFaceUp ? 'faceUp' : 'passage'
}

function choosePassagePairCard(state: GameState): Card | null {
  const taken = state.passageTurn?.takenCard
  if (!taken) return null
  return activePlayer(state).hand
    .filter((card) => passagePairScore(state, taken, card))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0] ?? null
}

function choosePassagePassCard(player: Player): Card | null {
  return [...player.hand].sort((a, b) => (a.kind === 'wild' ? 99 : a.value ?? 99) - (b.kind === 'wild' ? 99 : b.value ?? 99))[0] ?? null
}

function finishPassageRound(state: GameState, winnerId: string): GameState {
  const next = cloneState(state)
  const winner = next.players.find((player) => player.id === winnerId)
  if (!winner) return state
  winner.score += 10
  winner.passagePairs = winner.passagePairs ?? []
  winner.passagePairs.push({ cards: [], score: 10 })
  next.winnerId = winnerId
  next.passageTurn = { phase: 'take', takenCard: null, source: null }
  if (winner.score >= next.targetScore) next.gameWinnerId = winnerId
  return addLog(next, `${winner.name} emptied their hand and earned the 10 point quickest-run bonus.`)
}

export function zeroTakeDiscard(state: GameState): GameState {
  if (!isGridMemoryGame(state.config.game) || state.winnerId || zeroHasDrawnCard(state) || state.zeroCallPendingPlayerId) return state
  if (state.discardPile.length <= 0) return state
  const next = cloneState(clearTurnFlags(state))
  const card = next.discardPile.pop()
  if (!card) return state
  next.zeroTurn = { drawnCard: card, source: 'discard' }
  next.drewThisTurn = true
  return addLog(next, `${activePlayer(next).name} took the top discard.`)
}

export function zeroDrawFromPile(state: GameState): GameState {
  if (!isGridMemoryGame(state.config.game) || state.winnerId || zeroHasDrawnCard(state) || state.zeroCallPendingPlayerId) return state
  let next = cloneState(clearTurnFlags(state))
  if (next.drawPile.length === 0) next = refillDrawPileFromDiscard(next)
  const card = next.drawPile.pop()
  if (!card) return addLog(next, 'The draw pile is empty.')
  next.zeroTurn = { drawnCard: card, source: 'draw' }
  next.drewThisTurn = true
  const canDiscard = zeroDrawnCardCanBeDiscarded(next)
  return addLog(next, `${activePlayer(next).name} drew ${card.label}${canDiscard ? ' and may discard it immediately.' : '.'}`)
}

export function zeroDiscardDrawn(state: GameState): GameState {
  if (!isGridMemoryGame(state.config.game)) return state
  const drawn = state.zeroTurn?.drawnCard
  if (!drawn) return state
  if (!zeroDrawnCardCanBeDiscarded(state)) return addLog(state, `${activePlayer(state).name} must place the drawn card into the grid.`)
  let next = cloneState(state)
  next.discardPile.push(drawn)
  next.activeColor = drawn.color === 'wild' ? next.activeColor : drawn.color
  if (next.config.game === 'skyjo') {
    next.zeroTurn = { drawnCard: null, source: 'reveal' }
    next.drewThisTurn = true
    return addLog(next, `${activePlayer(next).name} discarded ${drawn.label} and must reveal one grid card.`)
  }
  next.zeroTurn = { drawnCard: null, source: null }
  next.drewThisTurn = false
  next = addLog(next, `${activePlayer(next).name} discarded the drawn ${drawn.label}.`)
  if (next.config.game === 'cabo') {
    const power = caboPowerForCard(drawn)
    if (power) {
      next.pendingCaboPower = { playerId: activePlayer(next).id, kind: power, sequence: next.nextLogId }
      return addLog(next, `${activePlayer(next).name} may use ${caboPowerLabel(power)}.`)
    }
    return completeCaboTurn(next)
  }
  next = applyZeroActionCard(next, drawn, next.activePlayerIndex)
  if (next.winnerId) return next
  if (zeroActionAdvancedTurn(drawn)) return next
  return advanceTurn(next)
}

export function zeroSwapDrawnIntoGrid(state: GameState, slotIndex: number): GameState {
  if (!isGridMemoryGame(state.config.game)) return state
  const drawn = state.zeroTurn?.drawnCard
  const current = activePlayer(state)
  if (!current.zeroGrid || slotIndex < 0 || slotIndex >= current.zeroGrid.length) return state
  if (state.config.game === 'skyjo' && state.zeroTurn?.source === 'reveal' && !drawn) {
    return skyjoRevealGridCard(state, slotIndex)
  }
  if (!drawn) return state
  const previousFaceDown = zeroFaceDownCount(current)
  let next = cloneState(state)
  const player = activePlayer(next)
  const slot = player.zeroGrid?.[slotIndex]
  if (!slot) return state
  if (next.config.game === 'skyjo' && !slot.card) return state
  const removed = slot.card
  slot.card = drawn
  if (next.config.game === 'cabo') {
    slot.faceUp = false
    slot.knownByPlayerIds = addKnownPlayer(slot.knownByPlayerIds, player.id)
  } else {
    slot.faceUp = true
  }
  if (removed) next.discardPile.push(removed)
  next.activeColor = removed?.color && removed.color !== 'wild' ? removed.color : drawn.color === 'wild' ? next.activeColor : drawn.color
  next.zeroTurn = { drawnCard: null, source: null }
  next.drewThisTurn = false
  next = addLog(next, `${player.name} placed ${drawn.label} into the grid.`)
  if (next.config.game === 'cabo') return completeCaboTurn(next)
  if (next.config.game === 'skyjo') {
    next = skyjoClearMatchingColumns(next, next.activePlayerIndex)
    return completeSkyjoTurn(next)
  }
  next = zeroClearMatchingColumns(next, next.activePlayerIndex)
  const updatedPlayer = activePlayer(next)
  if (previousFaceDown > 1 && zeroFaceDownCount(updatedPlayer) === 1) {
    updatedPlayer.unoSafe = false
    next.zeroCallPendingPlayerId = updatedPlayer.id
    next.catchableUnoPlayerId = null
    return addLog(next, `${updatedPlayer.name} must call UNO Zero before ending the turn.`)
  }
  next = finishZeroRoundIfComplete(next, updatedPlayer.id)
  if (next.winnerId) return next
  return advanceTurn(next)
}

export function zeroAiMove(state: GameState): { state: GameState; sound?: SoundCue } {
  if (!isGridMemoryGame(state.config.game) || activePlayer(state).type !== 'ai') return { state }
  if (state.config.game === 'cabo' && state.pendingCaboPower?.playerId === activePlayer(state).id) {
    return { state: caboResolveAiPower(state), sound: 'play' }
  }
  if (state.zeroCallPendingPlayerId === activePlayer(state).id) {
    return { state: callUno(state, activePlayer(state).id), sound: 'uno' }
  }
  if (state.config.game === 'skyjo' && state.zeroTurn?.source === 'reveal') {
    return { state: zeroSwapDrawnIntoGrid(state, chooseSkyjoRevealSlot(activePlayer(state).zeroGrid ?? [])), sound: 'play' }
  }
  const next = Math.random() < 0.35 && state.discardPile.length > 0 ? zeroTakeDiscard(state) : zeroDrawFromPile(state)
  const drawn = next.zeroTurn?.drawnCard
  if (!drawn) return { state: advanceTurn(next), sound: 'draw' }
  if (zeroDrawnCardCanBeDiscarded(next) && Math.random() < 0.65) {
    return { state: zeroDiscardDrawn(next), sound: 'play' }
  }
  const slotIndex = chooseZeroSlotForAi(activePlayer(next).zeroGrid ?? [], drawn)
  return { state: zeroSwapDrawnIntoGrid(next, slotIndex), sound: 'play' }
}

export function phase10AiMove(state: GameState): { state: GameState; sound?: SoundCue } {
  if (state.config.game !== 'phase10' || activePlayer(state).type !== 'ai') return { state }
  let next = state.drewThisTurn ? state : (Math.random() < 0.35 && state.discardPile.length > 0 ? phase10TakeDiscard(state) : drawOnePhase10(state))
  next = phase10CompletePhase(next)
  let player = activePlayer(next)
  let hitCandidate = player.phase10Completed ? player.hand.find((card) => findPhase10HitTarget(next, card)) : undefined
  while (hitCandidate && !next.winnerId) {
    next = phase10HitCard(next, hitCandidate.id)
    player = activePlayer(next)
    hitCandidate = player.phase10Completed ? player.hand.find((card) => findPhase10HitTarget(next, card)) : undefined
  }
  if (next.winnerId) return { state: next, sound: 'win' }
  const discard = [...player.hand].sort((a, b) => b.points - a.points || (b.value ?? 0) - (a.value ?? 0))[0]
  if (!discard) return { state: next, sound: 'play' }
  return { state: phase10Discard(next, discard.id), sound: 'play' }
}

export function skipBoAiMove(state: GameState): { state: GameState; sound?: SoundCue } {
  if (state.config.game !== 'skipBo' || activePlayer(state).type !== 'ai') return { state }
  let next = state.drewThisTurn ? state : skipBoDrawToFive(state)
  let guard = 0
  while (!next.winnerId && guard < 80) {
    guard += 1
    const sourceId = bestSkipBoPlayableSourceId(next)
    if (!sourceId) break
    next = skipBoPlayCard(next, sourceId)
  }
  if (next.winnerId) return { state: next, sound: 'win' }
  const player = activePlayer(next)
  const discard = chooseSkipBoDiscard(player)
  if (!discard) return { state: advanceTurn(next), sound: 'play' }
  return { state: skipBoDiscardToPile(next, discard.card.id, discard.pileIndex), sound: 'play' }
}

function bestSkipBoPlayableSourceId(state: GameState): string | null {
  const player = activePlayer(state)
  const sources = [
    `skipbo:stock:${player.id}`,
    ...(player.skipBoDiscardPiles ?? []).map((_, index) => `skipbo:discard:${player.id}:${index}`),
    ...[...player.hand].sort((a, b) => skipBoAiCardScore(a) - skipBoAiCardScore(b)).map((card) => card.id),
  ]
  return sources.find((sourceId) => skipBoCanPlaySource(state, sourceId)) ?? null
}

function chooseSkipBoDiscard(player: Player): { card: Card; pileIndex: number } | null {
  if (player.hand.length === 0) return null
  const card = [...player.hand].sort((a, b) => skipBoAiCardScore(b) - skipBoAiCardScore(a))[0]
  const piles = player.skipBoDiscardPiles ?? [[], [], [], []]
  const sameTopIndex = piles.findIndex((pile) => pile.at(-1)?.value === card.value)
  if (sameTopIndex >= 0) return { card, pileIndex: sameTopIndex }
  const emptyIndex = piles.findIndex((pile) => pile.length === 0)
  if (emptyIndex >= 0) return { card, pileIndex: emptyIndex }
  const lowestPileIndex = piles
    .map((pile, index) => ({ index, value: pile.at(-1)?.value ?? 13 }))
    .sort((a, b) => b.value - a.value)[0]?.index ?? 0
  return { card, pileIndex: lowestPileIndex }
}

function skipBoAiCardScore(card: Card): number {
  if (card.kind === 'wild') return 0
  return card.value ?? 13
}

function caboResolveAiPower(state: GameState): GameState {
  const pending = state.pendingCaboPower
  if (!pending) return state
  const source = activePlayer(state)
  if (pending.kind === 'peek') {
    const ownIndex = chooseUnknownCaboSlot(source, source.id)
    return caboResolvePower(state, source.id, ownIndex)
  }
  if (pending.kind === 'spy') {
    const target = state.players.find((player) => player.id !== source.id)
    return target ? caboResolvePower(state, target.id, chooseUnknownCaboSlot(target, source.id)) : completeCaboTurn({ ...state, pendingCaboPower: null })
  }
  if (!pending.firstSlot) {
    const ownIndex = chooseHighestKnownCaboSlot(source, source.id)
    return caboResolvePower(state, source.id, ownIndex)
  }
  const target = state.players.find((player) => player.id !== source.id)
  return target ? caboResolvePower(state, target.id, chooseUnknownCaboSlot(target, source.id)) : completeCaboTurn({ ...state, pendingCaboPower: null })
}

function chooseUnknownCaboSlot(player: Player, viewerId: string): number {
  const grid = player.zeroGrid ?? []
  const unknown = grid.findIndex((slot) => slot.card && !slot.knownByPlayerIds?.includes(viewerId))
  return unknown >= 0 ? unknown : Math.max(0, grid.findIndex((slot) => slot.card))
}

function chooseHighestKnownCaboSlot(player: Player, viewerId: string): number {
  const grid = player.zeroGrid ?? []
  const known = grid
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.card && slot.knownByPlayerIds?.includes(viewerId))
    .sort((a, b) => (b.slot.card?.points ?? -1) - (a.slot.card?.points ?? -1))
  return known[0]?.index ?? chooseUnknownCaboSlot(player, viewerId)
}

export function zeroDrawnCardCanBeDiscarded(state: GameState): boolean {
  if (!isGridMemoryGame(state.config.game) || state.zeroTurn?.source !== 'draw' || !state.zeroTurn.drawnCard) return false
  if (state.config.game === 'cabo') return true
  if (state.config.game === 'skyjo') return true
  const top = state.discardPile[state.discardPile.length - 1]
  const drawn = state.zeroTurn.drawnCard
  if (!top) return false
  return drawn.color === 'wild' || drawn.color === top.color || (drawn.kind === 'number' && top.kind === 'number' && drawn.value === top.value) || (drawn.kind !== 'number' && drawn.kind === top.kind)
}

export function caboResolvePower(state: GameState, targetPlayerId: string, slotIndex: number): GameState {
  const pending = state.pendingCaboPower
  if (state.config.game !== 'cabo' || state.winnerId || !pending) return state
  const sourcePlayer = state.players.find((player) => player.id === pending.playerId)
  const targetPlayer = state.players.find((player) => player.id === targetPlayerId)
  const targetSlot = targetPlayer?.zeroGrid?.[slotIndex]
  if (!sourcePlayer || !targetPlayer || !targetSlot?.card) return state
  if (pending.kind === 'peek' && targetPlayerId !== pending.playerId) return addLog(state, `${sourcePlayer.name} must peek at one of their own cards.`)
  if (pending.kind === 'spy' && targetPlayerId === pending.playerId) return addLog(state, `${sourcePlayer.name} must spy on another player.`)

  let next = cloneState(state)
  const nextTarget = next.players.find((player) => player.id === targetPlayerId)
  const nextTargetSlot = nextTarget?.zeroGrid?.[slotIndex]
  if (!nextTarget || !nextTargetSlot?.card) return state

  if (pending.kind === 'peek' || pending.kind === 'spy') {
    nextTargetSlot.knownByPlayerIds = addKnownPlayer(nextTargetSlot.knownByPlayerIds, pending.playerId)
    next.pendingCaboPower = null
    next = addLog(next, `${sourcePlayer.name} used ${caboPowerLabel(pending.kind)} on ${nextTarget.name}'s card.`)
    return completeCaboTurn(next)
  }

  if (!pending.firstSlot) {
    next.pendingCaboPower = { ...pending, firstSlot: { playerId: targetPlayerId, slotIndex } }
    return addLog(next, `${sourcePlayer.name} selected the first card to swap.`)
  }

  if (pending.firstSlot.playerId === targetPlayerId && pending.firstSlot.slotIndex === slotIndex) {
    return addLog(state, `${sourcePlayer.name} must select a different second card.`)
  }
  const firstPlayer = next.players.find((player) => player.id === pending.firstSlot?.playerId)
  const firstSlot = firstPlayer?.zeroGrid?.[pending.firstSlot.slotIndex]
  if (!firstSlot?.card) return state
  ;[firstSlot.card, nextTargetSlot.card] = [nextTargetSlot.card, firstSlot.card]
  ;[firstSlot.knownByPlayerIds, nextTargetSlot.knownByPlayerIds] = [nextTargetSlot.knownByPlayerIds ?? [], firstSlot.knownByPlayerIds ?? []]
  next.pendingCaboPower = null
  next = addLog(next, `${sourcePlayer.name} swapped two Cabo cards.`)
  return completeCaboTurn(next)
}

export function caboCall(state: GameState): GameState {
  if (state.config.game !== 'cabo' || state.winnerId || state.caboCallerPlayerId || state.pendingCaboPower || zeroHasDrawnCard(state)) return state
  const caller = activePlayer(state)
  let next = cloneState(clearTurnFlags(state))
  next.caboCallerPlayerId = caller.id
  next.caboFinalTurnsRemaining = Math.max(0, next.players.length - 1)
  next = addLog(next, `${caller.name} called Cabo. Everyone else gets one final turn.`)
  if (!next.caboFinalTurnsRemaining) return finishCaboRound(next)
  return advanceTurn(next)
}

function caboPowerForCard(card: Card): PendingCaboPower['kind'] | null {
  if (card.kind !== 'number') return null
  if (card.value === 7 || card.value === 8) return 'peek'
  if (card.value === 9 || card.value === 10) return 'spy'
  if (card.value === 11 || card.value === 12) return 'swap'
  return null
}

function caboPowerLabel(kind: PendingCaboPower['kind']): string {
  if (kind === 'peek') return 'Peek'
  if (kind === 'spy') return 'Spy'
  return 'Swap'
}

function addKnownPlayer(known: string[] | undefined, playerId: string): string[] {
  return known?.includes(playerId) ? known : [...(known ?? []), playerId]
}

function completeCaboTurn(state: GameState): GameState {
  if (state.config.game !== 'cabo') return advanceTurn(state)
  if (state.caboCallerPlayerId && activePlayer(state).id !== state.caboCallerPlayerId) {
    const remaining = Math.max(0, (state.caboFinalTurnsRemaining ?? 0) - 1)
    const next = { ...state, caboFinalTurnsRemaining: remaining }
    if (remaining === 0) return finishCaboRound(next)
    return advanceTurn(next)
  }
  return advanceTurn(state)
}

function finishCaboRound(state: GameState): GameState {
  const next = cloneState(state)
  for (const player of next.players) {
    if (player.zeroGrid) {
      player.zeroGrid = player.zeroGrid.map((slot) => ({ ...slot, faceUp: true }))
    }
  }
  const totals = next.players.map((player) => ({
    player,
    total: zeroGridCards(player).reduce((sum, card) => sum + card.points, 0),
  }))
  const winner = totals.sort((a, b) => a.total - b.total)[0]?.player
  if (!winner) return state
  for (const { player, total } of totals) {
    if (player.id !== winner.id) player.score += total
  }
  next.winnerId = winner.id
  next.pendingCaboPower = null
  next.zeroTurn = { drawnCard: null, source: null }
  next.caboFinalTurnsRemaining = null
  if (next.players.some((player) => player.score >= next.targetScore)) {
    next.gameWinnerId = [...next.players].sort((a, b) => a.score - b.score)[0].id
  }
  return addLog(next, `${winner.name} had the lowest Cabo grid and won the round.`)
}

function skyjoRevealGridCard(state: GameState, slotIndex: number): GameState {
  const current = activePlayer(state)
  const slot = current.zeroGrid?.[slotIndex]
  if (!slot?.card || slot.faceUp) return state
  let next = cloneState(state)
  const player = activePlayer(next)
  const nextSlot = player.zeroGrid?.[slotIndex]
  if (!nextSlot?.card) return state
  nextSlot.faceUp = true
  next.zeroTurn = { drawnCard: null, source: null }
  next.drewThisTurn = false
  next = addLog(next, `${player.name} revealed ${nextSlot.card.label}.`)
  next = skyjoClearMatchingColumns(next, next.activePlayerIndex)
  return completeSkyjoTurn(next)
}

function skyjoClearMatchingColumns(state: GameState, playerIndex: number): GameState {
  const next = cloneState(state)
  const player = next.players[playerIndex]
  const grid = player?.zeroGrid
  if (!grid) return next
  let cleared = 0
  for (let column = 0; column < 4; column += 1) {
    const indexes = [column, column + 4, column + 8]
    const slots = indexes.map((index) => grid[index])
    if (slots.some((slot) => !slot?.card || !slot.faceUp)) continue
    const value = slots[0]?.card?.value
    if (typeof value !== 'number' || slots.some((slot) => slot?.card?.value !== value)) continue
    for (const index of indexes) {
      const card = grid[index].card
      if (card) next.discardPile.push(card)
      grid[index] = { card: null, faceUp: true, knownByPlayerIds: [] }
      cleared += 1
    }
  }
  return cleared > 0 ? addLog(next, `${player.name} cleared ${cleared} Skyjo column cards.`) : next
}

function completeSkyjoTurn(state: GameState): GameState {
  if (state.config.game !== 'skyjo') return advanceTurn(state)
  let next = state
  const current = activePlayer(next)
  if (!next.caboCallerPlayerId && skyjoAllRemainingCardsFaceUp(current)) {
    next = { ...next, caboCallerPlayerId: current.id, caboFinalTurnsRemaining: Math.max(0, next.players.length - 1) }
    next = addLog(next, `${current.name} revealed the full Skyjo grid. Everyone else gets one final turn.`)
    if (!next.caboFinalTurnsRemaining) return finishSkyjoRound(next)
    return advanceTurn(next)
  }
  if (next.caboCallerPlayerId && current.id !== next.caboCallerPlayerId) {
    const remaining = Math.max(0, (next.caboFinalTurnsRemaining ?? 0) - 1)
    next = { ...next, caboFinalTurnsRemaining: remaining }
    if (remaining === 0) return finishSkyjoRound(next)
  }
  return advanceTurn(next)
}

function skyjoAllRemainingCardsFaceUp(player: Player): boolean {
  const slots = player.zeroGrid ?? []
  return slots.length > 0 && slots.every((slot) => !slot.card || slot.faceUp)
}

function finishSkyjoRound(state: GameState): GameState {
  const next = cloneState(state)
  for (const player of next.players) {
    if (player.zeroGrid) {
      player.zeroGrid = player.zeroGrid.map((slot) => ({ ...slot, faceUp: true }))
    }
  }
  const totals = next.players.map((player) => ({
    player,
    total: zeroGridCards(player).reduce((sum, card) => sum + card.points, 0),
  }))
  const winner = totals.sort((a, b) => a.total - b.total)[0]?.player
  if (!winner) return state
  const closerId = next.caboCallerPlayerId
  const lowestOtherTotal = Math.min(...totals.filter(({ player }) => player.id !== closerId).map(({ total }) => total))
  for (const { player, total } of totals) {
    const closerPenalty = player.id === closerId && total > lowestOtherTotal ? total : 0
    player.score += total + closerPenalty
  }
  next.winnerId = winner.id
  next.pendingCaboPower = null
  next.zeroTurn = { drawnCard: null, source: null }
  next.caboFinalTurnsRemaining = null
  if (next.players.some((player) => player.score >= next.targetScore)) {
    next.gameWinnerId = [...next.players].sort((a, b) => a.score - b.score)[0].id
  }
  return addLog(next, `${winner.name} had the lowest Skyjo grid and won the round.`)
}

function finishPhase10Round(state: GameState, winnerId: string): GameState {
  const next = cloneState(state)
  for (const player of next.players) {
    player.score += player.hand.reduce((sum, card) => sum + card.points, 0)
  }
  for (const player of next.players) {
    if (player.phase10Completed) player.phase10Phase = Math.min(11, (player.phase10Phase ?? 1) + 1)
    player.phase10Completed = false
    player.phase10Melds = []
  }
  next.winnerId = winnerId
  next.drewThisTurn = false
  next.drawnCardIdThisTurn = null
  const completedSession = next.players.filter((player) => (player.phase10Phase ?? 1) > 10)
  if (completedSession.length > 0) {
    next.gameWinnerId = [...completedSession].sort((a, b) => a.score - b.score)[0].id
  }
  const winner = next.players.find((player) => player.id === winnerId)
  return addLog(next, `${winner?.name ?? 'A player'} went out and ended the Phase 10 round.`)
}

function chooseSkyjoRevealSlot(grid: ZeroGridSlot[]): number {
  const hidden = grid.findIndex((slot) => slot.card && !slot.faceUp)
  return hidden >= 0 ? hidden : Math.max(0, grid.findIndex((slot) => slot.card))
}

export function zeroHasDrawnCard(state: GameState): boolean {
  return Boolean(state.zeroTurn?.drawnCard || state.zeroTurn?.source === 'reveal')
}

export function zeroMissUnoCall(state: GameState): GameState {
  if (state.config.game !== 'zero' || !state.zeroCallPendingPlayerId) return state
  const playerId = state.zeroCallPendingPlayerId
  const player = state.players.find((entry) => entry.id === playerId)
  let next = cloneState(state)
  next.zeroCallPendingPlayerId = null
  next.unoDeclaredPlayerId = null
  next.catchableUnoPlayerId = playerId
  next = addLog(next, `${player?.name ?? 'A player'} did not call UNO Zero.`)
  return advanceTurn(next)
}

export function zeroFaceDownCount(player: Player): number {
  return (player.zeroGrid ?? []).filter((slot) => slot.card && !slot.faceUp).length
}

export function zeroGridCards(player: Player): Card[] {
  return (player.zeroGrid ?? []).flatMap((slot) => (slot.card ? [slot.card] : []))
}

export function remapCaboGridKnowledge(players: Player[], idMap: Record<string, string>): Player[] {
  return players.map((player) => ({
    ...player,
    zeroGrid: player.zeroGrid?.map((slot) => ({
      ...slot,
      card: slot.card ? { ...slot.card } : null,
      knownByPlayerIds: slot.knownByPlayerIds?.map((id) => idMap[id] ?? id),
    })),
  }))
}

function applyImmediateDraw(state: GameState, playerIndex: number, amount: number): GameState {
  return drawCards(state, playerIndex, amount)
}

function zeroAddPenaltyCards(state: GameState, playerIndex: number, amount: number): GameState {
  let next = cloneState(state)
  const player = next.players[playerIndex]
  if (!player) return next
  if (!player.zeroGrid) player.zeroGrid = []
  for (let count = 0; count < amount; count += 1) {
    if (next.drawPile.length === 0) next = refillDrawPileFromDiscard(next)
    const card = next.drawPile.pop()
    if (!card) break
    const emptySlot = player.zeroGrid.find((slot) => !slot.card)
    if (emptySlot) {
      emptySlot.card = card
      emptySlot.faceUp = true
    } else {
      player.zeroGrid.push({ card, faceUp: true })
    }
  }
  return next
}

function drawCards(state: GameState, playerIndex: number, amount: number, mirroredFromPlayerId?: string): GameState {
  let next = cloneState(state)
  if (!next.players[playerIndex]) return next
  for (let count = 0; count < amount; count += 1) {
    const drawn = drawSingleCard(next, playerIndex)
    next = drawn.state
    if (!drawn.card) break
  }
  next = mirrorPartyLinkDraw(next, playerIndex, amount, mirroredFromPlayerId)
  return next
}

function drawSingleCard(state: GameState, playerIndex: number): { state: GameState; card: Card | null } {
  const next = state.drawPile.length === 0 ? refillDrawPileFromDiscard(state) : state
  const card = next.drawPile.pop() ?? null
  if (card && next.players[playerIndex]) next.players[playerIndex].hand.push(card)
  return { state: next, card }
}

function refillDrawPileFromDiscard(state: GameState): GameState {
  if (state.discardPile.length <= 1) return state
  const next = cloneState(state)
  const top = next.discardPile.pop()
  next.drawPile = shuffle(next.discardPile)
  next.discardPile = top ? [top] : []
  return next
}

function drawUntilPlayableNoMercy(state: GameState): GameState {
  const player = activePlayer(state)
  const playerId = player.id
  let next = cloneState(clearTurnFlags(state))
  let drawn = 0
  let playable: Card | null = null

  while (true) {
    const result = drawSingleCard(next, next.activePlayerIndex)
    next = result.state
    if (!result.card) break
    drawn += 1
    if (isBasePlayable(result.card, next)) {
      playable = result.card
      break
    }
  }

  next.drewThisTurn = Boolean(playable)
  next.drawnCardIdThisTurn = playable?.id ?? null
  next = addLog(next, playable ? `${player.name} drew ${drawn} card${drawn === 1 ? '' : 's'} until a playable card appeared.` : `${player.name} drew ${drawn} card${drawn === 1 ? '' : 's'}, but no playable card appeared.`)
  next = applyNoMercyEliminations(next, undefined, state.activePlayerIndex)
  if (next.winnerId) return next
  if (!next.players.some((entry) => entry.id === playerId)) return addLog(next, `${player.name} was eliminated by the Mercy Rule.`)
  if (!playable) return advanceTurn(next)
  return addLog(next, `${player.name} may play the drawn card or pass.`)
}

function zeroClearMatchingColumns(state: GameState, playerIndex: number): GameState {
  let next = cloneState(state)
  const player = next.players[playerIndex]
  const grid = player?.zeroGrid
  if (!grid) return next
  let cleared = 0
  for (let column = 0; column < 3; column += 1) {
    const top = grid[column]
    const bottom = grid[column + 3]
    if (!top?.card || !bottom?.card || !top.faceUp || !bottom.faceUp) continue
    const sameColor = top.card.color !== 'wild' && top.card.color === bottom.card.color
    const sameNumber = top.card.kind === 'number' && bottom.card.kind === 'number' && top.card.value === bottom.card.value
    if (!sameColor && !sameNumber) continue
    next.discardPile.push(top.card, bottom.card)
    top.card = null
    bottom.card = null
    top.faceUp = true
    bottom.faceUp = true
    cleared += 2
  }
  if (cleared > 0) {
    next = addLog(next, `${player.name} cleared ${cleared} matching grid cards.`)
  }
  return next
}

function finishZeroRoundIfComplete(state: GameState, winnerId: string): GameState {
  if (state.config.game !== 'zero') return state
  const player = state.players.find((entry) => entry.id === winnerId)
  if (!player?.zeroGrid) return state
  const remaining = player.zeroGrid.filter((slot) => slot.card)
  if (remaining.length > 0 && remaining.some((slot) => !slot.faceUp)) {
    const faceDown = zeroFaceDownCount(player)
    if (faceDown === 1 && !player.unoSafe) {
      return { ...state, catchableUnoPlayerId: player.id }
    }
    return state
  }
  return finishRound(state, winnerId)
}

function chooseZeroSlotForAi(grid: ZeroGridSlot[], drawn: Card): number {
  if (grid.length === 0) return 0
  const emptyIndex = grid.findIndex((slot) => !slot.card)
  if (emptyIndex >= 0) return emptyIndex
  const hiddenIndexes = grid
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => !slot.faceUp)
  if (hiddenIndexes.length > 0 && drawn.points <= 20) {
    return hiddenIndexes[Math.floor(Math.random() * hiddenIndexes.length)].index
  }
  return grid
    .map((slot, index) => ({ index, points: slot.card?.points ?? -1, faceUp: slot.faceUp }))
    .sort((a, b) => {
      if (a.faceUp !== b.faceUp) return a.faceUp ? -1 : 1
      return b.points - a.points
    })[0].index
}

function applyZeroActionCard(state: GameState, card: Card, sourcePlayerIndex: number): GameState {
  let next = state
  switch (card.kind) {
    case 'skip':
      next = addLog(next, `${next.players[nextIndex(next)].name} was skipped.`)
      return advanceTurn(next, 2)
    case 'reverse':
      next = reverseDirection(next)
      return advanceTurn(next, next.players.length === 2 ? 2 : 1)
    case 'draw2':
      next = zeroAddPenaltyCards(next, nextIndex(next), 4)
      next = addLog(next, `${next.players[nextIndex(state)].name} added 4 cards to their grid.`)
      return advanceTurn(next, 2)
    case 'wild':
    case 'wildDraw4':
      next.activeColor = chooseColorFromHand(next.players[sourcePlayerIndex].hand, COLORS)
      if (card.kind === 'wildDraw4') {
        next = zeroAddPenaltyCards(next, nextIndex(next), 4)
        next = addLog(next, `${next.players[nextIndex(state)].name} added 4 cards to their grid.`)
        return advanceTurn(next, 2)
      }
      return next
    default:
      return next
  }
}

function zeroActionAdvancedTurn(card: Card): boolean {
  return ['skip', 'reverse', 'draw2', 'wildDraw4'].includes(card.kind)
}

function drawUntilColor(state: GameState, playerIndex: number, color: UnoColor | null): GameState {
  let next = cloneState(state)
  if (!next.players[playerIndex] || !color) return next
  let drawn = 0
  while (true) {
    const result = drawSingleCard(next, playerIndex)
    next = result.state
    if (!result.card) break
    drawn += 1
    if (result.card.color === color) {
      return addLog(next, `${next.players[playerIndex].name} drew ${drawn} card${drawn === 1 ? '' : 's'} for Wild Draw Color.`)
    }
  }
  return addLog(next, `${next.players[playerIndex].name} drew ${drawn} card${drawn === 1 ? '' : 's'} for Wild Draw Color without finding ${colorLabel(color)}.`)
}

function drawUntilGryffindor(state: GameState, playerIndex: number): GameState {
  let next = cloneState(state)
  if (!next.players[playerIndex]) return next
  let drawn = 0
  while (true) {
    const result = drawSingleCard(next, playerIndex)
    next = result.state
    if (!result.card) break
    drawn += 1
    if (result.card.kind === 'number' && typeof result.card.value === 'number' && result.card.value >= 1 && result.card.value <= 4) {
      return addLog(next, `${next.players[playerIndex].name} drew ${drawn} card${drawn === 1 ? '' : 's'} for the Sorting Hat.`)
    }
  }
  return addLog(next, `${next.players[playerIndex].name} drew ${drawn} card${drawn === 1 ? '' : 's'} without finding Gryffindor.`)
}

function drawForAllExcept(state: GameState, sourcePlayerId: string, amount: number, sourceLabel = 'Effect'): GameState {
  let next = state
  let affected = 0
  for (let index = 0; index < next.players.length; index += 1) {
    if (next.players[index].id === sourcePlayerId) continue
    const before = next.players[index].hand.length
    next = drawCards(next, index, amount)
    if (next.players[index].hand.length > before) affected += 1
  }
  return addLog(next, `${sourceLabel} made ${affected} player${affected === 1 ? '' : 's'} draw ${amount}.`)
}

function applyPlayedTooMuch(state: GameState, discardColor: UnoColor): GameState {
  let next = cloneState(state)
  let affected = 0
  let total = 0
  const redrawCounts = next.players.map((player) => player.hand.filter((card) => card.color === discardColor).length)

  for (let index = 0; index < next.players.length; index += 1) {
    const player = next.players[index]
    const discarded = player.hand.filter((card) => card.color === discardColor)
    if (discarded.length === 0) continue
    player.hand = player.hand.filter((card) => card.color !== discardColor)
    next.discardPile = [...next.discardPile, ...discarded]
    total += discarded.length
    affected += 1
  }

  for (let index = 0; index < next.players.length; index += 1) {
    if (redrawCounts[index] > 0) next = drawCards(next, index, redrawCounts[index])
  }

  return addLog(next, `Played With Too Much chose ${colorLabel(discardColor)}; ${affected} player${affected === 1 ? '' : 's'} discarded and redrew ${total} card${total === 1 ? '' : 's'}.`)
}

function chooseBarbieDiscardColor(state: GameState, sourcePlayerId: string): UnoColor {
  const source = state.players.find((player) => player.id === sourcePlayerId)
  return COLORS
    .map((color) => {
      const own = source?.hand.filter((card) => card.color === color).length ?? 0
      const others = state.players
        .filter((player) => player.id !== sourcePlayerId)
        .reduce((sum, player) => sum + player.hand.filter((card) => card.color === color).length, 0)
      return { color, score: others - own }
    })
    .sort((a, b) => b.score - a.score || colorLabel(a.color).localeCompare(colorLabel(b.color)))[0].color
}

function applyTurtlePower(state: GameState): GameState {
  let next = cloneState(state)
  const selected = next.players.map((player) => chooseTurtlePowerPassCard(player.hand))
  const passed = selected.filter(Boolean).length
  const details: string[] = []

  for (let index = 0; index < next.players.length; index += 1) {
    const card = selected[index]
    if (!card) continue
    next.players[index].hand = next.players[index].hand.filter((entry) => entry.id !== card.id)
  }

  for (let index = 0; index < next.players.length; index += 1) {
    const card = selected[index]
    if (!card) continue
    const targetIndex = (index + next.direction + next.players.length) % next.players.length
    next.players[targetIndex].hand.push(card)
    details.push(`${next.players[index].name} passed ${turtlePowerCardLogLabel(card)} to ${next.players[targetIndex].name}.`)
  }

  next.turtlePowerEvent = {
    direction: next.direction,
    passedCards: selected.flatMap((card, index) => {
      if (!card) return []
      const targetIndex = (index + next.direction + next.players.length) % next.players.length
      return [{
        sourcePlayerId: next.players[index].id,
        sourcePlayerName: next.players[index].name,
        targetPlayerId: next.players[targetIndex].id,
        targetPlayerName: next.players[targetIndex].name,
        cardLabel: turtlePowerCardLogLabel(card),
        cardColor: card.color,
      }]
    }),
    sequence: next.nextLogId,
  }
  next = addLog(next, `Turtle Power passed ${passed} card${passed === 1 ? '' : 's'} ${next.direction === 1 ? 'clockwise' : 'counter-clockwise'}.`)
  for (const detail of details) {
    next = addLog(next, detail)
  }
  return next
}

function chooseTurtlePowerPassCard(hand: Card[]): Card | null {
  if (hand.length === 0) return null
  return [...hand].sort((a, b) => {
    const aWild = a.color === 'wild' ? 1 : 0
    const bWild = b.color === 'wild' ? 1 : 0
    const aAction = a.kind === 'number' ? 0 : 1
    const bAction = b.kind === 'number' ? 0 : 1
    return aWild - bWild || aAction - bAction || a.points - b.points || (a.value ?? 99) - (b.value ?? 99)
  })[0]
}

function turtlePowerCardLogLabel(card: Card): string {
  if (card.color !== 'wild') {
    return `${colorLabel(card.color)} ${card.label}`
  }
  return card.label
}

function applyWebSwing(state: GameState, sourcePlayerId: string, targetPlayerId?: string): GameState {
  let next = cloneState(state)
  const sourceIndex = playerIndexById(next, sourcePlayerId)
  const targetIndex = targetPlayerId ? playerIndexById(next, targetPlayerId) : -1
  const source = next.players[sourceIndex]
  const target = next.players[targetIndex]
  if (!source || !target || source.id === target.id) return addLog(next, 'Web Swing found no valid target.')

  const sourceCard = chooseWebSwingSourceCard(source.hand)
  const targetCard = chooseWebSwingTargetCard(target.hand)
  if (!sourceCard || !targetCard) return addLog(next, 'Web Swing could not swap cards.')

  source.hand = source.hand.filter((entry) => entry.id !== sourceCard.id)
  target.hand = target.hand.filter((entry) => entry.id !== targetCard.id)
  source.hand.push(targetCard)
  target.hand.push(sourceCard)
  next.webSwingEvent = {
    sourcePlayerId: source.id,
    sourcePlayerName: source.name,
    targetPlayerId: target.id,
    targetPlayerName: target.name,
    capturedCard: justiceLeagueCardEvent(target, targetCard),
    returnedCard: justiceLeagueCardEvent(source, sourceCard),
    sequence: next.nextLogId,
  }
  next = addLog(next, `Web Swing: ${source.name} sent ${turtlePowerCardLogLabel(sourceCard)} to ${target.name}.`)
  next = addLog(next, `Web Swing: ${target.name} sent ${turtlePowerCardLogLabel(targetCard)} to ${source.name}.`)
  return next
}

function applyJusticeLeague(state: GameState, sourcePlayerId: string): GameState {
  let next = cloneState(state)
  const sourceIndex = playerIndexById(next, sourcePlayerId)
  const source = next.players[sourceIndex]
  if (!source) return addLog(next, 'Justice League found no source player.')

  const revealed = next.players
    .map((player, index) => ({
      player,
      index,
      card: index === sourceIndex ? null : chooseWebSwingTargetCard(player.hand),
    }))
    .filter((entry): entry is { player: Player; index: number; card: Card } => Boolean(entry.card))

  if (revealed.length === 0) return addLog(next, 'Justice League found no cards to reveal.')

  for (const entry of revealed) {
    next = addLog(next, `Justice League: ${entry.player.name} revealed ${turtlePowerCardLogLabel(entry.card)}.`)
  }

  const selected = [...revealed].sort((a, b) => compareJusticeLeagueCards(b.card, a.card))[0]
  const returnCard = chooseWebSwingSourceCard(source.hand)
  const target = next.players[selected.index]
  target.hand = target.hand.filter((entry) => entry.id !== selected.card.id)
  source.hand.push(selected.card)
  next.justiceLeagueEvent = {
    sourcePlayerId: source.id,
    sourcePlayerName: source.name,
    targetPlayerId: target.id,
    targetPlayerName: target.name,
    revealedCards: revealed.map((entry) => justiceLeagueCardEvent(entry.player, entry.card)),
    capturedCard: justiceLeagueCardEvent(target, selected.card),
    returnedCard: returnCard ? justiceLeagueCardEvent(source, returnCard) : null,
    sequence: next.nextLogId,
  }
  next = addLog(next, `Justice League: ${source.name} captured ${turtlePowerCardLogLabel(selected.card)} from ${target.name}.`)

  if (returnCard) {
    source.hand = source.hand.filter((entry) => entry.id !== returnCard.id)
    target.hand.push(returnCard)
    next = addLog(next, `Justice League: ${source.name} returned ${turtlePowerCardLogLabel(returnCard)} to ${target.name}.`)
  } else {
    next = addLog(next, `Justice League: ${source.name} had no card to return to ${target.name}.`)
  }

  return next
}

function applyBeamMeUp(state: GameState, sourcePlayerId: string, targetPlayerId?: string): GameState {
  let next = cloneState(state)
  const sourceIndex = playerIndexById(next, sourcePlayerId)
  const targetIndex = targetPlayerId ? playerIndexById(next, targetPlayerId) : -1
  const source = next.players[sourceIndex]
  const target = next.players[targetIndex]
  if (!source || !target || source.id === target.id) return addLog(next, 'Beam Me Up found no valid target.')

  const beamedCard = chooseWebSwingTargetCard(target.hand)
  if (!beamedCard) return addLog(next, 'Beam Me Up found no card to beam away.')

  target.hand = target.hand.filter((entry) => entry.id !== beamedCard.id)
  next.drawPile.unshift(beamedCard)
  const replacement = next.drawPile.pop() ?? null
  if (replacement) target.hand.push(replacement)
  next.beamMeUpEvent = {
    sourcePlayerId: source.id,
    sourcePlayerName: source.name,
    targetPlayerId: target.id,
    targetPlayerName: target.name,
    beamedCard: justiceLeagueCardEvent(target, beamedCard),
    replacementCard: replacement ? justiceLeagueCardEvent(target, replacement) : null,
    sequence: next.nextLogId,
  }
  next = addLog(next, `Beam Me Up: ${target.name} revealed ${turtlePowerCardLogLabel(beamedCard)}.`)
  next = addLog(next, `Beam Me Up: ${turtlePowerCardLogLabel(beamedCard)} was beamed into the draw pile.`)
  next = addLog(next, replacement ? `${target.name} drew the replacement card ${turtlePowerCardLogLabel(replacement)}.` : `${target.name} found no replacement card to draw.`)
  return next
}

function applyAvatarState(state: GameState, sourcePlayerId: string): GameState {
  let next = cloneState(state)
  const sourceIndex = playerIndexById(next, sourcePlayerId)
  const source = next.players[sourceIndex]
  if (!source) return addLog(next, 'Avatar State found no player to guide.')

  const revealed: Card[] = []
  for (let index = 0; index < 3; index += 1) {
    if (next.drawPile.length === 0) next = refillDrawPileFromDiscard(next)
    const card = next.drawPile.pop()
    if (!card) break
    revealed.push(card)
  }
  if (revealed.length === 0) return addLog(next, 'Avatar State found no cards to reveal.')

  const keptCard = chooseAvatarStateCard(revealed, next.activeColor)
  const returnedCards = revealed.filter((card) => card.id !== keptCard.id)
  source.hand.push(keptCard)
  if (returnedCards.length > 0) next.drawPile.unshift(...[...returnedCards].reverse())
  next.avatarStateEvent = {
    sourcePlayerId: source.id,
    sourcePlayerName: source.name,
    revealedCards: revealed.map((card) => justiceLeagueCardEvent(source, card)),
    keptCard: justiceLeagueCardEvent(source, keptCard),
    returnedCards: returnedCards.map((card) => justiceLeagueCardEvent(source, card)),
    sequence: next.nextLogId,
  }

  next = addLog(next, `Avatar State revealed: ${revealed.map(turtlePowerCardLogLabel).join(', ')}.`)
  next = addLog(next, `${source.name} kept ${turtlePowerCardLogLabel(keptCard)}.`)
  if (returnedCards.length > 0) {
    next = addLog(next, `${formatCardList(returnedCards.map(turtlePowerCardLogLabel))} returned to the draw pile.`)
  }
  return next
}

function applyCreepyCool(state: GameState, sourcePlayerId: string): GameState {
  let next = cloneState(state)
  const sourceIndex = playerIndexById(next, sourcePlayerId)
  const source = next.players[sourceIndex]
  if (!source) return addLog(next, 'Creepy Cool found no player.')

  const revealedCards: NonNullable<GameState['creepyCoolEvent']>['revealedCards'] = []
  for (const player of next.players) {
    if (player.id === source.id || player.hand.length === 0) continue
    const cardIndex = Math.floor(Math.random() * player.hand.length)
    const revealed = player.hand[cardIndex]
    const discarded = Boolean(next.activeColor && revealed.color === next.activeColor)
    if (discarded) {
      player.hand.splice(cardIndex, 1)
      next.discardPile.push(revealed)
    }
    revealedCards.push({ ...justiceLeagueCardEvent(player, revealed), discarded })
    next = addLog(next, `Creepy Cool: ${player.name} revealed ${turtlePowerCardLogLabel(revealed)} and ${discarded ? 'discarded it' : 'kept it'}.`)
  }

  next.creepyCoolEvent = {
    sourcePlayerId: source.id,
    sourcePlayerName: source.name,
    activeColor: next.activeColor,
    revealedCards,
    sequence: next.nextLogId,
  }
  return next
}

function applyTouchdown(state: GameState, sourcePlayerId: string, targetPlayerId?: string): GameState {
  let next = cloneState(state)
  const sourceIndex = playerIndexById(next, sourcePlayerId)
  const targetIndex = targetPlayerId ? playerIndexById(next, targetPlayerId) : -1
  const source = next.players[sourceIndex]
  const target = next.players[targetIndex]
  if (!source || !target || source.id === target.id) return addLog(next, 'Touchdown found no valid defender.')

  if (next.drawPile.length === 0) next = refillDrawPileFromDiscard(next)
  const revealed = next.drawPile.pop()
  if (!revealed) return addLog(next, 'Touchdown drive found no card to reveal.')

  const success = Boolean(next.activeColor && revealed.color === next.activeColor)
  if (success) next = drawCards(next, targetIndex, 4)
  next.drawPile.unshift(revealed)
  next.touchdownEvent = {
    sourcePlayerId: source.id,
    sourcePlayerName: source.name,
    targetPlayerId: target.id,
    targetPlayerName: target.name,
    activeColor: next.activeColor,
    revealedCard: justiceLeagueCardEvent(target, revealed),
    success,
    cardsDrawn: success ? 4 : 0,
    sequence: next.nextLogId,
  }
  next = addLog(next, `Touchdown drive revealed ${turtlePowerCardLogLabel(revealed)}.`)
  next = addLog(next, success ? `Touchdown! ${target.name} drew 4 and lost the turn.` : 'Touchdown missed. No penalty was applied.')
  return next
}

function justiceLeagueCardEvent(player: Player, card: Card) {
  return {
    playerId: player.id,
    playerName: player.name,
    cardLabel: turtlePowerCardLogLabel(card),
    cardColor: card.color,
  }
}

function chooseAvatarStateCard(cards: Card[], activeColor: UnoColor | null): Card {
  return [...cards].sort((a, b) => avatarStateCardScore(b, activeColor) - avatarStateCardScore(a, activeColor))[0]
}

function avatarStateCardScore(card: Card, activeColor: UnoColor | null): number {
  let score = card.points
  if (card.color === 'wild') score += 80
  if (card.kind !== 'number') score += 40
  if (activeColor && card.color === activeColor) score += 18
  if (card.kind === 'number') score += card.value ?? 0
  return score
}

function formatCardList(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? ''
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}

function chooseWebSwingSourceCard(hand: Card[]): Card | null {
  if (hand.length === 0) return null
  return [...hand].sort((a, b) => {
    const aWild = a.color === 'wild' ? 1 : 0
    const bWild = b.color === 'wild' ? 1 : 0
    const aAction = a.kind === 'number' ? 0 : 1
    const bAction = b.kind === 'number' ? 0 : 1
    return aWild - bWild || aAction - bAction || a.points - b.points || (a.value ?? 99) - (b.value ?? 99)
  })[0]
}

function chooseWebSwingTargetCard(hand: Card[]): Card | null {
  if (hand.length === 0) return null
  return [...hand].sort((a, b) => {
    const aPriority = a.color === 'wild' ? 2 : a.kind === 'number' ? 0 : 1
    const bPriority = b.color === 'wild' ? 2 : b.kind === 'number' ? 0 : 1
    return bPriority - aPriority || b.points - a.points || (b.value ?? 0) - (a.value ?? 0)
  })[0]
}

function compareJusticeLeagueCards(a: Card, b: Card): number {
  const aPriority = a.color === 'wild' ? 2 : a.kind === 'number' ? 0 : 1
  const bPriority = b.color === 'wild' ? 2 : b.kind === 'number' ? 0 : 1
  return aPriority - bPriority || a.points - b.points || (a.value ?? 0) - (b.value ?? 0)
}

function applyMarioKartItemBox(state: GameState, sourcePlayerId: string, choice: PlayChoice): { state: GameState; sound?: SoundCue } {
  const sourceIndex = playerIndexById(state, sourcePlayerId)
  const source = state.players[sourceIndex]
  let next = state.drawPile.length === 0 ? refillDrawPileFromDiscard(state) : state
  const revealed = next.drawPile.pop()
  if (!revealed) {
    next = addLog(next, 'Wild Item Box found no card to reveal.')
    next = advanceTurn(next)
    return { state: next, sound: 'wild' }
  }

  next.discardPile.push(revealed)
  const item = marioKartItemForCard(revealed)
  next.activeColor = revealed.color === 'wild' ? choice.color ?? chooseColorFromHand(source?.hand ?? [], COLORS) : revealed.color
  const targetIndex = marioKartTargetIndex(next, sourceIndex, choice.targetPlayerId)
  let cardsDrawn = 0
  let targetPlayerId: string | undefined
  let targetPlayerName: string | undefined

  next = addLog(next, `Wild Item Box revealed ${revealed.label}: ${marioKartItemLabel(item)}.`)

  if (item === 'mushroom') {
    next = addLog(next, `${source?.name ?? 'The player'} takes another turn from Mushroom.`)
  } else if (item === 'banana') {
    const previousIndex = indexFrom(next, sourceIndex, -1)
    next = drawCards(next, previousIndex, 2)
    cardsDrawn = 2
    targetPlayerId = next.players[previousIndex]?.id
    targetPlayerName = next.players[previousIndex]?.name
    next = addLog(next, `${targetPlayerName ?? 'Previous player'} drew 2 from Banana Peel.`)
    next = advanceTurn(next)
  } else if (item === 'greenShell') {
    next = drawCards(next, targetIndex, 1)
    cardsDrawn = 1
    targetPlayerId = next.players[targetIndex]?.id
    targetPlayerName = next.players[targetIndex]?.name
    next = addLog(next, `${targetPlayerName ?? 'A player'} drew 1 from Green Shell.`)
    next = advanceTurn(next)
  } else if (item === 'lightning') {
    next = drawForAllExcept(next, sourcePlayerId, 1, 'Lightning')
    cardsDrawn = Math.max(0, next.players.length - 1)
    next = addLog(next, `${source?.name ?? 'The player'} takes another turn after Lightning.`)
  } else {
    next = drawCards(next, sourceIndex, 2)
    cardsDrawn = 2
    targetPlayerId = source?.id
    targetPlayerName = source?.name
    next.activeColor = choice.color ?? chooseColorFromHand(source?.hand ?? [], COLORS)
    next = addLog(next, `${source?.name ?? 'The player'} drew 2 from Bob-omb and kept ${colorLabel(next.activeColor)} active.`)
    next = advanceTurn(next)
  }

  next = {
    ...next,
    marioKartEvent: {
      playerId: sourcePlayerId,
      playerName: source?.name ?? 'A player',
      item,
      revealedCardLabel: revealed.label,
      targetPlayerId,
      targetPlayerName,
      cardsDrawn,
      color: next.activeColor,
      sequence: next.nextLogId,
    },
  }
  return { state: next, sound: 'wild' }
}

function marioKartItemForCard(card: Card): MarioKartItem {
  if (card.color === 'red') return 'mushroom'
  if (card.color === 'yellow') return 'banana'
  if (card.color === 'green') return 'greenShell'
  if (card.color === 'blue') return 'lightning'
  return 'bobomb'
}

function marioKartTargetIndex(state: GameState, sourceIndex: number, targetPlayerId?: string): number {
  const chosen = targetPlayerId ? playerIndexById(state, targetPlayerId) : -1
  if (chosen >= 0 && chosen !== sourceIndex) return chosen
  return indexFrom(state, sourceIndex, 1)
}

function marioKartItemLabel(item: MarioKartItem): string {
  if (item === 'greenShell') return 'Green Shell'
  if (item === 'bobomb') return 'Bob-omb'
  return item === 'mushroom' ? 'Mushroom' : item === 'banana' ? 'Banana Peel' : 'Lightning'
}

function applyWildJackpot(state: GameState, sourcePlayerId: string, forcedRule?: WildJackpotRule): { state: GameState; sound?: SoundCue } {
  const sourceIndex = playerIndexById(state, sourcePlayerId)
  const source = state.players[sourceIndex]
  const color = state.activeColor ?? COLORS[Math.floor(Math.random() * COLORS.length)]
  const rule = forcedRule ?? WILD_JACKPOT_RULES[Math.floor(Math.random() * WILD_JACKPOT_RULES.length)]
  let next: GameState = {
    ...state,
    wildJackpotEvent: {
      playerId: sourcePlayerId,
      playerName: source?.name ?? 'A player',
      rule,
      color,
      sequence: state.nextLogId,
    },
  }
  next = addLog(next, `Wild Jackpot roller: ${wildJackpotRuleLabel(rule)}.`)

  if (rule === 'draw1' || rule === 'draw2' || rule === 'draw4') {
    const amount = rule === 'draw1' ? 1 : rule === 'draw2' ? 2 : 4
    const targetIndex = nextIndex(next)
    next = applyImmediateDraw(next, targetIndex, amount)
    next = addLog(next, `${next.players[targetIndex]?.name ?? 'Next player'} drew ${amount} from the Wild Jackpot roller.`)
    next = advanceTurn(next, 2)
    return { state: next, sound: 'wild' }
  }

  if (rule === 'allDraw1') {
    next = drawForAllExcept(next, sourcePlayerId, 1, 'Wild Jackpot')
    next = advanceTurn(next)
    return { state: next, sound: 'wild' }
  }

  if (rule === 'skip') {
    next = addLog(next, `${next.players[nextIndex(next)]?.name ?? 'Next player'} was skipped by Wild Jackpot.`)
    next = advanceTurn(next, 2)
    return { state: next, sound: 'skip' }
  }

  if (rule === 'reverse') {
    next = reverseDirection(next)
    next = advanceTurn(next, next.players.length === 2 ? 2 : 1)
    return { state: next, sound: 'reverse' }
  }

  if (rule === 'discardColor') {
    next = discardAllColor(next, sourcePlayerId, color)
    next = finishRoundIfPlayerIsOut(next)
    if (next.winnerId) return { state: next, sound: 'win' }
    next = advanceTurn(next)
    return { state: next, sound: 'wild' }
  }

  next = addLog(next, `${source?.name ?? 'The player'} plays again after Wild Jackpot.`)
  return { state: clearTurnFlags(next), sound: 'wild' }
}

function applyBlastUnit(state: GameState, card: Card, sourcePlayerId: string, forcedRoll?: number): { state: GameState; sound?: SoundCue } {
  const sourceIndex = playerIndexById(state, sourcePlayerId)
  const source = state.players[sourceIndex]
  if (!source) return { state }

  const previousPressure = state.blastChamber ?? 0
  const playedCardPressure = 1
  const chamberSize = previousPressure + playedCardPressure
  const forced = card.kind === 'blast'
  const chance = blastFireChance(chamberSize)
  const roll = forcedRoll ?? Math.random()
  const fired = forced || roll < chance
  const baseEvent: BlastEvent = {
    playerId: sourcePlayerId,
    playerName: source.name,
    previousPressure,
    playedCardPressure,
    chamberSize,
    cardsDrawn: 0,
    pressureAfter: fired ? 0 : chamberSize,
    fired,
    forced,
    sequence: state.nextLogId,
  }

  if (!fired) {
    return {
      state: addLog(
        {
          ...state,
          blastChamber: chamberSize,
          blastEvent: baseEvent,
        },
        `Blast unit loaded ${chamberSize} pressure card${chamberSize === 1 ? '' : 's'} and stayed quiet.`,
      ),
      sound: card.color === 'wild' ? 'wild' : 'play',
    }
  }

  const before = source.hand.length
  let next = drawCards(
    {
      ...state,
      blastChamber: 0,
      blastEvent: {
        ...baseEvent,
        cardsDrawn: chamberSize,
      },
    },
    sourceIndex,
    chamberSize,
  )
  const drawn = Math.max(0, (next.players[sourceIndex]?.hand.length ?? before) - before)
  next = {
    ...next,
    blastChamber: 0,
    blastEvent: {
      ...baseEvent,
      cardsDrawn: drawn,
    },
  }
  return {
    state: addLog(next, `Blast unit fired; ${source.name} took ${drawn} card${drawn === 1 ? '' : 's'}.`),
    sound: 'launcher',
  }
}

function blastFireChance(chamberSize: number): number {
  return Math.min(0.45, 0.15 + Math.max(0, chamberSize - 1) * 0.05)
}

function applyRobotoUnit(state: GameState, card: Card, sourcePlayerId: string, forcedRoll?: number, forcedCommand?: RobotoCommand): { state: GameState; sound?: SoundCue } {
  if (state.pendingDraw || state.pendingDare) return { state }
  const sourceIndex = playerIndexById(state, sourcePlayerId)
  const source = state.players[sourceIndex]
  if (!source) return { state }

  const forced = card.kind === 'wildRoboto'
  const roll = forcedRoll ?? Math.random()
  if (!forced && roll >= 0.18) {
    return { state: { ...state, robotoEvent: null } }
  }

  const command = forcedCommand ?? ROBOTO_COMMANDS[Math.floor(Math.random() * ROBOTO_COMMANDS.length)]
  return resolveRobotoCommand(state, sourcePlayerId, command, forced)
}

function resolveRobotoCommand(state: GameState, sourcePlayerId: string, command: RobotoCommand, forced: boolean): { state: GameState; sound?: SoundCue } {
  const sourceIndex = playerIndexById(state, sourcePlayerId)
  const source = state.players[sourceIndex]
  if (!source) return { state }

  let next: GameState = {
    ...state,
    robotoEvent: {
      playerId: sourcePlayerId,
      playerName: source.name,
      command,
      color: state.activeColor,
      cardsMoved: 0,
      forced,
      sequence: state.nextLogId,
    },
  }

  if (command === 'nextDraw2') {
    const targetIndex = next.activePlayerIndex
    const target = next.players[targetIndex]
    const before = target?.hand.length ?? 0
    next = drawCards(next, targetIndex, 2)
    const drawn = Math.max(0, (next.players[targetIndex]?.hand.length ?? before) - before)
    next.robotoEvent = {
      ...next.robotoEvent!,
      targetPlayerId: target?.id,
      targetPlayerName: target?.name,
      cardsMoved: drawn,
    }
    next = addLog(next, `Roboto command: ${target?.name ?? 'next player'} draws ${drawn} and loses the turn.`)
    return { state: advanceTurn(next), sound: 'flash' }
  }

  if (command === 'sourceDraw2') {
    const before = source.hand.length
    next = drawCards(next, sourceIndex, 2)
    const drawn = Math.max(0, (next.players[sourceIndex]?.hand.length ?? before) - before)
    next.robotoEvent = {
      ...next.robotoEvent!,
      targetPlayerId: source.id,
      targetPlayerName: source.name,
      cardsMoved: drawn,
    }
    return { state: addLog(next, `Roboto command: ${source.name} draws ${drawn}.`), sound: 'flash' }
  }

  if (command === 'allOthersDraw1') {
    const beforeCounts = new Map(next.players.map((player) => [player.id, player.hand.length]))
    next = drawForAllExcept(next, sourcePlayerId, 1, 'Roboto')
    const moved = next.players
      .filter((player) => player.id !== sourcePlayerId)
      .reduce((total, player) => total + Math.max(0, player.hand.length - (beforeCounts.get(player.id) ?? player.hand.length)), 0)
    next.robotoEvent = { ...next.robotoEvent!, cardsMoved: moved }
    return { state: next, sound: 'flash' }
  }

  if (command === 'discardActiveColor') {
    const before = source.hand.length
    if (next.activeColor) next = discardAllColor(next, sourcePlayerId, next.activeColor)
    const discarded = Math.max(0, before - (next.players[sourceIndex]?.hand.length ?? before))
    next.robotoEvent = {
      ...next.robotoEvent!,
      targetPlayerId: source.id,
      targetPlayerName: source.name,
      cardsMoved: discarded,
    }
    next = addLog(next, `Roboto command: ${source.name} discards ${discarded} ${colorLabel(next.activeColor)} card${discarded === 1 ? '' : 's'}.`)
    next = finishRoundIfPlayerIsOut(next)
    return { state: next, sound: next.winnerId ? 'win' : 'flash' }
  }

  if (command === 'reverse') {
    next = reverseDirection(next)
    next = addLog(next, 'Roboto command: direction reverses.')
    return { state: next, sound: 'reverse' }
  }

  next = setActivePlayer(next, sourceIndex)
  next = addLog(next, `Roboto command: ${source.name} plays again.`)
  return { state: clearTurnFlags(next), sound: 'flash' }
}

function wildJackpotRuleLabel(rule: WildJackpotRule): string {
  switch (rule) {
    case 'draw1':
      return 'next player draws 1'
    case 'draw2':
      return 'next player draws 2'
    case 'draw4':
      return 'next player draws 4'
    case 'allDraw1':
      return 'all other players draw 1'
    case 'skip':
      return 'skip the next player'
    case 'reverse':
      return 'reverse direction'
    case 'discardColor':
      return 'discard all chosen-color cards'
    case 'playAgain':
      return 'play again'
  }
}

function applyPointTaken(state: GameState, sourcePlayerId: string): GameState {
  let next = state
  const candidates = next.players.map((player, index) => ({ player, index })).filter(({ player }) => player.id !== sourcePlayerId)
  if (candidates.length === 0) return next
  const target = candidates[Math.floor(Math.random() * candidates.length)]
  const amount = Math.min(5, Math.max(1, Math.floor(Math.random() * Math.min(5, next.players.length)) + 1))
  next = drawCards(next, target.index, amount)
  return addLog(next, `Point Taken: ${target.player.name} drew ${amount} card${amount === 1 ? '' : 's'}.`)
}

function setPartyLink(state: GameState, firstId: string, secondId: string): GameState {
  const first = state.players.find((player) => player.id === firstId)
  const second = state.players.find((player) => player.id === secondId)
  if (!first || !second || first.id === second.id) return state
  const link: PartyLink = { playerIds: [first.id, second.id], sequence: state.nextLogId }
  return addLog({ ...state, partyLink: link }, `Drawn Together linked ${first.name} and ${second.name}.`)
}

function mirrorPartyLinkDraw(state: GameState, playerIndex: number, amount: number, mirroredFromPlayerId?: string): GameState {
  if (state.config.game !== 'party' || !state.partyLink || amount <= 0) return state
  const player = state.players[playerIndex]
  if (!player || mirroredFromPlayerId === player.id) return state
  const linkedIds = state.partyLink.playerIds
  if (!linkedIds.includes(player.id)) return state
  const partnerId = linkedIds.find((id) => id !== player.id)
  const partnerIndex = state.players.findIndex((entry) => entry.id === partnerId)
  if (partnerIndex < 0 || state.players[partnerIndex].id === mirroredFromPlayerId) return state
  let next = state
  for (let count = 0; count < amount; count += 1) {
    const drawn = drawSingleCard(next, partnerIndex)
    next = drawn.state
    if (!drawn.card) break
  }
  return addLog(next, `Drawn Together also made ${next.players[partnerIndex].name} draw ${amount}.`)
}

function applyPartyPileUp(state: GameState, startIndex: number, color: UnoColor | null): GameState {
  let next = cloneState(state)
  const pileColor = color ?? COLORS[Math.floor(Math.random() * COLORS.length)]
  let pileSize = 1
  let index = startIndex
  for (let steps = 0; steps < next.players.length * 2; steps += 1) {
    const player = next.players[index]
    const cardIndex = player.hand.findIndex((card) => card.color === pileColor)
    if (cardIndex < 0) {
      next = drawCards(next, index, pileSize)
      next.partyPileEvent = {
        loserPlayerId: player.id,
        loserPlayerName: player.name,
        color: pileColor,
        pileSize,
        sequence: next.nextLogId,
      }
      return addLog(next, `Pile Up ended on ${player.name}; they took ${pileSize} ${colorLabel(pileColor)} pile card${pileSize === 1 ? '' : 's'}.`)
    }
    const [card] = player.hand.splice(cardIndex, 1)
    next.discardPile.push(card)
    pileSize += 1
    index = indexFrom(next, index, 1)
  }
  return addLog(next, `Pile Up cleared after ${pileSize - 1} matching cards.`)
}

const SPIN_ACTIONS: SpinWheelAction[] = [
  'almostUno',
  'discardNumber',
  'discardColor',
  'colorDraw',
  'wildColorDraw',
  'tradeHands',
  'showHand',
  'war',
  'unoSpin',
]

function applySpinWheel(state: GameState, playerIndex: number): GameState {
  const player = state.players[playerIndex]
  if (!player) return state
  const action = SPIN_ACTIONS[Math.floor(Math.random() * SPIN_ACTIONS.length)]
  let next = addLog(state, `Spin Wheel: ${spinActionLabel(action)} for ${player.name}.`)

  switch (action) {
    case 'almostUno':
      next = spinAlmostUno(next, playerIndex)
      break
    case 'discardNumber':
      next = spinDiscardNumber(next, playerIndex)
      break
    case 'discardColor':
      next = spinDiscardColor(next, playerIndex)
      break
    case 'colorDraw': {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      next = drawUntilColor(next, playerIndex, color)
      next = setSpinEvent(next, action, playerIndex, `Draw until ${colorLabel(color)}.`, color)
      return next
    }
    case 'wildColorDraw': {
      const color = chooseColorFromHand(player.hand, COLORS)
      next = drawUntilColor(next, playerIndex, color)
      next = setSpinEvent(next, action, playerIndex, `Named ${colorLabel(color)}.`, color)
      return next
    }
    case 'tradeHands':
      next = passHandsLeft(next)
      next = setSpinEvent(next, action, playerIndex, 'All hands passed left.')
      return markOneCardHandsSafe(next)
    case 'showHand':
      next = addLog(next, `${player.name} showed their hand.`)
      next = setSpinEvent(next, action, playerIndex, `${player.hand.length} cards shown.`)
      return next
    case 'war':
      next = spinWar(next)
      break
    case 'unoSpin':
      next = spinUnoSpin(next)
      break
  }

  return markOneCardHandsSafe(next)
}

function spinAlmostUno(state: GameState, playerIndex: number): GameState {
  const next = cloneState(state)
  const player = next.players[playerIndex]
  if (!player || player.hand.length <= 2) {
    return setSpinEvent(addLog(next, `${player?.name ?? 'A player'} already had two or fewer cards.`), 'almostUno', playerIndex, 'No discard needed.')
  }
  let discarded = 0
  while (player.hand.length > 2) {
    const index = indexOfHighestPointCard(player.hand)
    const [card] = player.hand.splice(index, 1)
    next.discardPile.push(card)
    if (card.color !== 'wild') next.activeColor = card.color
    discarded += 1
  }
  return setSpinEvent(addLog(next, `${player.name} discarded ${discarded} cards down to Almost UNO.`), 'almostUno', playerIndex, `${discarded} cards discarded.`)
}

function spinDiscardNumber(state: GameState, playerIndex: number): GameState {
  const player = state.players[playerIndex]
  const value = bestNumberValue(player?.hand ?? [])
  if (typeof value !== 'number') {
    return setSpinEvent(addLog(state, `${player?.name ?? 'A player'} had no number cards to discard.`), 'discardNumber', playerIndex, 'No number cards.')
  }
  const next = discardMatchingCards(state, playerIndex, (card) => card.kind === 'number' && card.value === value)
  return setSpinEvent(addLog(next, `${next.players[playerIndex].name} discarded all ${value}s from the Spin Wheel.`), 'discardNumber', playerIndex, `Discarded number ${value}.`)
}

function spinDiscardColor(state: GameState, playerIndex: number): GameState {
  const player = state.players[playerIndex]
  const color = bestColor(player?.hand ?? [])
  if (!color) {
    return setSpinEvent(addLog(state, `${player?.name ?? 'A player'} had no colored cards to discard.`), 'discardColor', playerIndex, 'No colored cards.')
  }
  const next = discardMatchingCards(state, playerIndex, (card) => card.color === color)
  return setSpinEvent(addLog(next, `${next.players[playerIndex].name} discarded all ${colorLabel(color)} cards from the Spin Wheel.`), 'discardColor', playerIndex, `Discarded ${colorLabel(color)}.`, color)
}

function spinWar(state: GameState): GameState {
  const candidates = state.players
    .map((player, index) => ({ player, index, values: numberValuesDescending(player.hand) }))
    .filter((entry) => entry.values.length > 0)
  if (candidates.length === 0) {
    return setSpinEvent(addLog(state, 'Spin War found no number cards.'), 'war', state.activePlayerIndex, 'No number cards.')
  }
  candidates.sort((a, b) => compareNumberValues(b.values, a.values))
  const winner = candidates[0]
  const winningValue = winner.values[0]
  const next = discardMatchingCards(state, winner.index, (card) => card.kind === 'number' && card.value === winningValue, 1)
  return setSpinEvent(addLog(next, `${winner.player.name} won Spin War with ${winningValue} and discarded it.`), 'war', winner.index, `Winner: ${winner.player.name} (${winningValue}).`)
}

function spinUnoSpin(state: GameState): GameState {
  const candidates = state.players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => player.hand.length > 0)
  const winner = candidates[Math.floor(Math.random() * candidates.length)]
  if (!winner) {
    return setSpinEvent(addLog(state, 'UNO Spin had no available card to discard.'), 'unoSpin', state.activePlayerIndex, 'No cards available.')
  }
  const next = discardMatchingCards(state, winner.index, (_, index) => index === indexOfHighestPointCard(winner.player.hand), 1)
  return setSpinEvent(addLog(next, `${winner.player.name} shouted UNO Spin first and discarded a card.`), 'unoSpin', winner.index, `${winner.player.name} discarded 1 card.`)
}

function discardMatchingCards(
  state: GameState,
  playerIndex: number,
  predicate: (card: Card, index: number) => boolean,
  limit = Number.POSITIVE_INFINITY,
): GameState {
  const next = cloneState(state)
  const player = next.players[playerIndex]
  if (!player) return next
  let discarded = 0
  for (let index = player.hand.length - 1; index >= 0; index -= 1) {
    if (discarded >= limit) break
    const card = player.hand[index]
    if (!predicate(card, index)) continue
    const [removed] = player.hand.splice(index, 1)
    next.discardPile.push(removed)
    if (removed.color !== 'wild') next.activeColor = removed.color
    discarded += 1
  }
  return next
}

function bestNumberValue(cards: Card[]): number | null {
  const counts = new Map<number, { count: number; points: number }>()
  for (const card of cards) {
    if (card.kind !== 'number' || typeof card.value !== 'number') continue
    const current = counts.get(card.value) ?? { count: 0, points: 0 }
    counts.set(card.value, { count: current.count + 1, points: current.points + card.points })
  }
  return [...counts.entries()].sort((a, b) => b[1].count - a[1].count || b[1].points - a[1].points || b[0] - a[0])[0]?.[0] ?? null
}

function bestColor(cards: Card[]): UnoColor | null {
  const counts = new Map<UnoColor, { count: number; points: number }>()
  for (const card of cards) {
    if (card.color === 'wild') continue
    const current = counts.get(card.color) ?? { count: 0, points: 0 }
    counts.set(card.color, { count: current.count + 1, points: current.points + card.points })
  }
  return [...counts.entries()].sort((a, b) => b[1].count - a[1].count || b[1].points - a[1].points)[0]?.[0] ?? null
}

function numberValuesDescending(cards: Card[]): number[] {
  return cards
    .filter((card) => card.kind === 'number' && typeof card.value === 'number')
    .map((card) => card.value!)
    .sort((a, b) => b - a)
}

function compareNumberValues(a: number[], b: number[]): number {
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    const diff = (a[index] ?? -1) - (b[index] ?? -1)
    if (diff !== 0) return diff
  }
  return 0
}

function passHandsLeft(state: GameState): GameState {
  const next = cloneState(state)
  const hands = next.players.map((player) => player.hand)
  for (let index = 0; index < next.players.length; index += 1) {
    const from = (index - 1 + next.players.length) % next.players.length
    next.players[index].hand = hands[from]
  }
  return addLog(next, 'Everyone passed hands to the left from the Spin Wheel.')
}

function markOneCardHandsSafe(state: GameState): GameState {
  const next = cloneState(state)
  for (const player of next.players) {
    if (player.hand.length === 1) player.unoSafe = true
  }
  return next
}

function setSpinEvent(
  state: GameState,
  action: SpinWheelAction,
  playerIndex: number,
  detail: string,
  color?: UnoColor,
): GameState {
  const player = state.players[playerIndex] ?? activePlayer(state)
  return {
    ...state,
    spinEvent: {
      action,
      targetPlayerId: player.id,
      targetPlayerName: player.name,
      detail,
      color,
      sequence: state.nextLogId,
    },
  }
}

function spinActionLabel(action: SpinWheelAction): string {
  const labels: Record<SpinWheelAction, string> = {
    almostUno: 'Almost UNO',
    discardNumber: 'Discard Number',
    discardColor: 'Discard Color',
    colorDraw: 'Color Draw',
    wildColorDraw: 'Wild Color Draw',
    tradeHands: 'Trade Hands',
    showHand: 'Show Hand',
    war: 'War',
    unoSpin: 'UNO Spin',
  }
  return labels[action]
}

const WHIRLPOOL_COMMANDS: WhirlpoolCommand[] = [
  'drawH2O',
  'wipeout',
  'waveLeft',
  'waveRight',
  'give1',
  'discard2',
  'draw2',
  'draw3',
]

function applyH2OSplashTrigger(state: GameState, card: Card, sourcePlayerId: string): GameState {
  if (!isH2OSplash(state.config) || !triggersWhirlpool(card)) return state
  const targetIndex = nextIndex(state)
  const command = randomWhirlpoolCommand()
  return finishRoundIfPlayerIsOut(applyWhirlpoolCommand(state, targetIndex, sourcePlayerId, command))
}

function triggersWhirlpool(card: Card): boolean {
  return (
    (card.kind === 'number' && (card.value === 0 || card.value === 2)) ||
    card.kind === 'wildDownpour1' ||
    card.kind === 'wildDownpour2'
  )
}

function randomWhirlpoolCommand(exclude?: WhirlpoolCommand): WhirlpoolCommand {
  const commands = exclude ? WHIRLPOOL_COMMANDS.filter((command) => command !== exclude) : WHIRLPOOL_COMMANDS
  return commands[Math.floor(Math.random() * commands.length)]
}

function applyWhirlpoolCommand(
  state: GameState,
  playerIndex: number,
  sourcePlayerId: string,
  command: WhirlpoolCommand,
  chain: WhirlpoolCommand[] = [],
): GameState {
  const player = state.players[playerIndex]
  if (!player) return state
  let next = addLog(state, `Whirlpool: ${whirlpoolCommandLabel(command)} for ${player.name}.`)
  next = setWhirlpoolEvent(next, player, command, chain)

  switch (command) {
    case 'drawH2O':
      return drawUntilH2OMatch(next, playerIndex)
    case 'wipeout': {
      next = reverseDirection(next)
      const sourceIndex = playerIndexById(next, sourcePlayerId)
      return applyWhirlpoolCommand(next, sourceIndex, sourcePlayerId, randomWhirlpoolCommand('wipeout'), [...chain, command])
    }
    case 'waveLeft':
      return addLog(next, `${player.name} privately showed one card to ${neighborName(next, playerIndex, -1)}.`)
    case 'waveRight':
      return addLog(next, `${player.name} privately showed one card to ${neighborName(next, playerIndex, 1)}.`)
    case 'give1':
      return giveOneCard(next, playerIndex)
    case 'discard2':
      return discardAnyTwo(next, playerIndex)
    case 'draw2':
      return drawCards(next, playerIndex, 2)
    case 'draw3':
      return drawCards(next, playerIndex, 3)
  }
}

function setWhirlpoolEvent(state: GameState, player: Player, command: WhirlpoolCommand, chain: WhirlpoolCommand[]): GameState {
  return {
    ...state,
    whirlpoolEvent: {
      command,
      targetPlayerId: player.id,
      targetPlayerName: player.name,
      chain: [...chain, command],
      sequence: state.nextLogId,
    },
  }
}

function whirlpoolCommandLabel(command: WhirlpoolCommand): string {
  const labels: Record<WhirlpoolCommand, string> = {
    drawH2O: 'Draw H2O',
    wipeout: 'Wipeout',
    waveLeft: 'Wave Left',
    waveRight: 'Wave Right',
    give1: 'Give 1',
    discard2: 'Discard 2',
    draw2: 'Draw 2',
    draw3: 'Draw 3',
  }
  return labels[command]
}

function drawUntilH2OMatch(state: GameState, playerIndex: number): GameState {
  let next = state
  let drawn = 0
  while (true) {
    const result = drawSingleCard(next, playerIndex)
    next = result.state
    if (!result.card) break
    drawn += 1
    if (result.card.color === 'blue' || result.card.color === 'wild' || result.card.value === 0 || result.card.value === 2) break
  }
  return addLog(next, `${next.players[playerIndex].name} drew ${drawn} card${drawn === 1 ? '' : 's'} for Draw H2O.`)
}

function neighborName(state: GameState, playerIndex: number, direction: 1 | -1): string {
  const neighborIndex = (playerIndex + direction + state.players.length) % state.players.length
  return state.players[neighborIndex]?.name ?? 'another player'
}

function giveOneCard(state: GameState, playerIndex: number): GameState {
  const next = cloneState(state)
  const giver = next.players[playerIndex]
  if (!giver || giver.hand.length === 0) return addLog(next, `${giver?.name ?? 'A player'} had no card to give.`)
  const receiver = next.players
    .map((player, index) => ({ player, index }))
    .filter(({ index }) => index !== playerIndex)
    .sort((a, b) => a.player.hand.length - b.player.hand.length)[0]
  if (!receiver) return next
  const cardIndex = indexOfHighestPointCard(giver.hand)
  const [card] = giver.hand.splice(cardIndex, 1)
  receiver.player.hand.push(card)
  return addLog(next, `${giver.name} gave 1 card to ${receiver.player.name}.`)
}

function discardAnyTwo(state: GameState, playerIndex: number): GameState {
  const next = cloneState(state)
  const player = next.players[playerIndex]
  if (!player || player.hand.length === 0) return addLog(next, `${player?.name ?? 'A player'} had no cards to discard.`)
  const count = Math.min(2, player.hand.length)
  for (let index = 0; index < count; index += 1) {
    const cardIndex = indexOfHighestPointCard(player.hand)
    const [card] = player.hand.splice(cardIndex, 1)
    next.discardPile.push(card)
    if (card.color !== 'wild') next.activeColor = card.color
  }
  return addLog(next, `${player.name} discarded ${count} card${count === 1 ? '' : 's'} from the Whirlpool.`)
}

function indexOfHighestPointCard(cards: Card[]): number {
  return cards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => b.card.points - a.card.points)[0]?.index ?? 0
}

function finishRoundIfPlayerIsOut(state: GameState): GameState {
  if (state.winnerId) return state
  const winner = state.players.find((player) => player.hand.length === 0)
  return winner ? finishRound(state, winner.id) : state
}

function applyNoMercyEliminations(state: GameState, sourcePlayerId?: string, preferredActiveIndex = state.activePlayerIndex): GameState {
  if (state.config.game !== 'noMercy' || state.winnerId) return state
  const eliminated = state.players.filter((player) => player.hand.length >= 25)
  if (eliminated.length === 0) return state

  let next = cloneState(state)
  const eliminatedIds = new Set(eliminated.map((player) => player.id))
  const eliminatedNames = eliminated.map((player) => player.name).join(', ')
  const source = sourcePlayerId ? next.players.find((player) => player.id === sourcePlayerId) : undefined
  if (source) {
    source.score += eliminated.filter((player) => player.id !== source.id).length * 250
  }

  next = addLog(next, `${eliminatedNames} hit 25 cards and was eliminated by the Mercy Rule.`)
  const survivors = next.players.filter((player) => !eliminatedIds.has(player.id))
  if (survivors.length <= 1) {
    const winner = survivors[0] ?? source ?? next.players[0]
    return winner ? finishRound(next, winner.id) : next
  }

  const preferredActiveId = next.players[preferredActiveIndex]?.id
  next.players = survivors
  const activeById = preferredActiveId ? next.players.findIndex((player) => player.id === preferredActiveId) : -1
  next.activePlayerIndex = activeById >= 0 ? activeById : Math.min(preferredActiveIndex, next.players.length - 1)
  if (!preferredActiveId || eliminatedIds.has(preferredActiveId)) {
    next.drewThisTurn = false
    next.drawnCardIdThisTurn = null
    next.mustPlayFromHand = false
    next.speedPlayColor = null
  }
  if (next.catchableUnoPlayerId && eliminatedIds.has(next.catchableUnoPlayerId)) next.catchableUnoPlayerId = null
  if (next.unoDeclaredPlayerId && eliminatedIds.has(next.unoDeclaredPlayerId)) next.unoDeclaredPlayerId = null
  return next
}

function flipGameSide(state: GameState): GameState {
  const side = state.flipSide === 'light' ? 'dark' : 'light'
  const next = cloneState(state)
  next.flipSide = side
  next.players = next.players.map((player) => ({ ...player, hand: player.hand.map((card) => applyFlipFace(card, side)) }))
  next.drawPile = next.drawPile.map((card) => applyFlipFace(card, side))
  next.discardPile = next.discardPile.map((card) => applyFlipFace(card, side))
  const top = next.discardPile[next.discardPile.length - 1]
  next.activeColor = top?.color === 'wild' ? randomColorForSide(side) : top?.color ?? null
  return addLog(next, `UNO Flip switched to the ${side === 'light' ? 'Light' : 'Dark'} Side.`)
}

function applyFlipFace(card: Card, side: 'light' | 'dark'): Card {
  if (!card.flipFaces) return { ...card }
  return { ...card, ...card.flipFaces[side] }
}

function randomColorForSide(side: 'light' | 'dark'): UnoColor {
  const colors = side === 'light' ? COLORS : DARK_COLORS
  return colors[Math.floor(Math.random() * colors.length)]
}

function hasBasePlayableCard(player: Player, state: GameState): boolean {
  return player.hand.some((card) => isBasePlayable(card, state))
}

function hasSpeedPlayCard(player: Player, state: GameState): boolean {
  return Boolean(state.activeColor && player.hand.some((card) => card.color === state.activeColor))
}

function pressLauncher(state: GameState, playerIndex: number, presses: number): GameState {
  let next = cloneState(state)
  const player = next.players[playerIndex]
  if (!player) return next

  let firedCards = 0
  for (let press = 0; press < presses; press += 1) {
    const burst = launcherBurst()
    if (burst > 0) {
      next = drawCards(next, playerIndex, burst)
      firedCards += burst
    }
  }

  if (firedCards === 0) {
    next = setLauncherEvent(next, playerIndex, presses, firedCards, 'press')
    return addLog(next, `${player.name} pressed the launcher ${presses} time${presses === 1 ? '' : 's'} and no cards fired.`)
  }
  next = setLauncherEvent(next, playerIndex, presses, firedCards, 'press')
  return addLog(next, `${player.name} pressed the launcher ${presses} time${presses === 1 ? '' : 's'} and took ${firedCards} cards.`)
}

function pressLauncherUntilFire(state: GameState, playerIndex: number): GameState {
  let next = cloneState(state)
  const player = next.players[playerIndex]
  if (!player) return next

  let presses = 0
  let firedCards = 0
  while (firedCards === 0 && presses < 8) {
    presses += 1
    const burst = launcherBurst()
    if (burst > 0) {
      next = drawCards(next, playerIndex, burst)
      firedCards = burst
    }
  }

  if (firedCards === 0) {
    next = drawCards(next, playerIndex, 2)
    firedCards = 2
  }
  next = setLauncherEvent(next, playerIndex, presses, firedCards, 'untilFire')
  return addLog(next, `${player.name} pressed until the launcher fired and took ${firedCards} cards.`)
}

function pressLauncherForAllExcept(state: GameState, sourcePlayerId: string): GameState {
  let next = state
  for (let index = 0; index < next.players.length; index += 1) {
    if (next.players[index].id !== sourcePlayerId) {
      next = pressLauncher(next, index, 1)
    }
  }
  return next
}

function applyFlashSlap(state: GameState, sourcePlayerId: string): GameState {
  const candidates = state.players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => player.id !== sourcePlayerId)
  const loser = candidates[Math.floor(Math.random() * candidates.length)]
  if (!loser) return state

  const next = drawCards(state, loser.index, 2)
  return addLog(setFlashEvent(next, 'slap', state.activePlayerIndex, loser.index, 2), `${loser.player.name} was last on SLAP and drew 2.`)
}

function setLauncherEvent(
  state: GameState,
  playerIndex: number,
  presses: number,
  cardsFired: number,
  mode: 'press' | 'untilFire',
): GameState {
  const player = state.players[playerIndex]
  if (!player) return state
  return {
    ...state,
    launcherEvent: {
      targetPlayerId: player.id,
      targetPlayerName: player.name,
      presses,
      cardsFired,
      mode,
      sequence: state.nextLogId,
    },
  }
}

function setFlashEvent(
  state: GameState,
  kind: 'selected' | 'skip' | 'slap' | 'timeout',
  activePlayerIndex: number,
  affectedPlayerIndex?: number,
  penaltyCards?: number,
): GameState {
  const active = state.players[activePlayerIndex] ?? activePlayer(state)
  const affected = typeof affectedPlayerIndex === 'number' ? state.players[affectedPlayerIndex] : undefined
  return {
    ...state,
    flashEvent: {
      kind,
      activePlayerId: active.id,
      activePlayerName: active.name,
      affectedPlayerId: affected?.id,
      affectedPlayerName: affected?.name,
      penaltyCards,
      sequence: state.nextLogId,
    },
  }
}

function launcherBurst(): number {
  const roll = Math.random()
  if (roll < 0.3) return 0
  if (roll < 0.62) return 2
  if (roll < 0.93) return 3
  return 4
}

function discardAllColor(state: GameState, playerId: string, color: UnoColor | 'wild'): GameState {
  if (color === 'wild') return state
  const next = cloneState(state)
  const player = next.players.find((entry) => entry.id === playerId)
  if (!player) return next
  const matching = player.hand.filter((card) => card.color === color)
  const top = next.discardPile.pop()
  for (const card of matching) {
    const index = player.hand.findIndex((entry) => entry.id === card.id)
    if (index >= 0) next.discardPile.push(player.hand.splice(index, 1)[0])
  }
  if (top) next.discardPile.push(top)
  return addLog(next, `${player.name} discarded ${matching.length} extra ${colorLabel(color)} cards.`)
}

function playerIndexById(state: GameState, playerId: string): number {
  const index = state.players.findIndex((player) => player.id === playerId)
  return index >= 0 ? index : nextIndex(state)
}

function discardSpeedMatches(state: GameState, playerId: string, playedCard: Card): GameState {
  const next = cloneState(state)
  const player = next.players.find((entry) => entry.id === playerId)
  if (!player) return next
  const matching = player.hand.filter(
    (card) =>
      card.id !== playedCard.id &&
      (card.color === next.activeColor || (card.kind === 'number' && card.value === topCard(next).value)),
  )
  for (const card of matching) {
    const index = player.hand.findIndex((entry) => entry.id === card.id)
    if (index >= 0) {
      next.discardPile.push(player.hand.splice(index, 1)[0])
    }
  }
  return addLog(next, `${player.name} dumped ${matching.length} matching cards.`)
}

function lightningRound(state: GameState): GameState {
  let next = cloneState(state)
  for (let index = 0; index < next.players.length; index += 1) {
    const player = next.players[index]
    const cardIndex = player.hand.findIndex((card) => card.color === next.activeColor)
    if (cardIndex >= 0) {
      next.discardPile.push(player.hand.splice(cardIndex, 1)[0])
    } else {
      next = drawCards(next, index, 2)
    }
  }
  return addLog(next, `Lightning Round hit every player for ${colorLabel(next.activeColor)}.`)
}

function swapHands(state: GameState, firstId: string, secondId: string): GameState {
  const next = cloneState(state)
  const first = next.players.find((player) => player.id === firstId)
  const second = next.players.find((player) => player.id === secondId)
  if (first && second) {
    ;[first.hand, second.hand] = [second.hand, first.hand]
    return addLog(next, `${first.name} and ${second.name} swapped hands.`)
  }
  return next
}

function passHands(state: GameState): GameState {
  const next = cloneState(state)
  const hands = next.players.map((player) => player.hand)
  for (let index = 0; index < next.players.length; index += 1) {
    const from = (index - next.direction + next.players.length) % next.players.length
    next.players[index].hand = hands[from]
  }
  return addLog(next, 'Everyone passed hands in the current direction.')
}

function finishRound(state: GameState, winnerId: string): GameState {
  const next = cloneState(state)
  const winner = next.players.find((player) => player.id === winnerId)!
  if (next.config.game === 'zero') {
    for (const player of next.players) {
      if (player.zeroGrid) {
        player.zeroGrid = player.zeroGrid.map((slot) => ({ ...slot, faceUp: true }))
      }
      if (player.id !== winnerId) {
        player.score += zeroGridCards(player).reduce((sum, card) => sum + card.points, 0)
      }
    }
    next.winnerId = winnerId
    next.zeroTurn = { drawnCard: null, source: null }
    if (next.currentRound >= 9) {
      const lowest = [...next.players].sort((a, b) => a.score - b.score)[0]
      next.gameWinnerId = lowest.id
      return addLog(next, `${lowest.name} won the UNO Zero session with the lowest score.`)
    }
    return addLog(next, `${winner.name} revealed the grid and scored 0 for the round.`)
  }
  if (isH2OSplash(next.config)) {
    winner.score += 1
    next.winnerId = winnerId
    if (winner.score >= 3) {
      next.gameWinnerId = winnerId
    }
    return addLog(next, `${winner.name} won the Splash hand.`)
  }
  if (next.config.game === 'teams') {
    const winnerTeam = winner.teamId
    const gained = next.players
      .filter((player) => player.teamId !== winnerTeam)
      .flatMap((player) => player.hand)
      .reduce((sum, card) => sum + card.points, 0)
    for (const player of next.players) {
      if (player.teamId === winnerTeam) player.score += gained
    }
    next.winnerId = winnerId
    if (winner.score >= next.targetScore) {
      next.gameWinnerId = winnerId
    }
    return addLog(next, `${winner.name}'s team won the round and scored ${gained} points.`)
  }
  const gained = next.players
    .filter((player) => player.id !== winnerId)
    .flatMap((player) => player.hand)
    .reduce((sum, card) => sum + card.points, 0)
  winner.score += gained
  next.winnerId = winnerId
  if (winner.score >= next.targetScore) {
    next.gameWinnerId = winnerId
  }
  return addLog(next, `${winner.name} won the round and scored ${gained} points.`)
}

function isH2OSplash(config: GameConfig): boolean {
  return config.game === 'h2o' && config.h2oSplash
}

function teamPartner(state: GameState, playerId: string): Player | undefined {
  const player = state.players.find((entry) => entry.id === playerId)
  return player?.teamId ? state.players.find((entry) => entry.id !== playerId && entry.teamId === player.teamId) : undefined
}

function teamPartnerIndex(state: GameState, playerId: string): number {
  const player = state.players.find((entry) => entry.id === playerId)
  return player?.teamId ? state.players.findIndex((entry) => entry.id !== playerId && entry.teamId === player.teamId) : -1
}

function reverseDirection(state: GameState): GameState {
  return addLog({ ...state, direction: state.direction === 1 ? -1 : 1 }, 'Play direction reversed.')
}

function nextIndex(state: GameState, steps = 1): number {
  return indexFrom(state, state.activePlayerIndex, steps)
}

function indexFrom(state: GameState, startIndex: number, steps = 1): number {
  return (startIndex + steps * state.direction + state.players.length * 8) % state.players.length
}

function advanceTurn(state: GameState, steps = 1): GameState {
  if (state.config.game === 'flash') {
    const excludeIndex = steps > 1 ? state.activePlayerIndex : undefined
    const selectedIndex = selectFlashPlayerIndex(state, excludeIndex)
    return setFlashEvent(setActivePlayer(state, selectedIndex), 'selected', selectedIndex)
  }
  const moved = setActivePlayer(state, nextIndex(state, steps))
  return resolvePendingDareDropAllAdvance(state, moved, steps)
}

function resolvePendingDareDropAllAdvance(previous: GameState, moved: GameState, steps: number): GameState {
  const pending = previous.pendingDareDropAll
  if (!pending || previous.winnerId || moved.winnerId) return moved
  const previousActive = activePlayer(previous)
  const movedActive = activePlayer(moved)
  const disrupted = steps !== 1 || previous.direction !== pending.direction || Boolean(moved.pendingDraw || moved.pendingDare)
  if (disrupted) return cancelPendingDareDropAll(moved)
  if (!pending.armed) {
    if (movedActive.id !== pending.guardPlayerId) return cancelPendingDareDropAll(moved)
    return { ...moved, pendingDareDropAll: { ...pending, armed: true } }
  }
  if (previousActive.id === pending.guardPlayerId && movedActive.id === pending.targetPlayerId) {
    return dropAllAndFinishRound({ ...moved, pendingDareDropAll: null }, pending.targetPlayerId, 'The delayed Dare die result activated.')
  }
  return cancelPendingDareDropAll(moved)
}

function setActivePlayer(state: GameState, activePlayerIndex: number): GameState {
  return {
    ...state,
    activePlayerIndex,
    drewThisTurn: false,
    drawnCardIdThisTurn: null,
    mustPlayFromHand: false,
    speedPlayColor: null,
    unoDeclaredPlayerId: null,
    zeroTurn: isGridMemoryGame(state.config.game) ? { drawnCard: null, source: null } : state.zeroTurn,
  }
}

function selectFlashPlayerIndex(state: GameState, excludeIndex?: number): number {
  const candidates = state.players.map((_, index) => index).filter((index) => index !== excludeIndex)
  return candidates[Math.floor(Math.random() * candidates.length)] ?? state.activePlayerIndex
}

function clearTurnFlags(state: GameState): GameState {
  return {
    ...state,
    catchableUnoPlayerId: null,
    mustPlayFromHand: false,
    speedPlayColor: null,
    unoDeclaredPlayerId: null,
  }
}

function closeCatchWindow(state: GameState): GameState {
  return {
    ...state,
    catchableUnoPlayerId: null,
  }
}

function addLog(state: GameState, text: string): GameState {
  return {
    ...state,
    log: [{ id: state.nextLogId, text }, ...state.log].slice(0, 8),
    nextLogId: state.nextLogId + 1,
  }
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      hand: [...player.hand],
      phase10Melds: player.phase10Melds?.map((meld) => ({ ...meld, cards: meld.cards.map((card) => ({ ...card })) })),
      zeroGrid: player.zeroGrid?.map((slot) => ({ card: slot.card ? { ...slot.card } : null, faceUp: slot.faceUp, knownByPlayerIds: slot.knownByPlayerIds ? [...slot.knownByPlayerIds] : undefined })),
      skipBoStockPile: player.skipBoStockPile?.map((card) => ({ ...card })),
      skipBoDiscardPiles: player.skipBoDiscardPiles?.map((pile) => pile.map((card) => ({ ...card }))),
      passagePairs: player.passagePairs?.map((pair) => ({
        ...pair,
        cards: pair.cards.map((card) => ({ ...card })),
        wildDeclaration: pair.wildDeclaration ? { ...pair.wildDeclaration } : undefined,
      })),
    })),
    drawPile: [...state.drawPile],
    discardPile: [...state.discardPile],
    dosCenterRow: state.dosCenterRow?.map((card) => ({ ...card })),
    skipBoBuildPiles: state.skipBoBuildPiles?.map((pile) => pile.map((card) => ({ ...card }))),
    passageFaceUp: state.passageFaceUp ? { ...state.passageFaceUp } : null,
    passageSlot: state.passageSlot ? { ...state.passageSlot } : null,
    passageTurn: state.passageTurn ? {
      ...state.passageTurn,
      takenCard: state.passageTurn.takenCard ? { ...state.passageTurn.takenCard } : null,
    } : null,
    passageDiscardPile: state.passageDiscardPile?.map((card) => ({ ...card })),
    triplePlayPiles: state.triplePlayPiles?.map((pile) => ({
      ...pile,
      cards: pile.cards.map((card) => ({ ...card })),
    })),
    tippoTrays: state.tippoTrays?.map((tray) => ({
      ...tray,
      cards: tray.cards.map((card) => ({ ...card })),
    })),
    pendingDraw: state.pendingDraw ? { ...state.pendingDraw } : null,
    pendingDare: state.pendingDare ? { ...state.pendingDare } : null,
    pendingEmoji: state.pendingEmoji ? { ...state.pendingEmoji } : null,
    pendingDareDropAll: state.pendingDareDropAll ? { ...state.pendingDareDropAll } : null,
    whirlpoolEvent: state.whirlpoolEvent ? { ...state.whirlpoolEvent, chain: [...state.whirlpoolEvent.chain] } : null,
    launcherEvent: state.launcherEvent ? { ...state.launcherEvent } : null,
    flashEvent: state.flashEvent ? { ...state.flashEvent } : null,
    spinEvent: state.spinEvent ? { ...state.spinEvent } : null,
    dareEvent: state.dareEvent ? { ...state.dareEvent, affectedPlayerIds: [...state.dareEvent.affectedPlayerIds] } : null,
    partyLink: state.partyLink ? { ...state.partyLink, playerIds: [...state.partyLink.playerIds] as [string, string] } : null,
    partyPileEvent: state.partyPileEvent ? { ...state.partyPileEvent } : null,
    wildJackpotEvent: state.wildJackpotEvent ? { ...state.wildJackpotEvent } : null,
    blastEvent: state.blastEvent ? { ...state.blastEvent } : null,
    robotoEvent: state.robotoEvent ? { ...state.robotoEvent } : null,
    tippoEvent: state.tippoEvent ? { ...state.tippoEvent } : null,
    marioKartEvent: state.marioKartEvent ? { ...state.marioKartEvent } : null,
    justiceLeagueEvent: state.justiceLeagueEvent ? {
      ...state.justiceLeagueEvent,
      revealedCards: state.justiceLeagueEvent.revealedCards.map((entry) => ({ ...entry })),
      capturedCard: { ...state.justiceLeagueEvent.capturedCard },
      returnedCard: state.justiceLeagueEvent.returnedCard ? { ...state.justiceLeagueEvent.returnedCard } : null,
    } : null,
    webSwingEvent: state.webSwingEvent ? {
      ...state.webSwingEvent,
      capturedCard: { ...state.webSwingEvent.capturedCard },
      returnedCard: { ...state.webSwingEvent.returnedCard },
    } : null,
    turtlePowerEvent: state.turtlePowerEvent ? {
      ...state.turtlePowerEvent,
      passedCards: state.turtlePowerEvent.passedCards.map((entry) => ({ ...entry })),
    } : null,
    beamMeUpEvent: state.beamMeUpEvent ? {
      ...state.beamMeUpEvent,
      beamedCard: { ...state.beamMeUpEvent.beamedCard },
      replacementCard: state.beamMeUpEvent.replacementCard ? { ...state.beamMeUpEvent.replacementCard } : null,
    } : null,
    avatarStateEvent: state.avatarStateEvent ? {
      ...state.avatarStateEvent,
      revealedCards: state.avatarStateEvent.revealedCards.map((entry) => ({ ...entry })),
      keptCard: { ...state.avatarStateEvent.keptCard },
      returnedCards: state.avatarStateEvent.returnedCards.map((entry) => ({ ...entry })),
    } : null,
    creepyCoolEvent: state.creepyCoolEvent ? {
      ...state.creepyCoolEvent,
      revealedCards: state.creepyCoolEvent.revealedCards.map((entry) => ({ ...entry })),
    } : null,
    touchdownEvent: state.touchdownEvent ? {
      ...state.touchdownEvent,
      revealedCard: { ...state.touchdownEvent.revealedCard },
    } : null,
    memoryActionEvent: state.memoryActionEvent ? {
      ...state.memoryActionEvent,
      affectedPlayers: state.memoryActionEvent.affectedPlayers.map((entry) => ({ ...entry })),
    } : null,
    memoryBoard: state.memoryBoard ? {
      ...state.memoryBoard,
      slots: state.memoryBoard.slots.map((slot) => ({
        card: { ...slot.card },
        faceUp: slot.faceUp,
        collectedByPlayerId: slot.collectedByPlayerId ?? null,
        memoryActionKind: slot.memoryActionKind,
      })),
      selectedSlotIndexes: [...state.memoryBoard.selectedSlotIndexes],
      pendingMatchIndexes: state.memoryBoard.pendingMatchIndexes ? [...state.memoryBoard.pendingMatchIndexes] : null,
      pendingMatchPlayerId: state.memoryBoard.pendingMatchPlayerId ?? null,
      pendingMismatchIndexes: state.memoryBoard.pendingMismatchIndexes ? [...state.memoryBoard.pendingMismatchIndexes] : null,
    } : undefined,
    zeroTurn: state.zeroTurn ? { drawnCard: state.zeroTurn.drawnCard ? { ...state.zeroTurn.drawnCard } : null, source: state.zeroTurn.source } : null,
    pendingCaboPower: state.pendingCaboPower ? { ...state.pendingCaboPower, firstSlot: state.pendingCaboPower.firstSlot ? { ...state.pendingCaboPower.firstSlot } : undefined } : null,
    pendingLiarChallenge: state.pendingLiarChallenge ? { ...state.pendingLiarChallenge, claim: { ...state.pendingLiarChallenge.claim } } : null,
    log: [...state.log],
  }
}

export function chooseColorFromHand(hand: Card[], allowedColors: UnoColor[] = COLORS): UnoColor {
  const counts = new Map<UnoColor, number>(allowedColors.map((color) => [color, 0]))
  for (const card of hand) {
    if (card.color !== 'wild' && counts.has(card.color)) counts.set(card.color, (counts.get(card.color) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

export function legalTargets(state: GameState, includeCurrent = false): Player[] {
  const current = activePlayer(state)
  return state.players.filter((player) => includeCurrent || player.id !== current.id)
}

function availableTargetCount(state: GameState): number {
  return state.players.filter((player) => player.id !== activePlayer(state).id).length
}
