import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

const playableBlock = appSource.match(/const playableGames:[\s\S]*?\n}/)?.[0] ?? ''
const playableGames = [...playableBlock.matchAll(/:\s*'([^']+)'/g)].map((match) => match[1])
const gamesBlock = appSource.match(/const games = \[[\s\S]*?\n\]/)?.[0] ?? ''
const gameTitles = [...gamesBlock.matchAll(/(['"])(.*?)\1/g)].map((match) => match[2])

assert.equal(playableGames.at(-8), 'guoMemory', "Guo's Exclusive UNO Memory should stay before the action version")
assert.equal(playableGames.at(-7), 'guoMemoryAction', "Guo's Exclusive UNO Memory Action should stay before Triple Memory")
assert.equal(playableGames.at(-6), 'guoTripleMemory', "Guo's Exclusive UNO Triple Memory should stay before the action version")
assert.equal(playableGames.at(-5), 'guoTripleMemoryAction', "Guo's Exclusive UNO Triple Memory Action should stay before Neighbor Match")
assert.equal(playableGames.at(-4), 'guoNeighborMatch', "Guo's Exclusive Uno Neighbor Match should stay before Uno Mahjong")
assert.equal(playableGames.at(-3), 'guoUnoMahjong', "Guo's Exclusive Uno Mahjong should stay before Hi-Lo")
assert.equal(playableGames.at(-2), 'guoHiLo', "Guo's Exclusive Uno Hi-Lo should stay before Passage")
assert.equal(playableGames.at(-1), 'guoPassage', "Guo's Exclusive Uno Passage should be the last playable game")
assert.equal(gameTitles.at(-8), "Guo's Exclusive UNO Memory", "Guo's Exclusive UNO Memory should stay before the action version")
assert.equal(gameTitles.at(-7), "Guo's Exclusive UNO Memory Action", "Guo's Exclusive UNO Memory Action should stay before Triple Memory")
assert.equal(gameTitles.at(-6), "Guo's Exclusive UNO Triple Memory", "Guo's Exclusive UNO Triple Memory should stay before the action version")
assert.equal(gameTitles.at(-5), "Guo's Exclusive UNO Triple Memory Action", "Guo's Exclusive UNO Triple Memory Action should stay before Neighbor Match")
assert.equal(gameTitles.at(-4), "Guo's Exclusive Uno Neighbor Match", "Guo's Exclusive Uno Neighbor Match should stay before Uno Mahjong")
assert.equal(gameTitles.at(-3), "Guo's Exclusive Uno Mahjong", "Guo's Exclusive Uno Mahjong should stay before Hi-Lo")
assert.equal(gameTitles.at(-2), "Guo's Exclusive Uno Hi-Lo", "Guo's Exclusive Uno Hi-Lo should stay before Passage")
assert.equal(gameTitles.at(-1), "Guo's Exclusive Uno Passage", "Guo's Exclusive Uno Passage should be the last game tile")
assert.match(appSource, /exclusive-golden/, 'the Guo Memory game tile should receive the exclusive golden class')
assert.match(cssSource, /\.game-tile\.exclusive-golden/, 'exclusive golden game tile styling should exist')
assert.match(cssSource, /radial-gradient\([^)]*#fff4a8/, 'exclusive golden styling should include a bright golden shine')
assert.match(cssSource, /\.app-shell\.light-theme \.game-tile\.exclusive-golden/, 'exclusive golden tile should override the light-theme ready tile style')
assert.doesNotMatch(appSource, /state\.config\.game === 'guoMemory'[\s\S]{0,200}#fff4a8/, 'Guo Memory should not force a golden in-game table background')

console.log("Guo's Exclusive UNO Memory list test passed")
