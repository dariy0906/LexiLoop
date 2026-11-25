import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CARTOON_LEVELS,cartoonDuration,cartoonLevelSchema,cartoonSlugSchema,cartoonTokenKey } from '../src/lib/cartoons';
test('cartoon levels and slugs are validated',()=>{
  for(const level of CARTOON_LEVELS)assert.equal(cartoonLevelSchema.parse(level),level);
  assert.throws(()=>cartoonLevelSchema.parse('Z9'));
  assert.equal(cartoonSlugSchema.parse('the-lost-key'),'the-lost-key');
  assert.throws(()=>cartoonSlugSchema.parse('Bad_Slug'));
});
test('cartoon subtitle tokens keep useful punctuation out of lookup keys',()=>{
  assert.equal(cartoonTokenKey('Garden,'),'garden');
  assert.equal(cartoonTokenKey('well-known'),'well-known');
  assert.equal(cartoonTokenKey('friend\'s'),"friend's");
  assert.equal(cartoonTokenKey('—'),'');
  assert.equal(cartoonDuration(84),'1:24');
});
