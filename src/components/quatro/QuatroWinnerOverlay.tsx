import React from 'react'
import type { Language } from '../../i18n'
import type { QuatroState } from '../../game/quatro/types'
import {
  quatroText,
  quatroWinnerText,
} from '../../game/quatro/translation'

interface QuatroWinnerOverlayProps {
  state: QuatroState
  language: Language
  reducedMotion: boolean
  onOpenSetup: () => void
  onNewGame: () => void
}

export function QuatroWinnerOverlay({
  state,
  language,
  reducedMotion,
  onOpenSetup,
  onNewGame,
}: QuatroWinnerOverlayProps) {
  const winner = state.players.find(
    (player) => player.id === state.winnerId,
  )
  if (!winner) return null

  return (
    <div
      className="quatro-winner-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quatro-winner-title"
    >
      <div className="quatro-fireworks" aria-hidden="true">
        {reducedMotion
          ? Array.from({ length: 18 }, (_, index) => (
              <span
                className="quatro-firework static"
                key={index}
                style={{
                  '--firework-index': index,
                } as React.CSSProperties}
              />
            ))
          : Array.from({ length: 40 }, (_, index) => (
              <span
                className="quatro-firework"
                key={index}
                style={{
                  '--firework-index': index,
                  '--firework-burst': index % 5,
                } as React.CSSProperties}
              />
            ))}
      </div>
      <section className="quatro-winner-panel">
        <p className="eyebrow">
          {quatroText(language, 'winnerTitle')}
        </p>
        <h2 id="quatro-winner-title">
          {quatroWinnerText(language, winner.name)}
        </h2>
        <div className="quatro-winner-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={onOpenSetup}
          >
            {quatroText(language, 'winnerSetup')}
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={onNewGame}
          >
            {quatroText(language, 'winnerNewGame')}
          </button>
        </div>
      </section>
    </div>
  )
}
