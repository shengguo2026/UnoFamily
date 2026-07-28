import { createHash, randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import {
  createAttemptLimiter,
  parseMoreGameVerifiers,
  verifyMoreGamePassword,
} from './more-games-auth.mjs'

const PORT = Number(process.env.UNO_WIFI_PORT ?? 5203)
const CLOSE_FRAME = '__UNO_CLOSE_FRAME__'
const AVATARS = new Set(['explorer', 'teacher', 'magician', 'builder', 'musician', 'gardener', 'pilot', 'chef', 'scientist', 'artist'])
const rooms = new Map()
const moreGameVerifiers = parseMoreGameVerifiers(process.env.UNO_MORE_GAMES_VERIFIERS)
const moreGameAttemptLimiter = createAttemptLimiter()
const UNLOCK_BODY_LIMIT_BYTES = 1_024
const UNLOCK_MIN_RESPONSE_MS = 80

const server = createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: true, rooms: rooms.size }))
    return
  }

  if (request.url === '/api/more-games/unlock') {
    void handleMoreGamesUnlock(request, response)
    return
  }

  response.writeHead(404, { 'content-type': 'application/json' })
  response.end(JSON.stringify({ error: 'not_found' }))
})

server.on('upgrade', (request, socket) => {
  const key = request.headers['sec-websocket-key']
  if (!key) {
    socket.destroy()
    return
  }

  const accept = createHash('sha1')
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest('base64')

  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '',
    '',
  ].join('\r\n'))

  const client = {
    id: createId(),
    socket,
    roomCode: null,
  }

  socket.on('data', (buffer) => {
    for (const message of parseFrames(buffer)) {
      if (message === CLOSE_FRAME) {
        disconnectClient(client)
        socket.end()
        return
      }
      handleMessage(client, message)
    }
  })
  socket.on('end', () => disconnectClient(client))
  socket.on('close', () => disconnectClient(client))
  socket.on('error', () => disconnectClient(client))

  send(client.socket, { type: 'connected', clientId: client.id })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`UNO Local WiFi room server listening on port ${PORT}`)
})

function handleMessage(client, raw) {
  let message
  try {
    message = JSON.parse(raw)
  } catch {
    send(client.socket, { type: 'error', message: 'Invalid message.' })
    return
  }

  if (message.type === 'hostRoom') {
    hostRoom(client, message)
    return
  }
  if (message.type === 'joinRoom') {
    joinRoom(client, message)
    return
  }
  if (message.type === 'resumeRoom') {
    resumeRoom(client, message)
    return
  }
  if (message.type === 'leaveRoom') {
    leaveClient(client)
    return
  }
  if (message.type === 'closeRoom') {
    closeRoom(client)
    return
  }
  if (message.type === 'hostGameSnapshots') {
    publishGameSnapshots(client, message)
    return
  }
  if (message.type === 'playerAction') {
    forwardPlayerAction(client, message)
    return
  }

  send(client.socket, { type: 'error', message: 'Unknown message.' })
}

function hostRoom(client, message) {
  leaveClient(client)
  const code = createRoomCode()
  const hostName = cleanName(message.name, 'Host')
  const game = cleanGame(message.game)
  const maxPlayers = cleanMaxPlayers(game, message.maxPlayers)
  const room = {
    code,
    hostId: client.id,
    maxPlayers,
    game,
    h2oSplash: game === 'h2o' && Boolean(message.h2oSplash),
    allowAi: Boolean(message.allowAi),
    aiDifficulty: message.aiDifficulty ?? 'medium',
    gameStarted: false,
    snapshots: {},
    players: [{ id: client.id, name: hostName, isHost: true, avatarId: cleanAvatar(message.avatarId), resumeToken: cleanResumeToken(message.resumeToken), connected: true }],
    clients: new Map([[client.id, client]]),
  }
  rooms.set(code, room)
  client.roomCode = code
  broadcastRoom(room)
}

function joinRoom(client, message) {
  leaveClient(client)
  const code = String(message.code ?? '').trim().toUpperCase()
  const room = rooms.get(code)
  if (!room) {
    send(client.socket, { type: 'error', message: 'Room not found.' })
    return
  }
  const token = cleanResumeToken(message.resumeToken)
  const existingPlayer = token ? room.players.find((entry) => entry.resumeToken === token) : null
  if (existingPlayer) {
    attachResumedPlayer(client, room, existingPlayer)
    return
  }
  if (room.players.length >= room.maxPlayers) {
    send(client.socket, { type: 'error', message: 'Room is full.' })
    return
  }

  client.roomCode = code
  room.clients.set(client.id, client)
  room.players.push({
    id: client.id,
    name: cleanName(message.name, `Player ${room.players.length + 1}`),
    isHost: false,
    avatarId: cleanAvatar(message.avatarId),
    resumeToken: token,
    connected: true,
  })
  broadcastRoom(room)
}

function resumeRoom(client, message) {
  disconnectClient(client)
  const code = String(message.code ?? '').trim().toUpperCase()
  const token = cleanResumeToken(message.resumeToken)
  const room = rooms.get(code)
  if (!room || !token) {
    send(client.socket, { type: 'error', message: 'Room resume failed.' })
    return
  }
  const player = room.players.find((entry) => entry.resumeToken === token)
  if (!player) {
    send(client.socket, { type: 'error', message: 'Room resume failed.' })
    return
  }
  attachResumedPlayer(client, room, player)
}

function attachResumedPlayer(client, room, player) {
  client.id = player.id
  client.roomCode = room.code
  player.connected = true
  room.clients.set(client.id, client)
  send(client.socket, { type: 'connected', clientId: client.id })
  if (room.snapshots?.[client.id]) {
    send(client.socket, { type: 'gameSnapshot', snapshot: room.snapshots[client.id] })
  }
  broadcastRoom(room)
}

function disconnectClient(client) {
  if (!client.roomCode) return
  const room = rooms.get(client.roomCode)
  client.roomCode = null
  if (!room) return

  room.clients.delete(client.id)
  const player = room.players.find((entry) => entry.id === client.id)
  if (player) player.connected = false
  broadcastRoom(room)
}

function leaveClient(client) {
  if (!client.roomCode) return
  const room = rooms.get(client.roomCode)
  client.roomCode = null
  if (!room) return

  room.clients.delete(client.id)
  room.players = room.players.filter((player) => player.id !== client.id)
  if (room.hostId === client.id || room.players.length === 0) {
    for (const entry of room.clients.values()) {
      entry.roomCode = null
      send(entry.socket, { type: 'roomClosed', hostId: room.hostId })
    }
    rooms.delete(room.code)
    return
  }

  broadcastRoom(room)
}

function closeRoom(client) {
  const room = getClientRoom(client)
  if (!room || room.hostId !== client.id) {
    send(client.socket, { type: 'error', message: 'Only the host can close the room.' })
    return
  }

  for (const entry of room.clients.values()) {
    entry.roomCode = null
    send(entry.socket, { type: 'roomClosed', hostId: room.hostId })
  }
  rooms.delete(room.code)
}

function broadcastRoom(room) {
  const snapshot = {
    type: 'roomState',
    room: {
      code: room.code,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      game: room.game,
      h2oSplash: room.h2oSplash,
      allowAi: room.allowAi,
      aiDifficulty: room.aiDifficulty,
      gameStarted: room.gameStarted,
      players: room.players.map(({ resumeToken, ...player }) => player),
    },
  }
  for (const client of room.clients.values()) {
    send(client.socket, snapshot)
  }
}

function publishGameSnapshots(client, message) {
  const room = getClientRoom(client)
  if (!room || room.hostId !== client.id || !message.snapshots) return

  room.gameStarted = true
  room.snapshots = message.snapshots
  for (const entry of room.clients.values()) {
    if (entry.id === room.hostId) continue
    const snapshot = message.snapshots[entry.id]
    if (snapshot) {
      send(entry.socket, { type: 'gameSnapshot', snapshot })
    }
  }
  broadcastRoom(room)
}

function forwardPlayerAction(client, message) {
  const room = getClientRoom(client)
  if (!room || room.hostId === client.id || !message.action) return

  const host = room.clients.get(room.hostId)
  if (host) {
    send(host.socket, { type: 'playerAction', clientId: client.id, action: message.action })
  }
}

function getClientRoom(client) {
  if (!client.roomCode) return null
  return rooms.get(client.roomCode) ?? null
}

function parseFrames(buffer) {
  const messages = []
  let offset = 0
  while (offset + 2 <= buffer.length) {
    const first = buffer[offset]
    const second = buffer[offset + 1]
    const opcode = first & 0x0f
    let length = second & 0x7f
    let cursor = offset + 2

    if (length === 126) {
      if (cursor + 2 > buffer.length) break
      length = buffer.readUInt16BE(cursor)
      cursor += 2
    } else if (length === 127) {
      if (cursor + 8 > buffer.length) break
      const longLength = buffer.readBigUInt64BE(cursor)
      if (longLength > BigInt(Number.MAX_SAFE_INTEGER)) break
      length = Number(longLength)
      cursor += 8
    }

    const masked = Boolean(second & 0x80)
    const mask = masked ? buffer.subarray(cursor, cursor + 4) : null
    if (masked) cursor += 4
    if (cursor + length > buffer.length) break

    const payload = Buffer.from(buffer.subarray(cursor, cursor + length))
    if (mask) {
      for (let index = 0; index < payload.length; index += 1) {
        payload[index] ^= mask[index % 4]
      }
    }

    if (opcode === 1) messages.push(payload.toString('utf8'))
    if (opcode === 8) {
      messages.push(CLOSE_FRAME)
      break
    }
    offset = cursor + length
  }
  return messages
}

function send(socket, payload) {
  const data = Buffer.from(JSON.stringify(payload))
  const header = data.length < 126 ? Buffer.from([0x81, data.length]) : Buffer.alloc(4)
  if (data.length >= 126) {
    header[0] = 0x81
    header[1] = 126
    header.writeUInt16BE(data.length, 2)
  }
  socket.write(Buffer.concat([header, data]))
}

function cleanName(value, fallback) {
  const name = String(value ?? '').trim()
  return name ? name.slice(0, 24) : fallback
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function cleanMaxPlayers(game, value) {
  const requested = Number(value) || 4
  if (game === 'mahjong' || game === 'guoUnoMahjong') return 4
  if (game === 'challenge') return clamp(requested, 2, 10)
  if (game === 'allWild') return clamp(requested, 2, 10)
  if (game === 'flipExtreme') return clamp(requested, 2, 10)
  if (game === 'lotr') return clamp(requested, 2, 10)
  if (game === 'noMercy') return clamp(requested, 2, 10)
  if (game === 'sonic') return clamp(requested, 2, 4)
  if (game === 'barbie') return clamp(requested, 2, 4)
  if (game === 'motu') return clamp(requested, 2, 4)
  if (game === 'tmnt') return clamp(requested, 2, 4)
  if (game === 'spiderman') return clamp(requested, 2, 4)
  if (game === 'dc') return clamp(requested, 2, 4)
  if (game === 'starTrek') return clamp(requested, 2, 4)
  if (game === 'avatar') return clamp(requested, 2, 4)
  if (game === 'monsterHigh') return clamp(requested, 2, 4)
  if (game === 'nfl') return clamp(requested, 2, 4)
  if (game === 'superMario') return clamp(requested, 2, 10)
  if (game === 'minecraft') return clamp(requested, 2, 10)
  if (game === 'wildJackpot') return clamp(requested, 2, 10)
  if (game === 'blast') return clamp(requested, 2, 10)
  if (game === 'roboto') return clamp(requested, 2, 10)
  if (game === 'tippo') return clamp(requested, 2, 10)
  if (game === 'marioKart') return clamp(requested, 2, 10)
  if (game === 'dice') return 2
  if (game === 'phase10') return clamp(requested, 2, 6)
  if (game === 'skipBo') return clamp(requested, 2, 6)
  if (game === 'guoHiLo' || game === 'guoPassage') return clamp(requested, 2, 4)
  if (game === 'guoMemory' || game === 'guoMemoryAction' || game === 'guoTripleMemory' || game === 'guoTripleMemoryAction' || game === 'guoNeighborMatch') return clamp(requested, 2, 4)
  return game === 'party' ? clamp(requested, 2, 16) : clamp(requested, 2, 4)
}

async function handleMoreGamesUnlock(request, response) {
  const startedAt = Date.now()
  const origin = allowedOrigin(request)
  const headers = responseHeaders(origin)

  if (request.method === 'OPTIONS' && origin) {
    response.writeHead(204, {
      ...headers,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
    })
    response.end()
    return
  }

  let password = null
  let validRequest = Boolean(
    request.method === 'POST' &&
    origin &&
    String(request.headers['content-type'] ?? '').toLowerCase().startsWith('application/json'),
  )

  if (validRequest) {
    const body = await readBoundedBody(request, UNLOCK_BODY_LIMIT_BYTES)
    if (body === null) {
      validRequest = false
    } else {
      try {
        const parsed = JSON.parse(body)
        const keys = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? Object.keys(parsed) : []
        if (keys.length === 1 && keys[0] === 'password' && typeof parsed.password === 'string') {
          password = parsed.password
        } else {
          validRequest = false
        }
      } catch {
        validRequest = false
      }
    }
  }

  const clientKey = request.socket.remoteAddress ?? 'unknown'
  const allowedAttempt = validRequest && moreGameAttemptLimiter.allow(clientKey)
  const gameId = allowedAttempt
    ? await verifyMoreGamePassword(password, moreGameVerifiers)
    : null

  const remainingDelay = UNLOCK_MIN_RESPONSE_MS - (Date.now() - startedAt)
  if (remainingDelay > 0) await new Promise((resolve) => setTimeout(resolve, remainingDelay))

  if (!gameId) {
    response.writeHead(401, headers)
    response.end(JSON.stringify({ ok: false }))
    return
  }

  response.writeHead(200, headers)
  response.end(JSON.stringify({ ok: true, gameId }))
}

function allowedOrigin(request) {
  const rawOrigin = request.headers.origin
  const rawHost = request.headers.host
  if (typeof rawOrigin !== 'string' || typeof rawHost !== 'string') return null

  try {
    const origin = new URL(rawOrigin)
    const requestHost = new URL(`http://${rawHost}`)
    if (!['http:', 'https:'].includes(origin.protocol)) return null
    if (origin.hostname !== requestHost.hostname) return null
    if (!['5202', '4173'].includes(origin.port)) return null
    return origin.origin
  } catch {
    return null
  }
}

function responseHeaders(origin) {
  return {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    ...(origin ? {
      'access-control-allow-origin': origin,
      vary: 'Origin',
    } : {}),
  }
}

async function readBoundedBody(request, limit) {
  const chunks = []
  let size = 0
  let oversized = false

  for await (const chunk of request) {
    size += chunk.length
    if (size > limit) {
      oversized = true
    } else {
      chunks.push(chunk)
    }
  }

  return oversized ? null : Buffer.concat(chunks).toString('utf8')
}

function cleanGame(value) {
  return value === 'extreme' ||
    value === 'flash' ||
    value === 'flip' ||
    value === 'flipExtreme' ||
    value === 'h2o' ||
    value === 'spin' ||
    value === 'zero' ||
    value === 'flex' ||
    value === 'liars' ||
    value === 'party' ||
    value === 'teams' ||
    value === 'houseRules' ||
    value === 'lotr' ||
    value === 'popCulture' ||
    value === 'noMercy' ||
    value === 'superMario' ||
    value === 'sonic' ||
    value === 'barbie' ||
    value === 'motu' ||
    value === 'tmnt' ||
    value === 'spiderman' ||
    value === 'dc' ||
    value === 'starTrek' ||
    value === 'avatar' ||
    value === 'monsterHigh' ||
    value === 'nfl' ||
    value === 'triplePlay' ||
    value === 'minecraft' ||
    value === 'wildJackpot' ||
    value === 'blast' ||
    value === 'roboto' ||
    value === 'tippo' ||
    value === 'dice' ||
    value === 'emoji' ||
    value === 'marioKart' ||
    value === 'skyjo' ||
    value === 'dos' ||
    value === 'phase10' ||
    value === 'skipBo' ||
    value === 'guoMemory' ||
    value === 'guoMemoryAction' ||
    value === 'guoTripleMemory' ||
    value === 'guoTripleMemoryAction' ||
    value === 'guoNeighborMatch' ||
    value === 'guoUnoMahjong' ||
    value === 'guoHiLo' ||
    value === 'guoPassage' ||
    value === 'allWild' ||
    value === 'challenge' ||
    value === 'cabo' ||
    value === 'mahjong'
    ? value
    : 'classic'
}

function cleanAvatar(value) {
  return AVATARS.has(value) ? value : 'explorer'
}

function cleanResumeToken(value) {
  const token = String(value ?? '').trim()
  return token ? token.slice(0, 96) : ''
}

function createId() {
  return randomBytes(8).toString('hex')
}

function createRoomCode() {
  let code = ''
  do {
    code = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  } while (rooms.has(code))
  return code
}
