import assert from 'node:assert/strict'
import { scryptSync } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import {
  createAttemptLimiter,
  parseMoreGameVerifiers,
  verifyMoreGamePassword,
} from '../server/more-games-auth.mjs'

const fixturePassword = 'test-only-more-game-secret'
const fixtureSalt = Buffer.from('00112233445566778899aabbccddeeff', 'hex')
const fixtureKey = scryptSync(fixturePassword, fixtureSalt, 32)
const verifierJson = JSON.stringify({
  quatro: `${fixtureSalt.toString('hex')}:${fixtureKey.toString('hex')}`,
})

{
  const verifiers = parseMoreGameVerifiers(verifierJson)
  assert.deepEqual(verifiers.map((entry) => entry.gameId), ['quatro'])
  assert.equal(await verifyMoreGamePassword(fixturePassword, verifiers), 'quatro')
  assert.equal(await verifyMoreGamePassword('wrong-test-value', verifiers), null)
  assert.equal(await verifyMoreGamePassword('', verifiers), null)
  assert.equal(await verifyMoreGamePassword('x'.repeat(257), verifiers), null)
}

{
  assert.deepEqual(parseMoreGameVerifiers(), [])
  assert.deepEqual(parseMoreGameVerifiers('{broken'), [])
  assert.deepEqual(parseMoreGameVerifiers('[]'), [])
  assert.deepEqual(parseMoreGameVerifiers(JSON.stringify({ Q: '00:11' })), [])
  assert.deepEqual(parseMoreGameVerifiers(JSON.stringify({ quatro: 'not-a-verifier' })), [])
}

{
  let now = 1_000
  const limiter = createAttemptLimiter({
    maxAttempts: 5,
    windowMs: 60_000,
    now: () => now,
  })

  assert.deepEqual(
    Array.from({ length: 5 }, () => limiter.allow('client-a')),
    [true, true, true, true, true],
  )
  assert.equal(limiter.allow('client-a'), false)
  assert.equal(limiter.allow('client-b'), true)

  now += 60_001
  assert.equal(limiter.allow('client-a'), true)
}

{
  const port = await reservePort()
  const child = spawn(process.execPath, ['server/local-wifi-server.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      UNO_WIFI_PORT: String(port),
      UNO_MORE_GAMES_VERIFIERS: verifierJson,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { output += chunk })
  child.stderr.on('data', (chunk) => { output += chunk })

  try {
    await waitForServer(child, port)
    const endpoint = `http://127.0.0.1:${port}/api/more-games/unlock`
    const allowedOrigin = 'http://127.0.0.1:5202'

    const success = await unlockRequest(endpoint, allowedOrigin, JSON.stringify({ password: fixturePassword }))
    assert.equal(success.status, 200)
    assert.deepEqual(success.body, { ok: true, gameId: 'quatro' })

    const wrong = await unlockRequest(endpoint, allowedOrigin, JSON.stringify({ password: 'wrong-test-value' }))
    assert.equal(wrong.status, 401)
    assert.deepEqual(wrong.body, { ok: false })

    const empty = await unlockRequest(endpoint, allowedOrigin, JSON.stringify({ password: '' }))
    assert.deepEqual(empty, { status: 401, body: { ok: false } })

    const malformed = await unlockRequest(endpoint, allowedOrigin, '{broken')
    assert.deepEqual(malformed, { status: 401, body: { ok: false } })

    const disallowed = await unlockRequest(endpoint, 'https://example.com', JSON.stringify({ password: fixturePassword }))
    assert.deepEqual(disallowed, { status: 401, body: { ok: false } })

    const oversized = await unlockRequest(endpoint, allowedOrigin, JSON.stringify({ password: 'x'.repeat(1_100) }))
    assert.deepEqual(oversized, { status: 401, body: { ok: false } })

    assert.equal(output.includes(fixturePassword), false)
    assert.equal(output.includes('wrong-test-value'), false)
  } finally {
    child.kill()
    await new Promise((resolve) => child.once('exit', resolve))
  }
}

console.log('More games access behavior tests passed')

async function reservePort() {
  const server = createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  assert(address && typeof address === 'object')
  const port = address.port
  await new Promise((resolve) => server.close(resolve))
  return port
}

async function waitForServer(child, port) {
  const deadline = Date.now() + 5_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited with ${child.exitCode}`)
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`)
      if (response.ok) return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
  }
  throw new Error('Timed out waiting for local WiFi server')
}

async function unlockRequest(endpoint, origin, body) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin,
    },
    body,
  })
  return {
    status: response.status,
    body: await response.json(),
  }
}
