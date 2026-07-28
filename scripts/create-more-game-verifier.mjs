import { randomBytes, scrypt } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const GAME_ID_PATTERN = /^[a-z][a-z0-9-]{1,31}$/

export function isValidMoreGameId(gameId) {
  return typeof gameId === 'string' && GAME_ID_PATTERN.test(gameId)
}

export async function createMoreGameVerifier(gameId, password, suppliedSalt) {
  if (!isValidMoreGameId(gameId)) throw new Error('A valid game id is required.')
  if (typeof password !== 'string' || password.length === 0 || password.length > 256) {
    throw new Error('A non-empty password of at most 256 characters is required.')
  }

  const salt = suppliedSalt ? Buffer.from(suppliedSalt) : randomBytes(16)
  const passwordBytes = Buffer.from(password, 'utf8')
  try {
    const key = await deriveKey(passwordBytes, salt)
    return {
      [gameId]: `${salt.toString('hex')}:${key.toString('hex')}`,
    }
  } finally {
    passwordBytes.fill(0)
  }
}

export function readMaskedInput(label = 'Password: ') {
  if (!process.stdin.isTTY || !process.stdout.isTTY || typeof process.stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('A TTY terminal is required for masked password input.'))
  }

  process.stdout.write(label)
  process.stdin.setEncoding('utf8')
  process.stdin.setRawMode(true)
  process.stdin.resume()

  return new Promise((resolveInput, rejectInput) => {
    const characters = []

    const finish = (error) => {
      process.stdin.off('data', onData)
      process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdout.write('\n')
      if (error) rejectInput(error)
      else resolveInput(characters.join(''))
    }

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          finish(new Error('Password entry cancelled.'))
          return
        }
        if (character === '\r' || character === '\n') {
          finish()
          return
        }
        if (character === '\u007f' || character === '\b') {
          characters.pop()
          continue
        }
        characters.push(character)
      }
    }

    process.stdin.on('data', onData)
  })
}

function deriveKey(password, salt) {
  return new Promise((resolveKey, rejectKey) => {
    scrypt(password, salt, 32, (error, key) => {
      if (error) rejectKey(error)
      else resolveKey(key)
    })
  })
}

async function main() {
  const gameIndex = process.argv.indexOf('--game')
  const gameId = gameIndex >= 0 ? process.argv[gameIndex + 1] : ''
  if (!isValidMoreGameId(gameId)) {
    throw new Error('A valid game id must follow --game.')
  }

  const password = await readMaskedInput()
  const verifier = await createMoreGameVerifier(gameId, password)
  process.stdout.write(`Set UNO_MORE_GAMES_VERIFIERS to a JSON object containing the generated entry for game "${gameId}".\n`)
  process.stdout.write(`${JSON.stringify(verifier)}\n`)
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
if (isMainModule) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Unable to create verifier.'}\n`)
    process.exitCode = 1
  })
}
