import assert from 'node:assert/strict';
import test from 'node:test';
import { unlocks } from '../src/lib/unlocks';

test('Wordly requires both five completed lessons and ten saved words', () => {
  assert.equal(unlocks({ completedLessons: 5, vocabularyWords: 9, level: 20 }).wordly, false);
  assert.equal(unlocks({ completedLessons: 4, vocabularyWords: 10, level: 20 }).wordly, false);
  assert.equal(unlocks({ completedLessons: 5, vocabularyWords: 10, level: 1 }).wordly, true);
});

test('Account-specific grants open modes without changing progress', () => {
  const progress = { completedLessons: 1, vocabularyWords: 16, level: 2 };
  assert.deepEqual(unlocks(progress, { wordly: true, arena: true }), { progress, wordly: true, arena: true });
  assert.equal(unlocks(progress).wordly, false);
  assert.equal(unlocks(progress).arena, false);
});

test('Arena requires both level twenty and twenty-five saved words', () => {
  assert.equal(unlocks({ completedLessons: 5, vocabularyWords: 25, level: 19 }).arena, false);
  assert.equal(unlocks({ completedLessons: 5, vocabularyWords: 24, level: 20 }).arena, false);
  assert.equal(unlocks({ completedLessons: 5, vocabularyWords: 25, level: 20 }).arena, true);
});
