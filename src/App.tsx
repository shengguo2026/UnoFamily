import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import './App.css'
import { GameCanvas } from './components/GameCanvas'
import { MoreGamesTile } from './components/MoreGamesTile'
import { MoreGamesUnlockModal } from './components/MoreGamesUnlockModal'
import {
  QuatroTable,
  type QuatroUiAction,
} from './components/quatro/QuatroTable'
import { MahjongTable3D } from './components/mahjong/MahjongTable3D'
import { deriveMahjongAnimationTransition } from './components/mahjong/mahjongAnimations'
import {
  defaultMahjongVisualTheme,
  mahjongCenterPatterns,
  mahjongTableFeltThemes,
  mahjongTableFrameThemes,
  mahjongTileDeckThemes,
  type MahjongCenterPattern,
  type MahjongTableFeltTheme,
  type MahjongTableFrameTheme,
  type MahjongTileDeckTheme,
  type MahjongVisualTheme,
} from './components/mahjong/mahjongVisuals'
import {
  activePlayer,
  acceptLiarClaim,
  applyFlashTimeoutPenalty,
  callUno,
  caboCall,
  caboResolvePower,
  canPassToPartner,
  catchUno,
  challengeLiarClaim,
  canPartySpeedPlayCutIn,
  createGame,
  drawOne,
  endTurn,
  initialConfig,
  legalTargets,
  liarClaimOptions,
  memoryAiMove,
  memoryResolvePending,
  memorySelectSlot,
  passCardToPartner,
  passageAiMove,
  passagePairWithCard,
  passagePassCard,
  passageSkipPair,
  passageTakeCard,
  phase10AiMove,
  phase10CompletePhase,
  phase10HitCards,
  phase10TakeDiscard,
  playCard,
  playableCards,
  remapCaboGridKnowledge,
  resolvePendingDare,
  resolvePendingDraw,
  resolvePendingEmoji,
  skipBoAiMove,
  skipBoDiscardToPile,
  speedPlayCutIn,
  startNextRound,
  topCard,
  tippoLegalTrayIndexes,
  triplePlayLegalPileIndexes,
  zeroAiMove,
  zeroDiscardDrawn,
  zeroDrawnCardCanBeDiscarded,
  zeroFaceDownCount,
  zeroGridCards,
  zeroHasDrawnCard,
  zeroSwapDrawnIntoGrid,
  zeroTakeDiscard,
} from './game/classic'
import { decideAiMove, decideAiSpeedPlayCutIn } from './game/ai'
import { shouldAiCatchUno, shouldAiChallengeLiar } from './game/ai'
import { chooseMahjongAiAction, chooseMahjongDiscard, type MahjongAiAction } from './game/mahjong/ai'
import { getMahjongHint } from './game/mahjong/hints'
import { mahjongLogText, mahjongSelectedTileText, mahjongTileKeyText } from './game/mahjong/translation'
import { chooseQuatroAiAction } from './game/quatro/ai'
import {
  createQuatroGame,
  quatroExchangeTile,
  quatroPlaceTile,
  quatroResolveEmptyPush,
  quatroSelectSwapColumn,
} from './game/quatro/rules'
import {
  quatroActionReference,
  quatroRuleSections,
  quatroStrategySections,
  quatroText,
} from './game/quatro/translation'
import type {
  QuatroRandom,
  QuatroState,
} from './game/quatro/types'
import {
  createMahjongGame,
  mahjongClaim,
  mahjongDeclareKong,
  mahjongDeclareWin,
  mahjongDiscard,
  mahjongDraw,
  mahjongLegalClaimOptions,
  mahjongPassClaim,
  mahjongStartNextRound,
} from './game/mahjong/rules'
import { availableMahjongControlActions, type MahjongControlAction } from './game/mahjong/ui'
import type { MahjongClaimResponse, MahjongState, MahjongTile } from './game/mahjong/types'
import { recommendMove, type MoveRecommendation, type RecommendationReason } from './game/recommendation'
import { SoundManager, defaultAudioSettings, type AudioSettings, type BackgroundMusicTheme } from './game/sound'
import type {
  AddOnPack,
  AiDifficulty,
  AnimationSpeed,
  AvatarStateEvent,
  AvatarId,
  BeamMeUpEvent,
  BlastEvent,
  Card,
  CardFlourishStyle,
  ChoiceRequest,
  CreepyCoolEvent,
  DeckTheme,
  DareDieResult,
  DareEvent,
  GameConfig,
  GameMode,
  GameState,
  GameVariant,
  FlashEvent,
  JusticeLeagueEvent,
  LauncherEvent,
  MarioKartEvent,
  MemoryActionEvent,
  MemoryDifficulty,
  MemoryMatchMode,
  Phase10Meld,
  PlayChoice,
  Player,
  RobotoEvent,
  SoundCue,
  SpinEvent,
  TableTheme,
  TippoEvent,
  TouchdownEvent,
  TurtlePowerEvent,
  UnoColor,
  WebSwingEvent,
  WildJackpotEvent,
  WildJackpotRule,
  WhirlpoolCommand,
  WhirlpoolEvent,
  SpinWheelAction,
} from './game/types'
import { cardFlourishStyleName, cardName, colorName, modeName, playerName, t, type Language } from './i18n'
import {
  createLocalWifiClient,
  initialWifiClientState,
  type WifiClient,
  type WifiClientState,
  type WifiGameSnapshot,
  type WifiPlayerAction,
} from './network/localWifi'

const colors: UnoColor[] = ['red', 'yellow', 'green', 'blue']
const darkColors: UnoColor[] = ['teal', 'pink', 'purple', 'orange']
const targetScoreOptions = [300, 400, 500, 600, 700, 800, 900, 999]
const tableThemes: TableTheme[] = ['classicGreen', 'casinoNight', 'lightWood', 'oceanBlue', 'royalRed']
const deckThemes: DeckTheme[] = ['classicRider', 'royalGold', 'arcaneNight', 'retroCarnival', 'crystalLight']
const animationSpeeds: AnimationSpeed[] = ['fast', 'normal', 'slow']
const cardFlourishStyles: CardFlourishStyle[] = ['random', 'fan', 'cut', 'faro', 'pirouette', 'spring', 'waterfall', 'dribble', 'oneHanded']
const avatarIds: AvatarId[] = ['explorer', 'teacher', 'magician', 'builder', 'musician', 'gardener', 'pilot', 'chef', 'scientist', 'artist']
const WINNER_CELEBRATION_DURATION_MS = 3000
const partyPlayerOptions = [2, 3, 4, 6, 8, 10, 12, 14, 16]
const allWildPlayerOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10]
const phase10PlayerOptions = [2, 3, 4, 5, 6]
const skipBoPlayerOptions = [2, 3, 4, 5, 6]
type ThemeMode = 'dark' | 'light'
type AppScreen = 'home' | 'setup' | 'table'
const playableGames: Partial<Record<number, GameVariant>> = {
  0: 'classic',
  1: 'extreme',
  2: 'flash',
  3: 'flip',
  4: 'h2o',
  5: 'spin',
  6: 'zero',
  7: 'flex',
  8: 'liars',
  9: 'party',
  10: 'teams',
  11: 'houseRules',
  12: 'challenge',
  13: 'flipExtreme',
  14: 'lotr',
  15: 'popCulture',
  16: 'allWild',
  17: 'noMercy',
  18: 'triplePlay',
  19: 'minecraft',
  20: 'wildJackpot',
  21: 'blast',
  22: 'roboto',
  23: 'tippo',
  24: 'dice',
  25: 'emoji',
  26: 'marioKart',
  27: 'superMario',
  28: 'sonic',
  29: 'barbie',
  30: 'motu',
  31: 'tmnt',
  32: 'spiderman',
  33: 'dc',
  34: 'starTrek',
  35: 'avatar',
  36: 'monsterHigh',
  37: 'nfl',
  38: 'skyjo',
  39: 'cabo',
  40: 'dos',
  41: 'phase10',
  42: 'skipBo',
  43: 'mahjong',
  44: 'guoMemory',
  45: 'guoMemoryAction',
  46: 'guoTripleMemory',
  47: 'guoTripleMemoryAction',
  48: 'guoNeighborMatch',
  49: 'guoUnoMahjong',
  50: 'guoHiLo',
  51: 'guoPassage',
}

function isLauncherGame(game: GameVariant): boolean {
  return game === 'extreme' || game === 'flipExtreme'
}

function isFlipSideGame(game: GameVariant): boolean {
  return game === 'flip' || game === 'flipExtreme'
}

function usesWidePlayerOptions(game: GameVariant): boolean {
  return game === 'allWild' || game === 'challenge' || game === 'flipExtreme' || game === 'lotr' || game === 'popCulture' || game === 'noMercy' || game === 'superMario' || game === 'minecraft' || game === 'wildJackpot' || game === 'blast' || game === 'roboto' || game === 'tippo' || game === 'marioKart' || game === 'phase10' || game === 'skipBo'
}

function isGridMemoryGame(game: GameVariant): boolean {
  return game === 'zero' || game === 'cabo' || game === 'skyjo'
}

function isGuoMemoryGame(game: GameVariant): boolean {
  return game === 'guoMemory' || game === 'guoMemoryAction' || game === 'guoTripleMemory' || game === 'guoTripleMemoryAction'
}

function isMahjongGame(game: GameVariant): boolean {
  return game === 'mahjong' || game === 'guoUnoMahjong'
}

function isGuoMemoryActionGame(game: GameVariant): boolean {
  return game === 'guoMemoryAction' || game === 'guoTripleMemoryAction'
}

function isGuoExclusiveGame(game: GameVariant): boolean {
  return isGuoMemoryGame(game) || game === 'guoNeighborMatch' || game === 'guoUnoMahjong' || game === 'guoHiLo' || game === 'guoPassage'
}

const arcadeMusicGames = new Set<GameVariant>([
  'extreme', 'flash', 'spin', 'flipExtreme', 'lotr', 'popCulture', 'allWild', 'noMercy', 'superMario', 'sonic', 'barbie', 'motu', 'tmnt',
  'spiderman', 'dc', 'starTrek', 'avatar', 'monsterHigh', 'nfl', 'triplePlay', 'minecraft', 'blast', 'roboto', 'tippo', 'dice', 'emoji', 'marioKart',
])

function backgroundMusicThemeForGame(game: GameVariant): BackgroundMusicTheme {
  if (isMahjongGame(game)) return 'mahjong'
  if (isGuoExclusiveGame(game)) return 'puzzle'
  if (arcadeMusicGames.has(game)) return 'arcade'
  return 'classic'
}

function playSoundAfterUnlock(sound: SoundManager | null, cue: SoundCue) {
  if (!sound) return
  void sound.unlock().then((unlocked) => {
    if (unlocked) sound.play(cue)
  })
}

function winnerCelebrationKey(state: GameState): string | null {
  if (!state.winnerId) return null
  return `${state.config.game}:${state.config.mode}:${state.currentRound}:${state.winnerId}:${state.gameWinnerId ?? ''}`
}

function handleWinnerCelebrationClick(event: ReactMouseEvent<HTMLButtonElement>, onFinish: () => void) {
  if (event.detail === 0) onFinish()
}

const games = [
  'Uno Classic',
  'Uno Extreme',
  'Uno Flash',
  'Uno Flip',
  'Uno H2O',
  'Uno Spin',
  'Uno Zero',
  'Uno Flex',
  "Liar's Uno",
  'Uno Party',
  'Uno Teams',
  'Uno House Rules',
  'Uno Challenge Adults Only',
  'Uno Flip Extreme',
  'Uno Der Herr der Ringe',
  'Pop-Culture Uno editions',
  'UNO All Wild',
  "Uno Show 'em No Mercy",
  'UNO Triple Play',
  'UNO Minecraft',
  'UNO Wild Jackpot',
  'UNO Blast',
  'UNO Roboto',
  'UNO Tippo',
  'UNO Dice',
  'UNO Emoji',
  'UNO Mario Kart',
  'UNO Super Mario',
  'UNO Sonic the Hedgehog',
  'UNO Barbie',
  'UNO Masters of the Universe',
  'UNO TMNT',
  'UNO Spider-Man',
  'UNO DC',
  'UNO Star Trek',
  'UNO Avatar',
  'UNO Monster High',
  'UNO NFL',
  'Skyjo',
  'Cabo',
  'DOS',
  'Phase 10',
  'Skip-Bo',
  'Traditional Chinese Mahjong',
  "Guo's Exclusive UNO Memory",
  "Guo's Exclusive UNO Memory Action",
  "Guo's Exclusive UNO Triple Memory",
  "Guo's Exclusive UNO Triple Memory Action",
  "Guo's Exclusive Uno Neighbor Match",
  "Guo's Exclusive Uno Mahjong",
  "Guo's Exclusive Uno Hi-Lo",
  "Guo's Exclusive Uno Passage",
]

interface PendingChoiceState {
  request: ChoiceRequest
  partial: PlayChoice
}

interface PendingWifiAction {
  clientId: string
  action: WifiPlayerAction
}

function loadVisualConfig(base: GameConfig): GameConfig {
  if (typeof window === 'undefined') return base
  try {
    const stored = JSON.parse(window.localStorage.getItem('uno-visual-settings') ?? '{}') as Partial<GameConfig>
    const settingsVersion = (stored as Partial<GameConfig> & { hardwarePopupSettingsVersion?: number }).hardwarePopupSettingsVersion
    const storedHardwarePopupSeconds = [2, 3, 4, 5].includes(Number(stored.hardwarePopupSeconds)) ? Number(stored.hardwarePopupSeconds) : base.hardwarePopupSeconds
    return {
      ...base,
      tableTheme: tableThemes.includes(stored.tableTheme as TableTheme) ? stored.tableTheme as TableTheme : base.tableTheme,
      deckTheme: deckThemes.includes(stored.deckTheme as DeckTheme) ? stored.deckTheme as DeckTheme : base.deckTheme,
      avatarId: avatarIds.includes(stored.avatarId as AvatarId) ? stored.avatarId as AvatarId : base.avatarId,
      reducedMotion: typeof stored.reducedMotion === 'boolean' ? stored.reducedMotion : base.reducedMotion,
      hardwarePopupSeconds: settingsVersion === 5 ? storedHardwarePopupSeconds : base.hardwarePopupSeconds,
      roundStartFlourish: typeof stored.roundStartFlourish === 'boolean' ? stored.roundStartFlourish : base.roundStartFlourish,
      cardFlourishStyle: cardFlourishStyles.includes(stored.cardFlourishStyle as CardFlourishStyle) ? stored.cardFlourishStyle as CardFlourishStyle : base.cardFlourishStyle,
      dealAnimation: typeof stored.dealAnimation === 'boolean' ? stored.dealAnimation : base.dealAnimation,
      winnerCelebration: typeof stored.winnerCelebration === 'boolean' ? stored.winnerCelebration : base.winnerCelebration,
      animationSpeed: animationSpeeds.includes(stored.animationSpeed as AnimationSpeed) ? stored.animationSpeed as AnimationSpeed : base.animationSpeed,
      memoryDifficulty: ['easy', 'medium', 'hard'].includes(stored.memoryDifficulty as string) ? stored.memoryDifficulty as MemoryDifficulty : base.memoryDifficulty,
      memoryMatchMode: ['number', 'color', 'both'].includes(stored.memoryMatchMode as string) ? stored.memoryMatchMode as MemoryMatchMode : base.memoryMatchMode,
      memoryRevealSeconds: [2, 3, 4, 5].includes(Number(stored.memoryRevealSeconds)) ? Number(stored.memoryRevealSeconds) : base.memoryRevealSeconds,
      neighborColorConstrained: typeof stored.neighborColorConstrained === 'boolean' ? stored.neighborColorConstrained : base.neighborColorConstrained,
      hiLoColorConstrained: typeof stored.hiLoColorConstrained === 'boolean' ? stored.hiLoColorConstrained : base.hiLoColorConstrained,
    }
  } catch {
    return base
  }
}

function loadAudioSettings(): AudioSettings {
  if (typeof window === 'undefined') return defaultAudioSettings
  try {
    const stored = JSON.parse(window.localStorage.getItem('uno-audio-settings') ?? '{}') as Partial<AudioSettings> & { audioSettingsVersion?: number }
    if (stored.audioSettingsVersion !== 1) return defaultAudioSettings
    return {
      masterVolume: normalizeAudioVolume(stored.masterVolume, defaultAudioSettings.masterVolume),
      soundEffectsVolume: normalizeAudioVolume(stored.soundEffectsVolume, defaultAudioSettings.soundEffectsVolume),
      backgroundMusicVolume: normalizeAudioVolume(stored.backgroundMusicVolume, defaultAudioSettings.backgroundMusicVolume),
      soundEffectsEnabled: typeof stored.soundEffectsEnabled === 'boolean' ? stored.soundEffectsEnabled : defaultAudioSettings.soundEffectsEnabled,
      backgroundMusicEnabled: typeof stored.backgroundMusicEnabled === 'boolean' ? stored.backgroundMusicEnabled : defaultAudioSettings.backgroundMusicEnabled,
    }
  } catch {
    return defaultAudioSettings
  }
}

function normalizeAudioVolume(value: unknown, fallback: number): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? Math.max(0, Math.min(1, numberValue)) : fallback
}

const runtimeQuatroRandom: QuatroRandom = {
  int(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError('Quatro random range must be positive')
    }
    return Math.floor(Math.random() * maxExclusive)
  },
}

function loadMahjongVisualTheme(): MahjongVisualTheme {
  if (typeof window === 'undefined') return defaultMahjongVisualTheme
  try {
    const stored = JSON.parse(window.localStorage.getItem('mahjong-visual-settings') ?? '{}') as Partial<MahjongVisualTheme>
    return {
      felt: mahjongTableFeltThemes.includes(stored.felt as MahjongTableFeltTheme) ? stored.felt as MahjongTableFeltTheme : defaultMahjongVisualTheme.felt,
      frame: mahjongTableFrameThemes.includes(stored.frame as MahjongTableFrameTheme) ? stored.frame as MahjongTableFrameTheme : defaultMahjongVisualTheme.frame,
      centerPattern: mahjongCenterPatterns.includes(stored.centerPattern as MahjongCenterPattern) ? stored.centerPattern as MahjongCenterPattern : defaultMahjongVisualTheme.centerPattern,
      tileDeck: mahjongTileDeckThemes.includes(stored.tileDeck as MahjongTileDeckTheme) ? stored.tileDeck as MahjongTileDeckTheme : defaultMahjongVisualTheme.tileDeck,
    }
  } catch {
    return defaultMahjongVisualTheme
  }
}

function App() {
  const [language, setLanguage] = useState<Language>('en')
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark'
    return window.localStorage.getItem('uno-theme') === 'light' ? 'light' : 'dark'
  })
  const [screen, setScreen] = useState<AppScreen>('home')
  const [config, setConfig] = useState<GameConfig>(() => loadVisualConfig(initialConfig))
  const [mahjongVisualTheme, setMahjongVisualTheme] = useState<MahjongVisualTheme>(() => loadMahjongVisualTheme())
  const [state, setState] = useState<GameState | null>(null)
  const [mahjongState, setMahjongState] = useState<MahjongState | null>(null)
  const [quatroState, setQuatroState] = useState<QuatroState | null>(null)
  const [selectedQuatroTileId, setSelectedQuatroTileId] = useState<string | null>(null)
  const [selectedMahjongTileId, setSelectedMahjongTileId] = useState<string | null>(null)
  const [pendingChoice, setPendingChoice] = useState<PendingChoiceState | null>(null)
  const [teamPassMode, setTeamPassMode] = useState(false)
  const [skipBoDiscardPileIndex, setSkipBoDiscardPileIndex] = useState<number | null>(null)
  const [passagePassMode, setPassagePassMode] = useState<'faceUp' | 'faceDown' | null>(null)
  const [revealedPlayerId, setRevealedPlayerId] = useState<string | null>(null)
  const [animationLockReason, setAnimationLockReason] = useState<string | null>(null)
  const [winnerCelebration, setWinnerCelebration] = useState<string | null>(null)
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => loadAudioSettings())
  const [rulesOpen, setRulesOpen] = useState(false)
  const [moreGamesOpen, setMoreGamesOpen] = useState(false)
  const [wifiState, setWifiState] = useState<WifiClientState>(initialWifiClientState)
  const [wifiName, setWifiName] = useState('Player')
  const [wifiJoinCode, setWifiJoinCode] = useState('')
  const [wifiAllowAi, setWifiAllowAi] = useState(false)
  const [wifiSnapshotPlayerId, setWifiSnapshotPlayerId] = useState<string | null>(null)
  const [pendingWifiActions, setPendingWifiActions] = useState<PendingWifiAction[]>([])
  const wifiClient = useRef<WifiClient | null>(null)
  const wifiStateRef = useRef<WifiClientState>(initialWifiClientState())
  const gameStateRef = useRef<GameState | null>(null)
  const mahjongStateRef = useRef<MahjongState | null>(null)
  const quatroStateRef = useRef<QuatroState | null>(null)
  const screenRef = useRef(screen)
  const pendingHostedGameRef = useRef<GameVariant | null>(null)
  const lastAiHardwareWaitKey = useRef<string | null>(null)
  const lastWinnerCelebrationKey = useRef<string | null>(null)
  const moreGamesTileRef = useRef<HTMLButtonElement | null>(null)
  const [sound] = useState<SoundManager | null>(() => (typeof window !== 'undefined' ? new SoundManager() : null))
  const navigateToScreen = useCallback((nextScreen: AppScreen) => {
    if (nextScreen !== 'table') setAnimationLockReason(null)
    setScreen(nextScreen)
  }, [])
  const isBlockingAnimationActive = Boolean(animationLockReason)
  const activeMusicGame = screen === 'table' && state ? state.config.game : config.game

  const closeMoreGames = useCallback(() => {
    setMoreGamesOpen(false)
    window.requestAnimationFrame(() => moreGamesTileRef.current?.focus())
  }, [])

  const selectUnlockedGame = useCallback((gameId: 'quatro') => {
    if (gameId !== 'quatro') return
    setMoreGamesOpen(false)
    setConfig((currentConfig) => ({
      ...currentConfig,
      game: 'quatro',
      playerCount: 2,
      startingHandSize: 3,
    }))
    navigateToScreen('setup')
  }, [navigateToScreen])

  useEffect(() => {
    window.localStorage.setItem('uno-theme', theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(
      'uno-visual-settings',
      JSON.stringify({
        tableTheme: config.tableTheme,
        deckTheme: config.deckTheme,
        avatarId: config.avatarId,
        reducedMotion: config.reducedMotion,
        hardwarePopupSeconds: config.hardwarePopupSeconds,
        roundStartFlourish: config.roundStartFlourish,
        cardFlourishStyle: config.cardFlourishStyle,
        dealAnimation: config.dealAnimation,
        winnerCelebration: config.winnerCelebration,
        animationSpeed: config.animationSpeed,
        animationSettingsVersion: 1,
        memoryDifficulty: config.memoryDifficulty,
        memoryMatchMode: config.memoryMatchMode,
        memoryRevealSeconds: config.memoryRevealSeconds,
        neighborColorConstrained: config.neighborColorConstrained,
        hiLoColorConstrained: config.hiLoColorConstrained,
        hardwarePopupSettingsVersion: 5,
      }),
    )
  }, [config.animationSpeed, config.avatarId, config.cardFlourishStyle, config.dealAnimation, config.deckTheme, config.hardwarePopupSeconds, config.hiLoColorConstrained, config.memoryDifficulty, config.memoryMatchMode, config.memoryRevealSeconds, config.neighborColorConstrained, config.reducedMotion, config.roundStartFlourish, config.tableTheme, config.winnerCelebration])

  useEffect(() => {
    window.localStorage.setItem('mahjong-visual-settings', JSON.stringify(mahjongVisualTheme))
  }, [mahjongVisualTheme])

  useEffect(() => {
    sound?.setBackgroundMusicTheme(backgroundMusicThemeForGame(activeMusicGame))
  }, [activeMusicGame, sound])

  useEffect(() => {
    if (!sound) return
    sound.configure(audioSettings)
  }, [audioSettings, sound])

  useEffect(() => {
    window.localStorage.setItem(
      'uno-audio-settings',
      JSON.stringify({
        ...audioSettings,
        audioSettingsVersion: 1,
      }),
    )
  }, [audioSettings])

  useEffect(() => {
    if (!sound) return
    let listening = true
    const removeUnlockListeners = () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
    const unlockAudio = () => {
      void sound.unlock().then((unlocked) => {
        if (!unlocked || !listening) return
        removeUnlockListeners()
      })
    }
    window.addEventListener('pointerdown', unlockAudio, { passive: true })
    window.addEventListener('keydown', unlockAudio)
    return () => {
      listening = false
      removeUnlockListeners()
    }
  }, [sound])

  useEffect(() => {
    wifiStateRef.current = wifiState
  }, [wifiState])

  useEffect(() => {
    gameStateRef.current = state
  }, [state])

  useEffect(() => {
    mahjongStateRef.current = mahjongState
  }, [mahjongState])

  useEffect(() => {
    screenRef.current = screen
  }, [screen])

  const finishWinnerCelebration = useCallback(() => {
    setWinnerCelebration(null)
    setAnimationLockReason((reason) => reason === 'winnerCelebration' ? null : reason)
  }, [])

  const resetWinnerCelebration = useCallback(() => {
    lastWinnerCelebrationKey.current = null
    finishWinnerCelebration()
  }, [finishWinnerCelebration])

  const startWinnerCelebration = useCallback((next: GameState) => {
    const key = winnerCelebrationKey(next)
    if (!key || !next.config.winnerCelebration || next.config.reducedMotion || lastWinnerCelebrationKey.current === key) return
    lastWinnerCelebrationKey.current = key
    setWinnerCelebration(key)
    setAnimationLockReason('winnerCelebration')
  }, [])

  useEffect(() => {
    return () => wifiClient.current?.close()
  }, [])

  const publishWifiSnapshots = useCallback((next: GameState) => {
    const room = wifiStateRef.current.room
    if (!room || !wifiClient.current) return
    const snapshots: Record<string, WifiGameSnapshot> = {}
    for (const player of room.players) {
      snapshots[player.id] = {
        state: createPrivateWifiState(next, player.id),
        localPlayerId: player.id,
      }
    }
    wifiClient.current.publishGameSnapshots(snapshots)
  }, [])

  const publishMahjongWifiSnapshots = useCallback((next: MahjongState) => {
    const room = wifiStateRef.current.room
    if (!room || !wifiClient.current) return
    const snapshots: Record<string, WifiGameSnapshot> = {}
    for (const player of room.players) {
      snapshots[player.id] = {
        mahjongState: createPrivateMahjongState(next, player.id),
        localPlayerId: player.id,
      }
    }
    wifiClient.current.publishGameSnapshots(snapshots)
  }, [])

  const updateState = useCallback((next: GameState, cue?: Parameters<SoundManager['play']>[0]) => {
    const previous = gameStateRef.current
    if (next.winnerId) startWinnerCelebration(next)
    else finishWinnerCelebration()
    setState(next)
    setTeamPassMode(false)
    gameStateRef.current = next
    if (next.config.mode === 'wifi' && wifiStateRef.current.room && wifiStateRef.current.clientId === wifiStateRef.current.room.hostId) {
      publishWifiSnapshots(next)
    }
    playHardwareSoundLeadIn(sound, previous, next, cue)
    sound?.play(soundCueForGameTransition(previous, next, cue))
    playHardwareSoundFollowUp(sound, previous, next, cue)
  }, [finishWinnerCelebration, publishWifiSnapshots, sound, startWinnerCelebration])

  const updateMahjongState = useCallback((next: MahjongState, cue?: Parameters<SoundManager['play']>[0]) => {
    const previous = mahjongStateRef.current
    setMahjongState(next)
    setSelectedMahjongTileId(null)
    mahjongStateRef.current = next
    if (config.mode === 'wifi' && wifiStateRef.current.room && wifiStateRef.current.clientId === wifiStateRef.current.room.hostId) {
      publishMahjongWifiSnapshots(next)
    }
    sound?.play(soundCueForMahjongTransition(previous, next, cue))
  }, [config.mode, publishMahjongWifiSnapshots, sound])

  const dispatchQuatroAction = useCallback((action: QuatroUiAction) => {
    const currentQuatro = quatroStateRef.current
    if (!currentQuatro || currentQuatro.winnerId) return
    const active = currentQuatro.players[currentQuatro.activePlayerIndex]
    let next: QuatroState
    if (action.type === 'place') {
      next = quatroPlaceTile(
        currentQuatro,
        active.id,
        action.tileId,
        action.column,
        runtimeQuatroRandom,
      )
    } else if (action.type === 'swapColumn') {
      next = quatroSelectSwapColumn(
        currentQuatro,
        active.id,
        action.column,
        runtimeQuatroRandom,
      )
    } else if (action.type === 'emptyPush') {
      next = quatroResolveEmptyPush(
        currentQuatro,
        active.id,
        action.pushOut,
        runtimeQuatroRandom,
      )
    } else {
      next = quatroExchangeTile(
        currentQuatro,
        active.id,
        action.tileId,
        runtimeQuatroRandom,
      )
    }
    quatroStateRef.current = next
    setQuatroState(next)
    setSelectedQuatroTileId(null)
    if (
      config.mode === 'hotseat'
      && next.activePlayerIndex !== currentQuatro.activePlayerIndex
      && !next.winnerId
    ) {
      setRevealedPlayerId(null)
    }
  }, [config.mode])

  const current = state ? activePlayer(state) : null
  const activeMahjongPlayer = mahjongState?.players[mahjongState.activePlayerIndex] ?? null
  const activeQuatroPlayer = quatroState?.players[
    quatroState.activePlayerIndex
  ] ?? null
  const quatroHiddenHands = Boolean(
    quatroState
      && config.mode === 'hotseat'
      && activeQuatroPlayer?.type === 'human'
      && revealedPlayerId !== activeQuatroPlayer.id
      && !quatroState.winnerId,
  )
  const quatroViewerPlayerId = quatroState
    ? config.mode === 'single'
      ? quatroState.players[0].id
      : config.mode === 'hotseat'
        ? quatroHiddenHands
          ? null
          : activeQuatroPlayer?.id ?? null
        : config.mode === 'wifi'
          ? wifiSnapshotPlayerId ?? wifiState.clientId ?? null
          : null
    : null
  const mahjongHotSeatControlPlayerId = mahjongState && config.mode === 'hotseat' ? localMahjongControlPlayerId(mahjongState, config.mode, undefined) : null
  const mahjongHiddenHands = Boolean(
    mahjongState &&
      config.mode === 'hotseat' &&
      mahjongHotSeatControlPlayerId &&
      mahjongState.players.find((player) => player.id === mahjongHotSeatControlPlayerId)?.type === 'human' &&
      revealedPlayerId !== mahjongHotSeatControlPlayerId &&
      !mahjongState.winnerId,
  )
  const hiddenHands = Boolean(
    state &&
      state.config.mode === 'hotseat' &&
      current?.type === 'human' &&
      revealedPlayerId !== current.id &&
      !state.winnerId,
  )
  const isWifiHost = Boolean(wifiState.room && wifiState.clientId === wifiState.room.hostId)
  const hotSeatTurnKey = state?.config.mode === 'hotseat' ? `${state.currentRound}:${state.activePlayerIndex}` : ''
  const mahjongHotSeatTurnKey = mahjongState && config.mode === 'hotseat' ? `${mahjongState.currentRound}:${mahjongState.phase}:${mahjongState.activePlayerIndex}:${mahjongHotSeatControlPlayerId ?? ''}` : ''
  const quatroHotSeatTurnKey = quatroState && config.mode === 'hotseat'
    ? String(quatroState.activePlayerIndex)
    : ''

  useEffect(() => {
    if (!hotSeatTurnKey) return
    const timer = window.setTimeout(() => setRevealedPlayerId(null), 0)
    return () => window.clearTimeout(timer)
  }, [hotSeatTurnKey])

  useEffect(() => {
    if (!mahjongHotSeatTurnKey) return
    const timer = window.setTimeout(() => setRevealedPlayerId(null), 0)
    return () => window.clearTimeout(timer)
  }, [mahjongHotSeatTurnKey])

  useEffect(() => {
    if (!quatroHotSeatTurnKey) return
    const timer = window.setTimeout(() => setRevealedPlayerId(null), 0)
    return () => window.clearTimeout(timer)
  }, [quatroHotSeatTurnKey])

  useEffect(() => {
    if (
      !quatroState
      || screen !== 'table'
      || quatroState.winnerId
      || isBlockingAnimationActive
      || quatroHiddenHands
    ) {
      return
    }
    const active = quatroState.players[quatroState.activePlayerIndex]
    if (active.type !== 'ai') return
    const delay =
      quatroState.mode === 'spectacular'
        ? config.spectacularDelaySeconds * 1000
        : 650
    const timer = window.setTimeout(() => {
      const latest = quatroStateRef.current
      if (
        !latest
        || latest.transitionSequence !== quatroState.transitionSequence
      ) {
        return
      }
      const aiAction = chooseQuatroAiAction(latest, runtimeQuatroRandom)
      if (!aiAction) return
      if (aiAction.type === 'place') {
        dispatchQuatroAction(aiAction)
      } else if (aiAction.type === 'selectSwap') {
        dispatchQuatroAction({
          type: 'swapColumn',
          column: aiAction.column,
        })
      } else if (aiAction.type === 'resolveEmptyPush') {
        dispatchQuatroAction({
          type: 'emptyPush',
          pushOut: aiAction.pushOut,
        })
      } else {
        dispatchQuatroAction(aiAction)
      }
    }, delay)
    return () => window.clearTimeout(timer)
  }, [
    config.spectacularDelaySeconds,
    dispatchQuatroAction,
    isBlockingAnimationActive,
    quatroHiddenHands,
    quatroState,
    screen,
  ])

  useEffect(() => {
    if (!state || pendingChoice || hiddenHands || state.winnerId || isBlockingAnimationActive) return
    if (state.config.mode === 'wifi' && !(wifiState.room && wifiState.clientId === wifiState.room.hostId)) return
    if (state.pendingLiarChallenge) {
      const source = state.players.find((player) => player.id === state.pendingLiarChallenge?.sourcePlayerId)
      const shouldAutoResolve =
        state.config.mode === 'spectacular' ||
        (state.config.mode === 'single' && source?.type === 'human')
      if (!shouldAutoResolve) return
      const timer = window.setTimeout(() => {
        const next = shouldAiChallengeLiar(state) ? challengeLiarClaim(state) : acceptLiarClaim(state)
        updateState(next, 'action')
      }, state.config.mode === 'spectacular' ? state.config.spectacularDelaySeconds * 1000 : 900)
      return () => window.clearTimeout(timer)
    }
    const speedCutIn = decideAiSpeedPlayCutIn(state)
    if (speedCutIn) {
      const timer = window.setTimeout(() => {
        const result = speedPlayCutIn(state, speedCutIn.playerId, speedCutIn.card.id)
        updateState(result.state, result.sound)
      }, state.config.mode === 'spectacular' ? Math.min(1200, state.config.spectacularDelaySeconds * 1000) : 700)
      return () => window.clearTimeout(timer)
    }

    if (state.memoryActionEvent) return
    if (isGuoMemoryGame(state.config.game) && (state.memoryBoard?.pendingMismatchIndexes?.length || state.memoryBoard?.pendingMatchIndexes?.length)) return

    const player = activePlayer(state)
    if (player.type !== 'ai') return

    const baseAiDelayMs = state.config.mode === 'spectacular' ? state.config.spectacularDelaySeconds * 1000 : 650
    const hardwareKey = hardwareEventKey(state)
    const shouldWaitForHardware = Boolean(hardwareKey && lastAiHardwareWaitKey.current !== hardwareKey)
    if (shouldWaitForHardware) {
      lastAiHardwareWaitKey.current = hardwareKey
    }
    const aiDelayMs = shouldWaitForHardware ? Math.max(baseAiDelayMs, state.config.hardwarePopupSeconds * 1000 + 250) : baseAiDelayMs
    const timer = window.setTimeout(() => {
      if (shouldAiCatchUno(state)) {
        updateState(catchUno(state), 'action')
        return
      }

      if (isGridMemoryGame(state.config.game)) {
        const result = zeroAiMove(state)
        updateState(result.state, result.sound)
        return
      }
      if (isGuoMemoryGame(state.config.game)) {
        const result = memoryAiMove(state)
        updateState(result.state, result.sound)
        return
      }
      if (state.config.game === 'guoPassage') {
        const result = passageAiMove(state)
        updateState(result.state, result.sound)
        return
      }
      if (state.config.game === 'phase10') {
        const result = phase10AiMove(state)
        updateState(result.state, result.sound)
        return
      }
      if (state.config.game === 'skipBo') {
        const result = skipBoAiMove(state)
        updateState(result.state, result.sound)
        return
      }

      const decision = decideAiMove(state)
      if (state.pendingDraw && !decision.card) {
        updateState(resolvePendingDraw(state, decision.challenge), 'draw')
        return
      }
      if (state.pendingDare) {
        updateState(resolvePendingDare(state, player.aiDifficulty === 'easy' ? 'draw' : 'dare'), 'action')
        return
      }
      if (state.pendingEmoji) {
        updateState(resolvePendingEmoji(state, player.aiDifficulty === 'easy' ? 'draw4' : 'madeFace'), player.aiDifficulty === 'easy' ? 'draw' : 'action')
        return
      }
      if (!decision.card) {
        const drawn = drawOne(state)
        if (!drawn.drewThisTurn || drawn.activePlayerIndex !== state.activePlayerIndex) {
          updateState(drawn, isLauncherGame(state.config.game) ? 'launcher' : 'draw')
          return
        }
        const updatedPlayer = activePlayer(drawn)
        const playableDrawn = playableCards(updatedPlayer, drawn)
        if (playableDrawn.length > 0 && player.aiDifficulty !== 'easy') {
          const followUp = playCard(drawn, playableDrawn[0].id, {
            color: playableDrawn[0].color === 'wild' ? randomChoice(colorsForState(state)) : undefined,
          })
          updateState(followUp.state, followUp.sound)
        } else {
          updateState(endTurn(drawn), isLauncherGame(state.config.game) ? 'launcher' : 'draw')
        }
        return
      }
      const result = playCard(state, decision.card.id, decision.choice)
      updateState(result.state, result.sound)
    }, aiDelayMs)

    return () => window.clearTimeout(timer)
  }, [hiddenHands, isBlockingAnimationActive, pendingChoice, state, updateState, wifiState.clientId, wifiState.room])

  useEffect(() => {
    if (
      !state ||
      !isGuoMemoryGame(state.config.game) ||
      state.winnerId ||
      (!state.memoryBoard?.pendingMismatchIndexes?.length && !state.memoryBoard?.pendingMatchIndexes?.length)
    ) return
    if (state.config.mode === 'wifi' && !isWifiHost) return
    const timer = window.setTimeout(() => {
      updateState(memoryResolvePending(state), 'play')
    }, state.memoryBoard.revealDurationMs)
    return () => window.clearTimeout(timer)
  }, [isWifiHost, state, updateState])

  useEffect(() => {
    if (!state?.memoryActionEvent) return
    if (state.config.mode === 'wifi' && !isWifiHost) return
    const sequence = state.memoryActionEvent.sequence
    const timer = window.setTimeout(() => {
      const latest = gameStateRef.current
      if (!latest?.memoryActionEvent || latest.memoryActionEvent.sequence !== sequence) return
      updateState({ ...latest, memoryActionEvent: null }, undefined)
    }, state.config.hardwarePopupSeconds * 1000)
    return () => window.clearTimeout(timer)
  }, [isWifiHost, state, updateState])

  useEffect(() => {
    if (!mahjongState || mahjongState.winnerId || isBlockingAnimationActive) return
    if (config.mode === 'wifi' && !isWifiHost) return
    const active = mahjongState.players[mahjongState.activePlayerIndex]
    const shouldAutoMove =
      mahjongState.phase === 'claim'
        ? Boolean(mahjongState.claimWindow?.eligiblePlayerIds.some((playerId) => mahjongState.players.find((player) => player.id === playerId)?.type === 'ai'))
        : active?.type === 'ai'
    if (!shouldAutoMove) return

    const delay = config.mode === 'spectacular' ? config.spectacularDelaySeconds * 1000 : 650
    const timer = window.setTimeout(() => {
      const action = chooseMahjongAiAction(mahjongState)
      updateMahjongState(applyMahjongAction(mahjongState, action), mahjongSoundForAction(action))
    }, delay)

    return () => window.clearTimeout(timer)
  }, [config.mode, config.spectacularDelaySeconds, isBlockingAnimationActive, isWifiHost, mahjongState, updateMahjongState])

  useEffect(() => {
    if (!state || state.config.game !== 'flash' || state.config.flashTimerSeconds <= 0) return
    if (pendingChoice || hiddenHands || state.winnerId) return
    if (state.config.mode === 'wifi' && !(wifiState.room && wifiState.clientId === wifiState.room.hostId)) return
    const player = activePlayer(state)
    if (player.type !== 'human') return

    const timer = window.setTimeout(() => {
      const latest = gameStateRef.current
      if (!latest || latest.config.game !== 'flash' || latest.winnerId) return
      if (activePlayer(latest).id !== player.id) return
      updateState(applyFlashTimeoutPenalty(latest), 'timeout')
    }, state.config.flashTimerSeconds * 1000)

    return () => window.clearTimeout(timer)
  }, [
    hiddenHands,
    pendingChoice,
    state,
    state?.activePlayerIndex,
    state?.config.flashTimerSeconds,
    state?.config.game,
    state?.config.mode,
    state?.currentRound,
    state?.winnerId,
    updateState,
    wifiState.clientId,
    wifiState.room,
  ])

  const wifiLocalPlayerId = state?.config.mode === 'wifi' || (mahjongState && config.mode === 'wifi') ? wifiSnapshotPlayerId ?? wifiState.clientId ?? undefined : undefined
  const isRemoteWifiClient = Boolean(state?.config.mode === 'wifi' && wifiState.room && !isWifiHost)
  const isRemoteMahjongWifiClient = Boolean(mahjongState && config.mode === 'wifi' && wifiState.room && !isWifiHost)
  const localLiarPlayerId = state?.config.mode === 'wifi' ? wifiLocalPlayerId : state?.config.mode === 'single' ? 'p1' : current?.id
  const canChallengeLiarClaim = Boolean(
    state?.pendingLiarChallenge &&
      (state.config.mode === 'hotseat' || Boolean(localLiarPlayerId && localLiarPlayerId !== state.pendingLiarChallenge.sourcePlayerId)),
  )
  const canControlCurrent = Boolean(
      current?.type === 'human' &&
      !hiddenHands &&
      !state?.winnerId &&
      !state?.pendingLiarChallenge &&
      (state?.config.mode !== 'wifi' || current.id === wifiLocalPlayerId),
  )
  const teamPassPlayerId = teamPassMode && state && current && canControlCurrent ? current.id : null
  const passagePassPlayerId = state?.config.game === 'guoPassage' && passagePassMode && current && canControlCurrent ? current.id : null
  const canvasPassModePlayerId = teamPassPlayerId ?? passagePassPlayerId

  const playableCount = useMemo(() => {
    if (!state) return 0
    return playableCards(activePlayer(state), state).length
  }, [state])
  const mustPlayFromHand = Boolean(state?.mustPlayFromHand || state?.speedPlayColor)
  const recommendation = useMemo(() => {
    if (!state || !canControlCurrent) return null
    return recommendMove(state)
  }, [canControlCurrent, state])
  const mahjongControlPlayerId = useMemo(() => {
    if (!mahjongState) return null
    return localMahjongControlPlayerId(mahjongState, config.mode, wifiLocalPlayerId)
  }, [config.mode, mahjongState, wifiLocalPlayerId])
  const mahjongControls = useMemo(() => {
    if (!mahjongState || !mahjongControlPlayerId || mahjongHiddenHands) return []
    return availableMahjongControlActions(mahjongState, mahjongControlPlayerId, selectedMahjongTileId)
  }, [mahjongControlPlayerId, mahjongHiddenHands, mahjongState, selectedMahjongTileId])
  const mahjongHint = useMemo(() => {
    if (!mahjongState || !mahjongControlPlayerId) return null
    return getMahjongHint(mahjongState, mahjongControlPlayerId)
  }, [mahjongControlPlayerId, mahjongState])
  const mahjongViewerPlayerId = useMemo(() => {
    if (!mahjongState) return null
    if (config.mode === 'wifi') return wifiSnapshotPlayerId ?? wifiState.clientId ?? mahjongControlPlayerId ?? mahjongState.players[0]?.id ?? null
    if (config.mode === 'hotseat') return mahjongControlPlayerId ?? activeMahjongPlayer?.id ?? mahjongState.players[0]?.id ?? null
    return mahjongState.players[0]?.id ?? null
  }, [activeMahjongPlayer?.id, config.mode, mahjongControlPlayerId, mahjongState, wifiSnapshotPlayerId, wifiState.clientId])

  function selectGame(index: number) {
    const game = playableGames[index]
    if (!game) return
    setConfig((currentConfig) => ({
      ...currentConfig,
      game,
      playerCount: game === 'dice' ? 2 : game === 'teams' || isMahjongGame(game) ? 4 : game === 'nfl' ? Math.min(currentConfig.playerCount, 4) : game === 'monsterHigh' ? Math.min(currentConfig.playerCount, 4) : game === 'avatar' ? Math.min(currentConfig.playerCount, 4) : game === 'starTrek' ? Math.min(currentConfig.playerCount, 4) : game === 'dc' ? Math.min(currentConfig.playerCount, 4) : game === 'spiderman' ? Math.min(currentConfig.playerCount, 4) : game === 'tmnt' ? Math.min(currentConfig.playerCount, 4) : game === 'motu' ? Math.min(currentConfig.playerCount, 4) : game === 'barbie' ? Math.min(currentConfig.playerCount, 4) : game === 'sonic' ? Math.min(currentConfig.playerCount, 4) : game === 'party' ? currentConfig.playerCount : game === 'phase10' || game === 'skipBo' ? Math.min(Math.max(currentConfig.playerCount, 2), 6) : usesWidePlayerOptions(game) ? Math.min(Math.max(currentConfig.playerCount, 2), 10) : Math.min(currentConfig.playerCount, 4),
      startingHandSize: game === 'dice' ? 5 : isGuoMemoryGame(game) ? 0 : game === 'guoPassage' ? Math.max(5, Math.min(10, currentConfig.startingHandSize || 7)) : currentConfig.startingHandSize,
      targetScore: game === 'dice' || game === 'guoPassage' ? 200 : currentConfig.targetScore,
    }))
    navigateToScreen('setup')
  }

  function startGame() {
    resetWinnerCelebration()
    if (config.game === 'quatro') {
      const game = createQuatroGame({
        mode: config.mode,
        aiDifficulty: config.aiDifficulty,
        avatarId: config.avatarId,
        random: runtimeQuatroRandom,
      })
      setQuatroState(game)
      quatroStateRef.current = game
      setSelectedQuatroTileId(null)
      setState(null)
      gameStateRef.current = null
      setMahjongState(null)
      mahjongStateRef.current = null
      setPendingChoice(null)
      setRevealedPlayerId(
        config.mode === 'hotseat' ? null : game.players[0].id,
      )
      navigateToScreen('table')
      return
    }
    if (isMahjongGame(config.game)) {
      const game = createMahjongGame({ mode: config.mode, aiDifficulty: config.aiDifficulty })
      lastAiHardwareWaitKey.current = null
      setMahjongState(game)
      mahjongStateRef.current = game
      setSelectedMahjongTileId(null)
      setState(null)
      gameStateRef.current = null
      setPendingChoice(null)
      setSkipBoDiscardPileIndex(null)
      setRevealedPlayerId(config.mode === 'hotseat' ? null : game.players[0].id)
      navigateToScreen('table')
      playSoundAfterUnlock(sound, 'mahjongWallBuild')
      return
    }
    const game = createGame(config)
    setMahjongState(null)
    mahjongStateRef.current = null
    setSelectedMahjongTileId(null)
    lastAiHardwareWaitKey.current = null
    setState(game)
    setPendingChoice(null)
    setSkipBoDiscardPileIndex(null)
    setRevealedPlayerId(config.mode === 'hotseat' ? null : game.players[0].id)
    navigateToScreen('table')
    sound?.play('deal')
  }

  function startNewSession() {
    resetWinnerCelebration()
    if (config.game === 'quatro') {
      const game = createQuatroGame({
        mode: config.mode,
        aiDifficulty: config.aiDifficulty,
        avatarId: config.avatarId,
        random: runtimeQuatroRandom,
      })
      setQuatroState(game)
      quatroStateRef.current = game
      setSelectedQuatroTileId(null)
      setState(null)
      gameStateRef.current = null
      setMahjongState(null)
      mahjongStateRef.current = null
      setRevealedPlayerId(
        config.mode === 'hotseat' ? null : game.players[0].id,
      )
      return
    }
    if (isMahjongGame(config.game)) {
      const game = createMahjongGame({ mode: config.mode, aiDifficulty: config.aiDifficulty })
      setMahjongState(game)
      mahjongStateRef.current = game
      setSelectedMahjongTileId(null)
      setState(null)
      gameStateRef.current = null
      setRevealedPlayerId(config.mode === 'hotseat' ? null : game.players[0].id)
      playSoundAfterUnlock(sound, 'mahjongWallBuild')
      return
    }
    const game = createGame(config)
    setMahjongState(null)
    mahjongStateRef.current = null
    setQuatroState(null)
    quatroStateRef.current = null
    setSelectedQuatroTileId(null)
    setSelectedMahjongTileId(null)
    lastAiHardwareWaitKey.current = null
    setState(game)
    setPendingChoice(null)
    setSkipBoDiscardPileIndex(null)
    setRevealedPlayerId(config.mode === 'hotseat' ? null : game.players[0].id)
    sound?.play('deal')
  }

  function stopLocalSessionAndOpenSetup() {
    resetWinnerCelebration()
    if (
      state?.config.mode === 'wifi'
      || (mahjongState && config.mode === 'wifi')
      || (quatroState && config.mode === 'wifi')
    ) {
      navigateToScreen('setup')
      return
    }
    setState(null)
    gameStateRef.current = null
    setMahjongState(null)
    mahjongStateRef.current = null
    setQuatroState(null)
    quatroStateRef.current = null
    setSelectedQuatroTileId(null)
    setSelectedMahjongTileId(null)
    setPendingChoice(null)
    setSkipBoDiscardPileIndex(null)
    setPassagePassMode(null)
    setRevealedPlayerId(null)
    navigateToScreen('setup')
  }

  function tryPlay(cardId: string, extraChoice: PlayChoice = {}) {
    if (!state || hiddenHands) return
    if (state.memoryActionEvent) return
    if (state.config.game === 'guoPassage') {
      if (state.passageTurn?.phase === 'pair') {
        if (isRemoteWifiClient) sendWifiAction({ type: 'passagePair', cardId })
        else updateState(passagePairWithCard(state, cardId), 'play')
        return
      }
      if (state.passageTurn?.phase === 'pass' && passagePassMode) {
        if (isRemoteWifiClient) sendWifiAction({ type: 'passagePass', cardId, faceDown: passagePassMode === 'faceDown' })
        else updateState(passagePassCard(state, cardId, passagePassMode === 'faceDown'), 'play')
        setPassagePassMode(null)
        return
      }
    }
    if (state.config.game === 'skipBo' && skipBoDiscardPileIndex !== null) {
      if (cardId.startsWith('skipbo:')) return
      if (isRemoteWifiClient) {
        sendWifiAction({ type: 'skipBoDiscard', cardId, pileIndex: skipBoDiscardPileIndex })
      } else {
        updateState(skipBoDiscardToPile(state, cardId, skipBoDiscardPileIndex), 'play')
      }
      setSkipBoDiscardPileIndex(null)
      return
    }
    if (teamPassMode && current && canPassToPartner(state, current.id)) {
      if (isRemoteWifiClient) {
        sendWifiAction({ type: 'teamPass', cardId })
      } else {
        updateState(passCardToPartner(state, current.id, cardId), 'play')
      }
      setTeamPassMode(false)
      return
    }
    const speedPlayerId = localSpeedPlayerId(state, wifiLocalPlayerId)
    const speedPlayer = speedPlayerId ? state.players.find((player) => player.id === speedPlayerId) : undefined
    const speedCard = speedPlayer?.hand.find((card) => card.id === cardId)
    if (speedPlayerId && speedCard && canPartySpeedPlayCutIn(speedCard, state, speedPlayerId)) {
      if (isRemoteWifiClient) {
        sendWifiAction({ type: 'speedPlay', cardId })
      } else {
        const result = speedPlayCutIn(state, speedPlayerId, cardId)
        updateState(result.state, result.sound)
      }
      return
    }
    if (isGuoMemoryGame(state.config.game) && cardId.startsWith('memory-slot:')) {
      const slotIndex = Number(cardId.split(':')[1])
      if (Number.isNaN(slotIndex)) return
      if (isRemoteWifiClient) {
        sendWifiAction({ type: 'memorySelectSlot', slotIndex })
      } else {
        updateState(memorySelectSlot(state, slotIndex), 'play')
      }
      return
    }
    if (isGridMemoryGame(state.config.game) && cardId.startsWith('zero-slot:')) {
      const [, targetPlayerId, rawSlotIndex] = cardId.split(':')
      const slotIndex = Number(rawSlotIndex)
      if (Number.isNaN(slotIndex)) return
      if (state.config.game === 'cabo' && state.pendingCaboPower && targetPlayerId) {
        if (isRemoteWifiClient) {
          sendWifiAction({ type: 'caboResolvePower', targetPlayerId, slotIndex })
        } else {
          updateState(caboResolvePower(state, targetPlayerId, slotIndex), 'play')
        }
        return
      }
      if (isRemoteWifiClient) {
        sendWifiAction({ type: 'zeroSwapGrid', slotIndex })
      } else {
        updateState(zeroSwapDrawnIntoGrid(state, slotIndex), 'play')
      }
      return
    }
    if (isRemoteWifiClient) {
      const result = playCard(state, cardId, extraChoice)
      if (result.needsChoice) {
        setPendingChoice({ request: result.needsChoice, partial: extraChoice })
        sound?.play(result.sound)
        return
      }
      sendWifiAction({ type: 'playCard', cardId, choice: extraChoice })
      setPendingChoice(null)
      return
    }
    const result = playCard(state, cardId, extraChoice)
    if (result.needsChoice) {
      setPendingChoice({ request: result.needsChoice, partial: extraChoice })
      sound?.play(result.sound)
      return
    }
    setPendingChoice(null)
    updateState(result.state, result.sound)
  }

  function answerChoice(choice: PlayChoice) {
    const cardId = pendingChoice?.request.cardId
    if (!state || !pendingChoice || !cardId) return
    const pending = pendingChoice
    const merged = { ...pending.partial, ...choice }
    if (isRemoteWifiClient) {
      const result = playCard(state, cardId, merged)
      if (result.needsChoice) {
        setPendingChoice({ request: result.needsChoice, partial: merged })
        return
      }
      setPendingChoice(null)
      sendWifiAction({ type: 'playCard', cardId, choice: merged })
      return
    }
    const result = playCard(state, cardId, merged)
    if (result.needsChoice) {
      setPendingChoice({ request: result.needsChoice, partial: merged })
      return
    }
    setPendingChoice(null)
    updateState(result.state, result.sound)
  }

  useEffect(() => {
    if (!isWifiHost || !state || pendingWifiActions.length === 0 || isBlockingAnimationActive) return
    if (state.memoryActionEvent) return
    const timer = window.setTimeout(() => {
      const pending = pendingWifiActions[0]
      const result = applyWifiAction(state, pending.clientId, pending.action)
      setPendingWifiActions((actions) => actions.slice(1))
      if (result) updateState(result.state, result.sound)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [isBlockingAnimationActive, isWifiHost, pendingWifiActions, state, updateState])

  useEffect(() => {
    if (!isWifiHost || !mahjongState || pendingWifiActions.length === 0 || isBlockingAnimationActive) return
    const timer = window.setTimeout(() => {
      const pending = pendingWifiActions[0]
      const result = applyMahjongWifiAction(mahjongState, pending.clientId, pending.action)
      setPendingWifiActions((actions) => actions.slice(1))
      if (result) updateMahjongState(result.state, result.sound)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [isBlockingAnimationActive, isWifiHost, mahjongState, pendingWifiActions, updateMahjongState])

  function updateConfig(patch: Partial<GameConfig>) {
    setConfig((currentConfig) => ({ ...currentConfig, ...patch }))
  }

  function updateAudioSettings(patch: Partial<AudioSettings>) {
    if (patch.backgroundMusicEnabled === true || patch.soundEffectsEnabled === true) {
      void sound?.unlock()
    }
    setAudioSettings((currentSettings) => ({ ...currentSettings, ...patch }))
  }

  function toggleAddOn(addOn: AddOnPack) {
    setConfig((currentConfig) => ({
      ...currentConfig,
      addOns: {
        ...currentConfig.addOns,
        [addOn]: !currentConfig.addOns[addOn],
      },
    }))
  }

  function getWifiClient() {
    if (wifiClient.current) return wifiClient.current
    setWifiState((currentState) => ({ ...currentState, status: 'connecting', error: null }))
    wifiClient.current = createLocalWifiClient({
      onState: (patch) => {
        setWifiState((currentState) => {
          const requestedGame = pendingHostedGameRef.current
          const isHostRoomEcho = Boolean(patch.room && currentState.clientId === patch.room.hostId && requestedGame)
          const room =
            patch.room && isHostRoomEcho && patch.room.game !== requestedGame
              ? { ...patch.room, game: requestedGame! }
              : patch.room
          return {
            ...currentState,
            ...patch,
            room: room ?? patch.room ?? currentState.room,
            error: patch.error ?? currentState.error,
          }
        })
        if (patch.room) {
          setConfig((currentConfig) => {
            const requestedGame = pendingHostedGameRef.current
            const game = requestedGame && patch.room!.game !== requestedGame ? requestedGame : patch.room!.game
            return { ...currentConfig, game, h2oSplash: game === 'h2o' && patch.room!.h2oSplash }
          })
        }
      },
      onGameSnapshot: (snapshot) => {
        const room = wifiStateRef.current.room
        if (room && wifiStateRef.current.clientId === room.hostId) return
        if (snapshot.mahjongState) {
          const hadWifiMahjong = Boolean(mahjongStateRef.current && config.mode === 'wifi')
          const previousMahjongState = mahjongStateRef.current
          setWifiSnapshotPlayerId(snapshot.localPlayerId)
          setMahjongState(snapshot.mahjongState)
          mahjongStateRef.current = snapshot.mahjongState
          setSelectedMahjongTileId(null)
          setState(null)
          gameStateRef.current = null
          setPendingChoice(null)
          setRevealedPlayerId(snapshot.localPlayerId)
          if (!hadWifiMahjong || screenRef.current === 'table') {
            navigateToScreen('table')
          }
          sound?.play(soundCueForMahjongTransition(previousMahjongState, snapshot.mahjongState, 'play'))
          return
        }
        if (!snapshot.state) return
        const hadWifiGame = gameStateRef.current?.config.mode === 'wifi'
        if (snapshot.state.winnerId) startWinnerCelebration(snapshot.state)
        else finishWinnerCelebration()
        setWifiSnapshotPlayerId(snapshot.localPlayerId)
        setState(snapshot.state)
        gameStateRef.current = snapshot.state
        setMahjongState(null)
        mahjongStateRef.current = null
        setSelectedMahjongTileId(null)
        setPendingChoice(null)
        setRevealedPlayerId(snapshot.localPlayerId)
        if (!hadWifiGame || screenRef.current === 'table') {
          navigateToScreen('table')
        }
      },
      onPlayerAction: (clientId, action) => setPendingWifiActions((actions) => [...actions, { clientId, action }]),
      onRoomClosed: () => {
        pendingHostedGameRef.current = null
        setState(null)
        gameStateRef.current = null
        setMahjongState(null)
        mahjongStateRef.current = null
        setSelectedMahjongTileId(null)
        setPendingChoice(null)
        setWifiSnapshotPlayerId(null)
        setPendingWifiActions([])
        navigateToScreen('setup')
      },
    })
    return wifiClient.current
  }

  function hostWifiRoom() {
    pendingHostedGameRef.current = config.game
    getWifiClient().hostRoom({
      name: wifiName,
      maxPlayers: config.playerCount,
      game: config.game,
      h2oSplash: config.game === 'h2o' && config.h2oSplash,
      allowAi: wifiAllowAi,
      aiDifficulty: config.aiDifficulty,
      avatarId: config.avatarId,
    })
  }

  function joinWifiRoom() {
    getWifiClient().joinRoom({
      name: wifiName,
      code: wifiJoinCode,
      avatarId: config.avatarId,
    })
  }

  function leaveWifiRoom() {
    pendingHostedGameRef.current = null
    wifiClient.current?.leaveRoom()
    setWifiState(initialWifiClientState)
    setState(null)
    gameStateRef.current = null
    setMahjongState(null)
    mahjongStateRef.current = null
    setSelectedMahjongTileId(null)
    setPendingChoice(null)
    setWifiSnapshotPlayerId(null)
    setPendingWifiActions([])
  }

  function closeWifiRoom() {
    pendingHostedGameRef.current = null
    wifiClient.current?.closeRoom()
    setWifiState(initialWifiClientState)
    setState(null)
    gameStateRef.current = null
    setMahjongState(null)
    mahjongStateRef.current = null
    setSelectedMahjongTileId(null)
    setPendingChoice(null)
    setWifiSnapshotPlayerId(null)
    setPendingWifiActions([])
  }

  function resumeWifiSession() {
    if (state?.config.mode !== 'wifi' && !(mahjongState && config.mode === 'wifi')) return
    setPendingChoice(null)
    setRevealedPlayerId(wifiSnapshotPlayerId ?? wifiState.clientId)
    navigateToScreen('table')
  }

  function startWifiGame() {
    const room = wifiState.room
    if (!room || wifiState.clientId !== room.hostId) return
    const humans = room.players.map((player) => ({ id: player.id, name: player.name, type: 'human' as const, avatarId: player.avatarId }))
    const aiCount = room.allowAi ? Math.max(0, room.maxPlayers - humans.length) : 0
    if (humans.length + aiCount < 2) return
    if ((room.game === 'teams' || isMahjongGame(room.game)) && humans.length + aiCount !== 4) return
    const participants = [
      ...humans,
      ...Array.from({ length: aiCount }, (_, index) => ({
        id: `ai-${index + 1}`,
        name: `AI ${humans.length + index + 1}`,
        type: 'ai' as const,
        avatarId: avatarIds[(humans.length + index + 1) % avatarIds.length],
      })),
    ]
    if (isMahjongGame(room.game)) {
      const game = createMahjongGame({
        mode: 'wifi',
        playerIds: participants.map((participant) => participant.id),
        aiDifficulty: room.aiDifficulty,
      })
      game.players = game.players.map((player, index) => ({
        ...player,
        id: participants[index].id,
        name: participants[index].name,
        type: participants[index].type,
        aiDifficulty: participants[index].type === 'ai' ? room.aiDifficulty : undefined,
      }))
      lastAiHardwareWaitKey.current = null
      setPendingChoice(null)
      setState(null)
      gameStateRef.current = null
      setSelectedMahjongTileId(null)
      setRevealedPlayerId(wifiState.clientId)
      setWifiSnapshotPlayerId(wifiState.clientId)
      navigateToScreen('table')
      updateMahjongState(game)
      playSoundAfterUnlock(sound, 'mahjongWallBuild')
      return
    }
    const game = createGame({
      ...config,
      game: room.game,
      mode: 'wifi',
      playerCount: participants.length,
      aiDifficulty: room.aiDifficulty,
      h2oSplash: room.game === 'h2o' && room.h2oSplash,
    })
    lastAiHardwareWaitKey.current = null
    const idMap: Record<string, string> = Object.fromEntries(game.players.map((player, index) => [player.id, participants[index].id]))
    game.players = game.players.map((player, index) => ({
      ...player,
      id: participants[index].id,
      name: participants[index].name,
      type: participants[index].type,
      aiDifficulty: participants[index].type === 'ai' ? room.aiDifficulty : undefined,
      avatarId: participants[index].avatarId,
    }))
    if (game.config.game === 'cabo') {
      game.players = remapCaboGridKnowledge(game.players, idMap)
    }
    setPendingChoice(null)
    setMahjongState(null)
    mahjongStateRef.current = null
    setSelectedMahjongTileId(null)
    setRevealedPlayerId(wifiState.clientId)
    setWifiSnapshotPlayerId(wifiState.clientId)
    navigateToScreen('table')
    updateState(game, 'deal')
  }

  function sendWifiAction(action: WifiPlayerAction) {
    wifiClient.current?.sendPlayerAction(action)
  }

  function acceptCurrentLiarClaim() {
    if (!state) return
    if (isRemoteWifiClient) sendWifiAction({ type: 'liarAccept' })
    else updateState(acceptLiarClaim(state), 'action')
  }

  function challengeCurrentLiarClaim() {
    if (!state) return
    if (isRemoteWifiClient) sendWifiAction({ type: 'liarChallenge' })
    else updateState(challengeLiarClaim(state, wifiLocalPlayerId), 'action')
  }

  function handleMahjongAction(action: MahjongControlAction) {
    if (!mahjongState) return
    if (action === 'nextRound') {
      if (isRemoteMahjongWifiClient) return
      updateMahjongState(mahjongStartNextRound(mahjongState), 'deal')
      return
    }
    if (!mahjongControlPlayerId) return
    if (action === 'draw') {
      if (isRemoteMahjongWifiClient) sendWifiAction({ type: 'mahjongDraw' })
      else updateMahjongState(mahjongDraw(mahjongState), 'draw')
      return
    }
    if (action === 'discard') {
      const active = mahjongState.players[mahjongState.activePlayerIndex]
      const fallbackTileId = active?.concealed.length ? chooseMahjongDiscard(active.concealed, config.aiDifficulty).tile.id : null
      const tileId = selectedMahjongTileId && active?.concealed.some((tile) => tile.id === selectedMahjongTileId) ? selectedMahjongTileId : fallbackTileId
      if (!tileId) return
      if (isRemoteMahjongWifiClient) sendWifiAction({ type: 'mahjongDiscard', tileId })
      else updateMahjongState(mahjongDiscard(mahjongState, tileId), 'play')
      return
    }
    if (action === 'declareWin') {
      if (isRemoteMahjongWifiClient) sendWifiAction({ type: 'mahjongDeclareWin' })
      else updateMahjongState(mahjongDeclareWin(mahjongState), 'win')
      return
    }
    if (action === 'declareKong') {
      if (isRemoteMahjongWifiClient) sendWifiAction({ type: 'mahjongDeclareKong', tileId: selectedMahjongTileId ?? undefined })
      else updateMahjongState(mahjongDeclareKong(mahjongState, selectedMahjongTileId ?? undefined), 'play')
      return
    }
    if (action === 'pass') {
      if (isRemoteMahjongWifiClient) sendWifiAction({ type: 'mahjongPass' })
      else updateMahjongState(mahjongPassClaim(mahjongState, mahjongControlPlayerId), 'play')
      return
    }
    const claimAction = mahjongClaimActionFromControl(action)
    if (!claimAction) return
    const option = mahjongLegalClaimOptions(mahjongState, mahjongControlPlayerId).find((candidate) => candidate.action === claimAction)
    if (!option) return
    if (isRemoteMahjongWifiClient) sendWifiAction({ type: 'mahjongClaim', claimAction, tileIds: option.tileIds })
    else updateMahjongState(mahjongClaim(mahjongState, mahjongControlPlayerId, claimAction, option.tileIds), claimAction === 'win' ? 'win' : 'play')
  }

  return (
    <main className={`app-shell ${theme === 'light' ? 'light-theme' : 'dark-theme'}`}>
      {screen === 'home' && (
        <section className="home-screen">
          <div className="home-controls">
            <LanguagePicker language={language} onChange={setLanguage} />
            <ThemeToggle language={language} theme={theme} onChange={setTheme} />
          </div>
          <div className="brand-block">
            <p className="eyebrow">{t(language, 'appName')}</p>
            <h1>{t(language, 'chooseTable')}</h1>
            <p className="lead">{t(language, 'homeLead')}</p>
          </div>
          <div className="game-grid">
            {games.map((game, index) => {
              const playableGame = playableGames[index]
              return (
                <button
                  className={`game-tile ${playableGame ? 'ready' : ''} ${playableGame && !isGuoExclusiveGame(playableGame) ? 'green-edition' : ''} ${playableGame && isGuoExclusiveGame(playableGame) ? 'exclusive-golden' : ''}`}
                  key={game}
                  type="button"
                  disabled={!playableGame}
                  onClick={() => selectGame(index)}
                >
                  <span>{game}</span>
                  <small>{playableGame ? t(language, 'playable') : t(language, 'planned')}</small>
                </button>
              )
            })}
            <MoreGamesTile ref={moreGamesTileRef} onOpen={() => setMoreGamesOpen(true)} />
          </div>
        </section>
      )}

      {screen === 'home' && moreGamesOpen && (
        <MoreGamesUnlockModal
          language={language}
          onCancel={closeMoreGames}
          onUnlocked={selectUnlockedGame}
        />
      )}

      {screen === 'setup' && (
        <section className="setup-screen">
          <div className="setup-header">
            <button className="ghost-button" type="button" onClick={() => navigateToScreen('home')}>
              {t(language, 'back')}
            </button>
            <div className="brand-block">
              <p className="eyebrow">{gameNumberLabel(config.game)}</p>
              <h1>{gameTitle(config.game, config.h2oSplash)}</h1>
            </div>
            <LanguagePicker language={language} onChange={setLanguage} compact />
            <ThemeToggle language={language} theme={theme} onChange={setTheme} compact />
            <button className="primary-button" type="button" onClick={startGame} disabled={config.mode === 'wifi'}>
              {t(language, 'start')}
            </button>
          </div>

          <div className="setup-layout">
            <section className="setup-panel">
              <h2>{t(language, 'mode')}</h2>
              <div className="segmented">
                {modeOptions(language).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={config.mode === option.id ? 'selected' : ''}
                    onClick={() => updateConfig({ mode: option.id })}
                    title={option.description}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button className="ghost-button rules-button" type="button" onClick={() => setRulesOpen(true)}>
                {t(language, 'rules')}
              </button>
              {config.mode === 'wifi' && <p className="hint">{t(language, 'localWifiHint')}</p>}
            </section>

            <section className="setup-panel">
              <h2>{t(language, 'players')}</h2>
              {config.game === 'teams' || isMahjongGame(config.game) || config.game === 'dice' || config.game === 'quatro' ? (
                <div className="field-row">
                  <span>{t(language, 'totalPlayers')}</span>
                  <strong>{config.game === 'dice' || config.game === 'quatro' ? 2 : 4}</strong>
                </div>
              ) : config.game === 'party' || usesWidePlayerOptions(config.game) ? (
                <label className="field-row">
                  <span>{t(language, 'totalPlayers')}</span>
                  <select
                    value={config.playerCount}
                    onChange={(event) => updateConfig({ playerCount: Number(event.target.value) })}
                  >
                    {(config.game === 'party' ? partyPlayerOptions : config.game === 'phase10' ? phase10PlayerOptions : config.game === 'skipBo' ? skipBoPlayerOptions : allWildPlayerOptions).map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                  <strong>{config.playerCount}</strong>
                </label>
              ) : (
                <label className="field-row">
                  <span>{t(language, 'totalPlayers')}</span>
                  <input
                    type="range"
                    min="2"
                    max="4"
                    value={Math.min(config.playerCount, 4)}
                    onChange={(event) => updateConfig({ playerCount: Number(event.target.value) })}
                  />
                  <strong>{Math.min(config.playerCount, 4)}</strong>
                </label>
              )}
              {config.game !== 'quatro' && (isMahjongGame(config.game) ? (
                <div className="field-row">
                  <span>{mahjongLabel(language, 'ruleProfile')}</span>
                  <strong>{mahjongLabel(language, 'standard')}</strong>
                </div>
              ) : config.game === 'dice' ? (
                <div className="field-row">
                  <span>{t(language, 'startingCards')}</span>
                  <strong>5</strong>
                </div>
              ) : isGuoMemoryGame(config.game) ? (
                <div className="field-row">
                  <span>{t(language, 'startingCards')}</span>
                  <strong>0</strong>
                </div>
              ) : (
                <label className="field-row">
                  <span>{t(language, 'startingCards')}</span>
                  <select
                    value={config.startingHandSize}
                    onChange={(event) => updateConfig({ startingHandSize: Number(event.target.value) })}
                  >
                    {[5, 6, 7, 8, 9, 10].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <strong>{config.startingHandSize}</strong>
                </label>
              ))}
              {config.game !== 'quatro' && (isMahjongGame(config.game) ? (
                <div className="field-row">
                  <span>{t(language, 'sessionTarget')}</span>
                  <strong>{mahjongLabel(language, 'winRound')}</strong>
                </div>
              ) : config.game === 'dice' ? (
                <div className="field-row">
                  <span>{t(language, 'sessionTarget')}</span>
                  <strong>200</strong>
                </div>
              ) : config.game === 'h2o' && config.h2oSplash ? (
                <div className="field-row">
                  <span>{t(language, 'sessionTarget')}</span>
                  <strong>{h2oSplashTargetLabel(language)}</strong>
                </div>
              ) : (
                <label className="field-row">
                  <span>{t(language, 'sessionTarget')}</span>
                  <select
                    value={config.targetScore}
                    onChange={(event) => updateConfig({ targetScore: Number(event.target.value) })}
                  >
                    {(config.game === 'guoPassage' ? [100, 200, 300, 400, 500] : targetScoreOptions).map((score) => (
                      <option key={score} value={score}>
                        {score}
                      </option>
                    ))}
                  </select>
                  <strong>{config.targetScore}</strong>
                </label>
              ))}
              <label className="field-row">
                <span>{t(language, 'aiDifficulty')}</span>
                <select
                  value={config.aiDifficulty}
                  onChange={(event) => updateConfig({ aiDifficulty: event.target.value as AiDifficulty })}
                  disabled={config.mode === 'hotseat'}
                >
                  <option value="easy">{t(language, 'easy')}</option>
                  <option value="medium">{t(language, 'medium')}</option>
                  <option value="hard">{t(language, 'hard')}</option>
                </select>
              </label>
              {config.mode === 'spectacular' && (
                <label className="field-row">
                  <span>{t(language, 'spectacularDelay')}</span>
                  <select
                    value={config.spectacularDelaySeconds}
                    onChange={(event) => updateConfig({ spectacularDelaySeconds: Number(event.target.value) })}
                  >
                    {[2, 3, 4, 5].map((seconds) => (
                      <option key={seconds} value={seconds}>
                        {seconds}
                      </option>
                    ))}
                  </select>
                  <strong>{config.spectacularDelaySeconds}s</strong>
                </label>
              )}
              {config.game === 'flash' && (
                <label className="field-row">
                  <span>{t(language, 'flashTimer')}</span>
                  <select
                    value={config.flashTimerSeconds}
                    onChange={(event) => updateConfig({ flashTimerSeconds: Number(event.target.value) })}
                  >
                    <option value={0}>{t(language, 'flashTimerOff')}</option>
                    <option value={6}>6s</option>
                    <option value={4}>4s</option>
                  </select>
                  <strong>{config.flashTimerSeconds > 0 ? `${config.flashTimerSeconds}s` : t(language, 'flashTimerOff')}</strong>
                </label>
              )}
            </section>

            {isGuoMemoryGame(config.game) && (
              <section className="setup-panel wide">
                <h2>{memoryOptionsTitle(language)}</h2>
                <div className="segmented">
                  {(['easy', 'medium', 'hard'] as MemoryDifficulty[]).map((difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      className={config.memoryDifficulty === difficulty ? 'selected' : ''}
                      onClick={() => updateConfig({ memoryDifficulty: difficulty })}
                    >
                      {memoryDifficultyLabel(language, difficulty, config.game)}
                    </button>
                  ))}
                </div>
                <div className="segmented">
                  {(['number', 'color', 'both'] as MemoryMatchMode[]).map((matchMode) => (
                    <button
                      key={matchMode}
                      type="button"
                      className={config.memoryMatchMode === matchMode ? 'selected' : ''}
                      onClick={() => updateConfig({ memoryMatchMode: matchMode })}
                    >
                      {memoryMatchModeLabel(language, matchMode)}
                    </button>
                  ))}
                </div>
                <label className="field-row">
                  <span>{memoryRevealDurationTitle(language)}</span>
                  <select
                    value={config.memoryRevealSeconds}
                    onChange={(event) => updateConfig({ memoryRevealSeconds: Number(event.target.value) })}
                  >
                    {[2, 3, 4, 5].map((seconds) => (
                      <option key={seconds} value={seconds}>
                        {seconds}s
                      </option>
                    ))}
                  </select>
                  <strong>{config.memoryRevealSeconds}s</strong>
                </label>
              </section>
            )}

            {config.game === 'guoNeighborMatch' && (
              <section className="setup-panel wide">
                <h2>{neighborOptionsTitle(language)}</h2>
                <div className="segmented">
                  <button
                    type="button"
                    className={!config.neighborColorConstrained ? 'selected' : ''}
                    onClick={() => updateConfig({ neighborColorConstrained: false })}
                  >
                    {neighborModeLabel(language, false)}
                  </button>
                  <button
                    type="button"
                    className={config.neighborColorConstrained ? 'selected' : ''}
                    onClick={() => updateConfig({ neighborColorConstrained: true })}
                  >
                    {neighborModeLabel(language, true)}
                  </button>
                </div>
                <p className="hint">{neighborModeDescription(language, config.neighborColorConstrained)}</p>
              </section>
            )}

            {config.game === 'guoHiLo' && (
              <section className="setup-panel wide">
                <h2>{hiLoOptionsTitle(language)}</h2>
                <div className="segmented">
                  <button
                    type="button"
                    className={!config.hiLoColorConstrained ? 'selected' : ''}
                    onClick={() => updateConfig({ hiLoColorConstrained: false })}
                  >
                    {hiLoModeLabel(language, false)}
                  </button>
                  <button
                    type="button"
                    className={config.hiLoColorConstrained ? 'selected' : ''}
                    onClick={() => updateConfig({ hiLoColorConstrained: true })}
                  >
                    {hiLoModeLabel(language, true)}
                  </button>
                </div>
                <p className="hint">{hiLoModeDescription(language, config.hiLoColorConstrained)}</p>
              </section>
            )}

            {config.game === 'guoPassage' && (
              <section className="setup-panel wide">
                <h2>{passageOptionsTitle(language)}</h2>
                <div className="segmented">
                  {(['number', 'color', 'both'] as MemoryMatchMode[]).map((matchMode) => (
                    <button
                      key={matchMode}
                      type="button"
                      className={config.memoryMatchMode === matchMode ? 'selected' : ''}
                      onClick={() => updateConfig({ memoryMatchMode: matchMode })}
                    >
                      {memoryMatchModeLabel(language, matchMode)}
                    </button>
                  ))}
                </div>
                <p className="hint">{passageModeDescription(language, config.memoryMatchMode)}</p>
              </section>
            )}

            <section className="setup-panel">
              <h2>{visualThemeTitle(language)}</h2>
              <label className="field-row">
                <span>{tableThemeTitle(language)}</span>
                <select
                  value={config.tableTheme}
                  onChange={(event) => updateConfig({ tableTheme: event.target.value as TableTheme })}
                >
                  {tableThemes.map((themeId) => (
                    <option key={themeId} value={themeId}>
                      {tableThemeName(language, themeId)}
                    </option>
                  ))}
                </select>
                <strong></strong>
              </label>
              <label className="field-row">
                <span>{deckThemeTitle(language)}</span>
                <select
                  value={config.deckTheme}
                  onChange={(event) => updateConfig({ deckTheme: event.target.value as DeckTheme })}
                >
                  {deckThemes.map((themeId) => (
                    <option key={themeId} value={themeId}>
                      {deckThemeName(language, themeId)}
                    </option>
                  ))}
                </select>
                <strong></strong>
              </label>
              {isMahjongGame(config.game) && (
                <>
                  <label className="field-row">
                    <span>{mahjongVisualControlTitle(language, 'felt')}</span>
                    <select
                      value={mahjongVisualTheme.felt}
                      onChange={(event) => setMahjongVisualTheme((current) => ({ ...current, felt: event.target.value as MahjongTableFeltTheme }))}
                    >
                      {mahjongTableFeltThemes.map((themeId) => (
                        <option key={themeId} value={themeId}>
                          {mahjongVisualOptionName(language, 'felt', themeId)}
                        </option>
                      ))}
                    </select>
                    <strong></strong>
                  </label>
                  <label className="field-row">
                    <span>{mahjongVisualControlTitle(language, 'frame')}</span>
                    <select
                      value={mahjongVisualTheme.frame}
                      onChange={(event) => setMahjongVisualTheme((current) => ({ ...current, frame: event.target.value as MahjongTableFrameTheme }))}
                    >
                      {mahjongTableFrameThemes.map((themeId) => (
                        <option key={themeId} value={themeId}>
                          {mahjongVisualOptionName(language, 'frame', themeId)}
                        </option>
                      ))}
                    </select>
                    <strong></strong>
                  </label>
                  <label className="field-row">
                    <span>{mahjongVisualControlTitle(language, 'centerPattern')}</span>
                    <select
                      value={mahjongVisualTheme.centerPattern}
                      onChange={(event) => setMahjongVisualTheme((current) => ({ ...current, centerPattern: event.target.value as MahjongCenterPattern }))}
                    >
                      {mahjongCenterPatterns.map((themeId) => (
                        <option key={themeId} value={themeId}>
                          {mahjongVisualOptionName(language, 'centerPattern', themeId)}
                        </option>
                      ))}
                    </select>
                    <strong></strong>
                  </label>
                  <label className="field-row">
                    <span>{mahjongVisualControlTitle(language, 'tileDeck')}</span>
                    <select
                      value={mahjongVisualTheme.tileDeck}
                      onChange={(event) => setMahjongVisualTheme((current) => ({ ...current, tileDeck: event.target.value as MahjongTileDeckTheme }))}
                    >
                      {mahjongTileDeckThemes.map((themeId) => (
                        <option key={themeId} value={themeId}>
                          {mahjongVisualOptionName(language, 'tileDeck', themeId)}
                        </option>
                      ))}
                    </select>
                    <strong></strong>
                  </label>
                </>
              )}
              {(config.mode === 'single' || config.mode === 'wifi') && (
                <label className="field-row">
                  <span>{avatarTitle(language)}</span>
                  <select
                    value={config.avatarId}
                    onChange={(event) => updateConfig({ avatarId: event.target.value as AvatarId })}
                  >
                    {avatarIds.map((avatarId) => (
                      <option key={avatarId} value={avatarId}>
                        {avatarName(language, avatarId)}
                      </option>
                    ))}
                  </select>
                  <span className={`avatar-chip ${config.avatarId}`}>{avatarInitial(config.avatarId)}</span>
                </label>
              )}
              <label className="field-row">
                <span>{hardwarePopupDurationTitle(language)}</span>
                <select
                  value={config.hardwarePopupSeconds}
                  onChange={(event) => updateConfig({ hardwarePopupSeconds: Number(event.target.value) })}
                >
                  {[2, 3, 4, 5].map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {seconds}s
                    </option>
                  ))}
                </select>
                <strong>{config.hardwarePopupSeconds}s</strong>
              </label>
            </section>

            <section className="setup-panel">
              <h2>{animationSettingsTitle(language)}</h2>
              <label className="addon-option visual-checkbox">
                <input
                  type="checkbox"
                  checked={config.roundStartFlourish}
                  onChange={(event) => updateConfig({ roundStartFlourish: event.target.checked })}
                />
                <span>
                  <strong>{roundStartFlourishTitle(language)}</strong>
                  <small>{roundStartFlourishDescription(language)}</small>
                </span>
              </label>
              <label className="field-row">
                <span>{cardFlourishStyleTitle(language)}</span>
                <select
                  value={config.cardFlourishStyle}
                  onChange={(event) => updateConfig({ cardFlourishStyle: event.target.value as CardFlourishStyle })}
                  disabled={!config.roundStartFlourish}
                >
                  {cardFlourishStyles.map((style) => (
                    <option key={style} value={style}>
                      {cardFlourishStyleName(language, style)}
                    </option>
                  ))}
                </select>
                <strong></strong>
              </label>
              <label className="addon-option visual-checkbox">
                <input
                  type="checkbox"
                  checked={config.dealAnimation}
                  onChange={(event) => updateConfig({ dealAnimation: event.target.checked })}
                />
                <span>
                  <strong>{dealAnimationTitle(language)}</strong>
                  <small>{dealAnimationDescription(language)}</small>
                </span>
              </label>
              <label className="addon-option visual-checkbox">
                <input
                  type="checkbox"
                  checked={config.winnerCelebration}
                  onChange={(event) => updateConfig({ winnerCelebration: event.target.checked })}
                />
                <span>
                  <strong>{winnerCelebrationTitle(language)}</strong>
                  <small>{winnerCelebrationDescription(language)}</small>
                </span>
              </label>
              <label className="field-row">
                <span>{animationSpeedTitle(language)}</span>
                <select
                  value={config.animationSpeed}
                  onChange={(event) => updateConfig({ animationSpeed: event.target.value as AnimationSpeed })}
                >
                  {animationSpeeds.map((speed) => (
                    <option key={speed} value={speed}>
                      {animationSpeedName(language, speed)}
                    </option>
                  ))}
                </select>
                <strong>{animationSpeedName(language, config.animationSpeed)}</strong>
              </label>
              <label className="addon-option visual-checkbox">
                <input
                  type="checkbox"
                  checked={config.reducedMotion}
                  onChange={(event) => updateConfig({ reducedMotion: event.target.checked })}
                />
                <span>
                  <strong>{reducedMotionTitle(language)}</strong>
                  <small>{reducedMotionDescription(language)}</small>
                </span>
              </label>
            </section>

            <section className="setup-panel">
              <h2>{audioSettingsTitle(language)}</h2>
              <label className="field-row audio-field-row">
                <span>{masterVolumeTitle(language)}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.masterVolume}
                  onChange={(event) => updateAudioSettings({ masterVolume: Number(event.target.value) })}
                />
                <strong>{volumePercent(audioSettings.masterVolume)}</strong>
              </label>
              <label className="addon-option visual-checkbox">
                <input
                  type="checkbox"
                  checked={audioSettings.soundEffectsEnabled}
                  onChange={(event) => updateAudioSettings({ soundEffectsEnabled: event.target.checked })}
                />
                <span>
                  <strong>{soundEffectsTitle(language)}</strong>
                  <small>{soundEffectsDescription(language)}</small>
                </span>
              </label>
              <label className="field-row audio-field-row">
                <span>{soundEffectsVolumeTitle(language)}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.soundEffectsVolume}
                  onChange={(event) => updateAudioSettings({ soundEffectsVolume: Number(event.target.value) })}
                  disabled={!audioSettings.soundEffectsEnabled}
                />
                <strong>{volumePercent(audioSettings.soundEffectsVolume)}</strong>
              </label>
              <label className="addon-option visual-checkbox">
                <input
                  type="checkbox"
                  checked={audioSettings.backgroundMusicEnabled}
                  onChange={(event) => updateAudioSettings({ backgroundMusicEnabled: event.target.checked })}
                />
                <span>
                  <strong>{backgroundMusicTitle(language)}</strong>
                  <small>{backgroundMusicDescription(language)}</small>
                </span>
              </label>
              <label className="field-row audio-field-row">
                <span>{backgroundMusicVolumeTitle(language)}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.backgroundMusicVolume}
                  onChange={(event) => updateAudioSettings({ backgroundMusicVolume: Number(event.target.value) })}
                  disabled={!audioSettings.backgroundMusicEnabled}
                />
                <strong>{volumePercent(audioSettings.backgroundMusicVolume)}</strong>
              </label>
            </section>

            {config.mode === 'wifi' && (
              <LocalWifiPanel
                language={language}
                state={wifiState}
                playerName={wifiName}
                joinCode={wifiJoinCode}
                allowAi={wifiAllowAi}
                config={config}
                onPlayerNameChange={setWifiName}
                onJoinCodeChange={setWifiJoinCode}
                onAllowAiChange={setWifiAllowAi}
                onHost={hostWifiRoom}
                onJoin={joinWifiRoom}
                onLeave={leaveWifiRoom}
                onCloseRoom={closeWifiRoom}
                onResumeSession={resumeWifiSession}
                onStartGame={startWifiGame}
                canResumeSession={Boolean(wifiState.room && (state?.config.mode === 'wifi' || (mahjongState && config.mode === 'wifi')))}
              />
            )}

            {config.game === 'classic' && <section className="setup-panel wide">
              <h2>{t(language, 'addOnPacks')}</h2>
              <div className="addon-grid">
                {addOnInfo(language).map((pack) => (
                  <label className="addon-option" key={pack.id}>
                    <input type="checkbox" checked={config.addOns[pack.id]} onChange={() => toggleAddOn(pack.id)} />
                    <span>
                      <strong>{pack.title}</strong>
                      <small>{pack.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </section>}

            {config.game === 'h2o' && <section className="setup-panel wide">
              <h2>{h2oOptionsTitle(language)}</h2>
              <label className="addon-option">
                <input
                  type="checkbox"
                  checked={config.h2oSplash}
                  onChange={(event) => updateConfig({ h2oSplash: event.target.checked })}
                />
                <span>
                  <strong>{h2oSplashTitle(language)}</strong>
                  <small>{h2oSplashDescription(language)}</small>
                </span>
              </label>
            </section>}
          </div>
        </section>
      )}

      {screen === 'table' && quatroState && (
        <section className="table-screen quatro-table-screen">
          <header className="table-toolbar">
            <button
              className="ghost-button"
              type="button"
              onClick={stopLocalSessionAndOpenSetup}
            >
              {t(language, 'setup')}
            </button>
            <div className="table-title-block">
              <div className="table-title-text">
                <strong>{quatroText(language, 'gameTitle')}</strong>
                <span>{modeName(language, config.mode)}</span>
              </div>
              <button
                className="ghost-button rules-button compact-rules"
                type="button"
                onClick={() => setRulesOpen(true)}
              >
                {t(language, 'rules')}
              </button>
            </div>
            <LanguagePicker
              language={language}
              onChange={setLanguage}
              compact
            />
            <ThemeToggle
              language={language}
              theme={theme}
              onChange={setTheme}
              compact
            />
            <label className="sound-control">
              <input
                type="checkbox"
                checked={audioSettings.soundEffectsEnabled}
                onChange={(event) =>
                  updateAudioSettings({
                    soundEffectsEnabled: event.target.checked,
                  })
                }
              />
              {t(language, 'sound')}
            </label>
            <input
              className="volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioSettings.masterVolume}
              aria-label={
                language === 'zh'
                  ? '音量'
                  : language === 'de'
                    ? 'Lautstärke'
                    : 'Volume'
              }
              onChange={(event) =>
                updateAudioSettings({
                  masterVolume: Number(event.target.value),
                })
              }
            />
          </header>
          <div className="table-wrap quatro-table-wrap">
            <QuatroTable
              state={quatroState}
              language={language}
              viewerPlayerId={quatroViewerPlayerId}
              selectedTileId={selectedQuatroTileId}
              hiddenHands={quatroHiddenHands}
              animationLocked={isBlockingAnimationActive}
              reducedMotion={config.reducedMotion}
              onSelectTile={setSelectedQuatroTileId}
              onAction={dispatchQuatroAction}
              onRevealHand={() =>
                activeQuatroPlayer
                  ? setRevealedPlayerId(activeQuatroPlayer.id)
                  : undefined
              }
              onOpenSetup={stopLocalSessionAndOpenSetup}
              onNewGame={startNewSession}
              onBlockingAnimationChange={(blocking) =>
                setAnimationLockReason(blocking ? 'quatro' : null)
              }
              onSoundCue={(cue) => playSoundAfterUnlock(sound, cue)}
            />
          </div>
        </section>
      )}

      {screen === 'table' && mahjongState && (
        <section className="table-screen mahjong-table-screen">
          <header className="table-toolbar">
            <button className="ghost-button" type="button" onClick={stopLocalSessionAndOpenSetup}>
              {t(language, 'setup')}
            </button>
            <div className="table-title-block">
              <div className="table-title-text">
                <strong>{gameTitle(config.game)}</strong>
                <span>{t(language, 'round')} {mahjongState.currentRound} | {modeName(language, config.mode)}</span>
              </div>
              <button className="ghost-button rules-button compact-rules" type="button" onClick={() => setRulesOpen(true)}>
                {t(language, 'rules')}
              </button>
            </div>
            <LanguagePicker language={language} onChange={setLanguage} compact />
            <ThemeToggle language={language} theme={theme} onChange={setTheme} compact />
            <label className="sound-control">
              <input
                type="checkbox"
                checked={audioSettings.soundEffectsEnabled}
                onChange={(event) => updateAudioSettings({ soundEffectsEnabled: event.target.checked })}
              />
              {t(language, 'sound')}
            </label>
            <input
              className="volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioSettings.masterVolume}
              onChange={(event) => updateAudioSettings({ masterVolume: Number(event.target.value) })}
            />
          </header>

          <div className="table-wrap mahjong-table-wrap">
            <MahjongTable3D
              state={mahjongState}
              viewerPlayerId={mahjongViewerPlayerId}
              selectedTileId={selectedMahjongTileId}
              visualTheme={mahjongVisualTheme}
              tileStyle={config.game === 'guoUnoMahjong' ? 'unoMahjong' : 'mahjong'}
              reducedMotion={config.reducedMotion}
              animationSpeed={config.animationSpeed}
              onTileSelect={(tileId) => setSelectedMahjongTileId((currentTileId) => currentTileId === tileId ? null : tileId)}
            />

            {mahjongHiddenHands && mahjongHotSeatControlPlayerId && (
              <div className="handoff-overlay">
                <div className="modal-panel">
                  <p className="eyebrow">{t(language, 'hotSeat')}</p>
                  <h2>
                    {language === 'de'
                      ? `${playerName(language, mahjongState.players.find((player) => player.id === mahjongHotSeatControlPlayerId)?.name ?? '')} ${t(language, 'hotSeatTurn')}`
                      : `${playerName(language, mahjongState.players.find((player) => player.id === mahjongHotSeatControlPlayerId)?.name ?? '')}${language === 'zh' ? '' : "'s"} ${t(language, 'hotSeatTurn')}`}
                  </h2>
                  <p className="hint">{t(language, 'hotSeatHint')}</p>
                  <button className="primary-button" type="button" onClick={() => setRevealedPlayerId(mahjongHotSeatControlPlayerId)}>
                    {t(language, 'revealHand')}
                  </button>
                </div>
              </div>
            )}

            {mahjongState.roundResult && (
              <div className="handoff-overlay">
                <div className="modal-panel mahjong-result-modal">
                  {mahjongState.roundResult.kind === 'win' && (
                    <div className="mahjong-win-mark" data-reduced-motion={config.reducedMotion ? 'true' : undefined}>胡牌</div>
                  )}
                  <p className="eyebrow">{mahjongRoundResultEyebrow(language, mahjongState)}</p>
                  <h2>{mahjongRoundResultTitle(language, mahjongState)}</h2>
                  <p className="hint">{mahjongRoundResultDetail(language, mahjongState)}</p>
                  {mahjongState.roundResult.kind === 'win' && <MahjongWinningHands language={language} state={mahjongState} />}
                  <div className="modal-actions">
                    <button className="primary-button" type="button" onClick={() => handleMahjongAction('nextRound')} disabled={isRemoteMahjongWifiClient}>
                      {mahjongLabel(language, 'nextRound')}
                    </button>
                    <button className="ghost-button" type="button" onClick={startNewSession}>
                      {t(language, 'newSession')}
                    </button>
                    <button className="ghost-button" type="button" onClick={stopLocalSessionAndOpenSetup}>
                      {t(language, 'setup')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="control-dock mahjong-control-dock">
            <div className="turn-card">
              <p className="eyebrow">{t(language, 'turn')}</p>
              <h2>{playerName(language, mahjongState.players[mahjongState.activePlayerIndex]?.name ?? '')}</h2>
              <p>{mahjongLabel(language, 'wall')}: {mahjongState.wall.length}</p>
              <p>{mahjongLabel(language, 'deadWall')}: {mahjongState.deadWall.length}</p>
              <p>{mahjongLabel(language, 'phase')}: {mahjongPhaseLabel(language, mahjongState.phase)}</p>
              {selectedMahjongTileId && <p>{mahjongLabel(language, 'selected')}: {mahjongSelectedTileText(language, mahjongState, selectedMahjongTileId)}</p>}
            </div>

            <div className="action-row mahjong-actions">
              {mahjongControls.length === 0 ? (
                <span className="hint">{mahjongLabel(language, 'wait')}</span>
              ) : (
                mahjongControls.map((action) => (
                  <button
                    key={action}
                    className={action === 'discard' || action === 'claimWin' || action === 'declareWin' ? 'uno-button' : action === 'pass' ? 'ghost-button' : 'primary-button'}
                    type="button"
                    onClick={() => handleMahjongAction(action)}
                  >
                    {mahjongActionLabel(language, action)}
                  </button>
                ))
              )}
            </div>

            <section className="recommendation-card mahjong-hint-card">
              <strong>{mahjongHint ? mahjongHintTitle(language, mahjongHint.titleKey) : mahjongLabel(language, 'hint')}</strong>
              <p>{mahjongHint ? mahjongHintBody(language, mahjongHint.bodyKey) : mahjongLabel(language, 'wait')}</p>
              {mahjongHint && <p>{mahjongSuggestedActionText(language, mahjongState, mahjongHint.suggestedAction)}</p>}
              {mahjongHint?.reasonKeys.map((reasonKey) => (
                <p key={reasonKey}>{mahjongReasonLabel(language, reasonKey)}</p>
              ))}
            </section>

            <section className="score-list">
              {mahjongState.players.map((player) => (
                <div className="score-row" key={player.id}>
                  <span>{playerName(language, player.name)}</span>
                  <strong>{player.score}</strong>
                </div>
              ))}
            </section>

            <section className="log-list mahjong-log-list">
              <strong>{t(language, 'eventLog')}</strong>
              {mahjongState.log.slice(-5).map((entry) => (
                <p key={entry.id}>{mahjongLogText(language, entry.text)}</p>
              ))}
            </section>
          </aside>
        </section>
      )}

      {screen === 'table' && state && (
        <section className="table-screen">
          <header className="table-toolbar">
            <button className="ghost-button" type="button" onClick={stopLocalSessionAndOpenSetup}>
              {t(language, 'setup')}
            </button>
            <div className="table-title-block">
              <div className="table-title-text">
                <strong>{gameTitle(state.config.game, state.config.h2oSplash)}</strong>
                <span>{t(language, 'round')} {state.currentRound} | {modeName(language, state.config.mode)}</span>
              </div>
              <button className="ghost-button rules-button compact-rules" type="button" onClick={() => setRulesOpen(true)}>
                {t(language, 'rules')}
              </button>
            </div>
            <LanguagePicker language={language} onChange={setLanguage} compact />
            <ThemeToggle language={language} theme={theme} onChange={setTheme} compact />
            <label className="sound-control">
              <input
                type="checkbox"
                checked={audioSettings.soundEffectsEnabled}
                onChange={(event) => updateAudioSettings({ soundEffectsEnabled: event.target.checked })}
              />
              {t(language, 'sound')}
            </label>
            <input
              className="volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioSettings.masterVolume}
              onChange={(event) => updateAudioSettings({ masterVolume: Number(event.target.value) })}
            />
          </header>

          <div className="table-wrap">
            <GameCanvas
              state={state}
              hiddenHands={hiddenHands}
              language={language}
              localPlayerId={wifiLocalPlayerId}
              passModePlayerId={canvasPassModePlayerId}
              skipBoDiscardMode={skipBoDiscardPileIndex !== null}
              onBlockingAnimationChange={setAnimationLockReason}
              onCardClick={tryPlay}
            />
            <HardwareEventOverlay state={state} language={language} />

            {winnerCelebration && state.winnerId && (
              <WinnerCelebrationOverlay
                language={language}
                state={state}
                onFinish={finishWinnerCelebration}
              />
            )}

            {state.pendingLiarChallenge && canChallengeLiarClaim && (
              <div className="handoff-overlay">
                <div className="modal-panel">
                  <LiarChallengePrompt
                    language={language}
                    state={state}
                    canChallenge={canChallengeLiarClaim}
                    onAccept={acceptCurrentLiarClaim}
                    onChallenge={challengeCurrentLiarClaim}
                  />
                </div>
              </div>
            )}

            {hiddenHands && current && (
              <div className="handoff-overlay">
                <div className="modal-panel">
                  <p className="eyebrow">{t(language, 'hotSeat')}</p>
                  <h2>{language === 'de' ? `${playerName(language, current.name)} ${t(language, 'hotSeatTurn')}` : `${playerName(language, current.name)}${language === 'zh' ? '' : "'s"} ${t(language, 'hotSeatTurn')}`}</h2>
                  <p className="hint">{t(language, 'hotSeatHint')}</p>
                  <button className="primary-button" type="button" onClick={() => setRevealedPlayerId(current.id)}>
                    {t(language, 'revealHand')}
                  </button>
                </div>
              </div>
            )}

            {pendingChoice && (
              <ChoiceModal
                state={state}
                pending={pendingChoice}
                language={language}
                onCancel={() => setPendingChoice(null)}
                onPartialAnswer={(choice) => setPendingChoice((current) => current ? { ...current, partial: { ...current.partial, ...choice } } : current)}
                onAnswer={answerChoice}
              />
            )}

            {state.winnerId && !state.memoryActionEvent && !winnerCelebration && (
              <div className="handoff-overlay">
                <RoundScoreModal
                  language={language}
                  state={state}
                  canManageSession={state.config.mode !== 'wifi' || isWifiHost}
                  onContinue={() => updateState(startNextRound(state), 'deal')}
                  onNewSession={state.config.mode === 'wifi' ? startWifiGame : startNewSession}
                  onSetup={stopLocalSessionAndOpenSetup}
                />
              </div>
            )}
          </div>

          <aside className="control-dock">
            <div className="turn-card">
              <p className="eyebrow">{t(language, 'turn')}</p>
              <h2>{playerName(language, current?.name ?? '')}</h2>
              <p>{t(language, 'deckCount')}: {state.drawPile.length}</p>
              {state.config.game === 'skipBo' && current ? (
                <>
                  <p>{skipBoStockLine(language, current)}</p>
                  <p>{skipBoBuildLine(language, state)}</p>
                </>
              ) : isGuoMemoryGame(state.config.game) ? (
                <>
                  <p>{memoryCollectedLine(language, current)}</p>
                  <p>{memoryBoardLine(language, state)}</p>
                </>
              ) : state.config.game === 'guoNeighborMatch' ? (
                <>
                  <p>{t(language, 'activeColor')}: {colorName(language, state.activeColor)}</p>
                  <p>{neighborAnchorLine(language, state)}</p>
                </>
              ) : state.config.game === 'guoHiLo' ? (
                <>
                  <p>{t(language, 'activeColor')}: {colorName(language, state.activeColor)}</p>
                  <p>{hiLoStatusLine(language, state)}</p>
                </>
              ) : state.config.game === 'guoPassage' ? (
                <>
                  <p>{passageCollectedLine(language, current ?? undefined)}</p>
                  <p>{passagePhaseLine(language, state)}</p>
                </>
              ) : (
                <p>{t(language, 'activeColor')}: {colorName(language, state.activeColor)}</p>
              )}
              {isFlipSideGame(state.config.game) && <p>{flipSideLabel(language, state.flipSide)}</p>}
              {isGridMemoryGame(state.config.game) && current && <p>{zeroFaceDownLabel(language, zeroFaceDownCount(current))}</p>}
              {state.config.game === 'phase10' && current && <p>{phase10StatusLabel(language, current)}</p>}
              {state.config.game === 'phase10' && current && <p>{phase10GoalLabel(language, current.phase10Phase ?? 1)}</p>}
              <p>
                {state.config.game === 'flash'
                  ? `${t(language, 'flashUnit')}: ${state.config.flashTimerSeconds > 0 ? `${state.config.flashTimerSeconds}s` : t(language, 'flashTimerOff')}`
                  : state.direction === 1 ? t(language, 'clockwise') : t(language, 'counterClockwise')}
              </p>
              {state.config.game === 'skipBo' && current ? (
                <p>{skipBoTurnHint(language, state.drewThisTurn, skipBoDiscardPileIndex)}</p>
              ) : state.config.game === 'phase10' && current ? (
                <p>{phase10TurnHint(language, state.drewThisTurn, current)}</p>
              ) : isGridMemoryGame(state.config.game) ? (
                <p>{state.pendingCaboPower ? caboPowerHint(language, state.pendingCaboPower.kind, Boolean(state.pendingCaboPower.firstSlot)) : state.config.game === 'skyjo' && state.zeroTurn?.source === 'reveal' ? skyjoRevealHint(language) : zeroHasDrawnCard(state) ? zeroPlaceCardHint(language) : zeroDrawFirstHint(language)}</p>
              ) : isGuoMemoryGame(state.config.game) ? (
                <p>{memoryTurnHint(language, state)}</p>
              ) : state.config.game === 'guoPassage' ? (
                <p>{passageTurnHint(language, state, passagePassMode)}</p>
              ) : (
                <p>{playableCount} {t(language, 'playableCards')}</p>
              )}
            </div>

            {canControlCurrent && current && (
              <div className={`action-row ${state.config.game === 'guoPassage' ? 'passage-actions' : ''}`}>
                {isGridMemoryGame(state.config.game) ? (
                  <>
                    {state.config.game === 'zero' && state.zeroCallPendingPlayerId === current.id ? (
                      <button className="ghost-button" type="button" onClick={() => {
                        if (isRemoteWifiClient) sendWifiAction({ type: 'endTurn' })
                        else updateState(endTurn(state), 'play')
                      }}>
                        {t(language, 'endTurn')}
                      </button>
                    ) : !zeroHasDrawnCard(state) && (
                      <>
                        <button className="primary-button" type="button" onClick={() => {
                          if (isRemoteWifiClient) sendWifiAction({ type: 'drawOne' })
                          else updateState(drawOne(state), 'draw')
                        }}>
                          {t(language, 'draw')}
                        </button>
                        <button className="ghost-button" type="button" onClick={() => {
                          if (isRemoteWifiClient) sendWifiAction({ type: 'zeroTakeDiscard' })
                          else updateState(zeroTakeDiscard(state), 'draw')
                        }}>
                          {zeroTakeDiscardLabel(language)}
                        </button>
                      </>
                    )}
                    {zeroHasDrawnCard(state) && zeroDrawnCardCanBeDiscarded(state) && (
                      <button className="ghost-button" type="button" onClick={() => {
                        if (isRemoteWifiClient) sendWifiAction({ type: 'zeroDiscardDrawn' })
                        else updateState(zeroDiscardDrawn(state), 'play')
                      }}>
                        {zeroDiscardDrawnLabel(language)}
                      </button>
                    )}
                    {state.config.game === 'cabo' && !zeroHasDrawnCard(state) && !state.pendingCaboPower && !state.caboCallerPlayerId && (
                      <button className="uno-button" type="button" onClick={() => {
                        if (isRemoteWifiClient) sendWifiAction({ type: 'caboCall' })
                        else updateState(caboCall(state), 'uno')
                      }}>
                        {caboCallLabel(language)}
                      </button>
                    )}
                  </>
                ) : isGuoMemoryGame(state.config.game) ? (
                  <></>
                ) : state.config.game === 'guoPassage' ? (
                  <>
                    {state.passageTurn?.phase === 'take' && (
                      <>
                        <button className="primary-button" type="button" disabled={!state.passageFaceUp} onClick={() => {
                          if (isRemoteWifiClient) sendWifiAction({ type: 'passageTake', source: 'faceUp' })
                          else updateState(passageTakeCard(state, 'faceUp'), 'draw')
                        }}>
                          {passageTakeFaceUpLabel(language)}
                        </button>
                        <button className="ghost-button" type="button" disabled={!state.passageSlot} onClick={() => {
                          if (isRemoteWifiClient) sendWifiAction({ type: 'passageTake', source: 'passage' })
                          else updateState(passageTakeCard(state, 'passage'), 'draw')
                        }}>
                          {passageTakeSlotLabel(language)}
                        </button>
                        <button className="ghost-button" type="button" disabled={state.drawPile.length === 0 && !(state.passageDiscardPile?.length)} onClick={() => {
                          if (isRemoteWifiClient) sendWifiAction({ type: 'passageTake', source: 'draw' })
                          else updateState(passageTakeCard(state, 'draw'), 'draw')
                        }}>
                          {t(language, 'draw')}
                        </button>
                      </>
                    )}
                    {state.passageTurn?.phase === 'pair' && (
                      <button className="ghost-button" type="button" onClick={() => {
                        if (isRemoteWifiClient) sendWifiAction({ type: 'passageSkipPair' })
                        else updateState(passageSkipPair(state), 'play')
                      }}>
                        {passageSkipPairLabel(language)}
                      </button>
                    )}
                    {state.passageTurn?.phase === 'pass' && (
                      <>
                        <button className={passagePassMode === 'faceUp' ? 'danger-button' : 'ghost-button'} type="button" onClick={() => setPassagePassMode((mode) => mode === 'faceUp' ? null : 'faceUp')}>
                          {passagePassFaceUpLabel(language)}
                        </button>
                        <button className={passagePassMode === 'faceDown' ? 'danger-button' : 'ghost-button'} type="button" onClick={() => setPassagePassMode((mode) => mode === 'faceDown' ? null : 'faceDown')}>
                          {passagePassFaceDownLabel(language)}
                        </button>
                      </>
                    )}
                  </>
                ) : state.config.game === 'skipBo' ? (
                  <>
                    {!state.drewThisTurn ? (
                      <button className="primary-button" type="button" onClick={() => {
                        if (isRemoteWifiClient) sendWifiAction({ type: 'drawOne' })
                        else updateState(drawOne(state), 'draw')
                      }}>
                        {skipBoDrawLabel(language)}
                      </button>
                    ) : (
                      <>
                        {[0, 1, 2, 3].map((pileIndex) => (
                          <button
                            className={skipBoDiscardPileIndex === pileIndex ? 'danger-button' : 'ghost-button'}
                            key={pileIndex}
                            type="button"
                            onClick={() => setSkipBoDiscardPileIndex((currentIndex) => currentIndex === pileIndex ? null : pileIndex)}
                          >
                            {skipBoDiscardPileLabel(language, pileIndex)}
                          </button>
                        ))}
                      </>
                    )}
                  </>
                ) : state.config.game === 'phase10' ? (
                  <>
                    {!state.drewThisTurn ? (
                      <>
                        <button className="primary-button" type="button" onClick={() => {
                          if (isRemoteWifiClient) sendWifiAction({ type: 'drawOne' })
                          else updateState(drawOne(state), 'draw')
                        }}>
                          {t(language, 'draw')}
                        </button>
                        <button className="ghost-button" type="button" onClick={() => {
                          if (isRemoteWifiClient) sendWifiAction({ type: 'phase10TakeDiscard' })
                          else updateState(phase10TakeDiscard(state), 'draw')
                        }}>
                          {phase10TakeDiscardLabel(language)}
                        </button>
                        <button className="ghost-button" type="button" disabled title={phase10DrawFirstLabel(language)}>
                          {phase10CompleteLabel(language)}
                        </button>
                      </>
                    ) : (
                      <button className="ghost-button" type="button" onClick={() => {
                        if (isRemoteWifiClient) sendWifiAction({ type: 'phase10CompletePhase' })
                        else updateState(phase10CompletePhase(state), 'play')
                      }}>
                        {phase10CompleteLabel(language)}
                      </button>
                    )}
                  </>
                ) : state.pendingDare ? (
                  <>
                    <button className="danger-button" type="button" onClick={() => {
                      if (isRemoteWifiClient) sendWifiAction({ type: 'resolvePendingDare', resolution: 'draw' })
                      else updateState(resolvePendingDare(state, 'draw'), 'draw')
                    }}>
                      {dareDrawLabel(language)}
                    </button>
                    <button className="ghost-button" type="button" onClick={() => {
                      if (isRemoteWifiClient) sendWifiAction({ type: 'resolvePendingDare', resolution: 'dare' })
                      else updateState(resolvePendingDare(state, 'dare'), 'action')
                    }}>
                      {dareRollLabel(language)}
                    </button>
                  </>
                ) : state.pendingEmoji ? (
                  <>
                    <button className="primary-button" type="button" onClick={() => {
                      if (isRemoteWifiClient) sendWifiAction({ type: 'resolvePendingEmoji', resolution: 'madeFace' })
                      else updateState(resolvePendingEmoji(state, 'madeFace'), 'action')
                    }}>
                      {emojiMadeFaceLabel(language)}
                    </button>
                    <button className="danger-button" type="button" onClick={() => {
                      if (isRemoteWifiClient) sendWifiAction({ type: 'resolvePendingEmoji', resolution: 'draw4' })
                      else updateState(resolvePendingEmoji(state, 'draw4'), 'draw')
                    }}>
                      {emojiDrawPenaltyLabel(language)}
                    </button>
                  </>
                ) : state.pendingDraw ? (
                  <>
                    <button className="danger-button" type="button" onClick={() => {
                      if (isRemoteWifiClient) sendWifiAction({ type: 'resolvePendingDraw', challenge: false })
                      else updateState(resolvePendingDraw(state, false), 'draw')
                    }}>
                      {t(language, 'acceptDraw')} {state.pendingDraw.amount}
                    </button>
                    {state.pendingDraw.canChallenge && (
                      <button className="ghost-button" type="button" onClick={() => {
                        if (isRemoteWifiClient) sendWifiAction({ type: 'resolvePendingDraw', challenge: true })
                        else updateState(resolvePendingDraw(state, true), 'action')
                      }}>
                        {t(language, 'challengeDraw4')}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {!state.drewThisTurn && !mustPlayFromHand && (
                      <button className="primary-button" type="button" onClick={() => {
                        if (isRemoteWifiClient) sendWifiAction({ type: 'drawOne' })
                        else updateState(drawOne(state), isLauncherGame(state.config.game) ? 'launcher' : 'draw')
                      }}>
                        {state.config.game === 'dice' ? diceTakeLineLabel(language) : isLauncherGame(state.config.game) ? t(language, 'launcher') : t(language, 'draw')}
                      </button>
                    )}
                    {state.drewThisTurn && !mustPlayFromHand && (
                      <button className="ghost-button" type="button" onClick={() => {
                        if (isRemoteWifiClient) sendWifiAction({ type: 'endTurn' })
                        else updateState(endTurn(state), 'play')
                      }}>
                        {t(language, 'endTurn')}
                      </button>
                    )}
                    {state.config.game === 'teams' && canPassToPartner(state, current.id) && (
                      <button className={teamPassMode ? 'danger-button' : 'ghost-button'} type="button" onClick={() => setTeamPassMode((active) => !active)}>
                        {teamPassMode ? teamPassCancelLabel(language) : teamPassButtonLabel(language)}
                      </button>
                    )}
                  </>
                )}
                {!state.pendingDraw &&
                  ((state.config.game === 'zero' && zeroFaceDownCount(current) === 1) ||
                    (state.config.game === 'dos' && current.hand.length === 2) ||
                    (!isGridMemoryGame(state.config.game) && state.config.game !== 'dos' && state.config.game !== 'skipBo' && !isGuoMemoryGame(state.config.game) && current.hand.length === 2 && playableCount > 0)) &&
                  state.unoDeclaredPlayerId !== current.id && (
                  <button className="uno-button" type="button" onClick={() => {
                    if (isRemoteWifiClient) sendWifiAction({ type: 'callUno' })
                    else updateState(callUno(state, current.id), 'uno')
                  }}>
                    {state.config.game === 'zero' ? 'UNO Zero' : state.config.game === 'dos' ? 'DOS' : 'UNO'}
                  </button>
                )}
                {state.catchableUnoPlayerId && state.catchableUnoPlayerId !== current.id && (
                  <button className="danger-button" type="button" onClick={() => {
                    if (isRemoteWifiClient) sendWifiAction({ type: 'catchUno' })
                    else updateState(catchUno(state), isLauncherGame(state.config.game) ? 'launcher' : 'action')
                  }}>
                    {state.config.game === 'dos' ? catchDosLabel(language) : t(language, 'catchUno')}
                  </button>
                )}
              </div>
            )}

            {state.config.game === 'skipBo' ? (
              <SkipBoHintPanel language={language} state={state} discardPileIndex={skipBoDiscardPileIndex} />
            ) : state.config.game === 'phase10' ? (
              <Phase10HintPanel language={language} state={state} />
            ) : isGuoMemoryGame(state.config.game) ? (
              <MemoryHintPanel language={language} state={state} />
            ) : (
              <RecommendationPanel language={language} game={state.config.game} recommendation={recommendation} />
            )}

            {state.pendingLiarChallenge && (
              <LiarChallengePanel
                language={language}
                state={state}
                canChallenge={canChallengeLiarClaim}
                onAccept={acceptCurrentLiarClaim}
                onChallenge={challengeCurrentLiarClaim}
              />
            )}

            {state.config.game === 'h2o' && state.config.h2oSplash && (
              <WhirlpoolPanel language={language} state={state} />
            )}
            {isLauncherGame(state.config.game) && (
              <LauncherPanel language={language} state={state} />
            )}
            {state.config.game === 'flash' && (
              <FlashPanel language={language} state={state} />
            )}
            {state.config.game === 'spin' && (
              <SpinPanel language={language} state={state} />
            )}
            {state.config.game === 'flex' && (
              <FlexPanel language={language} state={state} />
            )}
            {state.config.game === 'party' && (
              <PartyPanel language={language} state={state} />
            )}

            <div className="score-list">
              {state.players.map((player) => (
                <div className="score-row" key={player.id}>
                  <span>{playerName(language, player.name)}</span>
                  <strong>{player.score}</strong>
                </div>
              ))}
            </div>

            <div className="log-list">
              <strong>{t(language, 'eventLog')}</strong>
              {state.log.map((entry) => (
                <p key={entry.id}>{entry.text}</p>
              ))}
            </div>
          </aside>
        </section>
      )}
      {rulesOpen && (
        <RulesModal
          language={language}
          config={state?.config ?? config}
          title={gameTitle(state?.config.game ?? config.game, state?.config.h2oSplash ?? config.h2oSplash)}
          onClose={() => setRulesOpen(false)}
        />
      )}
    </main>
  )
}

interface RuleSection {
  heading: string
  items: string[]
}

function RulesModal({
  language,
  config,
  title,
  onClose,
}: {
  language: Language
  config: GameConfig
  title: string
  onClose: () => void
}) {
  const sections = rulesForGame(language, config)

  return (
    <div className="global-modal-overlay" role="presentation" onMouseDown={onClose}>
      <section className="modal-panel rules-modal" role="dialog" aria-modal="true" aria-label={`${title} ${t(language, 'rules')}`} onMouseDown={(event) => event.stopPropagation()}>
        <header className="rules-modal-header">
          <div>
            <p className="eyebrow">{t(language, 'rules')}</p>
            <h2>{title}</h2>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            {t(language, 'close')}
          </button>
        </header>
        <div className="rules-content">
          {sections.map((section) => (
            <section key={section.heading}>
              <h3>{section.heading}</h3>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}

function rulesForGame(language: Language, config: GameConfig): RuleSection[] {
  const common = commonRuleSections(language, config)
  if (config.game === 'quatro') {
    return [
      ...quatroRuleSections(language),
      ...quatroActionReference(language),
      ...quatroStrategySections(language),
    ]
  }
  if (config.game === 'extreme') return [...extremeRuleSections(language), ...common]
  if (config.game === 'flash') return [...flashRuleSections(language), ...common]
  if (config.game === 'flip') return [...flipRuleSections(language), ...common]
  if (config.game === 'flipExtreme') return [...flipExtremeRuleSections(language), ...common]
  if (config.game === 'h2o') return [...h2oRuleSections(language, config), ...common]
  if (config.game === 'spin') return [...spinRuleSections(language), ...common]
  if (config.game === 'zero') return zeroRuleSections(language)
  if (config.game === 'cabo') return caboRuleSections(language)
  if (config.game === 'skyjo') return skyjoRuleSections(language)
  if (config.game === 'dos') return dosRuleSections(language)
  if (config.game === 'phase10') return phase10RuleSections(language)
  if (config.game === 'skipBo') return skipBoRuleSections(language)
  if (isMahjongGame(config.game)) return config.game === 'guoUnoMahjong' ? guoUnoMahjongRuleSections(language) : mahjongRuleSections(language)
  if (config.game === 'guoMemory') return guoMemoryRuleSections(language)
  if (config.game === 'guoMemoryAction') return guoMemoryActionRuleSections(language)
  if (config.game === 'guoTripleMemory') return guoTripleMemoryRuleSections(language)
  if (config.game === 'guoTripleMemoryAction') return guoTripleMemoryActionRuleSections(language)
  if (config.game === 'guoNeighborMatch') return guoNeighborMatchRuleSections(language, config)
  if (config.game === 'guoHiLo') return guoHiLoRuleSections(language, config)
  if (config.game === 'guoPassage') return guoPassageRuleSections(language, config)
  if (config.game === 'flex') return [...flexRuleSections(language), ...common]
  if (config.game === 'liars') return [...liarsRuleSections(language), ...common]
  if (config.game === 'party') return [...partyRuleSections(language), ...common]
  if (config.game === 'teams') return [...teamsRuleSections(language), ...common]
  if (config.game === 'houseRules') return [...houseRulesRuleSections(language), ...common]
  if (config.game === 'challenge') return [...challengeRuleSections(language), ...common]
  if (config.game === 'lotr') return [...lordOfTheRingsRuleSections(language), ...common]
  if (config.game === 'popCulture') return [...popCultureRuleSections(language), ...common]
  if (config.game === 'allWild') return [...allWildRuleSections(language), ...common]
  if (config.game === 'noMercy') return [...noMercyRuleSections(language), ...common]
  if (config.game === 'superMario') return [...superMarioRuleSections(language), ...common]
  if (config.game === 'sonic') return [...sonicRuleSections(language), ...common]
  if (config.game === 'barbie') return [...barbieRuleSections(language), ...common]
  if (config.game === 'motu') return [...mastersOfTheUniverseRuleSections(language), ...common]
  if (config.game === 'tmnt') return [...tmntRuleSections(language), ...common]
  if (config.game === 'spiderman') return [...spiderManRuleSections(language), ...common]
  if (config.game === 'dc') return [...dcRuleSections(language), ...common]
  if (config.game === 'starTrek') return [...starTrekRuleSections(language), ...common]
  if (config.game === 'avatar') return [...avatarRuleSections(language), ...common]
  if (config.game === 'monsterHigh') return [...monsterHighRuleSections(language), ...common]
  if (config.game === 'nfl') return [...nflRuleSections(language), ...common]
  if (config.game === 'triplePlay') return [...triplePlayRuleSections(language), ...common]
  if (config.game === 'minecraft') return [...minecraftRuleSections(language), ...common]
  if (config.game === 'wildJackpot') return [...wildJackpotRuleSections(language), ...common]
  if (config.game === 'blast') return [...blastRuleSections(language), ...common]
  if (config.game === 'roboto') return [...robotoRuleSections(language), ...common]
  if (config.game === 'tippo') return [...tippoRuleSections(language), ...common]
  if (config.game === 'dice') return diceRuleSections(language)
  if (config.game === 'emoji') return [...emojiRuleSections(language), ...common]
  if (config.game === 'marioKart') return [...marioKartRuleSections(language), ...common]
  return [...classicRuleSections(language, config), ...common]
}

function classicRuleSections(language: Language, config: GameConfig): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Goal and Turn Flow',
        items: [
          'Match the top discard by color, number, symbol, or play a Wild card.',
          'If you cannot or do not want to play, draw one card. If the drawn card is playable, you may play it immediately; otherwise your turn passes.',
          'Call UNO before playing from two cards down to one card. If you forget, another player may catch you and you draw 2.',
        ],
      },
      {
        heading: 'Action Cards',
        items: [
          'Skip makes the next player lose a turn.',
          'Reverse changes the play direction; with two players it acts like a skip.',
          '+2 makes the next player draw 2 and lose the turn. Wild +4 chooses a color, makes the next player draw 4, and can be challenged.',
        ],
      },
    ],
    zh: [
      {
        heading: '目标和回合',
        items: [
          '按颜色、数字、符号匹配弃牌堆顶牌，或打出万能牌。',
          '如果不能或不想出牌，摸一张牌。若摸到的牌可出，可以立即打出；否则回合结束。',
          '从两张牌打到只剩一张前要先喊 UNO。忘记时，其他玩家可以抓 UNO，你需要摸 2 张。',
        ],
      },
      {
        heading: '功能牌',
        items: [
          '跳过牌让下一位玩家失去回合。',
          '反转牌改变出牌方向；两人游戏时相当于跳过。',
          '+2 让下一位玩家摸 2 张并失去回合。万能 +4 可选择颜色，让下一位摸 4 张，并可被质疑。',
        ],
      },
    ],
    de: [
      {
        heading: 'Ziel und Zugablauf',
        items: [
          'Passe die oberste Ablagekarte nach Farbe, Zahl, Symbol oder spiele eine Wild-Karte.',
          'Wenn du nicht spielen kannst oder willst, ziehst du eine Karte. Ist sie spielbar, darfst du sie sofort spielen; sonst endet dein Zug.',
          'Rufe UNO, bevor du von zwei Karten auf eine Karte spielst. Wenn du es vergisst, kann ein anderer Spieler dich fangen und du ziehst 2.',
        ],
      },
      {
        heading: 'Aktionskarten',
        items: [
          'Aussetzen lässt den nächsten Spieler einen Zug verlieren.',
          'Richtung Ändert die Spielrichtung; bei zwei Spielern wirkt sie wie Aussetzen.',
          '+2 lässt den nächsten Spieler 2 ziehen und aussetzen. Wild +4 wählt eine Farbe, lässt den nächsten Spieler 4 ziehen und kann angezweifelt werden.',
        ],
      },
    ],
  }

  const addOns = selectedAddOnRules(language, config)
  return addOns.length > 0 ? [...sections[language], { heading: addOnHeading(language), items: addOns }] : sections[language]
}

function extremeRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Uno Extreme Unit',
        items: [
          'The draw pile is replaced by a simulated launcher. When a card or button tells you to press it, the launcher may fire zero or more cards.',
          'If you cannot play on your turn, press the launcher once and your turn passes.',
        ],
      },
      {
        heading: 'Extreme Cards',
        items: [
          'Hit 2 makes the next player press the launcher twice and lose the turn.',
          'Discard All lets you discard all cards of the played color from your hand.',
          'Wild Extreme Hit, Hit-Fire, All Hit, and Trade Hands use the simulated launcher or hand-trade effects shown in their card tooltips.',
        ],
      },
    ],
    zh: [
      {
        heading: 'UNO Extreme 装置',
        items: [
          '摸牌堆由模拟发牌器代替。当牌或按钮要求按下时，发牌器可能发出零张或多张牌。',
          '如果轮到你但不能出牌，按一次发牌器，然后回合结束。',
        ],
      },
      {
        heading: 'Extreme 功能牌',
        items: [
          'Hit 2 让下一位玩家按两次发牌器并失去回合。',
          '全弃牌可以让你弃掉手中所有同颜色的牌。',
          'Wild Extreme Hit、Hit-Fire、All Hit 和 Trade Hands 会执行卡牌提示中说明的模拟发牌器或换手牌效果。',
        ],
      },
    ],
    de: [
      {
        heading: 'Uno-Extreme-Einheit',
        items: [
          'Der Ziehstapel wird durch einen simulierten Launcher ersetzt. Wenn eine Karte oder Taste es verlangt, kann der Launcher null oder mehrere Karten ausgeben.',
          'Wenn du in deinem Zug nicht spielen kannst, druckst du den Launcher einmal; danach endet dein Zug.',
        ],
      },
      {
        heading: 'Extreme-Karten',
        items: [
          'Hit 2 lässt den nächsten Spieler zweimal den Launcher drücken und aussetzen.',
          'Alle ablegen lässt dich alle Karten der gespielten Farbe aus deiner Hand ablegen.',
          'Wild Extreme Hit, Hit-Fire, All Hit und Handtausch nutzen die simulierten Launcher- oder Tauscheffekte aus den Kartenhinweisen.',
        ],
      },
    ],
  }
  return sections[language]
}

function flashRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Flash Unit',
        items: [
          'After each completed turn, the simulated Flash unit randomly selects the next active player instead of following clockwise order.',
          'The random unit may select any player according to the Flash-style flow; watch the highlighted active player before acting.',
          'The Flash timer can be set to Unlimited, 6 seconds, or 4 seconds. If a human player times out, they draw 2 extra cards and the unit selects the next player.',
        ],
      },
      {
        heading: 'Flash Cards',
        items: [
          'Skip skips the player selected by the Flash unit, then the unit selects the next active player.',
          'Reverse does not change table direction in this simulation; the Flash unit selects the next player at random.',
          'SLAP makes opponents slap the unit; the simulation chooses the last player and gives that player 2 cards.',
        ],
      },
    ],
    zh: [
      {
        heading: 'Flash 装置',
        items: [
          '每个回合完成后，模拟 Flash 装置会随机选择下一位行动玩家，而不是按顺时针顺序。',
          '随机装置可能选择任意玩家；行动前请注意当前高亮的玩家。',
          'Flash 计时器可设为无限制、6 秒或 4 秒。真人玩家超时时，会额外摸 2 张，然后装置选择下一位玩家。',
        ],
      },
      {
        heading: 'Flash 功能牌',
        items: [
          '跳过牌会跳过 Flash 装置选中的玩家，然后装置再随机选择下一位行动玩家。',
          '在本模拟中，反转牌不改变桌面方向；Flash 装置会随机选择下一位玩家。',
          'SLAP 牌要求对手拍击装置；模拟会选择最慢的玩家，并让该玩家摸 2 张。',
        ],
      },
    ],
    de: [
      {
        heading: 'Flash-Einheit',
        items: [
          'Nach jedem abgeschlossenen Zug wählt die simulierte Flash-Einheit zufällig den nächsten aktiven Spieler statt der Sitzreihenfolge.',
          'Die Zufallseinheit kann jeden Spieler auswählen; beachte vor deiner Aktion den markierten aktiven Spieler.',
          'Der Flash-Timer kann auf unbegrenzt, 6 Sekunden oder 4 Sekunden gestellt werden. Bei Zeitablauf zieht ein menschlicher Spieler 2 Extrakarten, danach wählt die Einheit den nächsten Spieler.',
        ],
      },
      {
        heading: 'Flash-Karten',
        items: [
          'Aussetzen Überspringt den von der Flash-Einheit gewählten Spieler; danach wählt die Einheit den nächsten aktiven Spieler.',
          'Richtung Ändert in dieser Simulation nicht die Tischrichtung; die Flash-Einheit wählt zufällig den nächsten Spieler.',
          'SLAP lässt die Gegner auf die Einheit schlagen; die Simulation wählt den langsamsten Spieler und gibt ihm 2 Karten.',
        ],
      },
    ],
  }
  return sections[language]
}

function flipRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Two Sides',
        items: [
          'The game starts on the Light Side with red, yellow, green, and blue cards.',
          'Playing a Flip card turns every hand, the draw pile, and the discard pile to the other side.',
          'The Dark Side uses teal, pink, purple, and orange with stronger penalties.',
        ],
      },
      {
        heading: 'Action Cards',
        items: [
          'Light +1 and Dark +5 make the next player draw and lose the turn.',
          'Dark Skip All skips every other player, so the same player acts again.',
          'Wild Draw Color makes the next player draw until the chosen color appears.',
        ],
      },
    ],
    zh: [
      {
        heading: '双面牌',
        items: [
          '游戏从浅色面开始，使用红、黄、绿、蓝四色。',
          '打出翻面牌时，所有手牌、摸牌堆和弃牌堆都会翻到另一面。',
          '深色面使用青、粉、紫、橙四色，并有更强的惩罚。',
        ],
      },
      {
        heading: '功能牌',
        items: [
          '浅色 +1 和深色 +5 让下一位玩家摸牌并失去回合。',
          '深色跳过所有人会跳过其他所有玩家，因此出牌者再次行动。',
          '万能抽到指定颜色会让下一位玩家一直摸到所选颜色。',
        ],
      },
    ],
    de: [
      {
        heading: 'Zwei Seiten',
        items: [
          'Das Spiel beginnt auf der hellen Seite mit Rot, Gelb, Grün und Blau.',
          'Eine Flip-Karte dreht alle Hande, den Ziehstapel und den Ablagestapel auf die andere Seite.',
          'Die dunkle Seite nutzt Türkis, Pink, Violett und Orange mit stärkeren Strafen.',
        ],
      },
      {
        heading: 'Aktionskarten',
        items: [
          'Helles +1 und dunkles +5 lassen den nächsten Spieler ziehen und aussetzen.',
          'Dunkles Alle aussetzen Überspringt alle anderen; derselbe Spieler ist wieder dran.',
          'Wild Farbe ziehen lässt den nächsten Spieler ziehen, bis die gewählte Farbe erscheint.',
        ],
      },
    ],
  }
  return sections[language]
}

function flipExtremeRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Flip Extreme Flow',
        items: [
          'UNO Flip Extreme combines Flip double-sided cards with the simulated Extreme launcher.',
          'The game starts on the Light Side. Playing any Flip card turns every hand, the draw pile, and the discard pile to the other side.',
          'If you cannot play, press the launcher once instead of drawing from a normal draw pile; then your turn passes.',
        ],
      },
      {
        heading: 'Launcher Cards',
        items: [
          'Light-side Launcher Attack chooses a color and makes the next player press the launcher twice and lose the turn.',
          'Dark-side Extreme Hit also uses the launcher against the next player.',
          'The Dark Side uses teal, pink, purple, and orange, so Wild color choices change after a Flip.',
        ],
      },
    ],
    zh: [
      {
        heading: 'Flip Extreme 流程',
        items: [
          'UNO Flip Extreme 结合了 Flip 的双面牌和 Extreme 的模拟发牌器。',
          '游戏从浅色面开始。打出 Flip 牌时，所有手牌、摸牌堆和弃牌堆都会翻到另一面。',
          '如果你不能出牌，就按一次发牌器，而不是普通摸牌；然后你的回合结束。',
        ],
      },
      {
        heading: '发牌器功能牌',
        items: [
          '浅色面的 Launcher Attack 可选择颜色，并让下一位玩家按两次发牌器且失去回合。',
          '深色面的 Extreme Hit 也会让下一位玩家触发发牌器。',
          '深色面使用青、粉、紫、橙四种颜色，因此翻面后万能牌的选色也会改变。',
        ],
      },
    ],
    de: [
      {
        heading: 'Flip-Extreme-Ablauf',
        items: [
          'UNO Flip Extreme verbindet die doppelseitigen Flip-Karten mit dem simulierten Extreme-Launcher.',
          'Das Spiel beginnt auf der hellen Seite. Eine Flip-Karte dreht alle Hande, den Ziehstapel und den Ablagestapel auf die andere Seite.',
          'Wenn du nicht spielen kannst, druckst du statt normalem Ziehen einmal den Launcher; danach endet dein Zug.',
        ],
      },
      {
        heading: 'Launcher-Karten',
        items: [
          'Launcher Attack auf der hellen Seite wählt eine Farbe und lässt den nächsten Spieler zweimal den Launcher drücken und aussetzen.',
          'Extreme Hit auf der dunklen Seite nutzt den Launcher ebenfalls gegen den nächsten Spieler.',
          'Die dunkle Seite nutzt Türkis, Pink, Violett und Orange; deshalb Ändern sich Wild-Farbwählen nach einem Flip.',
        ],
      },
    ],
  }
  return sections[language]
}

function guoMemoryRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Goal',
        items: [
          'Find matching UNO number-card pairs on the shared table and collect the most cards.',
          'This first slice starts with the easy 4 x 4 board and Number Match: colors do not matter, only the number must match.',
          'All cards start face down. Select exactly two cards on your turn.',
        ],
      },
      {
        heading: 'Turn Flow',
        items: [
          'If the two revealed cards have the same number, you collect both cards and immediately play again.',
          'If they do not match, both cards stay visible briefly, then flip face down and the turn passes.',
          'The round ends when every table card has been collected.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Remember number positions first; color is only decoration in the current number-match mode.',
          'A known pair is powerful because it gives another turn and can start a chain.',
          'The winner is the player with the most collected cards. If tied, the higher collected point total wins.',
        ],
      },
    ],
    zh: [
      {
        heading: '目标',
        items: [
          '在公共桌面上寻找匹配的 UNO 数字牌对子，收集最多牌的玩家获胜。',
          '当前第一版使用简单 4 x 4 棋盘，并采用数字匹配：颜色不重要，只要数字相同即可。',
          '所有牌一开始都背面朝上。轮到你时选择两张牌。',
        ],
      },
      {
        heading: '回合流程',
        items: [
          '如果翻开的两张牌数字相同，你收集这两张牌，并立刻继续行动。',
          '如果不匹配，两张牌会短暂保持可见，然后翻回背面，并轮到下一位玩家。',
          '当桌面上所有牌都被收集后，本局结束。',
        ],
      },
      {
        heading: '策略',
        items: [
          '当前数字匹配模式下，优先记住数字位置；颜色只是视觉提示。',
          '记住一个对子很强，因为成功匹配后可以继续行动，形成连续得分。',
          '胜者是收集牌数最多的玩家；如果牌数相同，则比较收集牌的点数总和。',
        ],
      },
    ],
    de: [
      {
        heading: 'Ziel',
        items: [
          'Finde passende UNO-Zahlenpaare auf dem gemeinsamen Tisch und sammle die meisten Karten.',
          'Diese erste Version startet mit dem einfachen 4 x 4 Feld und Zahlen-Match: Farben sind egal, nur die Zahl muss gleich sein.',
          'Alle Karten starten verdeckt. In deinem Zug wählst du genau zwei Karten.',
        ],
      },
      {
        heading: 'Zugablauf',
        items: [
          'Haben die zwei aufgedeckten Karten dieselbe Zahl, sammelst du beide und bist sofort erneut dran.',
          'Passen sie nicht, bleiben sie kurz sichtbar, drehen sich wieder um, und der Zug geht weiter.',
          'Die Runde endet, wenn alle Tischkarten gesammelt wurden.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Merke dir zuerst Zahlenpositionen; Farbe ist in diesem Modus nur Dekoration.',
          'Ein bekanntes Paar ist stark, weil ein Treffer einen weiteren Zug gibt.',
          'Es gewinnt, wer die meisten Karten gesammelt hat. Bei Gleichstand entscheidet die höhere Punktesumme.',
        ],
      },
    ],
  }
  return sections[language]
}

function guoMemoryActionRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Goal',
        items: [
          'Find matching UNO memory pairs while surprise action cards can change the collected-card race.',
          'Difficulty controls the grid: Easy 4 x 4, Medium 6 x 6, Hard 8 x 8.',
          'The winner is the player with the most collected cards. Ties use collected point total.',
        ],
      },
      {
        heading: 'Pairs And Wilds',
        items: [
          'Use the selected match mode: number, color, or number + color.',
          'Wild cards match any normal card and can also match another Wild.',
          'A successful pair is collected after the reveal duration and gives another turn.',
        ],
      },
      {
        heading: 'Action Cards',
        items: [
          'Immediate action cards resolve as soon as they are revealed, then leave the table.',
          'Lose Cards and Earn Cards use launcher odds: 0 cards 30%, 2 cards 32%, 3 cards 31%, 4 cards 7%.',
          'Hard mode adds Others Lose, Others Earn, Lose All, and Winner Takes All.',
          'Winner Takes All immediately collects the remaining table and ends the round.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Wilds are valuable because they can rescue a difficult match mode.',
          'Action cards add risk: a leader can lose cards, and a trailing player can catch up.',
          'In Hard mode, unknown cards are more dangerous because Winner Takes All can end the round early.',
        ],
      },
    ],
    zh: [
      {
        heading: '目标',
        items: [
          '寻找匹配的 UNO 记忆牌对，同时行动牌会改变收集牌数量的竞争。',
          '难度决定牌阵：简单 4 x 4，中等 6 x 6，困难 8 x 8。',
          '收集牌最多的玩家获胜；平手时比较收集牌点数总和。',
        ],
      },
      {
        heading: '配对与万能牌',
        items: [
          '按照所选模式匹配：数字、颜色、或数字+颜色。',
          'Wild 可以匹配任何普通牌，也可以匹配另一张 Wild。',
          '成功配对会在显示时间后被收集，并让当前玩家继续行动。',
        ],
      },
      {
        heading: '行动牌',
        items: [
          '即时行动牌一旦翻开立刻结算，然后离开桌面。',
          'Lose Cards 和 Earn Cards 使用发射器概率：0 张 30%，2 张 32%，3 张 31%，4 张 7%。',
          '困难模式加入 Others Lose、Others Earn、Lose All 和 Winner Takes All。',
          'Winner Takes All 会立刻收走桌面剩余牌并结束本局。',
        ],
      },
      {
        heading: '策略',
        items: [
          'Wild 很强，因为它可以在困难的匹配模式下补足配对。',
          '行动牌增加风险：领先玩家可能失去牌，落后玩家也可能追回来。',
          '困难模式下未知牌更危险，因为 Winner Takes All 可能提前结束本局。',
        ],
      },
    ],
    de: [
      {
        heading: 'Ziel',
        items: [
          'Finde passende UNO-Memory-Paare, während Aktionskarten das Rennen um gesammelte Karten verÄndern.',
          'Die Schwierigkeit bestimmt das Feld: Leicht 4 x 4, Mittel 6 x 6, Schwer 8 x 8.',
          'Es gewinnt, wer die meisten Karten gesammelt hat. Bei Gleichstand entscheidet die Punktesumme.',
        ],
      },
      {
        heading: 'Paare und Wilds',
        items: [
          'Nutze den gewählten Match-Modus: Zahl, Farbe oder Zahl + Farbe.',
          'Wild passt zu jeder normalen Karte und auch zu einem anderen Wild.',
          'Ein Treffer wird nach der Aufdeckzeit gesammelt und gibt einen weiteren Zug.',
        ],
      },
      {
        heading: 'Aktionskarten',
        items: [
          'Sofort-Aktionskarten werden direkt beim Aufdecken ausgefuhrt und verlassen dann den Tisch.',
          'Lose Cards und Earn Cards nutzen Launcher-Chancen: 0 Karten 30%, 2 Karten 32%, 3 Karten 31%, 4 Karten 7%.',
          'Schwer fugt Others Lose, Others Earn, Lose All und Winner Takes All hinzu.',
          'Winner Takes All sammelt sofort den restlichen Tisch und beendet die Runde.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Wilds sind stark, weil sie in jedem Match-Modus helfen.',
          'Aktionskarten bringen Risiko: Fuhrende können Karten verlieren, Zurückliegende können aufholen.',
          'In Schwer sind unbekannte Karten gefahrlicher, weil Winner Takes All die Runde sofort beenden kann.',
        ],
      },
    ],
  }
  return sections[language]
}

function guoTripleMemoryRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Goal',
        items: [
          'Find matching sets of three UNO number cards on the shared table.',
          'Easy uses a 6 x 3 grid, Medium uses 6 x 6, and Hard uses 6 x 8.',
          'All cards start face down. On your turn, reveal exactly three cards.',
        ],
      },
      {
        heading: 'Triple Matching',
        items: [
          'Number mode: all three revealed cards must have the same number; colors do not matter.',
          'Color mode: all three revealed cards must have the same color; numbers do not matter.',
          'Number + color mode: all three revealed cards must have both the same number and the same color.',
          'Example: red 5, blue 5, and yellow 5 match in Number mode, but not in Number + color mode.',
        ],
      },
      {
        heading: 'Turn Flow',
        items: [
          'A correct triple is collected after the reveal time, and the same player takes another turn.',
          'A wrong triple stays visible briefly, flips face down, and the turn passes to the next player.',
          'The round ends when all table cards have been collected.',
        ],
      },
      {
        heading: 'Strategy And Scoring',
        items: [
          'Triples are harder than pairs, so remember partial information: two known 7s are only useful when you also know a third 7.',
          'In Color mode, group positions by color zones instead of exact numbers.',
          'The round winner has the most collected cards. Ties use collected point total.',
          'The session continues over multiple rounds until a player reaches the configured target score.',
        ],
      },
    ],
    zh: [
      {
        heading: '目标',
        items: [
          '在公共桌面上寻找三张一组的 UNO 数字牌。',
          '简单为 6 x 3，中等为 6 x 6，困难为 6 x 8。',
          '所有牌开局背面朝上。轮到你时，需要翻开三张牌。',
        ],
      },
      {
        heading: '三张匹配',
        items: [
          '数字模式：三张牌数字必须相同，颜色不重要。',
          '颜色模式：三张牌颜色必须相同，数字不重要。',
          '数字 + 颜色模式：三张牌的数字和颜色都必须完全相同。',
          '例子：红 5、蓝 5、黄 5 在数字模式下匹配，但在数字 + 颜色模式下不匹配。',
        ],
      },
      {
        heading: '回合流程',
        items: [
          '如果三张牌匹配，显示时间结束后由当前玩家收集，并继续行动。',
          '如果三张牌不匹配，会短暂显示，然后翻回背面，轮到下一位玩家。',
          '桌面上所有牌都被收集后，本轮结束。',
        ],
      },
      {
        heading: '策略与计分',
        items: [
          '三张匹配比两张更难，记忆时要保留部分信息：知道两个 7 还不够，还要找到第三个 7。',
          '颜色模式下，可以优先按颜色区域记忆，而不是记住每个数字。',
          '本轮收集牌数最多的玩家获胜；如果牌数相同，比较收集牌的点数总和。',
          '游戏会话会持续多轮，直到有玩家达到设定的目标分数。',
        ],
      },
    ],
    de: [
      {
        heading: 'Ziel',
        items: [
          'Finde passende Dreiergruppen aus UNO-Zahlenkarten auf dem gemeinsamen Tisch.',
          'Leicht nutzt 6 x 3, Mittel nutzt 6 x 6, Schwer nutzt 6 x 8.',
          'Alle Karten starten verdeckt. In deinem Zug deckst du genau drei Karten auf.',
        ],
      },
      {
        heading: 'Dreier-Match',
        items: [
          'Zahlenmodus: Alle drei Karten brauchen dieselbe Zahl; Farben sind egal.',
          'Farbmodus: Alle drei Karten brauchen dieselbe Farbe; Zahlen sind egal.',
          'Zahl + Farbe: Alle drei Karten brauchen dieselbe Zahl und dieselbe Farbe.',
          'Beispiel: Rot 5, Blau 5 und Gelb 5 passen im Zahlenmodus, aber nicht bei Zahl + Farbe.',
        ],
      },
      {
        heading: 'Zugablauf',
        items: [
          'Ein richtiges Triple wird nach der Aufdeckzeit gesammelt, und derselbe Spieler ist erneut dran.',
          'Ein falsches Triple bleibt kurz sichtbar, dreht sich wieder um, und der Zug geht weiter.',
          'Die Runde endet, wenn alle Tischkarten gesammelt wurden.',
        ],
      },
      {
        heading: 'Tipps Und Wertung',
        items: [
          'Triples sind schwerer als Paare: Zwei bekannte 7er helfen erst richtig, wenn du auch den dritten 7er kennst.',
          'Im Farbmodus lohnt es sich, Farbgruppen statt einzelner Zahlen zu merken.',
          'Die Runde gewinnt, wer die meisten Karten gesammelt hat. Bei Gleichstand entscheidet die höhere Punktesumme.',
          'Die Sitzung läuft über mehrere Runden, bis jemand das eingestellte Ziel erreicht.',
        ],
      },
    ],
  }
  return sections[language]
}

function guoTripleMemoryActionRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Goal',
        items: [
          'Find matching triples while surprise action cards can change the collected-card race.',
          'Easy uses 6 x 3, Medium uses 6 x 6, and Hard uses 6 x 8.',
          'The round winner collects the most cards; the session winner is first to reach the target score.',
        ],
      },
      {
        heading: 'Triple Matching',
        items: [
          'Reveal three cards on your turn. Number mode needs three equal numbers, Color mode needs three equal colors, and Number + color needs both.',
          'Wild cards can complete any triple and are collected with the other two cards.',
          'A successful triple gives another turn. A miss flips back after the reveal time and passes play.',
        ],
      },
      {
        heading: 'Action Cards',
        items: [
          'Immediate action cards resolve as soon as they are revealed, then leave the table and clear the current selection.',
          'Lose Cards and Earn Cards use launcher odds: 0 cards 30%, 2 cards 32%, 3 cards 31%, 4 cards 7%.',
          'Medium adds Lose Cards and Earn Cards. Hard adds Others Lose, Others Earn, Lose All, and Winner Takes All.',
          'Winner Takes All collects the remaining table and ends the round after its animation.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Triples reward patient memory: two known matching cards are only half the job.',
          'Action cards can rescue a trailing player, but revealing one may also erase your current selection.',
          'In Color mode, remember color clusters; in Number + color mode, exact positions matter most.',
        ],
      },
    ],
    zh: [
      {
        heading: '目标',
        items: [
          '寻找三张匹配牌，同时小心惊喜行动牌改变收集牌数。',
          '简单为 6 x 3，中等为 6 x 6，困难为 6 x 8。',
          '本轮收集牌数最多的玩家获胜；会话中第一个达到目标分数的玩家获胜。',
        ],
      },
      {
        heading: '三张匹配',
        items: [
          '轮到你时翻开三张牌。数字模式需要三张数字相同，颜色模式需要三张颜色相同，数字 + 颜色模式需要两者都相同。',
          'Wild 可以补全任意三张匹配，并和另外两张牌一起被收集。',
          '匹配成功可以继续行动；不匹配则短暂显示后翻回背面，并轮到下一位玩家。',
        ],
      },
      {
        heading: '行动牌',
        items: [
          '即时行动牌一旦翻开就立刻结算，然后离开桌面，并清空当前选择。',
          'Lose Cards 和 Earn Cards 使用发射器概率：0 张 30%，2 张 32%，3 张 31%，4 张 7%。',
          '中等难度加入 Lose Cards 和 Earn Cards。困难难度加入 Others Lose、Others Earn、Lose All 和 Winner Takes All。',
          'Winner Takes All 会收集桌面剩余所有牌，并在动画结束后结束本轮。',
        ],
      },
      {
        heading: '策略',
        items: [
          '三张匹配需要更耐心的记忆：知道两张匹配牌还不够，还要找到第三张。',
          '行动牌可以帮助落后的玩家追上，但翻到行动牌也会打断当前选择。',
          '颜色模式下优先记住颜色区域；数字 + 颜色模式下，精确位置最重要。',
        ],
      },
    ],
    de: [
      {
        heading: 'Ziel',
        items: [
          'Finde passende Triples, während Aktionskarten das Rennen um gesammelte Karten verÄndern.',
          'Leicht nutzt 6 x 3, Mittel nutzt 6 x 6, Schwer nutzt 6 x 8.',
          'Die Runde gewinnt, wer die meisten Karten sammelt; die Sitzung gewinnt, wer zuerst das Ziel erreicht.',
        ],
      },
      {
        heading: 'Triple-Match',
        items: [
          'Decke in deinem Zug drei Karten auf. Zahlenmodus braucht drei gleiche Zahlen, Farbmodus drei gleiche Farben, Zahl + Farbe braucht beides.',
          'Wild-Karten können jedes Triple vervollständigen und werden mit den anderen zwei Karten gesammelt.',
          'Ein Treffer gibt einen weiteren Zug. Ein Fehlversuch dreht sich nach der Aufdeckzeit zurück und der Zug wechselt.',
        ],
      },
      {
        heading: 'Aktionskarten',
        items: [
          'Sofort-Aktionskarten werden direkt beim Aufdecken ausgeführt, verlassen den Tisch und leeren die aktuelle Auswahl.',
          'Lose Cards und Earn Cards nutzen Launcher-Chancen: 0 Karten 30%, 2 Karten 32%, 3 Karten 31%, 4 Karten 7%.',
          'Mittel fuegt Lose Cards und Earn Cards hinzu. Schwer fuegt Others Lose, Others Earn, Lose All und Winner Takes All hinzu.',
          'Winner Takes All sammelt den restlichen Tisch und beendet die Runde nach der Animation.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Triples belohnen geduldiges Merken: Zwei bekannte passende Karten reichen noch nicht.',
          'Aktionskarten können Rueckstaende aufholen, aber sie unterbrechen auch deine aktuelle Auswahl.',
          'Im Farbmodus helfen Farbgruppen; bei Zahl + Farbe zählen exakte Positionen am meisten.',
        ],
      },
    ],
  }
  return sections[language]
}

function guoNeighborMatchRuleSections(language: Language, config: GameConfig): RuleSection[] {
  const modeLine =
    language === 'zh'
      ? config.neighborColorConstrained ? '当前模式：数字必须相邻或相同，并且颜色必须匹配当前颜色。' : '当前模式：只检查数字是否相邻或相同，颜色可以改变。'
      : language === 'de'
        ? config.neighborColorConstrained ? 'Aktueller Modus: Zahl muss gleich oder benachbart sein, und die Farbe muss passen.' : 'Aktueller Modus: Nur die Zahl muss gleich oder benachbart sein; die Farbe darf wechseln.'
        : config.neighborColorConstrained ? 'Current mode: the number must be same/neighbor and the color must match.' : 'Current mode: only the number must be same/neighbor; color may change.'
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Goal',
        items: [
          'Play all your cards first, using UNO Classic scoring and session target rules.',
          'The twist is number movement: number cards may match the same number or a neighbor number.',
          modeLine,
        ],
      },
      {
        heading: 'Neighbor Numbers',
        items: [
          'If the anchor is 5, playable numbers are 4, 5, and 6.',
          'Numbers wrap around: 0 neighbors are 9 and 1; 9 neighbors are 8 and 0.',
          'Playing a number card makes that number the new anchor for the next player.',
        ],
      },
      {
        heading: 'Action And Wild Cards',
        items: [
          'Action cards such as Skip, Reverse, and Draw Two are playable by color only.',
          'Wild cards are playable anytime and must choose both a color and an anchor number from 0 to 9.',
          'After a Wild chooses anchor 5, the next playable numbers are 4, 5, and 6.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Middle anchors like 4 and 5 often keep more future options in your hand.',
          'Use Wilds to set a color and anchor that match several of your remaining cards.',
          'In color-constrained mode, preserving the active color is often stronger than chasing only the number.',
        ],
      },
    ],
    zh: [
      {
        heading: '目标',
        items: [
          '最先打完手牌，计分和会话目标沿用 UNO Classic。',
          '核心变化是数字移动：数字牌可以匹配相同数字或相邻数字。',
          modeLine,
        ],
      },
      {
        heading: '相邻数字',
        items: [
          '如果锚点数字是 5，可出的数字是 4、5、6。',
          '数字会环绕：0 的邻居是 9 和 1；9 的邻居是 8 和 0。',
          '打出数字牌后，该数字成为下一位玩家的新锚点。',
        ],
      },
      {
        heading: '行动牌和 Wild',
        items: [
          'Skip、Reverse、Draw Two 等行动牌只按颜色匹配。',
          'Wild 任何时候都可以出，但必须同时选择颜色和 0 到 9 的锚点数字。',
          '如果 Wild 选择锚点 5，下一位玩家可出的数字是 4、5、6。',
        ],
      },
      {
        heading: '策略',
        items: [
          '4、5 这类中间锚点通常会给手牌留下更多后续选择。',
          '使用 Wild 时，尽量选择能连接你多张手牌的颜色和锚点。',
          '在颜色限制模式中，保住当前颜色往往比只追数字更重要。',
        ],
      },
    ],
    de: [
      {
        heading: 'Ziel',
        items: [
          'Werde zuerst alle Karten los; Wertung und Sitzungsziel folgen UNO Classic.',
          'Der Dreh liegt in der Zahl: Zahlenkarten duerfen dieselbe oder eine benachbarte Zahl treffen.',
          modeLine,
        ],
      },
      {
        heading: 'Nachbarzählen',
        items: [
          'Ist der Anker 5, sind 4, 5 und 6 spielbar.',
          'Zahlen laufen rund: Nachbarn von 0 sind 9 und 1; Nachbarn von 9 sind 8 und 0.',
          'Eine gespielte Zahlenkarte wird zum neuen Anker für den nächsten Spieler.',
        ],
      },
      {
        heading: 'Aktionskarten Und Wild',
        items: [
          'Aktionskarten wie Aussetzen, Richtungswechsel und Zieh Zwei sind nur nach Farbe spielbar.',
          'Wild-Karten sind jederzeit spielbar und müssen Farbe und Ankerzahl von 0 bis 9 wählen.',
          'Wählt ein Wild den Anker 5, sind danach 4, 5 und 6 spielbar.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Mittlere Anker wie 4 und 5 halten oft mehr Optionen in deiner Hand offen.',
          'Nutze Wilds, um Farbe und Anker auf mehrere eigene Karten auszurichten.',
          'Im Farbzwang-Modus ist die aktive Farbe oft wichtiger als nur die Zahl.',
        ],
      },
    ],
  }
  return sections[language]
}

function guoHiLoRuleSections(language: Language, config: GameConfig): RuleSection[] {
  const modeLine =
    language === 'zh'
      ? config.hiLoColorConstrained ? '当前模式：数字必须符合高低指示，并且颜色必须匹配当前颜色。' : '当前模式：只检查数字是否符合高低指示，颜色可以改变。'
      : language === 'de'
        ? config.hiLoColorConstrained ? 'Aktueller Modus: Die Zahl muss der Höher/Tiefer-Anzeige folgen, und die Farbe muss passen.' : 'Aktueller Modus: Nur die Zahl muss der Höher/Tiefer-Anzeige folgen; die Farbe darf wechseln.'
        : config.hiLoColorConstrained ? 'Current mode: the number must follow the Hi-Lo indicator and the color must match.' : 'Current mode: only the number must follow the Hi-Lo indicator; color may change.'
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Goal',
        items: [
          'Play all your cards first, using UNO Classic scoring and session target rules.',
          'The center Hi-Lo indicator points Higher or Lower; number cards must follow that direction from the active number.',
          modeLine,
        ],
      },
      {
        heading: 'Number Matching',
        items: [
          'If the active number is 5 and the indicator points Higher, playable numbers are 6, 7, 8, and 9.',
          'If the active number is 5 and the indicator points Lower, playable numbers are 0, 1, 2, 3, and 4.',
          'The same number is not playable by default. Playing a valid number makes it the new active number.',
        ],
      },
      {
        heading: 'Edges And Indicator',
        items: [
          'There is no wraparound: 9 Higher and 0 Lower have no playable number cards.',
          'In an edge state, the next player can still play a valid action card, play a Wild, or draw.',
          'After every valid card is played, the indicator rerolls independently with a 50/50 Higher or Lower chance.',
        ],
      },
      {
        heading: 'Action And Wild Cards',
        items: [
          'Skip, Reverse, and draw actions follow normal UNO color or symbol playability.',
          'Wild cards must choose both the next color and active number from 0 to 9.',
          'Wilds do not choose the next direction; the indicator rerolls after the Wild is played.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Middle numbers such as 4 and 5 are flexible because both future directions can still leave many playable numbers.',
          'Edges can be tactical: setting 9 or 0 may pressure the next player if the indicator rerolls against them.',
          'In color mode, a strong action card by color can be more valuable than a number card that leaves the next player many options.',
        ],
      },
    ],
    zh: [
      {
        heading: '目标',
        items: [
          '最先打完手牌，计分和会话目标沿用 UNO Classic。',
          '桌面中央的高低指示器会显示“更高”或“更低”，数字牌必须根据当前数字遵守这个方向。',
          modeLine,
        ],
      },
      {
        heading: '数字匹配',
        items: [
          '如果当前数字是 5，指示器为“更高”，可出的数字是 6、7、8、9。',
          '如果当前数字是 5，指示器为“更低”，可出的数字是 0、1、2、3、4。',
          '默认不能出相同数字。打出有效数字牌后，该数字成为新的当前数字。',
        ],
      },
      {
        heading: '边界和指示器',
        items: [
          '没有环绕规则：9 且要求更高、0 且要求更低时，没有可出的数字牌。',
          '遇到边界状态时，下一位玩家仍然可以出合法行动牌、出 Wild，或者抽牌。',
          '每打出一张合法牌后，指示器都会独立重新随机，高低各 50% 概率。',
        ],
      },
      {
        heading: '行动牌和 Wild',
        items: [
          'Skip、Reverse 和罚牌行动牌按照普通 UNO 的颜色或符号规则出牌。',
          'Wild 必须同时选择下一个颜色和 0 到 9 的当前数字。',
          'Wild 不能选择方向；Wild 打出后，指示器会重新随机。',
        ],
      },
      {
        heading: '策略',
        items: [
          '4、5 这样的中间数字更灵活，因为高低两个方向都可能留下较多可出数字。',
          '边界数字可以形成压力：设置 9 或 0 后，如果指示器随机到不利方向，下一位玩家可能没有数字牌可出。',
          '在颜色限制模式中，一张按颜色可出的行动牌，有时比留下很多数字选择的数字牌更强。',
        ],
      },
    ],
    de: [
      {
        heading: 'Ziel',
        items: [
          'Werde zuerst alle Karten los; Wertung und Sitzungsziel folgen UNO Classic.',
          'Die Hi-Lo-Anzeige in der Mitte zeigt Höher oder Tiefer; Zahlenkarten müssen dieser Richtung ab der aktiven Zahl folgen.',
          modeLine,
        ],
      },
      {
        heading: 'Zahlenregel',
        items: [
          'Ist die aktive Zahl 5 und die Anzeige steht auf Höher, sind 6, 7, 8 und 9 spielbar.',
          'Ist die aktive Zahl 5 und die Anzeige steht auf Tiefer, sind 0, 1, 2, 3 und 4 spielbar.',
          'Die gleiche Zahl ist standardmaessig nicht spielbar. Eine gueltige Zahlenkarte wird zur neuen aktiven Zahl.',
        ],
      },
      {
        heading: 'Raender Und Anzeige',
        items: [
          'Es gibt keinen Rundlauf: 9 Höher und 0 Tiefer haben keine spielbaren Zahlenkarten.',
          'In so einer Randlage kann der nächste Spieler trotzdem eine gueltige Aktionskarte, ein Wild oder eine gezogene Karte versuchen.',
          'Nach jeder gueltig gespielten Karte würfelt die Anzeige unabhaengig neu: 50% Höher, 50% Tiefer.',
        ],
      },
      {
        heading: 'Aktionskarten Und Wild',
        items: [
          'Aussetzen, Richtungswechsel und Ziehkarten folgen normaler UNO-Spielbarkeit nach Farbe oder Symbol.',
          'Wild-Karten müssen Farbe und aktive Zahl von 0 bis 9 wählen.',
          'Wilds wählen nicht die Richtung; die Anzeige würfelt nach dem Wild neu.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Mittlere Zahlen wie 4 und 5 sind flexibel, weil beide Richtungen oft viele Optionen offenlassen.',
          'Randzählen können Druck machen: 9 oder 0 werden stark, wenn die Anzeige danach unguenstig faellt.',
          'Im Farbmodus kann eine passende Aktionskarte stärker sein als eine Zahl, die dem nächsten Spieler viele Optionen lässt.',
        ],
      },
    ],
  }
  return sections[language]
}

function guoPassageRuleSections(language: Language, config: GameConfig): RuleSection[] {
  const modeLine = passageModeDescription(language, config.memoryMatchMode)
  const sections: Record<Language, RuleSection[]> = {
    en: [
      { heading: 'Goal', items: ['Empty your hand first. You score completed pairs during the round, and the first player out receives a 10 point quickest-run bonus.', `The session target is ${config.targetScore} points.`] },
      { heading: 'Deck', items: ['The deck has only 1-9 number cards in red, yellow, green, and blue, with two copies of each.', 'There are four normal Wild cards. There are no 0 cards and no action cards in this first version.', 'Total deck size is 76 cards.'] },
      { heading: 'Table Areas', items: ['Face-up slot: holds exactly one visible card. If a player passes a new face-up card, it replaces the old one.', 'Passage slot: holds exactly one hidden card. If a player passes a new face-down card, it replaces the old one.', 'Replaced slot cards are not scoring pairs. They move to a refill discard pool and can be reshuffled into the draw deck when the draw deck becomes empty.'] },
      { heading: 'Turn Flow', items: ['Take exactly one card from the face-up slot, the face-down passage slot, or the draw deck.', 'Try to pair the taken card with exactly one card from your hand. If you pair, both cards score and leave the round.', 'If no pair is made, the taken card joins your hand. Then pass one card face up or face down for the next player.'] },
      { heading: 'Pair Rules', items: [modeLine, 'Number mode pairs equal numbers, for example Yellow 2 with Green 2.', 'Color mode pairs equal colors, for example Red 1 with Red 8.', 'Number + color mode requires an exact match, for example Red 2 with Red 2.'] },
      { heading: 'Wilds And Scoring', items: ['A Wild pairs with one number card and declares that card color and number.', 'Number cards score face value. Wild scores the declared number. Example: Red 5 + Wild declared Red 5 scores 10.', 'Completed scoring pairs never return to the deck. If the draw deck is empty, only non-scoring passed cards are reshuffled.'] },
      { heading: 'Strategy', items: ['Face-up cards are safe information, while the face-down passage slot can be stronger but uncertain.', 'Passing face up can tempt the next player; passing face down hides information.', 'In Number + color mode, protect Wilds because exact pairs are harder to find.'] },
    ],
    zh: [
      { heading: '牌区', items: ['明牌格：只能放 1 张可见牌。玩家明牌传出新牌时，新牌会替换旧牌。', 'Passage 暗格：只能放 1 张面朝下的暗牌。玩家暗牌传出新牌时，新牌会替换旧牌。', '被替换的格子牌不是计分配对。它们会进入补牌弃牌池，牌库用完时可以重新洗回牌库。'] },
      { heading: '目标', items: ['最先清空手牌。回合中完成配对会立即得分，最先出完的玩家额外获得 10 分最快奖励。', `本局会话目标是 ${config.targetScore} 分。`] },
      { heading: '牌库', items: ['牌库只使用红、黄、绿、蓝四种颜色的 1 到 9 数字牌，每种颜色每个数字两张。', '加入 4 张普通 Wild。第一版没有 0，也没有 Skip、Reverse、罚牌或扩展行动牌。', '总共 76 张牌。'] },
      { heading: '回合流程', items: ['从明牌堆、暗格 Passage 或牌库中拿且只拿一张牌。', '尝试用这张牌和手牌中的一张牌组成一个配对。成功配对后，两张牌计分并离开本回合。', '如果不配对，拿到的牌加入手牌。然后必须传出一张牌，可以明牌传出，也可以暗牌传出。'] },
      { heading: '配对规则', items: [modeLine, '数字模式：数字相同即可，例如黄 2 配绿 2。', '颜色模式：颜色相同即可，例如红 1 配红 8。', '数字 + 颜色模式：颜色和数字都必须相同，例如红 2 配红 2。'] },
      { heading: 'Wild 和计分', items: ['Wild 可以和一张数字牌配对，并声明为该数字牌的颜色和数字。', '数字牌按面值计分，Wild 按声明数字计分。例如红 5 + Wild 声明红 5，共 10 分。', '完成计分的配对不会回到牌库。牌库空时，只洗回未计分的传出弃牌。'] },
      { heading: '策略', items: ['拿明牌信息更安全；拿暗格可能更强，但有不确定性。', '明牌传出可以诱导下一位玩家，暗牌传出可以隐藏信息。', '在数字 + 颜色模式中，Wild 更珍贵，因为精确配对更难。'] },
    ],
    de: [
      { heading: 'Ziel', items: ['Leere deine Hand zuerst. Paare punkten sofort, und der erste Spieler ohne Handkarten bekommt 10 Bonuspunkte.', `Das Sitzungsziel ist ${config.targetScore} Punkte.`] },
      { heading: 'Deck', items: ['Das Deck nutzt nur Zahlen 1 bis 9 in Rot, Gelb, Grün und Blau, jeweils zweimal.', 'Dazu kommen vier normale Wild-Karten. In Version 1 gibt es keine 0 und keine Aktionskarten.', 'Das Deck hat 76 Karten.'] },
      { heading: 'Tischbereiche', items: ['Offener Slot: hält genau eine sichtbare Karte. Wenn ein Spieler offen passt, ersetzt die neue Karte die alte.', 'Passage-Slot: hält genau eine verdeckte Karte. Wenn ein Spieler verdeckt passt, ersetzt die neue Karte die alte.', 'Ersetzte Slot-Karten sind keine Wertungspaare. Sie gehen in einen Nachzieh-Ablagepool und können ins Deck gemischt werden, wenn das Deck leer ist.'] },
      { heading: 'Zugablauf', items: ['Nimm genau eine Karte vom offenen Slot, aus dem verdeckten Passage-Slot oder vom Deck.', 'Versuche, diese Karte mit genau einer Handkarte zu paaren. Ein Paar punktet und verlässt die Runde.', 'Wenn kein Paar entsteht, kommt die genommene Karte auf deine Hand. Danach passt du eine Karte offen oder verdeckt weiter.'] },
      { heading: 'Paarregeln', items: [modeLine, 'Zahlmodus: gleiche Zahl, zum Beispiel Gelb 2 mit Grün 2.', 'Farbmodus: gleiche Farbe, zum Beispiel Rot 1 mit Rot 8.', 'Zahl + Farbe: exakt gleich, zum Beispiel Rot 2 mit Rot 2.'] },
      { heading: 'Wilds Und Wertung', items: ['Ein Wild paart mit einer Zahlenkarte und deklariert deren Farbe und Zahl.', 'Zahlen zählen ihren Wert. Wild zählt die deklarierte Zahl. Beispiel: Rot 5 + Wild als Rot 5 ergibt 10 Punkte.', 'Gewertete Paare kommen nie zurück ins Deck. Bei leerem Deck werden nur nicht gewertete Pass-Karten gemischt.'] },
      { heading: 'Tipps', items: ['Offene Karten sind sichere Information; der verdeckte Passage-Slot kann stärker, aber riskanter sein.', 'Offen passen kann den nächsten Spieler locken; verdeckt passen versteckt Information.', 'Im Exaktmodus sind Wilds besonders wertvoll, weil passende Paare seltener sind.'] },
    ],
  }
  return sections[language]
}

function h2oRuleSections(language: Language, config: GameConfig): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'H2O Flow',
        items: [
          'UNO H2O follows the classic color, number, and symbol matching rules.',
          'The deck uses waterproof-style Downpour wild cards instead of the normal Wild cards in this first playable pass.',
          'Call UNO before playing from two cards down to one card; missed calls can still be caught for a 2-card penalty.',
        ],
      },
      {
        heading: 'Downpour Cards',
        items: [
          'Wild Downpour +1 lets you choose the active color, then every other player immediately draws 1 card.',
          'Wild Downpour +2 lets you choose the active color, then every other player immediately draws 2 cards.',
          'After a Downpour card resolves, play continues with the next player in the current direction.',
        ],
      },
    ],
    zh: [
      {
        heading: 'H2O 流程',
        items: [
          'UNO H2O 遵循经典 UNO 的颜色、数字和符号匹配规则。',
          '本次可玩版本使用防水主题的大雨万能牌来替代普通万能牌。',
          '从两张牌打到一张牌前仍需先叫 UNO；忘记时会被抓 UNO 并摸 2 张。',
        ],
      },
      {
        heading: '大雨牌',
        items: [
          '大雨 +1 可以选择当前颜色，然后其他每位玩家立即摸 1 张。',
          '大雨 +2 可以选择当前颜色，然后其他每位玩家立即摸 2 张。',
          '大雨效果结算后，按当前方向由下一位玩家继续。',
        ],
      },
    ],
    de: [
      {
        heading: 'H2O-Ablauf',
        items: [
          'UNO H2O folgt den klassischen Regeln für Farbe, Zahl und Symbol.',
          'Das Deck nutzt in diesem ersten spielbaren Stand wasserfeste Wolkenbruch-Wildkarten statt normaler Wildkarten.',
          'Rufe UNO, bevor du von zwei Karten auf eine Karte spielst; vergessene Rufe können weiter mit 2 Karten bestraft werden.',
        ],
      },
      {
        heading: 'Wolkenbruch-Karten',
        items: [
          'Wild Wolkenbruch +1 lässt dich die aktive Farbe wählen; alle anderen Spieler ziehen sofort 1 Karte.',
          'Wild Wolkenbruch +2 lässt dich die aktive Farbe wählen; alle anderen Spieler ziehen sofort 2 Karten.',
          'Nach dem Wolkenbruch-Effekt spielt der nächste Spieler in aktueller Richtung weiter.',
        ],
      },
    ],
  }
  const splash = h2oSplashRuleSections(language)
  return config.h2oSplash ? [...sections[language], ...splash] : sections[language]
}

function h2oSplashRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Splash Whirlpool',
        items: [
          'When a 0, a 2, or a Downpour wild card is played, the next player shakes the simulated Whirlpool.',
          'The Whirlpool randomly selects one of 8 commands: Draw H2O, Wipeout, Wave Left, Wave Right, Give 1, Discard 2, Draw 2, or Draw 3.',
          'Draw H2O draws until a blue card, 0, 2, or wild card appears. Wipeout reverses direction and makes the triggering player resolve another Whirlpool command.',
        ],
      },
    ],
    zh: [
      {
        heading: 'Splash 漩涡装置',
        items: [
          '打出 0、2 或大雨万能牌时，下一位玩家会摇动模拟漩涡装置。',
          '漩涡会随机选择 8 个指令之一：Draw H2O、Wipeout、Wave Left、Wave Right、Give 1、Discard 2、Draw 2 或 Draw 3。',
          'Draw H2O 会一直摸到蓝色牌、0、2 或万能牌。Wipeout 会反转方向，并让触发者再结算一个漩涡指令。',
        ],
      },
    ],
    de: [
      {
        heading: 'Splash-Whirlpool',
        items: [
          'Wenn eine 0, eine 2 oder eine Wolkenbruch-Wildkarte gespielt wird, schuttelt der nächste Spieler den simulierten Whirlpool.',
          'Der Whirlpool wählt zufällig einen von 8 Befehlen: Draw H2O, Wipeout, Wave Left, Wave Right, Give 1, Discard 2, Draw 2 oder Draw 3.',
          'Draw H2O zieht bis Blau, 0, 2 oder Wild erscheint. Wipeout kehrt die Richtung um und lässt den Auslöser einen weiteren Whirlpool-Befehl ausführen.',
        ],
      },
    ],
  }
  return sections[language]
}

function spinRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Spin Wheel',
        items: [
          'UNO Spin follows classic UNO matching, but one 1-5 number card in each color is marked as a Spin card.',
          'When a Spin card is played, the next player does not play from hand. The simulated wheel resolves immediately and that player loses the turn.',
          'The table badge and bottom pane show the latest wheel result so players can follow the physical-wheel simulation.',
        ],
      },
      {
        heading: 'Wheel Results',
        items: [
          'The wheel can trigger Almost UNO, Discard Number, Discard Color, Color Draw, Wild Color Draw, Trade Hands, Show Hand, War, or UNO Spin.',
          'For choice-based spaces, the web app chooses a sensible automatic option, such as discarding highest-risk cards or choosing the color/value with the biggest benefit.',
          'Spin cards score their face value. Other scoring follows classic UNO scoring.',
        ],
      },
    ],
    zh: [
      {
        heading: '旋转轮',
        items: [
          'UNO Spin 遵循经典 UNO 的匹配规则，但每种颜色的 1 到 5 各有一张标记为旋转牌。',
          '打出旋转牌后，下一位玩家不能从手牌出牌。模拟旋转轮会立即结算，该玩家失去本回合。',
          '桌面徽章和底部信息栏会显示最新的旋转结果，方便跟踪模拟硬件。',
        ],
      },
      {
        heading: '旋转结果',
        items: [
          '旋转轮可能触发 Almost UNO、弃数字、弃颜色、抽到颜色、指定颜色抽牌、交换手牌、展示手牌、战争或 UNO Spin。',
          '对于需要选择的格子，应用会自动选择合理选项，例如弃掉风险最高的牌，或选择收益最大的颜色/数字。',
          '旋转数字牌按牌面点数计分，其余计分遵循经典 UNO。',
        ],
      },
    ],
    de: [
      {
        heading: 'Spin-Rad',
        items: [
          'UNO Spin folgt den klassischen UNO-Matching-Regeln, aber je eine Zahlenkarte 1 bis 5 pro Farbe ist als Spin-Karte markiert.',
          'Wenn eine Spin-Karte gespielt wird, spielt der nächste Spieler keine Handkarte. Das simulierte Rad wird sofort ausgewertet und dieser Spieler setzt aus.',
          'Das Tischsymbol und die untere Infokarte zeigen das letzte Radergebnis, damit die simulierte Hardware nachvollziehbar bleibt.',
        ],
      },
      {
        heading: 'Radergebnisse',
        items: [
          'Das Rad kann Almost UNO, Zahl ablegen, Farbe ablegen, Farbe ziehen, Wild-Farbe ziehen, Hande tauschen, Hand zeigen, War oder UNO Spin auslosen.',
          'Bei Auswahlfeldern wählt die App automatisch eine sinnvolle Option, etwa Karten mit hohem Risiko oder die nutzlichste Farbe/Zahl.',
          'Spin-Karten zählen ihren Zahlenwert. Die ubrige Wertung folgt Classic UNO.',
        ],
      },
    ],
  }
  return sections[language]
}

function zeroRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Grid Goal',
        items: [
          'Each player has a 2x3 grid. Two cards start face-up and the rest are hidden.',
          'On your turn, draw from the deck or take the top discard, then place that card into one grid slot.',
          'The removed grid card goes to the discard pile. If the drawn deck card matches the top discard by color, number, or symbol, you may discard it immediately instead.',
        ],
      },
      {
        heading: 'Zero and Scoring',
        items: [
          'Two face-up cards in the same column with the same color or number are immediately cleared from your grid.',
          'Call UNO Zero when only one face-down grid card remains. If caught, two face-up penalty cards are added to your grid.',
          'A round ends when one player has no hidden grid cards left. That player scores 0; all others add their grid card values. After exactly 9 rounds, the lowest total wins.',
        ],
      },
    ],
    zh: [
      {
        heading: '方格目标',
        items: [
          '每位玩家有一个 2x3 方格。开始时翻开两张，其余保持盖牌。',
          '你的回合中，从牌库摸一张或拿走弃牌堆顶牌，然后把这张牌放进一个方格。',
          '被替换的方格牌进入弃牌堆。如果从牌库摸到的牌与弃牌堆顶牌颜色、数字或符号匹配，可以立即弃掉。',
        ],
      },
      {
        heading: '归零和计分',
        items: [
          '同一列中两张正面牌若颜色或数字相同，会立即从方格中清除。',
          '当只剩一张盖着的方格牌时，需要喊 UNO Zero。被抓到时，方格中加入两张正面惩罚牌。',
          '当一名玩家没有盖着的方格牌时本局结束。该玩家本局 0 分，其他玩家把方格牌点数加入总分。正好 9 局后，总分最低者获胜。',
        ],
      },
    ],
    de: [
      {
        heading: 'Rasterziel',
        items: [
          'Jeder Spieler hat ein 2x3-Raster. Zwei Karten starten offen, die restlichen liegen verdeckt.',
          'In deinem Zug ziehst du vom Deck oder nimmst die oberste Ablagekarte und legst diese Karte in ein Rasterfeld.',
          'Die ersetzte Rasterkarte geht auf die Ablage. Wenn eine vom Deck gezogene Karte nach Farbe, Zahl oder Symbol zur Ablage passt, darfst du sie sofort ablegen.',
        ],
      },
      {
        heading: 'Zero und Wertung',
        items: [
          'Zwei offene Karten in derselben Spalte mit gleicher Farbe oder Zahl werden sofort aus deinem Raster entfernt.',
          'Rufe UNO Zero, wenn nur noch eine verdeckte Rasterkarte ubrig ist. Wird das vergessen, kommen zwei offene Strafkarten ins Raster.',
          'Eine Runde endet, wenn ein Spieler keine verdeckten Rasterkarten mehr hat. Dieser Spieler bekommt 0 Punkte; alle anderen addieren ihre Rasterwerte. Nach genau 9 Runden gewinnt die niedrigste Summe.',
        ],
      },
    ],
  }
  return sections[language]
}

function caboRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Memory Grid',
        items: [
          'Each player starts with four face-down cards in a 2x2 grid and may know two of them.',
          'On your turn, draw from the deck or take the top discard. A card taken from discard must replace one of your grid cards.',
          'A card drawn from the deck may either replace a grid card or be discarded immediately.',
        ],
      },
      {
        heading: 'Score Goal',
        items: [
          'Keep low cards and replace high cards as you learn your grid.',
          'Discarding a 7 or 8 drawn from the deck lets you Peek at one of your own cards. Discarding a 9 or 10 lets you Spy on another player card. Discarding an 11 or 12 lets you Swap any two grid cards.',
          'Call Cabo when you think you are low enough. Every other player gets one final turn, then all grids reveal and the lowest grid wins the round.',
        ],
      },
    ],
    zh: [
      {
        heading: '记忆方格',
        items: [
          '每位玩家开局有四张盖牌，组成 2x2 方格，并且可以知道其中两张。',
          '轮到你时，可以从牌库摸一张，或拿走弃牌堆顶牌。从弃牌堆拿的牌必须替换你方格中的一张牌。',
          '从牌库摸到的牌可以替换方格牌，也可以立刻弃掉。',
        ],
      },
      {
        heading: '低分目标',
        items: [
          '尽量保留低点数牌，并在记住方格信息后替换高点数牌。',
          '当前第一版可玩切片实现 Cabo 的摸牌、弃牌和替换方格循环，目标为低分 100 分。',
          '7-12 的查看、侦察和交换能力，以及最终喊 Cabo 的流程，将放在下一层规则中实现。',
        ],
      },
    ],
    de: [
      {
        heading: 'Gedachtnisraster',
        items: [
          'Jeder Spieler startet mit vier verdeckten Karten in einem 2x2-Raster und kennt zwei davon.',
          'In deinem Zug ziehst du vom Deck oder nimmst die oberste Ablagekarte. Eine Ablagekarte muss ein Rasterfeld ersetzen.',
          'Eine vom Deck gezogene Karte darf ein Rasterfeld ersetzen oder sofort abgelegt werden.',
        ],
      },
      {
        heading: 'Niedrige Punkte',
        items: [
          'Behalte niedrige Karten und ersetze hohe Karten, sobald du dein Raster besser kennst.',
          'Eine gezogene und abgelegte 7/8 erlaubt Peek auf eine eigene Karte. Eine 9/10 erlaubt Spy auf eine gegnerische Karte. Eine 11/12 erlaubt Swap zwischen zwei Rasterkarten.',
          'Rufe Cabo, wenn du glaubst, niedrig genug zu sein. Alle anderen spielen noch einen letzten Zug, dann werden alle Raster aufgedeckt und der niedrigste Wert gewinnt die Runde.',
        ],
      },
    ],
  }
  return sections[language]
}

function popCultureRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Four Editions',
        items: [
          'This slice combines four pop-culture UNO twists into one classic-style deck.',
          'Sorting Hat chooses a player and color; that player draws until a low Gryffindor-number card appears.',
          'The Force chooses a player and color; if that player has the called color, they draw 2.',
        ],
      },
      {
        heading: 'Shield and Attack',
        items: [
          'Avengers Assemble can be played as a normal Wild, or out of turn to reflect a pending +2/+4 penalty back to the source.',
          'T-Rex Attack chooses a color; if the next player has no card of that color, they draw 5.',
          'All standard UNO matching, UNO calls, Wild +4 challenges, and scoring follow Classic UNO.',
        ],
      },
    ],
    zh: [
      {
        heading: '四个主题版本',
        items: [
          '这一切片把四个流行文化 UNO 主题能力合并到一个经典规则牌组中。',
          'Sorting Hat 选择一名玩家和颜色；该玩家一直摸牌，直到摸到低点数 Gryffindor 数字牌。',
          'The Force 选择一名玩家和颜色；如果该玩家有被叫到的颜色，他摸 2 张。',
        ],
      },
      {
        heading: '防御与攻击',
        items: [
          'Avengers Assemble 可以当普通万能牌使用，也可以在受到 +2/+4 惩罚时立即打出，把惩罚反弹给来源玩家。',
          'T-Rex Attack 选择颜色；如果下一位玩家没有该颜色的牌，他摸 5 张。',
          '匹配、UNO 叫牌、Wild +4 质疑和计分仍遵循经典 UNO。',
        ],
      },
    ],
    de: [
      {
        heading: 'Vier Editionen',
        items: [
          'Dieser Slice kombiniert vier Pop-Culture-UNO-Twists in einem klassischen Deck.',
          'Sorting Hat wählt Spieler und Farbe; dieser Spieler zieht bis zu einer niedrigen Gryffindor-Zahlenkarte.',
          'The Force wählt Spieler und Farbe; hat dieser Spieler die genannte Farbe, zieht er 2.',
        ],
      },
      {
        heading: 'Schild und Angriff',
        items: [
          'Avengers Assemble funktioniert als normales Wild oder wehrt eine +2/+4-Strafe ab und schickt sie zum Ursprung zurück.',
          'T-Rex Attack wählt eine Farbe; hat der nächste Spieler diese Farbe nicht, zieht er 5.',
          'Matching, UNO-Rufe, Wild-+4-Challenges und Wertung folgen Classic UNO.',
        ],
      },
    ],
  }
  return sections[language]
}

function skyjoRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Goal and Setup',
        items: [
          'Lowest score wins. Each player has a 3x4 grid and starts with two cards revealed.',
          'On your turn, either draw from the deck or take the top discard.',
          'Taking the discard must replace one grid card. Drawing from the deck may replace a grid card or be discarded to reveal one hidden card.',
        ],
      },
      {
        heading: 'Round End',
        items: [
          'Three face-up cards with the same value in one vertical column are cleared.',
          'When a player reveals their full grid, every other player gets one final turn.',
          'All grid totals are added to session scores. If anyone reaches 100, the lowest total score wins the session.',
        ],
      },
    ],
    zh: [
      {
        heading: '目标和设置',
        items: [
          '分数越低越好。每位玩家有 3x4 方格，开局翻开两张牌。',
          '轮到你时，可以从牌库摸牌，或拿走弃牌堆顶牌。',
          '拿弃牌必须替换一张方格牌。从牌库摸到的牌可以替换方格牌，也可以弃掉并翻开一张隐藏牌。',
        ],
      },
      {
        heading: '回合结束',
        items: [
          '同一竖列三张已翻开的同点数牌会被清除。',
          '当一名玩家翻开完整方格后，其他每位玩家各有最后一回合。',
          '所有方格点数加入总分。有人达到 100 分后，总分最低者赢得本局。',
        ],
      },
    ],
    de: [
      {
        heading: 'Ziel und Aufbau',
        items: [
          'Die niedrigste Punktzahl gewinnt. Jede Person hat ein 3x4-Raster und startet mit zwei offenen Karten.',
          'Im Zug ziehst du vom Stapel oder nimmst die oberste Ablage.',
          'Die Ablage muss eine Rasterkarte ersetzen. Eine gezogene Karte darf ersetzen oder abgeworfen werden, um eine verdeckte Karte aufzudecken.',
        ],
      },
      {
        heading: 'Rundenende',
        items: [
          'Drei offene Karten mit gleichem Wert in einer senkrechten Spalte werden entfernt.',
          'Wenn eine Person ihr ganzes Raster offen hat, bekommen alle anderen einen letzten Zug.',
          'Alle Rasterwerte gehen in die Gesamtwertung. Sobald jemand 100 erreicht, gewinnt die niedrigste Gesamtpunktzahl.',
        ],
      },
    ],
  }
  return sections[language]
}

function dosRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Goal and Setup',
        items: [
          'Be the first player to empty your hand. Each player starts with seven cards.',
          'The table starts with a two-card center row instead of one top discard card.',
          'On your turn, match exactly one center card, then play passes to the next player.',
        ],
      },
      {
        heading: 'How Matching Works',
        items: [
          'Single match: play one card with the same number as a center card. Example: play 7 on a center 7.',
          'Double match: play two cards whose numbers add up to a center card. Example: play 3 + 4 on a center 7.',
          'Wild DOS counts as 2. Wild # can stand for any number from 1 to 10, so it is strongest when it completes a sum.',
          'In this playable slice, click a playable card; if it needs a partner card, the app chooses a valid partner automatically.',
        ],
      },
      {
        heading: 'Color Bonuses',
        items: [
          'A single color match lets you add one card from your hand to the center row.',
          'A double color match makes every other player draw one card, then also lets you add one card to the center row.',
          'Example: red 3 + red 4 on a red 7 is a double color match, so opponents draw 1 and you place one extra card into the center row.',
        ],
      },
      {
        heading: 'Tips and Tricks',
        items: [
          'Try to save pairs that can make several totals, such as 3 + 4, 4 + 5, or Wild # plus a mid-value card.',
          'Use color bonuses to reduce your hand faster, but avoid adding a center card that gives the next player an easy match.',
          'If you cannot match the center row, draw one card. If it still cannot match, your turn passes.',
          'Call DOS when you have two cards. If you miss it and another player catches you, you draw 2.',
        ],
      },
      {
        heading: 'Scoring and Winning',
        items: [
          'When a player goes out, they win the round and score the cards left in every opponent hand.',
          'Number cards score their face value. Wild # scores 20 points and Wild DOS scores 40 points.',
          'The first player to reach 200 session points wins the DOS session.',
        ],
      },
    ],
    zh: [
      {
        heading: '目标和设置',
        items: [
          '目标是最先出完手牌。每位玩家起手七张牌。',
          '桌面使用两张中心牌，而不是单一弃牌堆顶牌。',
          '轮到你时，匹配一张中心牌，然后轮到下一位玩家。',
        ],
      },
      {
        heading: '如何匹配',
        items: [
          '单张匹配：用一张相同数字的牌匹配中心牌。例如：用 7 匹配中心 7。',
          '双张匹配：用两张牌数字相加来匹配中心牌。例如：用 3 + 4 匹配中心 7。',
          'Wild DOS 视为 2。Wild # 可以作为 1 到 10 中的任意数字，适合补足双张组合。',
          '当前可玩版本中，点击一张可出的牌；如果它需要搭配另一张牌，应用会自动选择一个有效搭档。',
        ],
      },
      {
        heading: '颜色奖励',
        items: [
          '单张颜色匹配后，你可以从手牌中添加一张牌到中心区。',
          '双张颜色匹配后，其他每位玩家各摸一张，然后你也可以添加一张牌到中心区。',
          '例如：红色 3 + 红色 4 匹配红色 7，就是双张颜色匹配；其他玩家摸 1 张，你再放一张手牌到中心区。',
        ],
      },
      {
        heading: '技巧',
        items: [
          '尽量保留能组成多个点数的组合，例如 3 + 4、4 + 5，或 Wild # 加中间点数牌。',
          '颜色奖励可以更快减少手牌，但不要放出让下一位玩家太容易匹配的中心牌。',
          '如果不能匹配中心区，摸一张牌；若摸到的牌仍不能匹配，回合结束。',
          '当你剩两张牌时要喊 DOS。忘记时被其他玩家抓到，需要摸 2 张。',
        ],
      },
      {
        heading: '计分和获胜',
        items: [
          '一名玩家出完手牌时赢得本局，并获得其他玩家手牌剩余分。',
          '数字牌按牌面数字计分。Wild # 计 20 分，Wild DOS 计 40 分。',
          '首先达到 200 会话分的玩家赢得 DOS 会话。',
        ],
      },
    ],
    de: [
      {
        heading: 'Ziel und Aufbau',
        items: [
          'Ziel ist es, als erste Person alle Handkarten loszuwerden. Jede Person startet mit sieben Karten.',
          'In der Tischmitte liegen zwei Karten statt eines einzelnen Ablagestapels.',
          'Im Zug passt du genau zu einer Mittelkarte; danach geht der Zug weiter.',
        ],
      },
      {
        heading: 'So funktionieren Treffer',
        items: [
          'Einzeltreffer: Spiele eine Karte mit derselben Zahl wie eine Mittelkarte. Beispiel: 7 auf eine mittlere 7.',
          'Doppeltreffer: Spiele zwei Karten, deren Zahlen die Mittelkarte ergeben. Beispiel: 3 + 4 auf eine mittlere 7.',
          'Wild DOS zählt als 2. Wild # kann für eine Zahl von 1 bis 10 stehen und ist besonders stark als fehlender Summand.',
          'In diesem spielbaren Stand klickst du eine spielbare Karte; braucht sie einen Partner, wählt die App automatisch eine gultige zweite Karte.',
        ],
      },
      {
        heading: 'Farbboni',
        items: [
          'Ein einfacher Farbtreffer lässt dich eine Karte aus deiner Hand in die Mitte legen.',
          'Ein doppelter Farbtreffer lässt alle anderen eine Karte ziehen und erlaubt dir ebenfalls eine Karte in die Mitte zu legen.',
          'Beispiel: rote 3 + rote 4 auf rote 7 ist ein doppelter Farbtreffer; Gegner ziehen 1 und du legst eine Zusatzkarte in die Mitte.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Bewahre Paare auf, die mehrere Summen bilden können, etwa 3 + 4, 4 + 5 oder Wild # mit einer mittleren Zahl.',
          'Farbboni reduzieren deine Hand schneller, können aber dem nächsten Spieler eine einfache Mittelkarte geben.',
          'Wenn du nicht treffen kannst, ziehst du eine Karte. Passt sie nicht, endet dein Zug.',
          'Rufe DOS bei zwei Handkarten. Vergisst du es und wirst erwischt, ziehst du 2 Karten.',
        ],
      },
      {
        heading: 'Wertung und Sieg',
        items: [
          'Wer alle Handkarten loswird, gewinnt die Runde und bekommt die Restkartenpunkte der Gegner.',
          'Zahlenkarten zählen ihren Wert. Wild # zählt 20 Punkte, Wild DOS zählt 40 Punkte.',
          'Wer zuerst 200 Sitzungspunkte erreicht, gewinnt die DOS-Sitzung.',
        ],
      },
    ],
  }
  return sections[language]
}

function flexRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Classic Base',
        items: [
          'UNO Flex uses the normal Classic UNO flow: match color, number, or symbol, play Wild cards, draw when you cannot play, call UNO before going from two cards to one, and score leftover opponent cards when someone goes out.',
          'The Flex deck adds special Flex action cards and a Power Card for each player. Apart from those additions, draw penalties, Wild color choice, turn order, and scoring follow Classic UNO.',
        ],
      },
      {
        heading: 'Power Cards',
        items: [
          'Each player starts with a green Power Card. While it is green, a Flex action card can be played with its stronger Flex side.',
          'Using a Flex side flips your Power Card to red. Number cards with the flip mark, Wild All Flip, or everyone being red can restore Power Cards to green.',
          'If all players are red at the same time, every Power Card flips back to green automatically.',
        ],
      },
      {
        heading: 'Flex Actions',
        items: [
          'Flex Skip skips every other player and gives you another turn.',
          'Flex Reverse reverses direction and skips the next player in the new direction.',
          'Flex +2 makes every other player draw 1. Wild Flex +2 lets you choose one player to draw 2.',
          'Wild All Flip flips every player Power Card to the opposite side.',
        ],
      },
      {
        heading: 'Strategy Tips',
        items: [
          'Do not spend green power automatically. A normal Flex +2 is stronger than its Flex side in a two-player game because the next player draws 2 instead of only 1.',
          'Spend Flex power when it changes tempo: Flex Skip can protect you from a dangerous next player, and Flex Reverse can both change direction and block the new next player.',
          'Use flip-marked number cards to recover your Power Card before playing another Flex action. If everyone is red, consider delaying Wild All Flip because the table will already reset to green automatically.',
          'Wild Flex +2 is strongest when one opponent is close to winning; target that player instead of spreading pressure evenly.',
        ],
      },
    ],
    zh: [
      {
        heading: '经典基础规则',
        items: [
          'UNO Flex 使用经典 UNO 的基本流程：按颜色、数字或符号匹配，可以出万能牌，不能出牌时摸牌，从两张打到一张前要喊 UNO，一名玩家出完后按对手剩余手牌计分。',
          'Flex 牌组额外加入 Flex 功能牌和每位玩家的 Power Card。除此之外，摸牌惩罚、万能选色、回合顺序和计分都遵循经典 UNO。',
        ],
      },
      {
        heading: 'Power Card',
        items: [
          '每位玩家开始时都有绿色 Power Card。它为绿色时，可以把 Flex 功能牌按更强的 Flex 面使用。',
          '使用 Flex 面后，你的 Power Card 翻到红色。带翻转标记的数字牌、Wild All Flip，或所有玩家都变红时，都可以让 Power Card 回到绿色。',
          '如果所有玩家的 Power Card 同时为红色，所有人会自动翻回绿色。',
        ],
      },
      {
        heading: 'Flex 功能',
        items: [
          'Flex Skip 会跳过其他所有玩家，让你再次行动。',
          'Flex Reverse 会反转方向，并跳过新方向上的下一位玩家。',
          'Flex +2 让其他每位玩家各摸 1 张。Wild Flex +2 可指定一名玩家摸 2 张。',
          'Wild All Flip 会把所有玩家的 Power Card 翻到相反面。',
        ],
      },
      {
        heading: '策略提示',
        items: [
          '不要自动消耗绿色 Power。在两人游戏中，普通 Flex +2 比 Flex 面更强，因为下一位摸 2 张，而 Flex 面只让对手摸 1 张。',
          '当 Flex 能改变节奏时再使用：Flex Skip 可以阻止危险的下一位玩家，Flex Reverse 可以反转方向并跳过新方向的下一位。',
          '优先用带翻转标记的数字牌恢复 Power Card，再准备下一张 Flex 功能牌。如果所有人都已经是红色，桌面会自动恢复绿色，Wild All Flip 可以留到更关键时刻。',
          'Wild Flex +2 最适合压制快要获胜的对手；优先指定那名玩家，而不是平均分散压力。',
        ],
      },
    ],
    de: [
      {
        heading: 'Classic-Basis',
        items: [
          'UNO Flex nutzt den normalen Classic-UNO-Ablauf: nach Farbe, Zahl oder Symbol passen, Wild-Karten spielen, ziehen wenn nichts passt, UNO vor dem Spiel von zwei auf eine Karte rufen und Restkarten der Gegner werten, sobald jemand fertig ist.',
          'Das Flex-Deck erganzt spezielle Flex-Aktionskarten und eine Power Card pro Spieler. Abgesehen davon folgen Ziehstrafen, Wild-Farbwahl, Zugreihenfolge und Wertung Classic UNO.',
        ],
      },
      {
        heading: 'Power Cards',
        items: [
          'Jeder Spieler startet mit einer grünen Power Card. Solange sie grün ist, kann eine Flex-Aktionskarte mit ihrer stärkeren Flex-Seite gespielt werden.',
          'Nach einer Flex-Seite wird deine Power Card rot. Zahlenkarten mit Flip-Markierung, Wild All Flip oder alle Spieler auf Rot können Power Cards wieder grün machen.',
          'Wenn alle Power Cards gleichzeitig rot sind, werden alle automatisch wieder grün.',
        ],
      },
      {
        heading: 'Flex-Aktionen',
        items: [
          'Flex Aussetzen Überspringt alle anderen Spieler und du bist erneut dran.',
          'Flex Richtung dreht die Richtung um und Überspringt den nächsten Spieler in der neuen Richtung.',
          'Flex +2 lässt alle anderen Spieler 1 Karte ziehen. Wild Flex +2 lässt dich einen Spieler bestimmen, der 2 zieht.',
          'Wild All Flip dreht jede Power Card auf die andere Seite.',
        ],
      },
      {
        heading: 'Strategie',
        items: [
          'Verbrauche grüne Power nicht automatisch. In einer Zwei-Spieler-Partie ist normales Flex +2 starker als die Flex-Seite, weil der nächste Spieler 2 statt nur 1 Karte zieht.',
          'Nutze Flex-Power, wenn sie das Tempo verÄndert: Flex Aussetzen kann einen gefährlichen nächsten Spieler stoppen, Flex Richtung dreht die Richtung und blockiert den neuen nächsten Spieler.',
          'Spiele Zahlenkarten mit Flip-Markierung, um deine Power Card wieder zu aktivieren, bevor du die nächste Flex-Aktion planst. Wenn alle rot sind, setzt der Tisch automatisch auf grün zurück.',
          'Wild Flex +2 ist am stärksten gegen einen Gegner, der kurz vor dem Sieg steht; ziele auf diese Person statt den Druck zu verteilen.',
        ],
      },
    ],
  }
  return sections[language]
}

function liarsRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Classic Base with Bluffing',
        items: [
          "Liar's Uno follows Classic UNO matching, UNO calls, and leftover-card scoring, but many cards are Liar cards.",
          'Regular cards play face up. Liar cards play face down and you announce a plausible color, number, symbol, or Wild claim.',
          'The web app shows a challenge window after a face-down card. If nobody challenges, the announced claim becomes the active card and its action resolves.',
        ],
      },
      {
        heading: 'Challenge Rules',
        items: [
          'If a challenger catches a lie, the bluffing player takes the card back and draws 1 penalty card.',
          'If the claim was truthful, the challenger draws 1 and the announced action happens.',
          'A claimed 0 passes all hands in the current direction. A claimed 7 swaps hands with the chosen opponent if the claim survives.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Small lies are safer early, especially when you claim a matching color rather than a suspicious action.',
          'Claim Skip, Reverse, or +2 when stopping the next player matters enough to risk a challenge.',
          'Challenge more often when the player is near UNO, when their claim would hurt you badly, or when their previous claims were too convenient.',
          "Wild Liar's Challenge is simulated automatically: opponents discard a chosen-color card if they have one, otherwise they draw 1 as the caught-lie penalty.",
        ],
      },
    ],
    zh: [
      {
        heading: '经典 UNO 加虚张声势',
        items: [
          "Liar's Uno 遵循经典 UNO 的匹配、喊 UNO 和剩余手牌计分，但牌组中有很多谎言牌。",
          '普通牌正面打出。谎言牌必须盖着打出，并宣称一个合理的颜色、数字、符号或万能牌。',
          '盖牌后应用会显示质疑窗口。若无人质疑，宣称的牌面成为当前牌，并结算宣称的功能。',
        ],
      },
      {
        heading: '质疑规则',
        items: [
          '如果质疑成功，撒谎玩家收回该牌并摸 1 张罚牌。',
          '如果宣称属实，质疑者摸 1 张，宣称的功能立即生效。',
          '宣称 0 会按当前方向传递所有手牌。宣称 7 若未被抓到，会与指定对手交换手牌。',
        ],
      },
      {
        heading: '策略',
        items: [
          '前期小谎更安全，尤其是宣称匹配颜色，而不是过于显眼的功能牌。',
          '当需要阻止下一位玩家时，可以冒险宣称 Skip、Reverse 或 +2。',
          '当对手接近 UNO、宣称会严重伤害你、或连续宣称太巧时，更值得质疑。',
          "Wild Liar's Challenge 会自动模拟：对手若有指定颜色就弃一张；没有则视为被抓到并摸 1 张。",
        ],
      },
    ],
    de: [
      {
        heading: 'Classic UNO mit Bluff',
        items: [
          "Liar's Uno folgt Classic UNO bei Matching, UNO-Rufen und Restkartenwertung, aber viele Karten sind Liar-Karten.",
          'Normale Karten werden offen gespielt. Liar-Karten werden verdeckt gespielt und du behauptest eine plausible Farbe, Zahl, ein Symbol oder Wild.',
          'Nach einer verdeckten Karte zeigt die App ein Challenge-Fenster. Ohne Challenge wird die Behauptung zur aktiven Karte und der Effekt wird ausgefuhrt.',
        ],
      },
      {
        heading: 'Challenge-Regeln',
        items: [
          'Wenn eine Luge erwischt wird, nimmt der bluffende Spieler die Karte zurück und zieht 1 Strafkarte.',
          'War die Behauptung wahr, zieht der Challenger 1 Karte und der angesagte Effekt passiert.',
          'Eine behauptete 0 gibt alle Hande in Spielrichtung weiter. Eine behauptete 7 tauscht bei Erfolg mit dem gewählten Gegner.',
        ],
      },
      {
        heading: 'Strategie',
        items: [
          'Kleine Lugen sind fruh sicherer, besonders wenn du eine passende Farbe statt einer auffalligen Aktion behauptest.',
          'Behaupte Aussetzen, Richtung oder +2, wenn es wichtig genug ist, den nächsten Spieler zu stoppen.',
          'Fordere eher heraus, wenn jemand nahe an UNO ist, die Behauptung dir stark schadet oder die letzten Ansagen zu bequem wirkten.',
          "Wild Liar's Challenge wird automatisch simuliert: Gegner legen eine Karte der gewählten Farbe ab, falls sie eine haben; sonst ziehen sie 1 Strafkarte.",
        ],
      },
    ],
  }
  return sections[language]
}

function partyRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Party Flow',
        items: [
          'UNO Party keeps the Classic UNO matching, drawing, UNO call, and leftover-card scoring rules.',
          'Draw 2 and Wild +4 can be stacked in this version. The app caps a pending draw stack at 10 cards.',
          'Speed Play cut-ins are enabled: if your visible hand has an exact same-color and same-number/symbol match to the top discard, you may play it out of turn and play resumes from you.',
        ],
      },
      {
        heading: 'Party Cards',
        items: [
          'Point Taken is simulated automatically: the table points at one opponent and that player draws 1 to 5 cards.',
          'Wild Drawn Together links two other players. Whenever one linked player draws cards, the other linked player draws the same amount until a new link is created.',
          'Wild Pile Up starts an automatic color pile. Players add matching-color cards until someone cannot; that player takes the pile.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Use draw stacking carefully: it is powerful, but Party caps the stack at 10, so sometimes forcing the next player to accept is better than saving a draw card.',
          'Drawn Together is strongest when it links the session leader with another opponent who is likely to draw soon.',
          'Pile Up is risky when the active color is rare in your opponents hands, but it can also remove useful color cards from the table.',
        ],
      },
    ],
    zh: [
      {
        heading: 'Party 流程',
        items: [
          'UNO Party 保留经典 UNO 的颜色、数字、符号匹配规则，也保留摸牌、喊 UNO 和剩余手牌计分。',
          '+2 和万能 +4 可以叠加。本应用把当前摸牌惩罚上限设为 10 张。',
          'Speed Play 抢出已启用：如果你可见的手牌与弃牌堆顶牌颜色和数字/符号完全相同，可以在回合外打出，之后从你开始继续。',
        ],
      },
      {
        heading: 'Party 功能牌',
        items: [
          'Point Taken 自动模拟：全桌指向一名对手，该玩家摸 1 到 5 张牌。',
          'Wild Drawn Together 会连接另外两名玩家。之后其中一人摸牌时，另一人也摸同样数量，直到新的连接出现。',
          'Wild Pile Up 会自动开始颜色堆叠。玩家依次交出同颜色牌；无法交出的人拿走整个牌堆。',
        ],
      },
      {
        heading: '策略',
        items: [
          '叠加摸牌很强，但上限为 10 张；有时让下家立刻承受惩罚，比继续保留摸牌牌更好。',
          'Drawn Together 最适合连接当前领先者和另一个很可能摸牌的对手。',
          'Pile Up 在当前颜色对手很少时风险更大，但也能消耗桌面上的关键颜色牌。',
        ],
      },
    ],
    de: [
      {
        heading: 'Party-Ablauf',
        items: [
          'UNO Party behält Classic UNO bei: Farbe, Zahl oder Symbol passen, ziehen, UNO rufen und Restkarten werten.',
          '+2 und Wild +4 können gestapelt werden. Die App begrenzt den aktuellen Ziehstapel auf 10 Karten.',
          'Speed-Play-Hineinspringen ist aktiv: Wenn deine sichtbare Hand exakt dieselbe Farbe und Zahl/dasselbe Symbol wie die oberste Ablagekarte hat, darfst du außer der Reihe spielen; danach geht es von dir weiter.',
        ],
      },
      {
        heading: 'Party-Karten',
        items: [
          'Point Taken wird automatisch simuliert: Der Tisch zeigt auf einen Gegner, der 1 bis 5 Karten zieht.',
          'Wild Drawn Together verbindet zwei andere Spieler. Wenn einer davon Karten zieht, zieht der andere dieselbe Menge, bis eine neue Verbindung erstellt wird.',
          'Wild Pile Up startet automatisch einen Farbstapel. Spieler legen passende Farbkarten ab, bis jemand nicht kann; diese Person nimmt den Stapel.',
        ],
      },
      {
        heading: 'Strategie',
        items: [
          'Ziehstapel sind stark, aber bei 10 Karten gedeckelt; manchmal ist es besser, den nächsten Spieler sofort ziehen zu lassen.',
          'Drawn Together ist am stärksten, wenn du den Sitzungsführenden mit einem Gegner verbindest, der wahrscheinlich bald ziehen muss.',
          'Pile Up ist riskant, wenn die aktive Farbe bei Gegnern selten ist, kann aber auch nützliche Farbkarten vom Tisch entfernen.',
        ],
      },
    ],
  }
  return sections[language]
}

function teamsRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Team Setup',
        items: [
          'UNO Teams is implemented as a 4-player 2v2 game. Player 1 partners with Player 3, and Player 2 partners with Player 4.',
          'Partners sit opposite each other, so turn order alternates between teams.',
          'You may not see or reveal your partner hand; cooperation comes from reading the table.',
        ],
      },
      {
        heading: 'Partner Pass',
        items: [
          'On your turn, instead of playing a card, you may pass 1 card to your partner.',
          'After passing, you draw 1 card to maintain hand size and your turn ends.',
          'Use this to feed your partner useful colors, numbers, or action cards without showing your whole hand.',
        ],
      },
      {
        heading: 'Scoring',
        items: [
          "When either teammate goes out, that player's team wins the round.",
          "The winning team scores all cards left in the opposing team's hands. The partner's remaining cards are ignored.",
          'Both partners share the same team score; the first team to reach the session target wins.',
        ],
      },
    ],
    zh: [
      {
        heading: '队伍设置',
        items: [
          'UNO Teams 当前实现为 4 人 2v2：玩家 1 与玩家 3 组队，玩家 2 与玩家 4 组队。',
          '队友坐在对面，因此出牌顺序会在两个队伍之间交替。',
          '不能查看或公开队友手牌；配合来自观察牌桌局势。',
        ],
      },
      {
        heading: '传牌给队友',
        items: [
          '你的回合中，可以不出牌，而是选择 1 张牌传给队友。',
          '传牌后，你摸 1 张牌来保持手牌数量，然后回合结束。',
          '这适合把有用的颜色、数字或功能牌交给队友，而不暴露整手牌。',
        ],
      },
      {
        heading: '计分',
        items: [
          '任意一名队友出完牌时，该队赢得本局。',
          '获胜队伍获得对方队伍两名玩家剩余手牌的总分；自己队友剩余手牌不计入。',
          '两名队友共享同一个队伍分数；先达到会话目标分的队伍获胜。',
        ],
      },
    ],
    de: [
      {
        heading: 'Team-Setup',
        items: [
          'UNO Teams ist hier als 4-Spieler-2v2 umgesetzt. Spieler 1 spielt mit Spieler 3, Spieler 2 mit Spieler 4.',
          'Partner sitzen gegenuber, dadurch wechseln sich die Teams in der Zugfolge ab.',
          'Du darfst die Hand deines Partners nicht sehen oder offenlegen; Zusammenarbeit entsteht durch Lesen des Tisches.',
        ],
      },
      {
        heading: 'Partner-Pass',
        items: [
          'In deinem Zug darfst du statt einer Ablagekarte 1 Karte an deinen Partner geben.',
          'Danach ziehst du 1 Karte, damit deine Handgrosse erhalten bleibt, und dein Zug endet.',
          'Nutze das, um deinem Partner nützliche Farben, Zahlen oder Aktionen zu geben, ohne deine ganze Hand zu zeigen.',
        ],
      },
      {
        heading: 'Wertung',
        items: [
          'Wenn ein Teammitglied fertig ist, gewinnt dieses Team die Runde.',
          'Das Siegerteam bekommt alle Kartenpunkte aus den gegnerischen Handen. Die Restkarten des Partners zählen nicht.',
          'Beide Partner teilen denselben Teamstand; das erste Team am Sitzungsziel gewinnt.',
        ],
      },
    ],
  }
  return sections[language]
}

function houseRulesRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'House Rules Flow',
        items: [
          'UNO House Rules keeps the Classic UNO deck, matching, drawing, UNO call, and leftover-card scoring rules.',
          'Draw 2 and Wild +4 stack together. The draw total keeps growing until a player accepts the penalty.',
          'Jump-In is enabled: an exact same-color and same-number/symbol match can be played out of turn, and play resumes from that player.',
        ],
      },
      {
        heading: '7-0 Rule',
        items: [
          'Playing any 0 passes every hand once in the current play direction.',
          'Playing any 7 lets you choose one opponent and swap hands with them.',
          'These hand moves happen immediately after the card is played.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Keep a draw card if the next player is likely to stack; forcing them to accept can be stronger than extending the chain.',
          'A 7 is best when a leader has a tiny hand, but it can also rescue you from a heavy hand before scoring.',
          'A 0 is volatile near the end of a round because it can hand your nearly empty grip to the next player.',
        ],
      },
    ],
    zh: [
      {
        heading: 'House Rules 流程',
        items: [
          'UNO House Rules 保留经典 UNO 的牌组、颜色/数字/符号匹配、摸牌、喊 UNO 和剩余手牌计分。',
          '+2 和万能 +4 可以互相叠加。直到某名玩家接受惩罚前，摸牌总数会持续累加。',
          'Jump-In 抢出已启用：如果手牌与弃牌堆顶牌颜色和数字/符号完全相同，可以在回合外打出，之后从该玩家继续。',
        ],
      },
      {
        heading: '7-0 规则',
        items: [
          '打出任意 0 时，所有玩家按当前出牌方向传递整手牌一次。',
          '打出任意 7 时，你可以选择一名对手并与其交换手牌。',
          '这些换手牌效果会在牌打出后立即发生。',
        ],
      },
      {
        heading: '策略',
        items: [
          '如果下家很可能继续叠加，保留摸牌牌要谨慎；有时让对方立刻承受惩罚更强。',
          '7 最适合抢走领先者的小手牌，也可以在结算前帮你摆脱高分手牌。',
          '0 在回合末段非常不稳定，因为它可能把你快出完的手牌交给下一名玩家。',
        ],
      },
    ],
    de: [
      {
        heading: 'House-Rules-Ablauf',
        items: [
          'UNO House Rules nutzt das Classic-Deck mit normalen Regeln für Matchen, Ziehen, UNO-Ruf und Restkartenwertung.',
          '+2 und Wild +4 können gemeinsam gestapelt werden. Die Ziehzahl wachst, bis ein Spieler die Strafe annimmt.',
          'Jump-In ist aktiv: Eine exakte Karte mit gleicher Farbe und Zahl/gleichem Symbol darf außer der Reihe gespielt werden; danach geht es von diesem Spieler weiter.',
        ],
      },
      {
        heading: '7-0-Regel',
        items: [
          'Bei jeder 0 geben alle Spieler ihre ganze Hand einmal in aktueller Spielrichtung weiter.',
          'Bei jeder 7 wählst du einen Gegner und tauschst die Hand mit ihm.',
          'Diese Handbewegungen passieren direkt nach dem Ausspielen.',
        ],
      },
      {
        heading: 'Strategie',
        items: [
          'Bewahre Ziehkarten vorsichtig auf, wenn der nächste Spieler wahrscheinlich stapelt; manchmal ist sofortiger Druck starker.',
          'Eine 7 ist am besten gegen einen Fuhrenden mit kleiner Hand, kann dich aber auch vor hoher Restwertung retten.',
          'Eine 0 ist am Rundenende riskant, weil sie deine fast leere Hand an den nächsten Spieler geben kann.',
        ],
      },
    ],
  }
  return sections[language]
}

function allWildRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'All Wild Flow',
        items: [
          'Every card in UNO All Wild is playable on every turn; there are no colors or numbers to match.',
          'If you have a card, play one. Drawing is mainly used when a penalty tells you to draw.',
          'The opening discard can be any All Wild card; its action is ignored at setup.',
        ],
      },
      {
        heading: 'Action Cards',
        items: [
          'Wild Reverse, Wild Skip, Wild +2, and Wild +4 follow the familiar turn-order penalties, but +4 cannot be challenged.',
          'Wild Skip Two skips the next two players in the current direction.',
          'Wild Target +2 lets you choose any player to draw 2 while normal turn order continues.',
          'Wild Forced Swap trades your hand with a chosen opponent.',
        ],
      },
      {
        heading: 'Scoring',
        items: [
          'Plain Wild cards score 20.',
          'Wild Reverse, Wild Skip, and Wild +2 score 30.',
          'Wild Skip Two, Target +2, and Forced Swap score 40. Wild +4 scores 50.',
        ],
      },
    ],
    zh: [
      {
        heading: 'All Wild 流程',
        items: [
          'UNO All Wild 中每一张牌都可以在你的回合打出；不需要匹配颜色或数字。',
          '只要你有手牌，就打出一张。摸牌主要来自惩罚效果。',
          '开局翻出的弃牌可以是任意 All Wild 牌；开局时忽略它的功能效果。',
        ],
      },
      {
        heading: '功能牌',
        items: [
          'Wild Reverse、Wild Skip、Wild +2 和 Wild +4 使用熟悉的回合惩罚，但 +4 不能被质疑。',
          'Wild Skip Two 会跳过当前方向上的接下来两名玩家。',
          'Wild Target +2 可指定任意玩家摸 2 张，之后正常顺序继续。',
          'Wild Forced Swap 会与你选择的一名对手交换整手牌。',
        ],
      },
      {
        heading: '计分',
        items: [
          '普通 Wild 牌计 20 分。',
          'Wild Reverse、Wild Skip 和 Wild +2 计 30 分。',
          'Wild Skip Two、Target +2 和 Forced Swap 计 40 分。Wild +4 计 50 分。',
        ],
      },
    ],
    de: [
      {
        heading: 'All-Wild-Ablauf',
        items: [
          'In UNO All Wild ist jede Karte in jedem Zug spielbar; es gibt keine Farben oder Zahlen zum Matchen.',
          'Wenn du Karten hast, spielst du eine. Ziehen passiert vor allem durch Strafkarten.',
          'Die Startablage darf jede All-Wild-Karte sein; ihr Effekt wird beim Aufbau ignoriert.',
        ],
      },
      {
        heading: 'Aktionskarten',
        items: [
          'Wild Reverse, Wild Skip, Wild +2 und Wild +4 nutzen die bekannten Zugstrafen, aber +4 kann nicht angezweifelt werden.',
          'Wild Skip Two setzt die nächsten zwei Spieler in Spielrichtung aus.',
          'Wild Target +2 lässt dich einen beliebigen Spieler wählen, der 2 zieht; danach läuft die normale Reihenfolge weiter.',
          'Wild Forced Swap tauscht deine Hand mit einem gewählten Gegner.',
        ],
      },
      {
        heading: 'Wertung',
        items: [
          'Normale Wild-Karten zählen 20.',
          'Wild Reverse, Wild Skip und Wild +2 zählen 30.',
          'Wild Skip Two, Target +2 und Forced Swap zählen 40. Wild +4 zählt 50.',
        ],
      },
    ],
  }
  return sections[language]
}

function noMercyRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'No Mercy Flow',
        items: [
          'If you cannot play, keep drawing until you draw a playable card.',
          'Any player who reaches 25 or more cards is eliminated immediately; the round continues until only one player remains or someone goes out.',
          '0 passes every hand in the current direction. 7 swaps your hand with a chosen player.',
        ],
      },
      {
        heading: 'Brutal Action Cards',
        items: [
          'Draw cards can be stacked only with an equal or higher draw value; the final player draws the full stack and loses the turn.',
          'Discard All dumps every card in your hand of that color. Skip Everyone gives you another turn.',
          'Wild +6, Wild +10, Wild Reverse +4, and Wild Color Roulette use the No Mercy draw penalties.',
        ],
      },
    ],
    zh: [
      {
        heading: 'No Mercy 流程',
        items: [
          '如果不能出牌，必须一直摸到可出的牌为止。',
          '任何玩家手牌达到 25 张或更多时立即淘汰；回合继续，直到只剩一名玩家或有人出完牌。',
          '打出 0 时，所有人按当前方向传递整手牌。打出 7 时，与指定玩家交换整手牌。',
        ],
      },
      {
        heading: '强力功能牌',
        items: [
          '摸牌惩罚只能用相同或更高数值的摸牌牌叠加；最后无法应对的玩家摸完整个叠加数量并跳过回合。',
          '全弃会弃掉手中所有同颜色牌。跳过所有人会让你立刻再行动。',
          '万能 +6、万能 +10、万能反转 +4 和颜色轮盘都会触发 No Mercy 摸牌惩罚。',
        ],
      },
    ],
    de: [
      {
        heading: 'No-Mercy-Ablauf',
        items: [
          'Wenn du nicht spielen kannst, ziehst du so lange, bis du eine spielbare Karte ziehst.',
          'Wer 25 oder mehr Karten erreicht, scheidet sofort aus; die Runde lauft weiter, bis nur noch eine Person bleibt oder jemand alle Karten ablegt.',
          'Eine 0 gibt alle Hande in Spielrichtung weiter. Eine 7 tauscht deine Hand mit einer gewählten Person.',
        ],
      },
      {
        heading: 'Harte Aktionskarten',
        items: [
          'Ziehstrafen durfen nur mit gleichem oder höherem Wert gestapelt werden; die letzte Person zieht den ganzen Stapel und setzt aus.',
          'Alle ablegen wirft alle Karten deiner Hand mit dieser Farbe ab. Alle aussetzen gibt dir sofort den nächsten Zug.',
          'Wild +6, Wild +10, Wild Richt. +4 und Farb-Roulette nutzen die No-Mercy-Ziehstrafen.',
        ],
      },
    ],
  }
  return sections[language]
}

function triplePlayRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Triple Play Unit',
        items: [
          'UNO Triple Play uses three discard piles instead of one. The app simulates the electronic unit by lighting one to three piles after every turn.',
          'You may only play onto a lit pile, and the card must match that pile by color, number, symbol, or be a wild card. If more than one pile works, choose the safest pile.',
          'When a +2 or Wild +4 penalty is pending, resolve that penalty first. Normal pile moves, Wild Clear, and Wild Give Away cannot be used as penalty answers.',
          'Each pile has an overload meter. Playing to a pile raises its meter; when it reaches the pile limit, the unit fires and the player who played there draws that many cards.',
        ],
      },
      {
        heading: 'Special Cards',
        items: [
          'Discard Two lets you play the card and then drop up to two more cards of the same color from your hand. This is strongest when you can shrink your hand without overloading a pile.',
          'Wild Clear chooses a color and resets the overload meter of the selected pile to zero. Use it to defuse a dangerous pile before someone has to draw from it.',
          'Wild Give Away chooses a color and a target player; after playing it, you give up to two cards from your hand to that player.',
        ],
      },
      {
        heading: 'Strategy And Winning',
        items: [
          'Try to play onto low-meter piles even if another pile gives a slightly better color. Avoid leaving yourself forced to play on a pile that is one step from overload.',
          'If an opponent is close to UNO, a high-meter pile can become pressure: force them to choose between a bad draw and a risky play.',
          'The round ends when a player empties their hand after all card and unit effects resolve. Scores use normal UNO leftover-card scoring.',
        ],
      },
    ],
    zh: [
      {
        heading: 'Triple Play 装置',
        items: [
          'UNO Triple Play 使用三个弃牌堆，而不是一个弃牌堆。本应用用模拟电子装置的方式，在每个回合后点亮一到三个弃牌堆。',
          '你只能把牌打到点亮的牌堆上，并且必须按该牌堆的颜色、数字、符号匹配，或者打出万能牌。若多个牌堆都可用，应选择最安全的牌堆。',
          '如果当前有 +2 或 Wild +4 罚摸等待结算，必须先处理罚摸或挑战。普通牌堆出牌、Wild Clear 和 Wild Give Away 都不能用来回应罚摸。',
          '每个牌堆都有过载计量。往牌堆打牌会增加计量；当计量达到该堆上限时，装置触发，刚打到该堆的玩家摸对应数量的牌。',
        ],
      },
      {
        heading: '特殊牌',
        items: [
          'Discard Two 让你先打出这张牌，然后从手牌中额外丢出最多两张同色牌。它适合在不触发过载的情况下快速减少手牌。',
          'Wild Clear 可以选择颜色，并把所选牌堆的过载计量清零。适合在危险牌堆即将爆发前拆除风险。',
          'Wild Give Away 可以选择颜色和一名目标玩家；打出后，你把手中最多两张牌交给该玩家。',
        ],
      },
      {
        heading: '策略与胜利条件',
        items: [
          '优先考虑计量低的牌堆，即使另一个牌堆的颜色更适合你，也要避免把自己逼到必须打在即将过载的牌堆上。',
          '当对手接近 UNO 时，高计量牌堆可以变成压力工具：让对手在摸牌和冒险出牌之间做艰难选择。',
          '当一名玩家在所有牌面效果和装置效果结算后清空手牌，本局结束。计分按普通 UNO 的剩余手牌分值计算。',
        ],
      },
    ],
    de: [
      {
        heading: 'Triple-Play-Einheit',
        items: [
          'UNO Triple Play nutzt drei Ablagestapel statt eines einzelnen Stapels. Die App simuliert die elektronische Einheit, indem nach jedem Zug ein bis drei Stapel leuchten.',
          'Du darfst nur auf einen leuchtenden Stapel spielen. Die Karte muss zu dessen Farbe, Zahl oder Symbol passen, oder sie muss eine Wild-Karte sein. Wenn mehrere Stapel passen, wähle den sichersten.',
          'Wenn eine +2- oder Wild-+4-Strafe offen ist, wird zuerst diese Strafe oder die Herausforderung geklärt. Normale Stapelzüge, Wild Clear und Wild Give Away können die Strafe nicht beantworten.',
          'Jeder Stapel hat eine Überlastungsanzeige. Eine gespielte Karte erhöht sie; erreicht sie das Limit, feuert die Einheit und die spielende Person zieht so viele Karten.',
        ],
      },
      {
        heading: 'Sonderkarten',
        items: [
          'Discard Two spielt die Karte und legt danach bis zu zwei weitere Karten derselben Farbe aus deiner Hand ab. Stark ist das, wenn du deine Hand verkleinerst, ohne einen Stapel zu überlasten.',
          'Wild Clear wählt eine Farbe und setzt die Überlastungsanzeige des gewählten Stapels auf null. Nutze sie, um einen gefährlichen Stapel zu entschärfen.',
          'Wild Give Away wählt eine Farbe und eine Zielperson; danach gibst du bis zu zwei Karten aus deiner Hand an diese Person weiter.',
        ],
      },
      {
        heading: 'Strategie Und Sieg',
        items: [
          'Spiele möglichst auf Stapel mit niedriger Anzeige, auch wenn ein anderer Stapel farblich etwas besser aussieht. Vermeide Situationen, in denen du nur noch auf einen fast vollen Stapel spielen kannst.',
          'Wenn ein Gegner kurz vor UNO steht, kann ein voller Stapel Druck machen: Er muss dann zwischen Ziehen und einem riskanten Spielzug wählen.',
          'Die Runde endet, wenn jemand nach allen Karten- und Einheitseffekten keine Handkarten mehr hat. Gewertet wird wie bei normalem UNO über die Restkarten der Gegner.',
        ],
      },
    ],
  }
  return sections[language]
}

function wildJackpotRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Wild Jackpot Roller',
        items: [
          'UNO Wild Jackpot plays like Classic UNO, but the Wild Jackpot card starts a simulated Wild Roller after you choose the active color.',
          'The first version uses eight built-in rule cards: next player draws 1, draws 2, draws 4, everyone else draws 1, skip, reverse, discard all chosen-color cards, or play again.',
          'Example: if you play Wild Jackpot and choose green, the roller might land on Draw 4. The next player draws 4, loses the turn, and green stays active.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Wild Jackpot is strongest when the next player is close to UNO, because several outcomes either skip, reverse, or force cards into other hands.',
          'Choose a color that helps your remaining hand before the roller resolves. The random effect is useful, but the chosen color still controls the next normal play.',
          'If the roller lands on discard all chosen-color cards, you can shrink your hand quickly; choose a color you actually hold when that risk/reward matters.',
        ],
      },
      {
        heading: 'Winning',
        items: [
          'A player wins the round by emptying their hand after the Wild Jackpot effect fully resolves.',
          'Scores use Classic UNO values: number cards by face value, action cards 20, and wild cards 50.',
          'Custom Wild Jackpot rule cards can be added later because the roller is already separated from the deck logic.',
        ],
      },
    ],
    zh: [
      {
        heading: 'Wild Jackpot 转轮',
        items: [
          'UNO Wild Jackpot 的基础玩法与经典 UNO 相同，但打出 Wild Jackpot 后，先选择当前颜色，然后启动模拟转轮。',
          '第一版内置 8 个规则结果：下一位摸 1、摸 2、摸 4、其他所有人摸 1、跳过、反转、弃掉所有所选颜色手牌、或立刻再行动一次。',
          '例子：你打出 Wild Jackpot 并选择绿色，转轮落在摸 4。下一位玩家摸 4 张并跳过回合，绿色仍然是当前颜色。',
        ],
      },
      {
        heading: '策略',
        items: [
          '当下一位玩家接近 UNO 时，Wild Jackpot 很强，因为很多结果会跳过、反转，或让其他玩家增加手牌。',
          '在转轮结算前，先选择一个对你剩余手牌有利的颜色。随机效果很重要，但颜色仍然决定之后的正常出牌。',
          '如果转轮落在弃掉所选颜色，你可能一次减少很多手牌；因此在风险可接受时，选择自己手里较多的颜色更有价值。',
        ],
      },
      {
        heading: '胜利条件',
        items: [
          '玩家在 Wild Jackpot 效果全部结算后清空手牌，即赢得本局。',
          '计分使用经典 UNO：数字按牌面分，功能牌 20 分，万能牌 50 分。',
          '之后可以继续加入自定义 Wild Jackpot 规则卡，因为当前实现已经把转轮规则和牌堆逻辑分开。',
        ],
      },
    ],
    de: [
      {
        heading: 'Wild-Jackpot-Roller',
        items: [
          'UNO Wild Jackpot spielt sich wie Classic UNO, aber die Wild-Jackpot-Karte startet nach der Farbwahl einen simulierten Wild Roller.',
          'Diese erste Version nutzt acht eingebaute Regelkarten: nächster Spieler zieht 1, zieht 2, zieht 4, alle anderen ziehen 1, Aussetzen, Richtungswechsel, alle Karten der gewählten Farbe ablegen oder sofort erneut spielen.',
          'Beispiel: Du spielst Wild Jackpot und wählst Grün. Der Roller landet auf Zieh 4. Der nächste Spieler zieht 4, setzt aus, und Grün bleibt aktiv.',
        ],
      },
      {
        heading: 'Strategie',
        items: [
          'Wild Jackpot ist besonders stark, wenn der nächste Spieler kurz vor UNO steht, weil mehrere Ergebnisse Überspringen, umdrehen oder Karten in andere Haende bringen.',
          'Wähle zuerst eine Farbe, die zu deiner restlichen Hand passt. Der Zufallseffekt hilft, aber die Farbe steuert den nächsten normalen Zug.',
          'Wenn der Roller auf alle Karten der gewählten Farbe ablegen landet, kannst du deine Hand stark verkleinern. Dann lohnt sich eine Farbe, von der du mehrere Karten hältst.',
        ],
      },
      {
        heading: 'Sieg',
        items: [
          'Die Runde endet, wenn jemand nach dem vollständigen Wild-Jackpot-Effekt keine Handkarten mehr hat.',
          'Die Wertung nutzt Classic UNO: Zahlen nach Wert, Aktionskarten 20, Wild-Karten 50.',
          'Eigene Wild-Jackpot-Regelkarten können spaeter ergaenzt werden, weil Roller-Regeln und Deck-Logik getrennt sind.',
        ],
      },
    ],
  }
  return sections[language]
}

function blastRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Blast Unit',
        items: [
          'UNO Blast plays like Classic UNO, but every successful play loads one pressure card into the simulated Blast unit.',
          'After each play, the unit may stay quiet or fire. If it fires, the player who just played draws one card for each loaded pressure card, and the chamber resets to zero.',
          'Blast cards are Wild cards: choose the active color, then the Blast unit fires immediately. The Blast card itself adds one pressure before the fire.',
          'Example: the chamber has 3 pressure and you play a red 7. If the unit fires, you draw 4 cards. If it stays quiet, the chamber becomes 4.',
        ],
      },
      {
        heading: 'Strategy And Winning',
        items: [
          'Watch the chamber count. A high chamber is dangerous, so a safe low-value play can become risky if the unit is likely to fire.',
          'Play aggressively while pressure is low. At 0 to 2 pressure, it is usually worth shrinking your hand quickly before the unit becomes dangerous.',
          'At 4 or more pressure, think twice before using your best setup card. A fire can give all that progress back to you.',
          'Keep color control with Wild cards and same-color runs. If you can play several cards in one color over several turns, you can still finish quickly despite Blast risk.',
          'Use Skip, Reverse, +2, and +4 to stop opponents who are close to UNO while you wait for a safer pressure moment.',
          'Playing a Blast card near the end can be powerful because it chooses color, but it can also stop your own win if it fires cards back into your hand.',
          'You win only after your played card and any Blast effect have fully resolved. If your final card triggers a fire, you must continue with the new cards.',
        ],
      },
    ],
    zh: [
      {
        heading: '爆破装置',
        items: [
          'UNO Blast 的基础玩法与经典 UNO 相同，但每次成功出牌都会给模拟爆破装置加载 1 点压力。',
          '每次出牌后，装置可能保持安静，也可能发射。若发射，刚出牌的玩家按已加载的压力数量摸牌，然后压力清零。',
          'Blast 牌是万能牌：先选择当前颜色，然后爆破装置立刻发射。Blast 牌本身也会先增加 1 点压力。',
          '例子：装置已有 3 点压力，你打出红色 7。若装置发射，你摸 4 张；若未发射，压力变为 4。',
        ],
      },
      {
        heading: '策略与胜利',
        items: [
          '注意装置压力。压力越高越危险，即使是一张低分普通牌，也可能因为发射而变成高风险选择。',
          '压力低时要积极出牌。压力为 0 到 2 时，通常应该尽快减少手牌，趁装置还不太危险。',
          '压力达到 4 或更高时，打关键牌前要谨慎。一次发射可能让你刚刚减少的手牌又回到手中。',
          '尽量控制颜色，并利用同色连续出牌。如果能让当前颜色适合自己的手牌，即使有爆破风险，也更容易快速结束本局。',
          '当对手接近 UNO 时，使用跳过、反转、+2 和 +4 来拖慢对手，同时等待更安全的压力时机。',
          '快赢时打 Blast 牌可以改变颜色，但也可能让你摸回很多牌，从而无法立刻获胜。',
          '必须等出牌效果和爆破效果全部结算后才算获胜。如果最后一张牌触发发射，你需要继续使用新摸到的牌。',
        ],
      },
    ],
    de: [
      {
        heading: 'Blast-Einheit',
        items: [
          'UNO Blast spielt sich wie Classic UNO, aber jede erfolgreiche Karte laedt einen Druckpunkt in die simulierte Blast-Einheit.',
          'Nach jeder ausgespielten Karte bleibt die Einheit entweder ruhig oder löst aus. Beim Auslösen zieht der gerade spielende Spieler Karten in Höhe des geladenen Drucks, danach wird der Druck auf null gesetzt.',
          'Blast-Karten sind Wild-Karten: Farbe wählen, dann löst die Blast-Einheit sofort aus. Die Blast-Karte zählt vorher selbst als ein Druckpunkt.',
          'Beispiel: Die Einheit hat 3 Druckpunkte und du spielst eine rote 7. Wenn sie auslöst, ziehst du 4 Karten. Bleibt sie ruhig, steigt der Druck auf 4.',
        ],
      },
      {
        heading: 'Strategie Und Sieg',
        items: [
          'Beobachte den Druckzähler. Hoher Druck ist gefährlich, deshalb kann auch eine kleine Zahlenkarte riskant sein.',
          'Spiele aggressiv, solange der Druck niedrig ist. Bei 0 bis 2 Druckpunkten lohnt es sich meistens, die Hand schnell zu verkleinern.',
          'Ab 4 Druckpunkten solltest du vor starken Aufbaukarten vorsichtig sein. Ein Auslösen kann deinen Fortschritt sofort wieder auffüllen.',
          'Halte die Farbkontrolle mit Wild-Karten und Farbserien. Wenn die aktive Farbe zu deiner Hand passt, kannst du trotz Blast-Risiko schneller fertig werden.',
          'Nutze Aussetzen, Richtungswechsel, +2 und +4 gegen Gegner kurz vor UNO, während du auf einen sichereren Druckmoment wartest.',
          'Eine Blast-Karte kurz vor dem Sieg kann stark sein, weil du die Farbe wählst, kann dir aber auch Karten zurück in die Hand feuern.',
          'Du gewinnst erst, wenn Karte und Blast-Effekt vollständig abgehandelt sind. Feuert deine letzte Karte Karten zurück, geht die Runde weiter.',
        ],
      },
    ],
  }
  return sections[language]
}

function robotoRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Robot Device',
        items: [
          'UNO Roboto plays like Classic UNO, but a simulated robot can interrupt the game with a command after a card is played.',
          'Normal cards may trigger the robot randomly. Wild Roboto always chooses a color and then forces the robot to speak.',
          'The first simulator commands are: next player draws 2 and loses the turn, the player who triggered Roboto draws 2, everyone else draws 1, discard all active-color cards, reverse direction, or play again.',
          'Example: you play Wild Roboto and choose blue. If Roboto says Next Draw 2, the next player draws 2, loses the turn, and blue stays active.',
        ],
      },
      {
        heading: 'Strategy And Winning',
        items: [
          'Wild Roboto is strongest when you can survive a bad command. It may help you, but it may also make you draw cards.',
          'If you are close to winning, remember that Roboto resolves before the round ends. A command that gives you cards can stop your win.',
          'Use Roboto to disturb a player close to UNO, especially when Skip, Reverse, +2, or +4 are not available.',
          'Keep a flexible color hand. Because Roboto commands are unpredictable, having two playable colors after the command is safer than relying on one perfect card.',
        ],
      },
    ],
    zh: [
      {
        heading: '机器人装置',
        items: [
          'UNO Roboto 的基础玩法与经典 UNO 相同，但模拟机器人会在玩家出牌后随机插入指令。',
          '普通牌有机会触发机器人。Wild Roboto 必定先选择颜色，然后强制机器人发布指令。',
          '第一版模拟指令包括：下一位摸 2 并跳过、触发机器人者摸 2、其他所有人摸 1、弃掉所有当前颜色手牌、反转方向、或立刻再行动一次。',
          '例子：你打出 Wild Roboto 并选择蓝色。如果机器人说“下一位摸 2”，下一位玩家摸 2 张并跳过回合，蓝色仍然是当前颜色。',
        ],
      },
      {
        heading: '策略与胜利',
        items: [
          'Wild Roboto 最适合在你能承受坏指令时使用。它可能帮你，也可能让你自己摸牌。',
          '快赢时要注意：机器人指令会先结算，然后才判断是否获胜。如果指令让你摸牌，你就不能立刻赢。',
          '当对手接近 UNO，而你没有跳过、反转、+2 或 +4 时，可以用 Roboto 打乱对手节奏。',
          '尽量保留多种颜色的选择。机器人指令不可预测，指令后还能有两种颜色可出，比只依赖一张完美牌更安全。',
        ],
      },
    ],
    de: [
      {
        heading: 'Roboter-Geraet',
        items: [
          'UNO Roboto spielt sich wie Classic UNO, aber ein simulierter Roboter kann nach einer gespielten Karte mit einem Befehl dazwischenfunken.',
          'Normale Karten können den Roboter zufällig auslösen. Wild Roboto wählt immer eine Farbe und zwingt den Roboter danach zu einem Befehl.',
          'Die erste Simulator-Version nutzt diese Befehle: nächster Spieler zieht 2 und setzt aus, der Roboto-Spieler zieht 2, alle anderen ziehen 1, alle Karten der aktiven Farbe ablegen, Richtung wechseln oder erneut spielen.',
          'Beispiel: Du spielst Wild Roboto und wählst Blau. Sagt Roboto Nächster zieht 2, zieht der nächste Spieler 2, setzt aus, und Blau bleibt aktiv.',
        ],
      },
      {
        heading: 'Strategie Und Sieg',
        items: [
          'Wild Roboto ist am stärksten, wenn du einen schlechten Befehl verkraften kannst. Er kann helfen, aber er kann dich auch Karten ziehen lassen.',
          'Kurz vor dem Sieg gilt: Roboto wird vor dem Rundengewinn abgehandelt. Wenn der Befehl dir Karten gibt, gewinnst du noch nicht.',
          'Nutze Roboto gegen Spieler kurz vor UNO, besonders wenn du kein Aussetzen, Richtungswechsel, +2 oder +4 hast.',
          'Halte deine Farben flexibel. Weil Roboto unberechenbar ist, sind zwei spielbare Farben nach dem Befehl sicherer als eine perfekte Einzelkarte.',
        ],
      },
    ],
  }
  return sections[language]
}

function tippoRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Two Balance Trays',
        items: [
          'UNO Tippo plays like Classic UNO, but the center has two discard trays instead of one pile.',
          'A card is playable if it matches either tray by color, number, symbol, or if it is a Wild card. If both trays are legal, choose the safer tray.',
          'Each card you play adds 1 load to that tray. In this simulator a tray tips at 4 load.',
          'When a tray tips, the player who caused the tip takes all cards from that tray into their hand, and the tray is reseeded with a new opening card.',
          'Example: tray 1 shows red 5 and has load 3/4. If you play red 7 there, it reaches 4/4, tips, and you take the tray cards.',
        ],
      },
      {
        heading: 'Tippo Card',
        items: [
          'The Tippo card is a Wild card. Choose a color and a legal tray.',
          'After the color is chosen, the Tippo card forces that tray to tip immediately, even if the tray load was low.',
          'A last-card Tippo does not automatically win. The tip is resolved first; if the tray cards come back to your hand, the round continues.',
        ],
      },
      {
        heading: 'Strategy And Winning',
        items: [
          'Watch both tray meters. A tray at 0/4 or 1/4 is usually safe; a tray at 3/4 is dangerous unless you want to reset it intentionally.',
          'If an opponent is close to UNO, try to leave them only a high-load tray or a bad color choice.',
          'Wild cards are more flexible than usual because they can choose both color and tray. Use them to avoid a dangerous tray or to force a helpful color.',
          'You still win by emptying your hand after all card effects and Tippo tray effects are fully resolved.',
        ],
      },
    ],
    zh: [
      {
        heading: '两个平衡托盘',
        items: [
          'UNO Tippo 的基础玩法类似经典 UNO，但桌面中央有两个弃牌托盘，而不是一个弃牌堆。',
          '如果一张牌能按颜色、数字、符号匹配任意一个托盘，或者它是万能牌，就可以出。两个托盘都可出时，选择更安全的托盘。',
          '每打出一张牌，该托盘的负载增加 1。本模拟器中托盘达到 4 点负载就会倾倒。',
          '托盘倾倒时，造成倾倒的玩家把该托盘中的所有牌拿回手牌，然后托盘用一张新的起始牌重新开始。',
          '例子：托盘 1 是红 5，负载 3/4。你在这里打出红 7 后达到 4/4，托盘倾倒，你拿走该托盘中的牌。',
        ],
      },
      {
        heading: 'Tippo 牌',
        items: [
          'Tippo 牌是一张万能牌。打出时选择颜色，并选择一个合法托盘。',
          '选择颜色后，Tippo 牌会立刻强制所选托盘倾倒，即使该托盘负载很低。',
          '最后一张牌打出 Tippo 也不会立刻胜利。必须先结算托盘倾倒；如果托盘牌回到你手中，本局继续。',
        ],
      },
      {
        heading: '策略与胜利',
        items: [
          '随时观察两个托盘计量。0/4 或 1/4 通常安全；3/4 很危险，除非你故意想重置托盘。',
          '当对手接近 UNO 时，可以尽量让他面对高负载托盘或不舒服的颜色选择。',
          '万能牌比平时更灵活，因为它既能选颜色，也能选托盘。用它避开危险托盘，或者制造对自己有利的颜色。',
          '胜利条件仍然是清空手牌，但必须在所有牌面效果和 Tippo 托盘效果结算完成之后。',
        ],
      },
    ],
    de: [
      {
        heading: 'Zwei Balance-Ablagen',
        items: [
          'UNO Tippo spielt sich wie Classic UNO, aber in der Mitte liegen zwei Ablagen statt eines einzelnen Ablagestapels.',
          'Eine Karte ist spielbar, wenn sie eine Ablage nach Farbe, Zahl oder Symbol trifft, oder wenn sie eine Wild-Karte ist. Sind beide Ablagen legal, wähle die sicherere.',
          'Jede gespielte Karte erhöht die Last dieser Ablage um 1. Im Simulator kippt eine Ablage bei Last 4.',
          'Kippt eine Ablage, nimmt der Spieler, der das Kippen ausgelöst hat, alle Karten dieser Ablage auf die Hand. Danach wird die Ablage mit einer neuen Startkarte gefüllt.',
          'Beispiel: Ablage 1 zeigt Rot 5 und hat Last 3/4. Spielst du dort Rot 7, erreicht sie 4/4, kippt, und du nimmst die Ablagekarten.',
        ],
      },
      {
        heading: 'Tippo-Karte',
        items: [
          'Die Tippo-Karte ist eine Wild-Karte. Wähle eine Farbe und eine legale Ablage.',
          'Nach der Farbwahl zwingt die Tippo-Karte diese Ablage sofort zum Kippen, auch wenn die Last niedrig war.',
          'Eine letzte Tippo-Karte gewinnt nicht automatisch. Erst wird das Kippen abgehandelt; kommen Karten auf deine Hand zurück, geht die Runde weiter.',
        ],
      },
      {
        heading: 'Strategie Und Sieg',
        items: [
          'Beobachte beide Lastanzeigen. 0/4 oder 1/4 ist meist sicher; 3/4 ist gefährlich, außer du willst die Ablage absichtlich zurücksetzen.',
          'Wenn ein Gegner kurz vor UNO steht, lass ihm möglichst nur eine Ablage mit hoher Last oder eine schlechte Farbe.',
          'Wild-Karten sind flexibler als sonst, weil sie Farbe und Ablage steuern. Nutze sie, um eine gefährliche Ablage zu vermeiden oder eine gute Farbe zu erzwingen.',
          'Du gewinnst weiterhin durch eine leere Hand, aber erst nachdem alle Karteneffekte und Tippo-Ablageeffekte vollständig abgehandelt sind.',
        ],
      },
    ],
  }
  return sections[language]
}

function diceRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Setup And Goal',
        items: [
          'UNO Dice is a two-player game. Each player rolls five visible dice, and one extra die starts the center dice line.',
          'The opening center die is rolled until it shows a number. On your turn, play one of your dice onto the line if it matches the top die by color, number, or action symbol. Wild always matches.',
          'All dice stay visible, so memory is less important than timing. The round ends when one player has no dice after all effects are resolved.',
          'Score the opponent dice: numbers count 1-5, Draw One and Draw Two count 20, and Wild counts 50. First to 200 points wins the session.',
        ],
      },
      {
        heading: 'Taking And Rerolling',
        items: [
          'If you cannot or do not want to play, take one die from the older end of the center line, then reroll all dice in your hand.',
          'The line must always keep at least one die. If only one die is in the line, you reroll your own dice once instead of taking it.',
          'After rerolling, if you now have a matching die, you may play it immediately. If not, your turn ends.',
          'Example: the top die is red 3. You have no red die, no 3, and no Wild. Take one line die, reroll your hand, then play if the reroll gives red, 3, or Wild.',
        ],
      },
      {
        heading: 'Action Dice',
        items: [
          'Draw One matches by color or another Draw One. The opponent takes one die from the center line, rerolls all dice, and loses the turn.',
          'Draw Two matches by color or another Draw Two. The opponent takes up to two dice from the center line, but the line still keeps one die.',
          'Wild lets you choose the active color. It does not force the opponent to take dice.',
          'Action effects are resolved before a win is scored. If your last die is Draw Two, the opponent takes dice first, then your empty hand wins.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Because all dice are visible, check the opponent before choosing a Wild color. Pick a color they do not currently show when possible.',
          'Taking from the line can be useful even when you have a legal play, because rerolling all dice can turn a weak hand into several options.',
          'Draw dice are strongest when the line is long. If the line has only one spare die, Draw Two is still good for skipping, but it gives fewer dice.',
          'Call UNO before playing from two dice down to one. If you forget and are caught, you take a dice penalty.',
        ],
      },
    ],
    zh: [
      {
        heading: '设置与目标',
        items: [
          'UNO Dice 是两人游戏。每位玩家掷出 5 个明示骰子，额外 1 个骰子作为中央骰子线的起始骰。',
          '起始骰必须掷到数字面才开始。轮到你时，如果手中的骰子能按颜色、数字或行动符号匹配中央线最上面的骰子，就可以打出。万能骰永远可打。',
          '所有骰子始终公开可见，所以重点不是记忆，而是判断时机。所有效果结算后，某位玩家没有骰子，本局结束。',
          '结算对手剩余骰子的分数：数字 1-5 按面值计分，Draw One 和 Draw Two 各 20 分，Wild 50 分。先到 200 分赢得整场。',
        ],
      },
      {
        heading: '拿骰与重掷',
        items: [
          '如果你不能打，或选择不打，可以从中央骰子线较旧的一端拿 1 个骰子，然后重掷自己手中的全部骰子。',
          '中央线必须至少保留 1 个骰子。如果中央线只有 1 个骰子，你不能拿走它，而是只重掷自己的骰子一次。',
          '重掷后，如果出现可匹配的骰子，你可以立刻打出；如果仍然不能打，回合结束。',
          '例子：中央最上面是红 3。你没有红色、没有 3、也没有万能骰。你拿 1 个线上的骰子并重掷，若出现红色、3 或万能骰，就可以马上打。',
        ],
      },
      {
        heading: '行动骰',
        items: [
          'Draw One 可以按颜色或另一个 Draw One 匹配。对手从中央线拿 1 个骰子，重掷全部骰子，并跳过回合。',
          'Draw Two 可以按颜色或另一个 Draw Two 匹配。对手最多从中央线拿 2 个骰子，但中央线仍必须保留 1 个骰子。',
          'Wild 让你选择新的有效颜色。它本身不会让对手拿骰子。',
          '行动效果必须先结算，再判断胜利。如果你的最后一个骰子是 Draw Two，对手先拿骰子，然后你因为没有骰子而获胜。',
        ],
      },
      {
        heading: '策略',
        items: [
          '因为所有骰子公开可见，选择 Wild 颜色前先看对手。尽量选择对手当前没有的颜色。',
          '即使你有可打骰子，拿线上的骰子也可能有价值，因为重掷全部骰子可能把弱局面变成多个选择。',
          'Draw 骰在线很长时最强。如果中央线只多出 1 个可拿骰，Draw Two 仍能跳过对手，但给的骰子会少。',
          '从两个骰子打到一个骰子前要喊 UNO。如果忘记并被抓到，就要接受骰子惩罚。',
        ],
      },
    ],
    de: [
      {
        heading: 'Aufbau Und Ziel',
        items: [
          'UNO Dice ist ein Spiel für zwei Spieler. Jeder Spieler würfelt fünf offene Würfel, und ein zusätzlicher Würfel startet die Würfellinie in der Mitte.',
          'Der Startwürfel wird so lange gewürfelt, bis er eine Zahl zeigt. In deinem Zug spielst du einen Würfel auf die Linie, wenn er Farbe, Zahl oder Aktionssymbol des obersten Würfels trifft. Wild passt immer.',
          'Alle Würfel bleiben sichtbar. Es geht also weniger um Merken, sondern mehr um Timing. Die Runde endet, wenn ein Spieler nach allen Effekten keine Würfel mehr hat.',
          'Gewertet werden die gegnerischen Würfel: Zahlen zählen 1-5, Draw One und Draw Two je 20, Wild 50. Wer zuerst 200 Punkte erreicht, gewinnt die Session.',
        ],
      },
      {
        heading: 'Nehmen Und Neu Würfeln',
        items: [
          'Wenn du nicht spielen kannst oder nicht spielen willst, nimm einen Würfel vom älteren Ende der Mittellinie und würfle danach alle eigenen Würfel neu.',
          'In der Linie muss immer mindestens ein Würfel bleiben. Liegt nur ein Würfel dort, nimmst du ihn nicht, sondern würfelst deine eigenen Würfel einmal neu.',
          'Wenn du nach dem Neuwerfen einen passenden Würfel hast, darfst du ihn sofort spielen. Wenn nicht, endet dein Zug.',
          'Beispiel: Oben liegt Rot 3. Du hast kein Rot, keine 3 und kein Wild. Nimm einen Linienwürfel, würfle neu, und spiele sofort, falls Rot, 3 oder Wild erscheint.',
        ],
      },
      {
        heading: 'Aktionswürfel',
        items: [
          'Draw One passt nach Farbe oder auf ein anderes Draw One. Der Gegner nimmt einen Würfel aus der Linie, würfelt alle eigenen Würfel neu und setzt aus.',
          'Draw Two passt nach Farbe oder auf ein anderes Draw Two. Der Gegner nimmt bis zu zwei Würfel aus der Linie, aber ein Würfel muss in der Linie bleiben.',
          'Wild lässt dich die aktive Farbe wählen. Wild zwingt den Gegner nicht zum Nehmen.',
          'Aktionen werden vor dem Rundensieg abgehandelt. Ist dein letzter Würfel Draw Two, nimmt der Gegner erst Würfel, danach gewinnt deine leere Hand.',
        ],
      },
      {
        heading: 'Strategie',
        items: [
          'Weil alle Würfel offen sind, prüfe vor einer Wild-Farbe die gegnerischen Würfel. Wähle möglichst eine Farbe, die der Gegner gerade nicht zeigt.',
          'Aus der Linie zu nehmen kann selbst mit legalem Spiel sinnvoll sein, weil der komplette Neuwurf aus einer schwachen Hand mehrere Optionen machen kann.',
          'Draw-Würfel sind am stärksten, wenn die Linie lang ist. Bei nur einem freien Linienwürfel ist Draw Two immer noch gut zum Aussetzen, gibt aber weniger Würfel.',
          'Rufe UNO, bevor du von zwei Würfeln auf einen herunterspielst. Vergisst du es und wirst erwischt, nimmst du eine Würfelstrafe.',
        ],
      },
    ],
  }
  return sections[language]
}

function emojiRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Emoji Twist',
        items: [
          'UNO Emoji plays like Classic UNO: match the discard by color, number, or symbol, or play a Wild card.',
          'Cards carry emoji faces for visual fun. The special card is Wild Emoji.',
          'When Wild Emoji is played, choose the next color. The next player must make the shown emoji face or take a 4-card penalty.',
          'In this app, the challenged human player confirms Made face or Missed: draw 4. AI players resolve the face challenge automatically.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'If red 5 is on top, you may play any red card, any 5, any matching action symbol, or a Wild/Wild Emoji.',
          'If you play Wild Emoji 😂 and choose blue, the next player must make that face. If they do, their turn continues with blue active. If they miss, they draw 4 and lose the turn.',
          'A final-card Wild Emoji only wins after the face challenge is resolved. If the next player draws 4, those cards count in scoring.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Wild Emoji is strongest against a player with few cards, because it either costs them time or 4 cards.',
          'Choose a color that helps your remaining hand first; the face challenge is pressure, but color control wins rounds.',
          'Try not to keep Wild Emoji too long. It is worth 50 points if another player goes out.',
        ],
      },
    ],
    zh: [
      {
        heading: 'Emoji 特色',
        items: [
          'UNO Emoji 的基础玩法与经典 UNO 相同：按颜色、数字或符号匹配，也可以打出万能牌。',
          '牌面带有 emoji 表情。特殊牌是 Wild Emoji。',
          '打出 Wild Emoji 时，选择下一种颜色。下一位玩家必须模仿牌面表情，否则摸 4 张牌。',
          '在本应用中，被挑战的人类玩家点击“已模仿表情”或“失败：摸 4”。AI 会自动结算表情挑战。',
        ],
      },
      {
        heading: '例子',
        items: [
          '如果牌堆顶是红 5，你可以出任意红色牌、任意 5、匹配的行动符号，或万能/Wild Emoji。',
          '你打出 Wild Emoji 😂 并选择蓝色后，下一位玩家必须模仿该表情。成功则以蓝色继续他的回合；失败则摸 4 并跳过回合。',
          '如果最后一张牌是 Wild Emoji，必须先结算表情挑战再判断胜利。若下一位摸 4，这些牌会计入得分。',
        ],
      },
      {
        heading: '策略',
        items: [
          'Wild Emoji 对手牌很少的玩家最有压力，因为它要么打断节奏，要么让对方摸 4。',
          '选择颜色时优先考虑自己剩余手牌；表情挑战制造压力，但颜色控制更容易赢得回合。',
          '不要把 Wild Emoji 留太久。别人先出完时，它会给你留下 50 分。',
        ],
      },
    ],
    de: [
      {
        heading: 'Emoji-Twist',
        items: [
          'UNO Emoji spielt sich wie Classic UNO: Passe nach Farbe, Zahl oder Symbol, oder spiele eine Wild-Karte.',
          'Die Karten zeigen Emoji-Gesichter. Die Spezialkarte ist Wild Emoji.',
          'Wenn Wild Emoji gespielt wird, wählst du die nächste Farbe. Der nächste Spieler muss das gezeigte Emoji-Gesicht machen oder 4 Karten ziehen.',
          'In dieser App bestätigt der betroffene Mensch Gesicht gemacht oder Verfehlt: 4 ziehen. KI-Spieler lösen die Herausforderung automatisch.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Liegt Rot 5 oben, darfst du jede rote Karte, jede 5, ein passendes Aktionssymbol oder Wild/Wild Emoji spielen.',
          'Spielst du Wild Emoji 😂 und wählst Blau, muss der nächste Spieler dieses Gesicht machen. Gelingt es, geht sein Zug mit Blau weiter. Misslingt es, zieht er 4 und setzt aus.',
          'Eine letzte Wild-Emoji-Karte gewinnt erst nach der Gesichtschallenge. Zieht der nächste Spieler 4, zählen diese Karten in die Wertung.',
        ],
      },
      {
        heading: 'Strategie',
        items: [
          'Wild Emoji ist am stärksten gegen Spieler mit wenigen Karten, weil es Tempo kostet oder 4 Karten gibt.',
          'Wähle zuerst eine Farbe, die zu deiner restlichen Hand passt. Die Challenge macht Druck, aber Farbkontrolle gewinnt Runden.',
          'Halte Wild Emoji nicht zu lange. Wenn jemand anderes ausgeht, ist sie 50 Punkte wert.',
        ],
      },
    ],
  }
  return sections[language]
}

function marioKartRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Goal',
        items: [
          'UNO Mario Kart plays like Classic UNO: match by color, number, or symbol, and be first to empty your hand.',
          'The deck has no regular Wild cards. Instead, it has 8 Wild Item Box cards and 4 Wild Draw Four cards.',
          'When you play a Wild Item Box, choose the next color and a possible Green Shell target, then reveal the top card of the stock.',
        ],
      },
      {
        heading: 'Item Box Items',
        items: [
          'Red revealed card: Mushroom. You immediately take another turn.',
          'Yellow revealed card: Banana Peel. The player who played before you draws 2 cards.',
          'Green revealed card: Green Shell. Your chosen target draws 1 card.',
          'Blue revealed card: Lightning. Every other player draws 1 card, and you take another turn.',
          'Wild revealed card: Bob-omb. You draw 2 cards, and the chosen Wild Item Box color stays active.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'If you play Wild Item Box and reveal a blue Skip, the Skip does not skip anyone; only Lightning happens.',
          'If you reveal a yellow +2, the +2 action is ignored; Banana Peel makes the previous player draw 2.',
          'If you reveal Wild Draw Four, nobody draws 4 from that card; Bob-omb makes you draw 2.',
        ],
      },
      {
        heading: 'Tips',
        items: [
          'Wild Item Box is swingy. Save it when you need a color change or when the table leader is close to going out.',
          'Pick the Green Shell target as the player with the fewest cards. If Green Shell appears, that pressure lands immediately.',
          'Mushroom and Lightning can create a second turn, so play Item Box when your hand has follow-up cards in several colors.',
          'Bob-omb can hurt you, so avoid using Item Box as your final card unless you can accept the risk.',
        ],
      },
    ],
    zh: [
      {
        heading: '目标',
        items: [
          'UNO Mario Kart 的基础玩法与经典 UNO 相同：按颜色、数字或符号匹配，最先出完手牌者赢得本轮。',
          '牌组没有普通万能牌，改为 8 张道具箱万能牌和 4 张万能 +4。',
          '打出道具箱万能牌时，先选择颜色和可能的绿龟壳目标，然后翻开摸牌堆顶牌。',
        ],
      },
      {
        heading: '道具效果',
        items: [
          '翻出红色牌：蘑菇。你立刻再行动一次。',
          '翻出黄色牌：香蕉皮。你前一位出牌的玩家摸 2 张。',
          '翻出绿色牌：绿龟壳。你选择的目标摸 1 张。',
          '翻出蓝色牌：闪电。其他所有玩家各摸 1 张，然后你再行动一次。',
          '翻出万能牌：炸弹兵。你摸 2 张，之前选择的颜色继续生效。',
        ],
      },
      {
        heading: '例子',
        items: [
          '如果道具箱翻出蓝色跳过牌，不会执行跳过；只触发闪电效果。',
          '如果翻出黄色 +2，+2 本身不生效；香蕉皮让前一位玩家摸 2 张。',
          '如果翻出万能 +4，不会让别人摸 4；炸弹兵让你自己摸 2 张。',
        ],
      },
      {
        heading: '策略',
        items: [
          '道具箱波动很大。需要换色或桌面领先玩家快出完时再使用更有价值。',
          '绿龟壳目标通常选手牌最少的玩家；如果翻出绿牌，压力会立刻打到他身上。',
          '蘑菇和闪电会给你额外回合，所以最好在手里还有多种颜色后续牌时使用。',
          '炸弹兵会惩罚自己，所以不要轻易把道具箱当最后一张牌打出。',
        ],
      },
    ],
    de: [
      {
        heading: 'Ziel',
        items: [
          'UNO Mario Kart spielt sich wie Classic UNO: Lege nach Farbe, Zahl oder Symbol an und werde zuerst alle Handkarten los.',
          'Das Deck hat keine normalen Wild-Karten. Stattdessen gibt es 8 Wild Item-Box-Karten und 4 Wild Draw Four.',
          'Wenn du Wild Item-Box spielst, wählst du Farbe und ein mögliches Grüner-Panzer-Ziel, dann wird die oberste Karte des Stapels aufgedeckt.',
        ],
      },
      {
        heading: 'Items',
        items: [
          'Rote aufgedeckte Karte: Pilz. Du bist sofort noch einmal dran.',
          'Gelbe aufgedeckte Karte: Bananenschale. Der Spieler, der vor dir gespielt hat, zieht 2 Karten.',
          'Grüne aufgedeckte Karte: Grüner Panzer. Dein gewähltes Ziel zieht 1 Karte.',
          'Blaue aufgedeckte Karte: Blitz. Alle anderen ziehen 1 Karte, und du bist erneut dran.',
          'Wild aufgedeckte Karte: Bob-omb. Du ziehst 2 Karten; die gewählte Item-Box-Farbe bleibt aktiv.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Deckst du eine blaue Aussetzen-Karte auf, setzt niemand aus; nur Blitz wird aktiviert.',
          'Deckst du eine gelbe +2 auf, gilt die +2 nicht; die Bananenschale lässt den vorherigen Spieler 2 ziehen.',
          'Deckst du Wild Draw Four auf, zieht niemand 4 dadurch; Bob-omb lässt dich selbst 2 ziehen.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Wild Item-Box ist riskant. Hebe sie für Farbwechsel oder für Druck gegen führende Spieler auf.',
          'Wähle als Grüner-Panzer-Ziel meist den Spieler mit den wenigsten Karten.',
          'Pilz und Blitz geben Zusatztempo. Spiele Item-Box am besten, wenn du danach mehrere Farben bedienen kannst.',
          'Bob-omb kann dich selbst treffen, also spiele Item-Box ungern als letzte Karte.',
        ],
      },
    ],
  }
  return sections[language]
}

function superMarioRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Super Mario Twist',
        items: [
          'UNO Super Mario plays like Classic UNO: match by color, number, or symbol, or play a Wild card.',
          'The Super Star card is a Wild card. On your normal turn, choose the next active color and play continues normally.',
          'Its special power appears when you are hit by a Draw 2 or Wild Draw 4. You may play Super Star immediately to reflect that full draw penalty back to the player who caused it.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'If the previous player plays a red +2 against you, play Super Star, choose yellow, and the previous player draws 2 instead. Your turn is protected and play moves to the next player after you.',
          'If a Wild +4 is aimed at you, Super Star reflects all 4 cards back to the source. The normal +4 challenge is skipped because you chose the defensive Super Star response.',
          'If there is no incoming draw penalty, Super Star is simply a Wild worth 50 points.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Hold Super Star as insurance when the next player has draw cards or when you are close to UNO.',
          'Do not hold it forever: if another player goes out, Super Star counts 50 points against you.',
          'When reflecting a penalty, choose a color that supports your remaining cards, because play continues after your protected turn.',
        ],
      },
    ],
    zh: [
      {
        heading: 'Super Mario 特色',
        items: [
          'UNO Super Mario 的基础玩法与经典 UNO 相同：按颜色、数字或符号匹配，也可以打出万能牌。',
          'Super Star 是一张万能牌。普通回合中打出它时，选择下一种当前颜色，然后正常继续。',
          '当你受到 +2 或 Wild +4 惩罚时，可以立刻打出 Super Star，把全部摸牌惩罚反弹给来源玩家。',
        ],
      },
      {
        heading: '例子',
        items: [
          '上一位玩家对你打出红色 +2 时，你可以打出 Super Star 并选择黄色，上一位玩家改为摸 2 张。你的回合被保护，然后轮到你之后的下一位。',
          '如果 Wild +4 指向你，Super Star 会把 4 张惩罚反弹给来源玩家。因为你选择了防御反应，所以不再进行 +4 质疑流程。',
          '如果没有当前摸牌惩罚，Super Star 只是价值 50 分的万能牌。',
        ],
      },
      {
        heading: '策略',
        items: [
          '当下一位玩家可能有摸牌攻击，或你接近 UNO 时，Super Star 是很好的保险。',
          '不要一直留着它；如果别人先出完，Super Star 会给你留下 50 分。',
          '反弹惩罚时，选择对自己剩余手牌最有利的颜色，因为保护回合结束后游戏会继续。',
        ],
      },
    ],
    de: [
      {
        heading: 'Super-Mario-Twist',
        items: [
          'UNO Super Mario spielt sich wie Classic UNO: Lege nach Farbe, Zahl oder Symbol an, oder spiele eine Wild-Karte.',
          'Die Super-Star-Karte ist eine Wild-Karte. In deinem normalen Zug wählst du damit die nächste aktive Farbe.',
          'Ihre Spezialkraft gilt, wenn dich eine +2 oder Wild +4 trifft. Du darfst Super Star sofort spielen und die ganze Ziehstrafe zum Ursprungsspieler zurückwerfen.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Spielt der vorherige Spieler eine rote +2 gegen dich, spielst du Super Star, wählst Gelb, und der vorherige Spieler zieht stattdessen 2 Karten.',
          'Trifft dich eine Wild +4, wirft Super Star alle 4 Karten zurück. Die normale +4-Anzweiflung wird Übersprungen, weil du die defensive Antwort gewählt hast.',
          'Ohne eingehende Ziehstrafe ist Super Star einfach eine Wild-Karte mit 50 Punkten.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Halte Super Star als Versicherung, wenn der nächste Spieler Ziehkarten haben könnte oder du kurz vor UNO bist.',
          'Halte sie nicht zu lange: Geht jemand anderes raus, zählt Super Star 50 Punkte gegen dich.',
          'Beim Zurückwerfen wählst du am besten eine Farbe, die zu deiner restlichen Hand passt.',
        ],
      },
    ],
  }
  return sections[language]
}

function sonicRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Sonic Twist',
        items: [
          'UNO Sonic the Hedgehog plays like Classic UNO for 2 to 4 players: match by color, number, or symbol, or play a Wild card.',
          'The Victory Lap card is a Wild card. Choose the next active color; every other player draws 1 card, then play continues to the next player.',
          'Victory Lap is worth 50 points, so it is powerful when played, but expensive if another player goes out while it remains in your hand.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'If you play Victory Lap in a 4-player game and choose blue, the other three players each draw 1 card. The next player then continues with blue active.',
          'If you have only two cards and Victory Lap is playable, it can be a strong UNO setup because it slows every opponent at once.',
          'Victory Lap does not stack with +2 or +4 penalties. It is its own Wild effect and only makes each other player draw 1.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Use Victory Lap when several opponents are close to UNO or when you need to change to your strongest color.',
          'Against one leading opponent, a normal +2 or +4 may be sharper. Victory Lap is best when the whole table needs pressure.',
          'Do not save Victory Lap too long. If your hand is awkward, play it early for color control instead of keeping a 50-point risk.',
        ],
      },
    ],
    zh: [
      {
        heading: 'Sonic 特色',
        items: [
          'UNO Sonic the Hedgehog 支持 2 到 4 名玩家，基础玩法与经典 UNO 相同：按颜色、数字或符号匹配，也可以打出万能牌。',
          'Victory Lap 是一张万能牌。打出后选择新的当前颜色，其他所有玩家各摸 1 张牌，然后按正常顺序继续。',
          'Victory Lap 价值 50 分，打出时很强，但如果别人先出完而它还留在你手里，会带来很高扣分风险。',
        ],
      },
      {
        heading: '例子',
        items: [
          '4 人局中你打出 Victory Lap 并选择蓝色，另外三名玩家各摸 1 张牌，然后下一位玩家在蓝色条件下继续。',
          '如果你只剩两张牌，并且 Victory Lap 可以打出，它通常能很好地帮助你进入 UNO，因为它会同时拖慢所有对手。',
          'Victory Lap 不与 +2 或 +4 惩罚叠加。它是独立的万能牌效果，只让其他每位玩家摸 1 张。',
        ],
      },
      {
        heading: '策略',
        items: [
          '当多名对手接近 UNO，或你需要把颜色切换到自己最强颜色时，Victory Lap 很有价值。',
          '如果只有一名领先对手，普通 +2 或 +4 可能更直接。Victory Lap 更适合压制整桌玩家。',
          '不要把 Victory Lap 留太久。如果手牌颜色不好，早点用它换颜色，通常比保留一张 50 分风险牌更安全。',
        ],
      },
    ],
    de: [
      {
        heading: 'Sonic-Twist',
        items: [
          'UNO Sonic the Hedgehog spielt sich für 2 bis 4 Spieler wie Classic UNO: Lege nach Farbe, Zahl oder Symbol an, oder spiele eine Wild-Karte.',
          'Victory Lap ist eine Wild-Karte. Wähle die nächste aktive Farbe; alle anderen Spieler ziehen 1 Karte, danach geht die normale Reihenfolge weiter.',
          'Victory Lap zählt 50 Punkte. Die Karte ist stark beim Ausspielen, aber teuer, wenn ein anderer Spieler vorher rausgeht.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Spielst du Victory Lap in einer 4-Spieler-Runde und wählst Blau, ziehen die drei anderen Spieler je 1 Karte. Danach spielt der nächste Spieler mit Blau weiter.',
          'Hast du nur noch zwei Karten und Victory Lap ist spielbar, ist sie oft ein guter Weg Richtung UNO, weil alle Gegner gleichzeitig gebremst werden.',
          'Victory Lap stapelt nicht mit +2 oder +4. Es ist ein eigener Wild-Effekt und lässt jeden anderen Spieler genau 1 Karte ziehen.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Spiele Victory Lap, wenn mehrere Gegner kurz vor UNO stehen oder du dringend auf deine beste Farbe wechseln willst.',
          'Gegen nur einen führenden Gegner kann eine normale +2 oder +4 stärker sein. Victory Lap setzt vor allem den ganzen Tisch unter Druck.',
          'Halte Victory Lap nicht zu lange. Bei einer schwachen Hand ist früher Farbwechsel oft besser als eine 50-Punkte-Risikokarte.',
        ],
      },
    ],
  }
  return sections[language]
}

function barbieRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Barbie Twist',
        items: [
          'UNO Barbie plays like Classic UNO for 2 to 4 players: match by color, number, or symbol, or play a Wild card.',
          'Played With Too Much is a Wild card with two color choices: choose the next active color, then choose one discard color.',
          'Every player, including you, discards all cards of the chosen discard color from hand, then draws the same number of replacement cards.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'You play Played With Too Much, choose blue as active color, and choose yellow as discard color. A player with two yellow cards discards both and draws two replacements.',
          'A player with no cards of the discard color is not affected. The card does not skip anyone and play continues normally to the next player.',
          'If you choose a discard color you barely hold, you can refresh opponents without damaging your own hand much.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Choose the active color from your remaining hand so you can continue after the table disruption.',
          'Choose a discard color that opponents are likely holding, especially players close to UNO.',
          'Avoid choosing a color that clears your own strong run of playable cards unless you need a desperate redraw.',
          'Played With Too Much is worth 50 points, so play it before it becomes a heavy penalty in your hand.',
        ],
      },
    ],
    zh: [
      {
        heading: 'Barbie 特色',
        items: [
          'UNO Barbie 支持 2 到 4 名玩家，基础玩法与经典 UNO 相同：按颜色、数字或符号匹配，也可以打出万能牌。',
          'Played With Too Much 是一张万能牌，但需要选择两个颜色：先选择新的当前颜色，再选择一个弃牌颜色。',
          '所有玩家，包括你自己，都要弃掉手中该弃牌颜色的所有牌，然后摸回相同数量的替换牌。',
        ],
      },
      {
        heading: '例子',
        items: [
          '你打出 Played With Too Much，选择蓝色作为当前颜色，并选择黄色作为弃牌颜色。某位玩家有两张黄色牌，就弃掉这两张并摸两张替换牌。',
          '如果某位玩家没有该弃牌颜色的牌，他不会受到影响。这张牌不会跳过任何人，之后按正常顺序轮到下一位。',
          '如果你选择自己手中很少的弃牌颜色，就能扰乱对手，同时减少对自己的伤害。',
        ],
      },
      {
        heading: '策略',
        items: [
          '当前颜色最好选择自己剩余手牌中最强的颜色，方便后续继续出牌。',
          '弃牌颜色应尽量选择对手可能持有较多的颜色，尤其是接近 UNO 的玩家。',
          '如果某种颜色是你自己的主要出牌路线，不要轻易把它清掉，除非你需要冒险换手牌。',
          'Played With Too Much 价值 50 分，不要长期留在手里，否则别人先出完时会留下很高罚分。',
        ],
      },
    ],
    de: [
      {
        heading: 'Barbie-Twist',
        items: [
          'UNO Barbie spielt sich für 2 bis 4 Spieler wie Classic UNO: Lege nach Farbe, Zahl oder Symbol an, oder spiele eine Wild-Karte.',
          'Played With Too Much ist eine Wild-Karte mit zwei Farbentscheidungen: Wähle die nächste aktive Farbe und danach eine Ablagefarbe.',
          'Alle Spieler, auch du selbst, werfen alle Handkarten dieser Ablagefarbe ab und ziehen danach genau dieselbe Anzahl Ersatzkarten.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Du spielst Played With Too Much, wählst Blau als aktive Farbe und Gelb als Ablagefarbe. Ein Spieler mit zwei gelben Karten wirft beide ab und zieht zwei Ersatzkarten.',
          'Ein Spieler ohne Karten der Ablagefarbe ist nicht betroffen. Niemand wird übersprungen; danach ist normal der nächste Spieler dran.',
          'Wenn du eine Ablagefarbe wählst, von der du selbst kaum Karten hast, störst du Gegner und schadest deiner eigenen Hand wenig.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Wähle die aktive Farbe passend zu deiner Resthand, damit du nach der Störung weiter Druck machen kannst.',
          'Wähle als Ablagefarbe eine Farbe, die Gegner wahrscheinlich oft halten, besonders Spieler kurz vor UNO.',
          'Räume nicht deine eigene stärkste Farbe ab, außer du brauchst dringend eine neue Handstruktur.',
          'Played With Too Much zählt 50 Punkte. Spiele die Karte rechtzeitig, bevor sie als hohe Strafe in deiner Hand bleibt.',
        ],
      },
    ],
  }
  return sections[language]
}

function mastersOfTheUniverseRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Power Of Grayskull',
        items: [
          'UNO Masters of the Universe plays like Classic UNO for 2 to 4 players: match by color, number, or symbol, or play a Wild card.',
          'Power of Grayskull is a Wild card. Choose the next active color when you play it.',
          'If you still have at least one card of that chosen color after playing Power of Grayskull, you keep the turn and may immediately play again.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'You play Power of Grayskull and choose green. If your hand still contains a green 7, you stay active and can play a legal green card next.',
          'If you choose blue but have no blue card left, Power of Grayskull acts like a normal Wild and the turn passes to the next player.',
          'If Power of Grayskull is your last card, the round ends immediately; the bonus turn is not needed.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Choose a color that gives you a real follow-up, not only the color that blocks opponents.',
          'Near UNO, Power of Grayskull can create a finishing chain: choose your last card color and play again.',
          'If no chosen color remains in your hand, the card is still useful as a Wild, but less powerful than saving it for a bonus turn.',
          'Do not hold it too long. It is worth 50 points if another player goes out first.',
        ],
      },
    ],
    zh: [
      {
        heading: '灰颅堡之力',
        items: [
          'UNO Masters of the Universe 支持 2 到 4 名玩家，基础玩法与经典 UNO 相同：按颜色、数字或符号匹配，也可以打出万能牌。',
          'Power of Grayskull 是一张万能牌。打出时选择新的当前颜色。',
          '如果你在打出 Power of Grayskull 后，手中仍然至少有一张所选颜色的牌，你保留回合并可以立刻再出一张牌。',
        ],
      },
      {
        heading: '例子',
        items: [
          '你打出 Power of Grayskull 并选择绿色。如果手中还剩绿色 7，你继续行动，并可以接着打出合法的绿色牌。',
          '如果你选择蓝色，但手中已经没有蓝色牌，Power of Grayskull 就像普通万能牌一样，回合交给下一位玩家。',
          '如果 Power of Grayskull 是你的最后一张牌，本轮立即结束，不需要额外回合。',
        ],
      },
      {
        heading: '策略',
        items: [
          '选择能让你继续出牌的颜色，而不只是选择能卡住对手的颜色。',
          '接近 UNO 时，Power of Grayskull 可以形成收尾连击：选择最后一张牌的颜色，然后继续出牌。',
          '如果你手中没有所选颜色，它仍然是有用的万能牌，但威力不如能触发额外回合时强。',
          '不要留太久。别人先出完时，它会给你留下 50 分。',
        ],
      },
    ],
    de: [
      {
        heading: 'Kraft von Grayskull',
        items: [
          'UNO Masters of the Universe spielt sich für 2 bis 4 Spieler wie Classic UNO: Lege nach Farbe, Zahl oder Symbol an, oder spiele eine Wild-Karte.',
          'Power of Grayskull ist eine Wild-Karte. Wähle beim Ausspielen die nächste aktive Farbe.',
          'Hast du danach noch mindestens eine Karte dieser gewählten Farbe, behältst du den Zug und darfst sofort erneut spielen.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Du spielst Power of Grayskull und wählst Grün. Hast du danach noch eine grüne 7, bleibst du aktiv und kannst eine legale grüne Karte spielen.',
          'Wählst du Blau, hast aber keine blaue Karte mehr, wirkt Power of Grayskull wie eine normale Wild-Karte und der nächste Spieler ist dran.',
          'Ist Power of Grayskull deine letzte Karte, endet die Runde sofort; der Bonuszug wird nicht mehr gebraucht.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Wähle eine Farbe, mit der du wirklich weiterspielen kannst, nicht nur eine Farbe, die Gegner blockiert.',
          'Kurz vor UNO kann Power of Grayskull eine Abschlusskette bauen: Wähle die Farbe deiner letzten Karte und spiele sofort weiter.',
          'Ohne passende Restfarbe bleibt die Karte eine nützliche Wild-Karte, ist aber schwächer als mit Bonuszug.',
          'Halte sie nicht zu lange. Geht jemand anderes raus, zählt sie 50 Punkte gegen dich.',
        ],
      },
    ],
  }
  return sections[language]
}

function tmntRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Turtle Power',
        items: [
          'UNO TMNT plays like Classic UNO for 2 to 4 players: match by color, number, or symbol, or play a Wild card.',
          'Turtle Power is a Wild card. Choose the next active color when you play it.',
          'Then every player passes 1 card to the next player in the current game direction. The app auto-selects a low-value non-wild card when possible.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'Clockwise: Player 1 gives 1 card to Player 2, Player 2 gives 1 to Player 3, Player 3 gives 1 to Player 4, and Player 4 gives 1 to Player 1.',
          'If Reverse changed the direction, Turtle Power passes cards counter-clockwise instead.',
          'After the pass, the chosen active color stays in effect and the next player in game direction continues.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Use Turtle Power when you have a weak low-value card to pass away.',
          'Be careful near UNO: you may receive a new card immediately after playing it.',
          'Avoid playing Turtle Power when your remaining hand is all strong Wild or action cards unless you need a color change.',
          'Choose an active color that supports your remaining hand after the automatic pass.',
        ],
      },
    ],
    zh: [
      {
        heading: '忍者神龟力量',
        items: [
          'UNO TMNT 支持 2 到 4 名玩家，基础玩法与经典 UNO 相同：按颜色、数字或符号匹配，也可以打出万能牌。',
          'Turtle Power 是一张万能牌。打出时选择新的当前颜色。',
          '然后每位玩家沿当前游戏方向传递 1 张牌给下一位玩家。为了保持节奏，应用会优先自动选择低分、非万能牌传递。',
        ],
      },
      {
        heading: '例子',
        items: [
          '顺时针时：玩家 1 给玩家 2 一张牌，玩家 2 给玩家 3，一直到玩家 4 给玩家 1。',
          '如果 Reverse 已经改变方向，Turtle Power 会按逆时针传牌。',
          '传牌后，所选当前颜色继续有效，并由游戏方向上的下一位玩家继续。',
        ],
      },
      {
        heading: '策略',
        items: [
          '当你有低价值弱牌可以传走时，Turtle Power 很有用。',
          '接近 UNO 时要小心：你打出后马上可能收到一张新牌。',
          '如果你剩下的都是强力万能牌或功能牌，除非急需换颜色，否则不要轻易使用。',
          '选择当前颜色时，要考虑自动传牌后自己剩余手牌的颜色。',
        ],
      },
    ],
    de: [
      {
        heading: 'Turtle Power',
        items: [
          'UNO TMNT spielt sich für 2 bis 4 Spieler wie Classic UNO: Lege nach Farbe, Zahl oder Symbol an, oder spiele eine Wild-Karte.',
          'Turtle Power ist eine Wild-Karte. Wähle beim Ausspielen die nächste aktive Farbe.',
          'Danach gibt jeder Spieler 1 Karte an den nächsten Spieler in aktueller Spielrichtung weiter. Die App wählt möglichst eine niedrige Nicht-Wild-Karte automatisch.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Im Uhrzeigersinn: Spieler 1 gibt 1 Karte an Spieler 2, Spieler 2 an Spieler 3, Spieler 3 an Spieler 4 und Spieler 4 an Spieler 1.',
          'Hat Reverse die Richtung geändert, werden die Karten gegen den Uhrzeigersinn weitergegeben.',
          'Nach dem Weitergeben bleibt die gewählte aktive Farbe bestehen und der nächste Spieler in Spielrichtung ist dran.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Nutze Turtle Power, wenn du eine schwache Karte mit niedrigem Wert loswerden kannst.',
          'Kurz vor UNO ist Vorsicht nötig: Du kannst direkt nach dem Ausspielen wieder eine Karte erhalten.',
          'Spiele Turtle Power nicht leichtfertig, wenn deine Resthand nur aus starken Wild- oder Aktionskarten besteht.',
          'Wähle eine aktive Farbe, die nach dem automatischen Weitergeben zu deiner Resthand passt.',
        ],
      },
    ],
  }
  return sections[language]
}

function spiderManRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Web Swing',
        items: [
          'UNO Spider-Man plays like Classic UNO for 2 to 4 players: match by color, number, or symbol, or play a Wild card.',
          'Web Swing is a Wild card. Choose the next active color, then choose one opponent.',
          'You and that opponent swap exactly 1 card. The app gives away your lowest-value non-wild card if possible, and pulls the target player\'s highest-value card, prioritizing Wild and action cards.',
          'Web Swing auto-selects both exchanged hand cards; the player chooses only the active color and opponent.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'You play Web Swing, choose blue, and target Player 3. You may send a Yellow 1 while Player 3 sends back a Wild +4.',
          'The event log shows both directions of the swing, so you can see exactly which cards moved.',
          'After the swap, the chosen color is active and the next player continues normally.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Use Web Swing when you have a weak card to throw away and a player near UNO needs to be slowed down.',
          'Target the player with the fewest cards, especially if they are likely holding a high-impact Wild or action card.',
          'Avoid Web Swing when your remaining hand is mostly high-value cards, because the auto-swap may give away something useful.',
        ],
      },
    ],
    zh: [
      {
        heading: '蛛网摆荡',
        items: [
          'UNO Spider-Man 支持 2 到 4 名玩家，基础玩法与经典 UNO 相同：按颜色、数字或符号匹配，也可以打出万能牌。',
          'Web Swing 是一张万能牌。打出时选择新的当前颜色，然后选择一名对手。',
          '你和该对手各交换 1 张牌。应用会尽量从你手中送出低分、非万能牌，并从目标玩家手中拿回高价值牌，优先拿 Wild 或功能牌。',
          'Web Swing 会自动选择双方交换的手牌；玩家只选择当前颜色和目标对手。',
        ],
      },
      {
        heading: '例子',
        items: [
          '你打出 Web Swing，选择蓝色，并指定玩家 3。你可能送出黄色 1，而玩家 3 送回 Wild +4。',
          '事件日志会显示两个方向的交换，让你清楚看到哪些牌移动了。',
          '交换后，所选颜色成为当前颜色，然后下一位玩家正常继续。',
        ],
      },
      {
        heading: '策略',
        items: [
          '当你有弱牌可以丢出去，并且需要拖慢接近 UNO 的玩家时，Web Swing 很有用。',
          '优先指定手牌最少的玩家，尤其是他可能握有强力 Wild 或功能牌时。',
          '如果你剩下的大多是高价值牌，要谨慎使用，因为自动交换可能送出有用牌。',
        ],
      },
    ],
    de: [
      {
        heading: 'Web Swing',
        items: [
          'UNO Spider-Man spielt sich für 2 bis 4 Spieler wie Classic UNO: Lege nach Farbe, Zahl oder Symbol an, oder spiele eine Wild-Karte.',
          'Web Swing ist eine Wild-Karte. Wähle die nächste aktive Farbe und danach einen Gegner.',
          'Du und dieser Gegner tauschen genau 1 Karte. Die App gibt möglichst deine niedrigste Nicht-Wild-Karte ab und holt vom Ziel die höchste Karte, mit Vorrang für Wild- und Aktionskarten.',
          'Web Swing wählt beide getauschten Handkarten automatisch; der Spieler wählt nur die aktive Farbe und den Gegner.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Du spielst Web Swing, wählst Blau und zielst auf Spieler 3. Du kannst eine gelbe 1 abgeben, während Spieler 3 eine Wild +4 zurückschickt.',
          'Das Ereignisprotokoll zeigt beide Richtungen des Tauschs, damit klar ist, welche Karten bewegt wurden.',
          'Nach dem Tausch bleibt die gewählte Farbe aktiv und der nächste Spieler ist normal dran.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Nutze Web Swing, wenn du eine schwache Karte loswerden kannst und ein Spieler kurz vor UNO gebremst werden soll.',
          'Ziele meist auf den Spieler mit den wenigsten Karten, besonders wenn dort starke Wild- oder Aktionskarten zu erwarten sind.',
          'Sei vorsichtig, wenn deine Resthand fast nur aus hohen Karten besteht, weil die Automatik sonst etwas Wertvolles abgeben kann.',
        ],
      },
    ],
  }
  return sections[language]
}

function dcRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Justice League',
        items: [
          'UNO DC plays like Classic UNO for 2 to 4 players: match by color, number, or symbol, or play a Wild card.',
          'Justice League is a Wild card. Choose the next active color; every other player reveals their strongest card.',
          'The app takes the best revealed card for you, prioritizing Wild cards, then action cards, then high numbers. If you still have a card to give back, your lowest-value card is returned to that same player.',
          'Justice League auto-selects the revealed cards and exchange cards; the player chooses only the active color.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'You play Justice League and choose blue. Player 2 reveals Yellow 8, Player 3 reveals Wild +4, and Player 4 reveals Red Skip.',
          'You capture the Wild +4 from Player 3 and return a low card, such as Green 1, to Player 3.',
          'The event log shows every revealed card, the captured card, and the returned card so the exchange is transparent.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Justice League is strongest when several opponents hold many cards, because it searches across all other players instead of only one target.',
          'Use it before a player near UNO can hide a powerful Wild or action card.',
          'Choose a color that helps your remaining hand after the exchange; the card still advances turn order normally.',
        ],
      },
    ],
    zh: [
      {
        heading: '正义联盟',
        items: [
          'UNO DC 支持 2 到 4 名玩家，基础玩法与经典 UNO 相同：按颜色、数字或符号匹配，也可以打出万能牌。',
          'Justice League 是一张万能牌。打出时选择新的当前颜色，其他每位玩家都亮出自己最强的一张牌。',
          '应用会为你拿走亮出牌中最好的一张：优先万能牌，其次功能牌，再比较高数字。如果你还有牌可以还回去，应用会把你最低价值的一张牌还给同一名玩家。',
          'Justice League 会自动选择亮出的牌和交换牌；玩家只选择当前颜色。',
        ],
      },
      {
        heading: '例子',
        items: [
          '你打出 Justice League 并选择蓝色。玩家 2 亮出黄色 8，玩家 3 亮出 Wild +4，玩家 4 亮出红色 Skip。',
          '你会获得玩家 3 的 Wild +4，并把一张低价值牌，例如绿色 1，还给玩家 3。',
          '事件日志会显示每位玩家亮出的牌、你获得的牌，以及你还回去的牌，方便检查牌的流向。',
        ],
      },
      {
        heading: '策略',
        items: [
          '当多个对手手牌较多时，Justice League 很强，因为它会从所有其他玩家中寻找最好的牌，而不是只针对一个目标。',
          '如果有人快要 UNO，尽早使用它可以抢走对方可能藏着的强力万能牌或功能牌。',
          '选择颜色时要考虑交换后自己剩余手牌的颜色；效果结算后，回合仍按正常顺序继续。',
        ],
      },
    ],
    de: [
      {
        heading: 'Justice League',
        items: [
          'UNO DC spielt sich für 2 bis 4 Spieler wie Classic UNO: Lege nach Farbe, Zahl oder Symbol an, oder spiele eine Wild-Karte.',
          'Justice League ist eine Wild-Karte. Wähle die nächste aktive Farbe; alle anderen Spieler decken ihre stärkste Karte auf.',
          'Die App nimmt für dich die beste aufgedeckte Karte: zuerst Wild-Karten, dann Aktionskarten, dann hohe Zahlen. Wenn du noch eine Karte zurückgeben kannst, geht deine niedrigste Karte an denselben Spieler.',
          'Justice League wählt die aufgedeckten Karten und Tauschkarten automatisch; der Spieler wählt nur die aktive Farbe.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Du spielst Justice League und wählst Blau. Spieler 2 deckt Gelb 8 auf, Spieler 3 Wild +4, Spieler 4 Rot Aussetzen.',
          'Du nimmst die Wild +4 von Spieler 3 und gibst eine niedrige Karte, zum Beispiel Grün 1, an Spieler 3 zurück.',
          'Das Ereignisprotokoll zeigt jede aufgedeckte Karte, die genommene Karte und die zurückgegebene Karte.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Justice League ist besonders stark, wenn mehrere Gegner viele Karten halten, weil über alle anderen Spieler gesucht wird.',
          'Spiele sie, bevor ein Spieler kurz vor UNO eine starke Wild- oder Aktionskarte verstecken kann.',
          'Wähle eine Farbe, die zu deiner Resthand nach dem Tausch passt; danach läuft die Zugreihenfolge normal weiter.',
        ],
      },
    ],
  }
  return sections[language]
}

function starTrekRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Beam Me Up',
        items: [
          'UNO Star Trek plays like Classic UNO for 2 to 4 players: match by color, number, or symbol, or play a Wild card.',
          'Beam Me Up is a Wild card. Choose the next active color and one opponent.',
          'That opponent reveals their strongest card. The app beams that card into the bottom of the draw pile, then the opponent draws 1 replacement card from the top of the draw pile.',
          'Beam Me Up removes the target\'s auto-selected strongest hand card, puts it on the bottom of the draw pile, then gives the target the current top draw-pile card as a replacement.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'You play Beam Me Up, choose green, and target Player 3. Player 3 reveals a Wild +4, so that card is moved into the draw pile and Player 3 draws 1 replacement card.',
          'If the target has several cards, the strongest-card selection prioritizes Wild cards, then action cards, then high numbers.',
          'The event log shows the revealed card, the card beamed into the draw pile, and whether a replacement card was drawn.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Use Beam Me Up against the player with the smallest hand or the player most likely to hold a dangerous Wild card.',
          'Because the target receives a replacement, the effect is best for removing quality rather than increasing card count.',
          'Choose a color that helps your remaining hand after the transporter effect resolves.',
        ],
      },
    ],
    zh: [
      {
        heading: '传送上舰',
        items: [
          'UNO Star Trek 支持 2 到 4 名玩家，基础玩法与经典 UNO 相同：按颜色、数字或符号匹配，也可以打出万能牌。',
          'Beam Me Up 是一张万能牌。打出时选择新的当前颜色，并指定一名对手。',
          '该对手亮出自己最强的一张牌。应用会把这张牌传送到摸牌堆底部，然后该对手从摸牌堆顶部摸 1 张替换牌。',
          'Beam Me Up 会移除目标自动选出的最强手牌，把它放到摸牌堆底部，然后让目标从当前摸牌堆顶部摸 1 张替换牌。',
        ],
      },
      {
        heading: '例子',
        items: [
          '你打出 Beam Me Up，选择绿色并指定玩家 3。玩家 3 亮出 Wild +4，这张牌会被放回摸牌堆，玩家 3 再摸 1 张替换牌。',
          '如果目标有多张牌，自动选择最强牌时优先万能牌，其次功能牌，再比较高数字牌。',
          '事件日志会显示目标亮出的牌、被传送回摸牌堆的牌，以及是否摸到了替换牌。',
        ],
      },
      {
        heading: '策略',
        items: [
          '优先用 Beam Me Up 针对手牌最少、或最可能藏有强力万能牌的玩家。',
          '因为目标会获得一张替换牌，这张牌更适合削弱对手的牌质，而不是增加对手的手牌数量。',
          '选择颜色时要考虑传送效果结算后自己剩余手牌的颜色结构。',
        ],
      },
    ],
    de: [
      {
        heading: 'Beam Me Up',
        items: [
          'UNO Star Trek spielt sich für 2 bis 4 Spieler wie Classic UNO: Lege nach Farbe, Zahl oder Symbol an, oder spiele eine Wild-Karte.',
          'Beam Me Up ist eine Wild-Karte. Wähle die nächste aktive Farbe und einen Gegner.',
          'Dieser Gegner deckt seine stärkste Karte auf. Die App beamt diese Karte unter den Ziehstapel; danach zieht der Gegner 1 Ersatzkarte vom Ziehstapel.',
          'Beam Me Up entfernt die automatisch gewählte stärkste Handkarte des Ziels, legt sie unter den Ziehstapel und gibt dem Ziel die aktuelle oberste Ziehstapelkarte als Ersatz.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Du spielst Beam Me Up, wählst Grün und zielst auf Spieler 3. Spieler 3 deckt Wild +4 auf; diese Karte geht in den Ziehstapel und Spieler 3 zieht 1 Ersatzkarte.',
          'Hat das Ziel mehrere Karten, priorisiert die Auswahl Wild-Karten, dann Aktionskarten, dann hohe Zahlen.',
          'Das Ereignisprotokoll zeigt die aufgedeckte Karte, die gebeamte Karte und ob eine Ersatzkarte gezogen wurde.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Nutze Beam Me Up gegen den Spieler mit den wenigsten Karten oder gegen jemanden, der vermutlich eine starke Wild-Karte hält.',
          'Da das Ziel eine Ersatzkarte bekommt, schwächt der Effekt vor allem die Kartenqualität und nicht die Kartenanzahl.',
          'Wähle eine Farbe, die zu deiner Resthand nach dem Transporter-Effekt passt.',
        ],
      },
    ],
  }
  return sections[language]
}

function avatarRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Avatar State',
        items: [
          'UNO Avatar plays like Classic UNO for 2 to 4 players: match by color, number, or symbol, or play a Wild card.',
          'Avatar State is a Wild card. Choose the next active color, then reveal the top 3 draw-pile cards.',
          'The app keeps the strongest useful revealed card for you and returns the other revealed cards to the draw pile.',
          'Avatar State reveals exactly the top 3 cards of the draw pile; the kept card goes to your hand and the rest return to the bottom of the draw pile.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'You play Avatar State and choose green. The revealed cards are Wild, Yellow Skip, and Red 8.',
          'The Wild is kept because Wild and action cards are stronger than number cards. Yellow Skip and Red 8 return to the draw pile.',
          'If no Wild appears, the app prefers action cards, then cards matching the chosen color, then higher point cards.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Avatar State is a search and setup card, not a direct attack. Use it when your hand lacks playable options.',
          'It is strong late in a round because it can find a Wild or action card without giving cards to an opponent.',
          'Choose a color that helps the hand you already have; the kept card is a bonus, but the active color still drives your next chance.',
        ],
      },
    ],
    zh: [
      {
        heading: '降世神通状态',
        items: [
          'UNO Avatar 支持 2 到 4 名玩家，基础玩法与经典 UNO 相同：按颜色、数字或符号匹配，也可以打出万能牌。',
          'Avatar State 是一张万能牌。打出时先选择新的当前颜色，然后翻开摸牌堆顶部 3 张牌。',
          '应用会为你保留其中最强、最有用的一张牌，其余翻开的牌放回摸牌堆。',
          'Avatar State 正好翻开摸牌堆顶部 3 张牌；保留的牌加入你的手牌，其余牌放回摸牌堆底部。',
        ],
      },
      {
        heading: '例子',
        items: [
          '你打出 Avatar State 并选择绿色。翻开的牌是 Wild、黄色 Skip 和红色 8。',
          'Wild 会被保留，因为万能牌和功能牌通常比数字牌更强。黄色 Skip 和红色 8 会放回摸牌堆。',
          '如果没有翻到 Wild，应用会优先选择功能牌，其次选择符合当前颜色的牌，再比较高分值牌。',
        ],
      },
      {
        heading: '策略',
        items: [
          'Avatar State 是搜索和整理手牌的牌，不是直接攻击牌。当你的手牌缺少可出牌时特别有用。',
          '回合后期它很强，因为它可能帮你找到 Wild 或功能牌，同时不会给对手加牌。',
          '选择颜色时要优先考虑自己已有的手牌；保留的牌是额外收益，但当前颜色仍然决定后续机会。',
        ],
      },
    ],
    de: [
      {
        heading: 'Avatar State',
        items: [
          'UNO Avatar spielt sich für 2 bis 4 Spieler wie Classic UNO: Lege nach Farbe, Zahl oder Symbol an, oder spiele eine Wild-Karte.',
          'Avatar State ist eine Wild-Karte. Wähle die nächste aktive Farbe und decke dann die obersten 3 Karten des Ziehstapels auf.',
          'Die App behält für dich die stärkste nützliche aufgedeckte Karte und legt die anderen aufgedeckten Karten zurück in den Ziehstapel.',
          'Avatar State deckt genau die obersten 3 Karten des Ziehstapels auf; die behaltene Karte geht auf deine Hand, der Rest unter den Ziehstapel.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Du spielst Avatar State und wählst Grün. Aufgedeckt werden Wild, Gelb Aussetzen und Rot 8.',
          'Wild wird behalten, weil Wild- und Aktionskarten stärker sind als Zahlenkarten. Gelb Aussetzen und Rot 8 gehen zurück in den Ziehstapel.',
          'Wenn keine Wild-Karte erscheint, bevorzugt die App Aktionskarten, dann Karten der gewählten Farbe, dann Karten mit höherem Punktwert.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Avatar State ist eine Such- und Aufbaukarte, kein direkter Angriff. Nutze sie, wenn deiner Hand spielbare Optionen fehlen.',
          'Spät in der Runde ist sie stark, weil sie eine Wild- oder Aktionskarte finden kann, ohne einem Gegner Karten zu geben.',
          'Wähle eine Farbe, die zu deiner vorhandenen Hand passt; die behaltene Karte ist ein Bonus, aber die aktive Farbe bleibt wichtig.',
        ],
      },
    ],
  }
  return sections[language]
}

function monsterHighRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Creepy Cool',
        items: [
          'UNO Monster High plays like Classic UNO for 2 to 4 players: match by color, number, or symbol, or play a Wild card.',
          'Creepy Cool is a Wild card. Choose the next active color; every other player reveals 1 random card from hand.',
          'Revealed cards matching the chosen color are discarded. Revealed cards in other colors stay with their owners.',
          'Creepy Cool never uses the draw pile; it reveals one random card from each other player\'s hand.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'You play Creepy Cool and choose blue. AI 2 reveals Blue 7 and discards it, AI 3 reveals Red Skip and keeps it, AI 4 reveals Blue 2 and discards it.',
          'If a player reveals a Wild card, it does not match a normal color and is kept.',
          'The event log shows every revealed card and whether it was discarded or kept.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Creepy Cool is best with three opponents, because it has more chances to hit a matching color.',
          'Choose a color you think opponents are holding, not only the color that helps your own hand.',
          'It can reduce several opponents at once, but it is less reliable than a direct draw penalty.',
        ],
      },
    ],
    zh: [
      {
        heading: '怪酷时刻',
        items: [
          'UNO Monster High 支持 2 到 4 名玩家，基础玩法与经典 UNO 相同：按颜色、数字或符号匹配，也可以打出万能牌。',
          'Creepy Cool 是一张万能牌。打出时选择新的当前颜色；其他每位玩家随机亮出 1 张手牌。',
          '亮出的牌如果匹配所选颜色，就被弃掉。其他颜色的亮出牌保留在原玩家手中。',
          'Creepy Cool 不使用摸牌堆；它只从其他每位玩家的手牌中随机亮出 1 张。',
        ],
      },
      {
        heading: '例子',
        items: [
          '你打出 Creepy Cool 并选择蓝色。AI 2 亮出蓝色 7 并弃掉，AI 3 亮出红色 Skip 并保留，AI 4 亮出蓝色 2 并弃掉。',
          '如果玩家亮出 Wild，它不匹配普通颜色，因此会被保留。',
          '事件日志会显示每位玩家亮出的牌，以及该牌是被弃掉还是被保留。',
        ],
      },
      {
        heading: '策略',
        items: [
          'Creepy Cool 在有三名对手时最强，因为命中所选颜色的机会更多。',
          '选择颜色时要猜测对手可能持有的颜色，而不只是选择对自己手牌有利的颜色。',
          '它可能一次减少多个对手的手牌，但稳定性不如直接摸牌惩罚牌。',
        ],
      },
    ],
    de: [
      {
        heading: 'Creepy Cool',
        items: [
          'UNO Monster High spielt sich für 2 bis 4 Spieler wie Classic UNO: Lege nach Farbe, Zahl oder Symbol an, oder spiele eine Wild-Karte.',
          'Creepy Cool ist eine Wild-Karte. Wähle die nächste aktive Farbe; jeder andere Spieler deckt 1 zufällige Handkarte auf.',
          'Aufgedeckte Karten in der gewählten Farbe werden abgeworfen. Aufgedeckte Karten anderer Farben bleiben bei ihren Besitzern.',
          'Creepy Cool nutzt den Ziehstapel nicht; es deckt nur 1 zufällige Handkarte jedes anderen Spielers auf.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Du spielst Creepy Cool und wählst Blau. KI 2 deckt Blau 7 auf und wirft sie ab, KI 3 deckt Rot Aussetzen auf und behält sie, KI 4 deckt Blau 2 auf und wirft sie ab.',
          'Deckt ein Spieler eine Wild-Karte auf, passt sie zu keiner normalen Farbe und wird behalten.',
          'Das Ereignisprotokoll zeigt jede aufgedeckte Karte und ob sie abgeworfen oder behalten wurde.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Creepy Cool ist mit drei Gegnern am stärksten, weil mehr Karten die gewählte Farbe treffen können.',
          'Wähle eine Farbe, die Gegner vermutlich halten, nicht nur die Farbe, die deiner eigenen Hand hilft.',
          'Die Karte kann mehrere Gegner gleichzeitig reduzieren, ist aber weniger zuverlässig als eine direkte Ziehstrafe.',
        ],
      },
    ],
  }
  return sections[language]
}

function nflRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Touchdown Drive',
        items: [
          'UNO NFL plays like Classic UNO for 2 to 4 players: match by color, number, or symbol, or play a Wild card.',
          'Touchdown is a Wild card. Choose the next active color and choose one opponent as the defender.',
          'Reveal the top draw-pile card as the drive card. The drive card returns to the bottom of the draw pile, so it can appear again later.',
          'The simulated drive always uses the current top card of the draw pile, never a player hand card.',
          'The revealed drive card is placed on the bottom of the draw pile before later draws can reach it.',
        ],
      },
      {
        heading: 'Touchdown Result',
        items: [
          'If the drive card matches your chosen active color, the defender draws 4 cards and loses the turn.',
          'If that defender was the next player in turn order, they are skipped immediately. If the defender sits farther away, they draw 4 now and normal turn order continues.',
          'If the drive card does not match the chosen color, there is no penalty; play continues normally with your chosen active color.',
        ],
      },
      {
        heading: 'Examples and Strategy',
        items: [
          'Example: you choose green and target AI 2. If the drive reveals Green 8, AI 2 draws 4 and loses the turn. If it reveals Red 2, nobody draws.',
          'Pick a color that helps your hand, but also consider colors that are more likely to appear in the draw pile.',
          'Target the next player when you want a true skip. Target a leader farther away when the draw penalty matters more than turn order.',
          'Touchdown is worth 50 points, so use it before another player is close to going out.',
        ],
      },
    ],
    zh: [
      {
        heading: 'Touchdown 进攻',
        items: [
          'UNO NFL 支持 2 到 4 名玩家，基础玩法与经典 UNO 相同：按颜色、数字或符号匹配，也可以打出万能牌。',
          'Touchdown 是一张万能牌。打出时选择新的当前颜色，并选择一名对手作为防守方。',
          '翻开摸牌堆顶牌作为进攻牌。进攻牌会放回摸牌堆底部，因此之后仍然可能被摸到。',
          '模拟进攻始终使用当前摸牌堆顶部的牌，不会使用任何玩家的手牌。',
          '翻开的进攻牌会先放到摸牌堆底部，之后的摸牌才可能再次摸到它。',
        ],
      },
      {
        heading: 'Touchdown 结果',
        items: [
          '如果进攻牌匹配你选择的当前颜色，防守方摸 4 张牌并失去回合。',
          '如果防守方正好是下一位玩家，他会被立即跳过。如果防守方在更后面，他现在摸 4 张，正常顺序继续。',
          '如果进攻牌不匹配所选颜色，则没有惩罚；游戏按你选择的当前颜色继续。',
        ],
      },
      {
        heading: '例子与策略',
        items: [
          '例子：你选择绿色并指定 AI 2。如果进攻牌是绿色 8，AI 2 摸 4 张并失去回合；如果是红色 2，则无人摸牌。',
          '选择颜色时既要考虑自己的手牌，也可以考虑摸牌堆中更可能出现的颜色。',
          '想要真正跳过下一位玩家时，指定下一位玩家；想压制领先者时，可以指定更远的对手。',
          'Touchdown 价值 50 分。如果别人快出完牌，不要把它留在手里太久。',
        ],
      },
    ],
    de: [
      {
        heading: 'Touchdown Drive',
        items: [
          'UNO NFL spielt sich für 2 bis 4 Spieler wie Classic UNO: Lege nach Farbe, Zahl oder Symbol an, oder spiele eine Wild-Karte.',
          'Touchdown ist eine Wild-Karte. Wähle die nächste aktive Farbe und wähle einen Gegner als Verteidiger.',
          'Die oberste Karte des Ziehstapels wird als Drive-Karte aufgedeckt. Danach geht sie unter den Ziehstapel und kann später wieder gezogen werden.',
          'Der simulierte Drive nutzt immer die aktuelle oberste Karte des Ziehstapels, niemals eine Handkarte.',
          'Die aufgedeckte Drive-Karte wird unter den Ziehstapel gelegt, bevor spätere Ziehvorgänge sie wieder erreichen können.',
        ],
      },
      {
        heading: 'Touchdown-Effekt',
        items: [
          'Passt die Drive-Karte zur gewählten aktiven Farbe, zieht der Verteidiger 4 Karten und verliert seinen Zug.',
          'Ist dieser Verteidiger der nächste Spieler in Zugreihenfolge, wird er sofort übersprungen. Sitzt er weiter entfernt, zieht er jetzt 4 und die normale Reihenfolge läuft weiter.',
          'Passt die Drive-Karte nicht zur gewählten Farbe, gibt es keine Strafe; es geht normal mit deiner gewählten aktiven Farbe weiter.',
        ],
      },
      {
        heading: 'Beispiele und Tipps',
        items: [
          'Beispiel: Du wählst Grün und zielst auf KI 2. Wird Grün 8 aufgedeckt, zieht KI 2 4 Karten und verliert den Zug. Wird Rot 2 aufgedeckt, zieht niemand.',
          'Wähle eine Farbe, die deiner Hand hilft, aber denke auch daran, welche Farben wahrscheinlich im Ziehstapel liegen.',
          'Wähle den nächsten Spieler, wenn du wirklich überspringen willst. Wähle einen führenden Spieler weiter hinten, wenn die Ziehstrafe wichtiger ist.',
          'Touchdown zählt 50 Punkte. Spiele sie rechtzeitig, bevor ein anderer Spieler kurz vor dem Rausgehen steht.',
        ],
      },
    ],
  }
  return sections[language]
}

function minecraftRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Minecraft Twist',
        items: [
          'UNO Minecraft plays like Classic UNO: match color, number, symbol, or play a Wild card.',
          'The Creeper card is a Wild card. Choose the next color; the next player draws 3 cards and loses that turn.',
          'Example: if you play Creeper and choose green, the next player immediately draws 3, is skipped, and play continues with green as the active color.',
        ],
      },
      {
        heading: 'Strategy',
        items: [
          'Save Creeper for pressure moments, especially when the next player has one or two cards.',
          'Choose a color that helps your remaining hand, not only the color that hurts the target. You still need to survive your next turn.',
          'Creeper is worth 50 points, so do not hold it too long if another player is close to going out.',
        ],
      },
      {
        heading: 'Winning',
        items: [
          'Call UNO before you play from two cards down to one card.',
          'The round ends when a player empties their hand after all Creeper draw and skip effects are resolved.',
          'Scoring follows Classic UNO: number cards count face value, action cards count 20, and Wild/Creeper cards count 50.',
        ],
      },
    ],
    zh: [
      {
        heading: 'Minecraft 特色',
        items: [
          'UNO Minecraft 的基础玩法与经典 UNO 相同：按颜色、数字、符号匹配，或打出万能牌。',
          '爬行者牌是一张万能牌。打出时选择下一种颜色；下一位玩家摸 3 张牌并跳过回合。',
          '例子：你打出爬行者并选择绿色，下一位玩家立刻摸 3 张并失去回合，之后以绿色继续出牌。',
        ],
      },
      {
        heading: '策略',
        items: [
          '尽量把爬行者留到有压力的时刻，特别是下一位玩家只剩一两张牌时。',
          '选择颜色时优先考虑自己剩下的手牌，而不只是惩罚目标玩家；你还要为下一次行动做准备。',
          '爬行者价值 50 分。如果别人快出完了，不要把它留在手里太久。',
        ],
      },
      {
        heading: '胜利条件',
        items: [
          '从两张牌打到一张牌之前要喊 UNO。',
          '当某位玩家在爬行者摸牌和跳过效果结算后清空手牌，本局结束。',
          '计分按经典 UNO：数字牌按面值，行动牌 20 分，万能牌和爬行者牌 50 分。',
        ],
      },
    ],
    de: [
      {
        heading: 'Minecraft-Twist',
        items: [
          'UNO Minecraft spielt sich wie klassisches UNO: Passe nach Farbe, Zahl oder Symbol, oder spiele eine Wild-Karte.',
          'Die Creeper-Karte ist eine Wild-Karte. Wähle die nächste Farbe; der nächste Spieler zieht 3 Karten und setzt aus.',
          'Beispiel: Spielst du Creeper und wählst Grün, zieht der nächste Spieler sofort 3 Karten, setzt aus, und Grün bleibt die aktive Farbe.',
        ],
      },
      {
        heading: 'Strategie',
        items: [
          'Heb den Creeper für Druckmomente auf, besonders wenn der nächste Spieler nur eine oder zwei Karten hat.',
          'Wähle eine Farbe, die zu deiner restlichen Hand passt, nicht nur eine Farbe, die dem Zielspieler schadet.',
          'Creeper zählt 50 Punkte. Halte ihn nicht zu lange, wenn ein anderer Spieler kurz vor dem Rausgehen steht.',
        ],
      },
      {
        heading: 'Sieg',
        items: [
          'Rufe UNO, bevor du von zwei Karten auf eine Karte herunterspielst.',
          'Die Runde endet, wenn ein Spieler nach allen Creeper-Zieh- und Aussetzen-Effekten keine Handkarten mehr hat.',
          'Gewertet wird wie bei klassischem UNO: Zahlen zählen ihren Wert, Aktionskarten 20, Wild- und Creeper-Karten 50.',
        ],
      },
    ],
  }
  return sections[language]
}

function challengeRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Challenge Flow',
        items: [
          'UNO Challenge Adults Only follows Classic UNO matching, drawing, UNO calls, and leftover-card scoring.',
          'Dare cards replace classic Draw 2 penalties. Wild Dare works like a Dare and also chooses the active color.',
          'When targeted by a Dare, choose either to draw 2 and lose the turn, or roll the Dare die.',
        ],
      },
      {
        heading: 'Dare Die',
        items: [
          '1: the roller draws 4. 2: each other player drops 4 in game direction; the first other player with 4 or fewer cards drops all and wins.',
          '3: the next player drops all cards and wins. 4: the over-next player may drop all after one normal turn.',
          '5: the roller draws until an action card. 6: the roller immediately wins the round.',
        ],
      },
      {
        heading: 'Scoring',
        items: [
          'Number cards score face value.',
          'Skip, Reverse, and Dare score 20. Wild Dare scores 50.',
        ],
      },
    ],
    zh: [
      {
        heading: 'Challenge 流程',
        items: [
          'UNO Challenge Adults Only 保留经典 UNO 的匹配、摸牌、喊 UNO 和剩余手牌计分。',
          'Dare 牌替代经典 +2 惩罚。Wild Dare 既触发 Dare，也选择当前颜色。',
          '被 Dare 指定时，可以选择摸 2 张并失去回合，或掷 Dare 骰子。',
        ],
      },
      {
        heading: 'Dare 骰子',
        items: [
          '掷出 1-4 时，视为完成对应等级的 Dare，然后继续游戏。',
          '掷出 Truth 时，应用内模拟为不回答而摸 4 张。',
          '掷出 Reverse 时，惩罚反弹给打出 Dare 的玩家。',
        ],
      },
      {
        heading: '计分',
        items: [
          '数字牌按面值计分。',
          'Skip、Reverse 和 Dare 计 20 分。Wild Dare 计 50 分。',
        ],
      },
    ],
    de: [
      {
        heading: 'Challenge-Ablauf',
        items: [
          'UNO Challenge Adults Only nutzt Classic UNO für Matchen, Ziehen, UNO-Ruf und Restkartenwertung.',
          'Dare-Karten ersetzen klassische +2-Strafen. Wild Dare lost eine Dare aus und wählt die aktive Farbe.',
          'Wer von einer Dare getroffen wird, zieht entweder 2 und setzt aus oder wirft den Dare-Würfel.',
        ],
      },
      {
        heading: 'Dare-Würfel',
        items: [
          '1: Der Wurf-Spieler zieht 4. 2: Jeder andere Spieler legt in Spielrichtung 4 ab; der erste mit 4 oder weniger Karten legt alles ab und gewinnt.',
          '3: Der nächste Spieler legt alles ab und gewinnt. 4: Der ubernächste Spieler kann nach einem normalen Zug alles ablegen.',
          '5: Der Wurf-Spieler zieht bis zu einer Aktionskarte. 6: Der Wurf-Spieler gewinnt die Runde sofort.',
        ],
      },
      {
        heading: 'Wertung',
        items: [
          'Zahlenkarten zählen ihren Wert.',
          'Skip, Reverse und Dare zählen 20. Wild Dare zählt 50.',
        ],
      },
    ],
  }
  return sections[language]
}

function lordOfTheRingsRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Middle-earth Flow',
        items: [
          'Uno Der Herr der Ringe follows classic UNO matching by color, number, symbol, or Wild.',
          'The deck replaces the blank custom cards with Hunt for the Ring wild cards.',
          'Scoring and UNO calls follow the normal classic rules.',
        ],
      },
      {
        heading: 'Hunt for the Ring',
        items: [
          'Hunt for the Ring is a Wild card: choose the active color and choose one player as the Ring-bearer.',
          'The chosen Ring-bearer draws 3 cards immediately.',
          'After the hunt resolves, normal turn order continues with the next player.',
        ],
      },
    ],
    zh: [
      {
        heading: '中土流程',
        items: [
          'Uno Der Herr der Ringe 按经典 UNO 规则匹配颜色、数字、符号或万能牌。',
          '牌组用 Hunt for the Ring 万能牌替换空白自定义牌。',
          '计分和喊 UNO 按经典规则处理。',
        ],
      },
      {
        heading: 'Hunt for the Ring',
        items: [
          'Hunt for the Ring 是万能牌：选择当前颜色，并指定一名玩家成为持戒者。',
          '被指定的持戒者立刻摸 3 张牌。',
          '效果结算后，按正常顺序轮到下一位玩家。',
        ],
      },
    ],
    de: [
      {
        heading: 'Mittelerde-Ablauf',
        items: [
          'Uno Der Herr der Ringe folgt den klassischen UNO-Regeln nach Farbe, Zahl, Symbol oder Wild.',
          'Das Deck ersetzt die leeren Custom-Karten durch Hunt-for-the-Ring-Wild-Karten.',
          'Wertung und UNO-Rufe folgen den normalen klassischen Regeln.',
        ],
      },
      {
        heading: 'Hunt for the Ring',
        items: [
          'Hunt for the Ring ist eine Wild-Karte: Wähle die aktive Farbe und einen Spieler als Ringträger.',
          'Der gewählte Ringträger zieht sofort 3 Karten.',
          'Nach der Jagd geht die normale Zugreihenfolge mit dem nächsten Spieler weiter.',
        ],
      },
    ],
  }
  return sections[language]
}

function commonRuleSections(language: Language, config: GameConfig): RuleSection[] {
  if (config.game === 'h2o' && config.h2oSplash) {
    const splashScoring: Record<Language, RuleSection[]> = {
      en: [
        {
          heading: 'Splash Scoring',
          items: [
            'Traditional leftover-card point scoring is disabled in the Splash variation.',
            'A hand winner receives 1 hand point.',
            'The session winner is the first player to win 3 hands.',
          ],
        },
      ],
      zh: [
        {
          heading: 'Splash 计分',
          items: [
            'Splash 变体不使用剩余手牌点数计分。',
            '每局获胜者获得 1 个胜局点。',
            '第一位赢得 3 局的玩家赢得本次会话。',
          ],
        },
      ],
      de: [
        {
          heading: 'Splash-Wertung',
          items: [
            'Die Splash-Variante nutzt keine Restkarten-Punktwertung.',
            'Der Gewinner einer Hand erhält 1 Handpunkt.',
            'Die Sitzung gewinnt, wer zuerst 3 Hande gewinnt.',
          ],
        },
      ],
    }
    return splashScoring[language]
  }

  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Scoring',
        items: [
          `A round ends when one player has no cards. That player scores the point value of all cards left in opponents' hands.`,
          `Number cards score face value. Most action cards score 20. Wild cards and major Wild actions score 50.`,
          `The session winner is the first player to reach ${config.targetScore} points or more.`,
        ],
      },
    ],
    zh: [
      {
        heading: '计分',
        items: [
          '当一名玩家出完所有手牌时，本局结束。该玩家获得其他玩家剩余手牌的总分。',
          '数字牌按牌面数字计分。大多数功能牌为 20 分。万能牌和主要万能功能牌为 50 分。',
          `本次会话中，第一位达到或超过 ${config.targetScore} 分的玩家获胜。`,
        ],
      },
    ],
    de: [
      {
        heading: 'Wertung',
        items: [
          'Eine Runde endet, wenn ein Spieler keine Karten mehr hat. Dieser Spieler bekommt die Punkte aller Restkarten der Gegner.',
          'Zahlenkarten zählen ihren Wert. Die meisten Aktionskarten zählen 20. Wild-Karten und starke Wild-Aktionen zählen 50.',
          `Die Sitzung gewinnt, wer zuerst ${config.targetScore} Punkte oder mehr erreicht.`,
        ],
      },
    ],
  }
  return sections[language]
}

function skipBoRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Goal and Setup',
        items: [
          'Win by emptying your personal stock pile first. The stock pile is the face-up pile next to your name.',
          'The deck has 162 cards: twelve each of 1-12 plus eighteen Skip-Bo wild cards.',
          'With 2-4 players, each player gets a 30-card stock pile. With 5-6 players, each player gets 20 stock cards.',
          'You start with no hand cards. At the start of each turn, draw until you have five cards in hand.',
        ],
      },
      {
        heading: 'Turn Flow',
        items: [
          'After drawing to five, build on the four center piles. Each build pile starts at 1 and climbs in order to 12.',
          'You may play the top stock card, any hand card, or the top card of one of your four discard piles if it is the next needed number.',
          'A Skip-Bo wild card can be played as whatever number the chosen build pile currently needs.',
          'When a build pile reaches 12, it clears and becomes available to start again at 1.',
          'If you play all five hand cards during your turn, immediately draw back up to five and continue the same turn.',
          'To end your turn in this app, choose Discard 1-4, then click one hand card. That card goes to the selected discard pile.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'If a center pile is empty, it needs a 1. You may play a 1 or a Skip-Bo wild.',
          'If a center pile shows 7 on top, it needs 8 next. A 9 cannot be played there yet.',
          'Discard piles are personal storage. Only the top card of each discard pile is playable later.',
        ],
      },
      {
        heading: 'Tips',
        items: [
          'Prioritize the stock pile whenever possible, because only an empty stock pile wins the game.',
          'Keep discard piles organized. Building descending stacks, such as 9 over 10 over 11, can make future turns easier.',
          'Use Skip-Bo wilds to unlock stock cards or complete a pile to 12, not just to spend a hand card.',
          'Watch the center piles before discarding; a card that cannot build now may be useful after another pile advances.',
        ],
      },
      {
        heading: 'Winning',
        items: [
          'The round ends immediately when a player plays the last card from their stock pile.',
          'This slice treats that player as the Skip-Bo winner for the session.',
        ],
      },
    ],
    zh: [
      {
        heading: '目标与设置',
        items: [
          '最先清空自己库存牌堆的玩家获胜。库存牌堆是玩家名字旁边正面朝上的牌堆。',
          '牌组共有 162 张：1 到 12 每个数字各 12 张，另有 18 张 Skip-Bo 万能牌。',
          '2-4 人游戏时，每位玩家有 30 张库存牌；5-6 人游戏时，每位玩家有 20 张库存牌。',
          '开局没有手牌。每个回合开始时，先摸牌直到手牌有 5 张。',
        ],
      },
      {
        heading: '回合流程',
        items: [
          '摸到 5 张后，在中间四个建筑堆上出牌。每个建筑堆从 1 开始，按顺序一直建到 12。',
          '如果数字正好是建筑堆需要的下一张，你可以出库存牌顶牌、任意手牌、或自己四个弃牌堆的顶牌。',
          'Skip-Bo 万能牌可以当作所选建筑堆当前需要的数字。',
          '建筑堆到达 12 后会清空，然后可以重新从 1 开始。',
          '如果你在同一回合打光了 5 张手牌，立即再摸到 5 张，并继续同一个回合。',
          '在本应用中，结束回合时先选择“弃到堆 1-4”，再点击一张手牌；该牌会进入所选弃牌堆。',
        ],
      },
      {
        heading: '例子',
        items: [
          '空建筑堆需要 1。你可以出 1，也可以出 Skip-Bo 万能牌。',
          '如果建筑堆顶牌是 7，下一张需要 8；9 还不能出到这个堆。',
          '弃牌堆是自己的临时仓库。之后只有每个弃牌堆最上面那张可以再出。',
        ],
      },
      {
        heading: '技巧',
        items: [
          '只要能出库存牌，通常应优先出库存牌，因为只有清空库存牌堆才会获胜。',
          '尽量整理弃牌堆。例如把 9 放在 10 上、10 放在 11 上，之后更容易连续打出。',
          'Skip-Bo 万能牌最好用来解锁库存牌，或补到 12 清空建筑堆，而不是随便消耗手牌。',
          '弃牌前先看中间建筑堆；现在不能出的牌，可能在别人推进建筑堆后马上有用。',
        ],
      },
      {
        heading: '获胜',
        items: [
          '当一名玩家打出库存牌堆的最后一张牌时，本局立即结束。',
          '这一切片中，该玩家直接成为本次 Skip-Bo 游戏的赢家。',
        ],
      },
    ],
    de: [
      {
        heading: 'Ziel und Aufbau',
        items: [
          'Du gewinnst, indem du deinen eigenen Stockstapel zuerst leer spielst. Der Stockstapel liegt offen neben deinem Namen.',
          'Das Deck hat 162 Karten: je zwolf Karten von 1-12 plus achtzehn Skip-Bo-Wild-Karten.',
          'Bei 2-4 Spielern bekommt jeder 30 Stockkarten. Bei 5-6 Spielern bekommt jeder 20 Stockkarten.',
          'Du startest ohne Handkarten. Zu Beginn jedes Zuges ziehst du auf fünf Handkarten.',
        ],
      },
      {
        heading: 'Zugablauf',
        items: [
          'Nach dem Ziehen baust du auf den vier mittleren Bau-Stapeln. Jeder Stapel beginnt mit 1 und steigt der Reihe nach bis 12.',
          'Du darfst die oberste Stockkarte, eine Handkarte oder die oberste Karte eines deiner vier Ablagestapel spielen, wenn sie die nächste benötigte Zahl ist.',
          'Eine Skip-Bo-Wild-Karte zählt als die Zahl, die der gewählte Bau-Stapel gerade braucht.',
          'Wenn ein Bau-Stapel 12 erreicht, wird er geraumt und kann wieder bei 1 starten.',
          'Wenn du alle fünf Handkarten in deinem Zug spielst, ziehst du sofort wieder auf fünf und setzt denselben Zug fort.',
          'Zum Beenden in dieser App wählst du Ablage 1-4 und klickst danach eine Handkarte.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Ein leerer Bau-Stapel braucht eine 1. Du kannst eine 1 oder eine Skip-Bo-Wild-Karte spielen.',
          'Liegt oben eine 7, braucht der Stapel als Nächstes eine 8. Eine 9 passt dort noch nicht.',
          'Ablagestapel sind dein eigener Speicher. Spater ist nur die oberste Karte jedes Ablagestapels spielbar.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Spiele den Stockstapel bevorzugt, wann immer es geht, denn nur ein leerer Stockstapel gewinnt.',
          'Ordne Ablagen bewusst. Absteigende Stapel wie 9 uber 10 uber 11 helfen oft in spateren Zugen.',
          'Nutze Skip-Bo-Wilds, um Stockkarten freizuschalten oder einen Bau-Stapel bis 12 zu beenden.',
          'Prufe vor dem Ablegen die Mitte; eine Karte, die jetzt nicht passt, kann nach dem nächsten Bau-Schritt wichtig werden.',
        ],
      },
      {
        heading: 'Gewinnen',
        items: [
          'Die Runde endet sofort, wenn ein Spieler die letzte Karte seines Stockstapels spielt.',
          'In diesem Slice ist dieser Spieler direkt der Skip-Bo-Sieger der Sitzung.',
        ],
      },
    ],
  }
  return sections[language]
}

function mahjongRuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Goal',
        items: [
          'Build a complete hand: four melds plus one pair, or seven pairs.',
          'A meld can be a chow sequence, a pong triplet, or a kong four-of-a-kind.',
          'The first implementation uses the standard rule profile; more regional variants can be added later.',
        ],
      },
      {
        heading: 'Turn Flow',
        items: [
          'On your turn, draw from the wall, then discard one tile.',
          'Flowers and seasons are exposed immediately and replaced from the dead wall.',
          'After a discard, other players may claim win, kong, pong, or chow. Chow is only available to the next player.',
        ],
      },
      {
        heading: 'Scoring Skeleton',
        items: [
          'Discard win: the discarder pays the winner.',
          'Self-draw: all three opponents pay the winner.',
          'This slice uses simple base scoring while the full pattern scoring remains open for a later refinement.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'Valid chow example: 3, 4, 5 in the same suit. Winds and dragons cannot form a chow.',
          'Valid pong example: three identical red dragons. You may pong from any player discard if you already hold the matching pair.',
          'A winning hand example is 1-2-3 dots, 4-5-6 bamboo, 7-8-9 characters, three east winds, plus a pair.',
        ],
      },
      {
        heading: 'Strategy Tips',
        items: [
          'Keep pairs unless another discard is clearly weaker; a pair can become your pair or grow into a pong.',
          'Protect two-sided waits such as 3-4 waiting for 2 or 5. They are stronger than edge waits like 1-2 waiting only for 3.',
          'Open melds can speed up the hand, but too many exposed sets make your plan easier to read and reduce flexibility.',
          'Late in the round, isolated honors and terminal tiles are usually safer to discard before breaking connected shapes.',
        ],
      },
    ],
    zh: [
      {
        heading: '目标',
        items: [
          '完成胡牌牌型：四副面子加一对将，或七对子。',
          '面子可以是顺子、刻子或杠。',
          '当前先使用标准规则框架，后续可以继续加入不同地区规则。',
        ],
      },
      {
        heading: '流程',
        items: [
          '轮到你时，先摸牌，再打一张牌。',
          '花牌和季牌会立刻明示，并从岭上牌补牌。',
          '有人打牌后，其他玩家可以胡、杠、碰或吃。只有下家可以吃。',
        ],
      },
      {
        heading: '计分框架',
        items: [
          '点炮胡：放炮者支付给赢家。',
          '自摸：其他三家都支付给赢家。',
          '当前先使用基础计分，完整番型计分保留到后续细化。',
        ],
      },
      {
        heading: '例子',
        items: [
          '合法顺子例子：同一花色的3、4、5。风牌和箭牌不能组成顺子。',
          '合法碰牌例子：三张红中。如果你手里已有一对，任何玩家打出第三张时都可以碰。',
          '胡牌例子：一二三筒、四五六条、七八九万、东风刻子，再加一对将。',
        ],
      },
      {
        heading: '策略提示',
        items: [
          '尽量保留对子，除非有明显更弱的孤张；对子可以做将，也可能发展成碰。',
          '重视两面听，例如3、4可以等2或5，通常比1、2只能等3更灵活。',
          '吃碰可以加快成牌，但副露太多会暴露牌路，也会降低手牌弹性。',
          '牌局后期，孤张字牌和边张幺九通常比拆掉连张更适合先打出。',
        ],
      },
    ],
    de: [
      {
        heading: 'Ziel',
        items: [
          'Vervollständige eine Hand: vier Meldungen plus ein Paar oder sieben Paare.',
          'Eine Meldung ist Chow, Pong oder Kong.',
          'Diese Version nutzt zuerst das Standardprofil; regionale Varianten bleiben später ergänzbar.',
        ],
      },
      {
        heading: 'Ablauf',
        items: [
          'In deinem Zug ziehst du aus der Mauer und wirfst danach einen Stein ab.',
          'Blumen und Jahreszeiten werden sofort offen gelegt und aus der toten Mauer ersetzt.',
          'Nach einer Ablage können andere Spieler Sieg, Kong, Pong oder Chow melden. Chow geht nur für den nächsten Spieler.',
        ],
      },
      {
        heading: 'Wertung',
        items: [
          'Sieg auf Ablage: Der abwerfende Spieler zählt an den Gewinner.',
          'Selbst gezogen: Alle drei Gegner zählen an den Gewinner.',
          'Diese erste Version nutzt einfache Basispunkte; vollständige Musterwertung kommt später.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Gültiges Chow-Beispiel: 3, 4, 5 in derselben Farbe. Winde und Drachen können kein Chow bilden.',
          'Gültiges Pong-Beispiel: drei identische rote Drachen. Du darfst von jeder Ablage pongen, wenn du das passende Paar hältst.',
          'Eine Gewinnhand kann 1-2-3 Kreise, 4-5-6 Bambus, 7-8-9 Zeichen, drei Ostwinde und ein Paar sein.',
        ],
      },
      {
        heading: 'Strategietipps',
        items: [
          'Bewahre Paare, solange kein anderer Abwurf deutlich schwächer ist; ein Paar kann dein Paar bleiben oder zum Pong wachsen.',
          'Schütze beidseitige Warten wie 3-4 auf 2 oder 5. Sie sind stärker als Randwarten wie 1-2 nur auf 3.',
          'Offene Meldungen machen die Hand schneller, zeigen aber deinen Plan und verringern die Flexibilität.',
          'Spät in der Runde sind isolierte Ehrensteine und Randsteine oft bessere Abwürfe als verbundene Formen.',
        ],
      },
    ],
  }
  return sections[language]
}

function guoUnoMahjongRuleSections(language: Language): RuleSection[] {
  const mapping: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'UNO Card Mapping',
        items: [
          'This variant uses Mahjong rules with UNO-styled 3D cards.',
          'Red 1-9 are Wan, yellow 1-9 are Bing, and blue 1-9 are Tiao.',
          'Green cards are honors: East, South, West, North, Red Dragon, Green Dragon, and White Dragon.',
          'Wild-style cards are the bonus flowers and seasons: Spring, Summer, Autumn, Winter, Plum, Orchid, Bamboo, and Chrysanthemum.',
        ],
      },
      {
        heading: 'Important Difference',
        items: [
          'You do not match the discard by UNO color or number. Draw, discard, claim chow/pong/kong, and declare win exactly like Mahjong.',
          'The table uses the selected Mahjong felt, frame, center pattern, and deck visuals; the golden color is only for the game tile on the selection screen.',
        ],
      },
    ],
    zh: [
      {
        heading: 'UNO 牌到麻将牌的映射',
        items: [
          '这个变体使用麻将规则，但桌面上显示为 UNO 风格的 3D 卡牌。',
          '红色 1-9 对应万，黄色 1-9 对应饼，蓝色 1-9 对应条。',
          '绿色牌对应字牌：东、南、西、北、中、发、白。',
          'Wild 风格牌对应花牌和季牌：春、夏、秋、冬、梅、兰、竹、菊。',
        ],
      },
      {
        heading: '重要区别',
        items: [
          '这里不是按 UNO 颜色或数字匹配弃牌。流程按麻将进行：摸牌、打牌、吃、碰、杠、胡。',
          '牌桌颜色使用已选择的 Mahjong felt、边框、中心图案和牌面风格；金色背景只用于游戏选择页面的游戏卡片。',
        ],
      },
    ],
    de: [
      {
        heading: 'UNO-Karten als Mahjong',
        items: [
          'Diese Variante nutzt Mahjong-Regeln, zeigt die Steine aber als UNO-artige 3D-Karten.',
          'Rot 1-9 ist Wan, Gelb 1-9 ist Bing und Blau 1-9 ist Tiao.',
          'Grüne Karten sind Ehrenkarten: Ost, Süd, West, Nord, Roter Drache, Grüner Drache und Weißer Drache.',
          'Wild-Karten sind Bonuskarten: Fruehling, Sommer, Herbst, Winter, Pflaume, Orchidee, Bambus und Chrysantheme.',
        ],
      },
      {
        heading: 'Wichtiger Unterschied',
        items: [
          'Du matchst nicht nach UNO-Farbe oder UNO-Zahl. Ziehen, abwerfen, Chow/Pong/Kong melden und gewinnen laufen wie bei Mahjong.',
          'Der Tisch nutzt die gewählten Mahjong-Filz-, Rahmen-, Mittelmotiv- und Deck-Optionen; Gold ist nur die Kachel im Spielauswahlbildschirm.',
        ],
      },
    ],
  }
  return [...mapping[language], ...mahjongRuleSections(language)]
}

function phase10RuleSections(language: Language): RuleSection[] {
  const sections: Record<Language, RuleSection[]> = {
    en: [
      {
        heading: 'Goal and Setup',
        items: [
          'Be the first player to complete phase 10. Each player starts with ten cards and begins on phase 1.',
          'The deck has number cards 1-12 in four colors, plus Wild and Skip cards.',
          'Scores are penalty points from cards left in hand. Lower score matters if more than one player finishes phase 10.',
        ],
      },
      {
        heading: 'Turn Flow',
        items: [
          'Start your turn by drawing from the deck or taking the top discard.',
          'Even if your starting ten cards already satisfy the phase, you still draw or take discard first.',
          'After drawing, lay your current phase if your hand can satisfy it. Wild cards can stand for missing numbers or colors.',
          'End your turn by clicking one hand card to discard. If you have no cards after discarding, the round ends.',
          'You do not begin the next phase during the same round. Example: after laying phase 1, discard your remaining cards; phase 2 starts next round with ten new cards.',
        ],
      },
      {
        heading: 'The Ten Phases',
        items: [
          '1: two three-card sets. 2: one three-card set plus one run of 4. 3: one four-card set plus one run of 4.',
          '4: one run of 7. 5: one run of 8. 6: one run of 9. 7: two four-card sets.',
          '8: seven cards of one color. 9: one five-card set plus one pair. 10: one five-card set plus one three-card set.',
        ],
      },
      {
        heading: 'Examples',
        items: [
          'A set means same number, any colors. A four-card set needs four cards in that group, for example 4, 4, 4, and Wild.',
          'A run means consecutive numbers, any colors. Example: 5, 6, 7, 8 completes a run of 4.',
          'A color phase needs one color, but the numbers do not need to be consecutive. Example: seven blue cards of any values completes phase 8.',
        ],
      },
      {
        heading: 'Wilds, Skips, and Going Out',
        items: [
          'Wild can replace any missing number in a set or run, or any missing color card in phase 8.',
          'Skip cannot be part of a phase. In this slice, discarding Skip ends your turn and skips the next player.',
          'After you lay your phase, you still need to get rid of remaining cards. After drawing, click compatible cards to hit them onto completed phases, or click a non-compatible card to discard and end the turn.',
        ],
      },
      {
        heading: 'Scoring and Winning',
        items: [
          'Only players who laid their phase advance to the next phase after the round.',
          'Cards left in hand count as penalty points: 1-9 are 5 points, 10-12 are 10 points, Skip is 15, and Wild is 25.',
          'The session winner is the player who completes phase 10. If more than one player reaches that point, the lower total score wins.',
        ],
      },
      {
        heading: 'Tips',
        items: [
          'Early phases reward duplicates; later phases reward long runs, so avoid discarding cards near the middle of a possible run.',
          'Wilds are strongest when they finish a long run or the larger set in phases 9 and 10.',
          'Taking discard is useful when it immediately completes your phase, but it also reveals what you are collecting.',
          'If the next player keeps taking the same number or color from discard, avoid feeding that pattern unless it helps you go out.',
        ],
      },
    ],
    zh: [
      {
        heading: '目标与设置',
        items: [
          '目标是最先完成第 10 阶段。每位玩家起手十张牌，从第 1 阶段开始。',
          '牌堆包含四种颜色的 1-12 数字牌，以及 Wild 和 Skip。',
          '分数是手牌剩余罚分；如果多人完成第 10 阶段，低分更有优势。',
        ],
      },
      {
        heading: '回合流程',
        items: [
          '回合开始时，从牌堆摸一张，或拿走弃牌堆顶牌。',
          '即使起手十张牌已经满足阶段，也必须先摸牌或拿弃牌。',
          '摸牌后，如果手牌满足当前阶段，可以点击“完成阶段”。Wild 可以替代缺少的数字或颜色。',
          '最后点击一张手牌弃掉来结束回合。弃牌后如果手牌为空，本轮结束。',
          '同一轮内不会立刻开始下一阶段。例：完成第 1 阶段后，继续弃掉剩余手牌；第 2 阶段会在下一轮以新的十张手牌开始。',
        ],
      },
      {
        heading: '十个阶段',
        items: [
          '1：两组三张相同数字。2：一组三张 + 四张顺子。3：一组四张 + 四张顺子。',
          '4：七张顺子。5：八张顺子。6：九张顺子。7：两组四张相同数字。',
          '8：七张同色牌。9：一组五张 + 一组两张。10：一组五张 + 一组三张。',
        ],
      },
      {
        heading: '例子',
        items: [
          '“组”表示相同数字、颜色不限。例如：红 4、蓝 4、Wild 可以完成一组三张。',
          '“顺子”表示连续数字、颜色不限。例如：5、6、7、8 可以完成四张顺子。',
          '同色阶段只要求颜色相同，不要求连续数字。例如：任意七张蓝色牌可以完成第 8 阶段。',
        ],
      },
      {
        heading: 'Wild、Skip 和出完手牌',
        items: [
          'Wild 可以替代组或顺子中缺少的数字，也可以替代第 8 阶段中缺少的同色牌。',
          'Skip 不能放进阶段组合。本版本中，弃掉 Skip 会结束你的回合并跳过下一位玩家。',
          '完成阶段后还要继续减少剩余手牌。摸牌后，点击能接到已完成阶段的牌来接牌；点击不能接的牌会弃掉并结束回合。',
        ],
      },
      {
        heading: '计分与获胜',
        items: [
          '一轮结束后，只有已经完成当前阶段的玩家会进入下一阶段。',
          '剩余手牌是罚分：1-9 为 5 分，10-12 为 10 分，Skip 为 15 分，Wild 为 25 分。',
          '完成第 10 阶段的玩家赢得整场游戏；如果多人完成第 10 阶段，总罚分更低者获胜。',
        ],
      },
      {
        heading: '技巧',
        items: [
          '前期阶段需要对子和多张同数字；后期阶段需要长顺子，所以不要轻易弃掉顺子中间的数字。',
          'Wild 最适合用来补长顺子，或补第 9、第 10 阶段里的大组合。',
          '拿弃牌可以快速完成阶段，但也会暴露你正在收集什么。',
          '如果下一位玩家一直拿相同数字或颜色的弃牌，尽量不要继续喂给他需要的牌，除非你马上能出完。',
        ],
      },
    ],
    de: [
      {
        heading: 'Ziel und Aufbau',
        items: [
          'Ziel ist es, zuerst Phase 10 abzuschließen. Jede Person startet mit zehn Karten und beginnt bei Phase 1.',
          'Das Deck enthält Zahlenkarten 1-12 in vier Farben sowie Wild- und Skip-Karten.',
          'Punkte sind Strafpunkte aus Restkarten. Bei mehreren Abschlüssen von Phase 10 zählt die niedrigere Punktzahl.',
        ],
      },
      {
        heading: 'Zugablauf',
        items: [
          'Beginne deinen Zug, indem du vom Stapel ziehst oder die oberste Ablage nimmst.',
          'Auch wenn deine zehn Startkarten die Phase schon erfüllen, musst du zuerst ziehen oder die Ablage nehmen.',
          'Nach dem Ziehen kannst du deine aktuelle Phase legen, wenn deine Hand sie erfüllt. Wilds ersetzen fehlende Zahlen oder Farben.',
          'Beende den Zug, indem du eine Handkarte zum Abwerfen anklickst. Hast du danach keine Karten, endet die Runde.',
          'Du beginnst die nächste Phase nicht in derselben Runde. Beispiel: Nach Phase 1 wirfst du deine Restkarten ab; Phase 2 startet in der nächsten Runde mit zehn neuen Karten.',
        ],
      },
      {
        heading: 'Die zehn Phasen',
        items: [
          '1: zwei Drillinge. 2: ein Drilling plus eine Viererfolge. 3: ein Vierling plus eine Viererfolge.',
          '4: Siebenerfolge. 5: Achterfolge. 6: Neunerfolge. 7: zwei Vierlinge.',
          '8: sieben Karten einer Farbe. 9: ein Fünfling plus ein Paar. 10: ein Fünfling plus ein Drilling.',
        ],
      },
      {
        heading: 'Beispiele',
        items: [
          'Ein Satz bedeutet gleiche Zahl, beliebige Farben. Beispiel: rote 4, blaue 4 und Wild ergeben einen Drilling.',
          'Eine Folge bedeutet aufeinanderfolgende Zahlen, beliebige Farben. Beispiel: 5, 6, 7, 8 ergibt eine Viererfolge.',
          'Eine Farbphase braucht nur dieselbe Farbe, keine Folge. Beispiel: sieben beliebige blaue Karten erfüllen Phase 8.',
        ],
      },
      {
        heading: 'Wilds, Skips und Ausgehen',
        items: [
          'Wild ersetzt eine fehlende Zahl in Satz oder Folge oder eine fehlende Farbkarte in Phase 8.',
          'Skip darf nicht in eine Phase gelegt werden. In diesem Stand beendet ein abgeworfener Skip deinen Zug und überspringt die nächste Person.',
          'Nach dem Legen der Phase musst du Restkarten loswerden. Nach dem Ziehen klickst du passende Karten zum Anlegen oder eine nicht passende Karte zum Abwerfen und Zugende.',
        ],
      },
      {
        heading: 'Wertung und Sieg',
        items: [
          'Nach einer Runde kommen nur Spieler weiter, die ihre aktuelle Phase gelegt haben.',
          'Restkarten zählen Strafpunkte: 1-9 sind 5 Punkte, 10-12 sind 10, Skip ist 15 und Wild ist 25.',
          'Die Sitzung gewinnt, wer Phase 10 abschließt. Schaffen das mehrere Spieler, gewinnt die niedrigere Gesamtpunktzahl.',
        ],
      },
      {
        heading: 'Tipps',
        items: [
          'Frühe Phasen belohnen gleiche Zahlen; spätere Phasen brauchen lange Folgen. Wirf Mittelwerte einer möglichen Folge nicht zu früh ab.',
          'Wilds sind am stärksten, wenn sie eine lange Folge oder die große Gruppe in Phase 9 oder 10 schließen.',
          'Die Ablage zu nehmen ist stark, wenn sie sofort deine Phase vervollständigt, verrät aber auch deine Sammlung.',
          'Wenn die nächste Person ständig dieselbe Zahl oder Farbe von der Ablage nimmt, füttere dieses Muster nicht weiter, außer du kannst direkt ausmachen.',
        ],
      },
    ],
  }
  return sections[language]
}

function selectedAddOnRules(language: Language, config: GameConfig): string[] {
  const copy: Record<Language, Record<AddOnPack, string>> = {
    en: {
      reverse: 'Reverse pack: No U can bounce draw penalties back; reverse action cards add direction-changing pressure.',
      stack: 'Stack pack: draw cards can be stacked so the penalty grows until a player accepts it.',
      speed: 'Speed pack: Speed and Lightning cards can force immediate follow-up plays or table-wide quick effects.',
      swap: 'Swap pack: swap and pass cards move hands between players, sometimes after a draw penalty.',
    },
    zh: {
      reverse: '反转扩展包：No U 可以反弹摸牌惩罚；反转功能牌会带来改变方向的压力。',
      stack: '叠加扩展包：摸牌牌可以叠加，直到某位玩家接受不断增加的惩罚。',
      speed: '加速扩展包：加速和闪电牌可以要求立即追打，或触发全桌快速效果。',
      swap: '换手牌扩展包：交换和传递牌会让玩家之间移动手牌，有时会附带摸牌惩罚。',
    },
    de: {
      reverse: 'Reverse-Pack: No U kann Ziehstrafen zurückwerfen; Reverse-Aktionskarten erzeugen Druck durch Richtungswechsel.',
      stack: 'Stack-Pack: Ziehkarten können gestapelt werden, bis ein Spieler die wachsende Strafe akzeptiert.',
      speed: 'Speed-Pack: Speed- und Blitzkarten erzwingen sofortige Anschlusszüge oder schnelle Effekte für alle.',
      swap: 'Swap-Pack: Tausch- und Weitergabekarten verschieben Hande zwischen Spielern, teils nach einer Ziehstrafe.',
    },
  }
  return (Object.keys(config.addOns) as AddOnPack[]).filter((pack) => config.addOns[pack]).map((pack) => copy[language][pack])
}

function addOnHeading(language: Language): string {
  if (language === 'zh') return '已启用扩展包'
  if (language === 'de') return 'Aktive Erweiterungen'
  return 'Enabled Add-on Packs'
}

function applyWifiAction(state: GameState, clientId: string, action: WifiPlayerAction): { state: GameState; sound?: Parameters<SoundManager['play']>[0] } | null {
  if (action.type === 'liarAccept') {
    if (!state.pendingLiarChallenge) return null
    return { state: acceptLiarClaim(state), sound: 'action' }
  }
  if (action.type === 'liarChallenge') {
    if (!state.pendingLiarChallenge || state.pendingLiarChallenge.sourcePlayerId === clientId) return null
    return { state: challengeLiarClaim(state, clientId), sound: 'action' }
  }
  if (action.type === 'speedPlay') {
    const result = speedPlayCutIn(state, clientId, action.cardId)
    if (result.needsChoice) return null
    return { state: result.state, sound: result.sound }
  }

  const current = activePlayer(state)
  if (current.id !== clientId || current.type !== 'human') return null

  if (action.type === 'teamPass') return { state: passCardToPartner(state, clientId, action.cardId), sound: 'play' }
  if (action.type === 'playCard') {
    const result = playCard(state, action.cardId, action.choice)
    if (result.needsChoice) return null
    return { state: result.state, sound: result.sound }
  }
  if (action.type === 'drawOne') return { state: drawOne(state), sound: isLauncherGame(state.config.game) ? 'launcher' : 'draw' }
  if (action.type === 'endTurn') return { state: endTurn(state), sound: 'play' }
  if (action.type === 'resolvePendingDraw') return { state: resolvePendingDraw(state, action.challenge), sound: action.challenge ? 'action' : 'draw' }
  if (action.type === 'resolvePendingDare') return { state: resolvePendingDare(state, action.resolution), sound: action.resolution === 'draw' ? 'draw' : 'action' }
  if (action.type === 'resolvePendingEmoji') return { state: resolvePendingEmoji(state, action.resolution), sound: action.resolution === 'draw4' ? 'draw' : 'action' }
  if (action.type === 'callUno') return { state: callUno(state, clientId), sound: 'uno' }
  if (action.type === 'catchUno') return { state: catchUno(state), sound: isLauncherGame(state.config.game) ? 'launcher' : 'action' }
  if (action.type === 'zeroTakeDiscard') return { state: zeroTakeDiscard(state), sound: 'draw' }
  if (action.type === 'zeroDiscardDrawn') return { state: zeroDiscardDrawn(state), sound: 'play' }
  if (action.type === 'zeroSwapGrid') return { state: zeroSwapDrawnIntoGrid(state, action.slotIndex), sound: 'play' }
  if (action.type === 'caboResolvePower') return { state: caboResolvePower(state, action.targetPlayerId, action.slotIndex), sound: 'play' }
  if (action.type === 'caboCall') return { state: caboCall(state), sound: 'uno' }
  if (action.type === 'phase10TakeDiscard') return { state: phase10TakeDiscard(state), sound: 'draw' }
  if (action.type === 'phase10CompletePhase') return { state: phase10CompletePhase(state), sound: 'play' }
  if (action.type === 'skipBoDiscard') return { state: skipBoDiscardToPile(state, action.cardId, action.pileIndex), sound: 'play' }
  if (action.type === 'memorySelectSlot') return { state: memorySelectSlot(state, action.slotIndex), sound: 'play' }
  if (action.type === 'passageTake') return { state: passageTakeCard(state, action.source), sound: 'draw' }
  if (action.type === 'passagePair') return { state: passagePairWithCard(state, action.cardId), sound: 'play' }
  if (action.type === 'passageSkipPair') return { state: passageSkipPair(state), sound: 'play' }
  if (action.type === 'passagePass') return { state: passagePassCard(state, action.cardId, action.faceDown), sound: 'play' }
  return null
}

function applyMahjongWifiAction(state: MahjongState, clientId: string, action: WifiPlayerAction): { state: MahjongState; sound?: Parameters<SoundManager['play']>[0] } | null {
  const controlPlayerId = localMahjongControlPlayerId(state, 'wifi', clientId)
  if (controlPlayerId !== clientId) return null
  if (action.type === 'mahjongDraw') return { state: mahjongDraw(state), sound: 'draw' }
  if (action.type === 'mahjongDiscard') return { state: mahjongDiscard(state, action.tileId), sound: 'play' }
  if (action.type === 'mahjongDeclareWin') return { state: mahjongDeclareWin(state), sound: 'win' }
  if (action.type === 'mahjongDeclareKong') return { state: mahjongDeclareKong(state, action.tileId), sound: 'play' }
  if (action.type === 'mahjongPass') return { state: mahjongPassClaim(state, clientId), sound: 'play' }
  if (action.type === 'mahjongClaim') return { state: mahjongClaim(state, clientId, action.claimAction, action.tileIds), sound: action.claimAction === 'win' ? 'win' : 'play' }
  return null
}

function createPrivateWifiState(state: GameState, localPlayerId: string): GameState {
  const revealAllHands = Boolean(state.winnerId)
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      hand: revealAllHands || player.id === localPlayerId ? [...player.hand] : createMaskedHand(player.id, player.hand.length),
      zeroGrid: player.zeroGrid?.map((slot, index) => {
        const publicFaceUp = state.config.game !== 'cabo' && slot.faceUp
        if (revealAllHands || player.id === localPlayerId || publicFaceUp || !slot.card) return { ...slot, card: slot.card ? { ...slot.card } : null, knownByPlayerIds: slot.knownByPlayerIds ? [...slot.knownByPlayerIds] : undefined }
        return { card: createMaskedCard(`${player.id}-zero-${index}`), faceUp: false }
      }),
    })),
    drawPile: createMaskedHand('draw', state.drawPile.length),
    discardPile: state.discardPile.map((card) => (card.liarFaceDown && !revealAllHands ? createMaskedLiarCard(card) : { ...card })),
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
    blastChamber: state.blastChamber,
    blastEvent: state.blastEvent ? { ...state.blastEvent } : null,
    robotoEvent: state.robotoEvent ? { ...state.robotoEvent } : null,
    tippoEvent: state.tippoEvent ? { ...state.tippoEvent } : null,
    memoryActionEvent: state.memoryActionEvent ? {
      ...state.memoryActionEvent,
      affectedPlayers: state.memoryActionEvent.affectedPlayers.map((entry) => ({ ...entry })),
    } : null,
    memoryBoard: state.memoryBoard ? {
      ...state.memoryBoard,
      slots: state.memoryBoard.slots.map((slot, index) => {
        if (revealAllHands || slot.faceUp || slot.collectedByPlayerId) return { ...slot, card: { ...slot.card } }
        return { ...slot, card: createMaskedCard(`memory-${index}`), faceUp: false, memoryActionKind: undefined }
      }),
      selectedSlotIndexes: [...state.memoryBoard.selectedSlotIndexes],
      pendingMatchIndexes: state.memoryBoard.pendingMatchIndexes ? [...state.memoryBoard.pendingMatchIndexes] : null,
      pendingMatchPlayerId: state.memoryBoard.pendingMatchPlayerId ?? null,
      pendingMismatchIndexes: state.memoryBoard.pendingMismatchIndexes ? [...state.memoryBoard.pendingMismatchIndexes] : null,
    } : undefined,
    tippoTrays: state.tippoTrays?.map((tray) => ({
      ...tray,
      cards: tray.cards.map((card) => ({ ...card })),
    })),
    dosCenterRow: state.dosCenterRow?.map((card) => ({ ...card })),
    zeroTurn: state.zeroTurn ? {
      drawnCard: state.zeroTurn.drawnCard && localPlayerId === activePlayer(state).id ? { ...state.zeroTurn.drawnCard } : null,
      source: state.zeroTurn.source,
    } : null,
    zeroCallPendingPlayerId: state.zeroCallPendingPlayerId,
    pendingCaboPower: state.pendingCaboPower ? { ...state.pendingCaboPower, firstSlot: state.pendingCaboPower.firstSlot ? { ...state.pendingCaboPower.firstSlot } : undefined } : null,
    caboCallerPlayerId: state.caboCallerPlayerId ?? null,
    caboFinalTurnsRemaining: state.caboFinalTurnsRemaining ?? null,
    pendingLiarChallenge: state.pendingLiarChallenge ? { ...state.pendingLiarChallenge, claim: { ...state.pendingLiarChallenge.claim } } : null,
    log: [...state.log],
  }
}

function createPrivateMahjongState(state: MahjongState, localPlayerId: string): MahjongState {
  const revealAll = Boolean(state.winnerId || state.roundResult)
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      concealed: revealAll || player.id === localPlayerId ? player.concealed.map(cloneMahjongTile) : createMaskedMahjongTiles(player.id, player.concealed.length),
      exposedMelds: player.exposedMelds.map((meld) => ({
        ...meld,
        tiles: meld.tiles.map(cloneMahjongTile),
      })),
      flowers: player.flowers.map(cloneMahjongTile),
      discardRiver: player.discardRiver.map(cloneMahjongTile),
    })),
    wall: createMaskedMahjongTiles('wall', state.wall.length),
    deadWall: createMaskedMahjongTiles('dead-wall', state.deadWall.length),
    claimWindow: state.claimWindow
      ? {
          ...state.claimWindow,
          discard: cloneMahjongTile(state.claimWindow.discard),
          eligiblePlayerIds: [...state.claimWindow.eligiblePlayerIds],
          responses: { ...state.claimWindow.responses },
        }
      : null,
    ruleProfile: { ...state.ruleProfile },
    roundResult: state.roundResult
      ? {
          ...state.roundResult,
          payments: state.roundResult.payments.map((payment) => ({ ...payment })),
        }
      : null,
    log: [...state.log],
  }
}

function cloneMahjongTile(tile: MahjongTile): MahjongTile {
  return { ...tile }
}

function createMaskedMahjongTiles(ownerId: string, count: number): MahjongTile[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `hidden-${ownerId}-${index}`,
    category: 'wind',
    wind: 'east',
    copy: 1,
    key: `hidden-${ownerId}-${index}`,
  }))
}

function createMaskedHand(ownerId: string, count: number): Card[] {
  return Array.from({ length: count }, (_, index) => createMaskedCard(`${ownerId}-${index}`))
}

function createMaskedCard(id: string): Card {
  return {
    id: `hidden-${id}`,
    kind: 'number',
    color: 'red',
    value: 0,
    label: 'Hidden',
    points: 0,
  }
}

function createMaskedLiarCard(card: Card): Card {
  return {
    ...createMaskedCard(card.id),
    id: card.id,
    label: 'Liar card',
    liar: true,
    liarFaceDown: true,
    liarClaim: card.liarClaim ? { ...card.liarClaim } : undefined,
  }
}

function LocalWifiPanel({
  language,
  state,
  playerName,
  joinCode,
  allowAi,
  config,
  onPlayerNameChange,
  onJoinCodeChange,
  onAllowAiChange,
  onHost,
  onJoin,
  onLeave,
  onCloseRoom,
  onResumeSession,
  onStartGame,
  canResumeSession,
}: {
  language: Language
  state: WifiClientState
  playerName: string
  joinCode: string
  allowAi: boolean
  config: GameConfig
  onPlayerNameChange: (name: string) => void
  onJoinCodeChange: (code: string) => void
  onAllowAiChange: (allowAi: boolean) => void
  onHost: () => void
  onJoin: () => void
  onLeave: () => void
  onCloseRoom: () => void
  onResumeSession: () => void
  onStartGame: () => void
  canResumeSession: boolean
}) {
  const room = state.room
  const isHost = Boolean(room && state.clientId === room.hostId)
  const canStart = Boolean(
    room &&
      isHost &&
      !room.gameStarted &&
      (room.game === 'teams' || isMahjongGame(room.game)
        ? room.players.length === room.maxPlayers || room.allowAi
        : room.players.length >= 2 || room.allowAi),
  )
  const roomGame = room?.game ?? config.game

  return (
    <section className="setup-panel wide wifi-panel">
      <header className="wifi-panel-header">
        <div>
          <h2>{t(language, 'localWifiLobby')}</h2>
          <p className="hint">{gameTitle(roomGame, room?.h2oSplash ?? config.h2oSplash)} | {t(language, 'wifiGameSyncPending')}</p>
        </div>
        <span className={`wifi-status ${state.status}`}>{t(language, 'wifiStatus')}: {wifiStatusLabel(language, state.status)}</span>
      </header>

      <div className="wifi-actions">
        <label className="field-row">
          <span>{t(language, 'wifiPlayerName')}</span>
          <input value={playerName} maxLength={24} onChange={(event) => onPlayerNameChange(event.target.value)} />
          <strong>{playerName.trim().length || 0}</strong>
        </label>

        <label className="addon-option wifi-checkbox">
          <input type="checkbox" checked={allowAi} onChange={(event) => onAllowAiChange(event.target.checked)} />
          <span>
            <strong>{t(language, 'wifiAllowAi')}</strong>
            <small>{t(language, 'totalPlayers')}: {config.playerCount} | {t(language, 'aiDifficulty')}: {t(language, config.aiDifficulty)}</small>
          </span>
        </label>

        <div className="wifi-command-row">
          <button className="primary-button" type="button" onClick={onHost} disabled={Boolean(room)}>
            {t(language, 'hostRoom')}
          </button>
          <label>
            <span>{t(language, 'joinCode')}</span>
            <input
              value={joinCode}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              onChange={(event) => onJoinCodeChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
            />
          </label>
          <button className="ghost-button" type="button" onClick={onJoin} disabled={Boolean(room) || joinCode.trim().length < 4}>
            {t(language, 'joinRoom')}
          </button>
          {room && !isHost && (
            <button className="danger-button" type="button" onClick={onLeave}>
              {t(language, 'leaveRoom')}
            </button>
          )}
          {room && isHost && (
            <button className="danger-button" type="button" onClick={onCloseRoom}>
              {t(language, 'closeSession')}
            </button>
          )}
          {canResumeSession && (
            <button className="primary-button" type="button" onClick={onResumeSession}>
              {t(language, 'resumeSession')}
            </button>
          )}
          {isHost && (
            <button className="uno-button" type="button" onClick={onStartGame} disabled={!canStart}>
              {t(language, 'startRoomGame')}
            </button>
          )}
        </div>
      </div>

      {state.error && <p className="wifi-error">{state.error}</p>}

      {room && (
        <div className="wifi-room-card">
          <div>
            <span>{t(language, 'roomCode')}</span>
            <strong>{room.code}</strong>
          </div>
          <div>
            <span>{t(language, 'connectedPlayers')}</span>
            <strong>{room.players.length}/{room.maxPlayers}</strong>
          </div>
          <div className="wifi-player-list">
            {room.players.map((player) => (
              <span key={player.id}>
                <span className={`avatar-chip mini ${player.avatarId}`}>{avatarInitial(player.avatarId)}</span>
                {player.name}{player.isHost ? ` (${t(language, 'hostRoom')})` : ''}
              </span>
            ))}
          </div>
          <div className="wifi-room-actions">
            {isHost ? (
              <button className="uno-button" type="button" onClick={onStartGame} disabled={!canStart}>
                {t(language, 'startRoomGame')}
              </button>
            ) : (
              <span className="wifi-waiting-note">{wifiWaitingForHostStart(language)}</span>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function wifiStatusLabel(language: Language, status: WifiClientState['status']) {
  if (status === 'connecting') return t(language, 'wifiConnecting')
  if (status === 'connected') return t(language, 'wifiConnected')
  if (status === 'error') return t(language, 'wifiError')
  return t(language, 'wifiIdle')
}

function wifiWaitingForHostStart(language: Language): string {
  if (language === 'zh') return '等待主机开始游戏'
  if (language === 'de') return 'Warte auf den Host'
  return 'Waiting for host to start'
}

function localSpeedPlayerId(state: GameState, wifiLocalPlayerId?: string | null): string | null {
  if (state.config.game !== 'party' && state.config.game !== 'houseRules') return null
  if (state.config.mode === 'single') return state.players.find((player) => player.type === 'human')?.id ?? null
  if (state.config.mode === 'wifi') return wifiLocalPlayerId ?? null
  return null
}

function teamPassButtonLabel(language: Language): string {
  if (language === 'zh') return '传给队友'
  if (language === 'de') return 'An Partner geben'
  return 'Pass to partner'
}

function teamPassCancelLabel(language: Language): string {
  if (language === 'zh') return '取消传牌'
  if (language === 'de') return 'Passen abbrechen'
  return 'Cancel pass'
}

function dareDrawLabel(language: Language): string {
  if (language === 'zh') return '接受惩罚：摸 2'
  if (language === 'de') return 'Strafe nehmen: 2 ziehen'
  return 'Take penalty: draw 2'
}

function dareRollLabel(language: Language): string {
  if (language === 'zh') return '掷 Dare 骰子'
  if (language === 'de') return 'Dare-Würfel werfen'
  return 'Roll Dare die'
}

function emojiMadeFaceLabel(language: Language): string {
  if (language === 'zh') return '已模仿表情'
  if (language === 'de') return 'Gesicht gemacht'
  return 'Made face'
}

function emojiDrawPenaltyLabel(language: Language): string {
  if (language === 'zh') return '失败：摸 4'
  if (language === 'de') return 'Verfehlt: 4 ziehen'
  return 'Missed: draw 4'
}

function flipSideLabel(language: Language, side: GameState['flipSide']): string {
  if (language === 'zh') return side === 'light' ? '浅色面' : '深色面'
  if (language === 'de') return side === 'light' ? 'Helle Seite' : 'Dunkle Seite'
  return side === 'light' ? 'Light Side' : 'Dark Side'
}

function colorsForState(state: GameState): UnoColor[] {
  return isFlipSideGame(state.config.game) && state.flipSide === 'dark' ? darkColors : colors
}

function randomChoice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function hardwareEventKey(state: GameState): string | null {
  if (isLauncherGame(state.config.game) && state.launcherEvent) {
    return `${state.config.game}:launcher:${state.currentRound}:${state.launcherEvent.sequence}`
  }
  if (state.config.game === 'flash' && state.flashEvent) {
    return `${state.config.game}:flash:${state.currentRound}:${state.flashEvent.sequence}`
  }
  if (state.config.game === 'h2o' && state.config.h2oSplash && state.whirlpoolEvent) {
    return `${state.config.game}:whirlpool:${state.currentRound}:${state.whirlpoolEvent.sequence}`
  }
  if (state.config.game === 'spin' && state.spinEvent) {
    return `${state.config.game}:spin:${state.currentRound}:${state.spinEvent.sequence}`
  }
  if (state.config.game === 'wildJackpot' && state.wildJackpotEvent) {
    return `${state.config.game}:jackpot:${state.currentRound}:${state.wildJackpotEvent.sequence}`
  }
  if (state.config.game === 'blast' && state.blastEvent?.fired) {
    return `${state.config.game}:blast:${state.currentRound}:${state.blastEvent.sequence}`
  }
  if (state.config.game === 'roboto' && state.robotoEvent) {
    return `${state.config.game}:roboto:${state.currentRound}:${state.robotoEvent.sequence}`
  }
  if (state.config.game === 'tippo' && state.tippoEvent?.tipped) {
    return `${state.config.game}:tippo:${state.currentRound}:${state.tippoEvent.sequence}`
  }
  if (state.config.game === 'marioKart' && state.marioKartEvent) {
    return `${state.config.game}:item:${state.currentRound}:${state.marioKartEvent.sequence}`
  }
  if (state.config.game === 'dc' && state.justiceLeagueEvent) {
    return `${state.config.game}:justice:${state.currentRound}:${state.justiceLeagueEvent.sequence}`
  }
  if (state.config.game === 'spiderman' && state.webSwingEvent) {
    return `${state.config.game}:web-swing:${state.currentRound}:${state.webSwingEvent.sequence}`
  }
  if (state.config.game === 'tmnt' && state.turtlePowerEvent) {
    return `${state.config.game}:turtle-power:${state.currentRound}:${state.turtlePowerEvent.sequence}`
  }
  if (state.config.game === 'starTrek' && state.beamMeUpEvent) {
    return `${state.config.game}:beam:${state.currentRound}:${state.beamMeUpEvent.sequence}`
  }
  if (state.config.game === 'avatar' && state.avatarStateEvent) {
    return `${state.config.game}:avatar-state:${state.currentRound}:${state.avatarStateEvent.sequence}`
  }
  if (state.config.game === 'monsterHigh' && state.creepyCoolEvent) {
    return `${state.config.game}:creepy-cool:${state.currentRound}:${state.creepyCoolEvent.sequence}`
  }
  if (state.config.game === 'nfl' && state.touchdownEvent) {
    return `${state.config.game}:touchdown:${state.currentRound}:${state.touchdownEvent.sequence}`
  }
  if (isGuoMemoryActionGame(state.config.game) && state.memoryActionEvent) {
    return `${state.config.game}:memory-action:${state.currentRound}:${state.memoryActionEvent.sequence}`
  }
  return null
}

function gameTitle(game: GameVariant, h2oSplash = false): string {
  if (game === 'extreme') return 'Uno Extreme'
  if (game === 'flash') return 'Uno Flash'
  if (game === 'flip') return 'Uno Flip'
  if (game === 'flipExtreme') return 'Uno Flip Extreme'
  if (game === 'h2o') return h2oSplash ? 'Uno H2O Splash' : 'Uno H2O'
  if (game === 'spin') return 'Uno Spin'
  if (game === 'zero') return 'Uno Zero'
  if (game === 'flex') return 'Uno Flex'
  if (game === 'liars') return "Liar's Uno"
  if (game === 'party') return 'Uno Party'
  if (game === 'teams') return 'Uno Teams'
  if (game === 'houseRules') return 'Uno House Rules'
  if (game === 'challenge') return 'Uno Challenge Adults Only'
  if (game === 'allWild') return 'UNO All Wild'
  if (game === 'lotr') return 'Uno Der Herr der Ringe'
  if (game === 'popCulture') return 'Pop-Culture Uno editions'
  if (game === 'noMercy') return "Uno Show 'em No Mercy"
  if (game === 'superMario') return 'UNO Super Mario'
  if (game === 'sonic') return 'UNO Sonic the Hedgehog'
  if (game === 'barbie') return 'UNO Barbie'
  if (game === 'motu') return 'UNO Masters of the Universe'
  if (game === 'tmnt') return 'UNO TMNT'
  if (game === 'spiderman') return 'UNO Spider-Man'
  if (game === 'dc') return 'UNO DC'
  if (game === 'starTrek') return 'UNO Star Trek'
  if (game === 'avatar') return 'UNO Avatar'
  if (game === 'monsterHigh') return 'UNO Monster High'
  if (game === 'nfl') return 'UNO NFL'
  if (game === 'triplePlay') return 'UNO Triple Play'
  if (game === 'minecraft') return 'UNO Minecraft'
  if (game === 'wildJackpot') return 'UNO Wild Jackpot'
  if (game === 'blast') return 'UNO Blast'
  if (game === 'roboto') return 'UNO Roboto'
  if (game === 'tippo') return 'UNO Tippo'
  if (game === 'dice') return 'UNO Dice'
  if (game === 'emoji') return 'UNO Emoji'
  if (game === 'marioKart') return 'UNO Mario Kart'
  if (game === 'skyjo') return 'Skyjo'
  if (game === 'cabo') return 'Cabo'
  if (game === 'dos') return 'DOS'
  if (game === 'phase10') return 'Phase 10'
  if (game === 'skipBo') return 'Skip-Bo'
  if (game === 'mahjong') return 'Traditional Chinese Mahjong'
  if (game === 'guoUnoMahjong') return "Guo's Exclusive Uno Mahjong"
  if (game === 'guoMemory') return "Guo's Exclusive UNO Memory"
  if (game === 'guoMemoryAction') return "Guo's Exclusive UNO Memory Action"
  if (game === 'guoTripleMemory') return "Guo's Exclusive UNO Triple Memory"
  if (game === 'guoTripleMemoryAction') return "Guo's Exclusive UNO Triple Memory Action"
  if (game === 'guoNeighborMatch') return "Guo's Exclusive Uno Neighbor Match"
  if (game === 'guoHiLo') return "Guo's Exclusive Uno Hi-Lo"
  if (game === 'guoPassage') return "Guo's Exclusive Uno Passage"
  if (game === 'quatro') return 'UNO Quatro'
  return 'Uno Classic'
}

function gameNumberLabel(game: GameVariant): string {
  if (game === 'quatro') return 'More games'
  if (game === 'extreme') return 'Game 2'
  if (game === 'flash') return 'Game 3'
  if (game === 'flip') return 'Game 4'
  if (game === 'h2o') return 'Game 5'
  if (game === 'spin') return 'Game 6'
  if (game === 'zero') return 'Game 7'
  if (game === 'flex') return 'Game 8'
  if (game === 'liars') return 'Game 9'
  if (game === 'party') return 'Game 10'
  if (game === 'teams') return 'Game 11'
  if (game === 'houseRules') return 'Game 12'
  if (game === 'challenge') return 'Game 13'
  if (game === 'flipExtreme') return 'Game 14'
  if (game === 'lotr') return 'Game 15'
  if (game === 'popCulture') return 'Game 16'
  if (game === 'allWild') return 'Game 17'
  if (game === 'noMercy') return 'Game 18'
  if (game === 'triplePlay') return 'Game 19'
  if (game === 'minecraft') return 'Game 20'
  if (game === 'wildJackpot') return 'Game 21'
  if (game === 'blast') return 'Game 22'
  if (game === 'roboto') return 'Game 23'
  if (game === 'tippo') return 'Game 24'
  if (game === 'dice') return 'Game 25'
  if (game === 'emoji') return 'Game 26'
  if (game === 'marioKart') return 'Game 27'
  if (game === 'superMario') return 'Game 28'
  if (game === 'sonic') return 'Game 29'
  if (game === 'barbie') return 'Game 30'
  if (game === 'motu') return 'Game 31'
  if (game === 'tmnt') return 'Game 32'
  if (game === 'spiderman') return 'Game 33'
  if (game === 'dc') return 'Game 34'
  if (game === 'starTrek') return 'Game 35'
  if (game === 'avatar') return 'Game 36'
  if (game === 'monsterHigh') return 'Game 37'
  if (game === 'nfl') return 'Game 38'
  if (game === 'skyjo') return 'Game 39'
  if (game === 'cabo') return 'Game 40'
  if (game === 'dos') return 'Game 41'
  if (game === 'phase10') return 'Game 42'
  if (game === 'skipBo') return 'Game 43'
  if (game === 'mahjong') return 'Game 44'
  if (game === 'guoMemory') return 'Game 45'
  if (game === 'guoMemoryAction') return 'Game 46'
  if (game === 'guoTripleMemory') return 'Game 47'
  if (game === 'guoTripleMemoryAction') return 'Game 48'
  if (game === 'guoNeighborMatch') return 'Game 49'
  if (game === 'guoUnoMahjong') return 'Game 50'
  if (game === 'guoHiLo') return 'Game 51'
  if (game === 'guoPassage') return 'Game 52'
  return 'Game 1'
}

function mahjongLabel(language: Language, key: 'wall' | 'deadWall' | 'phase' | 'selected' | 'wait' | 'hint' | 'nextRound' | 'ruleProfile' | 'standard' | 'winRound'): string {
  const labels: Record<Language, Record<typeof key, string>> = {
    en: {
      wall: 'Wall',
      deadWall: 'Dead wall',
      phase: 'Phase',
      selected: 'Selected',
      wait: 'Waiting',
      hint: 'Hint',
      nextRound: 'Next round',
      ruleProfile: 'Rule profile',
      standard: 'Standard',
      winRound: 'Win the round',
    },
    zh: {
      wall: '牌墙',
      deadWall: '岭上牌',
      phase: '阶段',
      selected: '已选择',
      wait: '等待',
      hint: '提示',
      nextRound: '下一局',
      ruleProfile: '规则',
      standard: '标准规则',
      winRound: '胡牌获胜',
    },
    de: {
      wall: 'Mauer',
      deadWall: 'Tote Mauer',
      phase: 'Phase',
      selected: 'Ausgewählt',
      wait: 'Warten',
      hint: 'Hinweis',
      nextRound: 'Nächste Runde',
      ruleProfile: 'Regelprofil',
      standard: 'Standard',
      winRound: 'Runde gewinnen',
    },
  }
  return labels[language][key]
}

function mahjongPhaseLabel(language: Language, phase: MahjongState['phase']): string {
  const labels: Record<Language, Record<MahjongState['phase'], string>> = {
    en: { draw: 'Draw', discard: 'Discard', claim: 'Claim', roundOver: 'Round over' },
    zh: { draw: '摸牌', discard: '打牌', claim: '吃碰杠胡', roundOver: '本局结束' },
    de: { draw: 'Ziehen', discard: 'Abwerfen', claim: 'Melden', roundOver: 'Runde vorbei' },
  }
  return labels[language][phase]
}

function mahjongActionLabel(language: Language, action: MahjongControlAction): string {
  const labels: Record<Language, Record<MahjongControlAction, string>> = {
    en: {
      draw: 'Draw',
      discard: 'Discard tile',
      declareWin: 'Win',
      declareKong: 'Kong',
      claimWin: 'Claim win',
      claimPong: 'Pong',
      claimKong: 'Kong',
      claimChow: 'Chow',
      pass: 'Pass',
      nextRound: 'Next round',
    },
    zh: {
      declareKong: '\u6760',
      draw: '摸牌',
      discard: '打出选中牌',
      declareWin: '自摸',
      claimWin: '胡',
      claimPong: '碰',
      claimKong: '杠',
      claimChow: '吃',
      pass: '过',
      nextRound: '下一局',
    },
    de: {
      draw: 'Ziehen',
      discard: 'Stein abwerfen',
      declareWin: 'Gewinnen',
      declareKong: 'Kong',
      claimWin: 'Sieg melden',
      claimPong: 'Pong',
      claimKong: 'Kong',
      claimChow: 'Chow',
      pass: 'Passen',
      nextRound: 'Nächste Runde',
    },
  }
  return labels[language][action]
}

function mahjongHintTitle(language: Language, key: string): string {
  const labels: Record<Language, Record<string, string>> = {
    en: {
      'mahjong.hint.discard': 'Discard a tile',
      'mahjong.hint.draw': 'Draw a tile',
      'mahjong.hint.claimWin': 'Claim the win',
      'mahjong.hint.claim': 'Claim discard',
      'mahjong.hint.pass': 'Pass',
      'mahjong.hint.wait': 'Wait',
      'mahjong.hint.declareWin': 'Declare win',
      'mahjong.hint.roundOver': 'Round over',
    },
    zh: {
      'mahjong.hint.discard': '打出一张牌',
      'mahjong.hint.draw': '摸一张牌',
      'mahjong.hint.claimWin': '可以胡牌',
      'mahjong.hint.claim': '可以鸣牌',
      'mahjong.hint.pass': '可以过',
      'mahjong.hint.wait': '等待',
      'mahjong.hint.declareWin': '可以自摸',
      'mahjong.hint.roundOver': '本局结束',
    },
    de: {
      'mahjong.hint.discard': 'Stein abwerfen',
      'mahjong.hint.draw': 'Stein ziehen',
      'mahjong.hint.claimWin': 'Sieg melden',
      'mahjong.hint.claim': 'Ablage melden',
      'mahjong.hint.pass': 'Passen',
      'mahjong.hint.wait': 'Warten',
      'mahjong.hint.declareWin': 'Sieg erklären',
      'mahjong.hint.roundOver': 'Runde vorbei',
    },
  }
  return labels[language][key] ?? key
}

function mahjongHintBody(language: Language, key: string): string {
  const labels: Record<Language, Record<string, string>> = {
    en: {
      'mahjong.hint.discardBody': 'Keep pairs and connected suit tiles; discard isolated honors or loose suit tiles first.',
      'mahjong.hint.drawBody': 'Draw from the wall, then check whether you can win, make a kong, or discard your weakest tile.',
      'mahjong.hint.claimWinBody': 'The discard completes your hand. Winning has priority over every other claim.',
      'mahjong.hint.claimPongBody': 'Pong if the triplet improves your hand; passing keeps the hand concealed and flexible.',
      'mahjong.hint.claimKongBody': 'Kong scores as a set of four and draws a replacement, but it exposes part of your hand.',
      'mahjong.hint.claimChowBody': 'Chow is only allowed from the previous player and is useful when it completes a strong sequence.',
      'mahjong.hint.passBody': 'Pass when the discard does not improve your shape, or when keeping the hand concealed is better.',
      'mahjong.hint.waitBody': 'Wait for the active player or for a claim window after a discard.',
      'mahjong.hint.declareWinBody': 'Your hand is complete: four melds plus a pair, or a supported special pattern.',
      'mahjong.hint.roundWonBody': 'The winning hand has been scored.',
      'mahjong.hint.roundDrawBody': 'The wall is exhausted.',
    },
    zh: {
      'mahjong.hint.discardBody': '优先保留对子和相邻数牌，先考虑打出孤张字牌或无搭子的数牌。',
      'mahjong.hint.drawBody': '从牌墙摸牌后，检查能否胡牌、暗杠，或打出当前最弱的一张。',
      'mahjong.hint.claimWinBody': '这张弃牌可以完成你的牌型，胡牌优先级高于所有鸣牌。',
      'mahjong.hint.claimPongBody': '碰可以快速组成刻子；如果想保持门清和灵活性，也可以选择过。',
      'mahjong.hint.claimKongBody': '杠会暴露一组四张牌并补摸一张牌，适合已经很明确的牌型。',
      'mahjong.hint.claimChowBody': '吃只能吃上家的弃牌，适合补成强顺子。',
      'mahjong.hint.passBody': '这张弃牌不能明显改善牌型，或你想保持门清时，可以选择过。',
      'mahjong.hint.waitBody': '等待当前玩家行动，或等待弃牌后的鸣牌窗口。',
      'mahjong.hint.declareWinBody': '你的牌型已经完成：四组面子加一对将，或允许的特殊牌型。',
      'mahjong.hint.roundWonBody': '胡牌已经计分。',
      'mahjong.hint.roundDrawBody': '牌墙已经摸完。',
    },
    de: {
      'mahjong.hint.discardBody': 'Behalte Paare und verbundene Zahlensteine; wirf zuerst isolierte Ehrensteine oder lose Zahlen ab.',
      'mahjong.hint.drawBody': 'Ziehe aus der Mauer und prüfe dann Gewinn, Kong oder den schwächsten Abwurf.',
      'mahjong.hint.claimWinBody': 'Diese Ablage vervollständigt deine Hand. Gewinn hat Vorrang vor jeder anderen Meldung.',
      'mahjong.hint.claimPongBody': 'Pong lohnt sich, wenn der Drilling deine Form verbessert; Passen hält die Hand flexibler.',
      'mahjong.hint.claimKongBody': 'Kong legt vier gleiche Steine offen und zieht Ersatz, macht deine Hand aber sichtbarer.',
      'mahjong.hint.claimChowBody': 'Chow ist nur von der vorherigen Ablage erlaubt und stark, wenn es eine gute Folge schliesst.',
      'mahjong.hint.passBody': 'Passe, wenn die Ablage deine Form kaum verbessert oder du verdeckt bleiben willst.',
      'mahjong.hint.waitBody': 'Warte auf den aktiven Spieler oder auf ein Meldefenster nach einer Ablage.',
      'mahjong.hint.declareWinBody': 'Deine Hand ist vollständig: vier Gruppen plus ein Paar oder ein erlaubtes Sondermuster.',
      'mahjong.hint.roundWonBody': 'Die Gewinnhand wurde gewertet.',
      'mahjong.hint.roundDrawBody': 'Die Mauer ist leer.',
    },
  }
  return labels[language][key] ?? key
}

function mahjongReasonLabel(language: Language, key: string): string {
  const labels: Record<Language, Record<string, string>> = {
    en: {
      'mahjong.reason.isolatedHonor': 'Suggested because this honor is isolated.',
      'mahjong.reason.isolatedSuit': 'Suggested because this suit tile has no nearby support.',
      'mahjong.reason.isolatedTerminal': 'Suggested because this isolated 1/9 has fewer sequence options.',
      'mahjong.reason.keepPair': 'This keeps an existing pair, which can become your pair or grow into a pong.',
      'mahjong.reason.keepSequence': 'This keeps a completed sequence intact, so your hand stays closer to four melds plus a pair.',
      'mahjong.reason.keepNearSequence': 'This keeps a two-tile wait, giving you more useful draws for a future sequence.',
      'mahjong.reason.weakConnector': 'Suggested because it is the weakest connector.',
      'mahjong.reason.breakDuplicate': 'Suggested only if duplicate value is less useful.',
      'mahjong.reason.lowestRisk': 'Suggested as the lowest-shape discard.',
    },
    zh: {
      'mahjong.reason.isolatedHonor': '建议打出：这张字牌是孤张。',
      'mahjong.reason.isolatedSuit': '建议打出：这张数牌附近没有搭子。',
      'mahjong.reason.isolatedTerminal': '建议打出：孤立的1或9只有较少的顺子机会。',
      'mahjong.reason.keepPair': '这样可以保留已有对子；对子可以做将，也可能发展成碰。',
      'mahjong.reason.keepSequence': '这样可以保留已经成型的顺子，让牌型更接近四组面子加一对将。',
      'mahjong.reason.keepNearSequence': '这样可以保留两张搭子，之后更容易摸成顺子。',
      'mahjong.reason.weakConnector': '建议打出：这是当前较弱的连接牌。',
      'mahjong.reason.breakDuplicate': '建议打出：对子价值较低。',
      'mahjong.reason.lowestRisk': '建议打出：当前牌型价值最低。',
    },
    de: {
      'mahjong.reason.isolatedHonor': 'Vorschlag: Dieser Ehrenstein ist isoliert.',
      'mahjong.reason.isolatedSuit': 'Vorschlag: Dieser Zahlenstein hat keine Nähe.',
      'mahjong.reason.isolatedTerminal': 'Vorschlag: Diese isolierte 1/9 hat weniger Chancen auf eine Folge.',
      'mahjong.reason.keepPair': 'So bleibt ein vorhandenes Paar erhalten; es kann dein Paar bleiben oder zum Pong wachsen.',
      'mahjong.reason.keepSequence': 'So bleibt eine fertige Folge erhalten und die Hand bleibt näher an vier Gruppen plus Paar.',
      'mahjong.reason.keepNearSequence': 'So bleibt eine Zwei-Stein-Warte erhalten, die mehr passende Züge für eine spätere Folge eröffnet.',
      'mahjong.reason.weakConnector': 'Vorschlag: Das ist die schwächste Verbindung.',
      'mahjong.reason.breakDuplicate': 'Vorschlag: Dieses Paar ist weniger nützlich.',
      'mahjong.reason.lowestRisk': 'Vorschlag: Niedrigster Formwert.',
    },
  }
  return labels[language][key] ?? key
}

function mahjongSuggestedActionText(language: Language, state: MahjongState, action: MahjongAiAction): string {
  const active = state.players[state.activePlayerIndex]
  if (action.type === 'draw') {
    if (language === 'zh') return '建议：从牌墙摸牌。'
    if (language === 'de') return 'Vorschlag: Ziehe aus der Mauer.'
    return 'Suggestion: draw from the wall.'
  }
  if (action.type === 'declareWin') {
    if (language === 'zh') return '建议：立即胡牌。'
    if (language === 'de') return 'Vorschlag: Sofort gewinnen.'
    return 'Suggestion: declare the win now.'
  }
  if (action.type === 'discard') {
    const tile = active?.concealed.find((candidate) => candidate.id === action.tileId)
    const name = tile ? mahjongTileName(language, tile) : action.tileId
    if (language === 'zh') return `建议打出：${name}。`
    if (language === 'de') return `Vorschlag abwerfen: ${name}.`
    return `Suggested discard: ${name}.`
  }
  if (action.type === 'claim') {
    const discard = state.claimWindow?.discard
    const discardName = discard ? mahjongTileName(language, discard) : ''
    const claim = mahjongClaimActionName(language, action.claimAction)
    if (language === 'zh') return `建议：${claim}${discardName ? ` ${discardName}` : ''}。`
    if (language === 'de') return `Vorschlag: ${claim}${discardName ? ` mit ${discardName}` : ''}.`
    return `Suggestion: ${claim}${discardName ? ` the ${discardName}` : ''}.`
  }
  if (language === 'zh') return '建议：暂时不要鸣这张牌。'
  if (language === 'de') return 'Vorschlag: Diese Ablage passen.'
  return 'Suggestion: pass this discard.'
}

function mahjongClaimActionName(language: Language, action: Exclude<MahjongClaimResponse['action'], 'pass'>): string {
  if (language === 'zh') {
    if (action === 'win') return '胡'
    if (action === 'pong') return '碰'
    if (action === 'kong') return '杠'
    return '吃'
  }
  if (language === 'de') {
    if (action === 'win') return 'Sieg melden'
    if (action === 'pong') return 'Pong melden'
    if (action === 'kong') return 'Kong melden'
    return 'Chow melden'
  }
  if (action === 'win') return 'claim win on'
  if (action === 'pong') return 'pong'
  if (action === 'kong') return 'kong'
  return 'chow'
}

function mahjongTileName(language: Language, tile: MahjongTile): string {
  if (tile.category === 'suit') {
    const suit = mahjongSuitName(language, tile.suit)
    if (language === 'zh') return `${suit}${tile.rank}`
    if (language === 'de') return `${tile.rank} ${suit}`
    return `${tile.rank} ${suit}`
  }
  if (tile.category === 'wind') return mahjongWindName(language, tile.wind)
  if (tile.category === 'dragon') return mahjongDragonName(language, tile.dragon)
  if (tile.category === 'flower') return mahjongFlowerName(language, tile.flower)
  return mahjongSeasonName(language, tile.season)
}

function mahjongSuitName(language: Language, suit: Extract<MahjongTile, { category: 'suit' }>['suit']): string {
  const labels = {
    en: { dots: 'Dots', bamboo: 'Bamboo', characters: 'Characters' },
    zh: { dots: '筒', bamboo: '条', characters: '万' },
    de: { dots: 'Kreise', bamboo: 'Bambus', characters: 'Zeichen' },
  }
  return labels[language][suit]
}

function mahjongWindName(language: Language, wind: Extract<MahjongTile, { category: 'wind' }>['wind']): string {
  const labels = {
    en: { east: 'East wind', south: 'South wind', west: 'West wind', north: 'North wind' },
    zh: { east: '东风', south: '南风', west: '西风', north: '北风' },
    de: { east: 'Ostwind', south: 'Südwind', west: 'Westwind', north: 'Nordwind' },
  }
  return labels[language][wind]
}

function mahjongDragonName(language: Language, dragon: Extract<MahjongTile, { category: 'dragon' }>['dragon']): string {
  const labels = {
    en: { red: 'Red dragon', green: 'Green dragon', white: 'White dragon' },
    zh: { red: '红中', green: '发财', white: '白板' },
    de: { red: 'Roter Drache', green: 'Grüner Drache', white: 'Weißer Drache' },
  }
  return labels[language][dragon]
}

function mahjongFlowerName(language: Language, flower: Extract<MahjongTile, { category: 'flower' }>['flower']): string {
  const labels = {
    en: { plum: 'Plum', orchid: 'Orchid', chrysanthemum: 'Chrysanthemum', bamboo: 'Bamboo flower' },
    zh: { plum: '梅', orchid: '兰', chrysanthemum: '菊', bamboo: '竹' },
    de: { plum: 'Pflaume', orchid: 'Orchidee', chrysanthemum: 'Chrysantheme', bamboo: 'Bambusblume' },
  }
  return labels[language][flower]
}

function mahjongSeasonName(language: Language, season: Extract<MahjongTile, { category: 'season' }>['season']): string {
  const labels = {
    en: { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' },
    zh: { spring: '春', summer: '夏', autumn: '秋', winter: '冬' },
    de: { spring: 'Fruehling', summer: 'Sommer', autumn: 'Herbst', winter: 'Winter' },
  }
  return labels[language][season]
}

function mahjongRoundResultEyebrow(language: Language, state: MahjongState): string {
  if (state.roundResult?.kind === 'draw') return mahjongHintTitle(language, 'mahjong.hint.roundOver')
  return language === 'zh' ? '胡牌' : language === 'de' ? 'Sieg' : 'Win'
}

function mahjongRoundResultTitle(language: Language, state: MahjongState): string {
  if (state.roundResult?.kind === 'draw') {
    if (language === 'zh') return '流局'
    if (language === 'de') return 'Unentschieden'
    return 'Drawn round'
  }
  const winner = state.players.find((player) => player.id === state.winnerId)
  const name = playerName(language, winner?.name ?? '')
  if (language === 'zh') return `${name} 胡牌`
  if (language === 'de') return `${name} gewinnt`
  return `${name} wins`
}

function mahjongRoundResultDetail(language: Language, state: MahjongState): string {
  const result = state.roundResult
  if (!result) return ''
  if (result.kind === 'draw') return mahjongHintBody(language, 'mahjong.hint.roundDrawBody')
  const payment = result.payments.find((entry) => entry.playerId === result.winnerId)?.delta ?? 0
  if (language === 'zh') return result.selfDraw ? `自摸，获得 ${payment} 分。` : `点炮胡，获得 ${payment} 分。`
  if (language === 'de') return result.selfDraw ? `Selbst gezogen, ${payment} Punkte.` : `Ablage gewonnen, ${payment} Punkte.`
  return result.selfDraw ? `Self-draw win for ${payment} points.` : `Discard win for ${payment} points.`
}

function MahjongWinningHands({ language, state }: { language: Language; state: MahjongState }) {
  return (
    <section className="mahjong-winning-hands" aria-label={mahjongWinningHandsLabel(language)}>
      {state.players.map((player) => {
        const handTiles = mahjongWinningHandTiles(state, player.id)
        const winner = player.id === state.winnerId
        return (
          <div className={`mahjong-winning-player ${winner ? 'winner' : ''}`} key={player.id}>
            <header>
              <strong>{playerName(language, player.name)}</strong>
              {winner && <span>{mahjongWinnerLabel(language)}</span>}
            </header>
            <div className="mahjong-winning-tiles">
              {handTiles.map(({ tile, winningTile }, tileIndex) => (
                <span
                  className={`mahjong-winning-tile ${winningTile ? 'winning' : ''}`}
                  key={`${tile.id}-${tileIndex}`}
                  title={mahjongTileKeyText(language, tile.key)}
                >
                  {mahjongTileKeyText(language, tile.key)}
                </span>
              ))}
            </div>
            {player.exposedMelds.length > 0 && (
              <div className="mahjong-winning-melds">
                {player.exposedMelds.map((meld, meldIndex) => (
                  <div className="mahjong-winning-meld" key={`${player.id}-${meld.kind}-${meldIndex}`}>
                    <small>{mahjongPopupMeldLabel(language, meld.kind)}</small>
                    <div className="mahjong-winning-tiles">
                      {meld.tiles.map((tile) => (
                        <span className="mahjong-winning-tile exposed" key={tile.id} title={mahjongTileKeyText(language, tile.key)}>
                          {mahjongTileKeyText(language, tile.key)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}

function mahjongWinningHandTiles(state: MahjongState, playerId: string): Array<{ tile: MahjongTile; winningTile: boolean }> {
  const player = state.players.find((candidate) => candidate.id === playerId)
  if (!player) return []
  const tiles = player.concealed.map((tile) => ({ tile, winningTile: false }))
  if (player.id !== state.winnerId || state.roundResult?.selfDraw || !state.roundResult?.wonFromPlayerId) return tiles
  const sourcePlayer = state.players.find((candidate) => candidate.id === state.roundResult?.wonFromPlayerId)
  const winningTile = sourcePlayer?.discardRiver.at(-1)
  if (winningTile && !tiles.some((entry) => entry.tile.id === winningTile.id)) tiles.push({ tile: winningTile, winningTile: true })
  return tiles
}

function mahjongWinningHandsLabel(language: Language): string {
  if (language === 'zh') return '所有玩家手牌'
  if (language === 'de') return 'Haende aller Spieler'
  return 'All player hands'
}

function mahjongWinnerLabel(language: Language): string {
  if (language === 'zh') return '赢家'
  if (language === 'de') return 'Gewinner'
  return 'Winner'
}

function mahjongPopupMeldLabel(language: Language, kind: MahjongState['players'][number]['exposedMelds'][number]['kind']): string {
  if (kind === 'chow') return language === 'zh' ? '吃' : language === 'de' ? 'Chow' : 'Chow'
  if (kind === 'pong') return language === 'zh' ? '碰' : language === 'de' ? 'Pong' : 'Pong'
  return language === 'zh' ? '杠' : language === 'de' ? 'Kong' : 'Kong'
}

function modeOptions(language: Language): Array<{ id: GameMode; label: string; description: string }> {
  return [
    { id: 'single', label: modeName(language, 'single'), description: modeDescription(language, 'single') },
    { id: 'hotseat', label: modeName(language, 'hotseat'), description: modeDescription(language, 'hotseat') },
    { id: 'wifi', label: modeName(language, 'wifi'), description: t(language, 'localWifiHint') },
    { id: 'spectacular', label: modeName(language, 'spectacular'), description: modeDescription(language, 'spectacular') },
  ]
}

function applyMahjongAction(state: MahjongState, action: MahjongAiAction): MahjongState {
  if (action.type === 'draw') return mahjongDraw(state)
  if (action.type === 'declareWin') return mahjongDeclareWin(state)
  if (action.type === 'discard') return mahjongDiscard(state, action.tileId)
  if (action.type === 'claim') {
    const responderId = localMahjongClaimResponderId(state, action.claimAction)
    return responderId ? mahjongClaim(state, responderId, action.claimAction, action.tileIds) : state
  }
  if (action.type === 'pass') {
    const responderId = localMahjongClaimResponderId(state)
    return responderId ? mahjongPassClaim(state, responderId) : state
  }
  return state
}

function mahjongSoundForAction(action: MahjongAiAction): Parameters<SoundManager['play']>[0] {
  if (action.type === 'draw') return 'draw'
  if (action.type === 'declareWin') return 'win'
  if (action.type === 'claim' && action.claimAction === 'win') return 'win'
  if (action.type === 'pass') return 'play'
  return 'play'
}

function soundCueForGameTransition(previous: GameState | null, next: GameState, cue?: SoundCue): SoundCue | undefined {
  if (!cue) return undefined
  if (hasNewLauncherEvent(previous, next)) return next.launcherEvent?.cardsFired ? 'launcherFire' : 'launcherBuild'
  if (hasNewBlastEvent(previous, next)) return next.blastEvent?.fired ? 'blastRelease' : 'blastPressure'
  if (hasNewRobotoEvent(previous, next)) return 'robotoInstruction'
  if (hasNewTippoEvent(previous, next)) return next.tippoEvent?.tipped ? 'tippoTip' : 'tippoWobble'
  if (hasDiceReroll(previous, next, cue)) return 'diceRoll'
  if (cue === 'win') {
    if (next.gameWinnerId) return 'sessionWin'
    if (next.winnerId) return 'roundWin'
    return 'win'
  }
  if (hasNewMemoryActionEvent(previous, next)) {
    return next.memoryActionEvent?.action === 'winnerTakesAll' ? 'memoryWinnerTakesAll' : 'memoryAction'
  }
  if (previous?.memoryBoard && next.memoryBoard && cue === 'play') {
    if (previous.memoryBoard.pendingMatchIndexes?.length) {
      return previous.memoryBoard.cardsPerMatch === 3 ? 'memoryTripleMatch' : 'memoryMatch'
    }
    if (previous.memoryBoard.pendingMismatchIndexes?.length) return 'memoryMismatch'
    if (hasNewMemoryCardReveal(previous, next)) return 'memoryFlip'
  }
  if (cue === 'draw' && penaltyDrawnCardCount(previous, next) >= 2) return 'penaltyDraw'
  if (cue === 'launcher') return 'hardware'
  return cue
}

function playHardwareSoundLeadIn(sound: SoundManager | null, previous: GameState | null, next: GameState, cue?: SoundCue) {
  if (!sound || !cue) return
  if (hasNewRobotoEvent(previous, next)) sound.play('robotoBeep')
}

function playHardwareSoundFollowUp(sound: SoundManager | null, previous: GameState | null, next: GameState, cue?: SoundCue) {
  if (!sound || !cue || !hasDiceReroll(previous, next, cue)) return
  window.setTimeout(() => sound.play('diceSettle'), 180)
}

function hasNewLauncherEvent(previous: GameState | null, next: GameState): boolean {
  return next.config.game === 'extreme' || next.config.game === 'flipExtreme'
    ? Boolean(next.launcherEvent && next.launcherEvent.sequence !== previous?.launcherEvent?.sequence)
    : false
}

function hasNewBlastEvent(previous: GameState | null, next: GameState): boolean {
  return next.config.game === 'blast'
    ? Boolean(next.blastEvent && next.blastEvent.sequence !== previous?.blastEvent?.sequence)
    : false
}

function hasNewRobotoEvent(previous: GameState | null, next: GameState): boolean {
  return next.config.game === 'roboto'
    ? Boolean(next.robotoEvent && next.robotoEvent.sequence !== previous?.robotoEvent?.sequence)
    : false
}

function hasNewTippoEvent(previous: GameState | null, next: GameState): boolean {
  return next.config.game === 'tippo'
    ? Boolean(next.tippoEvent && next.tippoEvent.sequence !== previous?.tippoEvent?.sequence)
    : false
}

function hasDiceReroll(previous: GameState | null, next: GameState, cue: SoundCue): boolean {
  if (!previous || next.config.game !== 'dice' || (cue !== 'draw' && cue !== 'action')) return false
  return previous.players.some((player, index) => player.hand.map((card) => card.id).join('|') !== next.players[index]?.hand.map((card) => card.id).join('|'))
}

function hasNewMemoryActionEvent(previous: GameState | null, next: GameState): boolean {
  return Boolean(next.memoryActionEvent && next.memoryActionEvent.sequence !== previous?.memoryActionEvent?.sequence)
}

function hasNewMemoryCardReveal(previous: GameState | null, next: GameState): boolean {
  const previousBoard = previous?.memoryBoard
  if (!previousBoard || !next.memoryBoard) return false
  return next.memoryBoard.slots.some((slot, index) => slot.faceUp && !previousBoard.slots[index]?.faceUp)
}

function soundCueForMahjongTransition(previous: MahjongState | null, next: MahjongState, cue?: SoundCue): SoundCue | undefined {
  if (!cue) return undefined
  const transition = deriveMahjongAnimationTransition(previous, next)
  if (!transition) return undefined
  if (transition.roundStart) return 'mahjongWallBuild'
  if (transition.eventKind === 'win') return 'mahjongWin'
  if (transition.eventKind === 'kong') return 'mahjongKong'
  if (transition.eventKind === 'pong') return 'mahjongPong'
  if (transition.eventKind === 'chow') return 'mahjongChow'
  if (transition.discardedTileId) return 'mahjongDiscard'
  if (transition.drawnTileId) return 'mahjongDraw'
  return undefined
}

function penaltyDrawnCardCount(previous: GameState | null, next: GameState): number {
  if (!previous || previous.drawPile.length <= next.drawPile.length) return 0
  const previousDrawIds = new Set(previous.drawPile.map((card) => card.id))
  return next.players.reduce((total, player) => {
    const previousPlayer = previous.players.find((candidate) => candidate.id === player.id)
    if (!previousPlayer) return total
    const previousHandIds = new Set(previousPlayer.hand.map((card) => card.id))
    return total + player.hand.filter((card) => !previousHandIds.has(card.id) && previousDrawIds.has(card.id)).length
  }, 0)
}

function localMahjongControlPlayerId(state: MahjongState, mode: GameMode, localPlayerId?: string | null): string | null {
  if (state.phase === 'claim') {
    if (mode === 'wifi') {
      return localPlayerId && state.claimWindow?.eligiblePlayerIds.includes(localPlayerId) && !state.claimWindow.responses[localPlayerId]
        ? localPlayerId
        : null
    }
    if (mode === 'single' && state.claimWindow?.eligiblePlayerIds.includes('p1') && !state.claimWindow.responses.p1) return 'p1'
    const eligibleHuman = state.claimWindow?.eligiblePlayerIds.find((playerId) => {
      const player = state.players.find((candidate) => candidate.id === playerId)
      return player?.type === 'human' && !state.claimWindow?.responses[playerId]
    })
    return eligibleHuman ?? null
  }
  const active = state.players[state.activePlayerIndex]
  if (!active || active.type !== 'human') return null
  if (mode === 'wifi') return active.id === localPlayerId ? active.id : null
  if (mode === 'single') return active.id === 'p1' ? active.id : null
  return active.id
}

function localMahjongClaimResponderId(state: MahjongState, action?: Exclude<MahjongClaimResponse['action'], 'pass'>): string | null {
  const eligible = state.claimWindow?.eligiblePlayerIds.filter((playerId) => !state.claimWindow?.responses[playerId]) ?? []
  if (action) {
    return eligible.find((playerId) => mahjongLegalClaimOptions(state, playerId).some((option) => option.action === action)) ?? null
  }
  return eligible[0] ?? null
}

function mahjongClaimActionFromControl(action: MahjongControlAction): Exclude<MahjongClaimResponse['action'], 'pass'> | null {
  if (action === 'claimWin') return 'win'
  if (action === 'claimPong') return 'pong'
  if (action === 'claimKong') return 'kong'
  if (action === 'claimChow') return 'chow'
  return null
}

function modeDescription(language: Language, mode: GameMode): string {
  const descriptions: Record<Language, Record<GameMode, string>> = {
    en: {
      single: 'One local human against AI players.',
      hotseat: 'All players share this computer with hand privacy screens.',
      wifi: 'LAN players join a room hosted by this computer.',
      spectacular: 'AI-only table for watching simulations.',
    },
    zh: {
      single: '一名本地玩家对战 AI 玩家。',
      hotseat: '所有玩家共用这台电脑，并使用手牌隐私屏幕。',
      wifi: '同一局域网中的玩家加入主机房间。',
      spectacular: '仅 AI 玩家进行对局，用户观看。',
    },
    de: {
      single: 'Ein lokaler Mensch spielt gegen KI-Spieler.',
      hotseat: 'Alle Spieler teilen diesen Computer mit Sichtschutz vor jeder Hand.',
      wifi: 'Spieler im lokalen Netzwerk treten einem Host-Raum bei.',
      spectacular: 'Nur KI-Spieler; du schaust der Simulation zu.',
    },
  }
  return descriptions[language][mode]
}

function addOnInfo(language: Language): Array<{ id: AddOnPack; title: string; description: string }> {
  const copy: Record<Language, Array<{ id: AddOnPack; title: string; description: string }>> = {
    en: [
      { id: 'reverse', title: 'Reverse Pack', description: 'No U blocks, reverse penalties, and power reverses.' },
      { id: 'stack', title: 'Stack Pack', description: 'Legal draw stacking and mystery draw values.' },
      { id: 'speed', title: 'Speed Pack', description: 'Extra turns, speed matching, and lightning rounds.' },
      { id: 'swap', title: 'Swap Pack', description: 'Targeted swaps, pass hands, and draw-then-swap cards.' },
    ],
    zh: [
      { id: 'reverse', title: '反转包', description: '反弹阻挡、反转惩罚和强力反转。' },
      { id: 'stack', title: '叠加包', description: '允许摸牌叠加和随机摸牌值。' },
      { id: 'speed', title: '加速包', description: '额外回合、快速匹配和闪电回合。' },
      { id: 'swap', title: '交换包', description: '指定交换、传递手牌和摸牌后交换。' },
    ],
    de: [
      { id: 'reverse', title: 'Richtungs-Pack', description: 'Retour-Block, Richtungsstrafen und Power-Richtungswechsel.' },
      { id: 'stack', title: 'Stapel-Pack', description: 'Legales Stapeln von Ziehstrafen und Zufallswerte.' },
      { id: 'speed', title: 'Tempo-Pack', description: 'Extra-Zuge, schnelle Matches und Blitzrunden.' },
      { id: 'swap', title: 'Tausch-Pack', description: 'Zieltausch, Handweitergabe und Ziehen-dann-Tauschen.' },
    ],
  }
  return copy[language]
}

function visualThemeTitle(language: Language): string {
  if (language === 'zh') return '视觉主题'
  if (language === 'de') return 'Visuelle Themen'
  return 'Visual Themes'
}

function tableThemeTitle(language: Language): string {
  if (language === 'zh') return '桌面主题'
  if (language === 'de') return 'Tischdesign'
  return 'Table theme'
}

function deckThemeTitle(language: Language): string {
  if (language === 'zh') return '牌背主题'
  if (language === 'de') return 'Kartendeck'
  return 'Deck theme'
}

function animationSettingsTitle(language: Language): string {
  if (language === 'zh') return '动画设置'
  if (language === 'de') return 'Animationen'
  return 'Animation Settings'
}

function audioSettingsTitle(language: Language): string {
  if (language === 'zh') return '音频设置'
  if (language === 'de') return 'Audio'
  return 'Audio Settings'
}

function masterVolumeTitle(language: Language): string {
  if (language === 'zh') return '总音量'
  if (language === 'de') return 'Gesamtlautstärke'
  return 'Master volume'
}

function soundEffectsTitle(language: Language): string {
  if (language === 'zh') return '音效'
  if (language === 'de') return 'Soundeffekte'
  return 'Sound effects'
}

function soundEffectsDescription(language: Language): string {
  if (language === 'zh') return '为出牌、摸牌和动作事件播放短音效。'
  if (language === 'de') return 'Spielt kurze Effekte für Karten, Ziehen und Aktionen.'
  return 'Plays short effects for cards, draws, and action events.'
}

function soundEffectsVolumeTitle(language: Language): string {
  if (language === 'zh') return '音效音量'
  if (language === 'de') return 'Effektlautstärke'
  return 'Effects volume'
}

function backgroundMusicTitle(language: Language): string {
  if (language === 'zh') return '背景音乐'
  if (language === 'de') return 'Hintergrundmusik'
  return 'Background music'
}

function backgroundMusicDescription(language: Language): string {
  if (language === 'zh') return '根据游戏自动播放对应的原创循环音乐，默认关闭。'
  if (language === 'de') return 'Wählt automatisch eine passende originale Musikschleife; standardmäßig aus.'
  return 'Automatically selects an original looping theme for each game; off by default.'
}

function backgroundMusicVolumeTitle(language: Language): string {
  if (language === 'zh') return '音乐音量'
  if (language === 'de') return 'Musiklautstärke'
  return 'Music volume'
}

function volumePercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function roundStartFlourishTitle(language: Language): string {
  if (language === 'zh') return '开局花式洗牌'
  if (language === 'de') return 'Start-Flourish'
  return 'Round-start flourish'
}

function roundStartFlourishDescription(language: Language): string {
  if (language === 'zh') return '每局开始前播放短暂的牌组花式动画。'
  if (language === 'de') return 'Spielt vor jeder Runde eine kurze Karten-Show.'
  return 'Plays a short deck flourish before each round starts.'
}

function cardFlourishStyleTitle(language: Language): string {
  if (language === 'zh') return '花式样式'
  if (language === 'de') return 'Flourish-Stil'
  return 'Flourish style'
}

function dealAnimationTitle(language: Language): string {
  if (language === 'zh') return '发牌动画'
  if (language === 'de') return 'Austeil-Animation'
  return 'Deal animation'
}

function dealAnimationDescription(language: Language): string {
  if (language === 'zh') return '每局开始时用快速动画发牌。'
  if (language === 'de') return 'Teilt die Startkarten mit einer schnellen Animation aus.'
  return 'Deals starting cards with a quick animation.'
}

function winnerCelebrationTitle(language: Language): string {
  if (language === 'zh') return '胜利庆祝动画'
  if (language === 'de') return 'Siegerfeier'
  return 'Winner celebration'
}

function winnerCelebrationDescription(language: Language): string {
  if (language === 'zh') return '结算前显示 3 秒胜利文字和烟花。'
  if (language === 'de') return 'Zeigt vor der Wertung 3 Sekunden Siegertext und Feuerwerk.'
  return 'Shows 3 seconds of winner text and fireworks before scoring.'
}

function animationSpeedTitle(language: Language): string {
  if (language === 'zh') return '动画速度'
  if (language === 'de') return 'Animationsgeschwindigkeit'
  return 'Animation speed'
}

function animationSpeedName(language: Language, speed: AnimationSpeed): string {
  const copy: Record<Language, Record<AnimationSpeed, string>> = {
    en: { fast: 'Fast', normal: 'Normal', slow: 'Slow' },
    zh: { fast: '快速', normal: '正常', slow: '慢速' },
    de: { fast: 'Schnell', normal: 'Normal', slow: 'Langsam' },
  }
  return copy[language][speed]
}

function mahjongVisualControlTitle(language: Language, kind: keyof MahjongVisualTheme): string {
  const copy: Record<Language, Record<keyof MahjongVisualTheme, string>> = {
    en: { felt: 'Mahjong felt', frame: 'Mahjong frame', centerPattern: 'Center pattern', tileDeck: 'Tile deck' },
    zh: { felt: '麻将桌布', frame: '麻将桌框', centerPattern: '中心图案', tileDeck: '麻将牌材质' },
    de: { felt: 'Mahjong-Tuch', frame: 'Mahjong-Rahmen', centerPattern: 'Mittelmotiv', tileDeck: 'Mahjong-Steine' },
  }
  return copy[language][kind]
}

function mahjongVisualOptionName(language: Language, kind: keyof MahjongVisualTheme, value: MahjongVisualTheme[keyof MahjongVisualTheme]): string {
  const copy = {
    en: {
      felt: { classicGreen: 'Classic green', skyBlue: 'Sky blue', goldenBeach: 'Golden beach', chineseRed: 'Chinese red' },
      frame: { classicMahjong: 'Classic Mahjong table', vintage: 'Vintage', premiumWood: 'Premium wood', luxusKing: 'Luxus king' },
      centerPattern: { none: 'None', dragon: 'Chinese dragon', lion: 'Chinese lion', faCai: '发财', yuanBao: 'Gold ingot' },
      tileDeck: { classicIvory: 'Classic ivory', jadeGreen: 'Jade green', golden: 'Golden', ruby: 'Ruby', sapphire: 'Sapphire' },
    },
    zh: {
      felt: { classicGreen: '经典绿色', skyBlue: '天空蓝', goldenBeach: '金色沙滩', chineseRed: '中国红' },
      frame: { classicMahjong: '经典麻将桌', vintage: '复古', premiumWood: '高级木纹', luxusKing: '奢华王者' },
      centerPattern: { none: '无', dragon: '中国龙', lion: '中国狮', faCai: '发财', yuanBao: '金元宝' },
      tileDeck: { classicIvory: '经典象牙白', jadeGreen: '翡翠绿', golden: '金色', ruby: '红宝石', sapphire: '蓝宝石' },
    },
    de: {
      felt: { classicGreen: 'Klassisches Grün', skyBlue: 'Himmelblau', goldenBeach: 'Goldener Strand', chineseRed: 'Chinesisches Rot' },
      frame: { classicMahjong: 'Klassischer Mahjong-Tisch', vintage: 'Vintage', premiumWood: 'Premium-Holz', luxusKing: 'Luxus King' },
      centerPattern: { none: 'Keins', dragon: 'Chinesischer Drache', lion: 'Chinesischer Loewe', faCai: '发财', yuanBao: 'Goldbarren' },
      tileDeck: { classicIvory: 'Klassisches Elfenbein', jadeGreen: 'Jadegrün', golden: 'Golden', ruby: 'Rubin', sapphire: 'Saphir' },
    },
  } satisfies Record<Language, {
    felt: Record<MahjongTableFeltTheme, string>
    frame: Record<MahjongTableFrameTheme, string>
    centerPattern: Record<MahjongCenterPattern, string>
    tileDeck: Record<MahjongTileDeckTheme, string>
  }>
  if (kind === 'felt') return copy[language].felt[value as MahjongTableFeltTheme]
  if (kind === 'frame') return copy[language].frame[value as MahjongTableFrameTheme]
  if (kind === 'centerPattern') return copy[language].centerPattern[value as MahjongCenterPattern]
  return copy[language].tileDeck[value as MahjongTileDeckTheme]
}

function avatarTitle(language: Language): string {
  if (language === 'zh') return '头像'
  return 'Avatar'
}

function hardwarePopupDurationTitle(language: Language): string {
  if (language === 'zh') return '硬件弹窗时长'
  if (language === 'de') return 'Hardware-Popup'
  return 'Hardware popup'
}

function reducedMotionTitle(language: Language): string {
  if (language === 'zh') return '减少动画'
  if (language === 'de') return 'Reduzierte Bewegung'
  return 'Reduced motion'
}

function reducedMotionDescription(language: Language): string {
  if (language === 'zh') return '关闭桌面脉冲和卡牌入场动画。'
  if (language === 'de') return 'Schaltet Tischimpulse und Kartenanimationen aus.'
  return 'Turns off table pulses and card entrance animation.'
}

function h2oOptionsTitle(language: Language): string {
  if (language === 'zh') return 'H2O 变体'
  if (language === 'de') return 'H2O-Variante'
  return 'H2O Variation'
}

function h2oSplashTitle(language: Language): string {
  if (language === 'zh') return '启用 Splash 漩涡'
  if (language === 'de') return 'Splash-Whirlpool aktivieren'
  return 'Enable Splash Whirlpool'
}

function h2oSplashDescription(language: Language): string {
  if (language === 'zh') return '0、2 和大雨牌会触发模拟漩涡；计分改为先赢 3 局。'
  if (language === 'de') return '0, 2 und Wolkenbruch-Karten losen den simulierten Whirlpool aus; zuerst 3 Hande gewinnt.'
  return '0, 2, and Downpour cards trigger the simulated Whirlpool; first to 3 hands wins.'
}

function h2oSplashTargetLabel(language: Language): string {
  if (language === 'zh') return '3 局'
  if (language === 'de') return '3 Hande'
  return '3 hands'
}

function zeroTakeDiscardLabel(language: Language): string {
  if (language === 'zh') return '拿弃牌'
  if (language === 'de') return 'Ablage nehmen'
  return 'Take discard'
}

function zeroDiscardDrawnLabel(language: Language): string {
  if (language === 'zh') return '弃掉摸牌'
  if (language === 'de') return 'Gezogene ablegen'
  return 'Discard drawn'
}

function phase10TakeDiscardLabel(language: Language): string {
  if (language === 'zh') return '拿弃牌'
  if (language === 'de') return 'Ablage nehmen'
  return 'Take discard'
}

function skipBoDrawLabel(language: Language): string {
  if (language === 'zh') return '摸到 5 张'
  if (language === 'de') return 'Auf 5 ziehen'
  return 'Draw to 5'
}

function diceTakeLineLabel(language: Language): string {
  if (language === 'zh') return '拿骰/重掷'
  if (language === 'de') return 'Nehmen/Würfeln'
  return 'Take / reroll'
}

function skipBoDiscardPileLabel(language: Language, pileIndex: number): string {
  if (language === 'zh') return `弃到堆 ${pileIndex + 1}`
  if (language === 'de') return `Ablage ${pileIndex + 1}`
  return `Discard ${pileIndex + 1}`
}

function skipBoStockLine(language: Language, player: Player): string {
  const stock = player.skipBoStockPile?.length ?? 0
  if (language === 'zh') return `库存牌堆：${stock} 张`
  if (language === 'de') return `Stockstapel: ${stock} Karten`
  return `Stock pile: ${stock} cards`
}

function skipBoBuildLine(language: Language, state: GameState): string {
  const piles = state.skipBoBuildPiles ?? [[], [], [], []]
  const values = piles.map((pile) => {
    const nextValue = pile.length + 1
    return nextValue <= 12 ? String(nextValue) : '-'
  }).join(', ')
  if (language === 'zh') return `建筑堆需要：${values}`
  if (language === 'de') return `Bau-Stapel brauchen: ${values}`
  return `Build piles need: ${values}`
}

function skipBoTurnHint(language: Language, hasDrawn: boolean, discardPileIndex: number | null): string {
  if (!hasDrawn) {
    if (language === 'zh') return '先摸到 5 张手牌。'
    if (language === 'de') return 'Ziehe zuerst auf 5 Handkarten.'
    return 'Draw up to five cards first.'
  }
  if (discardPileIndex !== null) {
    if (language === 'zh') return `点击一张手牌弃到弃牌堆 ${discardPileIndex + 1} 并结束回合。`
    if (language === 'de') return `Klicke eine Handkarte für Ablagestapel ${discardPileIndex + 1}; danach endet dein Zug.`
    return `Click a hand card to discard to pile ${discardPileIndex + 1} and end your turn.`
  }
  if (language === 'zh') return '点击可建造的库存牌、弃牌堆顶牌或手牌；要结束回合，先选择一个弃牌堆。'
  if (language === 'de') return 'Spiele passende Stock-, Ablage- oder Handkarten; zum Beenden erst einen Ablagestapel wählen.'
  return 'Play legal stock, discard, or hand cards; to end, choose a discard pile first.'
}

function skipBoDiscardSummary(language: Language, player: Player): string {
  const summary = (player.skipBoDiscardPiles ?? [[], [], [], []]).map((pile, index) => {
    const top = pile.at(-1)
    return `${index + 1}: ${top ? cardName(language, top) : '-'}`
  }).join(' | ')
  if (language === 'zh') return `弃牌堆：${summary}`
  if (language === 'de') return `Ablagen: ${summary}`
  return `Discards: ${summary}`
}

function skipBoPlayableNowLine(language: Language, state: GameState): string {
  const current = activePlayer(state)
  if (!state.drewThisTurn) {
    if (language === 'zh') return '当前可出：先摸到 5 张后再判断。'
    if (language === 'de') return 'Spielbar jetzt: erst auf 5 ziehen.'
    return 'Playable now: draw to five first.'
  }
  const playable = skipBoPlayableSourceLabels(language, state, current)
  if (playable.length === 0) {
    if (language === 'zh') return '当前可出：没有。请选择一个弃牌堆结束回合。'
    if (language === 'de') return 'Spielbar jetzt: nichts. Wähle einen Ablagestapel zum Beenden.'
    return 'Playable now: none. Choose a discard pile to end the turn.'
  }
  const list = playable.slice(0, 7).join(', ')
  const suffix = playable.length > 7 ? '...' : ''
  if (language === 'zh') return `当前可出：${list}${suffix}`
  if (language === 'de') return `Spielbar jetzt: ${list}${suffix}`
  return `Playable now: ${list}${suffix}`
}

function skipBoPriorityTip(language: Language, state: GameState, discardPileIndex: number | null): string {
  const current = activePlayer(state)
  if (!state.drewThisTurn) {
    if (language === 'zh') return '提示：摸牌不会结束回合；摸到 5 张后可以连续建造。'
    if (language === 'de') return 'Tipp: Ziehen beendet den Zug nicht; danach kannst du mehrere Karten bauen.'
    return 'Tip: drawing does not end the turn; after drawing, you can build multiple cards.'
  }
  if (discardPileIndex !== null) {
    if (language === 'zh') return '提示：弃牌堆只有最上面一张以后能出，尽量把大数字或暂时用不上的牌放在合适的堆上。'
    if (language === 'de') return 'Tipp: Spater ist nur die oberste Ablage spielbar; lege hohe oder unpassende Karten bewusst ab.'
    return 'Tip: only the top discard card is playable later, so park high or currently useless cards carefully.'
  }
  const stockTop = current.skipBoStockPile?.at(-1)
  if (stockTop && skipBoCardCanBuild(stockTop, state)) {
    if (language === 'zh') return `优先：先出库存牌 ${cardName(language, stockTop)}，因为清空库存牌才会获胜。`
    if (language === 'de') return `Prioritat: Spiele die Stockkarte ${cardName(language, stockTop)} zuerst, denn der Stock gewinnt das Spiel.`
    return `Priority: play stock ${cardName(language, stockTop)} first, because clearing stock wins.`
  }
  const discardPlayable = (current.skipBoDiscardPiles ?? []).findIndex((pile) => {
    const top = pile.at(-1)
    return Boolean(top && skipBoCardCanBuild(top, state))
  })
  if (discardPlayable >= 0) {
    if (language === 'zh') return `优先：弃牌堆 ${discardPlayable + 1} 的顶牌可以出，先清掉它能打开下面的牌。`
    if (language === 'de') return `Prioritat: Ablage ${discardPlayable + 1} ist spielbar; raume sie frei.`
    return `Priority: discard pile ${discardPlayable + 1} can build; clear it to uncover the card below.`
  }
  const handPlayable = current.hand.find((card) => skipBoCardCanBuild(card, state))
  if (handPlayable) {
    if (language === 'zh') return `可选：手牌 ${cardName(language, handPlayable)} 可以建造；如果没有更好的库存机会，就先出它。`
    if (language === 'de') return `Option: Handkarte ${cardName(language, handPlayable)} ist spielbar; nutze sie, wenn kein Stock-Zug offen ist.`
    return `Option: hand ${cardName(language, handPlayable)} can build; play it if no stock move is open.`
  }
  if (language === 'zh') return '建议：没有可建造的牌时，选择一个弃牌堆并弃掉最不容易马上用到的牌。'
  if (language === 'de') return 'Empfehlung: Wenn nichts baut, wähle eine Ablage und wirf die am wenigsten nützliche Karte ab.'
  return 'Recommendation: when nothing builds, choose a discard pile and discard the least useful hand card.'
}

function skipBoPlayableSourceLabels(language: Language, state: GameState, player: Player): string[] {
  const labels: string[] = []
  const stockTop = player.skipBoStockPile?.at(-1)
  if (stockTop && skipBoCardCanBuild(stockTop, state)) {
    labels.push(language === 'zh' ? `库存 ${cardName(language, stockTop)}` : language === 'de' ? `Stock ${cardName(language, stockTop)}` : `stock ${cardName(language, stockTop)}`)
  }
  ;(player.skipBoDiscardPiles ?? []).forEach((pile, index) => {
    const top = pile.at(-1)
    if (top && skipBoCardCanBuild(top, state)) {
      labels.push(language === 'zh' ? `弃牌堆 ${index + 1} ${cardName(language, top)}` : language === 'de' ? `Ablage ${index + 1} ${cardName(language, top)}` : `discard ${index + 1} ${cardName(language, top)}`)
    }
  })
  for (const card of player.hand) {
    if (skipBoCardCanBuild(card, state)) {
      labels.push(language === 'zh' ? `手牌 ${cardName(language, card)}` : language === 'de' ? `Hand ${cardName(language, card)}` : `hand ${cardName(language, card)}`)
    }
  }
  return labels
}

function skipBoCardCanBuild(card: Card, state: GameState): boolean {
  const piles = state.skipBoBuildPiles ?? [[], [], [], []]
  return piles.some((pile) => {
    const needed = pile.length + 1
    return needed <= 12 && (card.kind === 'wild' || card.value === needed)
  })
}

function phase10CompleteLabel(language: Language): string {
  if (language === 'zh') return '完成阶段'
  if (language === 'de') return 'Phase legen'
  return 'Lay phase'
}

function phase10DrawFirstLabel(language: Language): string {
  if (language === 'zh') return '先摸牌或拿弃牌，然后才能完成阶段'
  if (language === 'de') return 'Erst ziehen oder die Ablage nehmen, dann die Phase legen'
  return 'Draw or take discard first, then lay the phase'
}

function phase10StatusLabel(language: Language, player: Player): string {
  const phase = player.phase10Phase ?? 1
  if (language === 'zh') return player.phase10Completed ? `阶段 ${phase} 已完成，出完后进入阶段 ${phase + 1}` : `阶段 ${phase}`
  if (language === 'de') return player.phase10Completed ? `Phase ${phase} erledigt, nach dem Ausgehen folgt Phase ${phase + 1}` : `Phase ${phase}`
  return player.phase10Completed ? `Phase ${phase} laid; empty your hand to start phase ${phase + 1} next round` : `Phase ${phase}`
}

function phase10GoalText(language: Language, phase: number): string {
  const goals: Record<Language, string[]> = {
    en: [
      'two three-card sets',
      'one three-card set plus one run of 4',
      'one four-card set plus one run of 4',
      'one run of 7',
      'one run of 8',
      'one run of 9',
      'two four-card sets',
      'seven cards of one color',
      'one five-card set plus one pair',
      'one five-card set plus one three-card set',
    ],
    zh: [
      '两组三张相同数字',
      '一组三张相同数字加四张顺子',
      '一组四张相同数字加四张顺子',
      '七张顺子',
      '八张顺子',
      '九张顺子',
      '两组四张相同数字',
      '七张同色牌',
      '一组五张相同数字加一组两张相同数字',
      '一组五张相同数字加一组三张相同数字',
    ],
    de: [
      'zwei Drillinge',
      'ein Drilling plus eine Viererfolge',
      'ein Vierling plus eine Viererfolge',
      'eine Siebenerfolge',
      'eine Achterfolge',
      'eine Neunerfolge',
      'zwei Vierlinge',
      'sieben Karten einer Farbe',
      'ein Fünfling plus ein Paar',
      'ein Fünfling plus ein Drilling',
    ],
  }
  return goals[language][Math.max(0, Math.min(9, phase - 1))]
}

function phase10GoalLabel(language: Language, phase: number): string {
  const goal = phase10GoalText(language, phase)
  if (language === 'zh') return `目标：${goal}`
  if (language === 'de') return `Ziel: ${goal}`
  return `Goal: ${goal}`
}

function phase10TurnHint(language: Language, hasDrawn: boolean, player: Player): string {
  if (player.phase10Completed) {
    if (language === 'zh') return hasDrawn ? '本阶段已完成。点击可接到已完成阶段的牌来减少手牌，或点击不能接的牌弃掉并结束回合。' : '本阶段已完成。先摸牌或拿弃牌，然后接牌或弃牌；下一阶段要等下一轮。'
    if (language === 'de') return hasDrawn ? 'Phase erledigt. Klicke passende Karten zum Anlegen oder eine nicht passende Karte zum Abwerfen.' : 'Phase erledigt. Ziehe oder nimm die Ablage, dann lege an oder wirf ab; die nächste Phase kommt nächste Runde.'
    return hasDrawn ? 'Click compatible cards to hit them; click a non-compatible card to discard and end the turn.' : 'You do not wait for everyone. Draw or take discard, then hit or discard.'
  }
  if (language === 'zh') return hasDrawn ? '可以尝试完成阶段，然后点击一张手牌弃掉。' : '即使阶段已经完成，也要先摸牌或拿顶端弃牌。'
  if (language === 'de') return hasDrawn ? 'Lege deine Phase, falls möglich, und klicke dann eine Handkarte zum Abwerfen.' : 'Auch mit fertiger Phase zuerst ziehen oder Ablage nehmen.'
  return hasDrawn ? 'Lay your phase if possible, then click one hand card to discard.' : 'Even with a ready phase, draw or take discard first.'
}

function zeroFaceDownLabel(language: Language, count: number): string {
  if (language === 'zh') return `盖牌：${count}`
  if (language === 'de') return `Verdeckt: ${count}`
  return `Face-down: ${count}`
}

function zeroDrawFirstHint(language: Language): string {
  if (language === 'zh') return '先摸牌或拿弃牌'
  if (language === 'de') return 'Erst ziehen oder Ablage nehmen'
  return 'Draw or take discard first'
}

function memoryCollectedLine(language: Language, player?: Player | null): string {
  const count = player?.hand.length ?? 0
  const points = player?.score ?? 0
  if (language === 'zh') return `已收集: ${count} 张 | ${points} 分`
  if (language === 'de') return `Gesammelt: ${count} Karten | ${points} Punkte`
  return `Collected: ${count} cards | ${points} pts`
}

function memoryOptionsTitle(language: Language): string {
  if (language === 'zh') return '记忆规则'
  if (language === 'de') return 'Memory-Regeln'
  return 'Memory rules'
}

function memoryDifficultyLabel(language: Language, difficulty: MemoryDifficulty, game?: GameVariant): string {
  if (game === 'guoTripleMemory' || game === 'guoTripleMemoryAction') {
    if (difficulty === 'easy') return language === 'zh' ? '简单 6x3' : language === 'de' ? 'Leicht 6x3' : 'Easy 6x3'
    if (difficulty === 'medium') return language === 'zh' ? '中等 6x6' : language === 'de' ? 'Mittel 6x6' : 'Medium 6x6'
    return language === 'zh' ? '困难 6x8' : language === 'de' ? 'Schwer 6x8' : 'Hard 6x8'
  }
  if (difficulty === 'easy') return language === 'zh' ? '简单 4x4' : language === 'de' ? 'Leicht 4x4' : 'Easy 4x4'
  if (difficulty === 'medium') return language === 'zh' ? '中等 6x6' : language === 'de' ? 'Mittel 6x6' : 'Medium 6x6'
  return language === 'zh' ? '困难 8x8' : language === 'de' ? 'Schwer 8x8' : 'Hard 8x8'
}

function memoryMatchModeLabel(language: Language, matchMode: MemoryMatchMode): string {
  if (matchMode === 'number') return language === 'zh' ? '数字匹配' : language === 'de' ? 'Zahl' : 'Number'
  if (matchMode === 'color') return language === 'zh' ? '颜色匹配' : language === 'de' ? 'Farbe' : 'Color'
  return language === 'zh' ? '数字+颜色' : language === 'de' ? 'Zahl + Farbe' : 'Number + color'
}

function memoryRevealDurationTitle(language: Language): string {
  if (language === 'zh') return '翻牌显示时间'
  if (language === 'de') return 'Aufdeckzeit'
  return 'Reveal time'
}

function barbieChoiceTitle(language: Language): string {
  if (language === 'zh') return '选择两个 Barbie 颜色'
  if (language === 'de') return 'Barbie-Farben wählen'
  return 'Choose Barbie colors'
}

function barbieChoiceActiveLabel(language: Language): string {
  if (language === 'zh') return '新的当前颜色'
  if (language === 'de') return 'Neue aktive Farbe'
  return 'New active color'
}

function barbieChoiceDiscardLabel(language: Language): string {
  if (language === 'zh') return '弃牌并补牌的颜色'
  if (language === 'de') return 'Farbe zum Abwerfen und Nachziehen'
  return 'Discard and redraw color'
}

function barbieChoiceConfirmLabel(language: Language): string {
  if (language === 'zh') return '确认 Barbie 颜色'
  if (language === 'de') return 'Barbie-Farben bestätigen'
  return 'Confirm Barbie colors'
}

function barbieChoiceHint(language: Language, activeColor?: UnoColor, discardColor?: UnoColor): string {
  const active = activeColor ? colorName(language, activeColor) : null
  const discard = discardColor ? colorName(language, discardColor) : null
  if (language === 'zh') return `Played With Too Much 需要新的当前颜色和弃牌颜色。当前选择：${active ?? '未选当前颜色'} / ${discard ?? '未选弃牌颜色'}。`
  if (language === 'de') return `Played With Too Much braucht aktive Farbe und Ablagefarbe. Aktuell: ${active ?? 'keine aktive Farbe'} / ${discard ?? 'keine Ablagefarbe'}.`
  return `Played With Too Much needs an active color and a discard color. Current: ${active ?? 'no active color'} / ${discard ?? 'no discard color'}.`
}

function neighborOptionsTitle(language: Language): string {
  if (language === 'zh') return '相邻数字规则'
  if (language === 'de') return 'Nachbar-Regeln'
  return 'Neighbor rules'
}

function neighborModeLabel(language: Language, colorConstrained: boolean): string {
  if (colorConstrained) {
    if (language === 'zh') return '数字 + 颜色'
    if (language === 'de') return 'Zahl + Farbe'
    return 'Number + color'
  }
  if (language === 'zh') return '仅数字'
  if (language === 'de') return 'Nur Zahl'
  return 'Number only'
}

function neighborModeDescription(language: Language, colorConstrained: boolean): string {
  if (colorConstrained) {
    if (language === 'zh') return '数字必须相同或相邻，并且颜色必须匹配当前颜色。'
    if (language === 'de') return 'Die Zahl muss gleich oder benachbart sein, und die Farbe muss zur aktiven Farbe passen.'
    return 'The number must be same or neighboring, and the color must match the active color.'
  }
  if (language === 'zh') return '只检查数字是否相同或相邻；打出不同颜色的数字牌会改变当前颜色。'
  if (language === 'de') return 'Nur die Zahl muss gleich oder benachbart sein; eine andere Farbe darf die aktive Farbe wechseln.'
  return 'Only the number must be same or neighboring; a different-color number card changes the active color.'
}

function neighborWildChoiceTitle(language: Language): string {
  if (language === 'zh') return '选择颜色和锚点数字'
  if (language === 'de') return 'Farbe und Ankerzahl wählen'
  return 'Choose color and anchor number'
}

function neighborWildChoiceHint(language: Language, color?: UnoColor, anchor?: number): string {
  const colorText = color ? colorName(language, color) : null
  const anchorText = typeof anchor === 'number' ? String(anchor) : null
  if (language === 'zh') return `Wild 需要颜色和锚点数字。当前选择：${colorText ?? '未选颜色'} / ${anchorText ?? '未选数字'}。`
  if (language === 'de') return `Wild braucht Farbe und Ankerzahl. Aktuell: ${colorText ?? 'keine Farbe'} / ${anchorText ?? 'keine Zahl'}.`
  return `Wild needs a color and anchor number. Current: ${colorText ?? 'no color'} / ${anchorText ?? 'no number'}.`
}

function neighborAnchorLine(language: Language, state: GameState): string {
  const top = topCard(state)
  const rawAnchor = typeof state.neighborAnchor === 'number'
    ? state.neighborAnchor
    : top?.kind === 'number' && typeof top.value === 'number'
      ? top.value
      : null
  if (rawAnchor === null) {
    if (language === 'zh') return '锚点数字：等待数字牌或 Wild'
    if (language === 'de') return 'Ankerzahl: wartet auf Zahl oder Wild'
    return 'Anchor number: waiting for number or Wild'
  }
  const anchor = rawAnchor
  const before = (anchor + 9) % 10
  const after = (anchor + 1) % 10
  if (language === 'zh') return `锚点数字: ${anchor} | 可出 ${before}, ${anchor}, ${after}`
  if (language === 'de') return `Ankerzahl: ${anchor} | spielbar ${before}, ${anchor}, ${after}`
  return `Anchor: ${anchor} | playable ${before}, ${anchor}, ${after}`
}

function hiLoOptionsTitle(language: Language): string {
  if (language === 'zh') return '高低规则'
  if (language === 'de') return 'Hi-Lo-Regel'
  return 'Hi-Lo Rules'
}

function hiLoModeLabel(language: Language, colorConstrained: boolean): string {
  if (colorConstrained) {
    if (language === 'zh') return '数字 + 颜色'
    if (language === 'de') return 'Zahl + Farbe'
    return 'Number + color'
  }
  if (language === 'zh') return '仅数字'
  if (language === 'de') return 'Nur Zahl'
  return 'Number only'
}

function hiLoModeDescription(language: Language, colorConstrained: boolean): string {
  if (colorConstrained) {
    if (language === 'zh') return '数字必须符合当前高低方向，并且颜色必须匹配当前颜色。'
    if (language === 'de') return 'Die Zahl muss der aktuellen Richtung folgen, und die Farbe muss zur aktiven Farbe passen.'
    return 'The number must follow the current direction, and the color must match the active color.'
  }
  if (language === 'zh') return '只检查数字是否符合当前高低方向；不同颜色的数字牌可以改变当前颜色。'
  if (language === 'de') return 'Nur die Zahl muss der aktuellen Richtung folgen; eine andere Farbe darf die aktive Farbe wechseln.'
  return 'Only the number must follow the current direction; a different-color number card may change the active color.'
}

function hiLoWildChoiceTitle(language: Language): string {
  if (language === 'zh') return '选择颜色和当前数字'
  if (language === 'de') return 'Farbe und aktive Zahl wählen'
  return 'Choose color and active number'
}

function hiLoWildChoiceHint(language: Language, color?: UnoColor, anchor?: number): string {
  const colorText = color ? colorName(language, color) : null
  const anchorText = typeof anchor === 'number' ? String(anchor) : null
  if (language === 'zh') return `Wild 需要颜色和当前数字。当前选择：${colorText ?? '未选颜色'} / ${anchorText ?? '未选数字'}。方向会自动重新随机。`
  if (language === 'de') return `Wild braucht Farbe und aktive Zahl. Aktuell: ${colorText ?? 'keine Farbe'} / ${anchorText ?? 'keine Zahl'}. Die Richtung wird automatisch neu gewürfelt.`
  return `Wild needs a color and active number. Current: ${colorText ?? 'no color'} / ${anchorText ?? 'no number'}. The direction rerolls automatically.`
}

function hiLoStatusLine(language: Language, state: GameState): string {
  const top = topCard(state)
  const rawAnchor = typeof state.hiLoAnchor === 'number'
    ? state.hiLoAnchor
    : top?.kind === 'number' && typeof top.value === 'number'
      ? top.value
      : null
  const direction = state.hiLoDirection ?? 'higher'
  const directionText = hiLoDirectionLabel(language, direction)
  if (rawAnchor === null) {
    if (language === 'zh') return `高低: ${directionText} | 等待数字牌或 Wild`
    if (language === 'de') return `Hi-Lo: ${directionText} | wartet auf Zahl oder Wild`
    return `Hi-Lo: ${directionText} | waiting for number or Wild`
  }
  const anchor = Math.max(0, Math.min(9, Math.trunc(rawAnchor)))
  const playable = direction === 'higher'
    ? Array.from({ length: 9 - anchor }, (_, index) => anchor + index + 1)
    : Array.from({ length: anchor }, (_, index) => index)
  const playableText = playable.length > 0 ? playable.join(', ') : (language === 'zh' ? '无数字牌' : language === 'de' ? 'keine Zahlen' : 'no numbers')
  if (language === 'zh') return `当前数字: ${anchor} | ${directionText} | 可出 ${playableText}`
  if (language === 'de') return `Aktive Zahl: ${anchor} | ${directionText} | spielbar ${playableText}`
  return `Active number: ${anchor} | ${directionText} | playable ${playableText}`
}

function hiLoDirectionLabel(language: Language, direction: 'higher' | 'lower'): string {
  if (direction === 'higher') {
    if (language === 'zh') return '更高'
    if (language === 'de') return 'Höher'
    return 'Higher'
  }
  if (language === 'zh') return '更低'
  if (language === 'de') return 'Tiefer'
  return 'Lower'
}

function passageOptionsTitle(language: Language): string {
  if (language === 'zh') return '配对规则'
  if (language === 'de') return 'Paar-Regel'
  return 'Pair Rules'
}

function passageModeDescription(language: Language, matchMode: MemoryMatchMode): string {
  if (matchMode === 'color') {
    if (language === 'zh') return '两张牌颜色相同即可配对，数字不重要。Wild 会声明为配对牌的颜色和数字。'
    if (language === 'de') return 'Zwei Karten bilden ein Paar, wenn die Farbe gleich ist. Wild deklariert Farbe und Zahl der Partnerkarte.'
    return 'Two cards pair when their color matches. Wild declares the paired card color and number.'
  }
  if (matchMode === 'both') {
    if (language === 'zh') return '两张牌必须颜色和数字都相同。Wild 可以代替一张完全相同的牌。'
    if (language === 'de') return 'Farbe und Zahl müssen gleich sein. Wild ersetzt eine exakt passende Karte.'
    return 'Both color and number must match. Wild stands in for an exact matching card.'
  }
  if (language === 'zh') return '两张牌数字相同即可配对，颜色不重要。'
  if (language === 'de') return 'Zwei Karten bilden ein Paar, wenn die Zahl gleich ist; Farbe ist egal.'
  return 'Two cards pair when their number matches; color does not matter.'
}

function passageTakeFaceUpLabel(language: Language): string {
  if (language === 'zh') return '拿明牌'
  if (language === 'de') return 'Offene nehmen'
  return 'Take face up'
}

function passageTakeSlotLabel(language: Language): string {
  if (language === 'zh') return '拿暗格'
  if (language === 'de') return 'Passage nehmen'
  return 'Take passage'
}

function passageSkipPairLabel(language: Language): string {
  if (language === 'zh') return '不配对'
  if (language === 'de') return 'Kein Paar'
  return 'Skip pair'
}

function passagePassFaceUpLabel(language: Language): string {
  if (language === 'zh') return '传明牌'
  if (language === 'de') return 'Offen passen'
  return 'Pass face up'
}

function passagePassFaceDownLabel(language: Language): string {
  if (language === 'zh') return '传暗牌'
  if (language === 'de') return 'Verdeckt passen'
  return 'Pass face down'
}

function passageQuickestBonusLabel(language: Language): string {
  if (language === 'zh') return '最快出完奖励'
  if (language === 'de') return 'Schnellster-Ausgang-Bonus'
  return 'Quickest-run bonus'
}

function passageCollectedLine(language: Language, player?: Player): string {
  const points = (player?.passagePairs ?? []).reduce((sum, pair) => sum + pair.score, 0)
  if (language === 'zh') return `配对分: ${points}`
  if (language === 'de') return `Paarpunkte: ${points}`
  return `Pair points: ${points}`
}

function passagePhaseLine(language: Language, state: GameState): string {
  const phase = state.passageTurn?.phase ?? 'take'
  const taken = state.passageTurn?.takenCard
  if (phase === 'pair' && taken) {
    if (language === 'zh') return `阶段: 配对 | 已拿 ${cardName(language, taken)}`
    if (language === 'de') return `Phase: Paar | genommen ${cardName(language, taken)}`
    return `Phase: Pair | took ${cardName(language, taken)}`
  }
  if (phase === 'pass') {
    if (language === 'zh') return '阶段: 传出一张牌'
    if (language === 'de') return 'Phase: Eine Karte passen'
    return 'Phase: Pass one card'
  }
  if (language === 'zh') return '阶段: 拿一张牌'
  if (language === 'de') return 'Phase: Karte nehmen'
  return 'Phase: Take one card'
}

function passageTurnHint(language: Language, state: GameState, passMode: 'faceUp' | 'faceDown' | null): string {
  const phase = state.passageTurn?.phase ?? 'take'
  if (phase === 'pair') {
    const taken = state.passageTurn?.takenCard
    const playable = taken ? playableCards(activePlayer(state), state).length : 0
    if (playable > 0) {
      if (language === 'zh') return `点击一张高亮手牌与 ${taken ? cardName(language, taken) : ''} 配对，或选择不配对。`
      if (language === 'de') return `Klicke eine markierte Handkarte für ein Paar mit ${taken ? cardName(language, taken) : ''}, oder überspringe.`
      return `Click a raised hand card to pair with ${taken ? cardName(language, taken) : 'the taken card'}, or skip the pair.`
    }
    if (language === 'zh') return '没有可配对的手牌，选择不配对后再传出一张牌。'
    if (language === 'de') return 'Kein Paar möglich; Überspringe und passe danach eine Karte.'
    return 'No pair is available; skip the pair, then pass one card.'
  }
  if (phase === 'pass') {
    if (!passMode) {
      if (language === 'zh') return '先选择传明牌或传暗牌，然后点击一张手牌。'
      if (language === 'de') return 'Wähle zuerst offen oder verdeckt, dann klicke eine Handkarte.'
      return 'Choose face up or face down, then click one hand card.'
    }
    if (language === 'zh') return passMode === 'faceUp' ? '点击一张手牌作为明牌传出。' : '点击一张手牌作为暗牌传出。'
    if (language === 'de') return passMode === 'faceUp' ? 'Klicke eine Handkarte zum offenen Passen.' : 'Klicke eine Handkarte zum verdeckten Passen.'
    return passMode === 'faceUp' ? 'Click one hand card to pass it face up.' : 'Click one hand card to pass it face down.'
  }
  if (language === 'zh') return '从明牌、暗格或牌库中拿一张牌。'
  if (language === 'de') return 'Nimm eine Karte von offenem Stapel, Passage oder Deck.'
  return 'Take one card from the face-up pile, passage slot, or draw deck.'
}

function memoryBoardLine(language: Language, state: GameState): string {
  const remaining = state.memoryBoard ? state.memoryBoard.slots.filter((slot) => !slot.collectedByPlayerId).length : 0
  if (language === 'zh') return `桌面剩余: ${remaining} 张`
  if (language === 'de') return `Auf dem Tisch: ${remaining} Karten`
  return `Table cards: ${remaining}`
}

function memoryTurnHint(language: Language, state: GameState): string {
  const selected = state.memoryBoard?.selectedSlotIndexes.length ?? 0
  const matchMode = state.memoryBoard?.matchMode ?? 'number'
  const cardsPerMatch = state.memoryBoard?.cardsPerMatch ?? 2
  const needed = Math.max(0, cardsPerMatch - selected)
  if (cardsPerMatch === 3) {
    if (state.memoryBoard?.pendingMatchIndexes?.length) {
      if (language === 'zh') return '匹配成功的三张牌会短暂显示，然后被当前玩家收集。'
      if (language === 'de') return 'Das passende Triple bleibt kurz sichtbar und wird dann gesammelt.'
      return 'The matching triple stays visible briefly, then it is collected.'
    }
    if (state.memoryBoard?.pendingMismatchIndexes?.length) {
      if (language === 'zh') return '不匹配的三张牌会短暂显示，然后翻回背面。'
      if (language === 'de') return 'Die drei falschen Karten bleiben kurz sichtbar und drehen sich dann um.'
      return 'The mismatched triple stays visible briefly, then flips back.'
    }
    if (selected > 0) {
      if (language === 'zh') return `再选择 ${needed} 张牌，尝试完成${memoryMatchModeLabel(language, matchMode)}三张匹配。`
      if (language === 'de') return `Wähle noch ${needed} Karte${needed === 1 ? '' : 'n'} für ein ${memoryMatchModeLabel(language, matchMode)}-Triple.`
      return `Choose ${needed} more card${needed === 1 ? '' : 's'} for a ${memoryMatchModeLabel(language, matchMode).toLowerCase()} triple.`
    }
    if (language === 'zh') return `选择三张背面朝上的牌。${memoryMatchModeLabel(language, matchMode)}成功即可收集，并继续行动。`
    if (language === 'de') return `Wähle drei verdeckte Karten. Ein ${memoryMatchModeLabel(language, matchMode)}-Triple wird gesammelt und du bist erneut dran.`
    return `Choose three face-down cards. A ${memoryMatchModeLabel(language, matchMode).toLowerCase()} triple collects all three and gives another turn.`
  }
  if (state.memoryBoard?.pendingMatchIndexes?.length) {
    if (language === 'zh') return '匹配成功的两张牌会短暂显示，然后被当前玩家收集。'
    if (language === 'de') return 'Das passende Paar bleibt kurz sichtbar und wird dann gesammelt.'
    return 'The matching pair stays visible briefly, then it is collected.'
  }
  if (state.memoryBoard?.pendingMismatchIndexes?.length) {
    if (language === 'zh') return '不匹配的两张牌会短暂显示，然后翻回背面。'
    if (language === 'de') return 'Die zwei falschen Karten bleiben kurz sichtbar und drehen sich dann um.'
    return 'The mismatched cards stay visible briefly, then flip back.'
  }
  if (selected === 1) {
    if (language === 'zh') return `选择第二张牌，尝试完成${memoryMatchModeLabel(language, matchMode)}。`
    if (language === 'de') return `Wähle die zweite Karte für ${memoryMatchModeLabel(language, matchMode)}.`
    return `Choose a second card for a ${memoryMatchModeLabel(language, matchMode).toLowerCase()} match.`
  }
  if (language === 'zh') return `选择两张背面朝上的牌。${memoryMatchModeLabel(language, matchMode)}成功即可收集，并继续行动。`
  if (language === 'de') return `Wähle zwei verdeckte Karten. ${memoryMatchModeLabel(language, matchMode)} sammelt das Paar und du bist erneut dran.`
  return `Choose two face-down cards. A ${memoryMatchModeLabel(language, matchMode).toLowerCase()} match collects the pair and gives another turn.`
}

function legacyMemoryTurnHint(language: Language, state: GameState): string {
  const selected = state.memoryBoard?.selectedSlotIndexes.length ?? 0
  if (state.memoryBoard?.pendingMismatchIndexes?.length) {
    if (language === 'zh') return '不匹配的两张牌会短暂显示，然后翻回背面。'
    if (language === 'de') return 'Die zwei falschen Karten bleiben kurz sichtbar und drehen sich dann um.'
    return 'The mismatched cards stay visible briefly, then flip back.'
  }
  if (selected === 1) {
    if (language === 'zh') return '选择第二张牌，尝试组成数字对子。'
    if (language === 'de') return 'Wähle die zweite Karte und suche dieselbe Zahl.'
    return 'Choose a second card and try to match the number.'
  }
  if (language === 'zh') return '选择两张背面朝上的牌。数字相同即可收集，并继续行动。'
  if (language === 'de') return 'Wähle zwei verdeckte Karten. Gleiche Zahl sammelt das Paar und du bist erneut dran.'
  return 'Choose two face-down cards. Same number collects the pair and gives another turn.'
}

function zeroPlaceCardHint(language: Language): string {
  if (language === 'zh') return '点击方格放置摸到的牌'
  if (language === 'de') return 'Klicke ein Rasterfeld'
  return 'Click a grid slot'
}

function skyjoRevealHint(language: Language): string {
  if (language === 'zh') return '点选一张隐藏牌翻开'
  if (language === 'de') return 'Decke eine verdeckte Karte auf'
  return 'Reveal one hidden card'
}

function caboCallLabel(language: Language): string {
  if (language === 'zh') return '喊 Cabo'
  if (language === 'de') return 'Cabo rufen'
  return 'Call Cabo'
}

function catchDosLabel(language: Language): string {
  if (language === 'zh') return '抓 DOS'
  if (language === 'de') return 'DOS fangen'
  return 'Catch DOS'
}

function caboPowerHint(language: Language, kind: 'peek' | 'spy' | 'swap', hasFirstSlot: boolean): string {
  if (language === 'zh') {
    if (kind === 'peek') return 'Peek：选择自己的一张牌查看'
    if (kind === 'spy') return 'Spy：选择其他玩家的一张牌查看'
    return hasFirstSlot ? 'Swap：选择第二张牌完成交换' : 'Swap：选择第一张要交换的牌'
  }
  if (language === 'de') {
    if (kind === 'peek') return 'Peek: Eigene Karte ansehen'
    if (kind === 'spy') return 'Spy: Gegnerkarte ansehen'
    return hasFirstSlot ? 'Swap: Zweite Karte wählen' : 'Swap: Erste Karte wählen'
  }
  if (kind === 'peek') return 'Peek: choose one of your cards'
  if (kind === 'spy') return 'Spy: choose another player card'
  return hasFirstSlot ? 'Swap: choose the second card' : 'Swap: choose the first card'
}

function tableThemeName(language: Language, theme: TableTheme): string {
  const copy: Record<Language, Record<TableTheme, string>> = {
    en: {
      classicGreen: 'Classic Green',
      casinoNight: 'Casino Night',
      lightWood: 'Light Wood',
      oceanBlue: 'Ocean Blue',
      royalRed: 'Royal Red',
    },
    zh: {
      classicGreen: '经典绿桌',
      casinoNight: '赌场夜色',
      lightWood: '浅色木桌',
      oceanBlue: '海洋蓝',
      royalRed: '皇家红',
    },
    de: {
      classicGreen: 'Klassisches Grün',
      casinoNight: 'Casino-Nacht',
      lightWood: 'Helles Holz',
      oceanBlue: 'Ozeanblau',
      royalRed: 'Königsrot',
    },
  }
  return copy[language][theme]
}

function deckThemeName(language: Language, theme: DeckTheme): string {
  const copy: Record<Language, Record<DeckTheme, string>> = {
    en: {
      classicRider: 'Classic Rider',
      royalGold: 'Royal Gold',
      arcaneNight: 'Arcane Night',
      retroCarnival: 'Retro Carnival',
      crystalLight: 'Crystal Light',
    },
    zh: {
      classicRider: '经典骑士',
      royalGold: '皇家金',
      arcaneNight: '奥秘夜色',
      retroCarnival: '复古嘉年华',
      crystalLight: '水晶浅色',
    },
    de: {
      classicRider: 'Classic Rider',
      royalGold: 'Royal Gold',
      arcaneNight: 'Arcane Night',
      retroCarnival: 'Retro-Karneval',
      crystalLight: 'Kristallhell',
    },
  }
  return copy[language][theme]
}

function avatarName(language: Language, avatar: AvatarId): string {
  const copy: Record<Language, Record<AvatarId, string>> = {
    en: {
      explorer: 'Explorer',
      teacher: 'Teacher',
      magician: 'Magician',
      builder: 'Builder',
      musician: 'Musician',
      gardener: 'Gardener',
      pilot: 'Pilot',
      chef: 'Chef',
      scientist: 'Scientist',
      artist: 'Artist',
    },
    zh: {
      explorer: '探险家',
      teacher: '老师',
      magician: '魔术师',
      builder: '建造者',
      musician: '音乐家',
      gardener: '园丁',
      pilot: '飞行员',
      chef: '厨师',
      scientist: '科学家',
      artist: '艺术家',
    },
    de: {
      explorer: 'Entdecker',
      teacher: 'Lehrer',
      magician: 'Magier',
      builder: 'Baumeister',
      musician: 'Musiker',
      gardener: 'Gärtner',
      pilot: 'Pilot',
      chef: 'Koch',
      scientist: 'Forscher',
      artist: 'Künstler',
    },
  }
  return copy[language][avatar]
}

function avatarInitial(avatar: AvatarId): string {
  return avatar[0].toUpperCase()
}

interface ScorePlayerRow {
  player: Player
  cards: Card[]
  subtotal: number
}

function WinnerCelebrationOverlay({
  language,
  state,
  onFinish,
}: {
  language: Language
  state: GameState
  onFinish: () => void
}) {
  const winner = state.players.find((player) => player.id === state.gameWinnerId || player.id === state.winnerId)
  const winnerName = playerName(language, winner?.name ?? '')
  const sessionWinner = Boolean(state.gameWinnerId)

  useEffect(() => {
    const timer = window.setTimeout(onFinish, WINNER_CELEBRATION_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [onFinish])

  return (
    <button className="winner-celebration-overlay" type="button" onClick={(event) => handleWinnerCelebrationClick(event, onFinish)} onPointerDown={onFinish} aria-label={winnerCelebrationSkipLabel(language)}>
      <span className="winner-celebration-fireworks" aria-hidden="true">
        <i className="winner-firework winner-firework-one" />
        <i className="winner-firework winner-firework-two" />
        <i className="winner-firework winner-firework-three" />
        <i className="winner-firework winner-firework-four" />
      </span>
      <span className="winner-celebration-copy">
        <strong>{winnerCelebrationHeadline(language, sessionWinner)}</strong>
        <span>{winnerCelebrationSubtext(language, winnerName, sessionWinner)}</span>
      </span>
    </button>
  )
}

function winnerCelebrationHeadline(language: Language, sessionWinner: boolean): string {
  if (language === 'zh') return sessionWinner ? '本场获胜' : '本局获胜'
  if (language === 'de') return sessionWinner ? 'SESSIONSSIEG' : 'RUNDENSIEG'
  return sessionWinner ? 'SESSION WON' : 'ROUND WON'
}

function winnerCelebrationSubtext(language: Language, winnerName: string, sessionWinner: boolean): string {
  if (language === 'zh') return sessionWinner ? `${winnerName} 赢得本场游戏` : `${winnerName} 赢得本局`
  if (language === 'de') return sessionWinner ? `${winnerName} gewinnt die Session` : `${winnerName} gewinnt die Runde`
  return sessionWinner ? `${winnerName} wins the session` : `${winnerName} wins the round`
}

function winnerCelebrationSkipLabel(language: Language): string {
  if (language === 'zh') return '跳过胜利庆祝'
  if (language === 'de') return 'Siegfeier überspringen'
  return 'Skip winner celebration'
}

function RoundScoreModal({
  language,
  state,
  canManageSession,
  onContinue,
  onNewSession,
  onSetup,
}: {
  language: Language
  state: GameState
  canManageSession: boolean
  onContinue: () => void
  onNewSession: () => void
  onSetup: () => void
}) {
  const winner = state.players.find((player) => player.id === state.winnerId)
  const sessionWinner = state.players.find((player) => player.id === state.gameWinnerId)
  const isGameOver = Boolean(state.gameWinnerId)
  const usesSplashScoring = state.config.game === 'h2o' && state.config.h2oSplash
  const usesZeroScoring = isGridMemoryGame(state.config.game)
  const usesPassageScoring = state.config.game === 'guoPassage'
  const usesTeamScoring = state.config.game === 'teams'
  const winnerTeamId = winner?.teamId
  const titleName = playerName(language, sessionWinner?.name ?? winner?.name ?? '')
  const rows: ScorePlayerRow[] = state.players
    .filter((player) => usesZeroScoring || usesPassageScoring || (usesTeamScoring ? player.teamId !== winnerTeamId : player.id !== state.winnerId))
    .map((player) => ({
      player,
      cards: usesZeroScoring ? zeroGridCards(player) : player.hand,
      subtotal: usesPassageScoring
        ? (player.passagePairs ?? []).reduce((sum, pair) => sum + pair.score, 0)
        : usesSplashScoring || player.id === state.winnerId ? 0 : (usesZeroScoring ? zeroGridCards(player) : player.hand).reduce((sum, card) => sum + card.points, 0),
    }))
  const roundTotal = usesPassageScoring ? rows.find((row) => row.player.id === state.winnerId)?.subtotal ?? 0 : usesSplashScoring ? 1 : rows.reduce((sum, row) => sum + row.subtotal, 0)

  return (
    <div className="modal-panel score-modal">
      <p className="eyebrow">{state.gameWinnerId ? t(language, 'gameOver') : usesZeroScoring ? t(language, 'roundComplete') : t(language, 'congratulations')}</p>
      <h2>{usesZeroScoring && !isGameOver ? zeroRoundCloserTitle(language, titleName) : `${titleName} ${t(language, 'wins')}`}</h2>
      <p className="hint">{scoreHintText(language, state)}</p>

      <section className="score-summary">
        <div>
          <span>{t(language, 'roundScore')}</span>
          <strong>{roundTotal}</strong>
        </div>
        <div>
          <span>{t(language, 'sessionScore')}</span>
          <strong>{winner?.score ?? 0}</strong>
        </div>
        <div>
          <span>{t(language, 'sessionTarget')}</span>
          <strong>{state.targetScore}</strong>
        </div>
      </section>

      <section className="score-breakdown">
        <h3>{t(language, 'scoringDetails')}</h3>
        {rows.map((row) => (
          <article className="score-breakdown-player" key={row.player.id}>
            <header>
              <strong>{playerName(language, row.player.name)}</strong>
              <span>{t(language, 'subtotal')}: {row.subtotal}</span>
            </header>
            {usesSplashScoring ? (
              <p className="score-empty">{h2oSplashScoreExplanation(language)}</p>
            ) : usesZeroScoring && row.player.id === state.winnerId ? (
              <>
                <p className="score-empty">{zeroRoundCloserScoreExplanation(language)}</p>
                {row.cards.length > 0 && (
                  <div className="score-card-list">
                    {row.cards.map((card) => (
                      <span className="score-card-pill" key={card.id}>
                        {scoreCardLabel(language, card)} = {card.points}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : usesPassageScoring ? (
              <div className="score-card-list">
                {(row.player.passagePairs ?? []).map((pair, index) => (
                  <span className="score-card-pill" key={`${row.player.id}:passage:${index}`}>
                    {pair.cards.length === 0 ? passageQuickestBonusLabel(language) : pair.cards.map((card) => scoreCardLabel(language, card)).join(' + ')} = {pair.score}
                  </span>
                ))}
              </div>
            ) : row.cards.length === 0 ? (
              <p className="score-empty">{t(language, 'noCards')}</p>
            ) : (
              <div className="score-card-list">
                {row.cards.map((card) => (
                  <span className="score-card-pill" key={card.id}>
                    {scoreCardLabel(language, card)} = {card.points}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
        <footer>
          <strong>{t(language, 'total')}</strong>
          <strong>{roundTotal}</strong>
        </footer>
      </section>

      {canManageSession ? (
        <div className="modal-actions">
          {!isGameOver && (
            <button className="primary-button" type="button" onClick={onContinue}>
              {t(language, 'continueSession')}
            </button>
          )}
          <button className="ghost-button" type="button" onClick={onNewSession}>
            {t(language, 'newSession')}
          </button>
          <button className="ghost-button" type="button" onClick={onSetup}>
            {t(language, 'backToSetup')}
          </button>
        </div>
      ) : (
        <p className="hint">{t(language, 'waitingForHost')}</p>
      )}
    </div>
  )
}

function scoreHintText(language: Language, state: GameState): string {
  if (state.config.game === 'zero') {
    if (language === 'zh') return 'UNO Zero 每局由第一个没有盖牌的玩家结束；该玩家本局 0 分。9 局后总分最低者获胜。'
    if (language === 'de') return 'Bei UNO Zero sammelt jeder Spieler eigene Rasterpunkte; nach 9 Runden gewinnt die niedrigste Summe.'
    return 'UNO Zero rounds end when a player has no face-down grid cards; that player scores 0. After 9 rounds, the lowest total wins.'
  }
  if (state.config.game === 'h2o' && state.config.h2oSplash) {
    if (language === 'zh') return 'Splash 变体每局胜者获得 1 点，先赢 3 局者获胜。'
    if (language === 'de') return 'In der Splash-Variante zählt jede gewonnene Hand 1 Punkt; zuerst 3 Hande gewinnt.'
    return 'Splash scoring gives 1 point for each won hand; first to 3 hands wins.'
  }
  if (state.config.game === 'teams') {
    if (language === 'zh') return 'UNO Teams 由出完牌者所在队伍得分；只计算对方队伍剩余手牌，队友手牌不计入。'
    if (language === 'de') return 'UNO Teams wertet für das Team des Spielers, der fertig wurde; nur gegnerische Restkarten zählen.'
    return "UNO Teams scores for the player who went out; only the opposing team's remaining cards count."
  }
  return t(language, 'scoreHint')
}

function zeroRoundCloserTitle(language: Language, name: string): string {
  if (language === 'zh') return `${name} 结束本局`
  if (language === 'de') return `${name} beendet die Runde`
  return `${name} ends the round`
}

function zeroRoundCloserScoreExplanation(language: Language): string {
  if (language === 'zh') return '该玩家先翻开所有盖牌，本局计 0 分；下方牌仅用于公开核对。'
  if (language === 'de') return 'Dieser Spieler hat keine verdeckten Rasterkarten mehr und bekommt 0 Punkte; die Karten werden nur zur Kontrolle gezeigt.'
  return 'This player had no face-down grid cards left and scores 0; listed cards are shown only for transparency.'
}

function h2oSplashScoreExplanation(language: Language): string {
  if (language === 'zh') return 'Splash 变体不统计剩余手牌点数。'
  if (language === 'de') return 'Splash zählt keine Restkartenpunkte.'
  return 'Splash does not score leftover card values.'
}

function scoreCardLabel(language: Language, card: Card): string {
  const name = cardName(language, card)
  if (card.color === 'wild') return name
  return `${colorName(language, card.color)} ${name}`
}

function memoryActionTitle(language: Language): string {
  if (language === 'zh') return '记忆行动牌'
  if (language === 'de') return 'Memory-Aktionskarte'
  return 'Memory action card'
}

function memoryActionName(language: Language, action: MemoryActionEvent['action']): string {
  const names: Record<MemoryActionEvent['action'], Record<Language, string>> = {
    wild: { en: 'Wild', zh: '万能牌', de: 'Wild' },
    loseCards: { en: 'Lose Cards', zh: '失去牌', de: 'Karten verlieren' },
    earnCards: { en: 'Earn Cards', zh: '获得牌', de: 'Karten gewinnen' },
    allOthersLose: { en: 'All Others Lose', zh: '其他玩家失去牌', de: 'Alle anderen verlieren' },
    allOthersEarn: { en: 'All Others Earn', zh: '其他玩家获得牌', de: 'Alle anderen gewinnen' },
    loseAll: { en: 'Lose All Cards', zh: '失去所有牌', de: 'Alle Karten verlieren' },
    winnerTakesAll: { en: 'Winner Takes All', zh: '赢家通吃', de: 'Gewinner nimmt alles' },
  }
  return names[action][language]
}

function memoryActionIcon(action: MemoryActionEvent['action']): string {
  if (action === 'earnCards' || action === 'allOthersEarn' || action === 'winnerTakesAll') return '+'
  if (action === 'loseAll') return '!'
  return '-'
}

function memoryActionFormula(language: Language, event: MemoryActionEvent): string {
  if (event.action === 'loseAll') {
    if (language === 'zh') return '立刻失去当前已收集的所有牌。'
    if (language === 'de') return 'Alle aktuell gesammelten Karten gehen sofort verloren.'
    return 'All currently collected cards are lost immediately.'
  }
  if (event.action === 'winnerTakesAll') {
    if (language === 'zh') return `${playerName(language, event.playerName)} 收走桌面剩余 ${event.amount} 张牌。`
    if (language === 'de') return `${playerName(language, event.playerName)} sammelt die restlichen ${event.amount} Tischkarten.`
    return `${playerName(language, event.playerName)} collects the remaining ${event.amount} table cards.`
  }
  if (language === 'zh') return `发射器结果：${event.amount} 张。`
  if (language === 'de') return `Launcher-Ergebnis: ${event.amount} Karten.`
  return `Launcher result: ${event.amount} cards.`
}

function memoryActionAffectedText(language: Language, event: MemoryActionEvent): string {
  if (event.affectedPlayers.length === 0) {
    if (language === 'zh') return '没有玩家受到影响。'
    if (language === 'de') return 'Niemand ist betroffen.'
    return 'No player is affected.'
  }
  const parts = event.affectedPlayers.map((entry) => {
    const name = playerName(language, entry.playerName)
    const amount = Math.abs(entry.deltaCards)
    if (entry.deltaCards > 0) {
      if (language === 'zh') return `${name} 获得 ${amount} 张`
      if (language === 'de') return `${name} gewinnt ${amount}`
      return `${name} gains ${amount}`
    }
    if (entry.deltaCards < 0) {
      if (language === 'zh') return `${name} 失去 ${amount} 张`
      if (language === 'de') return `${name} verliert ${amount}`
      return `${name} loses ${amount}`
    }
    if (language === 'zh') return `${name} 没有变化`
    if (language === 'de') return `${name}: keine Änderung`
    return `${name}: no change`
  })
  return parts.join(' | ')
}

function HardwareEventOverlay({ state, language }: { state: GameState; language: Language }) {
  const event = isLauncherGame(state.config.game) ? state.launcherEvent : null
  const flashEvent = state.config.game === 'flash' ? state.flashEvent : null
  const whirlpoolEvent = state.config.game === 'h2o' && state.config.h2oSplash ? state.whirlpoolEvent : null
  const spinEvent = state.config.game === 'spin' ? state.spinEvent : null
  const dareEvent = state.config.game === 'challenge' ? state.dareEvent : null
  const wildJackpotEvent = state.config.game === 'wildJackpot' ? state.wildJackpotEvent : null
  const blastEvent = state.config.game === 'blast' && state.blastEvent?.fired ? state.blastEvent : null
  const robotoEvent = state.config.game === 'roboto' ? state.robotoEvent : null
  const tippoEvent = state.config.game === 'tippo' && state.tippoEvent?.tipped ? state.tippoEvent : null
  const marioKartEvent = state.config.game === 'marioKart' ? state.marioKartEvent : null
  const justiceLeagueEvent = state.config.game === 'dc' ? state.justiceLeagueEvent ?? null : null
  const webSwingEvent = state.config.game === 'spiderman' ? state.webSwingEvent ?? null : null
  const turtlePowerEvent = state.config.game === 'tmnt' ? state.turtlePowerEvent ?? null : null
  const beamMeUpEvent = state.config.game === 'starTrek' ? state.beamMeUpEvent ?? null : null
  const avatarStateEvent = state.config.game === 'avatar' ? state.avatarStateEvent ?? null : null
  const creepyCoolEvent = state.config.game === 'monsterHigh' ? state.creepyCoolEvent ?? null : null
  const touchdownEvent = state.config.game === 'nfl' ? state.touchdownEvent ?? null : null
  const memoryActionEvent = isGuoMemoryActionGame(state.config.game) ? state.memoryActionEvent ?? null : null
  const launcherSequence = event?.sequence ?? null
  const flashSequence = flashEvent?.sequence ?? null
  const whirlpoolSequence = whirlpoolEvent?.sequence ?? null
  const spinSequence = spinEvent?.sequence ?? null
  const dareSequence = dareEvent?.sequence ?? null
  const wildJackpotSequence = wildJackpotEvent?.sequence ?? null
  const blastSequence = blastEvent?.sequence ?? null
  const robotoSequence = robotoEvent?.sequence ?? null
  const tippoSequence = tippoEvent?.sequence ?? null
  const marioKartSequence = marioKartEvent?.sequence ?? null
  const justiceLeagueSequence = justiceLeagueEvent?.sequence ?? null
  const webSwingSequence = webSwingEvent?.sequence ?? null
  const turtlePowerSequence = turtlePowerEvent?.sequence ?? null
  const beamMeUpSequence = beamMeUpEvent?.sequence ?? null
  const avatarStateSequence = avatarStateEvent?.sequence ?? null
  const creepyCoolSequence = creepyCoolEvent?.sequence ?? null
  const touchdownSequence = touchdownEvent?.sequence ?? null
  const initialized = useRef(false)
  const lastSequence = useRef<number | null>(null)
  const showTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const flashInitialized = useRef(false)
  const lastFlashSequence = useRef<number | null>(null)
  const flashShowTimer = useRef<number | null>(null)
  const flashCloseTimer = useRef<number | null>(null)
  const whirlpoolInitialized = useRef(false)
  const lastWhirlpoolSequence = useRef<number | null>(null)
  const whirlpoolShowTimer = useRef<number | null>(null)
  const whirlpoolCloseTimer = useRef<number | null>(null)
  const spinInitialized = useRef(false)
  const lastSpinSequence = useRef<number | null>(null)
  const spinShowTimer = useRef<number | null>(null)
  const spinCloseTimer = useRef<number | null>(null)
  const dareInitialized = useRef(false)
  const lastDareSequence = useRef<number | null>(null)
  const dareShowTimer = useRef<number | null>(null)
  const dareCloseTimer = useRef<number | null>(null)
  const wildJackpotInitialized = useRef(false)
  const lastWildJackpotSequence = useRef<number | null>(null)
  const wildJackpotShowTimer = useRef<number | null>(null)
  const wildJackpotCloseTimer = useRef<number | null>(null)
  const blastInitialized = useRef(false)
  const lastBlastSequence = useRef<number | null>(null)
  const blastShowTimer = useRef<number | null>(null)
  const blastCloseTimer = useRef<number | null>(null)
  const robotoInitialized = useRef(false)
  const lastRobotoSequence = useRef<number | null>(null)
  const robotoShowTimer = useRef<number | null>(null)
  const robotoCloseTimer = useRef<number | null>(null)
  const tippoInitialized = useRef(false)
  const lastTippoSequence = useRef<number | null>(null)
  const tippoShowTimer = useRef<number | null>(null)
  const tippoCloseTimer = useRef<number | null>(null)
  const marioKartInitialized = useRef(false)
  const lastMarioKartSequence = useRef<number | null>(null)
  const marioKartShowTimer = useRef<number | null>(null)
  const marioKartCloseTimer = useRef<number | null>(null)
  const justiceLeagueInitialized = useRef(false)
  const lastJusticeLeagueSequence = useRef<number | null>(null)
  const justiceLeagueShowTimer = useRef<number | null>(null)
  const justiceLeagueCloseTimer = useRef<number | null>(null)
  const webSwingInitialized = useRef(false)
  const lastWebSwingSequence = useRef<number | null>(null)
  const webSwingShowTimer = useRef<number | null>(null)
  const webSwingCloseTimer = useRef<number | null>(null)
  const turtlePowerInitialized = useRef(false)
  const lastTurtlePowerSequence = useRef<number | null>(null)
  const turtlePowerShowTimer = useRef<number | null>(null)
  const turtlePowerCloseTimer = useRef<number | null>(null)
  const beamMeUpInitialized = useRef(false)
  const lastBeamMeUpSequence = useRef<number | null>(null)
  const beamMeUpShowTimer = useRef<number | null>(null)
  const beamMeUpCloseTimer = useRef<number | null>(null)
  const avatarStateInitialized = useRef(false)
  const lastAvatarStateSequence = useRef<number | null>(null)
  const avatarStateShowTimer = useRef<number | null>(null)
  const avatarStateCloseTimer = useRef<number | null>(null)
  const creepyCoolInitialized = useRef(false)
  const lastCreepyCoolSequence = useRef<number | null>(null)
  const creepyCoolShowTimer = useRef<number | null>(null)
  const creepyCoolCloseTimer = useRef<number | null>(null)
  const touchdownInitialized = useRef(false)
  const lastTouchdownSequence = useRef<number | null>(null)
  const touchdownShowTimer = useRef<number | null>(null)
  const touchdownCloseTimer = useRef<number | null>(null)
  const [launcherAnimation, setLauncherAnimation] = useState<LauncherEvent | null>(null)
  const [flashAnimation, setFlashAnimation] = useState<FlashEvent | null>(null)
  const [whirlpoolAnimation, setWhirlpoolAnimation] = useState<WhirlpoolEvent | null>(null)
  const [spinAnimation, setSpinAnimation] = useState<SpinEvent | null>(null)
  const [dareAnimation, setDareAnimation] = useState<DareEvent | null>(null)
  const [wildJackpotAnimation, setWildJackpotAnimation] = useState<WildJackpotEvent | null>(null)
  const [blastAnimation, setBlastAnimation] = useState<BlastEvent | null>(null)
  const [robotoAnimation, setRobotoAnimation] = useState<RobotoEvent | null>(null)
  const [tippoAnimation, setTippoAnimation] = useState<TippoEvent | null>(null)
  const [marioKartAnimation, setMarioKartAnimation] = useState<MarioKartEvent | null>(null)
  const [justiceLeagueAnimation, setJusticeLeagueAnimation] = useState<JusticeLeagueEvent | null>(null)
  const [webSwingAnimation, setWebSwingAnimation] = useState<WebSwingEvent | null>(null)
  const [turtlePowerAnimation, setTurtlePowerAnimation] = useState<TurtlePowerEvent | null>(null)
  const [beamMeUpAnimation, setBeamMeUpAnimation] = useState<BeamMeUpEvent | null>(null)
  const [avatarStateAnimation, setAvatarStateAnimation] = useState<AvatarStateEvent | null>(null)
  const [creepyCoolAnimation, setCreepyCoolAnimation] = useState<CreepyCoolEvent | null>(null)
  const [touchdownAnimation, setTouchdownAnimation] = useState<TouchdownEvent | null>(null)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      lastSequence.current = launcherSequence
      return
    }

    if (launcherSequence === null) {
      lastSequence.current = null
      if (showTimer.current) window.clearTimeout(showTimer.current)
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
      showTimer.current = window.setTimeout(() => setLauncherAnimation(null), 0)
      return
    }
    if (launcherSequence === lastSequence.current) return

    if (!event) return

    lastSequence.current = launcherSequence
    if (showTimer.current) window.clearTimeout(showTimer.current)
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    showTimer.current = window.setTimeout(() => setLauncherAnimation(event), 0)
    closeTimer.current = window.setTimeout(() => {
      setLauncherAnimation((current) => (current?.sequence === launcherSequence ? null : current))
    }, duration)
  }, [event, launcherSequence, state.config.hardwarePopupSeconds])

  useEffect(() => {
    return () => {
      if (showTimer.current) window.clearTimeout(showTimer.current)
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!flashInitialized.current) {
      flashInitialized.current = true
      lastFlashSequence.current = flashSequence
      return
    }

    if (flashSequence === null) {
      lastFlashSequence.current = null
      if (flashShowTimer.current) window.clearTimeout(flashShowTimer.current)
      if (flashCloseTimer.current) window.clearTimeout(flashCloseTimer.current)
      flashShowTimer.current = window.setTimeout(() => setFlashAnimation(null), 0)
      return
    }
    if (flashSequence === lastFlashSequence.current) return

    if (!flashEvent) return

    lastFlashSequence.current = flashSequence
    if (flashShowTimer.current) window.clearTimeout(flashShowTimer.current)
    if (flashCloseTimer.current) window.clearTimeout(flashCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    flashShowTimer.current = window.setTimeout(() => setFlashAnimation(flashEvent), 0)
    flashCloseTimer.current = window.setTimeout(() => {
      setFlashAnimation((current) => (current?.sequence === flashSequence ? null : current))
    }, duration)
  }, [flashEvent, flashSequence, state.config.hardwarePopupSeconds])

  useEffect(() => {
    return () => {
      if (flashShowTimer.current) window.clearTimeout(flashShowTimer.current)
      if (flashCloseTimer.current) window.clearTimeout(flashCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!whirlpoolInitialized.current) {
      whirlpoolInitialized.current = true
      lastWhirlpoolSequence.current = whirlpoolSequence
      return
    }

    if (whirlpoolSequence === null) {
      lastWhirlpoolSequence.current = null
      if (whirlpoolShowTimer.current) window.clearTimeout(whirlpoolShowTimer.current)
      if (whirlpoolCloseTimer.current) window.clearTimeout(whirlpoolCloseTimer.current)
      whirlpoolShowTimer.current = window.setTimeout(() => setWhirlpoolAnimation(null), 0)
      return
    }
    if (whirlpoolSequence === lastWhirlpoolSequence.current) return

    if (!whirlpoolEvent) return

    lastWhirlpoolSequence.current = whirlpoolSequence
    if (whirlpoolShowTimer.current) window.clearTimeout(whirlpoolShowTimer.current)
    if (whirlpoolCloseTimer.current) window.clearTimeout(whirlpoolCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    whirlpoolShowTimer.current = window.setTimeout(() => setWhirlpoolAnimation(whirlpoolEvent), 0)
    whirlpoolCloseTimer.current = window.setTimeout(() => {
      setWhirlpoolAnimation((current) => (current?.sequence === whirlpoolSequence ? null : current))
    }, duration)
  }, [state.config.hardwarePopupSeconds, whirlpoolEvent, whirlpoolSequence])

  useEffect(() => {
    return () => {
      if (whirlpoolShowTimer.current) window.clearTimeout(whirlpoolShowTimer.current)
      if (whirlpoolCloseTimer.current) window.clearTimeout(whirlpoolCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!spinInitialized.current) {
      spinInitialized.current = true
      lastSpinSequence.current = spinSequence
      return
    }

    if (spinSequence === null) {
      lastSpinSequence.current = null
      if (spinShowTimer.current) window.clearTimeout(spinShowTimer.current)
      if (spinCloseTimer.current) window.clearTimeout(spinCloseTimer.current)
      spinShowTimer.current = window.setTimeout(() => setSpinAnimation(null), 0)
      return
    }
    if (spinSequence === lastSpinSequence.current) return

    if (!spinEvent) return

    lastSpinSequence.current = spinSequence
    if (spinShowTimer.current) window.clearTimeout(spinShowTimer.current)
    if (spinCloseTimer.current) window.clearTimeout(spinCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    spinShowTimer.current = window.setTimeout(() => setSpinAnimation(spinEvent), 0)
    spinCloseTimer.current = window.setTimeout(() => {
      setSpinAnimation((current) => (current?.sequence === spinSequence ? null : current))
    }, duration)
  }, [spinEvent, spinSequence, state.config.hardwarePopupSeconds])

  useEffect(() => {
    return () => {
      if (spinShowTimer.current) window.clearTimeout(spinShowTimer.current)
      if (spinCloseTimer.current) window.clearTimeout(spinCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!dareInitialized.current) {
      dareInitialized.current = true
      lastDareSequence.current = dareSequence
      return
    }

    if (dareSequence === null) {
      lastDareSequence.current = null
      if (dareShowTimer.current) window.clearTimeout(dareShowTimer.current)
      if (dareCloseTimer.current) window.clearTimeout(dareCloseTimer.current)
      dareShowTimer.current = window.setTimeout(() => setDareAnimation(null), 0)
      return
    }
    if (dareSequence === lastDareSequence.current) return

    if (!dareEvent) return

    lastDareSequence.current = dareSequence
    if (dareShowTimer.current) window.clearTimeout(dareShowTimer.current)
    if (dareCloseTimer.current) window.clearTimeout(dareCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    dareShowTimer.current = window.setTimeout(() => setDareAnimation(dareEvent), 0)
    dareCloseTimer.current = window.setTimeout(() => {
      setDareAnimation((current) => (current?.sequence === dareSequence ? null : current))
    }, duration)
  }, [dareEvent, dareSequence, state.config.hardwarePopupSeconds])

  useEffect(() => {
    return () => {
      if (dareShowTimer.current) window.clearTimeout(dareShowTimer.current)
      if (dareCloseTimer.current) window.clearTimeout(dareCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!wildJackpotInitialized.current) {
      wildJackpotInitialized.current = true
      lastWildJackpotSequence.current = wildJackpotSequence
      return
    }

    if (wildJackpotSequence === null) {
      lastWildJackpotSequence.current = null
      if (wildJackpotShowTimer.current) window.clearTimeout(wildJackpotShowTimer.current)
      if (wildJackpotCloseTimer.current) window.clearTimeout(wildJackpotCloseTimer.current)
      wildJackpotShowTimer.current = window.setTimeout(() => setWildJackpotAnimation(null), 0)
      return
    }
    if (wildJackpotSequence === lastWildJackpotSequence.current) return

    if (!wildJackpotEvent) return

    lastWildJackpotSequence.current = wildJackpotSequence
    if (wildJackpotShowTimer.current) window.clearTimeout(wildJackpotShowTimer.current)
    if (wildJackpotCloseTimer.current) window.clearTimeout(wildJackpotCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    wildJackpotShowTimer.current = window.setTimeout(() => setWildJackpotAnimation(wildJackpotEvent), 0)
    wildJackpotCloseTimer.current = window.setTimeout(() => {
      setWildJackpotAnimation((current) => (current?.sequence === wildJackpotSequence ? null : current))
    }, duration)
  }, [state.config.hardwarePopupSeconds, wildJackpotEvent, wildJackpotSequence])

  useEffect(() => {
    return () => {
      if (wildJackpotShowTimer.current) window.clearTimeout(wildJackpotShowTimer.current)
      if (wildJackpotCloseTimer.current) window.clearTimeout(wildJackpotCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!blastInitialized.current) {
      blastInitialized.current = true
      lastBlastSequence.current = blastSequence
      return
    }

    if (blastSequence === null) {
      lastBlastSequence.current = null
      if (blastShowTimer.current) window.clearTimeout(blastShowTimer.current)
      if (blastCloseTimer.current) window.clearTimeout(blastCloseTimer.current)
      blastShowTimer.current = window.setTimeout(() => setBlastAnimation(null), 0)
      return
    }
    if (blastSequence === lastBlastSequence.current) return

    if (!blastEvent) return

    lastBlastSequence.current = blastSequence
    if (blastShowTimer.current) window.clearTimeout(blastShowTimer.current)
    if (blastCloseTimer.current) window.clearTimeout(blastCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    blastShowTimer.current = window.setTimeout(() => setBlastAnimation(blastEvent), 0)
    blastCloseTimer.current = window.setTimeout(() => {
      setBlastAnimation((current) => (current?.sequence === blastSequence ? null : current))
    }, duration)
  }, [blastEvent, blastSequence, state.config.hardwarePopupSeconds])

  useEffect(() => {
    return () => {
      if (blastShowTimer.current) window.clearTimeout(blastShowTimer.current)
      if (blastCloseTimer.current) window.clearTimeout(blastCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!robotoInitialized.current) {
      robotoInitialized.current = true
      lastRobotoSequence.current = robotoSequence
      return
    }

    if (robotoSequence === null) {
      lastRobotoSequence.current = null
      if (robotoShowTimer.current) window.clearTimeout(robotoShowTimer.current)
      if (robotoCloseTimer.current) window.clearTimeout(robotoCloseTimer.current)
      robotoShowTimer.current = window.setTimeout(() => setRobotoAnimation(null), 0)
      return
    }
    if (robotoSequence === lastRobotoSequence.current) return

    if (!robotoEvent) return

    lastRobotoSequence.current = robotoSequence
    if (robotoShowTimer.current) window.clearTimeout(robotoShowTimer.current)
    if (robotoCloseTimer.current) window.clearTimeout(robotoCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    robotoShowTimer.current = window.setTimeout(() => setRobotoAnimation(robotoEvent), 0)
    robotoCloseTimer.current = window.setTimeout(() => {
      setRobotoAnimation((current) => (current?.sequence === robotoSequence ? null : current))
    }, duration)
  }, [robotoEvent, robotoSequence, state.config.hardwarePopupSeconds])

  useEffect(() => {
    return () => {
      if (robotoShowTimer.current) window.clearTimeout(robotoShowTimer.current)
      if (robotoCloseTimer.current) window.clearTimeout(robotoCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!tippoInitialized.current) {
      tippoInitialized.current = true
      lastTippoSequence.current = tippoSequence
      return
    }

    if (tippoSequence === null) {
      lastTippoSequence.current = null
      if (tippoShowTimer.current) window.clearTimeout(tippoShowTimer.current)
      if (tippoCloseTimer.current) window.clearTimeout(tippoCloseTimer.current)
      tippoShowTimer.current = window.setTimeout(() => setTippoAnimation(null), 0)
      return
    }
    if (tippoSequence === lastTippoSequence.current) return

    if (!tippoEvent) return

    lastTippoSequence.current = tippoSequence
    if (tippoShowTimer.current) window.clearTimeout(tippoShowTimer.current)
    if (tippoCloseTimer.current) window.clearTimeout(tippoCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    tippoShowTimer.current = window.setTimeout(() => setTippoAnimation(tippoEvent), 0)
    tippoCloseTimer.current = window.setTimeout(() => {
      setTippoAnimation((current) => (current?.sequence === tippoSequence ? null : current))
    }, duration)
  }, [state.config.hardwarePopupSeconds, tippoEvent, tippoSequence])

  useEffect(() => {
    return () => {
      if (tippoShowTimer.current) window.clearTimeout(tippoShowTimer.current)
      if (tippoCloseTimer.current) window.clearTimeout(tippoCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!marioKartInitialized.current) {
      marioKartInitialized.current = true
      lastMarioKartSequence.current = marioKartSequence
      return
    }

    if (marioKartSequence === null) {
      lastMarioKartSequence.current = null
      if (marioKartShowTimer.current) window.clearTimeout(marioKartShowTimer.current)
      if (marioKartCloseTimer.current) window.clearTimeout(marioKartCloseTimer.current)
      marioKartShowTimer.current = window.setTimeout(() => setMarioKartAnimation(null), 0)
      return
    }
    if (marioKartSequence === lastMarioKartSequence.current) return

    if (!marioKartEvent) return

    lastMarioKartSequence.current = marioKartSequence
    if (marioKartShowTimer.current) window.clearTimeout(marioKartShowTimer.current)
    if (marioKartCloseTimer.current) window.clearTimeout(marioKartCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    marioKartShowTimer.current = window.setTimeout(() => setMarioKartAnimation(marioKartEvent), 0)
    marioKartCloseTimer.current = window.setTimeout(() => {
      setMarioKartAnimation((current) => (current?.sequence === marioKartSequence ? null : current))
    }, duration)
  }, [state.config.hardwarePopupSeconds, marioKartEvent, marioKartSequence])

  useEffect(() => {
    return () => {
      if (marioKartShowTimer.current) window.clearTimeout(marioKartShowTimer.current)
      if (marioKartCloseTimer.current) window.clearTimeout(marioKartCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!justiceLeagueInitialized.current) {
      justiceLeagueInitialized.current = true
      lastJusticeLeagueSequence.current = justiceLeagueSequence
      return
    }

    if (justiceLeagueSequence === null) {
      lastJusticeLeagueSequence.current = null
      if (justiceLeagueShowTimer.current) window.clearTimeout(justiceLeagueShowTimer.current)
      if (justiceLeagueCloseTimer.current) window.clearTimeout(justiceLeagueCloseTimer.current)
      justiceLeagueShowTimer.current = window.setTimeout(() => setJusticeLeagueAnimation(null), 0)
      return
    }
    if (justiceLeagueSequence === lastJusticeLeagueSequence.current) return

    if (!justiceLeagueEvent) return

    lastJusticeLeagueSequence.current = justiceLeagueSequence
    if (justiceLeagueShowTimer.current) window.clearTimeout(justiceLeagueShowTimer.current)
    if (justiceLeagueCloseTimer.current) window.clearTimeout(justiceLeagueCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    justiceLeagueShowTimer.current = window.setTimeout(() => setJusticeLeagueAnimation(justiceLeagueEvent), 0)
    justiceLeagueCloseTimer.current = window.setTimeout(() => {
      setJusticeLeagueAnimation((current) => (current?.sequence === justiceLeagueSequence ? null : current))
    }, duration)
  }, [state.config.hardwarePopupSeconds, justiceLeagueEvent, justiceLeagueSequence])

  useEffect(() => {
    return () => {
      if (justiceLeagueShowTimer.current) window.clearTimeout(justiceLeagueShowTimer.current)
      if (justiceLeagueCloseTimer.current) window.clearTimeout(justiceLeagueCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!webSwingInitialized.current) {
      webSwingInitialized.current = true
      lastWebSwingSequence.current = webSwingSequence
      return
    }

    if (webSwingSequence === null) {
      lastWebSwingSequence.current = null
      if (webSwingShowTimer.current) window.clearTimeout(webSwingShowTimer.current)
      if (webSwingCloseTimer.current) window.clearTimeout(webSwingCloseTimer.current)
      webSwingShowTimer.current = window.setTimeout(() => setWebSwingAnimation(null), 0)
      return
    }
    if (webSwingSequence === lastWebSwingSequence.current) return

    if (!webSwingEvent) return

    lastWebSwingSequence.current = webSwingSequence
    if (webSwingShowTimer.current) window.clearTimeout(webSwingShowTimer.current)
    if (webSwingCloseTimer.current) window.clearTimeout(webSwingCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    webSwingShowTimer.current = window.setTimeout(() => setWebSwingAnimation(webSwingEvent), 0)
    webSwingCloseTimer.current = window.setTimeout(() => {
      setWebSwingAnimation((current) => (current?.sequence === webSwingSequence ? null : current))
    }, duration)
  }, [state.config.hardwarePopupSeconds, webSwingEvent, webSwingSequence])

  useEffect(() => {
    return () => {
      if (webSwingShowTimer.current) window.clearTimeout(webSwingShowTimer.current)
      if (webSwingCloseTimer.current) window.clearTimeout(webSwingCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!turtlePowerInitialized.current) {
      turtlePowerInitialized.current = true
      lastTurtlePowerSequence.current = turtlePowerSequence
      return
    }

    if (turtlePowerSequence === null) {
      lastTurtlePowerSequence.current = null
      if (turtlePowerShowTimer.current) window.clearTimeout(turtlePowerShowTimer.current)
      if (turtlePowerCloseTimer.current) window.clearTimeout(turtlePowerCloseTimer.current)
      turtlePowerShowTimer.current = window.setTimeout(() => setTurtlePowerAnimation(null), 0)
      return
    }
    if (turtlePowerSequence === lastTurtlePowerSequence.current) return

    if (!turtlePowerEvent) return

    lastTurtlePowerSequence.current = turtlePowerSequence
    if (turtlePowerShowTimer.current) window.clearTimeout(turtlePowerShowTimer.current)
    if (turtlePowerCloseTimer.current) window.clearTimeout(turtlePowerCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    turtlePowerShowTimer.current = window.setTimeout(() => setTurtlePowerAnimation(turtlePowerEvent), 0)
    turtlePowerCloseTimer.current = window.setTimeout(() => {
      setTurtlePowerAnimation((current) => (current?.sequence === turtlePowerSequence ? null : current))
    }, duration)
  }, [state.config.hardwarePopupSeconds, turtlePowerEvent, turtlePowerSequence])

  useEffect(() => {
    return () => {
      if (turtlePowerShowTimer.current) window.clearTimeout(turtlePowerShowTimer.current)
      if (turtlePowerCloseTimer.current) window.clearTimeout(turtlePowerCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!beamMeUpInitialized.current) {
      beamMeUpInitialized.current = true
      lastBeamMeUpSequence.current = beamMeUpSequence
      return
    }

    if (beamMeUpSequence === null) {
      lastBeamMeUpSequence.current = null
      if (beamMeUpShowTimer.current) window.clearTimeout(beamMeUpShowTimer.current)
      if (beamMeUpCloseTimer.current) window.clearTimeout(beamMeUpCloseTimer.current)
      beamMeUpShowTimer.current = window.setTimeout(() => setBeamMeUpAnimation(null), 0)
      return
    }
    if (beamMeUpSequence === lastBeamMeUpSequence.current) return

    if (!beamMeUpEvent) return

    lastBeamMeUpSequence.current = beamMeUpSequence
    if (beamMeUpShowTimer.current) window.clearTimeout(beamMeUpShowTimer.current)
    if (beamMeUpCloseTimer.current) window.clearTimeout(beamMeUpCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    beamMeUpShowTimer.current = window.setTimeout(() => setBeamMeUpAnimation(beamMeUpEvent), 0)
    beamMeUpCloseTimer.current = window.setTimeout(() => {
      setBeamMeUpAnimation((current) => (current?.sequence === beamMeUpSequence ? null : current))
    }, duration)
  }, [beamMeUpEvent, beamMeUpSequence, state.config.hardwarePopupSeconds])

  useEffect(() => {
    return () => {
      if (beamMeUpShowTimer.current) window.clearTimeout(beamMeUpShowTimer.current)
      if (beamMeUpCloseTimer.current) window.clearTimeout(beamMeUpCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!avatarStateInitialized.current) {
      avatarStateInitialized.current = true
      lastAvatarStateSequence.current = avatarStateSequence
      return
    }

    if (avatarStateSequence === null) {
      lastAvatarStateSequence.current = null
      if (avatarStateShowTimer.current) window.clearTimeout(avatarStateShowTimer.current)
      if (avatarStateCloseTimer.current) window.clearTimeout(avatarStateCloseTimer.current)
      avatarStateShowTimer.current = window.setTimeout(() => setAvatarStateAnimation(null), 0)
      return
    }
    if (avatarStateSequence === lastAvatarStateSequence.current) return

    if (!avatarStateEvent) return

    lastAvatarStateSequence.current = avatarStateSequence
    if (avatarStateShowTimer.current) window.clearTimeout(avatarStateShowTimer.current)
    if (avatarStateCloseTimer.current) window.clearTimeout(avatarStateCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    avatarStateShowTimer.current = window.setTimeout(() => setAvatarStateAnimation(avatarStateEvent), 0)
    avatarStateCloseTimer.current = window.setTimeout(() => {
      setAvatarStateAnimation((current) => (current?.sequence === avatarStateSequence ? null : current))
    }, duration)
  }, [avatarStateEvent, avatarStateSequence, state.config.hardwarePopupSeconds])

  useEffect(() => {
    return () => {
      if (avatarStateShowTimer.current) window.clearTimeout(avatarStateShowTimer.current)
      if (avatarStateCloseTimer.current) window.clearTimeout(avatarStateCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!creepyCoolInitialized.current) {
      creepyCoolInitialized.current = true
      lastCreepyCoolSequence.current = creepyCoolSequence
      return
    }

    if (creepyCoolSequence === null) {
      lastCreepyCoolSequence.current = null
      if (creepyCoolShowTimer.current) window.clearTimeout(creepyCoolShowTimer.current)
      if (creepyCoolCloseTimer.current) window.clearTimeout(creepyCoolCloseTimer.current)
      creepyCoolShowTimer.current = window.setTimeout(() => setCreepyCoolAnimation(null), 0)
      return
    }
    if (creepyCoolSequence === lastCreepyCoolSequence.current) return

    if (!creepyCoolEvent) return

    lastCreepyCoolSequence.current = creepyCoolSequence
    if (creepyCoolShowTimer.current) window.clearTimeout(creepyCoolShowTimer.current)
    if (creepyCoolCloseTimer.current) window.clearTimeout(creepyCoolCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    creepyCoolShowTimer.current = window.setTimeout(() => setCreepyCoolAnimation(creepyCoolEvent), 0)
    creepyCoolCloseTimer.current = window.setTimeout(() => {
      setCreepyCoolAnimation((current) => (current?.sequence === creepyCoolSequence ? null : current))
    }, duration)
  }, [creepyCoolEvent, creepyCoolSequence, state.config.hardwarePopupSeconds])

  useEffect(() => {
    return () => {
      if (creepyCoolShowTimer.current) window.clearTimeout(creepyCoolShowTimer.current)
      if (creepyCoolCloseTimer.current) window.clearTimeout(creepyCoolCloseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!touchdownInitialized.current) {
      touchdownInitialized.current = true
      lastTouchdownSequence.current = touchdownSequence
      return
    }

    if (touchdownSequence === null) {
      lastTouchdownSequence.current = null
      if (touchdownShowTimer.current) window.clearTimeout(touchdownShowTimer.current)
      if (touchdownCloseTimer.current) window.clearTimeout(touchdownCloseTimer.current)
      touchdownShowTimer.current = window.setTimeout(() => setTouchdownAnimation(null), 0)
      return
    }
    if (touchdownSequence === lastTouchdownSequence.current) return

    if (!touchdownEvent) return

    lastTouchdownSequence.current = touchdownSequence
    if (touchdownShowTimer.current) window.clearTimeout(touchdownShowTimer.current)
    if (touchdownCloseTimer.current) window.clearTimeout(touchdownCloseTimer.current)
    const duration = state.config.hardwarePopupSeconds * 1000
    touchdownShowTimer.current = window.setTimeout(() => setTouchdownAnimation(touchdownEvent), 0)
    touchdownCloseTimer.current = window.setTimeout(() => {
      setTouchdownAnimation((current) => (current?.sequence === touchdownSequence ? null : current))
    }, duration)
  }, [state.config.hardwarePopupSeconds, touchdownEvent, touchdownSequence])

  useEffect(() => {
    return () => {
      if (touchdownShowTimer.current) window.clearTimeout(touchdownShowTimer.current)
      if (touchdownCloseTimer.current) window.clearTimeout(touchdownCloseTimer.current)
    }
  }, [])

  if (!launcherAnimation && !flashAnimation && !whirlpoolAnimation && !spinAnimation && !dareAnimation && !wildJackpotAnimation && !blastAnimation && !robotoAnimation && !tippoAnimation && !marioKartAnimation && !justiceLeagueAnimation && !webSwingAnimation && !turtlePowerAnimation && !beamMeUpAnimation && !avatarStateAnimation && !creepyCoolAnimation && !touchdownAnimation && !memoryActionEvent) return null

  if (memoryActionEvent) {
    const visibleCards = Math.min(8, Math.max(1, Math.abs(memoryActionEvent.amount)))
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal memory-action-event ${memoryActionEvent.action} ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">{memoryActionTitle(language)}</p>
          <h2>{memoryActionName(language, memoryActionEvent.action)}</h2>
          <p className="hint">{memoryActionFormula(language, memoryActionEvent)}</p>
          <div className="memory-action-scene" aria-hidden="true">
            <div className={`memory-action-card ${memoryActionEvent.action}`}>
              <span>{memoryActionIcon(memoryActionEvent.action)}</span>
            </div>
            <div className="memory-action-card-stream">
              {Array.from({ length: visibleCards }, (_, index) => (
                <div
                  className={`memory-action-flying-card ${memoryActionEvent.affectedPlayers.some((entry) => entry.deltaCards < 0) ? 'lose' : 'earn'}`}
                  key={index}
                  style={{ animationDelay: `${260 + index * 95}ms` }}
                >
                  UNO
                </div>
              ))}
            </div>
          </div>
          <strong className="hardware-event-result">
            {memoryActionAffectedText(language, memoryActionEvent)}
          </strong>
        </section>
      </div>
    )
  }

  if (marioKartAnimation) {
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal mario-kart-event ${marioKartAnimation.item} ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">{marioKartAnimationTitle(language)}</p>
          <h2>{marioKartItemName(language, marioKartAnimation.item)}</h2>
          <p className="hint">{marioKartRevealText(language, marioKartAnimation)}</p>
          <div className="mario-kart-scene" aria-hidden="true">
            <div className="mario-kart-item-box">
              <span>?</span>
            </div>
            <div className={`mario-kart-item-icon ${marioKartAnimation.item}`}>
              {marioKartItemIcon(marioKartAnimation.item)}
            </div>
            <div className="mario-kart-track">
              <span className="mario-kart-kart kart-one"></span>
              <span className="mario-kart-kart kart-two"></span>
              <span className="mario-kart-kart kart-three"></span>
            </div>
          </div>
          <strong className="hardware-event-result">
            {marioKartAffectedText(language, marioKartAnimation)}
          </strong>
        </section>
      </div>
    )
  }

  if (justiceLeagueAnimation) {
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal justice-league-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">{justiceLeagueAnimationTitle(language)}</p>
          <h2>Justice League</h2>
          <p className="hint">{justiceLeagueRevealText(language, justiceLeagueAnimation)}</p>
          <div className="justice-league-scene" aria-hidden="true">
            <div className="justice-league-source">
              <span>{playerName(language, justiceLeagueAnimation.sourcePlayerName)}</span>
            </div>
            <div className="justice-league-target">
              <span>{playerName(language, justiceLeagueAnimation.targetPlayerName)}</span>
            </div>
            <div className="justice-league-revealed-cards">
              {justiceLeagueRevealedCards(justiceLeagueAnimation).map((entry, index) => (
                <div className="justice-league-revealed-card" key={`${entry.playerId}-${entry.cardLabel}`} style={{ animationDelay: `${index * 90}ms` }}>
                  <span>{playerName(language, entry.playerName)}</span>
                  {justiceLeagueMiniCard(entry, 'revealed')}
                </div>
              ))}
            </div>
            {justiceLeagueMiniCard(justiceLeagueAnimation.capturedCard, 'captured')}
            {justiceLeagueAnimation.returnedCard ? justiceLeagueMiniCard(justiceLeagueAnimation.returnedCard, 'returned') : null}
          </div>
          <strong className="hardware-event-result">
            {justiceLeagueResultText(language, justiceLeagueAnimation)}
          </strong>
        </section>
      </div>
    )
  }

  if (webSwingAnimation) {
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal web-swing-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">Web Swing</p>
          <h2>Web Swing</h2>
          <p className="hint">{webSwingMotionText(language, webSwingAnimation)}</p>
          <div className="web-swing-scene" aria-hidden="true">
            <div className="web-swing-source">
              <span>{playerName(language, webSwingAnimation.sourcePlayerName)}</span>
            </div>
            <div className="web-swing-target">
              <span>{playerName(language, webSwingAnimation.targetPlayerName)}</span>
            </div>
            <div className="web-swing-thread thread-one" />
            <div className="web-swing-thread thread-two" />
            {webSwingMiniCard(webSwingAnimation.capturedCard, 'captured')}
            {webSwingMiniCard(webSwingAnimation.returnedCard, 'returned')}
          </div>
          <strong className="hardware-event-result">
            {webSwingResultText(language, webSwingAnimation)}
          </strong>
        </section>
      </div>
    )
  }

  if (turtlePowerAnimation) {
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal turtle-power-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">Turtle Power</p>
          <h2>Turtle Power</h2>
          <div className="turtle-power-scene" aria-hidden="true">
            <div className="turtle-power-table-ring" />
            {turtlePowerSeatNames(turtlePowerAnimation).map((name, index) => (
              <div className={`turtle-power-seat seat-${index}`} key={`${name}-${index}`}>
                {playerName(language, name)}
              </div>
            ))}
            <div className="turtle-power-passed-cards">
              {turtlePowerPassedCards(turtlePowerAnimation).map((entry, index) => (
                <div className="turtle-power-pass" key={`${entry.sourcePlayerId}-${entry.targetPlayerId}-${entry.cardLabel}-${index}`}>
                  <div className={`turtle-power-revealed-card pass-${index % 4} ${entry.cardColor}`}>
                    {entry.cardLabel}
                  </div>
                  <div className={`turtle-power-oval-path pass-${index % 4} ${turtlePowerAnimation.direction === 1 ? 'clockwise' : 'counter'}`}>
                    <div
                      className={`turtle-power-card ${entry.cardColor}`}
                      style={{ animationDelay: `${index * 110}ms` }}
                      title={`${entry.sourcePlayerName} -> ${entry.targetPlayerName}`}
                    >
                      {entry.cardLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (beamMeUpAnimation) {
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal beam-me-up-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">Star Trek</p>
          <h2>Beam Me Up</h2>
          <p className="hint">{beamMeUpRevealText(language, beamMeUpAnimation)}</p>
          <div className="beam-me-up-scene" aria-hidden="true">
            <div className="beam-me-up-target">
              {playerName(language, beamMeUpAnimation.targetPlayerName)}
            </div>
            <div className="beam-me-up-transporter">
              <span></span>
              <span></span>
              <span></span>
            </div>
            {beamMeUpMiniCard(beamMeUpAnimation.beamedCard, 'beamed')}
            {beamMeUpAnimation.replacementCard ? beamMeUpMiniCard(beamMeUpAnimation.replacementCard, 'replacement') : null}
          </div>
          <strong className="hardware-event-result">
            {beamMeUpResultText(language, beamMeUpAnimation)}
          </strong>
        </section>
      </div>
    )
  }

  if (avatarStateAnimation) {
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal avatar-state-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">Avatar</p>
          <h2>Avatar State</h2>
          <p className="hint">{avatarStateRevealText(language, avatarStateAnimation)}</p>
          <div className="avatar-state-scene" aria-hidden="true">
            <div className="avatar-state-swirl">
              <span className="fire"></span>
              <span className="water"></span>
              <span className="earth"></span>
              <span className="air"></span>
            </div>
            <div className="avatar-state-revealed-cards">
              {avatarStateAnimation.revealedCards.map((entry, index) => (
                <div className="avatar-state-revealed-card" key={`${entry.cardLabel}-${index}`} style={{ animationDelay: `${index * 110}ms` }}>
                  {avatarStateMiniCard(entry, entry.cardLabel === avatarStateAnimation.keptCard.cardLabel ? 'kept' : 'revealed')}
                </div>
              ))}
            </div>
            {avatarStateMiniCard(avatarStateAnimation.keptCard, 'keep-motion')}
            {avatarStateAnimation.returnedCards.map((entry, index) => (
              <div className="avatar-state-return-motion" key={`${entry.cardLabel}-${index}`} style={{ animationDelay: `${260 + index * 120}ms` }}>
                {avatarStateMiniCard(entry, 'returned')}
              </div>
            ))}
          </div>
          <strong className="hardware-event-result">
            {avatarStateResultText(language, avatarStateAnimation)}
          </strong>
        </section>
      </div>
    )
  }

  if (creepyCoolAnimation) {
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal creepy-cool-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">Monster High</p>
          <h2>Creepy Cool</h2>
          <p className="hint">{creepyCoolRevealText(language, creepyCoolAnimation)}</p>
          <div className="creepy-cool-scene" aria-hidden="true">
            <div className="creepy-cool-locker">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="creepy-cool-revealed-cards">
              {creepyCoolAnimation.revealedCards.map((entry, index) => (
                <div className="creepy-cool-revealed-card" key={`${entry.playerId}-${entry.cardLabel}`} style={{ animationDelay: `${index * 110}ms` }}>
                  <span>{playerName(language, entry.playerName)}</span>
                  {creepyCoolMiniCard(entry, entry.discarded ? 'discarded' : 'kept')}
                </div>
              ))}
            </div>
            {creepyCoolAnimation.revealedCards.filter((entry) => entry.discarded).map((entry, index) => (
              <div className="creepy-cool-discard-motion" key={`${entry.playerId}-${entry.cardLabel}-discard`} style={{ animationDelay: `${340 + index * 130}ms` }}>
                {creepyCoolMiniCard(entry, 'discard-motion')}
              </div>
            ))}
            {creepyCoolAnimation.revealedCards.filter((entry) => !entry.discarded).map((entry, index) => (
              <div className="creepy-cool-keep-motion" key={`${entry.playerId}-${entry.cardLabel}-keep`} style={{ animationDelay: `${340 + index * 130}ms` }}>
                {creepyCoolMiniCard(entry, 'keep-motion')}
              </div>
            ))}
          </div>
          <strong className="hardware-event-result">
            {creepyCoolResultText(language, creepyCoolAnimation)}
          </strong>
        </section>
      </div>
    )
  }

  if (touchdownAnimation) {
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal touchdown-event ${touchdownAnimation.success ? 'success' : 'miss'} ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">UNO NFL</p>
          <h2>Touchdown</h2>
          <p className="hint">{touchdownRevealText(language, touchdownAnimation)}</p>
          <div className="touchdown-scene" aria-hidden="true">
            <div className="touchdown-scoreboard">
              <span>{playerName(language, touchdownAnimation.sourcePlayerName)}</span>
              <strong>{colorName(language, touchdownAnimation.activeColor)}</strong>
              <span>{playerName(language, touchdownAnimation.targetPlayerName)}</span>
            </div>
            <div className="touchdown-field">
              {Array.from({ length: 6 }, (_, index) => (
                <span className="touchdown-yard-line" key={index}></span>
              ))}
            </div>
            <div className={`touchdown-football ${touchdownAnimation.success ? 'success' : 'miss'}`}></div>
            {touchdownMiniCard(touchdownAnimation.revealedCard)}
            {touchdownAnimation.success ? <div className="touchdown-penalty">+4</div> : null}
          </div>
          <strong className="hardware-event-result">
            {touchdownResultText(language, touchdownAnimation)}
          </strong>
        </section>
      </div>
    )
  }

  if (tippoAnimation) {
    const receiver = playerName(language, tippoAnimation.playerName)
    const visibleCards = Math.min(8, Math.max(1, tippoAnimation.cardsTaken))
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal tippo-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">{tippoAnimationTitle(language)}</p>
          <h2>{tippoAnimationHeadline(language, receiver, tippoAnimation.cardsTaken)}</h2>
          <p className="hint">{tippoFormulaText(language, tippoAnimation)}</p>
          <div className="tippo-scene" aria-hidden="true">
            <div className="tippo-scale">
              {[0, 1].map((index) => (
                <div
                  className={[
                    'tippo-tray',
                    index === 0 ? 'tray-one' : 'tray-two',
                    index === tippoAnimation.trayIndex ? (index === 0 ? 'tipped-left' : 'tipped-right') : '',
                  ].filter(Boolean).join(' ')}
                  key={index}
                >
                  <span>{tippoTrayShortLabel(language, index)}</span>
                </div>
              ))}
              <span className="tippo-scale-stand"></span>
            </div>
            <div className="tippo-card-stream">
              {Array.from({ length: visibleCards }, (_, index) => (
                <div
                  className="tippo-flying-card"
                  key={index}
                  style={{ animationDelay: `${300 + index * 90}ms` }}
                >
                  UNO
                </div>
              ))}
            </div>
          </div>
          <strong className="hardware-event-result">
            {tippoReceiverText(language, receiver, tippoAnimation)}
          </strong>
          <p className="hint">{tippoLoadAfterText(language, state)}</p>
        </section>
      </div>
    )
  }

  if (robotoAnimation) {
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal roboto-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">{robotoAnimationTitle(language)}</p>
          <h2>{robotoAnimationHeadline(language, playerName(language, robotoAnimation.playerName))}</h2>
          <p className="hint">{robotoInstructionText(language, robotoAnimation)}</p>
          <div className="roboto-scene" aria-hidden="true">
            <div className="roboto-body">
              <span className="roboto-antenna"></span>
              <span className="roboto-eye eye-left"></span>
              <span className="roboto-eye eye-right"></span>
              <span className="roboto-mouth"></span>
            </div>
            <div className="roboto-speech-bubble">
              {robotoCommandShortText(language, robotoAnimation)}
            </div>
          </div>
          <strong className="hardware-event-result">
            {robotoAffectedText(language, robotoAnimation)}
          </strong>
        </section>
      </div>
    )
  }

  if (blastAnimation) {
    const receiver = playerName(language, blastAnimation.playerName)
    const visibleCards = Math.min(8, Math.max(1, blastAnimation.cardsDrawn))
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal blast-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">{blastAnimationTitle(language)}</p>
          <h2>{blastAnimationHeadline(language, receiver, blastAnimation.cardsDrawn)}</h2>
          <p className="hint">{blastFormulaText(language, blastAnimation)}</p>
          <div className="blast-scene" aria-hidden="true">
            <div className="blast-unit">
              <span className="blast-pressure">{blastAnimation.chamberSize}</span>
              <span className="blast-spark spark-one"></span>
              <span className="blast-spark spark-two"></span>
              <span className="blast-spark spark-three"></span>
            </div>
            <div className="blast-card-stream">
              {Array.from({ length: visibleCards }, (_, index) => (
                <div
                  className="blast-flying-card"
                  key={index}
                  style={{ animationDelay: `${360 + index * 95}ms` }}
                >
                  UNO
                </div>
              ))}
            </div>
          </div>
          <strong className="hardware-event-result">
            {blastReceiverText(language, receiver, blastAnimation)}
          </strong>
          <p className="hint">{blastAfterPressureText(language, blastAnimation)}</p>
        </section>
      </div>
    )
  }

  if (wildJackpotAnimation) {
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal spin-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">{wildJackpotTitle(language)}</p>
          <h2>{wildJackpotAnimationTitle(language, playerName(language, wildJackpotAnimation.playerName))}</h2>
          <p className="hint">{colorName(language, wildJackpotAnimation.color)}</p>
          <div className="spin-scene" aria-hidden="true">
            <div className="spin-wheel">
              <span className="spin-wheel-center"></span>
              <span className="spin-wheel-pointer"></span>
            </div>
          </div>
          <strong className="hardware-event-result">
            {wildJackpotRuleText(language, wildJackpotAnimation.rule)}
          </strong>
        </section>
      </div>
    )
  }

  if (dareAnimation) {
    const roller = playerName(language, dareAnimation.rollerPlayerName)
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal dare-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">{dareTitle(language)}</p>
          <h2>{dareAnimationTitle(language, roller, dareAnimation.dieRoll)}</h2>
          <p className="hint">{dareDieSideLabel(language, dareAnimation.dieRoll)}</p>
          <div className="dare-scene" aria-hidden="true">
            <div className={`dare-die roll-${dareAnimation.dieRoll}`}>
              {Array.from({ length: 6 }, (_, index) => (
                <span className={`dare-die-face face-${index + 1}`} key={index}>
                  {index + 1}
                </span>
              ))}
            </div>
          </div>
          <strong className="hardware-event-result">
            {dareAnimationResult(language, dareAnimation)}
          </strong>
        </section>
      </div>
    )
  }

  if (spinAnimation) {
    const target = playerName(language, spinAnimation.targetPlayerName)
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal spin-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">{spinTitle(language)}</p>
          <h2>{spinAnimationTitle(language, target)}</h2>
          <p className="hint">{spinActionLabel(language, spinAnimation.action)}</p>
          <div className="spin-scene" aria-hidden="true">
            <div className="spin-wheel">
              <span className="spin-wheel-center"></span>
              <span className="spin-wheel-pointer"></span>
            </div>
          </div>
          <strong className="hardware-event-result">
            {spinAnimationResult(language, spinAnimation, target)}
          </strong>
        </section>
      </div>
    )
  }

  if (whirlpoolAnimation) {
    const target = playerName(language, whirlpoolAnimation.targetPlayerName)
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal whirlpool-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">{whirlpoolTitle(language)}</p>
          <h2>{whirlpoolAnimationTitle(language, target)}</h2>
          <p className="hint">{whirlpoolAnimation.chain.map((command) => whirlpoolCommandLabel(language, command)).join(' > ')}</p>
          <div className="whirlpool-scene" aria-hidden="true">
            <div className="whirlpool-bowl">
              <span className="whirlpool-ring ring-one"></span>
              <span className="whirlpool-ring ring-two"></span>
              <span className="whirlpool-ring ring-three"></span>
              <span className="whirlpool-drop drop-one"></span>
              <span className="whirlpool-drop drop-two"></span>
              <span className="whirlpool-drop drop-three"></span>
            </div>
          </div>
          <strong className="hardware-event-result">
            {whirlpoolAnimationResult(language, whirlpoolAnimation, target)}
          </strong>
        </section>
      </div>
    )
  }

  if (flashAnimation) {
    const active = playerName(language, flashAnimation.activePlayerName)
    const affected = flashAnimation.affectedPlayerName ? playerName(language, flashAnimation.affectedPlayerName) : active
    return (
      <div className="hardware-event-overlay" aria-live="polite">
        <section className={`hardware-event-modal flash-event ${flashAnimation.kind} ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
          <p className="eyebrow">{flashTitle(language)}</p>
          <h2>{flashAnimationTitle(language, flashAnimation.kind, active, affected)}</h2>
          <p className="hint">{flashStatus(language, flashAnimation.kind, active)}</p>
          <div className="flash-scene" aria-hidden="true">
            <div className="flash-unit">
              {Array.from({ length: 6 }, (_, index) => (
                <span
                  className="flash-light"
                  key={index}
                  style={{ animationDelay: `${index * 90}ms` }}
                ></span>
              ))}
              <div className="flash-face">
                <span>FLASH</span>
              </div>
            </div>
            <div className="flash-pulse-ring"></div>
          </div>
          <strong className="hardware-event-result">
            {flashAnimationResult(language, flashAnimation, active, affected)}
          </strong>
        </section>
      </div>
    )
  }

  const launcher = launcherAnimation
  if (!launcher) return null

  return (
    <div className="hardware-event-overlay" aria-live="polite">
      <section className={`hardware-event-modal launcher-event ${state.config.reducedMotion ? 'reduced-motion' : ''}`}>
        <p className="eyebrow">{launcherTitle(language)}</p>
        <h2>{launcherAnimationTitle(language, playerName(language, launcher.targetPlayerName))}</h2>
        <p className="hint">{launcherStatus(language, launcher.presses, launcher.cardsFired, launcher.mode)}</p>
        <div className="launcher-scene" aria-hidden="true">
          <div className="launcher-machine">
            <div className="launcher-mouth"></div>
            <div className="launcher-rail"></div>
            <div className="launcher-button-cap"></div>
            <div className="launcher-base"></div>
          </div>
          <div className="launcher-card-stream">
            {Array.from({ length: Math.max(1, launcher.cardsFired) }, (_, index) => (
              <div
                className={`launcher-flying-card ${launcher.cardsFired === 0 ? 'blank' : ''}`}
                key={index}
                style={{ animationDelay: `${620 + index * 130}ms` }}
              >
                {launcher.cardsFired === 0 ? '' : 'UNO'}
              </div>
            ))}
          </div>
        </div>
        <strong className="hardware-event-result">
          {launcherResultText(language, launcher.cardsFired)}
        </strong>
      </section>
    </div>
  )
}

function tippoAnimationTitle(language: Language): string {
  if (language === 'zh') return 'Tippo 平衡托盘'
  if (language === 'de') return 'Tippo-Balance'
  return 'Tippo balance'
}

function marioKartAnimationTitle(language: Language): string {
  if (language === 'zh') return '马力欧卡丁车道具箱'
  if (language === 'de') return 'Mario-Kart-Item-Box'
  return 'Mario Kart Item Box'
}

function marioKartItemName(language: Language, item: MarioKartEvent['item']): string {
  const names: Record<MarioKartEvent['item'], Record<Language, string>> = {
    mushroom: { en: 'Mushroom', zh: '蘑菇', de: 'Pilz' },
    banana: { en: 'Banana Peel', zh: '香蕉皮', de: 'Bananenschale' },
    greenShell: { en: 'Green Shell', zh: '绿龟壳', de: 'Grüner Panzer' },
    lightning: { en: 'Lightning', zh: '闪电', de: 'Blitz' },
    bobomb: { en: 'Bob-omb', zh: '炸弹兵', de: 'Bob-omb' },
  }
  return names[item][language]
}

function marioKartItemIcon(item: MarioKartEvent['item']): string {
  if (item === 'mushroom') return 'M'
  if (item === 'banana') return 'B'
  if (item === 'greenShell') return 'S'
  if (item === 'lightning') return '!'
  return 'BOOM'
}

function marioKartRevealText(language: Language, event: MarioKartEvent): string {
  const item = marioKartItemName(language, event.item)
  if (language === 'zh') return `翻出 ${event.revealedCardLabel} -> ${item}`
  if (language === 'de') return `Aufgedeckt: ${event.revealedCardLabel} -> ${item}`
  return `Revealed ${event.revealedCardLabel} -> ${item}`
}

function marioKartAffectedText(language: Language, event: MarioKartEvent): string {
  const player = event.targetPlayerName ? playerName(language, event.targetPlayerName) : playerName(language, event.playerName)
  if (event.item === 'mushroom') {
    if (language === 'zh') return `${playerName(language, event.playerName)} 立刻再行动一次`
    if (language === 'de') return `${playerName(language, event.playerName)} spielt sofort erneut`
    return `${playerName(language, event.playerName)} plays again immediately`
  }
  if (event.item === 'lightning') {
    if (language === 'zh') return `其他所有玩家各摸 1 张；${playerName(language, event.playerName)} 再行动`
    if (language === 'de') return `Alle anderen ziehen 1; ${playerName(language, event.playerName)} spielt erneut`
    return `All other players draw 1; ${playerName(language, event.playerName)} plays again`
  }
  if (event.item === 'bobomb') {
    if (language === 'zh') return `${player} 被炸弹兵影响，摸 ${event.cardsDrawn} 张`
    if (language === 'de') return `${player} zieht ${event.cardsDrawn} durch Bob-omb`
    return `${player} draws ${event.cardsDrawn} from Bob-omb`
  }
  if (event.item === 'banana') {
    if (language === 'zh') return `${player} 踩到香蕉皮，摸 ${event.cardsDrawn} 张`
    if (language === 'de') return `${player} zieht ${event.cardsDrawn} durch Bananenschale`
    return `${player} draws ${event.cardsDrawn} from Banana Peel`
  }
  if (language === 'zh') return `${player} 被绿龟壳击中，摸 ${event.cardsDrawn} 张`
  if (language === 'de') return `${player} zieht ${event.cardsDrawn} durch Grüner Panzer`
  return `${player} draws ${event.cardsDrawn} from Green Shell`
}

function justiceLeagueAnimationTitle(language: Language): string {
  if (language === 'zh') return '正义联盟行动'
  if (language === 'de') return 'Justice-League-Aktion'
  return 'Justice League'
}

function justiceLeagueRevealedCards(event: JusticeLeagueEvent): JusticeLeagueEvent['revealedCards'] {
  return event.revealedCards
}

function justiceLeagueRevealText(language: Language, event: JusticeLeagueEvent): string {
  const count = event.revealedCards.length
  if (language === 'zh') return `${count} 名对手亮出最强牌`
  if (language === 'de') return `${count} Gegner decken ihre stärkste Karte auf`
  return `${count} opponents reveal their strongest cards`
}

function justiceLeagueResultText(language: Language, event: JusticeLeagueEvent): string {
  const source = playerName(language, event.sourcePlayerName)
  const target = playerName(language, event.targetPlayerName)
  const captured = event.capturedCard.cardLabel
  const returned = event.returnedCard?.cardLabel
  if (language === 'zh') {
    return returned ? `${source} 从 ${target} 获得 ${captured}，并还回 ${returned}` : `${source} 从 ${target} 获得 ${captured}`
  }
  if (language === 'de') {
    return returned ? `${source} nimmt ${captured} von ${target} und gibt ${returned} zurück` : `${source} nimmt ${captured} von ${target}`
  }
  return returned ? `${source} captured ${captured} from ${target}, returned ${returned}` : `${source} captured ${captured} from ${target}`
}

function justiceLeagueMiniCard(card: JusticeLeagueEvent['capturedCard'], role: 'revealed' | 'captured' | 'returned') {
  return (
    <div className={`justice-league-mini-card ${role} ${card.cardColor}`}>
      <span>{card.cardLabel}</span>
    </div>
  )
}

function webSwingMotionText(language: Language, event: WebSwingEvent): string {
  const source = playerName(language, event.sourcePlayerName)
  const target = playerName(language, event.targetPlayerName)
  if (language === 'zh') return `${source} 与 ${target} 自动交换 2 张牌`
  if (language === 'de') return `${source} und ${target} tauschen automatisch 2 Karten`
  return `${source} and ${target} auto-swap 2 cards`
}

function webSwingResultText(language: Language, event: WebSwingEvent): string {
  const source = playerName(language, event.sourcePlayerName)
  const target = playerName(language, event.targetPlayerName)
  if (language === 'zh') return `${source} 从 ${target} 摆荡获得 ${event.capturedCard.cardLabel}，并还回 ${event.returnedCard.cardLabel}`
  if (language === 'de') return `${source} schwingt ${event.capturedCard.cardLabel} von ${target} herüber und gibt ${event.returnedCard.cardLabel} zurück`
  return `${source} swinged the card ${event.capturedCard.cardLabel} from ${target} and returned ${event.returnedCard.cardLabel}`
}

function webSwingMiniCard(card: WebSwingEvent['capturedCard'], role: 'captured' | 'returned') {
  return (
    <div className={`web-swing-mini-card ${role} ${card.cardColor}`}>
      <span>{card.cardLabel}</span>
    </div>
  )
}

function turtlePowerPassedCards(event: TurtlePowerEvent): TurtlePowerEvent['passedCards'] {
  return event.passedCards
}

function turtlePowerSeatNames(event: TurtlePowerEvent): string[] {
  const names: string[] = []
  for (const pass of event.passedCards) {
    if (!names.includes(pass.sourcePlayerName)) names.push(pass.sourcePlayerName)
    if (!names.includes(pass.targetPlayerName)) names.push(pass.targetPlayerName)
  }
  return names.slice(0, 4)
}

function beamMeUpRevealText(language: Language, event: BeamMeUpEvent): string {
  const target = playerName(language, event.targetPlayerName)
  if (language === 'zh') return `${target} 亮出 ${event.beamedCard.cardLabel}，传送器启动`
  if (language === 'de') return `${target} deckt ${event.beamedCard.cardLabel} auf, der Transporter startet`
  return `${target} reveals ${event.beamedCard.cardLabel}; transporter locks on`
}

function beamMeUpResultText(language: Language, event: BeamMeUpEvent): string {
  const target = playerName(language, event.targetPlayerName)
  const beamed = event.beamedCard.cardLabel
  const replacement = event.replacementCard?.cardLabel
  if (language === 'zh') {
    return replacement ? `${beamed} 被传送回摸牌堆，${target} 摸到 1 张替换牌` : `${beamed} 被传送回摸牌堆，${target} 没有替换牌可摸`
  }
  if (language === 'de') {
    return replacement ? `${beamed} wird in den Ziehstapel gebeamt; ${target} zieht 1 Ersatzkarte` : `${beamed} wird in den Ziehstapel gebeamt; ${target} findet keine Ersatzkarte`
  }
  return replacement ? `${beamed} is beamed into the draw pile; ${target} draws 1 replacement card` : `${beamed} is beamed into the draw pile; ${target} has no replacement card`
}

function beamMeUpMiniCard(card: BeamMeUpEvent['beamedCard'], role: 'beamed' | 'replacement') {
  return (
    <div className={`beam-me-up-mini-card ${role} ${card.cardColor}`}>
      <span>{card.cardLabel}</span>
    </div>
  )
}

function avatarStateRevealText(language: Language, event: AvatarStateEvent): string {
  const source = playerName(language, event.sourcePlayerName)
  if (language === 'zh') return `${source} 翻开 ${event.revealedCards.length} 张牌并进入 Avatar State`
  if (language === 'de') return `${source} deckt ${event.revealedCards.length} Karten im Avatar State auf`
  return `${source} reveals ${event.revealedCards.length} cards in the Avatar State`
}

function avatarStateResultText(language: Language, event: AvatarStateEvent): string {
  const source = playerName(language, event.sourcePlayerName)
  const kept = event.keptCard.cardLabel
  const returned = event.returnedCards.map((entry) => entry.cardLabel)
  if (language === 'zh') return `${source} 保留 ${kept}；${formatDisplayList(returned)} 放回摸牌堆`
  if (language === 'de') return `${source} behält ${kept}; ${formatDisplayList(returned)} zurück in den Ziehstapel`
  return `${source} keeps ${kept}; ${formatDisplayList(returned)} return to the draw pile`
}

function avatarStateMiniCard(card: AvatarStateEvent['keptCard'], role: 'revealed' | 'kept' | 'keep-motion' | 'returned') {
  return (
    <div className={`avatar-state-mini-card ${role} ${card.cardColor}`}>
      <span>{card.cardLabel}</span>
    </div>
  )
}

function creepyCoolRevealText(language: Language, event: CreepyCoolEvent): string {
  const color = colorName(language, event.activeColor)
  if (language === 'zh') return `其他玩家亮牌；${color} 牌会被弃掉`
  if (language === 'de') return `Andere Spieler decken auf; ${color}-Karten werden abgeworfen`
  return `Other players reveal; ${color} cards are discarded`
}

function creepyCoolResultText(language: Language, event: CreepyCoolEvent): string {
  const discarded = event.revealedCards.filter((entry) => entry.discarded).map((entry) => `${playerName(language, entry.playerName)}: ${entry.cardLabel}`)
  const kept = event.revealedCards.filter((entry) => !entry.discarded).map((entry) => `${playerName(language, entry.playerName)}: ${entry.cardLabel}`)
  if (language === 'zh') return `弃掉：${formatDisplayList(discarded) || '无'} | 保留：${formatDisplayList(kept) || '无'}`
  if (language === 'de') return `Abgeworfen: ${formatDisplayList(discarded) || 'keine'} | Behalten: ${formatDisplayList(kept) || 'keine'}`
  return `Discarded: ${formatDisplayList(discarded) || 'none'} | Kept: ${formatDisplayList(kept) || 'none'}`
}

function creepyCoolMiniCard(card: CreepyCoolEvent['revealedCards'][number], role: 'discarded' | 'kept' | 'discard-motion' | 'keep-motion') {
  return (
    <div className={`creepy-cool-mini-card ${role} ${card.cardColor}`}>
      <span>{card.cardLabel}</span>
    </div>
  )
}

function touchdownRevealText(language: Language, event: TouchdownEvent): string {
  const source = playerName(language, event.sourcePlayerName)
  const target = playerName(language, event.targetPlayerName)
  const color = colorName(language, event.activeColor)
  if (language === 'zh') return `${source} 选择 ${color}，向 ${target} 发起 Touchdown 进攻`
  if (language === 'de') return `${source} wählt ${color} und startet den Touchdown gegen ${target}`
  return `${source} chooses ${color} and drives at ${target}`
}

function touchdownResultText(language: Language, event: TouchdownEvent): string {
  const target = playerName(language, event.targetPlayerName)
  if (language === 'zh') {
    return event.success
      ? `${event.revealedCard.cardLabel} 匹配颜色；${target} 摸 ${event.cardsDrawn} 张并失去回合`
      : `${event.revealedCard.cardLabel} 未匹配颜色；没有惩罚`
  }
  if (language === 'de') {
    return event.success
      ? `${event.revealedCard.cardLabel} passt; ${target} zieht ${event.cardsDrawn} und verliert den Zug`
      : `${event.revealedCard.cardLabel} passt nicht; keine Strafe`
  }
  return event.success
    ? `${event.revealedCard.cardLabel} matches; ${target} draws ${event.cardsDrawn} and loses the turn`
    : `${event.revealedCard.cardLabel} misses; no penalty`
}

function touchdownMiniCard(card: TouchdownEvent['revealedCard']) {
  return (
    <div className={`touchdown-mini-card ${card.cardColor}`}>
      <span>{card.cardLabel}</span>
    </div>
  )
}

function formatDisplayList(labels: string[]): string {
  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}

function tippoAnimationHeadline(language: Language, player: string, cards: number): string {
  if (language === 'zh') return `${player} 收到 ${cards} 张托盘牌`
  if (language === 'de') return `${player} nimmt ${cards} Ablagekarten`
  return `${player} takes ${cards} tray cards`
}

function tippoFormulaText(language: Language, event: TippoEvent): string {
  if (language === 'zh') {
    const trigger = event.forced ? 'Tippo 牌强制倾倒' : `出牌 +${event.playedCardLoad}`
    return `托盘 ${event.trayIndex + 1}: ${event.previousLoad} 负载 + ${trigger} = 倾倒`
  }
  if (language === 'de') {
    const trigger = event.forced ? 'Tippo-Karte kippt sofort' : `gespielte Karte +${event.playedCardLoad}`
    return `Ablage ${event.trayIndex + 1}: ${event.previousLoad} Last + ${trigger} = kippt`
  }
  const trigger = event.forced ? 'Tippo card forces tip' : `played card +${event.playedCardLoad}`
  return `Tray ${event.trayIndex + 1}: ${event.previousLoad} load + ${trigger} = tipped`
}

function tippoReceiverText(language: Language, player: string, event: TippoEvent): string {
  if (language === 'zh') return `${player} 拿走托盘 ${event.trayIndex + 1} 的 ${event.cardsTaken} 张牌`
  if (language === 'de') return `${player} nimmt ${event.cardsTaken} Karten von Ablage ${event.trayIndex + 1}`
  return `${player} receives ${event.cardsTaken} cards from tray ${event.trayIndex + 1}`
}

function tippoLoadAfterText(language: Language, state: GameState): string {
  const loads = (state.tippoTrays ?? []).map((tray, index) => `${index + 1}: ${tray.load}/${tray.limit}`).join(' | ')
  if (language === 'zh') return `倾倒后负载：${loads}`
  if (language === 'de') return `Last danach: ${loads}`
  return `Load after tip: ${loads}`
}

function tippoTrayShortLabel(language: Language, index: number): string {
  if (language === 'zh') return `托盘 ${index + 1}`
  if (language === 'de') return `Ablage ${index + 1}`
  return `Tray ${index + 1}`
}

function dareTitle(language: Language): string {
  if (language === 'zh') return 'Dare 骰子'
  if (language === 'de') return 'Dare-Würfel'
  return 'Dare die'
}

function wildJackpotTitle(language: Language): string {
  if (language === 'zh') return 'Wild Jackpot 转轮'
  if (language === 'de') return 'Wild-Jackpot-Roller'
  return 'Wild Jackpot roller'
}

function blastAnimationTitle(language: Language): string {
  if (language === 'zh') return '爆破装置'
  if (language === 'de') return 'Blast-Einheit'
  return 'Blast unit'
}

function blastAnimationHeadline(language: Language, player: string, cards: number): string {
  if (language === 'zh') return `${player} 收到 ${cards} 张牌`
  if (language === 'de') return `${player} erhält ${cards} Karten`
  return `${player} receives ${cards} cards`
}

function blastFormulaText(language: Language, event: BlastEvent): string {
  if (language === 'zh') {
    const cardText = event.forced ? 'Blast 牌 +1 并强制发射' : '出牌 +1'
    return `${event.previousPressure} 压力 + ${cardText} = ${event.chamberSize} 张发射`
  }
  if (language === 'de') {
    const cardText = event.forced ? 'Blast-Karte +1 und erzwingt Feuer' : 'gespielte Karte +1'
    return `${event.previousPressure} Druck + ${cardText} = ${event.chamberSize} Karten`
  }
  const cardText = event.forced ? 'Blast card +1 and forced fire' : 'played card +1'
  return `${event.previousPressure} pressure + ${cardText} = ${event.chamberSize} cards fired`
}

function blastReceiverText(language: Language, player: string, event: BlastEvent): string {
  if (language === 'zh') return `${player} 摸走 ${event.cardsDrawn} 张发射牌`
  if (language === 'de') return `${player} zieht ${event.cardsDrawn} ausgesendete Karten`
  return `${player} takes ${event.cardsDrawn} fired cards`
}

function blastAfterPressureText(language: Language, event: BlastEvent): string {
  if (language === 'zh') return `发射后压力：${event.chamberSize} -> ${event.pressureAfter}`
  if (language === 'de') return `Druck danach: ${event.chamberSize} -> ${event.pressureAfter}`
  return `Pressure after fire: ${event.chamberSize} -> ${event.pressureAfter}`
}

function robotoAnimationTitle(language: Language): string {
  if (language === 'zh') return 'Roboto 指令'
  if (language === 'de') return 'Roboto-Befehl'
  return 'Roboto command'
}

function robotoAnimationHeadline(language: Language, player: string): string {
  if (language === 'zh') return `${player} 触发了机器人`
  if (language === 'de') return `${player} aktiviert Roboto`
  return `${player} triggered Roboto`
}

function robotoCommandShortText(language: Language, event: RobotoEvent): string {
  const labels: Record<RobotoEvent['command'], Record<Language, string>> = {
    nextDraw2: { en: 'NEXT +2', zh: '下一位 +2', de: 'NAECHSTER +2' },
    sourceDraw2: { en: 'YOU +2', zh: '你 +2', de: 'DU +2' },
    allOthersDraw1: { en: 'OTHERS +1', zh: '其他人 +1', de: 'ANDERE +1' },
    discardActiveColor: { en: 'DROP COLOR', zh: '弃颜色', de: 'FARBE WEG' },
    reverse: { en: 'REVERSE', zh: '反转', de: 'RICHTUNG' },
    playAgain: { en: 'PLAY AGAIN', zh: '再行动', de: 'NOCHMAL' },
  }
  return labels[event.command][language]
}

function robotoInstructionText(language: Language, event: RobotoEvent): string {
  const color = event.color ? colorName(language, event.color) : ''
  const labels: Record<RobotoEvent['command'], Record<Language, string>> = {
    nextDraw2: { en: 'Instruction: next player draws 2 and loses the turn.', zh: '指令：下一位玩家摸 2 张并跳过回合。', de: 'Anweisung: Nächster Spieler zieht 2 und setzt aus.' },
    sourceDraw2: { en: 'Instruction: triggering player draws 2.', zh: '指令：触发机器人者摸 2 张。', de: 'Anweisung: Auslösender Spieler zieht 2.' },
    allOthersDraw1: { en: 'Instruction: all other players draw 1.', zh: '指令：其他所有玩家各摸 1 张。', de: 'Anweisung: Alle anderen Spieler ziehen 1.' },
    discardActiveColor: { en: `Instruction: discard active-color cards${color ? ` (${color})` : ''}.`, zh: `指令：弃掉当前颜色手牌${color ? `（${color}）` : ''}。`, de: `Anweisung: aktive Farbe ablegen${color ? ` (${color})` : ''}.` },
    reverse: { en: 'Instruction: reverse the play direction.', zh: '指令：反转出牌方向。', de: 'Anweisung: Spielrichtung wechseln.' },
    playAgain: { en: 'Instruction: triggering player plays again.', zh: '指令：触发机器人者立刻再行动。', de: 'Anweisung: Auslösender Spieler spielt erneut.' },
  }
  return labels[event.command][language]
}

function robotoAffectedText(language: Language, event: RobotoEvent): string {
  const target = event.targetPlayerName ? playerName(language, event.targetPlayerName) : playerName(language, event.playerName)
  if (language === 'zh') {
    if (event.command === 'reverse') return '游戏方向已反转'
    if (event.command === 'playAgain') return `${target} 继续行动`
    if (event.command === 'discardActiveColor') return `${target} 弃掉 ${event.cardsMoved} 张牌`
    return `${target} 收到 ${event.cardsMoved} 张牌`
  }
  if (language === 'de') {
    if (event.command === 'reverse') return 'Die Spielrichtung wurde gewechselt'
    if (event.command === 'playAgain') return `${target} spielt weiter`
    if (event.command === 'discardActiveColor') return `${target} legt ${event.cardsMoved} Karten ab`
    return `${target} erhält ${event.cardsMoved} Karten`
  }
  if (event.command === 'reverse') return 'Play direction reversed'
  if (event.command === 'playAgain') return `${target} plays again`
  if (event.command === 'discardActiveColor') return `${target} discards ${event.cardsMoved} cards`
  return `${target} receives ${event.cardsMoved} cards`
}

function wildJackpotAnimationTitle(language: Language, player: string): string {
  if (language === 'zh') return `${player} 启动了 Jackpot`
  if (language === 'de') return `${player} startet den Jackpot`
  return `${player} triggered the Jackpot`
}

function wildJackpotRuleText(language: Language, rule: WildJackpotRule): string {
  const labels: Record<WildJackpotRule, Record<Language, string>> = {
    draw1: { en: 'Next player draws 1 and loses the turn.', zh: '下一位玩家摸 1 张并跳过回合。', de: 'Der nächste Spieler zieht 1 und setzt aus.' },
    draw2: { en: 'Next player draws 2 and loses the turn.', zh: '下一位玩家摸 2 张并跳过回合。', de: 'Der nächste Spieler zieht 2 und setzt aus.' },
    draw4: { en: 'Next player draws 4 and loses the turn.', zh: '下一位玩家摸 4 张并跳过回合。', de: 'Der nächste Spieler zieht 4 und setzt aus.' },
    allDraw1: { en: 'Every other player draws 1.', zh: '其他每位玩家摸 1 张。', de: 'Alle anderen Spieler ziehen 1.' },
    skip: { en: 'The next player is skipped.', zh: '跳过下一位玩家。', de: 'Der nächste Spieler setzt aus.' },
    reverse: { en: 'Play direction reverses.', zh: '游戏方向反转。', de: 'Die Spielrichtung wechselt.' },
    discardColor: { en: 'Discard all cards of the chosen color.', zh: '弃掉所有所选颜色的手牌。', de: 'Lege alle Karten der gewählten Farbe ab.' },
    playAgain: { en: 'Play again immediately.', zh: '立刻再行动一次。', de: 'Spiele sofort noch einmal.' },
  }
  return labels[rule][language]
}

function dareAnimationTitle(language: Language, roller: string, dieRoll: number): string {
  if (language === 'zh') return `${roller} 掷出了 ${dieRoll}`
  if (language === 'de') return `${roller} würfelt ${dieRoll}`
  return `${roller} rolled ${dieRoll}`
}

function dareDieSideLabel(language: Language, dieRoll: number): string {
  return dareResultLabel(language, dareResultForDieRoll(dieRoll))
}

function dareAnimationResult(language: Language, event: DareEvent): string {
  return dareResultLabel(language, event.result)
}

function dareResultForDieRoll(dieRoll: number): DareDieResult {
  if (dieRoll === 1) return 'draw4'
  if (dieRoll === 2) return 'allOthersDrop4'
  if (dieRoll === 3) return 'nextPlayerDropAll'
  if (dieRoll === 4) return 'overNextPlayerDropAll'
  if (dieRoll === 5) return 'drawToAction'
  return 'instantWin'
}

function dareResultLabel(language: Language, result: DareDieResult): string {
  const labels: Record<DareDieResult, Record<Language, string>> = {
    draw4: {
      en: 'Roller draws 4 cards',
      zh: '掷骰玩家摸 4 张',
      de: 'Wurf-Spieler zieht 4 Karten',
    },
    allOthersDrop4: {
      en: 'All other players drop 4',
      zh: '其他玩家各摸 4 张',
      de: 'Alle anderen legen 4 ab',
    },
    nextPlayerDropAll: {
      en: 'Next player drops all',
      zh: '下一位玩家丢出所有牌',
      de: 'Nächster Spieler legt alles ab',
    },
    overNextPlayerDropAll: {
      en: 'Over-next player may drop all',
      zh: '下下位玩家可能丢出所有牌',
      de: 'Ubernächster Spieler kann alles ablegen',
    },
    drawToAction: {
      en: 'Draw until an action card',
      zh: '摸到行动牌为止',
      de: 'Ziehen bis zur Aktionskarte',
    },
    instantWin: {
      en: 'Winner of the round',
      zh: '立即赢得本轮',
      de: 'Gewinner der Runde',
    },
  }
  return labels[result][language]
}

function RecommendationPanel({
  language,
  game,
  recommendation,
}: {
  language: Language
  game: GameVariant
  recommendation: MoveRecommendation | null
}) {
  return (
    <section className="recommendation-card">
      <p className="eyebrow">{t(language, 'recommendation')}</p>
      <strong>{recommendationTitle(language, game, recommendation)}</strong>
      <p>{recommendation ? recommendationReason(language, recommendation.reason) : t(language, 'recommendReasonWait')}</p>
    </section>
  )
}

function MemoryHintPanel({ language, state }: { language: Language; state: GameState }) {
  return (
    <section className="recommendation-card">
      <p className="eyebrow">{t(language, 'recommendation')}</p>
      <strong>{memoryHintTitle(language, state)}</strong>
      <p>{memoryTurnHint(language, state)}</p>
      <p>{memoryBoardLine(language, state)}</p>
      <p>{memoryStrategyLine(language, state)}</p>
    </section>
  )
}

function memoryHintTitle(language: Language, state: GameState): string {
  const cardsPerMatch = state.memoryBoard?.cardsPerMatch ?? 2
  if (cardsPerMatch === 3) {
    if (state.memoryBoard?.pendingMatchIndexes?.length) {
      if (language === 'zh') return '三张匹配成功'
      if (language === 'de') return 'Triple gefunden'
      return 'Triple found'
    }
    if (state.memoryBoard?.pendingMismatchIndexes?.length) {
      if (language === 'zh') return '记住这三张牌'
      if (language === 'de') return 'Merke dir diese drei Karten'
      return 'Memorize these three cards'
    }
    if ((state.memoryBoard?.selectedSlotIndexes.length ?? 0) > 0) {
      if (language === 'zh') return '完成三张匹配'
      if (language === 'de') return 'Vervollständige das Triple'
      return 'Complete the triple'
    }
    if (language === 'zh') return '翻开三张牌'
    if (language === 'de') return 'Decke drei Karten auf'
    return 'Reveal three cards'
  }
  if (state.memoryBoard?.pendingMatchIndexes?.length) {
    if (language === 'zh') return '匹配成功'
    if (language === 'de') return 'Paar gefunden'
    return 'Pair found'
  }
  if (state.memoryBoard?.pendingMismatchIndexes?.length) {
    if (language === 'zh') return '记住这两张牌'
    if (language === 'de') return 'Merke dir diese Karten'
    return 'Memorize these cards'
  }
  if ((state.memoryBoard?.selectedSlotIndexes.length ?? 0) === 1) {
    if (language === 'zh') return '寻找相同数字'
    if (language === 'de') return 'Suche dieselbe Zahl'
    return 'Find the same number'
  }
  if (language === 'zh') return '翻开两张牌'
  if (language === 'de') return 'Decke zwei Karten auf'
  return 'Reveal two cards'
}

function memoryStrategyLine(language: Language, state?: GameState): string {
  if ((state?.memoryBoard?.cardsPerMatch ?? 2) === 3) {
    if (language === 'zh') return '提示：三张匹配更难，先记住两个已知位置，再寻找第三张。'
    if (language === 'de') return 'Tipp: Triples sind schwerer. Sichere zuerst zwei bekannte Positionen und suche dann die dritte.'
    return 'Tip: triples are harder. Lock in two known positions first, then hunt the third.'
  }
  if (language === 'zh') return '提示：记住牌的位置。配对成功会继续行动，配对失败才换下一位玩家。'
  if (language === 'de') return 'Tipp: Merke dir Positionen. Ein Treffer gibt einen weiteren Zug, ein Fehlversuch wechselt den Spieler.'
  return 'Tip: remember positions. A hit gives another turn; a miss passes play to the next player.'
}

function legacyMemoryStrategyLine(language: Language): string {
  if (language === 'zh') return '提示：当前模式只看数字，颜色不用匹配。'
  if (language === 'de') return 'Tipp: In diesem Modus zählt nur die Zahl, nicht die Farbe.'
  return 'Tip: in this mode only the number matters, not the color.'
}

void legacyMemoryTurnHint
void legacyMemoryStrategyLine

function SkipBoHintPanel({ language, state, discardPileIndex }: { language: Language; state: GameState; discardPileIndex: number | null }) {
  const current = activePlayer(state)
  return (
    <section className="recommendation-card">
      <p className="eyebrow">{t(language, 'recommendation')}</p>
      <strong>{skipBoHintTitle(language, state.drewThisTurn, discardPileIndex)}</strong>
      <p>{skipBoTurnHint(language, state.drewThisTurn, discardPileIndex)}</p>
      <p>{skipBoPlayableNowLine(language, state)}</p>
      <p>{skipBoPriorityTip(language, state, discardPileIndex)}</p>
      <p>{skipBoStockLine(language, current)}</p>
      <p>{skipBoBuildLine(language, state)}</p>
      <p>{skipBoDiscardSummary(language, current)}</p>
    </section>
  )
}

function skipBoHintTitle(language: Language, hasDrawn: boolean, discardPileIndex: number | null): string {
  if (!hasDrawn) {
    if (language === 'zh') return '摸到五张'
    if (language === 'de') return 'Auf fünf ziehen'
    return 'Draw to five'
  }
  if (discardPileIndex !== null) {
    if (language === 'zh') return '选择要弃掉的手牌'
    if (language === 'de') return 'Handkarte ablegen'
    return 'Choose a hand card to discard'
  }
  if (language === 'zh') return '清空库存牌堆'
  if (language === 'de') return 'Stockstapel leeren'
  return 'Clear your stock pile'
}

function Phase10HintPanel({ language, state }: { language: Language; state: GameState }) {
  const current = activePlayer(state)
  const phase = current.phase10Phase ?? 1
  const hitCards = phase10HitCards(state, current.id)
  return (
    <section className="recommendation-card phase10-hint-card">
      <p className="eyebrow">{t(language, 'recommendation')}</p>
      <strong>{phase10HintTitle(language, current)}</strong>
      <p>{phase10HintBody(language, state.drewThisTurn, current)}</p>
      <p>{phase10CurrentGoalLine(language, current, phase)}</p>
      {current.phase10Completed && <p>{phase10NextGoalLine(language, phase)}</p>}
      {current.phase10Completed && <p>{phase10TableMeldsLine(language, state)}</p>}
      {current.phase10Completed && <p>{phase10HitCardsLine(language, state.drewThisTurn, hitCards)}</p>}
    </section>
  )
}

function phase10HintTitle(language: Language, player: Player): string {
  if (player.phase10Completed) {
    if (language === 'zh') return '清空手牌来进入下一阶段'
    if (language === 'de') return 'Hand leeren, um weiterzukommen'
    return 'Empty your hand to advance'
  }
  if (language === 'zh') return '完成当前阶段'
  if (language === 'de') return 'Aktuelle Phase schaffen'
  return 'Complete the current phase'
}

function phase10HintBody(language: Language, hasDrawn: boolean, player: Player): string {
  if (player.phase10Completed) {
    if (language === 'zh') return hasDrawn
      ? '不需要等所有玩家完成阶段。接能接的牌；点不能接的牌会弃牌并结束回合。'
      : '不需要等所有玩家完成阶段。先摸牌或拿弃牌，然后接牌或弃牌。'
    if (language === 'de') return hasDrawn
      ? 'Du wartest nicht auf alle. Lege passende Karten an; eine nicht passende Karte beendet den Zug als Ablage.'
      : 'Du wartest nicht auf alle. Ziehe oder nimm die Ablage, dann lege an oder wirf ab.'
    return hasDrawn
      ? 'You do not wait for everyone. Hit compatible cards, or click a non-compatible card to discard and end the turn.'
      : 'You do not wait for everyone. Draw or take discard, then hit compatible cards or discard one card.'
  }
  if (language === 'zh') return hasDrawn ? '如果手牌满足目标，点击“完成阶段”；之后弃一张牌结束回合。' : '先摸牌或拿弃牌；本回合之后才能完成阶段。'
  if (language === 'de') return hasDrawn ? 'Wenn deine Hand das Ziel erfüllt, lege die Phase; danach wirfst du eine Karte ab.' : 'Ziehe oder nimm zuerst die Ablage; danach kannst du die Phase legen.'
  return hasDrawn ? 'If your hand matches the goal, lay the phase; then discard one card.' : 'Draw or take discard first; then you may lay the phase.'
}

function phase10CurrentGoalLine(language: Language, player: Player, phase: number): string {
  const goal = phase10GoalText(language, phase)
  if (player.phase10Completed) {
    if (language === 'zh') return `已摆出的目标：${goal}`
    if (language === 'de') return `Ausgelegtes Ziel: ${goal}`
    return `Laid goal: ${goal}`
  }
  if (language === 'zh') return `当前目标：${goal}`
  if (language === 'de') return `Aktuelles Ziel: ${goal}`
  return `Current goal: ${goal}`
}

function phase10NextGoalLine(language: Language, phase: number): string {
  if (phase >= 10) {
    if (language === 'zh') return '清空手牌后本局结束；完成第 10 阶段者按总分排名。'
    if (language === 'de') return 'Nach dem Leeren der Hand endet die Runde; Phase 10 ist die letzte Phase.'
    return 'After your hand is empty, the round ends; phase 10 is the last phase.'
  }
  const nextGoal = phase10GoalText(language, phase + 1)
  if (language === 'zh') return `清空手牌后，下一轮目标：${nextGoal}`
  if (language === 'de') return `Nach leerer Hand startet die nächste Runde mit Ziel: ${nextGoal}`
  return `After your hand is empty, next round starts with goal: ${nextGoal}`
}

function phase10TableMeldsLine(language: Language, state: GameState): string {
  const groups = state.players
    .map((player) => {
      const melds = player.phase10Melds ?? []
      const target = melds.length > 0 ? melds.map((meld) => phase10MeldLabel(language, meld)).join(', ') : phase10NoLaidPhaseLabel(language)
      return `${playerName(language, player.name)}: ${target}`
    })
  if (language === 'zh') return `可接牌目标：${groups.join('; ')}`
  if (language === 'de') return `Anlegeziele: ${groups.join('; ')}`
  return `Hit targets: ${groups.join('; ')}`
}

function phase10NoLaidPhaseLabel(language: Language): string {
  if (language === 'zh') return '还未摆出阶段'
  if (language === 'de') return 'noch keine Phase ausgelegt'
  return 'no laid phase yet'
}

function phase10HitCardsLine(language: Language, hasDrawn: boolean, cards: Card[]): string {
  if (!hasDrawn) {
    if (language === 'zh') return '现在还不能接牌：先摸牌或拿弃牌。'
    if (language === 'de') return 'Noch nicht anlegbar: erst ziehen oder die Ablage nehmen.'
    return 'Can hit now: none yet. Draw or take discard first.'
  }
  const labels = Array.from(new Set(cards.map((card) => phase10ShortCardLabel(language, card))))
  if (labels.length === 0) {
    if (language === 'zh') return '当前手牌没有可接的牌；摸牌/拿弃牌后，如果仍不能接，就弃一张。'
    if (language === 'de') return 'Keine Handkarte passt gerade; ziehe oder nimm die Ablage, dann wirf ab, falls nichts passt.'
    return 'No card in your hand can hit right now; draw/take discard, then discard one if nothing fits.'
  }
  if (language === 'zh') return `现在可接：${labels.join(', ')}`
  if (language === 'de') return `Jetzt anlegbar: ${labels.join(', ')}`
  return `Can hit now: ${labels.join(', ')}`
}

function phase10MeldLabel(language: Language, meld: Phase10Meld): string {
  if (meld.kind === 'set') {
    if (language === 'zh') return `${meld.value ?? '?'} 的同数字组`
    if (language === 'de') return `Set aus ${meld.value ?? '?'}ern`
    return `set of ${meld.value ?? '?'}s`
  }
  if (meld.kind === 'run') {
    if (language === 'zh') return `顺子 ${meld.runStart ?? '?'}-${meld.runEnd ?? '?'}`
    if (language === 'de') return `Folge ${meld.runStart ?? '?'}-${meld.runEnd ?? '?'}`
    return `run ${meld.runStart ?? '?'}-${meld.runEnd ?? '?'}`
  }
  const color = meld.color ? colorName(language, meld.color) : '?'
  if (language === 'zh') return `${color}同色组`
  if (language === 'de') return `${color}-Farbgruppe`
  return `${color} color group`
}

function phase10ShortCardLabel(language: Language, card: Card): string {
  if (card.kind === 'number' && typeof card.value === 'number') return String(card.value)
  return cardName(language, card)
}

function LiarChallengePanel({
  language,
  state,
  canChallenge,
  onAccept,
  onChallenge,
}: {
  language: Language
  state: GameState
  canChallenge: boolean
  onAccept: () => void
  onChallenge: () => void
}) {
  const pending = state.pendingLiarChallenge
  if (!pending) return null
  return (
    <section className="device-card liar-card">
      <LiarChallengePrompt language={language} state={state} canChallenge={canChallenge} onAccept={onAccept} onChallenge={onChallenge} />
    </section>
  )
}

function LiarChallengePrompt({
  language,
  state,
  canChallenge,
  onAccept,
  onChallenge,
}: {
  language: Language
  state: GameState
  canChallenge: boolean
  onAccept: () => void
  onChallenge: () => void
}) {
  const pending = state.pendingLiarChallenge
  if (!pending) return null
  const source = state.players.find((player) => player.id === pending.sourcePlayerId)
  return (
    <>
      <p className="eyebrow">{liarChallengeTitle(language)}</p>
      <strong>{liarClaimText(language, playerName(language, source?.name ?? ''), pending.claim.label)}</strong>
      <div className="action-row compact">
        {canChallenge && (
          <button className="danger-button" type="button" onClick={onChallenge}>
            {liarChallengeButton(language)}
          </button>
        )}
        <button className="ghost-button" type="button" onClick={onAccept}>
          {liarAcceptButton(language)}
        </button>
      </div>
    </>
  )
}

function liarChallengeTitle(language: Language): string {
  if (language === 'zh') return '质疑窗口'
  if (language === 'de') return 'Bluff-Fenster'
  return 'Challenge window'
}

function liarClaimText(language: Language, player: string, claim: string): string {
  if (language === 'zh') return `${player} 宣称：${claim}`
  if (language === 'de') return `${player} behauptet: ${claim}`
  return `${player} claims: ${claim}`
}

function liarChallengeButton(language: Language): string {
  if (language === 'zh') return '质疑'
  if (language === 'de') return 'Anzweifeln'
  return 'Challenge'
}

function liarAcceptButton(language: Language): string {
  if (language === 'zh') return '无人质疑'
  if (language === 'de') return 'Akzeptieren'
  return 'No challenge'
}

function WhirlpoolPanel({ language, state }: { language: Language; state: GameState }) {
  const event = state.whirlpoolEvent
  return (
    <section className="whirlpool-card">
      <p className="eyebrow">{whirlpoolTitle(language)}</p>
      <strong>{event ? event.chain.map((command) => whirlpoolCommandLabel(language, command)).join(' > ') : whirlpoolReadyText(language)}</strong>
      <p>{event ? whirlpoolTargetText(language, playerName(language, event.targetPlayerName)) : whirlpoolTriggerText(language)}</p>
    </section>
  )
}

function LauncherPanel({ language, state }: { language: Language; state: GameState }) {
  const event = state.launcherEvent
  return (
    <section className="device-card launcher-card">
      <p className="eyebrow">{launcherTitle(language)}</p>
      <strong>{event ? launcherStatus(language, event.presses, event.cardsFired, event.mode) : launcherReadyText(language)}</strong>
      <p>{event ? launcherTargetText(language, playerName(language, event.targetPlayerName)) : launcherTriggerText(language)}</p>
    </section>
  )
}

function FlashPanel({ language, state }: { language: Language; state: GameState }) {
  const event = state.flashEvent
  return (
    <section className="device-card flash-card">
      <p className="eyebrow">{flashTitle(language)}</p>
      <strong>{event ? flashStatus(language, event.kind, playerName(language, event.activePlayerName)) : flashReadyText(language)}</strong>
      <p>{event ? flashDetail(language, event.affectedPlayerName ? playerName(language, event.affectedPlayerName) : playerName(language, activePlayer(state).name), event.penaltyCards) : flashTimerText(language, state.config.flashTimerSeconds)}</p>
    </section>
  )
}

function SpinPanel({ language, state }: { language: Language; state: GameState }) {
  const event = state.spinEvent
  return (
    <section className="device-card spin-card">
      <p className="eyebrow">{spinTitle(language)}</p>
      <strong>{event ? spinActionLabel(language, event.action) : spinReadyText(language)}</strong>
      <p>{event ? spinDetail(language, playerName(language, event.targetPlayerName), event.action, event.color) : spinTriggerText(language)}</p>
    </section>
  )
}

function FlexPanel({ language, state }: { language: Language; state: GameState }) {
  const current = activePlayer(state)
  const green = state.players.filter((player) => player.flexPowerActive).length
  return (
    <section className="device-card flex-card">
      <p className="eyebrow">{flexPowerTitle(language)}</p>
      <strong>{flexPowerStateText(language, playerName(language, current.name), current.flexPowerActive)}</strong>
      <p>{flexPowerTableText(language, green, state.players.length)}</p>
    </section>
  )
}

function PartyPanel({ language, state }: { language: Language; state: GameState }) {
  const link = state.partyLink
  const linkedPlayers = link
    ? link.playerIds
        .map((id) => state.players.find((player) => player.id === id)?.name)
        .filter(Boolean)
        .map((name) => playerName(language, name ?? ''))
    : []
  return (
    <section className="device-card party-card">
      <p className="eyebrow">{partyTitle(language)}</p>
      <strong>{linkedPlayers.length === 2 ? partyLinkText(language, linkedPlayers[0], linkedPlayers[1]) : partyReadyText(language)}</strong>
      <p>{partyDetailText(language, state)}</p>
    </section>
  )
}

function partyTitle(language: Language): string {
  if (language === 'zh') return 'Party 效果'
  if (language === 'de') return 'Party-Effekt'
  return 'Party effect'
}

function partyReadyText(language: Language): string {
  if (language === 'zh') return '等待 Party 功能牌'
  if (language === 'de') return 'Warte auf Party-Karte'
  return 'Waiting for Party card'
}

function partyLinkText(language: Language, first: string, second: string): string {
  if (language === 'zh') return `${first} 和 ${second} 已连接`
  if (language === 'de') return `${first} und ${second} sind verbunden`
  return `${first} and ${second} are linked`
}

function partyDetailText(language: Language, state: GameState): string {
  const event = state.partyPileEvent
  if (event) {
    const color = colorName(language, event.color)
    const player = playerName(language, event.loserPlayerName)
    if (language === 'zh') return `最近 Pile Up：${player} 拿走 ${event.pileSize} 张 ${color} 牌。`
    if (language === 'de') return `Letztes Pile Up: ${player} nahm ${event.pileSize} ${color}-Karten.`
    return `Last Pile Up: ${player} took ${event.pileSize} ${color} cards.`
  }
  if (state.partyLink) {
    if (language === 'zh') return '连接玩家摸牌时，另一名连接玩家会摸同样数量。'
    if (language === 'de') return 'Wenn ein verbundener Spieler zieht, zieht der andere dieselbe Menge.'
    return 'When one linked player draws, the other linked player draws the same amount.'
  }
  if (language === 'zh') return 'Point Taken、Drawn Together 和 Pile Up 会在此显示。'
  if (language === 'de') return 'Point Taken, Drawn Together und Pile Up erscheinen hier.'
  return 'Point Taken, Drawn Together, and Pile Up appear here.'
}

function flexPowerTitle(language: Language): string {
  if (language === 'zh') return 'Power Card'
  if (language === 'de') return 'Power Card'
  return 'Power Card'
}

function flexPowerStateText(language: Language, player: string, active: boolean): string {
  if (language === 'zh') return `${player}: ${active ? '绿色可用' : '红色已用'}`
  if (language === 'de') return `${player}: ${active ? 'Grün bereit' : 'Rot verbraucht'}`
  return `${player}: ${active ? 'Green ready' : 'Red spent'}`
}

function flexPowerTableText(language: Language, green: number, total: number): string {
  if (language === 'zh') return `${green}/${total} 张 Power Card 为绿色。全部变红时会自动翻回绿色。`
  if (language === 'de') return `${green}/${total} Power Cards sind grün. Wenn alle rot sind, drehen alle zurück auf grün.`
  return `${green}/${total} Power Cards are green. If all are red, everyone flips back to green.`
}

function launcherTitle(language: Language): string {
  if (language === 'zh') return '发射器'
  if (language === 'de') return 'Launcher'
  return 'Launcher'
}

function launcherReadyText(language: Language): string {
  if (language === 'zh') return '待命'
  if (language === 'de') return 'Bereit'
  return 'Ready'
}

function launcherTriggerText(language: Language): string {
  if (language === 'zh') return '无法出牌或功能牌会触发'
  if (language === 'de') return 'Taste oder Aktionskarte'
  return 'Button or action card'
}

function launcherTargetText(language: Language, target: string): string {
  if (language === 'zh') return `目标：${target}`
  if (language === 'de') return `Ziel: ${target}`
  return `Target: ${target}`
}

function launcherStatus(language: Language, presses: number, cardsFired: number, mode: 'press' | 'untilFire'): string {
  if (language === 'zh') return mode === 'untilFire' ? `按到发射：${cardsFired}` : `${presses} 次 / ${cardsFired} 张`
  if (language === 'de') return mode === 'untilFire' ? `Bis Feuer: ${cardsFired}` : `${presses}x / ${cardsFired} Karten`
  return mode === 'untilFire' ? `Until fire: ${cardsFired}` : `${presses}x / ${cardsFired} cards`
}

function launcherAnimationTitle(language: Language, target: string): string {
  if (language === 'zh') return `${target} 触发发牌器`
  if (language === 'de') return `${target} drückt den Launcher`
  return `${target} triggers the launcher`
}

function launcherResultText(language: Language, cardsFired: number): string {
  if (cardsFired === 0) {
    if (language === 'zh') return '没有牌发出'
    if (language === 'de') return 'Keine Karte kommt heraus'
    return 'No card fired'
  }
  if (language === 'zh') return `${cardsFired} 张牌发出`
  if (language === 'de') return `${cardsFired} Karte${cardsFired === 1 ? '' : 'n'} kommen heraus`
  return `${cardsFired} card${cardsFired === 1 ? '' : 's'} fired`
}

function flashTitle(language: Language): string {
  if (language === 'zh') return 'Flash 装置'
  if (language === 'de') return 'Flash-Einheit'
  return 'Flash Unit'
}

function flashReadyText(language: Language): string {
  if (language === 'zh') return '随机选择玩家'
  if (language === 'de') return 'Zufallswahl'
  return 'Random selector'
}

function flashTimerText(language: Language, seconds: number): string {
  if (seconds <= 0) {
    if (language === 'zh') return '计时：无限制'
    if (language === 'de') return 'Timer: unbegrenzt'
    return 'Timer: unlimited'
  }
  if (language === 'zh') return `计时：${seconds} 秒`
  if (language === 'de') return `Timer: ${seconds}s`
  return `Timer: ${seconds}s`
}

function flashStatus(language: Language, kind: 'selected' | 'skip' | 'slap' | 'timeout', active: string): string {
  if (language === 'zh') {
    if (kind === 'skip') return '跳过'
    if (kind === 'slap') return 'SLAP'
    if (kind === 'timeout') return '超时'
    return `轮到：${active}`
  }
  if (language === 'de') {
    if (kind === 'skip') return 'Aussetzen'
    if (kind === 'slap') return 'SLAP'
    if (kind === 'timeout') return 'Zeit abgelaufen'
    return `Aktiv: ${active}`
  }
  if (kind === 'skip') return 'Skipped'
  if (kind === 'slap') return 'SLAP'
  if (kind === 'timeout') return 'Timed out'
  return `Active: ${active}`
}

function flashDetail(language: Language, affected: string, penaltyCards?: number): string {
  if (typeof penaltyCards === 'number') {
    if (language === 'zh') return `${affected} 摸 ${penaltyCards} 张`
    if (language === 'de') return `${affected} zieht ${penaltyCards}`
    return `${affected} draws ${penaltyCards}`
  }
  if (language === 'zh') return `目标：${affected}`
  if (language === 'de') return `Ziel: ${affected}`
  return `Target: ${affected}`
}

function flashAnimationTitle(language: Language, kind: FlashEvent['kind'], active: string, affected: string): string {
  if (language === 'zh') {
    if (kind === 'skip') return `${active} 被跳过`
    if (kind === 'slap') return `SLAP：${affected}`
    if (kind === 'timeout') return `${affected} 超时`
    return `Flash 选择 ${active}`
  }
  if (language === 'de') {
    if (kind === 'skip') return `${active} setzt aus`
    if (kind === 'slap') return `SLAP: ${affected}`
    if (kind === 'timeout') return `${affected} hat zu lange gebraucht`
    return `Flash wählt ${active}`
  }
  if (kind === 'skip') return `${active} is skipped`
  if (kind === 'slap') return `SLAP: ${affected}`
  if (kind === 'timeout') return `${affected} timed out`
  return `Flash selects ${active}`
}

function flashAnimationResult(language: Language, event: FlashEvent, active: string, affected: string): string {
  if (event.kind === 'slap' || event.kind === 'timeout') {
    return flashDetail(language, affected, event.penaltyCards)
  }
  if (event.kind === 'skip') {
    if (language === 'zh') return `${active} 失去本回合`
    if (language === 'de') return `${active} verliert den Zug`
    return `${active} loses the turn`
  }
  if (language === 'zh') return `${active} 现在行动`
  if (language === 'de') return `${active} ist jetzt dran`
  return `${active} acts now`
}

function spinAnimationTitle(language: Language, target: string): string {
  if (language === 'zh') return `${target} 旋转转盘`
  if (language === 'de') return `${target} dreht das Spin-Rad`
  return `${target} spins the wheel`
}

function spinAnimationResult(language: Language, event: SpinEvent, target: string): string {
  const action = spinActionLabel(language, event.action)
  const detail = spinDetail(language, target, event.action, event.color)
  return `${action} - ${detail}`
}

function spinTitle(language: Language): string {
  if (language === 'zh') return '旋转轮'
  if (language === 'de') return 'Spin-Rad'
  return 'Spin Wheel'
}

function spinReadyText(language: Language): string {
  if (language === 'zh') return '等待旋转牌'
  if (language === 'de') return 'Bereit'
  return 'Ready'
}

function spinTriggerText(language: Language): string {
  if (language === 'zh') return '旋转牌会触发'
  if (language === 'de') return 'Spin-Karten losen aus'
  return 'Spin cards trigger it'
}

function spinActionLabel(language: Language, action: SpinWheelAction): string {
  const labels: Record<Language, Record<SpinWheelAction, string>> = {
    en: {
      almostUno: 'Almost UNO',
      discardNumber: 'Discard Number',
      discardColor: 'Discard Color',
      colorDraw: 'Color Draw',
      wildColorDraw: 'Wild Color Draw',
      tradeHands: 'Trade Hands',
      showHand: 'Show Hand',
      war: 'War',
      unoSpin: 'UNO Spin',
    },
    zh: {
      almostUno: '接近 UNO',
      discardNumber: '弃数字',
      discardColor: '弃颜色',
      colorDraw: '抽到颜色',
      wildColorDraw: '指定颜色抽牌',
      tradeHands: '交换手牌',
      showHand: '展示手牌',
      war: '战争',
      unoSpin: 'UNO Spin',
    },
    de: {
      almostUno: 'Almost UNO',
      discardNumber: 'Zahl ablegen',
      discardColor: 'Farbe ablegen',
      colorDraw: 'Farbe ziehen',
      wildColorDraw: 'Wild-Farbe ziehen',
      tradeHands: 'Hande tauschen',
      showHand: 'Hand zeigen',
      war: 'War',
      unoSpin: 'UNO Spin',
    },
  }
  return labels[language][action]
}

function spinDetail(language: Language, target: string, action: SpinWheelAction, color?: UnoColor): string {
  const colorText = color ? colorName(language, color) : null
  if (language === 'zh') {
    if (colorText) return `${target} / ${colorText}`
    if (action === 'tradeHands') return '所有玩家向左传手牌'
    if (action === 'unoSpin') return `${target} 先喊出`
    return `目标：${target}`
  }
  if (language === 'de') {
    if (colorText) return `${target} / ${colorText}`
    if (action === 'tradeHands') return 'Alle geben nach links'
    if (action === 'unoSpin') return `${target} zuerst`
    return `Ziel: ${target}`
  }
  if (colorText) return `${target} / ${colorText}`
  if (action === 'tradeHands') return 'All hands passed left'
  if (action === 'unoSpin') return `${target} shouted first`
  return `Target: ${target}`
}

function whirlpoolTitle(language: Language): string {
  if (language === 'zh') return '漩涡'
  if (language === 'de') return 'Whirlpool'
  return 'Whirlpool'
}

function whirlpoolReadyText(language: Language): string {
  if (language === 'zh') return '等待触发'
  if (language === 'de') return 'Bereit'
  return 'Ready'
}

function whirlpoolTriggerText(language: Language): string {
  if (language === 'zh') return '0、2 或大雨牌会触发'
  if (language === 'de') return '0, 2 oder Wolkenbruch lost aus'
  return '0, 2, or Downpour will trigger it'
}

function whirlpoolTargetText(language: Language, target: string): string {
  if (language === 'zh') return `目标：${target}`
  if (language === 'de') return `Ziel: ${target}`
  return `Target: ${target}`
}

function whirlpoolAnimationTitle(language: Language, target: string): string {
  if (language === 'zh') return `${target} 摇动漩涡`
  if (language === 'de') return `${target} schuttelt den Whirlpool`
  return `${target} shakes the Whirlpool`
}

function whirlpoolAnimationResult(language: Language, event: WhirlpoolEvent, target: string): string {
  const command = whirlpoolCommandLabel(language, event.command)
  if (language === 'zh') return `${target}: ${command}`
  if (language === 'de') return `${target}: ${command}`
  return `${target}: ${command}`
}

function whirlpoolCommandLabel(language: Language, command: WhirlpoolCommand): string {
  const labels: Record<Language, Record<WhirlpoolCommand, string>> = {
    en: {
      drawH2O: 'Draw H2O',
      wipeout: 'Wipeout',
      waveLeft: 'Wave Left',
      waveRight: 'Wave Right',
      give1: 'Give 1',
      discard2: 'Discard 2',
      draw2: 'Draw 2',
      draw3: 'Draw 3',
    },
    zh: {
      drawH2O: '抽 H2O',
      wipeout: '反转浪',
      waveLeft: '左浪',
      waveRight: '右浪',
      give1: '给 1',
      discard2: '弃 2',
      draw2: '摸 2',
      draw3: '摸 3',
    },
    de: {
      drawH2O: 'H2O ziehen',
      wipeout: 'Wipeout',
      waveLeft: 'Welle links',
      waveRight: 'Welle rechts',
      give1: 'Gib 1',
      discard2: 'Lege 2 ab',
      draw2: 'Zieh 2',
      draw3: 'Zieh 3',
    },
  }
  return labels[language][command]
}

function recommendationTitle(language: Language, game: GameVariant, recommendation: MoveRecommendation | null): string {
  if (!recommendation) return t(language, 'recommendWait')
  if (recommendation.action === 'draw') return isLauncherGame(game) ? t(language, 'recommendLauncher') : t(language, 'recommendDraw')
  if (recommendation.action === 'acceptPenalty') return t(language, 'recommendAcceptPenalty')
  if (recommendation.action === 'wait') return t(language, 'recommendWait')
  if (!recommendation.card) return t(language, 'recommendWait')
  const card = scoreCardLabel(language, recommendation.card)
  const prefix = recommendation.action === 'callUnoThenPlay' ? t(language, 'recommendCallUnoPlay') : t(language, 'recommendPlay')
  return `${prefix}: ${card}`
}

function recommendationReason(language: Language, reason: RecommendationReason): string {
  const keyByReason: Record<RecommendationReason, Parameters<typeof t>[1]> = {
    finishRound: 'recommendReasonFinish',
    callUno: 'recommendReasonCallUno',
    pressureNext: 'recommendReasonPressure',
    answerPenalty: 'recommendReasonPenalty',
    wildChoice: 'recommendReasonWild',
    keepColor: 'recommendReasonKeepColor',
    matchNumber: 'recommendReasonNumber',
    matchSymbol: 'recommendReasonSymbol',
    highPoints: 'recommendReasonPoints',
    forcedColor: 'recommendReasonForcedColor',
    forcedPlay: 'recommendReasonForcedPlay',
    draw: 'recommendReasonDraw',
    acceptPenalty: 'recommendReasonAccept',
    wait: 'recommendReasonWait',
  }
  return t(language, keyByReason[reason])
}

function LanguagePicker({
  language,
  onChange,
  compact = false,
}: {
  language: Language
  onChange: (language: Language) => void
  compact?: boolean
}) {
  return (
    <label className={`language-picker ${compact ? 'compact' : ''}`}>
      <span>{language === 'zh' ? '语言' : language === 'de' ? 'Sprache' : 'Language'}</span>
      <select value={language} onChange={(event) => onChange(event.target.value as Language)}>
        <option value="en">English</option>
        <option value="zh">简体中文</option>
        <option value="de">Deutsch</option>
      </select>
    </label>
  )
}

function ThemeToggle({
  language,
  theme,
  onChange,
  compact = false,
}: {
  language: Language
  theme: ThemeMode
  onChange: (theme: ThemeMode) => void
  compact?: boolean
}) {
  const isLight = theme === 'light'
  return (
    <label className={`theme-toggle ${compact ? 'compact' : ''}`}>
      <span>{t(language, 'theme')}</span>
      <input type="checkbox" checked={isLight} onChange={(event) => onChange(event.target.checked ? 'light' : 'dark')} />
      <strong>{isLight ? t(language, 'lightTheme') : t(language, 'darkTheme')}</strong>
    </label>
  )
}

function ChoiceModal({
  state,
  pending,
  language,
  onCancel,
  onPartialAnswer,
  onAnswer,
}: {
  state: GameState
  pending: PendingChoiceState
  language: Language
  onCancel: () => void
  onPartialAnswer: (choice: PlayChoice) => void
  onAnswer: (choice: PlayChoice) => void
}) {
  const request = pending.request
  const targets = legalTargets(state)
  const choiceCard = request.cardId ? activePlayer(state).hand.find((card) => card.id === request.cardId) : undefined

  return (
    <div className="handoff-overlay">
      <div className="modal-panel">
        <p className="eyebrow">{t(language, 'choice')}</p>
        <h2>{choiceMessage(language, request.type, state.config.game)}</h2>

        {request.type === 'neighborWild' && (
          <>
            <p className="hint">{neighborWildChoiceHint(language, pending.partial.color, pending.partial.neighborAnchor)}</p>
            <div className="color-picker">
              {colorsForState(state).map((color) => (
                <button key={color} className={`color-swatch ${color} ${pending.partial.color === color ? 'selected' : ''}`} type="button" onClick={() => onAnswer({ color })}>
                  {colorName(language, color)}
                </button>
              ))}
            </div>
            <div className="target-list">
              {Array.from({ length: 10 }, (_, number) => (
                <button key={number} className={pending.partial.neighborAnchor === number ? 'selected' : ''} type="button" onClick={() => onAnswer({ neighborAnchor: number })}>
                  {number}
                </button>
              ))}
            </div>
          </>
        )}

        {request.type === 'hiLoWild' && (
          <>
            <p className="hint">{hiLoWildChoiceHint(language, pending.partial.color, pending.partial.hiLoAnchor)}</p>
            <div className="color-picker">
              {colorsForState(state).map((color) => (
                <button key={color} className={`color-swatch ${color} ${pending.partial.color === color ? 'selected' : ''}`} type="button" onClick={() => onAnswer({ color })}>
                  {colorName(language, color)}
                </button>
              ))}
            </div>
            <div className="target-list">
              {Array.from({ length: 10 }, (_, number) => (
                <button key={number} className={pending.partial.hiLoAnchor === number ? 'selected' : ''} type="button" onClick={() => onAnswer({ hiLoAnchor: number })}>
                  {number}
                </button>
              ))}
            </div>
          </>
        )}

        {request.type === 'barbieColors' && (
          <>
            <p className="hint">{barbieChoiceHint(language, pending.partial.color, pending.partial.barbieDiscardColor)}</p>
            <p className="choice-section-label">{barbieChoiceActiveLabel(language)}</p>
            <div className="color-picker">
              {colorsForState(state).map((color) => (
                <button key={color} className={`color-swatch ${color} ${pending.partial.color === color ? 'selected' : ''}`} type="button" onClick={() => onPartialAnswer({ color })}>
                  {colorName(language, color)}
                </button>
              ))}
            </div>
            <p className="choice-section-label">{barbieChoiceDiscardLabel(language)}</p>
            <div className="color-picker">
              {colorsForState(state).map((color) => (
                <button key={color} className={`color-swatch ${color} ${pending.partial.barbieDiscardColor === color ? 'selected' : ''}`} type="button" onClick={() => onPartialAnswer({ barbieDiscardColor: color })}>
                  {colorName(language, color)}
                </button>
              ))}
            </div>
            <button className="primary-button" type="button" disabled={!pending.partial.color || !pending.partial.barbieDiscardColor} onClick={() => onAnswer({})}>
              {barbieChoiceConfirmLabel(language)}
            </button>
          </>
        )}

        {request.type === 'color' && (
          <div className="color-picker">
            {colorsForState(state).map((color) => (
              <button key={color} className={`color-swatch ${color}`} type="button" onClick={() => onAnswer({ color })}>
                {colorName(language, color)}
              </button>
            ))}
          </div>
        )}

        {request.type === 'flexMode' && (
          <div className="target-list">
            <button type="button" onClick={() => onAnswer({ useFlex: false })}>
              {flexChoiceLabel(language, false, choiceCard?.kind)}
            </button>
            <button type="button" onClick={() => onAnswer({ useFlex: true })}>
              {flexChoiceLabel(language, true, choiceCard?.kind)}
            </button>
          </div>
        )}

        {request.type === 'triplePlayPile' && choiceCard && (
          <div className="target-list">
            {(state.config.game === 'tippo' ? tippoLegalTrayIndexes(state, choiceCard) : triplePlayLegalPileIndexes(state, choiceCard)).map((pileIndex) => {
              const pile = state.triplePlayPiles?.[pileIndex]
              const tray = state.tippoTrays?.[pileIndex]
              return (
                <button key={pileIndex} type="button" onClick={() => onAnswer({ discardPileIndex: pileIndex })}>
                  {state.config.game === 'tippo' ? tippoTrayChoiceLabel(language, pileIndex, tray) : triplePlayPileChoiceLabel(language, pileIndex, pile)}
                </button>
              )
            })}
          </div>
        )}

        {request.type === 'liarClaim' && choiceCard && (
          <>
            <p className="hint">{liarClaimChoiceHint(language)}</p>
            <div className="target-list claim-list">
              {liarClaimOptions(state, choiceCard).map((claim) => (
                <button key={`${claim.kind}:${claim.color}:${claim.value ?? ''}`} type="button" onClick={() => onAnswer({ liarClaim: claim })}>
                  {claim.label}
                </button>
              ))}
            </div>
          </>
        )}

        {request.type === 'target' && (
          <div className="target-list">
            {targets.map((target) => (
              <button key={target.id} type="button" onClick={() => onAnswer({ targetPlayerId: target.id })}>
                {playerName(language, target.name)}
              </button>
            ))}
          </div>
        )}

        {request.type === 'twoTargets' && (
          <TwoTargetPicker targets={targets} language={language} onAnswer={onAnswer} />
        )}

        <button className="ghost-button" type="button" onClick={onCancel}>
          {t(language, 'cancel')}
        </button>
      </div>
    </div>
  )
}

function choiceMessage(language: Language, type: ChoiceRequest['type'], game?: GameVariant): string {
  if (type === 'target') return t(language, 'chooseTarget')
  if (type === 'twoTargets') return t(language, 'chooseTwoTargets')
  if (type === 'flexMode') return flexChoiceTitle(language)
  if (type === 'liarClaim') return liarClaimChoiceTitle(language)
  if (type === 'neighborWild') return neighborWildChoiceTitle(language)
  if (type === 'hiLoWild') return hiLoWildChoiceTitle(language)
  if (type === 'barbieColors') return barbieChoiceTitle(language)
  if (type === 'triplePlayPile' && game === 'tippo') return tippoTrayChoiceTitle(language)
  if (type === 'triplePlayPile') return triplePlayPileChoiceTitle(language)
  return t(language, 'chooseColor')
}

function triplePlayPileChoiceTitle(language: Language): string {
  if (language === 'zh') return '选择 Triple Play 牌堆'
  if (language === 'de') return 'Triple-Play-Stapel wählen'
  return 'Choose Triple Play pile'
}

function tippoTrayChoiceTitle(language: Language): string {
  if (language === 'zh') return '选择 Tippo 托盘'
  if (language === 'de') return 'Tippo-Ablage wählen'
  return 'Choose Tippo tray'
}

function triplePlayPileChoiceLabel(language: Language, pileIndex: number, pile?: NonNullable<GameState['triplePlayPiles']>[number]): string {
  const top = pile?.cards.at(-1)
  const load = pile ? `${pile.overload}/${pile.limit}` : '-'
  const topLabel = top ? cardName(language, top) : '-'
  if (language === 'zh') return `牌堆 ${pileIndex + 1}: ${topLabel}，计量 ${load}`
  if (language === 'de') return `Stapel ${pileIndex + 1}: ${topLabel}, Anzeige ${load}`
  return `Pile ${pileIndex + 1}: ${topLabel}, meter ${load}`
}

function tippoTrayChoiceLabel(language: Language, trayIndex: number, tray?: NonNullable<GameState['tippoTrays']>[number]): string {
  const top = tray?.cards.at(-1)
  const load = tray ? `${tray.load}/${tray.limit}` : '-'
  const topLabel = top ? cardName(language, top) : '-'
  if (language === 'zh') return `托盘 ${trayIndex + 1}: ${topLabel}，负载 ${load}`
  if (language === 'de') return `Ablage ${trayIndex + 1}: ${topLabel}, Last ${load}`
  return `Tray ${trayIndex + 1}: ${topLabel}, load ${load}`
}

function liarClaimChoiceTitle(language: Language): string {
  if (language === 'zh') return '选择你要宣称的牌'
  if (language === 'de') return 'Welche Karte behauptest du?'
  return 'Choose your announced claim'
}

function liarClaimChoiceHint(language: Language): string {
  if (language === 'zh') return '列表不是随机的：它只显示当前合理的宣称；真实且合法的宣称会排在最前。'
  if (language === 'de') return 'Die Liste ist nicht zufällig: Sie zeigt plausible Ansagen; eine wahre legale Ansage steht zuerst.'
  return 'This list is not random: it shows plausible legal claims, with a truthful legal claim first.'
}

function flexChoiceTitle(language: Language): string {
  if (language === 'zh') return '选择普通面或 Flex 面'
  if (language === 'de') return 'Normale oder Flex-Seite wählen'
  return 'Choose normal or Flex side'
}

function flexChoiceLabel(language: Language, useFlex: boolean, kind?: Card['kind']): string {
  if (kind === 'flexDraw2') {
    if (language === 'zh') return useFlex ? 'Flex：其他每位摸 1 张' : '普通：下一位摸 2 张'
    if (language === 'de') return useFlex ? 'Flex: alle anderen ziehen 1' : 'Normal: nächster Spieler zieht 2'
    return useFlex ? 'Flex: every other player draws 1' : 'Normal: next player draws 2'
  }
  if (kind === 'flexSkip') {
    if (language === 'zh') return useFlex ? 'Flex：跳过其他所有玩家' : '普通：跳过下一位'
    if (language === 'de') return useFlex ? 'Flex: alle anderen aussetzen' : 'Normal: nächsten Spieler aussetzen'
    return useFlex ? 'Flex: skip every other player' : 'Normal: skip next player'
  }
  if (kind === 'flexReverse') {
    if (language === 'zh') return useFlex ? 'Flex：反转并跳过下一位' : '普通：反转方向'
    if (language === 'de') return useFlex ? 'Flex: Richtung und Aussetzen' : 'Normal: Richtung wechseln'
    return useFlex ? 'Flex: reverse and skip next' : 'Normal: reverse direction'
  }
  if (kind === 'wildFlexDraw2') {
    if (language === 'zh') return useFlex ? 'Flex：指定一名玩家摸 2 张' : '普通：万能选色'
    if (language === 'de') return useFlex ? 'Flex: ein Spieler zieht 2' : 'Normal: Wild-Farbe'
    return useFlex ? 'Flex: choose one player to draw 2' : 'Normal: Wild color'
  }
  if (language === 'zh') return useFlex ? '使用 Flex 能力' : '使用普通效果'
  if (language === 'de') return useFlex ? 'Flex-Seite nutzen' : 'Normale Wirkung'
  return useFlex ? 'Use Flex power' : 'Use normal effect'
}

function TwoTargetPicker({
  targets,
  language,
  onAnswer,
}: {
  targets: ReturnType<typeof legalTargets>
  language: Language
  onAnswer: (choice: PlayChoice) => void
}) {
  const [first, setFirst] = useState('')
  return (
    <div className="target-list">
      {targets.map((target) => (
        <button
          key={target.id}
          type="button"
          className={first === target.id ? 'selected-target' : ''}
          onClick={() => {
            if (!first) {
              setFirst(target.id)
              return
            }
            if (first !== target.id) {
              onAnswer({ targetPlayerId: first, secondTargetPlayerId: target.id })
            }
          }}
        >
          {first ? `${t(language, 'chooseTarget')} ${playerName(language, target.name)}` : playerName(language, target.name)}
        </button>
      ))}
    </div>
  )
}

export default App
