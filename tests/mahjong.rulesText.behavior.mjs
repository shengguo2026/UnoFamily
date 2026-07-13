import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const start = source.indexOf('function mahjongRuleSections')
const end = source.indexOf('function phase10RuleSections')

assert.notEqual(start, -1, 'Mahjong rule section function should exist')
assert.notEqual(end, -1, 'Mahjong rule section should be bounded before Phase 10 rules')

const mahjongRules = source.slice(start, end)

assert.equal(mahjongRules.includes('Examples'), true, 'English Mahjong rules should include examples')
assert.equal(mahjongRules.includes('Strategy Tips'), true, 'English Mahjong rules should include strategy tips')
assert.equal(mahjongRules.includes('two-sided waits'), true, 'English strategy should mention two-sided waits')

assert.equal(mahjongRules.includes('例子'), true, 'Chinese Mahjong rules should include examples')
assert.equal(mahjongRules.includes('策略提示'), true, 'Chinese Mahjong rules should include strategy tips')
assert.equal(mahjongRules.includes('两面听'), true, 'Chinese strategy should mention two-sided waits')

assert.equal(mahjongRules.includes('Beispiele'), true, 'German Mahjong rules should include examples')
assert.equal(mahjongRules.includes('Strategietipps'), true, 'German Mahjong rules should include strategy tips')
assert.equal(mahjongRules.includes('beidseitige Warten'), true, 'German strategy should mention two-sided waits')

console.log('Mahjong rules text behavior test passed')
