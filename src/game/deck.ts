import type { AddOnPack, Card, CardFace, CardKind, UnoColor } from './types'

const COLORS: UnoColor[] = ['red', 'yellow', 'green', 'blue']
const DARK_COLORS: UnoColor[] = ['teal', 'pink', 'purple', 'orange']

let nextCardId = 1

function card(
  kind: CardKind,
  color: UnoColor | 'wild',
  label: string,
  points: number,
  pack?: AddOnPack,
  value?: number,
  spin = false,
  flexFlip = false,
  liar = false,
): Card {
  return {
    id: `c${nextCardId++}`,
    kind,
    color,
    label,
    points,
    pack,
    value,
    spin,
    flexFlip,
    liar,
  }
}

function flipCard(light: CardFace, dark: CardFace): Card {
  return {
    id: `c${nextCardId++}`,
    ...light,
    flipFaces: { light, dark },
  }
}

function addCopies(deck: Card[], count: number, make: () => Card) {
  for (let index = 0; index < count; index += 1) {
    deck.push(make())
  }
}

export function buildClassicDeck(addOns: Record<AddOnPack, boolean>): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wild', 'wild', 'Custom', 50))

  if (addOns.reverse) {
    addCopies(deck, 4, () => card('wildNoU', 'wild', 'No U', 50, 'reverse'))
    addCopies(deck, 4, () => card('reverseDraw2', COLORS[Math.floor(Math.random() * COLORS.length)], 'Rev +2', 20, 'reverse'))
    addCopies(deck, 4, () => card('reverseSkip', COLORS[Math.floor(Math.random() * COLORS.length)], 'Rev Skip', 20, 'reverse'))
    addCopies(deck, 4, () => card('wildPowerReverse', 'wild', 'Power Rev', 50, 'reverse'))
  }

  if (addOns.stack) {
    for (const color of COLORS) {
      addCopies(deck, 2, () => card('stack1', color, 'Stack +1', 20, 'stack'))
      addCopies(deck, 1, () => card('stack2', color, 'Stack +2', 20, 'stack'))
    }
    addCopies(deck, 2, () => card('wildDraw3', 'wild', '+3', 50, 'stack'))
    addCopies(deck, 2, () => card('wildDrawMystery', 'wild', '+?', 50, 'stack'))
  }

  if (addOns.speed) {
    addCopies(deck, 4, () => card('wildSpeedPlay', 'wild', 'Speed', 50, 'speed'))
    addCopies(deck, 4, () => card('wildDraw1SpeedPlay', 'wild', '+1 Speed', 50, 'speed'))
    for (const color of COLORS) {
      addCopies(deck, 1, () => card('speedMatch', color, 'Match', 20, 'speed'))
    }
    addCopies(deck, 4, () => card('wildLightningRound', 'wild', 'Lightning', 50, 'speed'))
  }

  if (addOns.swap) {
    addCopies(deck, 4, () => card('wildSwapHands', 'wild', 'Swap', 50, 'swap'))
    addCopies(deck, 4, () => card('targetedSwap', 'wild', 'Target Swap', 50, 'swap'))
    addCopies(deck, 4, () => card('passingSwap', 'wild', 'Pass Hands', 50, 'swap'))
    addCopies(deck, 4, () => card('wildDraw2Swap', 'wild', '+2 Swap', 50, 'swap'))
  }

  return deck
}

export function buildPassageDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 0))

  return deck
}

export function buildExtremeDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('hit2', color, 'Hit 2', 20))
    addCopies(deck, 2, () => card('discardAll', color, 'Discard All', 30))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildExtremeHit', 'wild', 'Extreme Hit', 50))
  addCopies(deck, 2, () => card('wildHitFire', 'wild', 'Hit-Fire', 50))
  addCopies(deck, 2, () => card('wildAllHit', 'wild', 'All Hit', 50))
  addCopies(deck, 2, () => card('tradeHands', 'wild', 'Trade', 50))

  return deck
}

export function buildFlashDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
    addCopies(deck, 1, () => card('slap', color, 'SLAP', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))

  return deck
}

export function buildSpinDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 1, () => card('number', color, String(value), value, undefined, value))
      addCopies(deck, 1, () => card('number', color, String(value), value, undefined, value, value <= 5))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))

  return deck
}

export function buildFlexDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 1, () => card('number', color, String(value), value, undefined, value))
      addCopies(deck, 1, () => card('number', color, String(value), value, undefined, value, false, value <= 6))
    }
    addCopies(deck, 2, () => card('flexSkip', color, 'Flex Skip', 20))
    addCopies(deck, 2, () => card('flexReverse', color, 'Flex Rev', 20))
    addCopies(deck, 2, () => card('flexDraw2', color, 'Flex +2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildFlexDraw2', 'wild', 'Flex +2', 50))
  addCopies(deck, 4, () => card('wildAllFlip', 'wild', 'All Flip', 50))

  return deck
}

export function buildLiarsDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0, false, false, true))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 1, () => card('number', color, String(value), value, undefined, value))
      addCopies(deck, 1, () => card('number', color, String(value), value, undefined, value, false, false, value === 7 || value % 2 === 0))
    }
    addCopies(deck, 1, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 1, () => card('skip', color, 'Skip', 20, undefined, undefined, false, false, true))
    addCopies(deck, 1, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 1, () => card('reverse', color, 'Reverse', 20, undefined, undefined, false, false, true))
    addCopies(deck, 1, () => card('draw2', color, '+2', 20))
    addCopies(deck, 1, () => card('draw2', color, '+2', 20, undefined, undefined, false, false, true))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildLiarChallenge', 'wild', 'Liar Challenge', 50))

  return deck
}

export function buildPartyDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
    addCopies(deck, 1, () => card('pointTaken', color, 'Point Taken', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 3, () => card('wildDrawnTogether', 'wild', 'Drawn Together', 50))
  addCopies(deck, 3, () => card('wildPileUp', 'wild', 'Pile Up', 50))

  return deck
}

export function buildAllWildDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  addCopies(deck, 36, () => card('wild', 'wild', 'Wild', 20))
  addCopies(deck, 8, () => card('wildReverse', 'wild', 'Wild Reverse', 30))
  addCopies(deck, 8, () => card('wildSkip', 'wild', 'Wild Skip', 30))
  addCopies(deck, 8, () => card('wildDraw2', 'wild', 'Wild +2', 30))
  addCopies(deck, 8, () => card('wildSkipTwo', 'wild', 'Wild Skip Two', 40))
  addCopies(deck, 8, () => card('wildTargetDraw2', 'wild', 'Target +2', 40))
  addCopies(deck, 8, () => card('wildForcedSwap', 'wild', 'Forced Swap', 40))
  addCopies(deck, 8, () => card('wildDraw4', 'wild', 'Wild +4', 50))

  return deck
}

export function buildCaboDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (let rank = 0; rank <= 12; rank += 1) {
    for (const color of COLORS) {
      deck.push(card('number', color, String(rank), rank, undefined, rank))
    }
  }

  return deck
}

export function buildSkyjoDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []
  addCopies(deck, 5, () => card('number', 'blue', '-2', -2, undefined, -2))
  addCopies(deck, 10, () => card('number', 'blue', '-1', -1, undefined, -1))
  addCopies(deck, 15, () => card('number', 'green', '0', 0, undefined, 0))
  for (let value = 1; value <= 12; value += 1) {
    const color: UnoColor = value <= 4 ? 'green' : value <= 8 ? 'yellow' : 'red'
    addCopies(deck, 10, () => card('number', color, String(value), value, undefined, value))
  }
  return deck
}

export function buildDosDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    for (const value of [1, 3, 4, 5]) {
      addCopies(deck, 3, () => card('number', color, String(value), value, undefined, value))
    }
    for (let value = 6; value <= 10; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('wildNumber', color, 'Wild #', 20))
  }
  addCopies(deck, 12, () => card('wildDos', 'wild', 'Wild DOS', 40, undefined, 2))

  return deck
}

export function buildPhase10Deck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    for (let value = 1; value <= 12; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value >= 10 ? 10 : 5, undefined, value))
    }
  }
  addCopies(deck, 8, () => card('wild', 'wild', 'Wild', 25))
  addCopies(deck, 4, () => card('skip', 'wild', 'Skip', 15))

  return deck
}

export function buildSkipBoDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (let value = 1; value <= 12; value += 1) {
    const color: UnoColor = value <= 3 ? 'green' : value <= 6 ? 'yellow' : value <= 9 ? 'blue' : 'red'
    addCopies(deck, 12, () => card('number', color, String(value), value, undefined, value))
  }
  addCopies(deck, 18, () => card('wild', 'wild', 'Skip-Bo', 0))

  return deck
}

export function buildChallengeDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('dare', color, 'Dare', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDare', 'wild', 'Wild Dare', 50))

  return deck
}

export function buildLordOfTheRingsDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildHuntRing', 'wild', 'Hunt for the Ring', 50))

  return deck
}

export function buildPopCultureDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wildSortingHat', 'wild', 'Sorting Hat', 50))
  addCopies(deck, 4, () => card('wildTheForce', 'wild', 'The Force', 50))
  addCopies(deck, 4, () => card('wildAvengersAssemble', 'wild', 'Avengers Assemble', 50))
  addCopies(deck, 4, () => card('wildTrexAttack', 'wild', 'T-Rex Attack', 50))

  return deck
}

export function buildMinecraftDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildCreeper', 'wild', 'Creeper', 50))

  return deck
}

export function buildSuperMarioDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildSuperStar', 'wild', 'Super Star', 50))

  return deck
}

export function buildSonicDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildVictoryLap', 'wild', 'Victory Lap', 50))

  return deck
}

export function buildBarbieDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildPlayedTooMuch', 'wild', 'Played With Too Much', 50))

  return deck
}

export function buildMastersOfTheUniverseDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildPowerOfGrayskull', 'wild', 'Power of Grayskull', 50))

  return deck
}

export function buildTmntDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildTurtlePower', 'wild', 'Turtle Power', 50))

  return deck
}

export function buildSpiderManDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildWebSwing', 'wild', 'Web Swing', 50))

  return deck
}

export function buildDcDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildJusticeLeague', 'wild', 'Justice League', 50))

  return deck
}

export function buildStarTrekDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildBeamMeUp', 'wild', 'Beam Me Up', 50))

  return deck
}

export function buildAvatarDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildAvatarState', 'wild', 'Avatar State', 50))

  return deck
}

export function buildMonsterHighDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildCreepyCool', 'wild', 'Creepy Cool', 50))

  return deck
}

export function buildNflDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildTouchdown', 'wild', 'Touchdown', 50))

  return deck
}

export function buildWildJackpotDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildJackpot', 'wild', 'Wild Jackpot', 50))

  return deck
}

export function buildBlastDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('blast', 'wild', 'Blast', 50))

  return deck
}

export function buildRobotoDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildRoboto', 'wild', 'Wild Roboto', 50))

  return deck
}

export function buildTippoDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('tippo', 'wild', 'Tippo', 50))

  return deck
}

export function buildEmojiDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []
  const emojiFaces = ['😀', '😂', '😎', '😮', '😡', '😭', '😉', '🤪']
  let emojiIndex = 0

  const emojiLabel = (value: number | string) => `${value} ${emojiFaces[emojiIndex++ % emojiFaces.length]}`
  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, emojiLabel(0), 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, emojiLabel(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, emojiLabel('Skip'), 20))
    addCopies(deck, 2, () => card('reverse', color, emojiLabel('Reverse'), 20))
    addCopies(deck, 2, () => card('draw2', color, emojiLabel('+2'), 20))
  }

  addCopies(deck, 4, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildEmoji', 'wild', `Wild Emoji ${emojiFaces[emojiIndex++ % emojiFaces.length]}`, 50))

  return deck
}

export function buildMarioKartDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []
  const itemIcon: Record<UnoColor, string> = {
    red: 'Mushroom',
    yellow: 'Banana',
    green: 'Shell',
    blue: 'Lightning',
    teal: 'Mushroom',
    pink: 'Banana',
    purple: 'Shell',
    orange: 'Lightning',
  }

  const label = (color: UnoColor, value: number | string) => `${value} ${itemIcon[color]}`
  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, label(color, 0), 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, label(color, value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, label(color, 'Skip'), 20))
    addCopies(deck, 2, () => card('reverse', color, label(color, 'Reverse'), 20))
    addCopies(deck, 2, () => card('draw2', color, label(color, '+2'), 20))
  }

  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4 Bob-omb', 50))
  addCopies(deck, 8, () => card('wildItemBox', 'wild', 'Wild Item Box', 50))
  return deck
}

export function buildDiceSet(): Card[] {
  nextCardId = 1
  return rollDiceFaces(11)
}

export function rollDiceFaces(count: number): Card[] {
  return Array.from({ length: count }, () => rollDiceFace())
}

export function rollOpeningDiceFace(): Card {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const rolled = rollDiceFace()
    if (rolled.kind === 'number') return rolled
  }
  return card('number', COLORS[Math.floor(Math.random() * COLORS.length)], '1', 1, undefined, 1)
}

function rollDiceFace(): Card {
  const face = Math.floor(Math.random() * 10)
  if (face < 5) {
    const value = face + 1
    return card('number', COLORS[Math.floor(Math.random() * COLORS.length)], String(value), value, undefined, value)
  }
  if (face < 7) return card('draw1', COLORS[Math.floor(Math.random() * COLORS.length)], '+1', 20)
  if (face < 9) return card('draw2', COLORS[Math.floor(Math.random() * COLORS.length)], '+2', 20)
  return card('wild', 'wild', 'Wild', 50)
}

export function buildNoMercyDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 2, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 4, () => card('draw2', color, '+2', 20))
    addCopies(deck, 2, () => card('draw4', color, '+4', 20))
    addCopies(deck, 2, () => card('discardAll', color, 'Discard All', 20))
    addCopies(deck, 2, () => card('skipEveryone', color, 'Skip All', 20))
  }

  addCopies(deck, 8, () => card('wild', 'wild', 'Wild', 50))
  addCopies(deck, 8, () => card('wildDraw6', 'wild', '+6', 50))
  addCopies(deck, 4, () => card('wildDraw10', 'wild', '+10', 50))
  addCopies(deck, 8, () => card('wildReverseDraw4', 'wild', 'Rev +4', 50))
  addCopies(deck, 4, () => card('wildColorRoulette', 'wild', 'Color Roulette', 50))

  return deck
}

export function buildTriplePlayDeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
    addCopies(deck, 1, () => card('triplePlayDiscardTwo', color, 'Discard Two', 30))
  }

  addCopies(deck, 4, () => card('wildDraw4', 'wild', '+4', 50))
  addCopies(deck, 4, () => card('wildClear', 'wild', 'Wild Clear', 50))
  addCopies(deck, 4, () => card('wildGiveAway', 'wild', 'Wild Give Away', 50))

  return deck
}

export function buildZeroDeck(): Card[] {
  return buildClassicDeck({
    reverse: false,
    stack: false,
    speed: false,
    swap: false,
  })
}

export function buildFlipDeck(): Card[] {
  nextCardId = 1
  const lightFaces = buildFlipLightFaces()
  const darkFaces = rotateFaces(buildFlipDarkFaces(), 37)
  return lightFaces.map((light, index) => flipCard(light, darkFaces[index]))
}

export function buildFlipExtremeDeck(): Card[] {
  nextCardId = 1
  const lightFaces = buildFlipExtremeLightFaces()
  const darkFaces = rotateFaces(buildFlipExtremeDarkFaces(), 37)
  return lightFaces.map((light, index) => flipCard(light, darkFaces[index]))
}

export function buildH2ODeck(): Card[] {
  nextCardId = 1
  const deck: Card[] = []

  for (const color of COLORS) {
    addCopies(deck, 1, () => card('number', color, '0', 0, undefined, 0))
    for (let value = 1; value <= 9; value += 1) {
      addCopies(deck, 2, () => card('number', color, String(value), value, undefined, value))
    }
    addCopies(deck, 2, () => card('skip', color, 'Skip', 20))
    addCopies(deck, 2, () => card('reverse', color, 'Reverse', 20))
    addCopies(deck, 2, () => card('draw2', color, '+2', 20))
  }

  addCopies(deck, 4, () => card('wildDownpour1', 'wild', 'Downpour +1', 50))
  addCopies(deck, 4, () => card('wildDownpour2', 'wild', 'Downpour +2', 50))

  return deck
}

function face(kind: CardKind, color: UnoColor | 'wild', label: string, points: number, value?: number): CardFace {
  return { kind, color, label, points, value }
}

function buildFlipLightFaces(): CardFace[] {
  const faces: CardFace[] = []
  for (const color of COLORS) {
    faces.push(face('number', color, '0', 0, 0))
    for (let value = 1; value <= 9; value += 1) {
      faces.push(face('number', color, String(value), value, value), face('number', color, String(value), value, value))
    }
    addFaceCopies(faces, 2, () => face('draw1', color, '+1', 10))
    addFaceCopies(faces, 2, () => face('skip', color, 'Skip', 20))
    addFaceCopies(faces, 2, () => face('reverse', color, 'Reverse', 20))
    addFaceCopies(faces, 2, () => face('flip', color, 'Flip', 20))
  }
  addFaceCopies(faces, 4, () => face('wild', 'wild', 'Wild', 40))
  addFaceCopies(faces, 4, () => face('wildDraw2', 'wild', '+2', 50))
  return faces
}

function buildFlipDarkFaces(): CardFace[] {
  const faces: CardFace[] = []
  for (const color of DARK_COLORS) {
    faces.push(face('number', color, '0', 0, 0))
    for (let value = 1; value <= 9; value += 1) {
      faces.push(face('number', color, String(value), value, value), face('number', color, String(value), value, value))
    }
    addFaceCopies(faces, 2, () => face('draw5', color, '+5', 20))
    addFaceCopies(faces, 2, () => face('skipEveryone', color, 'Skip All', 30))
    addFaceCopies(faces, 2, () => face('reverse', color, 'Reverse', 20))
    addFaceCopies(faces, 2, () => face('flip', color, 'Flip', 20))
  }
  addFaceCopies(faces, 4, () => face('wild', 'wild', 'Wild', 40))
  addFaceCopies(faces, 4, () => face('wildDrawColor', 'wild', 'Draw Color', 60))
  return faces
}

function buildFlipExtremeLightFaces(): CardFace[] {
  const faces: CardFace[] = []
  for (const color of COLORS) {
    faces.push(face('number', color, '0', 0, 0))
    for (let value = 1; value <= 9; value += 1) {
      faces.push(face('number', color, String(value), value, value), face('number', color, String(value), value, value))
    }
    addFaceCopies(faces, 2, () => face('discardAll', color, 'Discard All', 20))
    addFaceCopies(faces, 2, () => face('reverse', color, 'Reverse', 20))
    addFaceCopies(faces, 2, () => face('skip', color, 'Skip', 20))
    addFaceCopies(faces, 2, () => face('flip', color, 'Flip', 20))
  }
  addFaceCopies(faces, 4, () => face('wild', 'wild', 'Wild', 40))
  addFaceCopies(faces, 4, () => face('wildExtremeHit', 'wild', 'Launcher Attack', 50))
  return faces
}

function buildFlipExtremeDarkFaces(): CardFace[] {
  const faces: CardFace[] = []
  for (const color of DARK_COLORS) {
    faces.push(face('number', color, '0', 0, 0))
    for (let value = 1; value <= 9; value += 1) {
      faces.push(face('number', color, String(value), value, value), face('number', color, String(value), value, value))
    }
    addFaceCopies(faces, 2, () => face('reverse', color, 'Reverse', 20))
    addFaceCopies(faces, 2, () => face('skipEveryone', color, 'Skip All', 30))
    addFaceCopies(faces, 2, () => face('flip', color, 'Flip', 20))
    addFaceCopies(faces, 2, () => face('wildHitFire', 'wild', 'Extreme Hit', 60))
  }
  addFaceCopies(faces, 4, () => face('wild', 'wild', 'Wild', 40))
  addFaceCopies(faces, 4, () => face('wildHitFire', 'wild', 'Extreme Hit', 60))
  return faces
}

function addFaceCopies(faces: CardFace[], count: number, make: () => CardFace) {
  for (let index = 0; index < count; index += 1) {
    faces.push(make())
  }
}

function rotateFaces(faces: CardFace[], offset: number): CardFace[] {
  return faces.map((_, index) => faces[(index + offset) % faces.length])
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

export function colorLabel(color: UnoColor | 'wild' | null): string {
  if (!color) return 'None'
  return color[0].toUpperCase() + color.slice(1)
}
