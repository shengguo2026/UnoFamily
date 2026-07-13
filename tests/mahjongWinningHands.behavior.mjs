import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const cssSource = readFileSync('src/App.css', 'utf8')

assert.match(appSource, /mahjongTileKeyText/, 'winning tiles should use localized Mahjong names')
assert.match(appSource, /className="modal-panel mahjong-result-modal"/, 'the Mahjong result should have room for all hands')
assert.match(appSource, /<MahjongWinningHands language=\{language\} state=\{mahjongState\} \/>/, 'win results should render every player hand')
assert.match(appSource, /function MahjongWinningHands\(/, 'the winning-hand summary should be a dedicated component')
assert.match(appSource, /state\.players\.map\(\(player\) =>/, 'the summary should include every player')
assert.match(appSource, /player\.exposedMelds\.map\(\(meld, meldIndex\) =>/, 'exposed chow, pong, and kong tiles should remain visible')
assert.match(appSource, /function mahjongWinningHandTiles\(/, 'winning hand reconstruction should be isolated')
assert.match(appSource, /sourcePlayer\?\.discardRiver\.at\(-1\)/, 'a discard win should include the claimed winning tile')
assert.match(appSource, /const revealAll = Boolean\(state\.winnerId \|\| state\.roundResult\)/, 'WiFi round-end snapshots should reveal all hands before display')

assert.match(cssSource, /\.mahjong-result-modal \{[\s\S]*max-height:/, 'the expanded result popup should remain viewport bounded')
assert.match(cssSource, /\.mahjong-winning-hands \{/, 'winning hands should have a responsive layout')
assert.match(cssSource, /\.mahjong-winning-tiles \{[\s\S]*overflow-x: auto/, 'long Mahjong hands should scroll safely on narrow screens')
assert.match(cssSource, /\.mahjong-winning-tile\.winning/, 'the claimed winning tile should be visually distinguished')

console.log('Mahjong winning-hand popup behavior tests passed')
