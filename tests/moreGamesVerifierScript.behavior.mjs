import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  createMoreGameVerifier,
  isValidMoreGameId,
} from '../scripts/create-more-game-verifier.mjs'
import {
  parseMoreGameVerifiers,
  verifyMoreGamePassword,
} from '../server/more-games-auth.mjs'

assert.equal(isValidMoreGameId('quatro'), true)
assert.equal(isValidMoreGameId('Q'), false)
assert.equal(isValidMoreGameId('../quatro'), false)

{
  const fixturePassword = 'test-only-verifier-input'
  const generated = await createMoreGameVerifier(
    'quatro',
    fixturePassword,
    Buffer.from('ffeeddccbbaa99887766554433221100', 'hex'),
  )
  const parsed = parseMoreGameVerifiers(JSON.stringify(generated))
  assert.equal(await verifyMoreGamePassword(fixturePassword, parsed), 'quatro')
  assert.equal(await verifyMoreGamePassword('wrong-test-value', parsed), null)
  assert.equal(Object.values(generated).some((value) => value.includes(fixturePassword)), false)
}

{
  const result = spawnSync(process.execPath, [
    'scripts/create-more-game-verifier.mjs',
    '--game',
    'INVALID',
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /valid game id/i)
}

console.log('More games verifier script behavior tests passed')
