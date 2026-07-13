import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const scene = readFileSync('src/components/mahjong/mahjongScene.ts', 'utf8')
const server = readFileSync('server/local-wifi-server.mjs', 'utf8')

assert.match(app, /:\s*'guoUnoMahjong',\s*\n\s*\d+:\s*'guoHiLo'/, "Guo's Exclusive Uno Mahjong should remain selectable before Hi-Lo")
assert.match(app, /"Guo's Exclusive Uno Mahjong"/, 'the visible title should be registered')
assert.match(app, /function isGuoExclusiveGame\(game: GameVariant\): boolean \{[\s\S]*guoUnoMahjong/, 'the selection tile should use the exclusive golden style through the shared helper')
assert.match(app, /function isMahjongGame\(game: GameVariant\): boolean \{[\s\S]*guoUnoMahjong/, 'the variant should reuse Mahjong setup and runtime paths')
assert.match(app, /tileStyle=\{config\.game === 'guoUnoMahjong' \? 'unoMahjong' : 'mahjong'\}/, 'the Mahjong renderer should switch to UNO-card faces for this variant')
assert.match(app, /isMahjongGame\(config\.game\) && \(/, 'Mahjong felt and visual controls should be available for this variant')

assert.match(scene, /function createUnoMahjongTileFaceTexture/, 'the 3D scene should include UNO Mahjong card faces')
assert.match(scene, /characters'\) return \{ color: '#df3f3f'/, 'characters/Wan should render as red UNO cards')
assert.match(scene, /tile\.suit === 'dots'\) return \{ color: '#eac64a'/, 'dots/Bing should render as yellow UNO cards')
assert.match(scene, /color: '#327dd9'/, 'bamboo/Tiao should render as blue UNO cards')
assert.match(scene, /category === 'wind'[\s\S]*color: '#2fa56a'/, 'honors should render as green UNO cards')
assert.match(scene, /wild: true/, 'flowers and seasons should render as wild-style cards')

assert.match(server, /game === 'mahjong' \|\| game === 'guoUnoMahjong'/, 'Local WiFi should force four players for both Mahjong variants')
assert.match(server, /value === 'guoUnoMahjong'/, 'Local WiFi should allow Guo Uno Mahjong rooms')

console.log("Guo's Exclusive Uno Mahjong regression tests passed")
