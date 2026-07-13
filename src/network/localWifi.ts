import type { AiDifficulty, AvatarId, GameState, GameVariant, PlayChoice } from '../game/types'
import type { PassageTakeSource } from '../game/types'
import type { MahjongClaimResponse, MahjongState } from '../game/mahjong/types'

export type WifiStatus = 'idle' | 'connecting' | 'connected' | 'error'

export interface WifiPlayer {
  id: string
  name: string
  isHost: boolean
  avatarId: AvatarId
}

export interface WifiRoomSnapshot {
  code: string
  hostId: string
  maxPlayers: number
  game: GameVariant
  h2oSplash: boolean
  allowAi: boolean
  aiDifficulty: AiDifficulty
  gameStarted: boolean
  players: WifiPlayer[]
}

export interface WifiGameSnapshot {
  state?: GameState
  mahjongState?: MahjongState
  localPlayerId: string
}

export type WifiPlayerAction =
  | { type: 'playCard'; cardId: string; choice?: PlayChoice }
  | { type: 'speedPlay'; cardId: string }
  | { type: 'teamPass'; cardId: string }
  | { type: 'drawOne' }
  | { type: 'endTurn' }
  | { type: 'resolvePendingDraw'; challenge: boolean }
  | { type: 'resolvePendingDare'; resolution: 'draw' | 'dare' }
  | { type: 'resolvePendingEmoji'; resolution: 'madeFace' | 'draw4' }
  | { type: 'callUno' }
  | { type: 'catchUno' }
  | { type: 'liarAccept' }
  | { type: 'liarChallenge' }
  | { type: 'zeroTakeDiscard' }
  | { type: 'zeroDiscardDrawn' }
  | { type: 'zeroSwapGrid'; slotIndex: number }
  | { type: 'caboResolvePower'; targetPlayerId: string; slotIndex: number }
  | { type: 'caboCall' }
  | { type: 'phase10TakeDiscard' }
  | { type: 'phase10CompletePhase' }
  | { type: 'skipBoDiscard'; cardId: string; pileIndex: number }
  | { type: 'memorySelectSlot'; slotIndex: number }
  | { type: 'passageTake'; source: PassageTakeSource }
  | { type: 'passagePair'; cardId: string }
  | { type: 'passageSkipPair' }
  | { type: 'passagePass'; cardId: string; faceDown: boolean }
  | { type: 'mahjongDraw' }
  | { type: 'mahjongDiscard'; tileId: string }
  | { type: 'mahjongDeclareWin' }
  | { type: 'mahjongDeclareKong'; tileId?: string }
  | { type: 'mahjongPass' }
  | { type: 'mahjongClaim'; claimAction: Exclude<MahjongClaimResponse['action'], 'pass'>; tileIds: string[] }

export interface WifiClientState {
  clientId: string | null
  room: WifiRoomSnapshot | null
  status: WifiStatus
  error: string | null
}

export interface WifiClient {
  hostRoom: (options: HostRoomOptions) => void
  joinRoom: (options: JoinRoomOptions) => void
  resumeRoom: (code: string) => void
  publishGameSnapshots: (snapshots: Record<string, WifiGameSnapshot>) => void
  sendPlayerAction: (action: WifiPlayerAction) => void
  closeRoom: () => void
  leaveRoom: () => void
  close: () => void
}

export interface HostRoomOptions {
  name: string
  maxPlayers: number
  game: GameVariant
  h2oSplash: boolean
  allowAi: boolean
  aiDifficulty: AiDifficulty
  avatarId: AvatarId
}

export interface JoinRoomOptions {
  name: string
  code: string
  avatarId: AvatarId
}

interface WifiCallbacks {
  onState: (patch: Partial<WifiClientState>) => void
  onGameSnapshot?: (snapshot: WifiGameSnapshot) => void
  onPlayerAction?: (clientId: string, action: WifiPlayerAction) => void
  onRoomClosed?: () => void
}

type ServerMessage =
  | { type: 'connected'; clientId: string }
  | { type: 'roomState'; room: WifiRoomSnapshot }
  | { type: 'gameSnapshot'; snapshot: WifiGameSnapshot }
  | { type: 'playerAction'; clientId: string; action: WifiPlayerAction }
  | { type: 'roomClosed'; hostId?: string }
  | { type: 'error'; message: string }

export function createLocalWifiClient(callbacks: WifiCallbacks): WifiClient {
  let socket = new WebSocket(getLocalWifiUrl())
  const queue: unknown[] = []
  const resumeToken = getResumeToken()
  let clientId: string | null = null
  let lastRoomCode: string | null = null
  let manualClose = false

  attachSocket(socket)

  function attachSocket(nextSocket: WebSocket) {
    socket = nextSocket
    socket.addEventListener('open', () => {
      callbacks.onState({ status: 'connected', error: null })
      if (lastRoomCode) {
        send(socket, queue, { type: 'resumeRoom', code: lastRoomCode, resumeToken })
      }
      while (queue.length > 0) {
        socket.send(JSON.stringify(queue.shift()))
      }
    })
    socket.addEventListener('close', () => {
      callbacks.onState({ status: 'idle' })
      if (!manualClose && lastRoomCode) {
        window.setTimeout(() => {
          if (!manualClose) attachSocket(new WebSocket(getLocalWifiUrl()))
        }, 1000)
      }
    })
    socket.addEventListener('error', () => callbacks.onState({ status: 'error', error: 'Local WiFi server is not reachable.' }))
    socket.addEventListener('message', handleMessage)
  }

  function handleMessage(event: MessageEvent) {
    const message = parseMessage(event.data)
    if (!message) return

    if (message.type === 'connected') {
      clientId = message.clientId
      callbacks.onState({ clientId: message.clientId })
    }
    if (message.type === 'roomState') {
      lastRoomCode = message.room.code
      callbacks.onState({ status: 'connected', room: message.room, error: null })
    }
    if (message.type === 'gameSnapshot') callbacks.onGameSnapshot?.(message.snapshot)
    if (message.type === 'playerAction') callbacks.onPlayerAction?.(message.clientId, message.action)
    if (message.type === 'roomClosed') {
      lastRoomCode = null
      callbacks.onState({ room: null, error: message.hostId === clientId ? null : 'The host closed the room.' })
      callbacks.onRoomClosed?.()
    }
    if (message.type === 'error') callbacks.onState({ status: 'error', error: message.message })
  }

  return {
    hostRoom: (options) => send(socket, queue, { type: 'hostRoom', ...options, resumeToken }),
    joinRoom: (options) => send(socket, queue, { type: 'joinRoom', ...options, code: options.code, resumeToken }),
    resumeRoom: (code) => {
      lastRoomCode = code
      send(socket, queue, { type: 'resumeRoom', code, resumeToken })
    },
    publishGameSnapshots: (snapshots) => send(socket, queue, { type: 'hostGameSnapshots', snapshots }),
    sendPlayerAction: (action) => send(socket, queue, { type: 'playerAction', action }),
    closeRoom: () => send(socket, queue, { type: 'closeRoom' }),
    leaveRoom: () => send(socket, queue, { type: 'leaveRoom' }),
    close: () => {
      manualClose = true
      socket.close()
    },
  }
}

export function initialWifiClientState(): WifiClientState {
  return {
    clientId: null,
    room: null,
    status: 'idle',
    error: null,
  }
}

function getLocalWifiUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.hostname}:5203`
}

function getResumeToken(): string {
  const key = 'uno-wifi-resume-token'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const token = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  window.localStorage.setItem(key, token)
  return token
}

function send(socket: WebSocket, queue: unknown[], payload: unknown) {
  if (socket.readyState === WebSocket.CONNECTING) {
    queue.push(payload)
    return
  }
  if (socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify(payload))
}

function parseMessage(data: unknown): ServerMessage | null {
  if (typeof data !== 'string') return null
  try {
    return JSON.parse(data) as ServerMessage
  } catch {
    return null
  }
}
