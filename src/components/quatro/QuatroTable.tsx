import { useEffect, useMemo, useState } from 'react'
import type { Language } from '../../i18n'
import type { SoundCue } from '../../game/types'
import { getQuatroHint } from '../../game/quatro/hints'
import {
  quatroLegalColumns,
} from '../../game/quatro/rules'
import type { QuatroState } from '../../game/quatro/types'
import {
  quatroHintText,
  quatroAuxiliaryText,
  quatroLegalDestinationsText,
  quatroPlayerLabel,
  quatroText,
  quatroTraceText,
  quatroTrayLabel,
} from '../../game/quatro/translation'
import { QuatroCanvas } from './QuatroCanvas'
import { QuatroWinnerOverlay } from './QuatroWinnerOverlay'
import {
  quatroInitialDealKey,
  quatroInitialDealPending,
} from './quatroAnimations'
import {
  QUATRO_WINNING_LINE_HOLD_MS,
  quatroWinnerPresentationStage,
} from './quatroWinnerPresentation'
import {
  quatroActionGlyph,
  type QuatroTileTheme,
} from './quatroTileThemes'

export type QuatroUiAction =
  | { type: 'place'; tileId: string; column: number }
  | { type: 'swapColumn'; column: number }
  | { type: 'emptyPush'; pushOut: boolean }
  | { type: 'exchange'; tileId: string }

interface QuatroTableProps {
  state: QuatroState
  language: Language
  viewerPlayerId: string | null
  selectedTileId: string | null
  hiddenHands: boolean
  animationLocked: boolean
  reducedMotion: boolean
  tileTheme: QuatroTileTheme
  onSelectTile: (tileId: string | null) => void
  onAction: (action: QuatroUiAction) => void
  onRevealHand: () => void
  onOpenSetup: () => void
  onNewGame: () => void
  onBlockingAnimationChange: (blocking: boolean) => void
  onSoundCue: (cue: SoundCue) => void
}

export function QuatroTable({
  state,
  language,
  viewerPlayerId,
  selectedTileId,
  hiddenHands,
  animationLocked,
  reducedMotion,
  tileTheme,
  onSelectTile,
  onAction,
  onRevealHand,
  onOpenSetup,
  onNewGame,
  onBlockingAnimationChange,
  onSoundCue,
}: QuatroTableProps) {
  const active = state.players[state.activePlayerIndex]
  const viewer = state.players.find(
    (player) => player.id === viewerPlayerId,
  )
  const canInteract =
    Boolean(viewer)
    && viewer?.id === active.id
    && !hiddenHands
    && !animationLocked
    && state.phase !== 'gameOver'
  const hint = useMemo(
    () =>
      viewer
        ? getQuatroHint(state, viewer.id)
        : {
            kind: 'wait' as const,
            tileIds: [],
            columns: [],
            reasonKey: 'hint.wait',
          },
    [state, viewer],
  )
  const movableTileIds = canInteract ? hint.tileIds : []
  const playerNames = useMemo(
    () => Object.fromEntries(
      state.players.map((player) => [player.id, player.name]),
    ),
    [state.players],
  )
  const winnerPresentationKey = state.winnerId
    ? `${state.winnerId}:${state.transitionSequence}`
    : null
  const [celebrationWinnerKey, setCelebrationWinnerKey] = useState<string | null>(
    null,
  )
  const initialDealKey = quatroInitialDealKey(state)
  const [completedInitialDealKey, setCompletedInitialDealKey] = useState<
    string | null
  >(null)
  const initialDealPending = quatroInitialDealPending(
    state,
    completedInitialDealKey,
  )
  const winnerStage = quatroWinnerPresentationStage(
    Boolean(state.winnerId),
    celebrationWinnerKey === winnerPresentationKey
      ? QUATRO_WINNING_LINE_HOLD_MS
      : 0,
  )
  const legalColumns = useMemo(
    () =>
      canInteract && selectedTileId
        ? quatroLegalColumns(state, selectedTileId)
        : state.phase === 'selectSwapFirst'
          || state.phase === 'selectSwapSecond'
          ? hint.columns
          : [],
    [canInteract, hint.columns, selectedTileId, state],
  )

  useEffect(() => {
    if (!winnerPresentationKey) return

    const timer = window.setTimeout(
      () => setCelebrationWinnerKey(winnerPresentationKey),
      QUATRO_WINNING_LINE_HOLD_MS,
    )
    return () => window.clearTimeout(timer)
  }, [winnerPresentationKey])

  function selectHandTile(tileId: string) {
    if (!canInteract) return
    if (hint.kind === 'exchange') {
      onAction({ type: 'exchange', tileId })
      return
    }
    if (!movableTileIds.includes(tileId)) return
    onSelectTile(selectedTileId === tileId ? null : tileId)
  }

  function selectColumn(column: number) {
    if (!canInteract) return
    if (
      state.phase === 'selectSwapFirst'
      || state.phase === 'selectSwapSecond'
    ) {
      onAction({ type: 'swapColumn', column })
      return
    }
    if (
      state.phase === 'playing'
      && selectedTileId
      && legalColumns.includes(column)
    ) {
      onAction({ type: 'place', tileId: selectedTileId, column })
    }
  }

  return (
    <section
      className="quatro-table"
      data-tile-theme={tileTheme}
      data-initial-deal={initialDealPending ? 'pending' : 'complete'}
    >
      <div className="quatro-status">
        <div>
          <span>{quatroText(language, 'turn')}</span>
          <strong>{quatroPlayerLabel(language, active.name)}</strong>
        </div>
        <div>
          <span>{quatroText(language, 'bag')}</span>
          <strong>{state.bagCount ?? state.bag.length}</strong>
        </div>
      </div>

      <div className="quatro-canvas-wrap">
        <QuatroCanvas
          state={state}
          viewerPlayerId={hiddenHands ? '' : viewerPlayerId ?? ''}
          legalColumns={legalColumns}
          labels={{ bag: quatroText(language, 'bag') }}
          animationSpeed={state.animationSpeed}
          reducedMotion={reducedMotion}
          tileTheme={tileTheme}
          hideStaticHands={initialDealPending}
          onColumnSelect={selectColumn}
          onPendingChoice={(choice) =>
            onAction({
              type: 'emptyPush',
              pushOut: choice === 'push',
            })
          }
          onBlockingAnimationChange={onBlockingAnimationChange}
          onTransitionAnimationComplete={(sequence) => {
            if (
              sequence === state.transitionSequence
              && initialDealKey !== null
            ) {
              setCompletedInitialDealKey(initialDealKey)
            }
          }}
          onSoundCue={onSoundCue}
        />

        {legalColumns.map((column) => (
          <button
            className="visually-hidden quatro-legal"
            type="button"
            key={column}
            disabled={!canInteract}
            onClick={() => selectColumn(column)}
          >
            {quatroTrayLabel(language, column + 1)} —{' '}
            {quatroText(language, 'legalMove')}
          </button>
        ))}

        {hiddenHands && (
          <div className="quatro-privacy-overlay">
            <section className="modal-panel">
              <p className="eyebrow">{quatroText(language, 'turn')}</p>
              <h2>{quatroPlayerLabel(language, active.name)}</h2>
              <p>{quatroText(language, 'privacyPassDevice')}</p>
              <button
                className="primary-button"
                type="button"
                onClick={onRevealHand}
              >
                {quatroText(language, 'hand')}
              </button>
            </section>
          </div>
        )}

        {winnerStage === 'winningLine' && (
          <div className="quatro-winning-line-banner" role="status">
            {quatroAuxiliaryText(language, 'winningLineConfirm')}
          </div>
        )}

        {winnerStage === 'celebration' && (
          <QuatroWinnerOverlay
            state={state}
            language={language}
            reducedMotion={reducedMotion}
            onOpenSetup={onOpenSetup}
            onNewGame={onNewGame}
          />
        )}
      </div>

      <aside className="quatro-controls">
        <div className="quatro-hand-row">
          {viewer && !hiddenHands && !initialDealPending && (
            <section
              className="quatro-hand"
              aria-label={quatroText(language, 'hand')}
            >
              {viewer.hand.map((handTile) => {
                const movable =
                  movableTileIds.includes(handTile.id)
                  || hint.kind === 'exchange'
                const tileDescription = [
                  quatroText(language, 'tile'),
                  handTile.color,
                  handTile.action
                    ? quatroText(
                        language,
                        handTile.action === 'swap'
                          ? 'actionSwap'
                          : handTile.action === 'push'
                            ? 'actionPush'
                            : 'actionMinus2',
                      )
                    : '',
                ].filter(Boolean).join(' · ')
                const tooltipId = `quatro-tile-tip-${handTile.id}`
                return (
                  <button
                    className={[
                      'quatro-tile-button',
                      movable ? 'quatro-legal' : '',
                      selectedTileId === handTile.id ? 'selected' : '',
                    ].filter(Boolean).join(' ')}
                    type="button"
                    key={handTile.id}
                    aria-disabled={!canInteract || !movable}
                    aria-describedby={tooltipId}
                    aria-pressed={selectedTileId === handTile.id}
                    onClick={() => selectHandTile(handTile.id)}
                    onContextMenu={(event) => event.preventDefault()}
                  >
                    <span
                      className={
                        `quatro-hand-tile-face quatro-color-${handTile.color}`
                      }
                    >
                      {handTile.value}
                    </span>
                    {handTile.action && (
                      <span
                        className="quatro-tile-action"
                        aria-hidden="true"
                      >
                        {quatroActionGlyph(handTile.action)}
                      </span>
                    )}
                    <small
                      className="quatro-tile-tooltip"
                      id={tooltipId}
                      role="tooltip"
                    >
                      {tileDescription}
                    </small>
                  </button>
                )
              })}
            </section>
          )}

          {canInteract && state.phase === 'chooseEmptyPush' && (
            <div className="quatro-choice-actions">
              <button
                className="ghost-button"
                type="button"
                disabled={animationLocked}
                onClick={() =>
                  onAction({ type: 'emptyPush', pushOut: false })
                }
              >
                {quatroText(language, 'keepTile')}
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={animationLocked}
                onClick={() =>
                  onAction({ type: 'emptyPush', pushOut: true })
                }
              >
                {quatroText(language, 'pushOut')}
              </button>
            </div>
          )}
        </div>

        <section className="quatro-info-pane" tabIndex={0}>
          <strong>{quatroText(language, 'selectTile')}</strong>
          <p>{quatroHintText(language, hint)}</p>
          {legalColumns.length > 0 && (
            <p className="quatro-legal-destinations">
              {quatroLegalDestinationsText(language, legalColumns)}
            </p>
          )}
        </section>

        <section
          className="quatro-trace"
          aria-label={quatroAuxiliaryText(language, 'traceTitle')}
          tabIndex={0}
        >
          <strong>{quatroAuxiliaryText(language, 'traceTitle')}</strong>
          {state.log.length === 0 ? (
            <p>{quatroAuxiliaryText(language, 'traceEmpty')}</p>
          ) : (
            <ol aria-live="polite">
              {state.log.slice(-24).map((entry, index) => (
                <li key={`${state.log.length}-${index}`}>
                  {quatroTraceText(language, entry, playerNames)}
                </li>
              ))}
            </ol>
          )}
        </section>
      </aside>
    </section>
  )
}
