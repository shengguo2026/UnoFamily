import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

test('repository metadata is ready for public distribution', () => {
  for (const path of ['.gitattributes', 'LICENSE', 'NOTICE']) {
    assert.equal(existsSync(new URL(path, root)), true, `${path} must exist`)
  }

  const ignore = read('.gitignore')
  for (const pattern of ['.npm-cache/', '.tmp-tests/', '.env.*', '*.zip', '.agents/']) {
    assert.match(ignore, new RegExp(escapeRegExp(pattern)))
  }

  const attributes = read('.gitattributes')
  assert.match(attributes, /\*\.sh text eol=lf/)
  assert.match(attributes, /\*\.command text eol=lf/)
  assert.match(attributes, /tests\/ export-ignore/)

  assert.match(read('LICENSE'), /Apache License\s+Version 2\.0/)
  const notice = read('NOTICE')
  assert.match(notice, /Copyright 2026 Guo Sheng/)
  assert.match(notice, /https:\/\/github\.com\/shengguo2026\/UnoFamily/)

  const packageJson = JSON.parse(read('package.json'))
  assert.equal(packageJson.version, '0.1.0')
})

test('launchers provide automatic first-run setup', () => {
  assert.equal(existsSync(new URL('start.command', root)), true)
  for (const path of ['start.bat', 'start.sh']) {
    const launcher = read(path)
    assert.match(launcher, /npm ci/)
    assert.match(launcher, /node_modules/)
    assert.match(launcher, /5202/)
    assert.match(launcher, /5203/)
  }
  assert.match(read('start.command'), /start\.sh/)
})

test('README documents release and source workflows', () => {
  const readme = read('README.md')
  for (const text of [
    'UnoFamily',
    'Download and run',
    'Node.js',
    'start.bat',
    'start.command',
    'start.sh',
    'npm ci',
    'npm run build',
    '5202',
    '5203',
    'Apache License 2.0',
  ]) {
    assert.match(readme, new RegExp(escapeRegExp(text), 'i'))
  }
})
