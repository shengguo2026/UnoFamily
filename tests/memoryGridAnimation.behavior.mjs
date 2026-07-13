import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const canvasSource = readFileSync('src/components/GameCanvas.tsx', 'utf8')
const slicesSource = readFileSync('current_implementation_slices.md', 'utf8')

assert.match(canvasSource, /interface MemoryGridStartAnimation/, 'GameCanvas should keep memory grid-start metadata')
assert.match(canvasSource, /interface MemoryRevealAnimation/, 'GameCanvas should keep memory reveal metadata')
assert.match(canvasSource, /interface MemoryCollectionAnimation/, 'GameCanvas should keep memory collection metadata')
assert.match(canvasSource, /memoryGridStartAnimationDurationMs\(cardCount: number\)/, 'memory grid fill should scale for board size')
assert.match(canvasSource, /detectMemoryGridStartAnimation\(/, 'memory boards should detect a new-round grid fill')
assert.match(canvasSource, /detectMemoryRevealAnimation\(/, 'memory boards should detect selected-card reveals')
assert.match(canvasSource, /detectMemoryCollectionAnimation\(/, 'memory boards should detect collected matches')
assert.match(canvasSource, /onBlockingAnimationChange\?\.\('memoryGridStart'\)/, 'memory grid fill should raise the shared animation lock')
assert.match(canvasSource, /onBlockingAnimationChange\?\.\('memoryCollection'\)/, 'match collection should raise the shared animation lock')
assert.match(canvasSource, /drawMemoryGridStartAnimation\(/, 'GameCanvas should render the grid-fill intro')
assert.match(canvasSource, /drawMemoryRevealAnimation\(/, 'GameCanvas should render selected-card flips')
assert.match(canvasSource, /drawMemoryCollectionAnimation\(/, 'GameCanvas should render collection flights')
assert.match(canvasSource, /!state\.memoryActionEvent/, 'existing memory action-card interaction guard should remain in place')
assert.match(slicesSource, /### Slice A9: Memory Grid Start And Collection Animations\s+Status: Complete/s, 'slice tracker should mark A9 complete')

console.log('Memory grid animation behavior tests passed')
