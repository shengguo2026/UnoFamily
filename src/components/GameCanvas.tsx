import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { activePlayer, canPartySpeedPlayCutIn, isPlayable, skipBoCanPlaySource, topCard } from '../game/classic'
import type { AnimationSpeed, AvatarId, Card, CardFlourishStyle, DeckTheme, GameState, GameVariant, Player, TableTheme, UnoColor, WhirlpoolCommand, SpinWheelAction, ZeroGridSlot } from '../game/types'
import { cardEffect, cardFlourishStyleName, cardName, colorName, playableReason, playerName, t, type Language } from '../i18n'

interface GameCanvasProps {
  state: GameState
  hiddenHands: boolean
  language: Language
  localPlayerId?: string
  passModePlayerId?: string | null
  skipBoDiscardMode?: boolean
  onBlockingAnimationChange?: (reason: string | null) => void
  onCardClick: (cardId: string) => void
}

interface HitArea {
  id: string
  card: Card
  playable: boolean
  source: 'hand' | 'discard' | 'zeroGrid' | 'skipBo' | 'memory'
  reason?: string
  x: number
  y: number
  w: number
  h: number
}

interface TooltipState {
  card: Card
  playable: boolean
  source: 'hand' | 'discard' | 'zeroGrid' | 'skipBo' | 'memory'
  reason?: string
  x: number
  y: number
}

const BASE_CARD_W = 92
const BASE_CARD_H = 136
const PENALTY_DRAW_CARD_HIGHLIGHT_MS = 1500

interface TableLayout {
  cardW: number
  cardH: number
  scale: number
}

interface DevicePanelPosition {
  x: number
  y: number
}

interface SkyjoGridSeat {
  align: 'bottom' | 'top' | 'left' | 'right'
  labelAnchorX: number
  labelAnchorY: number
  labelRect: { x: number; y: number; w: number; h: number }
  gridRect: { x: number; y: number; w: number; h: number }
  cardW: number
  cardH: number
  gap: number
}

interface DosSeatGeometry {
  align: 'bottom' | 'top' | 'left' | 'right'
  x: number
  y: number
  labelRect: { x: number; y: number; w: number; h: number }
  stackRect: { x: number; y: number; w: number; h: number }
}

interface DosLayoutGeometry {
  centerRect: { x: number; y: number; w: number; h: number }
  drawRect: { x: number; y: number; w: number; h: number }
  seats: DosSeatGeometry[]
}

interface MemoryLayoutGeometry {
  boardRect: { x: number; y: number; w: number; h: number }
  labelRects: Array<{ x: number; y: number; w: number; h: number }>
  cardW: number
  cardH: number
  gap: number
}

interface PlayCardAnimation {
  key: string
  card: Card
  sourcePlayerId: string
  sourcePlayerIndex: number
  sourceCardIndex: number
  sourceHandSize: number
  sourceFaceUp: boolean
  startedAt: number
}

interface DrawCardAnimation {
  key: string
  card: Card
  targetPlayerId: string
  targetPlayerIndex: number
  targetHandSize: number
  targetFaceUp: boolean
  startedAt: number
}

interface PenaltyDrawRecipient {
  playerId: string
  playerIndex: number
  amount: number
  handSizeAfter: number
  cardIds: string[]
}

interface PenaltyDrawAnimation {
  key: string
  recipients: PenaltyDrawRecipient[]
  totalAmount: number
  startedAt: number
}

interface PenaltyDrawHighlight {
  animation: PenaltyDrawAnimation
  ageMs: number
}

interface RoundStartDealAnimation {
  key: string
  playerCount: number
  startingHandSize: number
  startedAt: number
}

interface CustomRoundStartAnimation {
  key: string
  game: GameVariant
  playerCount: number
  startedAt: number
}

interface MemoryGridStartAnimation {
  key: string
  rows: number
  columns: number
  cardCount: number
  startedAt: number
}

interface MemoryRevealAnimation {
  key: string
  slotIndex: number
  card: Card
  startedAt: number
}

interface MemoryCollectionAnimation {
  key: string
  playerId: string
  playerIndex: number
  cards: Array<{ slotIndex: number; card: Card }>
  startedAt: number
}

type ResolvedCardFlourishStyle = Exclude<CardFlourishStyle, 'random'>

interface RoundStartFlourishAnimation {
  key: string
  style: ResolvedCardFlourishStyle
  startedAt: number
}

interface RoundStartDealCover {
  hideCenterCards: boolean
  hideAllHands: boolean
}

const colorMap: Record<UnoColor | 'wild', string> = {
  red: '#df3f3f',
  yellow: '#eac64a',
  green: '#2fa56a',
  blue: '#327dd9',
  teal: '#179a98',
  pink: '#d94f93',
  purple: '#7650c9',
  orange: '#e07a2f',
  wild: '#20242d',
}

const tablePalettes: Record<TableTheme, { center: string; mid: string; edge: string; ring: string }> = {
  classicGreen: { center: '#19634d', mid: '#104331', edge: '#0a251d', ring: '#f7d36a' },
  casinoNight: { center: '#18322f', mid: '#0d1c1d', edge: '#05090b', ring: '#d8b56c' },
  lightWood: { center: '#c99659', mid: '#916039', edge: '#55351f', ring: '#fff0c1' },
  oceanBlue: { center: '#1c6c87', mid: '#10485f', edge: '#092737', ring: '#b8edf4' },
  royalRed: { center: '#7d2633', mid: '#481822', edge: '#21090f', ring: '#f0c45a' },
}

const deckPalettes: Record<DeckTheme, { border: string; back: string; accent: string; line: string }> = {
  classicRider: { border: '#f4f0df', back: '#242835', accent: '#f04e45', line: '#ffffff' },
  royalGold: { border: '#f8e8b7', back: '#111111', accent: '#d9ad4f', line: '#fff4c7' },
  arcaneNight: { border: '#d8d3c4', back: '#151728', accent: '#8e73ff', line: '#d8ccff' },
  retroCarnival: { border: '#fff2d6', back: '#116a75', accent: '#f0a33a', line: '#f6e4bd' },
  crystalLight: { border: '#ffffff', back: '#dceffd', accent: '#5b9fe8', line: '#24507a' },
}

const avatarPalette: Record<AvatarId, { fill: string; text: string; mark: string }> = {
  explorer: { fill: '#3f7edb', text: '#fff', mark: 'E' },
  teacher: { fill: '#2fa56a', text: '#fff', mark: 'T' },
  magician: { fill: '#744bc4', text: '#fff', mark: 'M' },
  builder: { fill: '#d9902f', text: '#1d1305', mark: 'B' },
  musician: { fill: '#d9577d', text: '#fff', mark: 'M' },
  gardener: { fill: '#6aa84f', text: '#10200b', mark: 'G' },
  pilot: { fill: '#4ea4b8', text: '#06202a', mark: 'P' },
  chef: { fill: '#f0d36a', text: '#241d0b', mark: 'C' },
  scientist: { fill: '#7c92d6', text: '#fff', mark: 'S' },
  artist: { fill: '#df5d3f', text: '#fff', mark: 'A' },
}

export function GameCanvas({ state, hiddenHands, language, localPlayerId, passModePlayerId, skipBoDiscardMode = false, onBlockingAnimationChange, onCardClick }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hitAreas = useRef<HitArea[]>([])
  const longPress = useRef<number | null>(null)
  const longPressFired = useRef(false)
  const animationStart = useRef(0)
  const lastMotionKey = useRef('')
  const previousState = useRef<GameState | null>(null)
  const playCardAnimation = useRef<PlayCardAnimation | null>(null)
  const drawCardAnimation = useRef<DrawCardAnimation | null>(null)
  const penaltyDrawAnimation = useRef<PenaltyDrawAnimation | null>(null)
  const roundStartFlourishAnimation = useRef<RoundStartFlourishAnimation | null>(null)
  const roundStartDealAnimation = useRef<RoundStartDealAnimation | null>(null)
  const customRoundStartAnimation = useRef<CustomRoundStartAnimation | null>(null)
  const memoryGridStartAnimation = useRef<MemoryGridStartAnimation | null>(null)
  const memoryRevealAnimation = useRef<MemoryRevealAnimation | null>(null)
  const memoryCollectionAnimation = useRef<MemoryCollectionAnimation | null>(null)
  const pendingRoundStartDealAnimation = useRef<Omit<RoundStartDealAnimation, 'startedAt'> | null>(null)
  const lastRoundStartFlourishKey = useRef('')
  const lastRandomFlourishStyle = useRef<ResolvedCardFlourishStyle | null>(null)
  const lastRoundStartDealKey = useRef('')
  const lastCustomRoundStartKey = useRef('')
  const lastMemoryGridStartKey = useRef('')
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const motionKey = `${state.currentRound}:${state.discardPile.length}:${state.activePlayerIndex}:${state.drawPile.length}:${state.pendingDraw?.amount ?? 0}:${state.pendingDare?.sequence ?? 0}:${state.whirlpoolEvent?.sequence ?? 0}:${state.launcherEvent?.sequence ?? 0}:${state.flashEvent?.sequence ?? 0}:${state.spinEvent?.sequence ?? 0}:${state.dareEvent?.sequence ?? 0}:${state.partyPileEvent?.sequence ?? 0}`
  useEffect(() => {
    if (state.config.reducedMotion) return
    animationStart.current = performance.now()
  }, [motionKey, state.config.reducedMotion])

  useEffect(() => {
    const isNewSessionAfterWinner = Boolean(previousState.current?.winnerId && !state.winnerId)
    const detectedRoundStartFlourish = detectRoundStartFlourishAnimation(previousState.current, state, localPlayerId)
    const detectedRoundStartDeal = detectRoundStartDealAnimation(previousState.current, state, localPlayerId)
    const detectedCustomRoundStart = detectCustomRoundStartAnimation(previousState.current, state, localPlayerId)
    const detectedMemoryGridStart = detectMemoryGridStartAnimation(previousState.current, state, localPlayerId)
    const detectedMemoryReveal = detectMemoryRevealAnimation(previousState.current, state)
    const detectedMemoryCollection = detectMemoryCollectionAnimation(previousState.current, state, localPlayerId)
    const detectedPlay = detectPlayCardAnimation(previousState.current, state, localPlayerId, hiddenHands)
    const detectedPenalty = detectPenaltyDrawAnimation(previousState.current, state, localPlayerId)
    const detectedDraw = detectDrawCardAnimation(previousState.current, state, localPlayerId, hiddenHands)
    if (state.config.dealAnimation && !state.config.reducedMotion && detectedMemoryGridStart && (lastMemoryGridStartKey.current !== detectedMemoryGridStart.key || isNewSessionAfterWinner)) {
      memoryGridStartAnimation.current = { ...detectedMemoryGridStart, startedAt: performance.now() }
      lastMemoryGridStartKey.current = detectedMemoryGridStart.key
      onBlockingAnimationChange?.('memoryGridStart')
    } else if (state.config.dealAnimation && !state.config.reducedMotion && detectedCustomRoundStart && (lastCustomRoundStartKey.current !== detectedCustomRoundStart.key || isNewSessionAfterWinner)) {
      customRoundStartAnimation.current = { ...detectedCustomRoundStart, startedAt: performance.now() }
      lastCustomRoundStartKey.current = detectedCustomRoundStart.key
      onBlockingAnimationChange?.('customRoundStart')
    } else if (state.config.roundStartFlourish && !state.config.reducedMotion && detectedRoundStartFlourish && (lastRoundStartFlourishKey.current !== detectedRoundStartFlourish.key || isNewSessionAfterWinner)) {
      const style = resolveCardFlourishStyle(state.config.cardFlourishStyle, lastRandomFlourishStyle.current)
      roundStartFlourishAnimation.current = { ...detectedRoundStartFlourish, style, startedAt: performance.now() }
      pendingRoundStartDealAnimation.current = detectedRoundStartDeal
      lastRoundStartFlourishKey.current = detectedRoundStartFlourish.key
      if (state.config.cardFlourishStyle === 'random') lastRandomFlourishStyle.current = style
      onBlockingAnimationChange?.('roundStartFlourish')
    } else if (state.config.dealAnimation && !state.config.reducedMotion && detectedRoundStartDeal && (lastRoundStartDealKey.current !== detectedRoundStartDeal.key || isNewSessionAfterWinner)) {
      roundStartDealAnimation.current = { ...detectedRoundStartDeal, startedAt: performance.now() }
      lastRoundStartDealKey.current = detectedRoundStartDeal.key
      onBlockingAnimationChange?.('roundStartDeal')
    }
    if (!state.config.reducedMotion && detectedPlay) {
      playCardAnimation.current = { ...detectedPlay, startedAt: performance.now() }
    }
    if (!state.config.reducedMotion && detectedPenalty) {
      penaltyDrawAnimation.current = { ...detectedPenalty, startedAt: performance.now() }
      drawCardAnimation.current = null
    }
    if (!state.config.reducedMotion && detectedDraw) {
      drawCardAnimation.current = { ...detectedDraw, startedAt: performance.now() }
    }
    if (!state.config.reducedMotion && detectedMemoryReveal) {
      memoryRevealAnimation.current = { ...detectedMemoryReveal, startedAt: performance.now() }
    }
    if (!state.config.reducedMotion && detectedMemoryCollection) {
      memoryCollectionAnimation.current = { ...detectedMemoryCollection, startedAt: performance.now() }
      onBlockingAnimationChange?.('memoryCollection')
    }
    if (!state.config.dealAnimation) {
      pendingRoundStartDealAnimation.current = null
      if (memoryGridStartAnimation.current) {
        memoryGridStartAnimation.current = null
        onBlockingAnimationChange?.(null)
      }
      if (customRoundStartAnimation.current) {
        customRoundStartAnimation.current = null
        onBlockingAnimationChange?.(null)
      }
      if (roundStartDealAnimation.current) {
        roundStartDealAnimation.current = null
        onBlockingAnimationChange?.(null)
      }
    }
    if (!state.config.roundStartFlourish && roundStartFlourishAnimation.current) {
      roundStartFlourishAnimation.current = null
      const pendingDeal = pendingRoundStartDealAnimation.current
      pendingRoundStartDealAnimation.current = null
      if (pendingDeal && state.config.dealAnimation) {
        roundStartDealAnimation.current = { ...pendingDeal, startedAt: performance.now() }
        onBlockingAnimationChange?.('roundStartDeal')
      } else {
        onBlockingAnimationChange?.(null)
      }
    }
    if (state.config.reducedMotion) {
      playCardAnimation.current = null
      drawCardAnimation.current = null
      penaltyDrawAnimation.current = null
      roundStartFlourishAnimation.current = null
      roundStartDealAnimation.current = null
      customRoundStartAnimation.current = null
      memoryGridStartAnimation.current = null
      memoryRevealAnimation.current = null
      memoryCollectionAnimation.current = null
      pendingRoundStartDealAnimation.current = null
      onBlockingAnimationChange?.(null)
    }
    previousState.current = state
  }, [hiddenHands, localPlayerId, onBlockingAnimationChange, state])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    let frame = 0

    const render = (timestamp = performance.now()) => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (lastMotionKey.current !== motionKey) {
        lastMotionKey.current = motionKey
        if (!state.config.reducedMotion) animationStart.current = timestamp
      }
      const elapsed = state.config.reducedMotion ? 999 : timestamp - animationStart.current
      const mobileInput = window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
      const activePenaltyDrawAnimation = penaltyDrawAnimation.current
      const penaltyDrawAge = activePenaltyDrawAnimation ? timestamp - activePenaltyDrawAnimation.startedAt : 999
      const penaltyDrawHighlight =
        activePenaltyDrawAnimation && penaltyDrawAge <= PENALTY_DRAW_CARD_HIGHLIGHT_MS
          ? { animation: activePenaltyDrawAnimation, ageMs: penaltyDrawAge }
          : null
      let activeMemoryGridStartAnimation = memoryGridStartAnimation.current
      const memoryGridStartAge = activeMemoryGridStartAnimation ? timestamp - activeMemoryGridStartAnimation.startedAt : 999
      if (activeMemoryGridStartAnimation && memoryGridStartAge > memoryGridStartAnimationDurationMs(activeMemoryGridStartAnimation.cardCount)) {
        memoryGridStartAnimation.current = null
        activeMemoryGridStartAnimation = null
        onBlockingAnimationChange?.(null)
      }
      let activeMemoryCollectionAnimation = memoryCollectionAnimation.current
      const memoryCollectionAge = activeMemoryCollectionAnimation ? timestamp - activeMemoryCollectionAnimation.startedAt : 999
      if (activeMemoryCollectionAnimation && memoryCollectionAge > memoryCollectionAnimationDurationMs(activeMemoryCollectionAnimation.cards.length)) {
        memoryCollectionAnimation.current = null
        activeMemoryCollectionAnimation = null
        onBlockingAnimationChange?.(null)
      }
      let activeCustomRoundStartAnimation = customRoundStartAnimation.current
      const customRoundStartAge = activeCustomRoundStartAnimation ? timestamp - activeCustomRoundStartAnimation.startedAt : 999
      if (activeCustomRoundStartAnimation && customRoundStartAge > customRoundStartAnimationDurationMs(state.config.animationSpeed)) {
        customRoundStartAnimation.current = null
        activeCustomRoundStartAnimation = null
        onBlockingAnimationChange?.(null)
      }
      let activeRoundStartFlourishAnimation = roundStartFlourishAnimation.current
      const roundStartFlourishAge = activeRoundStartFlourishAnimation ? timestamp - activeRoundStartFlourishAnimation.startedAt : 999
      if (activeRoundStartFlourishAnimation && roundStartFlourishAge > cardFlourishAnimationDurationMs(state.config.animationSpeed)) {
        roundStartFlourishAnimation.current = null
        activeRoundStartFlourishAnimation = null
        const pendingDeal = pendingRoundStartDealAnimation.current
        pendingRoundStartDealAnimation.current = null
        if (pendingDeal && state.config.dealAnimation) {
          roundStartDealAnimation.current = { ...pendingDeal, startedAt: timestamp }
          lastRoundStartDealKey.current = pendingDeal.key
        } else {
          onBlockingAnimationChange?.(null)
        }
      }
      let activeRoundStartDealAnimation = roundStartDealAnimation.current
      const roundStartDealAge = activeRoundStartDealAnimation ? timestamp - activeRoundStartDealAnimation.startedAt : 999
      if (activeRoundStartDealAnimation && roundStartDealAge > roundStartDealAnimationDurationMs(activeRoundStartDealAnimation.playerCount, activeRoundStartDealAnimation.startingHandSize)) {
        roundStartDealAnimation.current = null
        activeRoundStartDealAnimation = null
        onBlockingAnimationChange?.(null)
      }
      const roundStartDealCover = activeRoundStartFlourishAnimation || activeRoundStartDealAnimation
        ? { hideCenterCards: true, hideAllHands: true }
        : null
      drawTable(
        context,
        rect.width,
        rect.height,
        state,
        hiddenHands,
        language,
        hitAreas.current,
        localPlayerId,
        passModePlayerId ?? null,
        skipBoDiscardMode,
        elapsed,
        mobileInput,
        penaltyDrawHighlight,
        roundStartDealCover,
      )
      if (!state.config.reducedMotion && activeRoundStartDealAnimation) {
        drawRoundStartDealAnimation(context, rect.width, rect.height, state, activeRoundStartDealAnimation, roundStartDealAge, mobileInput)
      }
      if (!state.config.reducedMotion && activeRoundStartFlourishAnimation) {
        drawRoundStartFlourishAnimation(context, rect.width, rect.height, state, language, activeRoundStartFlourishAnimation, roundStartFlourishAge)
      }
      if (!state.config.reducedMotion && activeCustomRoundStartAnimation) {
        hitAreas.current.length = 0
        drawCustomRoundStartAnimation(context, rect.width, rect.height, state, language, localPlayerId, hiddenHands, activeCustomRoundStartAnimation, customRoundStartAge, mobileInput)
      }
      if (!state.config.reducedMotion && activeMemoryGridStartAnimation) {
        hitAreas.current.length = 0
        drawMemoryGridStartAnimation(context, rect.width, rect.height, state, localPlayerId, activeMemoryGridStartAnimation, memoryGridStartAge)
      }
      if (!state.config.reducedMotion && activeMemoryCollectionAnimation) {
        hitAreas.current.length = 0
        drawMemoryCollectionAnimation(context, rect.width, rect.height, state, language, localPlayerId, activeMemoryCollectionAnimation, memoryCollectionAge)
      }
      if (!state.config.reducedMotion && memoryRevealAnimation.current) {
        const activeMemoryRevealAnimation = memoryRevealAnimation.current
        const age = timestamp - activeMemoryRevealAnimation.startedAt
        if (age <= memoryRevealAnimationDurationMs()) {
          drawMemoryRevealAnimation(context, rect.width, rect.height, state, language, localPlayerId, activeMemoryRevealAnimation, age)
        } else {
          memoryRevealAnimation.current = null
        }
      }
      if (!state.config.reducedMotion && playCardAnimation.current) {
        const activePlayCardAnimation = playCardAnimation.current
        const age = timestamp - activePlayCardAnimation.startedAt
        if (age <= playCardAnimationDurationMs(state.config.animationSpeed)) {
          drawPlayCardAnimation(context, rect.width, rect.height, state, language, activePlayCardAnimation, age, mobileInput)
        } else {
          playCardAnimation.current = null
        }
      }
      if (!state.config.reducedMotion && drawCardAnimation.current) {
        const activeDrawCardAnimation = drawCardAnimation.current
        const age = timestamp - activeDrawCardAnimation.startedAt
        if (age <= drawCardAnimationDurationMs(state.config.animationSpeed)) {
          drawDrawCardAnimation(context, rect.width, rect.height, state, language, activeDrawCardAnimation, age, mobileInput)
        } else {
          drawCardAnimation.current = null
        }
      }
      if (!state.config.reducedMotion && penaltyDrawAnimation.current) {
        const activePenaltyDrawAnimation = penaltyDrawAnimation.current
        const age = timestamp - activePenaltyDrawAnimation.startedAt
        const streamDuration = penaltyDrawAnimationDurationMs(activePenaltyDrawAnimation.totalAmount)
        if (age <= streamDuration) {
          drawPenaltyDrawAnimation(context, rect.width, rect.height, state, activePenaltyDrawAnimation, age, mobileInput)
        }
        if (age > Math.max(streamDuration, PENALTY_DRAW_CARD_HIGHLIGHT_MS)) {
          penaltyDrawAnimation.current = null
        }
      }
      if (!state.config.reducedMotion && (elapsed < 640 || memoryGridStartAnimation.current || memoryRevealAnimation.current || memoryCollectionAnimation.current || customRoundStartAnimation.current || roundStartFlourishAnimation.current || roundStartDealAnimation.current || playCardAnimation.current || drawCardAnimation.current || penaltyDrawAnimation.current)) {
        frame = window.requestAnimationFrame(render)
      }
    }

    render()
    const resize = () => render()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [hiddenHands, language, localPlayerId, motionKey, onBlockingAnimationChange, passModePlayerId, skipBoDiscardMode, state])

  function hitCard(event: PointerEvent<HTMLCanvasElement>): HitArea | undefined {
    const canvas = canvasRef.current
    if (!canvas || hiddenHands) return undefined
    const rect = canvas.getBoundingClientRect()
    return hitCardAt(event.clientX - rect.left, event.clientY - rect.top)
  }

  function hitCardAt(x: number, y: number): HitArea | undefined {
    return [...hitAreas.current].reverse().find((hit) => x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h)
  }

  function showTooltip(area: HitArea | undefined, event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    showTooltipAt(area, event.clientX - rect.left, event.clientY - rect.top)
  }

  function showTooltipAt(area: HitArea | undefined, x: number, y: number) {
    if (!area) {
      setTooltip(null)
      return
    }
    setTooltip({
      card: area.card,
      playable: area.playable,
      source: area.source,
      reason: area.reason,
      x,
      y,
    })
  }

  return (
    <div className="game-canvas-shell">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onPointerMove={(event) => {
          if (event.pointerType === 'touch') return
          showTooltip(hitCard(event), event)
        }}
        onPointerLeave={() => {
          setTooltip(null)
          if (longPress.current) window.clearTimeout(longPress.current)
        }}
        onPointerDown={(event) => {
          if (longPress.current) window.clearTimeout(longPress.current)
          const area = hitCard(event)
          longPressFired.current = false
          if (event.pointerType !== 'touch') return
          event.preventDefault()
          if (!area) {
            setTooltip(null)
            return
          }
          event.currentTarget.setPointerCapture(event.pointerId)
          const rect = event.currentTarget.getBoundingClientRect()
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          longPress.current = window.setTimeout(() => {
            longPressFired.current = true
            showTooltipAt(area, x, y)
          }, 520)
        }}
        onPointerUp={(event) => {
          if (longPress.current) window.clearTimeout(longPress.current)
          const area = hitCard(event)
          if (!area) return
          if (event.pointerType === 'touch' && longPressFired.current) return
          if (area.source !== 'hand' && area.source !== 'zeroGrid' && area.source !== 'skipBo' && area.source !== 'memory') return
          if (!area.playable) return
          onCardClick(area.id)
        }}
        onPointerCancel={() => {
          if (longPress.current) window.clearTimeout(longPress.current)
        }}
        onContextMenu={(event) => event.preventDefault()}
      />
      {tooltip && (
        <div
          className={`card-tooltip ${tooltip.playable ? 'playable' : ''}`}
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <strong>{cardName(language, tooltip.card)}</strong>
          <span>{t(language, 'cardEffect')}: {tooltipCardEffect(language, tooltip.card, state)}</span>
          {(tooltip.source === 'hand' || tooltip.source === 'zeroGrid' || tooltip.source === 'skipBo' || tooltip.source === 'memory') && (
            <>
              <span>{t(language, 'moveStatus')}: {tooltip.playable ? t(language, 'movable') : t(language, 'notMovable')}</span>
              <span>{tooltip.reason ?? playableReason(language, tooltip.card, state)}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function drawTable(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  hiddenHands: boolean,
  language: Language,
  hitAreas: HitArea[],
  localPlayerId?: string,
  passModePlayerId?: string | null,
  skipBoDiscardMode = false,
  elapsed = 999,
  mobileInput = false,
  penaltyDrawHighlight: PenaltyDrawHighlight | null = null,
  roundStartDealCover: RoundStartDealCover | null = null,
) {
  hitAreas.length = 0
  const layout = getTableLayout(width, height)
  const table = tablePalettes[state.config.tableTheme]
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, Math.max(width, height) / 1.1)
  gradient.addColorStop(0, table.center)
  gradient.addColorStop(0.62, table.mid)
  gradient.addColorStop(1, table.edge)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.globalAlpha = 0.12
  ctx.strokeStyle = table.ring
  for (let ring = 0; ring < 8; ring += 1) {
    ctx.beginPath()
    ctx.ellipse(width / 2, height / 2, width * (0.16 + ring * 0.06), height * (0.1 + ring * 0.038), 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()

  if (state.config.game === 'guoMemory' || state.config.game === 'guoMemoryAction' || state.config.game === 'guoTripleMemory' || state.config.game === 'guoTripleMemoryAction') {
    drawMemoryTable(ctx, width, height, state, hiddenHands, language, hitAreas, layout, localPlayerId, elapsed)
    return
  }

  if (!roundStartDealCover?.hideCenterCards) drawCenter(ctx, width, height, state, language, hitAreas, layout, elapsed)
  if (state.config.game === 'skipBo') {
    drawSkipBoPlayers(ctx, width, height, state, hiddenHands, language, hitAreas, layout, localPlayerId, skipBoDiscardMode, elapsed)
    return
  }
  if (isGridMemoryGame(state.config.game)) {
    drawZeroPlayers(ctx, width, height, state, hiddenHands, language, hitAreas, layout, localPlayerId, elapsed)
    return
  }
  drawPlayers(ctx, width, height, state, hiddenHands, language, hitAreas, layout, localPlayerId, passModePlayerId ?? null, elapsed, mobileInput, penaltyDrawHighlight, roundStartDealCover)
}

function getTableLayout(width: number, height: number): TableLayout {
  const scale = Math.min(1, Math.max(0.38, Math.min(width / 540, height / 460)))
  return {
    cardW: Math.round(BASE_CARD_W * scale),
    cardH: Math.round(BASE_CARD_H * scale),
    scale,
  }
}

export function skyjoGridGeometryForTest(width: number, height: number): SkyjoGridSeat[] {
  return skyjoGridGeometry(width, height, getTableLayout(width, height))
}

export function dosLayoutGeometryForTest(width: number, height: number, centerCardCount: number, playerCount: number): DosLayoutGeometry {
  return dosLayoutGeometry(width, height, getTableLayout(width, height), centerCardCount, playerCount)
}

export function phase10LayoutGeometryForTest(width: number, height: number, playerCount: number, handSize: number): DosLayoutGeometry {
  return phase10LayoutGeometry(width, height, getTableLayout(width, height), playerCount, handSize)
}

export function triplePlayLayoutGeometryForTest(width: number, height: number, playerCount: number, handSize: number): DosLayoutGeometry {
  return triplePlayLayoutGeometry(width, height, getTableLayout(width, height), playerCount, handSize)
}

export function minecraftLayoutGeometryForTest(width: number, height: number, playerCount: number, handSize: number): DosLayoutGeometry {
  return triplePlayLayoutGeometry(width, height, getTableLayout(width, height), playerCount, handSize)
}

export function compactMobileUnoLayoutGeometryForTest(width: number, height: number, playerCount: number, handSize: number, forcePhone = false): DosLayoutGeometry {
  return compactMobileUnoLayoutGeometry(width, height, getTableLayout(width, height), playerCount, handSize, forcePhone)
}

export function memoryLayoutGeometryForTest(width: number, height: number, rows: number, columns: number, playerCount: number): MemoryLayoutGeometry {
  return memoryLayoutGeometry(width, height, getTableLayout(width, height), rows, columns, playerCount)
}

export function cardBackLabelStyleForTest(width: number, height: number) {
  return cardBackLabelStyle(width, height)
}

export function usesCompactMobileUnoLayoutForTest(game: GameState['config']['game'], width: number, height: number, playerCount: number, mobileInput = false): boolean {
  return usesCompactMobileUnoLayout(game, width, height, playerCount, mobileInput)
}

export function playCardAnimationDurationMsForTest(speed: AnimationSpeed): number {
  return playCardAnimationDurationMs(speed)
}

export function detectPlayCardAnimationForTest(previous: GameState | null, next: GameState, localPlayerId?: string, hiddenHands = false): Omit<PlayCardAnimation, 'startedAt'> | null {
  return detectPlayCardAnimation(previous, next, localPlayerId, hiddenHands)
}

export function drawCardAnimationDurationMsForTest(speed: AnimationSpeed): number {
  return drawCardAnimationDurationMs(speed)
}

export function detectDrawCardAnimationForTest(previous: GameState | null, next: GameState, localPlayerId?: string, hiddenHands = false): Omit<DrawCardAnimation, 'startedAt'> | null {
  return detectDrawCardAnimation(previous, next, localPlayerId, hiddenHands)
}

export function penaltyDrawAnimationDurationMsForTest(amount: number): number {
  return penaltyDrawAnimationDurationMs(amount)
}

export function detectPenaltyDrawAnimationForTest(previous: GameState | null, next: GameState, localPlayerId?: string): Omit<PenaltyDrawAnimation, 'startedAt'> | null {
  return detectPenaltyDrawAnimation(previous, next, localPlayerId)
}

export function roundStartDealAnimationDurationMsForTest(playerCount: number, startingHandSize: number): number {
  return roundStartDealAnimationDurationMs(playerCount, startingHandSize)
}

export function canUseRoundStartDealAnimationForTest(state: GameState): boolean {
  return canUseRoundStartDealAnimation(state)
}

function playCardAnimationDurationMs(speed: AnimationSpeed): number {
  return speed === 'fast' ? 230 : speed === 'slow' ? 420 : 320
}

function drawCardAnimationDurationMs(speed: AnimationSpeed): number {
  return speed === 'fast' ? 190 : speed === 'slow' ? 340 : 260
}

function penaltyDrawAnimationDurationMs(amount: number): number {
  return Math.min(900, 260 + (amount - 1) * 70)
}

function roundStartDealAnimationDurationMs(playerCount: number, startingHandSize: number): number {
  return Math.min(1100, 450 + playerCount * startingHandSize * 18)
}

function customRoundStartAnimationDurationMs(speed: AnimationSpeed): number {
  return speed === 'fast' ? 700 : speed === 'slow' ? 1200 : 950
}

function memoryGridStartAnimationDurationMs(cardCount: number): number {
  return Math.min(1200, 420 + cardCount * 14)
}

function memoryRevealAnimationDurationMs(): number {
  return 280
}

function memoryCollectionAnimationDurationMs(cardCount: number): number {
  return Math.min(700, 280 + Math.max(0, cardCount - 1) * 90)
}

function cardFlourishAnimationDurationMs(speed: AnimationSpeed): number {
  return speed === 'fast' ? 900 : speed === 'slow' ? 1300 : 1100
}

const cardFlourishStyles: ResolvedCardFlourishStyle[] = ['fan', 'cut', 'faro', 'pirouette', 'spring', 'waterfall', 'dribble', 'oneHanded']
let randomFlourishBag: ResolvedCardFlourishStyle[] = []
let lastResolvedRandomFlourishStyle: ResolvedCardFlourishStyle | null = null

function refillRandomFlourishBag(previousStyle: ResolvedCardFlourishStyle | null) {
  randomFlourishBag = [...cardFlourishStyles]
  for (let index = randomFlourishBag.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[randomFlourishBag[index], randomFlourishBag[swapIndex]] = [randomFlourishBag[swapIndex], randomFlourishBag[index]]
  }
  if (previousStyle && randomFlourishBag.at(-1) === previousStyle) {
    ;[randomFlourishBag[0], randomFlourishBag[randomFlourishBag.length - 1]] = [randomFlourishBag[randomFlourishBag.length - 1], randomFlourishBag[0]]
  }
}

function resolveCardFlourishStyle(style: CardFlourishStyle, mountedPreviousStyle: ResolvedCardFlourishStyle | null): ResolvedCardFlourishStyle {
  if (style !== 'random') return style
  const previousStyle = mountedPreviousStyle ?? lastResolvedRandomFlourishStyle
  if (randomFlourishBag.length === 0) refillRandomFlourishBag(previousStyle)
  let candidate = randomFlourishBag.pop() ?? cardFlourishStyles[0]
  if (candidate === previousStyle && randomFlourishBag.length > 0) {
    const replacement = randomFlourishBag.pop() ?? cardFlourishStyles[0]
    randomFlourishBag.unshift(candidate)
    candidate = replacement
  }
  lastResolvedRandomFlourishStyle = candidate
  return candidate
}

const customRoundStartDealGames = new Set<GameVariant>([
  'triplePlay',
  'dice',
  'dos',
  'phase10',
  'skipBo',
  'zero',
  'cabo',
  'skyjo',
  'mahjong',
  'guoUnoMahjong',
  'guoMemory',
  'guoMemoryAction',
  'guoTripleMemory',
  'guoTripleMemoryAction',
])

const customRoundStartAnimationGames = new Set<GameVariant>([
  'triplePlay',
  'dice',
  'dos',
  'phase10',
  'skipBo',
  'zero',
  'cabo',
  'skyjo',
])

function canUseRoundStartDealAnimation(state: GameState): boolean {
  if (customRoundStartDealGames.has(state.config.game)) return false
  if (state.players.length < 2) return false
  if (state.players.some((player) => player.hand.length <= 0)) return false
  return true
}

function canUseCustomRoundStartAnimation(state: GameState): boolean {
  return customRoundStartAnimationGames.has(state.config.game) && state.players.length >= 2
}

function isGuoMemoryAnimationGame(game: GameVariant): boolean {
  return game === 'guoMemory' || game === 'guoMemoryAction' || game === 'guoTripleMemory' || game === 'guoTripleMemoryAction'
}

function detectRoundStartDealAnimation(previous: GameState | null, next: GameState, localPlayerId?: string): Omit<RoundStartDealAnimation, 'startedAt'> | null {
  if (!next.config.dealAnimation || !canUseRoundStartDealAnimation(next)) return null
  if (!isNewVisibleRound(previous, next)) return null
  const displayPlayers = getDisplayPlayers(next, localPlayerId)
  const startingHandSize = Math.max(...displayPlayers.map((player) => player.hand.length))
  return {
    key: roundStartAnimationKey(next, displayPlayers),
    playerCount: displayPlayers.length,
    startingHandSize,
  }
}

function detectCustomRoundStartAnimation(previous: GameState | null, next: GameState, localPlayerId?: string): Omit<CustomRoundStartAnimation, 'startedAt'> | null {
  if (!next.config.dealAnimation || !canUseCustomRoundStartAnimation(next) || !isNewVisibleRound(previous, next)) return null
  const displayPlayers = getDisplayPlayers(next, localPlayerId)
  return {
    key: `${roundStartAnimationKey(next, displayPlayers)}:custom`,
    game: next.config.game,
    playerCount: displayPlayers.length,
  }
}

function detectMemoryGridStartAnimation(previous: GameState | null, next: GameState, localPlayerId?: string): Omit<MemoryGridStartAnimation, 'startedAt'> | null {
  const board = next.memoryBoard
  if (!next.config.dealAnimation || !board || !isGuoMemoryAnimationGame(next.config.game) || !isNewVisibleRound(previous, next)) return null
  return {
    key: `${roundStartAnimationKey(next, getDisplayPlayers(next, localPlayerId))}:memory-grid:${board.rows}x${board.columns}`,
    rows: board.rows,
    columns: board.columns,
    cardCount: board.slots.length,
  }
}

function detectMemoryRevealAnimation(previous: GameState | null, next: GameState): Omit<MemoryRevealAnimation, 'startedAt'> | null {
  if (!previous?.memoryBoard || !next.memoryBoard || !isGuoMemoryAnimationGame(next.config.game)) return null
  const slotIndex = next.memoryBoard.slots.findIndex((slot, index) => slot.faceUp && !slot.collectedByPlayerId && !previous.memoryBoard?.slots[index]?.faceUp)
  const slot = slotIndex >= 0 ? next.memoryBoard.slots[slotIndex] : null
  if (!slot) return null
  return { key: `${next.currentRound}:${slot.card.id}:memory-reveal`, slotIndex, card: slot.card }
}

function detectMemoryCollectionAnimation(previous: GameState | null, next: GameState, localPlayerId?: string): Omit<MemoryCollectionAnimation, 'startedAt'> | null {
  if (!previous?.memoryBoard || !next.memoryBoard || !isGuoMemoryAnimationGame(next.config.game)) return null
  const cards = next.memoryBoard.slots.flatMap((slot, slotIndex) => {
    const previousSlot = previous.memoryBoard?.slots[slotIndex]
    return slot.collectedByPlayerId && !previousSlot?.collectedByPlayerId ? [{ slotIndex, card: slot.card, playerId: slot.collectedByPlayerId }] : []
  })
  const playerId = cards[0]?.playerId
  if (!playerId) return null
  const displayPlayers = getDisplayPlayers(next, localPlayerId)
  const playerIndex = displayPlayers.findIndex((player) => player.id === playerId)
  if (playerIndex < 0) return null
  return {
    key: `${next.currentRound}:${playerId}:${cards.map((entry) => entry.card.id).join('|')}:memory-collection`,
    playerId,
    playerIndex,
    cards: cards.map(({ slotIndex, card }) => ({ slotIndex, card })),
  }
}

function detectRoundStartFlourishAnimation(previous: GameState | null, next: GameState, localPlayerId?: string): Omit<RoundStartFlourishAnimation, 'startedAt' | 'style'> | null {
  if (!next.config.roundStartFlourish || !canUseRoundStartDealAnimation(next) || !isNewVisibleRound(previous, next)) return null
  return { key: roundStartAnimationKey(next, getDisplayPlayers(next, localPlayerId)) }
}

function isNewVisibleRound(previous: GameState | null, next: GameState): boolean {
  const isNewVisibleRound =
    !previous ||
    previous.currentRound !== next.currentRound ||
    previous.config.game !== next.config.game ||
    previous.config.mode !== next.config.mode ||
    Boolean(previous.winnerId && !next.winnerId)
  return isNewVisibleRound
}

function roundStartAnimationKey(state: GameState, displayPlayers: Player[]): string {
  return `${state.config.game}:${state.config.mode}:${state.currentRound}:${displayPlayers.map((player) => `${player.id}-${player.hand.length}`).join('|')}`
}

function detectPlayCardAnimation(previous: GameState | null, next: GameState, localPlayerId?: string, hiddenHands = false): Omit<PlayCardAnimation, 'startedAt'> | null {
  if (!previous || next.discardPile.length <= previous.discardPile.length) return null
  const card = topCard(next)
  const previousTop = previous.discardPile.at(-1)
  if (!card || previousTop?.id === card.id) return null
  const sourcePlayer = previous.players.find((player) => player.hand.some((entry) => entry.id === card.id))
  if (!sourcePlayer) return null
  const currentSource = next.players.find((player) => player.id === sourcePlayer.id)
  if (currentSource?.hand.some((entry) => entry.id === card.id)) return null
  const displayPlayers = getDisplayPlayers(previous, localPlayerId)
  const sourcePlayerIndex = displayPlayers.findIndex((player) => player.id === sourcePlayer.id)
  if (sourcePlayerIndex < 0) return null
  const sourceCardIndex = sourcePlayer.hand.findIndex((entry) => entry.id === card.id)
  const sourceFaceUp = isAnimationSourceFaceUp(previous, sourcePlayer.id, sourcePlayerIndex, localPlayerId, hiddenHands)
  return {
    key: `${next.currentRound}:${card.id}:${next.discardPile.length}`,
    card,
    sourcePlayerId: sourcePlayer.id,
    sourcePlayerIndex,
    sourceCardIndex,
    sourceHandSize: sourcePlayer.hand.length,
    sourceFaceUp,
  }
}

function detectPenaltyDrawAnimation(previous: GameState | null, next: GameState, localPlayerId?: string): Omit<PenaltyDrawAnimation, 'startedAt'> | null {
  if (!previous || previous.drawPile.length <= next.drawPile.length) return null
  const previousDrawIds = new Set(previous.drawPile.map((card) => card.id))
  const displayPlayers = getDisplayPlayers(next, localPlayerId)
  const recipients: PenaltyDrawRecipient[] = []
  let totalAmount = 0

  for (const nextPlayer of next.players) {
    const previousPlayer = previous.players.find((candidate) => candidate.id === nextPlayer.id)
    if (!previousPlayer) continue
    const previousHandIds = new Set(previousPlayer.hand.map((card) => card.id))
    const gainedFromDraw = nextPlayer.hand.filter((card) => !previousHandIds.has(card.id) && previousDrawIds.has(card.id))
    if (gainedFromDraw.length === 0) continue
    const playerIndex = displayPlayers.findIndex((player) => player.id === nextPlayer.id)
    if (playerIndex < 0) continue
    totalAmount += gainedFromDraw.length
    recipients.push({
      playerId: nextPlayer.id,
      playerIndex,
      amount: gainedFromDraw.length,
      handSizeAfter: nextPlayer.hand.length,
      cardIds: gainedFromDraw.map((card) => card.id),
    })
  }

  if (totalAmount < 2 || recipients.length === 0) return null
  return {
    key: `${next.currentRound}:${next.drawPile.length}:${recipients.map((recipient) => `${recipient.playerId}-${recipient.amount}`).join('|')}`,
    recipients,
    totalAmount,
  }
}

function detectDrawCardAnimation(previous: GameState | null, next: GameState, localPlayerId?: string, hiddenHands = false): Omit<DrawCardAnimation, 'startedAt'> | null {
  if (!previous || previous.drawPile.length !== next.drawPile.length + 1) return null
  if (next.discardPile.length > previous.discardPile.length) return null
  const gained: Array<{ player: Player; card: Card; previousHandSize: number }> = []
  for (const nextPlayer of next.players) {
    const previousPlayer = previous.players.find((candidate) => candidate.id === nextPlayer.id)
    if (!previousPlayer) continue
    const previousIds = new Set(previousPlayer.hand.map((card) => card.id))
    const newCards = nextPlayer.hand.filter((card) => !previousIds.has(card.id))
    if (newCards.length > 1) return null
    if (newCards.length === 1) {
      gained.push({ player: nextPlayer, card: newCards[0], previousHandSize: previousPlayer.hand.length })
    }
  }
  if (gained.length !== 1) return null
  const entry = gained[0]
  if (!previous.drawPile.some((card) => card.id === entry.card.id)) return null
  const displayPlayers = getDisplayPlayers(next, localPlayerId)
  const targetPlayerIndex = displayPlayers.findIndex((player) => player.id === entry.player.id)
  if (targetPlayerIndex < 0) return null
  const targetFaceUp = isAnimationTargetFaceUp(next, entry.player.id, targetPlayerIndex, localPlayerId, hiddenHands)
  return {
    key: `${next.currentRound}:${entry.card.id}:${next.drawPile.length}`,
    card: entry.card,
    targetPlayerId: entry.player.id,
    targetPlayerIndex,
    targetHandSize: entry.previousHandSize + 1,
    targetFaceUp,
  }
}

function isAnimationSourceFaceUp(state: GameState, playerId: string, sourcePlayerIndex: number, localPlayerId?: string, hiddenHands = false): boolean {
  if (hiddenHands) return false
  const player = state.players.find((candidate) => candidate.id === playerId)
  if (!player || player.hand.some((card) => card.id.startsWith('hidden-'))) return false
  if (state.config.mode === 'single') return sourcePlayerIndex === 0 && player.type === 'human'
  if (state.config.mode === 'hotseat') return activePlayer(state).id === playerId
  if (state.config.mode === 'spectacular') return activePlayer(state).id === playerId
  if (state.config.mode === 'wifi') return playerId === localPlayerId
  return false
}

function isAnimationTargetFaceUp(state: GameState, playerId: string, targetPlayerIndex: number, localPlayerId?: string, hiddenHands = false): boolean {
  if (hiddenHands) return false
  const player = state.players.find((candidate) => candidate.id === playerId)
  if (!player) return false
  if (state.config.mode === 'single') return targetPlayerIndex === 0 && player.type === 'human'
  if (state.config.mode === 'hotseat') return activePlayer(state).id === playerId
  if (state.config.mode === 'spectacular') return activePlayer(state).id === playerId
  if (state.config.mode === 'wifi') return playerId === localPlayerId
  return false
}

function drawPlayCardAnimation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  animation: PlayCardAnimation,
  ageMs: number,
  mobileInput: boolean,
) {
  const layout = getTableLayout(width, height)
  const duration = playCardAnimationDurationMs(state.config.animationSpeed)
  const progress = Math.min(1, Math.max(0, ageMs / duration))
  const eased = easeOutCubic(progress)
  const from = playCardSourceRect(width, height, state, layout, animation, mobileInput)
  const to = discardPileRect(width, height, state, layout)
  const fromCx = from.x + from.w / 2
  const fromCy = from.y + from.h / 2
  const toCx = to.x + to.w / 2
  const toCy = to.y + to.h / 2
  const lift = Math.max(22, 42 * layout.scale)
  const controlX = (fromCx + toCx) / 2
  const controlY = Math.min(fromCy, toCy) - lift
  const x = quadraticAt(fromCx, controlX, toCx, eased)
  const y = quadraticAt(fromCy, controlY, toCy, eased)
  const baseW = from.w + (to.w - from.w) * eased
  const baseH = from.h + (to.h - from.h) * eased
  const scale = 1 + Math.sin(progress * Math.PI) * (mobileInput ? 0.045 : 0.075)
  const cardW = baseW * scale
  const cardH = baseH * scale
  const drawX = x - cardW / 2
  const drawY = y - cardH / 2
  const revealFace = animation.sourceFaceUp || progress >= 0.72

  ctx.save()
  ctx.globalAlpha = Math.min(1, 0.35 + progress * 1.2)
  if (!revealFace || animation.card.liarFaceDown) {
    const label = animation.card.liarFaceDown && animation.card.liarClaim ? animation.card.liarClaim.label : ''
    drawCardBack(ctx, drawX, drawY, cardW, cardH, state.config.deckTheme, label)
  } else {
    drawCard(ctx, animation.card, drawX, drawY, cardW, cardH, true, language, state.config.game)
  }
  ctx.restore()

  if (progress > 0.82 && isPulseCard(animation.card)) {
    const pulseProgress = (progress - 0.82) / 0.18
    ctx.save()
    ctx.globalAlpha = Math.max(0, 0.35 * (1 - pulseProgress))
    ctx.strokeStyle = animation.card.color === 'wild' ? '#f7dd68' : colorMap[animation.card.color]
    ctx.lineWidth = Math.max(2, 4 * layout.scale)
    ctx.beginPath()
    ctx.ellipse(toCx, toCy, to.w * (0.55 + pulseProgress * 0.28), to.h * (0.42 + pulseProgress * 0.2), 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

function drawDrawCardAnimation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  animation: DrawCardAnimation,
  ageMs: number,
  mobileInput: boolean,
) {
  const layout = getTableLayout(width, height)
  const duration = drawCardAnimationDurationMs(state.config.animationSpeed)
  const progress = Math.min(1, Math.max(0, ageMs / duration))
  const eased = easeOutCubic(progress)
  const from = drawPileRect(width, height, state, layout)
  const to = drawCardTargetRect(width, height, state, layout, animation, mobileInput)
  if (animation.targetFaceUp && progress < 0.98) {
    coverDrawAnimationTarget(ctx, to, state.config.tableTheme, layout)
  }
  const fromCx = from.x + from.w / 2
  const fromCy = from.y + from.h / 2
  const toCx = to.x + to.w / 2
  const toCy = to.y + to.h / 2
  const lift = Math.max(14, 28 * layout.scale)
  const controlX = (fromCx + toCx) / 2
  const controlY = Math.min(fromCy, toCy) - lift
  const x = quadraticAt(fromCx, controlX, toCx, eased)
  const y = quadraticAt(fromCy, controlY, toCy, eased)
  const baseW = from.w + (to.w - from.w) * eased
  const baseH = from.h + (to.h - from.h) * eased
  const cardW = baseW * (1 + Math.sin(progress * Math.PI) * 0.045)
  const cardH = baseH * (1 + Math.sin(progress * Math.PI) * 0.045)
  const drawX = x - cardW / 2
  const drawY = y - cardH / 2
  const revealFace = animation.targetFaceUp && progress >= 0.98

  ctx.save()
  ctx.globalAlpha = Math.min(1, 0.4 + progress * 1.15)
  if (revealFace) {
    drawCard(ctx, animation.card, drawX, drawY, cardW, cardH, true, language, state.config.game)
  } else {
    drawCardBack(ctx, drawX, drawY, cardW, cardH, state.config.deckTheme)
  }
  ctx.restore()

  if (progress > 0.86 && animation.targetFaceUp && animation.card.id === state.drawnCardIdThisTurn) {
    const pulseProgress = (progress - 0.86) / 0.14
    ctx.save()
    ctx.globalAlpha = Math.max(0, 0.28 * (1 - pulseProgress))
    ctx.strokeStyle = '#f7dd68'
    ctx.lineWidth = Math.max(2, 4 * layout.scale)
    roundedRect(ctx, to.x - 4 * layout.scale, to.y - 4 * layout.scale, to.w + 8 * layout.scale, to.h + 8 * layout.scale, Math.max(7, to.w * 0.14))
    ctx.stroke()
    ctx.restore()
  }
}

function coverDrawAnimationTarget(
  ctx: CanvasRenderingContext2D,
  target: { x: number; y: number; w: number; h: number },
  tableTheme: TableTheme,
  layout: TableLayout,
) {
  const pad = Math.max(3, 4 * layout.scale)
  drawOpaqueEmptyCardPlaceholder(ctx, target.x - pad, target.y - pad, target.w + pad * 2, target.h + pad * 2, tableTheme, layout)
}

function drawOpaqueEmptyCardPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tableTheme: TableTheme,
  layout: TableLayout,
) {
  const palette = tablePalettes[tableTheme]
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)'
  ctx.shadowBlur = Math.max(6, 9 * layout.scale)
  ctx.shadowOffsetY = Math.max(2, 4 * layout.scale)
  ctx.fillStyle = palette.mid
  roundedRect(ctx, x, y, w, h, Math.max(7, w * 0.13))
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.setLineDash([Math.max(5, 8 * layout.scale), Math.max(4, 6 * layout.scale)])
  ctx.strokeStyle = 'rgba(248, 241, 208, 0.7)'
  ctx.lineWidth = Math.max(2, 3 * layout.scale)
  roundedRect(ctx, x, y, w, h, Math.max(7, w * 0.13))
  ctx.stroke()
  ctx.restore()
}

function drawPenaltyDrawAnimation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  animation: PenaltyDrawAnimation,
  ageMs: number,
  mobileInput: boolean,
) {
  const layout = getTableLayout(width, height)
  const from = drawPileRect(width, height, state, layout)
  let streamIndex = 0

  for (const recipient of animation.recipients) {
    const target = penaltyDrawTargetRect(width, height, state, layout, recipient, mobileInput)
    const pulse = Math.sin(Math.min(1, ageMs / penaltyDrawAnimationDurationMs(animation.totalAmount)) * Math.PI)
    if (pulse > 0.02) {
      ctx.save()
      ctx.globalAlpha = 0.22 * pulse
      ctx.fillStyle = '#f7dd68'
      roundedRect(ctx, target.x - 8 * layout.scale, target.y - 8 * layout.scale, target.w + 16 * layout.scale, target.h + 16 * layout.scale, 14)
      ctx.fill()
      ctx.restore()
    }

    const visibleCards = Math.min(6, recipient.amount)
    for (let index = 0; index < visibleCards; index += 1) {
      const delay = streamIndex * 70
      const progress = Math.min(1, Math.max(0, (ageMs - delay) / 260))
      if (progress <= 0) {
        streamIndex += 1
        continue
      }
      const eased = easeOutCubic(progress)
      const jitter = (index - (visibleCards - 1) / 2) * Math.max(2, 4 * layout.scale)
      const fromCx = from.x + from.w / 2 + jitter
      const fromCy = from.y + from.h / 2
      const toCx = target.x + target.w / 2 + jitter
      const toCy = target.y + target.h / 2 + Math.min(index, 4) * Math.max(1.5, 2.5 * layout.scale)
      const controlX = (fromCx + toCx) / 2
      const controlY = Math.min(fromCy, toCy) - Math.max(16, 34 * layout.scale)
      const x = quadraticAt(fromCx, controlX, toCx, eased)
      const y = quadraticAt(fromCy, controlY, toCy, eased)
      const cardW = (from.w + (target.w - from.w) * eased) * 0.92
      const cardH = (from.h + (target.h - from.h) * eased) * 0.92
      ctx.save()
      ctx.globalAlpha = Math.min(1, 0.35 + progress)
      drawCardBack(ctx, x - cardW / 2, y - cardH / 2, cardW, cardH, state.config.deckTheme)
      ctx.restore()
      streamIndex += 1
    }
    if (recipient.amount > visibleCards) {
      drawPenaltyBadge(ctx, target.x + target.w, target.y, recipient.amount, layout)
    }
  }
}

function drawRoundStartDealAnimation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  animation: RoundStartDealAnimation,
  ageMs: number,
  mobileInput: boolean,
) {
  const layout = getTableLayout(width, height)
  const displayPlayers = getDisplayPlayers(state).slice(0, Math.max(1, animation.playerCount))
  const from = drawPileRect(width, height, state, layout)
  const duration = roundStartDealAnimationDurationMs(animation.playerCount, animation.startingHandSize)
  const totalDeals = Math.max(1, animation.playerCount * animation.startingHandSize)
  const visibleWindow = Math.min(totalDeals, 28)
  const stepMs = totalDeals <= 1 ? 0 : Math.max(8, (duration - 190) / Math.max(1, totalDeals - 1))
  const baseW = layout.cardW * 0.56
  const baseH = layout.cardH * 0.56

  drawCardBack(ctx, from.x + (from.w - baseW) / 2, from.y + (from.h - baseH) / 2, baseW, baseH, state.config.deckTheme)

  ctx.save()
  for (let dealIndex = 0; dealIndex < totalDeals; dealIndex += 1) {
    const localAge = ageMs - dealIndex * stepMs
    if (localAge < 0 || localAge > 260 || dealIndex < totalDeals - visibleWindow) continue
    const playerIndex = dealIndex % Math.max(1, animation.playerCount)
    const cardIndex = Math.floor(dealIndex / Math.max(1, animation.playerCount))
    const player = displayPlayers[playerIndex]
    const handSize = Math.max(animation.startingHandSize, player?.hand.length ?? animation.startingHandSize)
    const to = roundStartDealTargetRect(width, height, state, layout, playerIndex, cardIndex, handSize, mobileInput)
    const progress = Math.min(1, localAge / 260)
    const eased = easeOutCubic(progress)
    const fromCx = from.x + from.w / 2
    const fromCy = from.y + from.h / 2
    const toCx = to.x + to.w / 2
    const toCy = to.y + to.h / 2
    const controlX = (fromCx + toCx) / 2
    const controlY = Math.min(fromCy, toCy) - Math.max(18, 34 * layout.scale)
    const x = quadraticAt(fromCx, controlX, toCx, eased)
    const y = quadraticAt(fromCy, controlY, toCy, eased)
    const cardW = baseW + (to.w - baseW) * eased
    const cardH = baseH + (to.h - baseH) * eased
    const drawX = x - cardW / 2
    const drawY = y - cardH / 2
    ctx.globalAlpha = Math.min(1, 0.25 + progress * 1.2)
    drawCardBack(ctx, drawX, drawY, cardW, cardH, state.config.deckTheme)
  }
  ctx.restore()
}

function drawRoundStartFlourishAnimation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  animation: RoundStartFlourishAnimation,
  ageMs: number,
) {
  const layout = getTableLayout(width, height)
  const progress = Math.min(1, Math.max(0, ageMs / cardFlourishAnimationDurationMs(state.config.animationSpeed)))
  const centerX = width / 2
  const centerY = height / 2
  const cardW = Math.max(26, layout.cardW * 0.62)
  const cardH = Math.max(38, layout.cardH * 0.62)
  const cardCount = Math.max(6, Math.min(9, Math.round(width / 105)))
  const premiumCardCount = Math.max(10, Math.min(14, Math.round(width / 78)))
  const motion = flourishInOut(progress)
  const premiumStyle = animation.style === 'spring' || animation.style === 'waterfall' || animation.style === 'dribble' || animation.style === 'oneHanded'

  ctx.save()
  ctx.fillStyle = `rgba(5, 12, 18, ${0.16 * motion})`
  ctx.fillRect(0, 0, width, height)
  if (premiumStyle) drawPremiumFlourishAccents(ctx, width, height, centerX, centerY, cardW, progress, motion, state.config.deckTheme)

  if (animation.style === 'fan') {
    const spread = Math.min(width * 0.36, cardW * cardCount * 0.48) * motion
    for (let index = 0; index < cardCount; index += 1) {
      const offset = index - (cardCount - 1) / 2
      const angle = offset * 0.16 * motion
      drawFlourishCardBack(ctx, centerX + offset * (spread / Math.max(1, cardCount - 1)), centerY + Math.abs(offset) * 7 * layout.scale * motion, cardW, cardH, angle, state.config.deckTheme)
    }
  } else if (animation.style === 'cut') {
    const split = Math.min(width * 0.18, cardW * 2.1) * motion
    for (let index = 0; index < cardCount; index += 1) {
      const upperHalf = index < cardCount / 2
      const stackOffset = (index % Math.ceil(cardCount / 2)) * Math.max(1.5, 2.8 * layout.scale)
      const direction = upperHalf ? -1 : 1
      const x = centerX + direction * split
      const y = centerY + stackOffset - cardH / 2 * 0.08
      const rotation = upperHalf ? -Math.PI * 2 * motion : Math.PI * 2 * motion
      drawFlourishCardBack(ctx, x, y, cardW, cardH, rotation, state.config.deckTheme)
    }
  } else if (animation.style === 'faro') {
    const split = Math.min(width * 0.16, cardW * 1.8) * (1 - motion)
    for (let index = 0; index < cardCount; index += 1) {
      const leftHalf = index % 2 === 0
      const stackIndex = Math.floor(index / 2)
      const x = centerX + (leftHalf ? -split : split)
      const y = centerY + (stackIndex - (cardCount - 1) / 4) * Math.max(4, 7 * layout.scale) * (1 - motion * 0.45)
      drawFlourishCardBack(ctx, x, y, cardW, cardH, (leftHalf ? -1 : 1) * 0.12 * (1 - motion), state.config.deckTheme)
    }
  } else if (animation.style === 'spring') {
    drawSpringFlourish(ctx, centerX, centerY, cardW, cardH, premiumCardCount, progress, motion, state.config.deckTheme)
  } else if (animation.style === 'waterfall') {
    drawWaterfallFlourish(ctx, centerX, centerY, cardW, cardH, premiumCardCount, progress, motion, state.config.deckTheme)
  } else if (animation.style === 'dribble') {
    drawDribbleFlourish(ctx, centerX, centerY, cardW, cardH, premiumCardCount, progress, motion, state.config.deckTheme)
  } else if (animation.style === 'oneHanded') {
    drawOneHandedFlourish(ctx, centerX, centerY, cardW, cardH, premiumCardCount, progress, motion, state.config.deckTheme)
  } else {
    const rotation = progress * Math.PI * 4
    const scale = 0.82 + Math.sin(progress * Math.PI) * 0.32
    drawFlourishCardBack(ctx, centerX, centerY, cardW * scale, cardH * scale, rotation, state.config.deckTheme)
    for (let index = 0; index < 3; index += 1) {
      const trail = (index + 1) / 4
      const trailProgress = Math.max(0, progress - trail * 0.11)
      const radius = cardW * (1.1 + trail * 0.7)
      drawFlourishCardBack(ctx, centerX + Math.cos(trailProgress * Math.PI * 4) * radius, centerY + Math.sin(trailProgress * Math.PI * 4) * radius * 0.32, cardW * 0.42, cardH * 0.42, trailProgress * Math.PI * 4, state.config.deckTheme, 0.28 * motion)
    }
  }
  drawFlourishTitle(ctx, width, centerX, centerY - cardH * 1.55, cardW, cardFlourishStyleName(language, animation.style), motion)
  ctx.restore()
}

function drawFlourishTitle(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  centerX: number,
  preferredY: number,
  cardW: number,
  title: string,
  motion: number,
) {
  ctx.save()
  ctx.globalAlpha = Math.min(1, motion * 2.4)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let fontSize = Math.max(17, Math.min(29, cardW * 0.42))
  ctx.font = `800 ${fontSize}px system-ui`
  while (fontSize > 14 && ctx.measureText(title).width > canvasWidth * 0.78) {
    fontSize -= 1
    ctx.font = `800 ${fontSize}px system-ui`
  }
  const y = Math.max(fontSize + 14, preferredY)
  ctx.lineWidth = Math.max(2, fontSize * 0.12)
  ctx.strokeStyle = 'rgba(25, 17, 4, 0.9)'
  ctx.shadowColor = 'rgba(244, 207, 103, 0.45)'
  ctx.shadowBlur = Math.max(8, fontSize * 0.55)
  ctx.strokeText(title, centerX, y)
  ctx.fillStyle = '#f4cf67'
  ctx.fillText(title, centerX, y)
  ctx.restore()
}

function drawPremiumFlourishAccents(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  cardW: number,
  progress: number,
  motion: number,
  deckTheme: DeckTheme,
) {
  const palette = deckPalettes[deckTheme]
  ctx.save()
  const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.38)
  glow.addColorStop(0, palette.accent)
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.globalAlpha = 0.12 * motion
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  ctx.globalAlpha = 0.42 * motion
  ctx.strokeStyle = palette.line
  ctx.lineWidth = Math.max(1.25, cardW * 0.025)
  ctx.setLineDash([cardW * 0.12, cardW * 0.18])
  ctx.lineDashOffset = -progress * cardW * 2.4
  ctx.beginPath()
  ctx.ellipse(centerX, centerY, cardW * 2.25, cardW * 0.82, 0, Math.PI * 0.1, Math.PI * 1.9)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = palette.border
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI * 0.25 + progress * Math.PI * 1.4
    const radius = cardW * (1.35 + (index % 3) * 0.34)
    const sparkle = Math.max(1.2, cardW * (index % 2 === 0 ? 0.035 : 0.022))
    ctx.globalAlpha = (0.28 + (index % 3) * 0.12) * motion
    ctx.beginPath()
    ctx.arc(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius * 0.42, sparkle, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawSpringFlourish(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cardW: number,
  cardH: number,
  cardCount: number,
  progress: number,
  motion: number,
  deckTheme: DeckTheme,
) {
  const oscillation = 1 + Math.sin(progress * Math.PI * 7) * 0.09 * (1 - progress)
  const tension = motion * oscillation
  const span = cardW * Math.min(5.4, cardCount * 0.48)
  for (let index = 0; index < cardCount; index += 1) {
    const normalized = cardCount <= 1 ? 0 : index / (cardCount - 1) * 2 - 1
    const x = centerX + normalized * span * 0.5 * tension
    const y = centerY - cardH * 0.28 * tension + normalized * normalized * cardH * 0.72 * tension
    const rotation = normalized * 0.5 * tension
    const scale = 1 + (1 - Math.abs(normalized)) * 0.08 * motion
    drawFlourishCardBack(ctx, x, y, cardW * scale, cardH * scale, rotation, deckTheme, Math.min(1, motion * 1.45))
  }
}

function drawWaterfallFlourish(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cardW: number,
  cardH: number,
  cardCount: number,
  progress: number,
  motion: number,
  deckTheme: DeckTheme,
) {
  const span = cardW * Math.min(5.2, cardCount * 0.42)
  for (let index = 0; index < cardCount; index += 1) {
    const stagger = index / Math.max(1, cardCount - 1)
    const fall = customIntroStageProgress(progress, stagger * 0.38, 0.64 + stagger * 0.3)
    const eased = easeOutCubic(fall)
    const x = quadraticAt(centerX - span * 0.42, centerX + span * 0.04, centerX + span * 0.36 + index * cardW * 0.018, eased)
    const y = quadraticAt(centerY - cardH * 0.5, centerY - cardH * 1.38, centerY + cardH * 0.34 + index * cardH * 0.012, eased)
    const rotation = -0.4 + eased * 0.55 + Math.sin(stagger * Math.PI) * 0.1
    drawFlourishCardBack(ctx, x, y, cardW, cardH, rotation, deckTheme, motion * Math.min(1, fall * 4))
  }
}

function drawDribbleFlourish(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cardW: number,
  cardH: number,
  cardCount: number,
  progress: number,
  motion: number,
  deckTheme: DeckTheme,
) {
  const packetGap = cardW * 0.72 * motion
  for (const direction of [-1, 1]) {
    for (let layer = 0; layer < 3; layer += 1) {
      drawFlourishCardBack(ctx, centerX + direction * packetGap, centerY - cardH * 0.46 - layer * cardH * 0.035, cardW, cardH, direction * 0.12 * motion, deckTheme, motion * (0.72 + layer * 0.1))
    }
  }

  for (let index = 0; index < cardCount; index += 1) {
    const stagger = index / Math.max(1, cardCount - 1)
    const drop = customIntroStageProgress(progress, 0.12 + stagger * 0.54, 0.48 + stagger * 0.46)
    const direction = index % 2 === 0 ? -1 : 1
    const bounce = Math.sin(drop * Math.PI) * cardW * 0.1
    const x = centerX + direction * packetGap * (1 - drop) + direction * bounce
    const y = centerY - cardH * 0.5 + drop * cardH * 0.88 + index * cardH * 0.012
    drawFlourishCardBack(ctx, x, y, cardW, cardH, direction * (0.12 - drop * 0.2), deckTheme, motion * Math.min(1, drop * 5))
  }
}

function drawOneHandedFlourish(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cardW: number,
  cardH: number,
  cardCount: number,
  progress: number,
  motion: number,
  deckTheme: DeckTheme,
) {
  const catchProgress = customIntroStageProgress(progress, 0.62, 0.94)
  const scissor = motion * (1 - catchProgress * 0.72)
  const packetSize = Math.ceil(cardCount / 2)
  for (const direction of [-1, 1]) {
    const packetX = centerX + direction * cardW * 0.92 * scissor
    const packetY = centerY + direction * cardH * 0.15 * scissor
    const packetRotation = direction * (0.16 + scissor * 0.62) + direction * progress * Math.PI * 0.35
    for (let layer = 0; layer < packetSize; layer += 1) {
      const depth = layer / Math.max(1, packetSize - 1)
      drawFlourishCardBack(ctx, packetX - direction * layer * cardW * 0.035, packetY + layer * cardH * 0.022, cardW, cardH, packetRotation - direction * depth * 0.08, deckTheme, motion * (0.62 + depth * 0.38))
    }
  }

  for (let index = 0; index < 3; index += 1) {
    const phase = Math.max(0, progress - index * 0.07)
    const radius = cardW * (0.62 + index * 0.2) * motion
    const angle = phase * Math.PI * 3.2 + index * Math.PI * 0.66
    drawFlourishCardBack(ctx, centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius * 0.38, cardW * 0.78, cardH * 0.78, angle + Math.PI * 0.18, deckTheme, motion * 0.78)
  }
}

function drawCustomRoundStartAnimation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  localPlayerId: string | undefined,
  hiddenHands: boolean,
  animation: CustomRoundStartAnimation,
  ageMs: number,
  mobileInput: boolean,
) {
  const layout = getTableLayout(width, height)
  const progress = Math.min(1, Math.max(0, ageMs / customRoundStartAnimationDurationMs(state.config.animationSpeed)))
  drawCustomIntroBackdrop(ctx, width, height, state.config.tableTheme, progress)

  if (animation.game === 'triplePlay') {
    drawCustomIntroDeal(ctx, width, height, state, animation.playerCount, progress, 0.04, 0.52, mobileInput)
    drawCustomIntroCenterPiles(ctx, width, height, state, 3, progress, 0.46)
    return
  }
  if (animation.game === 'dice') {
    drawCustomIntroDiceLine(ctx, width, height, layout, progress)
    return
  }
  if (animation.game === 'dos') {
    drawCustomIntroDeal(ctx, width, height, state, animation.playerCount, progress, 0.04, 0.5, mobileInput)
    drawCustomIntroCenterPiles(ctx, width, height, state, 2, progress, 0.45)
    return
  }
  if (animation.game === 'phase10') {
    drawCustomIntroDeal(ctx, width, height, state, animation.playerCount, progress, 0.04, 0.54, mobileInput)
    drawCustomIntroPhaseBadge(ctx, width, height, layout, activePlayer(state).phase10Phase ?? 1, progress)
    return
  }
  if (animation.game === 'skipBo') {
    drawCustomIntroSkipBo(ctx, width, height, state, progress, mobileInput)
    return
  }
  if (animation.game === 'zero') {
    drawCustomIntroGrid(ctx, width, height, state, language, localPlayerId, hiddenHands, 2, 3, progress, 0.08, 0.76, 2)
    return
  }
  if (animation.game === 'cabo') {
    drawCustomIntroGrid(ctx, width, height, state, language, localPlayerId, hiddenHands, 2, 2, progress, 0.08, 0.7, 2)
    return
  }
  if (animation.game === 'skyjo') {
    drawCustomIntroGrid(ctx, width, height, state, language, localPlayerId, hiddenHands, 3, 4, progress, 0.06, 0.72, 2)
  }
}

function drawMemoryGridStartAnimation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  localPlayerId: string | undefined,
  animation: MemoryGridStartAnimation,
  ageMs: number,
) {
  const board = state.memoryBoard
  if (!board) return
  const progress = Math.min(1, Math.max(0, ageMs / memoryGridStartAnimationDurationMs(animation.cardCount)))
  const layout = getTableLayout(width, height)
  const memoryLayout = memoryLayoutGeometry(width, height, layout, animation.rows, animation.columns, getDisplayPlayers(state, localPlayerId).length)
  const sourceX = width / 2
  const sourceY = height / 2
  drawCustomIntroBackdrop(ctx, width, height, state.config.tableTheme, progress)
  for (let index = 0; index < animation.cardCount; index += 1) {
    const slotProgress = customIntroStageProgress(progress, index / Math.max(1, animation.cardCount) * 0.62, 0.94)
    if (slotProgress <= 0) continue
    const rect = memorySlotRect(memoryLayout, board.columns, index)
    const eased = easeOutCubic(slotProgress)
    const targetX = rect.x + rect.w / 2
    const targetY = rect.y + rect.h / 2
    const x = quadraticAt(sourceX, (sourceX + targetX) / 2, targetX, eased)
    const y = quadraticAt(sourceY, Math.min(sourceY, targetY) - Math.max(16, rect.h * 0.24), targetY, eased)
    const cardW = rect.w * (0.52 + eased * 0.48)
    const cardH = rect.h * (0.52 + eased * 0.48)
    ctx.save()
    ctx.globalAlpha = Math.min(1, 0.26 + slotProgress)
    drawCardBack(ctx, x - cardW / 2, y - cardH / 2, cardW, cardH, state.config.deckTheme, 'UNO')
    ctx.restore()
  }
}

function drawMemoryRevealAnimation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  localPlayerId: string | undefined,
  animation: MemoryRevealAnimation,
  ageMs: number,
) {
  const board = state.memoryBoard
  if (!board) return
  const rect = memorySlotRectForAnimation(width, height, state, localPlayerId, animation.slotIndex)
  if (!rect) return
  const progress = Math.min(1, Math.max(0, ageMs / memoryRevealAnimationDurationMs()))
  const flipScale = Math.max(0.035, Math.abs(1 - progress * 2))
  const cardW = rect.w * flipScale
  const cardX = rect.x + (rect.w - cardW) / 2

  ctx.save()
  ctx.fillStyle = 'rgba(48, 28, 8, 0.94)'
  roundedRect(ctx, rect.x - 1, rect.y - 1, rect.w + 2, rect.h + 2, Math.max(4, rect.w * 0.12))
  ctx.fill()
  if (progress < 0.5) {
    drawCardBack(ctx, cardX, rect.y, cardW, rect.h, state.config.deckTheme, 'UNO')
  } else {
    drawCard(ctx, animation.card, cardX, rect.y, cardW, rect.h, true, language, state.config.game)
  }
  ctx.restore()
}

function drawMemoryCollectionAnimation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  localPlayerId: string | undefined,
  animation: MemoryCollectionAnimation,
  ageMs: number,
) {
  const board = state.memoryBoard
  if (!board) return
  const layout = getTableLayout(width, height)
  const memoryLayout = memoryLayoutGeometry(width, height, layout, board.rows, board.columns, getDisplayPlayers(state, localPlayerId).length)
  const target = memoryLayout.labelRects[animation.playerIndex] ?? memoryLayout.labelRects[0]
  const duration = memoryCollectionAnimationDurationMs(animation.cards.length)
  const progress = Math.min(1, Math.max(0, ageMs / duration))

  for (let index = 0; index < animation.cards.length; index += 1) {
    const entry = animation.cards[index]
    const localProgress = customIntroStageProgress(progress, index * 0.11, 0.82)
    if (localProgress <= 0) continue
    const start = memorySlotRect(memoryLayout, board.columns, entry.slotIndex)
    const eased = easeOutCubic(localProgress)
    const startX = start.x + start.w / 2
    const startY = start.y + start.h / 2
    const endX = target.x + target.w / 2
    const endY = target.y + target.h / 2
    const x = quadraticAt(startX, (startX + endX) / 2, endX, eased)
    const y = quadraticAt(startY, Math.min(startY, endY) - Math.max(24, start.h * 0.6), endY, eased)
    const cardW = start.w * (1 - eased * 0.54)
    const cardH = start.h * (1 - eased * 0.54)
    ctx.save()
    ctx.globalAlpha = Math.min(1, 0.45 + localProgress)
    drawCard(ctx, entry.card, x - cardW / 2, y - cardH / 2, cardW, cardH, true, language, state.config.game)
    ctx.restore()
  }
}

function memorySlotRectForAnimation(width: number, height: number, state: GameState, localPlayerId: string | undefined, slotIndex: number): { x: number; y: number; w: number; h: number } | null {
  const board = state.memoryBoard
  if (!board || slotIndex < 0 || slotIndex >= board.slots.length) return null
  const memoryLayout = memoryLayoutGeometry(width, height, getTableLayout(width, height), board.rows, board.columns, getDisplayPlayers(state, localPlayerId).length)
  return memorySlotRect(memoryLayout, board.columns, slotIndex)
}

function memorySlotRect(memoryLayout: MemoryLayoutGeometry, columns: number, slotIndex: number): { x: number; y: number; w: number; h: number } {
  const row = Math.floor(slotIndex / columns)
  const column = slotIndex % columns
  return {
    x: memoryLayout.boardRect.x + column * (memoryLayout.cardW + memoryLayout.gap),
    y: memoryLayout.boardRect.y + row * (memoryLayout.cardH + memoryLayout.gap),
    w: memoryLayout.cardW,
    h: memoryLayout.cardH,
  }
}

function drawCustomIntroBackdrop(ctx: CanvasRenderingContext2D, width: number, height: number, tableTheme: TableTheme, progress: number) {
  const palette = tablePalettes[tableTheme]
  ctx.save()
  ctx.fillStyle = palette.mid
  ctx.fillRect(0, 0, width, height)
  ctx.globalAlpha = 0.14 + Math.sin(progress * Math.PI) * 0.08
  ctx.strokeStyle = palette.ring
  ctx.lineWidth = Math.max(2, Math.min(width, height) * 0.006)
  for (let ring = 0; ring < 5; ring += 1) {
    ctx.beginPath()
    ctx.ellipse(width / 2, height / 2, width * (0.16 + ring * 0.1), height * (0.1 + ring * 0.07), 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawCustomIntroDeal(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  playerCount: number,
  progress: number,
  start: number,
  end: number,
  mobileInput: boolean,
) {
  const layout = getTableLayout(width, height)
  const handSize = Math.max(1, Math.max(...getDisplayPlayers(state).map((player) => player.hand.length || 3)))
  const cardsPerPlayer = Math.min(3, handSize)
  const totalCards = Math.max(1, playerCount * cardsPerPlayer)
  const sourceX = width / 2
  const sourceY = height / 2
  for (let dealIndex = 0; dealIndex < totalCards; dealIndex += 1) {
    const localProgress = customIntroStageProgress(progress, start + dealIndex * 0.025, end)
    if (localProgress <= 0) continue
    const playerIndex = dealIndex % playerCount
    const cardIndex = Math.floor(dealIndex / playerCount)
    const target = roundStartDealTargetRect(width, height, state, layout, playerIndex, cardIndex, handSize, mobileInput)
    const eased = easeOutCubic(localProgress)
    const targetX = target.x + target.w / 2
    const targetY = target.y + target.h / 2
    const x = quadraticAt(sourceX, (sourceX + targetX) / 2, targetX, eased)
    const y = quadraticAt(sourceY, Math.min(sourceY, targetY) - Math.max(18, 36 * layout.scale), targetY, eased)
    const cardW = layout.cardW * (0.42 + eased * 0.42)
    const cardH = layout.cardH * (0.42 + eased * 0.42)
    ctx.save()
    ctx.globalAlpha = Math.min(1, 0.3 + localProgress)
    drawCardBack(ctx, x - cardW / 2, y - cardH / 2, cardW, cardH, state.config.deckTheme)
    ctx.restore()
  }
}

function drawCustomIntroCenterPiles(ctx: CanvasRenderingContext2D, width: number, height: number, state: GameState, count: number, progress: number, start: number) {
  const layout = getTableLayout(width, height)
  const localProgress = customIntroStageProgress(progress, start, 0.92)
  if (localProgress <= 0) return
  const cardW = layout.cardW * 0.62
  const cardH = layout.cardH * 0.62
  const gap = Math.max(10, 16 * layout.scale)
  const totalWidth = count * cardW + (count - 1) * gap
  const firstX = width / 2 - totalWidth / 2 + cardW / 2
  const glow = Math.sin(Math.min(1, localProgress) * Math.PI)
  for (let index = 0; index < count; index += 1) {
    const delay = index * 0.09
    const pileProgress = customIntroStageProgress(localProgress, delay, 1)
    if (pileProgress <= 0) continue
    const x = firstX + index * (cardW + gap)
    const y = height / 2 + (1 - easeOutCubic(pileProgress)) * cardH * 0.7
    ctx.save()
    ctx.globalAlpha = 0.32 * glow * pileProgress
    ctx.fillStyle = state.config.game === 'triplePlay' ? '#f7dd68' : '#ffffff'
    ctx.beginPath()
    ctx.ellipse(x, height / 2, cardW * 0.72, cardH * 0.48, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    drawCardBack(ctx, x - cardW / 2, y - cardH / 2, cardW, cardH, state.config.deckTheme)
  }
}

function drawCustomIntroDiceLine(ctx: CanvasRenderingContext2D, width: number, height: number, layout: TableLayout, progress: number) {
  const dieSize = Math.max(30, Math.min(76, layout.cardW * 0.68))
  const count = 5
  const gap = Math.max(8, dieSize * 0.18)
  const totalWidth = count * dieSize + (count - 1) * gap
  const startX = width / 2 - totalWidth / 2 + dieSize / 2
  const rollProgress = customIntroStageProgress(progress, 0.06, 0.76)
  for (let index = 0; index < count; index += 1) {
    const settle = easeOutCubic(customIntroStageProgress(rollProgress, index * 0.05, 1))
    const settledX = startX + index * (dieSize + gap)
    const launchAngle = index * 1.8 + progress * Math.PI * 8
    const x = settledX + Math.cos(launchAngle) * (1 - settle) * width * 0.14
    const y = height / 2 + Math.sin(launchAngle * 1.3) * (1 - settle) * height * 0.17
    drawCustomIntroDie(ctx, x, y, dieSize, (index % 6) + 1, launchAngle * (1 - settle) * 0.8, settle)
  }
}

function drawCustomIntroDie(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number, face: number, rotation: number, opacity: number) {
  const pipsByFace: Record<number, Array<[number, number]>> = {
    1: [[0, 0]],
    2: [[-0.22, -0.22], [0.22, 0.22]],
    3: [[-0.24, -0.24], [0, 0], [0.24, 0.24]],
    4: [[-0.23, -0.23], [0.23, -0.23], [-0.23, 0.23], [0.23, 0.23]],
    5: [[-0.23, -0.23], [0.23, -0.23], [0, 0], [-0.23, 0.23], [0.23, 0.23]],
    6: [[-0.23, -0.25], [0.23, -0.25], [-0.23, 0], [0.23, 0], [-0.23, 0.25], [0.23, 0.25]],
  }
  ctx.save()
  ctx.globalAlpha = Math.min(1, 0.32 + opacity * 0.68)
  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)
  ctx.fillStyle = '#f7f4e8'
  roundedRect(ctx, -size / 2, -size / 2, size, size, size * 0.18)
  ctx.fill()
  ctx.fillStyle = '#26342d'
  for (const [x, y] of pipsByFace[face]) {
    ctx.beginPath()
    ctx.arc(x * size, y * size, size * 0.07, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawCustomIntroPhaseBadge(ctx: CanvasRenderingContext2D, width: number, height: number, layout: TableLayout, phase: number, progress: number) {
  const localProgress = customIntroStageProgress(progress, 0.52, 0.92)
  if (localProgress <= 0) return
  const badgeW = Math.max(132, 196 * layout.scale)
  const badgeH = Math.max(48, 66 * layout.scale)
  const y = height / 2 - badgeH / 2 + (1 - easeOutCubic(localProgress)) * badgeH * 1.4
  ctx.save()
  ctx.globalAlpha = localProgress
  ctx.fillStyle = '#f7dd68'
  roundedRect(ctx, width / 2 - badgeW / 2, y, badgeW, badgeH, 12)
  ctx.fill()
  ctx.fillStyle = '#1a2420'
  ctx.font = `900 ${Math.max(16, 24 * layout.scale)}px system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`PHASE ${phase}`, width / 2, y + badgeH / 2)
  ctx.restore()
}

function drawCustomIntroSkipBo(ctx: CanvasRenderingContext2D, width: number, height: number, state: GameState, progress: number, mobileInput: boolean) {
  const layout = getTableLayout(width, height)
  const cardW = layout.cardW * 0.5
  const cardH = layout.cardH * 0.5
  const pileProgress = customIntroStageProgress(progress, 0.08, 0.52)
  const stockX = width * 0.23
  const stockY = height * 0.48
  if (pileProgress > 0) drawCustomIntroPileStack(ctx, stockX, stockY, cardW, cardH, state.config.deckTheme, pileProgress)
  const buildProgress = customIntroStageProgress(progress, 0.42, 0.86)
  for (let index = 0; index < 4; index += 1) {
    const localProgress = customIntroStageProgress(buildProgress, index * 0.08, 1)
    if (localProgress > 0) drawCustomIntroPileStack(ctx, width * (0.43 + index * 0.12), height * 0.48, cardW, cardH, state.config.deckTheme, localProgress)
  }
  drawCustomIntroDeal(ctx, width, height, state, Math.min(4, state.players.length), progress, 0.16, 0.72, mobileInput)
}

function drawCustomIntroPileStack(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, width: number, height: number, deckTheme: DeckTheme, progress: number) {
  const eased = easeOutCubic(progress)
  for (let index = 0; index < 3; index += 1) {
    const offset = (2 - index) * Math.max(1.5, width * 0.035)
    ctx.save()
    ctx.globalAlpha = Math.min(1, 0.25 + eased)
    drawCardBack(ctx, centerX - width / 2 + offset, centerY - height / 2 + offset + (1 - eased) * height * 0.5, width, height, deckTheme)
    ctx.restore()
  }
}

function drawCustomIntroGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  localPlayerId: string | undefined,
  hiddenHands: boolean,
  rows: number,
  columns: number,
  progress: number,
  start: number,
  end: number,
  revealedCount: number,
) {
  const layout = getTableLayout(width, height)
  const localProgress = customIntroStageProgress(progress, start, end)
  const total = rows * columns
  const shown = Math.floor(localProgress * total)
  const gap = Math.max(5, 8 * layout.scale)
  const maxGridWidth = width * 0.68
  const cardW = Math.min(layout.cardW * 0.58, (maxGridWidth - (columns - 1) * gap) / columns)
  const cardH = cardW * (BASE_CARD_H / BASE_CARD_W)
  const gridW = columns * cardW + (columns - 1) * gap
  const gridH = rows * cardH + (rows - 1) * gap
  const startX = width / 2 - gridW / 2
  const startY = height / 2 - gridH / 2
  const viewerId = customIntroViewerId(state, localPlayerId, hiddenHands)
  const grid = state.players.find((player) => player.id === viewerId)?.zeroGrid ?? []
  for (let index = 0; index < shown; index += 1) {
    const row = Math.floor(index / columns)
    const column = index % columns
    const x = startX + column * (cardW + gap)
    const y = startY + row * (cardH + gap)
    const slot = grid[index]
    const canReveal = Boolean(slot?.card && (slot.faceUp || slot.knownByPlayerIds?.includes(viewerId ?? '')))
    const revealedBefore = grid.slice(0, index).filter((candidate) => candidate.card && (candidate.faceUp || candidate.knownByPlayerIds?.includes(viewerId ?? ''))).length
    const revealProgress = canReveal && revealedBefore < revealedCount ? customIntroStageProgress(progress, 0.7 + revealedBefore * 0.07, 0.94) : 0
    if (revealProgress > 0) {
      drawCustomIntroRevealCard(ctx, x, y, cardW, cardH, state.config.deckTheme, revealProgress, slot?.card ?? null, language, state.config.game)
    } else {
      drawCardBack(ctx, x, y + (1 - localProgress) * cardH * 0.22, cardW, cardH, state.config.deckTheme)
    }
  }
}

function customIntroViewerId(state: GameState, localPlayerId: string | undefined, hiddenHands: boolean): string | null {
  if (hiddenHands) return null
  if (state.config.mode === 'wifi') return localPlayerId ?? null
  if (state.config.mode === 'single') return state.players.find((player) => player.type === 'human')?.id ?? null
  return activePlayer(state).id
}

function drawCustomIntroRevealCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  deckTheme: DeckTheme,
  progress: number,
  card: Card | null,
  language: Language,
  game: GameState['config']['game'],
) {
  if (card) {
    ctx.save()
    ctx.globalAlpha = progress
    drawCard(ctx, card, x, y, width, height, true, language, game)
    ctx.restore()
    return
  }
  const deck = deckPalettes[deckTheme]
  ctx.save()
  ctx.globalAlpha = progress
  ctx.fillStyle = deck.border
  roundedRect(ctx, x, y, width, height, Math.max(4, width * 0.12))
  ctx.fill()
  ctx.fillStyle = '#f7f4e8'
  roundedRect(ctx, x + width * 0.08, y + height * 0.08, width * 0.84, height * 0.84, Math.max(3, width * 0.08))
  ctx.fill()
  ctx.strokeStyle = deck.accent
  ctx.lineWidth = Math.max(2, width * 0.06)
  ctx.beginPath()
  ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) * 0.18, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function customIntroStageProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0
  return Math.min(1, Math.max(0, (progress - start) / (end - start)))
}

function flourishInOut(progress: number): number {
  return Math.sin(Math.min(1, Math.max(0, progress)) * Math.PI)
}

function drawFlourishCardBack(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotation: number,
  deckTheme: DeckTheme,
  alpha = 1,
) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)
  drawCardBack(ctx, -width / 2, -height / 2, width, height, deckTheme)
  ctx.restore()
}

function drawPenaltyBadge(ctx: CanvasRenderingContext2D, x: number, y: number, amount: number, layout: TableLayout) {
  const badge = `+${amount}`
  const fontSize = Math.max(12, 17 * layout.scale)
  ctx.save()
  ctx.font = `900 ${fontSize}px system-ui`
  const width = Math.max(34, ctx.measureText(badge).width + 16 * layout.scale)
  const height = Math.max(26, 30 * layout.scale)
  ctx.fillStyle = 'rgba(226, 66, 66, 0.94)'
  roundedRect(ctx, x - width * 0.72, y - height * 0.35, width, height, 10)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(badge, x - width * 0.22, y - height * 0.35 + height / 2)
  ctx.restore()
}

function isPulseCard(card: Card): boolean {
  return card.color === 'wild' || card.kind !== 'number'
}

function playCardSourceRect(width: number, height: number, state: GameState, layout: TableLayout, animation: PlayCardAnimation, mobileInput: boolean): { x: number; y: number; w: number; h: number } {
  const playerCount = Math.min(4, Math.max(1, getDisplayPlayers(state).length))
  if (usesCompactMobileUnoLayout(state.config.game, width, height, playerCount, mobileInput)) {
    const geometry = triplePlayLayoutGeometry(width, height, layout, playerCount, animation.sourceHandSize, mobileInput)
    const seat = geometry.seats[Math.min(animation.sourcePlayerIndex, geometry.seats.length - 1)] ?? geometry.seats[0]
    if (animation.sourcePlayerIndex === 0 && animation.sourceFaceUp) {
      return humanHandCardRect(width, height, layout, state.config.game, animation.sourceHandSize, animation.sourceCardIndex, mobileInput)
    }
    return {
      x: seat.stackRect.x + seat.stackRect.w / 2 - layout.cardW * 0.31,
      y: seat.stackRect.y + seat.stackRect.h / 2 - layout.cardH * 0.31,
      w: layout.cardW * 0.62,
      h: layout.cardH * 0.62,
    }
  }

  if (animation.sourcePlayerIndex === 0 && animation.sourceFaceUp) {
    return humanHandCardRect(width, height, layout, state.config.game, animation.sourceHandSize, animation.sourceCardIndex, mobileInput)
  }

  const sideInset = Math.max(64, 112 * layout.scale)
  const topInset = Math.max(layout.cardH * 0.48, 108 * layout.scale)
  const bottomInset = Math.max(layout.cardH * 0.7, 96 * layout.scale)
  const positions = [
    { x: width / 2, y: height - bottomInset, align: 'bottom' as const },
    { x: width - sideInset, y: height / 2, align: 'right' as const },
    { x: width / 2, y: topInset, align: 'top' as const },
    { x: sideInset, y: height / 2, align: 'left' as const },
  ]
  const pos = positions[Math.min(animation.sourcePlayerIndex, positions.length - 1)] ?? positions[0]
  return {
    x: pos.x - layout.cardW * 0.31,
    y: pos.y - layout.cardH * 0.31,
    w: layout.cardW * 0.62,
    h: layout.cardH * 0.62,
  }
}

function humanHandCardRect(width: number, height: number, layout: TableLayout, game: GameState['config']['game'], handSize: number, cardIndex: number, mobileInput: boolean): { x: number; y: number; w: number; h: number } {
  const phoneSized = mobileInput || width <= 520 || height <= 620
  const compactUnoScale = usesCompactMobileUnoLayout(game, width, height, 4, mobileInput) ? compactPhoneHandScale(handSize, phoneSized) : 1
  const specialScale = game === 'phase10' && phoneSized ? 0.88 : game === 'challenge' && phoneSized ? 0.84 : 1
  const handScale = Math.min(specialScale, compactUnoScale)
  const cardW = layout.cardW * handScale
  const cardH = layout.cardH * handScale
  const sidePadding = phoneSized ? 26 : 56
  const maxSpread = Math.min(72 * layout.scale * handScale, Math.max(20 * layout.scale, (width - sidePadding) / Math.max(handSize, 1)))
  const total = (handSize - 1) * maxSpread + cardW
  const startX = width / 2 - total / 2
  const y = height - cardH - Math.max(8, 18 * layout.scale)
  return {
    x: startX + Math.max(0, cardIndex) * maxSpread,
    y,
    w: cardW,
    h: cardH,
  }
}

function discardPileRect(width: number, height: number, state: GameState, layout: TableLayout): { x: number; y: number; w: number; h: number } {
  const cx = width / 2
  const cy = height / 2
  const gap = Math.max(10, 18 * layout.scale)
  if (state.config.game === 'guoHiLo') {
    const hiLoSize = Math.max(36, 52 * layout.scale)
    const hiLoGap = Math.max(8, 12 * layout.scale)
    const totalCenterW = hiLoSize + hiLoGap + layout.cardW + gap + layout.cardW
    const startX = cx - totalCenterW / 2
    const drawX = startX + hiLoSize + hiLoGap
    return { x: drawX + layout.cardW + gap, y: cy - layout.cardH / 2, w: layout.cardW, h: layout.cardH }
  }
  return { x: cx + gap, y: cy - layout.cardH / 2, w: layout.cardW, h: layout.cardH }
}

function drawPileRect(width: number, height: number, state: GameState, layout: TableLayout): { x: number; y: number; w: number; h: number } {
  if (state.config.game === 'dos') {
    return dosLayoutGeometry(width, height, layout, state.dosCenterRow?.length ?? 2, state.players.length).drawRect
  }
  if (state.config.game === 'phase10') {
    return phase10LayoutGeometry(width, height, layout, state.players.length, activePlayer(state).hand.length).drawRect
  }
  const cx = width / 2
  const cy = height / 2
  const gap = Math.max(10, 18 * layout.scale)
  if (state.config.game === 'guoHiLo') {
    const hiLoSize = Math.max(36, 52 * layout.scale)
    const hiLoGap = Math.max(8, 12 * layout.scale)
    const totalCenterW = hiLoSize + hiLoGap + layout.cardW + gap + layout.cardW
    return { x: cx - totalCenterW / 2 + hiLoSize + hiLoGap, y: cy - layout.cardH / 2, w: layout.cardW, h: layout.cardH }
  }
  return { x: cx - layout.cardW - gap, y: cy - layout.cardH / 2, w: layout.cardW, h: layout.cardH }
}

function drawCardTargetRect(width: number, height: number, state: GameState, layout: TableLayout, animation: DrawCardAnimation, mobileInput: boolean): { x: number; y: number; w: number; h: number } {
  const playerCount = Math.min(4, Math.max(1, getDisplayPlayers(state).length))
  if (animation.targetPlayerIndex === 0 && animation.targetFaceUp) {
    const rect = humanHandCardRect(width, height, layout, state.config.game, animation.targetHandSize, animation.targetHandSize - 1, mobileInput)
    if (animation.card.id === state.drawnCardIdThisTurn && isPlayable(animation.card, state)) {
      return { ...rect, y: rect.y - 14 * layout.scale }
    }
    return rect
  }
  if (usesCompactMobileUnoLayout(state.config.game, width, height, playerCount, mobileInput)) {
    const geometry = triplePlayLayoutGeometry(width, height, layout, playerCount, animation.targetHandSize, mobileInput)
    const seat = geometry.seats[Math.min(animation.targetPlayerIndex, geometry.seats.length - 1)] ?? geometry.seats[0]
    return {
      x: seat.stackRect.x + seat.stackRect.w / 2 - layout.cardW * 0.31,
      y: seat.stackRect.y + seat.stackRect.h / 2 - layout.cardH * 0.31,
      w: layout.cardW * 0.62,
      h: layout.cardH * 0.62,
    }
  }
  const sideInset = Math.max(64, 112 * layout.scale)
  const topInset = Math.max(layout.cardH * 0.48, 108 * layout.scale)
  const bottomInset = Math.max(layout.cardH * 0.7, 96 * layout.scale)
  const positions = [
    { x: width / 2, y: height - bottomInset },
    { x: width - sideInset, y: height / 2 },
    { x: width / 2, y: topInset },
    { x: sideInset, y: height / 2 },
  ]
  const pos = positions[Math.min(animation.targetPlayerIndex, positions.length - 1)] ?? positions[0]
  return {
    x: pos.x - layout.cardW * 0.31,
    y: pos.y - layout.cardH * 0.31,
    w: layout.cardW * 0.62,
    h: layout.cardH * 0.62,
  }
}

function penaltyDrawTargetRect(width: number, height: number, state: GameState, layout: TableLayout, recipient: PenaltyDrawRecipient, mobileInput: boolean): { x: number; y: number; w: number; h: number } {
  return drawCardTargetRect(width, height, state, layout, {
    key: recipient.playerId,
    card: activePlayer(state).hand[0] ?? topCard(state),
    targetPlayerId: recipient.playerId,
    targetPlayerIndex: recipient.playerIndex,
    targetHandSize: recipient.handSizeAfter,
    targetFaceUp: false,
    startedAt: 0,
  }, mobileInput)
}

function roundStartDealTargetRect(
  width: number,
  height: number,
  state: GameState,
  layout: TableLayout,
  playerIndex: number,
  cardIndex: number,
  handSize: number,
  mobileInput: boolean,
): { x: number; y: number; w: number; h: number } {
  const playerCount = Math.min(4, Math.max(1, getDisplayPlayers(state).length))
  if (playerIndex === 0) {
    return humanHandCardRect(width, height, layout, state.config.game, handSize, Math.min(cardIndex, handSize - 1), mobileInput)
  }
  if (usesCompactMobileUnoLayout(state.config.game, width, height, playerCount, mobileInput)) {
    const geometry = triplePlayLayoutGeometry(width, height, layout, playerCount, handSize, mobileInput)
    const seat = geometry.seats[Math.min(playerIndex, geometry.seats.length - 1)] ?? geometry.seats[0]
    return {
      x: seat.stackRect.x + seat.stackRect.w / 2 - layout.cardW * 0.31,
      y: seat.stackRect.y + seat.stackRect.h / 2 - layout.cardH * 0.31,
      w: layout.cardW * 0.62,
      h: layout.cardH * 0.62,
    }
  }
  const sideInset = Math.max(64, 112 * layout.scale)
  const topInset = Math.max(layout.cardH * 0.48, 108 * layout.scale)
  const bottomInset = Math.max(layout.cardH * 0.7, 96 * layout.scale)
  const positions = [
    { x: width / 2, y: height - bottomInset },
    { x: width - sideInset, y: height / 2 },
    { x: width / 2, y: topInset },
    { x: sideInset, y: height / 2 },
  ]
  const pos = positions[Math.min(playerIndex, positions.length - 1)] ?? positions[0]
  return {
    x: pos.x - layout.cardW * 0.31,
    y: pos.y - layout.cardH * 0.31,
    w: layout.cardW * 0.62,
    h: layout.cardH * 0.62,
  }
}

function quadraticAt(start: number, control: number, end: number, progress: number): number {
  const inverse = 1 - progress
  return inverse * inverse * start + 2 * inverse * progress * control + progress * progress * end
}

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

function dosLayoutGeometry(width: number, height: number, layout: TableLayout, centerCardCount: number, playerCount: number): DosLayoutGeometry {
  const phoneSized = width <= 520 || height <= 620
  const margin = Math.max(8, 12 * layout.scale)
  const centerScale = phoneSized ? 0.72 : 0.9
  const centerCardW = layout.cardW * centerScale
  const centerCardH = layout.cardH * centerScale
  const centerGap = Math.max(6, 9 * layout.scale)
  const drawW = centerCardW
  const drawH = centerCardH
  const centerCount = Math.max(1, centerCardCount)
  const rowW = centerCount * centerCardW + Math.max(0, centerCount - 1) * centerGap
  const totalW = drawW + Math.max(12, 18 * layout.scale) + rowW
  const startX = Math.max(margin, Math.min(width - margin - totalW, width / 2 - totalW / 2))
  const centerY = phoneSized ? height * 0.43 - centerCardH / 2 : height / 2 - centerCardH / 2
  const drawRect = { x: startX, y: centerY, w: drawW, h: drawH }
  const centerRect = { x: startX + drawW + Math.max(12, 18 * layout.scale), y: centerY, w: rowW, h: centerCardH }
  const labelWidth = Math.max(126, 176 * layout.scale)
  const labelHeight = Math.max(32, 48 * layout.scale)
  const visibleOpponentCards = Math.min(5, 7)
  const compactCardW = layout.cardW * 0.34
  const compactCardH = layout.cardH * 0.34
  const compactSpread = Math.max(7, 10 * layout.scale)
  const compactStackW = compactCardW + Math.max(0, visibleOpponentCards - 1) * compactSpread
  const handCards = Math.max(1, playerCount ? 7 : 1)
  const handMaxSpread = Math.min(72 * layout.scale, Math.max(24 * layout.scale, (width - (phoneSized ? 34 : 56)) / handCards))
  const handW = (handCards - 1) * handMaxSpread + layout.cardW
  const handY = height - layout.cardH - Math.max(8, 18 * layout.scale)

  const labelRectFor = (x: number, y: number, align: DosSeatGeometry['align']) => {
    if (align !== 'bottom') {
      const compactW = Math.max(86, 118 * layout.scale)
      const compactH = Math.max(30, 38 * layout.scale)
      return { x: x - compactW / 2, y: y - compactH / 2, w: compactW, h: compactH }
    }
    const labelY = y - 112 * layout.scale
    const labelX = x
    const h = labelHeight
    return { x: labelX - labelWidth / 2, y: labelY - h / 2, w: labelWidth, h }
  }
  const stackRectFor = (x: number, y: number, align: DosSeatGeometry['align']) => {
    if (align === 'bottom') return { x: width / 2 - handW / 2, y: handY, w: handW, h: layout.cardH }
    const stackY = align === 'top' ? y - compactCardH - 28 * layout.scale : y + 24 * layout.scale
    return { x: x - compactStackW / 2, y: stackY, w: compactStackW, h: compactCardH }
  }
  const sideInset = phoneSized ? Math.max(36, 56 * layout.scale) : Math.max(64, 112 * layout.scale)
  const topInset = phoneSized ? Math.max(56, 72 * layout.scale) : Math.max(layout.cardH * 0.48, 108 * layout.scale)
  const bottomInset = Math.max(layout.cardH * 0.7, phoneSized ? 88 * layout.scale : 96 * layout.scale)
  const rawSeats = [
    { x: width / 2, y: height - bottomInset, align: 'bottom' as const },
    { x: width - sideInset, y: phoneSized ? height * 0.24 : height / 2, align: 'right' as const },
    { x: width / 2, y: topInset, align: 'top' as const },
    { x: sideInset, y: phoneSized ? height * 0.68 : height / 2, align: 'left' as const },
  ]
  return {
    drawRect,
    centerRect,
    seats: rawSeats.map((seat) => ({
      ...seat,
      labelRect: labelRectFor(seat.x, seat.y, seat.align),
      stackRect: stackRectFor(seat.x, seat.y, seat.align),
    })),
  }
}

function triplePlayLayoutGeometry(width: number, height: number, layout: TableLayout, playerCount: number, handSize: number, forcePhone = false): DosLayoutGeometry {
  return compactMobileUnoLayoutGeometry(width, height, layout, playerCount, handSize, forcePhone)
}

function compactMobileUnoLayoutGeometry(width: number, height: number, layout: TableLayout, playerCount: number, handSize: number, forcePhone = false): DosLayoutGeometry {
  const phoneSized = forcePhone || width <= 520 || height <= 620
  const centerCardScale = phoneSized ? 0.62 : 0.74
  const centerCardW = layout.cardW * centerCardScale
  const centerCardH = layout.cardH * centerCardScale
  const centerGap = Math.max(7, 12 * layout.scale)
  const drawGap = Math.max(12, 18 * layout.scale)
  const centerW = centerCardW + drawGap + centerCardW * 3 + centerGap * 2
  const centerX = Math.max(8, width / 2 - centerW / 2)
  const centerY = phoneSized ? height * 0.42 - centerCardH / 2 : height / 2 - centerCardH / 2
  const meterH = Math.max(30, 36 * layout.scale)
  const meterGap = Math.max(5, 7 * layout.scale)
  const centerRect = { x: centerX, y: centerY, w: centerW, h: centerCardH + meterGap + meterH }
  const drawRect = { x: centerX, y: centerY, w: centerCardW, h: centerCardH }

  const visibleOpponentCards = Math.min(5, Math.max(1, handSize))
  const compactCardW = layout.cardW * 0.34
  const compactCardH = layout.cardH * 0.34
  const compactSpread = Math.max(7, 10 * layout.scale)
  const compactStackW = compactCardW + Math.max(0, visibleOpponentCards - 1) * compactSpread
  const handCards = Math.max(1, handSize)
  const handScale = compactPhoneHandScale(handCards, phoneSized)
  const handCardW = layout.cardW * handScale
  const handCardH = layout.cardH * handScale
  const handW = (handCards - 1) * Math.min(72 * layout.scale * handScale, Math.max(20 * layout.scale, (width - (phoneSized ? 26 : 56)) / handCards)) + handCardW
  const handY = height - handCardH - Math.max(8, 18 * layout.scale)
  const fullLabelWidth = Math.max(126, 176 * layout.scale)
  const compactLabelWidth = Math.max(86, 118 * layout.scale)
  const compactLabelHeight = Math.max(30, 38 * layout.scale)

  const labelRectFor = (x: number, y: number, align: DosSeatGeometry['align']) => {
    if (align !== 'bottom' && phoneSized) {
      return { x: x - compactLabelWidth / 2, y: y - compactLabelHeight / 2, w: compactLabelWidth, h: compactLabelHeight }
    }
    const labelY = align === 'bottom' ? y - 112 * layout.scale : align === 'top' ? y + 63 * layout.scale : y - 128 * layout.scale
    const labelX = align === 'left' ? x + 132 * layout.scale : align === 'right' ? x - 132 * layout.scale : x
    const labelHeight = Math.max(32, (align === 'top' ? 40 : 48) * layout.scale)
    return { x: labelX - fullLabelWidth / 2, y: labelY - labelHeight / 2, w: fullLabelWidth, h: labelHeight }
  }
  const stackRectFor = (x: number, y: number, align: DosSeatGeometry['align']) => {
    if (align === 'bottom') return { x: width / 2 - handW / 2, y: handY, w: handW, h: handCardH }
    if (phoneSized) {
      const stackY = align === 'top' ? y - compactCardH - 30 * layout.scale : y + 24 * layout.scale
      return { x: x - compactStackW / 2, y: stackY, w: compactStackW, h: compactCardH }
    }
    const visible = Math.min(handSize, 8)
    const spread = 16 * layout.scale
    const stackCardW = layout.cardW * 0.62
    const stackCardH = layout.cardH * 0.62
    if (align === 'top') {
      const stackW = stackCardW + Math.max(0, visible - 1) * spread
      return { x: x - stackW / 2, y: y - stackCardH / 2, w: stackW, h: stackCardH }
    }
    const stackH = stackCardH + Math.max(0, visible - 1) * spread
    return { x: x - stackCardW / 2, y: y - stackH / 2, w: stackCardW, h: stackH }
  }

  const sideInset = phoneSized ? Math.max(compactLabelWidth / 2 + 8, 56 * layout.scale) : Math.max(64, 112 * layout.scale)
  const topInset = phoneSized ? Math.max(66, 84 * layout.scale) : Math.max(layout.cardH * 0.48, 108 * layout.scale)
  const bottomInset = Math.max(layout.cardH * 0.7, phoneSized ? 88 * layout.scale : 96 * layout.scale)
  const bottomHandTop = height - handCardH - Math.max(8, 18 * layout.scale)
  const leftSeatY = phoneSized ? Math.min(height * 0.68, bottomHandTop - compactLabelHeight / 2 - 12) : height / 2
  const rawSeats = [
    { x: width / 2, y: height - bottomInset, align: 'bottom' as const },
    { x: width - sideInset, y: phoneSized ? height * 0.24 : height / 2, align: 'right' as const },
    { x: width / 2, y: topInset, align: 'top' as const },
    { x: sideInset, y: leftSeatY, align: 'left' as const },
  ].slice(0, Math.min(4, Math.max(1, playerCount)))

  return {
    drawRect,
    centerRect,
    seats: rawSeats.map((seat) => ({
      ...seat,
      labelRect: labelRectFor(seat.x, seat.y, seat.align),
      stackRect: stackRectFor(seat.x, seat.y, seat.align),
    })),
  }
}

function compactPhoneHandScale(handSize: number, phoneSized: boolean): number {
  if (!phoneSized) return 1
  if (handSize >= 12) return 0.72
  if (handSize >= 10) return 0.78
  if (handSize >= 8) return 0.84
  if (handSize >= 7) return 0.9
  return 1
}

function phase10LayoutGeometry(width: number, height: number, layout: TableLayout, playerCount: number, handSize: number): DosLayoutGeometry {
  const phoneSized = width <= 520 || height <= 620
  const centerCardScale = phoneSized ? 0.72 : 0.9
  const centerCardW = layout.cardW * centerCardScale
  const centerCardH = layout.cardH * centerCardScale
  const centerGap = Math.max(12, 18 * layout.scale)
  const centerW = centerCardW * 2 + centerGap
  const centerX = width / 2 - centerW / 2
  const centerY = phoneSized ? height * 0.42 - centerCardH / 2 : height / 2 - centerCardH / 2
  const centerRect = { x: centerX, y: centerY, w: centerW, h: centerCardH }
  const drawRect = { x: centerX, y: centerY, w: centerCardW, h: centerCardH }
  const labelWidth = Math.max(126, 176 * layout.scale)
  const labelHeight = Math.max(32, 48 * layout.scale)
  const visibleOpponentCards = Math.min(5, Math.max(1, handSize))
  const compactCardW = layout.cardW * 0.34
  const compactCardH = layout.cardH * 0.34
  const compactSpread = Math.max(7, 10 * layout.scale)
  const compactStackW = compactCardW + Math.max(0, visibleOpponentCards - 1) * compactSpread
  const handCards = Math.max(1, handSize)
  const handScale = phoneSized ? 0.88 : 1
  const handCardW = layout.cardW * handScale
  const handCardH = layout.cardH * handScale
  const handSpread = Math.min(72 * layout.scale * handScale, Math.max(22 * layout.scale, (width - (phoneSized ? 34 : 56)) / handCards))
  const handW = (handCards - 1) * handSpread + handCardW
  const handY = height - handCardH - Math.max(8, 18 * layout.scale)

  const labelRectFor = (x: number, y: number, align: DosSeatGeometry['align']) => {
    if (align !== 'bottom') {
      const compactW = Math.max(86, 118 * layout.scale)
      const compactH = Math.max(30, 38 * layout.scale)
      return { x: x - compactW / 2, y: y - compactH / 2, w: compactW, h: compactH }
    }
    const labelY = y - 112 * layout.scale
    return { x: x - labelWidth / 2, y: labelY - labelHeight / 2, w: labelWidth, h: labelHeight }
  }
  const stackRectFor = (x: number, y: number, align: DosSeatGeometry['align']) => {
    if (align === 'bottom') return { x: width / 2 - handW / 2, y: handY, w: handW, h: handCardH }
    const stackY = align === 'top' ? y - compactCardH - 30 * layout.scale : y + 24 * layout.scale
    return { x: x - compactStackW / 2, y: stackY, w: compactStackW, h: compactCardH }
  }

  const sideInset = phoneSized ? Math.max(36, 56 * layout.scale) : Math.max(64, 112 * layout.scale)
  const topInset = phoneSized ? Math.max(56, 72 * layout.scale) : Math.max(layout.cardH * 0.48, 108 * layout.scale)
  const bottomInset = Math.max(layout.cardH * 0.7, phoneSized ? 88 * layout.scale : 96 * layout.scale)
  const rawSeats = [
    { x: width / 2, y: height - bottomInset, align: 'bottom' as const },
    { x: width - sideInset, y: phoneSized ? height * 0.22 : height / 2, align: 'right' as const },
    { x: width / 2, y: topInset, align: 'top' as const },
    { x: sideInset, y: phoneSized ? height * 0.69 : height / 2, align: 'left' as const },
  ].slice(0, Math.min(4, Math.max(1, playerCount)))

  return {
    drawRect,
    centerRect,
    seats: rawSeats.map((seat) => ({
      ...seat,
      labelRect: labelRectFor(seat.x, seat.y, seat.align),
      stackRect: stackRectFor(seat.x, seat.y, seat.align),
    })),
  }
}

function skyjoGridGeometry(width: number, height: number, layout: TableLayout): SkyjoGridSeat[] {
  const phoneSized = width <= 520 || height <= 620
  const margin = Math.max(8, 14 * layout.scale)
  const labelGap = Math.max(7, 10 * layout.scale)
  const centerX = width / 2
  const labelWidth = Math.max(126, 176 * layout.scale)
  const sideLabelXMin = labelWidth / 2 + margin
  const sideLabelXMax = width - labelWidth / 2 - margin

  const makeSeat = (
    align: SkyjoGridSeat['align'],
    gridCenterX: number,
    gridCenterY: number,
    cardScale: number,
  ): SkyjoGridSeat => {
    const cardW = layout.cardW * cardScale
    const cardH = layout.cardH * cardScale
    const gap = Math.max(4, (phoneSized ? 5 : 7) * layout.scale)
    const gridW = cardW * 4 + gap * 3
    const gridH = cardH * 3 + gap * 2
    const gridX = Math.max(margin, Math.min(width - margin - gridW, gridCenterX - gridW / 2))
    const gridY = Math.max(margin, Math.min(height - margin - gridH, gridCenterY - gridH / 2))
    const labelHeight = Math.max(32, (align === 'top' ? 40 : 48) * layout.scale)
    const desiredLabelX = gridX + gridW / 2
    const labelX = align === 'left' || align === 'right' ? Math.max(sideLabelXMin, Math.min(sideLabelXMax, desiredLabelX)) : desiredLabelX
    const labelY = gridY - labelGap - labelHeight / 2
    const labelAnchorX = align === 'left' ? labelX - 132 * layout.scale : align === 'right' ? labelX + 132 * layout.scale : labelX
    const labelAnchorY = align === 'bottom' ? labelY + 112 * layout.scale : align === 'top' ? labelY - 63 * layout.scale : labelY + 128 * layout.scale
    return {
      align,
      labelAnchorX,
      labelAnchorY,
      labelRect: { x: labelX - labelWidth / 2, y: labelY - labelHeight / 2, w: labelWidth, h: labelHeight },
      gridRect: { x: gridX, y: gridY, w: gridW, h: gridH },
      cardW,
      cardH,
      gap,
    }
  }

  const bottomScale = phoneSized ? 0.42 : 0.45
  const topScale = phoneSized ? 0.26 : 0.32
  const sideScale = phoneSized ? 0.23 : 0.3
  const bottomCardH = layout.cardH * bottomScale
  const bottomGap = Math.max(4, (phoneSized ? 5 : 7) * layout.scale)
  const bottomGridH = bottomCardH * 3 + bottomGap * 2
  const bottomY = height - margin - bottomGridH / 2
  const topCardH = layout.cardH * topScale
  const topGap = Math.max(4, (phoneSized ? 5 : 7) * layout.scale)
  const topLabelHeight = Math.max(32, 40 * layout.scale)
  const topGridH = topCardH * 3 + topGap * 2
  const topY = margin + topLabelHeight + labelGap + topGridH / 2
  const sideCardW = layout.cardW * sideScale
  const sideGap = Math.max(4, (phoneSized ? 5 : 7) * layout.scale)
  const sideGridW = sideCardW * 4 + sideGap * 3
  const leftX = margin + sideGridW / 2
  const rightX = width - margin - sideGridW / 2
  const rightY = phoneSized ? height * 0.31 : height * 0.5
  const leftY = phoneSized ? height * 0.72 : height * 0.5

  return [
    makeSeat('bottom', centerX, bottomY, bottomScale),
    makeSeat('right', rightX, rightY, sideScale),
    makeSeat('top', centerX, topY, topScale),
    makeSeat('left', leftX, leftY, sideScale),
  ]
}

function memoryLayoutGeometry(width: number, height: number, layout: TableLayout, rows: number, columns: number, playerCount: number): MemoryLayoutGeometry {
  const phoneSized = width <= 520 || height <= 620
  const margin = Math.max(8, 12 * layout.scale)
  const widePhoneGutter = phoneSized && columns >= 8 ? Math.max(30, width * 0.1) : margin
  const phoneLabelGap = Math.max(16, margin * 1.8)
  const labelW = phoneSized ? Math.min(142, (width - phoneLabelGap * 3) / 2) : Math.max(126, 176 * layout.scale)
  const labelH = phoneSized ? Math.max(30, 34 * layout.scale) : Math.max(32, 46 * layout.scale)
  const topBand = phoneSized ? labelH + margin * 2 : labelH + margin * 1.8
  const bottomBand = phoneSized ? labelH + margin * 2 : labelH + margin * 2
  const sideBand = phoneSized ? widePhoneGutter : labelW + margin * 2
  const usableX = sideBand
  const usableY = topBand
  const usableW = Math.max(10, width - sideBand * 2)
  const usableH = Math.max(10, height - topBand - bottomBand)
  const gap = Math.max(3, (phoneSized ? 5 : 8) * layout.scale)
  const sizingRows = phoneSized && columns >= 8 ? Math.max(rows, columns + (rows < columns ? 1 : 0)) : rows
  const sizingColumns = phoneSized && columns >= 8 && rows < columns ? columns + 1 : columns
  const maxCardW = (usableW - gap * Math.max(0, sizingColumns - 1)) / sizingColumns
  const maxCardH = (usableH - gap * Math.max(0, sizingRows - 1)) / sizingRows
  const cardW = Math.max(12, Math.min(layout.cardW * (phoneSized ? 0.82 : 0.92), maxCardW, maxCardH * (BASE_CARD_W / BASE_CARD_H)))
  const cardH = cardW * (BASE_CARD_H / BASE_CARD_W)
  const boardW = cardW * columns + gap * Math.max(0, columns - 1)
  const boardH = cardH * rows + gap * Math.max(0, rows - 1)
  const boardRect = {
    x: Math.max(sideBand, Math.min(width - sideBand - boardW, usableX + usableW / 2 - boardW / 2)),
    y: Math.max(topBand, Math.min(height - bottomBand - boardH, usableY + usableH / 2 - boardH / 2)),
    w: boardW,
    h: boardH,
  }

  const phoneLeftX = phoneLabelGap
  const phoneRightX = Math.min(width - phoneLabelGap - labelW, width / 2 + phoneLabelGap / 2)
  const phoneCenterX = Math.max(phoneLabelGap, Math.min(width - phoneLabelGap - labelW, width / 2 - labelW / 2))
  const phoneTopY = margin
  const phoneBottomY = height - margin - labelH
  const phoneLabelRects =
    playerCount >= 4
      ? [
          { x: phoneLeftX, y: phoneBottomY, w: labelW, h: labelH },
          { x: phoneRightX, y: phoneTopY, w: labelW, h: labelH },
          { x: phoneLeftX, y: phoneTopY, w: labelW, h: labelH },
          { x: phoneRightX, y: phoneBottomY, w: labelW, h: labelH },
        ]
      : playerCount === 3
        ? [
            { x: phoneCenterX, y: phoneBottomY, w: labelW, h: labelH },
            { x: phoneRightX, y: phoneTopY, w: labelW, h: labelH },
            { x: phoneLeftX, y: phoneTopY, w: labelW, h: labelH },
          ]
        : [
            { x: phoneCenterX, y: phoneBottomY, w: labelW, h: labelH },
            { x: phoneCenterX, y: phoneTopY, w: labelW, h: labelH },
          ]

  const labelRects = phoneSized
    ? phoneLabelRects
    : [
        { x: width / 2 - labelW / 2, y: height - margin - labelH, w: labelW, h: labelH },
        { x: width - margin - labelW, y: height / 2 - labelH / 2, w: labelW, h: labelH },
        { x: width / 2 - labelW / 2, y: margin, w: labelW, h: labelH },
        { x: margin, y: height / 2 - labelH / 2, w: labelW, h: labelH },
      ]

  return {
    boardRect,
    labelRects: labelRects.slice(0, Math.min(4, Math.max(1, playerCount))),
    cardW,
    cardH,
    gap,
  }
}

function drawMemoryTable(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  hiddenHands: boolean,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  localPlayerId?: string,
  elapsed = 999,
) {
  const board = state.memoryBoard
  if (!board) return
  const cardsPerMatch = board.cardsPerMatch ?? 2
  const displayPlayers = getDisplayPlayers(state, localPlayerId)
  const current = activePlayer(state)
  const memoryLayout = memoryLayoutGeometry(width, height, layout, board.rows, board.columns, displayPlayers.length)
  const { boardRect, cardW, cardH, gap } = memoryLayout
  const boardX = boardRect.x
  const boardY = boardRect.y

  ctx.save()
  ctx.fillStyle = 'rgba(48, 28, 8, 0.28)'
  roundedRect(ctx, boardX - gap * 1.5, boardY - gap * 1.5, boardRect.w + gap * 3, boardRect.h + gap * 3, 18)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 244, 168, 0.75)'
  ctx.lineWidth = Math.max(2, 3 * layout.scale)
  ctx.stroke()
  ctx.restore()

  const canInteract =
    !hiddenHands &&
    !state.winnerId &&
    !state.memoryActionEvent &&
    !board.pendingMismatchIndexes?.length &&
    !board.pendingMatchIndexes?.length &&
    board.selectedSlotIndexes.length < cardsPerMatch &&
    current.type === 'human' &&
    (state.config.mode !== 'wifi' || current.id === localPlayerId)

  board.slots.forEach((slot, index) => {
    if (slot.collectedByPlayerId) return
    const row = Math.floor(index / board.columns)
    const column = index % board.columns
    const x = boardX + column * (cardW + gap)
    const y = boardY + row * (cardH + gap)
    const selected = board.selectedSlotIndexes.includes(index)
    if (slot.faceUp) {
      drawCard(ctx, slot.card, x, y, cardW, cardH, selected, language, state.config.game)
    } else {
      drawCardBack(ctx, x, y, cardW, cardH, state.config.deckTheme, 'UNO')
    }
    const maskedCard = slot.faceUp ? slot.card : memoryMaskedCard(index)
    hitAreas.push({
      id: `memory-slot:${index}`,
      card: maskedCard,
      playable: canInteract && !slot.faceUp,
      source: 'memory',
      reason: memorySlotReason(language, canInteract, slot.faceUp),
      x,
      y,
      w: cardW,
      h: cardH,
    })
  })

  displayPlayers.forEach((player, index) => {
    const rect = memoryLayout.labelRects[index] ?? memoryLayout.labelRects[0]
    drawMemoryPlayerLabel(ctx, rect, playerName(language, player.name), player.hand.length, player.score, player.id === current.id, language, layout, player.avatarId, elapsed)
  })
}

function drawMemoryPlayerLabel(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; w: number; h: number },
  name: string,
  cards: number,
  score: number,
  active: boolean,
  language: Language,
  layout: TableLayout,
  avatarId: AvatarId,
  elapsed: number,
) {
  if (active && elapsed < 640) {
    const pulse = 0.5 + Math.sin((elapsed / 640) * Math.PI) * 0.5
    ctx.save()
    ctx.globalAlpha = 0.3 * pulse
    ctx.fillStyle = '#f7dd68'
    roundedRect(ctx, rect.x - 6, rect.y - 5, rect.w + 12, rect.h + 10, 12)
    ctx.fill()
    ctx.restore()
  }
  ctx.fillStyle = active ? 'rgba(255, 219, 91, 0.95)' : 'rgba(6, 18, 15, 0.78)'
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 10)
  ctx.fill()
  drawAvatar(ctx, rect.x + Math.max(15, 18 * layout.scale), rect.y + rect.h / 2, Math.max(10, 12 * layout.scale), avatarId)
  ctx.fillStyle = active ? '#17120a' : '#f7f5e7'
  ctx.textAlign = 'center'
  const textX = rect.x + rect.w / 2 + 10 * layout.scale
  const textW = Math.max(34, rect.w - 42 * layout.scale)
  drawFittedText(ctx, name, textX, rect.y + rect.h * 0.42, textW, Math.max(10, 13 * layout.scale), 8, '900')
  drawFittedText(ctx, `${cards} ${t(language, 'cards')} | ${score} pts`, textX, rect.y + rect.h * 0.72, textW, Math.max(8, 10 * layout.scale), 7, '800')
}

function memoryMaskedCard(index: number): Card {
  return { id: `memory-hidden-${index}`, kind: 'number', color: 'wild', label: 'Memory', points: 0, value: 0 }
}

function memorySlotReason(language: Language, canInteract: boolean, faceUp: boolean): string {
  if (faceUp) {
    if (language === 'zh') return '这张牌已经翻开。'
    if (language === 'de') return 'Diese Karte ist bereits offen.'
    return 'This card is already revealed.'
  }
  if (canInteract) {
    if (language === 'zh') return '可选择：翻开这张记忆牌。'
    if (language === 'de') return 'Spielbar: Decke diese Memory-Karte auf.'
    return 'Movable: reveal this memory card.'
  }
  return t(language, 'waitForTurn')
}

function drawCenter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  elapsed: number,
) {
  if (state.config.game === 'skipBo') {
    drawSkipBoCenter(ctx, width, height, state, language, layout, elapsed)
    return
  }
  if (state.config.game === 'dos') {
    drawDosCenter(ctx, width, height, state, language, hitAreas, layout, elapsed)
    return
  }
  if (state.config.game === 'phase10') {
    drawPhase10Center(ctx, width, height, state, language, hitAreas, layout, elapsed)
    return
  }
  if (state.config.game === 'triplePlay') {
    drawTriplePlayCenter(ctx, width, height, state, language, hitAreas, layout, elapsed)
    return
  }
  if (state.config.game === 'tippo') {
    drawTippoCenter(ctx, width, height, state, language, hitAreas, layout, elapsed)
    return
  }
  if (state.config.game === 'dice') {
    drawDiceCenter(ctx, width, height, state, language, hitAreas, layout, elapsed)
    return
  }
  if (state.config.game === 'guoPassage') {
    drawPassageCenter(ctx, width, height, state, language, layout, elapsed)
    return
  }
  const cx = width / 2
  const cy = height / 2
  const gap = Math.max(10, 18 * layout.scale)
  const hiLoSize = state.config.game === 'guoHiLo' ? Math.max(36, 52 * layout.scale) : 0
  const hiLoGap = state.config.game === 'guoHiLo' ? Math.max(8, 12 * layout.scale) : 0
  const totalCenterW = state.config.game === 'guoHiLo' ? hiLoSize + hiLoGap + layout.cardW + gap + layout.cardW : layout.cardW * 2 + gap * 2
  const startX = cx - totalCenterW / 2
  const indicatorX = startX
  const drawX = state.config.game === 'guoHiLo' ? startX + hiLoSize + hiLoGap : cx - layout.cardW - gap
  const drawY = cy - layout.cardH / 2
  const discardX = state.config.game === 'guoHiLo' ? drawX + layout.cardW + gap : cx + gap
  const discardY = cy - layout.cardH / 2
  if (state.config.game === 'guoHiLo') {
    drawHiLoIndicator(ctx, indicatorX, cy - hiLoSize / 2, hiLoSize, state, language, elapsed)
  }
  drawCardBack(ctx, drawX, drawY, layout.cardW, layout.cardH, state.config.deckTheme, t(language, 'drawPile'))
  if (isGridMemoryGame(state.config.game) && state.zeroTurn?.drawnCard) {
    drawCard(ctx, state.zeroTurn.drawnCard, cx - layout.cardW / 2, cy + layout.cardH * 0.1, layout.cardW, layout.cardH, true, language, state.config.game)
  }
  if (state.discardPile.length === 0) {
    drawEmptyPile(ctx, discardX, discardY, layout.cardW, layout.cardH)
    return
  }
  const settle = settleOffset(elapsed, 12 * layout.scale)
  const top = topCard(state)
  if (top.liarFaceDown) {
    drawCardBack(ctx, discardX, discardY + settle, layout.cardW, layout.cardH, state.config.deckTheme, top.liarClaim ? `${top.liarClaim.label}` : '')
  } else {
    drawCard(ctx, top, discardX, discardY + settle, layout.cardW, layout.cardH, true, language, state.config.game)
  }
  hitAreas.push({
    id: top.id,
    card: top,
    playable: false,
    source: 'discard',
    x: discardX,
    y: discardY + settle,
    w: layout.cardW,
    h: layout.cardH,
  })

  if (state.pendingDraw) {
    const label = `${t(language, 'drawStack')}: ${state.pendingDraw.amount}`
    const fontSize = Math.max(13, 18 * layout.scale)
    ctx.font = `800 ${fontSize}px system-ui`
    const badgePaddingX = Math.max(14, 18 * layout.scale)
    const badgeWidth = Math.min(width - 24, Math.max(130, ctx.measureText(label).width + badgePaddingX * 2))
    const badgeHeight = Math.max(34, 42 * layout.scale)
    const badgeY = Math.max(14, cy - 178 * layout.scale)
    ctx.fillStyle = 'rgba(226, 66, 66, 0.92)'
    roundedRect(ctx, cx - badgeWidth / 2, badgeY, badgeWidth, badgeHeight, 12)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    drawFittedText(ctx, label, cx, badgeY + badgeHeight / 2 + fontSize * 0.35, badgeWidth - badgePaddingX, fontSize, 11, '800')
  }

  if (state.pendingDare) {
    const label = language === 'zh' ? 'Dare：摸 2 或掷骰' : language === 'de' ? 'Dare: Ziehen oder wurfeln' : 'Dare: draw 2 or roll'
    const fontSize = Math.max(13, 18 * layout.scale)
    ctx.font = `800 ${fontSize}px system-ui`
    const badgePaddingX = Math.max(14, 18 * layout.scale)
    const badgeWidth = Math.min(width - 24, Math.max(154, ctx.measureText(label).width + badgePaddingX * 2))
    const badgeHeight = Math.max(34, 42 * layout.scale)
    const badgeY = Math.max(14, cy - 178 * layout.scale)
    ctx.fillStyle = 'rgba(226, 66, 66, 0.92)'
    roundedRect(ctx, cx - badgeWidth / 2, badgeY, badgeWidth, badgeHeight, 12)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    drawFittedText(ctx, label, cx, badgeY + badgeHeight / 2 + fontSize * 0.35, badgeWidth - badgePaddingX, fontSize, 11, '800')
  }

  if (state.config.game === 'party' && state.partyPileEvent) {
    drawPileUpBadge(ctx, discardX + layout.cardW / 2, discardY - Math.max(12, 20 * layout.scale), state.partyPileEvent.pileSize, language, layout, width)
  }

  if (state.config.game === 'h2o' && state.config.h2oSplash) {
    drawWhirlpool(ctx, width, height, state, language, layout, elapsed)
  }
  if (state.config.game === 'extreme' || state.config.game === 'flipExtreme') {
    drawLauncherUnit(ctx, width, height, state, language, layout, elapsed)
  }
  if (state.config.game === 'blast') {
    drawBlastUnit(ctx, width, height, state, language, layout, elapsed)
  }
  if (state.config.game === 'roboto') {
    drawRobotoUnit(ctx, width, height, state, language, layout, elapsed)
  }
  if (state.config.game === 'flash') {
    drawFlashUnit(ctx, width, height, state, language, layout, elapsed)
  }
  if (state.config.game === 'spin') {
    drawSpinUnit(ctx, width, height, state, language, layout, elapsed)
  }
}

function drawHiLoIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  state: GameState,
  language: Language,
  elapsed: number,
) {
  const direction = state.hiLoDirection ?? 'higher'
  const centerX = x + size / 2
  const centerY = y + size / 2
  const pulse = state.config.reducedMotion ? 0 : Math.sin(Math.min(1, elapsed / 360) * Math.PI) * size * 0.05
  const targetRotation = direction === 'higher' ? -Math.PI / 2 : Math.PI / 2
  const startRotation = direction === 'higher' ? Math.PI / 2 : -Math.PI / 2
  const progress = state.config.reducedMotion ? 1 : Math.min(1, elapsed / 420)
  const rotation = startRotation + (targetRotation - startRotation) * progress

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.32)'
  ctx.shadowBlur = Math.max(8, size * 0.12)
  ctx.fillStyle = '#f6d34c'
  roundedRect(ctx, x - pulse / 2, y - pulse / 2, size + pulse, size + pulse, Math.max(10, size * 0.2))
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(12, 24, 20, 0.72)'
  ctx.lineWidth = Math.max(2, size * 0.06)
  ctx.stroke()

  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)
  ctx.strokeStyle = '#10201b'
  ctx.fillStyle = '#10201b'
  ctx.lineWidth = Math.max(3, size * 0.08)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-size * 0.23, 0)
  ctx.lineTo(size * 0.18, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(size * 0.26, 0)
  ctx.lineTo(size * 0.08, -size * 0.13)
  ctx.lineTo(size * 0.08, size * 0.13)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  const anchor = typeof state.hiLoAnchor === 'number' ? Math.max(0, Math.min(9, Math.trunc(state.hiLoAnchor))) : null
  const label = direction === 'higher'
    ? language === 'zh' ? '更高' : language === 'de' ? 'HOCH' : 'HIGH'
    : language === 'zh' ? '更低' : language === 'de' ? 'TIEF' : 'LOW'
  const textY = y + size + Math.max(10, 12 * (size / 52))
  ctx.font = `900 ${Math.max(10, size * 0.22)}px system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(8, 18, 16, 0.82)'
  const badgeW = Math.max(size * 1.05, ctx.measureText(anchor === null ? label : `${label} ${anchor}`).width + 16)
  roundedRect(ctx, centerX - badgeW / 2, textY - size * 0.18, badgeW, size * 0.36, Math.max(6, size * 0.1))
  ctx.fill()
  ctx.fillStyle = '#fff7c2'
  drawFittedText(ctx, anchor === null ? label : `${label} ${anchor}`, centerX, textY + size * 0.01, badgeW - 8, Math.max(10, size * 0.2), 8, '900')
}

function drawPassageCenter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  layout: TableLayout,
  elapsed: number,
) {
  const phoneSized = width <= 520 || height <= 620
  const scale = phoneSized ? 0.66 : 0.84
  const cardW = layout.cardW * scale
  const cardH = layout.cardH * scale
  const gap = Math.max(8, 16 * layout.scale)
  const takenCard = state.passageTurn?.takenCard ?? null
  const count = takenCard ? 4 : 3
  const totalW = count * cardW + (count - 1) * gap
  const startX = width / 2 - totalW / 2
  const y = height / 2 - cardH / 2
  const settle = settleOffset(elapsed, 8 * layout.scale)
  const entries: Array<{ kind: 'draw' | 'slot' | 'faceUp' | 'taken'; card?: Card | null; label: string; count: number }> = [
    { kind: 'draw', label: passageCenterLabel(language, 'draw'), count: state.drawPile.length },
    { kind: 'slot', card: state.passageSlot, label: passageCenterLabel(language, 'slot'), count: state.passageSlot ? 1 : 0 },
    { kind: 'faceUp', card: state.passageFaceUp, label: passageCenterLabel(language, 'faceUp'), count: state.passageFaceUp ? 1 : 0 },
  ]
  if (takenCard) entries.push({ kind: 'taken', card: takenCard, label: passageCenterLabel(language, 'taken'), count: 1 })

  entries.forEach((entry, index) => {
    const x = startX + index * (cardW + gap)
    const badgeH = Math.max(20, 24 * layout.scale)
    const badgeW = Math.max(28, cardW * 0.52)
    const badgeY = Math.max(4, y - badgeH - Math.max(5, 7 * layout.scale))
    ctx.fillStyle = 'rgba(6, 18, 15, 0.86)'
    roundedRect(ctx, x + cardW / 2 - badgeW / 2, badgeY, badgeW, badgeH, 8)
    ctx.fill()
    ctx.fillStyle = '#fff7c2'
    ctx.textAlign = 'center'
    drawFittedText(ctx, String(entry.count), x + cardW / 2, badgeY + badgeH / 2 + 1, badgeW - 8, Math.max(10, 13 * layout.scale), 8, '900')
    if (entry.kind === 'draw' || entry.kind === 'slot') {
      if (entry.kind === 'slot' && !entry.card) drawEmptyPile(ctx, x, y, cardW, cardH)
      else drawCardBack(ctx, x, y + settle, cardW, cardH, state.config.deckTheme, entry.label)
    } else if (entry.card) {
      drawCard(ctx, entry.card, x, y + settle, cardW, cardH, false, language, state.config.game)
    } else {
      drawEmptyPile(ctx, x, y, cardW, cardH)
    }
    const labelY = y + cardH + Math.max(8, 10 * layout.scale)
    ctx.fillStyle = 'rgba(6, 18, 15, 0.82)'
    roundedRect(ctx, x, labelY, cardW, Math.max(26, 32 * layout.scale), 8)
    ctx.fill()
    ctx.fillStyle = '#fff7c2'
    ctx.textAlign = 'center'
    drawFittedText(ctx, entry.label, x + cardW / 2, labelY + Math.max(16, 18 * layout.scale), cardW - 8, Math.max(10, 12 * layout.scale), 8, '900')
  })
}

function passageCenterLabel(language: Language, key: 'draw' | 'slot' | 'faceUp' | 'taken'): string {
  const labels: Record<typeof key, Record<Language, string>> = {
    draw: { en: 'Deck', zh: '牌库', de: 'Deck' },
    slot: { en: 'Passage', zh: '暗格', de: 'Passage' },
    faceUp: { en: 'Face up', zh: '明牌', de: 'Offen' },
    taken: { en: 'Taken', zh: '已拿', de: 'Genommen' },
  }
  return labels[key][language]
}

function drawTriplePlayCenter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  elapsed: number,
) {
  const geometry = triplePlayLayoutGeometry(width, height, layout, state.players.length, activePlayer(state).hand.length || 7)
  const cardW = geometry.drawRect.w
  const cardH = geometry.drawRect.h
  const gap = Math.max(7, 12 * layout.scale)
  const drawGap = Math.max(12, 18 * layout.scale)
  const startX = geometry.drawRect.x
  const y = geometry.drawRect.y
  drawCardBack(ctx, startX, y, cardW, cardH, state.config.deckTheme, t(language, 'drawPile'))

  const piles = state.triplePlayPiles ?? []
  piles.forEach((pile, index) => {
    const x = Math.round(startX + cardW + drawGap + index * (cardW + gap))
    const top = pile.cards.at(-1)
    const lit = pile.active
    ctx.save()
    ctx.globalAlpha = lit ? 1 : 0.48
    if (top) {
      drawCard(ctx, top, x, y + settleOffset(elapsed, 8 * layout.scale), cardW, cardH, false, language, state.config.game)
      hitAreas.push({
        id: `triple-play-pile:${index}`,
        card: top,
        playable: false,
        source: 'discard',
        x,
        y,
        w: cardW,
        h: cardH,
      })
    } else {
      drawEmptyPile(ctx, x, y, cardW, cardH)
    }
    ctx.restore()

    const labelY = y + cardH + Math.max(5, 7 * layout.scale)
    const meterH = Math.max(30, 36 * layout.scale)
    ctx.fillStyle = lit ? 'rgba(8, 22, 18, 0.88)' : 'rgba(8, 22, 18, 0.58)'
    roundedRect(ctx, x, labelY, cardW, meterH, 8)
    ctx.fill()
    ctx.fillStyle = lit ? '#ffd84a' : 'rgba(255,255,255,0.58)'
    ctx.textAlign = 'center'
    drawFittedText(ctx, triplePlayPileLabel(language, index, lit), x + cardW / 2, labelY + 14 * layout.scale, cardW - 6, Math.max(9, 11 * layout.scale), 8, '900')
    ctx.fillStyle = '#fff7cc'
    drawFittedText(ctx, `${pile.overload}/${pile.limit}`, x + cardW / 2, labelY + 28 * layout.scale, cardW - 6, Math.max(9, 11 * layout.scale), 8, '800')
  })
}

function drawTippoCenter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  elapsed: number,
) {
  const geometry = triplePlayLayoutGeometry(width, height, layout, state.players.length, activePlayer(state).hand.length || 7)
  const cardW = geometry.drawRect.w
  const cardH = geometry.drawRect.h
  const gap = Math.max(14, 24 * layout.scale)
  const startX = geometry.drawRect.x
  const y = geometry.drawRect.y
  drawCardBack(ctx, startX, y, cardW, cardH, state.config.deckTheme, t(language, 'drawPile'))

  const trayStartX = Math.round(startX + cardW + Math.max(18, 28 * layout.scale))
  const trayY = y
  const trays = state.tippoTrays ?? []
  const trayCenters = trays.map((_, index) => trayStartX + index * (cardW + gap) + cardW / 2)
  if (trayCenters.length >= 2) {
    const left = trayCenters[0] - cardW * 0.62
    const right = trayCenters[1] + cardW * 0.62
    const barY = trayY + cardH + Math.max(25, 34 * layout.scale)
    const tilt = state.tippoEvent?.tipped ? (state.tippoEvent.trayIndex === 0 ? -7 : 7) : 0
    ctx.save()
    ctx.translate((left + right) / 2, barY)
    ctx.rotate((tilt * Math.PI) / 180)
    ctx.strokeStyle = '#ffd55d'
    ctx.lineWidth = Math.max(5, 7 * layout.scale)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-(right - left) / 2, 0)
    ctx.lineTo((right - left) / 2, 0)
    ctx.stroke()
    ctx.restore()
    ctx.fillStyle = 'rgba(8, 22, 18, 0.92)'
    roundedRect(ctx, (left + right) / 2 - 12 * layout.scale, barY - 4 * layout.scale, 24 * layout.scale, 28 * layout.scale, 7)
    ctx.fill()
  }

  trays.forEach((tray, index) => {
    const x = Math.round(trayStartX + index * (cardW + gap))
    const top = tray.cards.at(-1)
    if (top) {
      drawCard(ctx, top, x, trayY + settleOffset(elapsed, 8 * layout.scale), cardW, cardH, false, language, state.config.game)
      hitAreas.push({
        id: `tippo-tray:${index}`,
        card: top,
        playable: false,
        source: 'discard',
        x,
        y: trayY,
        w: cardW,
        h: cardH,
      })
    } else {
      drawEmptyPile(ctx, x, trayY, cardW, cardH)
    }

    const labelY = trayY + cardH + Math.max(44, 52 * layout.scale)
    const meterH = Math.max(34, 40 * layout.scale)
    const hot = tray.load >= tray.limit - 1
    ctx.fillStyle = hot ? 'rgba(196, 54, 54, 0.9)' : 'rgba(8, 22, 18, 0.9)'
    roundedRect(ctx, x, labelY, cardW, meterH, 8)
    ctx.fill()
    ctx.fillStyle = hot ? '#ffffff' : '#fff7cc'
    ctx.textAlign = 'center'
    drawFittedText(ctx, tippoTrayLabel(language, index), x + cardW / 2, labelY + 15 * layout.scale, cardW - 6, Math.max(9, 11 * layout.scale), 8, '900')
    drawFittedText(ctx, `${tray.load}/${tray.limit}`, x + cardW / 2, labelY + 30 * layout.scale, cardW - 6, Math.max(9, 12 * layout.scale), 8, '900')
  })
}

function drawDosCenter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  elapsed: number,
) {
  const row = state.dosCenterRow ?? []
  const geometry = dosLayoutGeometry(width, height, layout, row.length, state.players.length)
  drawCardBack(ctx, geometry.drawRect.x, geometry.drawRect.y, geometry.drawRect.w, geometry.drawRect.h, state.config.deckTheme, t(language, 'drawPile'))
  if (row.length === 0) {
    drawEmptyPile(ctx, geometry.centerRect.x, geometry.centerRect.y, geometry.centerRect.w, geometry.centerRect.h)
    return
  }
  const cardW = geometry.centerRect.w / row.length - (row.length > 1 ? Math.max(6, 9 * layout.scale) * (row.length - 1) / row.length : 0)
  const cardH = geometry.centerRect.h
  const gap = row.length > 1 ? (geometry.centerRect.w - cardW * row.length) / (row.length - 1) : 0
  row.forEach((card, index) => {
    const x = geometry.centerRect.x + index * (cardW + gap)
    const y = geometry.centerRect.y
    drawCard(ctx, card, x, y + settleOffset(elapsed, 10 * layout.scale), cardW, cardH, false, language, state.config.game)
    hitAreas.push({
      id: `dos-center:${card.id}`,
      card,
      playable: false,
      source: 'discard',
      x,
      y,
      w: cardW,
      h: cardH,
    })
  })
}

function drawPhase10Center(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  elapsed: number,
) {
  const geometry = phase10LayoutGeometry(width, height, layout, state.players.length, activePlayer(state).hand.length || 10)
  const cardW = geometry.drawRect.w
  const cardH = geometry.drawRect.h
  const drawX = geometry.drawRect.x
  const drawY = geometry.drawRect.y
  const discardX = geometry.centerRect.x + cardW + (geometry.centerRect.w - cardW * 2)
  const discardY = geometry.centerRect.y

  drawCardBack(ctx, drawX, drawY, cardW, cardH, state.config.deckTheme, t(language, 'drawPile'))
  if (state.discardPile.length === 0) {
    drawEmptyPile(ctx, discardX, discardY, cardW, cardH)
    return
  }
  const settle = settleOffset(elapsed, 10 * layout.scale)
  const top = topCard(state)
  drawCard(ctx, top, discardX, discardY + settle, cardW, cardH, true, language, state.config.game)
  hitAreas.push({
    id: top.id,
    card: top,
    playable: false,
    source: 'discard',
    x: discardX,
    y: discardY + settle,
    w: cardW,
    h: cardH,
  })
}

function drawSkipBoCenter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  layout: TableLayout,
  elapsed: number,
) {
  const phoneSized = width <= 520 || height <= 620
  const scale = phoneSized ? 0.62 : 0.74
  const cardW = layout.cardW * scale
  const cardH = layout.cardH * scale
  const gap = Math.max(7, 10 * layout.scale)
  const drawGap = Math.max(14, 18 * layout.scale)
  const totalW = cardW + drawGap + cardW * 4 + gap * 3
  const x = Math.max(8, width / 2 - totalW / 2)
  const y = phoneSized ? height * 0.42 - cardH / 2 : height / 2 - cardH / 2
  drawCardBack(ctx, x, y, cardW, cardH, state.config.deckTheme, t(language, 'drawPile'))

  const piles = state.skipBoBuildPiles ?? [[], [], [], []]
  piles.forEach((pile, index) => {
    const px = Math.round(x + cardW + drawGap + index * (cardW + gap))
    const py = Math.round(y + settleOffset(elapsed, 7 * layout.scale))
    const top = pile.at(-1)
    if (top) {
      drawCard(ctx, top, px, py, cardW, cardH, false, language, state.config.game)
    } else {
      drawEmptyPile(ctx, px, py, cardW, cardH)
    }
    const nextValue = pile.length + 1
    const label = nextValue <= 12 ? skipBoBuildPileLabel(language, nextValue) : skipBoBuildPileDoneLabel(language)
    ctx.fillStyle = 'rgba(6, 18, 15, 0.82)'
    const labelY = Math.round(py + cardH + 5 * layout.scale)
    roundedRect(ctx, px, labelY, cardW, Math.max(20, 24 * layout.scale), 7)
    ctx.fill()
    ctx.fillStyle = '#fff7cc'
    ctx.textAlign = 'center'
    drawFittedText(ctx, label, px + cardW / 2, labelY + 16 * layout.scale, cardW - 4, Math.max(9, 11 * layout.scale), 8, '800')
  })
}

function drawDiceCenter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  elapsed: number,
) {
  const geometry = compactMobileUnoLayoutGeometry(width, height, layout, state.players.length, activePlayer(state).hand.length || 5)
  const line = state.discardPile.slice(-6)
  const dieSize = Math.min(geometry.drawRect.h, geometry.drawRect.w) * 0.92
  const gap = Math.max(7, 10 * layout.scale)
  const rowW = line.length * dieSize + Math.max(0, line.length - 1) * gap
  const rowX = width / 2 - rowW / 2
  const rowY = geometry.centerRect.y + Math.max(0, (geometry.centerRect.h - dieSize) / 2)

  ctx.save()
  ctx.fillStyle = 'rgba(6, 18, 15, 0.72)'
  roundedRect(ctx, rowX - 12 * layout.scale, rowY - 28 * layout.scale, rowW + 24 * layout.scale, dieSize + 42 * layout.scale, 12)
  ctx.fill()
  ctx.fillStyle = '#fff7cc'
  ctx.textAlign = 'center'
  drawFittedText(ctx, diceLineLabel(language), rowX + rowW / 2, rowY - 11 * layout.scale, rowW, Math.max(10, 12 * layout.scale), 8, '800')
  ctx.restore()

  if (line.length === 0) {
    drawEmptyPile(ctx, rowX, rowY, dieSize, dieSize)
    return
  }

  line.forEach((die, index) => {
    const x = rowX + index * (dieSize + gap)
    const y = rowY + settleOffset(elapsed, 7 * layout.scale)
    const isTop = index === line.length - 1
    drawCard(ctx, die, x, y, dieSize, dieSize, isTop, language, state.config.game)
    if (isTop) {
      hitAreas.push({
        id: die.id,
        card: die,
        playable: false,
        source: 'discard',
        x,
        y,
        w: dieSize,
        h: dieSize,
      })
    }
  })
}

function diceLineLabel(language: Language): string {
  if (language === 'zh') return '骰子线'
  if (language === 'de') return 'Würfellinie'
  return 'Dice line'
}

function triplePlayPileLabel(language: Language, index: number, lit: boolean): string {
  if (language === 'zh') return `${lit ? '亮' : '暗'} ${index + 1}`
  if (language === 'de') return `${lit ? 'An' : 'Aus'} ${index + 1}`
  return `${lit ? 'Lit' : 'Dim'} ${index + 1}`
}

function tippoTrayLabel(language: Language, index: number): string {
  if (language === 'zh') return `托盘 ${index + 1}`
  if (language === 'de') return `Ablage ${index + 1}`
  return `Tray ${index + 1}`
}

function drawEmptyPile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)'
  ctx.lineWidth = 3
  ctx.setLineDash([8, 8])
  roundedRect(ctx, x, y, w, h, 12)
  ctx.stroke()
  ctx.restore()
}

function drawPileUpBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  language: Language,
  layout: TableLayout,
  tableWidth: number,
) {
  const label = pileUpBadgeText(language, count)
  const fontSize = Math.max(11, 14 * layout.scale)
  ctx.save()
  ctx.font = `800 ${fontSize}px system-ui`
  const badgeWidth = Math.min(tableWidth - 24, Math.max(88, ctx.measureText(label).width + 24 * layout.scale))
  const badgeHeight = Math.max(28, 32 * layout.scale)
  const left = Math.max(12, Math.min(tableWidth - badgeWidth - 12, x - badgeWidth / 2))
  const top = Math.max(12, y - badgeHeight)
  ctx.fillStyle = 'rgba(6, 18, 15, 0.82)'
  roundedRect(ctx, left, top, badgeWidth, badgeHeight, 10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(247, 221, 104, 0.7)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#fff7cc'
  ctx.textAlign = 'center'
  drawFittedText(ctx, label, left + badgeWidth / 2, top + badgeHeight / 2 + fontSize * 0.34, badgeWidth - 14, fontSize, 9, '800')
  ctx.restore()
}

function pileUpBadgeText(language: Language, count: number): string {
  if (language === 'zh') return `Pile Up: ${count} 张`
  if (language === 'de') return `Pile Up: ${count}`
  return `Pile Up: ${count}`
}

function drawLauncherUnit(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  layout: TableLayout,
  elapsed: number,
) {
  const event = state.launcherEvent
  const panelWidth = Math.min(width - 28, Math.max(174, 236 * layout.scale))
  const panelHeight = Math.max(44, 56 * layout.scale)
  const { x, y } = getBottomDevicePanelPosition(width, height, layout, panelWidth, panelHeight)
  const target = event ? playerName(language, event.targetPlayerName) : playerName(language, activePlayer(state).name)
  const title = launcherTitle(language)
  const status = event ? launcherStatus(language, event.presses, event.cardsFired, event.mode) : launcherReadyText(language)
  const detail = event ? launcherTargetText(language, target) : launcherTriggerText(language)
  drawDevicePanel(ctx, x, y, panelWidth, panelHeight, '#e0b54c', title, status, detail, layout, elapsed, 'launcher')
}

function drawBlastUnit(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  layout: TableLayout,
  elapsed: number,
) {
  const event = state.blastEvent ?? null
  const chamber = state.blastChamber ?? 0
  const panelWidth = Math.min(width - 28, Math.max(184, 250 * layout.scale))
  const panelHeight = Math.max(44, 56 * layout.scale)
  const { x, y } = getBottomDevicePanelPosition(width, height, layout, panelWidth, panelHeight)
  const title = blastTitle(language)
  const status = event ? blastStatus(language, event.fired, event.cardsDrawn) : blastReadyText(language)
  const detail = event ? blastDetail(language, playerName(language, event.playerName), event.chamberSize) : blastChamberText(language, chamber)
  drawDevicePanel(ctx, x, y, panelWidth, panelHeight, '#ffcf4b', title, status, detail, layout, elapsed, 'blast')
}

function drawRobotoUnit(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  layout: TableLayout,
  elapsed: number,
) {
  const event = state.robotoEvent ?? null
  const panelWidth = Math.min(width - 28, Math.max(184, 250 * layout.scale))
  const panelHeight = Math.max(44, 56 * layout.scale)
  const { x, y } = getBottomDevicePanelPosition(width, height, layout, panelWidth, panelHeight)
  const title = robotoTitle(language)
  const status = event ? robotoCommandLabel(language, event.command) : robotoReadyText(language)
  const detail = event ? robotoDetail(language, event) : robotoTriggerText(language)
  drawDevicePanel(ctx, x, y, panelWidth, panelHeight, '#9ed1ff', title, status, detail, layout, elapsed, 'robot')
}

function drawFlashUnit(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  layout: TableLayout,
  elapsed: number,
) {
  const event = state.flashEvent
  const panelWidth = Math.min(width - 28, Math.max(174, 238 * layout.scale))
  const panelHeight = Math.max(44, 56 * layout.scale)
  const { x, y } = getBottomDevicePanelPosition(width, height, layout, panelWidth, panelHeight)
  const current = playerName(language, activePlayer(state).name)
  const title = flashTitle(language)
  const status = event ? flashStatus(language, event.kind, playerName(language, event.activePlayerName)) : flashReadyText(language)
  const detail = event ? flashDetail(language, event.affectedPlayerName ? playerName(language, event.affectedPlayerName) : current, event.penaltyCards) : flashTimerText(language, state.config.flashTimerSeconds)
  drawDevicePanel(ctx, x, y, panelWidth, panelHeight, '#8dd7ff', title, status, detail, layout, elapsed, 'flash')
}

function drawSpinUnit(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  layout: TableLayout,
  elapsed: number,
) {
  const event = state.spinEvent
  const panelWidth = Math.min(width - 28, Math.max(174, 238 * layout.scale))
  const panelHeight = Math.max(44, 56 * layout.scale)
  const { x, y } = getBottomDevicePanelPosition(width, height, layout, panelWidth, panelHeight)
  const title = spinTitle(language)
  const status = event ? spinActionLabel(language, event.action) : spinReadyText(language)
  const detail = event ? spinDetail(language, playerName(language, event.targetPlayerName), event.action, event.color) : spinTriggerText(language)
  drawDevicePanel(ctx, x, y, panelWidth, panelHeight, '#f0c94a', title, status, detail, layout, elapsed, 'spin')
}

function drawDevicePanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: string,
  title: string,
  status: string,
  detail: string,
  layout: TableLayout,
  elapsed: number,
  icon: 'launcher' | 'flash' | 'spin' | 'blast' | 'robot',
) {
  const radius = Math.max(18, 24 * layout.scale)
  const iconX = x + radius + 12 * layout.scale
  const iconY = y + h / 2
  const labelX = iconX + radius + 12 * layout.scale
  const labelWidth = x + w - labelX - 10 * layout.scale
  const pulse = Math.sin(elapsed / 180) * 0.08

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.32)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 5
  ctx.fillStyle = 'rgba(5, 18, 24, 0.82)'
  roundedRect(ctx, x, y, w, h, 12)
  ctx.fill()
  ctx.shadowColor = 'transparent'

  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.arc(iconX, iconY, radius * (1 + pulse), 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(6, 18, 15, 0.72)'
  if (icon === 'launcher') {
    roundedRect(ctx, iconX - radius * 0.5, iconY - radius * 0.28, radius, radius * 0.56, 6)
    ctx.fill()
    ctx.fillStyle = '#fff4c9'
    ctx.beginPath()
    ctx.moveTo(iconX + radius * 0.1, iconY)
    ctx.lineTo(iconX + radius * 0.62, iconY - radius * 0.28)
    ctx.lineTo(iconX + radius * 0.62, iconY + radius * 0.28)
    ctx.closePath()
    ctx.fill()
  } else if (icon === 'blast') {
    ctx.fillStyle = '#fff4c9'
    ctx.beginPath()
    ctx.moveTo(iconX, iconY - radius * 0.62)
    ctx.lineTo(iconX + radius * 0.22, iconY - radius * 0.16)
    ctx.lineTo(iconX + radius * 0.66, iconY - radius * 0.08)
    ctx.lineTo(iconX + radius * 0.28, iconY + radius * 0.14)
    ctx.lineTo(iconX + radius * 0.42, iconY + radius * 0.62)
    ctx.lineTo(iconX, iconY + radius * 0.3)
    ctx.lineTo(iconX - radius * 0.42, iconY + radius * 0.62)
    ctx.lineTo(iconX - radius * 0.28, iconY + radius * 0.14)
    ctx.lineTo(iconX - radius * 0.66, iconY - radius * 0.08)
    ctx.lineTo(iconX - radius * 0.22, iconY - radius * 0.16)
    ctx.closePath()
    ctx.fill()
  } else if (icon === 'robot') {
    ctx.fillStyle = '#fff4c9'
    roundedRect(ctx, iconX - radius * 0.52, iconY - radius * 0.36, radius * 1.04, radius * 0.72, 6)
    ctx.fill()
    ctx.fillStyle = '#122132'
    ctx.beginPath()
    ctx.arc(iconX - radius * 0.2, iconY - radius * 0.05, radius * 0.09, 0, Math.PI * 2)
    ctx.arc(iconX + radius * 0.2, iconY - radius * 0.05, radius * 0.09, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#122132'
    ctx.lineWidth = Math.max(2, 2.6 * layout.scale)
    ctx.beginPath()
    ctx.moveTo(iconX - radius * 0.22, iconY + radius * 0.16)
    ctx.lineTo(iconX + radius * 0.22, iconY + radius * 0.16)
    ctx.stroke()
  } else if (icon === 'flash') {
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI * 2 * index) / 4 + elapsed / 900
      ctx.beginPath()
      ctx.arc(iconX + Math.cos(angle) * radius * 0.45, iconY + Math.sin(angle) * radius * 0.45, radius * 0.14, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    ctx.strokeStyle = '#fff8c8'
    ctx.lineWidth = Math.max(2, 3 * layout.scale)
    for (let arc = 0; arc < 3; arc += 1) {
      ctx.beginPath()
      ctx.arc(iconX, iconY, radius * (0.32 + arc * 0.18), elapsed / 420 + arc, elapsed / 420 + arc + Math.PI * 1.25)
      ctx.stroke()
    }
    ctx.fillStyle = '#fff8c8'
    ctx.beginPath()
    ctx.moveTo(iconX + radius * 0.62, iconY - radius * 0.06)
    ctx.lineTo(iconX + radius * 0.36, iconY - radius * 0.22)
    ctx.lineTo(iconX + radius * 0.42, iconY + radius * 0.08)
    ctx.closePath()
    ctx.fill()
  }

  ctx.fillStyle = '#eaffff'
  ctx.textAlign = 'left'
  drawFittedText(ctx, title, labelX, y + 17 * layout.scale, labelWidth, Math.max(11, 12 * layout.scale), 9, '800')
  drawFittedText(ctx, status, labelX, y + 35 * layout.scale, labelWidth, Math.max(12, 16 * layout.scale), 10, '900')
  drawFittedText(ctx, detail, labelX, y + 50 * layout.scale, labelWidth, Math.max(9, 11 * layout.scale), 8, '700')
  ctx.restore()
}

function drawWhirlpool(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  language: Language,
  layout: TableLayout,
  elapsed: number,
) {
  const radius = Math.max(24, 32 * layout.scale)
  const panelWidth = Math.min(width - 28, Math.max(178, 250 * layout.scale))
  const panelHeight = Math.max(46, 58 * layout.scale)
  const { x, y } = getBottomDevicePanelPosition(width, height, layout, panelWidth, panelHeight)
  const whirlX = x + radius + 12 * layout.scale
  const whirlY = y + panelHeight / 2
  const pulse = state.config.reducedMotion ? 0 : Math.sin(elapsed / 180) * 0.08
  const labelX = whirlX + radius + 12 * layout.scale
  const labelWidth = x + panelWidth - labelX - 10 * layout.scale
  const event = state.whirlpoolEvent
  const command = event ? event.chain.map((entry) => whirlpoolCommandLabel(language, entry)).join(' > ') : whirlpoolReadyText(language)
  const target = event ? whirlpoolTargetText(language, playerName(language, event.targetPlayerName)) : whirlpoolTriggerText(language)

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.32)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 5
  ctx.fillStyle = 'rgba(5, 18, 24, 0.82)'
  roundedRect(ctx, x, y, panelWidth, panelHeight, 12)
  ctx.fill()
  ctx.shadowColor = 'transparent'

  const gradient = ctx.createRadialGradient(whirlX - radius * 0.2, whirlY - radius * 0.2, radius * 0.1, whirlX, whirlY, radius)
  gradient.addColorStop(0, '#e9ffff')
  gradient.addColorStop(0.36, '#55c7e4')
  gradient.addColorStop(1, '#176486')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(whirlX, whirlY, radius * (1 + pulse), 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)'
  ctx.lineWidth = Math.max(2, 3 * layout.scale)
  for (let ring = 0; ring < 3; ring += 1) {
    ctx.beginPath()
    ctx.ellipse(whirlX, whirlY, radius * (0.28 + ring * 0.2), radius * (0.13 + ring * 0.09), elapsed / 500 + ring * 0.72, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = '#eaffff'
  ctx.textAlign = 'left'
  drawFittedText(ctx, whirlpoolTitle(language), labelX, y + 18 * layout.scale, labelWidth, Math.max(11, 12 * layout.scale), 9, '800')
  drawFittedText(ctx, command, labelX, y + 36 * layout.scale, labelWidth, Math.max(12, 16 * layout.scale), 10, '900')
  drawFittedText(ctx, target, labelX, y + 51 * layout.scale, labelWidth, Math.max(9, 11 * layout.scale), 8, '700')
  ctx.restore()
}

function getBottomDevicePanelPosition(
  width: number,
  height: number,
  layout: TableLayout,
  panelWidth: number,
  panelHeight: number,
): DevicePanelPosition {
  const cx = width / 2
  const gap = Math.max(10, 14 * layout.scale)
  const bottomInset = Math.max(layout.cardH * 0.7, 96 * layout.scale)
  const bottomPlayerY = height - bottomInset
  const bottomLabelY = bottomPlayerY - 112 * layout.scale
  const bottomLabelWidth = Math.max(126, 176 * layout.scale)
  const bottomLabelHeight = Math.max(32, 48 * layout.scale)
  const bottomLabelTop = bottomLabelY - bottomLabelHeight / 2
  const leftOfLabel = cx - bottomLabelWidth / 2 - gap - panelWidth
  const rightOfLabel = cx + bottomLabelWidth / 2 + gap
  const sideY = Math.max(12, Math.min(height - panelHeight - 12, bottomLabelY - panelHeight / 2))
  const fallbackY = Math.max(12, bottomLabelTop - panelHeight - gap)
  const canUseLeft = leftOfLabel >= 12
  const canUseRight = rightOfLabel + panelWidth <= width - 12
  return {
    x: canUseLeft ? leftOfLabel : canUseRight ? rightOfLabel : Math.max(12, Math.min(width - panelWidth - 12, cx - panelWidth / 2)),
    y: canUseLeft || canUseRight ? sideY : fallbackY,
  }
}

function drawZeroPlayers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  hiddenHands: boolean,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  localPlayerId?: string,
  elapsed = 999,
) {
  const current = activePlayer(state)
  const isCabo = state.config.game === 'cabo'
  const isSkyjo = state.config.game === 'skyjo'
  const phoneSized = width <= 520 || height <= 620
  if (isSkyjo) {
    drawSkyjoPlayers(ctx, width, height, state, hiddenHands, language, hitAreas, layout, localPlayerId, elapsed)
    return
  }
  const sideInset = isCabo && phoneSized ? Math.max(30, 54 * layout.scale) : Math.max(74, 122 * layout.scale)
  const topInset = isCabo ? Math.max(layout.cardH * 0.36, phoneSized ? 58 * layout.scale : 82 * layout.scale) : Math.max(layout.cardH * 0.44, 96 * layout.scale)
  const bottomInset = isCabo ? Math.max(layout.cardH * 0.62, phoneSized ? 92 * layout.scale : 132 * layout.scale) : Math.max(layout.cardH * 0.64, 118 * layout.scale)
  const positions = [
    { x: width / 2, y: height - bottomInset, align: 'bottom' },
    { x: width - sideInset, y: isCabo && phoneSized ? height * 0.34 : height / 2, align: 'right' },
    { x: width / 2, y: topInset, align: 'top' },
    { x: sideInset, y: isCabo && phoneSized ? height * 0.66 : height / 2, align: 'left' },
  ] as const

  const displayPlayers = getDisplayPlayers(state, localPlayerId)
  const viewerId = caboViewerId(state, localPlayerId)
  displayPlayers.forEach((player, index) => {
    const pos = positions[index]
    const isCurrent = player.id === current.id
    const isLocalSinglePlayer = state.config.mode === 'single' && activePlayer(state).type === 'human'
    const isHotSeatCurrentPlayer = state.config.mode === 'hotseat' && isCurrent
    const isSpectacularCurrentPlayer = state.config.mode === 'spectacular' && isCurrent
    const isLocalWifiPlayer = state.config.mode === 'wifi' && current.id === localPlayerId
    const controlsCurrentTurn = Boolean((isLocalSinglePlayer || isHotSeatCurrentPlayer || isSpectacularCurrentPlayer || isLocalWifiPlayer) && !hiddenHands)
    const canInteract = Boolean(controlsCurrentTurn && (state.config.game === 'cabo' && state.pendingCaboPower ? true : isCurrent && (state.zeroTurn?.drawnCard || state.zeroTurn?.source === 'reveal')))
    const labelY = pos.align === 'top' ? pos.y - (isCabo ? 64 : 82) * layout.scale : pos.y
    drawPlayerLabel(ctx, pos.x, labelY, pos.align, playerName(language, player.name), zeroGridCardCount(player), player.score, isCurrent, language, layout, player.avatarId, elapsed)
    drawZeroGrid(ctx, pos.x, pos.y, pos.align, player, state, language, hitAreas, layout, canInteract, height, viewerId)
  })
}

function drawSkyjoPlayers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  hiddenHands: boolean,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  localPlayerId?: string,
  elapsed = 999,
) {
  const current = activePlayer(state)
  const displayPlayers = getDisplayPlayers(state, localPlayerId)
  const seats = skyjoGridGeometry(width, height, layout)
  displayPlayers.slice(0, 4).forEach((player, index) => {
    const seat = seats[index]
    if (!seat) return
    const isCurrent = player.id === current.id
    const isLocalSinglePlayer = state.config.mode === 'single' && activePlayer(state).type === 'human'
    const isHotSeatCurrentPlayer = state.config.mode === 'hotseat' && isCurrent
    const isSpectacularCurrentPlayer = state.config.mode === 'spectacular' && isCurrent
    const isLocalWifiPlayer = state.config.mode === 'wifi' && current.id === localPlayerId
    const controlsCurrentTurn = Boolean((isLocalSinglePlayer || isHotSeatCurrentPlayer || isSpectacularCurrentPlayer || isLocalWifiPlayer) && !hiddenHands)
    const canInteract = Boolean(controlsCurrentTurn && isCurrent && (state.zeroTurn?.drawnCard || state.zeroTurn?.source === 'reveal'))
    drawPlayerLabel(ctx, seat.labelAnchorX, seat.labelAnchorY, seat.align, playerName(language, player.name), zeroGridCardCount(player), player.score, isCurrent, language, layout, player.avatarId, elapsed)
    drawSkyjoGrid(ctx, seat, player, state, language, hitAreas, canInteract)
  })
}

function drawSkyjoGrid(
  ctx: CanvasRenderingContext2D,
  seat: SkyjoGridSeat,
  player: Player,
  state: GameState,
  language: Language,
  hitAreas: HitArea[],
  canInteract: boolean,
) {
  const grid = player.zeroGrid ?? []
  for (let index = 0; index < Math.max(12, grid.length); index += 1) {
    const slot = grid[index]
    const col = index % 4
    const row = Math.floor(index / 4)
    const sx = seat.gridRect.x + col * (seat.cardW + seat.gap)
    const sy = seat.gridRect.y + row * (seat.cardH + seat.gap)
    const slotPlayable = canInteract && Boolean(slot?.card && (state.zeroTurn?.source !== 'reveal' || !slot.faceUp))
    if (!slot?.card) {
      drawZeroEmptySlot(ctx, sx, sy, seat.cardW, seat.cardH, false)
    } else if (slot.faceUp) {
      drawCard(ctx, slot.card, sx, sy, seat.cardW, seat.cardH, slotPlayable, language, state.config.game)
    } else {
      drawCardBack(ctx, sx, sy, seat.cardW, seat.cardH, state.config.deckTheme)
      if (slotPlayable) {
        ctx.save()
        ctx.strokeStyle = '#f7dd68'
        ctx.lineWidth = Math.max(2, 3 * Math.max(0.45, seat.cardW / BASE_CARD_W))
        roundedRect(ctx, sx, sy, seat.cardW, seat.cardH, 8)
        ctx.stroke()
        ctx.restore()
      }
    }
    hitAreas.push({
      id: `zero-slot:${player.id}:${index}`,
      card: slot?.card ?? zeroPlaceholderCard(index),
      playable: slotPlayable,
      source: 'zeroGrid',
      reason: slotPlayable ? gridReason(language, state) : t(language, 'waitForTurn'),
      x: sx,
      y: sy,
      w: seat.cardW,
      h: seat.cardH,
    })
  }
}

function zeroGridCardCount(player: Player): number {
  return (player.zeroGrid ?? []).filter((slot) => slot.card).length
}

function drawZeroGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  align: 'bottom' | 'top' | 'left' | 'right',
  player: Player,
  state: GameState,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  canInteract: boolean,
  tableHeight: number,
  viewerId?: string | null,
) {
  const grid = player.zeroGrid ?? []
  const columnCount = state.config.game === 'cabo' ? 2 : state.config.game === 'skyjo' ? 4 : 3
  const slotCount = Math.max(state.config.game === 'cabo' ? 4 : state.config.game === 'skyjo' ? 12 : 6, grid.length)
  const rowCount = Math.ceil(slotCount / columnCount)
  const phoneSized = state.config.game === 'cabo' && tableHeight <= 620
  const cardScale = state.config.game === 'cabo'
    ? phoneSized ? (align === 'bottom' ? 0.58 : 0.34) : (align === 'bottom' ? 0.62 : 0.44)
    : state.config.game === 'skyjo'
      ? (align === 'bottom' ? 0.5 : 0.32)
    : rowCount > 2 ? (align === 'bottom' ? 0.56 : 0.4) : (align === 'bottom' ? 0.66 : 0.48)
  const cardW = layout.cardW * cardScale
  const cardH = layout.cardH * cardScale
  const gap = Math.max(5, 7 * layout.scale)
  const totalW = cardW * columnCount + gap * (columnCount - 1)
  const totalH = cardH * rowCount + gap * (rowCount - 1)
  const originX = align === 'left' ? x + 20 * layout.scale : align === 'right' ? x - totalW - 20 * layout.scale : x - totalW / 2
  const bottomLabelBottom = y - (state.config.game === 'cabo' ? 76 : 88) * layout.scale
  const bottomGridY = Math.min(tableHeight - totalH - 8 * layout.scale, bottomLabelBottom + (state.config.game === 'cabo' ? 28 : 12) * layout.scale)
  const originY =
    align === 'bottom'
      ? bottomGridY
      : align === 'top'
        ? y + 12 * layout.scale
        : y - totalH / 2

  for (let index = 0; index < slotCount; index += 1) {
    const slot = grid[index]
    const slotPlayable = canInteract && (state.config.game !== 'skyjo' || Boolean(slot?.card && (state.zeroTurn?.source !== 'reveal' || !slot.faceUp)))
    const col = index % columnCount
    const row = Math.floor(index / columnCount)
    const sx = originX + col * (cardW + gap)
    const sy = originY + row * (cardH + gap)
    if (!slot?.card) {
      drawZeroEmptySlot(ctx, sx, sy, cardW, cardH, slotPlayable)
    } else if (slot.faceUp || canViewCaboSlot(state, slot, viewerId)) {
      drawCard(ctx, slot.card, sx, sy, cardW, cardH, slotPlayable, language, state.config.game)
    } else {
      drawCardBack(ctx, sx, sy, cardW, cardH, state.config.deckTheme)
      if (slotPlayable) {
        ctx.save()
        ctx.strokeStyle = '#f7dd68'
        ctx.lineWidth = Math.max(3, 4 * layout.scale)
        roundedRect(ctx, sx, sy, cardW, cardH, 10)
        ctx.stroke()
        ctx.restore()
      }
    }
    hitAreas.push({
      id: `zero-slot:${player.id}:${index}`,
      card: slot?.card ?? zeroPlaceholderCard(index),
      playable: slotPlayable,
      source: 'zeroGrid',
      reason: slotPlayable ? gridReason(language, state) : t(language, 'waitForTurn'),
      x: sx,
      y: sy,
      w: cardW,
      h: cardH,
    })
  }
}

function drawZeroEmptySlot(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, raised: boolean) {
  ctx.save()
  ctx.strokeStyle = raised ? '#f7dd68' : 'rgba(255, 255, 255, 0.28)'
  ctx.lineWidth = raised ? 4 : 2
  ctx.setLineDash([7, 7])
  roundedRect(ctx, x, y, w, h, 10)
  ctx.stroke()
  ctx.restore()
}

function zeroPlaceholderCard(index: number): Card {
  return {
    id: `zero-empty-${index}`,
    kind: 'number',
    color: 'wild',
    value: 0,
    label: 'Empty',
    points: 0,
  }
}

function zeroGridReason(language: Language): string {
  if (language === 'zh') return '可移动：点击此方格来放置刚抽到的牌。'
  if (language === 'de') return 'Spielbar: Lege die gezogene Karte in dieses Rasterfeld.'
  return 'Movable because you can place the drawn card in this grid slot.'
}

function gridReason(language: Language, state: GameState): string {
  if (state.config.game === 'cabo' && state.pendingCaboPower) return caboGridReason(language, state.pendingCaboPower.kind, Boolean(state.pendingCaboPower.firstSlot))
  if (state.config.game === 'skyjo' && state.zeroTurn?.source === 'reveal') {
    if (language === 'zh') return '可移动：翻开这张隐藏牌。'
    if (language === 'de') return 'Spielbar: Decke diese verdeckte Karte auf.'
    return 'Movable because you can reveal this hidden card.'
  }
  return zeroGridReason(language)
}

function caboGridReason(language: Language, kind: 'peek' | 'spy' | 'swap', hasFirstSlot: boolean): string {
  if (language === 'zh') {
    if (kind === 'peek') return 'Peek：选择自己的牌来查看。'
    if (kind === 'spy') return 'Spy：选择其他玩家的一张牌来查看。'
    return hasFirstSlot ? 'Swap：选择第二张牌完成交换。' : 'Swap：选择第一张要交换的牌。'
  }
  if (language === 'de') {
    if (kind === 'peek') return 'Peek: Wahle eine eigene Karte.'
    if (kind === 'spy') return 'Spy: Wahle eine gegnerische Karte.'
    return hasFirstSlot ? 'Swap: Wahle die zweite Karte.' : 'Swap: Wahle die erste Karte.'
  }
  if (kind === 'peek') return 'Peek: choose one of your own cards.'
  if (kind === 'spy') return 'Spy: choose one card from another player.'
  return hasFirstSlot ? 'Swap: choose the second card.' : 'Swap: choose the first card.'
}

function caboViewerId(state: GameState, localPlayerId?: string): string | null {
  if (state.config.game !== 'cabo') return null
  if (state.winnerId) return null
  if (state.config.mode === 'wifi') return localPlayerId ?? null
  if (state.config.mode === 'single') return state.players.find((player) => player.type === 'human')?.id ?? null
  return activePlayer(state).id
}

function canViewCaboSlot(state: GameState, slot: ZeroGridSlot, viewerId?: string | null): boolean {
  if (state.config.game !== 'cabo') return false
  if (state.winnerId) return true
  return Boolean(viewerId && slot.knownByPlayerIds?.includes(viewerId))
}

function isGridMemoryGame(game: GameState['config']['game']): boolean {
  return game === 'zero' || game === 'cabo' || game === 'skyjo'
}

export function tooltipCardEffectForTest(language: Language, card: Card, state: GameState): string {
  return tooltipCardEffect(language, card, state)
}

function tooltipCardEffect(language: Language, card: Card, state: GameState): string {
  if (state.config.game === 'marioKart' && card.kind === 'wildItemBox') {
    if (language === 'zh') {
      return '道具箱：选择颜色和绿龟壳目标，然后翻开摸牌堆顶牌。红色=蘑菇：你再行动一次；黄色=香蕉皮：前一位玩家摸2；绿色=绿龟壳：目标摸1；蓝色=闪电：其他所有玩家各摸1且你再行动；万能=炸弹兵：你摸2。'
    }
    if (language === 'de') {
      return 'Item-Box: Waehle Farbe und Gruener-Panzer-Ziel, dann decke die oberste Karte auf. Rot=Pilz: du spielst erneut; Gelb=Bananenschale: vorheriger Spieler zieht 2; Gruen=Gruener Panzer: Ziel zieht 1; Blau=Blitz: alle anderen ziehen 1 und du spielst erneut; Wild=Bob-omb: du ziehst 2.'
    }
    return 'Item Box: choose a color and Green Shell target, then reveal the top stock card. Red=Mushroom: play again; Yellow=Banana Peel: previous player draws 2; Green=Green Shell: target draws 1; Blue=Lightning: all others draw 1 and you play again; Wild=Bob-omb: you draw 2.'
  }
  if (state.config.game === 'cabo') {
    const power = caboPowerKind(card)
    if (power === 'peek') {
      if (language === 'zh') return 'Cabo Peek：从牌库摸到 7/8 并弃掉时，查看自己的一张方格牌。'
      if (language === 'de') return 'Cabo Peek: Wenn du eine gezogene 7/8 ablegst, siehst du eine eigene Rasterkarte an.'
      return 'Cabo Peek: discard a drawn 7/8 to look at one of your own grid cards.'
    }
    if (power === 'spy') {
      if (language === 'zh') return 'Cabo Spy：从牌库摸到 9/10 并弃掉时，查看其他玩家的一张方格牌。'
      if (language === 'de') return 'Cabo Spy: Wenn du eine gezogene 9/10 ablegst, siehst du eine gegnerische Rasterkarte an.'
      return 'Cabo Spy: discard a drawn 9/10 to look at one card from another player.'
    }
    if (power === 'swap') {
      if (language === 'zh') return 'Cabo Swap：从牌库摸到 11/12 并弃掉时，选择两张方格牌交换。'
      if (language === 'de') return 'Cabo Swap: Wenn du eine gezogene 11/12 ablegst, tauschst du zwei Rasterkarten.'
      return 'Cabo Swap: discard a drawn 11/12 to swap two grid cards.'
    }
    if (card.kind === 'number') {
      if (language === 'zh') return 'Cabo 数字牌：点数越低越好。'
      if (language === 'de') return 'Cabo-Zahlenkarte: Niedrige Punkte sind besser.'
      return 'Cabo number card: lower points are better.'
    }
  }
  return cardEffect(language, card)
}

function caboPowerKind(card: Card): 'peek' | 'spy' | 'swap' | null {
  if (card.kind !== 'number') return null
  if (card.value === 7 || card.value === 8) return 'peek'
  if (card.value === 9 || card.value === 10) return 'spy'
  if (card.value === 11 || card.value === 12) return 'swap'
  return null
}

function speedPlayReason(language: Language): string {
  if (language === 'zh') return '可出：它与弃牌堆顶牌颜色和符号/数字完全相同，可以抢出。'
  if (language === 'de') return 'Spielbar: Exakte Farbe und Zahl/Symbol passen, daher ist Speed Play moglich.'
  return 'Movable because it exactly matches the top card for Speed Play.'
}

function teamPassReason(language: Language): string {
  if (language === 'zh') return '可移动：选择这张牌传给你的队友，然后你摸 1 张牌并结束回合。'
  if (language === 'de') return 'Spielbar: Gib diese Karte an deinen Partner, ziehe 1 Karte und beende deinen Zug.'
  return 'Movable because you can pass this card to your partner, then draw 1 and end your turn.'
}

function skipBoBuildPileLabel(language: Language, nextValue: number): string {
  if (language === 'zh') return `需 ${nextValue}`
  if (language === 'de') return `Braucht ${nextValue}`
  return `Needs ${nextValue}`
}

function skipBoBuildPileDoneLabel(language: Language): string {
  if (language === 'zh') return '完成'
  if (language === 'de') return 'Fertig'
  return 'Done'
}

function skipBoStockPileLabel(language: Language, count: number, compact = false): string {
  if (compact) return `S ${count}`
  if (language === 'zh') return `库存 ${count}`
  if (language === 'de') return `Stock ${count}`
  return `Stock ${count}`
}

function skipBoPlayerStatus(language: Language, player: Player): string {
  const stock = player.skipBoStockPile?.length ?? 0
  const hand = player.hand.length
  if (language === 'zh') return `库存 ${stock} | 手牌 ${hand}`
  if (language === 'de') return `Stock ${stock} | Hand ${hand}`
  return `Stock ${stock} | Hand ${hand}`
}

function skipBoBuildReason(language: Language): string {
  if (language === 'zh') return '可移动：这张牌正好是某个建筑堆需要的下一张。'
  if (language === 'de') return 'Spielbar: Diese Karte ist die nachste Zahl fur einen Bau-Stapel.'
  return 'Movable because this card is the next needed value for a building pile.'
}

function skipBoNotBuildReason(language: Language): string {
  if (language === 'zh') return '现在不能建造：它不是任何建筑堆需要的下一张。'
  if (language === 'de') return 'Nicht spielbar: Kein Bau-Stapel braucht diese Zahl.'
  return 'Not movable because no building pile needs this value right now.'
}

function skipBoDiscardReason(language: Language): string {
  if (language === 'zh') return '可移动：将这张手牌弃到已选择的 Skip-Bo 弃牌堆并结束回合。'
  if (language === 'de') return 'Spielbar: Lege diese Handkarte auf den gewahlten Skip-Bo-Ablagestapel und beende den Zug.'
  return 'Movable because it will go to the selected Skip-Bo discard pile and end your turn.'
}

function usesCompactMobileUnoLayout(game: GameState['config']['game'], width: number, height: number, playerCount: number, mobileInput = false): boolean {
  const phoneSized = width <= 520 || (width <= 760 && height <= 620) || (width <= 980 && height <= 520) || (mobileInput && width <= 1180 && height <= 900)
  if (!phoneSized) return false
  if (playerCount > 4) return false
  return !['zero', 'cabo', 'skyjo', 'dos', 'phase10', 'skipBo', 'mahjong', 'guoUnoMahjong'].includes(game)
}

function drawPlayers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  hiddenHands: boolean,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  localPlayerId?: string,
  passModePlayerId?: string | null,
  elapsed = 999,
  mobileInput = false,
  penaltyDrawHighlight: PenaltyDrawHighlight | null = null,
  roundStartDealCover: RoundStartDealCover | null = null,
) {
  const current = activePlayer(state)
  const displayPlayers = getDisplayPlayers(state, localPlayerId)
  if (state.config.game === 'phase10') {
    drawPhase10Players(ctx, width, height, state, hiddenHands, language, hitAreas, layout, localPlayerId, elapsed)
    return
  }
  if (state.config.game === 'dos') {
    drawDosPlayers(ctx, width, height, state, hiddenHands, language, hitAreas, layout, localPlayerId, elapsed)
    return
  }
  if (usesCompactMobileUnoLayout(state.config.game, width, height, displayPlayers.length, mobileInput)) {
    drawCompactMobileUnoPlayers(ctx, width, height, state, hiddenHands, language, hitAreas, layout, localPlayerId, passModePlayerId ?? null, elapsed, mobileInput, penaltyDrawHighlight, roundStartDealCover)
    return
  }
  const sideInset = Math.max(64, 112 * layout.scale)
  const topInset = Math.max(layout.cardH * 0.48, 108 * layout.scale)
  const bottomInset = Math.max(layout.cardH * 0.7, 96 * layout.scale)
  const positions = [
    { x: width / 2, y: height - bottomInset, align: 'bottom' },
    { x: width - sideInset, y: height / 2, align: 'right' },
    { x: width / 2, y: topInset, align: 'top' },
    { x: sideInset, y: height / 2, align: 'left' },
  ] as const

  if ((state.config.game === 'party' || state.config.game === 'allWild' || state.config.game === 'challenge' || state.config.game === 'noMercy' || state.config.game === 'superMario' || state.config.game === 'marioKart') && displayPlayers.length > 4) {
    drawPartyPlayers(ctx, width, height, state, hiddenHands, language, hitAreas, layout, displayPlayers, localPlayerId, elapsed, roundStartDealCover?.hideAllHands ?? false)
    return
  }
  displayPlayers.forEach((player, index) => {
    const pos = positions[index]
    const isCurrent = player.id === current.id
    const isLocalSinglePlayer = state.config.mode === 'single' && index === 0 && player.type === 'human'
    const isHotSeatCurrentPlayer = state.config.mode === 'hotseat' && isCurrent
    const isSpectacularCurrentPlayer = state.config.mode === 'spectacular' && isCurrent
    const isLocalWifiPlayer = state.config.mode === 'wifi' && player.id === localPlayerId
    const isFaceUpHumanHand = (isLocalSinglePlayer || isHotSeatCurrentPlayer || isSpectacularCurrentPlayer) && !hiddenHands
    const isFaceUpWifiHand = isLocalWifiPlayer && !hiddenHands
    drawPlayerLabel(ctx, pos.x, pos.y, pos.align, playerName(language, player.name), player.hand.length, player.score, isCurrent, language, layout, player.avatarId, elapsed)
    if (roundStartDealCover?.hideAllHands) return

    if (isFaceUpHumanHand || isFaceUpWifiHand) {
      drawHumanHand(
        ctx,
        width,
        height,
        player,
        state,
        language,
        isCurrent && (state.config.mode !== 'wifi' || isLocalWifiPlayer),
        hitAreas,
        layout,
        passModePlayerId === player.id,
        false,
        false,
        penaltyDrawHighlightCardIds(penaltyDrawHighlight, player.id),
        penaltyDrawHighlight?.ageMs ?? 999,
      )
    } else {
      drawOpponentHand(ctx, pos.x, pos.y, pos.align, player.hand.length, layout, state.config.deckTheme)
    }
  })
}

function drawCompactMobileUnoPlayers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  hiddenHands: boolean,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  localPlayerId?: string,
  passModePlayerId?: string | null,
  elapsed = 999,
  mobileInput = false,
  penaltyDrawHighlight: PenaltyDrawHighlight | null = null,
  roundStartDealCover: RoundStartDealCover | null = null,
) {
  const current = activePlayer(state)
  const displayPlayers = getDisplayPlayers(state, localPlayerId).slice(0, 4)
  const geometry = triplePlayLayoutGeometry(width, height, layout, displayPlayers.length, displayPlayers[0]?.hand.length || 7, mobileInput)

  displayPlayers.forEach((player, index) => {
    const seat = geometry.seats[index]
    if (!seat) return
    const isCurrent = player.id === current.id
    const isLocalSinglePlayer = state.config.mode === 'single' && index === 0 && player.type === 'human'
    const isHotSeatCurrentPlayer = state.config.mode === 'hotseat' && isCurrent
    const isSpectacularCurrentPlayer = state.config.mode === 'spectacular' && isCurrent
    const isLocalWifiPlayer = state.config.mode === 'wifi' && player.id === localPlayerId
    const isFaceUpHumanHand = (isLocalSinglePlayer || isHotSeatCurrentPlayer || isSpectacularCurrentPlayer) && !hiddenHands
    const isFaceUpWifiHand = isLocalWifiPlayer && !hiddenHands

    if (index === 0) {
      drawPlayerLabel(ctx, seat.x, seat.y, 'bottom', playerName(language, player.name), player.hand.length, player.score, isCurrent, language, layout, player.avatarId, elapsed)
      if (roundStartDealCover?.hideAllHands) return
      if (state.config.game === 'dice' || isFaceUpHumanHand || isFaceUpWifiHand) {
        drawHumanHand(
          ctx,
          width,
          height,
          player,
          state,
          language,
          isCurrent && (state.config.mode !== 'wifi' || isLocalWifiPlayer),
          hitAreas,
          layout,
          passModePlayerId === player.id,
          false,
          mobileInput,
          penaltyDrawHighlightCardIds(penaltyDrawHighlight, player.id),
          penaltyDrawHighlight?.ageMs ?? 999,
        )
      } else {
        drawOpponentHand(ctx, seat.x, seat.y, 'bottom', player.hand.length, layout, state.config.deckTheme)
      }
      return
    }

    drawCompactPlayerSeat(ctx, seat.x, seat.y, player, isCurrent, language, layout, elapsed)
    if (roundStartDealCover?.hideAllHands) return
    if (state.config.game === 'dice') {
      drawCompactDiceStack(ctx, seat.x, seat.y, seat.align === 'bottom' ? 'top' : seat.align, player.hand, layout, language, seat.align === 'top' ? 30 : 14)
    } else {
      drawCompactOpponentStack(ctx, seat.x, seat.y, seat.align === 'bottom' ? 'top' : seat.align, player.hand.length, layout, state.config.deckTheme, seat.align === 'top' ? 30 : 14)
    }
  })
}

function drawSkipBoPlayers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  hiddenHands: boolean,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  localPlayerId?: string,
  skipBoDiscardMode = false,
  elapsed = 999,
) {
  const current = activePlayer(state)
  const displayPlayers = getDisplayPlayers(state, localPlayerId)
  const bottom = displayPlayers[0]
  const bottomIsCurrent = bottom?.id === current.id
  const bottomIsLocalSinglePlayer = state.config.mode === 'single' && bottom?.type === 'human'
  const bottomIsHotSeatCurrentPlayer = state.config.mode === 'hotseat' && bottomIsCurrent
  const bottomIsSpectacularCurrentPlayer = state.config.mode === 'spectacular' && bottomIsCurrent
  const bottomIsLocalWifiPlayer = state.config.mode === 'wifi' && bottom?.id === localPlayerId
  const bottomFaceUp = Boolean((bottomIsLocalSinglePlayer || bottomIsHotSeatCurrentPlayer || bottomIsSpectacularCurrentPlayer || bottomIsLocalWifiPlayer) && !hiddenHands)

  if (!bottom) return
  if (displayPlayers.length > 4) {
    const bottomY = height - Math.max(layout.cardH * 0.7, 96 * layout.scale)
    const labelY = bottomY - 112 * layout.scale
    drawSkipBoPlayerLabel(ctx, width / 2, labelY, playerName(language, bottom.name), bottom, bottomIsCurrent, language, layout, bottom.avatarId, elapsed)
    drawSkipBoPileRow(ctx, width / 2, skipBoBottomPileY(labelY, layout), bottom, state, language, hitAreas, layout, bottomIsCurrent && (state.config.mode !== 'wifi' || bottomIsLocalWifiPlayer), 'bottom')
    if (bottomFaceUp) {
      drawHumanHand(ctx, width, height, bottom, state, language, bottomIsCurrent && (state.config.mode !== 'wifi' || bottomIsLocalWifiPlayer), hitAreas, layout, false, skipBoDiscardMode)
    } else {
      drawOpponentHand(ctx, width / 2, bottomY, 'bottom', bottom.hand.length, layout, state.config.deckTheme)
    }

    const seats = partyOpponentSeats(width, height, layout, displayPlayers.length - 1)
    displayPlayers.slice(1).forEach((player, index) => {
      const seat = seats[index]
      if (!seat) return
      const isCurrent = player.id === current.id
      drawSkipBoPlayerLabel(ctx, seat.x, seat.y, playerName(language, player.name), player, isCurrent, language, layout, player.avatarId, elapsed, true)
      drawSkipBoPileRow(ctx, seat.x, seat.y + 28 * layout.scale, player, state, language, hitAreas, layout, false, seat.align)
      drawCompactOpponentStack(ctx, seat.x, seat.y, seat.align, player.hand.length, layout, state.config.deckTheme, 70)
    })
    return
  }

  const geometry = phase10LayoutGeometry(width, height, layout, displayPlayers.length, Math.max(5, bottom.hand.length || 5))
  displayPlayers.forEach((player, index) => {
    const seat = geometry.seats[index]
    if (!seat) return
    const isCurrent = player.id === current.id
    const isLocalSinglePlayer = state.config.mode === 'single' && index === 0 && player.type === 'human'
    const isHotSeatCurrentPlayer = state.config.mode === 'hotseat' && isCurrent
    const isSpectacularCurrentPlayer = state.config.mode === 'spectacular' && isCurrent
    const isLocalWifiPlayer = state.config.mode === 'wifi' && player.id === localPlayerId
    const isFaceUp = (isLocalSinglePlayer || isHotSeatCurrentPlayer || isSpectacularCurrentPlayer || isLocalWifiPlayer) && !hiddenHands
    const labelY = index === 0 ? seat.y - 112 * layout.scale : seat.y

    drawSkipBoPlayerLabel(ctx, seat.x, labelY, playerName(language, player.name), player, isCurrent, language, layout, player.avatarId, elapsed, index !== 0)
    const pileY = index === 0 ? skipBoBottomPileY(labelY, layout) : labelY + 28 * layout.scale
    drawSkipBoPileRow(ctx, seat.x, pileY, player, state, language, hitAreas, layout, isCurrent && (state.config.mode !== 'wifi' || isLocalWifiPlayer), seat.align)

    if (index === 0) {
      if (isFaceUp) {
        drawHumanHand(ctx, width, height, player, state, language, isCurrent && (state.config.mode !== 'wifi' || isLocalWifiPlayer), hitAreas, layout, false, skipBoDiscardMode)
      } else {
        drawOpponentHand(ctx, seat.x, seat.y, 'bottom', player.hand.length, layout, state.config.deckTheme)
      }
      return
    }
    drawCompactOpponentStack(ctx, seat.x, labelY, seat.align === 'bottom' ? 'top' : seat.align, player.hand.length, layout, state.config.deckTheme, 70)
  })
}

function drawSkipBoPlayerLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  name: string,
  player: Player,
  active: boolean,
  language: Language,
  layout: TableLayout,
  avatarId: AvatarId,
  elapsed: number,
  compact = false,
) {
  const centerX = Math.round(x)
  const centerY = Math.round(y)
  const width = Math.round(Math.max(compact ? 104 : 148, (compact ? 134 : 190) * layout.scale))
  const height = Math.round(Math.max(compact ? 34 : 42, (compact ? 40 : 50) * layout.scale))
  const top = Math.round(centerY - height / 2)
  if (active && elapsed < 640) {
    const pulse = 0.5 + Math.sin((elapsed / 640) * Math.PI) * 0.5
    ctx.save()
    ctx.globalAlpha = 0.3 * pulse
    ctx.fillStyle = '#f7dd68'
    roundedRect(ctx, centerX - width / 2 - 6, top - 5, width + 12, height + 10, 12)
    ctx.fill()
    ctx.restore()
  }
  ctx.fillStyle = active ? 'rgba(255, 219, 91, 0.95)' : 'rgba(6, 18, 15, 0.78)'
  roundedRect(ctx, centerX - width / 2, top, width, height, 10)
  ctx.fill()
  drawAvatar(ctx, centerX - width / 2 + 19 * layout.scale, centerY, Math.max(11, 14 * layout.scale), avatarId)
  ctx.fillStyle = active ? '#17120a' : '#f7f5e7'
  ctx.textAlign = 'center'
  drawFittedText(ctx, name, centerX + 10 * layout.scale, centerY - 4 * layout.scale, width - 48 * layout.scale, Math.max(11, 14 * layout.scale), 9, '800')
  drawFittedText(ctx, skipBoPlayerStatus(language, player), centerX + 10 * layout.scale, centerY + 13 * layout.scale, width - 48 * layout.scale, Math.max(9, 11 * layout.scale), 8, '700')
}

function skipBoBottomPileY(labelY: number, layout: TableLayout): number {
  const pileCardH = layout.cardH * (layout.scale <= 0.7 ? 0.4 : 0.45)
  const labelGap = Math.max(28, 34 * layout.scale)
  const playerLabelHalf = Math.max(21, 25 * layout.scale)
  return Math.max(8, labelY - playerLabelHalf - labelGap - pileCardH)
}

function drawSkipBoPileRow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  player: Player,
  state: GameState,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  canInteract: boolean,
  align: 'bottom' | 'top' | 'left' | 'right',
) {
  const phoneSized = layout.scale <= 0.7
  const scale = phoneSized ? 0.4 : 0.45
  const cardW = layout.cardW * scale
  const cardH = layout.cardH * scale
  const gap = Math.max(4, 6 * layout.scale)
  const count = 5
  const rowW = count * cardW + (count - 1) * gap
  const startX = centerX - rowW / 2
  const piles = [player.skipBoStockPile ?? [], ...(player.skipBoDiscardPiles ?? [[], [], [], []])]

  piles.forEach((pile, index) => {
    const x = Math.round(startX + index * (cardW + gap))
    const cardY = Math.round(y)
    const top = pile.at(-1)
    if (top) {
      const sourceId = index === 0 ? `skipbo:stock:${player.id}` : `skipbo:discard:${player.id}:${index - 1}`
      const playable = canInteract && skipBoCanPlaySource(state, sourceId)
      drawCard(ctx, top, x, cardY, cardW, cardH, playable, language, state.config.game)
      if (canInteract) {
        hitAreas.push({
          id: sourceId,
          card: top,
          playable,
          source: 'skipBo',
          reason: playable ? skipBoBuildReason(language) : skipBoNotBuildReason(language),
          x,
          y: cardY,
          w: cardW,
          h: cardH,
        })
      }
    } else {
      drawEmptyPile(ctx, x, cardY, cardW, cardH)
    }
    const label = index === 0 ? skipBoStockPileLabel(language, player.skipBoStockPile?.length ?? 0, true) : `${index}`
    const labelW = Math.max(cardW, index === 0 ? 34 : 22)
    const labelX = Math.round(x + cardW / 2 - labelW / 2)
    const labelY = Math.round(cardY + cardH + 4 * layout.scale)
    ctx.fillStyle = 'rgba(6, 18, 15, 0.82)'
    roundedRect(ctx, labelX, labelY, labelW, Math.max(16, 19 * layout.scale), 5)
    ctx.fill()
    ctx.fillStyle = '#fff7cc'
    ctx.textAlign = 'center'
    drawFittedText(ctx, label, labelX + labelW / 2, labelY + 13 * layout.scale, labelW - 3, Math.max(8, 10 * layout.scale), 7, '800')
  })

  if (align === 'left' || align === 'right') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.09)'
    roundedRect(ctx, startX - 4, y - 4, rowW + 8, cardH + 23 * layout.scale, 8)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.stroke()
  }
}

function drawPhase10Players(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  hiddenHands: boolean,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  localPlayerId?: string,
  elapsed = 999,
) {
  const current = activePlayer(state)
  const displayPlayers = getDisplayPlayers(state, localPlayerId)
  if (displayPlayers.length > 4) {
    drawPartyPlayers(ctx, width, height, state, hiddenHands, language, hitAreas, layout, displayPlayers, localPlayerId, elapsed)
    return
  }
  const geometry = phase10LayoutGeometry(width, height, layout, displayPlayers.length, displayPlayers[0]?.hand.length || 10)
  displayPlayers.forEach((player, index) => {
    const seat = geometry.seats[index]
    if (!seat) return
    const isCurrent = player.id === current.id
    const isLocalSinglePlayer = state.config.mode === 'single' && index === 0 && player.type === 'human'
    const isHotSeatCurrentPlayer = state.config.mode === 'hotseat' && isCurrent
    const isSpectacularCurrentPlayer = state.config.mode === 'spectacular' && isCurrent
    const isLocalWifiPlayer = state.config.mode === 'wifi' && player.id === localPlayerId
    const isFaceUp = (isLocalSinglePlayer || isHotSeatCurrentPlayer || isSpectacularCurrentPlayer || isLocalWifiPlayer) && !hiddenHands

    if (index === 0) {
      drawPlayerLabel(ctx, seat.x, seat.y, 'bottom', playerName(language, player.name), player.hand.length, player.score, isCurrent, language, layout, player.avatarId, elapsed)
      if (isFaceUp) {
        drawHumanHand(ctx, width, height, player, state, language, isCurrent && (state.config.mode !== 'wifi' || isLocalWifiPlayer), hitAreas, layout, false)
      } else {
        drawOpponentHand(ctx, seat.x, seat.y, 'bottom', player.hand.length, layout, state.config.deckTheme)
      }
      return
    }

    drawCompactPlayerSeat(ctx, seat.x, seat.y, player, isCurrent, language, layout, elapsed)
    drawCompactOpponentStack(ctx, seat.x, seat.y, seat.align === 'bottom' ? 'top' : seat.align, player.hand.length, layout, state.config.deckTheme, 30)
  })
}

function drawDosPlayers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  hiddenHands: boolean,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  localPlayerId?: string,
  elapsed = 999,
) {
  const current = activePlayer(state)
  const displayPlayers = getDisplayPlayers(state, localPlayerId)
  const geometry = dosLayoutGeometry(width, height, layout, state.dosCenterRow?.length ?? 2, displayPlayers.length)
  displayPlayers.slice(0, 4).forEach((player, index) => {
    const seat = geometry.seats[index]
    if (!seat) return
    const isCurrent = player.id === current.id
    const isLocalSinglePlayer = state.config.mode === 'single' && index === 0 && player.type === 'human'
    const isHotSeatCurrentPlayer = state.config.mode === 'hotseat' && isCurrent
    const isSpectacularCurrentPlayer = state.config.mode === 'spectacular' && isCurrent
    const isLocalWifiPlayer = state.config.mode === 'wifi' && player.id === localPlayerId
    const isFaceUp = (isLocalSinglePlayer || isHotSeatCurrentPlayer || isSpectacularCurrentPlayer || isLocalWifiPlayer) && !hiddenHands

    if (index === 0) {
      drawPlayerLabel(ctx, seat.x, seat.y, 'bottom', playerName(language, player.name), player.hand.length, player.score, isCurrent, language, layout, player.avatarId, elapsed)
      if (isFaceUp) {
        drawHumanHand(ctx, width, height, player, state, language, isCurrent && (state.config.mode !== 'wifi' || isLocalWifiPlayer), hitAreas, layout, false)
      } else {
        drawOpponentHand(ctx, seat.x, seat.y, 'bottom', player.hand.length, layout, state.config.deckTheme)
      }
      return
    }

    drawCompactPlayerSeat(ctx, seat.x, seat.y, player, isCurrent, language, layout, elapsed)
    drawCompactOpponentStack(ctx, seat.x, seat.y, seat.align === 'bottom' ? 'top' : seat.align, player.hand.length, layout, state.config.deckTheme, 28)
  })
}

function drawPartyPlayers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  hiddenHands: boolean,
  language: Language,
  hitAreas: HitArea[],
  layout: TableLayout,
  displayPlayers: GameState['players'],
  localPlayerId?: string,
  elapsed = 999,
  hideHands = false,
) {
  const current = activePlayer(state)
  const bottomInset = Math.max(layout.cardH * 0.7, 96 * layout.scale)
  const bottomY = height - bottomInset
  const bottom = displayPlayers[0]
  const bottomIsCurrent = bottom.id === current.id
  const bottomIsLocalSinglePlayer = state.config.mode === 'single' && bottom.type === 'human'
  const bottomIsHotSeatCurrentPlayer = state.config.mode === 'hotseat' && bottomIsCurrent
  const bottomIsSpectacularCurrentPlayer = state.config.mode === 'spectacular' && bottomIsCurrent
  const bottomIsLocalWifiPlayer = state.config.mode === 'wifi' && bottom.id === localPlayerId
  const bottomFaceUp = (bottomIsLocalSinglePlayer || bottomIsHotSeatCurrentPlayer || bottomIsSpectacularCurrentPlayer || bottomIsLocalWifiPlayer) && !hiddenHands

  drawPlayerLabel(ctx, width / 2, bottomY, 'bottom', playerName(language, bottom.name), bottom.hand.length, bottom.score, bottomIsCurrent, language, layout, bottom.avatarId, elapsed)
  if (!hideHands) {
    if (bottomFaceUp) {
      drawHumanHand(ctx, width, height, bottom, state, language, bottomIsCurrent && (state.config.mode !== 'wifi' || bottomIsLocalWifiPlayer), hitAreas, layout, false)
    } else {
      drawOpponentHand(ctx, width / 2, bottomY, 'bottom', bottom.hand.length, layout, state.config.deckTheme)
    }
  }

  const opponents = displayPlayers.slice(1)
  const seats = partyOpponentSeats(width, height, layout, opponents.length)
  opponents.forEach((player, index) => {
    const seat = seats[index]
    const isCurrent = player.id === current.id
    drawCompactPlayerSeat(ctx, seat.x, seat.y, player, isCurrent, language, layout, elapsed)
    if (!hideHands) drawCompactOpponentStack(ctx, seat.x, seat.y, seat.align, player.hand.length, layout, state.config.deckTheme)
  })
}

function partyOpponentSeats(
  width: number,
  height: number,
  layout: TableLayout,
  count: number,
): Array<{ x: number; y: number; align: 'top' | 'left' | 'right' }> {
  const cx = width / 2
  const cy = height / 2
  const rx = Math.max(150, width * 0.44)
  const ry = Math.max(94, height * 0.34)
  const topPad = Math.max(38, layout.cardH * 0.36)
  const leftPad = Math.max(58, layout.cardW * 0.62)
  const rightPad = width - leftPad
  return Array.from({ length: count }, (_, index) => {
    const ratio = count === 1 ? 0.5 : index / (count - 1)
    const angle = Math.PI + ratio * Math.PI
    const rawX = cx + Math.cos(angle) * rx
    const rawY = cy + Math.sin(angle) * ry
    const x = Math.max(leftPad, Math.min(rightPad, rawX))
    const y = Math.max(topPad, Math.min(height * 0.62, rawY))
    const align = ratio < 0.18 ? 'left' : ratio > 0.82 ? 'right' : 'top'
    return { x, y, align }
  })
}

function drawCompactPlayerSeat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  player: Player,
  active: boolean,
  language: Language,
  layout: TableLayout,
  elapsed: number,
) {
  const width = Math.max(86, 118 * layout.scale)
  const height = Math.max(30, 38 * layout.scale)
  const top = y - height / 2
  if (active && elapsed < 640) {
    const pulse = 0.5 + Math.sin((elapsed / 640) * Math.PI) * 0.5
    ctx.save()
    ctx.globalAlpha = 0.3 * pulse
    ctx.fillStyle = '#f7dd68'
    roundedRect(ctx, x - width / 2 - 6, top - 5, width + 12, height + 10, 12)
    ctx.fill()
    ctx.restore()
  }
  ctx.fillStyle = active ? 'rgba(255, 219, 91, 0.95)' : 'rgba(6, 18, 15, 0.78)'
  roundedRect(ctx, x - width / 2, top, width, height, 10)
  ctx.fill()
  drawAvatar(ctx, x - width / 2 + 17 * layout.scale, y, Math.max(10, 12 * layout.scale), player.avatarId)
  ctx.fillStyle = active ? '#17120a' : '#f7f5e7'
  ctx.textAlign = 'center'
  drawFittedText(ctx, playerName(language, player.name), x + 10 * layout.scale, y - 2 * layout.scale, width - 38 * layout.scale, Math.max(10, 12 * layout.scale), 8, '800')
  drawFittedText(ctx, `${player.hand.length} ${t(language, 'cards')}`, x + 10 * layout.scale, y + 12 * layout.scale, width - 38 * layout.scale, Math.max(8, 10 * layout.scale), 7, '700')
}

function drawCompactOpponentStack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  align: 'top' | 'left' | 'right',
  count: number,
  layout: TableLayout,
  deckTheme: DeckTheme,
  topGap = 14,
) {
  const visible = Math.min(count, 5)
  const cardW = layout.cardW * 0.34
  const cardH = layout.cardH * 0.34
  const spread = Math.max(7, 10 * layout.scale)
  const stackY = align === 'top' ? y - cardH - topGap * layout.scale : y + 24 * layout.scale
  for (let index = 0; index < visible; index += 1) {
    const offset = (index - (visible - 1) / 2) * spread
    drawCardBack(ctx, x + offset - cardW / 2, stackY, cardW, cardH, deckTheme)
  }
}

function drawCompactDiceStack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  align: 'top' | 'left' | 'right',
  hand: Card[],
  layout: TableLayout,
  language: Language,
  topGap = 14,
) {
  const visible = hand.slice(0, 5)
  const dieSize = layout.cardW * 0.38
  const spread = Math.max(8, 12 * layout.scale)
  const stackY = align === 'top' ? y - dieSize - topGap * layout.scale : y + 24 * layout.scale
  visible.forEach((card, index) => {
    const offset = (index - (visible.length - 1) / 2) * spread
    drawCard(ctx, card, x + offset - dieSize / 2, stackY, dieSize, dieSize, false, language, 'dice')
  })
}

function getDisplayPlayers(state: GameState, localPlayerId?: string): GameState['players'] {
  if (state.config.mode === 'hotseat') {
    const currentIndex = state.activePlayerIndex
    if (currentIndex <= 0) return state.players
    return [...state.players.slice(currentIndex), ...state.players.slice(0, currentIndex)]
  }
  if (state.config.mode === 'spectacular') {
    const currentIndex = state.activePlayerIndex
    if (currentIndex <= 0) return state.players
    return [...state.players.slice(currentIndex), ...state.players.slice(0, currentIndex)]
  }
  if (state.config.mode !== 'wifi' || !localPlayerId) return state.players
  const localIndex = state.players.findIndex((player) => player.id === localPlayerId)
  if (localIndex <= 0) return state.players
  return [...state.players.slice(localIndex), ...state.players.slice(0, localIndex)]
}

function drawPlayerLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  align: 'bottom' | 'top' | 'left' | 'right',
  name: string,
  cards: number,
  score: number,
  active: boolean,
  language: Language,
  layout: TableLayout,
  avatarId: AvatarId,
  elapsed: number,
) {
  const labelY = align === 'bottom' ? y - 112 * layout.scale : align === 'top' ? y + 63 * layout.scale : y - 128 * layout.scale
  const labelX = align === 'left' ? x + 132 * layout.scale : align === 'right' ? x - 132 * layout.scale : x
  const labelHeight = Math.max(32, (align === 'top' ? 40 : 48) * layout.scale)
  const labelWidth = Math.max(126, 176 * layout.scale)
  const labelTop = labelY - labelHeight / 2
  if (active && elapsed < 640) {
    const pulse = 0.5 + Math.sin((elapsed / 640) * Math.PI) * 0.5
    ctx.save()
    ctx.globalAlpha = 0.3 * pulse
    ctx.fillStyle = '#f7dd68'
    roundedRect(ctx, labelX - labelWidth / 2 - 8 * layout.scale, labelTop - 7 * layout.scale, labelWidth + 16 * layout.scale, labelHeight + 14 * layout.scale, 14)
    ctx.fill()
    ctx.restore()
  }

  ctx.fillStyle = active ? 'rgba(255, 219, 91, 0.95)' : 'rgba(6, 18, 15, 0.76)'
  roundedRect(ctx, labelX - labelWidth / 2, labelTop, labelWidth, labelHeight, 12)
  ctx.fill()
  drawAvatar(ctx, labelX - labelWidth / 2 + 20 * layout.scale, labelY, Math.max(12, 15 * layout.scale), avatarId)
  ctx.fillStyle = active ? '#17120a' : '#f7f5e7'
  ctx.font = `800 ${Math.max(12, 15 * layout.scale)}px system-ui`
  ctx.textAlign = 'center'
  ctx.fillText(name, labelX, labelY - 5 * layout.scale)
  ctx.font = `600 ${Math.max(10, 12 * layout.scale)}px system-ui`
  ctx.fillText(`${cards} ${t(language, 'cards')} | ${score} ${t(language, 'points')}`, labelX, labelY + 13 * layout.scale)
}

function drawHumanHand(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  player: Player,
  state: GameState,
  language: Language,
  canInteract: boolean,
  hitAreas: HitArea[],
  layout: TableLayout,
  passMode = false,
  skipBoDiscardMode = false,
  forcePhoneSized = false,
  penaltyHighlightCardIds: Set<string> | null = null,
  penaltyHighlightAgeMs = 999,
  coverCardsWithPlaceholders = false,
) {
  const hand = player.hand
  const phoneSized = forcePhoneSized || width <= 520 || height <= 620
  const compactUnoScale = usesCompactMobileUnoLayout(state.config.game, width, height, Math.min(state.players.length, 4), forcePhoneSized)
    ? compactPhoneHandScale(hand.length, phoneSized)
    : 1
  const specialScale = state.config.game === 'phase10' && phoneSized ? 0.88 : state.config.game === 'challenge' && phoneSized ? 0.84 : 1
  const handScale = Math.min(specialScale, compactUnoScale)
  const cardW = layout.cardW * handScale
  const cardH = layout.cardH * handScale
  const sidePadding = phoneSized ? 26 : 56
  const maxSpread = Math.min(72 * layout.scale * handScale, Math.max(20 * layout.scale, (width - sidePadding) / Math.max(hand.length, 1)))
  const total = (hand.length - 1) * maxSpread + cardW
  const startX = width / 2 - total / 2
  const y = height - cardH - Math.max(8, 18 * layout.scale)

  hand.forEach((card, index) => {
    const x = startX + index * maxSpread
    const hidden = isHiddenCard(card)
    const speedPlayable = !hidden && canPartySpeedPlayCutIn(card, state, player.id)
    const discardPlayable = skipBoDiscardMode && state.config.game === 'skipBo' && state.drewThisTurn
    const playable = !hidden && ((canInteract && (isPlayable(card, state) || discardPlayable)) || speedPlayable || passMode)
    const offset = playable ? -14 * layout.scale : 0
    if (coverCardsWithPlaceholders) {
      drawOpaqueEmptyCardPlaceholder(ctx, x, y + offset, cardW, cardH, state.config.tableTheme, layout)
    } else if (hidden) {
      drawCardBack(ctx, x, y + offset, cardW, cardH, state.config.deckTheme)
    } else {
      drawCard(ctx, card, x, y + offset, cardW, cardH, playable, language, state.config.game)
    }
    if (!coverCardsWithPlaceholders && !hidden && penaltyHighlightCardIds?.has(card.id)) {
      drawPenaltyDrawCardGlow(ctx, x, y + offset, cardW, cardH, layout, penaltyHighlightAgeMs)
    }
    hitAreas.push({
      id: card.id,
      card,
      playable,
      source: 'hand',
      reason: passMode ? teamPassReason(language) : discardPlayable ? skipBoDiscardReason(language) : speedPlayable && !canInteract ? speedPlayReason(language) : canInteract ? undefined : t(language, 'waitForTurn'),
      x,
      y: y + offset,
      w: cardW,
      h: cardH,
    })
  })
}

function penaltyDrawHighlightCardIds(highlight: PenaltyDrawHighlight | null, playerId: string): Set<string> | null {
  const recipient = highlight?.animation.recipients.find((entry) => entry.playerId === playerId)
  return recipient ? new Set(recipient.cardIds) : null
}

function drawPenaltyDrawCardGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  layout: TableLayout,
  ageMs: number,
) {
  const fade = Math.max(0, 1 - ageMs / PENALTY_DRAW_CARD_HIGHLIGHT_MS)
  const pulse = 0.58 + Math.sin(ageMs / 120) * 0.42
  const pad = Math.max(3, 5 * layout.scale)
  ctx.save()
  ctx.globalAlpha = Math.min(1, 0.25 + fade * pulse)
  ctx.shadowColor = '#ffe66d'
  ctx.shadowBlur = Math.max(10, 18 * layout.scale)
  ctx.strokeStyle = '#fff3a3'
  ctx.lineWidth = Math.max(2, 4 * layout.scale)
  roundedRect(ctx, x - pad, y - pad, w + pad * 2, h + pad * 2, Math.max(8, w * 0.15))
  ctx.stroke()
  ctx.restore()
}

function isHiddenCard(card: Card): boolean {
  return card.id.startsWith('hidden-')
}

function drawOpponentHand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  align: 'bottom' | 'top' | 'left' | 'right',
  count: number,
  layout: TableLayout,
  deckTheme: DeckTheme,
) {
  const visible = Math.min(count, 8)
  for (let index = 0; index < visible; index += 1) {
    const spread = 16 * layout.scale
    const dx = align === 'left' || align === 'right' ? 0 : (index - visible / 2) * spread
    const dy = align === 'left' || align === 'right' ? (index - visible / 2) * spread : 0
    drawCardBack(ctx, x + dx - layout.cardW / 2, y + dy - layout.cardH / 2, layout.cardW * 0.62, layout.cardH * 0.62, deckTheme)
  }
}

function drawCard(ctx: CanvasRenderingContext2D, card: Card, x: number, y: number, w: number, h: number, raised: boolean, language: Language, game?: GameState['config']['game']) {
  if (game === 'dice') {
    drawDiceFace(ctx, card, x, y, w, h, raised, language)
    return
  }
  const label = cardName(language, card)
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
  ctx.shadowBlur = raised ? 18 : 9
  ctx.shadowOffsetY = raised ? 9 : 5
  const inset = Math.max(4, w * 0.076)
  const cornerRadius = Math.max(5, w * 0.13)
  ctx.fillStyle = '#f9f7ec'
  roundedRect(ctx, x, y, w, h, cornerRadius)
  ctx.fill()
  ctx.strokeStyle = raised ? '#f7dd68' : 'rgba(22, 24, 24, 0.5)'
  ctx.lineWidth = raised ? Math.max(3, w * 0.065) : Math.max(1.5, w * 0.022)
  ctx.stroke()
  ctx.shadowColor = 'transparent'
  ctx.fillStyle = colorMap[card.color]
  roundedRect(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, Math.max(4, cornerRadius * 0.75))
  ctx.fill()

  ctx.save()
  roundedRect(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, Math.max(4, cornerRadius * 0.75))
  ctx.clip()

  if (card.color === 'wild') {
    const colors: UnoColor[] = ['red', 'yellow', 'green', 'blue']
    colors.forEach((color, index) => {
      ctx.fillStyle = colorMap[color]
      ctx.beginPath()
      ctx.moveTo(x + w / 2, y + h / 2)
      ctx.arc(x + w / 2, y + h / 2, w * 0.37, (index * Math.PI) / 2, ((index + 1) * Math.PI) / 2)
      ctx.closePath()
      ctx.fill()
    })
  }

  ctx.fillStyle = card.color === 'yellow' ? '#2b2416' : '#fff'
  ctx.textAlign = 'center'
  const centerMaxSize = Math.max(12, Math.min(24, w * 0.26))
  const centerLineHeight = Math.max(12, centerMaxSize * 0.94)
  wrapText(ctx, label, x + w / 2, y + h / 2 - h * 0.05, w - inset * 3, centerLineHeight, centerMaxSize, Math.max(8, w * 0.14))
  const cornerMaxSize = Math.max(7, Math.min(12, w * 0.13))
  const cornerWidth = Math.max(22, w * 0.48)
  drawFittedText(ctx, label, x + w * 0.3, y + h * 0.2, cornerWidth, cornerMaxSize, Math.max(5, w * 0.075), '800')
  drawFittedText(ctx, label, x + w * 0.7, y + h * 0.88, cornerWidth, cornerMaxSize, Math.max(5, w * 0.075), '800')

  if (card.pack) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    roundedRect(ctx, x + 10, y + h - 38, w - 20, 20, 8)
    ctx.fill()
    ctx.fillStyle = '#fff'
    drawFittedText(ctx, card.pack.toUpperCase(), x + w / 2, y + h - 24, w - 24, 10, 7, '700')
  }
  if (card.spin) {
    ctx.strokeStyle = card.color === 'yellow' ? 'rgba(43, 36, 22, 0.86)' : 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = Math.max(2, w * 0.035)
    ctx.beginPath()
    ctx.arc(x + w / 2, y + h / 2 + h * 0.08, w * 0.22, -Math.PI * 0.25, Math.PI * 1.25)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x + w / 2, y + h / 2 + h * 0.08, w * 0.12, Math.PI * 0.85, Math.PI * 2.2)
    ctx.stroke()
  }
  if (card.flexFlip) {
    ctx.fillStyle = card.color === 'yellow' ? 'rgba(43, 36, 22, 0.86)' : 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.arc(x + w - 24, y + 28, Math.max(8, w * 0.09), 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = card.color === 'yellow' ? '#fff' : '#0b1511'
    drawFittedText(ctx, 'P', x + w - 24, y + 32, 16, 12, 7, '900')
  }
  if (card.liar) {
    ctx.strokeStyle = card.color === 'yellow' ? 'rgba(43, 36, 22, 0.86)' : 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = Math.max(2, w * 0.035)
    ctx.beginPath()
    ctx.arc(x + w / 2, y + h / 2, w * 0.26, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = card.color === 'yellow' ? '#2b2416' : '#fff'
    drawFittedText(ctx, 'LIAR', x + w / 2, y + h / 2 + h * 0.22, w * 0.55, 12, 7, '900')
  }
  if (game === 'cabo') {
    drawCaboPowerIcon(ctx, card, x, y, w, h)
  }
  ctx.restore()
  ctx.restore()
}

function drawDiceFace(ctx: CanvasRenderingContext2D, card: Card, x: number, y: number, w: number, h: number, raised: boolean, language: Language) {
  const label = cardName(language, card)
  const size = Math.min(w, h)
  const dx = x + (w - size) / 2
  const dy = y + (h - size) / 2
  const radius = Math.max(7, size * 0.15)
  const inset = Math.max(4, size * 0.1)
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.38)'
  ctx.shadowBlur = raised ? 18 : 10
  ctx.shadowOffsetY = raised ? 9 : 5
  ctx.fillStyle = '#f8f0cf'
  roundedRect(ctx, dx, dy, size, size, radius)
  ctx.fill()
  ctx.strokeStyle = raised ? '#f7dd68' : 'rgba(58, 46, 27, 0.72)'
  ctx.lineWidth = raised ? Math.max(3, size * 0.07) : Math.max(1.5, size * 0.035)
  ctx.stroke()
  ctx.shadowColor = 'transparent'

  const faceX = dx + inset
  const faceY = dy + inset
  const faceW = size - inset * 2
  roundedRect(ctx, faceX, faceY, faceW, faceW, Math.max(5, radius * 0.72))
  ctx.fillStyle = colorMap[card.color]
  ctx.fill()

  if (card.color === 'wild') {
    const colors: UnoColor[] = ['red', 'yellow', 'green', 'blue']
    ctx.save()
    roundedRect(ctx, faceX, faceY, faceW, faceW, Math.max(5, radius * 0.72))
    ctx.clip()
    colors.forEach((color, index) => {
      ctx.fillStyle = colorMap[color]
      ctx.beginPath()
      ctx.moveTo(faceX + faceW / 2, faceY + faceW / 2)
      ctx.arc(faceX + faceW / 2, faceY + faceW / 2, faceW * 0.72, (index * Math.PI) / 2, ((index + 1) * Math.PI) / 2)
      ctx.closePath()
      ctx.fill()
    })
    ctx.restore()
  }

  ctx.fillStyle = card.color === 'yellow' ? '#211909' : '#ffffff'
  ctx.textAlign = 'center'
  drawFittedText(ctx, label, dx + size / 2, dy + size * 0.55, faceW - 8, Math.max(14, size * 0.34), Math.max(7, size * 0.13), '900')
  ctx.fillStyle = 'rgba(47, 35, 17, 0.82)'
  ctx.beginPath()
  ctx.arc(dx + size * 0.16, dy + size * 0.16, Math.max(1.5, size * 0.025), 0, Math.PI * 2)
  ctx.arc(dx + size * 0.84, dy + size * 0.84, Math.max(1.5, size * 0.025), 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawCaboPowerIcon(ctx: CanvasRenderingContext2D, card: Card, x: number, y: number, w: number, h: number) {
  const kind = caboPowerKind(card)
  if (!kind) return
  const radius = Math.max(7, w * 0.13)
  const cx = x + w / 2
  const cy = y + h * 0.72
  ctx.save()
  ctx.fillStyle = card.color === 'yellow' ? 'rgba(43, 36, 22, 0.82)' : 'rgba(255, 255, 255, 0.9)'
  ctx.strokeStyle = ctx.fillStyle
  ctx.lineWidth = Math.max(1.5, w * 0.028)
  if (kind === 'peek') {
    ctx.beginPath()
    ctx.ellipse(cx, cy, radius * 1.45, radius * 0.85, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.38, 0, Math.PI * 2)
    ctx.fill()
  } else if (kind === 'spy') {
    ctx.beginPath()
    ctx.arc(cx - radius * 0.25, cy - radius * 0.1, radius * 0.72, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx + radius * 0.3, cy + radius * 0.45)
    ctx.lineTo(cx + radius * 1.1, cy + radius * 1.15)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(cx - radius * 1.1, cy - radius * 0.42)
    ctx.lineTo(cx + radius * 0.78, cy - radius * 0.42)
    ctx.lineTo(cx + radius * 0.42, cy - radius * 0.82)
    ctx.moveTo(cx + radius * 0.78, cy - radius * 0.42)
    ctx.lineTo(cx + radius * 0.42, cy - radius * 0.02)
    ctx.moveTo(cx + radius * 1.1, cy + radius * 0.42)
    ctx.lineTo(cx - radius * 0.78, cy + radius * 0.42)
    ctx.lineTo(cx - radius * 0.42, cy + radius * 0.02)
    ctx.moveTo(cx - radius * 0.78, cy + radius * 0.42)
    ctx.lineTo(cx - radius * 0.42, cy + radius * 0.82)
    ctx.stroke()
  }
  ctx.restore()
}

function drawCardBack(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, deckTheme: DeckTheme, label = '') {
  const deck = deckPalettes[deckTheme]
  const inset = Math.max(2, Math.min(6, w * 0.08))
  const corner = Math.max(4, Math.min(10, w * 0.14))
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.34)'
  ctx.shadowBlur = Math.max(3, Math.min(12, w * 0.16))
  ctx.shadowOffsetY = Math.max(1, Math.min(5, h * 0.04))
  ctx.fillStyle = deck.border
  roundedRect(ctx, x, y, w, h, corner)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.fillStyle = deck.back
  roundedRect(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, Math.max(3, corner * 0.8))
  ctx.fill()
  ctx.strokeStyle = deck.accent
  ctx.lineWidth = Math.max(1.2, Math.min(4, w * 0.06))
  ctx.beginPath()
  ctx.ellipse(x + w / 2, y + h / 2, w * 0.26, h * 0.33, -0.4, 0, Math.PI * 2)
  ctx.stroke()
  if (label) {
    const labelStyle = cardBackLabelStyle(w, h)
    ctx.fillStyle = deck.line
    ctx.textAlign = 'center'
    drawFittedText(ctx, label, x + w / 2, y + h / 2 + labelStyle.baselineOffset, labelStyle.maxWidth, labelStyle.maxSize, labelStyle.minSize, '800')
  }
  ctx.restore()
}

function cardBackLabelStyle(width: number, height: number) {
  return {
    maxWidth: Math.max(10, width * 0.64),
    maxSize: Math.max(7, Math.min(17, width * 0.32)),
    minSize: Math.max(5, Math.min(10, width * 0.16)),
    baselineOffset: Math.max(2, Math.min(6, height * 0.045)),
  }
}

function spinTitle(language: Language): string {
  if (language === 'zh') return '旋转轮'
  if (language === 'de') return 'Spin-Rad'
  return 'Spin Wheel'
}

function spinReadyText(language: Language): string {
  if (language === 'zh') return '等待'
  if (language === 'de') return 'Bereit'
  return 'Ready'
}

function spinTriggerText(language: Language): string {
  if (language === 'zh') return '旋转牌触发'
  if (language === 'de') return 'Spin-Karten'
  return 'Spin cards'
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
    if (action === 'tradeHands') return '向左传手牌'
    if (action === 'unoSpin') return `${target} 先喊`
    return `目标：${target}`
  }
  if (language === 'de') {
    if (colorText) return `${target} / ${colorText}`
    if (action === 'tradeHands') return 'Nach links'
    if (action === 'unoSpin') return `${target} zuerst`
    return `Ziel: ${target}`
  }
  if (colorText) return `${target} / ${colorText}`
  if (action === 'tradeHands') return 'Hands passed left'
  if (action === 'unoSpin') return `${target} first`
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
  if (language === 'zh') return '0、2 或大雨牌触发'
  if (language === 'de') return '0, 2 oder Wolkenbruch'
  return '0, 2, or Downpour'
}

function whirlpoolTargetText(language: Language, target: string): string {
  if (language === 'zh') return `目标：${target}`
  if (language === 'de') return `Ziel: ${target}`
  return `Target: ${target}`
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

function blastTitle(language: Language): string {
  if (language === 'zh') return '爆破装置'
  if (language === 'de') return 'Blast-Einheit'
  return 'Blast Unit'
}

function blastReadyText(language: Language): string {
  if (language === 'zh') return '等待加载'
  if (language === 'de') return 'Bereit'
  return 'Ready'
}

function blastStatus(language: Language, fired: boolean, cardsDrawn: number): string {
  if (language === 'zh') return fired ? `发射：摸 ${cardsDrawn}` : '未发射'
  if (language === 'de') return fired ? `Ausgeloest: ${cardsDrawn}` : 'Ruhig'
  return fired ? `Fired: ${cardsDrawn}` : 'No fire'
}

function blastDetail(language: Language, player: string, chamberSize: number): string {
  if (language === 'zh') return `${player} / 压力 ${chamberSize}`
  if (language === 'de') return `${player} / Druck ${chamberSize}`
  return `${player} / pressure ${chamberSize}`
}

function blastChamberText(language: Language, chamber: number): string {
  if (language === 'zh') return `压力：${chamber}`
  if (language === 'de') return `Druck: ${chamber}`
  return `Pressure: ${chamber}`
}

function robotoTitle(language: Language): string {
  if (language === 'zh') return '机器人'
  if (language === 'de') return 'Roboto'
  return 'Roboto'
}

function robotoReadyText(language: Language): string {
  if (language === 'zh') return '等待指令'
  if (language === 'de') return 'Bereit'
  return 'Ready'
}

function robotoTriggerText(language: Language): string {
  if (language === 'zh') return '出牌后可能触发'
  if (language === 'de') return 'Nach Karten moeglich'
  return 'May speak after plays'
}

function robotoCommandLabel(language: Language, command: NonNullable<GameState['robotoEvent']>['command']): string {
  const labels: Record<NonNullable<GameState['robotoEvent']>['command'], Record<Language, string>> = {
    nextDraw2: { en: 'Next draw 2', zh: '下一位摸 2', de: 'Naechster +2' },
    sourceDraw2: { en: 'Player draw 2', zh: '出牌者摸 2', de: 'Spieler +2' },
    allOthersDraw1: { en: 'Others draw 1', zh: '其他人摸 1', de: 'Andere +1' },
    discardActiveColor: { en: 'Discard color', zh: '弃当前颜色', de: 'Farbe ablegen' },
    reverse: { en: 'Reverse', zh: '反转', de: 'Richtung' },
    playAgain: { en: 'Play again', zh: '再行动', de: 'Nochmal' },
  }
  return labels[command][language]
}

function robotoDetail(language: Language, event: NonNullable<GameState['robotoEvent']>): string {
  const target = event.targetPlayerName ? playerName(language, event.targetPlayerName) : playerName(language, event.playerName)
  if (language === 'zh') return `${target} / ${event.cardsMoved} 张`
  if (language === 'de') return `${target} / ${event.cardsMoved} Karten`
  return `${target} / ${event.cardsMoved} cards`
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

function drawAvatar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, avatarId: AvatarId) {
  const avatar = avatarPalette[avatarId]
  ctx.save()
  ctx.fillStyle = avatar.fill
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = avatar.text
  ctx.font = `900 ${Math.max(9, r * 0.92)}px system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(avatar.mark, x, y + 0.5)
  ctx.restore()
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxSize?: number,
  minSize?: number,
) {
  const words = text.split(' ')
  let line = ''
  const lines: string[] = []
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  lines.push(line)
  const start = y - ((lines.length - 1) * lineHeight) / 2
  const baseSize = maxSize ?? (lines.length > 1 || text.length > 7 ? 16 : 24)
  const smallestSize = minSize ?? 10
  lines.forEach((entry, index) => drawFittedText(ctx, entry, x, start + index * lineHeight, maxWidth, baseSize, smallestSize, '900'))
}

function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  weight: string,
) {
  let size = maxSize
  while (size > minSize) {
    ctx.font = `${weight} ${size}px system-ui`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 1
  }
  ctx.font = `${weight} ${size}px system-ui`
  ctx.fillText(text, x, y, maxWidth)
}

function settleOffset(elapsed: number, distance: number): number {
  if (elapsed >= 300) return 0
  const progress = elapsed / 300
  return (1 - progress) * distance
}
