import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')

const expectedRuleDetails = [
  'The simulated drive always uses the current top card of the draw pile, never a player hand card.',
  'The revealed drive card is placed on the bottom of the draw pile before later draws can reach it.',
  'Creepy Cool never uses the draw pile; it reveals one random card from each other player',
  'Avatar State reveals exactly the top 3 cards of the draw pile; the kept card goes to your hand and the rest return to the bottom of the draw pile.',
  'Beam Me Up removes the target',
  'auto-selected strongest hand card, puts it on the bottom of the draw pile, then gives the target the current top draw-pile card as a replacement.',
  'Justice League auto-selects the revealed cards and exchange cards; the player chooses only the active color.',
  'Web Swing auto-selects both exchanged hand cards; the player chooses only the active color and opponent.',
]

for (const detail of expectedRuleDetails) {
  assert.ok(appSource.includes(detail), `Missing themed UNO rule detail: ${detail}`)
}

console.log('Themed UNO rule detail tests passed')
