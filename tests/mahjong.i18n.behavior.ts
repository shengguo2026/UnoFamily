import assert from 'node:assert/strict'
import { mahjongLogText, mahjongSelectedTileText } from '../src/game/mahjong/translation'
import { standardMahjongRuleProfile } from '../src/game/mahjong/scoring'
import type { MahjongState, MahjongTile } from '../src/game/mahjong/types'

function suitTile(suit: 'dots' | 'bamboo' | 'characters', rank: number, copy: number): MahjongTile {
  return { id: `${suit}-${rank}-${copy}`, category: 'suit', suit, rank, copy, key: `${suit}-${rank}` }
}

function selectedTileState(): MahjongState {
  return {
    players: [
      {
        id: 'p1',
        name: 'You',
        type: 'human',
        concealed: [suitTile('dots', 5, 1)],
        exposedMelds: [],
        flowers: [],
        discardRiver: [],
        score: 0,
        wind: 'east',
      },
    ],
    wall: [],
    deadWall: [],
    activePlayerIndex: 0,
    dealerIndex: 0,
    prevailingWind: 'east',
    phase: 'discard',
    claimWindow: null,
    winnerId: null,
    ruleProfile: standardMahjongRuleProfile,
    roundResult: null,
    currentRound: 1,
    log: [],
    nextLogId: 1,
  }
}

{
  const text = mahjongLogText('zh', 'You starts as dealer.')

  assert.equal(text.includes('starts as dealer'), false, 'Chinese dealer log should not fall back to English')
  assert.equal(text.includes('庄家'), true, 'Chinese dealer log should mention dealer')
}

{
  const text = mahjongLogText('de', 'Player 2 discarded dots-5.')

  assert.equal(text.includes('discarded'), false, 'German discard log should not fall back to English')
  assert.equal(text.includes('wirft'), true, 'German discard log should translate discard action')
  assert.equal(text.includes('5 Kreise'), true, 'German discard log should translate tile key')
}

{
  const text = mahjongLogText('zh', 'Nobody claimed the discard.')

  assert.equal(text.includes('Nobody claimed'), false, 'Chinese pass log should not fall back to English')
  assert.equal(text.includes('无人'), true, 'Chinese pass log should say nobody claimed')
}

{
  const text = mahjongLogText('de', 'Round 2 begins.')

  assert.equal(text, 'Runde 2 beginnt.', 'German round-start log should be translated')
}

{
  const state = selectedTileState()

  assert.equal(mahjongSelectedTileText('zh', state, 'dots-5-1'), '5筒', 'Chinese selected tile should show a Mahjong tile name')
  assert.equal(mahjongSelectedTileText('de', state, 'dots-5-1'), '5 Kreise', 'German selected tile should show a Mahjong tile name')
  assert.equal(mahjongSelectedTileText('zh', state, 'missing-tile'), 'missing-tile', 'unknown selected tile ids should stay visible for debugging')
}

console.log('Mahjong i18n behavior tests passed')
