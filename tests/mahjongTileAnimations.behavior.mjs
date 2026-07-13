import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const cssSource = readFileSync('src/App.css', 'utf8')
const componentSource = readFileSync('src/components/mahjong/MahjongTable3D.tsx', 'utf8')
const sceneSource = readFileSync('src/components/mahjong/mahjongScene.ts', 'utf8')
const animationPath = 'src/components/mahjong/mahjongAnimations.ts'
const animationSource = existsSync(animationPath) ? readFileSync(animationPath, 'utf8') : ''
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(animationSource, /export type MahjongAnimationEventKind = 'chow' \| 'pong' \| 'kong' \| 'ready' \| 'win'/, 'claim, ready, and win events should be typed')
assert.match(animationSource, /export function deriveMahjongAnimationTransition\(/, 'state changes should drive authoritative animation transitions')
assert.match(animationSource, /export function mahjongWaitingTileKeys\(/, 'ready-state detection should be reusable and testable')
assert.match(animationSource, /drawnTileId:/, 'draw transitions should identify the newly drawn tile')
assert.match(animationSource, /discardedTileId:/, 'discard transitions should identify the newly discarded tile')
assert.match(animationSource, /claimTileIds:/, 'claim transitions should identify the exposed meld tiles')

assert.match(componentSource, /transition\?\.eventKind === 'ready'[\s\S]*transition\.playerId !== visibleViewerPlayerId/, 'opponent ready state should be filtered before rendering')
assert.match(componentSource, /reducedMotion = false/, 'the table component should support reduced motion')
assert.match(componentSource, /animationSpeed = 'normal'/, 'the table component should support configured animation speed')
assert.match(
  componentSource,
  /const initialSceneProps = latestScenePropsRef\.current\s+const transition = visibleMahjongTransition\(deriveMahjongAnimationTransition\(null, initialSceneProps\.state\), initialSceneProps\.viewerPlayerId\)[\s\S]*createMahjongScene\(\{ canvas, \.\.\.initialSceneProps, transition,/,
  'every Strict Mode controller mount should receive a fresh round-start transition',
)

assert.match(sceneSource, /effects: new THREE\.Group\(\)/, 'event callouts should use a dedicated Three.js effect layer')
assert.match(sceneSource, /function addDealerMarker\(/, 'the dealer seat should have a visible marker')
assert.match(sceneSource, /function addExposedMelds\(/, 'claimed chow, pong, and kong tiles should be rendered')
assert.match(sceneSource, /function animateMahjongScene\(/, 'the scene render loop should animate tile transitions')
assert.match(sceneSource, /type MahjongTileHighlight = 'drawn' \| 'discarded' \| 'claimed'/, 'drawn and discarded tiles should have distinct persistent highlights')
assert.match(sceneSource, /emissiveIntensity/, 'tile highlights should remain recognizable without relying only on movement')
for (const symbol of ['吃', '碰', '杠', '听牌', '胡牌']) {
  assert.ok(sceneSource.includes(symbol), `${symbol} should have a visible event callout`)
}

assert.match(appSource, /reducedMotion=\{config\.reducedMotion\}/, 'Mahjong should receive the global reduced-motion preference')
assert.match(appSource, /animationSpeed=\{config\.animationSpeed\}/, 'Mahjong should receive the global animation speed')
assert.match(appSource, /className="mahjong-win-mark"[^>]*>胡牌</, 'the round result should preserve a visible animated win callout')
assert.match(cssSource, /@keyframes mahjong-win-reveal/, 'the win surface should animate')
assert.match(cssSource, /prefers-reduced-motion: reduce[\s\S]*mahjong-win-mark/, 'system reduced motion should suppress the win flourish')
assert.match(slicesSource, /### Slice A10: Mahjong-Specific Tile Animations\s+Status: Complete/s, 'slice tracker should mark A10 complete')
assert.match(slicesSource, /Drawn and discarded tiles receive distinct highlights/, 'slice tracker should include the requested recognition highlights')

console.log('Mahjong tile animation behavior tests passed')
