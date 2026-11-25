import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { captionAt, parseWebVtt } from '../src/lib/caption-cues';
import { cartoonTokenKey } from '../src/lib/cartoons';

const videoIds = ['z46K8WqBFnw', 'j-95UexV70k', 'Hhk4N9A0oCA', 'pMdJxVjZMRI', 'nn8YGPZdCvA', 'q4pDUxth5fQ'];

test('all six cartoons have usable timed English subtitles', () => {
  for (const id of videoIds) {
    const source = readFileSync(join(process.cwd(), 'public', 'captions', `${id}.en.vtt`), 'utf8');
    const cues = parseWebVtt(source);
    assert.ok(cues.length > 20, `${id} has too few subtitle cues`);
    assert.ok(cues.every((cue) => cue.end > cue.start && cue.text.length > 0));
    assert.ok(cues.every((cue, index) => index === 0 || cue.start >= cues[index - 1].start));
    assert.deepEqual(captionAt(cues, cues[0].start + 0.1), cues[0]);
  }
});

test('caption lookup follows playback time, including gaps and seeking', () => {
  const cues = parseWebVtt('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nFirst line\n\n00:00:04.000 --> 00:00:05.000\nSecond line\n');
  assert.equal(captionAt(cues, 0.5), null);
  assert.equal(captionAt(cues, 1.5)?.text, 'First line');
  assert.equal(captionAt(cues, 2.5), null);
  assert.equal(captionAt(cues, 4.5)?.text, 'Second line');
  assert.equal(captionAt(cues, 1.5)?.text, 'First line');
});

test('caption tokens normalize curly apostrophes for translation lookup', () => {
  assert.equal(cartoonTokenKey('it’s'), "it's");
});
