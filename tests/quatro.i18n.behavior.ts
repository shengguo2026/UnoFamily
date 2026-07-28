import assert from 'node:assert/strict'
import {
  QUATRO_TEXT_KEYS,
  quatroActionReference,
  quatroHintText,
  quatroRuleSections,
  quatroStrategySections,
  quatroText,
} from '../src/game/quatro/translation'
import type { Language } from '../src/i18n'

const languages: Language[] = ['en', 'zh', 'de']

for (const key of QUATRO_TEXT_KEYS) {
  const values = languages.map((language) => quatroText(language, key))
  assert.equal(values.every((value) => value.trim().length > 0), true)
  assert.equal(
    new Set(values).size,
    3,
    `${key} should have distinct English, Chinese, and German text`,
  )
}

for (const language of languages) {
  const rules = quatroRuleSections(language)
  assert.equal(rules.length >= 2, true)
  assert.equal(rules.flatMap((section) => section.items).length >= 10, true)

  const actions = quatroActionReference(language)
  assert.equal(actions.length, 3)
  assert.equal(actions.every((section) => section.items.length > 0), true)

  const strategy = quatroStrategySections(language)
  assert.equal(
    strategy.flatMap((section) => section.items).length >= 6,
    true,
  )

  for (const reasonKey of [
    'hint.place:private-tile-id:3',
    'hint.swapFirst',
    'hint.swapSecond',
    'hint.emptyPush',
    'hint.exchange',
    'hint.wait',
    'hint.gameOver',
  ]) {
    const text = quatroHintText(language, {
      kind: 'place',
      tileIds: [],
      columns: [],
      reasonKey,
    })
    assert.equal(text.trim().length > 0, true)
    assert.equal(
      text.includes('private-tile-id'),
      false,
      'localized hint text must not expose internal tile IDs',
    )
  }
}

for (const section of [
  ...quatroRuleSections('zh'),
  ...quatroActionReference('zh'),
  ...quatroStrategySections('zh'),
]) {
  assert.equal(
    /[\u3400-\u9fff]/u.test(`${section.heading}${section.items.join('')}`),
    true,
  )
}

for (const englishSection of [
  ...quatroRuleSections('en'),
  ...quatroActionReference('en'),
  ...quatroStrategySections('en'),
]) {
  const germanMatches = [
    ...quatroRuleSections('de'),
    ...quatroActionReference('de'),
    ...quatroStrategySections('de'),
  ].some(
    (germanSection) =>
      germanSection.items.some((item) => englishSection.items.includes(item)),
  )
  assert.equal(germanMatches, false, 'German help must not fall back to English')
}

console.log('UNO Quatro localization behavior tests passed')
