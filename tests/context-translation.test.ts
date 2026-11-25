import assert from 'node:assert/strict';
import test from 'node:test';
import { contextCacheKey, expressionSpan, translationMessages, type TranslationContext } from '../src/lib/context-translation';

const base: TranslationContext = { videoId: 'sample', cueIndex: 1, selectedStart: 12, selectedEnd: 16, selectedText: 'blue', currentText: 'The sky is blue.', previousText: null, nextText: null, sourceLanguage: 'en', targetLanguage: 'ru' };

test('cache separates one word in different lines, positions, and languages', () => {
  const key = contextCacheKey(base);
  assert.notEqual(key, contextCacheKey({ ...base, currentText: "I'm feeling blue." }));
  assert.notEqual(key, contextCacheKey({ ...base, selectedStart: 1, selectedEnd: 5 }));
  assert.notEqual(key, contextCacheKey({ ...base, targetLanguage: 'kk' }));
  assert.notEqual(key, contextCacheKey({ ...base, previousText: 'Earlier line.' }));
});

test('an expression can expand to cover the clicked phrasal verb', () => {
  assert.deepEqual(expressionSpan('Turn down the music.', 'Turn down', 0, 4), { start: 0, end: 9 });
  assert.equal(expressionSpan('Turn down the music.', 'the music', 0, 4), null);
  assert.deepEqual(expressionSpan('She works at a bank.', 'bank', 15, 19), { start: 15, end: 19 });
});

test('translator receives selected span, full line, neighboring lines, and both languages', () => {
  const messages = translationMessages({ ...base, previousText: 'A prior line.', nextText: 'A next line.' });
  const payload = JSON.parse(messages[1].content);
  assert.equal(payload.selected, 'blue');
  assert.equal(payload.selectedStart, 12);
  assert.equal(payload.selectedEnd, 16);
  assert.equal(payload.currentText, 'The sky is blue.');
  assert.equal(payload.previousText, 'A prior line.');
  assert.equal(payload.nextText, 'A next line.');
  assert.equal(payload.sourceLanguage, 'en');
  assert.equal(payload.targetLanguage, 'ru');
});
