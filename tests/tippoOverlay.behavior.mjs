import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(appSource, /tippoAnimation/, 'HardwareEventOverlay should keep Tippo animation state')
assert.match(appSource, /tippoReceiverText/, 'Tippo overlay should show which player receives the tray cards')
assert.match(appSource, /tippoLoadAfterText/, 'Tippo overlay should show both tray loads after the tip')
assert.match(appSource, /tray-one/, 'Tippo overlay should explicitly anchor tray 1 on the left')
assert.match(appSource, /tray-two/, 'Tippo overlay should explicitly anchor tray 2 on the right')
assert.match(appSource, /tipped-left/, 'Tippo overlay should distinguish a tray 1 tip')
assert.match(appSource, /tipped-right/, 'Tippo overlay should distinguish a tray 2 tip')
assert.match(cssSource, /\.tippo-scene/, 'Tippo overlay should include a balance tray animation scene')
assert.match(cssSource, /\.tippo-tray\.tray-one/, 'Tippo CSS should pin tray 1 to the left')
assert.match(cssSource, /\.tippo-tray\.tray-two/, 'Tippo CSS should pin tray 2 to the right')
assert.match(cssSource, /\.tippo-tray\.tipped-left/, 'Tippo CSS should animate tray 1 tipping left')
assert.match(cssSource, /\.tippo-tray\.tipped-right/, 'Tippo CSS should animate tray 2 tipping right')

console.log('UNO Tippo overlay wiring test passed')
