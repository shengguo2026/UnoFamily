import { scrypt, timingSafeEqual } from 'node:crypto'

const GAME_ID_PATTERN = /^[a-z][a-z0-9-]{1,31}$/
const SALT_HEX_PATTERN = /^[0-9a-f]{32,128}$/i
const KEY_HEX_PATTERN = /^[0-9a-f]{64}$/i
const MAX_CLIENTS = 1_000

export function parseMoreGameVerifiers(raw) {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return []

    return Object.entries(parsed).flatMap(([gameId, verifier]) => {
      if (!GAME_ID_PATTERN.test(gameId) || typeof verifier !== 'string') return []
      const [saltHex, keyHex, extra] = verifier.split(':')
      if (extra || !SALT_HEX_PATTERN.test(saltHex) || !KEY_HEX_PATTERN.test(keyHex)) return []
      return [{
        gameId,
        salt: Buffer.from(saltHex, 'hex'),
        key: Buffer.from(keyHex, 'hex'),
      }]
    })
  } catch {
    return []
  }
}

export async function verifyMoreGamePassword(password, verifiers) {
  if (typeof password !== 'string' || password.length === 0 || password.length > 256) return null
  if (!Array.isArray(verifiers) || verifiers.length === 0) return null

  const matches = await Promise.all(verifiers.map(async (verifier) => {
    const candidate = await deriveKey(password, verifier.salt)
    return candidate.length === verifier.key.length && timingSafeEqual(candidate, verifier.key)
  }))
  const matchIndex = matches.findIndex(Boolean)
  return matchIndex >= 0 ? verifiers[matchIndex].gameId : null
}

export function createAttemptLimiter({
  maxAttempts = 5,
  windowMs = 60_000,
  now = Date.now,
} = {}) {
  const clients = new Map()

  return {
    allow(clientKey) {
      const timestamp = now()
      const key = String(clientKey)
      const active = (clients.get(key) ?? []).filter((entry) => timestamp - entry < windowMs)

      if (active.length >= maxAttempts) {
        clients.set(key, active)
        return false
      }

      if (!clients.has(key) && clients.size >= MAX_CLIENTS) {
        let oldestKey = null
        let oldestTimestamp = Number.POSITIVE_INFINITY
        for (const [candidateKey, attempts] of clients) {
          const latest = attempts.at(-1) ?? Number.NEGATIVE_INFINITY
          if (latest < oldestTimestamp) {
            oldestTimestamp = latest
            oldestKey = candidateKey
          }
        }
        if (oldestKey !== null) clients.delete(oldestKey)
      }

      active.push(timestamp)
      clients.set(key, active)
      return true
    },
  }
}

function deriveKey(password, salt) {
  return new Promise((resolve) => {
    scrypt(password, salt, 32, (error, key) => {
      resolve(error ? Buffer.alloc(32) : key)
    })
  })
}
