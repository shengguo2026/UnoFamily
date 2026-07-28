import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const css = readFileSync('src/App.css', 'utf8')
const table = readFileSync('src/components/quatro/QuatroTable.tsx', 'utf8')
const winner = readFileSync(
  'src/components/quatro/QuatroWinnerOverlay.tsx',
  'utf8',
)

for (const contract of [
  "game: 'quatro'",
  'const [quatroState, setQuatroState]',
  'const quatroStateRef = useRef<QuatroState | null>',
  'createQuatroGame',
  "config.game === 'quatro'",
  'playerCount: 2',
  'startingHandSize: 3',
  '<QuatroTable',
  'chooseQuatroAiAction',
  'dispatchQuatroAction',
]) {
  assert.equal(app.includes(contract), true, `missing App contract: ${contract}`)
}

assert.equal(
  app.includes("config.game !== 'quatro'"),
  true,
  'Quatro setup should explicitly omit classic hand-size and score controls',
)
assert.equal(
  app.includes("screen === 'table' && quatroState"),
  true,
  'Quatro should render through its dedicated state path',
)
const startGameQuatroBranch = app.slice(
  app.indexOf("function startGame()"),
  app.indexOf("if (isMahjongGame(config.game))", app.indexOf("function startGame()")),
)
assert.equal(
  startGameQuatroBranch.includes('setQuatroState(null)'),
  false,
  'Starting Quatro must not clear the state before the table renders',
)

for (const contract of [
  'animationLocked',
  'hiddenHands',
  'quatro-privacy-overlay',
  'onRevealHand',
  'visually-hidden',
  'quatroLegalColumns',
  "type: 'exchange'",
]) {
  assert.equal(table.includes(contract), true, `missing table contract: ${contract}`)
}

for (const contract of [
  'quatro-winner-overlay',
  'quatro-firework',
  'Array.from({ length: 40 }',
  'reducedMotion',
  'onOpenSetup',
  'onNewGame',
  'quatroWinnerText',
]) {
  assert.equal(winner.includes(contract), true, `missing winner contract: ${contract}`)
}

for (const selector of [
  '.quatro-table',
  '.quatro-canvas-wrap',
  '.quatro-controls',
  '.quatro-hand',
  '.quatro-legal',
  '.quatro-privacy-overlay',
  '.quatro-winner-overlay',
  '.quatro-firework',
]) {
  assert.equal(css.includes(selector), true, `missing Quatro CSS: ${selector}`)
}

for (const forbidden of ['score', 'points', 'next round', 'session target']) {
  assert.equal(
    `${table}\n${winner}`.toLowerCase().includes(forbidden),
    false,
    `Quatro UI should not mention ${forbidden}`,
  )
}

console.log('UNO Quatro integration behavior tests passed')
