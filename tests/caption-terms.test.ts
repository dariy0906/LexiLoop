import assert from 'node:assert/strict';
import test from 'node:test';
import { captionSegments, captionSpans } from '../src/lib/caption-terms';

test('multiword expressions stay one tappable caption segment', () => {
  const segments = captionSegments('The lion picked up the mouse.', ['picked up']);
  assert.deepEqual(segments.find((segment) => segment.term === 'picked up'), { text: 'picked up', term: 'picked up' });
  assert.equal(segments.map((segment) => segment.text).join(''), 'The lion picked up the mouse.');
});

test('phrase matching prefers the longest expression and preserves punctuation', () => {
  const segments = captionSegments('He looked up to her, then looked up.', ['looked up', 'looked up to']);
  assert.deepEqual(segments.filter((segment) => segment.term?.includes('looked up')).map((segment) => segment.term), ['looked up to', 'looked up']);
  assert.equal(segments.map((segment) => segment.text).join(''), 'He looked up to her, then looked up.');
});

test('single caption words still work with curly apostrophes', () => {
  assert.equal(captionSegments('It’s fine.', [])[0].term, "it's");
});

test('hyphenated vocabulary remains one term', () => {
  assert.equal(captionSegments('Earth-shattering events.', [])[0].term, 'earth-shattering');
});

test('caption spans identify clicked phrase position exactly', () => {
  const phrase = captionSpans('The lion picked up the mouse.', ['picked up']).find((part) => part.term === 'picked up');
  assert.deepEqual(phrase, { text: 'picked up', term: 'picked up', start: 9, end: 18 });
});
