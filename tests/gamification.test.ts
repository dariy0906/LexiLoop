import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addCalendarDays,botOutcome,computeSkill,createBot,hoursUntilNextLocalDay,levelFromXp,localDate,roundWinner,SPECTATORS,updateStreak,xpForLevel } from '../src/lib/gamification';
import { buildQuestions,isAccepted,questionForWord } from '../src/lib/gameQuestions';
import { rateLimit } from '../src/lib/rate-limit';
import type { Word } from '../src/lib/types';
const now='2026-10-29T12:00:00.000Z';
const makeWord=(id:string,word:string,ru:string):Word=>({id,user_id:'u',word,phonetic:null,definition_en:'definition of '+word,translation_ru:ru,translation_kk:null,example_sentence:'The '+word+' learner kept trying.',notes:null,category_id:null,mastery_level:Number(id)%4,favorite:false,created_at:now,updated_at:now,deleted_at:null});
const words=[makeWord('1','resilient','стойкий'),makeWord('2','curious','любопытный'),makeWord('3','patient','терпеливый'),makeWord('4','brave','смелый')];

test('level formula follows centralized progression',()=>{
  assert.equal(xpForLevel(1),0);assert.equal(xpForLevel(2),100);assert.equal(xpForLevel(3),250);assert.equal(xpForLevel(4),450);assert.equal(xpForLevel(5),700);
  assert.deepEqual(levelFromXp(449),{level:3,current:250,next:450,progress:199/200});
});
test('streak counts only unique consecutive local lesson days',()=>{
  let value=updateStreak(0,0,null,'2026-10-27');assert.equal(value.current,1);
  value=updateStreak(value.current,value.longest,value.lastDate,'2026-10-27');assert.equal(value.current,1);
  value=updateStreak(value.current,value.longest,value.lastDate,'2026-10-28');assert.equal(value.current,2);
  value=updateStreak(value.current,value.longest,value.lastDate,'2026-10-30');assert.equal(value.current,1);assert.equal(value.longest,2);
});
test('timezone local dates and preparation window cross midnight correctly',()=>{
  const at=new Date('2026-10-28T17:30:00Z');
  assert.equal(localDate('Asia/Aqtau',at),'2026-10-28');
  assert.ok(hoursUntilNextLocalDay('Asia/Aqtau',at)<2);
  assert.equal(addCalendarDays('2026-10-31',1),'2026-11-01');
});
test('question generation uses accepted answer sets and own vocabulary',()=>{
  const question=questionForWord(words[0],words,0,'synonym',()=>.3);assert(question);assert.equal(question.type,'synonym');assert.ok(isAccepted(' Joyful! ',['joyful','glad']));
  const generated=buildQuestions(words,8,['translation','definition','sentence_completion'],()=>.4);assert.equal(generated.length,8);assert.ok(generated.every((item)=>words.some((word)=>word.id===item.wordId)));
});
test('recent strong answers raise skill while poor performance changes gradually',()=>{
  const strong=computeSkill(Array.from({length:30},()=>({questionType:'translation',difficulty:'B2' as const,correct:true,responseMs:3200})),500);
  const poor=computeSkill(Array.from({length:3},()=>({questionType:'translation',difficulty:'A2' as const,correct:false,responseMs:7000})),500);
  assert.ok(strong.rating>500);assert.ok(poor.rating>400);assert.equal(strong.sampleSize,30);assert.equal(strong.calibrating,false);assert.equal(poor.calibrating,true);
});
test('adaptive bot tracks player and remains stable within snapshot',()=>{
  const profile=computeSkill(Array.from({length:25},()=>({questionType:'definition',difficulty:'B1' as const,correct:true,responseMs:4000})),500);
  const bot=createBot(profile,()=>.5);assert.ok(Math.abs(bot.rating-profile.rating)<=profile.rating*.1);assert.ok(bot.avgResponseMs>=1500&&bot.avgResponseMs<=8000);
  const easy=botOutcome(bot,'A1','definition',()=>.2),hard=botOutcome(bot,'C2','definition',()=>.2);
  assert.ok(easy.probability>hard.probability);assert.ok(easy.responseMs>=1500&&hard.responseMs<=8000);
});
test('rate limiting blocks repeated attempts until the window resets',()=>{
  const key='test-'+crypto.randomUUID();
  assert.equal(rateLimit(key,2,1000,1000).allowed,true);
  assert.equal(rateLimit(key,2,1000,1100).allowed,true);
  const denied=rateLimit(key,2,1000,1200);assert.equal(denied.allowed,false);assert.ok(denied.retryAfter>=1);
  assert.equal(rateLimit(key,2,1000,2001).allowed,true);
});
test('arena winner and spectator rules are deterministic after answers',()=>{
  assert.equal(roundWinner(true,false,5000,3000),'player');assert.equal(roundWinner(false,true,2000,5000),'opponent');
  assert.equal(roundWinner(true,true,2800,3100),'player');assert.equal(roundWinner(false,false,2000,3000),'draw');
  assert.equal(SPECTATORS.A1,10);assert.equal(SPECTATORS.C2,100);
});
