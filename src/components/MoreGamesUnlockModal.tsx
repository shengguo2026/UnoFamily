import React, { useEffect, useRef, useState } from 'react'
import { t, type Language } from '../i18n'
import { unlockMoreGame } from '../network/moreGames'

interface MoreGamesUnlockModalProps {
  language: Language
  onCancel: () => void
  onUnlocked: (gameId: 'quatro') => void
}

export function MoreGamesUnlockModal({
  language,
  onCancel,
  onUnlocked,
}: MoreGamesUnlockModalProps) {
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const requestRef = useRef<AbortController | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      requestRef.current?.abort()
      setPassword('')
      onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      requestRef.current?.abort()
    }
  }, [onCancel])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || password.length === 0) return

    const submittedPassword = password
    setPassword('')
    setFailed(false)
    setPending(true)
    const controller = new AbortController()
    requestRef.current = controller
    const result = await unlockMoreGame(submittedPassword, controller.signal)
    requestRef.current = null
    setPending(false)

    if (result.ok) {
      onUnlocked(result.gameId)
      return
    }
    if (!controller.signal.aborted) {
      setFailed(true)
      inputRef.current?.focus()
    }
  }

  function cancel() {
    requestRef.current?.abort()
    setPassword('')
    onCancel()
  }

  return (
    <div className="global-modal-overlay more-games-overlay" role="presentation">
      <section
        className="modal-panel more-games-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="more-games-title"
      >
        <h2 id="more-games-title">{t(language, 'moreGamesUnlockTitle')}</h2>
        <form onSubmit={submit}>
          <label className="field-row more-games-field">
            <span>{t(language, 'moreGamesPassword')}</span>
            <input
              ref={inputRef}
              className="more-games-password"
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              value={password}
              disabled={pending}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <p className="more-games-error" aria-live="polite">
            {failed ? t(language, 'moreGamesFailure') : pending ? t(language, 'moreGamesChecking') : ''}
          </p>
          <div className="modal-actions more-games-actions">
            <button className="ghost-button" type="button" onClick={cancel}>
              {t(language, 'cancel')}
            </button>
            <button className="primary-button" type="submit" disabled={pending || password.length === 0}>
              {t(language, 'moreGamesConfirm')}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
