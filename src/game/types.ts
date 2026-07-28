export type UnoColor = 'red' | 'yellow' | 'green' | 'blue' | 'teal' | 'pink' | 'purple' | 'orange'
export type ActiveColor = UnoColor | null
export type GameVariant = 'classic' | 'extreme' | 'flash' | 'flip' | 'h2o' | 'spin' | 'zero' | 'flex' | 'liars' | 'party' | 'teams' | 'houseRules' | 'allWild' | 'challenge' | 'flipExtreme' | 'lotr' | 'cabo' | 'popCulture' | 'noMercy' | 'superMario' | 'sonic' | 'barbie' | 'motu' | 'tmnt' | 'spiderman' | 'dc' | 'starTrek' | 'avatar' | 'monsterHigh' | 'nfl' | 'triplePlay' | 'minecraft' | 'wildJackpot' | 'blast' | 'roboto' | 'tippo' | 'dice' | 'emoji' | 'marioKart' | 'skyjo' | 'dos' | 'phase10' | 'skipBo' | 'mahjong' | 'guoMemory' | 'guoMemoryAction' | 'guoTripleMemory' | 'guoTripleMemoryAction' | 'guoNeighborMatch' | 'guoUnoMahjong' | 'guoHiLo' | 'guoPassage' | 'quatro'
export type GameMode = 'single' | 'hotseat' | 'wifi' | 'spectacular'
export type AiDifficulty = 'easy' | 'medium' | 'hard'
export type AddOnPack = 'reverse' | 'stack' | 'speed' | 'swap'
export type TableTheme = 'classicGreen' | 'casinoNight' | 'lightWood' | 'oceanBlue' | 'royalRed'
export type DeckTheme = 'classicRider' | 'royalGold' | 'arcaneNight' | 'retroCarnival' | 'crystalLight'
export type AnimationSpeed = 'fast' | 'normal' | 'slow'
export type CardFlourishStyle = 'random' | 'fan' | 'cut' | 'faro' | 'pirouette' | 'spring' | 'waterfall' | 'dribble' | 'oneHanded'
export type AvatarId =
  | 'explorer'
  | 'teacher'
  | 'magician'
  | 'builder'
  | 'musician'
  | 'gardener'
  | 'pilot'
  | 'chef'
  | 'scientist'
  | 'artist'

export type CardKind =
  | 'number'
  | 'skip'
  | 'reverse'
  | 'draw2'
  | 'draw4'
  | 'wild'
  | 'wildDraw4'
  | 'wildDraw6'
  | 'wildDraw10'
  | 'wildReverseDraw4'
  | 'wildColorRoulette'
  | 'wildNoU'
  | 'reverseDraw2'
  | 'reverseSkip'
  | 'wildPowerReverse'
  | 'stack1'
  | 'stack2'
  | 'wildDraw3'
  | 'wildDrawMystery'
  | 'wildSpeedPlay'
  | 'wildDraw1SpeedPlay'
  | 'speedMatch'
  | 'wildLightningRound'
  | 'wildSwapHands'
  | 'targetedSwap'
  | 'passingSwap'
  | 'wildDraw2Swap'
  | 'hit2'
  | 'discardAll'
  | 'wildExtremeHit'
  | 'wildHitFire'
  | 'wildAllHit'
  | 'tradeHands'
  | 'slap'
  | 'flip'
  | 'draw1'
  | 'draw5'
  | 'skipEveryone'
  | 'wildDraw2'
  | 'wildDrawColor'
  | 'wildDownpour1'
  | 'wildDownpour2'
  | 'flexSkip'
  | 'flexReverse'
  | 'flexDraw2'
  | 'wildFlexDraw2'
  | 'wildAllFlip'
  | 'wildLiarChallenge'
  | 'pointTaken'
  | 'wildDrawnTogether'
  | 'wildPileUp'
  | 'wildReverse'
  | 'wildSkip'
  | 'wildSkipTwo'
  | 'wildTargetDraw2'
  | 'wildForcedSwap'
  | 'dare'
  | 'wildDare'
  | 'wildHuntRing'
  | 'wildSortingHat'
  | 'wildTheForce'
  | 'wildAvengersAssemble'
  | 'wildTrexAttack'
  | 'wildCreeper'
  | 'wildSuperStar'
  | 'wildVictoryLap'
  | 'wildPlayedTooMuch'
  | 'wildPowerOfGrayskull'
  | 'wildTurtlePower'
  | 'wildWebSwing'
  | 'wildJusticeLeague'
  | 'wildBeamMeUp'
  | 'wildAvatarState'
  | 'wildCreepyCool'
  | 'wildTouchdown'
  | 'triplePlayDiscardTwo'
  | 'wildClear'
  | 'wildGiveAway'
  | 'wildJackpot'
  | 'blast'
  | 'wildRoboto'
  | 'tippo'
  | 'wildEmoji'
  | 'wildItemBox'
  | 'wildDos'
  | 'wildNumber'

export interface CardFace {
  kind: CardKind
  color: UnoColor | 'wild'
  value?: number
  label: string
  points: number
}

export interface Card extends CardFace {
  id: string
  pack?: AddOnPack
  spin?: boolean
  flexFlip?: boolean
  flexPlayedMode?: 'normal' | 'flex'
  liar?: boolean
  liarFaceDown?: boolean
  liarClaim?: LiarClaim
  flipFaces?: {
    light: CardFace
    dark: CardFace
  }
}

export interface Player {
  id: string
  name: string
  type: 'human' | 'ai'
  aiDifficulty?: AiDifficulty
  hand: Card[]
  zeroGrid?: ZeroGridSlot[]
  score: number
  unoSafe: boolean
  avatarId: AvatarId
  flexPowerActive: boolean
  teamId?: string
  phase10Phase?: number
  phase10Completed?: boolean
  phase10Melds?: Phase10Meld[]
  skipBoStockPile?: Card[]
  skipBoDiscardPiles?: Card[][]
  passagePairs?: PassageScoredPair[]
}

export interface PassageScoredPair {
  cards: Card[]
  score: number
  wildDeclaration?: {
    color: UnoColor
    value: number
  }
}

export interface Phase10Meld {
  kind: 'set' | 'run' | 'color'
  cards: Card[]
  value?: number
  color?: UnoColor
  runStart?: number
  runEnd?: number
}

export interface ZeroGridSlot {
  card: Card | null
  faceUp: boolean
  knownByPlayerIds?: string[]
}

export interface ZeroTurn {
  drawnCard: Card | null
  source: 'draw' | 'discard' | 'reveal' | null
}

export type CaboPowerKind = 'peek' | 'spy' | 'swap'

export interface CaboGridSelection {
  playerId: string
  slotIndex: number
}

export interface PendingCaboPower {
  playerId: string
  kind: CaboPowerKind
  firstSlot?: CaboGridSelection
  sequence: number
}

export interface LiarClaim {
  kind: 'number' | 'skip' | 'reverse' | 'draw2' | 'wild'
  color: UnoColor | 'wild'
  value?: number
  label: string
}

export interface PendingLiarChallenge {
  sourcePlayerId: string
  cardId: string
  claim: LiarClaim
  targetPlayerId?: string
  previousColor: ActiveColor
  sequence: number
}

export interface PendingDraw {
  amount: number
  cardValue?: number
  sourcePlayerId: string
  sourceColor: ActiveColor
  canChallenge: boolean
}

export interface PendingDare {
  sourcePlayerId: string
  sequence: number
}

export interface PendingEmoji {
  sourcePlayerId: string
  targetPlayerId: string
  emoji: string
  sequence: number
}

export interface LogEntry {
  id: number
  text: string
}

export type WhirlpoolCommand =
  | 'drawH2O'
  | 'wipeout'
  | 'waveLeft'
  | 'waveRight'
  | 'give1'
  | 'discard2'
  | 'draw2'
  | 'draw3'

export interface WhirlpoolEvent {
  command: WhirlpoolCommand
  targetPlayerId: string
  targetPlayerName: string
  chain: WhirlpoolCommand[]
  sequence: number
}

export interface LauncherEvent {
  targetPlayerId: string
  targetPlayerName: string
  presses: number
  cardsFired: number
  mode: 'press' | 'untilFire'
  sequence: number
}

export interface FlashEvent {
  kind: 'selected' | 'skip' | 'slap' | 'timeout'
  activePlayerId: string
  activePlayerName: string
  affectedPlayerId?: string
  affectedPlayerName?: string
  penaltyCards?: number
  sequence: number
}

export type SpinWheelAction =
  | 'almostUno'
  | 'discardNumber'
  | 'discardColor'
  | 'colorDraw'
  | 'wildColorDraw'
  | 'tradeHands'
  | 'showHand'
  | 'war'
  | 'unoSpin'

export interface SpinEvent {
  action: SpinWheelAction
  targetPlayerId: string
  targetPlayerName: string
  detail: string
  color?: UnoColor
  sequence: number
}

export type DareDieResult =
  | 'draw4'
  | 'allOthersDrop4'
  | 'nextPlayerDropAll'
  | 'overNextPlayerDropAll'
  | 'drawToAction'
  | 'instantWin'

export interface DareEvent {
  rollerPlayerId: string
  rollerPlayerName: string
  dieRoll: number
  result: DareDieResult
  affectedPlayerIds: string[]
  sequence: number
}

export interface PendingDareDropAll {
  targetPlayerId: string
  guardPlayerId: string
  direction: 1 | -1
  armed: boolean
  sequence: number
}

export interface PartyLink {
  playerIds: [string, string]
  sequence: number
}

export interface PartyPileEvent {
  loserPlayerId: string
  loserPlayerName: string
  color: UnoColor
  pileSize: number
  sequence: number
}

export type WildJackpotRule =
  | 'draw1'
  | 'draw2'
  | 'draw4'
  | 'allDraw1'
  | 'skip'
  | 'reverse'
  | 'discardColor'
  | 'playAgain'

export interface WildJackpotEvent {
  playerId: string
  playerName: string
  rule: WildJackpotRule
  color: UnoColor
  sequence: number
}

export interface BlastEvent {
  playerId: string
  playerName: string
  previousPressure: number
  playedCardPressure: number
  chamberSize: number
  cardsDrawn: number
  pressureAfter: number
  fired: boolean
  forced: boolean
  sequence: number
}

export type RobotoCommand =
  | 'nextDraw2'
  | 'sourceDraw2'
  | 'allOthersDraw1'
  | 'discardActiveColor'
  | 'reverse'
  | 'playAgain'

export interface RobotoEvent {
  playerId: string
  playerName: string
  command: RobotoCommand
  targetPlayerId?: string
  targetPlayerName?: string
  color?: UnoColor | null
  cardsMoved: number
  forced: boolean
  sequence: number
}

export interface TippoEvent {
  playerId: string
  playerName: string
  trayIndex: number
  previousLoad: number
  playedCardLoad: number
  loadAfter: number
  cardsTaken: number
  tipped: boolean
  forced: boolean
  sequence: number
}

export type MarioKartItem = 'mushroom' | 'banana' | 'greenShell' | 'lightning' | 'bobomb'

export interface MarioKartEvent {
  playerId: string
  playerName: string
  item: MarioKartItem
  revealedCardLabel: string
  targetPlayerId?: string
  targetPlayerName?: string
  cardsDrawn: number
  color: ActiveColor
  sequence: number
}

export interface JusticeLeagueCardEvent {
  playerId: string
  playerName: string
  cardLabel: string
  cardColor: UnoColor | 'wild'
}

export interface JusticeLeagueEvent {
  sourcePlayerId: string
  sourcePlayerName: string
  targetPlayerId: string
  targetPlayerName: string
  revealedCards: JusticeLeagueCardEvent[]
  capturedCard: JusticeLeagueCardEvent
  returnedCard?: JusticeLeagueCardEvent | null
  sequence: number
}

export interface WebSwingEvent {
  sourcePlayerId: string
  sourcePlayerName: string
  targetPlayerId: string
  targetPlayerName: string
  capturedCard: JusticeLeagueCardEvent
  returnedCard: JusticeLeagueCardEvent
  sequence: number
}

export interface TurtlePowerPassedCard {
  sourcePlayerId: string
  sourcePlayerName: string
  targetPlayerId: string
  targetPlayerName: string
  cardLabel: string
  cardColor: UnoColor | 'wild'
}

export interface TurtlePowerEvent {
  direction: 1 | -1
  passedCards: TurtlePowerPassedCard[]
  sequence: number
}

export interface BeamMeUpEvent {
  sourcePlayerId: string
  sourcePlayerName: string
  targetPlayerId: string
  targetPlayerName: string
  beamedCard: JusticeLeagueCardEvent
  replacementCard?: JusticeLeagueCardEvent | null
  sequence: number
}

export interface AvatarStateEvent {
  sourcePlayerId: string
  sourcePlayerName: string
  revealedCards: JusticeLeagueCardEvent[]
  keptCard: JusticeLeagueCardEvent
  returnedCards: JusticeLeagueCardEvent[]
  sequence: number
}

export interface CreepyCoolRevealedCard extends JusticeLeagueCardEvent {
  discarded: boolean
}

export interface CreepyCoolEvent {
  sourcePlayerId: string
  sourcePlayerName: string
  activeColor: UnoColor | null
  revealedCards: CreepyCoolRevealedCard[]
  sequence: number
}

export interface TouchdownEvent {
  sourcePlayerId: string
  sourcePlayerName: string
  targetPlayerId: string
  targetPlayerName: string
  activeColor: UnoColor | null
  revealedCard: JusticeLeagueCardEvent
  success: boolean
  cardsDrawn: number
  sequence: number
}

export interface MemoryActionAffectedPlayer {
  playerId: string
  playerName: string
  deltaCards: number
}

export interface MemoryActionEvent {
  action: MemoryActionKind
  playerId: string
  playerName: string
  amount: number
  affectedPlayers: MemoryActionAffectedPlayer[]
  endedRound: boolean
  sequence: number
}

export interface TriplePlayPile {
  cards: Card[]
  activeColor: ActiveColor
  overload: number
  limit: number
  active: boolean
}

export interface TippoTray {
  cards: Card[]
  activeColor: ActiveColor
  load: number
  limit: number
}

export type MemoryMatchMode = 'number' | 'color' | 'both'
export type MemoryDifficulty = 'easy' | 'medium' | 'hard'
export type MemoryActionKind = 'wild' | 'loseCards' | 'earnCards' | 'allOthersLose' | 'allOthersEarn' | 'loseAll' | 'winnerTakesAll'

export interface MemorySlot {
  card: Card
  faceUp: boolean
  collectedByPlayerId?: string | null
  memoryActionKind?: MemoryActionKind
}

export interface MemoryBoard {
  slots: MemorySlot[]
  rows: number
  columns: number
  cardsPerMatch: number
  matchMode: MemoryMatchMode
  selectedSlotIndexes: number[]
  pendingMatchIndexes?: number[] | null
  pendingMatchPlayerId?: string | null
  pendingMismatchIndexes?: number[] | null
  revealDurationMs: number
}

export type PassageTakeSource = 'faceUp' | 'passage' | 'draw'
export type PassagePhase = 'take' | 'pair' | 'pass'

export interface PassageTurn {
  phase: PassagePhase
  takenCard?: Card | null
  source?: PassageTakeSource | null
}

export interface GameConfig {
  game: GameVariant
  mode: GameMode
  playerCount: number
  startingHandSize: number
  targetScore: number
  aiDifficulty: AiDifficulty
  spectacularDelaySeconds: number
  flashTimerSeconds: number
  h2oSplash: boolean
  tableTheme: TableTheme
  deckTheme: DeckTheme
  avatarId: AvatarId
  reducedMotion: boolean
  hardwarePopupSeconds: number
  roundStartFlourish: boolean
  cardFlourishStyle: CardFlourishStyle
  dealAnimation: boolean
  winnerCelebration: boolean
  animationSpeed: AnimationSpeed
  memoryDifficulty: MemoryDifficulty
  memoryMatchMode: MemoryMatchMode
  memoryRevealSeconds: number
  neighborColorConstrained: boolean
  hiLoColorConstrained: boolean
  addOns: Record<AddOnPack, boolean>
}

export interface GameState {
  players: Player[]
  drawPile: Card[]
  discardPile: Card[]
  activePlayerIndex: number
  direction: 1 | -1
  activeColor: ActiveColor
  flipSide: 'light' | 'dark'
  currentRound: number
  winnerId: string | null
  gameWinnerId: string | null
  targetScore: number
  config: GameConfig
  pendingDraw: PendingDraw | null
  pendingDare: PendingDare | null
  pendingEmoji?: PendingEmoji | null
  pendingDareDropAll: PendingDareDropAll | null
  drewThisTurn: boolean
  drawnCardIdThisTurn: string | null
  mustPlayFromHand: boolean
  speedPlayColor: UnoColor | null
  unoDeclaredPlayerId: string | null
  catchableUnoPlayerId: string | null
  zeroCallPendingPlayerId: string | null
  pendingCaboPower?: PendingCaboPower | null
  caboCallerPlayerId?: string | null
  caboFinalTurnsRemaining?: number | null
  whirlpoolEvent: WhirlpoolEvent | null
  launcherEvent: LauncherEvent | null
  flashEvent: FlashEvent | null
  spinEvent: SpinEvent | null
  dareEvent: DareEvent | null
  zeroTurn: ZeroTurn | null
  pendingLiarChallenge: PendingLiarChallenge | null
  partyLink: PartyLink | null
  partyPileEvent: PartyPileEvent | null
  wildJackpotEvent: WildJackpotEvent | null
  blastChamber?: number
  blastEvent?: BlastEvent | null
  robotoEvent?: RobotoEvent | null
  tippoEvent?: TippoEvent | null
  marioKartEvent?: MarioKartEvent | null
  justiceLeagueEvent?: JusticeLeagueEvent | null
  webSwingEvent?: WebSwingEvent | null
  turtlePowerEvent?: TurtlePowerEvent | null
  beamMeUpEvent?: BeamMeUpEvent | null
  avatarStateEvent?: AvatarStateEvent | null
  creepyCoolEvent?: CreepyCoolEvent | null
  touchdownEvent?: TouchdownEvent | null
  memoryActionEvent?: MemoryActionEvent | null
  memoryBoard?: MemoryBoard
  neighborAnchor?: number | null
  hiLoAnchor?: number | null
  hiLoDirection?: 'higher' | 'lower'
  passageFaceUp?: Card | null
  passageSlot?: Card | null
  passageTurn?: PassageTurn | null
  passageDiscardPile?: Card[]
  triplePlayPiles?: TriplePlayPile[]
  tippoTrays?: TippoTray[]
  dosCenterRow?: Card[]
  skipBoBuildPiles?: Card[][]
  log: LogEntry[]
  nextLogId: number
}

export interface PlayChoice {
  color?: UnoColor
  targetPlayerId?: string
  secondTargetPlayerId?: string
  useFlex?: boolean
  liarClaim?: LiarClaim
  secondCardId?: string
  discardPileIndex?: number
  jackpotRule?: WildJackpotRule
  blastRoll?: number
  robotoRoll?: number
  robotoCommand?: RobotoCommand
  neighborAnchor?: number
  hiLoAnchor?: number
  barbieDiscardColor?: UnoColor
}

export interface PlayResult {
  state: GameState
  needsChoice?: ChoiceRequest
  sound?: SoundCue
}

export interface ChoiceRequest {
  type: 'color' | 'neighborWild' | 'hiLoWild' | 'barbieColors' | 'target' | 'twoTargets' | 'challenge' | 'flexMode' | 'liarClaim' | 'triplePlayPile'
  cardId?: string
  playerId?: string
  message: string
}

export type SoundCue =
  | 'deal'
  | 'play'
  | 'draw'
  | 'action'
  | 'reverse'
  | 'skip'
  | 'wild'
  | 'uno'
  | 'win'
  | 'roundWin'
  | 'sessionWin'
  | 'penaltyDraw'
  | 'match'
  | 'mismatch'
  | 'memoryFlip'
  | 'memoryMatch'
  | 'memoryTripleMatch'
  | 'memoryMismatch'
  | 'memoryAction'
  | 'memoryWinnerTakesAll'
  | 'mahjongWallBuild'
  | 'mahjongDraw'
  | 'mahjongDiscard'
  | 'mahjongChow'
  | 'mahjongPong'
  | 'mahjongKong'
  | 'mahjongWin'
  | 'hardware'
  | 'launcher'
  | 'launcherBuild'
  | 'launcherFire'
  | 'blastPressure'
  | 'blastRelease'
  | 'robotoBeep'
  | 'robotoInstruction'
  | 'tippoWobble'
  | 'tippoTip'
  | 'diceRoll'
  | 'diceSettle'
  | 'flash'
  | 'spin'
  | 'timeout'
  | 'error'
