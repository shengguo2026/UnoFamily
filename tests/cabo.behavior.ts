import assert from 'node:assert/strict'
import { caboCall, caboResolvePower, createConfig, createGame, drawOne, remapCaboGridKnowledge, zeroDiscardDrawn, zeroDrawnCardCanBeDiscarded, zeroSwapDrawnIntoGrid, zeroTakeDiscard } from '../src/game/classic'
import { buildCaboDeck } from '../src/game/deck'
import type { AddOnPack, Card, GameState, GameVariant, UnoColor } from '../src/game/types'

const addOns: Record<AddOnPack, boolean> = {
  reverse: false,
  stack: false,
  speed: false,
  swap: false,
}

function card(id: string, value: number, color: UnoColor = 'red'): Card {
  return { id, kind: 'number', color, label: String(value), points: value, value }
}

function knownBy(state: GameState, playerIndex: number, slotIndex: number): string[] {
  return state.players[playerIndex].zeroGrid?.[slotIndex].knownByPlayerIds ?? []
}

{
  const deck = buildCaboDeck()

  assert.equal(deck.length, 52, 'Cabo should use a 52-card memory deck')
  assert.equal(deck.filter((card) => card.value === 0).length, 4, 'Cabo should include four zero-point cards')
  assert.equal(deck.filter((card) => card.value === 12).length, 4, 'Cabo should include four 12-point cards')
}

{
  const state = createGame(createConfig('cabo' as GameVariant, 'hotseat', 4, 'medium', addOns))

  assert.equal(state.config.game, 'cabo')
  assert.equal(state.targetScore, 100, 'Cabo sessions should use low-score target scoring')
  assert.equal(state.players[0].hand.length, 0, 'Cabo players should not receive UNO hands')
  assert.equal(state.players[0].zeroGrid?.length, 4, 'Cabo should deal a 2x2 memory grid')
  assert.equal(state.players[0].zeroGrid?.filter((slot) => slot.card).length, 4, 'all Cabo grid slots should contain cards')
  assert.equal(state.players[0].zeroGrid?.filter((slot) => slot.knownByPlayerIds?.includes('p1')).length, 2, 'players should initially know two Cabo cards')
  assert.equal(state.players[0].zeroGrid?.filter((slot) => slot.faceUp).length, 0, 'Cabo known cards should not become public face-up cards')
  assert.equal(state.discardPile.length, 1, 'Cabo should start with one discard card')
}

{
  const state = createGame(createConfig('cabo' as GameVariant, 'wifi', 2, 'medium', addOns))
  const remapped = remapCaboGridKnowledge(state.players, { p1: 'host-client', p2: 'guest-client' })

  assert.equal(remapped[0].zeroGrid?.filter((slot) => slot.knownByPlayerIds?.includes('host-client')).length, 2, 'WiFi host should keep two known starting Cabo cards after player id remap')
  assert.equal(remapped[1].zeroGrid?.filter((slot) => slot.knownByPlayerIds?.includes('guest-client')).length, 2, 'WiFi guest should keep two known starting Cabo cards after player id remap')
  assert.equal(remapped[0].zeroGrid?.filter((slot) => slot.knownByPlayerIds?.includes('p1')).length, 0, 'temporary setup ids should not remain in Cabo knowledge after WiFi remap')
}

{
  const state = createGame(createConfig('cabo' as GameVariant, 'hotseat', 4, 'medium', addOns))
  const drawn = state.drawPile[state.drawPile.length - 1]
  const replaced = state.players[0].zeroGrid?.[2].card

  const afterDraw = drawOne(state)
  assert.equal(afterDraw.zeroTurn?.drawnCard?.id, drawn.id, 'drawing should stage a Cabo card')
  assert.equal(zeroDrawnCardCanBeDiscarded(afterDraw), true, 'any Cabo deck draw may be discarded')

  const afterSwap = zeroSwapDrawnIntoGrid(afterDraw, 2)
  assert.equal(afterSwap.players[0].zeroGrid?.[2].card?.id, drawn.id, 'the drawn card should replace the chosen grid slot')
  assert.ok(afterSwap.players[0].zeroGrid?.[2].knownByPlayerIds?.includes('p1'), 'the swapped-in card should be remembered by the player')
  assert.equal(afterSwap.discardPile[afterSwap.discardPile.length - 1]?.id, replaced?.id, 'the replaced Cabo card should move to discard')
  assert.equal(afterSwap.activePlayerIndex, 1, 'play should pass after a Cabo swap')
}

{
  const state = createGame(createConfig('cabo' as GameVariant, 'hotseat', 4, 'medium', addOns))
  const topDiscard = state.discardPile[state.discardPile.length - 1]
  const afterTake = zeroTakeDiscard(state)

  assert.equal(afterTake.zeroTurn?.drawnCard?.id, topDiscard?.id, 'Cabo can take the top discard for a swap')
  assert.equal(zeroDrawnCardCanBeDiscarded(afterTake), false, 'a taken Cabo discard must be placed into the grid')

  const afterRejectedDiscard = zeroDiscardDrawn(afterTake)
  assert.equal(afterRejectedDiscard.activePlayerIndex, 0, 'a taken discard should not be thrown away immediately')
}

{
  const state = {
    ...createGame(createConfig('cabo' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    drawPile: [card('peek-7', 7)],
    discardPile: [card('top', 3)],
  }

  const afterDiscard = zeroDiscardDrawn(drawOne(state))

  assert.equal(afterDiscard.pendingCaboPower?.kind, 'peek', 'discarding a drawn 7 or 8 should offer Peek')
  assert.equal(afterDiscard.activePlayerIndex, 0, 'Peek should resolve before the turn advances')

  const afterPeek = caboResolvePower(afterDiscard, 'p1', 3)
  assert.ok(knownBy(afterPeek, 0, 3).includes('p1'), 'Peek should let the player know one own card')
  assert.equal(afterPeek.pendingCaboPower, null, 'Peek should clear after one selected card')
  assert.equal(afterPeek.activePlayerIndex, 1, 'the turn should advance after resolving Peek')
}

{
  const state = {
    ...createGame(createConfig('cabo' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    drawPile: [card('spy-9', 9)],
    discardPile: [card('top', 3)],
  }

  const afterDiscard = zeroDiscardDrawn(drawOne(state))
  const afterSpy = caboResolvePower(afterDiscard, 'p2', 1)

  assert.equal(afterDiscard.pendingCaboPower?.kind, 'spy', 'discarding a drawn 9 or 10 should offer Spy')
  assert.ok(knownBy(afterSpy, 1, 1).includes('p1'), 'Spy should let the player know one opponent card')
  assert.equal(afterSpy.activePlayerIndex, 1, 'the turn should advance after resolving Spy')
}

{
  const state = {
    ...createGame(createConfig('cabo' as GameVariant, 'hotseat', 4, 'medium', addOns)),
    drawPile: [card('swap-11', 11)],
    discardPile: [card('top', 3)],
  }
  const p1Slot = state.players[0].zeroGrid?.[0].card
  const p2Slot = state.players[1].zeroGrid?.[1].card

  const afterDiscard = zeroDiscardDrawn(drawOne(state))
  const afterFirstPick = caboResolvePower(afterDiscard, 'p1', 0)
  const afterSwap = caboResolvePower(afterFirstPick, 'p2', 1)

  assert.equal(afterDiscard.pendingCaboPower?.kind, 'swap', 'discarding a drawn 11 or 12 should offer Swap')
  assert.equal(afterFirstPick.pendingCaboPower?.firstSlot?.playerId, 'p1', 'Swap should wait for the second selected card')
  assert.equal(afterSwap.players[0].zeroGrid?.[0].card?.id, p2Slot?.id, 'Swap should exchange the first selected card')
  assert.equal(afterSwap.players[1].zeroGrid?.[1].card?.id, p1Slot?.id, 'Swap should exchange the second selected card')
  assert.equal(afterSwap.activePlayerIndex, 1, 'the turn should advance after resolving Swap')
}

{
  const state = createGame(createConfig('cabo' as GameVariant, 'hotseat', 4, 'medium', addOns))
  const called = caboCall(state)

  assert.equal(called.caboCallerPlayerId, 'p1', 'Call Cabo should remember the caller')
  assert.equal(called.caboFinalTurnsRemaining, 3, 'all other players should get one final turn')
  assert.equal(called.activePlayerIndex, 1, 'play should pass to the next player after Call Cabo')
}

console.log('Cabo behavior tests passed')
