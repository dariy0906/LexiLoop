import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { parseWebVtt } from '../src/lib/caption-cues.ts';
import { contextCacheKey } from '../src/lib/context-translation.ts';

const base = process.env.LEXILOOP_TEST_URL || 'http://127.0.0.1:3000';
const email = `context-${crypto.randomUUID()}@example.test`;
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function call(path, method = 'GET', body, cookie = '') {
  const response = await fetch(`${base}/api${path}`, { method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  return { status: response.status, data, cookie: response.headers.get('set-cookie')?.split(';')[0] || '' };
}

try {
  const signup = await call('/auth/signup', 'POST', { email, password: 'Test!example123', displayName: 'Context Test' });
  assert.equal(signup.status, 200);
  const user = (await call('/auth/me', 'GET', null, signup.cookie)).data.user;
  const videoId = 'z46K8WqBFnw';
  const cues = parseWebVtt(readFileSync(`public/captions/${videoId}.en.vtt`, 'utf8'));
  const cueIndex = cues.findIndex((cue) => cue.text.toLocaleLowerCase().includes('picked up'));
  assert.ok(cueIndex > 0);
  const currentText = cues[cueIndex].text;
  const selectedStart = currentText.toLocaleLowerCase().indexOf('picked up');
  const request = { videoId, cueIndex, selectedStart, selectedEnd: selectedStart + 9, selectedText: currentText.slice(selectedStart, selectedStart + 9), currentText, previousText: cues[cueIndex - 1].text, nextText: cues[cueIndex + 1].text, sourceLanguage: 'en', targetLanguage: 'ru' };
  const cacheKey = contextCacheKey(request);
  const result = { expression: request.selectedText, expressionStart: selectedStart, expressionEnd: selectedStart + 9, translation: 'поднял', lineTranslation: 'Лев поднял мышь.', definitionEn: 'Lifted something from a surface.', sourceText: currentText, sourceLanguage: 'en', targetLanguage: 'ru' };
  await db.query('insert into cartoon_translation_cache(cache_key,result) values($1,$2) on conflict do nothing', [cacheKey, JSON.stringify(result)]);
  const translated = await call('/ai/context-translation', 'POST', request, signup.cookie);
  assert.equal(translated.status, 200, JSON.stringify(translated.data));
  assert.equal(translated.data.cached, true);
  assert.equal(translated.data.translation, 'поднял');
  assert.equal(translated.data.cacheKey, cacheKey);
  assert.equal((await call('/ai/context-translation', 'POST', { ...request, previousText: 'wrong line' }, signup.cookie)).status, 400);
  assert.notEqual(contextCacheKey({ ...request, currentText: 'another line' }), cacheKey);
  assert.notEqual(contextCacheKey({ ...request, selectedStart: selectedStart + 1 }), cacheKey);
  assert.equal((await call('/ai/context-translation', 'POST', { ...request, targetLanguage: 'kk' }, signup.cookie)).status, 400);
  assert.equal((await call('/cartoons/context-word', 'POST', { cacheKey: '0'.repeat(64), expression: 'picked up', translation: 'wrong' }, signup.cookie)).status, 404);

  const saved = await call('/cartoons/context-word', 'POST', { cacheKey }, signup.cookie);
  assert.equal(saved.status, 201, JSON.stringify(saved.data));
  assert.equal(saved.data.added, true);
  const duplicate = await call('/cartoons/context-word', 'POST', { cacheKey }, signup.cookie);
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.data.id, saved.data.id);
  const library = await call('/library', 'GET', null, signup.cookie);
  assert.equal(library.status, 200);
  const word = library.data.words.find((item) => item.id === saved.data.id);
  assert.equal(word.word, 'picked up');
  assert.equal(word.translation_ru, 'поднял');
  assert.equal(word.example_sentence, currentText);
  assert.match(word.notes, /Лев поднял мышь/);
  assert.ok(library.data.states.some((state) => state.word_id === word.id));
  const reviewed = await call('/review', 'POST', { wordId: word.id, rating: 'Good', eventId: crypto.randomUUID() }, signup.cookie);
  assert.equal(reviewed.status, 200, JSON.stringify(reviewed.data));
  assert.equal((await db.query('select count(*)::int count from review_events where user_id=$1 and word_id=$2', [user.id, word.id])).rows[0].count, 1);
  assert.equal((await db.query('select count(*)::int count from vocabulary_words where user_id=$1 and lower(word)=$2', [user.id, 'picked up'])).rows[0].count, 1);
  const lionCues = cues.map((cue, index) => ({ cue, index })).filter(({ cue }) => cue.text.toLowerCase().includes('lion') && cue.text !== currentText).slice(0, 2);
  assert.equal(lionCues.length, 2);
  const lionKeys = [];
  for (const [number, { cue: lionCue, index: lionIndex }] of lionCues.entries()) {
    const start = lionCue.text.toLowerCase().indexOf('lion');
    const context = { ...request, cueIndex: lionIndex, currentText: lionCue.text, previousText: cues[lionIndex - 1]?.text ?? null, nextText: cues[lionIndex + 1]?.text ?? null, selectedStart: start, selectedEnd: start + 4, selectedText: lionCue.text.slice(start, start + 4) };
    const key = contextCacheKey(context);
    lionKeys.push(key);
    const cachedResult = { ...result, expression: context.selectedText, expressionStart: start, expressionEnd: start + 4, translation: number ? 'царь зверей' : 'лев', sourceText: lionCue.text };
    await db.query('insert into cartoon_translation_cache(cache_key,result) values($1,$2) on conflict do nothing', [key, JSON.stringify(cachedResult)]);
    const lookedUp = await call('/ai/context-translation', 'POST', context, signup.cookie);
    assert.equal(lookedUp.status, 200);
    assert.equal(lookedUp.data.translation, cachedResult.translation);
    assert.equal((await call('/cartoons/context-word', 'POST', { cacheKey: key }, signup.cookie)).status, 201);
  }
  assert.notEqual(lionKeys[0], lionKeys[1]);
  const meanings = (await db.query('select translation_ru,example_sentence from vocabulary_words where user_id=$1 and lower(word)=$2 order by translation_ru', [user.id, 'lion'])).rows;
  assert.equal(meanings.length, 2);
  assert.notEqual(meanings[0].example_sentence, meanings[1].example_sentence);
  assert.notEqual(meanings[0].translation_ru, meanings[1].translation_ru);
  console.log('Context translation live flow passed: verified subtitle context, cache separation, contextual save, deduplication, context-specific senses, and spaced review.');
} finally {
  await db.query('delete from users where email=$1', [email]);
  await db.end();
}
