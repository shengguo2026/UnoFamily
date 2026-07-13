import { useEffect, useRef } from 'react'
import type { AnimationSpeed } from '../../game/types'
import type { MahjongState } from '../../game/mahjong/types'
import { deriveMahjongAnimationTransition, type MahjongAnimationTransition } from './mahjongAnimations'
import { createMahjongScene, type MahjongSceneController } from './mahjongScene'
import type { MahjongVisualTheme } from './mahjongVisuals'

export interface MahjongTable3DProps {
  state?: MahjongState | null
  viewerPlayerId?: string | null
  selectedTileId?: string | null
  visualTheme?: MahjongVisualTheme
  tileStyle?: 'mahjong' | 'unoMahjong'
  reducedMotion?: boolean
  animationSpeed?: AnimationSpeed
  onTileSelect?: (tileId: string) => void
}

export function MahjongTable3D({ state = null, viewerPlayerId = null, selectedTileId = null, visualTheme, tileStyle = 'mahjong', reducedMotion = false, animationSpeed = 'normal', onTileSelect }: MahjongTable3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneRef = useRef<MahjongSceneController | null>(null)
  const previousStateRef = useRef<MahjongState | null>(null)
  const previousViewerPlayerIdRef = useRef<string | null>(null)
  const onTileSelectRef = useRef(onTileSelect)
  const latestScenePropsRef = useRef({ state, viewerPlayerId, selectedTileId, visualTheme, tileStyle, reducedMotion, animationSpeed })

  useEffect(() => {
    onTileSelectRef.current = onTileSelect
  }, [onTileSelect])

  useEffect(() => {
    latestScenePropsRef.current = { state, viewerPlayerId, selectedTileId, visualTheme, tileStyle, reducedMotion, animationSpeed }
  }, [animationSpeed, reducedMotion, selectedTileId, state, tileStyle, viewerPlayerId, visualTheme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const initialSceneProps = latestScenePropsRef.current
    const transition = visibleMahjongTransition(deriveMahjongAnimationTransition(null, initialSceneProps.state), initialSceneProps.viewerPlayerId)
    const controller = createMahjongScene({ canvas, ...initialSceneProps, transition, onTileSelect: (tileId) => onTileSelectRef.current?.(tileId) })
    sceneRef.current = controller
    previousStateRef.current = initialSceneProps.state
    previousViewerPlayerIdRef.current = initialSceneProps.viewerPlayerId
    return () => {
      controller.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    const visibleViewerPlayerId = previousViewerPlayerIdRef.current ?? viewerPlayerId
    const transition = visibleMahjongTransition(deriveMahjongAnimationTransition(previousStateRef.current, state), visibleViewerPlayerId)
    sceneRef.current?.update({ state, viewerPlayerId, selectedTileId, visualTheme, tileStyle, transition, reducedMotion, animationSpeed })
    previousStateRef.current = state
    previousViewerPlayerIdRef.current = viewerPlayerId
  }, [animationSpeed, reducedMotion, selectedTileId, state, tileStyle, viewerPlayerId, visualTheme])

  return (
    <div className="mahjong-3d-table" aria-label="Mahjong 3D table preview">
      <canvas ref={canvasRef} className="mahjong-3d-canvas" />
    </div>
  )
}

function visibleMahjongTransition(transition: MahjongAnimationTransition | null, visibleViewerPlayerId: string | null): MahjongAnimationTransition | null {
  if (transition?.eventKind === 'ready' && transition.playerId !== visibleViewerPlayerId) {
    return { ...transition, eventKind: null, playerId: null }
  }
  return transition
}
